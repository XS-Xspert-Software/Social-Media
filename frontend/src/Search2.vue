<template>
  <body>
  <div>
    <!-- Loading Spinner -->
    <div id="loading" v-show="loading" class="loading">
      <div class="spinner"></div>
    </div>

    <!-- Search Input -->
<div v-if="!userProfile" class="search-container" style="margin: 40px 0; display: flex; align-items: center; justify-content: center; gap: 6px;">

  <!-- Back Button (no style changes) -->
  <button @click="$router.push('/')">
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="vertical-align: middle; color: #007bff;font-size: large;">
      <path d="m12 19-7-7 7-7"/>
      <path d="M19 12H5"/>
    </svg>
  </button>

  <!-- Slightly Larger Input -->
  <input
    v-model="searchQuery"
    type="text"
    placeholder="Search..."
    @keyup.enter="searchUser"
    aria-label="Search for a user by username"
    style="width: 70%; padding: 4px 8px; border-radius: 999px; border: 1px solid #555; background-color: #2c2c2c; color: #fff; font-size: 12px; line-height: 1.4; outline: none; height: 35px;"
  />

  <!-- Slightly Larger Button -->
  <button
    @click="searchUser"
    style="background-color: #007bff; color: white; padding: 4px 8px; border: none; border-radius: 999px; cursor: pointer; font-size: 12px; line-height: 1.4; height: 31px;"
  >
    Search
  </button>
</div>

    <!-- Trending Hashtags Section - Now separate from search container -->
    <div v-if="!userProfile" class="trending-container" style="margin: 20px auto; max-width: 600px; padding: 0 20px;">
      <h2 style="color: #fff; font-size: 18px; margin-bottom: 15px;">Trending Hashtags (Last {{ hours || 24 }} hours)</h2>

      <div v-if="trendingLoading" style="color: #ccc; text-align: center; padding: 20px;">
        Loading trending hashtags...
      </div>
      
      <div v-else-if="trendingError" style="color: #ff6b6b; text-align: center; padding: 20px;">
        Error: {{ trendingError }}
      </div>
      
      <div v-else>
        <div v-if="trendingHashtags.length === 0" style="color: #999; text-align: center; padding: 20px;">
          No trending hashtags found.
        </div>
        
        <ul v-else style="list-style: none; padding: 0; margin: 0;">
          <li v-for="hashtag in trendingHashtags" :key="hashtag.hashtag" 
              style="background: linear-gradient(135deg, #1a1a1a, #2a2a2a); border-radius: 12px; padding: 15px; margin-bottom: 12px; border-left: 3px solid #007bff;">
            
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px;">
              <strong style="color: #007bff; font-size: 16px;">#{{ hashtag.hashtag }}</strong>
              <span style="color: #999; font-size: 12px;">
                {{ hashtag.count }} posts, {{ hashtag.unique_user_count }} users
              </span>
            </div>
            
            <div style="color: #aaa; font-size: 11px; margin-bottom: 10px;">
              <small>First: {{ formatDate(hashtag.first_seen) }}</small> • 
              <small>Last: {{ formatDate(hashtag.last_seen) }}</small>
            </div>

            <div v-if="hashtag.recent_posts && hashtag.recent_posts.length" style="margin-top: 10px;">
              <small style="color: #ccc; display: block; margin-bottom: 8px;">Recent posts:</small>
              <ul style="list-style: none; padding: 0; margin: 0;">
                <li v-for="post in hashtag.recent_posts" :key="post.post_id + post.created_at"
                    style="display: flex; align-items: center; padding: 6px 0; border-bottom: 1px solid #333;">
                  <img 
                    v-if="post.profile_picture"
                    :src="post.profile_picture"
                    alt="User pic"
                    class="profile-pic"
                    style="width: 24px; height: 24px; border-radius: 50%; object-fit: cover; margin-right: 8px;"
                  />
                  <span style="color: #ddd; font-size: 12px; flex: 1;">
                    {{ post.username }} - {{ formatDate(post.created_at) }}
                  </span>
                  <a :href="`/post/${post._id}`" target="_blank" 
                  
                     style="color: #007bff; font-size: 11px; text-decoration: none; margin-left: 8px;">
                    View
                  </a>
                </li>
              </ul>
            </div>
          </li>
        </ul>
      </div>
    </div>

    <!-- User Profile -->
   <div v-if="userProfile" class="user-profile" style=" margin: 20px 0;border: none; position: relative;">
  <button
    @click="resetSearch"
    style="
      background: none; 
      border: none; 
      color: #007bff; 
      cursor: pointer; 
      margin-bottom: 10px; 
      position: absolute; 
      left: 20px; 
      top: 20px;
      transition: background-color 0.2s ease;
    "
    @mouseover="$event.target.style.backgroundColor = 'rgba(0, 123, 255, 0.1)'"
    @mouseout="$event.target.style.backgroundColor = 'transparent'"
    aria-label="Back to search"
  >
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none"
         stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
      <path d="m12 19-7-7 7-7"/>
      <path d="M19 12H5"/>
    </svg>
  </button>
 
      <div style="display: flex; align-items: flex-start; gap: 20px; margin-top: 40px;">
  <!-- Profile Picture (larger and properly cropped) -->
  <div class="profile-picture"
       style="width: 100px; height: 100px; border-radius: 50%; overflow: hidden; margin-top: 20px; flex-shrink: 0;">
    <img 
      :src="userProfile.profilePicture || 'pfp2.jpg'" 
      :alt="`${userProfile.username}'s profile picture`"
      style="width: 100px; height: 100px; object-fit: cover; object-position: center;" />
  </div>

  <!-- User Info -->
  <div class="user-info"
       style="color: #f0f0f0; animation: fadeIn 0.8s ease;">
       
    <h2 style="font-size: 22px;">{{ userProfile.username }}</h2>

    <p v-if="userProfile.description" style="font-size: 17px; color: #ccc;">
      <strong>Description:</strong> {{ userProfile.description }}
    </p>

    <p v-if="userProfile.created_at" style="font-size: 17px; color: #bbb;">
      <strong>Created At:</strong> {{ userProfile.created_at }}
    </p>

    <p v-if="userProfile.Music" style="font-size: 17px; color: #bbb;">
      <strong>Music:</strong> {{ userProfile.Music }}
    </p>
  </div>
