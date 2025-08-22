<template>
  <div class="chat-box chatbox-override">
    <!-- Chat Header -->
    <div class="chat-header">
      <div class="header-left">
        <i class="fas fa-arrow-left" @click="goBack" aria-label="Go back"></i>
        <img class="profile-img" :src="profileImage" alt="Profile Image" />
        <span class="username">{{ chatWith }}</span>
      </div>
      <div class="header-actions" v-if="!inCall">
        <button @click="startCall('voice')" class="icon-button"><i class="fa fa-phone"></i></button>
        <button @click="startCall('video')" class="icon-button"><i class="fas fa-video"></i></button>
      </div>
      <button v-if="inCall" @click="endCall" class="hangup-button">🔴 Hang Up</button>
      <div v-if="inCall" class="video-container">
        <video ref="localVideo" autoplay muted playsinline style="width: 300px; background: #000;"></video>
        <video ref="remoteVideo" autoplay playsinline style="width: 300px; background: #000;"></video>
      </div>
    </div>

    <!-- Chat Main Area -->
    <div class="chat-main">
      <!-- Messages -->
      <div id="messages-container" style="overflow-y: auto;">
        <div v-if="incomingCall" class="incoming-call-popup">
          <p>📞 Incoming call from {{ chatWith }}</p>
          <button @click="acceptCall">✅ Accept</button>
          <button @click="rejectCall">❌ Reject</button>
        </div>

        <div v-if="callEndedNotice" class="call-ended-toast">Call Ended</div>
        <div class="chat-container">
          <div
            v-for="msg in messages"
            :key="msg.id"
            :data-message-id="msg.id"
            :class="['message', getMessageClass(msg), {
              'message-user': msg.side === 'user',
              'message-other': msg.side === 'other'
            }]"
            style="display: flex; width: 100%; flex-direction: column; margin-bottom: 12px;"
          >
            <!-- Reply indicator OUTSIDE msg-bubble -->
            <div
  v-if="msg.replyTo"
  class="reply-indicator"
  :style="msg.side === 'user' ? { alignSelf: 'flex-end' } : { alignSelf: 'flex-start' }"
  @click="scrollToReplyMessage(msg.replyTo)"
  title="Click to view original message"
>
  <div class="reply-content">
    <span class="reply-author">{{ getReplyAuthor(msg.replyTo) }}</span>
    <span class="reply-text">{{ getReplyText(msg.replyTo) }}</span>
  </div>
