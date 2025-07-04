import { Request, Response, NextFunction } from 'express';
import { db } from '../schema/index';
import { users } from '../schema/schema';
import { eq } from 'drizzle-orm';

// Dummy token validation for MVP
export async function authenticateToken(req: Request, res: Response, next: NextFunction) {
  const authHeader = req.headers['authorization'] || '';
  if (!authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Missing or invalid token' });
  }
  const token = authHeader.split(' ')[1];
  // For MVP: treat token as username
  const user = await db.select().from(users).where(eq(users.username, token));
  if (!user.length) {
    return res.status(401).json({ error: 'Invalid token' });
  }
  (req as any).user = user[0];
  next();
}
