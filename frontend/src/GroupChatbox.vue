<template>
  <div class="group-chat-container">
    <div v-if="loading" class="loading"><div class="spinner"></div></div>
    <div v-if="error" class="error-container">
      <div class="error-message">
        <i class="fas fa-exclamation-triangle"></i>
        <p>{{ error }}</p>
        <button @click="initialize" class="btn btn-primary">Retry</button>
      </div>
    </div>

    <div v-if="!loading && !error" class="main-layout">
      <!-- Admin Panel Modal -->
      <div v-if="showAdminPanel && isAdmin" class="modal-overlay" @click="showAdminPanel = false">
        <div class="modal-content" @click.stop>
          <div class="modal-header">
            <h3>Admin Panel</h3>
            <button @click="showAdminPanel = false" class="close-btn">×</button>
          </div>
          
          <div class="section">
            <h4>Edit Group</h4>
            <input v-model="editGroupName" placeholder="Group Name" class="form-input">
            <button @click="updateGroupInfo" class="btn btn-primary">Update Group</button>
          </div>

          <div v-if="joinRequests.length > 0" class="section">
            <h4>Join Requests ({{ joinRequests.length }})</h4>
            <div v-for="request in joinRequests" :key="request.id" class="request-item">
              <img :src="request.user?.avatar || '/default-avatar.png'" class="avatar">
              <span>{{ request.user?.username || 'Unknown User' }}</span>
              <div class="request-actions">
                <button @click="handleJoinRequest(request.id, 'approve')" class="btn btn-success">
                  <i class="fas fa-check"></i>
                </button>
                <button @click="handleJoinRequest(request.id, 'decline')" class="btn btn-danger">
                  <i class="fas fa-times"></i>
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div class="app-container" :class="{ 'with-rightbar': showMembersList }">
        <!-- Chat Section -->
        <div class="chat-section">
          <!-- Header -->
          <div class="chat-header">
            <div class="header-left">
              <i class="fas fa-arrow-left back-btn" @click="goBack"></i>
              <img :src="groupInfo?.avatar || '/default-group-avatar.png'" class="profile-img">
              <div class="group-info">
                <div class="group-name">{{ groupInfo?.name || 'Loading...' }}</div>
                <div class="member-count">{{ members.length }} members</div>
              </div>
            </div>
            
            <div class="header-actions">
              <button v-if="isAdmin && joinRequests.length > 0" @click="showAdminPanel = true" class="icon-button">
                <i class="fas fa-cog"></i>
                <span class="badge">{{ joinRequests.length }}</span>
              </button>
              <button @click="toggleMembersList" class="icon-button">
                <i class="fas fa-users"></i>
              </button>
            </div>
          </div>

          <!-- Chat Container -->
          <div class="chat-container">
            <!-- Messages -->
            <div ref="messagesContainer" class="messages-container">
              <div v-for="message in messages" :key="message.id"
                   :class="['message', message.senderId === currentUserId ? 'user-msg' : 'other-msg']"
                   @click="showMessageOptions(message, $event)">
               
                <div v-if="message.type === 'system'" class="system-message">
                  <i class="fas fa-info-circle"></i>
                  {{ message.content }}
                </div>
               
                <div v-else>
                  <!-- Message Header -->
                  <div class="message-header">
                    <img :src="getSenderProfilePicture(message)" :alt="getSenderDisplayName(message)" class="sender-avatar">
                    
                    <div class="sender-name">
                      <span :style="{ color: getUserColor(message.senderId || message.senderid, getSenderDisplayName(message)) }">
                        {{ getSenderDisplayName(message) }}
                      </span>
                      <i v-if="getSenderRole(message) === 'admin'" class="fas fa-crown admin-badge"></i>
                    </div>
                    
                    <div class="timestamp">
                      {{ formatTime(message.timestamp) }}
                      <span v-if="message.edited" class="edited-label">(edited)</span>
                    </div>
                  </div>
        
                  <!-- Message bubble -->
                  <div class="msg-bubble">
                    <!-- Reply preview -->
                    <div v-if="message.replyToMessage" class="reply-preview">
                      <div class="reply-line"></div>
                      <div class="reply-content">
                        <img :src="getReplyAvatar(message.replyToMessage)" class="reply-avatar">
                        <span class="reply-sender" :style="{ color: getUserColor(message.replyToMessage.senderId, message.replyToMessage.senderName) }">
                          {{ message.replyToMessage.senderName || 'Unknown User' }}
                        </span>
                        <span class="reply-text">{{ message.replyToMessage.content }}</span>
                        <span class="reply-timestamp">{{ formatTime(message.replyToMessage.timestamp) }}</span>
                      </div>
                    </div>
          
                    <div class="message-content">
                      {{ message.content }}
                      <img v-if="message.image" :src="message.image" class="msg-photo" @click.stop="openFullscreen(message.image)">
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <!-- Edit Bar -->
            <div v-if="editingMessage" class="edit-bar">
              <div class="edit-info">
                <i class="fas fa-edit"></i>
                <span>Editing message</span>
                <div class="edit-preview-text">{{ editingMessage.content }}</div>
              </div>
              <button @click="cancelEdit" class="cancel-edit">
                <i class="fas fa-times"></i>
              </button>
            </div>

            <!-- Reply Bar -->
            <div v-if="replyingTo" class="reply-bar">
              <div class="reply-info">
                <i class="fas fa-reply"></i>
                <div class="reply-to-content">
                  <img :src="getSenderProfilePicture(replyingTo)" class="reply-to-avatar">
                  <div class="reply-to-text">
                    <span class="reply-to-sender" :style="{ color: getUserColor(replyingTo.senderId, getSenderDisplayName(replyingTo)) }">
                      Replying to {{ getSenderDisplayName(replyingTo) }}
                    </span>
                    <div class="reply-preview-text">{{ replyingTo.content }}</div>
                  </div>
                </div>
              </div>
              <button @click="cancelReply" class="cancel-reply">
                <i class="fas fa-times"></i>
              </button>
            </div>

            <!-- Message Input -->
            <div class="message-input-wrapper">
              <div class="message-input-row">
                <button @click="toggleEmojiPicker" class="emoji-button">😊</button>
                <input v-model="messageText" @keypress.enter="sendMessage" 
                       placeholder="Type a message..." class="message-field" ref="messageInput">
                <input type="file" @change="selectImage" accept="image/*" style="display: none;" ref="fileInput">
                <button @click="$refs.fileInput?.click()" class="icon-button">
                  <i class="fas fa-camera"></i>
                </button>
                <button @click="sendMessage" :disabled="!canSend" class="send-button">
                  <i class="fas fa-paper-plane"></i>
                </button>
              </div>

              <!-- Image Preview -->
              <div v-if="selectedImage" class="image-preview-container">
                <img :src="selectedImage" class="image-preview">
                <button @click="selectedImage = null" class="remove-image">×</button>
              </div>

              <!-- Emoji Picker -->
              <div v-if="showEmojiPicker" class="emoji-picker">
                <div v-for="emoji in emojis" :key="emoji" @click="addEmoji(emoji)" class="emoji-item">
                  {{ emoji }}
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- Members List -->
        <div v-if="showMembersList" class="rightbar" :class="{ 'mobile-overlay': isMobile }">
          <div class="rightbar-header">
            <h3>Members ({{ members.length }})</h3>
            <button @click="showMembersList = false" class="close-btn">×</button>
          </div>
          
          <div class="members-list">
            <div v-for="member in members" :key="member.id" class="member-item">
              <div class="profile-picture">
                <img :src="getMemberAvatar(member)">
                <div class="online-indicator" v-if="member.isOnline"></div>
              </div>
              <div class="member-info">
                <span class="username" :style="{ color: getUserColor(member.id || member.userId, member.username) }">
                  {{ member.username || 'Unknown User' }}
                </span>
                <span class="member-status" v-if="member.lastSeen">
                  {{ member.isOnline ? 'Online' : `Last seen ${formatTime(member.lastSeen)}` }}
                </span>
                <span class="role" v-if="member.role === 'admin'">
                  <i class="fas fa-crown admin-badge"></i> Admin
                </span>
              </div>
              <div class="member-actions" v-if="isAdmin && member.role !== 'admin' && member.id !== currentUserId">
                <button @click="handleKickMember(member.id)" class="action-btn kick-btn" title="Remove Member">
                  <i class="fas fa-user-times"></i>
                </button>
              </div>
            </div>
          </div>

          <div class="rightbar-actions">
            <button @click="handleLeaveGroup" class="leave-button">
              <i class="fas fa-sign-out-alt"></i> Leave Group
            </button>
          </div>
        </div>
      </div>

      <!-- Message Options Menu -->
      <div v-if="showMessageMenu" class="message-menu" :style="messageMenuStyle" @click.stop>
        <button @click="replyToMessage(selectedMessage)">
          <i class="fas fa-reply"></i> Reply
        </button>
        <button @click="copyMessage(selectedMessage)">
          <i class="fas fa-copy"></i> Copy
        </button>
        <button v-if="selectedMessage?.senderId === currentUserId" @click="editMessage(selectedMessage)">
          <i class="fas fa-edit"></i> Edit
        </button>
        <button v-if="canDeleteMessage(selectedMessage)" @click="handleDeleteMessage(selectedMessage.id)">
          <i class="fas fa-trash"></i> Delete
        </button>
      </div>

      <!-- Fullscreen Image -->
      <div v-if="fullscreenImage" class="fullscreen-overlay" @click="closeFullscreen">
        <img :src="fullscreenImage" class="fullscreen-image">
      </div>
    </div>
  </div>
