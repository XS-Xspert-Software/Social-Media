/**
 * API ENDPOINTS QUICK REFERENCE
 * Import this file to see all available endpoints with autocomplete
 */

import { ENDPOINTS, API_BASE_URLS, apiRequest, buildUrl } from './api';

/**
 * QUICK REFERENCE - Copy and use these in your code
 * ================================================
 * 
 * POSTS & FEED:
 * - ENDPOINTS.posts.getPosts              → GET posts feed
 * - ENDPOINTS.posts.searchPosts           → GET search posts
 * - ENDPOINTS.posts.editPost              → POST edit (like/comment/reply)
 * - ENDPOINTS.posts.deletePost            → DELETE post
 * - ENDPOINTS.posts.deleteComment         → DELETE/PUT comment
 * - ENDPOINTS.posts.getPostDetails        → GET single post details
 * 
 * USERS:
 * - ENDPOINTS.users.authorize             → POST user auth
 * - ENDPOINTS.users.getUserList           → GET user list for chat
 * 
 * PROFILE:
 * - ENDPOINTS.profile.update              → POST update profile
 * 
 * FRIENDS:
 * - ENDPOINTS.friends.getFriends          → GET friends list
 * - ENDPOINTS.friends.follow              → POST follow/unfollow
 * 
 * MESSAGES (DM):
 * - ENDPOINTS.messages.getMessages        → GET messages
 * - ENDPOINTS.messages.sendMessage        → POST send message
 * - ENDPOINTS.messages.deleteMessage      → DELETE message
 * - ENDPOINTS.messages.updateMessage      → PUT update message
 * - ENDPOINTS.messages.getRecent          → GET recent chats
 * 
 * GROUPS:
 * - ENDPOINTS.groups.getGroups            → GET all groups
 * - ENDPOINTS.groups.getGroupDetails      → GET group by id
 * - ENDPOINTS.groups.updateGroup          → PUT update group
 * - ENDPOINTS.groups.getMembers           → GET members
 * - ENDPOINTS.groups.removeMember         → DELETE member
 * - ENDPOINTS.groups.leaveGroup           → DELETE leave
 * - ENDPOINTS.groups.getMessages          → GET group messages
 * - ENDPOINTS.groups.sendMessage          → POST send message
 * - ENDPOINTS.groups.updateMessage        → PUT update message
 * - ENDPOINTS.groups.deleteMessage        → DELETE message
 * - ENDPOINTS.groups.joinGroup            → POST join
 * - ENDPOINTS.groups.handleJoinRequest    → PUT approve/reject
 * - ENDPOINTS.groups.cancelRequest        → POST cancel request
 * 
 * VIDEOS:
 * - ENDPOINTS.videos.getFeed              → GET video feed
 * 
 * FEATURES:
 * - ENDPOINTS.features.postFeature        → POST create feature
 * - ENDPOINTS.features.getTrending        → GET trending hashtags
 * 
 * OPINIONS:
 * - ENDPOINTS.opinions.postOpinion        → POST opinion
 * 
 * ALERTS:
 * - ENDPOINTS.alerts.sendAlert            → POST alert
 * 
 * 
 * USAGE EXAMPLES:
 * ================================================
 * 
 * // Simple GET request
 * const posts = await apiRequest(ENDPOINTS.posts.getPosts);
 * 
 * // GET with query params
 * const url = buildUrl(ENDPOINTS.posts.getPosts, { page: 1, limit: 10 });
 * const posts = await apiRequest(url);
 * 
 * // POST request
 * await apiRequest(ENDPOINTS.messages.sendMessage, {
 *   method: 'POST',
 *   body: JSON.stringify({ message: 'Hello!' })
 * });
 * 
 * // DELETE request
 * await apiRequest(ENDPOINTS.posts.deletePost, {
 *   method: 'DELETE',
 *   body: JSON.stringify({ postId: '123' })
 * });
 * 
 * // PUT request
 * await apiRequest(ENDPOINTS.messages.updateMessage, {
 *   method: 'PUT',
 *   body: JSON.stringify({ messageId: '456', text: 'Updated' })
 * });
 */

export { ENDPOINTS, API_BASE_URLS, apiRequest, buildUrl };
