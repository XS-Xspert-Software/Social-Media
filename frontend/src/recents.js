const API_ENDPOINT = 'https://recent-six.vercel.app/api/recent';
const CACHE_DURATION = 30_000;
const BATCH_DELAY = 2_000;
const SESSION_CACHE_DURATION = 3_600_000;

let cache = { data: null, timestamp: null, userId: null };
let pendingUpdates = new Map();
let updateTimeout = null;

const now = () => Date.now();
const isCacheValid = (userId) => cache.data && cache.userId === userId && now() - cache.timestamp < CACHE_DURATION;

export const getUserId = (user) => user?.userId || user?.id || null;

export const normalizeUser = (user) => {
  const userId = getUserId(user);
  return userId ? {
    userId, id: userId,
    username: user.username || `User ${userId}`,
    profile_picture: user.profile_picture || user.profilePicture || 'default-pfp.jpg',
    lastMessage: user.lastMessage || 'Tap to start chatting',
    lastSeen: user.lastSeen || new Date().toISOString(),
    unreadCount: user.unreadCount || 0,
    isOnline: user.isOnline || false,
  } : null;
};

const apiRequest = async (method = 'GET', body = null, params = '') => {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 10000);
  try {
    const response = await fetch(`${API_ENDPOINT}${params}`, {
      method, headers: { 'Content-Type': 'application/json' },
      signal: controller.signal, ...(body && { body: JSON.stringify(body) })
    });
    clearTimeout(timeoutId);
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    return await response.json();
  } catch (error) {
    clearTimeout(timeoutId);
    throw error.name === 'AbortError' ? new Error('Timeout') : error;
  }
};

const updateCache = (userId, data) => cache = { data: Array.isArray(data) ? [...data] : [], timestamp: now(), userId };
const clearCache = (userId = null) => (!userId || cache.userId === userId) && (cache = { data: null, timestamp: null, userId: null });

export const fetchRecentChats = async (userId) => {
  if (!userId) return [];
  try {
    const { recentChats = [] } = await apiRequest('GET', null, `?userId=${userId}&action=get`);
    updateCache(userId, recentChats);
    return recentChats;
  } catch { return isCacheValid(userId) ? cache.data : []; }
};

export const loadRecentChats = async (userId) => !userId ? [] : isCacheValid(userId) ? cache.data : await fetchRecentChats(userId);

export const refreshRecentChats = async (userId) => (clearCache(userId), await fetchRecentChats(userId));

export const getTotalUnreadCount = async (userId) => {
  if (!userId) return 0;
  try {
    const { totalUnreadCount = 0 } = await apiRequest('GET', null, `?userId=${userId}&action=unreadCount`);
    return totalUnreadCount;
  } catch {
    if (isCacheValid(userId) && Array.isArray(cache.data)) {
      return cache.data.reduce((total, chat) => total + (chat.unreadCount || 0), 0);
    }
    try {
      const chats = await fetchRecentChats(userId);
      return chats.reduce((total, chat) => total + (chat.unreadCount || 0), 0);
    } catch { return 0; }
  }
};

const scheduleBatchUpdate = () => {
  clearTimeout(updateTimeout);
  updateTimeout = setTimeout(async () => {
    if (!pendingUpdates.size) return;
    const updates = Array.from(pendingUpdates.values());
    const affectedUserIds = [...new Set(updates.map(u => u.userId))];
    pendingUpdates.clear();
    updateTimeout = null;
    try {
      await apiRequest('POST', { action: 'batchUpdate', updates });
      affectedUserIds.forEach(clearCache);
    } catch {}
  }, BATCH_DELAY);
};

export const updateRecentChat = (userId, chatData) => {
  if (!userId || !chatData) return;
  const normalized = normalizeUser(chatData);
  if (!normalized) return;
  pendingUpdates.set(`${userId}-${normalized.userId}`, { userId, chatData: normalized });
  if (cache.data && cache.userId === userId) {
    const index = cache.data.findIndex(chat => getUserId(chat) === normalized.userId);
    index >= 0 ? (
      cache.data.splice(index, 1),
      cache.data.unshift({ ...cache.data[index], ...normalized, unreadCount: normalized.unreadCount || cache.data[index]?.unreadCount || 0 })
    ) : cache.data.unshift(normalized);
    cache.data = cache.data.slice(0, 20);
  }
  scheduleBatchUpdate();
};

export const clearUnreadCount = async (userId, chatUserId) => {
  if (!userId || !chatUserId) return;
  try {
    await apiRequest('PATCH', { action: 'clearUnread', userId, chatUserId });
    if (cache.data && cache.userId === userId) {
      const chat = cache.data.find(c => getUserId(c) === chatUserId);
      chat && (chat.unreadCount = 0);
    }
  } catch (error) { throw error; }
};

export const incrementUnreadCount = (userId, chatUserId) => {
  if (cache.data && cache.userId === userId) {
    const chat = cache.data.find(c => getUserId(c) === chatUserId);
    chat && (chat.unreadCount = (chat.unreadCount || 0) + 1);
  }
};

const getCachedUsers = () => {
  try { return JSON.parse(sessionStorage.getItem('cachedUsers') || '{}'); } catch { return {}; }
};

const setCachedUsers = (users) => {
  try { sessionStorage.setItem('cachedUsers', JSON.stringify(users)); } catch {}
};

export const cacheUser = (user) => {
  const normalized = normalizeUser(user);
  if (!normalized) return;
  try {
    const cachedUsers = getCachedUsers();
    cachedUsers[normalized.userId] = { ...normalized, cachedAt: now() };
    setCachedUsers(cachedUsers);
  } catch {}
};

export const fetchAllUsers = () => {
  try {
    const cachedUsers = getCachedUsers();
    const currentTime = now();
    return Object.values(cachedUsers).filter(user => currentTime - (user.cachedAt || 0) < SESSION_CACHE_DURATION);
  } catch { return []; }
};

export const cleanup = () => {
  if (updateTimeout && pendingUpdates.size) {
    clearTimeout(updateTimeout);
    const updates = Array.from(pendingUpdates.values());
    pendingUpdates.clear();
    apiRequest('POST', { action: 'batchUpdate', updates }).catch(() => {});
  }
  updateTimeout = null;
  clearCache();
  pendingUpdates.clear();
};

if (typeof window !== 'undefined') {
  window.addEventListener('beforeunload', cleanup);
  window.addEventListener('pagehide', cleanup);
}