</div>

        
      <!-- Social Action Buttons -->
      <div v-if="userProfile.username !== loggedInUsername" class="social-actions" style="margin: 15px 0; display: flex; justify-content: center; gap: 10px; flex-wrap: wrap;">
        <!-- Follow/Unfollow Button -->
        <button
          @click="toggleFollow"
          :disabled="actionLoading"
          :style="{
            backgroundColor: relationshipStatus.isFollowing ? '#dc3545' : '#28a745',
            color: 'white',
            padding: '8px 16px',
            border: 'none',
            borderRadius: '20px',
            cursor: actionLoading ? 'not-allowed' : 'pointer',
            fontSize: '14px',
            opacity: actionLoading ? 0.6 : 1
          }"
        >
          {{ actionLoading ? 'Loading...' : (relationshipStatus.isFollowing ? 'Unfollow' : 'Follow') }}
        </button>

        <!-- Friend Request Button -->
        <button
          @click="toggleFriendship"
          :disabled="actionLoading"
          :style="{
            backgroundColor: getFriendButtonColor(),
            color: 'white',
            padding: '8px 16px',
            border: 'none',
            borderRadius: '20px',
            cursor: actionLoading ? 'not-allowed' : 'pointer',
            fontSize: '14px',
            opacity: actionLoading ? 0.6 : 1
          }"
        >
          {{ actionLoading ? 'Loading...' : getFriendButtonText() }}
        </button>
        
        <button
          @click="startChat"
          style="
            background-color: #007bff;
            color: white;
            padding: 8px 16px;
            border: none;
            border-radius: 20px;
            cursor: pointer;
            font-size: 14px;
          "
        >
          Message
        </button>
      </div>

      <!-- Relationship Stats -->
      <div class="relationship-stats" style="margin: 10px 0; display: flex; justify-content: center; gap: 20px; font-size: 12px; color: #aaa;">
        <span>Followers: {{ userProfile.followersCount || 0 }}</span>
        <span>Following: {{ userProfile.followingCount || 0 }}</span>
        <span>Friends: {{ userProfile.friendsCount || 0 }}</span>
      </div>
    </div>

    <!-- No User Found -->
    <div v-if="searched && !userProfile" class="no-user" style="text-align: center; color: #ccc; margin: 20px 0;">
      <p>User not found.</p>
      <button @click="$router.push('/')" style="background-color: #007bff; color: white; padding: 8px 16px; border: none; border-radius: 25px; cursor: pointer;">
        Back to Feed
      </button>
    </div>

    <!-- User Posts -->
       <div v-if="userProfile && posts.length" class="posts-container">
