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
      <div id="messages-container">
        <div v-if="incomingCall" class="incoming-call-popup">
          <p>📞 Incoming call from {{ chatWith }}</p>
          <button @click="acceptCall">✅ Accept</button>
          <button @click="rejectCall">❌ Reject</button>
        </div>

        <div v-if="callEndedNotice" class="call-ended-toast">Call Ended</div>
        <div class="chat-container">
          <div
            v-for="(msg, index) in messages"
            :key="index"
            :class="['message', msg.side === 'user' ? (msg.seen ? 'user-msg-seen' : 'user-msg') : 'other-msg']"
          >
            <div
              class="msg-bubble"
              :class="msg.side === 'user' && msg.seen ? 'user-msg-seen' : ''"
            >
              <span v-if="msg.message">{{ msg.message }}</span>
              <img v-if="msg.photo" :src="msg.photo" alt="Message Photo" class="msg-photo" @click="openFullScreen(msg.photo)" />
              <div v-if="msg.reactions"><span v-for="reaction in msg.reactions" :key="reaction">{{ reaction }}</span></div>
            </div>
            <div class="timestamp">{{ new Date(msg.timestamp).toLocaleTimeString() }}</div>
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
      <div class="message-input-wrapper">
        <div class="message-input-row">
          <button @click="toggleEmojiPicker" class="emoji-button">😃</button>
          <input type="text" class="message-field" placeholder="Type a message..." v-model="messageInput" @input="sendTypingIndicator" />
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
    </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted, computed, watch, nextTick } from 'vue'
import { useRoute, useRouter } from 'vue-router'

// Props
const props = defineProps({
  userId: String,
  username: String
})

// Router composables
const route = useRoute()
const router = useRouter()

// Reactive data
const messages = ref([])
const messageInput = ref('')
const imagePreview = ref(null)
const fullscreenImage = ref(null)
const errorMessage = ref('')
const loggedInUsername = ref('')
const chatWith = ref('')
const profileImage = ref('')
const ablyApiKey = ref('H3Idqw.EWX83w:6cA01tWKUZxX9F1D1bWfE0rR_Tj7nQKCdkG2TGlTdhE')
const isTyping = ref(false)
const showEmojiPicker = ref(false)
const replyMessage = ref(null)
const ably = ref(null)
const isOtherUserOnline = ref(false)
const inCall = ref(false)
const incomingCall = ref(false)
const incomingOffer = ref(null)
const rtcChannel = ref(null)
const callEndedNotice = ref(false)
const peerConnection = ref(null)
const localStream = ref(null)
const remoteStream = ref(null)
const currentUserId = ref('')
const chatWithId = ref('')

// Refs for template elements
const localVideo = ref(null)
const remoteVideo = ref(null)

// Watchers
watch(isOtherUserOnline, (newStatus) => {
  updateChatboxColor()
})

// Methods
const goBack = () => {
  router.push('/chat/world')
}

const sendTypingIndicator = () => {
  const typingPayload = { typing: true, senderId: currentUserId.value }
  ably.value.channels.get(`chat-${currentUserId.value}-${chatWithId.value}`).publish('typing', typingPayload)
  ably.value.channels.get(`chat-${chatWithId.value}-${currentUserId.value}`).publish('typing', typingPayload)
}

const openFullScreen = (imageUrl) => {
  fullscreenImage.value = imageUrl
}

const closeFullScreen = () => {
  fullscreenImage.value = null
}

const setupIncomingCallListener = async () => {
  const incomingChannel = ably.value.channels.get(`rtc-${chatWith.value}-${loggedInUsername.value}`)

  incomingChannel.subscribe('offer', async (message) => {
    incomingOffer.value = message.data
    incomingCall.value = true
    rtcChannel.value = ably.value.channels.get(`rtc-${loggedInUsername.value}-${chatWith.value}`)
  })

  incomingChannel.subscribe('call-ended', () => {
    endCall()
  })
}

const acceptCall = async () => {
  if (!incomingOffer.value) return

  incomingCall.value = false
  await prepareCallAsReceiver(incomingOffer.value)
  incomingOffer.value = null
}

