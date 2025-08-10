<template>
  <div class="full-screen-post-page" style="position: fixed;  height: 100vh;overflow-y: auto;">
    <!-- Loading State -->
    <div v-if="!postsStore.selectedPost" style="color: #fff; text-align: center; padding: 20px;">
      <p>Loading post...</p>
    </div>
    <!-- Post Content -->
    <div v-else class="full-screen-post-content" style="background: #000;  height: 100%; padding: 16px; box-sizing: border-box;">
      <!-- Modal Header -->
      <div style="display: flex; justify-content: space-between; align-items: center;">
  <!-- Left: Back Button -->
  <div style="display: flex; align-items: center;">
    <button class="back-btn" @click="$router.go(-1)" aria-label="Back" style="color: #fff; border: none; background: none; font-size: 32px; cursor: pointer; display: flex; align-items: center;">
      <svg viewBox="0 0 24 24" width="26" height="26" fill="currentColor">
        <path d="M15.41 7.41L14 6l-6 6 6 6 1.41-1.41L10.83 12z"/>
      </svg>
    </button>
  </div>

  <!-- Right: Bookmark, Share, More Actions -->
  <div style="display: flex; align-items: center; gap: 8px;">
    <!-- Bookmark Button -->
    <button class="bookmark-btn" @click="bookmarkPost" aria-label="Bookmark post" style="background: none; border: none; color: #fff; font-size: 20px; cursor: pointer;">
      <svg viewBox="0 0 24 24" width="24" height="24" fill="currentColor">
        <path d="M19 21l-7-5-7 5V5a2 2 0 012-2h10a2 2 0 012 2z"/>
      </svg>
    </button>

    <!-- Share Button -->
    <button class="share-btn" @click="sharePost" aria-label="Share post" style="background: none; border: none; color: #fff; font-size: 20px; cursor: pointer;">
      <svg viewBox="0 0 24 24" width="24" height="24" fill="currentColor">
        <path d="M18 16.08c-.76 0-1.44.3-1.96.77L8.91 12.7c.05-.23.09-.46.09-.7s-.04-.47-.09-.7l7.05-4.11c.54.5 1.25.81 2.04.81 1.66 0 3-1.34 3-3s-1.34-3-3-3-3 1.34-3 3c0 .24.04.47.09.7L8.04 9.81C7.5 9.31 6.79 9 6 9c-1.66 0-3 1.34-3 3s1.34 3 3 3c.79 0 1.5-.31 2.04-.81l7.12 4.16c-.05.21-.08.43-.08.65 0 1.61 1.31 2.92 2.92 2.92s2.92-1.31 2.92-2.92-1.31-2.92-2.92-2.92z"/>
      </svg>
    </button>

    <!-- More Actions -->
    <div class="more-actions" style="position: relative;">
      <button class="more-btn" @click="toggleMoreMenu" aria-label="More options" style="background: none; border: none; color: #fff; font-size: 20px; cursor: pointer;">
        <svg viewBox="0 0 24 24" width="24" height="24" fill="currentColor">
          <path d="M12 8c1.1 0 2-.9 2-2s-.9-2-2-2-2 .9-2 2 .9 2 2 2zm0 2c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2zm0 6c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2z"/>
        </svg>
      </button>

      <!-- Dropdown -->
      <div v-if="showMoreMenu" class="more-menu" style="position: absolute; top: 30px; right: 0; background: #2a2a2a; border-radius: 8px; padding: 10px; box-shadow: 0 2px 10px rgba(0, 0, 0, 0.3); min-width: 120px;">
        <!-- Add menu options here -->
      </div>
    </div>
        </div>
      </div>
      <!-- Reply Preview -->
      <div v-if="postsStore.selectedPost.replyTo" class="reply-preview" style="border-left: 3px solid #00b4d8; padding: 10px; margin-bottom: 15px; background: #2a2a2a; border-radius: 8px;">
        <div class="reply-header" style="display: flex; align-items: center; gap: 10px;">
          <img :src="postsStore.selectedPost.replyTo.profilePicture || 'https://latestnewsandaffairs.site/public/pfp.jpg'" alt="User Profile Picture" style="width: 32px; height: 32px; border-radius: 50%; object-fit: cover;" />
          <div>
            <strong style="color: #00b4d8;">{{ postsStore.selectedPost.replyTo.username }}</strong>
            <small style="color: #999; display: block;">{{ postsStore.formatTimestamp(postsStore.selectedPost.replyTo.timestamp) }}</small>
          </div>
        </div>
        <p style="font-size: 13px; color: #ccc; margin: 8px 0;" v-html="postsStore.parseMessage(postsStore.selectedPost.replyTo.message)"></p>
        <img v-if="postsStore.selectedPost.replyTo.photo" :src="postsStore.selectedPost.replyTo.photo" alt="Replied Post Image" style="width: 100%; max-width: 150px; border-radius: 6px; margin-top: 8px;" />
      </div>
      <!-- Quote Preview -->
      <div v-if="postsStore.selectedPost.quoteTo" class="quote-preview" style="border-left: 3px solid #ff6b6b; padding: 10px; margin-bottom: 15px; background: #2a2a2a; border-radius: 8px;">
        <div class="quote-header" style="display: flex; align-items: center; gap: 10px;">
          <img :src="postsStore.selectedPost.quoteTo.profilePicture || 'https://latestnewsandaffairs.site/public/pfp.jpg'" alt="User Profile Picture" style="width: 32px; height: 32px; border-radius: 50%; object-fit: cover;" />
          <div>
            <strong style="color: #ff6b6b;">{{ postsStore.selectedPost.quoteTo.username }}</strong>
            <small style="color: #999; display: block;">{{ postsStore.formatTimestamp(postsStore.selectedPost.quoteTo.timestamp) }}</small>
          </div>
        </div>
        <p style="font-size: 13px; color: #ccc; margin: 8px 0;" v-html="postsStore.parseMessage(postsStore.selectedPost.quoteTo.message)"></p>
        <img v-if="postsStore.selectedPost.quoteTo.photo" :src="postsStore.selectedPost.quoteTo.photo" alt="Quoted Post Image" style="width: 100%; max-width: 150px; border-radius: 6px; margin-top: 8px;" />
      </div>
      <!-- Post Content -->
      <div class="post-header" style="display: flex; align-items: center; gap: 10px; margin-bottom: 15px;">
        <div class="profile-picture" @click="redirectToUserProfile(postsStore.selectedPost.username)">
          <img :src="postsStore.selectedPost.profilePicture || 'pfp2.jpg'" :alt="`${postsStore.selectedPost.username}'s profile picture`" style="width: 40px; height: 40px; border-radius: 50%; object-fit: cover;" />
        </div>
        <div class="username"><strong style="color: #fff; font-size: 16px;">{{ postsStore.selectedPost.username }}</strong></div>
      </div>
      <p class="post-message" style="font-size: 14px; color: #fff; margin: 10px 0; line-height: 1.5;" v-html="postsStore.parseMessage(postsStore.selectedPost.message)"></p>
      <img v-if="postsStore.selectedPost.photo" :src="postsStore.selectedPost.photo" alt="Post Image" loading="lazy" style="width: 100%; max-height: 50vh; border-radius: 12px; margin-bottom: 15px; object-fit: cover;" />
      <div class="post-timestamp" style="color: #999; font-size: 12px; margin-bottom: 15px;"><small>{{ postsStore.formatTimestamp(postsStore.selectedPost.timestamp) }}</small></div>
      <!-- Post Actions -->
      <div class="actions" style="display: flex; gap: 15px; margin-bottom: 15px;">
        <button class="like-btn" :class="{ liked: postsStore.selectedPost.likedBy?.includes(postsStore.loggedInUsername) }" @click="postsStore.likePost(postsStore.selectedPost._id)" style="background: none; border: none; color: #fff; display: flex; align-items: center; gap: 5px; font-size: 14px;">
          <svg class="thumbs-up-icon" viewBox="0 0 24 24" width="20" height="20" fill="currentColor">
            <path d="M1 21h4V9H1v12zM23 10c0-1.1-.9-2-2-2h-6.31l.95-4.57.03-.32a1 1 0 0 0-.29-.7L14 2 7.59 8.41A1.98 1.98 0 0 0 7 9.83V19a2 2 0 0 0 2 2h9a2 2 0 0 0 2-2l1-7v-.01L23 10z"/>
          </svg>
          {{ postsStore.selectedPost.likes || 0 }}
        </button>
        <button class="quote-btn" @click="postsStore.quotePost(postsStore.selectedPost)" style="background: none; border: none; color: #fff; display: flex; align-items: center; gap: 5px; font-size: 14px;">
          <svg viewBox="0 0 24 24" width="20" height="20" fill="currentColor">
            <path d="M5 17h3v-9h2V7h-5v1h2v9zm9 0h3v-9h2V7h-5v1h2v9z"/>
          </svg>
          Quote
        </button>
        <button class="comment-btn" style="background: none; border: none; color: #1da1f2; display: flex; align-items: center; gap: 5px; font-size: 14px;">
          <svg class="round comments" viewBox="0 0 24 24" width="20" height="20" fill="currentColor">
            <path d="M12 3C6.48 3 2 6.92 2 11.5c0 2.14 1.06 4.1 2.83 5.6L4 21l3.65-1.95c1.29.45 2.7.7 4.35.7 5.52 0 10-3.92 10-8.5S17.52 3 12 3z"/>
          </svg>
          ({{ postsStore.selectedPost.comments?.length || 0 }})
        </button>
        <button class="tweet-btn" @click="tweetPost(postsStore.selectedPost._id, postsStore.selectedPost.username)" style="background: none; border: none; color: #fff; display: flex; align-items: center; gap: 5px; font-size: 14px;">
          <svg viewBox="0 0 24 24" width="20" height="20" fill="currentColor" aria-hidden="true" class="ping-icon">
            <path d="M12 2l3.09 7.26L22 9.27l-5.5 4.78L18.18 22 12 18.3 5.82 22 7.5 14.05 2 9.27l6.91-1.01L12 2z"/>
          </svg>
          Ping
        </button>
        <button v-if="postsStore.selectedPost.username === postsStore.loggedInUsername || postsStore.selectedPost.sessionId === postsStore.sessionId" @click="postsStore.editPost(postsStore.selectedPost._id, postsStore.selectedPost.username)" style="background: none; border: none; color: #fff; font-size: 14px;">Edit</button>
        <button v-if="postsStore.selectedPost.username === postsStore.loggedInUsername || postsStore.selectedPost.sessionId === postsStore.sessionId" @click="postsStore.deletePost(postsStore.selectedPost._id)" style="background: none; border: none; color: #ff6b6b; font-size: 14px;">Delete</button>
      </div>
      <!-- Comments Section -->
      <div class="comments-section" style="padding: 0; width: 100%; box-sizing: border-box;">
        <div class="comment-input-container" style="margin-bottom: 15px; display: flex; align-items: center; gap: 10px;">
          <input :id="`commentInput-${postsStore.selectedPost._id}`" type="text" placeholder="Add a comment..." class="comment-input" style="width: 100%; padding: 8px 12px; border-radius: 20px; border: 1px solid #444; background: #000; color: #fff; font-size: 14px; outline: none;" @keyup.enter="postsStore.addComment(postsStore.selectedPost._id, $event.target.value)" />
          <button @click="postsStore.addComment(postsStore.selectedPost._id, document.getElementById(`commentInput-${postsStore.selectedPost._id}`).value)" style="background: #007bff; color: #fff; padding: 6px 12px; border: none; border-radius: 20px; cursor: pointer; font-size: 14px;">Post</button>
        </div>
        <div class="comments-list" style="max-height: 50vh; overflow-y: auto;">
          <div v-for="comment in postsStore.selectedPost.comments" :key="comment.commentId" class="comment" :id="`comment-${comment.commentId}`" style="background: #000; border-radius: 8px; margin-bottom: 8px; padding: 11px; box-shadow: 0 1px 4px rgba(0, 0, 0, 0.2);">
            <div style="display: flex; align-items: flex-start; gap: 10px;">
              <div style="width: 32px; height: 32px; border-radius: 50%; overflow: hidden; flex-shrink: 0;">
                <img :src="comment.profilePicture || 'https://latestnewsandaffairs.site/public/pfp3.jpg'" :alt="`${comment.username || 'Unknown'}'s profile`" style="width: 100%; height: 100%; object-fit: cover;" />
              </div>
              <div style="flex: 1;">
                <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 4px;">
                  <span style="font-size: 13px; color: #fff; font-weight: 600;">{{ comment.username || "Unknown" }}</span>
                  <span style="font-size: 11px; color: #999;">{{ postsStore.getTimeAgo(new Date(comment.timestamp)) }}</span>
                </div>
                <p style="font-size: 12px; color: #ddd; margin: 0 0 8px 0; line-height: 1.4;">{{ comment.comment || "No comment" }}</p>
                <div style="display: flex; gap: 12px; align-items: center;">
                  <button class="like-comment-btn" :class="{ liked: comment.likedBy?.includes(postsStore.loggedInUsername) }" @click="postsStore.likeComment(postsStore.selectedPost._id, comment.commentId)" style="background: none; border: none; color: #fff; display: flex; align-items: center; gap: 4px; font-size: 12px;">
                    ❤ <span class="like-count">{{ comment.hearts || 0 }}</span>
                  </button>
                  <button class="reply-btn" @click="postsStore.toggleReplies(postsStore.selectedPost._id, comment.commentId)" style="background: none; border: none; color: #1da1f2; display: flex; align-items: center; gap: 4px; font-size: 12px;">
                    <svg class="round comments" viewBox="0 0 24 24" width="16" height="16" fill="currentColor">
                      <path d="M12 3C6.48 3 2 6.92 2 11.5c0 2.14 1.06 4.1 2.83 5.6L4 21l3.65-1.95c1.29.45 2.7.7 4.35.7 5.52 0 10-3.92 10-8.5S17.52 3 12 3z"/>
                    </svg>
                    <span v-if="comment.replies?.length > 0">({{ comment.replies.length }})</span>
                  </button>
                  <button v-if="comment.username === postsStore.loggedInUsername || comment.sessionId === postsStore.sessionId" class="delete-comment-btn" @click="postsStore.deleteComment(postsStore.selectedPost._id, comment.commentId)" style="background: none; border: none; color: #ff6b6b; font-size: 12px;">🗑 Delete</button>
                </div>
              </div>
            </div>
            <!-- Reply Layer -->
            <transition name="slide-down">
              <div v-if="postsStore.selectedCommentId === comment.commentId" class="reply-layer" style="margin-top: 10px; padding: 12px; background: #000; border-radius: 8px; border-left: 3px solid #1da1f2; box-shadow: 0 2px 6px rgba(0, 0, 0, 0.3);">
                <div v-for="reply in comment.replies" :key="reply.replyId" :id="`reply-${reply.replyId}`" class="reply" style="display: flex; align-items: flex-start; gap: 8px; margin-bottom: 8px; padding: 8px; background: #000; border-radius: 6px;">
                  <div style="width: 28px; height: 28px; border-radius: 50%; overflow: hidden; flex-shrink: 0;">
                    <img :src="reply.profilePicture || 'https://latestnewsandaffairs.site/public/pfp3.jpg'" :alt="`${reply.username || 'Unknown'}'s profile`" style="width: 100%; height: 100%; object-fit: cover;" />
                  </div>
                  <div style="flex: 1;">
                    <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 3px;">
                      <span style="font-size: 12px; color: #fff; font-weight: 600;">{{ reply.username || 'Unknown' }}</span>
                      <span style="font-size: 10px; color: #999;">{{ postsStore.getTimeAgo(new Date(reply.timestamp)) }}</span>
                    </div>
                    <p style="font-size: 11px; color: #ddd; margin: 0; line-height: 1.3;">{{ reply.reply || 'No reply' }}</p>
                    <button class="like-reply-btn" :class="{ liked: reply.likedBy?.includes(postsStore.loggedInUsername) }" @click="postsStore.likeReply(postsStore.selectedPost._id, comment.commentId, reply.replyId)" style="background: none; border: none; color: #fff; font-size: 11px; margin-top: 4px; display: flex; align-items: center; gap: 4px;">
                      ❤ <span class="like-count">{{ reply.hearts || 0 }}</span>
                    </button>
                  </div>
                </div>
                <div v-if="!comment.replies || comment.replies.length === 0" class="no-replies" style="color: #999; font-size: 11px; padding: 8px; text-align: center;">No replies yet</div>
                <div class="reply-input-container" style="display: flex; align-items: center; gap: 8px; margin-top: 8px;">
                  <input :id="`replyInput-${comment.commentId}`" type="text" placeholder="Add a reply…" style="width: 100%; padding: 8px 12px; border-radius: 20px; border: 1px solid #444; background: #000; color: #fff; font-size: 14px; outline: none;" @keyup.enter="postsStore.addReply(postsStore.selectedPost._id, comment.commentId, $event.target.value)" />
                  <button @click="postsStore.addReply(postsStore.selectedPost._id, comment.commentId, document.getElementById(`replyInput-${comment.commentId}`).value)" style="background: #007bff; color: #fff; padding: 6px 12px; border: none; border-radius: 20px; cursor: pointer; font-size: 14px;">Reply</button>
                </div>
              </div>
            </transition>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { usePostsStore } from './stores/postsStore';
