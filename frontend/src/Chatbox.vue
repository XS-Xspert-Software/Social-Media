<template>
  <div class="chat-section card">
    <div id="app">
        <div id="chatbox-container" class="chat-box">
          <header id="header">
    <div id="header-left" style="display: flex; align-items: center; gap: 12px;">
  <i class="fas fa-arrow-left" @click="goBack" style="cursor: pointer; font-size: 20px;" aria-label="Go back"></i>
  <img id="profile-image" class="profile-img" :src="profileImage" alt="Profile Image">
  <span id="username">{{ chatWith }}</span>
</div>

            
<button @click="startCall('voice')" v-if="!inCall" class="voice-button" style="margin-left:55%;"><i class="fa fa-phone"></i></button>
<button @click="startCall('video')" v-if="!inCall" class="call-button video" style="margin-right: 20px;"><i class="fas fa-video"></i></button>

<button @click="endCall" v-if="inCall">🔴 Hang Up</button>

<div v-if="inCall" class="video-container">
  <video ref="localVideo" autoplay muted playsinline style="width: 300px; background: #000;"></video>
  <video ref="remoteVideo" autoplay playsinline style="width: 300px; background: #000;"></video>
</div>
      </header>

      <div id="chatbox">
<div id="messages-container">
        <!-- Incoming Call Modal -->
<div v-if="incomingCall" class="incoming-call-popup">
  <p>📞 Incoming call from {{ chatWith }}</p>
  <button @click="acceptCall">✅ Accept</button>
  <button @click="rejectCall">❌ Reject</button>
</div>
  <div v-if="callEndedNotice" class="call-ended-toast">
  Call Ended
</div>

<div
  v-for="(msg, index) in messages"
  :key="index"
  :ref="'message-' + (msg.id || msg.id)"
  :class="[
    'message',
    msg.side === 'user'
      ? (msg.seen ? 'user-msg-seen' : 'user-msg')
      : 'other-msg'
  ]">
<div class="msg-bubble">
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

<!-- Fullscreen Preview -->
<div v-if="fullscreenImage" class="fullscreen-overlay" @click="closeFullScreen">
  <img :src="fullscreenImage" class="fullscreen-image" />
</div>

            <div class="timestamp">
              {{ new Date(msg.timestamp).toLocaleTimeString() }}
            </div>
          </div>
          <div ref="messagesEnd"></div>
        </div>

        <!-- Typing Indicator -->
        <div v-if="isTyping" id="typing-indicator">{{ chatWith }} is typing...</div>

        <!-- Message Input Area -->
        <div id="message-input">
          <input
            type="text"
            id="user-message"
            placeholder="Type a message..."
            v-model="messageInput"
            @input="sendTypingIndicator"
          />

              <!-- Emoji Picker Button -->
              <button @click="toggleEmojiPicker" class="emoji-button" style="border:none; background-color:#09d5fd; font-size:30px; margin-bottom:12px;">😃</button>
    
              <!-- Emoji Picker (displayed when button is clicked) -->
              <div v-if="showEmojiPicker" class="emoji-picker">
                <div @click="addEmoji('😊')">😊</div>
                <div @click="addEmoji('😂')">😂</div>
                <div @click="addEmoji('❤️')">❤️</div>
                <div @click="addEmoji('👍')">👍</div>
              </div>
          <!-- File Input for Images -->
          <input type="file" id="file-input" accept="image/*" @change="previewPhoto($event)" style="display: none;" />
          <div class="icon-container" @click="triggerFileInput" style="font-size:30px;">
            <i class="fas fa-camera"></i> <!-- FontAwesome Camera Icon -->
          </div>

          <!-- Image Preview -->
          <img v-if="imagePreview" :src="imagePreview" alt="Preview" class="image-preview" />

          <!-- Send Button -->
          <button @click="sendMessage">Send</button>

          <!-- Error Message -->
          <p v-if="errorMessage" id="error-message" style="color: red">{{ errorMessage }}</p>
        </div>
      </div>
    </div>
  </div>
  </div>
</template>
<script>
import { nextTick } from 'vue'

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
      chatWithId: ''
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

    if (currentUserIdFromStorage && chatWithIdFromStorage && chatWithFromStorage && loggedInUsernameFromStorage) {
      this.currentUserId = currentUserIdFromStorage
      this.chatWithId = chatWithIdFromStorage
      this.loggedInUsername = loggedInUsernameFromStorage
      this.chatWith = chatWithFromStorage
      this.profileImage = profileImageFromStorage

      localStorage.removeItem('chatWith')
      localStorage.removeItem('chatWithId')
    } else {
      alert('Missing chat data. Please select a user to chat with.')
      this.$router.push('/')
      return
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

      this.messages.push(receivedMessage)
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
    }
  }
}
</script>

    <style scoped>
    /* Global Styles */
