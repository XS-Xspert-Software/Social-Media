import { ref, nextTick } from 'vue'

export function useWebRTC() {
  // RTC State
  const inCall = ref(false)
  const incomingCall = ref(false)
  const incomingOffer = ref(null)
  const callEndedNotice = ref(false)
  const peerConnection = ref(null)
  const localStream = ref(null)
  const remoteStream = ref(null)
  const localVideo = ref(null)
  const remoteVideo = ref(null)
  const callMode = ref('video') // 'video' or 'voice'

  // WebSocket State
  const ws = ref(null)
  const connectionStatus = ref('disconnected')
  const reconnectAttempts = ref(0)
  const maxReconnectAttempts = 5
  const isOtherUserOnline = ref(false)
  const currentUserId = ref('')
  const chatWithId = ref('')

  // Intervals and timeouts
  let presenceSyncInterval = null
  let reconnectTimeout = null

  // Helper function to create unified channel
  const createUnifiedChannel = (type, userId1, userId2) => {
    const sortedIds = [userId1, userId2].sort()
    return `${type}-${sortedIds.join('-')}`
  }

  // WebSocket message sender
  const sendWebSocketMessage = (message) => {
    if (ws.value?.readyState === WebSocket.OPEN) {
      ws.value.send(JSON.stringify(message))
      return true
    }
    return false
  }

  // WebSocket connection management
  const connectWebSocket = (wsUrl) => {
    if (ws.value?.readyState === WebSocket.OPEN) return Promise.resolve()

    return new Promise((resolve, reject) => {
      isOtherUserOnline.value = false
      connectionStatus.value = 'connecting'
      ws.value = new WebSocket(wsUrl)

      ws.value.onopen = () => {
        connectionStatus.value = 'connected'
        reconnectAttempts.value = 0
        resolve()
      }

      ws.value.onmessage = (event) => {
        try {
          handleWebSocketMessage(JSON.parse(event.data))
        } catch (error) {
          console.error('WebSocket parse error:', error)
        }
      }

      ws.value.onclose = () => {
        connectionStatus.value = 'disconnected'
        isOtherUserOnline.value = false
        
        if (reconnectAttempts.value < maxReconnectAttempts) {
          reconnectAttempts.value++
          reconnectTimeout = setTimeout(() => {
            connectWebSocket(wsUrl).catch(console.error)
          }, 2000 * reconnectAttempts.value)
        }
      }

      ws.value.onerror = (error) => {
        connectionStatus.value = 'error'
        isOtherUserOnline.value = false
        reject(error)
      }
    })
  }

  // Subscribe to WebSocket channels
  const subscribeToChannels = () => {
    if (!currentUserId.value || !chatWithId.value || ws.value?.readyState !== WebSocket.OPEN) return

    const channels = ['chat', 'rtc', 'presence'].map(type => 
      createUnifiedChannel(type, currentUserId.value, chatWithId.value)
    )

    // Subscribe to all channels
    channels.forEach(channel => {
      sendWebSocketMessage({
        type: 'subscribe',
        clientId: currentUserId.value,
        channel
      })
    })

    // Handle presence
    const presenceChannel = channels[2]
    setTimeout(() => {
      sendWebSocketMessage({
        type: 'presence-get-members',
        clientId: currentUserId.value,
        payload: { presenceChannel }
      })

      sendWebSocketMessage({
        type: 'presence-enter',
        clientId: currentUserId.value,
        payload: { presenceChannel }
      })

      setTimeout(() => {
        sendWebSocketMessage({
          type: 'presence-get-members',
          clientId: currentUserId.value,
          payload: { presenceChannel }
        })
      }, 300)
    }, 200)

    // Setup presence heartbeat
    setupPresenceHeartbeat()
  }

  // Setup presence heartbeat
  const setupPresenceHeartbeat = () => {
    if (presenceSyncInterval) clearInterval(presenceSyncInterval)
    
    presenceSyncInterval = setInterval(() => {
      if (ws.value?.readyState === WebSocket.OPEN && currentUserId.value && chatWithId.value) {
        const presenceChannel = createUnifiedChannel('presence', currentUserId.value, chatWithId.value)
        sendWebSocketMessage({
          type: 'presence-get-members',
          clientId: currentUserId.value,
          payload: { presenceChannel }
        })
      }
    }, 30000)
  }

  // Handle WebSocket messages
  const handleWebSocketMessage = (message) => {
    const { type, data, clientId, members, payload } = message
    
    switch (type) {
      case 'presence-enter':
        if (String(clientId) === String(chatWithId.value)) {
          isOtherUserOnline.value = true
        }
        break
        
      case 'presence-leave':
        if (String(clientId) === String(chatWithId.value)) {
          isOtherUserOnline.value = false
        }
        break
        
      case 'presence-members':
        if (Array.isArray(members)) {
          isOtherUserOnline.value = members.some(member => 
            String(member) === String(chatWithId.value)
          )
        }
        break

      // WebRTC signaling
      case 'offer':
        handleIncomingOffer(data)
        break
        
      case 'answer':
        handleAnswer(data)
        break
        
      case 'ice-candidate':
        handleIceCandidate(data)
        break
        
      case 'call-ended':
        endCall()
        break
        
      case 'call-rejected':
        handleCallRejected()
        break

      default:
        // Allow external message handlers
        if (typeof window !== 'undefined' && window.webrtcMessageHandler) {
          window.webrtcMessageHandler(message)
        }
    }
  }

  // Initialize WebRTC with user IDs
  const init = (currentUserIdValue, chatWithIdValue, wsUrl = null) => {
    currentUserId.value = currentUserIdValue
    chatWithId.value = chatWithIdValue
    
    if (wsUrl) {
      return connectWebSocket(wsUrl)
    }
    return Promise.resolve()
  }

  // Send typing indicator
  const sendTypingIndicator = (typing = true) => {
    if (connectionStatus.value !== 'connected') return false
    
    const chatChannel = createUnifiedChannel('chat', currentUserId.value, chatWithId.value)
    return sendWebSocketMessage({
      type: 'typing',
      clientId: currentUserId.value,
      channel: chatChannel,
      payload: {
        typing,
        senderId: currentUserId.value,
        receiverId: chatWithId.value
      }
    })
  }

  // Send chat message via WebSocket
  const sendChatMessage = (messageData) => {
    if (connectionStatus.value !== 'connected') return false
    
    const chatChannel = createUnifiedChannel('chat', currentUserId.value, chatWithId.value)
    return sendWebSocketMessage({
      type: 'message',
      clientId: currentUserId.value,
      channel: chatChannel,
      payload: { ...messageData, senderId: currentUserId.value, receiverId: chatWithId.value }
    })
  }

  // Send message seen acknowledgment
  const sendMessageSeen = (messageId) => {
    if (connectionStatus.value !== 'connected') return false
    
    const chatChannel = createUnifiedChannel('chat', currentUserId.value, chatWithId.value)
    return sendWebSocketMessage({
      type: 'message-seen',
      clientId: currentUserId.value,
      channel: chatChannel,
      payload: {
        messageId,
        id: messageId,
        senderId: currentUserId.value,
        receiverId: chatWithId.value
      }
    })
  }

  // Send any custom message via WebSocket
  const sendCustomMessage = (type, payload, channel = null) => {
    if (connectionStatus.value !== 'connected') return false
    
    const targetChannel = channel || createUnifiedChannel('chat', currentUserId.value, chatWithId.value)
    return sendWebSocketMessage({
      type,
      clientId: currentUserId.value,
      channel: targetChannel,
      payload: { ...payload, senderId: currentUserId.value, receiverId: chatWithId.value }
    })
  }

  // Leave presence (for cleanup)
  const leavePresence = () => {
    if (ws.value && currentUserId.value && chatWithId.value) {
      const presenceChannel = createUnifiedChannel('presence', currentUserId.value, chatWithId.value)
      sendWebSocketMessage({
        type: 'presence-leave',
        clientId: currentUserId.value,
        payload: { presenceChannel }
      })
    }
  }

  // Create peer connection with ICE servers
  const createPeerConnection = () => {
    const pc = new RTCPeerConnection({
      iceServers: [
        { urls: 'stun:stun.l.google.com:19302' },
        { urls: 'stun:stun1.l.google.com:19302' },
        { urls: 'stun:stun2.l.google.com:19302' }
      ]
    })

    pc.onicecandidate = (event) => {
      if (event.candidate) {
        const rtcChannel = createUnifiedChannel('rtc', currentUserId.value, chatWithId.value)
        sendWebSocketMessage({
          type: 'ice-candidate',
          clientId: currentUserId.value,
          channel: rtcChannel,
          payload: {
            from: currentUserId.value,
            to: chatWithId.value,
            candidate: {
              candidate: event.candidate.candidate,
              sdpMid: event.candidate.sdpMid,
              sdpMLineIndex: event.candidate.sdpMLineIndex
            }
          }
        })
      }
    }

    pc.ontrack = (event) => {
      if (!remoteStream.value) remoteStream.value = new MediaStream()
      event.streams[0].getTracks().forEach(track => remoteStream.value.addTrack(track))
      if (remoteVideo.value) remoteVideo.value.srcObject = remoteStream.value
    }

    return pc
  }

  // Setup call (both initiator and receiver)
  const setupCall = async (offerData = null, mode = 'video') => {
    try {
      callMode.value = mode
      inCall.value = true
      await nextTick()

      peerConnection.value = createPeerConnection()

      const mediaConstraints = mode === 'voice' ? { audio: true, video: false } : { audio: true, video: true }
      localStream.value = await navigator.mediaDevices.getUserMedia(mediaConstraints)
      
      localStream.value.getTracks().forEach(track => {
        peerConnection.value.addTrack(track, localStream.value)
      })

      if (localVideo.value && mode !== 'voice') {
        localVideo.value.srcObject = localStream.value
      }

      if (offerData) {
        // Receiver: Handle incoming offer
        await peerConnection.value.setRemoteDescription(new RTCSessionDescription(offerData))
        const answer = await peerConnection.value.createAnswer()
        await peerConnection.value.setLocalDescription(answer)

        const rtcChannel = createUnifiedChannel('rtc', currentUserId.value, chatWithId.value)
        sendWebSocketMessage({
          type: 'answer',
          clientId: currentUserId.value,
          channel: rtcChannel,
          payload: {
            from: currentUserId.value,
            to: chatWithId.value,
            answer: { type: answer.type, sdp: answer.sdp }
          }
        })
      } else {
        // Initiator: Create offer
        const offer = await peerConnection.value.createOffer()
        await peerConnection.value.setLocalDescription(offer)

        const rtcChannel = createUnifiedChannel('rtc', currentUserId.value, chatWithId.value)
        sendWebSocketMessage({
          type: 'offer',
          clientId: currentUserId.value,
          channel: rtcChannel,
          payload: {
            from: currentUserId.value,
            to: chatWithId.value,
            offer: { type: offer.type, sdp: offer.sdp, mode }
          }
        })
      }
    } catch (error) {
      console.error('Error in call setup:', error)
      endCall()
    }
  }

  // Start a new call (as initiator)
  const startCall = async (mode = 'video') => {
    await setupCall(null, mode)
  }

  // Accept incoming call (as receiver)
  const acceptCall = async () => {
    if (!incomingOffer.value) return
    incomingCall.value = false
    await setupCall(incomingOffer.value, incomingOffer.value.mode || 'video')
    incomingOffer.value = null
  }

  // Reject incoming call
  const rejectCall = () => {
    const rtcChannel = createUnifiedChannel('rtc', currentUserId.value, chatWithId.value)
    sendWebSocketMessage({
      type: 'call-rejected',
      clientId: currentUserId.value,
      channel: rtcChannel,
      payload: { from: currentUserId.value, to: chatWithId.value }
    })
    
    incomingCall.value = false
    incomingOffer.value = null
  }

  // Handle call rejection
  const handleCallRejected = () => {
    // You can customize this behavior
    if (typeof window !== 'undefined' && window.onCallRejected) {
      window.onCallRejected()
    } else {
      alert('Call was rejected')
    }
    endCall()
  }

  // End current call
  const endCall = () => {
    if (ws.value?.readyState === WebSocket.OPEN) {
      const rtcChannel = createUnifiedChannel('rtc', currentUserId.value, chatWithId.value)
      sendWebSocketMessage({
        type: 'call-ended',
        clientId: currentUserId.value,
        channel: rtcChannel,
        payload: { from: currentUserId.value, to: chatWithId.value }
      })
    }

    // Clean up WebRTC resources
    peerConnection.value?.close()
    peerConnection.value = null

    localStream.value?.getTracks().forEach(track => track.stop())
    localStream.value = null

    remoteStream.value?.getTracks().forEach(track => track.stop())
    remoteStream.value = null

    inCall.value = false

    if (localVideo.value) localVideo.value.srcObject = null
    if (remoteVideo.value) remoteVideo.value.srcObject = null

    callEndedNotice.value = true
    setTimeout(() => callEndedNotice.value = false, 3000)
  }

  // Handle incoming offer
  const handleIncomingOffer = (offerData) => {
    incomingOffer.value = offerData
    incomingCall.value = true
  }

  // Handle answer from remote peer
  const handleAnswer = async (answerData) => {
    if (peerConnection.value) {
      try {
        await peerConnection.value.setRemoteDescription(new RTCSessionDescription(answerData))
      } catch (error) {
        console.error('Error setting remote description:', error)
      }
    }
  }

  // Handle ICE candidate from remote peer
  const handleIceCandidate = async (candidateData) => {
    if (peerConnection.value && peerConnection.value.remoteDescription) {
      try {
        await peerConnection.value.addIceCandidate(new RTCIceCandidate(candidateData))
      } catch (err) {
        console.error('Error adding ICE candidate:', err)
      }
    }
  }

  // Get connection status
  const getConnectionStatus = () => connectionStatus.value

  // Force reconnect WebSocket
  const reconnectWebSocket = (wsUrl) => {
    if (ws.value) {
      ws.value.close()
    }
    return connectWebSocket(wsUrl)
  }

  // Cleanup function
  const cleanup = () => {
    // Clear intervals and timeouts
    if (presenceSyncInterval) clearInterval(presenceSyncInterval)
    if (reconnectTimeout) clearTimeout(reconnectTimeout)

    // Leave presence and close WebSocket
    leavePresence()
    
    setTimeout(() => {
      ws.value?.close()
      ws.value = null
    }, 100)

    // Clean up WebRTC
    peerConnection.value?.close()
    localStream.value?.getTracks().forEach(track => track.stop())
    remoteStream.value?.getTracks().forEach(track => track.stop())
    
    peerConnection.value = null
    localStream.value = null
    remoteStream.value = null
    inCall.value = false
    incomingCall.value = false
    incomingOffer.value = null
    callEndedNotice.value = false
    connectionStatus.value = 'disconnected'
    isOtherUserOnline.value = false
  }

  return {
    // WebSocket State
    connectionStatus,
    isOtherUserOnline,
    
    // RTC State
    inCall,
    incomingCall,
    incomingOffer,
    callEndedNotice,
    callMode,
    peerConnection,
    localStream,
    remoteStream,
    localVideo,
    remoteVideo,
    
    // WebSocket Methods
    init,
    connectWebSocket,
    subscribeToChannels,
    sendWebSocketMessage,
    sendTypingIndicator,
    sendChatMessage,
    sendMessageSeen,
    sendCustomMessage,
    leavePresence,
    getConnectionStatus,
    reconnectWebSocket,
    
    // RTC Methods
    startCall,
    acceptCall,
    rejectCall,
    endCall,
    handleIncomingOffer,
    handleAnswer,
    handleIceCandidate,
    
    // Cleanup
    cleanup
  }
}
