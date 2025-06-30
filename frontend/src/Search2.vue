<template>
  <div>
    <!-- Loading Spinner -->
    <div id="loading" v-show="loading" class="loading">
      <div class="spinner"></div>
    </div>

    <!-- Search Input -->
    <div v-if="!userProfile" class="search-container" style="margin: 20px 0; display: flex; justify-content: center; gap: 10px;">
      <input
        v-model="searchQuery"
        type="text"
        placeholder="Search for a user..."
        class="search-input"
        style="width: 70%; max-width: 400px; padding: 6px 12px; border-radius: 25px; border: 1px solid #444; background-color: #333; color: #fff; font-size: 13px; outline: none; box-shadow: 0 0 5px rgba(0, 0, 0, 0.2);"
        @keyup.enter="searchUser"
        aria-label="Search for a user by username"
      />
      <button
        @click="searchUser"
        style="background-color: #007bff; color: white; padding: 5px 10px; border: none; border-radius: 15px; cursor: pointer; font-size: 14px; transition: background-color 0.3s ease; box-shadow: 0 0 5px rgba(0, 0, 0, 0.2);"
      >
        Search
      </button>
    </div>

    <!-- User Profile -->
    <div v-if="userProfile" class="user-profile" style=" margin: 20px 0;border: none;">
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
    top: 60px;
    transition: background-color 0.2s ease;
  "
  @mouseover="$event.target.style.backgroundColor = 'rgba(0, 123, 255, 0.1)'"
  @mouseout="$event.target.style.backgroundColor = 'transparent'"
  aria-label="Back to search"
>
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
    <path d="m12 19-7-7 7-7"/>
    <path d="M19 12H5"/>
  </svg>
</button>
 
<div style="display: flex; align-items: flex-start; gap: 20px; margin-top: 20px;">
  <!-- Profile Picture (larger and slightly lower) -->
  <div class="profile-picture" 
       style="width: 160px; height: 160px; border-radius: 50%; overflow: hidden; margin-top: 20px;">
    <img 
      :src="userProfile.profilePicture || 'pfp2.jpg'" 
      :alt="`${userProfile.username}'s profile picture`" 
      style="width: 100%; height: 100%; object-fit: cover;" />
  </div>

  <!-- User Info with fade-in and styling -->
  <div class="user-info"
       style="color: #f0f0f0; font-family: 'Inter', 'Segoe UI', Tahoma, sans-serif; animation: fadeIn 0.8s ease;">
       
    <h2 style="font-size: 26px; margin: 0 0 10px; font-weight: 600;">{{ userProfile.username }}</h2>

    <p v-if="userProfile.description" style="font-size: 15px; color: #ccc; margin: 6px 0;">
      {{ userProfile.description }}
    </p>

    <p v-if="userProfile.location" style="font-size: 14px; color: #bbb; margin: 4px 0;">
      <strong>Location:</strong> {{ userProfile.location }}
    </p>

    <p v-if="userProfile.status" style="font-size: 14px; color: #bbb; margin: 4px 0;">
      <strong>Status:</strong> {{ userProfile.status }}
    </p>

    <p v-if="userProfile.profession" style="font-size: 14px; color: #bbb; margin: 4px 0;">
      <strong>Profession:</strong> {{ userProfile.profession }}
    </p>

    <p v-if="userProfile.hobby" style="font-size: 14px; color: #bbb; margin: 4px 0;">
      <strong>Hobby:</strong> {{ userProfile.hobby }}
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
        
      <!-- Chat Button -->


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
<div v-for="post in posts" :key="post._id" class="post-card" :data-id="post._id" :data-liked-by="JSON.stringify(post.likedBy || [])" :data-disliked-by="JSON.stringify(post.dislikedBy || [])">
        <div class="post-header">
    <div class="profile-picture" @click="redirectToUserProfile(post.username)">
      <img :src="post.profilePicture || 'pfp2.jpg'" :alt="`${post.username}'s profile picture`" />
    </div>
    <div class="username" @click="redirectToUserProfile(post.username)">
      <strong>{{ post.username }}</strong>
    </div>
  </div>
        <p class="post-message" style="font-size: 13px; margin-top: 8px; font-family: 'Whitney', 'Helvetica Neue', Helvetica, Arial, sans-serif; cursor: pointer;" @click="openFullScreenPost(post._id)">{{ post.message || "" }}</p>
        <img v-if="post.photo" :src="post.photo" alt="Post Image" style="width: 100%; max-width:300px; max-height:280px; border-radius: 10px; margin-bottom: 10px; cursor: pointer;" @click="openFullScreenPost(post._id)" />
        <div class="post-timestamp"><small>{{ formatTimestamp(post.timestamp) }}</small></div>
        <div class="actions">