* {
    box-sizing: border-box;
    margin: 0;
    padding: 0;
}

body {
    background-color: #1f1f1f;
    color: #e0e0e0;
    height: 100vh;
    justify-content: flex-start;
    padding-top: 60px;
    font-family: Arial, sans-serif;
}

/* Header */
#header {
    width: 700px;
    background-color: #00a7f7;
    border-bottom: 1px solid #444;
    box-shadow: 0 4px 6px #0003;
    color: #fff;
    font-family: Arial, sans-serif;
    justify-content: space-between;
    left: 0;
    padding: 10px 20px;
    position: fixed;
    right: 0;
    top: .1px;
    z-index: 1000;
    display: flex;
    align-items: center;
}

#username {
    color:green;
  position:fixed;
  top: 3%;
    font-size: 18px;
    font-weight: 700;
}

#header-right {
    display: flex;
}

#dropdownMenu {
    background-color: #4caf50;
    border: 1px solid #ccc;
    box-shadow: 0 4px 6px #0000001a;
    display: none;
    padding: 10px;
    position: absolute;
    right: 20px;
    top: 50px;
    width: 150px;
    z-index: 1000;
}

#dropdownMenu button {
   
    background-color: red;
    border: none;
    cursor: pointer;
    font-size: 14px;
    padding: 10px;
    text-align: left;
    width: 100%;
}
.call-button, .voice-button {
 font-size: 18px; background-color: #00a7f7; border: none;
}
/* Responsive: For tablets and small screens */
@media (max-width: 768px) {
 .call-button, .voice-button {
      margin-right:30px ;
  }
}
/* Even smaller phones */
@media (max-width: 480px) {
  .call-button, .voice-button{
      margin-right:20px ;
  }
}

/* Profile Image - Larger */
.profile-img {
    margin-top: 5px;
    border-radius: 50%;
    height: 40px;
    width: 40px;
    margin-right: 20px;
    object-fit: cover;
}

#chatbox-container {
    background: linear-gradient(45deg, #ff6a00, #1fd1f9, #b621fe);
    border-radius: 10px;
    box-shadow: 0 4px 15px #0000001a;
    height: calc(100vh - 60px);
    width: 700px;
    overflow: hidden;
    position: relative;
}

#chatbox {
    height: 90%;
    padding: 10px;
}

#chatbox,
#messages-container {
 
    display: flex;
    flex-direction: column;
    position: relative;
}

#messages-container {
    flex-grow: 1;
    height: 100%;
    overflow-y: auto;
    padding: 13px 10px 10px;
}

.message {
    margin-bottom: 10px;
}

#messages-container::-webkit-scrollbar {
    width: 6px;
}

#messages-container::-webkit-scrollbar-thumb {
    background-color: #888;
    border-radius: 3px;
}

#messages-container::-webkit-scrollbar-thumb:hover {
    background-color: #555;
}

.message {
    align-items: center;
    animation: fadeIn 0.5s ease-out;
    display: flex;
    flex-direction: row;
    margin: 10px 0;
}

.user-msg, .user-msg-seen {
    justify-content: flex-end; /* Ensure the user message is aligned to the right */
}

.other-msg {
    justify-content: flex-start; /* Ensure other messages are aligned to the left */
}

.msg-bubble {
    word-wrap: break-word;
    background-color: #f1f1f1;
    border-radius: 20px;
    display: inline-block;
    max-width: 70%;
    padding: 10px;
}

.user-msg .msg-bubble, .user-msg-seen .msg-bubble {
    background-color: #4caf50; /* Default color for user message */
    border-top-left-radius: 0;
    color: #fff;
}

.user-msg-seen .msg-bubble {
    background-color: purple; /* Change background to purple for seen messages */
    color: #fff; /* Keep text white */
}
.other-msg .msg-bubble {
    background-color: #e0e0e0;
    border-top-right-radius: 0;
    color: #333;
    margin-right: auto;
}

.msg-bubble img {
    border-radius: 3px;
    display: block;
    height: auto;
    max-width: 100%;
    object-fit: contain;
}

.timestamp {
    color: #000;
    font-size: 0.75em;
    margin-top: 5px;
    text-align: right;
}

@keyframes fadeIn {
    0% {
        opacity: 0;
        transform: translateY(10px);
    }
    to {
        opacity: 1;
        transform: translateY(0);
    }
}

