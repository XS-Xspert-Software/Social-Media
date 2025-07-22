<template>
  <div>
    <div id="loading" v-show="postsStore.loading" class="loading"><div class="spinner"></div></div>
    <div class="Sort">
      <button class="sort-button" :class="{ active: postsStore.sortOption === 'most-liked' }" @click="postsStore.sortPosts('most-liked')">General</button>
      <button class="sort-button" :class="{ active: postsStore.sortOption === 'most-comments' }" @click="postsStore.sortPosts('most-comments')">Trending</button>
      <button class="sort-button" :class="{ active: postsStore.sortOption === 'newest' }" @click="postsStore.sortPosts('newest')">Newest</button>
    </div>

    <div class="content-wrapper">
        <div id="posts" class="posts-feed">
    <div v-for="post in postsStore.posts" :key="post._id" class="post-card" :data-id="post._id" :data-liked-by="JSON.stringify(post.likedBy || [])">
      <!-- Reply Preview (if post is a reply) -->
      <div v-if="post.replyTo" class="reply-preview" style="background: linear-gradient(135deg, #1a1a1a, #2a2a2a); border-left: 2px solid #00b4d8; padding: 10px; margin-bottom: 12px; border-radius: 8px; box-shadow: 0 0 6px rgba(0, 180, 216, 0.3);">
        <div class="reply-header" style="display: flex; align-items: center; gap: 10px; margin-bottom: 6px;">
          <img :src="post.replyTo.profilePicture || 'https://latestnewsandaffairs.site/public/pfp.jpg'" alt="User Profile Picture" style="width: 28px; height: 28px; border-radius: 50%; object-fit: cover; border: 1px solid #444;" />
          <div style="display: flex; flex-direction: column;">
            <strong style="color: #00b4d8;">{{ post.replyTo.username }}</strong>
            <small style="color: #999;">{{ postsStore.formatTimestamp(post.replyTo.timestamp) }}</small>
          </div>
        </div>
        <div @click="$router.push(`/post/${post.replyTo._id}`)">
          <p style="font-size: 13px; color: #ccc; margin: 4px 0; cursor: pointer;" v-html="postsStore.parseMessage(post.replyTo.message)"></p>
        </div>
        <img v-if="post.replyTo.photo" :src="post.replyTo.photo" alt="Replied Post Image" style="width: 100%; max-width: 150px; border-radius: 6px; margin-top: 6px;" />
      </div>
      <!-- Quote Preview (if post is a quote) -->
      <div v-if="post.quoteTo" class="quote-preview" style="background: linear-gradient(135deg, #1a1a1a, #2a2a2a); border-left: 2px solid #ff6b6b; padding: 10px; margin-bottom: 12px; border-radius: 8px; box-shadow: 0 0 6px rgba(255, 107, 107, 0.3);">
        <div class="quote-header" style="display: flex; align-items: center; gap: 10px; margin-bottom: 6px;">
          <img :src="post.quoteTo.profilePicture || 'https://latestnewsandaffairs.site/public/pfp.jpg'" alt="User Profile Picture" style="width: 28px; height: 28px; border-radius: 50%; object-fit: cover; border: 1px solid #444;" />
          <div style="display: flex; flex-direction: column;">
            <strong style="color: #ff6b6b;">{{ post.quoteTo.username }}</strong>
            <small style="color: #999;">{{ postsStore.formatTimestamp(post.quoteTo.timestamp) }}</small>
          </div>
        </div>
        <p style="font-size: 13px; color: #ccc; margin: 4px 0;" v-html="postsStore.parseMessage(post.quoteTo.message)"></p>
        <img v-if="post.quoteTo.photo" :src="post.quoteTo.photo" alt="Quoted Post Image" style="width: 100%; max-width: 150px; border-radius: 6px; margin-top: 6px;" />
      </div>
      <!-- Post Header -->
      <div class="post-header">
        <div class="profile-picture" @click="redirectToUserProfile(post.username)">
          <img :src="post.profilePicture || 'pfp2.jpg'" :alt="`${post.username}'s profile picture`" />
        </div>
        <div class="username" @click="postsStore.redirectToUserProfile(post.username)">
          <strong>{{ post.username }}</strong>
          <span class="verified-badge" title="Verified">
            <i class="fa-solid fa-circle-check"></i>
          </span>
        </div>
      </div>
      <!-- Post Message with Tagged Usernames and Hashtags -->
      <p class="post-message" style="font-size: 13px; margin-top: 8px; font-family: 'Whitney', 'Helvetica Neue', Helvetica, Arial, sans-serif; cursor: pointer;" v-html="postsStore.parseMessage(post.message)" @click="$router.push(`/post/${post._id}`)"></p>
      <img v-if="post.photo" :src="post.photo" alt="Post Image" style="width: 100%; max-width: 300px; max-height: 280px; border-radius: 10px; margin-bottom: 10px; cursor: pointer;" @click="$router.push(`/post/${post._id}`)" />
      <div class="post-timestamp"><small>{{ postsStore.formatTimestamp(post.timestamp) }}</small></div>
      <!-- Actions -->
      <div class="actions">
        <button class="like-btn" :class="{ liked: post.likedBy?.includes(postsStore.loggedInUsername) }" @click="postsStore.likePost(post._id)" style="border: none;">
          <svg class="thumbs-up-icon" viewBox="0 0 24 24" width="20" height="20" fill="currentColor">
            <path d="M1 21h4V9H1v12zM23 10c0-1.1-.9-2-2-2h-6.31l.95-4.57.03-.32a1 1 0 0 0-.29-.7L14 2 7.59 8.41A1.98 1.98 0 0 0 7 9.83V19a2 2 0 0 0 2 2h9a2 2 0 0 0 2-2l1-7v-.01L23 10z"/>
          </svg>
          {{ post.likes || 0 }}
        </button>
        <button class="quote-btn" @click="postsStore.quotePost(post)">
          <svg viewBox="0 0 24 24" width="20" height="20" fill="currentColor">
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
        <button class="tweet-btn" @click="tweetPost(post._id, post.username)" style="border: none; font-size: 12px;">
          <svg viewBox="0 0 24 24" width="20" height="20" fill="currentColor">
            <path d="M22.46 6c-.77.35-1.6.58-2.46.69a4.3 4.3 0 0 0 1.88-2.38c-.82.49-1.73.83-2.69 1.02A4.26 4.26 0 0 0 15.88 4c-2.35 0-4.27 1.92-4.27 4.29 0 .34.04.67.11 1-3.55-.18-6.71-1.89-8.82-4.48-.37.63-.58 1.37-.58 2.15 0 1.49.76 2.81 1.91 3.58-.7-.02-1.36-.22-1.94-.54v.05c0 2.08 1.48 3.82 3.44 4.21-.36.1-.74.15-1.13.15-.28 0-.55-.03-.81-.08.55 1.73 2.15 2.99 4.04 3.03-1.48 1.16-3.34 1.85-5.36 1.85-.35 0-.69-.02-1.03-.06 1.91 1.23 4.18 1.94 6.62 1.94 7.94 0 12.29-6.58 12.29-12.29 0-.19 0-.37-.01-.56.84-.61 1.57-1.37 2.15-2.24z"/>
          </svg>
          Tweet
        </button>
        <button v-if="post.username === postsStore.loggedInUsername || post.sessionId === postsStore.sessionId" @click="postsStore.editPost(post._id, post.username)">Edit</button>
        <button v-if="post.username === postsStore.loggedInUsername || post.sessionId === postsStore.sessionId" @click="postsStore.deletePost(post._id)">Delete</button>
      </div>
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
</template>