</div>

            <!-- Message with profile photo -->
            <div 
              class="message-wrapper"
              :style="msg.side === 'user' ? { 
                flexDirection: 'row-reverse', 
                justifyContent: 'flex-start',
                marginLeft: 'auto',
                marginRight: '0'
              } : { 
                flexDirection: 'row',
                justifyContent: 'flex-start',
                marginLeft: '0',
                marginRight: 'auto'
              }"
            >
              <!-- Profile Photo -->
              <div class="message-profile-photo">
                <img 
                  :src="msg.side === 'user' ? currentUserProfilePic : profileImage" 
                  :alt="msg.side === 'user' ? 'Your profile' : chatWith + ' profile'"
                  class="msg-profile-img"
                />
              </div>

              <!-- Message Bubble -->
              <div
                class="msg-bubble"
                :class="getMessageClass(msg)"
                @touchstart="handleTouchStart($event, msg)"
                @touchmove="handleTouchMove($event, msg)"
                @touchend="handleTouchEnd($event, msg)"
                @contextmenu.prevent="setReplyMessage(msg)"
              >
                <span v-if="msg.message">{{ msg.message }}</span>
                <img
                  v-if="msg.photo"
                  :src="msg.photo"
                  alt="Message Photo"
                  class="msg-photo"
                  @click="openFullScreen(msg.photo)"
                />
                <div v-if="msg.reactions">
                  <span v-for="reaction in msg.reactions" :key="reaction">{{ reaction }}</span>
                </div>
              </div>
            </div>
            
            <!-- Timestamp -->
            <div 
              class="timestamp" 
              :style="msg.side === 'user' ? { 
                alignSelf: 'flex-end', 
                marginRight: '50px' 
              } : { 
                alignSelf: 'flex-start', 
                marginLeft: '50px' 
              }"
            >
              {{ new Date(msg.timestamp).toLocaleTimeString() }}
            </div>
          </div>
        </div>
      </div>

      <div v-if="fullscreenImage" class="fullscreen-overlay" @click="closeFullScreen">
        <img :src="fullscreenImage" class="fullscreen-image" />
      </div>

      <div ref="messagesEnd"></div>
    </div>

    <!-- Typing Indicator -->
    <div v-if="isTyping" id="typing-indicator">{{ chatWith }} is typing...</div>

    <!-- Message Input Area -->
    <div class="message-input-wrapper" style="z-index: 100;">
      <!-- Reply Preview -->
      <div v-if="replyMessage" class="reply-preview">
        <div class="reply-preview-content">
          <div class="reply-preview-header">
            <span class="reply-to">Replying to {{ getReplyAuthor(replyMessage) }}</span>
            <button @click="cancelReply" class="cancel-reply">×</button>
          </div>
          <div class="reply-preview-text">{{ getReplyText(replyMessage) }}</div>
        </div>
      </div>

      <div class="message-input-row">
        <button @click="toggleEmojiPicker" class="emoji-button">😃</button>
        <input
          type="text"
          class="message-field"
          :placeholder="replyMessage ? 'Reply to message...' : 'Type a message...'"
          v-model="messageInput"
          @input="sendTypingIndicator"
          @keydown.enter="sendMessage"
        />
        <input type="file" id="file-input" accept="image/*" @change="previewPhoto($event)" style="display: none;" />
        <div class="icon-container" @click="triggerFileInput"><i class="fas fa-camera"></i></div>
        <button @click="sendMessage" class="send-button">Send</button>
      </div>

      <div v-if="showEmojiPicker" class="emoji-picker">
        <div @click="addEmoji('😊')">😊</div>
        <div @click="addEmoji('😂')">😂</div>
        <div @click="addEmoji('❤️')">❤️</div>
        <div @click="addEmoji('👍')">👍</div>
      </div>

      <img v-if="imagePreview" :src="imagePreview" alt="Preview" class="image-preview" />
      <p v-if="errorMessage" class="error-message">{{ errorMessage }}</p>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted, computed, watch, nextTick } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useWebRTC } from './useWebRTC.js'
import { updateRecentChat, incrementUnreadCount } from './recents.js'

const props = defineProps({ userId: String, username: String })
const route = useRoute()
const router = useRouter()

const messages = ref([])
const messageInput = ref('')
const imagePreview = ref(null)
const fullscreenImage = ref(null)
const errorMessage = ref('')
const isTyping = ref(false)
const showEmojiPicker = ref(false)
const replyMessage = ref(null)
const currentUserId = ref('')
const chatWithId = ref('')
const chatWith = ref('')
const profileImage = ref('')
const currentUserProfilePic = ref('')

let scrollCheckInterval = null
let typingTimeout = null
let typingCooldown = null

const webRTC = useWebRTC()
const { connectionStatus, isOtherUserOnline, inCall, incomingCall, localVideo, remoteVideo, 
        startCall, acceptCall, rejectCall, endCall, sendTypingIndicator, cleanup: cleanupWebRTC } = webRTC

const emit = defineEmits(['go-back', 'message-sent', 'message-received'])

const scrollToBottom = () => nextTick(() => {
  const container = document.getElementById('messages-container')
  container && (container.scrollTop = container.scrollHeight)
})

const isCurrentUserMessage = (msg) => String(msg.senderId) === String(currentUserId.value) || String(msg.username) === String(currentUserId.value)

const isElementInViewport = (el, container) => {
  const rect = el.getBoundingClientRect()
  const containerRect = container.getBoundingClientRect()
  return rect.top >= containerRect.top && rect.bottom <= containerRect.bottom
}

