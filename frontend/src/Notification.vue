<template>
  <div class="notification-root">
    <div v-if="showUi" class="notification-section">
      <h2>Notifications</h2>
      <div v-if="notifications.length === 0" class="no-notifications">
        You have no notifications.
      </div>
      <div v-else class="notification-list">
        <div class="notification-header">
          <span>You have {{ unreadCount }} unread {{ unreadCount === 1 ? 'notification' : 'notifications' }}</span>
          <button v-if="unreadCount > 0" @click="markAllAsRead" class="mark-read-btn">Mark all as read</button>
        </div>
        <div
          v-for="notification in notifications"
          :key="notification.id"
          class="notification-item"
          :class="{ 
            unread: !isNotificationRead(notification.id),
            clickable: isNotificationClickable(notification)
          }"
          @click="handleNotificationClick(notification)"
        >
          <div class="notification-content">
            <div class="notification-message">{{ notification.message }}</div>
            <div class="notification-time">{{ formatTime(notification.created_at) }}</div>
          </div>
          <div v-if="notification.type === 'friend_request'" class="notification-actions">
            <button
              @click.stop="acceptFriendRequest(notification)"
              class="accept-btn"
              :disabled="notification.processing"
            >
              {{ notification.processing ? 'Processing...' : 'Accept' }}
            </button>
            <button
              @click.stop="declineFriendRequest(notification)"
              class="decline-btn"
              :disabled="notification.processing"
            >
              {{ notification.processing ? 'Processing...' : 'Decline' }}
            </button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, onBeforeUnmount, computed, watch, defineExpose, getCurrentInstance } from 'vue'
import { useRouter } from 'vue-router'

// Props
const props = defineProps({
  loggedInUsername: {
    type: String,
    default: ''
  },
  showUi: {
    type: Boolean,
    default: true
  }
})

const router = useRouter()
const notifications = ref([])
const readNotifications = ref(new Set())

const unreadCount = computed(() =>
  notifications.value.filter(n => !readNotifications.value.has(n.id)).length
)

// Emit events to parent
const { emit } = getCurrentInstance()

const isNotificationRead = id => readNotifications.value.has(id)

const markNotificationAsRead = id => {
  readNotifications.value.add(id)
  saveReadNotifications()
  emitUnreadCount()
}

const markAllAsRead = () => {
  notifications.value.forEach(n => readNotifications.value.add(n.id))
  saveReadNotifications()
  emitUnreadCount()
}

const handleNotificationClick = notification => {
  if (!isNotificationRead(notification.id)) {
    markNotificationAsRead(notification.id)
  }

  // Handle post-related notifications by navigating to the post
  if (notification.metadata) {
    try {
      const metadata = typeof notification.metadata === 'string' 
        ? JSON.parse(notification.metadata) 
        : notification.metadata

      // Check if notification has a postId and redirect to post
      if (metadata.postId) {
        navigateToPost(metadata.postId)
        return
      }
    } catch (error) {
      emitNotify('Error loading post details', true)
    }
  }

  // Handle other notification types (like friend requests) - no navigation
  // These will be handled by their respective action buttons
}

// Navigate to post using your exact route structure
const navigateToPost = async (postId) => {
  try {
    // Using your exact route: /post/:id with name 'PostPage'
    await router.push({ name: 'PostPage', params: { id: postId } })
  } catch (error) {
    // Fallback to path-based navigation
    try {
      await router.push(`/post/${postId}`)
    } catch (fallbackError) {
      emitNotify('Could not navigate to post', true)
    }
  }
}

