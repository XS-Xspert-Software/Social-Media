import { defineStore } from 'pinia';
import { ref, computed } from 'vue';
import Ably from 'ably';
import { useRouter, useRoute } from 'vue-router';
import { getLocalStorage, setLocalStorage } from '@/utils/localStorage';

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
    loggedInUsername: getLocalStorage('username') || '',
    userId: getLocalStorage('userId') || '',
    sessionId: getLocalStorage('sessionId') || null,
    showModal: false,
    modalMessage: '',
    modalAction: null,
    modalActionText: '',
    selectedPost: null,
    selectedCommentId: null, // Track which comment's replies are open
    ably: new Ably.Realtime('eCkrsA.JzcmYQ:JLywAltPtm-KWD6Rd0MItQRgi-I4R7zn6BpI1UVQ3Eg'),
    notify: null, // Store the notify function
  }),

  getters: {
    isAuthenticated: (state) => {
      return state.loggedInUsername && 
             state.loggedInUsername.trim() !== '' && 
             state.loggedInUsername !== 'Guest';
    },
  },

  actions: {
    // Set the notify function
    setNotify(notifyFunction) {
      this.notify = notifyFunction;
    },

    generateSessionId() {
      const array = new Uint8Array(16);
      window.crypto.getRandomValues(array);
      return Array.from(array, byte => byte.toString(16).padStart(2, '0')).join('');
    },

    async fetchPosts(page = 1, sort = 'newest') {
      try {
        this.loading = true;
        const response = await fetch(
          `https://sports321.vercel.app/api/posts?page=${page}&limit=6&sort=${sort}`
        );
        if (!response.ok) throw new Error('Failed to load posts');
        const data = await response.json();
        return data;
      } catch (error) {
        this.notify?.('Error fetching posts: ' + error.message, true);
        return { posts: [], hasMorePosts: false };
      } finally {
        this.loading = false;
      }
    },

    async loadMorePosts() {
      if (this.loading || !this.hasMorePosts) return;
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
            isBookmarked: false, // Initialize bookmark state
          }))
        );
        this.currentPage++;
        this.hasMorePosts = newPosts.hasMorePosts;
      } else {
        this.hasMorePosts = false;
      }
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
        comments: post.comments?.map(comment => ({
          ...comment,
          showReplies: false,
          replies: Array.isArray(comment.replies) ? comment.replies : [],
        })) || [],
        likedBy: post.likedBy || [],
        isBookmarked: false,
      };
      if (isNewPost) {
        this.posts.unshift(formattedPost);
      } else {
        this.posts.push(formattedPost);
      }
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

     parseMessage(message) {
  if (!message) return '';
  return message
    .replace(/@(\w+)/g, '<span class="tagged-user" style="color: red;">@$1</span>')
    .replace(/#(\w+)/g, '<span class="hashtag" style="color: yellow;">#$1</span>');
},

  handleClick(event) {
    const target = event.target;
    if (target.classList.contains('tagged-user')) {
      const username = target.textContent.slice(1); // Remove '@'
      this.$router.push({ name: 'search2', params: { username } });
    } else if (target.classList.contains('hashtag')) {
      const hashtag = target.textContent.slice(1); // Remove '#'
      this.$router.push({ path: '/search', query: { hashtag } });
    }
  },
  redirectToUserProfile(username) {
  this.$router.push({ name: 'search2', params: { username } });
},

redirectToHashtagSearch(hashtag) {
  this.$router.push({ path: '/search', query: { hashtag } });
},

    openFullScreenPost(postId) {
      const post = this.posts.find(p => p._id === postId);
      if (post) {
        this.selectedPost = { ...post, showComments: true };
      }
    },

    closeFullScreenPost() {
      this.selectedPost = null;
      this.selectedCommentId = null;
    },

    async likePost(postId) {
      if (!this.isAuthenticated) {
        this.notify?.('Please log in to like posts', true);
        return;
      }
      const post = this.posts.find(p => p._id === postId);
      if (!post) return;
      const likedBy = post.likedBy || [];
      let likeCount = post.likes || 0;
      if (likedBy.includes(this.loggedInUsername)) {
        likeCount--;
        post.likedBy = likedBy.filter(user => user !== this.loggedInUsername);
      } else {
        likeCount++;
        post.likedBy = [...likedBy, this.loggedInUsername];
      }
      post.likes = likeCount;
      if (this.selectedPost?._id === postId) {
        this.selectedPost = { ...post, showComments: true };
      }
      try {
        const response = await fetch('https://sports321.vercel.app/api/editPost', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
          body: JSON.stringify({
            postId,
            username: this.loggedInUsername,
            action: 'like',
          }),
        });
        if (!response.ok) throw new Error('Failed to like post');
        const result = await response.json();
        this.notify?.('Post liked successfully!', false);
        this.updatePostInFeed(result);
      } catch (error) {
        this.notify?.('Error liking post: ' + error.message, true);
        post.likes = likedBy.includes(this.loggedInUsername) ? likeCount + 1 : likeCount - 1;
        post.likedBy = likedBy;
      }
    },

    async addComment(postId, commentText) {
      if (!this.isAuthenticated) {
        this.notify?.('Please log in to add comments', true);
        return;
      }
      if (!commentText.trim()) {
        this.notify?.('Comment cannot be empty', true);
        return;
      }
      const commentId = Date.now().toString();
      const newComment = {
        commentId,
        username: this.loggedInUsername,
        comment: commentText,
        timestamp: new Date().toISOString(),
        profilePicture: getLocalStorage('profilePic') || 'pfp2.jpg',
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
          const response = await fetch('https://sports321.vercel.app/api/editPost', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            credentials: 'include',
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
          this.notify?.('Comment added successfully!', false);
        } catch (error) {
          post.comments = post.comments.filter(c => c.commentId !== commentId);
          this.notify?.('Error adding comment: ' + error.message, true);
        }
      }
    },

    async addReply(postId, commentId, replyText) {
      if (!this.isAuthenticated) {
        this.notify?.('Please log in to add replies', true);
        return;
      }
      if (!replyText.trim()) {
        this.notify?.('Reply cannot be empty', true);
        return;
      }
      const replyId = Date.now().toString();
      const post = this.posts.find(p => p._id === postId);
      if (!post) return;
      const comment = post.comments.find(c => c.commentId === commentId);
      if (!comment) return;
      const newReply = {
        replyId,
        username: this.loggedInUsername,
        reply: replyText,
        timestamp: new Date().toISOString(),
        profilePicture: getLocalStorage('profilePic') || 'pfp2.jpg',
        hearts: 0,
        likedBy: [],
      };
      comment.replies.push(newReply);
      comment.showReplies = true;
      if (this.selectedPost?._id === postId) {
        this.selectedPost.comments = [...post.comments];
      }
      try {
        const response = await fetch('https://sports321.vercel.app/api/addReply', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
          body: JSON.stringify({
            postId,
            commentId,
            reply: replyText,
            username: this.loggedInUsername,
            sessionId: this.sessionId,
            profilePicture: getLocalStorage('profilePic') || '',
            replyId,
          }),
        });
        if (!response.ok) throw new Error('Failed to add reply');
        const updatedPost = await response.json();
        this.updatePostInFeed(updatedPost);
        this.notify?.('Reply added successfully!', false);
      } catch (error) {
        comment.replies = comment.replies.filter(r => r.replyId !== replyId);
        this.notify?.('Error adding reply: ' + error.message, true);
      }
    },

    toggleReplies(postId, commentId) {
      this.selectedCommentId = this.selectedCommentId === commentId ? null : commentId;
      const post = this.posts.find(p => p._id === postId);
      if (post) {
        const comment = post.comments.find(c => c.commentId === commentId);
        if (comment) {
          comment.showReplies = this.selectedCommentId === commentId;
          if (this.selectedPost?._id === postId) {
            this.selectedPost.comments = [...post.comments];
          }
        }
      }
    },

    async likeComment(postId, commentId) {
      if (!this.isAuthenticated) {
        this.notify?.('Please log in to like comments', true);
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
          credentials: 'include',
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
        this.notify?.('Comment liked successfully!', false);
      } catch (error) {
        this.notify?.('Error liking comment: ' + error.message, true);
        comment.hearts = isAlreadyLiked ? likeCount + 1 : likeCount - 1;
        comment.likedBy = isAlreadyLiked
          ? [...comment.likedBy, this.loggedInUsername]
          : comment.likedBy.filter(user => user !== this.loggedInUsername);
      }
    },

    async likeReply(postId, commentId, replyId) {
      if (!this.isAuthenticated) {
        this.notify?.('Please log in to like replies', true);
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
          credentials: 'include',
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
        this.notify?.('Reply liked successfully!', false);
      } catch (error) {
        this.notify?.('Error liking reply: ' + error.message, true);
        reply.hearts = isAlreadyLiked ? likeCount + 1 : likeCount - 1;
        reply.likedBy = isAlreadyLiked
          ? [...reply.likedBy, this.loggedInUsername]
          : reply.likedBy.filter(user => user !== this.loggedInUsername);
      }
    },

    editPost(postId, postUsername) {
      if (!this.isAuthenticated) {
        this.notify?.('Please log in to edit posts', true);
        return;
      }
      if (postUsername !== this.loggedInUsername) {
        this.notify?.('You can only edit your own posts.', true);
        return;
      }
      this.modalMessage = 'Are you sure you want to edit this post?';
      this.modalAction = () => this.confirmEdit(postId);
      this.modalActionText = 'Edit';
      this.showModal = true;
    },

    async confirmEdit(postId) {
      const postText = prompt('Edit your opinion:'); // Note: Consider replacing with a modal input
      if (!postText) {
        this.notify?.('Post content cannot be empty!', true);
        return;
      }
      const updatedPost = {
        id: postId,
        message: postText,
        username: this.loggedInUsername,
        timestamp: new Date().toISOString(),
      };
      try {
        const response = await fetch('https://sports321.vercel.app/api/deletePost', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
          body: JSON.stringify(updatedPost),
        });
        if (!response.ok) throw new Error('Failed to update post');
        this.notify?.('Post updated successfully!', false);
        const channel = this.ably.channels.get('posts-channel');
        channel.publish('editOpinion', updatedPost);
        this.updatePostInFeed(updatedPost);
        this.showModal = false;
      } catch (error) {
        this.notify?.('Error editing post: ' + error.message, true);
      }
    },

    deletePost(postId) {
      if (!this.isAuthenticated) {
        this.notify?.('Please log in to delete posts', true);
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
          credentials: 'include',
          body: JSON.stringify({
            postId,
            username: this.loggedInUsername,
            sessionId: this.sessionId,
          }),
        });
        if (!response.ok) throw new Error('Failed to delete post');
        this.notify?.('Post deleted successfully!', false);
        const channel = this.ably.channels.get('posts-channel');
        channel.publish('deleteOpinion', { id: postId });
        this.posts = this.posts.filter(p => p._id !== postId);
        this.showModal = false;
        if (this.selectedPost?._id === postId) {
          this.selectedPost = null;
        }
      } catch (error) {
        this.notify?.('Failed to delete post: ' + error.message, true);
      }
    },

    async deleteComment(postId, commentId) {
      if (!this.isAuthenticated) {
        this.notify?.('Please log in to delete comments', true);
        return;
      }
      this.modalMessage = 'Are you sure you want to delete this comment? This action cannot be undone.';
      this.modalAction = () => this.confirmDeleteComment(postId, commentId);
      this.modalActionText = 'Delete';
      this.showModal = true;
    },

    async confirmDeleteComment(postId, commentId) {
      try {
        const response = await fetch('https://sports321.vercel.app/api/deletecomment', {
          method: 'DELETE',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
          body: JSON.stringify({
            postId,
            commentId,
            username: this.loggedInUsername,
            sessionId: this.sessionId,
          }),
        });
        if (!response.ok) throw new Error('Failed to delete comment');
        this.notify?.('Comment deleted successfully!', false);
        const post = this.posts.find(p => p._id === postId);
        if (post) {
          post.comments = post.comments.filter(c => c.commentId !== commentId);
          if (this.selectedPost?._id === postId) {
            this.selectedPost.comments = [...post.comments];
          }
        }
        this.showModal = false;
      } catch (error) {
        this.notify?.('Error deleting comment: ' + error.message, true);
      }
    },

    sharePost(postId) {
      const postUrl = `${window.location.origin}/posts/${postId}`;
      navigator.clipboard.writeText(postUrl).then(() => {
        this.notify?.('Post URL copied to clipboard!', false);
      }).catch(() => {
        this.notify?.('Failed to copy URL.', true);
      });
    },

    toggleBookmark(postId) {
      if (this.selectedPost?._id === postId) {
        this.selectedPost.isBookmarked = !this.selectedPost.isBookmarked;
      }
      this.posts = this.posts.map(post => 
        post._id === postId ? { ...post, isBookmarked: !post.isBookmarked } : post
      );
      this.notify?.(`Post ${this.selectedPost.isBookmarked ? 'bookmarked' : 'unbookmarked'}!`, false);
      // Note: Backend bookmark persistence requires an endpoint
    },

    quotePost(post) {
      const router = useRouter();
      router.push({ path: '/float', query: { quoteToPostId: post._id, quoteToUsername: post.username } });
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
          isBookmarked: this.posts[index].isBookmarked,
        };
        if (this.selectedPost?._id === updatedPost._id) {
          this.selectedPost = { ...this.posts[index], showComments: true };
        }
      }
    },

    closeModal() {
      this.showModal = false;
    },

    initialize(notifyFunction) {
      if (notifyFunction) {
        this.setNotify(notifyFunction);
      }
      this.loadMorePosts();

      const savedSessionId = getLocalStorage('sessionId');
      if (savedSessionId) {
        this.sessionId = savedSessionId;
      } else {
        const newId = this.generateSessionId();
        setLocalStorage('sessionId', newId);
        this.sessionId = newId;
      }

      const channel = this.ably.channels.get('posts-channel');
      channel.subscribe('newOpinion', message => {
        const incomingPost = message.data;
        if (incomingPost?._id && incomingPost._id !== this.lastSentPostId) {
          this.notify?.('New post added!', false);
          this.addPostToFeed(incomingPost, true);
        }
      });

      channel.subscribe('editOpinion', message => {
        this.updatePostInFeed(message.data);
      });

      channel.subscribe('deleteOpinion', message => {
        this.posts = this.posts.filter(p => p._id !== message.data.id);
        if (this.selectedPost?._id === message.data.id) {
          this.selectedPost = null;
        }
      });

      channel.subscribe('likePost', message => {
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
    },

    cleanup() {
      // No scroll event listener to remove
    },
  },
});
