// API Configuration
// Change these URLs as needed for different environments
const API_CONFIG = {
  // Main authentication and signup URL
  AUTH_BASE_URL: 'https://latestnewsandaffairs.site/public/signup',
  
  // Vercel microservices endpoints
  SERVICES: {
    // Authorization service
    AUTHORIZE: 'https://1999-theta.vercel.app/api/authorize',
    
    // User list chat service
    USER_LIST_CHAT: 'https://1999-theta.vercel.app/api/UserListChat',
    
    // Features/Hashtags service
    FEATURES: 'https://199-ten.vercel.app/api/features',
    
    // Alerts/Notifications service
    ALERTS: 'https://2damnit.vercel.app/api/Alerts',
    
    // Friends service
    FRIENDS: 'https://burger-eta-eight.vercel.app/api/friends',
    
    // Videos service
    VIDEOS: 'https://chyna.vercel.app/api',
    SHORTS: 'https://chyna.vercel.app/api/shorts',
    
    // Posts/Opinions service
    POST_OPINION: 'https://hamburger-henna.vercel.app/api/postOpinion',
    
    // Chat messages service
    MESSAGES: 'https://recent-six.vercel.app/api/message',
    RECENT: 'https://recent-six.vercel.app/api/recent',
    
    // Posts and social interactions service
    POSTS: 'https://sports321.vercel.app/api/posts',
    FOLLOW: 'https://sports321.vercel.app/api/Follow',
    DELETE_POST: 'https://sports321.vercel.app/api/deletePost',
    DELETE_COMMENT: 'https://sports321.vercel.app/api/deletecomment',
    EDIT_POST: 'https://sports321.vercel.app/api/editPost',
    SEARCH: 'https://sports321.vercel.app/api/search',
    NOTIFICATION: 'https://sports321.vercel.app/api/notification',
    
    // Profile update service
    PROFILE_UPDATE: 'https://venus-ecru.vercel.app/api/ProfileUpdate',
    
    // Groups service
    GROUPS: 'https://yupitis.vercel.app/api/groups',
    GROUP_JOIN: 'https://yupitis.vercel.app/api/join',
    GROUP_CANCEL: 'https://yupitis.vercel.app/api/cancel-request',
    GROUP_MEMBERS: 'https://yupitis.vercel.app/api/members',
    GROUP_MESSAGES: 'https://yupitis.vercel.app/api/messages',
  },
  
  // Local development endpoints (fallback)
  NODE_API_BASE_URL: 'http://localhost:3000',
  DJANGO_API_BASE_URL: 'http://localhost:8000',
  
  // Legacy endpoint structure
  endpoints: {
    auth: {
      register: '/api/register',
      login: '/api/login',
      userInfo: '/api/user-info'
    },
    videos: {
      feed: '/api/',
      videoPost: '/api/videopost/',
      createPost: '/api/create-post/',
      trackWatch: '/api/track-watch/'
    }
  }
};

