<template>
  <div>
    <div id="loading" v-show="loading" class="loading"><div class="spinner"></div></div>
    <div class="Sort">
      <button class="sort-button" :class="{ active: sortOption === 'most-liked' }" @click="sortPosts('most-liked')">General</button>
      <button class="sort-button" :class="{ active: sortOption === 'most-comments' }" @click="sortPosts('most-comments')">Trending</button>
      <button class="sort-button" :class="{ active: sortOption === 'newest' }" @click="sortPosts('newest')">Newest</button>
    </div>

    <div class="content-wrapper">
      <div id="posts" class="posts-feed">
        <div v-for="post in posts" :key="post._id" class="post-card" :data-id="post._id" :data-liked-by="JSON.stringify(post.likedBy || [])" :data-disliked-by="JSON.stringify(post.dislikedBy || [])">
       <!-- Reply Preview (if post is a reply) -->
<div v-if="post.replyTo" class="reply-preview"
     style="background: linear-gradient(135deg, #1a1a1a, #2a2a2a); border-left: 2px solid #00b4d8; padding: 10px; margin-bottom: 12px; border-radius: 8px; box-shadow: 0 0 6px rgba(0, 180, 216, 0.3);">

  <div class="reply-header" style="display: flex; align-items: center; gap: 10px; margin-bottom: 6px;">
    <img :src="post.replyTo.profilePicture || 'https://latestnewsandaffairs.site/public/pfp.jpg'" 
         alt="User Profile Picture"
         style="width: 28px; height: 28px; border-radius: 50%; object-fit: cover; border: 1px solid #444;" />
    <div style="display: flex; flex-direction: column;">
      <strong style="color: #00b4d8;">{{ post.replyTo.username }}</strong>
      <small style="color: #999;">{{ formatTimestamp(post.replyTo.timestamp) }}</small>
    </div>
  </div>

  <p style="font-size: 13px; color: #ccc; margin: 4px 0;" v-html="parseMessage(post.replyTo.message)"></p>

  <img v-if="post.replyTo.photo"
       :src="post.replyTo.photo"
       alt="Replied Post Image"
       style="width: 100%; max-width: 150px; border-radius: 6px; margin-top: 6px;" />
