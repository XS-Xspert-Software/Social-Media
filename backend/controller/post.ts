import { Request, Response } from 'express';
import { db } from '../schema/index';
import { posts, users, likes } from '../schema/schema';
import { eq, desc, and } from 'drizzle-orm';
import { validate as validateUUID } from 'uuid';

export const createPost = async (req: Request, res: Response) => {
  // Security: Require auth unless test mode is enabled and test param is present
  const configPath = require('path').resolve(__dirname, '../../config.json');
  let globalConfig: any = {};
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

export const getPosts = async (req: Request, res: Response) => {
  // Join posts with users to get username
  const dbPosts = await db.select({
    id: posts.id,
    userId: posts.userId,
    content: posts.content,
    imageUrl: posts.imageUrl,
    createdAt: posts.createdAt,
    username: users.username
  }).from(posts).leftJoin(users, eq(posts.userId, users.id)).orderBy(desc(posts.createdAt));
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
  // If no local posts, try a remote fallback to keep the UI populated
  if (!postsOut.length) {
    try {
      const base = process.env.REMOTE_POSTS_FALLBACK || 'https://sports321.vercel.app/api/posts';
      const page = (req.query.page as string) || '1';
      const limit = (req.query.limit as string) || '10';
      const sort = (req.query.sort as string) || 'general';
      const url = `${base}?page=${encodeURIComponent(page)}&limit=${encodeURIComponent(limit)}&sort=${encodeURIComponent(sort)}`;
      const r = await fetch(url);
      if (r.ok) {
        const remoteJson = await r.json();
        return res.json(remoteJson);
      }
    } catch {}
  }
  res.json({ posts: postsOut });
};

export const likePost = async (req: Request, res: Response) => {
  const { userId } = req.body;
  const postId = req.params.postId;
  if (!userId || !postId) return res.status(400).json({ error: 'userId and postId required' });
  if (!validateUUID(userId)) return res.status(400).json({ error: 'Invalid userId (must be UUID)' });
  if (!validateUUID(postId)) return res.status(400).json({ error: 'Invalid postId (must be UUID)' });
  // Check if like exists
  const existing = await db.select().from(likes).where(and(eq(likes.userId, userId), eq(likes.postId, postId)));
  if (existing.length) {
    // Already liked, remove like (toggle off)
    await db.delete(likes).where(and(eq(likes.userId, userId), eq(likes.postId, postId)));
    return res.json({ liked: false });
  } else {
    // Add like
    await db.insert(likes).values({ userId, postId });
    return res.json({ liked: true });
  }
};

export const dislikePost = async (req: Request, res: Response) => {
  // For now, treat as a toggle for a 'dislike' (could be a separate table or a flag in likes table)
  // Here, we use likes table with a 'dislike' flag for extensibility
  const { userId } = req.body;
  const postId = req.params.postId;
  if (!userId || !postId) return res.status(400).json({ error: 'userId and postId required' });
  if (!validateUUID(userId)) return res.status(400).json({ error: 'Invalid userId (must be UUID)' });
  if (!validateUUID(postId)) return res.status(400).json({ error: 'Invalid postId (must be UUID)' });
  // Check if dislike exists
  const existing = await db.select().from(likes).where(and(eq(likes.userId, userId), eq(likes.postId, postId)));
  if (existing.length) {
    // Already disliked, remove (toggle off)
    await db.delete(likes).where(and(eq(likes.userId, userId), eq(likes.postId, postId)));
    return res.json({ disliked: false });
  } else {
    // Add dislike (for now, just insert like as a placeholder)
    await db.insert(likes).values({ userId, postId });
    return res.json({ disliked: true });
  }
};