</template>

<script>
import { ref, computed, onMounted, onUnmounted, nextTick, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'

export default {
  name: 'GroupChat',
  setup() {
    const route = useRoute(), router = useRouter()
    
    // Refs
    const [loading, error, messagesContainer, messageInput, fileInput] = [ref(true), ref(null), ref(null), ref(null), ref(null)]
    const [currentUserId, currentUsername, currentUserRole] = [ref(null), ref(null), ref('member')]
    const [groupInfo, members, messages, joinRequests] = [ref({}), ref([]), ref([]), ref([])]
    const [showAdminPanel, showMessageMenu, showEmojiPicker, showMembersList] = [ref(false), ref(false), ref(false), ref(false)]
    const [messageMenuStyle, fullscreenImage, messageText, selectedMessage] = [ref({}), ref(null), ref(''), ref(null)]
    const [replyingTo, selectedImage, editGroupName, editingMessage] = [ref(null), ref(null), ref(''), ref(null)]
    
    // Username colors
    const userColors = ['#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4', '#FFEAA7', '#DDA0DD']
    const userColorMap = ref(new Map())
    
    // Computed
    const groupId = computed(() => parseInt(route.params.groupId) || null)
    const isAdmin = computed(() => members.value.find(m => m.userId === currentUserId.value)?.role === 'admin')
    const canSend = computed(() => editingMessage.value ? messageText.value.trim() !== '' && messageText.value.trim() !== editingMessage.value.content : messageText.value.trim() || selectedImage.value)
    const emojis = ['😊', '😂', '❤️', '👍', '👎', '😮', '😢', '😡', '👏', '🎉']
    const isMobile = computed(() => window.innerWidth <= 768)
    
    // Username color function
    const getUserColor = (userId, username) => {
      const key = userId || username
      if (!userColorMap.value.has(key)) {
        const colorIndex = userColorMap.value.size % userColors.length
        userColorMap.value.set(key, userColors[colorIndex])
      }
      return userColorMap.value.get(key)
    }
    
    // Helper functions
    const getSenderDisplayName = (msg) => {
      if (!msg) return 'Unknown User'
      const id = msg.senderId || msg.senderid, name = msg.senderName || msg.sendername || msg.username
      if (name) return name
      const member = members.value.find(m => m.id === id || m.userId === id)
      return member?.username || member?.senderName || 'Unknown User'
    }
    
    const getSenderRole = (msg) => {
      if (!msg) return 'member'
      const id = msg.senderId || msg.senderid, role = msg.senderRole || msg.senderrole || msg.role
      if (role) return role
      const member = members.value.find(m => m.id === id || m.userId === id)
      return member?.role || 'member'
    }
    
    const getSenderProfilePicture = (msg) => {
      if (!msg) return '/default-avatar.png'
      const id = msg.senderId || msg.senderid
      if (msg.profile_picture) return msg.profile_picture
      const member = members.value.find(m => m.id === id || m.userId === id)
      return member?.profile_picture || '/default-avatar.png'
    }
    
    const getMemberAvatar = (member) => member?.profile_picture || '/default-avatar.png'
    const getReplyAvatar = (replyMsg) => {
      if (!replyMsg) return '/default-avatar.png'
      const member = members.value.find(m => m.id === replyMsg.senderId || m.userId === replyMsg.senderId)
      return member?.profile_picture || '/default-avatar.png'
    }
    
    const getUserDataFromStorage = () => {
      const userId = localStorage.getItem('userId') || localStorage.getItem('loggedInUserId')
      const username = localStorage.getItem('username') || localStorage.getItem('loggedInUsername')
      const role = localStorage.getItem('userRole') || 'member'
      if (!userId || !username) { error.value = 'User not logged in. Please log in again.'; return false }
      currentUserId.value = parseInt(userId); currentUsername.value = username; currentUserRole.value = role
      return true
    }
    
    const makeRequest = async (url, options = {}) => {
      const response = await fetch(url, {
        ...options,
        headers: {
          'x-user-id': currentUserId.value?.toString() || '',
          'x-username': currentUsername.value || '',
          'x-role': currentUserRole.value || 'member',
          'Content-Type': 'application/json',
          ...options.headers
        }
      })
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        throw new Error(errorData.error || `HTTP ${response.status}`)
      }
      return response.json()
    }
    
    const initialize = async () => {
      loading.value = true; error.value = null
      try {
        if (!getUserDataFromStorage() || !groupId.value) throw new Error('Invalid session or group ID')
        await loadGroupData()
      } catch (err) { error.value = err.message }
      finally { loading.value = false }
    }
    
    const loadGroupData = async () => {
      const [groupResponse, membersList, messagesList] = await Promise.all([
        makeRequest(`https://yupitis.vercel.app/api/groups?id=${groupId.value}`),
        makeRequest(`https://yupitis.vercel.app/api/members?groupId=${groupId.value}`),
        makeRequest(`https://yupitis.vercel.app/api/messages?groupId=${groupId.value}`)
      ])
      
      groupInfo.value = groupResponse.success ? groupResponse.group : groupResponse
      members.value = Array.isArray(membersList) ? membersList : (membersList.members || [])
      const rawMessages = Array.isArray(messagesList) ? messagesList : (messagesList.messages || [])
      
      messages.value = rawMessages.map(msg => {
        const senderId = msg.senderId || msg.senderid
        const memberInfo = members.value.find(m => m.id === senderId || m.userId === senderId)
        return {
          ...msg,
          senderId: senderId || msg.userId,
          senderName: msg.senderName || msg.sendername || memberInfo?.username || 
                     (senderId === currentUserId.value ? currentUsername.value : 'Unknown User'),
          senderRole: msg.senderRole || msg.senderrole || memberInfo?.role || 
                     (senderId === currentUserId.value ? currentUserRole.value : 'member'),
          profile_picture: msg.profile_picture || memberInfo?.profile_picture || '/default-avatar.png',
          replyToMessage: msg.replyToMessage || msg.replytomessage
        }
      })
      
      editGroupName.value = groupInfo.value?.name || ''
      
      if (isAdmin.value) {
        try {
          const requests = await makeRequest(`https://yupitis.vercel.app/api/join?groupId=${groupId.value}`)
          joinRequests.value = Array.isArray(requests) ? requests : (requests.requests || [])
        } catch { joinRequests.value = [] }
      }
      
      await nextTick(); scrollToBottom()
    }
    
    const sendMessage = async () => {
      if (!canSend.value) return
      if (editingMessage.value) { await saveEditedMessage(); return }
      
      const messageData = {
        content: messageText.value.trim(),
        image: selectedImage.value,
        replyTo: replyingTo.value?.id || null,
        senderId: currentUserId.value,
        senderName: currentUsername.value,
        senderRole: currentUserRole.value
      }
      
      try {
        const newMessage = await makeRequest(`https://yupitis.vercel.app/api/messages?groupId=${groupId.value}`, {
          method: 'POST', body: JSON.stringify(messageData)
        })
        const messageToAdd = newMessage?.id ? newMessage : {
          id: Date.now(), ...messageData, timestamp: new Date().toISOString(), type: 'text', replyTo: replyingTo.value
        }
        messages.value.push(messageToAdd)
        messageText.value = ''; selectedImage.value = null; replyingTo.value = null
        await nextTick(); scrollToBottom()
      } catch (err) { error.value = 'Failed to send message: ' + err.message }
    }
    
    const saveEditedMessage = async () => {
      if (!editingMessage.value || !messageText.value.trim()) return
      try {
        await makeRequest(`https://yupitis.vercel.app/api/messages?groupId=${groupId.value}&messageId=${editingMessage.value.id}`, {
          method: 'PUT', body: JSON.stringify({ content: messageText.value.trim() })
        })
        const idx = messages.value.findIndex(m => m.id === editingMessage.value.id)
        if (idx !== -1) {
          messages.value[idx] = {
            ...messages.value[idx], content: messageText.value.trim(), edited: true, editedAt: new Date().toISOString()
          }
        }
        messageText.value = ''; editingMessage.value = null
      } catch (err) { error.value = 'Failed to edit message: ' + err.message }
    }
    
    // UI Functions
    const goBack = () => router.push('/chat/groups')
    const scrollToBottom = () => {
      const container = messagesContainer.value
      if (container) container.scrollTo({ top: container.scrollHeight, behavior: 'smooth' })
    }
    const formatTime = (timestamp) => {
      if (!timestamp) return ''
      const date = new Date(timestamp)
      if (isNaN(date.getTime())) return ''
      const now = new Date(), isToday = date.toDateString() === now.toDateString()
      return isToday ? date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: false }) : 
             date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit', hour12: false })
    }
    
    const toggleMembersList = () => { showMembersList.value = !showMembersList.value }
    const toggleEmojiPicker = () => { showEmojiPicker.value = !showEmojiPicker.value }
    const openFullscreen = (imageSrc) => { fullscreenImage.value = imageSrc }
    const closeFullscreen = () => { fullscreenImage.value = null }
    
    const showMessageOptions = (message, event) => {
      event.stopPropagation()
      if (showMessageMenu.value && selectedMessage.value?.id === message.id) { closeMessageMenu(); return }
      if (showMessageMenu.value) closeMessageMenu()
      selectedMessage.value = message; showMessageMenu.value = true
      const rect = event.currentTarget.getBoundingClientRect()
      const menuX = Math.min(rect.right - 150, window.innerWidth - 160), menuY = Math.max(rect.top - 10, 10)
      messageMenuStyle.value = { position: 'fixed', top: `${menuY}px`, left: `${menuX}px`, zIndex: '1000' }
    }
    
    const closeMessageMenu = () => { showMessageMenu.value = false; selectedMessage.value = null }
    
    const replyToMessage = (message) => {
      replyingTo.value = {
        id: message.id, senderId: message.senderId || message.senderid, senderName: getSenderDisplayName(message),
        content: message.content, profile_picture: getSenderProfilePicture(message)
      }
      closeMessageMenu(); nextTick(() => messageInput.value?.focus())
    }
    
    const cancelReply = () => { replyingTo.value = null }
    const cancelEdit = () => { editingMessage.value = null; messageText.value = '' }
    const canDeleteMessage = (msg) => msg && (msg.senderId === currentUserId.value || isAdmin.value)
    
    const copyMessage = async (message) => {
      try { await navigator.clipboard.writeText(message.content) }
      catch {
        const textArea = document.createElement('textarea')
        textArea.value = message.content; document.body.appendChild(textArea)
        textArea.select(); document.execCommand('copy'); document.body.removeChild(textArea)
      }
      closeMessageMenu()
    }
    
    const editMessage = (message) => {
      editingMessage.value = message; messageText.value = message.content; replyingTo.value = null
      closeMessageMenu(); nextTick(() => messageInput.value?.focus())
    }
    
    const handleDeleteMessage = async (messageId) => {
      if (!confirm('Delete this message?')) { closeMessageMenu(); return }
      try {
        await makeRequest(`https://yupitis.vercel.app/api/messages?groupId=${groupId.value}&messageId=${messageId}`, { method: 'DELETE' })
        messages.value = messages.value.filter(m => m.id !== messageId)
      } catch { error.value = 'Failed to delete message' }
      closeMessageMenu()
    }
    
    const selectImage = (event) => {
      const file = event.target.files?.[0]
      if (!file) return
      if (editingMessage.value) { error.value = 'Cannot add images while editing a message'; return }
      if (!file.type.startsWith('image/')) { error.value = 'Please select a valid image file'; return }
      const reader = new FileReader()
      reader.onload = (e) => { selectedImage.value = e.target?.result }
      reader.onerror = () => { error.value = 'Failed to read image file' }
      reader.readAsDataURL(file)
    }
    
    const addEmoji = (emoji) => {
      messageText.value += emoji; showEmojiPicker.value = false
      nextTick(() => messageInput.value?.focus())
    }
    
    const updateGroupInfo = async () => {
      try {
        const updateData = { name: editGroupName.value?.trim() || groupInfo.value.name }
        await makeRequest(`https://yupitis.vercel.app/api/groups?id=${groupId.value}`, { method: 'PUT', body: JSON.stringify(updateData) })
        groupInfo.value.name = updateData.name; showAdminPanel.value = false
      } catch { error.value = 'Failed to update group' }
    }
    
    const handleKickMember = async (memberId) => {
      if (!confirm('Are you sure you want to kick this member?')) return
      try {
        await makeRequest(`https://yupitis.vercel.app/api/members?groupId=${groupId.value}&userId=${memberId}`, { method: 'DELETE' })
        members.value = members.value.filter(m => m.id !== memberId)
      } catch { error.value = 'Failed to kick member' }
    }
    
    const handleLeaveGroup = async () => {
      if (!confirm('Are you sure you want to leave this group?')) return
      try {
        await makeRequest(`https://yupitis.vercel.app/api/members?groupId=${groupId.value}&userId=${currentUserId.value}`, { method: 'DELETE' })
        goBack()
      } catch { error.value = 'Failed to leave group' }
    }
    
    const handleJoinRequest = async (requestId, action) => {
      try {
        await makeRequest(`https://yupitis.vercel.app/api/join?requestId=${requestId}`, { method: 'PUT', body: JSON.stringify({ action }) })
        joinRequests.value = joinRequests.value.filter(r => r.id !== requestId)
        if (action === 'approve') await loadGroupData()
      } catch { error.value = `Failed to ${action} join request` }
    }
    
    const handleGlobalClick = (event) => {
      if (event.target.closest('.message') || event.target.closest('.message-menu')) return
      if (showMessageMenu.value) closeMessageMenu()
    }
    
    onMounted(() => { initialize(); document.addEventListener('click', handleGlobalClick, true) })
    onUnmounted(() => { document.removeEventListener('click', handleGlobalClick, true) })
    watch(() => route.params.groupId, (newGroupId) => {
      if (newGroupId && parseInt(newGroupId) !== groupId.value) initialize()
    })
    
    return {
      messagesContainer, messageInput, fileInput, loading, error, currentUserId, currentUsername, currentUserRole,
      groupInfo, members, messages, joinRequests, showAdminPanel, showMessageMenu, showEmojiPicker, showMembersList, 
      messageMenuStyle, fullscreenImage, messageText, selectedMessage, replyingTo, selectedImage, editGroupName, editingMessage,
      groupId, isAdmin, canSend, emojis, isMobile, getUserColor, getSenderDisplayName, getSenderRole, getSenderProfilePicture, 
      getMemberAvatar, getReplyAvatar, formatTime, initialize, sendMessage, goBack, toggleMembersList, toggleEmojiPicker, 
      openFullscreen, closeFullscreen, showMessageOptions, replyToMessage, cancelReply, cancelEdit, copyMessage, editMessage, 
      canDeleteMessage, handleDeleteMessage, closeMessageMenu, selectImage, addEmoji, updateGroupInfo, handleKickMember, 
      handleLeaveGroup, handleJoinRequest
    }
  }
}
</script>
<style src="./Chatbox.css"></style>
<style scoped>
/* Edited Message Indicators */
.edited-indicator {
  font-size: 10px;
  color: #999;
  margin-left: 4px;
  opacity: 0.7;
}
/* Shared Menu/Modal Styles */
.message-menu,
.modal-content {
  background: #222;
  border: 1px solid #444;
  border-radius: 8px;
  box-shadow: 0 4px 12px rgba(0,0,0,0.5);
  color: #fff;
}
.message-menu {
  position: fixed;
  padding: 4px 0;
  min-width: 120px;
  display: flex;
  flex-direction: column;
}