import { useRouter, useRoute } from 'vue-router';
import { ref, inject, onMounted } from 'vue';

const postsStore = usePostsStore();
const router = useRouter();
const route = useRoute();
const notify = inject('notify'); // Inject notify function from App.vue
const showMoreMenu = ref(false);

// Initialize the store with the injected notify function
if (notify) {
  postsStore.initialize(notify);
}

// Navigate to Upload.vue for tweeting/replying
function tweetPost(postId, username) {
  router.push({ path: '/float', query: { replyToPostId: postId, replyToUsername: username } });
}

// Route to user profile
function redirectToUserProfile(username) {
  router.push({ name: 'UserProfile', params: { username } });
}

// Toggle more menu
function toggleMoreMenu() {
  showMoreMenu.value = !showMoreMenu.value;
}

// Share post URL
async function sharePost() {
  const postId = postsStore.selectedPost?._id;
  const message = postsStore.selectedPost?.message || 'Check out this post!';
  
  if (!postId) {
    notify?.('Error: No post selected to share');
    return;
  }

  const shareUrl = `${window.location.origin}/post/${postId}`;

  // ✅ Use Web Share API if available (mobile/native integration)
  if (navigator.share) {
    try {
      await navigator.share({
        title: 'Shared Post',
        text: message,
        url: shareUrl,
      });
      notify?.('Shared successfully!');
    } catch (err) {
      console.error('Share failed:', err);
      notify?.('Sharing canceled or failed.');
    }
  } else {
    // 🔁 Fallback: copy to clipboard
    try {
      await navigator.clipboard.writeText(shareUrl);
      notify?.('Post URL copied to clipboard!');
    } catch (err) {
      console.error('Clipboard error:', err);
      notify?.('Failed to copy URL. Please try manually.');
    }
  }
}


onMounted(async () => {
  const postId = route.params.id

  if (!postId) {
    notify?.('Error: No post ID provided')
    return router.push('/')
  }

  try {
    const response = await fetch(`https://199-ten.vercel.app/api/UserListChat?id=${postId}`)

    if (!response.ok) {
      notify?.(`Failed to fetch post (status ${response.status})`)
      return router.push('/')
    }

    const data = await response.json()

    if (data.post) {
      postsStore.selectedPost = data.post
    } else {
      notify?.('Post not found')
      router.push('/')
    }
  } catch (error) {
    console.error('❌ Fetch error:', error)
    notify?.('An error occurred while fetching the post')
    router.push('/')
  }
})
</script>
<style src="./Posts.css"></style>
<style>
.ping-icon{color:#00b4d8;fill:currentColor;}
</style>
