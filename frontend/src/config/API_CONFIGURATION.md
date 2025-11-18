# API Configuration Guide

## 📍 Location
All API endpoints are centralized in: `/frontend/src/config/api.js`

## 🎯 Purpose
This file contains all API endpoints used throughout the application in one easily modifiable location. No more hunting through dozens of files to change an API URL!

## 🔧 How to Modify Endpoints

### 1. Change a Base URL
Edit the `API_BASE_URLS` object in `api.js`:

```javascript
const API_BASE_URLS = {
  POSTS_API: 'https://your-new-url.vercel.app',  // Change this
  // ... other URLs
};
```

### 2. Add a New Endpoint
Add to the `ENDPOINTS` object:

```javascript
const ENDPOINTS = {
  // Existing categories...
  
  // Your new category
  myNewFeature: {
    getData: `${API_BASE_URLS.POSTS_API}/api/my-endpoint`,
  },
};
```

### 3. Update Existing Endpoint
Find the endpoint in the `ENDPOINTS` object and modify:

```javascript
const ENDPOINTS = {
  posts: {
    getPosts: `${API_BASE_URLS.POSTS_API}/api/new-posts-endpoint`,  // Updated
  },
};
```

## 📚 Available Endpoints

### Posts & Feed
- **Get Posts**: `ENDPOINTS.posts.getPosts`
- **Search Posts**: `ENDPOINTS.posts.searchPosts`
- **Edit Post**: `ENDPOINTS.posts.editPost`
- **Delete Post**: `ENDPOINTS.posts.deletePost`
- **Delete Comment**: `ENDPOINTS.posts.deleteComment`
- **Get Post Details**: `ENDPOINTS.posts.getPostDetails`

### User Management
- **Authorize User**: `ENDPOINTS.users.authorize`
- **Get User List**: `ENDPOINTS.users.getUserList`

### Profile
- **Update Profile**: `ENDPOINTS.profile.update`

### Friends
- **Get Friends**: `ENDPOINTS.friends.getFriends`
- **Follow/Unfollow**: `ENDPOINTS.friends.follow`

### Messages (Direct Chat)
- **Get Messages**: `ENDPOINTS.messages.getMessages`
- **Send Message**: `ENDPOINTS.messages.sendMessage`
- **Delete Message**: `ENDPOINTS.messages.deleteMessage`
- **Update Message**: `ENDPOINTS.messages.updateMessage`
- **Get Recent**: `ENDPOINTS.messages.getRecent`

### Groups
- **Get Groups**: `ENDPOINTS.groups.getGroups`
- **Get Group Details**: `ENDPOINTS.groups.getGroupDetails`
- **Update Group**: `ENDPOINTS.groups.updateGroup`
- **Get Members**: `ENDPOINTS.groups.getMembers`
- **Remove Member**: `ENDPOINTS.groups.removeMember`
- **Leave Group**: `ENDPOINTS.groups.leaveGroup`
- **Get Messages**: `ENDPOINTS.groups.getMessages`
- **Send Message**: `ENDPOINTS.groups.sendMessage`
- **Update Message**: `ENDPOINTS.groups.updateMessage`
- **Delete Message**: `ENDPOINTS.groups.deleteMessage`
- **Join Group**: `ENDPOINTS.groups.joinGroup`
- **Handle Join Request**: `ENDPOINTS.groups.handleJoinRequest`
- **Cancel Request**: `ENDPOINTS.groups.cancelRequest`

### Videos
- **Get Feed**: `ENDPOINTS.videos.getFeed`

### Features & Trending
- **Post Feature**: `ENDPOINTS.features.postFeature`
- **Get Trending**: `ENDPOINTS.features.getTrending`

### Opinions
- **Post Opinion**: `ENDPOINTS.opinions.postOpinion`

### Alerts
- **Send Alert**: `ENDPOINTS.alerts.sendAlert`

## 🛠️ Helper Functions

### apiRequest(url, options)
Generic API request helper with error handling:

```javascript
import { apiRequest } from '@/config/api';

const data = await apiRequest(ENDPOINTS.posts.getPosts, {
  method: 'GET',
  headers: { 'Custom-Header': 'value' }
});
```

### buildUrl(baseUrl, params)
Build URLs with query parameters:

```javascript
import { buildUrl, ENDPOINTS } from '@/config/api';

const url = buildUrl(ENDPOINTS.posts.getPosts, {
  page: 1,
  limit: 10,
  sort: 'latest'
});
// Result: https://sports321.vercel.app/api/posts?page=1&limit=10&sort=latest
```

## 📖 Usage Examples

### In a Vue Component
```javascript
import { ENDPOINTS, apiRequest } from '@/config/api';

// Get posts
const posts = await apiRequest(ENDPOINTS.posts.getPosts + '?page=1');

// Send message
await apiRequest(ENDPOINTS.messages.sendMessage, {
  method: 'POST',
  body: JSON.stringify({ message: 'Hello!' })
});
```

### In a Pinia Store
```javascript
import { ENDPOINTS, apiRequest } from '@/config/api';

export const useMyStore = defineStore('myStore', {
  actions: {
    async fetchData() {
      const data = await apiRequest(ENDPOINTS.posts.getPosts);
      this.posts = data.posts;
    }
  }
});
```

## 🔄 Migration Status

### Currently Using Vercel APIs ✅
All endpoints are now pointing to Vercel serverless functions for better performance and scalability.

### Legacy Backends (Commented Out)
The old Node.js and Django backends are commented out but kept in the config for open-source contributors who want to run the backend locally.

To re-enable local backend:
1. Uncomment the legacy endpoints in `api.js`
2. Update imports to use local URLs
3. Start your local backend servers

## 🚨 Important Notes

1. **Development Mode**: In development, some URLs are automatically proxied through Vite to avoid CORS issues
2. **Environment-Specific**: You can add environment-specific URLs using `import.meta.env`
3. **Console Logging**: All API requests are logged to console for debugging
4. **Error Handling**: Errors are thrown and should be caught by calling code

## 📝 Contributing

When adding new features that require API calls:
1. Add the endpoint to `api.js` in the appropriate category
2. Document it in this README
3. Use the `apiRequest` helper instead of raw fetch calls
4. Add proper error handling

## 🔗 Related Files

- Main API Config: `/frontend/src/config/api.js`
- Stores using APIs:
  - `/frontend/src/stores/postsStore.js`
  - `/frontend/src/stores/userStore.js`
  - `/frontend/src/stores/friendsStore.js`
  - `/frontend/src/stores/grouplist.js`