// Friend request handlers
const acceptFriendRequest = async notification => {
  // Prevent double clicks
  if (notification.processing) return;
  
  notification.processing = true;
  
  try {
    const res = await fetch('https://sports321.vercel.app/api/Follow', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        action: 'add_friend',
        requester: notification.sender,
        recipient: props.loggedInUsername
      })
    });

    const responseData = await res.json();

    if (res.ok) {
      removeNotification(notification.id);
      emit('friend-request-accepted', notification.sender);
      emitNotify(`Friend request from ${notification.sender} accepted.`);
    } else {
      const errorMessage = responseData.error || 'Unknown error occurred';
      
      if (res.status === 409) {
        emitNotify('You are already friends with this user', true);
        removeNotification(notification.id);
      } else if (res.status === 400) {
        emitNotify('Invalid request data', true);
      } else {
        emitNotify(`Failed to accept: ${errorMessage}`, true);
      }
    }
  } catch (err) {
    emitNotify('Connection error. Please try again.', true);
  } finally {
    notification.processing = false;
  }
};

const declineFriendRequest = async notification => {
  if (notification.processing) return;
  
  notification.processing = true;
  
  try {
    const res = await fetch('https://sports321.vercel.app/api/Follow', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        action: 'remove_friend',
        requester: notification.sender,
        recipient: props.loggedInUsername
      })
    });

    const responseData = await res.json();

    if (res.ok) {
      removeNotification(notification.id);
      emitNotify(`Friend request from ${notification.sender} declined.`);
    } else {
      const errorMessage = responseData.error || 'Unknown error occurred';
      emitNotify(`Failed to decline: ${errorMessage}`, true);
    }
  } catch (err) {
    emitNotify('Connection error. Please try again.', true);
  } finally {
    notification.processing = false;
  }
};

const removeNotification = id => {
  notifications.value = notifications.value.filter(n => n.id !== id)
  readNotifications.value.delete(id)
  saveReadNotifications()
  emitUnreadCount()
}

const saveReadNotifications = () => {
  if (!props.loggedInUsername || props.loggedInUsername === 'Guest') return
  localStorage.setItem(`readNotifications_${props.loggedInUsername}`, JSON.stringify([...readNotifications.value]))
}

const loadReadNotifications = () => {
  if (!props.loggedInUsername || props.loggedInUsername === 'Guest') return
  try {
    const stored = localStorage.getItem(`readNotifications_${props.loggedInUsername}`)
    if (stored) {
      readNotifications.value = new Set(JSON.parse(stored))
    }
  } catch (e) {
    // Silently handle localStorage errors
  }
}

const fetchNotifications = async () => {
  if (!props.loggedInUsername || props.loggedInUsername === 'Guest') {
    notifications.value = []
    emitUnreadCount()
    return
  }

  try {
    const res = await fetch(`https://sports321.vercel.app/api/notification?username=${props.loggedInUsername}`)
    if (!res.ok) throw new Error('Failed to fetch')
    const data = await res.json()

    // Prevent duplicates based on notification.id
    const unique = new Map()
    data.forEach(n => unique.set(n.id, n))
    notifications.value = Array.from(unique.values())

    emitUnreadCount()
  } catch (err) {
    emitNotify('Error fetching notifications', true)
  }
}

// Emit updated unread count to parent
const emitUnreadCount = () => {
  emit('update-unread-count', unreadCount.value)
}

// Emit notify event to parent
const emitNotify = (msg, isError = false) => {
  emit('notify', msg, isError)
}

let intervalId = null

// Watch for username changes to restart polling
watch(() => props.loggedInUsername, (newUsername, oldUsername) => {
  if (newUsername !== oldUsername) {
    // Clear existing interval
    if (intervalId) {
      clearInterval(intervalId)
      intervalId = null
    }
    
    // Reset notifications and read status
    notifications.value = []
    readNotifications.value = new Set()
    
    if (newUsername && newUsername !== 'Guest') {
      // Load read notifications for new user
      loadReadNotifications()
      // Fetch notifications immediately
      fetchNotifications()
      // Start polling
      intervalId = setInterval(fetchNotifications, 30000)
    } else {
      // User logged out, emit 0 count
      emitUnreadCount()
    }
  }
})

// Watch unread count changes to emit updates
watch(unreadCount, () => {
  emitUnreadCount()
})