<div v-if="userProfile && getUserPosts.length" class="posts-container">
  <div v-for="post in getUserPosts" :key="post._id" class="post-card" :data-id="post._id" :data-liked-by="JSON.stringify(post.likedBy || [])">
    
    <!-- Reply Preview -->
    <div v-if="post.replyTo" class="reply-preview" style="background: linear-gradient(135deg, #1a1a1a, #2a2a2a); border-left: 2px solid #00b4d8; padding: 10px; margin-bottom: 12px; border-radius: 8px; box-shadow: 0 0 6px rgba(0, 180, 216, 0.3);">
        <div class="reply-header" style="display: flex; align-items: center; gap: 10px; margin-bottom: 6px;">
          <img :src="post.replyTo.profilePicture || 'https://latestnewsandaffairs.site/public/pfp.jpg'" alt="User Profile Picture" style="width: 28px; height: 28px; border-radius: 50%; object-fit: cover; border: 1px solid #444;" />
          <div style="display: flex; flex-direction: column;">
            <strong style="color: #00b4d8;">{{ post.replyTo.username }}</strong>
            <small style="color: #999;">{{ postsStore.formatTimestamp(post.replyTo.timestamp) }}</small>
          </div>
      </div>
      <div @click="$router.push(`/post/${post.replyTo._id}`)">
        <p class="preview-message clickable" v-html="postsStore.parseMessage(post.replyTo.message)"></p>
      </div>
      <img v-if="post.replyTo.photo" :src="post.replyTo.photo" alt="Replied Post Image" class="preview-image" />
    </div>
    
    <!-- Quote Preview -->
    <div v-if="post.quoteTo" class="preview-card quote-preview">
      <div class="preview-header">
        <img :src="post.quoteTo.profilePicture || 'https://latestnewsandaffairs.site/public/pfp.jpg'" alt="User Profile Picture" class="preview-avatar" />
        <div class="preview-user-info">
          <strong class="preview-username">{{ post.quoteTo.username }}</strong>
          <small class="preview-timestamp">{{ postsStore.formatTimestamp(post.quoteTo.timestamp) }}</small>
        </div>
      </div>
      <p class="preview-message" v-html="postsStore.parseMessage(post.quoteTo.message)"></p>
      <img v-if="post.quoteTo.photo" :src="post.quoteTo.photo" alt="Quoted Post Image" class="preview-image" />
    </div>
    
    <!-- Post Header -->
    <div class="post-header">
      <div class="profile-picture clickable" @click="redirectToUserProfile(post.username)">
        <img :src="post.profilePicture || 'pfp2.jpg'" :alt="`${post.username}'s profile picture`" />
      </div>
      <div class="username clickable" @click="postsStore.redirectToUserProfile(post.username)">
        <strong>{{ post.username }}</strong>
        <span class="verified-badge" title="Verified">
          <i class="fa-solid fa-circle-check"></i>
        </span>
      </div>
    </div>
    
    <!-- Post Message -->
    <p class="post-message" v-html="postsStore.parseMessage(post.message)" @click="$router.push(`/post/${post._id}`)"></p>
    
    <!-- Post Image -->
    <img v-if="post.photo" :src="post.photo" alt="Post Image" class="post-image" @click="$router.push(`/post/${post._id}`)" />
    
    <!-- Post Timestamp -->
    <div class="post-timestamp">
      <small>{{ postsStore.formatTimestamp(post.timestamp) }}</small>
    </div>
    
    <!-- Actions -->
    <div class="actions">
      <button class="action-btn like-btn" :class="{ liked: post.likedBy?.includes(postsStore.loggedInUsername) }" @click="postsStore.likePost(post._id)">
        <svg viewBox="0 0 24 24">
          <path d="M1 21h4V9H1v12zM23 10c0-1.1-.9-2-2-2h-6.31l.95-4.57.03-.32a1 1 0 0 0-.29-.7L14 2 7.59 8.41A1.98 1.98 0 0 0 7 9.83V19a2 2 0 0 0 2 2h9a2 2 0 0 0 2-2l1-7v-.01L23 10z"/>
        </svg>
        {{ post.likes || 0 }}
      </button>
      
      <button class="action-btn quote-btn" @click="postsStore.quotePost(post)">
        <svg viewBox="0 0 24 24">
          <path d="M5 17h3v-9h2V7h-5v1h2v9zm9 0h3v-9h2V7h-5v1h2v9z"/>
        </svg>
        Quote
      </button>
      
      <button class="comment-btn" @click="$router.push(`/post/${post._id}`)" style="color: #1da1f2; max-height: 40px; margin: 0%; border: none; padding: 0%;">
          <svg class="round comments" viewBox="0 0 24 24" width="20" height="20" fill="currentColor" style="display: inline-flex; align-items: center; justify-content: center; margin-bottom: 10px;">
            <path d="M12 3C6.48 3 2 6.92 2 11.5c0 2.14 1.06 4.1 2.83 5.6L4 21l3.65-1.95c1.29.45 2.7.7 4.35.7 5.52 0 10-3.92 10-8.5S17.52 3 12 3z"/>
          </svg>
          ({{ post.comments?.length || 0 }})
        </button>
      
      <button class="action-btn tweet-btn" @click="tweetPost(post._id, post.username)">
        <svg viewBox="0 0 24 24">
          <path d="M22.46 6c-.77.35-1.6.58-2.46.69a4.3 4.3 0 0 0 1.88-2.38c-.82.49-1.73.83-2.69 1.02A4.26 4.26 0 0 0 15.88 4c-2.35 0-4.27 1.92-4.27 4.29 0 .34.04.67.11 1-3.55-.18-6.71-1.89-8.82-4.48-.37.63-.58 1.37-.58 2.15 0 1.49.76 2.81 1.91 3.58-.7-.02-1.36-.22-1.94-.54v.05c0 2.08 1.48 3.82 3.44 4.21-.36.1-.74.15-1.13.15-.28 0-.55-.03-.81-.08.55 1.73 2.15 2.99 4.04 3.03-1.48 1.16-3.34 1.85-5.36 1.85-.35 0-.69-.02-1.03-.06 1.91 1.23 4.18 1.94 6.62 1.94 7.94 0 12.29-6.58 12.29-12.29 0-.19 0-.37-.01-.56.84-.61 1.57-1.37 2.15-2.24z"/>
        </svg>
        Tweet
      </button>
      
      <button v-if="post.username === postsStore.loggedInUsername || post.sessionId === postsStore.sessionId" class="action-btn" @click="postsStore.editPost(post._id, post.username)">
        Edit
      </button>
      
      <button v-if="post.username === postsStore.loggedInUsername || post.sessionId === postsStore.sessionId" class="action-btn" @click="postsStore.deletePost(post._id)">
        Delete
      </button>
    </div>
  </div>
