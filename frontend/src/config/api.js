/**
 * API Configuration
 * Centralized location for all API endpoints used in the application
 * 
 * TO MODIFY ENDPOINTS:
 * 1. Update the base URLs below for different environments
 * 2. Update individual endpoints in the ENDPOINTS object
 * 3. Save and restart your dev server
 */

// ====== BASE URLs ======
// These are the main API base URLs for different services
const API_BASE_URLS = {
  // Legacy Node.js backend (currently commented out in favor of Vercel)
  // NODE_API: 'http://localhost:3000',
  
  // Legacy Django backend (currently commented out in favor of Vercel)
  // DJANGO_API: 'http://localhost:8000',
  
  // Vercel Serverless Functions - Primary APIs
  POSTS_API: 'https://sports321.vercel.app',           // Posts, comments, likes
  AUTH_API: 'https://1999-theta.vercel.app',           // User authentication & user list
  MESSAGES_API: 'https://recent-six.vercel.app',       // Direct messages
  GROUPS_API: 'https://yupitis.vercel.app',            // Group chats
  FRIENDS_API: 'https://burger-eta-eight.vercel.app',  // Friends list
  PROFILE_API: 'https://venus-ecru.vercel.app',        // Profile updates
  FEATURES_API: 'https://199-ten.vercel.app',          // Features & trending hashtags & post details
  OPINIONS_API: 'https://hamburger-henna.vercel.app',  // Post opinions
  ALERTS_API: 'https://2damnit.vercel.app',            // Alerts
  VIDEOS_API: 'https://chyna.vercel.app',              // Videos feed
};

// Optional local/backend proxy for legacy routes (falls back to Vite proxy)
const NODE_API_BASE = import.meta?.env?.VITE_NODE_API || '/api';

// ====== ALL API ENDPOINTS ======
// Organized by feature/service for easy management
const ENDPOINTS = {
  // --- POSTS & FEED ---
  posts: {
    getPosts: `${API_BASE_URLS.POSTS_API}/api/posts`,              // GET posts feed
    searchPosts: `${API_BASE_URLS.POSTS_API}/api/search`,          // GET search posts by username
    editPost: `${API_BASE_URLS.POSTS_API}/api/editPost`,           // POST like/comment/reply actions
    deletePost: `${API_BASE_URLS.POSTS_API}/api/deletePost`,       // DELETE post
    deleteComment: `${API_BASE_URLS.POSTS_API}/api/deletecomment`, // DELETE/PUT comment/reply
    getPostDetails: `${API_BASE_URLS.FEATURES_API}/api/UserListChat`, // GET single post with all details
  },

  // --- USER MANAGEMENT ---
  users: {
    authorize: `${API_BASE_URLS.AUTH_API}/api/authorize`,          // POST user authorization
    getUserList: `${API_BASE_URLS.AUTH_API}/api/UserListChat`,     // GET list of users for chat
  },

  // --- PROFILE ---
  profile: {
    update: `${API_BASE_URLS.PROFILE_API}/api/ProfileUpdate`,      // POST update profile (bio, avatar, banner)
  },

  // --- FRIENDS ---
  friends: {
    getFriends: `${API_BASE_URLS.FRIENDS_API}/api/friends`,        // GET friends list
    follow: `${API_BASE_URLS.POSTS_API}/api/Follow`,               // POST follow/unfollow user
  },

  // --- MESSAGES (Direct Chat) ---
  messages: {
    getMessages: `${API_BASE_URLS.MESSAGES_API}/api/message`,      // GET messages between users
    sendMessage: `${API_BASE_URLS.MESSAGES_API}/api/message`,      // POST send message
    deleteMessage: `${API_BASE_URLS.MESSAGES_API}/api/message`,    // DELETE message
    updateMessage: `${API_BASE_URLS.MESSAGES_API}/api/message`,    // PUT update message
    getRecent: `${API_BASE_URLS.MESSAGES_API}/api/recent`,         // GET recent conversations
  },

  // --- GROUPS ---
  groups: {
    getGroups: `${API_BASE_URLS.GROUPS_API}/api/groups`,           // GET all groups for user
    getGroupDetails: `${API_BASE_URLS.GROUPS_API}/api/groups`,     // GET specific group by id
    updateGroup: `${API_BASE_URLS.GROUPS_API}/api/groups`,         // PUT update group settings
    getMembers: `${API_BASE_URLS.GROUPS_API}/api/members`,         // GET group members
    removeMember: `${API_BASE_URLS.GROUPS_API}/api/members`,       // DELETE remove member
    leaveGroup: `${API_BASE_URLS.GROUPS_API}/api/members`,         // DELETE leave group
    getMessages: `${API_BASE_URLS.GROUPS_API}/api/messages`,       // GET group messages
    sendMessage: `${API_BASE_URLS.GROUPS_API}/api/messages`,       // POST send group message
    updateMessage: `${API_BASE_URLS.GROUPS_API}/api/messages`,     // PUT update group message
    deleteMessage: `${API_BASE_URLS.GROUPS_API}/api/messages`,     // DELETE group message
    joinGroup: `${API_BASE_URLS.GROUPS_API}/api/join`,             // POST join group
    handleJoinRequest: `${API_BASE_URLS.GROUPS_API}/api/join`,     // PUT approve/reject join request
    cancelRequest: `${API_BASE_URLS.GROUPS_API}/api/cancel-request`, // POST cancel join request
  },

  // --- VIDEOS ---
  videos: {
    getFeed: `${API_BASE_URLS.VIDEOS_API}/api`,                    // GET video feed
  },

  // --- FEATURES & TRENDING ---
  features: {
    postFeature: `${API_BASE_URLS.FEATURES_API}/api/features`,     // POST create feature
    getTrending: `${API_BASE_URLS.FEATURES_API}/api/features`,     // GET trending hashtags
  },

  // --- OPINIONS ---
  opinions: {
    postOpinion: `${API_BASE_URLS.OPINIONS_API}/api/postOpinion`,  // POST share opinion
  },

  // --- ALERTS ---
  alerts: {
    sendAlert: `${API_BASE_URLS.ALERTS_API}/api/Alerts`,           // POST send alert
  },
};