</div>


          <!-- Post Header -->
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
          <!-- Post Message with Tagged Usernames -->
          <p class="post-message" style="font-size: 13px; margin-top: 8px; font-family: 'Whitney', 'Helvetica Neue', Helvetica, Arial, sans-serif; cursor: pointer;" v-html="parseMessage(post.message)" @click="openFullScreenPost(post._id)"></p>
          <img v-if="post.photo" :src="post.photo" alt="Post Image" style="width: 100%; max-width:300px; max-height:280px; border-radius: 10px; margin-bottom: 10px; cursor: pointer;" @click="openFullScreenPost(post._id)" />
          <div class="post-timestamp"><small>{{ formatTimestamp(post.timestamp) }}</small></div>
          <!-- Actions -->
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
            <button class="comment-btn" @click="openFullScreenPost(post._id)" style="color:#1da1f2; max-height:40px;margin: 0%;border: none;padding: 0%;">
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
            <button v-if="post.username === loggedInUsername || post.sessionId === sessionId" @click="editPost(post._id, post.username)">Edit</button>
            <button v-if="post.username === loggedInUsername || post.sessionId === sessionId" @click="deletePost(post._id)">Delete</button>
          </div>
        </div>
      </div>

      <!-- Full Screen Post Modal -->
      <div v-if="selectedPost" class="full-screen-post-modal" @click.self="closeFullScreenPost">
        <div class="full-screen-post-content">
          <button class="close-full-screen-btn" @click="closeFullScreenPost" aria-label="Close full-screen post">✖</button>
          <div v-if="selectedPost.replyTo" class="reply-preview" style="border-left: 3px solid #ccc; padding-left: 10px; margin-bottom: 10px; background-color: #f8f8f8; border-radius: 5px;">
            <div class="reply-header">
              <strong>{{ selectedPost.replyTo.username }}</strong>
              <small>{{ formatTimestamp(selectedPost.replyTo.timestamp) }}</small>
            </div>
            <p style="font-size: 12px; color: #555;" v-html="parseMessage(selectedPost.replyTo.message)"></p>
            <img v-if="selectedPost.replyTo.photo" :src="selectedPost.replyTo.photo" alt="Replied Post Image" style="width: 100%; max-width: 150px; border-radius: 5px;" />
          </div>
          <div class="post-header">
            <div class="profile-picture" @click="showUserProfile(selectedPost.username, selectedPost.profilePicture)">
              <img :src="selectedPost.profilePicture || 'pfp2.jpg'" :alt="`${selectedPost.username}'s profile picture`" />
            </div>
            <div class="username"><strong>{{ selectedPost.username }}</strong></div>
          </div>
          <p class="post-message" style="font-size: 13px; margin-top: 10px;" v-html="parseMessage(selectedPost.message)"></p>
          <img v-if="selectedPost.photo" :src="selectedPost.photo" alt="Post Image" loading="lazy" style="width: 100%; max-height: 50vh; border-radius: 10px; margin-bottom: 10px;" />
          <div class="post-timestamp"><small>{{ formatTimestamp(selectedPost.timestamp) }}</small></div>
          <div class="actions" style="margin: 10px 0;">
            <button class="like-btn" :class="{ liked: selectedPost.likedBy?.includes(loggedInUsername) }" @click="likePost(selectedPost._id)">
              <svg class="thumbs-up-icon" viewBox="0 0 24 24" width="20" height="20" fill="currentColor">
                <path d="M1 21h4V9H1v12zM23 10c0-1.1-.9-2-2-2h-6.31l.95-4.57.03-.32a1 1 0 0 0-.29-.7L14 2 7.59 8.41A1.98 1.98 0 0 0 7 9.83V19a2 2 0 0 0 2 2h9a2 2 0 0 0 2-2l1-7v-.01L23 10z"/>
              </svg> {{ selectedPost.likes || 0 }}
            </button>
            <button class="dislike-btn" :class="{ disliked: selectedPost.dislikedBy?.includes(loggedInUsername) }" @click="dislikePost(selectedPost._id)">
              <svg class="thumbs-down-icon" viewBox="0 0 24 24" width="20" height="20" fill="currentColor">
                <path d="M1 3h4v12H1V3zm22 11c0 1.1-.9 2-2 2h-6.31l.95 4.57.03.32a1 1 0 0 1-.29.7L14 22l-6.41-6.41A1.98 1.98 0 0 1 7 14.17V5a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2l1 7v.01L23 14z"/>
              </svg> {{ selectedPost.dislikes || 0 }}
            </button>
            <button class="comment-btn" style="color:#ff1100;">
              <svg class="round comments" viewBox="0 0 24 24" width="20" height="20" fill="currentColor" style="display: inline-flex; align-items: center; justify-content: center; margin-bottom: 10px;">
                <path d="M12 3C6.48 3 2 6.92 2 11.5c0 2.14 1.06 4.1 2.83 5.6L4 21l3.65-1.95c1.29.45 2.7.7 4.35.7 5.52 0 10-3.92 10-8.5S17.52 3 12 3z"/>
              </svg> ({{ selectedPost.comments?.length || 0 }})
            </button>
            <button class="tweet-btn" @click="tweetPost(selectedPost._id, selectedPost.username)" style="border: none; font-size: 12px;">
              <svg viewBox="0 0 24 24" width="20" height="20" fill="currentColor">
                <path d="M22.46 6c-.77.35-1.6.58-2.46.69a4.3 4.3 0 0 0 1.88-2.38c-.82.49-1.73.83-2.69 1.02A4.26 4.26 0 0 0 15.88 4c-2.35 0-4.27 1.92-4.27 4.29 0 .34.04.67.11 1-3.55-.18-6.71-1.89-8.82-4.48-.37.63-.58 1.37-.58 2.15 0 1.49.76 2.81 1.91 3.58-.7-.02-1.36-.22-1.94-.54v.05c0 2.08 1.48 3.82 3.44 4.21-.36.1-.74.15-1.13.15-.28 0-.55-.03-.81-.08.55 1.73 2.15 2.99 4.04 3.03-1.48 1.16-3.34 1.85-5.36 1.85-.35 0-.69-.02-1.03-.06 1.91 1.23 4.18 1.94 6.62 1.94 7.94 0 12.29-6.58 12.29-12.29 0-.19 0-.37-.01-.56.84-.61 1.57-1.37 2.15-2.24z"/>
              </svg>
              Tweet
            </button>
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
                      <span style="font-size: 14px;">{{ comment.username || "Unknown" }}</span>
                      <span style="font-size: 12.5px; color: #ccc;">{{ getTimeAgo(new Date(comment.timestamp)) }}</span>
                    </div>
                    <div style="font-size: 12px; color: #fff; margin-top: 5px;">{{ comment.comment || "No comment" }}</div>
                    <div style="font-size: 10px; margin-top: 8px; display: flex; align-items: center; gap: 15px;">
                      <button class="like-comment-btn" :class="{ liked: comment.likedBy?.includes(loggedInUsername) }" @click="likeComment(selectedPost._id, comment.commentId, comment.username)">❤️ <span class="like-count">{{ comment.hearts || 0 }}</span></button>
                      <button class="reply-btn" @click="toggleReplies(selectedPost._id, comment.commentId, comment.username, $event.target)">
                        <svg class="round comments" viewBox="0 0 24 24" width="20" height="20" fill="currentColor" style="display: inline-flex; align-items: center; justify-content: center; margin-bottom: 10px;">
                          <path d="M12 3C6.48 3 2 6.92 2 11.5c0 2.14 1.06 4.1 2.83 5.6L4 21l3.65-1.95c1.29.45 2.7.7 4.35.7 5.52 0 10-3.92 10-8.5S17.52 3 12 3z"/>
                        </svg> <span v-if="comment.replies?.length > 0">({{ comment.replies.length }})</span>
                      </button>
                      <button v-if="comment.username === loggedInUsername || comment.sessionId === sessionId" class="delete-comment-btn" @click="deleteComment(selectedPost._id, comment.commentId)">🗑️ Delete</button>
                    </div>
                  </div>
                </div>
                <div v-for="reply in comment.replies" :key="reply.replyId" :id="`reply-${reply.replyId}`" class="reply" style="margin-bottom: 6px; display: flex; background-color: #000; padding: 5px 10px; border-radius: 8px; margin-left: 35px;">
                  <div style="width: 30px; height: 30px; border-radius: 50%; overflow: hidden; margin-right: 10px;">
                    <img :src="reply.profilePicture || 'https://latestnewsandaffairs.site/public/pfp3.jpg'" :alt="`${reply.username || 'Unknown'}'s profile`" style="width: 100%; height: 100%; object-fit: cover;" />
                  </div>
                  <div style="font-size: 12px; display: flex; flex-direction: column;">
                    <div style="display: flex; justify-content: space-between;">
                      <span style="font-size: 13px;">{{ reply.username || 'Unknown' }}</span>
                      <span style="font-size: 10px; color: #ccc;">{{ getTimeAgo(new Date(reply.timestamp)) }}</span>
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
      <div class="right-sidebar">
        What A day That was perfect 
        handleInputChange
        What A day That was perfect 
        handleInputChange
        What A day That was perfect 
        handleInputChange
        What A day That was perfect 
        handleInputChange
        What A day That was perfect 
        handleInputChange
        Can be used for anything like ads/top accounts/so on
      </div>
    </div>
  </div>
