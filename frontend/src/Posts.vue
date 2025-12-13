<template>
  <div>
    <div id="loading" v-show="postsStore.loading" class="loading"><div class="spinner"></div></div>
    <div class="Sort">
  <button class="sort-button" :class="{ active: postsStore.sortOption === 'general' }" @click="postsStore.sortPosts('general')">General</button>
  <button class="sort-button" :class="{ active: postsStore.sortOption === 'trending' }" @click="postsStore.sortPosts('trending')">Trending</button>
  <button class="sort-button" :class="{ active: postsStore.sortOption === 'story_rant' }" @click="postsStore.sortPosts('story_rant')">Stories</button>
  <button class="sort-button" :class="{ active: postsStore.sortOption === 'sports' }" @click="postsStore.sortPosts('sports')">Sports</button>
  <button class="sort-button" :class="{ active: postsStore.sortOption === 'entertainment' }" @click="postsStore.sortPosts('entertainment')">Entertainment</button>
  <button class="sort-button" :class="{ active: postsStore.sortOption === 'news' }" @click="postsStore.sortPosts('news')">News</button>
</div>

    <div class="content-wrapper">
        <div id="posts" class="posts-feed">
<!-- Skeleton placeholders using shared .post-card structure -->
<div v-if="postsStore.loading" class="skeleton-list">
  <div v-for="n in 4" :key="'skeleton-' + n" class="post-card skeleton-card">
    <div class="post-header">
      <div class="profile-picture">
        <div class="skeleton skeleton-avatar"></div>
      </div>
      <div class="username">
        <div class="skeleton skeleton-line short"></div>
      </div>
    </div>
    <div class="post-message">
      <div class="skeleton skeleton-line"></div>
      <div class="skeleton skeleton-line long"></div>
      <div class="skeleton skeleton-line"></div>
    </div>
    <div class="post-image">
      <div class="skeleton skeleton-img"></div>
    </div>
    <div class="actions">
      <div class="skeleton skeleton-btn"></div>
      <div class="skeleton skeleton-btn"></div>
      <div class="skeleton skeleton-btn"></div>
    </div>
  </div>