const getMessageClass = (msg) => {
  const isUser = isCurrentUserMessage(msg)
  return isUser ? (msg.seen ? 'user-msg-seen' : 'user-msg') : (msg.seen ? 'other-msg-seen' : 'other-msg')
}

window.webrtcMessageHandler = (message) => {
  const { type, data, payload } = message
  const actualData = payload || data
  
  if (type === 'newMessage') handleNewMessage(actualData)
  else if (type === 'typing') handleTypingIndicator(actualData)
  else if (type === 'messageSeenAcknowledgment') handleMessageSeen(actualData)
}

const updateRecentChatsAPI = (messageData) => {
  if (!currentUserId.value || !chatWithId.value) return

  const chatData = {
    userId: chatWithId.value, username: chatWith.value,
    profile_picture: profileImage.value || 'default-pfp.jpg',
    lastMessage: messageData.message, lastSeen: messageData.timestamp,
    unreadCount: messageData.isIncoming ? 1 : 0, isOnline: isOtherUserOnline.value,
  }

  updateRecentChat(currentUserId.value, chatData)

  if (messageData.isIncoming && (localStorage.getItem('chatWithId') !== chatWithId.value || !route.path.includes('chat'))) {
    incrementUnreadCount(currentUserId.value, chatWithId.value)
  }
}

const handleNewMessage = (incomingMsg) => {
  if (isCurrentUserMessage(incomingMsg) || messages.value.some(msg => msg.id === incomingMsg.id)) return

  messages.value.push({ ...incomingMsg, side: 'other', seen: false })
  
  const lastText = incomingMsg.message || (incomingMsg.photo ? '[Photo]' : '')
  updateRecentChatsAPI({ message: lastText, timestamp: incomingMsg.timestamp, isIncoming: true })
  
  emit('message-received', {
    senderId: incomingMsg.senderId, message: lastText, timestamp: incomingMsg.timestamp,
    senderUsername: chatWith.value, senderProfilePicture: profileImage.value || 'default-pfp.jpg'
  })
  
  nextTick(() => {
    scrollToBottom()
    setTimeout(checkUnseenMessagesInView, 100)
  })
}

const handleTypingIndicator = (data) => {
  if (String(data.senderId) !== String(chatWithId.value)) return
  
  isTyping.value = data.typing
  clearTimeout(typingTimeout)
  data.typing && (typingTimeout = setTimeout(() => isTyping.value = false, 3000))
}

const scrollToReplyMessage = (replyToMessage) => {
  if (!replyToMessage) return;
  
  const messageElement = document.querySelector(`[data-message-id="${replyToMessage.id}"]`);
  if (!messageElement) return;

  messageElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
  messageElement.classList.add('reply-highlight-animation');
  
  setTimeout(() => {
    messageElement.classList.remove('reply-highlight-animation');
  }, 2000);
};

const handleMessageSeen = (data) => {
  const msg = messages.value.find(m => m.id === data.messageId || m.id === data.id)
  msg && (msg.seen = true)
}