// Helper functions for making API calls
export const apiHelper = {
  /**
   * Generic fetch wrapper with error handling
   * @param {string} url - Full URL to fetch
   * @param {object} options - Fetch options
   * @returns {Promise} Response data
   */
  async fetch(url, options = {}) {
    const config = {
      headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json',
        ...options.headers
      },
      credentials: 'include',
      ...options
    };
    
    try {
      const response = await fetch(url, config);
      
      // Handle different content types
      const contentType = response.headers.get('content-type');
      let data;
      
      if (contentType?.includes('application/json')) {
        data = await response.json();
      } else {
        data = await response.text();
      }
      
      if (!response.ok) {
        throw new Error(data?.error || data || 'Network error');
      }
      
      return data;
    } catch (error) {
      console.error('API Error:', error);
      throw error;
    }
  },
  
  // Posts and opinions
  async createPost(postData) {
    return this.fetch(API_CONFIG.SERVICES.POST_OPINION, {
      method: 'POST',
      body: JSON.stringify(postData)
    });
  },
  
  async getPosts(username = null) {
    const url = username 
      ? `${API_CONFIG.SERVICES.POSTS}?username=${username}`
      : API_CONFIG.SERVICES.POSTS;
    return this.fetch(url);
  },
  
  async deletePost(postId, sessionId) {
    return this.fetch(API_CONFIG.SERVICES.DELETE_POST, {
      method: 'POST',
      body: JSON.stringify({ postId, sessionId })
    });
  },
  
  async editPost(postData) {
    return this.fetch(API_CONFIG.SERVICES.EDIT_POST, {
      method: 'POST',
      body: JSON.stringify(postData)
    });
  },
  
  // Features/Hashtags
  async saveHashtags(postId, hashtags, username) {
    return this.fetch(API_CONFIG.SERVICES.FEATURES, {
      method: 'POST',
      body: JSON.stringify({ postId, hashtags, username })
    });
  },
  
  async getTrendingHashtags(hours, limit) {
    return this.fetch(`${API_CONFIG.SERVICES.FEATURES}?hours=${hours}&limit=${limit}`);
  },
  
  async getHashtagPosts(postId) {
    return this.fetch(`${API_CONFIG.SERVICES.FEATURES}?id=${postId}`);
  },
  
  // Alerts/Notifications
  async sendAlert(alertData) {
    return this.fetch(API_CONFIG.SERVICES.ALERTS, {
      method: 'POST',
      body: JSON.stringify(alertData)
    });
  },
  
  async getNotifications(username) {
    return this.fetch(`${API_CONFIG.SERVICES.NOTIFICATION}?username=${username}`);
  },
  
  // Friends
  async getFriends(username) {
    return this.fetch(`${API_CONFIG.SERVICES.FRIENDS}?username=${encodeURIComponent(username)}`);
  },
  
  // Follow/Unfollow
  async toggleFollow(followData) {
    return this.fetch(API_CONFIG.SERVICES.FOLLOW, {
      method: 'POST',
      body: JSON.stringify(followData)
    });
  },
  
  // Search
  async searchUsers(username, postsOnly = false) {
    return this.fetch(`${API_CONFIG.SERVICES.SEARCH}?username=${username}${postsOnly ? '&postsOnly=true' : ''}`);
  },
  
  // Profile
  async updateProfile(profileData) {
    return this.fetch(API_CONFIG.SERVICES.PROFILE_UPDATE, {
      method: 'POST',
      body: JSON.stringify(profileData)
    });
  },
  
  // Comments
  async deleteComment(commentData) {
    return this.fetch(API_CONFIG.SERVICES.DELETE_COMMENT, {
      method: 'POST',
      body: JSON.stringify(commentData)
    });
  },
  
  // Chat messages
  async getMessages(username, chatWith) {
    return this.fetch(`${API_CONFIG.SERVICES.MESSAGES}?username=${username}&chatWith=${chatWith}`);
  },
  
  async sendMessage(messageData) {
    return this.fetch(API_CONFIG.SERVICES.MESSAGES, {
      method: 'POST',
      body: JSON.stringify(messageData)
    });
  },
  
  async getRecentChats(username) {
    return this.fetch(`${API_CONFIG.SERVICES.RECENT}?username=${username}`);
  },
  
  // Groups
  async getGroups(userId = null, groupId = null) {
    let url = API_CONFIG.SERVICES.GROUPS;
    if (groupId) {
      url += `?id=${groupId}`;
    } else if (userId) {
      url += `?userId=${userId}`;
    }
    return this.fetch(url);
  },
  
  async createGroup(groupData, userId) {
    return this.fetch(API_CONFIG.SERVICES.GROUPS, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-user-id': userId
      },
      body: JSON.stringify(groupData)
    });
  },
  
  async deleteGroup(groupId) {
    return this.fetch(`${API_CONFIG.SERVICES.GROUPS}?id=${groupId}`, {
      method: 'DELETE'
    });
  },
  
  async joinGroup(groupId) {
    return this.fetch(`${API_CONFIG.SERVICES.GROUP_JOIN}?groupId=${groupId}`);
  },
  
  async approveJoinRequest(requestId) {
    return this.fetch(`${API_CONFIG.SERVICES.GROUP_JOIN}?requestId=${requestId}`, {
      method: 'PATCH'
    });
  },
  
  async cancelJoinRequest(groupId) {
    return this.fetch(`${API_CONFIG.SERVICES.GROUP_CANCEL}?groupId=${groupId}`);
  },
  
  async getGroupMembers(groupId) {
    return this.fetch(`${API_CONFIG.SERVICES.GROUP_MEMBERS}?groupId=${groupId}`);
  },
  
  async removeGroupMember(groupId, userId) {
    return this.fetch(`${API_CONFIG.SERVICES.GROUP_MEMBERS}?groupId=${groupId}&userId=${userId}`, {
      method: 'DELETE'
    });
  },
  
  async leaveGroup(groupId, userId) {
    return this.fetch(`${API_CONFIG.SERVICES.GROUP_MEMBERS}?groupId=${groupId}&userId=${userId}`, {
      method: 'DELETE'
    });
  },
  
  async getGroupMessages(groupId) {
    return this.fetch(`${API_CONFIG.SERVICES.GROUP_MESSAGES}?groupId=${groupId}`);
  },
  
  async sendGroupMessage(groupId, messageData) {
    return this.fetch(`${API_CONFIG.SERVICES.GROUP_MESSAGES}?groupId=${groupId}`, {
      method: 'POST',
      body: JSON.stringify(messageData)
    });
  },
  
  async editGroupMessage(groupId, messageId, messageData) {
    return this.fetch(`${API_CONFIG.SERVICES.GROUP_MESSAGES}?groupId=${groupId}&messageId=${messageId}`, {
      method: 'PUT',
      body: JSON.stringify(messageData)
    });
  },
  
  async deleteGroupMessage(groupId, messageId) {
    return this.fetch(`${API_CONFIG.SERVICES.GROUP_MESSAGES}?groupId=${groupId}&messageId=${messageId}`, {
      method: 'DELETE'
    });
  },
  
  // Videos
  async getVideos() {
    return this.fetch(API_CONFIG.SERVICES.VIDEOS);
  },
  
  async getShorts() {
    return this.fetch(API_CONFIG.SERVICES.SHORTS);
  },
  
  // User list chat
  async getUserListChat(postId = null) {
    const url = postId 
      ? `${API_CONFIG.SERVICES.USER_LIST_CHAT}?id=${postId}`
      : API_CONFIG.SERVICES.USER_LIST_CHAT;
    return this.fetch(url);
  },
  
  // Authorization
  async authorize(authData) {
    return this.fetch(API_CONFIG.SERVICES.AUTHORIZE, {
      method: 'POST',
      body: JSON.stringify(authData)
    });
  }
};

