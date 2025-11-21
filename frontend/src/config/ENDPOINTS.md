# API Endpoints Quick Reference

## All Vercel API URLs in One Place

### Authentication & Authorization
```
AUTH_BASE_URL: https://latestnewsandaffairs.site/public/signup
AUTHORIZE: https://1999-theta.vercel.app/api/authorize
```

### Posts & Social
```
POST_OPINION: https://hamburger-henna.vercel.app/api/postOpinion
POSTS: https://sports321.vercel.app/api/posts
FOLLOW: https://sports321.vercel.app/api/Follow
DELETE_POST: https://sports321.vercel.app/api/deletePost
DELETE_COMMENT: https://sports321.vercel.app/api/deletecomment
EDIT_POST: https://sports321.vercel.app/api/editPost
SEARCH: https://sports321.vercel.app/api/search
NOTIFICATION: https://sports321.vercel.app/api/notification
```

### Hashtags & Features
```
FEATURES: https://199-ten.vercel.app/api/features
```

### Alerts & Notifications
```
ALERTS: https://2damnit.vercel.app/api/Alerts
```

### Friends
```
FRIENDS: https://burger-eta-eight.vercel.app/api/friends
```

### Chat & Messages
```
MESSAGES: https://recent-six.vercel.app/api/message
RECENT: https://recent-six.vercel.app/api/recent
USER_LIST_CHAT: https://1999-theta.vercel.app/api/UserListChat
```

### Groups
```
GROUPS: https://yupitis.vercel.app/api/groups
GROUP_JOIN: https://yupitis.vercel.app/api/join
GROUP_CANCEL: https://yupitis.vercel.app/api/cancel-request
GROUP_MEMBERS: https://yupitis.vercel.app/api/members
GROUP_MESSAGES: https://yupitis.vercel.app/api/messages
```

### Profile
```
PROFILE_UPDATE: https://venus-ecru.vercel.app/api/ProfileUpdate
```

### Videos
```
VIDEOS: https://chyna.vercel.app/api
SHORTS: https://chyna.vercel.app/api/shorts
```

---

## Quick Usage Examples

### Import
```javascript
import { apiHelper } from '@/config/api.js';
```

### Common Operations
```javascript
// Create post
await apiHelper.createPost(postData);

// Get posts
await apiHelper.getPosts(username);

// Send message
await apiHelper.sendMessage(messageData);

// Get trending hashtags
await apiHelper.getTrendingHashtags(24, 10);

// Join group
await apiHelper.joinGroup(groupId);

// Update profile
await apiHelper.updateProfile(profileData);
```

---

**To modify any endpoint**: Edit `/frontend/src/config/api.js`
