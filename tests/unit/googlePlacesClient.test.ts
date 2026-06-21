/**
 * Tests for GooglePlacesClient (v1a business-address standardization).
 *
 * fetch is stubbed; we assert the request shape (endpoint, key header,
 * field mask, query) and the normalization of a Places API (New)
 * searchText response into a ResolvedBusinessAddress. Also covers
 * no-match (null), incomplete match (null), 4xx (throws, no retry), and
 * 5xx-then-200 (retries, resolves).
 */

import { describe, it, expect, vi, afterEach } from 'vitest';
import { GooglePlacesClient } from '@/engine/clients/googlePlacesClient';

const KEY = 'test-maps-key';

function res(status: number, body: unknown) {
  return {
    ok: status >= 200 && status < 300,
    status,
    json: async () => body,
  } as unknown as Response;
}

const MATCH = {
  places: [
    {
      id: 'ChIJ_test_place_id',
      formattedAddress: '123 E Main St, Phoenix, AZ 85004, USA',
      displayName: { text: "Joe's Diner" },
      addressComponents: [
        { longText: '123', shortText: '123', types: ['street_number'] },
        {
          longText: 'East Main Street',
          shortText: 'E Main St',
          types: ['route'],
        },
        {
          longText: 'Phoenix',
          shortText: 'Phoenix',
          types: ['locality', 'political'],
        },
        {
          longText: 'Arizona',
          shortText: 'AZ',
          types: ['administrative_area_level_1', 'political'],
        },
        { longText: '85004', shortText: '85004', types: ['postal_code'] },
      ],
    },
  ],
};

afterEach(() => {
  vi.unstubAllGlobals();
});

describe('GooglePlacesClient.resolveBusinessAddress', () => {
  it('normalizes a Places match into a structured address', async () => {
    const fetchMock = vi.fn().mockResolvedValue(res(200, MATCH));
    vi.stubGlobal('fetch', fetchMock);

    const client = new GooglePlacesClient(KEY);
    const out = await client.resolveBusinessAddress({
      businessName: "Joe's Diner",
      street: null,
      city: 'Phoenix',
      state: 'AZ',
    });

    expect(out).not.toBeNull();
    expect(out!.street).toBe('123 East Main Street');
    expect(out!.city).toBe('Phoenix');
    expect(out!.state).toBe('AZ');
    expect(out!.postalCode).toBe('85004');
    expect(out!.placeId).toBe('ChIJ_test_place_id');
    expect(out!.businessName).toBe("Joe's Diner");
    expect(out!.formattedAddress).toBe('123 E Main St, Phoenix, AZ 85004, USA');
  });

  it('sends the key header, field mask, and a composed text query', async () => {
    const fetchMock = vi.fn().mockResolvedValue(res(200, MATCH));
    vi.stubGlobal('fetch', fetchMock);

    const client = new GooglePlacesClient(KEY);
    await client.resolveBusinessAddress({
      businessName: "Joe's Diner",
      street: '123 Main',
      city: 'Phoenix',
      state: 'AZ',
    });

    expect(fetchMock).toHaveBeenCalledTimes(1);
    const [url, init] = fetchMock.mock.calls[0];
    expect(String(url)).toContain('places:searchText');
    expect(init.headers['X-Goog-Api-Key']).toBe(KEY);
    expect(init.headers['X-Goog-FieldMask']).toContain('addressComponents');
    const body = JSON.parse(init.body);
    expect(body.textQuery).toBe("Joe's Diner, 123 Main, Phoenix, AZ");
  });

  it('returns null when there are no matches', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(res(200, { places: [] })));
    const client = new GooglePlacesClient(KEY);
    const out = await client.resolveBusinessAddress({
      businessName: 'Nowhere LLC',
      street: null,
      city: null,
      state: null,
    });
    expect(out).toBeNull();
  });

  it('returns null when the match lacks a usable address', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue(res(200, { places: [{ id: 'x' }] })),
    );
    const client = new GooglePlacesClient(KEY);
    const out = await client.resolveBusinessAddress({
      businessName: "Joe's Diner",
      street: null,
      city: 'Phoenix',
      state: 'AZ',
    });
    expect(out).toBeNull();
  });

  it('throws on 4xx without retrying', async () => {
    const fetchMock = vi.fn().mockResolvedValue(res(403, { error: 'denied' }));
    vi.stubGlobal('fetch', fetchMock);
    const client = new GooglePlacesClient(KEY);
    await expect(
      client.resolveBusinessAddress({
        businessName: "Joe's Diner",
        street: null,
        city: 'Phoenix',
        state: 'AZ',
      }),
    ).rejects.toThrow(/403/);
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it('retries once on 5xx and resolves', async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce(res(503, {}))
      .mockResolvedValueOnce(res(200, MATCH));
    vi.stubGlobal('fetch', fetchMock);
    const client = new GooglePlacesClient(KEY);
    const out = await client.resolveBusinessAddress({
      businessName: "Joe's Diner",
      street: null,
      city: 'Phoenix',
      state: 'AZ',
    });
    expect(fetchMock).toHaveBeenCalledTimes(2);
    expect(out!.placeId).toBe('ChIJ_test_place_id');
  });
});
