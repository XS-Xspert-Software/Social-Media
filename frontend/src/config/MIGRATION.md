# Migration Guide: Updating Components to Use Centralized API Config

## Overview
This guide helps you update existing Vue components to use the centralized API configuration instead of hardcoded URLs.

## Step 1: Import the API Helper

At the top of your component's `<script>` section, add:

```javascript
import { apiHelper } from '@/config/api.js';
```

Or if you need direct URL access:

```javascript
import API_CONFIG from '@/config/api.js';
```

## Step 2: Replace Hardcoded URLs

### Example 1: Creating a Post

**Before:**
```javascript
const response = await fetch('https://hamburger-henna.vercel.app/api/postOpinion', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json'
  },
  credentials: 'include',
  body: JSON.stringify(postData)
});
```

**After:**
```javascript
const response = await apiHelper.createPost(postData);
```

---

### Example 2: Getting Posts

**Before:**
```javascript
const response = await fetch(`https://sports321.vercel.app/api/posts?username=${username}`, {
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json'
  },
  credentials: 'include'
});
const data = await response.json();
```

**After:**
```javascript
const data = await apiHelper.getPosts(username);
```

---

### Example 3: Sending Messages

**Before:**
```javascript
await fetch('https://recent-six.vercel.app/api/message', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json'
  },
  credentials: 'include',
  body: JSON.stringify({
    username: currentUser,
    chatWith: chatUser,
    message: messageText
  })
});
```

**After:**
```javascript
await apiHelper.sendMessage({
  username: currentUser,
  chatWith: chatUser,
  message: messageText
});
```

---

### Example 4: Hashtags

**Before:**
```javascript
await fetch('https://199-ten.vercel.app/api/features', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json'
  },
  credentials: 'include',
  body: JSON.stringify({
    postId: postId,
    hashtags: hashtags,
    username: username
  })
});
```

**After:**
```javascript
await apiHelper.saveHashtags(postId, hashtags, username);
```

---

### Example 5: Group Operations

**Before:**
```javascript
const response = await fetch(`https://yupitis.vercel.app/api/groups?id=${groupId}`, {
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json'
  },
  credentials: 'include'
});
```

**After:**
```javascript
const data = await apiHelper.getGroups(null, groupId);
```

---

### Example 6: Sending Alerts

**Before:**
```javascript
await fetch('https://2damnit.vercel.app/api/Alerts', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    action: 'send-push-Alert',
    taggedUsers: users,
    postId: postId,
    message: message
  })
});
```

**After:**
```javascript
await apiHelper.sendAlert({
  action: 'send-push-Alert',
  taggedUsers: users,
  postId: postId,
  message: message
});
```

---

## Step 3: Update Error Handling

The apiHelper automatically handles errors and throws them. Update your try-catch blocks:

**Before:**
```javascript
try {
  const response = await fetch(url, options);
  if (!response.ok) {
    throw new Error('Request failed');
  }
  const data = await response.json();
  // Use data
} catch (error) {
  console.error('Error:', error);
}
```

**After:**
```javascript
try {
  const data = await apiHelper.createPost(postData);
  // Use data directly
} catch (error) {
  console.error('Error:', error.message);
}
```

---

## Step 4: When No Helper Method Exists

If you need an endpoint that doesn't have a helper method, use direct URL access:

```javascript
import API_CONFIG from '@/config/api.js';

const response = await fetch(API_CONFIG.SERVICES.YOUR_ENDPOINT, {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json'
  },
  credentials: 'include',
  body: JSON.stringify(data)
});
```

Or use the generic fetch helper:

```javascript
import { apiHelper } from '@/config/api.js';

const data = await apiHelper.fetch(API_CONFIG.SERVICES.YOUR_ENDPOINT, {
  method: 'POST',
  body: JSON.stringify(yourData)
});
```

---

## Complete Component Example

### Before:
```vue
<script>
export default {
  methods: {
    async createPost() {
      try {
        const response = await fetch('https://hamburger-henna.vercel.app/api/postOpinion', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Accept': 'application/json'
          },
          credentials: 'include',
          body: JSON.stringify(this.postData)
        });
        
        if (!response.ok) {
          throw new Error('Failed to create post');
        }
        
        const data = await response.json();
        
        // Save hashtags
        if (this.hashtags.length > 0) {
          await fetch('https://199-ten.vercel.app/api/features', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Accept': 'application/json'
            },
            credentials: 'include',
            body: JSON.stringify({
              postId: data._id,
              hashtags: this.hashtags,
              username: this.username
            })
          });
        }
        
        alert('Post created!');
      } catch (error) {
        alert('Error: ' + error.message);
      }
    }
  }
}
</script>
```

### After:
```vue
<script>
import { apiHelper } from '@/config/api.js';

export default {
  methods: {
    async createPost() {
      try {
        const data = await apiHelper.createPost(this.postData);
        
        // Save hashtags if any
        if (this.hashtags.length > 0) {
          await apiHelper.saveHashtags(data._id, this.hashtags, this.username);
        }
        
        alert('Post created!');
      } catch (error) {
        alert('Error: ' + error.message);
      }
    }
  }
}
</script>
```

---

## Common Replacements Cheat Sheet

| Old Pattern | New Pattern |
|------------|-------------|
| `fetch('https://sports321.vercel.app/api/posts')` | `apiHelper.getPosts()` |
| `fetch('https://hamburger-henna.vercel.app/api/postOpinion')` | `apiHelper.createPost(data)` |
| `fetch('https://recent-six.vercel.app/api/message')` | `apiHelper.sendMessage(data)` |
| `fetch('https://yupitis.vercel.app/api/groups')` | `apiHelper.getGroups()` |
| `fetch('https://199-ten.vercel.app/api/features')` | `apiHelper.saveHashtags(...)` |
| `fetch('https://2damnit.vercel.app/api/Alerts')` | `apiHelper.sendAlert(data)` |
| `fetch('https://venus-ecru.vercel.app/api/ProfileUpdate')` | `apiHelper.updateProfile(data)` |

---

## Testing Your Changes

After migrating a component:

1. Test all API calls in the component
2. Verify error handling works correctly
3. Check network tab in browser DevTools to ensure requests are being made to correct URLs
4. Confirm data is being sent and received as expected

---

## Benefits of Migration

✅ **Single source of truth** - All URLs in one place  
✅ **Easier maintenance** - Change URL once, applies everywhere  
✅ **Consistent error handling** - Standardized across app  
✅ **Reduced code** - Less boilerplate in components  
✅ **Better testing** - Mock API helper instead of fetch  
✅ **Environment flexibility** - Easy to switch between dev/staging/prod

---

## Need Help?

If you encounter an API call that doesn't fit the existing helper methods:

1. Check `api.js` to see if there's a similar method
2. Add a new helper method to `api.js` following the existing pattern
3. Update this migration guide with your new example
4. Share with the team!