const rejectCall = () => {
  if (rtcChannel.value) {
    rtcChannel.value.publish('call-rejected', {
      from: loggedInUsername.value
    })
  }
  incomingCall.value = false
  incomingOffer.value = null
}

const prepareCallAsReceiver = async (offerData) => {
  try {
    inCall.value = true
    await nextTick()

    const incomingChannel = ably.value.channels.get(`rtc-${chatWith.value}-${loggedInUsername.value}`)

    peerConnection.value = new RTCPeerConnection({
      iceServers: [
        { urls: 'stun:stun.l.google.com:19302' },
        { urls: 'stun:stun1.l.google.com:19302' },
        { urls: 'stun:stun2.l.google.com:19302' }
      ]
    })

    peerConnection.value.onicecandidate = (event) => {
      if (event.candidate) {
        rtcChannel.value.publish('ice-candidate', {
          candidate: event.candidate.candidate,
          sdpMid: event.candidate.sdpMid,
          sdpMLineIndex: event.candidate.sdpMLineIndex
        })
      }
    }

    peerConnection.value.ontrack = (event) => {
      if (!remoteStream.value) remoteStream.value = new MediaStream()
      event.streams[0].getTracks().forEach(track => {
        remoteStream.value.addTrack(track)
      })
      if (remoteVideo.value) {
        remoteVideo.value.srcObject = remoteStream.value
      }
    }

    const mediaConstraints = offerData.mode === 'voice'
      ? { audio: true, video: false }
      : { audio: true, video: true }

    localStream.value = await navigator.mediaDevices.getUserMedia(mediaConstraints)
    localStream.value.getTracks().forEach(track => {
      peerConnection.value.addTrack(track, localStream.value)
    })

    if (localVideo.value && offerData.mode !== 'voice') {
      localVideo.value.srcObject = localStream.value
    }

    await peerConnection.value.setRemoteDescription(new RTCSessionDescription(offerData))
    const answer = await peerConnection.value.createAnswer()
    await peerConnection.value.setLocalDescription(answer)

    rtcChannel.value.publish('answer', {
      type: answer.type,
      sdp: answer.sdp
    })

    incomingChannel.subscribe('ice-candidate', async (message) => {
      try {
        await peerConnection.value.addIceCandidate(new RTCIceCandidate(message.data))
      } catch (err) {
        console.error("❄️ ICE error (receiver):", err)
      }
    })

  } catch (error) {
    console.error("❌ Error in prepareCallAsReceiver:", error)
    endCall()
  }
}

const startCall = async (mode = 'video') => {
  try {
    inCall.value = true
    await nextTick()

    rtcChannel.value = ably.value.channels.get(`rtc-${loggedInUsername.value}-${chatWith.value}`)
    const remoteRtcChannel = ably.value.channels.get(`rtc-${chatWith.value}-${loggedInUsername.value}`)

    peerConnection.value = new RTCPeerConnection({
      iceServers: [
        { urls: 'stun:stun.l.google.com:19302' },
        { urls: 'stun:stun1.l.google.com:19302' },
        { urls: 'stun:stun2.l.google.com:19302' }
      ]
    })

    peerConnection.value.onicecandidate = (event) => {
      if (event.candidate) {
        rtcChannel.value.publish('ice-candidate', {
          candidate: event.candidate.candidate,
          sdpMid: event.candidate.sdpMid,
          sdpMLineIndex: event.candidate.sdpMLineIndex
        })
      }
    }

    const mediaConstraints = mode === 'voice'
      ? { audio: true, video: false }
      : { audio: true, video: true }

    localStream.value = await navigator.mediaDevices.getUserMedia(mediaConstraints)
    localStream.value.getTracks().forEach(track => {
      peerConnection.value.addTrack(track, localStream.value)
    })

    if (localVideo.value && mode !== 'voice') {
      localVideo.value.srcObject = localStream.value
    }

    remoteStream.value = new MediaStream()
    if (remoteVideo.value) {
      remoteVideo.value.srcObject = remoteStream.value
    }

    peerConnection.value.ontrack = (event) => {
      event.streams[0].getTracks().forEach(track => {
        remoteStream.value.addTrack(track)
      })
    }

    remoteRtcChannel.subscribe('answer', async (message) => {
      await peerConnection.value.setRemoteDescription(new RTCSessionDescription(message.data))
    })

    remoteRtcChannel.subscribe('ice-candidate', async (message) => {
      try {
        await peerConnection.value.addIceCandidate(new RTCIceCandidate(message.data))
      } catch (err) {
        console.error("❄️ ICE error (caller):", err)
      }
    })

    remoteRtcChannel.subscribe('call-rejected', () => {
      alert(`${chatWith.value} rejected the call.`)
      endCall()
    })

    const isCaller = loggedInUsername.value.localeCompare(chatWith.value) < 0
    if (isCaller) {
      const offer = await peerConnection.value.createOffer()
      await peerConnection.value.setLocalDescription(offer)

      rtcChannel.value.publish('offer', {
        type: offer.type,
        sdp: offer.sdp,
        mode
      })
    }

  } catch (error) {
    console.error("❌ Error starting call:", error)
    endCall()
  }
}

