# API Configuration Guide

## Overview
All API endpoints for the Pulse application are centralized in `api.js`. This makes it easy to modify URLs, switch between environments, and maintain consistency across the application.

## File Location
`/frontend/src/config/api.js`

## Usage

### Import the configuration
```javascript
import API_CONFIG, { apiHelper } from '@/config/api.js';
```

## Available Services

### 1. Authentication
- **URL**: `https://latestnewsandaffairs.site/public/signup`
- **Purpose**: User signup and authentication

### 2. Authorization Service
- **Base URL**: `https://1999-theta.vercel.app/api/authorize`
- **Purpose**: User authorization
- **Helper Method**: `apiHelper.authorize(authData)`

### 3. Posts & Opinions
- **Base URL**: `https://hamburger-henna.vercel.app/api/postOpinion`
- **Purpose**: Create and manage posts
- **Helper Methods**:
  - `apiHelper.createPost(postData)` - Create a new post
  - `apiHelper.getPosts(username)` - Get posts (optional: filter by username)
  - `apiHelper.deletePost(postId, sessionId)` - Delete a post
  - `apiHelper.editPost(postData)` - Edit an existing post

### 4. Social Interactions
- **Base URL**: `https://sports321.vercel.app/api/`
- **Endpoints**:
  - `/posts` - Get all posts
  - `/Follow` - Follow/unfollow users
  - `/deletePost` - Delete posts
  - `/deletecomment` - Delete comments
  - `/editPost` - Edit posts
  - `/search` - Search users
  - `/notification` - Get notifications
- **Helper Methods**:
  - `apiHelper.toggleFollow(followData)` - Follow or unfollow a user
  - `apiHelper.searchUsers(username, postsOnly)` - Search for users
  - `apiHelper.getNotifications(username)` - Get user notifications
  - `apiHelper.deleteComment(commentData)` - Delete a comment

### 5. Hashtags & Features
- **Base URL**: `https://199-ten.vercel.app/api/features`
- **Purpose**: Manage hashtags and trending features
- **Helper Methods**:
  - `apiHelper.saveHashtags(postId, hashtags, username)` - Save hashtags for a post
  - `apiHelper.getTrendingHashtags(hours, limit)` - Get trending hashtags
  - `apiHelper.getHashtagPosts(postId)` - Get posts for a specific hashtag

### 6. Alerts & Notifications
- **Base URL**: `https://2damnit.vercel.app/api/Alerts`
- **Purpose**: Push notifications and alerts
- **Helper Method**: `apiHelper.sendAlert(alertData)`

### 7. Friends
- **Base URL**: `https://burger-eta-eight.vercel.app/api/friends`
- **Purpose**: Manage friend connections
- **Helper Method**: `apiHelper.getFriends(username)`

### 8. Chat & Messages
- **Base URLs**:
  - Messages: `https://recent-six.vercel.app/api/message`
  - Recent chats: `https://recent-six.vercel.app/api/recent`
- **Helper Methods**:
  - `apiHelper.getMessages(username, chatWith)` - Get chat messages
  - `apiHelper.sendMessage(messageData)` - Send a message
  - `apiHelper.getRecentChats(username)` - Get recent chat conversations

### 9. Groups
- **Base URL**: `https://yupitis.vercel.app/api/`
- **Endpoints**:
  - `/groups` - Manage groups
  - `/join` - Join requests
  - `/cancel-request` - Cancel join requests
  - `/members` - Group members
  - `/messages` - Group messages
- **Helper Methods**:
  - `apiHelper.getGroups(userId, groupId)` - Get groups
  - `apiHelper.createGroup(groupData, userId)` - Create a new group
  - `apiHelper.deleteGroup(groupId)` - Delete a group
  - `apiHelper.joinGroup(groupId)` - Request to join a group
  - `apiHelper.approveJoinRequest(requestId)` - Approve a join request
  - `apiHelper.cancelJoinRequest(groupId)` - Cancel a join request
  - `apiHelper.getGroupMembers(groupId)` - Get group members
  - `apiHelper.removeGroupMember(groupId, userId)` - Remove a member
  - `apiHelper.leaveGroup(groupId, userId)` - Leave a group
  - `apiHelper.getGroupMessages(groupId)` - Get group messages
  - `apiHelper.sendGroupMessage(groupId, messageData)` - Send a group message
  - `apiHelper.editGroupMessage(groupId, messageId, messageData)` - Edit a message
  - `apiHelper.deleteGroupMessage(groupId, messageId)` - Delete a message