#user-message:focus {
    border-color: #4caf50;
}

#image-preview {
    border-radius: 10px;
    display: none;
    margin-left: 10px;
    max-height: 100px;
    max-width: 100px;
}
/* Message Input Container */
#message-input {
  width: 100%;
  max-width: 700px;
  background-color: #09d5fd;
  border-top: 1px solid #444;
  bottom: 0;
 left: 23%;
  display: flex;
   align-items: center;
  padding: 10px;
  position: fixed;
  transform: translateX(-50%);
  z-index: 100;
}

/* Text Input */
#user-message {
  flex-grow: 1;
  padding: 8px;
  font-size: 16px;
  border: 1px solid #ccc;
  border-radius: 20px;
  margin-right: 1px;
  width: 100%;
  background-color: #fff;
  position: relative; /* Ensure input field is positioned for alignment */
}

/* Emoji Button (inside the input area) */
.emoji-button {

  cursor: pointer;
  padding: 0;  /* Remove padding to avoid extra space */
  
  display: inline-block;
 /* Center align vertically inside input */
  width: 30px;  /* Set width to control size */
  height: 40px;  /* Set height to match emoji */
}

/* Emoji Picker */
.emoji-picker {
  position: absolute;
  bottom: 40px;
  right: 0;
  background: #fff;
  display: flex;
  flex-direction: column;
  box-shadow: 0px 4px 8px rgba(0, 0, 0, 0.1);
}

.emoji-picker div {
  cursor: pointer;
  padding: 5px;
}

.emoji-picker div:hover {
  background-color: #f0f0f0;
}


/* Send Button (aligned to the right of the input area) */
#message-input button {
  background-color: #4CAF50;
  color: white;
  padding: 6px 15px;  /* Reduced padding to make the button smaller */
  font-size: 13px;  /* Smaller font size */
  border: none;
  border-radius: 20px;  /* Reduced border-radius for a less rounded but still circular look */
  cursor: pointer;
  width: auto;  /* Auto width to shrink the button size based on the content */
  margin-left: 10px;  /* Space between button and other elements */
}


#message-input button:hover {
  background-color: #45a049;
  border-color: #45a049;
}

/* Responsive Design */
@media (max-width: 768px) {
    #message-input{
        left:0;
    }
    /* Header */
    #header {
        padding: 10px;
        font-size: 14px;
        width: 100%;
    }

    /* Chatbox */
    #chatbox-container {
        width: 100%;
        height: calc(100vh - 60px); /* Ensure full screen height on mobile */
     
    }

    #chatbox, #messages-container {
        padding: 10px;
    }

    /* Profile Image */
    .profile-img {
        height: 35px;
        width: 35px;
    }

    /* Message Input */
    #user-message {
        width: 60%; /* Adjust input width for small screens */
    }
  
   
}

@media (max-width: 480px) {
    #message-input{
        left: 50%;
    }
    /* Header */
    #header {
        padding: 10px;
        font-size: 12px;
        width: 100%;
    }

    /* Chatbox */
    #chatbox-container {
        width: 100%;
        height: calc(100vh - 60px);
    }

    #user-message {
        width: 55%;
    }
  

    /* Profile Image */
    .profile-img {
        height: 30px;
        width: 30px;
    }

    .icon-container {
        width: 35px;
        height: 35px;
    }
}
#typing-indicator {
  font-style: italic;
  color: red;
  margin: 8px 0 12px 10px;
  animation: fadeIn 0.3s ease-in-out;
}
@keyframes fadeIn {
  from { opacity: 0; }
  to   { opacity: 1; }
}
.image-preview {
  max-width: 150px;
  max-height: 150px;
  object-fit: cover;
  cursor: pointer;
border: none;
  transition: transform 0.2s;
}
.image-preview:hover {
  transform: scale(1.05);
}

.fullscreen-overlay {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background-color: rgba(0, 0, 0, 0.9);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 9999;
}

.fullscreen-image {
  max-width: 60%;
  max-height: 200vh;
  object-fit: contain;
  transform: scale(1.8); /* Try 1.5 or 2 for more zoom */
  transition: transform 0.3s ease;
}

.chat-section.card {
  max-width: 700px;
  margin: 60px auto 0 auto;
  padding: 32px 28px 24px 28px;
  border-radius: 22px;
  box-shadow: 0 8px 32px 0 rgba(31, 38, 135, 0.28);
  border: 2px solid #fff8;
  color: #fff;
  backdrop-filter: blur(32px) saturate(1.8);
  -webkit-backdrop-filter: blur(32px) saturate(1.8);
}
</style>