const endCall = () => {
  if (rtcChannel.value) {
    rtcChannel.value.publish('call-ended', { from: loggedInUsername.value })
  }

  if (peerConnection.value) {
    peerConnection.value.close()
    peerConnection.value = null
  }

  if (localStream.value) {
    localStream.value.getTracks().forEach(track => track.stop())
    localStream.value = null
  }

  if (remoteStream.value) {
    remoteStream.value.getTracks().forEach(track => track.stop())
    remoteStream.value = null
  }

  inCall.value = false

  if (localVideo.value) localVideo.value.srcObject = null
  if (remoteVideo.value) remoteVideo.value.srcObject = null

  if (rtcChannel.value) {
    rtcChannel.value.detach()
    rtcChannel.value = null
  }

  callEndedNotice.value = true
  setTimeout(() => {
    callEndedNotice.value = false
  }, 3000)
}

const sendMessage = async () => {
  if (messageInput.value.trim() || imagePreview.value) {
    const tempTimestamp = new Date().toISOString()
    const tempMessage = {
      username: currentUserId.value,
      chatWith: chatWithId.value,
      message: messageInput.value.trim(),
      timestamp: tempTimestamp,
      photo: imagePreview.value || null,
      side: 'user',
      replyTo: replyMessage.value || null,
      seen: false,
    }

    messages.value.push(tempMessage)
    messageInput.value = ''
    imagePreview.value = null
    replyMessage.value = null

    const savedMessage = await sendToServer(tempMessage)
    if (savedMessage?.id) {
      const index = messages.value.findIndex(m => m.timestamp === tempTimestamp)
      if (index !== -1) {
        messages.value[index] = {
          ...savedMessage,
          side: 'user',
          alignmentClass: savedMessage.seen ? 'user-msg-seen' : 'user-msg',
        }
      }

      const channelA = `chat-${currentUserId.value}-${chatWithId.value}`
      const channelB = `chat-${chatWithId.value}-${currentUserId.value}`

      ably.value.channels.get(channelA).publish('newMessage', savedMessage)
      ably.value.channels.get(channelB).publish('newMessage', savedMessage)
    }
  } else {
    errorMessage.value = 'Please type a message or select an image'
  }
}

const sendToServer = async (messageData) => {
  try {
    const res = await fetch('https://social-five-beta.vercel.app/api/message', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(messageData),
    })
    const result = await res.json()
    return result.message
  } catch (err) {
    errorMessage.value = 'Error sending message to server'
    console.error(err)
  }
}

const markAsSeen = (id) => {
  const message = messages.value.find(msg => msg.id === id)
  if (!message || message.senderId === currentUserId.value || message.side === 'user' || message.seen) return

  fetch('https://social-five-beta.vercel.app/api/message', {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ id: message.id }),
  })
    .then(() => {
      ably.value.channels.get(`chat-${chatWithId.value}-${currentUserId.value}`)
        .publish('messageSeenAcknowledgment', { id: message.id })
    })
    .catch(err => {
      console.error('❌ Error updating seen status:', err)
    })

  message.seen = true
  message.alignmentClass = 'user-msg-seen'
}