.modal-content {
  position: relative;
  margin: auto;
  padding: 20px;
  max-width: 400px;
  margin-top: 10vh;
}

/* Shared Button Styles */
.message-menu button,
.modal-content button {
  display: flex;
  align-items: center;
  background: none;
  border: none;
  color: #fff;
  cursor: pointer;
  white-space: nowrap;
}

.message-menu button {
  width: 100%;
  padding: 10px 12px;
  text-align: left;
  font-size: 13px;
}

.modal-content button {
  padding: 8px 16px;
  border-radius: 4px;
  font-size: 14px;
}

/* Hover States */
.message-menu button:hover {
  background: #333;
}

.modal-content .btn-primary {
  background: #007bff;
}

.modal-content .btn-primary:hover {
  background: #0056b3;
}

/* Icons */
.message-menu button i,
.modal-content button i {
  margin-right: 8px;
  width: 14px;
  font-size: 12px;
}

/* Modal Overlay */
.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: rgba(0,0,0,0.7);
  z-index: 3;
  display: flex;
  align-items: flex-start;
  justify-content: center;
}
/* Message Structure */
.message {
  margin-bottom: 8px;
  padding: 4px 0;
  position: relative;
  transition: background-color 0.1s ease;
  display: flex;
  flex-direction: column;
}

