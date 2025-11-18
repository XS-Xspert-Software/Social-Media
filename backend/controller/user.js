import { db } from '../schema/index';
import { users, userSessions } from '../schema/schema';
import { eq } from 'drizzle-orm';
import { randomUUID } from 'crypto';
import bcrypt from 'bcryptjs';
// Helper: generate token (simple random string for demo)
function generateToken() {
    return randomUUID();
}
export async function registerUser({ username, email, password }) {
    if (!username || !email || !password) {
        throw new Error("Tous les champs sont requis");
    }
    const existing = await db.select().from(users).where(eq(users.email, email));
    if (existing.length > 0) {
        throw new Error("L'utilisateur existe déjà");
    }
    const hashed = await bcrypt.hash(password, 10);
    const newUser = {
        username,
        email,
        password: hashed,
        createdAt: new Date(),
        updatedAt: new Date(),
        status: 'active',
        isVerified: false,
        isPrivate: false,
        allowMessagesFrom: 'public',
        followersCount: 0,
        followingCount: 0,
        postsCount: 0,
        emailVerified: false,
        phoneVerified: false,
        twoFactorEnabled: false,
    };
    const inserted = await db.insert(users).values(newUser).returning();
    return inserted[0];
}
export async function loginUser({ email, password }) {
    const found = await db.select().from(users).where(eq(users.email, email));
    if (found.length === 0)
        throw new Error('Utilisateur non trouvé');
    const user = found[0];
    const valid = await bcrypt.compare(password, user.password);
    if (!valid)
        throw new Error('Mot de passe incorrect');
    // Générer un token de session
    const token = generateToken();
    const expiresAt = new Date(Date.now() + 1000 * 60 * 60 * 24 * 7); // 7 jours
    await db.insert(userSessions).values({ userId: user.id, token, expiresAt, isActive: true, createdAt: new Date(), lastUsedAt: new Date() });
    return { token, user };
}
export async function getUserInfo(userId) {
    const found = await db.select().from(users).where(eq(users.id, userId));
    if (found.length === 0)
        throw new Error('Utilisateur non trouvé');
    const { password, ...userInfo } = found[0];
    return userInfo;
}
export async function updateUserProfile({ userId, updates }) {
    if (!userId || !updates || typeof updates !== 'object') {
        throw new Error('userId and updates required');
    }
    // Only allow certain fields to be updated
    const allowedFields = [
        'username', 'description', 'location', 'status', 'profession', 'hobby', 'profilePicture', 'preferences'
    ];
    const updateData = {};
    for (const key of allowedFields) {
        if (key in updates)
            updateData[key] = updates[key];
    }
    if (Object.keys(updateData).length === 0) {
        throw new Error('No valid fields to update');
    }
    await db.update(users).set(updateData).where(eq(users.id, userId));
    const found = await db.select().from(users).where(eq(users.id, userId));
    if (found.length === 0)
        throw new Error('Utilisateur non trouvé');
    const { password, ...userInfo } = found[0];
    return userInfo;
}
