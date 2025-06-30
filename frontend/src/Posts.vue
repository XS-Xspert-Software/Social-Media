<template>
<main>
  <div>
    <div id="loading" v-show="loading" class="loading"><div class="spinner"></div></div>
 <div class="sort-sidebar">
    <button class="sort-button" :class="{ active: sortOption === 'most-liked' }" @click="sortPosts('most-liked')">General</button>
    <button class="sort-button" :class="{ active: sortOption === 'most-comments' }" @click="sortPosts('most-comments')">Trending</button>
    <button class="sort-button" :class="{ active: sortOption === 'newest' }" @click="sortPosts('newest')">Newest</button>
</div>

    <div id="posts" class="posts-feed">
      <div v-for="post in posts" :key="post._id" class="post-card" :data-id="post._id" :data-liked-by="JSON.stringify(post.likedBy || [])" :data-disliked-by="JSON.stringify(post.dislikedBy || [])">
       <div class="post-header">
  <div class="profile-picture" @click="redirectToUserProfile(post.username)">
    <img :src="post.profilePicture || 'pfp2.jpg'" :alt="`${post.username}'s profile picture`" />
  </div>
  <div class="username" @click="redirectToUserProfile(post.username)">
    <strong>{{ post.username }}</strong>
    <span class="verified-badge" title="Verified">
      <i class="fa-solid fa-circle-check"></i>
    </span>
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

<button class="comment-btn" @click="openFullScreenPost(post._id)" style="color:#ffffff;max-height:40px;margin: 0%;border: none;padding: 0%;">
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
        <p class="post-message" style="font-size: 15px; margin-top: 10px; ">{{ selectedPost.message || "" }}</p>
        <img v-if="selectedPost.photo" :src="selectedPost.photo" alt="Post Image" loading="lazy" style="width: 100%; max-height: 50vh; border-radius: 10px; margin-bottom: 10px;" />
        <div class="post-timestamp"><small>{{ formatTimestamp(selectedPost.timestamp) }}</small></div>
        <div class="actions" style="margin: 10px 0;">
          <button class="like-btn" :class="{ liked: selectedPost.likedBy?.includes(loggedInUsername) }" @click="likePost(selectedPost._id)"><svg class="thumbs-up-icon" viewBox="0 0 24 24" width="20" height="20" fill="currentColor">
    <path d="M1 21h4V9H1v12zM23 10c0-1.1-.9-2-2-2h-6.31l.95-4.57.03-.32a1 1 0 0 0-.29-.7L14 2 7.59 8.41A1.98 1.98 0 0 0 7 9.83V19a2 2 0 0 0 2 2h9a2 2 0 0 0 2-2l1-7v-.01L23 10z"/>
  </svg> {{ selectedPost.likes || 0 }}</button>
          <button class="dislike-btn" :class="{ disliked: selectedPost.dislikedBy?.includes(loggedInUsername) }" @click="dislikePost(selectedPost._id)"><svg class="thumbs-down-icon" viewBox="0 0 24 24" width="20" height="20" fill="currentColor">
    <path d="M1 3h4v12H1V3zm22 11c0 1.1-.9 2-2 2h-6.31l.95 4.57.03.32a1 1 0 0 1-.29.7L14 22l-6.41-6.41A1.98 1.98 0 0 1 7 14.17V5a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2l1 7v.01L23 14z"/>
          </svg> {{ selectedPost.dislikes || 0 }}</button>
          <button class="comment-btn" style="color:#ff1100;">  <svg class="round comments" viewBox="0 0 24 24" width="20" height="20" fill="currentColor" style=" display: inline-flex; align-items: center;justify-content: center;margin-bottom: 10px;">
    <path d="M12 3C6.48 3 2 6.92 2 11.5c0 2.14 1.06 4.1 2.83 5.6L4 21l3.65-1.95c1.29.45 2.7.7 4.35.7 5.52 0 10-3.92 10-8.5S17.52 3 12 3z"/>
  </svg> ({{ selectedPost.comments?.length || 0 }})</button>
          <button class="view-btn" style="font-size: 12px;">💫 ({{ selectedPost.views || 0 }})</button>
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
                    <span style="font-size: 16px;">{{ comment.username || "Unknown" }}</span>
                    <span style="font-size: 12px; color: #ccc;">{{ getTimeAgo(new Date(comment.timestamp)) }}</span>
                  </div>
                  <div style="font-size: 14px; color: #fff; margin-top: 5px;">{{ comment.comment || "No comment" }}</div>
                  <div style="font-size: 12px; margin-top: 8px; display: flex; align-items: center; gap: 15px;">
                    <button class="like-comment-btn" :class="{ liked: comment.likedBy?.includes(loggedInUsername) }" @click="likeComment(selectedPost._id, comment.commentId, comment.username)">❤️ <span class="like-count">{{ comment.hearts || 0 }}</span></button>
                    <button class="reply-btn" @click="toggleReplies(selectedPost._id, comment.commentId, comment.username, $event.target)">  <svg class="round comments" viewBox="0 0 24 24" width="20" height="20" fill="currentColor" style=" display: inline-flex; align-items: center;justify-content: center;margin-bottom: 10px;">
    <path d="M12 3C6.48 3 2 6.92 2 11.5c0 2.14 1.06 4.1 2.83 5.6L4 21l3.65-1.95c1.29.45 2.7.7 4.35.7 5.52 0 10-3.92 10-8.5S17.52 3 12 3z"/>
  </svg> <span v-if="comment.replies?.length > 0">({{ comment.replies.length }})</span></button>
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

  </main>
</template>

<script setup>
import usePosts from './Posts.js';
import { useRouter } from 'vue-router';

const router = useRouter();

// ✅ This just changes the route, no logic or fetching here
function redirectToUserProfile(username) {
  router.push({ name: 'UserProfile', params: { username } });
}

// Use general post state and actions only
const {
  posts,
  loading,
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
  closeFullScreenPost,
  selectedPost,
  loggedInUsername,
  sessionId,
} = usePosts();
</script>
<style src="./Posts.css"></style>
<style scoped>
/* Main Content */
.main {
    flex: 1;
    margin: 60px 0;
     flex-wrap: wrap; /* Ensure it wraps on smaller screens */
}</style>



