import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import type { Request, Response } from 'express';
import { registerUser, loginUser, getUserInfo } from './controller/user.js';
import rateLimit from 'express-rate-limit';
import { createPost, getPosts, likePost, dislikePost } from './controller/post.js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
dotenv.config();

// ESM-compatible __dirname
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const PORT = process.env.PORT || 3000;
const app = express();

// Load global config.json from project root
const configPath = path.resolve(__dirname, '../config.json');
let globalConfig: any = {};
try {
  if (fs.existsSync(configPath)) {
    globalConfig = JSON.parse(fs.readFileSync(configPath, 'utf-8'));
  }
} catch (e) {
  log('error', 'Failed to load config.json:', e);
}

// Helper to get trusted servers from config
const getTrustedServers = (): string[] => {
  return Array.isArray(globalConfig.federationTrustedServers)
    ? globalConfig.federationTrustedServers
    : [];
};

// Logger function for extensible logging
function log(level: string, ...args: any[]) {
  const ts = new Date().toISOString();
  if (level === 'error') {
    console.error(`[${ts}]`, ...args);
  } else if (level === 'warn') {
    console.warn(`[${ts}]`, ...args);
  } else {
    console.log(`[${ts}]`, ...args);
  }
}

app.use(cors({origin: "*"})); 
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.get('/', (req: Request, res: Response) => {
  res.send('Welcome to the backend server!');
});

app.post('/api/register', async (req: Request, res: Response) => {
  try {
    const { username, email, password } = req.body;
    const user = await registerUser({ username, email, password });
    res.status(201).json({ user });
  } catch (e: any) {
    log('error', "Erreur complète registerUser:", e, typeof e, JSON.stringify(e));
    res.status(500).json({ error: 'Internal server error' });
  }
});

const loginRateLimiter = rateLimit({
  windowMs: 1 * 60 * 1000, // 1 minute
  max: 5, // Limit each IP to 5 login requests per `window` (1 minute)
  message: { error: "Too many login attempts. Please try again later." },
});

app.post('/api/login', loginRateLimiter, async (req: Request, res: Response) => {
  try {
    const { email, password } = req.body;
    const { token, user } = await loginUser({ email, password });
    res.json({ token, user });
  } catch (e: any) {
    log('error', e.message);
    res.status(400).json({ error: e.message });
  }
});

app.get('/api/user-info', (req, res) => {
  (async () => {
    try {
      const userId = req.query.userId as string;
      if (!userId) return res.status(400).json({ error: 'userId requis' });
      const user = await getUserInfo(userId);
      res.json({ user });
    } catch (e: any) {
      log('error', e.message);
      res.status(400).json({ error: e.message });
    }
  })();
});

app.get('/api/posts', getPosts as any);
const createPostRateLimiter = rateLimit({
  windowMs: 1 * 60 * 1000, // 1 minute
  max: 10, // Limit each IP to 10 create post requests per `window` (1 minute)
  message: { error: "Too many post creation attempts. Please try again later." },
});
app.post('/api/posts', createPostRateLimiter, createPost as any);
app.post('/api/posts/:postId/like', likePost as any);
app.post('/api/posts/:postId/dislike', dislikePost as any);

// Get user settings/profile by userId or username
app.get('/api/user/settings', async (req: Request, res: Response) => {
  try {
    const { userId, username } = req.query;
    let user;
    if (userId) {
      user = await getUserInfo(userId as string);
    } else if (username) {
      // Find by username (assuming usernames are unique)
      const found = await db.select().from(users).where(eq(users.username, username as string));
      if (found.length === 0) return res.status(404).json({ error: 'User not found' });
      const { password, ...userInfo } = found[0];
      user = userInfo;
    } else {
      return res.status(400).json({ error: 'userId or username required' });
    }
    res.json({ user });
  } catch (e: any) {
    log('error', e.message);
    res.status(400).json({ error: e.message });
  }
});

// Update user profile fields (username, description, etc.)
app.post('/api/user/settings', async (req: Request, res: Response) => {
  try {
    const { userId, updates } = req.body;
    if (!userId || !updates) return res.status(400).json({ error: 'userId and updates required' });
    const user = await updateUserProfile({ userId, updates });
    res.json({ user });
  } catch (e: any) {
    log('error', e.message);
    res.status(400).json({ error: e.message });
  }
});

// Update user preferences (dark mode, notifications, etc.)
app.post('/api/user/preferences', async (req: Request, res: Response) => {
  try {
    const { userId, preferences } = req.body;
    if (!userId || !preferences) return res.status(400).json({ error: 'userId and preferences required' });
    const user = await updateUserProfile({ userId, updates: { preferences } });
    res.json({ user });
  } catch (e: any) {
    log('error', e.message);
    res.status(400).json({ error: e.message });
  }
});