</div>

<div v-if="postsStore.showModal" class="modal">
  <div class="modal-content">
    <p>{{ postsStore.modalMessage }}</p>
    <div class="modal-actions">
      <button class="modal-cancel" @click="postsStore.closeModal">Cancel</button>
      <button class="modal-confirm" @click="postsStore.modalAction">Yes, {{ postsStore.modalActionText }}</button>
    </div>
  </div>
</div>

</div>
</div>
</body>
</template>

<script setup>
import { ref, onMounted, watch, inject, computed } from 'vue';
import debounce from 'lodash/debounce';
import { usePostsStore } from './stores/postsStore';
import { useRouter, useRoute, onBeforeRouteUpdate } from 'vue-router';
import { useTrendingHashtags } from './useTrendingHashtags.js';

const { trendingHashtags, loading: trendingLoading, error: trendingError, formatDate } = useTrendingHashtags(24, 20);

const postsStore = usePostsStore();
// Use completely separate posts management for user profiles
const userPosts = ref([]);
const posts = computed(() => userPosts.value); // Override posts reference

const notify = inject('notify');
const router = useRouter();
const route = useRoute();

const getUserPosts = computed(() => {
  if (!userProfile.value?.username) return [];
  return postsStore.posts.filter(post => 
    post.username === userProfile.value.username
  );
});