onMounted(() => {
  if (props.loggedInUsername && props.loggedInUsername !== 'Guest') {
    loadReadNotifications()
    fetchNotifications()
    intervalId = setInterval(fetchNotifications, 30000)
  }
})

onBeforeUnmount(() => {
  if (intervalId) {
    clearInterval(intervalId)
    intervalId = null
  }
})

// Expose methods to parent
defineExpose({
  fetchNotifications,
  cleanup() {
    if (intervalId) {
      clearInterval(intervalId)
      intervalId = null
    }
  }
})

const formatTime = timestamp => {
  const date = new Date(timestamp)
  const now = new Date()
  const diff = now - date
  const mins = Math.floor(diff / 60000)
  const hours = Math.floor(diff / 3600000)
  const days = Math.floor(diff / 86400000)

  if (mins < 1) return 'Just now'
  if (mins < 60) return `${mins}m ago`
  if (hours < 24) return `${hours}h ago`
  if (days < 7) return `${days}d ago`
  return date.toLocaleDateString()
}

// Helper function to determine if notification is clickable (has post link)
const isNotificationClickable = notification => {
  if (!notification.metadata) return false
  
  try {
    const metadata = typeof notification.metadata === 'string' 
      ? JSON.parse(notification.metadata) 
      : notification.metadata
    return !!metadata.postId
  } catch {
    return false
  }
}

// Helper function to get notification icon based on type
const getNotificationIcon = type => {
  switch (type) {
    case 'new_post': return '📝'
    case 'tag_mention': return '@'
    case 'post_reply': return '💬'
    case 'friend_request': return '👥'
    case 'like': return '❤️'
    default: return '📧'
  }
}
</script>

<style scoped>
.notification-root {
  width: 100vw;
  min-height: 100vh;
  display: flex;
  justify-content: center;
  align-items: flex-start;
  background: transparent;
  box-sizing: border-box;
}
.notification-section {
  width: 100%;
  max-width: 480px;
  margin: 0 auto;
  margin-top: 50px;
  background: #111;
  border-radius: 12px;
  box-shadow: 0 2px 16px rgba(0,0,0,0.12);
  padding: 18px 16px;
  box-sizing: border-box;
}
@media (max-width: 600px) {
  .notification-section {
    max-width: 100vw;
    border-radius: 0;
    padding: 10px 2px;
    margin-top: 10px;
  }
  .notification-header {
    flex-direction: column;
    gap: 6px;
    font-size: 13px;
  }
  .notification-message {
    font-size: 13px;
  }
  .notification-time {
    font-size: 11px;
  }
  .accept-btn, .decline-btn, .mark-read-btn {
    font-size: 12px;
    padding: 5px 8px;
  }
}
@media (max-width: 400px) {
  .notification-section {
    padding: 4px 0;
  }
  .notification-header {
    font-size: 12px;
  }
}

h2 {
  font-size: 26px;
  margin-bottom: 20px;
  color: #fff;
}
.no-notifications {
  font-size: 16px;
  color: #999;
  text-align: center;
  padding: 40px 0;
}

.notification-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16px;
  font-size: 14px;
  color: #ccc;
}
.notification-item {
  background: #111;
  border: 1px solid #333;
  border-left: 4px solid transparent;
  padding: 16px;
  border-radius: 6px;
  transition: background-color 0.3s;
}

.notification-item.unread {
  border-left-color: #007bff;
  background: #1a1a1a;
}

.notification-message {
  font-size: 15px;
  margin-bottom: 6px;
  color: #fff;
}

.notification-time {
  font-size: 13px;
  color: #777;
}

.notification-actions {
  margin-top: 10px;
  display: flex;
  gap: 10px;
}

.accept-btn,
.decline-btn,
.mark-read-btn {
  padding: 6px 12px;
  font-size: 13px;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  color: white;
}

.accept-btn, .decline-btn, .mark-read-btn {
  background: none !important;
}
</style>
