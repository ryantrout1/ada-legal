import { describe, it, expect } from 'vitest';

describe('build pipeline smoke', () => {
  it('vitest runs', () => {
    expect(true).toBe(true);
  });

  it('resolves the @ alias', async () => {
    // Imports from @/ must work for the engine code in later phases.
    // This test will be replaced by real alias-using tests once engine code exists.
    const { default: App } = await import('@/app/App');
    expect(typeof App).toBe('function');
  });
});