.message:hover {
  background-color: rgba(255, 255, 255, 0.02);
  border-radius: 6px;
  margin: 0 -4px;
  padding: 4px 8px;
}

/* Message Header - Avatar, Username, and Timestamp on same line */
.message-header {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 4px;
}

.sender-avatar {
  width: 35px;
  height: 35px;
  border-radius: 50%;
  flex-shrink: 0;
  object-fit: cover;
}

.sender-name {
  font-size: 1rem;
  font-weight: 600;
  color: var(--text-primary);
  display: flex;
  align-items: center;
  gap: 6px;
  flex-shrink: 0;
}

.admin-badge {
  color: #faa61a;
  font-size: 0.8rem;
}

.timestamp {
  font-size: 0.75rem;
  color: #72767d;
  font-weight: 400;
  margin-left: auto;
  flex-shrink: 0;
}

/* Message Bubble */
.msg-bubble {
  background: transparent;
  color: var(--text-secondary);
  padding: 0;
  border-radius: 0;
  line-height: 1.5;
  word-break: break-word;
  box-shadow: none;
  max-width: 100%;
  margin-left: 48px; /* Align with username (avatar width + gap) */
}

.user-msg .msg-bubble,
.other-msg .msg-bubble {
  background: transparent;
  align-self: stretch;
}

