<template>
  <div class="full-screen-post-page" style="position: fixed; height: 100vh; overflow-y: auto;">
    <div v-if="!postsStore.selectedPost" style="color: #fff; text-align: center; padding: 20px;">
      <p>Loading post...</p>
    </div>
    
    <div v-else class="full-screen-post-content" style="background: #000; height: 100%; padding: 16px; box-sizing: border-box;">
      <!-- Header Navigation -->
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
      <button class="more-btn" @click="(e)=>toggleMoreMenu(e)" aria-label="More options" style="background: none; border: none; color: #fff; font-size: 20px; cursor: pointer;">
        <svg viewBox="0 0 24 24" width="24" height="24" fill="currentColor">
          <path d="M12 8c1.1 0 2-.9 2-2s-.9-2-2-2-2 .9-2 2 .9 2 2 2zm0 2c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2zm0 6c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2z"/>
        </svg>
      </button>

      <!-- Dropdown portaled to body -->
      <Teleport to="body">
    <div v-if="showMoreMenu" class="more-menu portal" :style="{
            position: 'fixed',
            top: headerMenuCoords.top + 'px',
            left: headerMenuCoords.left + 'px',
      minWidth: '200px',
            zIndex: 2000
          }">
          <button style="all:unset;display:block;padding:6px 8px;color:#fff;cursor:pointer;font-size:13px;width:100%;" @click="sharePost">Share</button>
          <button style="all:unset;display:block;padding:6px 8px;color:#fff;cursor:pointer;font-size:13px;width:100%;" @click="bookmarkPost">Bookmark</button>
          <button style="all:unset;display:block;padding:6px 8px;color:#ff6b6b;cursor:pointer;font-size:13px;width:100%;" @click="toggleMoreMenu">Close</button>
        </div>
      </Teleport>
    </div>
        </div>
      </div>
      
      <!-- Reply Preview -->
      <div v-if="postsStore.selectedPost.replyTo" class="reply-preview" style="border-left: 3px solid #00b4d8; padding: 10px; margin-bottom: 15px; background: #2a2a2a; border-radius: 8px;">
        <div style="display: flex; align-items: center; gap: 10px;">
          <img :src="postsStore.selectedPost.replyTo.profilePicture || '/favicon.png'" style="width: 32px; height: 32px; border-radius: 50%; object-fit: cover;" @error="e=>e.target.src='/favicon.png'" />
          <div>
            <strong style="color: #00b4d8;">{{ postsStore.selectedPost.replyTo.username }}</strong>
            <small style="color: #999; display: block;">{{ postsStore.formatTimestamp(postsStore.selectedPost.replyTo.timestamp) }}</small>
          </div>
        </div>
        <p style="font-size: 13px; color: #ccc; margin: 8px 0;" v-html="postsStore.parseMessage(postsStore.selectedPost.replyTo.message)"></p>
        <img v-if="postsStore.selectedPost.replyTo.photo" :src="postsStore.selectedPost.replyTo.photo" style="width: 100%; max-width: 150px; border-radius: 6px; margin-top: 8px;" />
      </div>
      
      <!-- Post Header -->
      <div style="display: flex; align-items: center; gap: 10px; margin-bottom: 15px;">
  <img :src="postsStore.selectedPost.profilePicture || '/favicon.png'" style="width: 40px; height: 40px; border-radius: 50%; object-fit: cover; cursor: pointer;" @click="$router.push(`/profile/${postsStore.selectedPost.username}`)" @error="e=>e.target.src='/favicon.png'" />
        <strong style="color: #fff; font-size: 16px;">{{ postsStore.selectedPost.username }}</strong>
      </div>
      
      <!-- Post Content -->
      <p style="font-size: 14px; color: #fff; margin: 10px 0; line-height: 1.5;" v-html="postsStore.parseMessage(postsStore.selectedPost.message)"></p>
      <img v-if="postsStore.selectedPost.photo" :src="postsStore.selectedPost.photo" style="width: 100%; max-height: 50vh; border-radius: 12px; margin-bottom: 15px; object-fit: cover;" loading="lazy" />
      <div style="color: #999; font-size: 12px; margin-bottom: 15px;">{{ postsStore.formatTimestamp(postsStore.selectedPost.timestamp) }}</div>
      
      <!-- Post Actions -->
      <div style="display: flex; gap: 15px; margin-bottom: 15px; align-items: center;">
        <button :class="{ liked: postsStore.selectedPost.likedBy?.includes(postsStore.loggedInUsername) }" @click="postsStore.likePost(postsStore.selectedPost._id)" style="background: none; border: none; color: #fff; display: flex; align-items: center; gap: 4px; cursor: pointer;">
          <svg viewBox="0 0 24 24" width="12" height="12"><path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41 0.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" stroke="#fff" stroke-width="1.2"/></svg>
          {{ postsStore.selectedPost.likes || 0 }}
        </button>

        <button style="background: none; border: none; color: #fff; display: flex; align-items: center; gap: 4px; cursor: pointer;">
          <svg viewBox="0 0 24 24" width="12" height="12" fill="none" stroke="#fff" stroke-width="1.5">
            <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
          </svg>
          {{ postsStore.selectedPost.commentCount || 0 }}
        </button>
        
        <button style="background: none; border: none; color: #fff; display: flex; align-items: center; gap: 4px; cursor: pointer;">
          <svg viewBox="0 0 24 24" width="12" height="12"><path d="M3 12h4l3-9 4 18 3-9h4" stroke="#fff" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" fill="none"/><circle cx="12" cy="12" r="2" stroke="#fff" stroke-width="1.5" opacity="0.6" fill="none"/></svg>
          {{ (postsStore.selectedPost?.views_count || 0) >= 1000 ? Math.floor((postsStore.selectedPost?.views_count || 0) / 1000) + 'K' : (postsStore.selectedPost?.views_count || 0) }} views
        </button>
        
        <button @click="postsStore.quotePost(postsStore.selectedPost)" style="background: none; border: none; color: #fff; display: flex; align-items: center; gap: 4px; cursor: pointer;">
          <svg viewBox="0 0 24 24" width="20" height="20"><path d="M9 17l-5-5 5-5" stroke="#fff" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" fill="none"/><path d="M20 18v-2a4 4 0 0 0-4-4H4" stroke="#fff" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" fill="none"/></svg>
        </button>
      </div>
      
      <!-- Comments Section -->
      <div class="comments-section">
        <!-- Comment Input -->
        <div style="margin-bottom: 15px; display: flex; align-items: center; gap: 10px;">
          <input v-model="postsStore.commentInputs[postsStore.selectedPost._id]" type="text" placeholder="Add a comment..." @keyup.enter="postsStore.addComment(postsStore.selectedPost._id)" style="width: 100%; padding: 8px 12px; border-radius: 20px; border: 1px solid #444; background: #000; color: #fff; font-size: 14px; outline: none;" />
          <button @click="postsStore.addComment(postsStore.selectedPost._id)" :disabled="!postsStore.commentInputs[postsStore.selectedPost._id]?.trim()" style="background: #007bff; color: #fff; padding: 6px 12px; border: none; border-radius: 20px; cursor: pointer; font-size: 14px;" :style="{ opacity: !postsStore.commentInputs[postsStore.selectedPost._id]?.trim() ? 0.5 : 1 }">Post</button>
        </div>
        
        <!-- Comments List -->
        <div style="max-height: 50vh; overflow-y: auto;">
          <div v-for="comment in (postsStore.selectedPost.comments || [])" :key="comment.commentId" style="background: #000; border-radius: 8px; margin-bottom: 8px; padding: 11px;">
            <div style="display: flex; align-items: flex-start; gap: 10px;">
              <img :src="comment.profilePicture || 'https://endless.sbs/public/pfp3.jpg'" style="width: 32px; height: 32px; border-radius: 50%; object-fit: cover;" />
              
              <div style="flex: 1;">
                <!-- Comment Header -->
                <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 4px;">
                  <span style="font-size: 13px; color: #fff; font-weight: 600;">{{ comment.username || "Unknown" }}</span>
                  <span style="font-size: 11px; color: #999;">{{ postsStore.getTimeAgo(new Date(comment.createdAt || comment.timestamp)) }}</span>
                </div>
                
                <!-- Comment Text -->
                <p style="font-size: 12px; color: #ddd; margin: 0 0 8px 0; line-height: 1.4;">{{ comment.commentText || comment.comment || "No comment" }}</p>
                
                <!-- Comment Actions -->
                <div style="display: flex; gap: 12px; align-items: center;">
                  <button :class="{ liked: (comment.likedBy || []).includes(postsStore.loggedInUsername) }" @click="postsStore.likeComment(postsStore.selectedPost._id, comment.commentId)" style="background: none; border: none; display: flex; align-items: center; gap: 4px; font-size: 12px; cursor: pointer; padding: 2px 4px; border-radius: 4px;" :style="{ backgroundColor: (comment.likedBy || []).includes(postsStore.loggedInUsername) ? '#ff4444' : 'transparent', color: (comment.likedBy || []).includes(postsStore.loggedInUsername) ? '#fff' : '#ccc' }">
                    ❤ <span>{{ comment.hearts || 0 }}</span>
                  </button>
                  
                  <button @click="postsStore.toggleReplies(postsStore.selectedPost._id, comment.commentId)" style="background: none; border: none; color: #1da1f2; display: flex; align-items: center; gap: 4px; font-size: 12px; cursor: pointer;">
                    <svg viewBox="0 0 24 24" width="16" height="16" fill="currentColor"><path d="M12 3C6.48 3 2 6.92 2 11.5c0 2.14 1.06 4.1 2.83 5.6L4 21l3.65-1.95c1.29.45 2.7.7 4.35.7 5.52 0 10-3.92 10-8.5S17.52 3 12 3z"/></svg>
                    Reply <span v-if="comment.replies?.length">({{ comment.replies.length }})</span>
                  </button>
                  
                  <button v-if="comment.username === postsStore.loggedInUsername" @click="postsStore.deleteComment(postsStore.selectedPost._id, comment.commentId)" style="background: none; border: none; color: #ff4d4d; font-size: 12px; cursor: pointer;">Delete</button>
                </div>
                
                <transition name="slide-down">
                  <!-- Reply Section -->
                  <div v-if="postsStore.replyToggles[comment.commentId]" class="reply-layer" style="margin-top: 10px; padding: 12px; background: #000; border-radius: 8px; border-left: 3px solid #1da1f2; box-shadow: 0 2px 6px rgba(0, 0, 0, 0.3);">
                    <!-- Reply Input -->
                    <div style="margin-bottom: 10px; display: flex; gap: 8px;">
                      <input v-model="postsStore.replyInputs[comment.commentId]" type="text" placeholder="Reply to this comment..." @keyup.enter="postsStore.addReply(postsStore.selectedPost._id, comment.commentId)" style="flex: 1; padding: 6px 10px; border-radius: 16px; border: 1px solid #333; background: #000; color: #fff; font-size: 13px;" />
                      <button @click="postsStore.addReply(postsStore.selectedPost._id, comment.commentId)" :disabled="!postsStore.replyInputs[comment.commentId]?.trim()" style="background: #1da1f2; color: #fff; padding: 5px 12px; border: none; border-radius: 16px; cursor: pointer; font-size: 13px;" :style="{ opacity: !postsStore.replyInputs[comment.commentId]?.trim() ? 0.5 : 1 }">Reply</button>
                    </div>
                    
                    <!-- Replies List -->
                    <div style="margin-left: 20px; margin-top: 10px;">
                      <div v-for="reply in (comment.replies || [])" :key="reply.commentId" style="background: #000; border-radius: 6px; padding: 8px; margin-bottom: 6px; position: relative;">
                        <div style="display: flex; align-items: flex-start; gap: 8px;">
                          <img :src="reply.profilePicture || 'https://endless.sbs/public/pfp4.jpg'" style="width: 28px; height: 28px; border-radius: 50%; object-fit: cover;" />
                          
                          <!-- Content container with right padding for the heart -->
                          <div style="flex: 1; padding-right: 40px;">
                            <!-- Username and timestamp -->
                            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 4px;">
                              <span style="font-size: 12px; color: #fff; font-weight: 500;">{{ reply.username || "Unknown" }}</span>
                              <span style="font-size: 10px; color: #aaa; ">{{ postsStore.getTimeAgo(new Date(reply.createdAt || reply.timestamp)) }}</span>
                            </div>
                            
                            <p style="font-size: 11px; color: #ccc; margin: 0 0 6px 0; line-height: 1.4;">
                              {{ reply.commentText || reply.reply || "No reply" }}
                            </p>
                          </div>
                        </div>

                        <!-- Heart button floating right middle -->
                        <div style="position: absolute; right: 8px; top: 50%; transform: translateY(-50%);">
                          <button :class="{ liked: (reply.likedBy || []).includes(postsStore.loggedInUsername) }" @click="postsStore.likeReply(postsStore.selectedPost._id, comment.commentId, reply.commentId)" style="background: none; border: none; display: flex; align-items: center; gap: 2px; font-size: 11px; cursor: pointer; padding: 2px; border-radius: 2px;" :style="{ backgroundColor: (reply.likedBy || []).includes(postsStore.loggedInUsername) ? '#ff4444' : 'transparent', color: (reply.likedBy || []).includes(postsStore.loggedInUsername) ? '#fff' : '#ccc' }">
                            ❤ <span>{{ reply.hearts || 0 }}</span>
                          </button>
                          
                          <button v-if="reply.username === postsStore.loggedInUsername" @click="postsStore.deleteReply(postsStore.selectedPost._id, comment.commentId, reply.commentId)" style="background: none; border: none; color: #ff4d4d; font-size: 11px; cursor: pointer;">Delete</button>
                        </div>
                      </div>
                    </div>
                  </div>
                </transition>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Modal for Delete Confirmations -->
    <div v-if="postsStore.showModal" class="modal" style="position: fixed; top: 0; left: 0; width: 100%; height: 100%; background: rgba(0, 0, 0, 0.8); display: flex; justify-content: center; align-items: center; z-index: 1000;">
      <div class="modal-content" style="background: #1a1a1a; border-radius: 12px; padding: 24px; max-width: 400px; width: 90%; box-shadow: 0 4px 20px rgba(0, 0, 0, 0.5);">
        <p style="color: #fff; font-size: 16px; margin: 0 0 20px 0; text-align: center;">{{ postsStore.modalMessage }}</p>
        <div class="modal-actions" style="display: flex; gap: 12px; justify-content: center;">
          <button class="modal-cancel" @click="postsStore.closeModal" style="background: #333; color: #fff; border: none; padding: 10px 20px; border-radius: 8px; cursor: pointer; font-size: 14px;">Cancel</button>
          <button class="modal-confirm" @click="postsStore.modalAction" style="background: #ff4444; color: #fff; border: none; padding: 10px 20px; border-radius: 8px; cursor: pointer; font-size: 14px;">Yes, {{ postsStore.modalActionText }}</button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, inject } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { usePostsStore } from './stores/postsStore'