const userId = ref(localStorage.getItem('userId') || '');
const username = ref(route.params.username ?? '');
const searchQuery = ref(route.params.username ?? '');
const userProfile = ref(null);
const searched = ref(false);
const actionLoading = ref(false);
const loggedInUsername = ref(localStorage.getItem('username') || '');
const loading = ref(false);
const relationshipStatus = ref({ isFollowing: false, friendshipStatus: 'none' });

// Computed property to determine if we should show hashtags
const shouldShowHashtags = computed(() => {
  // Show hashtags only when:
  // 1. No user profile is loaded AND
  // 2. We're on the search page (route name is what you use for search) AND 
  // 3. No search has been performed yet OR search returned no results
  return !userProfile.value && (!searched.value || (searched.value && !userProfile.value));
});

// Follow/Unfollow functionality
const toggleFollow = async () => {
  if (!userProfile.value || actionLoading.value) return;

  actionLoading.value = true;
  try {
    const action = relationshipStatus.value.isFollowing ? 'unfollow' : 'follow';

    const response = await fetch(`https://sports321.vercel.app/api/Follow`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        action,
        follower: loggedInUsername.value,
        following: userProfile.value.username
      })
    });

    if (!response.ok) throw new Error('Failed to update follow status');

    relationshipStatus.value.isFollowing = !relationshipStatus.value.isFollowing;

    await fetchUserData(userProfile.value.username);

    if (relationshipStatus.value.isFollowing) {
     notify('Successfully followed user', false);
    } else {
     notify('Successfully unfollowed user', false);
    }
  } catch (error) {
    console.error('Error toggling follow:', error);
   notify('Failed to update follow status', true);
  } finally {
    actionLoading.value = false;
  }
};