// ====== LEGACY ENDPOINTS (Commented out - for reference) ======
// These were the old localhost endpoints that are no longer actively used
// Kept here for open-source tinkerers who want to run backend locally
/*
const LEGACY_ENDPOINTS = {
  node: {
    register: 'http://localhost:3000/api/register',
    login: 'http://localhost:3000/api/login',
    userInfo: 'http://localhost:3000/api/user-info',
  },
  django: {
    videoFeed: 'http://localhost:8000/api/',
    videoPost: 'http://localhost:8000/api/videopost/',
    createPost: 'http://localhost:8000/api/create-post/',
    trackWatch: 'http://localhost:8000/api/track-watch/',
  },
};
*/

// ====== HELPER FUNCTIONS ======

/**
 * Generic API request helper
 * Handles fetch requests with proper error handling
 */
export async function apiRequest(url, options = {}) {
  try {
    // In development, route legacy API calls through Vite proxy to avoid CORS
    let finalUrl = url;
    if (import.meta?.env?.DEV && typeof url === 'string') {
      try {
        const urlObj = new URL(url);
        if (urlObj.hostname === 'sports321.vercel.app') {
          finalUrl = url.replace('https://sports321.vercel.app', '/oldapi');
        }
      } catch (e) {
        // If url is not valid, keep original
      }
    }

    const config = {
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
      credentials: 'include',
      mode: 'cors',
      ...options,
    };

    console.log('API Request:', finalUrl, config.method || 'GET');
    
    const response = await fetch(finalUrl, config);
    
    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`${response.status}: ${errorText || response.statusText}`);
    }

    // Handle different response types
    const contentType = response.headers.get('content-type');
    if (contentType?.includes('application/json')) {
      return await response.json();
    }
    
    // For non-JSON responses (like file downloads)
    return response;
  } catch (error) {
    console.error('API Request Failed:', error);
    throw error;
  }
}

/**
 * Build URL with query parameters
 */
export function buildUrl(baseUrl, params = {}) {
  const url = new URL(baseUrl);
  Object.entries(params).forEach(([key, value]) => {
    if (value !== null && value !== undefined) {
      url.searchParams.append(key, value);
    }
  });
  return url.toString();
}

// Lightweight helper for legacy Node endpoints
const nodeAPI = {
  baseUrl: NODE_API_BASE,
  request: async (endpoint = '', options = {}) => {
    const target = `${NODE_API_BASE}${endpoint}`;
    try {
      return await apiRequest(target, options);
    } catch (error) {
      // Add helpful context about which endpoint failed
      throw new Error(`nodeAPI.request failed for endpoint "${endpoint}" (${target}): ${error.message}`);
    }
  },
};

// ====== EXPORTS ======
export { API_BASE_URLS, ENDPOINTS, nodeAPI };

// Default export for backward compatibility
export default {
  baseUrls: API_BASE_URLS,
  endpoints: ENDPOINTS,
  nodeAPI,
};
