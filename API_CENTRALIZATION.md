# API Endpoints Centralization

## ✅ What Was Done

All API endpoints and Vercel serverless function URLs have been centralized into a single, easily modifiable configuration file.

## 📁 Files Created/Updated

### 1. Main Configuration File
**`/frontend/src/config/api.js`**
- Contains all API base URLs (Vercel endpoints)
- Organized endpoints by feature (posts, users, groups, messages, etc.)
- Helper functions for making API requests
- Legacy backend references (commented out for open-source tinkerers)

### 2. Documentation
**`/frontend/src/config/API_CONFIGURATION.md`**
- Complete guide on how to use and modify endpoints
- Usage examples for Vue components and Pinia stores
- Full list of all available endpoints
- Migration notes

### 3. Quick Reference
**`/frontend/src/config/endpoints.js`**
- Cheat sheet with all endpoints
- Quick copy-paste examples
- Autocomplete-friendly exports

## 🎯 Current API Structure

### Vercel Serverless APIs (Active)
```
sports321.vercel.app       → Posts, comments, likes, follow
1999-theta.vercel.app      → User auth & list
recent-six.vercel.app      → Direct messages
yupitis.vercel.app         → Group chats
burger-eta-eight.vercel.app → Friends
venus-ecru.vercel.app      → Profile updates
199-ten.vercel.app         → Features, trending, post details
hamburger-henna.vercel.app → Opinions
2damnit.vercel.app         → Alerts
chyna.vercel.app           → Videos
```

### Legacy Backends (Commented Out)
```
localhost:3000  → Node.js backend (not actively used)
localhost:8000  → Django backend (not actively used)
```

## 🔧 How to Modify Endpoints

### Quick Change Example
```javascript
// Open: /frontend/src/config/api.js

// Change a base URL:
const API_BASE_URLS = {
  POSTS_API: 'https://your-new-url.vercel.app',  // ← Edit this
};

// Change a specific endpoint:
const ENDPOINTS = {
  posts: {
    getPosts: `${API_BASE_URLS.POSTS_API}/api/new-endpoint`,  // ← Edit this
  },
};
```

### In Your Code
```javascript
// Instead of hardcoded URLs:
// ❌ fetch('https://sports321.vercel.app/api/posts')

// Use centralized config:
// ✅ 
import { ENDPOINTS, apiRequest } from '@/config/api';
const posts = await apiRequest(ENDPOINTS.posts.getPosts);
```

## 📊 Files That Reference APIs

The following files currently have hardcoded API URLs that should eventually migrate to use the centralized config:

### Vue Components
- `/frontend/src/Settings.vue` - 4 hardcoded URLs
- `/frontend/src/GroupChatbox.vue` - 15 hardcoded URLs
- `/frontend/src/App.vue` - 1 hardcoded URL
- `/frontend/src/Videos.vue` - 1 hardcoded URL
- `/frontend/src/RightSidebar.vue` - 2 hardcoded URLs
- `/frontend/src/Search2.vue` - 4 hardcoded URLs
- `/frontend/src/Chatbox.vue` - 4 hardcoded URLs
- `/frontend/src/Float.vue` - 3 hardcoded URLs

### Store Files
- `/frontend/src/stores/postsStore.js` - 8 hardcoded URLs
- `/frontend/src/stores/friendsStore.js` - 1 hardcoded URL
- `/frontend/src/stores/userStore.js` - 1 hardcoded URL
- `/frontend/src/stores/grouplist.js` - 3 hardcoded URLs

### Other Files
- `/frontend/src/recents.js` - 1 hardcoded URL
- `/frontend/src/useTrendingHashtags.js` - 1 hardcoded URL

## 🚀 Next Steps (Optional)

### Phase 1: Use the Config (Recommended)
Start using the centralized config in new code:
```javascript
import { ENDPOINTS, apiRequest } from '@/config/api';
```

### Phase 2: Gradual Migration (Optional)
Gradually migrate existing files to use the centralized config instead of hardcoded URLs. This can be done file-by-file as you work on each component.

### Phase 3: Add Environment Variables (Future)
For multiple environments (dev, staging, prod), you can enhance the config:
```javascript
const API_BASE_URLS = {
  POSTS_API: import.meta.env.VITE_POSTS_API || 'https://sports321.vercel.app',
};
```

## 💡 Benefits

1. **Easy Modifications**: Change an API URL in one place, not 40+ places
2. **Documentation**: All endpoints are documented in one location
3. **Type Safety**: Can add TypeScript definitions later
4. **Consistency**: All API calls use the same helper functions
5. **Testing**: Easy to mock endpoints for testing
6. **Environment Management**: Simple to switch between dev/staging/prod

## 📝 Notes

- The centralized config is **ready to use** in new code
- Existing hardcoded URLs still work (no breaking changes)
- Migration to use the config is optional but recommended
- Legacy backend references are preserved for open-source contributors

## 🔗 Quick Links

- Main Config: `/frontend/src/config/api.js`
- Documentation: `/frontend/src/config/API_CONFIGURATION.md`
- Quick Reference: `/frontend/src/config/endpoints.js`