<button class="like-btn" :class="{ liked: post.likedBy?.includes(loggedInUsername) }" @click="likePost(post._id)" style="border: none;">
  <svg class="thumbs-up-icon" viewBox="0 0 24 24" width="20" height="20" fill="currentColor">
    <path d="M1 21h4V9H1v12zM23 10c0-1.1-.9-2-2-2h-6.31l.95-4.57.03-.32a1 1 0 0 0-.29-.7L14 2 7.59 8.41A1.98 1.98 0 0 0 7 9.83V19a2 2 0 0 0 2 2h9a2 2 0 0 0 2-2l1-7v-.01L23 10z"/>
  </svg>
  {{ post.likes || 0 }}
</button>

  <button class="dislike-btn" :class="{ disliked: post.dislikedBy?.includes(loggedInUsername) }" @click="dislikePost(post._id)" style="border: none;">
  <svg class="thumbs-down-icon" viewBox="0 0 24 24" width="20" height="20" fill="currentColor">
    <path d="M1 3h4v12H1V3zm22 11c0 1.1-.9 2-2 2h-6.31l.95 4.57.03.32a1 1 0 0 1-.29.7L14 22l-6.41-6.41A1.98 1.98 0 0 1 7 14.17V5a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2l1 7v.01L23 14z"/>
  </svg>
  {{ post.dislikes || 0 }}
</button>

<button class="comment-btn" @click="openFullScreenPost(post._id)" style="color:#ff1100;max-height:40px;margin: 0%;border: none;padding: 0%;">
  <svg class="round comments" viewBox="0 0 24 24" width="20" height="20" fill="currentColor" style=" display: inline-flex; align-items: center;justify-content: center;margin-bottom: 10px;">
    <path d="M12 3C6.48 3 2 6.92 2 11.5c0 2.14 1.06 4.1 2.83 5.6L4 21l3.65-1.95c1.29.45 2.7.7 4.35.7 5.52 0 10-3.92 10-8.5S17.52 3 12 3z"/>
  </svg>
  ({{ post.comments?.length || 0 }})