</div>

  <!-- Standard rendering: render all posts -->
  <div v-for="post in postsStore.posts" :key="post._id" class="post-card" :data-id="post._id" :data-liked-by="JSON.stringify(post.likedBy || [])">
    
    <!-- Reply Preview -->
    <div v-if="post.replyTo" class="reply-preview" style="background: linear-gradient(135deg, #1a1a1a, #2a2a2a); border-left: 2px solid #00b4d8; padding: 10px; margin-bottom: 12px; border-radius: 8px; box-shadow: 0 0 6px rgba(0, 180, 216, 0.3);">
        <div class="reply-header" style="display: flex; align-items: center; gap: 10px; margin-bottom: 6px;">
          <img :src="post.replyTo.profilePicture || 'https://endless.sbs/public/pfp.jpg'" alt="User Profile Picture" style="width: 28px; height: 28px; border-radius: 50%; object-fit: cover; border: 1px solid #444;" />
          <div style="display: flex; flex-direction: column;">
            <strong style="color: #00b4d8;">{{ post.replyTo.username }}</strong>
            <small style="color: #999;">{{ postsStore.formatTimestamp(post.replyTo.timestamp) }}</small>
          </div>
      </div>
      <div @click="$router.push(`/post/${post.replyTo._id}`)">
        <p class="preview-message clickable" v-html="postsStore.parseMessage(post.replyTo.message)"></p>
      </div>
    <img v-if="post.replyTo.photo" :src="post.replyTo.photo" alt="Replied Post Image" class="preview-image" loading="lazy" />
    </div>
    
    <!-- Quote Preview -->
    <div v-if="post.quoteTo" class="preview-card quote-preview">
      <div class="preview-header">
  <img :src="post.quoteTo.profilePicture || 'https://endless.sbs/public/pfp.jpg'" alt="User Profile Picture" class="preview-avatar" />
        <div class="preview-user-info">
          <strong class="preview-username">{{ post.quoteTo.username }}</strong>
          <small class="preview-timestamp">{{ postsStore.formatTimestamp(post.quoteTo.timestamp) }}</small>
        </div>
      </div>
      <p class="preview-message" v-html="postsStore.parseMessage(post.quoteTo.message)"></p>
    <img v-if="post.quoteTo.photo" :src="post.quoteTo.photo" alt="Quoted Post Image" class="preview-image" loading="lazy" />
    </div>
    
    <!-- Post Header -->
    <div class="post-header">
      <div class="profile-picture clickable" @click="redirectToUserProfile(post.username)">
        <img :src="post.profilePicture ? post.profilePicture : 'pfp2.jpg'" :alt="`${post.username}'s profile picture`" loading="lazy" />
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
  <img v-if="post.photo" :src="post.photo" alt="Post Image" class="post-image" @click="$router.push(`/post/${post._id}`)" loading="lazy" />
    
    <!-- Post Timestamp -->
    <div class="post-timestamp">
      <small>{{ postsStore.formatTimestamp(post.timestamp) }}</small>
    </div>
    
    <!-- Actions -->
     <div class="actions">
    <div style="display: flex; gap: 18px; align-items: center; color: #fff; font-size: 12px;">

  <!-- Likes -->
  <div style="display: flex; align-items: center; gap: 5px;" :class="{ liked: post.likedBy?.includes(postsStore.loggedInUsername) }" @click="postsStore.likePost(post._id)">
    <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="#fff" stroke-width="1.5">
      <path
        d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 
           2 5.42 4.42 3 7.5 3c1.74 0 3.41 0.81 4.5 2.09 
           C13.09 3.81 14.76 3 16.5 3 
           19.58 3 22 5.42 22 8.5 
           c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"
      />
    </svg>
    {{ post.likes || '0' }} likes
  </div>

  <!-- Views -->
  <div style="display: flex; align-items: center; gap: 5px;">
     <svg
    viewBox="0 0 24 24"
    width="22"
    height="22"
    class="views-icon"
  >
    <path
      d="M3 12h4l3-9 4 18 3-9h4"
      stroke="#fff"
      stroke-width="1.5"
      stroke-linecap="round"
      stroke-linejoin="round"
      fill="none"
    />
    <circle
      cx="12"
      cy="12"
      r="2"
      stroke="#fff"
      stroke-width="1.5"
      opacity="0.6"
      fill="none"
    />
  </svg>
    {{ post.views_count || '0' }} views
  </div>

  <!-- Comments -->
  <div @click="$router.push(`/post/${post._id}`)" style="display: flex; align-items: center; gap: 5px;">
    <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="#fff" stroke-width="1.5">
            <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
          </svg>
    {{ post.commentCount || '0' }} comments
  </div>

  <button
  class="action-btn tweet-btn" style="margin-bottom: 10px;"
  :class="{ replied: post.repliedBy?.includes(postsStore.loggedInUsername) }"
   @click="tweetPost(post._id, post.username)"
>
  <svg
    viewBox="0 0 24 24"
    width="20"
    height="20"
    class="reply-icon"
  >
    <path
      d="M9 17l-5-5 5-5"
      stroke="#fff"
      stroke-width="1.5"
      stroke-linecap="round"
      stroke-linejoin="round"
      fill="none"
    />
    <path
      d="M20 18v-2a4 4 0 0 0-4-4H4"
      stroke="#fff"
      stroke-width="1.5"
      stroke-linecap="round"
      stroke-linejoin="round"
      fill="none"
    />
  </svg>
  {{ post.replies || 0 }}
</button>

</div>
      
      <!-- Replace inline Edit/Delete with a three-dot menu for own posts -->
      <div v-if="isOwnPost(post)" class="more-actions" style="position:relative; margin-left:auto;">
        <button class="more-btn" @click.stop="toggleMenu(post._id, $event)" aria-label="More options" style="background:none;border:none;padding:4px;cursor:pointer;color:#fff;display:flex;align-items:center;">
          <svg viewBox="0 0 24 24" width="20" height="20" fill="currentColor"><path d="M12 8a2 2 0 110-4 2 2 0 010 4zm0 2a2 2 0 110 4 2 2 0 010-4zm0 6a2 2 0 110 4 2 2 0 010-4z"/></svg>
        </button>
        <!-- Portal the menu to body to avoid clipping by overflow:hidden parents -->
        <Teleport to="body">
          <div
            v-if="openMenuFor === post._id"
            class="more-menu portal"
            :style="{
              position: 'fixed',
              top: menuCoords.top + 'px',
              left: menuCoords.left + 'px',
              minWidth: '200px',
              zIndex: 2000
            }"
          >
            <button @click="handleEdit(post)" style="all:unset;display:block;width:100%;padding:8px 10px;cursor:pointer;color:#fff;font-size:13px;border-radius:6px;">Edit</button>
            <button @click="handleDelete(post)" style="all:unset;display:block;width:100%;padding:8px 10px;cursor:pointer;color:#ff6b6b;font-size:13px;border-radius:6px;">Delete</button>
          </div>
        </Teleport>
      </div>
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
import { inject, watch, ref, onMounted, onBeforeUnmount } from 'vue';
// ...existing code...

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

