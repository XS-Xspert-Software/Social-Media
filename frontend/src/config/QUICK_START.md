# Quick Start Guide - API Endpoints

## 🚀 5-Second Start

```javascript
import { ENDPOINTS, apiRequest } from '@/config/api';

// That's it! Now use any endpoint:
const posts = await apiRequest(ENDPOINTS.posts.getPosts);
```

## 📝 Common Tasks

### Get Posts
```javascript
const posts = await apiRequest(ENDPOINTS.posts.getPosts + '?page=1&limit=10');
```

### Like a Post
```javascript
await apiRequest(ENDPOINTS.posts.editPost, {
  method: 'POST',
  body: JSON.stringify({ postId: '123', username: 'john', action: 'like' })
});
```

### Send Message
```javascript
await apiRequest(ENDPOINTS.messages.sendMessage, {
  method: 'POST',
  body: JSON.stringify({ to: 'jane', message: 'Hi!' })
});
```

### Join Group
```javascript
await apiRequest(ENDPOINTS.groups.joinGroup + '?groupId=abc', {
  method: 'POST',
  body: JSON.stringify({ userId: '456' })
});
```

### Search Users
```javascript
import { buildUrl } from '@/config/api';

const url = buildUrl(ENDPOINTS.posts.searchPosts, { 
  username: 'john',
  postsOnly: true 
});
const results = await apiRequest(url);
```

## 📋 All Endpoints Cheat Sheet

```javascript
// Posts & Feed
ENDPOINTS.posts.getPosts
ENDPOINTS.posts.searchPosts
ENDPOINTS.posts.editPost
ENDPOINTS.posts.deletePost
ENDPOINTS.posts.deleteComment
ENDPOINTS.posts.getPostDetails

// Users
ENDPOINTS.users.authorize
ENDPOINTS.users.getUserList

// Profile
ENDPOINTS.profile.update

// Friends
ENDPOINTS.friends.getFriends
ENDPOINTS.friends.follow

// Messages
ENDPOINTS.messages.getMessages
ENDPOINTS.messages.sendMessage
ENDPOINTS.messages.deleteMessage
ENDPOINTS.messages.updateMessage
ENDPOINTS.messages.getRecent

// Groups
ENDPOINTS.groups.getGroups
ENDPOINTS.groups.getGroupDetails
ENDPOINTS.groups.updateGroup
ENDPOINTS.groups.getMembers
ENDPOINTS.groups.removeMember
ENDPOINTS.groups.leaveGroup
ENDPOINTS.groups.getMessages
ENDPOINTS.groups.sendMessage
ENDPOINTS.groups.updateMessage
ENDPOINTS.groups.deleteMessage
ENDPOINTS.groups.joinGroup
ENDPOINTS.groups.handleJoinRequest
ENDPOINTS.groups.cancelRequest

// Videos
ENDPOINTS.videos.getFeed

// Features
ENDPOINTS.features.postFeature
ENDPOINTS.features.getTrending

// Opinions
ENDPOINTS.opinions.postOpinion

// Alerts
ENDPOINTS.alerts.sendAlert
```

## 🔧 Modify URLs

Open `/frontend/src/config/api.js`:

```javascript
const API_BASE_URLS = {
  POSTS_API: 'https://your-new-url.com',  // ← Change here
  // ...
};
```

## 📖 Need More Help?

- Full Guide: `API_CONFIGURATION.md` (in this folder)
- Examples: `endpoints.js` (in this folder)
- Diagrams: `/API_ARCHITECTURE.md` (in root)
