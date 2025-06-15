import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import fetch from 'node-fetch';
import { registerUser, loginUser, getUserInfo, updateUserProfile } from './controller/user.js';
import rateLimit from 'express-rate-limit';
import { createPost, getPosts } from './controller/post.js';
dotenv.config();
const PORT = process.env.PORT || 3000;
const app = express();
app.use(cors({ origin: "*" }));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Listen on all network interfaces for Vite/Node dev
app.set('host', '0.0.0.0');

function log(level, ...args) {
  const ts = new Date().toISOString();
  if (level === 'error') {
    console.error(`[${ts}]`, ...args);
  } else if (level === 'warn') {
    console.warn(`[${ts}]`, ...args);
  } else {
    console.log(`[${ts}]`, ...args);
  }
}

app.get('/', (req, res) => {
    res.send('Welcome to the backend server!');
});
app.post('/api/register', async (req, res) => {
    try {
        const { username, email, password } = req.body;
        const user = await registerUser({ username, email, password });
        res.status(201).json({ user });
    }
    catch (e) {
        log('error', "Erreur complète registerUser:", e, typeof e, JSON.stringify(e));
        res.status(500).json({ error: 'Internal server error' });
    }
});
const loginRateLimiter = rateLimit({
    windowMs: 1 * 60 * 1000, // 1 minute
    max: 5, // Limit each IP to 5 login requests per `window` (1 minute)
    message: { error: "Too many login attempts. Please try again later." },
});
app.post('/api/login', loginRateLimiter, async (req, res) => {
    try {
        const { email, password } = req.body;
        const { token, user } = await loginUser({ email, password });
        res.json({ token, user });
    }
    catch (e) {
        res.status(400).json({ error: e.message });
    }
});
app.get('/api/user-info', (req, res) => {
    (async () => {
        try {
            const userId = req.query.userId;
            if (!userId)
                return res.status(400).json({ error: 'userId requis' });
            const user = await getUserInfo(userId);
            res.json({ user });
        }
        catch (e) {
            res.status(400).json({ error: e.message });
        }
    })();
});
app.put('/api/user-update', async (req, res) => {
    try {
        const { userId, updates } = req.body;
        if (!userId || !updates) return res.status(400).json({ error: 'userId and updates required' });
        const user = await updateUserProfile(userId, updates);
        res.json({ user });
    } catch (e) {
        res.status(400).json({ error: e.message });
    }
});
app.get('/api/posts', getPosts);
app.post('/api/posts', createPost);

// Decentralized viewer endpoint: fetches and proxies content from another server
app.get('/viewer', async (req, res) => {
    const { url } = req.query;
    if (!url || typeof url !== 'string') {
        return res.status(400).json({ error: 'Missing or invalid url parameter' });
    }
    try {
        // Only allow http(s) URLs for security
        if (!/^https?:\/\//.test(url)) {
            return res.status(400).json({ error: 'Only http(s) URLs are allowed' });
        }
        const fetchRes = await fetch(url, { method: 'GET' });
        const contentType = fetchRes.headers.get('content-type') || 'application/octet-stream';
        // Always respond with JSON for errors or unsupported types
        if (contentType.includes('text/html')) {
            const html = await fetchRes.text();
            return res.status(502).json({ error: 'Remote server returned HTML, not API data. Check the URL.', htmlSnippet: html.slice(0, 500) });
        }
        if (contentType.includes('application/json')) {
            const json = await fetchRes.json();
            return res.json(json);
        } else if (contentType.includes('text/plain')) {
            const text = await fetchRes.text();
            return res.type('text/plain').send(text);
        } else if (fetchRes.body && (contentType.startsWith('video/') || contentType.startsWith('image/'))) {
            // For video/image, stream as-is
            res.set('content-type', contentType);
            return fetchRes.body.pipe(res);
        } else {
            // For all other types, return JSON error, never HTML
            return res.status(502).json({ error: 'Unsupported content-type from remote server', contentType });
        }
    } catch (e) {
        log('error', 'Error fetching from remote server:', e);
        res.status(502).json({ error: 'Failed to fetch from remote server' });
    }
});

// --- Decentralized/Federation Endpoints ---

// Discover remote servers (static for now, could be dynamic in future)
app.get('/federation/servers', (req, res) => {
    res.json({
        servers: [
            // Example: { name: 'Pulse Demo', url: 'https://pulse-demo.example.com' }
        ]
    });
});

// Proxy remote posts from another Pulse server
app.get('/federation/posts', async (req, res) => {
    const { remote } = req.query;
    if (!remote) return res.status(400).json({ error: 'Missing remote parameter' });
    try {
        const fetchRes = await fetch(`${remote}/api/posts`);
        if (!fetchRes.ok) throw new Error('Remote fetch failed');
        const data = await fetchRes.json();
        res.json(data);
    } catch (e) {
        res.status(502).json({ error: 'Failed to fetch remote posts', details: e.message });
    }
});

// Proxy remote user info
app.get('/federation/user-info', async (req, res) => {
    const { remote, userId } = req.query;
    if (!remote || !userId) return res.status(400).json({ error: 'Missing remote or userId parameter' });
    try {
        const fetchRes = await fetch(`${remote}/api/user-info?userId=${encodeURIComponent(userId)}`);
        if (!fetchRes.ok) throw new Error('Remote fetch failed');
        const data = await fetchRes.json();
        res.json(data);
    } catch (e) {
        res.status(502).json({ error: 'Failed to fetch remote user info', details: e.message });
    }
});

// Proxy remote videos
app.get('/federation/videos', async (req, res) => {
    const { remote } = req.query;
    if (!remote) return res.status(400).json({ error: 'Missing remote parameter' });
    try {
        const fetchRes = await fetch(`${remote}/api/videos`);
        if (!fetchRes.ok) throw new Error('Remote fetch failed');
        const data = await fetchRes.json();
        res.json(data);
    } catch (e) {
        res.status(502).json({ error: 'Failed to fetch remote videos', details: e.message });
    }
});

// Accept incoming federation requests (for future: e.g. push posts, follow, etc.)
app.post('/federation/inbox', (req, res) => {
    log('info', 'Received federation inbox:', req.body);
    res.json({ status: 'ok' });
});

export default app;
app.listen(PORT, () => {
    log('info', `Server is running on port ${PORT}`);
});