const previewPhoto = (event) => {
  const file = event.target.files[0]
  const reader = new FileReader()
  reader.onload = (e) => {
    imagePreview.value = e.target.result
  }
  reader.readAsDataURL(file)
}

const toggleEmojiPicker = () => {
  showEmojiPicker.value = !showEmojiPicker.value
}

const addEmoji = (emoji) => {
  messageInput.value += emoji
  showEmojiPicker.value = false
}

const triggerFileInput = () => {
  document.getElementById('file-input').click()
}

const checkUnseenMessagesInView = () => {
  messages.value.forEach(msg => {
    if (msg.senderId === currentUserId.value || msg.seen) return
    const el = document.querySelector(`[data-message-id="${msg.id}"]`)
    if (el && isElementInViewport(el)) {
      markAsSeen(msg.id)
    }
  })
}

const isElementInViewport = (el) => {
  const rect = el.getBoundingClientRect()
  return (
    rect.top >= 0 &&
    rect.left >= 0 &&
    rect.bottom <= (window.innerHeight || document.documentElement.clientHeight) &&
    rect.right <= (window.innerWidth || document.documentElement.clientWidth)
  )
}

const updateChatboxColor = () => {
  nextTick(() => {
    const chatboxContainer = document.getElementById('chatbox-container')
    const chatHeader = document.getElementById('header')
    if (!chatboxContainer || !chatHeader) return

    if (isOtherUserOnline.value) {
      chatboxContainer.style.background = 'linear-gradient(90deg, #0d102f, #6a00f4, #f4f9ff)'
      chatHeader.style.background = 'radial-gradient(circle, #0d102f, #3b00d3, #a371f7)'
    } else {
      chatboxContainer.style.background = ''
      chatHeader.style.backgroundColor = ''
    }
  })
}