<script setup>
import { usePostsStore } from './stores/postsStore';
import { useRouter, useRoute, onBeforeRouteUpdate } from 'vue-router';
import { inject, watch } from 'vue';

const postsStore = usePostsStore();
const { posts } = postsStore; // ✅ include posts to avoid undefined error

const router = useRouter();
const route = useRoute();
const selectedSort = inject('selectedSort');
const notify = inject('notify'); // Inject the notify function from App.vue

// Initialize the store with the injected notify function
if (notify) {
  postsStore.initialize(notify);
}

// Navigate to Upload.vue for tweeting/replying
function tweetPost(postId, username) {
  router.push({ path: '/float', query: { replyToPostId: postId, replyToUsername: username } });
}

// Watch for sort changes
watch(selectedSort, (newVal) => {
  postsStore.sortPosts(newVal);
}, { immediate: true });

// Handle route reset query
watch(
  () => route.query.reset,
  (val) => {
    if (val === 'true') {
      posts.value = [];
      router.replace({ query: { ...route.query, reset: undefined } });
    }
  },
  { immediate: true }
);

// Clear posts when navigating back from Search2
onBeforeRouteUpdate((to, from, next) => {
  if (to.name === 'Posts' && from.name === 'Search2') {
    posts.value = [];
  }
  next();
});

// Route to user profile
function redirectToUserProfile(username) {
  router.push({ name: 'UserProfile', params: { username } });
}

// Expose sort function externally
defineExpose({
  onExternalSort: (type) => postsStore.sortPosts(type),
});
</script>

<style src="./Posts.css"></style>


