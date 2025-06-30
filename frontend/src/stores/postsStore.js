import { defineStore } from 'pinia';
import { ref, computed } from 'vue';
import Ably from 'ably';

export const usePostsStore = defineStore('posts', {
  state: () => ({
    posts: [],
    currentPage: 1,
    loading: false,
    hasMorePosts: true,
    sortOption: 'most-liked',
    postText: '',
    imagePreview: null,
    imageData: null,
    lastSentPostId: null,
    loggedInUsername: localStorage.getItem('username') || '',
    userId: localStorage.getItem('userId') || '',
    sessionId: localStorage.getItem('sessionId') || null,
    showModal: false,
    modalMessage: '',
    modalAction: null,
    modalActionText: '',
    selectedPost: null,
    ably: new Ably.Realtime('eCkrsA.JzcmYQ:JLywAltPtm-KWD6Rd0MItQRgi-I4R7zn6BpI1UVQ3Eg'),
  }),

  getters: {
    isAuthenticated: (state) => {
      return state.loggedInUsername && 
             state.loggedInUsername.trim() !== '' && 
             state.loggedInUsername !== 'Guest';
    },
  },

  actions: {
    generateSessionId() {
      const array = new Uint8Array(16);
      window.crypto.getRandomValues(array);
      return Array.from(array, byte => byte.toString(16).padStart(2, '0')).join('');
    },

    async fetchPosts(page = 1, sort = 'newest') {
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
    },

    async loadMorePosts() {
      if (this.loading || !this.hasMorePosts) return;
      this.loading = true;
      const newPosts = await this.fetchPosts(this.currentPage, this.sortOption);
      if (newPosts?.posts?.length > 0) {
        this.posts.push(
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
        this.currentPage++;
        this.hasMorePosts = newPosts.hasMorePosts;
      } else {
        this.hasMorePosts = false;
      }
      this.loading = false;
    },

    sortPosts(sortBy) {
      this.sortOption = sortBy;
      this.posts = [];
      this.currentPage = 1;
      this.hasMorePosts = true;
      this.loadMorePosts();
    },

    addPostToFeed(post, isNewPost = false) {
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
        this.posts.unshift(formattedPost);
      } else {
        this.posts.push(formattedPost);
      }
      this.incrementViewOnScroll(post._id);
    },

    formatTimestamp(timestamp) {
      const date = new Date(timestamp);
      if (isNaN(date)) return 'Invalid Date';
      return date.toLocaleString('en-GB', {
        day: 'numeric',
        month: 'long',
        hour: '2-digit',
        minute: '2-digit',
      });
    },

    getTimeAgo(date) {
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
    },

    showUserProfile(username) {
      window.location.href = `search2.html?username=${encodeURIComponent(username)}`;
    },

    handleScroll() {
      if (
        window.innerHeight + window.scrollY >=
        document.body.offsetHeight - 500
      ) {
        this.loadMorePosts();
      }
      this.posts.forEach(post => this.incrementViewOnScroll(post._id));
    },

    incrementViewOnScroll(postId) {
      const postElement = document.querySelector(`.post-card[data-id="${postId}"]`);
      if (postElement && this.isElementInViewport(postElement)) {
        const hasViewed = sessionStorage.getItem(`viewed_${postId}`);
        if (!hasViewed) {
          const post = this.posts.find(p => p._id === postId);
          if (post) {
            post.views = (post.views || 0) + 1;
            sessionStorage.setItem(`viewed_${postId}`, 'true');
            sessionStorage.setItem(`views_${postId}`, post.views);
            this.updatePostInFeed({ _id: postId, views: post.views });
          }
        }
      }
    },

    isElementInViewport(el) {
      const rect = el.getBoundingClientRect();
      return (
        rect.top >= 0 &&
        rect.left >= 0 &&
        rect.bottom <= (window.innerHeight || document.documentElement.clientHeight) &&
        rect.right <= (window.innerWidth || document.documentElement.clientWidth)
      );
    },

    openFullScreenPost(postId) {
      const post = this.posts.find(p => p._id === postId);
      if (post) {
        this.selectedPost = { ...post, showComments: true };
        this.incrementViewOnScroll(postId);
      }
    },

    closeFullScreenPost() {
      this.selectedPost = null;
    },

    async likePost(postId) {
      if (!this.isAuthenticated) {
        this.showNotification('Please log in to like posts', true);
        return;
      }
      const post = this.posts.find(p => p._id === postId);
      if (!post) return;
      const likedBy = post.likedBy || [];
      const dislikedBy = post.dislikedBy || [];
      let likeCount = post.likes || 0;
      if (likedBy.includes(this.loggedInUsername)) {
        likeCount--;
        post.likedBy = likedBy.filter(user => user !== this.loggedInUsername);
      } else {
        likeCount++;
        post.likedBy = [...likedBy, this.loggedInUsername];
        if (dislikedBy.includes(this.loggedInUsername)) {
          post.dislikes--;
          post.dislikedBy = dislikedBy.filter(user => user !== this.loggedInUsername);
        }
      }
      post.likes = likeCount;
      if (this.selectedPost?._id === postId) {
        this.selectedPost = { ...post, showComments: true };
      }
      try {
        const response = await fetch('https://sports123.vercel.app/api/editPost', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            postId,
            username: this.loggedInUsername,
            action: 'like',
          }),
        });
        if (!response.ok) throw new Error('Failed to like post');
        const result = await response.json();
        this.showNotification('Post liked successfully!', false);
        this.updatePostInFeed(result);
      } catch (error) {
        this.showNotification(error.message, true);
        post.likes--;
      }
    },

    async dislikePost(postId) {
      if (!this.isAuthenticated) {
        this.showNotification('Please log in to dislike posts', true);
        return;
      }
      const post = this.posts.find(p => p._id === postId);
      if (!post) return;
      const likedBy = post.likedBy || [];
      const dislikedBy = post.dislikedBy || [];
      let dislikeCount = post.dislikes || 0;
      if (dislikedBy.includes(this.loggedInUsername)) {
        dislikeCount--;
        post.dislikedBy = dislikedBy.filter(user => user !== this.loggedInUsername);
      } else {
        dislikeCount++;
        post.dislikedBy = [...dislikedBy, this.loggedInUsername];
        if (likedBy.includes(this.loggedInUsername)) {
          post.likes--;
          post.likedBy = likedBy.filter(user => user !== this.loggedInUsername);
        }
      }
      post.dislikes = dislikeCount;
      if (this.selectedPost?._id === postId) {
        this.selectedPost = { ...post, showComments: true };
      }
      try {
        const response = await fetch('https://sports123.vercel.app/api/editPost', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            postId,
            username: this.loggedInUsername,
            action: 'dislike',
          }),
        });
        if (!response.ok) throw new Error('Failed to dislike post');
        const result = await response.json();
        this.showNotification('Post disliked successfully!', false);
        this.updatePostInFeed(result);
      } catch (error) {
        this.showNotification(error.message, true);
        post.dislikes--;
      }
    },

    updatePostInFeed(updatedPost) {
      const index = this.posts.findIndex(p => p._id === updatedPost._id);
      if (index !== -1) {
        this.posts[index] = {
          ...this.posts[index],
          ...updatedPost,
          comments: updatedPost.comments?.map(comment => ({
            ...comment,
            showReplies: this.posts[index].comments.find(
              c => c.commentId === comment.commentId
            )?.showReplies || false,
            replies: Array.isArray(comment.replies) ? comment.replies : [],
          })) || [],
          likedBy: updatedPost.likedBy || this.posts[index].likedBy,
          dislikedBy: updatedPost.dislikedBy || this.posts[index].dislikedBy,
        };
        if (this.selectedPost?._id === updatedPost._id) {
          this.selectedPost = { ...this.posts[index], showComments: true };
        }
      }
    },

    async addComment(postId, commentText) {
      if (!this.isAuthenticated) {
        this.showNotification('Please log in to add comments', true);
        return;
      }
      if (!commentText.trim()) return;
      const commentId = Date.now().toString();
      const newComment = {
        commentId,
        username: this.loggedInUsername,
        comment: commentText,
        timestamp: new Date().toISOString(),
        profilePicture: localStorage.getItem('profilePic') || 'pfp2.jpg',
        hearts: 0,
        replies: [],
      };
      const post = this.posts.find(p => p._id === postId);
      if (post) {
        post.comments.push(newComment);
        if (this.selectedPost?._id === postId) {
          this.selectedPost.comments = [...post.comments];
        }
        try {
          const response = await fetch('https://sports123.vercel.app/api/editPost', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              postId,
              username: this.loggedInUsername,
              action: 'comment',
              comment: commentText,
              commentId,
            }),
          });
          if (!response.ok) throw new Error('Failed to add comment');
          const result = await response.json();
          this.updatePostInFeed(result);
        } catch (error) {
          post.comments = post.comments.filter(c => c.commentId !== commentId);
          this.showNotification(error.message, true);
        }
      }
    },

    toggleReplies(postId, commentId, commentUsername) {
      const post = this.posts.find(p => p._id === postId);
      if (!post) return;
      const comment = post.comments.find(c => c.commentId === commentId);
      if (comment) {
        comment.showReplies = !comment.showReplies;
        if (this.selectedPost?._id === postId) {
          this.selectedPost.comments.find(c => c.commentId === commentId).showReplies = comment.showReplies;
        }
        this.showReplyBox(postId, commentId, commentUsername);
      }
    },

    showReplyBox(postId, commentId, commentUsername) {
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
          onclick="window.vueInstance.addReply('${postId}', '${commentId}', document.getElementById('reply-input-${commentId}').value, '${this.loggedInUsername}')"
        ></button>
      `;
      repliesContainer.appendChild(replyBox);
    },

    async addReply(postId, commentId, replyText, replyUsername) {
      if (!this.isAuthenticated) {
        this.showNotification('Please log in to add replies', true);
        return;
      }
      if (!replyText.trim()) {
        console.error('Reply cannot be empty');
        return;
      }
      const replyId = Date.now().toString();
      const post = this.posts.find(p => p._id === postId);
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
      if (this.selectedPost?._id === postId) {
        this.selectedPost.comments = [...post.comments];
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
        this.updatePostInFeed(updatedPost);
      } catch (error) {
        comment.replies = comment.replies.filter(r => r.replyId !== replyId);
        this.showNotification('Error adding reply: ' + error.message, true);
      }
    },

    async likeComment(postId, commentId) {
      if (!this.isAuthenticated) {
        this.showNotification('Please log in to like comments', true);
        return;
      }
      const post = this.posts.find(p => p._id === postId);
      if (!post) return;
      const comment = post.comments.find(c => c.commentId === commentId);
      if (!comment) return;
      const isAlreadyLiked = comment.likedBy?.includes(this.loggedInUsername);
      comment.likedBy = comment.likedBy || [];
      let likeCount = comment.hearts || 0;
      if (isAlreadyLiked) {
        comment.hearts = likeCount - 1;
        comment.likedBy = comment.likedBy.filter(user => user !== this.loggedInUsername);
      } else {
        comment.hearts = likeCount + 1;
        comment.likedBy.push(this.loggedInUsername);
      }
      if (this.selectedPost?._id === postId) {
        this.selectedPost.comments = [...post.comments];
      }
      try {
        const response = await fetch('https://sports321.vercel.app/api/editPost', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            postId,
            username: this.loggedInUsername,
            action: 'heart comment',
            commentId,
          }),
        });
        if (!response.ok) throw new Error('Failed to update comment');
        const updatedPost = await response.json();
        this.updatePostInFeed(updatedPost);
      } catch (error) {
        console.error('Error liking comment:', error);
        comment.hearts = isAlreadyLiked ? likeCount + 1 : likeCount - 1;
        if (isAlreadyLiked) {
          comment.likedBy.push(this.loggedInUsername);
        } else {
          comment.likedBy = comment.likedBy.filter(user => user !== this.loggedInUsername);
        }
      }
    },

    async likeReply(postId, commentId, replyId) {
      if (!this.isAuthenticated) {
        this.showNotification('Please log in to like replies', true);
        return;
      }
      const post = this.posts.find(p => p._id === postId);
      if (!post) return;
      const comment = post.comments.find(c => c.commentId === commentId);
      if (!comment) return;
      const reply = comment.replies.find(r => r.replyId === replyId);
      if (!reply) return;
      const isAlreadyLiked = reply.likedBy?.includes(this.loggedInUsername);
      reply.likedBy = reply.likedBy || [];
      let likeCount = reply.hearts || 0;
      if (isAlreadyLiked) {
        reply.hearts = likeCount - 1;
        reply.likedBy = reply.likedBy.filter(user => user !== this.loggedInUsername);
      } else {
        reply.hearts = likeCount + 1;
        reply.likedBy.push(this.loggedInUsername);
      }
      if (this.selectedPost?._id === postId) {
        this.selectedPost.comments = [...post.comments];
      }
      try {
        const response = await fetch('https://sports321.vercel.app/api/editPost', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            postId,
            username: this.loggedInUsername,
            action: 'heart reply',
            commentId,
            replyId,
          }),
        });
        if (!response.ok) throw new Error('Failed to update reply');
        const updatedPost = await response.json();
        this.updatePostInFeed(updatedPost);
      } catch (error) {
        console.error('Error liking reply:', error);
        reply.hearts = isAlreadyLiked ? likeCount + 1 : likeCount - 1;
        if (isAlreadyLiked) {
          reply.likedBy.push(this.loggedInUsername);
        } else {
          reply.likedBy = reply.likedBy.filter(user => user !== this.loggedInUsername);
        }
      }
    },

    editPost(postId, postUsername) {
      if (!this.isAuthenticated) {
        this.showNotification('Please log in to edit posts', true);
        return;
      }
      if (postUsername !== this.loggedInUsername) {
        this.showNotification('You can only edit your own posts.', true);
        return;
      }
      this.modalMessage = 'Are you sure you want to edit this post?';
      this.modalAction = () => this.confirmEdit(postId);
      this.modalActionText = 'Edit';
      this.showModal = true;
    },

    async confirmEdit(postId) {
      const postText = prompt('Edit your opinion:');
      if (!postText) {
        this.showNotification('Post content cannot be empty!', true);
        return;
      }
      const updatedPost = {
        id: postId,
        message: postText,
        username: this.loggedInUsername,
        timestamp: new Date().toISOString(),
      };
      try {
        const response = await fetch('https://sports123.vercel.app/api/deletePost', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(updatedPost),
        });
        if (!response.ok) throw new Error('Failed to update post');
        this.showNotification('Post updated successfully!', false);
        const channel = this.ably.channels.get('posts-channel');
        channel.publish('editOpinion', updatedPost);
        this.updatePostInFeed(updatedPost);
        this.showModal = false;
      } catch (error) {
        this.showNotification('Error editing post: ' + error.message, true);
      }
    },

    deletePost(postId) {
      if (!this.isAuthenticated) {
        this.showNotification('Please log in to delete posts', true);
        return;
      }
      this.modalMessage = 'Are you sure you want to delete this post? This action cannot be undone.';
      this.modalAction = () => this.confirmDeletePost(postId);
      this.modalActionText = 'Delete';
      this.showModal = true;
    },

    async confirmDeletePost(postId) {
      try {
        const response = await fetch('https://sports321.vercel.app/api/deletePost', {
          method: 'DELETE',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            postId,
            username: this.loggedInUsername,
            sessionId: this.sessionId,
          }),
        });
        if (!response.ok) throw new Error('Failed to delete post');
        this.showNotification('Post deleted successfully!', false);
        const channel = this.ably.channels.get('posts-channel');
        channel.publish('deleteOpinion', { id: postId });
        this.posts = this.posts.filter(p => p._id !== postId);
        this.showModal = false;
        if (this.selectedPost?._id === postId) {
          this.selectedPost = null;
        }
      } catch (error) {
        this.showNotification('Failed to delete post', true);
      }
    },

    deleteComment(postId, commentId) {
      if (!this.isAuthenticated) {
        this.showNotification('Please log in to delete comments', true);
        return;
      }
      this.modalMessage = 'Are you sure you want to delete this comment? This action cannot be undone.';
      this.modalAction = () => this.confirmDeleteComment(postId, commentId);
      this.modalActionText = 'Delete';
      this.showModal = true;
    },

    async confirmDeleteComment(postId, commentId) {
      try {
        const response = await fetch('https://sports123.vercel.app/api/deletecomment', {
          method: 'DELETE',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            postId,
            commentId,
            username: this.loggedInUsername,
            sessionId: this.sessionId,
          }),
        });
        if (!response.ok) throw new Error('Failed to delete comment');
        this.showNotification('Comment deleted successfully!', false);
        const post = this.posts.find(p => p._id === postId);
        if (post) {
          post.comments = post.comments.filter(c => c.commentId !== commentId);
          if (this.selectedPost?._id === postId) {
            this.selectedPost.comments = [...post.comments];
          }
        }
        this.showModal = false;
      } catch (error) {
        this.showNotification(`Error deleting comment: ${error.message}`, true);
      }
    },

    closeModal() {
      this.showModal = false;
    },

    openFullScreen(imageSrc) {
      console.log('info', 'Open full-screen image:', imageSrc);
    },

    showNotification(message, isError) {
      console.log(isError ? 'error' : 'info', `${isError ? 'Error' : 'Success'}: ${message}`);
    },

    initialize() {
      this.loadMorePosts();
      window.addEventListener('scroll', this.handleScroll.bind(this));

      const savedSessionId = localStorage.getItem('sessionId');
      if (savedSessionId) {
        this.sessionId = savedSessionId;
      } else {
        const newId = this.generateSessionId();
        localStorage.setItem('sessionId', newId);
        this.sessionId = newId;
      }

      const channel = this.ably.channels.get('posts-channel');
      channel.subscribe('newOpinion', message => {
        const incomingPost = message.data;
        if (incomingPost?._id && incomingPost._id !== this.lastSentPostId) {
          this.showNotification('New post added!', false);
          this.addPostToFeed(incomingPost, true);
        }
      });

      channel.subscribe('editOpinion', message => {
        this.updatePostInFeed(message.data);
      });

      channel.subscribe('deleteOpinion', message => {
        this.posts = this.posts.filter(p => p._id !== message.data.id);
      });

      channel.subscribe('likePost', message => {
        this.updatePostInFeed(message.data);
      });

      channel.subscribe('dislikePost', message => {
        this.updatePostInFeed(message.data);
      });

      channel.subscribe('addComment', message => {
        this.updatePostInFeed(message.data);
      });

      channel.subscribe('deleteComment', message => {
        this.updatePostInFeed(message.data);
      });

      document.addEventListener('keydown', e => {
        if (e.key === 'Escape' && this.selectedPost) {
          this.closeFullScreenPost();
        }
      });

      window.vueInstance = { addReply: this.addReply.bind(this) };
    },

    cleanup() {
      window.removeEventListener('scroll', this.handleScroll.bind(this));
    },
  },
});