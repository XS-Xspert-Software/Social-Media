# 🎯 API Endpoints - Centralized Configuration

All API endpoints are now in **ONE PLACE** for easy modification!

## 🚀 Quick Start

### Modify an Endpoint
1. Open `/frontend/src/config/api.js`
2. Find the URL you want to change
3. Edit it
4. Save - Done! 🎉

### Use in Your Code
```javascript
import { ENDPOINTS, apiRequest } from '@/config/api';

// Get posts
const posts = await apiRequest(ENDPOINTS.posts.getPosts);

// Send a message  
await apiRequest(ENDPOINTS.messages.sendMessage, {
  method: 'POST',
  body: JSON.stringify({ text: 'Hello!' })
});
```

## 📁 File Structure

```
/frontend/src/config/
├── api.js                      ← Main config file (EDIT THIS!)
├── API_CONFIGURATION.md        ← Full documentation
├── endpoints.js                ← Quick reference cheat sheet
└── index.js                    ← Convenient exports

/root/
├── API_CENTRALIZATION.md       ← What was done summary
└── API_ARCHITECTURE.md         ← Visual diagrams
```

## 🔧 All Your APIs

### Currently Active (Vercel Serverless)
| Service | Base URL | Purpose |
|---------|----------|---------|
| Posts | `sports321.vercel.app` | Posts, comments, likes, follow |
| Auth | `1999-theta.vercel.app` | User authentication |
| Messages | `recent-six.vercel.app` | Direct messages |
| Groups | `yupitis.vercel.app` | Group chats |
| Friends | `burger-eta-eight.vercel.app` | Friends list |
| Profile | `venus-ecru.vercel.app` | Profile updates |
| Features | `199-ten.vercel.app` | Trending, features |
| Opinions | `hamburger-henna.vercel.app` | Post opinions |
| Alerts | `2damnit.vercel.app` | Alerts system |
| Videos | `chyna.vercel.app` | Video feed |

### Legacy (Commented Out)
- Node.js: `localhost:3000` (for open-source tinkerers)
- Django: `localhost:8000` (for open-source tinkerers)

## 📖 Full Documentation

For detailed information, see:
- **Full Guide**: `/frontend/src/config/API_CONFIGURATION.md`
- **Quick Reference**: `/frontend/src/config/endpoints.js`
- **Architecture**: `/API_ARCHITECTURE.md`

## 💡 Why This is Awesome

✅ Change URLs in **one place** instead of 40+ files  
✅ Clear documentation of all endpoints  
✅ Consistent error handling  
✅ Easy to switch environments  
✅ Type-safe imports  
✅ Auto-complete support  

## 🎨 Usage Examples

### In a Vue Component
```vue
<script setup>
import { ENDPOINTS, apiRequest, buildUrl } from '@/config/api';

// Simple GET
const fetchPosts = async () => {
  const posts = await apiRequest(ENDPOINTS.posts.getPosts);
  console.log(posts);
};

// GET with params
const searchUser = async (username) => {
  const url = buildUrl(ENDPOINTS.posts.searchPosts, { 
    username, 
    postsOnly: true 
  });
  const results = await apiRequest(url);
  return results;
};

// POST request
const likePost = async (postId) => {
  await apiRequest(ENDPOINTS.posts.editPost, {
    method: 'POST',
    body: JSON.stringify({ 
      postId, 
      username: 'john',
      action: 'like' 
    })
  });
};
</script>
```

### In a Pinia Store
```javascript
import { defineStore } from 'pinia';
import { ENDPOINTS, apiRequest } from '@/config/api';

export const useMyStore = defineStore('myStore', {
  state: () => ({
    posts: [],
    loading: false,
  }),
  
  actions: {
    async fetchPosts() {
      this.loading = true;
      try {
        const data = await apiRequest(ENDPOINTS.posts.getPosts);
        this.posts = data.posts;
      } catch (error) {
        console.error('Failed to fetch:', error);
      } finally {
        this.loading = false;
      }
    }
  }
});
```

## 🔄 Environment Variables (Future)

You can enhance this with environment variables:

```javascript
// In .env
VITE_POSTS_API=https://sports321.vercel.app
VITE_AUTH_API=https://1999-theta.vercel.app

// In api.js
const API_BASE_URLS = {
  POSTS_API: import.meta.env.VITE_POSTS_API || 'https://sports321.vercel.app',
  AUTH_API: import.meta.env.VITE_AUTH_API || 'https://1999-theta.vercel.app',
};
```

## 🤝 Contributing

When adding new API endpoints:
1. Add to `/frontend/src/config/api.js`
2. Update documentation in `API_CONFIGURATION.md`
3. Add to quick reference in `endpoints.js`
4. Test thoroughly!

## 📞 Support

Questions? Check the docs:
- Main config: `/frontend/src/config/api.js`
- Full docs: `/frontend/src/config/API_CONFIGURATION.md`
- Examples: `/frontend/src/config/endpoints.js`
- Architecture: `/API_ARCHITECTURE.md`

---

**Made with ❤️ for easy API management**