const sendMessage = async () => {
  if (!messageInput.value.trim() && !imagePreview.value) {
    errorMessage.value = 'Please type a message or select an image'
    return
  }

  const tempId = `temp-${Date.now()}-${Math.random()}`
  const tempMessage = {
    id: tempId, username: currentUserId.value, senderId: currentUserId.value,
    receiverId: chatWithId.value, chatWith: chatWithId.value, message: messageInput.value.trim(),
    timestamp: new Date().toISOString(), photo: imagePreview.value || null, side: 'user',
    replyTo: replyMessage.value || null, seen: false
  }

  messages.value.push(tempMessage)
  const messageText = messageInput.value.trim()
  messageInput.value = ''
  imagePreview.value = null
  replyMessage.value = null
  scrollToBottom()

  try {
    const response = await fetch('https://recent-six.vercel.app/api/message', {
      method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(tempMessage)
    })
    const savedMessage = (await response.json()).message

    if (savedMessage?.id) {
      const index = messages.value.findIndex(m => m.id === tempId)
      index !== -1 && (messages.value[index] = { ...savedMessage, side: 'user' })

      webRTC.sendChatMessage({ ...savedMessage, senderId: currentUserId.value, receiverId: chatWithId.value })
      
      const msgText = savedMessage.message || (savedMessage.photo ? '[Photo]' : '')
      updateRecentChatsAPI({ message: msgText, timestamp: savedMessage.timestamp, isIncoming: false })
      
      emit('message-sent', {
        receiverId: chatWithId.value, message: msgText, timestamp: savedMessage.timestamp,
        receiverUsername: chatWith.value, receiverProfilePicture: profileImage.value || 'default-pfp.jpg'
      })
    }
  } catch (error) {
    errorMessage.value = 'Error sending message'
    const index = messages.value.findIndex(m => m.id === tempId)
    index !== -1 && messages.value.splice(index, 1)
    messageInput.value = messageText
  }
}

const markAsSeen = async (messageId) => {
  const message = messages.value.find(msg => msg.id === messageId)
  if (!message || isCurrentUserMessage(message) || message.seen) return

  try {
    await fetch('https://recent-six.vercel.app/api/message', {
      method: 'PATCH', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ messageIds: [messageId], chatWith: chatWithId.value, currentUser: currentUserId.value })
    })
    webRTC.sendMessageSeen(messageId)
    message.seen = true
  } catch (error) {
    console.error('Error marking message as seen:', error)
  }
}

const loadMessages = async () => {
  try {
    const response = await fetch(`https://recent-six.vercel.app/api/message?username=${currentUserId.value}&chatWith=${chatWithId.value}`)
    const data = await response.json()
    
    if (Array.isArray(data.messages)) {
      messages.value = data.messages.map(msg => {
        const senderId = msg.senderId || msg.username
        const isCurrentUser = isCurrentUserMessage(msg)
        return {
          ...msg, senderId, side: isCurrentUser ? 'user' : 'other',
          timestamp: msg.timestamp || new Date().toISOString()
        }
      })

      await markAllUnseenAsSeen()
      
      const last = messages.value[messages.value.length - 1]
      if (last) {
        const lastText = last.message || (last.photo ? '[Photo]' : '')
        lastText && updateRecentChatsAPI({ message: lastText, timestamp: last.timestamp, isIncoming: false })
      }

      nextTick(() => {
        scrollToBottom()
        setupScrollListener()
        setTimeout(checkUnseenMessagesInView, 1000)
      })
    }
  } catch (error) {
    errorMessage.value = 'Error loading messages'
  }
}

const markAllUnseenAsSeen = async () => {
  const unseenMessages = messages.value.filter(msg => !isCurrentUserMessage(msg) && !msg.seen)
  if (!unseenMessages.length) return

  try {
    await fetch('https://recent-six.vercel.app/api/message', {
      method: 'PATCH', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ messageIds: unseenMessages.map(msg => msg.id), chatWith: chatWithId.value, currentUser: currentUserId.value })
    })

    unseenMessages.forEach(msg => {
      msg.seen = true
      webRTC.sendMessageSeen(msg.id)
    })
  } catch (error) {
    console.error('Error marking messages as seen:', error)
  }
}

const checkUnseenMessagesInView = () => {
  const container = document.getElementById('messages-container')
  if (!container) return

  messages.value
    .filter(msg => !isCurrentUserMessage(msg) && !msg.seen)
    .forEach(msg => {
      const el = document.querySelector(`[data-message-id="${msg.id}"]`)
      el && isElementInViewport(el, container) && markAsSeen(msg.id)
    })
}

const setupScrollListener = () => {
  nextTick(() => {
    const container = document.getElementById('messages-container')
    if (container) {
      container.addEventListener('scroll', checkUnseenMessagesInView, { passive: true })
      setTimeout(checkUnseenMessagesInView, 100)
    }
    scrollCheckInterval && clearInterval(scrollCheckInterval)
    scrollCheckInterval = setInterval(checkUnseenMessagesInView, 2000)
  })
}