import { onBeforeUnmount } from 'vue'

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

const sharePost = async () => {
  const post = postsStore.selectedPost
  if (!post?._id) {
    notify('Error: No post selected to share')
    return
  }

  const shareUrl = `${window.location.origin}/post/${post._id}`
  const message = post.message || 'Check out this post!'

  if (navigator.share) {
    try {
      await navigator.share({ title: 'Shared Post', text: message, url: shareUrl })
      notify('Shared successfully!')
    } catch {
      notify('Sharing canceled or failed.')
    }
  } else {
    try {
      await navigator.clipboard.writeText(shareUrl)
      notify('Post URL copied to clipboard!')
    } catch {
      notify('Failed to copy URL. Please try manually.')
    }
  }
}


onMounted(async () => {
  console.log('FullScreenPost component mounted')
  console.log('Current route:', route)
  console.log('Route params:', route.params)
  console.log('Route path:', route.path)
  
  // Initialize the posts store first
  postsStore.initialize(notify)
  
  // Extract post ID from route - check multiple possible parameter names
  const postId = route.params.id || route.params.postId || route.query.id || route.query.postId
  console.log('Extracted post ID:', postId)
  
  if (!postId) {
    console.error('No post ID found in route')
    console.log('Available route params:', Object.keys(route.params))
    console.log('Available route query:', Object.keys(route.query))
    notify('Error: No post ID found in URL', true)
    return
  }
  
  try {
    console.log('Calling openFullScreenPost with ID:', postId)
    await postsStore.openFullScreenPost(postId)
    
    if (postsStore.selectedPost) {
      console.log('Post loaded successfully:', postsStore.selectedPost._id)
      console.log('Comments count:', postsStore.selectedPost.comments?.length || 0)
      
      // Track post view after successful load
      await trackPostView(postId)
    } else {
      console.error('selectedPost is still null after API call')
      notify('Failed to load post details', true)
    }
  } catch (error) {
    console.error('Error loading full screen post:', error)
    notify('Error loading post: ' + error.message, true)
  }
})

onBeforeUnmount(()=>{
  window.removeEventListener('click', handleGlobalClick, { capture:true });
  window.removeEventListener('keydown', handleEsc);
});
</script>

<style src="./Posts.css"></style>
<style scoped>
.heart-icon{fill:#222;transition:fill .3s ease,stroke .3s ease}.like-btn.liked .heart-icon{fill:#ff4d4d;stroke:#ff4d4d}.views-icon{transition:stroke .3s ease,transform .2s ease,opacity .2s ease}.reply-icon{transition:stroke .3s ease,transform .2s ease}.thumbs-down-icon,.round.comments{vertical-align:middle;margin-right:6px;transform:scaleX(-1)}
</style>