.user-msg, .other-msg {
  align-self: stretch;
  width: 100%;
}
.reply-preview {
  display: flex !important;
  align-items: center !important;
  flex-direction: row !important;
  margin-bottom: 6px;
  border-left: 3px solid #4f545c;
  position: relative;

}
.reply-content {
  display: flex !important;
  align-items: center !important;
  flex-direction: row !important;
  gap: 8px;
 
  width: 100%;
  flex-wrap: nowrap;
}
.reply-avatar {
  width: 24px !important;
  height: 24px !important;
  border-radius: 50%;
  flex-shrink: 0;
  object-fit: cover;
}
.reply-sender {
  color: #ffffff !important;
  font-size: 1rem;
  flex-shrink: 0;
  white-space: nowrap;
}

.reply-timestamp {
  font-size: 0.7rem !important;
  color: #72767d !important;
  flex-shrink: 0;
  white-space: nowrap;
}

/* Message Content */
.message-content {
  line-height: 1.5;
  word-wrap: break-word;
  color: #fff;
  font-size: 1rem;
}
/* System Message */
.system-message {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 12px;
  background: rgba(114, 137, 218, 0.1);
  border-left: 3px solid #7289da;
  border-radius: 4px;
  font-size: 0.9rem;
  color: #b9bbbe;
  margin: 8px 0;
}

.system-message i {
  color: #7289da;
}

.edited-label {
  font-size: 0.625rem;
  color: #72767d;
  margin-left: 4px;
}
/* System Messages */
.system-message {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 8px 12px;
  background: rgba(114, 137, 218, 0.1);
  border-left: 3px solid #7289da;
  border-radius: 0 4px 4px 0;
  color: #b9bbbe;
  font-size: 0.875rem;
  margin: 8px 0;
}

/* Message Photo */
.msg-photo {
  margin-top: 8px;
  max-width: 400px;
  max-height: 300px;
  border-radius: 8px;
  cursor: pointer;
  transition: opacity 0.2s;
}

.msg-photo:hover {
  opacity: 0.9;
}

/* Typing Indicator */
.typing-indicator {
  font-style: italic;
  color: #72767d;
  padding: 4px 16px;
  font-size: 0.875rem;
}

.message-menu button,
.modal-content button {
  display: flex;
  align-items: center;
  background: none;
  border: none;
  color: #fff;
  cursor: pointer;
  white-space: nowrap;
}

.message-menu button {
  width: 100%;
  padding: 10px 12px;
  text-align: left;
  font-size: 13px;
}
</style>