const goBack = () => { emit('go-back'); router.push('/chat') }
const previewPhoto = (event) => {
  const file = event.target.files[0]
  if (file) {
    const reader = new FileReader()
    reader.onload = (e) => imagePreview.value = e.target.result
    reader.readAsDataURL(file)
  }
}
const openFullScreen = (imageUrl) => fullscreenImage.value = imageUrl
const closeFullScreen = () => fullscreenImage.value = null
const toggleEmojiPicker = () => showEmojiPicker.value = !showEmojiPicker.value
const addEmoji = (emoji) => { messageInput.value += emoji; showEmojiPicker.value = false }
const triggerFileInput = () => document.getElementById('file-input')?.click()

// Touch/swipe variables
let touchStartX = 0
let touchStartY = 0
let touchStartTime = 0

// Reply functions
const setReplyMessage = (msg) => {
  replyMessage.value = msg
  document.querySelector('.message-field')?.focus()
}

const cancelReply = () => replyMessage.value = null

const getReplyAuthor = (replyMsg) => {
  if (!replyMsg) return ''
  return isCurrentUserMessage(replyMsg) ? 'You' : chatWith.value
}

const getReplyText = (replyMsg) => {
  if (!replyMsg) return ''
  return replyMsg.message || (replyMsg.photo ? '[Photo]' : '[Message]')
}

// Touch handlers for swipe-to-reply
const handleTouchStart = (event, msg) => {
  const touch = event.touches[0]
  touchStartX = touch.clientX
  touchStartY = touch.clientY
  touchStartTime = Date.now()
}

const handleTouchMove = (event, msg) => {
  if (!touchStartX) return
  
  const touch = event.touches[0]
  const deltaX = touch.clientX - touchStartX
  const deltaY = touch.clientY - touchStartY
  
  // Show reply indicator if swiping right significantly
  if (deltaX > 50 && Math.abs(deltaY) < 30) {
    event.currentTarget.style.transform = `translateX(${Math.min(deltaX, 100)}px)`
    event.currentTarget.style.opacity = Math.max(0.7, 1 - deltaX / 200)
  }
}

const handleTouchEnd = (event, msg) => {
  if (!touchStartX) return
  
  const touch = event.changedTouches[0]
  const deltaX = touch.clientX - touchStartX
  const deltaY = touch.clientY - touchStartY
  const deltaTime = Date.now() - touchStartTime
  
  // Reset transform
  event.currentTarget.style.transform = ''
  event.currentTarget.style.opacity = ''
  
  // If swiped right more than 100px, set as reply
  if (deltaX > 100 && Math.abs(deltaY) < 50 && deltaTime < 1000) {
    setReplyMessage(msg)
  }
  
  touchStartX = 0
  touchStartY = 0
  touchStartTime = 0
}

const handleStartCall = (mode = 'video') => startCall(mode)
const handleAcceptCall = () => acceptCall()
const handleRejectCall = () => rejectCall()
const handleEndCall = () => endCall()
window.onCallRejected = () => alert(`${chatWith.value} rejected the call.`)

watch(isOtherUserOnline, () => nextTick(() => {
  const chatBox = document.querySelector('.chat-box')
  const chatHeader = document.querySelector('.chat-header')
  const container = document.getElementById('messages-container')
  
  if (isOtherUserOnline.value) {
    chatBox && (chatBox.style.background = 'linear-gradient(90deg, #0d102f, #6a00f4, #f4f9ff)')
    chatHeader && (chatHeader.style.background = 'radial-gradient(circle, #0d102f, #3b00d3, #a371f7)')
    if (container) {
      container.style.background = 'linear-gradient(135deg, #2d1b69 0%, #11998e 100%)'
      container.style.border = '2px solid rgba(106, 0, 244, 0.3)'
      container.style.boxShadow = '0 4px 15px rgba(106, 0, 244, 0.2)'
    }
  } else {
    chatBox && (chatBox.style.background = '')
    chatHeader && (chatHeader.style.background = '')
    if (container) {
      container.style.background = '#000'
      container.style.border = ''
      container.style.boxShadow = ''
    }
  }
}), { immediate: true })

