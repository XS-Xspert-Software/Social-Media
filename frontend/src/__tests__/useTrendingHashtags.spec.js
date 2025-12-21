import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { useTrendingHashtags } from '../useTrendingHashtags.js';

const originalFetch = global.fetch;

describe('useTrendingHashtags', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    global.fetch = originalFetch;
  });

  it('fetches trending hashtags on demand', async () => {
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ trending_hashtags: [{ tag: '#vue', count: 5 }] })
    });

    const { trendingHashtags, fetchTrending, loading, error } = useTrendingHashtags(12, 10);
    await fetchTrending();

    expect(global.fetch).toHaveBeenCalled();
    expect(trendingHashtags.value[0]).toEqual({ tag: '#vue', count: 5 });
    expect(loading.value).toBe(false);
    expect(error.value).toBeNull();
  });

  it('captures fetch errors', async () => {
    global.fetch = vi.fn().mockResolvedValue({ ok: false });

    const { fetchTrending, error, loading } = useTrendingHashtags();
    await fetchTrending();

    expect(error.value).toBe('Failed to load trending hashtags');
    expect(loading.value).toBe(false);
  });
});