// Legacy nodeAPI for backward compatibility
export const nodeAPI = {
  baseURL: API_CONFIG.NODE_API_BASE_URL,
  
  async request(endpoint, options = {}) {
    const url = `${this.baseURL}${endpoint}`;
    return apiHelper.fetch(url, options);
  },
  
  async register(userData) {
    return this.request(API_CONFIG.endpoints.auth.register, {
      method: 'POST',
      body: JSON.stringify(userData)
    });
  },
  
  async login(credentials) {
    return this.request(API_CONFIG.endpoints.auth.login, {
      method: 'POST',
      body: JSON.stringify(credentials)
    });
  },
  
  async getUserInfo(userId) {
    return this.request(`${API_CONFIG.endpoints.auth.userInfo}?userId=${userId}`);
  }
};

export const djangoAPI = {
  baseURL: API_CONFIG.DJANGO_API_BASE_URL,
  
  async request(endpoint, options = {}) {
    const url = `${this.baseURL}${endpoint}`;
    const config = {
      ...options
    };
    
    try {
      const response = await fetch(url, config);
      
      // Handle different response types
      if (response.headers.get('content-type')?.includes('application/json')) {
        const data = await response.json();
        if (!response.ok) {
          throw new Error(data.error || 'Network error');
        }
        return data;
      } else {
        // For file responses (videos)
        if (!response.ok) {
          throw new Error('Network error');
        }
        return response;
      }
    } catch (error) {
      console.error('Django API Error:', error);
      throw error;
    }
  },
  
  // Video methods
  async getVideoFeed(userId) {
    return this.request(`${API_CONFIG.endpoints.videos.feed}?user_id=${userId}`);
  },
  
  async getVideo(videoId, userId = null) {
    const params = new URLSearchParams({ video_id: videoId });
    if (userId) params.append('user_id', userId);
    return this.request(`${API_CONFIG.endpoints.videos.videoPost}?${params}`);
  },
  
  async createVideoPost(formData) {
    return this.request(API_CONFIG.endpoints.videos.createPost, {
      method: 'POST',
      body: formData // FormData object
    });
  },
  
  async trackVideoWatch(videoId, userId = null) {
    return this.request(API_CONFIG.endpoints.videos.trackWatch, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        video_id: videoId,
        user_id: userId
      })
    });
  }
};

export default API_CONFIG;
