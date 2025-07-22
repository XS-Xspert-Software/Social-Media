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

    <!-- Chat Tabs -->
    <div class="chat-tabs">
      <button :class="{active: activeTab==='private'}" @click="activeTab='private'">Private</button>
      <button :class="{active: activeTab==='global'}" @click="activeTab='global'">Global</button>
    </div>

    <!-- Chat Main Area -->
    <div class="chat-main">

      <!-- Global Chat -->
      <div v-if="activeTab==='global'" class="global-chat">
        <div class="chat-container">
          <div v-for="(msg, idx) in globalMessages" :key="msg.id || idx" class="message other-msg">
            <div class="msg-bubble">
              <span><b>{{ msg.username }}</b>: {{ msg.message }}</span>
              <div class="timestamp">{{ new Date(msg.timestamp).toLocaleTimeString() }}</div>
            </div>
          </div>
        </div>
        <div class="message-input-wrapper">
          <input type="text" v-model="globalInput" class="message-field" placeholder="Type a message..." @keyup.enter="sendGlobalMessage" />
          <button @click="sendGlobalMessage" class="send-button">Send</button>
        </div>
      </div>

      <!-- Private Chat (existing) -->
      <div v-if="activeTab==='private'">
        <!-- ...existing code for private chat... -->
      </div>
    </div>
  </div>
</template>

<script>
import { ref, onMounted, onUnmounted, computed } from 'vue';
import { nextTick } from 'vue'
import io from 'socket.io-client';

