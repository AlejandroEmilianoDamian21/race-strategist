import { TtlCache } from './ttl-cache.js';

describe('TtlCache', () => {
  it('returns the cached value within the TTL', async () => {
    const cache = new TtlCache(1000, () => 0);
    const loader = vi.fn().mockResolvedValue('value');

    await cache.getOrLoad('key', loader);
    const second = await cache.getOrLoad('key', loader);

    expect(second).toBe('value');
    expect(loader).toHaveBeenCalledTimes(1);
  });

  it('reloads after the TTL has elapsed', async () => {
    let now = 0;
    const cache = new TtlCache(1000, () => now);
    const loader = vi
      .fn()
      .mockResolvedValueOnce('old')
      .mockResolvedValueOnce('new');

    await cache.getOrLoad('key', loader);
    now = 1001;
    const reloaded = await cache.getOrLoad('key', loader);

    expect(reloaded).toBe('new');
    expect(loader).toHaveBeenCalledTimes(2);
  });

  it('shares one loader call between concurrent requests', async () => {
    const cache = new TtlCache(1000, () => 0);
    const loader = vi.fn().mockResolvedValue('value');

    const results = await Promise.all([
      cache.getOrLoad('key', loader),
      cache.getOrLoad('key', loader),
      cache.getOrLoad('key', loader),
    ]);

    expect(results).toEqual(['value', 'value', 'value']);
    expect(loader).toHaveBeenCalledTimes(1);
  });

  it('does not cache a rejected loader', async () => {
    const cache = new TtlCache(1000, () => 0);
    const loader = vi
      .fn()
      .mockRejectedValueOnce(new Error('boom'))
      .mockResolvedValueOnce('recovered');

    await expect(cache.getOrLoad('key', loader)).rejects.toThrow('boom');
    const retried = await cache.getOrLoad('key', loader);

    expect(retried).toBe('recovered');
    expect(loader).toHaveBeenCalledTimes(2);
  });

  it('forgets every entry on clear', async () => {
    const cache = new TtlCache(1000, () => 0);
    const loader = vi.fn().mockResolvedValue('value');

    await cache.getOrLoad('key', loader);
    cache.clear();
    await cache.getOrLoad('key', loader);

    expect(loader).toHaveBeenCalledTimes(2);
  });
});