const formatViewCount = (count) => {
  if (count >= 1000000) return (count / 1000000).toFixed(1).replace(/\.0$/, '') + 'M';
  if (count >= 1000) return (count / 1000).toFixed(1).replace(/\.0$/, '') + 'K';
  return count.toString();
};

watch(selectedSort, (newSort) => {
  if (newSort) {
    postsStore.sortPosts(newSort);
  }
}, { immediate: true });

function tweetPost(postId, username) {
  // Require login to reply/tweet
  if (!postsStore.isAuthenticated) {
    notify?.('Please log in to reply to posts', true);
    return;
  }
  router.push({ path: '/float', query: { replyToPostId: postId, replyToUsername: username } });
}
function redirectToUserProfile(username) {
  router.push({ name: 'UserProfile', params: { username } });
}
const openMenuFor = ref(null);
const menuCoords = ref({ top: 0, left: 0 });
function isOwnPost(p){
  return p.username === postsStore.loggedInUsername || p.sessionId === postsStore.sessionId;
}
function computeMenuCoordsFromEvent(e){
  try {
    const btn = e?.currentTarget || e?.target?.closest('button');
    if (!btn) return;
    const rect = btn.getBoundingClientRect();
  const estimatedWidth = 200; // px
  const padding = 12; // viewport padding
    let left = rect.right - estimatedWidth;
    left = Math.max(padding, Math.min(left, window.innerWidth - estimatedWidth - padding));
    const top = Math.min(rect.bottom + 6, window.innerHeight - 10); // place under button
    menuCoords.value = { top, left };
  } catch {}
}
function toggleMenu(id, e){
  if (openMenuFor.value === id) {
    openMenuFor.value = null;
    return;
  }
  computeMenuCoordsFromEvent(e);
  openMenuFor.value = id;
}
function handleGlobalClick(e){
  const target = e?.target;
  const supportsClosest = typeof target?.closest === 'function';
  const insideMenu = supportsClosest ? target.closest('.more-actions') : false;
  if (!insideMenu) openMenuFor.value = null;
}
function handleEdit(post){
  openMenuFor.value = null;
  if (!postsStore.isAuthenticated) {
    notify?.('Please log in to edit your post', true);
    return;
  }
  postsStore.editPost(post._id, post.username);
}
function handleDelete(post){
  openMenuFor.value = null;
  if (!postsStore.isAuthenticated) {
    notify?.('Please log in to delete your post', true);
    return;
  }
  postsStore.deletePost(post._id);
}
onMounted(()=>{
  window.addEventListener('click', handleGlobalClick, { capture:true });
  // Close on scroll/resize to avoid misaligned portal
  window.addEventListener('scroll', handleGlobalClick, { capture:true });
  window.addEventListener('resize', handleGlobalClick, { capture:true });
});
onBeforeUnmount(()=>{
  window.removeEventListener('click', handleGlobalClick, { capture:true });
  window.removeEventListener('scroll', handleGlobalClick, { capture:true });
  window.removeEventListener('resize', handleGlobalClick, { capture:true });
});
defineExpose({
  onExternalSort: (type) => postsStore.sortPosts(type),
});
</script>

<style src="./Posts.css"></style>
<style scoped>
/* Base skeleton */
.skeleton{background:#2b2b2b;border-radius:4px;animation:pulse 1.5s infinite ease-in-out}

/* Avatar */
.skeleton-avatar{width:29px;height:29px;border-radius:50%}

/* Text lines */
.skeleton-line{height:12px;margin:6px 0;width:92%}
.skeleton-line.long{width:92%}
.skeleton-line.short{width:72%}

/* Image */
.skeleton-img{width:100%;height:120px;border-radius:10px;margin:10px 0 6px}
@media (min-width:768px){.skeleton-img{width:690px;height:150px}}

/* Buttons */
.skeleton-btn{width:56px;height:12px;margin-right:14px;border-radius:6px}

/* Animation */
@keyframes pulse{0%{opacity:1}50%{opacity:.5}100%{opacity:1}}
</style>