export default {
  name: 'Chat',
  props: {
    userId: String,
    username: String
  },
   
  data() {
    return {
      messages: [],
      messageInput: '',
      imagePreview: null,
      fullscreenImage: null,
      errorMessage: '',
      loggedInUsername: '',
      chatWith: '',
      profileImage: '',
      ablyApiKey: 'H3Idqw.EWX83w:6cA01tWKUZxX9F1D1bWfE0rR_Tj7nQKCdkG2TGlTdhE',
      isTyping: false,
      showEmojiPicker: false,
      replyMessage: null,
      ably: null,
      isOtherUserOnline: false,
      inCall: false,
      incomingCall: false,
      incomingOffer: null,
      rtcChannel: null,
      callEndedNotice: false,
      peerConnection: null,
      localStream: null,
      remoteStream: null,
      currentUserId: '',
      chatWithId: '',
      activeTab: 'private', // 'private' or 'global'
      globalMessages: [],
      globalInput: '',
      socket: null,
    }
  },
  computed: {
    route() {
      return this.$route
    },
    router() {
      return this.$router
    }
  },
  watch: {
    isOtherUserOnline(newStatus) {
      this.updateChatboxColor()
    }
  },
  mounted() {
    
    const currentUserIdFromStorage = localStorage.getItem('userId')
    const loggedInUsernameFromStorage = localStorage.getItem('username')
    const profileImageFromStorage = localStorage.getItem('profileImage') || 'pfp3.jpg'
    const chatWithFromStorage = this.username || localStorage.getItem('chatWith')
    const chatWithIdFromStorage = this.userId || localStorage.getItem('chatWithId')

    // Assign guest username if not logged in
    if (!loggedInUsernameFromStorage) {
      // Generate a random guest username
      const guestName = 'Guest' + Math.floor(1000 + Math.random() * 9000)
      this.loggedInUsername = guestName
      localStorage.setItem('username', guestName)
    } else {
      this.loggedInUsername = loggedInUsernameFromStorage
    }

    if (currentUserIdFromStorage && chatWithIdFromStorage && chatWithFromStorage && this.loggedInUsername) {
      this.currentUserId = currentUserIdFromStorage
      this.chatWithId = chatWithIdFromStorage
      this.chatWith = chatWithFromStorage
      this.profileImage = profileImageFromStorage
      localStorage.removeItem('chatWith')
      localStorage.removeItem('chatWithId')
    } else {
      // For global chat, allow guests to proceed without private chat data
      if (this.activeTab === 'global') {
        // Only set profile image and username for guests
        this.profileImage = profileImageFromStorage
      } else {
        alert('Missing chat data. Please select a user to chat with.')
        this.$router.push('/')
        return
      }
    }

    this.ably = new Ably.Realtime({
      key: this.ablyApiKey,
      clientId: this.currentUserId,
    })

    const presenceChannelName = `chat-presence-${[this.currentUserId, this.chatWithId].sort().join('-')}`
    const presenceChannel = this.ably.channels.get(presenceChannelName)

    presenceChannel.presence.enter()

    presenceChannel.presence.subscribe('enter', (member) => {
      if (member.clientId === this.chatWithId) {
        this.isOtherUserOnline = true
      }
    })

    presenceChannel.presence.subscribe('leave', (member) => {
      if (member.clientId === this.chatWithId) {
        this.isOtherUserOnline = false
      }
    })

    presenceChannel.presence.get((err, members) => {
      if (err) {
        console.error("Presence error:", err)
        return
      }
      const isOnline = members.some(m => m.clientId === this.chatWithId)
      this.isOtherUserOnline = isOnline
    })

    const otherUserChannel = this.ably.channels.get(`chat-${this.chatWithId}-${this.currentUserId}`)
    otherUserChannel.subscribe('newMessage', (message) => {
      const incomingMsg = message.data
      if (incomingMsg.senderId == this.currentUserId) return

      const alreadyExists = this.messages.some(msg => msg.id === incomingMsg.id)
      if (alreadyExists) return

      const receivedMessage = {
        ...incomingMsg,
        side: 'other',
        seen: false,
      }

   if (this.messages.length > 0) {
  const last = this.messages[this.messages.length - 1]
  const lastText = last.message || (last.photo ? '[Photo]' : '')
  const key = `lastMessage-${this.chatWithId}`
  localStorage.setItem(key, lastText)
}
      nextTick(() => {
        this.checkUnseenMessagesInView()
      })
    })

    const senderChannel = this.ably.channels.get(`chat-${this.currentUserId}-${this.chatWithId}`)
    senderChannel.subscribe('messageSeenAcknowledgment', (message) => {
      const messageId = message.data.id
      const msg = this.messages.find(m => m.id === messageId)
      if (msg) {
        msg.seen = true
        msg.alignmentClass = 'user-msg-seen'
      }
    })

    fetch(`https://social-five-beta.vercel.app/api/message?username=${this.currentUserId}&chatWith=${this.chatWithId}`)
      .then((response) => response.json())
      .then((data) => {
        if (Array.isArray(data.messages)) {
          const alignedMessages = data.messages.map((msg) => ({
            ...msg,
            alignmentClass: msg.senderId == this.currentUserId ? 'user-msg' : 'other-msg',
          }))

          this.messages = alignedMessages

                  // ✅ Save last message to localStorage
    if (this.messages.length > 0) {
      const last = this.messages[this.messages.length - 1]
      const lastText = last.message || (last.photo ? '[Photo]' : '')
      const key = `lastMessage-${this.chatWithId}`
      localStorage.setItem(key, lastText)
    }

          nextTick(() => {
            const chatboxContainer = document.getElementById('messages-container')
            if (chatboxContainer) {
              chatboxContainer.scrollTop = chatboxContainer.scrollHeight
            }
          })

          const unseenMessages = alignedMessages.filter(
            msg => msg.senderId != this.currentUserId && !msg.seen
          )

          if (unseenMessages.length > 0) {
            setTimeout(() => {
              this.checkUnseenMessagesInView()
            }, 200)
          }
        }
      })
      .catch(() => {
        this.errorMessage = 'Error loading messages'
      })

    window.addEventListener('beforeunload', () => {
      if (this.ably) this.ably.close()
    })

    this.setupIncomingCallListener()
    this.initGlobalChat();
  },
  beforeUnmount() {
    if (this.socket) this.socket.disconnect();
  },
  methods: {
    goBack() {
      this.$router.push('/chat')
    },

    sendTypingIndicator() {
      const typingPayload = { typing: true, senderId: this.currentUserId }
      this.ably.channels.get(`chat-${this.currentUserId}-${this.chatWithId}`).publish('typing', typingPayload)
      this.ably.channels.get(`chat-${this.chatWithId}-${this.currentUserId}`).publish('typing', typingPayload)
    },

    openFullScreen(imageUrl) {
      this.fullscreenImage = imageUrl
    },

    closeFullScreen() {
      this.fullscreenImage = null
    },

    async setupIncomingCallListener() {
      const incomingChannel = this.ably.channels.get(`rtc-${this.chatWith}-${this.loggedInUsername}`)

      incomingChannel.subscribe('offer', async (message) => {
        this.incomingOffer = message.data
        this.incomingCall = true
        this.rtcChannel = this.ably.channels.get(`rtc-${this.loggedInUsername}-${this.chatWith}`)
      })

      incomingChannel.subscribe('call-ended', () => {
        this.endCall()
      })
    },

    async acceptCall() {
      if (!this.incomingOffer) return

      this.incomingCall = false
      await this.prepareCallAsReceiver(this.incomingOffer)
      this.incomingOffer = null
    },

    rejectCall() {
      if (this.rtcChannel) {
        this.rtcChannel.publish('call-rejected', {
          from: this.loggedInUsername
        })
      }
      this.incomingCall = false
      this.incomingOffer = null
    },

    async prepareCallAsReceiver(offerData) {
      try {
        this.inCall = true
        await nextTick()

        const incomingChannel = this.ably.channels.get(`rtc-${this.chatWith}-${this.loggedInUsername}`)

        this.peerConnection = new RTCPeerConnection({
          iceServers: [
            { urls: 'stun:stun.l.google.com:19302' },
            { urls: 'stun:stun1.l.google.com:19302' },
            { urls: 'stun:stun2.l.google.com:19302' }
          ]
        })

        this.peerConnection.onicecandidate = (event) => {
          if (event.candidate) {
            this.rtcChannel.publish('ice-candidate', {
              candidate: event.candidate.candidate,
              sdpMid: event.candidate.sdpMid,
              sdpMLineIndex: event.candidate.sdpMLineIndex
            })
          }
        }

        this.peerConnection.ontrack = (event) => {
          if (!this.remoteStream) this.remoteStream = new MediaStream()
          event.streams[0].getTracks().forEach(track => {
            this.remoteStream.addTrack(track)
          })
          if (this.$refs.remoteVideo) {
            this.$refs.remoteVideo.srcObject = this.remoteStream
          }
        }

        const mediaConstraints = offerData.mode === 'voice'
          ? { audio: true, video: false }
          : { audio: true, video: true }

        this.localStream = await navigator.mediaDevices.getUserMedia(mediaConstraints)
        this.localStream.getTracks().forEach(track => {
          this.peerConnection.addTrack(track, this.localStream)
        })

        if (this.$refs.localVideo && offerData.mode !== 'voice') {
          this.$refs.localVideo.srcObject = this.localStream
        }

        await this.peerConnection.setRemoteDescription(new RTCSessionDescription(offerData))
        const answer = await this.peerConnection.createAnswer()
        await this.peerConnection.setLocalDescription(answer)

        this.rtcChannel.publish('answer', {
          type: answer.type,
          sdp: answer.sdp
        })

        incomingChannel.subscribe('ice-candidate', async (message) => {
          try {
            await this.peerConnection.addIceCandidate(new RTCIceCandidate(message.data))
          } catch (err) {
            console.error("❄️ ICE error (receiver):", err)
          }
        })

      } catch (error) {
        console.error("❌ Error in prepareCallAsReceiver:", error)
        this.endCall()
      }
    },

    async startCall(mode = 'video') {
      try {
        this.inCall = true
        await nextTick()

        this.rtcChannel = this.ably.channels.get(`rtc-${this.loggedInUsername}-${this.chatWith}`)
        const remoteRtcChannel = this.ably.channels.get(`rtc-${this.chatWith}-${this.loggedInUsername}`)

        this.peerConnection = new RTCPeerConnection({
          iceServers: [
            { urls: 'stun:stun.l.google.com:19302' },
            { urls: 'stun:stun1.l.google.com:19302' },
            { urls: 'stun:stun2.l.google.com:19302' }
          ]
        })

        this.peerConnection.onicecandidate = (event) => {
          if (event.candidate) {
            this.rtcChannel.publish('ice-candidate', {
              candidate: event.candidate.candidate,
              sdpMid: event.candidate.sdpMid,
              sdpMLineIndex: event.candidate.sdpMLineIndex
            })
          }
        }

        const mediaConstraints = mode === 'voice'
          ? { audio: true, video: false }
          : { audio: true, video: true }

        this.localStream = await navigator.mediaDevices.getUserMedia(mediaConstraints)
        this.localStream.getTracks().forEach(track => {
          this.peerConnection.addTrack(track, this.localStream)
        })

        if (this.$refs.localVideo && mode !== 'voice') {
          this.$refs.localVideo.srcObject = this.localStream
        }

        this.remoteStream = new MediaStream()
        if (this.$refs.remoteVideo) {
          this.$refs.remoteVideo.srcObject = this.remoteStream
        }

        this.peerConnection.ontrack = (event) => {
          event.streams[0].getTracks().forEach(track => {
            this.remoteStream.addTrack(track)
          })
        }

        remoteRtcChannel.subscribe('answer', async (message) => {
          await this.peerConnection.setRemoteDescription(new RTCSessionDescription(message.data))
        })

        remoteRtcChannel.subscribe('ice-candidate', async (message) => {
          try {
            await this.peerConnection.addIceCandidate(new RTCIceCandidate(message.data))
          } catch (err) {
            console.error("❄️ ICE error (caller):", err)
          }
        })

        remoteRtcChannel.subscribe('call-rejected', () => {
          alert(`${this.chatWith} rejected the call.`)
          this.endCall()
        })

        const isCaller = this.loggedInUsername.localeCompare(this.chatWith) < 0
        if (isCaller) {
          const offer = await this.peerConnection.createOffer()
          await this.peerConnection.setLocalDescription(offer)

          this.rtcChannel.publish('offer', {
            type: offer.type,
            sdp: offer.sdp,
            mode
          })
        }

      } catch (error) {
        console.error("❌ Error starting call:", error)
        this.endCall()
      }
    },

    endCall() {
      if (this.rtcChannel) {
        this.rtcChannel.publish('call-ended', { from: this.loggedInUsername })
      }

      if (this.peerConnection) {
        this.peerConnection.close()
        this.peerConnection = null
      }

      if (this.localStream) {
        this.localStream.getTracks().forEach(track => track.stop())
        this.localStream = null
      }

      if (this.remoteStream) {
        this.remoteStream.getTracks().forEach(track => track.stop())
        this.remoteStream = null
      }

      this.inCall = false

      if (this.$refs.localVideo) this.$refs.localVideo.srcObject = null
      if (this.$refs.remoteVideo) this.$refs.remoteVideo.srcObject = null

      if (this.rtcChannel) {
        this.rtcChannel.detach()
        this.rtcChannel = null
      }

      this.callEndedNotice = true
      setTimeout(() => {
        this.callEndedNotice = false
      }, 3000)
    },

    async sendMessage() {
      if (this.messageInput.trim() || this.imagePreview) {
        const tempTimestamp = new Date().toISOString()
        const tempMessage = {
          username: this.currentUserId,
          chatWith: this.chatWithId,
          message: this.messageInput.trim(),
          timestamp: tempTimestamp,
          photo: this.imagePreview || null,
          side: 'user',
          replyTo: this.replyMessage || null,
          seen: false,
        }

        this.messages.push(tempMessage)
        this.messageInput = ''
        this.imagePreview = null
        this.replyMessage = null

        const savedMessage = await this.sendToServer(tempMessage)
        if (savedMessage?.id) {
          const index = this.messages.findIndex(m => m.timestamp === tempTimestamp)
          if (index !== -1) {
            this.messages[index] = {
              ...savedMessage,
              side: 'user',
              alignmentClass: savedMessage.seen ? 'user-msg-seen' : 'user-msg',
            }
          }

          const channelA = `chat-${this.currentUserId}-${this.chatWithId}`
          const channelB = `chat-${this.chatWithId}-${this.currentUserId}`

          this.ably.channels.get(channelA).publish('newMessage', savedMessage)
          this.ably.channels.get(channelB).publish('newMessage', savedMessage)
        }
      } else {
        this.errorMessage = 'Please type a message or select an image'
      }
    },

    async sendToServer(messageData) {
      try {
        const res = await fetch('https://social-five-beta.vercel.app/api/message', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(messageData),
        })
        const result = await res.json()
        return result.message
      } catch (err) {
        this.errorMessage = 'Error sending message to server'
        console.error(err)
      }
    },

    markAsSeen(id) {
      const message = this.messages.find(msg => msg.id === id)
      if (!message || message.senderId === this.currentUserId || message.side === 'user' || message.seen) return

      fetch('https://social-five-beta.vercel.app/api/message', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: message.id }),
      })
        .then(() => {
          this.ably.channels.get(`chat-${this.chatWithId}-${this.currentUserId}`)
            .publish('messageSeenAcknowledgment', { id: message.id })
        })
        .catch(err => {
          console.error('❌ Error updating seen status:', err)
        })

      message.seen = true
      message.alignmentClass = 'user-msg-seen'
    },
    previewPhoto(event) {
      const file = event.target.files[0]
      const reader = new FileReader()
      reader.onload = (e) => {
        this.imagePreview = e.target.result
      }
      reader.readAsDataURL(file)
    },

    toggleEmojiPicker() {
      this.showEmojiPicker = !this.showEmojiPicker
    },

    addEmoji(emoji) {
      this.messageInput += emoji
      this.showEmojiPicker = false
    },

    triggerFileInput() {
      document.getElementById('file-input').click()
    },

    checkUnseenMessagesInView() {
      this.messages.forEach(msg => {
        if (msg.senderId === this.currentUserId || msg.seen) return
        const el = document.querySelector(`[data-message-id="${msg.id}"]`)
        if (el && this.isElementInViewport(el)) {
          this.markAsSeen(msg.id)
        }
      })
    },

    isElementInViewport(el) {
      const rect = el.getBoundingClientRect()
      return (
        rect.top >= 0 &&
        rect.left >= 0 &&
        rect.bottom <= (window.innerHeight || document.documentElement.clientHeight) &&
        rect.right <= (window.innerWidth || document.documentElement.clientWidth)
      )
    },

    updateChatboxColor() {
      nextTick(() => {
        const chatboxContainer = document.getElementById('chatbox-container')
        const chatHeader = document.getElementById('header')
        if (!chatboxContainer || !chatHeader) return

        if (this.isOtherUserOnline) {
          chatboxContainer.style.background = 'linear-gradient(90deg, #0d102f, #6a00f4, #f4f9ff)'
          chatHeader.style.background = 'radial-gradient(circle, #0d102f, #3b00d3, #a371f7)'
        } else {
          chatboxContainer.style.background = ''
          chatHeader.style.backgroundColor = ''
        }
      })
    },

    initGlobalChat() {
      // Connect to Socket.IO backend for global chat
      this.socket = io('http://localhost:3000'); // TODO: Replace with your backend URL
      this.socket.on('connect', () => {
        console.log('[GlobalChat] Connected to Socket.IO server');
      });
      this.socket.on('connect_error', (err) => {
        console.error('[GlobalChat] Socket.IO connection error:', err);
      });
      this.socket.on('global-messages', msgs => {
        console.log('[GlobalChat] Received global-messages:', msgs);
        // Only keep messages from last 24 hours
        const now = Date.now();
        this.globalMessages = msgs.filter(m => now - new Date(m.timestamp).getTime() < 24*60*60*1000);
      });
      this.socket.on('global-message', msg => {
        console.log('[GlobalChat] Received global-message:', msg);
        const now = Date.now();
        if (now - new Date(msg.timestamp).getTime() < 24*60*60*1000) {
          this.globalMessages.push(msg);
        }
      });
    },

    sendGlobalMessage() {
      if (!this.globalInput.trim()) return;
      let usernameToSend = this.loggedInUsername;
      if (!usernameToSend) {
        usernameToSend = 'Guest' + Math.floor(1000 + Math.random() * 9000);
        this.loggedInUsername = usernameToSend;
        localStorage.setItem('username', usernameToSend);
      }
      const msg = {
        username: usernameToSend,
        message: this.globalInput.trim(),
        timestamp: new Date().toISOString(),
      };
      console.log('[GlobalChat] Sending global-message:', msg);
      this.socket.emit('global-message', msg);
      this.globalInput = '';
    },
  }
}
</script>
<style src="./Chatbox.css"></style>
