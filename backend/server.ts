import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import type { Request, Response, NextFunction, ErrorRequestHandler } from 'express';
import multer from 'multer';
import { registerUser, loginUser, getUserInfo, updateUserProfile } from './controller/user.js';
import rateLimit from 'express-rate-limit';
import { createPost, getPosts, likePost, dislikePost } from './controller/post.js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { db } from './schema/index.js';
import { users } from './schema/schema.js';
import { eq } from 'drizzle-orm';
dotenv.config();
import { uploadVideoToB2 } from './b2.service.js';
import { log } from './utils/logger.js';
import { loadConfig, getTrustedServers } from './utils/config.js';

// ESM-compatible __dirname
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const PORT = process.env.PORT || 3000;
const app = express();

app.use(cors({origin: "*"})); 
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Universal logging middleware: logs every request (should be before routes)
app.use((req: Request, res: Response, next: NextFunction) => {
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

app.get('/', (req: Request, res: Response) => {
  res.send('Welcome to the backend server!');
});

app.post('/api/register', async (req: Request, res: Response) => {
  try {
    const { username, email, password } = req.body;
    const user = await registerUser({ username, email, password });
    res.status(201).json({ user });
  } catch (e: any) {
    log('error', "Full error registerUser:", e, typeof e, JSON.stringify(e));
    res.status(500).json({ error: 'Internal server error' });
  }
});

const loginRateLimiter = rateLimit({
  windowMs: 1 * 60 * 1000, // 1 minute
  max: 5, // Limit each IP to 5 login requests per `window` (1 minute)
  message: { error: "Too many login attempts. Please try again later. Send this to your administrator: {{request.ip}} {{request.body}} {{request.headers}} {{request.method}} ERROR_RATE_LIMIT" },
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
  message: { error: "Too many post creation attempts. Please try again later. Send this to your administrator: {{request.ip}} {{request.body}} {{request.headers}} {{request.method}} ERROR_RATE_LIMIT" },
});
app.post('/api/posts', createPostRateLimiter, createPost as any);
app.post('/api/posts/:postId/like', likePost as any);
app.post('/api/posts/:postId/dislike', dislikePost as any);

// Proxy video upload to remote service (avoids frontend CORS & dev 404)
// NOTE: /api/video proxy removed due to TypeScript issues and lack of multipart parser. Keep using front-end Vite proxy.

// Get user settings/profile by userId or username
// Video upload endpoint (Backblaze B2)
const upload = multer({ dest: 'uploads/' }); // Temporary upload folder
app.post('/api/video/upload', upload.single('video'), wrapAsync(async (req: Request, res: Response) => {
  if (!req.file) {
    res.status(400).json({ error: 'No video file uploaded.' });
    return;
  }
  const fileName = req.file.originalname || req.file.filename;
  const filePath = req.file.path;
  const videoInfo = await uploadVideoToB2(filePath, fileName);
  fs.unlink(filePath, () => {}); // cleanup

  // Save metadata to posts table
  const { userId, title, description, hashtags } = req.body;
  if (!userId) {
    res.status(400).json({ error: 'userId required' });
    return;
  }
  // Import db and posts schema
  const { db } = await import('./schema/index.js');
  const { posts } = await import('./schema/schema.js');
  const inserted = await db.insert(posts).values({
    userId,
    content: description || '',
    videoUrl: videoInfo.downloadUrl || '',
    title: title || '',
    description: description || '',
    hashtags: hashtags || '',
    createdAt: new Date(),
  }).returning();
  const newPost = inserted[0];

  res.json({ success: true, video: videoInfo, post: newPost });
}));

app.get('/api/user/settings', wrapAsync(async (req: Request, res: Response) => {
  const { userId, username } = req.query;
  let user;
  if (userId) {
    user = await getUserInfo(userId as string);
  } else if (username) {
    const found = await db.select().from(users).where(eq(users.username, username as string));
    if (found.length === 0) {
      res.status(404).json({ error: 'User not found' });
      return;
    }
    const { password, ...userInfo } = found[0];
    user = userInfo;
  } else {
    res.status(400).json({ error: 'userId or username required' });
    return;
  }
  res.json({ user });
}));

// Update user profile fields (username, description, etc.)
app.post('/api/user/settings', wrapAsync(async (req: Request, res: Response) => {
  const { userId, updates } = req.body;
  if (!userId || !updates) {
    res.status(400).json({ error: 'userId and updates required' });
    return;
  }
  const user = await updateUserProfile({ userId, updates });
  res.json({ user });
}));

// Update user preferences (dark mode, notifications, etc.)
app.post('/api/user/preferences', wrapAsync(async (req: Request, res: Response) => {
  const { userId, preferences } = req.body;
  if (!userId || !preferences) {
    res.status(400).json({ error: 'userId and preferences required' });
    return;
  }
  const user = await updateUserProfile({ userId, updates: { preferences } });
  res.json({ user });
}));

// Helper to wrap async route handlers for Express/TypeScript
function wrapAsync(fn: any) {
  return function(req: Request, res: Response, next: any) {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
}

// --- Decentralized/Federation Endpoints ---

// Helper to validate remote server parameter
function validateRemoteServer(remote: unknown): remote is string {
  const trustedServers = getTrustedServers();
  return typeof remote === 'string' && trustedServers.includes(remote);
}

// Helper to proxy fetch from remote server
async function proxyRemoteFetch(url: string, res: Response): Promise<void> {
  try {
    const fetchRes = await fetch(url);
    if (!fetchRes.ok) throw new Error('Remote fetch failed');
    const data = await fetchRes.json();
    res.json(data);
  } catch (e: any) {
    log('error', 'Error fetching from remote server:', e);
    res.status(502).json({ error: 'Failed to fetch from remote server' });
  }
}

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
  if (!validateRemoteServer(remote)) {
    return res.status(400).json({ error: 'Invalid or untrusted remote parameter' });
  }
  await proxyRemoteFetch(`${remote}/api/posts`, res);
}));

// Proxy remote user info
app.get('/federation/user-info', wrapAsync(async (req: Request, res: Response) => {
  const { remote, userId } = req.query;
  if (!validateRemoteServer(remote) || typeof userId !== 'string') {
    return res.status(400).json({ error: 'Invalid or untrusted remote parameter' });
  }
  await proxyRemoteFetch(`${remote}/api/user-info?userId=${encodeURIComponent(userId)}`, res);
}));

// Proxy remote videos
app.get('/federation/videos', wrapAsync(async (req: Request, res: Response) => {
  const { remote } = req.query;
  if (!validateRemoteServer(remote)) {
    return res.status(400).json({ error: 'Invalid or untrusted remote parameter' });
  }
  await proxyRemoteFetch(`${remote}/api/videos`, res);
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

// Admin verification endpoint
app.post('/api/admin/verify', wrapAsync(async (req: Request, res: Response) => {
  const provided = (req.body?.code || '').toString();
  const expected = (process.env.ADMIN_CODE || 'cat').toString();
  if (!provided) {
    res.status(400).json({ error: 'Code required' });
    return;
  }
  if (provided === expected) {
    res.json({ ok: true });
    return;
  }
  res.status(401).json({ error: 'Invalid code' });
}));

// Error logging middleware: logs all errors
const errorHandler: ErrorRequestHandler = (err, req, res, next) => {
  console.error(`[${new Date().toISOString()}] ERROR:`, err.stack || err);
  res.status(500).json({ error: 'Internal server error' });
};
app.use(errorHandler);

export default app;

app.listen(PORT, () => {
  log('info', `Server is running on port ${PORT}`);
});
