import { defineStore } from 'pinia';
import { useRouter } from 'vue-router';
import { getLocalStorage, setLocalStorage } from '@/utils/localStorage';

export const usePostsStore = defineStore('posts', {
  state: () => ({
    posts: [],
    currentPage: 1,
    loading: false,
    hasMorePosts: true,
    sortOption: 'general',
    postText: '',
    imagePreview: null,
    imageData: null,
    loggedInUsername: getLocalStorage('username') || '',
    userId: getLocalStorage('userId') || '',
    sessionId: getLocalStorage('sessionId') || null,
    showModal: false,
    modalMessage: '',
    modalAction: null,
    modalActionText: '',
    selectedPost: null,
    selectedCommentId: null,
    notify: null,
    commentInputs: {},
    replyInputs: {},
    replyToggles: {},
    detailedCommentsCache: new Map(),
    commentPending: {},
    replyPending: {},
  }),

  getters: {
    isAuthenticated: (state) => {
      return state.loggedInUsername && 
             state.loggedInUsername.trim() !== '' && 
             state.loggedInUsername !== 'Guest';
    },
  },

  actions: {
    async makeApiCall(endpoint, method = 'POST', body = null, customHeaders = {}) {
  try {
    // In dev, route legacy API calls through Vite proxy to avoid CORS
    if (import.meta && import.meta.env && import.meta.env.DEV && typeof endpoint === 'string') {
      try {
        const urlObj = new URL(endpoint);
        if (urlObj.hostname === 'sports321.vercel.app') {
          endpoint = endpoint.replace('https://sports321.vercel.app', '/oldapi');
        }
      } catch (e) {
        // If endpoint is not a valid URL, do nothing or optionally handle error
      }
    }
    const config = {
      method,
      headers: {
        'Content-Type': 'application/json',
        ...customHeaders
      },
      credentials: 'include',
      mode: 'cors', // Add this
    };

    if (body && method !== 'GET') {
      config.body = JSON.stringify(body);
    }
    
    // Add debugging
    console.log('Making request to:', endpoint);
    console.log('Method:', method);
    console.log('Body:', body);
    
    const response = await fetch(endpoint, config);
    
    console.log('Response status:', response.status);
    console.log('Response ok:', response.ok);
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error('Error response:', errorText);
      throw new Error(`${response.status}: ${errorText || response.statusText}`);
    }
    
    return await response.json();
  } catch (error) {
    console.error(`API call failed - ${method} ${endpoint}:`, error);
    
    // Check if it's a CORS issue
    if (error.name === 'TypeError' && error.message === 'Failed to fetch') {
      console.error('This is likely a CORS issue or network connectivity problem');
      console.error('Check if the API endpoint exists and allows requests from', window.location.origin);
    }
    
    throw error;
  }
},
    setNotify(notifyFunction) {
      this.notify = notifyFunction;
    },

    isCommentPending(postId) {
      return !!this.commentPending[postId];
    },

    isReplyPending(commentId) {
      return !!this.replyPending[commentId];
    },

    generateSessionId() {
      const array = new Uint8Array(16);
      window.crypto.getRandomValues(array);
      return Array.from(array, byte => byte.toString(16).padStart(2, '0')).join('');
    },

    setCommentInput(postId, value) {
      this.commentInputs[postId] = value;
    },

    setReplyInput(commentId, value) {
      this.replyInputs[commentId] = value;
    },

    clearCommentInput(postId) {
      this.commentInputs[postId] = '';
    },

    clearReplyInput(commentId) {
      this.replyInputs[commentId] = '';
    },

    async fetchPosts(page = 1, sort = 'general') {
      this.loading = true;
      try {
  // Use Vite proxy in dev to avoid CORS; use absolute in prod/static
  const apiUrl = (import.meta?.env?.DEV)
    ? '/oldapi/api/posts'
    : 'https://sports321.vercel.app/api/posts';
        const params = new URLSearchParams({ page: page.toString(), limit: '10' });
        
        const shouldUsePersonalizedFeed = this.shouldUsePersonalizedFeed && sort === 'general';
        shouldUsePersonalizedFeed 
          ? params.set('userId', this.userId)
          : params.set('sort', sort);

        this.feedType = shouldUsePersonalizedFeed ? 'personalized' : 'public';
  const response = await fetch(apiUrl + '?' + params.toString());
        return response.ok ? await response.json() : { posts: [], hasMorePosts: false };
      } catch (error) {
        console.error('Error fetching posts:', error);
        this.notify?.('Error fetching posts: ' + error.message, true);
        return { posts: [], hasMorePosts: false };
      } finally {
        this.loading = false;
      }
    },

    invalidateCommentsCache(postId) {
      this.detailedCommentsCache.delete(postId);
    },

    async loadMorePosts() {
      if (this.loading || !this.hasMorePosts) return;
      
      const newPosts = await this.fetchPosts(this.currentPage, this.sortOption);
      
      if (newPosts?.posts?.length > 0) {
        const formattedPosts = newPosts.posts.map(post => ({
          ...post,
          comments: [],
          commentCount: post.commentCount || 0,
          likedBy: post.likedBy || [],
          isBookmarked: false,
        }));

        this.posts.push(...formattedPosts);
        this.currentPage += 1;
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
      this.detailedCommentsCache.clear();
      this.loadMorePosts();
    },

    addPostToFeed(post, isNewPost = false) {
      if (!post?._id) return;
      
      const formattedPost = {
        ...post,
        likes: post.likes || 0,
        comments: [],
        commentCount: post.commentCount || 0,
        likedBy: post.likedBy || [],
        isBookmarked: false,
      };
      
      isNewPost ? this.posts.unshift(formattedPost) : this.posts.push(formattedPost);
    },

    async openFullScreenPost(postId) {
      try {
        const apiUrl = `https://199-ten.vercel.app/api/UserListChat?id=${postId}`;
        const response = await fetch(apiUrl);
        
        if (response.ok) {
          const data = await response.json();
          
          if (data.post) {
            this.selectedPost = {
              ...data.post,
              showComments: true,
              comments: data.post.comments || []
            };
            return;
          }
        }
        
        // Fallback to local post if API fails
        const post = this.posts.find(p => p._id === postId);
        if (post) {
          this.selectedPost = { ...post, showComments: true };
        } else {
          this.selectedPost = null;
        }
      } catch (error) {
        console.error('Error loading full screen post:', error);
        this.notify?.('Error loading post details', true);
      }
    },

    closeFullScreenPost() {
      this.selectedPost = null;
      this.selectedCommentId = null;
    },

    formatTimestamp(timestamp) {
      const date = new Date(timestamp);
      return isNaN(date) ? 'Invalid Date' : date.toLocaleString('en-GB', {
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
      
      return years > 0 ? `${years} year${years > 1 ? 's' : ''} ago` :
             days > 0 ? `${days} day${days > 1 ? 's' : ''} ago` :
             hours > 0 ? `${hours} hour${hours > 1 ? 's' : ''} ago` :
             minutes > 0 ? `${minutes} minute${minutes > 1 ? 's' : ''} ago` : 'Just now';
    },

    parseMessage(message) {
      return message ? message
        .replace(/@(\w+)/g, '<span class="tagged-user" style="color: red;">@$1</span>')
        .replace(/#(\w+)/g, '<span class="hashtag" style="color: yellow;">#$1</span>') : '';
    },

    findPost(postId) {
      // Check selectedPost first
      if (this.selectedPost && String(this.selectedPost._id) === String(postId)) {
        return this.selectedPost;
      }
      
      // Check posts array
      return this.posts.find(p => String(p._id) === String(postId)) || this.selectedPost;
    },

    findComment(post, commentId) {
      if (!post || !post.comments) return null;
      
      const searchComments = (comments) => {
        for (const comment of comments) {
          const commentIdStr = String(commentId).trim();
          const commentCommentId = String(comment.commentId || '').trim();
          const commentComment_id = String(comment.comment_id || '').trim();
          
          if (commentCommentId === commentIdStr || 
              commentComment_id === commentIdStr ||
              String(comment.id) === commentIdStr) {
            return comment;
          }
          
          // Check in replies if they exist
          if (comment.replies && comment.replies.length > 0) {
            const foundInReplies = searchComments(comment.replies);
            if (foundInReplies) return foundInReplies;
          }
        }
        return null;
      };
      
      return searchComments(post.comments);
    },

    findReply(comment, replyId) {
      if (!comment || !comment.replies) return null;
      
      return comment.replies.find(reply => 
        String(reply.commentId) === String(replyId) || 
        String(reply.comment_id) === String(replyId) ||
        String(reply.replyId) === String(replyId)
      );
    },

    updateSelectedPost(post) {
      if (this.selectedPost?._id === post._id) {
        this.selectedPost = { ...this.selectedPost, ...post };
      }
    },

    applyPostPatch(postId, changes) {
      // Force reactive updates for feed + full-screen views
      const matches = (id) => String(id) === String(postId);
      this.posts = this.posts.map((p) => matches(p._id) ? { ...p, ...changes } : p);
      if (this.selectedPost && matches(this.selectedPost._id)) {
        this.selectedPost = { ...this.selectedPost, ...changes };
      }
    },

    applyCommentPatch(postId, commentId, changes) {
      const normalize = (id) => String(id).trim();
      const matchesPost = (p) => normalize(p._id) === normalize(postId);
      const matchesComment = (c) => normalize(c.commentId || c.comment_id || c.id) === normalize(commentId);

      const patchComments = (comments = []) => comments.map((c) => {
        if (matchesComment(c)) {
          return { ...c, ...changes };
        }
        const patchedReplies = Array.isArray(c.replies) ? c.replies : [];
        return { ...c, replies: patchedReplies };
      });

      this.posts = this.posts.map((p) => matchesPost(p)
        ? { ...p, comments: patchComments(p.comments) }
        : p);

      if (this.selectedPost && matchesPost(this.selectedPost)) {
        this.selectedPost = {
          ...this.selectedPost,
          comments: patchComments(this.selectedPost.comments),
        };
      }
    },

    async likePost(postId) {
      if (!this.isAuthenticated) {
        this.notify?.('Please log in to like posts', true);
        return;
      }

      const post = this.findPost(postId);
      if (!post) return;
      
      const likedBy = post.likedBy || [];
      const isLiked = likedBy.includes(this.loggedInUsername);
      const originalLikes = post.likes;
      const originalLikedBy = [...likedBy];
      const updatedLikes = (post.likes || 0) + (isLiked ? -1 : 1);
      const updatedLikedBy = isLiked 
        ? likedBy.filter(user => user !== this.loggedInUsername)
        : [...likedBy, this.loggedInUsername];
      
      // Optimistic update with forced reactive patch
      this.applyPostPatch(postId, { likes: updatedLikes, likedBy: updatedLikedBy });

      try {
        await this.makeApiCall('https://sports321.vercel.app/api/editPost', 'POST', {
          postId,
          username: this.loggedInUsername,
          action: 'like',
        });
        
        this.notify?.(`Post ${isLiked ? 'unliked' : 'liked'} successfully!`, false);
      } catch (error) {
        // Revert on error
        this.applyPostPatch(postId, { likes: originalLikes, likedBy: originalLikedBy });
        this.notify?.('Error liking post: ' + error.message, true);
      }
    },

    async addComment(postId, commentText = null) {
      if (this.isCommentPending(postId)) return;
      if (!this.isAuthenticated) {
        this.notify?.('Please log in to comment', true);
        return;
      }

      const text = commentText || this.commentInputs[postId] || '';
      if (!text.trim()) {
        this.notify?.('Comment cannot be empty', true);
        return;
      }

      const post = this.findPost(postId);
      if (!post) return;

      // Mark pending early to block rapid double clicks before optimistic update runs
      this.commentPending[postId] = true;

      const commentId = String(Date.now());
      const newComment = {
        commentId,
        username: this.loggedInUsername,
        commentText: text,
        createdAt: new Date().toISOString(),
        profilePicture: getLocalStorage('profilePic') || 'pfp2.jpg',
        hearts: 0,
        likedBy: [],
        replies: [],
        showReplies: false,
        parentCommentId: null
      };

      // Optimistic update
      post.comments = post.comments || [];
      post.comments.push(newComment);
      post.commentCount = (post.commentCount || 0) + 1;
      this.updateSelectedPost(post);
      this.clearCommentInput(postId);
      this.invalidateCommentsCache(postId);

      try {
        await this.makeApiCall('https://sports321.vercel.app/api/editPost', 'POST', {
          postId,
          username: this.loggedInUsername,
          action: 'comment',
          comment: text,
          commentId,
        });
        
        // Refresh the post data after adding comment
        if (this.selectedPost?._id === postId) {
          await this.openFullScreenPost(postId);
        }
        
        this.notify?.('Comment added successfully!', false);
      } catch (error) {
        // Revert on error
        post.comments = post.comments.filter(c => c.commentId !== commentId);
        post.commentCount = Math.max(0, (post.commentCount || 1) - 1);
        this.updateSelectedPost(post);
        this.notify?.('Error adding comment: ' + error.message, true);
      } finally {
        this.commentPending[postId] = false;
      }
    },

    async addReply(postId, commentId, replyText = null) {
      if (this.isReplyPending(commentId)) return;
      if (!this.isAuthenticated) {
        this.notify?.('Please log in to reply', true);
        return;
      }

      const text = replyText || this.replyInputs[commentId] || '';
      if (!text.trim()) {
        this.notify?.('Reply cannot be empty', true);
        return;
      }

      const post = this.findPost(postId);
      const comment = this.findComment(post, commentId);
      if (!post || !comment) return;

      // Mark pending early to block rapid double clicks before optimistic update runs
      this.replyPending[commentId] = true;
      
      const replyId = String(Date.now());
      const newReply = {
        commentId: replyId,
        parentCommentId: String(commentId),
        username: this.loggedInUsername,
        commentText: text,
        createdAt: new Date().toISOString(),
        profilePicture: getLocalStorage('profilePic') || 'pfp2.jpg',
        hearts: 0,
        likedBy: [],
      };

      // Store original state for potential rollback
      const originalReplies = [...(comment.replies || [])];
      const originalReplyToggle = this.replyToggles[commentId];

      // Optimistic update
      comment.replies = comment.replies || [];
      comment.replies.push(newReply);
      comment.showReplies = true;
      this.replyToggles[commentId] = true;
      this.updateSelectedPost(post);
      this.clearReplyInput(commentId);
      this.invalidateCommentsCache(postId);

      try {
        await this.makeApiCall('https://sports321.vercel.app/api/editPost', 'POST', {
          postId,
          commentId,
          reply: text,
          username: this.loggedInUsername,
          action: 'reply',
          sessionId: this.sessionId,
          profilePicture: getLocalStorage('profilePic') || '',
          replyId,
        });
        
        // Store the toggle state BEFORE refreshing
        const shouldShowReplies = true;
        
        // Refresh the post data from API
        await this.openFullScreenPost(postId);
        
        // Apply reply toggle state AFTER refresh
        this.replyToggles[commentId] = shouldShowReplies;
        
        // Ensure the refreshed comment shows replies
        if (this.selectedPost?.comments) {
          const refreshedComment = this.findComment(this.selectedPost, commentId);
          if (refreshedComment) {
            refreshedComment.showReplies = shouldShowReplies;
            this.updateSelectedPost(this.selectedPost);
          }
        }
        
        this.notify?.('Reply added successfully!', false);
      } catch (error) {
        // Revert optimistic update
        comment.replies = originalReplies;
        this.replyToggles[commentId] = originalReplyToggle;
        this.updateSelectedPost(post);
        this.notify?.('Error adding reply: ' + error.message, true);
      } finally {
        this.replyPending[commentId] = false;
      }
    },

    toggleReplies(postId, commentId) {
      this.replyToggles[commentId] = !this.replyToggles[commentId];
      
      const post = this.findPost(postId);
      const comment = this.findComment(post, commentId);
      
      if (comment) {
        comment.showReplies = this.replyToggles[commentId];
        this.updateSelectedPost(post);
      }
    },

    async likeComment(postId, commentId) {
      if (!this.isAuthenticated) {
        this.notify?.('Please log in to like comments', true);
        return;
      }

      const post = this.findPost(postId);
      const comment = this.findComment(post, commentId);
      if (!comment) return;

      const likedBy = comment.likedBy || [];
      const isAlreadyLiked = likedBy.includes(this.loggedInUsername);
      const originalHearts = comment.hearts;
      const originalLikedBy = [...likedBy];
      const updatedHearts = (comment.hearts || 0) + (isAlreadyLiked ? -1 : 1);
      const updatedLikedBy = isAlreadyLiked 
        ? likedBy.filter(user => user !== this.loggedInUsername)
        : [...likedBy, this.loggedInUsername];
      
      // Optimistic update with forced reactive patch
      this.applyCommentPatch(postId, commentId, { hearts: updatedHearts, likedBy: updatedLikedBy });

      try {
        await this.makeApiCall('https://sports321.vercel.app/api/editPost', 'POST', {
          postId,
          username: this.loggedInUsername,
          action: 'heart comment',
          commentId: String(commentId),
        });
        
        this.notify?.(`Comment ${isAlreadyLiked ? 'unliked' : 'liked'} successfully!`, false);
      } catch (error) {
        // Revert on error
        this.applyCommentPatch(postId, commentId, { hearts: originalHearts, likedBy: originalLikedBy });
        this.notify?.('Error liking comment: ' + error.message, true);
      }
    },

    async likeReply(postId, commentId, replyId) {
      if (!this.isAuthenticated) {
        this.notify?.('Please log in to like replies', true);
        return;
      }

      const post = this.findPost(postId);
      const comment = this.findComment(post, commentId);
      const reply = this.findReply(comment, replyId);
      
      if (!reply) return;
      
      const likedBy = reply.likedBy || [];
      const isAlreadyLiked = likedBy.includes(this.loggedInUsername);
      const originalHearts = reply.hearts;
      const originalLikedBy = [...likedBy];

      // Optimistic update
      reply.hearts = (reply.hearts || 0) + (isAlreadyLiked ? -1 : 1);
      reply.likedBy = isAlreadyLiked 
        ? likedBy.filter(user => user !== this.loggedInUsername)
        : [...likedBy, this.loggedInUsername];

      this.updateSelectedPost(post);

      try {
        await this.makeApiCall('https://sports321.vercel.app/api/editPost', 'POST', {
          postId,
          username: this.loggedInUsername,
          action: 'heart reply',
          commentId: String(commentId),
          replyId: String(replyId),
        });
        
        this.notify?.(`Reply ${isAlreadyLiked ? 'unliked' : 'liked'} successfully!`, false);
      } catch (error) {
        // Revert on error
        reply.hearts = originalHearts;
        reply.likedBy = originalLikedBy;
        this.updateSelectedPost(post);
        this.notify?.('Error liking reply: ' + error.message, true);
      }
    },

    deletePost(postId) {
      if (!this.isAuthenticated) return;
      
      this.modalMessage = 'Are you sure you want to delete this post? This action cannot be undone.';
      this.modalAction = () => this.confirmDeletePost(postId);
      this.modalActionText = 'Delete';
      this.showModal = true;
    },

    async confirmDeletePost(postId) {
      try {
        await this.makeApiCall('https://sports321.vercel.app/api/deletePost', 'DELETE', {
          postId,
          username: this.loggedInUsername,
          sessionId: this.sessionId,
        });
        
        this.notify?.('Post deleted successfully!', false);
        this.posts = this.posts.filter(p => p._id !== postId);
        this.invalidateCommentsCache(postId);
        this.showModal = false;
        
        if (this.selectedPost?._id === postId) {
          this.selectedPost = null;
        }
      } catch (error) {
        this.notify?.('Failed to delete post: ' + error.message, true);
      }
    },

    deleteComment(postId, commentId) {
      if (!this.isAuthenticated) return;
      
      this.modalMessage = 'Are you sure you want to delete this comment? This action cannot be undone.';
      this.modalAction = () => this.confirmDeleteComment(postId, commentId);
      this.modalActionText = 'Delete';
      this.showModal = true;
    },

    async confirmDeleteComment(postId, commentId) {
      try {
        await this.makeApiCall('https://sports321.vercel.app/api/deletecomment', 'DELETE', {
          postId,
          commentId: String(commentId),
          username: this.loggedInUsername,
          sessionId: this.sessionId,
        });
        
        this.notify?.('Comment deleted successfully!', false);
        
        // Refresh the post data from API
        if (this.selectedPost?._id === postId) {
          await this.openFullScreenPost(postId);
        }
        
        this.invalidateCommentsCache(postId);
        this.showModal = false;
      } catch (error) {
        this.notify?.('Error deleting comment: ' + error.message, true);
      }
    },

    // Add this method to your Pinia store actions

deleteReply(postId, commentId, replyId) {
  if (!this.isAuthenticated) return;
  
  this.modalMessage = 'Are you sure you want to delete this reply? This action cannot be undone.';
  this.modalAction = () => this.confirmDeleteReply(postId, commentId, replyId);
  this.modalActionText = 'Delete';
  this.showModal = true;
},

async confirmDeleteReply(postId, commentId, replyId) {
  try {
    await this.makeApiCall('https://sports321.vercel.app/api/deletecomment', 'DELETE', {
      postId,
      commentId: String(commentId),
      replyId: String(replyId), // Include replyId for reply deletion
      username: this.loggedInUsername,
      sessionId: this.sessionId,
    });
    
    this.notify?.('Reply deleted successfully!', false);
    
    // Refresh the post data from API
    if (this.selectedPost?._id === postId) {
      await this.openFullScreenPost(postId);
    }
    
    this.invalidateCommentsCache(postId);
    this.showModal = false;
  } catch (error) {
    console.error('Delete reply error:', error);
    this.notify?.('Error deleting reply: ' + error.message, true);
  }
},
    editPost(postId, postUsername) {
      if (!this.isAuthenticated || postUsername !== this.loggedInUsername) return;
      
      this.modalMessage = 'Are you sure you want to edit this post?';
      this.modalAction = () => this.confirmEdit(postId);
      this.modalActionText = 'Edit';
      this.showModal = true;
    },

    async confirmEdit(postId) {
      const postText = prompt('Edit your opinion:');
      if (!postText?.trim()) return;
      
      try {
        await this.makeApiCall('https://sports321.vercel.app/api/deletecomment', 'PUT', {
          id: postId,
          message: postText,
          username: this.loggedInUsername,
          timestamp: new Date().toISOString(),
        });
        
        this.notify?.('Post updated successfully!', false);
        this.showModal = false;
      } catch (error) {
        this.notify?.('Error editing post: ' + error.message, true);
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
      const post = this.findPost(postId);
      if (post) {
        post.isBookmarked = !post.isBookmarked;
        this.updateSelectedPost(post);
        this.notify?.(`Post ${post.isBookmarked ? 'bookmarked' : 'unbookmarked'}!`, false);
      }
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
      this.setNotify(notifyFunction);
      this.loadMorePosts();

      if (!this.sessionId) {
        const newId = this.generateSessionId();
        setLocalStorage('sessionId', newId);
        this.sessionId = newId;
      }

      document.addEventListener('keydown', e => {
        if (e.key === 'Escape' && this.selectedPost) {
          this.closeFullScreenPost();
        }
      });
    },
  },
});