### 10. Profile
- **Base URL**: `https://venus-ecru.vercel.app/api/ProfileUpdate`
- **Purpose**: Update user profiles
- **Helper Method**: `apiHelper.updateProfile(profileData)`

### 11. Videos
- **Base URLs**:
  - Videos: `https://chyna.vercel.app/api`
  - Shorts: `https://chyna.vercel.app/api/shorts`
- **Helper Methods**:
  - `apiHelper.getVideos()` - Get video feed
  - `apiHelper.getShorts()` - Get shorts feed

### 12. User List Chat
- **Base URL**: `https://1999-theta.vercel.app/api/UserListChat`
- **Purpose**: Get user chat lists
- **Helper Method**: `apiHelper.getUserListChat(postId)`

## Example Usage

### Creating a Post
```javascript
import { apiHelper } from '@/config/api.js';

const postData = {
  message: 'Hello World!',
  username: 'john_doe',
  sessionId: 'abc123',
  profilePic: 'url/to/pic.jpg',
  photo: null,
  tags: ['user1', 'user2'],
  replyTo: null
};

try {
  const response = await apiHelper.createPost(postData);
  console.log('Post created:', response);
} catch (error) {
  console.error('Error creating post:', error);
}
```

### Getting Trending Hashtags
```javascript
import { apiHelper } from '@/config/api.js';

try {
  const hashtags = await apiHelper.getTrendingHashtags(24, 10);
  console.log('Trending hashtags:', hashtags);
} catch (error) {
  console.error('Error fetching hashtags:', error);
}
```

### Sending a Group Message
```javascript
import { apiHelper } from '@/config/api.js';

const messageData = {
  message: 'Hello group!',
  username: 'john_doe',
  timestamp: new Date().toISOString()
};

try {
  await apiHelper.sendGroupMessage('group123', messageData);
  console.log('Message sent');
} catch (error) {
  console.error('Error sending message:', error);
}
```

### Direct Access to Endpoints
If you need direct access to the URLs:
```javascript
import API_CONFIG from '@/config/api.js';

// Access any service URL
const postsUrl = API_CONFIG.SERVICES.POSTS;
const groupsUrl = API_CONFIG.SERVICES.GROUPS;
```

## Modifying Endpoints

To change any endpoint, simply edit the `API_CONFIG.SERVICES` object in `/frontend/src/config/api.js`:

```javascript
const API_CONFIG = {
  SERVICES: {
    POSTS: 'https://new-url.vercel.app/api/posts', // Change this
    // ... other services
  }
};
```

## Environment-Specific Configuration

For different environments (development, staging, production), you can modify the configuration:

```javascript
const ENV = process.env.NODE_ENV || 'development';

const API_CONFIG = {
  SERVICES: {
    POSTS: ENV === 'production' 
      ? 'https://sports321.vercel.app/api/posts'
      : 'http://localhost:3000/api/posts'
  }
};
```

## Error Handling

All API helper methods include built-in error handling. Errors are logged to the console and thrown for you to catch:

```javascript
try {
  await apiHelper.createPost(postData);
} catch (error) {
  // Handle error (show user message, log, etc.)
  console.error('Failed to create post:', error.message);
}
```

## Authentication

Most endpoints require authentication. The `apiHelper.fetch()` method automatically includes:
- `Content-Type: application/json`
- `Accept: application/json`
- `credentials: 'include'` (for cookies)

Additional headers can be passed as needed:
```javascript
await apiHelper.createGroup(groupData, userId);
// Internally adds 'x-user-id' header
```

## Best Practices

1. **Always use helper methods** when available instead of direct fetch calls
2. **Import only what you need**:
   ```javascript
   import { apiHelper } from '@/config/api.js';
   ```
3. **Handle errors gracefully** in your components
4. **Use the centralized config** - don't hardcode URLs in components
5. **Test API changes** in development before deploying

## Migration Guide

If you have existing code with hardcoded URLs, here's how to migrate:

### Before:
```javascript
const response = await fetch('https://sports321.vercel.app/api/posts', {
  method: 'GET',
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json'
  },
  credentials: 'include'
});
```

### After:
```javascript
import { apiHelper } from '@/config/api.js';

const response = await apiHelper.getPosts();
```

## Support

For questions or issues with the API configuration, please contact the development team or create an issue in the repository.