// Friend request functionality
const toggleFriendship = async () => {
  if (!userProfile.value || actionLoading.value) return;

  actionLoading.value = true;
  try {
    let action = '';
    let body = {
      requester: loggedInUsername.value,
      recipient: userProfile.value.username
    };

    switch (relationshipStatus.value.friendshipStatus) {
      case 'none':
        action = 'add_friend';
        break;
      case 'pending_sent':
        action = 'remove_friend';
        break;
      case 'pending_received':
        action = 'add_friend';
        body = {
          requester: userProfile.value.username,
          recipient: loggedInUsername.value
        };
        break;
      case 'friends':
        action = 'remove_friend';
        break;
    }

    const response = await fetch(`https://sports321.vercel.app/api/Follow`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action, ...body })
    });

    if (!response.ok) throw new Error('Failed to update friendship status');

    switch (relationshipStatus.value.friendshipStatus) {
      case 'none':
        relationshipStatus.value.friendshipStatus = 'pending_sent';
        window.dispatchEvent(new CustomEvent('new-notification', {
          detail: {
            sender: loggedInUsername.value,
            recipient: userProfile.value.username
          }
        }));
        notify('Friend request sent', false);
        break;
      case 'pending_sent':
        relationshipStatus.value.friendshipStatus = 'none';
        notify('Friend request cancelled', false);
        break;
      case 'pending_received':
        relationshipStatus.value.friendshipStatus = 'friends';
        notify('Friend request accepted', false);
        break;
      case 'friends':
        relationshipStatus.value.friendshipStatus = 'none';
        notify('Friend removed', false);
        break;
    }

    await fetchUserData(userProfile.value.username);
  } catch (error) {
    console.error('Error toggling friendship:', error);
    notify('Failed to update friendship status', true);
  } finally {
    actionLoading.value = false;
  }
};

const getFriendButtonText = () => {
  switch (relationshipStatus.value.friendshipStatus) {
    case 'none': return 'Add Friend';
    case 'pending_sent': return 'Cancel Request';
    case 'pending_received': return 'Accept Request';
    case 'friends': return 'Remove Friend';
    default: return 'Add Friend';
  }
};

const getFriendButtonColor = () => {
  switch (relationshipStatus.value.friendshipStatus) {
    case 'none': return '#007bff';
    case 'pending_sent': return '#ffc107';
    case 'pending_received': return '#28a745';
    case 'friends': return '#dc3545';
    default: return '#007bff';
  }
};

const checkRelationshipStatus = async (targetUsername) => {
  if (!loggedInUsername.value || !targetUsername || loggedInUsername.value === targetUsername) {
    relationshipStatus.value = { isFollowing: false, friendshipStatus: 'none' };
    return;
  }
  
  try {
    const response = await fetch(`https://sports321.vercel.app/api/Follow`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ currentUser: loggedInUsername.value, targetUser: targetUsername })
    });

    if (response.ok) {
      const data = await response.json();
      relationshipStatus.value = {
        isFollowing: data.isFollowing || false,
        friendshipStatus: data.friendshipStatus || 'none'
      };
    } else {
      relationshipStatus.value = { isFollowing: false, friendshipStatus: 'none' };
    }
  } catch (error) {
    console.error('Error checking relationship status:', error);
    relationshipStatus.value = { isFollowing: false, friendshipStatus: 'none' };
  }
};

const fetchUserData = async (usernameToFetch) => {
  if (!usernameToFetch) return;

  loading.value = true;
  searched.value = false;

  try {
    // Modified API call to specifically request only the searched user's posts
    const response = await fetch(`https://sports321.vercel.app/api/search?username=${usernameToFetch}&postsOnly=true`, {
      headers: { 'Content-Type': 'application/json' },
    });

    if (!response.ok) {
      searched.value = true;
      if (response.status === 404) {
        userProfile.value = null;
        posts.value = [];
        notify('User not found', true);
        return;
      }
      throw new Error('Failed to fetch user data');
    }

    const data = await response.json();
    searched.value = true;

    const user = data.user;
    console.log('Fetched user data:', user);

    userProfile.value = {
      username: user.username,
      userId: user.id,
      profilePicture: user.profile_picture,
      description: user.description,
      created_at: user.created_at,
      Music: user.Music,
      followersCount: user.followers_count || 0,
      followingCount: user.following_count || 0,
      friendsCount: user.friends_count || 0,
    };

    // Enhanced filtering with multiple checks to ensure only searched user's posts
    const filteredPosts = data.posts ? data.posts
      .filter(post => {
        // Multiple checks to ensure we only get the searched user's posts
        const matchesUsername = post.username === usernameToFetch;
        const matchesAuthor = post.author === usernameToFetch;
        const matchesUserId = post.userId === user.id || post.user_id === user.id;
        
        // Log for debugging
        if (!matchesUsername) {
          console.log(`Filtering out post by ${post.username}, searching for ${usernameToFetch}`);
        }
        
        return matchesUsername || matchesAuthor || matchesUserId;
      })
      .map(post => ({
        ...post,
        comments: post.comments?.map(comment => ({
          ...comment,
          showReplies: false,
          replies: Array.isArray(comment.replies) ? comment.replies : [],
        })) || [],
        likedBy: post.likedBy || [],
        dislikedBy: post.dislikedBy || [],
        views: post.views || 0,
      })) : [];

    // Store posts in local userPosts array, completely separate from global store
    userPosts.value = filteredPosts;
    
    console.log(`Loaded ${filteredPosts.length} posts for user ${usernameToFetch}`);

    await checkRelationshipStatus(usernameToFetch);
  } catch (error) {
    console.error('Error fetching user data:', error);
    searched.value = true;
    userProfile.value = null;
    posts.value = [];
    notify(`Error: ${error.message}`, true);
  } finally {
    loading.value = false;
  }
};


