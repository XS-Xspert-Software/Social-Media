// Posts.js
import { ref, onMounted, onUnmounted, computed } from 'vue';
import Ably from 'ably';

export default function usePosts() {
  const posts = ref([]);
  const currentPage = ref(1);
  const loading = ref(false);
  const hasMorePosts = ref(true);
  const sortOption = ref('most-liked');
  const postText = ref('');
  const imagePreview = ref(null);
  const imageData = ref(null);
  const lastSentPostId = ref(null);
  const loggedInUsername = ref(localStorage.getItem('username') || '');
  const userId = ref(localStorage.getItem('userId') || '');
  const sessionId = ref(localStorage.getItem('sessionId') || null);
  const showModal = ref(false);
  const modalMessage = ref('');
  const modalAction = ref(null);
  const modalActionText = ref('');
  const selectedPost = ref(null);    // Authentication computed properties

  const isAuthenticated = computed(() => {
    return loggedInUsername.value && 
           loggedInUsername.value.trim() !== '' && 
           loggedInUsername.value !== 'Guest';
  });

  const requireAuth = (action = 'perform this action') => {
    if (!isAuthenticated.value) {
      showNotification(`Please log in to ${action}`, true);
      return false;
    }
    return true;
  };

    const ably = new Ably.Realtime('eCkrsA.JzcmYQ:JLywAltPtm-KWD6Rd0MItQRgi-I4R7zn6BpI1UVQ3Eg'); // Replace with your actual Ably API key
    
    const generateSessionId = () => {
      const array = new Uint8Array(16); // 16 bytes = 128 bits
      window.crypto.getRandomValues(array);
      return Array.from(array, byte => byte.toString(16).padStart(2, '0')).join('');
    };

    // Get channel for real-time updates
    const channel = ably.channels.get('posts-channel');

    // Fetch posts
    const fetchPosts = async (page = 1, sort = 'newest') => {
      try {
        const response = await fetch(
          `https://sports321.vercel.app/api/posts?page=${page}&limit=16&sort=${sort}`
        );
        if (!response.ok) throw new Error('Failed to load posts');
        return await response.json();
      } catch (error) {
        console.error('Error fetching posts:', error);
        return { posts: [], hasMorePosts: false };
      }
    };

    // Load more posts
    const loadMorePosts = async () => {
      if (loading.value || !hasMorePosts.value) return;
      loading.value = true;
      const newPosts = await fetchPosts(currentPage.value, sortOption.value);
      if (newPosts?.posts?.length > 0) {
        posts.value.push(
          ...newPosts.posts.map(post => ({
            ...post,
            comments: post.comments?.map(comment => ({
              ...comment,
              showReplies: false,
              replies: Array.isArray(comment.replies) ? comment.replies : [],
            })) || [],
            likedBy: post.likedBy || [],
            dislikedBy: post.dislikedBy || [],
          }))
        );
        currentPage.value++;
        hasMorePosts.value = newPosts.hasMorePosts;
      } else {
        hasMorePosts.value = false;
      }
      loading.value = false;
    };

    // Sort posts
    const sortPosts = sortBy => {
      sortOption.value = sortBy;
      posts.value = [];
      currentPage.value = 1;
      hasMorePosts.value = true;
      loadMorePosts();
    };

    // Add post to feed
    const addPostToFeed = (post, isNewPost = false) => {
      if (!post || !post._id) return;
      const formattedPost = {
        ...post,
        likes: post.likes || 0,
        dislikes: post.dislikes || 0,
        comments: post.comments?.map(comment => ({
          ...comment,
          showReplies: false,
          replies: Array.isArray(comment.replies) ? comment.replies : [],
        })) || [],
        views: post.views || 0,
        likedBy: post.likedBy || [],
        dislikedBy: post.dislikedBy || [],
      };
      if (isNewPost) {
        posts.value.unshift(formattedPost);
      } else {
        posts.value.push(formattedPost);
      }
      incrementViewOnScroll(post._id);
    };

    // Format timestamp
    const formatTimestamp = timestamp => {
      const date = new Date(timestamp);
      if (isNaN(date)) return 'Invalid Date';
      return date.toLocaleString('en-GB', {
        day: 'numeric',
        month: 'long',
        hour: '2-digit',
        minute: '2-digit',
      });
    };

    // Get time ago
    const getTimeAgo = date => {
      const now = new Date();
      const diffInSeconds = Math.floor((now - date) / 1000);
      const years = Math.floor(diffInSeconds / (60 * 60 * 24 * 365));
      const days = Math.floor(diffInSeconds / (60 * 60 * 24));
      const hours = Math.floor(diffInSeconds / (60 * 60));
      const minutes = Math.floor(diffInSeconds / 60);
      if (years > 0) return `${years} year${years > 1 ? 's' : ''} ago`;
      if (days > 0) return `${days} day${days > 1 ? 's' : ''} ago`;
      if (hours > 0) return `${hours} hour${hours > 1 ? 's' : ''} ago`;
      if (minutes > 0) return `${minutes} minute${minutes > 1 ? 's' : ''} ago`;
      return 'Just now';
    };

    // Show user profile
    const showUserProfile = (username, profilePicture) => {
      window.location.href = `search2.html?username=${encodeURIComponent(
        username
      )}`;
    };

    // Scroll handler
    const handleScroll = () => {
      if (
        window.innerHeight + window.scrollY >=
        document.body.offsetHeight - 500
      ) {
        loadMorePosts();
      }
      posts.value.forEach(post => incrementViewOnScroll(post._id));
    };

    // Increment view on scroll
    const incrementViewOnScroll = postId => {
      const postElement = document.querySelector(
        `.post-card[data-id="${postId}"]`
      );
      if (postElement && isElementInViewport(postElement)) {
        const hasViewed = sessionStorage.getItem(`viewed_${postId}`);
        if (!hasViewed) {
          const post = posts.value.find(p => p._id === postId);
          if (post) {
            post.views = (post.views || 0) + 1;
            sessionStorage.setItem(`viewed_${postId}`, 'true');
            sessionStorage.setItem(`views_${postId}`, post.views);
            updatePostInFeed({ _id: postId, views: post.views });
          }
        }
      }
    };

    // Check if element is in viewport
    const isElementInViewport = el => {
      const rect = el.getBoundingClientRect();
      return (
        rect.top >= 0 &&
        rect.left >= 0 &&
        rect.bottom <=
          (window.innerHeight || document.documentElement.clientHeight) &&
        rect.right <= (window.innerWidth || document.documentElement.clientWidth)
      );
    };

    // Open full-screen post with comments visible
    const openFullScreenPost = postId => {
      const post = posts.value.find(p => p._id === postId);
      if (post) {
        selectedPost.value = { ...post, showComments: true }; // Show comments by default
        incrementViewOnScroll(postId);
      }
    };

    // Close full-screen post
    const closeFullScreenPost = () => {
      selectedPost.value = null;
    };

    // Like post
    const likePost = async postId => {
        if (!requireAuth('like posts')) return;
      const post = posts.value.find(p => p._id === postId);
      if (!post) return;
      const likedBy = post.likedBy || [];
      const dislikedBy = post.dislikedBy || [];
      let likeCount = post.likes || 0;
      if (likedBy.includes(loggedInUsername.value)) {
        likeCount--;
        post.likedBy = likedBy.filter(user => user !== loggedInUsername.value);
      } else {
        likeCount++;
        post.likedBy = [...likedBy, loggedInUsername.value];
        if (dislikedBy.includes(loggedInUsername.value)) {
          post.dislikes--;
          post.dislikedBy = dislikedBy.filter(
            user => user !== loggedInUsername.value
          );
        }
      }
      post.likes = likeCount;
      if (selectedPost.value?._id === postId) {
        selectedPost.value = { ...post, showComments: true }; // Keep comments visible
      }
      try {
        const response = await fetch('https://sports123.vercel.app/api/editPost', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            postId,
            username: loggedInUsername.value,
            action: 'like',
          }),
        });
        if (!response.ok) throw new Error('Failed to like post');
        const result = await response.json();
        showNotification('Post liked successfully!', false);
        updatePostInFeed(result);
      } catch (error) {
        showNotification(error.message, true);
        post.likes--;
      }
    };

    // Dislike post
    const dislikePost = async postId => {
        if (!requireAuth('dislike posts')) return;
      const post = posts.value.find(p => p._id === postId);
      if (!post) return;
      const likedBy = post.likedBy || [];
      const dislikedBy = post.dislikedBy || [];
      let dislikeCount = post.dislikes || 0;
      if (dislikedBy.includes(loggedInUsername.value)) {
        dislikeCount--;
        post.dislikedBy = dislikedBy.filter(
          user => user !== loggedInUsername.value
        );
      } else {
        dislikeCount++;
        post.dislikedBy = [...dislikedBy, loggedInUsername.value];
        if (likedBy.includes(loggedInUsername.value)) {
          post.likes--;
          post.likedBy = likedBy.filter(user => user !== loggedInUsername.value);
        }
      }
      post.dislikes = dislikeCount;
      if (selectedPost.value?._id === postId) {
        selectedPost.value = { ...post, showComments: true }; // Keep comments visible
      }
      try {
        const response = await fetch('https://sports123.vercel.app/api/editPost', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            postId,
            username: loggedInUsername.value,
            action: 'dislike',
          }),
        });
        if (!response.ok) throw new Error('Failed to dislike post');
        const result = await response.json();
        showNotification('Post disliked successfully!', false);
        updatePostInFeed(result);
      } catch (error) {
        showNotification(error.message, true);
        post.dislikes--;
      }
    };

    // Update post in feed
    const updatePostInFeed = updatedPost => {
      const index = posts.value.findIndex(p => p._id === updatedPost._id);
      if (index !== -1) {
        posts.value[index] = {
          ...posts.value[index],
          ...updatedPost,
          comments: updatedPost.comments?.map(comment => ({
            ...comment,
            showReplies: posts.value[index].comments.find(
              c => c.commentId === comment.commentId
            )?.showReplies || false,
            replies: Array.isArray(comment.replies) ? comment.replies : [],
          })) || [],
          likedBy: updatedPost.likedBy || posts.value[index].likedBy,
          dislikedBy: updatedPost.dislikedBy || posts.value[index].dislikedBy,
        };
        if (selectedPost.value?._id === updatedPost._id) {
          selectedPost.value = { ...posts.value[index], showComments: true }; // Keep comments visible
        }
      }
    };

    // Add comment
    const addComment = async postId => {
      if (!requireAuth('add comments')) return;
      const input = document.getElementById(`commentInput-${postId}`);
      const commentText = input.value.trim();
      if (!commentText) return;
      const commentId = Date.now().toString();
      const newComment = {
        commentId,
        username: loggedInUsername.value,
        comment: commentText,
        timestamp: new Date().toISOString(),
        profilePicture: localStorage.getItem('profilePic') || 'pfp2.jpg',
        hearts: 0,
        replies: [],
      };
      const post = posts.value.find(p => p._id === postId);
      if (post) {
        post.comments.push(newComment);
        if (selectedPost.value?._id === postId) {
          selectedPost.value.comments = [...post.comments]; // Update full-screen post
        }
        try {
          const response = await fetch('https://sports123.vercel.app/api/editPost', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              postId,
              username: loggedInUsername.value,
              action: 'comment',
              comment: commentText,
              commentId,
            }),
          });
          if (!response.ok) throw new Error('Failed to add comment');
          const result = await response.json();
          updatePostInFeed(result);
          input.value = '';
        } catch (error) {
          post.comments = post.comments.filter(c => c.commentId !== commentId);
          showNotification(error.message, true);
        }
      }
    };

    // Toggle replies
    const toggleReplies = (postId, commentId, commentUsername, buttonElement) => {
      const post = posts.value.find(p => p._id === postId);
      if (!post) return;
      const comment = post.comments.find(c => c.commentId === commentId);
      if (comment) {
        comment.showReplies = !comment.showReplies;
        if (selectedPost.value?._id === postId) {
          selectedPost.value.comments.find(c => c.commentId === commentId).showReplies = comment.showReplies; // Sync full-screen post
        }
        showReplyBox(postId, commentId, commentUsername);
      }
    };

    // Show reply box
    const showReplyBox = (postId, commentId, commentUsername) => {
      const repliesContainer = document.getElementById(`replies-${commentId}`);
      const existingReplyBox = document.getElementById(`reply-box-${commentId}`);
      if (existingReplyBox) existingReplyBox.remove();
      const replyBox = document.createElement('div');
      replyBox.id = `reply-box-${commentId}`;
      replyBox.className = 'reply-box';
      replyBox.innerHTML = `
        <input
          type="text"
          id="reply-input-${commentId}"
          placeholder="Write a reply..."
          class="reply-input"
        />
        <button onclick="document.getElementById('add-reply-${commentId}').click()">
          Send
        </button>
        <button
          id="add-reply-${commentId}"
          style="display: none;"
          onclick="window.vueInstance.addReply('${postId}', '${commentId}', document.getElementById('reply-input-${commentId}').value, '${loggedInUsername.value}')"
        ></button>
      `;
      repliesContainer.appendChild(replyBox);
    };

    // Add reply
    const addReply = async (postId, commentId, replyText, replyUsername) => {
        if (!requireAuth('add replies')) return;
      if (!replyText.trim()) {
        console.error('Reply cannot be empty');
        return;
      }
      const replyId = Date.now().toString();
      const post = posts.value.find(p => p._id === postId);
      if (!post) return;
      const comment = post.comments.find(c => c.commentId === commentId);
      if (!comment) return;
      const newReply = {
        replyId,
        username: replyUsername,
        reply: replyText,
        timestamp: new Date().toISOString(),
        profilePicture: localStorage.getItem('profilePic') || 'pfp2.jpg',
        hearts: 0,
      };
      comment.replies.push(newReply);
      comment.showReplies = true;
      if (selectedPost.value?._id === postId) {
        selectedPost.value.comments = [...post.comments]; // Update full-screen post
      }
      try {
        const response = await fetch('https://sports321.vercel.app/api/editPost', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            postId,
            commentId,
            username: replyUsername,
            action: 'reply',
            reply: replyText,
            replyId,
          }),
        });
        if (!response.ok) throw new Error('Failed to add reply');
        const updatedPost = await response.json();
        updatePostInFeed(updatedPost);
      } catch (error) {
        comment.replies = comment.replies.filter(r => r.replyId !== replyId);
        showNotification('Error adding reply: ' + error.message, true);
      }
    };

    // Like comment
    const likeComment = async (postId, commentId, commentUsername) => {
        if (!requireAuth('like comments')) return;
      const post = posts.value.find(p => p._id === postId);
      if (!post) return;
      const comment = post.comments.find(c => c.commentId === commentId);
      if (!comment) return;
      const isAlreadyLiked = comment.likedBy?.includes(loggedInUsername.value);
      comment.likedBy = comment.likedBy || [];
      let likeCount = comment.hearts || 0;
      if (isAlreadyLiked) {
        comment.hearts = likeCount - 1;
        comment.likedBy = comment.likedBy.filter(
          user => user !== loggedInUsername.value
        );
      } else {
        comment.hearts = likeCount + 1;
        comment.likedBy.push(loggedInUsername.value);
      }
      if (selectedPost.value?._id === postId) {
        selectedPost.value.comments = [...post.comments]; // Update full-screen post
      }
      try {
        const response = await fetch('https://sports321.vercel.app/api/editPost', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            postId,
            username: loggedInUsername.value,
            action: 'heart comment',
            commentId,
          }),
        });
        if (!response.ok) throw new Error('Failed to update comment');
        const updatedPost = await response.json();
        updatePostInFeed(updatedPost);
      } catch (error) {
        console.error('Error liking comment:', error);
        comment.hearts = isAlreadyLiked ? likeCount + 1 : likeCount - 1;
        if (isAlreadyLiked) {
          comment.likedBy.push(loggedInUsername.value);
        } else {
          comment.likedBy = comment.likedBy.filter(
            user => user !== loggedInUsername.value
          );
        }
      }
    };

    // Like reply
    const likeReply = async (postId, commentId, replyId) => {
        if (!requireAuth('like replies')) return;
      const post = posts.value.find(p => p._id === postId);
      if (!post) return;
      const comment = post.comments.find(c => c.commentId === commentId);
      if (!comment) return;
      const reply = comment.replies.find(r => r.replyId === replyId);
      if (!reply) return;
      const isAlreadyLiked = reply.likedBy?.includes(loggedInUsername.value);
      reply.likedBy = reply.likedBy || [];
      let likeCount = reply.hearts || 0;
      if (isAlreadyLiked) {
        reply.hearts = likeCount - 1;
        reply.likedBy = reply.likedBy.filter(
          user => user !== loggedInUsername.value
        );
      } else {
        reply.hearts = likeCount + 1;
        reply.likedBy.push(loggedInUsername.value);
      }
      if (selectedPost.value?._id === postId) {
        selectedPost.value.comments = [...post.comments]; // Update full-screen post
      }
      try {
        const response = await fetch('https://sports321.vercel.app/api/editPost', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            postId,
            username: loggedInUsername.value,
            action: 'heart reply',
            commentId,
            replyId,
          }),
        });
        if (!response.ok) throw new Error('Failed to update reply');
        const updatedPost = await response.json();
        updatePostInFeed(updatedPost);
      } catch (error) {
        console.error('Error liking reply:', error);
        reply.hearts = isAlreadyLiked ? likeCount + 1 : likeCount - 1;
        if (isAlreadyLiked) {
          reply.likedBy.push(loggedInUsername.value);
        } else {
          reply.likedBy = reply.likedBy.filter(
            user => user !== loggedInUsername.value
          );
        }
      }
    };

    // Edit post
    const editPost = (postId, postUsername) => {
       if (!requireAuth('edit posts')) return;
      if (postUsername !== loggedInUsername.value) {
        showNotification('You can only edit your own posts.', true);
        return;
      }
      modalMessage.value = 'Are you sure you want to edit this post?';
      modalAction.value = () => confirmEdit(postId);
      modalActionText.value = 'Edit';
      showModal.value = true;
    };

    const confirmEdit = async postId => {
      const postText = prompt('Edit your opinion:');
      if (!postText) {
        showNotification('Post content cannot be empty!', true);
        return;
      }
      const updatedPost = {
        id: postId,
        message: postText,
        username: loggedInUsername.value,
        timestamp: new Date().toISOString(),
      };
      try {
        const response = await fetch('https://sports123.vercel.app/api/deletePost', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(updatedPost),
        });
        if (!response.ok) throw new Error('Failed to update post');
        showNotification('Post updated successfully!', false);
        channel.publish('editOpinion', updatedPost);
        updatePostInFeed(updatedPost);
        showModal.value = false;
      } catch (error) {
        showNotification('Error editing post: ' + error.message, true);
      }
    };

    // Delete post
    const deletePost = postId => {
       if (!requireAuth('delete posts')) return;
      modalMessage.value =
        'Are you sure you want to delete this post? This action cannot be undone.';
      modalAction.value = () => confirmDeletePost(postId);
      modalActionText.value = 'Delete';
      showModal.value = true;
    };

    const confirmDeletePost = async postId => {
      try {
        const response = await fetch('https://sports321.vercel.app/api/deletePost', {
          method: 'DELETE',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            postId,
            username: loggedInUsername.value,
            sessionId: sessionId.value,
          }),
        });
        if (!response.ok) throw new Error('Failed to delete post');
        showNotification('Post deleted successfully!', false);
        channel.publish('deleteOpinion', { id: postId });
        posts.value = posts.value.filter(p => p._id !== postId);
        showModal.value = false;
        if (selectedPost.value?._id === postId) {
          selectedPost.value = null; // Close full-screen post if deleted
        }
      } catch (error) {
        showNotification('Failed to delete post', true);
      }
    };

    // Delete comment
    const deleteComment = (postId, commentId) => {
  if (!requireAuth('delete comments')) return;
      modalMessage.value =

        'Are you sure you want to delete this comment? This action cannot be undone.';
      modalAction.value = () => confirmDeleteComment(postId, commentId);
      modalActionText.value = 'Delete';
      showModal.value = true;
    };

    const confirmDeleteComment = async (postId, commentId) => {
      try {
        const response = await fetch('https://sports123.vercel.app/api/deletecomment', {
          method: 'DELETE',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            postId,
            commentId,
            username: loggedInUsername.value,
            sessionId: sessionId.value,
          }),
        });
        if (!response.ok) throw new Error('Failed to delete comment');
        showNotification('Comment deleted successfully!', false);
        const post = posts.value.find(p => p._id === postId);
        if (post) {
          post.comments = post.comments.filter(c => c.commentId !== commentId);
          if (selectedPost.value?._id === postId) {
            selectedPost.value.comments = [...post.comments]; // Update full-screen post
          }
        }
        showModal.value = false;
      } catch (error) {
        showNotification(`Error deleting comment: ${error.message}`, true);
      }
    };

    // Close modal
    const closeModal = () => {
      showModal.value = false;
    };

    // Open full-screen image (Optional, retained for compatibility)
    const openFullScreen = imageSrc => {
      log('info', 'Open full-screen image:', imageSrc);
    };

    // Notification (mock, replace with actual implementation)
    const showNotification = (message, isError) => {
      log(isError ? 'error' : 'info', `${isError ? 'Error' : 'Success'}: ${message}`);
      // Implement actual notification UI
    };

    // Lifecycle hooks
    onMounted(() => {
      loadMorePosts();
      window.addEventListener('scroll', handleScroll);

      const savedSessionId = localStorage.getItem('sessionId');
      if (savedSessionId) {
        sessionId.value = savedSessionId;
      } else {
        const newId = generateSessionId();
        localStorage.setItem('sessionId', newId);
        sessionId.value = newId;
      }
      // Subscribe to Ably channels
      channel.subscribe('newOpinion', message => {
        const incomingPost = message.data;
        if (incomingPost?._id && incomingPost._id !== lastSentPostId.value) {
          showNotification('New post added!', false);
          addPostToFeed(incomingPost, true);
        }
      });

      channel.subscribe('editOpinion', message => {
        updatePostInFeed(message.data);
      });

      channel.subscribe('deleteOpinion', message => {
        posts.value = posts.value.filter(p => p._id !== message.data.id);
      });

      channel.subscribe('likePost', message => {
        updatePostInFeed(message.data);
      });

      channel.subscribe('dislikePost', message => {
        updatePostInFeed(message.data);
      });

      channel.subscribe('addComment', message => {
        updatePostInFeed(message.data);
      });

      channel.subscribe('deleteComment', message => {
        updatePostInFeed(message.data);
      });

      // Add keyboard navigation for accessibility
      document.addEventListener('keydown', e => {
        if (e.key === 'Escape' && selectedPost.value) {
          closeFullScreenPost();
        }
      });

      // Expose addReply to global scope for reply box
      window.vueInstance = { addReply };
    });

    onUnmounted(() => {
      window.removeEventListener('scroll', handleScroll);
      // Unsubscribe from Ably channels if needed
    });

    return {
      isAuthenticated,
      userId,
      requireAuth,
      posts,
      sessionId,
      loading,
      sortOption,
      postText,
      imagePreview,
      loggedInUsername,
      sortPosts,
      showUserProfile,
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
    };
};


