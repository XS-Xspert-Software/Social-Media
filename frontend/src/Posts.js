import { ref, onMounted, onUnmounted, toRefs } from 'vue';
import { usePostsStore } from './stores/postsStore';

export default function usePosts() {
  const postsStore = usePostsStore();

  // Expose store's reactive properties and methods
  const {
    posts,
    currentPage,
    loading,
    hasMorePosts,
    sortOption,
    postText,
    imagePreview,
    imageData,
    lastSentPostId,
    loggedInUsername,
    userId,
    sessionId,
    showModal,
    modalMessage,
    modalAction,
    modalActionText,
    selectedPost,
    isAuthenticated,
  } = toRefs(postsStore);

  // Bind store actions to ensure correct context
  const fetchPosts = postsStore.fetchPosts.bind(postsStore);
  const loadMorePosts = postsStore.loadMorePosts.bind(postsStore);
  const sortPosts = postsStore.sortPosts.bind(postsStore);
  const addPostToFeed = postsStore.addPostToFeed.bind(postsStore);
  const formatTimestamp = postsStore.formatTimestamp.bind(postsStore);
  const getTimeAgo = postsStore.getTimeAgo.bind(postsStore);
  const showUserProfile = postsStore.showUserProfile.bind(postsStore);
  const incrementViewOnScroll = postsStore.incrementViewOnScroll.bind(postsStore);
  const isElementInViewport = postsStore.isElementInViewport.bind(postsStore);
  const openFullScreenPost = postsStore.openFullScreenPost.bind(postsStore);
  const closeFullScreenPost = postsStore.closeFullScreenPost.bind(postsStore);
  const likePost = postsStore.likePost.bind(postsStore);
  const dislikePost = postsStore.dislikePost.bind(postsStore);
  const updatePostInFeed = postsStore.updatePostInFeed.bind(postsStore);
  const addComment = postsStore.addComment.bind(postsStore);
  const toggleReplies = postsStore.toggleReplies.bind(postsStore);
  const showReplyBox = postsStore.showReplyBox.bind(postsStore);
  const addReply = postsStore.addReply.bind(postsStore);
  const likeComment = postsStore.likeComment.bind(postsStore);
  const likeReply = postsStore.likeReply.bind(postsStore);
  const editPost = postsStore.editPost.bind(postsStore);
  const confirmEdit = postsStore.confirmEdit.bind(postsStore);
  const deletePost = postsStore.deletePost.bind(postsStore);
  const confirmDeletePost = postsStore.confirmDeletePost.bind(postsStore);
  const deleteComment = postsStore.deleteComment.bind(postsStore);
  const confirmDeleteComment = postsStore.confirmDeleteComment.bind(postsStore);
  const closeModal = postsStore.closeModal.bind(postsStore);
  const openFullScreen = postsStore.openFullScreen.bind(postsStore);
  const showNotification = postsStore.showNotification.bind(postsStore);

  // Require authentication helper
  const requireAuth = (action = 'perform this action') => {
    if (!isAuthenticated.value) {
      showNotification(`Please log in to ${action}`, true);
      return false;
    }
    return true;
  };

  // Scroll handler
  const handleScroll = () => {
    postsStore.handleScroll();
  };

  // Lifecycle hooks
  onMounted(() => {
    postsStore.initialize();
  });

  onUnmounted(() => {
    postsStore.cleanup();
  });

  return {
    posts,
    currentPage,
    loading,
    hasMorePosts,
    sortOption,
    postText,
    imagePreview,
    imageData,
    lastSentPostId,
    loggedInUsername,
    userId,
    sessionId,
    showModal,
    modalMessage,
    modalAction,
    modalActionText,
    selectedPost,
    isAuthenticated,
    requireAuth,
    fetchPosts,
    loadMorePosts,
    sortPosts,
    addPostToFeed,
    formatTimestamp,
    getTimeAgo,
    showUserProfile,
    handleScroll,
    incrementViewOnScroll,
    isElementInViewport,
    openFullScreenPost,
    closeFullScreenPost,
    likePost,
    dislikePost,
    updatePostInFeed,
    addComment,
    toggleReplies,
    showReplyBox,
    addReply,
    likeComment,
    likeReply,
    editPost,
    confirmEdit,
    deletePost,
    confirmDeletePost,
    deleteComment,
    confirmDeleteComment,
    closeModal,
    openFullScreen,
    showNotification,
  };
}