</template>

<script setup>
import usePosts from './Posts.js'
import { useRouter, useRoute, onBeforeRouteUpdate } from 'vue-router'
import { inject, watch } from 'vue'

const selectedSort = inject('selectedSort')

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
  userProfile,
  searched,
  searchQuery,
  relationshipStatus
} = usePosts()

const router = useRouter()
const route = useRoute()

// Method to parse message for tagged usernames
const parseMessage = (message) => {
  if (!message) return '';
  return message.replace(/@(\w+)/g, '<span class="tagged-user"style="color: red;" @click="redirectToUserProfile(\'$1\')">@$1</span>');
}

// Navigate to Upload.vue for tweeting/replying
function tweetPost(postId, username) {
  router.push({ path: '/float', query: { replyToPostId: postId, replyToUsername: username } })
}

watch(selectedSort, (newVal) => {
  sortPosts(newVal)
}, { immediate: true })

function onExternalSort(type) {
  sortPosts(type)
}

defineExpose({
  onExternalSort
})

watch(
  () => route.query.reset,
  (val) => {
    if (val === 'true') {
      posts.value = []
      router.replace({ query: { ...route.query, reset: undefined } })
    }
  },
  { immediate: true }
)

onBeforeRouteUpdate((to, from, next) => {
  if (to.name === 'Posts' && from.name === 'Search2') {
    posts.value = []
  }
  next()
})

function redirectToUserProfile(username) {
  router.push({ name: 'UserProfile', params: { username } })
}
</script>
<style scoped>
.content-wrapper {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
}
</style>
<style src="./Posts.css"></style>