const searchUser = debounce(() => {
  if (!searchQuery.value.trim()) {
   notify('Please enter a username', true);
    return;
  }
  router.push(`/user/${searchQuery.value.trim()}`);
}, 300);

const resetSearch = () => {
  userProfile.value = null;
  searched.value = false;
  searchQuery.value = '';
  userPosts.value = []; // Clear local user posts
  relationshipStatus.value = { isFollowing: false, friendshipStatus: 'none' };
  router.push({ name: 'Posts'});
};

const showUserProfile = (username) => {
  if (username) {
    router.push(`/user/${username}`);
  }
};

const isOwnProfile = () => {
  return loggedInUsername.value && userProfile.value &&
         loggedInUsername.value === userProfile.value.username;
};

const shouldShowRelationshipButtons = () => {
  return loggedInUsername.value && !isOwnProfile();
};

const startChat = () => {
  const user = userProfile.value;

  if (!user || !user.username) {
    notify('Cannot start chat: missing username.', true);
    return;
  }

  const id = user.userId || user._id || null;

  if (!id) {
    notify('Cannot start chat: missing user ID.', true);
    return;
  }

  const updates = {
    chatWith: user.username,
    chatWithId: id,
    profileImage: user.profilePicture || 'default-pfp.jpg'
  };

  Object.entries(updates).forEach(([key, value]) => {
    localStorage.setItem(key, value);
  });

  router.push({
    name: 'Chatbox',
    params: {
       userId: id,  
      username: user.username
    }
  });
};

onMounted(() => {
  if (username.value) {
    fetchUserData(username.value);
  }
});
defineExpose({
  posts,
  userProfile,
  loading,
  searched,
  shouldShowHashtags,
  shouldShowRelationshipButtons,
  isOwnProfile,
  toggleFollow,
  toggleFriendship,
  startChat,
  searchUser,
  resetSearch,
  showUserProfile,
  getFriendButtonText,
  getFriendButtonColor,
  relationshipStatus,
  actionLoading,
  loggedInUsername,
  searchQuery,
  trendingHashtags,
  trendingLoading,
  trendingError,
  formatDate,
});

watch(() => route.params.username, (newUsername) => {
  if (newUsername) {
    username.value = newUsername;
    searchQuery.value = newUsername;
    fetchUserData(newUsername);
  } 
});

watch(() => localStorage.getItem('username'), (newUsername) => {
  loggedInUsername.value = newUsername || '';
  if (userProfile.value) {
    checkRelationshipStatus(userProfile.value.username);
  }
});

</script>

<style src="./Posts.css"></style>
<style>
@keyframes fadeIn {
  from { opacity: 0; transform: translateY(10px); }
  to { opacity: 1; transform: translateY(0); }
}
</style>