// Helper to wrap async route handlers for Express/TypeScript
function wrapAsync(fn: any) {
  return function(req: Request, res: Response, next: any) {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
}

// --- Decentralized/Federation Endpoints ---
// Use the global fetch API available in Node.js v18+
// If you need to support older Node.js versions, install 'node-fetch' and import it at the top
// import fetch from 'node-fetch';

// Discover remote servers (static for now, could be dynamic in future)
app.get('/federation/servers', (req: Request, res: Response) => {
  res.json({
    servers: [
      // Example: { name: 'Pulse Demo', url: 'https://pulse-demo.example.com' }
    ]
  });
});

// Proxy remote posts from another Pulse server
app.get('/federation/posts', wrapAsync(async (req: Request, res: Response) => {
  const { remote } = req.query;
  const trustedServers = getTrustedServers();
  if (!remote || typeof remote !== 'string' || !trustedServers.includes(remote)) {
    return res.status(400).json({ error: 'Invalid or untrusted remote parameter' });
  }
  try {
    const fetchRes = await fetch(`${remote}/api/posts`);
    if (!fetchRes.ok) throw new Error('Remote fetch failed');
    const data = await fetchRes.json();
    res.json(data);
  } catch (e: any) {
    log('error', 'Error fetching from remote server:', e);
    res.status(502).json({ error: 'Failed to fetch from remote server' });
  }
}));

// Proxy remote user info
app.get('/federation/user-info', wrapAsync(async (req: Request, res: Response) => {
  const { remote, userId } = req.query;
  const trustedServers = getTrustedServers();
  if (!remote || !userId || typeof remote !== 'string' || typeof userId !== 'string' || !trustedServers.includes(remote)) {
    return res.status(400).json({ error: 'Invalid or untrusted remote parameter' });
  }
  try {
    const fetchRes = await fetch(`${remote}/api/user-info?userId=${encodeURIComponent(userId)}`);
    if (!fetchRes.ok) throw new Error('Remote fetch failed');
    const data = await fetchRes.json();
    res.json(data);
  } catch (e: any) {
    log('error', 'Error fetching from remote server:', e);
    res.status(502).json({ error: 'Failed to fetch from remote server' });
  }
}));

// Proxy remote videos
app.get('/federation/videos', wrapAsync(async (req: Request, res: Response) => {
  const { remote } = req.query;
  const trustedServers = getTrustedServers();
  if (!remote || typeof remote !== 'string' || !trustedServers.includes(remote)) {
    return res.status(400).json({ error: 'Invalid or untrusted remote parameter' });
  }
  try {
    const fetchRes = await fetch(`${remote}/api/videos`);
    if (!fetchRes.ok) throw new Error('Remote fetch failed');
    const data = await fetchRes.json();
    res.json(data);
  } catch (e: any) {
    log('error', 'Error fetching from remote server:', e);
    res.status(502).json({ error: 'Failed to fetch from remote server' });
  }
}));

// API Discovery endpoint for federation (dynamic, based on current post API source)
app.get('/federation/discover', (req: Request, res: Response) => {
  // Try to detect the remote API used for posts (from env or config, fallback to local)
  // You can set this in an env var like FEDERATION_POSTS_API or similar
  const postsApi = process.env.FEDERATION_POSTS_API || 'http://localhost:3000/api/posts';
  const userInfoApi = process.env.FEDERATION_USERINFO_API || 'http://localhost:3000/api/user-info';
  const videosApi = process.env.FEDERATION_VIDEOS_API || 'http://localhost:3000/api/videos';

  // Federation endpoints (always local to this instance)
  const baseUrl = process.env.FEDERATION_BASE_URL || `http://localhost:${PORT}`;

  res.json({
    posts: postsApi,
    userInfo: userInfoApi,
    videos: videosApi,
    federationPosts: `${baseUrl}/federation/posts`,
    federationUserInfo: `${baseUrl}/federation/user-info`,
    federationVideos: `${baseUrl}/federation/videos`,
    federationInbox: `${baseUrl}/federation/inbox`,
    description: 'API discovery for Pulse federation. Endpoints reflect the current remote API configuration.'
  });
});

// Accept incoming federation requests (for future: e.g. push posts, follow, etc.)
app.post('/federation/inbox', (req: Request, res: Response) => {
  log('info', 'Received federation inbox:', req.body);
  res.json({ status: 'ok' });
});

// Universal logging middleware: logs every request and response
app.use((req, res, next) => {
  // Log incoming request
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.originalUrl}`);
  if (Object.keys(req.query).length) {
    console.log('Query:', req.query);
  }
  if (Object.keys(req.body || {}).length) {
    console.log('Body:', req.body);
  }

  // Monkey-patch res.send to log outgoing response
  const oldSend = res.send;
  res.send = function (data) {
    console.log(`[${new Date().toISOString()}] Response ${res.statusCode} for ${req.method} ${req.originalUrl}`);
    try {
      // Try to pretty print JSON
      const parsed = typeof data === 'string' ? JSON.parse(data) : data;
      console.log('Response Body:', JSON.stringify(parsed, null, 2));
    } catch {
      // Fallback for non-JSON
      console.log('Response Body:', data);
    }
    // @ts-ignore
    return oldSend.apply(res, arguments);
  };
  next();
});

// Error logging middleware: logs all errors
app.use((err, req, res, next) => {
  console.error(`[${new Date().toISOString()}] ERROR:`, err.stack || err);
  res.status(500).json({ error: 'Internal server error' });
});

export default app;

app.listen(PORT, () => {
  log('info', `Server is running on port ${PORT}`);
});