watch(messageInput, (newValue, oldValue) => {
  if (newValue && newValue !== oldValue && connectionStatus.value === 'connected' && !typingCooldown) {
    sendTypingIndicator(true)
    typingCooldown = true
    setTimeout(() => typingCooldown = false, 1000)
  }
})

onMounted(async () => {
  currentUserId.value = localStorage.getItem('userId')
  chatWith.value = props.username || localStorage.getItem('chatWith')
  chatWithId.value = props.userId || localStorage.getItem('chatWithId')
  profileImage.value = localStorage.getItem('profileImage') || 'default-pfp.jpg'
  currentUserProfilePic.value = localStorage.getItem('profilePic') || 'default-pfp.jpg'
  
  // Debug: Confirm the values are set
  console.log('currentUserProfilePic set to:', currentUserProfilePic.value)
  console.log('profileImage set to:', profileImage.value)

  await loadMessages()
  await webRTC.init(currentUserId.value, chatWithId.value, 'wss://chat-server-2-hw1i.onrender.com')
  setTimeout(() => webRTC.subscribeToChannels(), 300)

  const handleVisibilityChange = () => {
    if (!document.hidden && connectionStatus.value !== 'connected') {
      webRTC.reconnectWebSocket('wss://chat-server-2-hw1i.onrender.com')
      setTimeout(() => { checkUnseenMessagesInView(); markAllUnseenAsSeen() }, 500)
    }
  }

  document.addEventListener('visibilitychange', handleVisibilityChange)
  window.addEventListener('beforeunload', () => webRTC.leavePresence())
})

onUnmounted(() => {
  scrollCheckInterval && clearInterval(scrollCheckInterval)
  typingTimeout && clearTimeout(typingTimeout)
  cleanupWebRTC()
  
  const container = document.getElementById('messages-container')
  container && container.removeEventListener('scroll', checkUnseenMessagesInView)
  
  delete window.webrtcMessageHandler
  delete window.onCallRejected
})

const isConnected = computed(() => connectionStatus.value === 'connected')
</script>
<style src="./Chatbox.css"></style>

<style scoped>
.reply-indicator {
  background-color: #111;             /* Slightly lighter than body */
  border-left: 3px solid #5a9cff;     /* Accent color to indicate a reply */
  border-radius: 6px;
  padding: 6px 10px;
  margin-bottom: 6px;
  max-width: 75%;
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 0.9em;
  opacity: 0.95;                      /* Slight transparency for subtle effect */
}
.reply-content {
  display: flex;
  align-items: center;
  gap: 8px; /* ← Adds space between author and text */
}

.reply-author {
  color: #9ecbff;              /* Soft blue for author */
  font-size: 16px;
}

.reply-text {
  color: #9ecbff8d;              /* Light gray for message */
  font-size: 14 px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  flex: 1;
}
.message-wrapper {
  display: flex;
  align-items: flex-end;
  max-width: 80%;
  margin-bottom: 4px;
}
.message-profile-photo {
  display: flex;
  align-items: flex-end;
  margin: 0 8px;
}

.msg-profile-img {
  width: 32px;
  height: 32px;
  border-radius: 50%;
  object-fit: cover;
  border: 2px solid #ddd;
  background-color: #f0f0f0;
}
.reply-highlight-animation {
  animation: replyHighlight 1.2s ease-out;
}

@keyframes replyHighlight {
  0% {
    background-color: rgba(255, 255, 255, 0.08); /* soft white highlight */
  }
  50% {
    background-color: rgba(255, 255, 255, 0.15);
  }
  100% {
    background-color: transparent;
  }
}

</style>

