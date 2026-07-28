import { describe, it, expect } from 'vitest';

describe('build pipeline smoke', () => {
  it('vitest runs', () => {
    expect(true).toBe(true);
  });

  /**
   * Importing App pulls in the whole route tree, so this takes about four
   * seconds on its own and longer under parallel load — which is where it
   * used to trip the default timeout and report as a failure. Nothing was
   * wrong; it just needed longer than it was given.
   *
   * A test that fails on a busy machine and passes on a quiet one teaches
   * people to re-run rather than look, and that habit is how the attorney
   * filter regression sat unnoticed for a month behind two other red
   * lines. Given a timeout that matches what it actually does, red means
   * something again.
   */
  it('resolves the @ alias', async () => {
    const { default: App } = await import('@/app/App');
    expect(typeof App).toBe('function');
  }, 30_000);
});