// Lifecycle hooks
onMounted(() => {
  const currentUserIdFromStorage = localStorage.getItem('userId')
  const loggedInUsernameFromStorage = localStorage.getItem('username')
  const profileImageFromStorage = localStorage.getItem('profileImage') || 'pfp3.jpg'

  const chatWithFromStorage = props.username || localStorage.getItem('chatWith')
  const chatWithIdFromStorage = props.userId || localStorage.getItem('chatWithId')

  if (currentUserIdFromStorage && chatWithIdFromStorage && chatWithFromStorage && loggedInUsernameFromStorage) {
    currentUserId.value = currentUserIdFromStorage
    chatWithId.value = chatWithIdFromStorage
    loggedInUsername.value = loggedInUsernameFromStorage
    chatWith.value = chatWithFromStorage
    profileImage.value = profileImageFromStorage

    localStorage.removeItem('chatWith')
    localStorage.removeItem('chatWithId')
  } else {
    alert('Missing chat data. Please select a user to chat with.')
    router.push('/')
    return
  }

  ably.value = new Ably.Realtime({
    key: ablyApiKey.value,
    clientId: currentUserId.value,
  })

  const presenceChannelName = `chat-presence-${[currentUserId.value, chatWithId.value].sort().join('-')}`
  const presenceChannel = ably.value.channels.get(presenceChannelName)

  presenceChannel.presence.enter()

  presenceChannel.presence.subscribe('enter', (member) => {
    if (member.clientId === chatWithId.value) {
      isOtherUserOnline.value = true
    }
  })

  presenceChannel.presence.subscribe('leave', (member) => {
    if (member.clientId === chatWithId.value) {
      isOtherUserOnline.value = false
    }
  })

  presenceChannel.presence.get((err, members) => {
    if (err) {
      console.error("Presence error:", err)
      return
    }
    const isOnline = members.some(m => m.clientId === chatWithId.value)
    isOtherUserOnline.value = isOnline
  })

  const otherUserChannel = ably.value.channels.get(`chat-${chatWithId.value}-${currentUserId.value}`)
  otherUserChannel.subscribe('newMessage', (message) => {
    const incomingMsg = message.data
    if (incomingMsg.senderId == currentUserId.value) return

    const alreadyExists = messages.value.some(msg => msg.id === incomingMsg.id)
    if (alreadyExists) return

    const receivedMessage = {
      ...incomingMsg,
      side: 'other',
      seen: false,
    }

    messages.value.push(receivedMessage)

    if (messages.value.length > 0) {
      const last = messages.value[messages.value.length - 1]
      const lastText = last.message || (last.photo ? '[Photo]' : '')
      const key = `lastMessage-${chatWithId.value}`
      localStorage.setItem(key, lastText)
    }

    nextTick(() => {
      checkUnseenMessagesInView()
    })
  })

  const senderChannel = ably.value.channels.get(`chat-${currentUserId.value}-${chatWithId.value}`)
  senderChannel.subscribe('messageSeenAcknowledgment', (message) => {
    const messageId = message.data.id
    const msg = messages.value.find(m => m.id === messageId)
    if (msg) {
      msg.seen = true
      msg.alignmentClass = 'user-msg-seen'
    }
  })

  fetch(`https://social-five-beta.vercel.app/api/message?username=${currentUserId.value}&chatWith=${chatWithId.value}`)
    .then((response) => response.json())
    .then((data) => {
      if (Array.isArray(data.messages)) {
        const alignedMessages = data.messages.map((msg) => ({
          ...msg,
          alignmentClass: msg.senderId == currentUserId.value ? 'user-msg' : 'other-msg',
        }))

        messages.value = alignedMessages

        if (messages.value.length > 0) {
          const last = messages.value[messages.value.length - 1]
          const lastText = last.message || (last.photo ? '[Photo]' : '')
          const key = `lastMessage-${chatWithId.value}`
          localStorage.setItem(key, lastText)
        }

        nextTick(() => {
          const chatboxContainer = document.getElementById('messages-container')
          if (chatboxContainer) {
            chatboxContainer.scrollTop = chatboxContainer.scrollHeight
          }
        })

        const unseenMessages = alignedMessages.filter(
          msg => msg.senderId != currentUserId.value && !msg.seen
        )

        if (unseenMessages.length > 0) {
          setTimeout(() => {
            checkUnseenMessagesInView()
          }, 200)
        }
      }
    })
    .catch(() => {
      errorMessage.value = 'Error loading messages'
    })

  window.addEventListener('beforeunload', () => {
    if (ably.value) ably.value.close()
  })

  setupIncomingCallListener()
})

onUnmounted(() => {
  if (ably.value) {
    ably.value.close()
  }
})

// Expose methods and data for template usage
defineExpose({
  goBack,
  sendMessage,
  sendTypingIndicator,
  openFullScreen,
  closeFullScreen,
  startCall,
  endCall,
  acceptCall,
  rejectCall,
  previewPhoto,
  toggleEmojiPicker,
  addEmoji,
  triggerFileInput,
  markAsSeen,
  // Reactive data
  messages,
  messageInput,
  imagePreview,
  fullscreenImage,
  errorMessage,
  loggedInUsername,
  chatWith,
  profileImage,
  isTyping,
  showEmojiPicker,
  replyMessage,
  isOtherUserOnline,
  inCall,
  incomingCall,
  callEndedNotice,
  // Template refs
  localVideo,
  remoteVideo
})
</script>
<style src="./Chatbox.css"></style>
<style scoped>
.msg-bubble{background-color:var(--bg-secondary);color:var(--text-secondary);padding:0.55rem 0.85rem;border-radius:1.5rem;line-height:1.5;word-break:break-word;box-shadow:0 2px 2px rgba(0,0,0,0.2);max-width:100%}
.user-msg{align-self:flex-end}
.other-msg{align-self:flex-start}
.msg-bubble.user-msg-seen,.user-msg-seen{align-self:flex-end;background-color:var(--accent-light-blue);color:var(--bg-primary);border-radius:12px 12px 0 12px}
.message-content{line-height:1.4;word-wrap:break-word}
.timestamp{font-size:0.75rem;color:var(--text-muted);margin-top:4px}</style>
