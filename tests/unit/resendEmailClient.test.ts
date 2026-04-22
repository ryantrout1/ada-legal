/**
 * Tests for ResendEmailClient + StubResendEmailClient.
 *
 * We mock global fetch. Each test sets up a deterministic response
 * shape and asserts what the client does with it. Covers:
 *   - Happy path (200 with id)
 *   - 4xx rejection (no retry; error surfaces)
 *   - 5xx retry (one retry, then error)
 *   - Network error retry
 *   - Missing id in 200 response
 *   - Request shape (headers, body)
 *
 * Ref: Step 24, Commit 2.
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import {
  ResendEmailClient,
  StubResendEmailClient,
} from '@/engine/clients/resendEmailClient';

const API_KEY = 're_test_1234567890';
const FROM = 'Ada <ada@adalegallink.example>';

function mockOk(id = 'email_abc123'): Response {
  return new Response(JSON.stringify({ id }), {
    status: 200,
    headers: { 'Content-Type': 'application/json' },
  });
}

function mockStatus(status: number, body = ''): Response {
  return new Response(body, {
    status,
    headers: { 'Content-Type': 'text/plain' },
  });
}

describe('ResendEmailClient', () => {
  const originalFetch = globalThis.fetch;
  let fetchMock: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    fetchMock = vi.fn();
    globalThis.fetch = fetchMock as unknown as typeof fetch;
  });

  afterEach(() => {
    globalThis.fetch = originalFetch;
  });

  it('happy path: returns id on 200', async () => {
    fetchMock.mockResolvedValueOnce(mockOk('email_abc123'));
    const c = new ResendEmailClient(API_KEY, FROM);
    const res = await c.send({
      to: 'to@example.com',
      subject: 'Subj',
      html: '<p>hi</p>',
    });
    expect(res.id).toBe('email_abc123');
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it('sends the expected headers', async () => {
    fetchMock.mockResolvedValueOnce(mockOk());
    const c = new ResendEmailClient(API_KEY, FROM);
    await c.send({
      to: 'to@example.com',
      subject: 'Subj',
      html: '<p>hi</p>',
    });
    const [, init] = fetchMock.mock.calls[0]!;
    expect(init.headers['Authorization']).toBe(`Bearer ${API_KEY}`);
    expect(init.headers['Content-Type']).toBe('application/json');
    expect(init.method).toBe('POST');
  });

  it('sends to the correct endpoint', async () => {
    fetchMock.mockResolvedValueOnce(mockOk());
    const c = new ResendEmailClient(API_KEY, FROM);
    await c.send({
      to: 'to@example.com',
      subject: 'Subj',
      html: '<p>hi</p>',
    });
    const [url] = fetchMock.mock.calls[0]!;
    expect(url).toBe('https://api.resend.com/emails');
  });

  it('request body includes from, to, subject, html', async () => {
    fetchMock.mockResolvedValueOnce(mockOk());
    const c = new ResendEmailClient(API_KEY, FROM);
    await c.send({
      to: 'to@example.com',
      subject: 'Hello',
      html: '<p>hi</p>',
    });
    const [, init] = fetchMock.mock.calls[0]!;
    const body = JSON.parse(init.body as string);
    expect(body.from).toBe(FROM);
    expect(body.to).toEqual(['to@example.com']);
    expect(body.subject).toBe('Hello');
    expect(body.html).toBe('<p>hi</p>');
  });

  it('includes text when provided', async () => {
    fetchMock.mockResolvedValueOnce(mockOk());
    const c = new ResendEmailClient(API_KEY, FROM);
    await c.send({
      to: 'to@example.com',
      subject: 'Subj',
      html: '<p>hi</p>',
      text: 'hi',
    });
    const [, init] = fetchMock.mock.calls[0]!;
    const body = JSON.parse(init.body as string);
    expect(body.text).toBe('hi');
  });

  it('maps replyTo → reply_to in body', async () => {
    fetchMock.mockResolvedValueOnce(mockOk());
    const c = new ResendEmailClient(API_KEY, FROM);
    await c.send({
      to: 'to@example.com',
      subject: 'Subj',
      html: '<p>hi</p>',
      replyTo: 'reply@example.com',
    });
    const [, init] = fetchMock.mock.calls[0]!;
    const body = JSON.parse(init.body as string);
    expect(body.reply_to).toBe('reply@example.com');
  });

  it('omits text when not provided', async () => {
    fetchMock.mockResolvedValueOnce(mockOk());
    const c = new ResendEmailClient(API_KEY, FROM);
    await c.send({
      to: 'to@example.com',
      subject: 'Subj',
      html: '<p>hi</p>',
    });
    const [, init] = fetchMock.mock.calls[0]!;
    const body = JSON.parse(init.body as string);
    expect(body).not.toHaveProperty('text');
  });

  it('4xx: does NOT retry, throws with status + body excerpt', async () => {
    fetchMock
      .mockResolvedValueOnce(mockStatus(401, 'Invalid API key'))
      .mockResolvedValueOnce(mockStatus(401, 'Invalid API key'));
    const c = new ResendEmailClient(API_KEY, FROM);
    await expect(
      c.send({ to: 'to@example.com', subject: 'S', html: '<p/>' }),
    ).rejects.toThrow(/Resend 401/);
    await expect(
      c.send({ to: 'to@example.com', subject: 'S', html: '<p/>' }),
    ).rejects.toThrow(/Invalid API key/);
  });

  it('4xx: exactly one fetch attempt', async () => {
    fetchMock.mockResolvedValueOnce(mockStatus(422, 'bad address'));
    const c = new ResendEmailClient(API_KEY, FROM);
    await c
      .send({ to: 'to@example.com', subject: 'S', html: '<p/>' })
      .catch(() => {});
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it('5xx: retries once, then throws', async () => {
    fetchMock
      .mockResolvedValueOnce(mockStatus(503))
      .mockResolvedValueOnce(mockStatus(503));
    const c = new ResendEmailClient(API_KEY, FROM);
    await expect(
      c.send({ to: 'to@example.com', subject: 'S', html: '<p/>' }),
    ).rejects.toThrow(/Resend 503/);
    expect(fetchMock).toHaveBeenCalledTimes(2);
  });

  it('5xx then 200: succeeds on retry', async () => {
    fetchMock
      .mockResolvedValueOnce(mockStatus(500))
      .mockResolvedValueOnce(mockOk('email_retry'));
    const c = new ResendEmailClient(API_KEY, FROM);
    const res = await c.send({
      to: 'to@example.com',
      subject: 'S',
      html: '<p/>',
    });
    expect(res.id).toBe('email_retry');
    expect(fetchMock).toHaveBeenCalledTimes(2);
  });

  it('network error: retries once, then throws', async () => {
    fetchMock
      .mockRejectedValueOnce(new Error('ECONNRESET'))
      .mockRejectedValueOnce(new Error('ECONNRESET'));
    const c = new ResendEmailClient(API_KEY, FROM);
    await expect(
      c.send({ to: 'to@example.com', subject: 'S', html: '<p/>' }),
    ).rejects.toThrow(/ECONNRESET/);
    expect(fetchMock).toHaveBeenCalledTimes(2);
  });

  it('network error then 200: succeeds on retry', async () => {
    fetchMock
      .mockRejectedValueOnce(new Error('network blip'))
      .mockResolvedValueOnce(mockOk('email_retry'));
    const c = new ResendEmailClient(API_KEY, FROM);
    const res = await c.send({
      to: 'to@example.com',
      subject: 'S',
      html: '<p/>',
    });
    expect(res.id).toBe('email_retry');
    expect(fetchMock).toHaveBeenCalledTimes(2);
  });

  it('200 but missing id field: throws (and does retry on the retry, then surfaces)', async () => {
    fetchMock
      .mockResolvedValueOnce(
        new Response(JSON.stringify({}), { status: 200 }),
      )
      .mockResolvedValueOnce(
        new Response(JSON.stringify({}), { status: 200 }),
      );
    const c = new ResendEmailClient(API_KEY, FROM);
    await expect(
      c.send({ to: 'to@example.com', subject: 'S', html: '<p/>' }),
    ).rejects.toThrow(/missing id field/);
  });
});

describe('StubResendEmailClient', () => {
  it('throws a configuration error with clear instruction', async () => {
    const stub = new StubResendEmailClient();
    await expect(
      stub.send({ to: 'x@example.com', subject: 's', html: '<p/>' }),
    ).rejects.toThrow(/RESEND_API_KEY is not configured/);
  });
});
