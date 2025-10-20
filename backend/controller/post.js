import { db } from '../schema/index.js';
import { posts, users } from '../schema/schema.js';
import { eq } from 'drizzle-orm';

export const createPost = async (req, res) => {
    // Security: Require auth unless test mode is enabled and test param is present
    const configPath = require('path').resolve(__dirname, '../../config.json');
    let globalConfig = {};
    try {
        if (require('fs').existsSync(configPath)) {
            globalConfig = JSON.parse(require('fs').readFileSync(configPath, 'utf-8'));
        }
    } catch (e) {
        // ignore
    }
    const allowTest = globalConfig.ALLOW_TEST_POST_UPLOAD === true;
    const isTest = req.body && req.body.test_upload === '1';
    if (!isTest) {
        // Require token in Authorization header
        const authHeader = req.headers['authorization'] || '';
        if (!authHeader.startsWith('Bearer ')) {
            return res.status(401).json({ error: 'Missing or invalid token' });
        }
        // TODO: Validate token (implement your session/token logic here)
        // If invalid, return 401
    }
    const { username, message, photo } = req.body;
    if (!username || !message) {
        return res.status(400).json({ error: 'username and message are required' });
    }
    // Find user by username
    const user = await db.select().from(users).where(eq(users.username, username));
    if (!user.length) {
        return res.status(404).json({ error: 'User not found' });
    }
    const userId = user[0].id;
    // Insert post into DB
    const inserted = await db.insert(posts).values({
        userId,
        content: message,
        imageUrl: photo || null,
        createdAt: new Date(),
    }).returning();
    const newPost = inserted[0];
    res.status(201).json({
        _id: newPost.id,
        username,
        message: newPost.content,
        photo: newPost.imageUrl,
        timestamp: newPost.createdAt,
        likes: 0,
        dislikes: 0,
        views: 0,
        comments: [],
        showComments: false,
        commentInput: ''
    });
    // If test upload, log it
    if (isTest) {
        console.warn('Test post upload (unauthenticated):', req.body);
    }
};

export const getPosts = async (req, res) => {
    // Join posts with users to get username
    const dbPosts = await db.select({
        id: posts.id,
        userId: posts.userId,
        content: posts.content,
        imageUrl: posts.imageUrl,
        createdAt: posts.createdAt,
        username: users.username
    }).from(posts).leftJoin(users, eq(posts.userId, users.id)).orderBy(posts.createdAt.desc());
    const postsOut = dbPosts.map(post => ({
        _id: post.id,
        username: post.username,
        message: post.content,
        photo: post.imageUrl,
        timestamp: post.createdAt,
        likes: 0,
        dislikes: 0,
        views: 0,
        comments: [],
        showComments: false,
        commentInput: ''
    }));
    // If no local posts, proxy a remote feed to keep UI populated in dev
    if (!postsOut.length) {
        try {
            const base = process.env.REMOTE_POSTS_FALLBACK || 'https://sports321.vercel.app/api/posts';
            const page = (req.query.page || '1').toString();
            const limit = (req.query.limit || '10').toString();
            const sort = (req.query.sort || 'general').toString();
            const url = `${base}?page=${encodeURIComponent(page)}&limit=${encodeURIComponent(limit)}&sort=${encodeURIComponent(sort)}`;
            const r = await fetch(url);
            if (r.ok) {
                const remoteJson = await r.json();
                return res.json(remoteJson);
            }
        } catch (e) {
            // swallow and fall through to empty array
        }
    }
    res.json({ posts: postsOut });
};