</button>

          <button class="view-btn" style="border: none; font-size: 12px;">💫 ({{ post.views || 0 }})</button>
          <button v-if="post.username === loggedInUsername || post.sessionId === sessionId" @click="editPost(post._id, post.username)">Edit</button>
          <button v-if="post.username === loggedInUsername || post.sessionId === sessionId" @click="deletePost(post._id)">Delete</button>
        </div>
      </div>
    </div>
    <div v-if="selectedPost" class="full-screen-post-modal" @click.self="closeFullScreenPost">
      <div class="full-screen-post-content">
        <button class="close-full-screen-btn" @click="closeFullScreenPost" aria-label="Close full-screen post">✖</button>
        <div class="post-header">
          <div class="profile-picture" @click="showUserProfile(selectedPost.username, selectedPost.profilePicture)">
            <img :src="selectedPost.profilePicture || 'pfp2.jpg'" :alt="`${selectedPost.username}'s profile picture`" />
          </div>
          <div class="username"><strong>{{ selectedPost.username }}</strong></div>
        </div>
        <p class="post-message" style="font-size: 16px; margin-top: 10px; font-family: 'Whitney', 'Helvetica Neue', Helvetica, Arial, sans-serif;">{{ selectedPost.message || "" }}</p>
        <img v-if="selectedPost.photo" :src="selectedPost.photo" alt="Post Image" loading="lazy" style="width: 100%; max-height: 50vh; border-radius: 10px; margin-bottom: 10px;" />
        <div class="post-timestamp"><small>{{ formatTimestamp(selectedPost.timestamp) }}</small></div>
        <div class="actions" style="margin: 10px 0;">
          <button class="like-btn" :class="{ liked: selectedPost.likedBy?.includes(loggedInUsername) }" @click="likePost(selectedPost._id)">👍 {{ selectedPost.likes || 0 }}</button>
          <button class="dislike-btn" :class="{ disliked: selectedPost.dislikedBy?.includes(loggedInUsername) }" @click="dislikePost(selectedPost._id)">👎 {{ selectedPost.dislikes || 0 }}</button>
          <button class="comment-btn" style="color:#ff1100;">Comments ({{ selectedPost.comments?.length || 0 }})</button>
          <button class="view-btn">💫 ({{ selectedPost.views || 0 }})</button>
          <button v-if="selectedPost.username === loggedInUsername || selectedPost.sessionId === sessionId" @click="editPost(selectedPost._id, selectedPost.username)">Edit</button>
          <button v-if="selectedPost.username === loggedInUsername || selectedPost.sessionId === sessionId" @click="deletePost(selectedPost._id)">Delete</button>
        </div>
        <div class="comments-section" style="padding: 0; background-color: #000; font-size: 14px; margin: 0; width: 100%; box-sizing: border-box; overflow: hidden;">
          <div class="comments-list" style="background-color: #000; padding: 0; margin-top:5px; font-size: 14px; width: 100%; overflow-y: auto; max-height: 40vh;">
            <div v-for="comment in selectedPost.comments" :key="comment.commentId" class="comment" :id="`comment-${comment.commentId}`" style="margin: 0 0 15px 0; padding: 0; background-color: #000;">
              <div style="display: flex; background-color: #000; padding: 10px 15px; width: 100%;">
                <div style="width: 40px; height: 40px; border-radius: 50%; overflow: hidden; margin-right: 12px; flex-shrink: 0;">
                  <img :src="comment.profilePicture || 'https://latestnewsandaffairs.site/public/pfp3.jpg'" :alt="`${comment.username || 'Unknown'}'s profile`" style="width: 100%; height: 100%; object-fit: cover;" />
                </div>
                <div style="flex: 1; color:#ffffff; display: flex; flex-direction: column;">
                  <div style="display: flex; justify-content: space-between; align-items: center;">
                    <span style="font-weight: bold; font-size: 16px;">{{ comment.username || "Unknown" }}</span>
                    <span style="font-size: 12px; color: #ccc;">{{ getTimeAgo(new Date(comment.timestamp)) }}</span>
                  </div>
                  <div style="font-size: 14px; color: #fff; margin-top: 5px;">{{ comment.comment || "No comment" }}</div>
                  <div style="font-size: 12px; margin-top: 8px; display: flex; align-items: center; gap: 15px;">
                    <button class="like-comment-btn" :class="{ liked: comment.likedBy?.includes(loggedInUsername) }" @click="likeComment(selectedPost._id, comment.commentId, comment.username)">❤️ <span class="like-count">{{ comment.hearts || 0 }}</span></button>
                    <button class="reply-btn" @click="toggleReplies(selectedPost._id, comment.commentId, comment.username, $event.target)">💬 <span v-if="comment.replies?.length > 0">({{ comment.replies.length }})</span></button>
                    <button v-if="comment.username === loggedInUsername || comment.sessionId === sessionId" class="delete-comment-btn" @click="deleteComment(selectedPost._id, comment.commentId)">🗑️ Delete</button>
                  </div>
                </div>
              </div>
              <div v-for="reply in comment.replies" :key="reply.replyId" :id="`reply-${reply.replyId}`" class="reply" style="margin-bottom: 10px; display: flex; background-color: #000; padding: 10px 15px; border-radius: 8px; margin-left: 40px;">
                <div style="width: 30px; height: 30px; border-radius: 50%; overflow: hidden; margin-right: 10px;">
                  <img :src="reply.profilePicture || 'https://latestnewsandaffairs.site/public/pfp3.jpg'" :alt="`${reply.username || 'Unknown'}'s profile`" style="width: 100%; height: 100%; object-fit: cover;" />
                </div>
                <div style="flex: 1; color: #fff; font-size: 14px; display: flex; flex-direction: column;">
                  <div style="display: flex; justify-content: space-between;">
                    <span style="font-weight: bold;">{{ reply.username || 'Unknown' }}</span>
                    <span style="font-size: 12px; color: #ccc;">{{ getTimeAgo(new Date(reply.timestamp)) }}</span>
                  </div>
                  <div style="display: flex; justify-content: space-between; align-items: center; margin-top: 5px;">
                    <p style="margin: 0; flex: 1;">{{ reply.reply || 'No reply' }}</p>
                    <button class="like-reply-btn" :class="{ liked: reply.likedBy?.includes(loggedInUsername) }" @click="likeReply(selectedPost._id, comment.commentId, reply.replyId)" style="background-color: #000; border: none; color: #fff; cursor: pointer; font-size: 14px; align-self: flex-end;">❤️ <span class="like-count">{{ reply.hearts || 0 }}</span></button>
                  </div>
                </div>
              </div>
              <div v-if="!comment.replies || comment.replies.length === 0" class="no-replies" style="color: #ccc; font-size: 13px; padding: 10px 0;"><p>No replies yet</p></div>
              <div :id="`reply-box-${comment.commentId}`" class="reply-box"></div>
            </div>
          </div>
          <div class="comment-input-container" style="position: absolute; bottom: 20px; left: 0; width: 100%; padding: 5px 10px; display: flex; align-items: center; justify-content: center; gap: 10px;">
            <input :id="`commentInput-${selectedPost._id}`" type="text" placeholder="Add a comment..." class="comment-input" style="width: 80%; padding: 5px 10px; border-radius: 25px; border: 1px solid #444; background-color: #333; color: #fff; font-size: 14px; transition: all 0.3s ease; box-sizing: border-box; outline: none; box-shadow: 0 0 5px rgba(0, 0, 0, 0.2);" @keyup.enter="addComment(selectedPost._id)" />
            <button @click="addComment(selectedPost._id)" style="background-color: #007bff; color: white; padding: 5px 10px; border: none; border-radius: 25px; transition: background-color 0.3s ease; cursor: pointer; font-size: 14px; box-shadow: 0 0 5px rgba(0, 0, 0, 0.2);">Post</button>
          </div>
        </div>
      </div>
    </div>
    <div v-if="showModal" class="modal">
      <div class="modal-content">
        <p>{{ modalMessage }}</p>
        <div class="modal-actions">
          <button class="modal-cancel" @click="closeModal">Cancel</button>
          <button class="modal-confirm" @click="modalAction">Yes, {{ modalActionText }}</button>
        </div>
      </div>
    </div>
