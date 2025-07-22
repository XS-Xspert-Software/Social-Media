<template>
  <div class="notifications-page">
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
        :class="{ unread: !isNotificationRead(notification.id) }"
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
            Accept
          </button>
          <button
            @click.stop="declineFriendRequest(notification)"
            class="decline-btn"
            :disabled="notification.processing"
          >
            Decline
          </button>
        </div>
      </div>
    </div>
  </div>
</template>


<script setup>
import { ref, onMounted, onBeforeUnmount, computed, watch, defineExpose, getCurrentInstance } from 'vue'

const notifications = ref([])
const readNotifications = ref(new Set())

const loggedInUsername = localStorage.getItem('username') || ''

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
}

const acceptFriendRequest = async notification => {
  notification.processing = true
  try {
    const res = await fetch('https://sports321.vercel.app/api/Follow', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        action: 'add_friend',
        requester: notification.sender,
        recipient: loggedInUsername
      })
    })
    if (res.ok) {
      removeNotification(notification.id)
      emit('friend-request-accepted', notification.sender)
      emitNotify(`Friend request from ${notification.sender} accepted.`)
    } else {
      emitNotify('Failed to accept friend request', true)
    }
  } catch (err) {
    console.error(err)
    emitNotify('Error accepting friend request', true)
  } finally {
    notification.processing = false
  }
}

const declineFriendRequest = async notification => {
  notification.processing = true
  try {
    const res = await fetch('https://sports321.vercel.app/api/Follow', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        action: 'remove_friend',
        requester: notification.sender,
        recipient: loggedInUsername
      })
    })
    if (res.ok) {
      removeNotification(notification.id)
      emitNotify(`Friend request from ${notification.sender} declined.`)
    } else {
      emitNotify('Failed to decline friend request', true)
    }
  } catch (err) {
    console.error(err)
    emitNotify('Error declining friend request', true)
  } finally {
    notification.processing = false
  }
}

const removeNotification = id => {
  notifications.value = notifications.value.filter(n => n.id !== id)
  readNotifications.value.delete(id)
  saveReadNotifications()
  emitUnreadCount()
}

const saveReadNotifications = () => {
  localStorage.setItem(`readNotifications_${loggedInUsername}`, JSON.stringify([...readNotifications.value]))
}

const loadReadNotifications = () => {
  try {
    const stored = localStorage.getItem(`readNotifications_${loggedInUsername}`)
    if (stored) {
      readNotifications.value = new Set(JSON.parse(stored))
    }
  } catch (e) {
    console.error('Failed to load read notifications', e)
  }
}

const fetchNotifications = async () => {
  try {
    const res = await fetch(`https://sports321.vercel.app/api/notification?username=${loggedInUsername}`)
    if (!res.ok) throw new Error('Failed to fetch')
    const data = await res.json()

    // Prevent duplicates based on notification.id
    const unique = new Map()
    data.forEach(n => unique.set(n.id, n))
    notifications.value = Array.from(unique.values())

    emitUnreadCount()
  } catch (err) {
    console.error('Error fetching notifications:', err)
    emitNotify('Error fetching notifications', true)
  }
}

// Emit updated unread count to parent
const emitUnreadCount = () => {
  emit('update-unread-count', unreadCount.value)
}

// Emit notify event to parent (optional)
const emitNotify = (msg, isError = false) => {
  emit('notify', msg, isError)
}

let intervalId = null

onMounted(() => {
  loadReadNotifications()
  fetchNotifications()
  intervalId = setInterval(fetchNotifications, 30000)
})

onBeforeUnmount(() => {
  if (intervalId) clearInterval(intervalId)
})

// Expose fetchNotifications & cleanup methods to parent (if using template ref)
defineExpose({
  fetchNotifications,
  cleanup() {
    if (intervalId) clearInterval(intervalId)
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
</script>

<style scoped>
.notifications-page {
  padding: 24px;
  max-width: 700px;
  margin-top: 50px;
  color: #fff;
  background-color: #000;
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

.accept-btn {
  background-color: #28a745;
}

.decline-btn {
  background-color: #dc3545;
}

.mark-read-btn {
  background-color: #007bff;
}
</style>
