// @ts-nocheck
import { pgTable, serial, varchar, text, integer, boolean, timestamp, pgEnum, uuid, jsonb, index, uniqueIndex, primaryKey } from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';
export const userStatusEnum = pgEnum('user_status', ['active', 'inactive', 'suspended', 'banned']);
export const privacyEnum = pgEnum('privacy', ['public', 'friends', 'private']);
export const postTypeEnum = pgEnum('post_type', ['text', 'image', 'video', 'link', 'poll']);
export const notificationTypeEnum = pgEnum('notification_type', [
    'like', 'comment', 'follow', 'mention', 'share', 'message', 'friend_request'
]);
export const messageTypeEnum = pgEnum('message_type', ['text', 'image', 'video', 'file', 'voice']);
export const friendshipStatusEnum = pgEnum('friendship_status', ['pending', 'accepted', 'blocked']);
export const users = pgTable('users', {
    id: uuid('id').defaultRandom().primaryKey(),
    username: varchar('username', { length: 14 }).notNull().unique(),
    email: varchar('email', { length: 50 }).notNull().unique(),
    phoneNumber: varchar('phone_number', { length: 20 }).unique(),
    password: varchar('password', { length: 255 }).notNull(),
    firstName: varchar('first_name', { length: 100 }),
    lastName: varchar('last_name', { length: 100 }),
    displayName: varchar('display_name', { length: 100 }),
    bio: text('bio'),
    avatar: text('avatar'),
    coverPhoto: text('cover_photo'),
    website: varchar('website', { length: 50 }),
    location: varchar('location', { length: 50 }),
    dateOfBirth: timestamp('date_of_birth'),
    status: userStatusEnum('status').default('active').notNull(),
    isVerified: boolean('is_verified').default(false).notNull(),
    isPrivate: boolean('is_private').default(false).notNull(),
    allowMessagesFrom: privacyEnum('allow_messages_from').default('public').notNull(),
    followersCount: integer('followers_count').default(0).notNull(),
    followingCount: integer('following_count').default(0).notNull(),
    postsCount: integer('posts_count').default(0).notNull(),
    lastActive: timestamp('last_active'),
    emailVerified: boolean('email_verified').default(false).notNull(),
    phoneVerified: boolean('phone_verified').default(false).notNull(),
    twoFactorEnabled: boolean('two_factor_enabled').default(false).notNull(),
    preferences: jsonb('preferences'),
    createdAt: timestamp('created_at').defaultNow().notNull(),
    updatedAt: timestamp('updated_at').defaultNow().notNull(),
}, (table) => ({
    usernameIdx: uniqueIndex('username_idx').on(table.username),
    emailIdx: uniqueIndex('email_idx').on(table.email),
    statusIdx: index('user_status_idx').on(table.status),
    lastActiveIdx: index('user_last_active_idx').on(table.lastActive),
}));
export const posts = pgTable("posts", {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: uuid("user_id").notNull(),
    content: text("content").notNull(),
    imageUrl: varchar("image_url", { length: 255 }),
    videoUrl: varchar("video_url", { length: 255 }),
    title: varchar("title", { length: 255 }),
    description: text("description"),
    hashtags: text("hashtags"),
    createdAt: timestamp("created_at").defaultNow().notNull(),
});
export const comments = pgTable('comments', {
    id: uuid('id').defaultRandom().primaryKey(),
    postId: uuid('post_id').references(() => posts.id, { onDelete: 'cascade' }).notNull(),
    authorId: uuid('author_id').references(() => users.id, { onDelete: 'cascade' }).notNull(),
    parentId: uuid('parent_id').references(() => comments.id),
    content: text('content').notNull(),
    media: jsonb('media'),
    likesCount: integer('likes_count').default(0).notNull(),
    repliesCount: integer('replies_count').default(0).notNull(),
    isEdited: boolean('is_edited').default(false).notNull(),
    editedAt: timestamp('edited_at'),
    isDeleted: boolean('is_deleted').default(false).notNull(),
    deletedAt: timestamp('deleted_at'),
    createdAt: timestamp('created_at').defaultNow().notNull(),
    updatedAt: timestamp('updated_at').defaultNow().notNull(),
}, (table) => ({
    postIdIdx: index('comment_post_id_idx').on(table.postId),
    authorIdIdx: index('comment_author_id_idx').on(table.authorId),
    parentIdIdx: index('comment_parent_id_idx').on(table.parentId),
    createdAtIdx: index('comment_created_at_idx').on(table.createdAt),
}));
export const likes = pgTable('likes', {
    id: uuid('id').defaultRandom().primaryKey(),
    userId: uuid('user_id').references(() => users.id, { onDelete: 'cascade' }).notNull(),
    postId: uuid('post_id').references(() => posts.id, { onDelete: 'cascade' }),
    commentId: uuid('comment_id').references(() => comments.id, { onDelete: 'cascade' }),
    createdAt: timestamp('created_at').defaultNow().notNull(),
}, (table) => ({
    userPostIdx: uniqueIndex('like_user_post_idx').on(table.userId, table.postId),
    userCommentIdx: uniqueIndex('like_user_comment_idx').on(table.userId, table.commentId),
    postIdIdx: index('like_post_id_idx').on(table.postId),
    commentIdIdx: index('like_comment_id_idx').on(table.commentId),
}));
export const follows = pgTable('follows', {
    id: uuid('id').defaultRandom().primaryKey(),
    followerId: uuid('follower_id').references(() => users.id, { onDelete: 'cascade' }).notNull(),
    followingId: uuid('following_id').references(() => users.id, { onDelete: 'cascade' }).notNull(),
    status: friendshipStatusEnum('status').default('accepted').notNull(),
    createdAt: timestamp('created_at').defaultNow().notNull(),
    updatedAt: timestamp('updated_at').defaultNow().notNull(),
}, (table) => ({
    followerFollowingIdx: uniqueIndex('follower_following_idx').on(table.followerId, table.followingId),
    followerIdIdx: index('follow_follower_id_idx').on(table.followerId),
    followingIdIdx: index('follow_following_id_idx').on(table.followingId),
    statusIdx: index('follow_status_idx').on(table.status),
}));
export const conversations = pgTable('conversations', {
    id: uuid('id').defaultRandom().primaryKey(),
    name: varchar('name', { length: 100 }),
    isGroup: boolean('is_group').default(false).notNull(),
    avatar: text('avatar'),
    createdBy: uuid('created_by').references(() => users.id),
    lastMessageId: uuid('last_message_id'),
    lastMessageAt: timestamp('last_message_at'),
    createdAt: timestamp('created_at').defaultNow().notNull(),
    updatedAt: timestamp('updated_at').defaultNow().notNull(),
}, (table) => ({
    lastMessageAtIdx: index('conversation_last_message_at_idx').on(table.lastMessageAt),
    createdByIdx: index('conversation_created_by_idx').on(table.createdBy),
}));
export const conversationParticipants = pgTable('conversation_participants', {
    conversationId: uuid('conversation_id').references(() => conversations.id, { onDelete: 'cascade' }).notNull(),
    userId: uuid('user_id').references(() => users.id, { onDelete: 'cascade' }).notNull(),
    joinedAt: timestamp('joined_at').defaultNow().notNull(),
    leftAt: timestamp('left_at'),
    lastReadAt: timestamp('last_read_at'),
    isAdmin: boolean('is_admin').default(false).notNull(),
    isMuted: boolean('is_muted').default(false).notNull(),
}, (table) => ({
    pk: primaryKey({ columns: [table.conversationId, table.userId] }),
    conversationIdIdx: index('participant_conversation_id_idx').on(table.conversationId),
    userIdIdx: index('participant_user_id_idx').on(table.userId),
}));
export const messages = pgTable('messages', {
    id: uuid('id').defaultRandom().primaryKey(),
    conversationId: uuid('conversation_id').references(() => conversations.id, { onDelete: 'cascade' }).notNull(),
    senderId: uuid('sender_id').references(() => users.id, { onDelete: 'cascade' }).notNull(),
    content: text('content'),
    type: messageTypeEnum('type').default('text').notNull(),
    media: jsonb('media'),
    replyToId: uuid('reply_to_id').references(() => messages.id),
    isEdited: boolean('is_edited').default(false).notNull(),
    editedAt: timestamp('edited_at'),
    isDeleted: boolean('is_deleted').default(false).notNull(),
    deletedAt: timestamp('deleted_at'),
    readBy: jsonb('read_by'),
    createdAt: timestamp('created_at').defaultNow().notNull(),
    updatedAt: timestamp('updated_at').defaultNow().notNull(),
}, (table) => ({
    conversationIdIdx: index('message_conversation_id_idx').on(table.conversationId),
    senderIdIdx: index('message_sender_id_idx').on(table.senderId),
    createdAtIdx: index('message_created_at_idx').on(table.createdAt),
    replyToIdIdx: index('message_reply_to_id_idx').on(table.replyToId),
}));
export const stories = pgTable('stories', {
    id: uuid('id').defaultRandom().primaryKey(),
    authorId: uuid('author_id').references(() => users.id, { onDelete: 'cascade' }).notNull(),
    content: text('content'),
    media: jsonb('media').notNull(),
    privacy: privacyEnum('privacy').default('public').notNull(),
    viewsCount: integer('views_count').default(0).notNull(),
    expiresAt: timestamp('expires_at').notNull(),
    isHighlight: boolean('is_highlight').default(false).notNull(),
    highlightTitle: varchar('highlight_title', { length: 100 }),
    createdAt: timestamp('created_at').defaultNow().notNull(),
}, (table) => ({
    authorIdIdx: index('story_author_id_idx').on(table.authorId),
    expiresAtIdx: index('story_expires_at_idx').on(table.expiresAt),
    createdAtIdx: index('story_created_at_idx').on(table.createdAt),
}));
export const storyViews = pgTable('story_views', {
    storyId: uuid('story_id').references(() => stories.id, { onDelete: 'cascade' }).notNull(),
    viewerId: uuid('viewer_id').references(() => users.id, { onDelete: 'cascade' }).notNull(),
    viewedAt: timestamp('viewed_at').defaultNow().notNull(),
}, (table) => ({
    pk: primaryKey({ columns: [table.storyId, table.viewerId] }),
    storyIdIdx: index('story_view_story_id_idx').on(table.storyId),
    viewerIdIdx: index('story_view_viewer_id_idx').on(table.viewerId),
}));
export const notifications = pgTable('notifications', {
    id: uuid('id').defaultRandom().primaryKey(),
    userId: uuid('user_id').references(() => users.id, { onDelete: 'cascade' }).notNull(),
    type: notificationTypeEnum('type').notNull(),
    title: varchar('title', { length: 255 }).notNull(),
    message: text('message'),
    data: jsonb('data'),
    isRead: boolean('is_read').default(false).notNull(),
    readAt: timestamp('read_at'),
    createdAt: timestamp('created_at').defaultNow().notNull(),
}, (table) => ({
    userIdIdx: index('notification_user_id_idx').on(table.userId),
    typeIdx: index('notification_type_idx').on(table.type),
    isReadIdx: index('notification_is_read_idx').on(table.isRead),
    createdAtIdx: index('notification_created_at_idx').on(table.createdAt),
}));
export const hashtags = pgTable('hashtags', {
    id: serial('id').primaryKey(),
    name: varchar('name', { length: 100 }).notNull().unique(),
    usageCount: integer('usage_count').default(0).notNull(),
    createdAt: timestamp('created_at').defaultNow().notNull(),
    updatedAt: timestamp('updated_at').defaultNow().notNull(),
}, (table) => ({
    nameIdx: uniqueIndex('hashtag_name_idx').on(table.name),
    usageCountIdx: index('hashtag_usage_count_idx').on(table.usageCount),
}));
export const blockedUsers = pgTable('blocked_users', {
    blockerId: uuid('blocker_id').references(() => users.id, { onDelete: 'cascade' }).notNull(),
    blockedId: uuid('blocked_id').references(() => users.id, { onDelete: 'cascade' }).notNull(),
    createdAt: timestamp('created_at').defaultNow().notNull(),
}, (table) => ({
    pk: primaryKey({ columns: [table.blockerId, table.blockedId] }),
    blockerIdIdx: index('blocked_user_blocker_id_idx').on(table.blockerId),
    blockedIdIdx: index('blocked_user_blocked_id_idx').on(table.blockedId),
}));
export const userSessions = pgTable('user_sessions', {
    id: uuid('id').defaultRandom().primaryKey(),
    userId: uuid('user_id').references(() => users.id, { onDelete: 'cascade' }).notNull(),
    token: varchar('token', { length: 255 }).notNull().unique(),
    refreshToken: varchar('refresh_token', { length: 255 }),
    deviceInfo: jsonb('device_info'),
    ipAddress: varchar('ip_address', { length: 45 }),
    isActive: boolean('is_active').default(true).notNull(),
    expiresAt: timestamp('expires_at').notNull(),
    createdAt: timestamp('created_at').defaultNow().notNull(),
    lastUsedAt: timestamp('last_used_at').defaultNow().notNull(),
}, (table) => ({
    tokenIdx: uniqueIndex('session_token_idx').on(table.token),
    userIdIdx: index('session_user_id_idx').on(table.userId),
    expiresAtIdx: index('session_expires_at_idx').on(table.expiresAt),
}));
export const usersRelations = relations(users, ({ many }) => ({
    posts: many(posts),
    comments: many(comments),
    likes: many(likes),
    followers: many(follows, { relationName: 'following' }),
    following: many(follows, { relationName: 'follower' }),
    sentMessages: many(messages),
    conversations: many(conversationParticipants),
    stories: many(stories),
    storyViews: many(storyViews),
    notifications: many(notifications),
    blockedUsers: many(blockedUsers, { relationName: 'blocker' }),
    blockedBy: many(blockedUsers, { relationName: 'blocked' }),
    sessions: many(userSessions),
}));
export const postsRelations = relations(posts, ({ one, many }) => ({
    author: one(users, {
        fields: [posts.userId],
        references: [users.id],
    }),
    comments: many(comments),
    likes: many(likes),
}));
export const commentsRelations = relations(comments, ({ one, many }) => ({
    post: one(posts, {
        fields: [comments.postId],
        references: [posts.id],
    }),
    author: one(users, {
        fields: [comments.authorId],
        references: [users.id],
    }),
    parent: one(comments, {
        fields: [comments.parentId],
        references: [comments.id],
    }),
    replies: many(comments),
    likes: many(likes),
}));
export const likesRelations = relations(likes, ({ one }) => ({
    user: one(users, {
        fields: [likes.userId],
        references: [users.id],
    }),
    post: one(posts, {
        fields: [likes.postId],
        references: [posts.id],
    }),
    comment: one(comments, {
        fields: [likes.commentId],
        references: [comments.id],
    }),
}));
export const followsRelations = relations(follows, ({ one }) => ({
    follower: one(users, {
        fields: [follows.followerId],
        references: [users.id],
        relationName: 'follower',
    }),
    following: one(users, {
        fields: [follows.followingId],
        references: [users.id],
        relationName: 'following',
    }),
}));
export const conversationsRelations = relations(conversations, ({ one, many }) => ({
    creator: one(users, {
        fields: [conversations.createdBy],
        references: [users.id],
    }),
    participants: many(conversationParticipants),
    messages: many(messages),
}));
export const conversationParticipantsRelations = relations(conversationParticipants, ({ one }) => ({
    conversation: one(conversations, {
        fields: [conversationParticipants.conversationId],
        references: [conversations.id],
    }),
    user: one(users, {
        fields: [conversationParticipants.userId],
        references: [users.id],
    }),
}));
export const messagesRelations = relations(messages, ({ one }) => ({
    conversation: one(conversations, {
        fields: [messages.conversationId],
        references: [conversations.id],
    }),
    sender: one(users, {
        fields: [messages.senderId],
        references: [users.id],
    }),
    replyTo: one(messages, {
        fields: [messages.replyToId],
        references: [messages.id],
    }),
}));
export const storiesRelations = relations(stories, ({ one, many }) => ({
    author: one(users, {
        fields: [stories.authorId],
        references: [users.id],
    }),
    views: many(storyViews),
}));
export const storyViewsRelations = relations(storyViews, ({ one }) => ({
    story: one(stories, {
        fields: [storyViews.storyId],
        references: [stories.id],
    }),
    viewer: one(users, {
        fields: [storyViews.viewerId],
        references: [users.id],
    }),
}));
export const notificationsRelations = relations(notifications, ({ one }) => ({
    user: one(users, {
        fields: [notifications.userId],
        references: [users.id],
    }),
}));
export const blockedUsersRelations = relations(blockedUsers, ({ one }) => ({
    blocker: one(users, {
        fields: [blockedUsers.blockerId],
        references: [users.id],
        relationName: 'blocker',
    }),
    blocked: one(users, {
        fields: [blockedUsers.blockedId],
        references: [users.id],
        relationName: 'blocked',
    }),
}));
export const userSessionsRelations = relations(userSessions, ({ one }) => ({
    user: one(users, {
        fields: [userSessions.userId],
        references: [users.id],
    }),
}));