</div>
</template>
<!-- Fade-in animation style -->
<style>
@keyframes fadeIn {
  from { opacity: 0; transform: translateY(10px); }
  to { opacity: 1; transform: translateY(0); }
}
</style>
<script setup>
import { ref, onMounted, watch } from 'vue';
import { debounce } from 'lodash';
import { useRoute, useRouter } from 'vue-router';
import usePosts from './Posts.js';
import { inject } from 'vue'

const notify = inject('notify')
const router = useRouter();
const route = useRoute();
const userId = ref(localStorage.getItem('userId') || '');
const username = ref(route.params.username ?? '');
const searchQuery = ref(route.params.username ?? '');
const userProfile = ref(null);
const searched = ref(false);
const actionLoading = ref(false);
const loggedInUsername = ref(localStorage.getItem('username') || ''); // Get current user

// Relationship status tracking
const relationshipStatus = ref({
  isFollowing: false,
  friendshipStatus: 'none', // 'none', 'pending_sent', 'pending_received', 'friends'
});

const {
  posts,
  loading,
  sessionId,
  sortOption,
  sortPosts,
  formatTimestamp,
  getTimeAgo,
  likePost,
  dislikePost,
  addComment,
  toggleReplies,
  likeComment,
  likeReply,
  editPost,
  deletePost,
  deleteComment,
  showModal,
  modalMessage,
  modalAction,
  modalActionText,
  closeModal,
  openFullScreen,
  openFullScreenPost,
  selectedPost,
} = usePosts();

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
    const response = await fetch(`https://sports321.vercel.app/api/search?username=${usernameToFetch}`, {
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
      location: user.location,
      status: user.status,
      profession: user.profession,
      hobby: user.hobby,
      followersCount: user.followers_count || 0,
      followingCount: user.following_count || 0,
      friendsCount: user.friends_count || 0,
    };

    posts.value = data.posts.map(post => ({
      ...post,
      comments: post.comments?.map(comment => ({
        ...comment,
        showReplies: false,
        replies: Array.isArray(comment.replies) ? comment.replies : [],
      })) || [],
      likedBy: post.likedBy || [],
      dislikedBy: post.dislikedBy || [],
      views: post.views || 0,
    }));

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
  posts.value = [];
  searched.value = false;
  searchQuery.value = '';
  relationshipStatus.value = { isFollowing: false, friendshipStatus: 'none' };
  router.push('/posts');
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

onMounted(() => {
  if (username.value) {
    fetchUserData(username.value);
  }
});

watch(() => route.params.username, (newUsername) => {
  if (newUsername) {
    username.value = newUsername;
    searchQuery.value = newUsername;
    fetchUserData(newUsername);
  } else {
    resetSearch();
  }
});

watch(() => localStorage.getItem('username'), (newUsername) => {
  loggedInUsername.value = newUsername || '';
  if (userProfile.value) {
    checkRelationshipStatus(userProfile.value.username);
  }
});
const showNotification = (message, isError) => {
  alert(`${isError ? 'Error' : 'Success'}: ${message}`);
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


// Expose data and methods explicitly for parent components if needed
defineExpose({
  userProfile,
  posts,
  loading,
  searched,
  actionLoading,
  searchQuery,
  sortOption,
  relationshipStatus,
   userId,
  loggedInUsername,

  searchUser,
  resetSearch,
  showUserProfile,
  toggleFollow,
  toggleFriendship,
  getFriendButtonText,
  getFriendButtonColor,
  isOwnProfile,
  shouldShowRelationshipButtons,

  sortPosts,
  formatTimestamp,
  getTimeAgo,
  likePost,
  dislikePost,
  addComment,
  toggleReplies,
  likeComment,
  likeReply,
  editPost,
  deletePost,
  deleteComment,
  openFullScreen,
  openFullScreenPost,
  selectedPost,

  showModal,
  modalMessage,
  modalAction,
  modalActionText,
  closeModal,
  startChat
});
</script>
<style src="./Posts.css"></style>


