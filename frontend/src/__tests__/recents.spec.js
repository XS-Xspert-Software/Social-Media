import { describe, it, expect, vi, beforeEach, afterEach, afterAll } from 'vitest';
import {
  getUserId,
  normalizeUser,
  fetchRecentChats,
  loadRecentChats,
  updateRecentChat,
  getTotalUnreadCount,
  cleanup
} from '../recents.js';

const originalFetch = global.fetch;
const nowSpy = vi.spyOn(Date, 'now');

describe('recents utilities', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    global.fetch = vi.fn();
    nowSpy.mockReturnValue(0);
  });

  afterEach(async () => {
    await cleanup();
    vi.clearAllTimers();
    vi.useRealTimers();
    global.fetch = originalFetch;
  });

  afterAll(() => {
    nowSpy.mockRestore();
  });

  it('normalizes users with sensible defaults', () => {
    const user = normalizeUser({ id: '9', username: 'neo' });
    expect(user).toMatchObject({ userId: '9', id: '9', username: 'neo', unreadCount: 0 });
  });

  it('fetches and caches recent chats', async () => {
    global.fetch.mockResolvedValue({
      ok: true,
      json: async () => ({ recentChats: [{ id: '1', username: 'alice' }] })
    });

    const first = await fetchRecentChats('user-1');
    expect(first[0].username).toBe('alice');

    global.fetch.mockRejectedValue(new Error('network'));
    const cached = await loadRecentChats('user-1');
    expect(cached[0].username).toBe('alice');
  });

  it('updates cache entries and schedules batch update', async () => {
    global.fetch.mockResolvedValue({
      ok: true,
      json: async () => ({ recentChats: [{ id: '2', username: 'bob', unreadCount: 1 }] })
    });
    await fetchRecentChats('user-2');

    updateRecentChat('user-2', { id: '2', username: 'bob', unreadCount: 3 });
    const cached = await loadRecentChats('user-2');
    expect(cached[0].unreadCount).toBe(3);

    vi.runAllTimers();
  });

  it('returns unread counts even when API fails', async () => {
    global.fetch.mockResolvedValue({
      ok: true,
      json: async () => ({ recentChats: [{ id: '3', username: 'cass', unreadCount: 4 }] })
    });
    await fetchRecentChats('user-3');

    global.fetch.mockResolvedValue({ ok: false });
    const count = await getTotalUnreadCount('user-3');
    expect(count).toBe(4);
  });

  it('ignores null users when normalizing', () => {
    expect(getUserId(null)).toBeNull();
    expect(normalizeUser(null)).toBeNull();
  });
});
