<template>
  <div>
    <div class="floating-circle" @click="togglePanel">
      <i class="fas fa-bolt"></i>
    </div>

    <div class="sections">
      <transition name="slide-up">
        <div v-if="showPanel" class="floating-panel">
          <!-- Fixed Header with Close Button -->
          <div class="panel-fixed-header">
            <h3> Upload</h3>
            <div class="panel-header">
              <button class="close-btn" @click="togglePanel">×</button>
            </div>
          </div>

          <!-- Scrollable Content Area -->
          <div class="panel-content">
            <!-- Posts Content -->
            <div class="section">
              <!-- Post Input Form -->
              <div class="post-input">
                <div class="textarea-wrapper">
                  <div 
                    ref="contentEditable" 
                    id="postText" 
                    contenteditable="true" 
                    class="content-editable"  
                    :data-placeholder="replyToPostId ? 'Reply to Post...' : 'What\'s on your mind?'" 
                    @input="handleInput" 
                    @keydown="handleKeydown" 
                    @paste="handlePaste"
                  >
                <!-- Currently Typed @mention or #hashtag (live highlight display) -->
<div v-if="currentWord && currentTrigger" class="typed-highlight">
  <span class="trigger">{{ currentTrigger }}</span><span class="word">{{ currentWord }}</span>
</div>
</div>
                  
                  <!-- Suggestions Dropdown -->
                  <div v-if="showSuggestions" class="suggestions-dropdown">
                    <div 
                      v-for="(suggestion, index) in currentSuggestions" 
                      :key="index"
                      class="suggestion-item"
                      :class="{ active: selectedSuggestionIndex === index }"
                      @click="selectSuggestion(suggestion)"
                    >
                      <span class="suggestion-prefix">{{ currentPrefix }}</span>
                      <span class="suggestion-text">{{ suggestion }}</span>
                    </div>
                    <div v-if="currentSuggestions.length === 0" class="no-suggestions">
                      No {{ currentPrefix === '@' ? 'users' : 'hashtags' }} found
                    </div>
                  </div>
                  
                  <label for="file-input" class="file-upload-icon">
                    <i class="fas fa-image"></i>
                  </label>
                </div>
                <input type="file" id="file-input" accept="image/*" @change="handleImageUpload" ref="fileInput" hidden />
                <img v-if="imagePreview" :src="imagePreview" class="image-preview" alt="Image Preview" />
                <button class="post-btn" @click="postOpinion">
                  <i class="fas fa-paper-plane"></i>
                  Post
                </button>
              </div>

              <div class="divider"></div>

              <!-- Create Group Section -->
              <div class="create-group-section">
                <h3>Create Group</h3>
                <div class="group-form">
                  <div class="group-image-section">
                    <label for="group-image-input" class="group-image-upload">
                      <i class="fas fa-camera"></i>
                      <span>Add Image</span>
                    </label>
                    <input type="file" id="group-image-input" accept="image/*" @change="handleGroupImageUpload" ref="groupImageInput" hidden />
                    <img v-if="groupImagePreview" :src="groupImagePreview" class="group-image-preview" alt="Group Image Preview" />
                  </div>
                  
                  <input 
                    v-model="newGroupName" 
                    placeholder="Enter group name..." 
                    id="group-name-input"
                    class="content-editable"
                  />
                  
                  <div class="group-actions">
                    <button @click="createGroup" :disabled="!newGroupName" class="create-btn">
                      <i class="fas fa-plus"></i>
                      Create
                    </button>
                    <button @click="resetGroupForm" class="cancel-btn">
                      <i class="fas fa-times"></i>
                      Clear
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </transition>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, computed, nextTick } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import Ably from 'ably'

// Reactive states
const showPanel = ref(false)
const postText = ref('')
const imagePreview = ref(null)
const imageData = ref(null)
const uploadedImage = ref(null)
const fileInput = ref(null)
const contentEditable = ref(null)
const lastSentPostId = ref(null)
const newGroupName = ref('')
const groupImageData = ref(null)
const groupImagePreview = ref(null)
const groupImageInput = ref(null)

const currentTrigger = ref(null)  // '@' or '#'
const currentWord = ref('')


// User info
const loggedInUsername = ref(localStorage.getItem('username') || '')
const profilePic = ref(localStorage.getItem('profilePic') || '')
const sessionId = ref(localStorage.getItem('sessionId') || '')

// Reply info from route
const route = useRoute()
const router = useRouter()
const replyToPostId = ref(route.query.replyToPostId || null)
const replyToUsername = ref(route.query.replyToUsername || null)

// Ably setup
const ably = new Ably.Realtime('eCkrsA.JzcmYQ:JLywAltPtm-KWD6Rd0MItQRgi-I4R7zn6BpI1UVQ3Eg')
const channel = ably.channels.get('posts-channel')

function togglePanel() {
  showPanel.value = !showPanel.value
  if (!showPanel.value) {
    router.push({ path: '/posts' })
  }
}

// Init reply state
onMounted(() => {
  if (replyToUsername.value) {
    showPanel.value = true
    postText.value = `@${replyToUsername.value} `
    nextTick(() => {
      if (contentEditable.value) {
        contentEditable.value.innerHTML = `<span class="tagged-user">@${replyToUsername.value}</span> `
        placeCaretAtEnd(contentEditable.value)
        contentEditable.value.focus()
      }
    })
  }
})

// Enhanced input handler for both tags and hashtags
function handleInput() {
  postText.value = contentEditable.value.innerText

  const sel = window.getSelection()
  const caretOffset = sel?.anchorOffset || 0

  // Extract text up to caret
  const textUpToCaret = postText.value.slice(0, caretOffset)
  const match = textUpToCaret.match(/(?:^|\s)([@#])(\w*)$/)

  if (match) {
    currentTrigger.value = match[1]         // '@' or '#'
    currentWord.value = match[2] || ''
  } else {
    currentTrigger.value = null
    currentWord.value = ''
  }

  // Highlight all @tags and #hashtags
  const words = postText.value.split(/(\s+)/)
  let html = ''
  words.forEach(word => {
    if (word.match(/^@\w+$/)) {
      html += `<span class="tagged-user">${word}</span>`
    } else if (word.match(/^#\w+$/)) {
      html += `<span class="hashtag">${word}</span>`
    } else {
      html += word
    }
  })

  if (contentEditable.value.innerHTML !== html) {
    const position = getCaretPosition()
    contentEditable.value.innerHTML = html
    setCaretPosition(position)
  }
}

function handleKeydown(event) {
  if (event.key === 'Enter') {
    event.preventDefault()
    postOpinion()
  }
}

function handlePaste(event) {
  event.preventDefault()
  const text = event.clipboardData.getData('text/plain')
  document.execCommand('insertText', false, text)
}

function placeCaretAtEnd(el) {
  const range = document.createRange()
  const sel = window.getSelection()
  range.selectNodeContents(el)
  range.collapse(false)
  sel.removeAllRanges()
  sel.addRange(range)
}

// Extract tags
const extractedTags = computed(() => {
  if (!postText.value) return []
  return [...new Set(postText.value.match(/@(\w+)/g)?.map(tag => tag.slice(1)) || [])]
})

// Extract hashtags
const extractedHashtags = computed(() => {
  if (!postText.value) return []
  return [...new Set(postText.value.match(/#(\w+)/g)?.map(hashtag => hashtag.slice(1)) || [])]
})

// Post image upload
async function handleImageUpload(event) {
  const file = event.target.files[0]
  if (!file) return

  const reader = new FileReader()
  reader.onloadend = async () => {
    try {
      const resizedBlob = await resizeImageToMaxSize(reader.result, 65)
      imageData.value = await blobToBase64(resizedBlob)
      imagePreview.value = reader.result
      uploadedImage.value = file
    } catch (error) {
      showAlert('Error processing image.', true)
    }
  }
  reader.readAsDataURL(file)
}

// Group image upload
async function handleGroupImageUpload(event) {
  const file = event.target.files[0]
  if (!file) return

  const reader = new FileReader()
  reader.onloadend = async () => {
    try {
      const resizedBlob = await resizeImageToMaxSize(reader.result, 100)
      groupImageData.value = await blobToBase64(resizedBlob)
      groupImagePreview.value = reader.result
    } catch (error) {
      showAlert('Error processing group image.', true)
    }
  }
  reader.readAsDataURL(file)
}

// Resize image helper
function resizeImageToMaxSize(imageSrc, maxSizeKB = 65) {
  return new Promise((resolve, reject) => {
    const img = new Image()
    img.src = imageSrc
    img.onload = () => {
      const canvas = document.createElement('canvas')
      const ctx = canvas.getContext('2d')
      const maxWidth = 200
      const scale = maxWidth / img.width
      canvas.width = img.width * scale
      canvas.height = img.height * scale
      ctx.drawImage(img, 0, 0, canvas.width, canvas.height)
      canvas.toBlob(
        (blob) => {
          if (blob.size / 1024 <= maxSizeKB) {
            resolve(blob)
          } else {
            reject(new Error('Image exceeds max size after resizing.'))
          }
        },
        'image/webp',
        0.4
      )
    }
    img.onerror = () => reject(new Error('Error loading image.'))
  })
}

// Convert blob to base64
function blobToBase64(blob) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onloadend = () => resolve(reader.result)
    reader.onerror = reject
    reader.readAsDataURL(blob)
  })
}

// Dummy notify
function showAlert(message, isError = false) {
  alert((isError ? 'Error: ' : '') + message)
}

// Function to upload hashtags to separate hashtag API
async function uploadHashtags(postId, hashtags, username) {
  if (!hashtags || hashtags.length === 0) return
  
  try {
    console.log('Uploading hashtags separately:', hashtags)
    const response = await fetch('https://199-ten.vercel.app/api/features', {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json',
        Accept: 'application/json' 
      },
      credentials: 'include',
      body: JSON.stringify({
        postId: postId,
        hashtags: hashtags,
        username: username
      }),
    })

    if (!response.ok) {
      const errorText = await response.text()
      throw new Error(`Failed to upload hashtags: ${response.status} - ${errorText}`)
    }

    const result = await response.json()
    console.log('Hashtags uploaded successfully to separate API:', result)
    showAlert(`Hashtags saved: ${hashtags.map(h => '#' + h).join(', ')}`, false)
  } catch (error) {
    console.error('Error uploading hashtags to separate API:', error)
    showAlert('Warning: Hashtags could not be saved to hashtag database', true)
  }
}

// Submit opinion
async function postOpinion() {
  if (!sessionId.value || !loggedInUsername.value) {
    showAlert('Error: Session ID and Username are required', true)
    return
  }
  if (!postText.value && !imageData.value) {
    showAlert('Post content cannot be empty!', true)
    return
  }

  const postData = {
    message: postText.value,
    username: loggedInUsername.value,
    sessionId: sessionId.value,
    profilePic: profilePic.value,
    photo: imageData.value,
    tags: extractedTags.value,
    replyTo: replyToPostId.value ? { postId: replyToPostId.value, username: replyToUsername.value } : null
  }

  try {
    const response = await fetch('https://sports321.vercel.app/api/postOpinion', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
      credentials: 'include',
      body: JSON.stringify(postData),
    })

    if (!response.ok) throw new Error('Failed to submit post')

    const newPost = await response.json()
    lastSentPostId.value = newPost._id
    
    if (extractedHashtags.value.length > 0) {
      console.log('Hashtags detected:', extractedHashtags.value)
      await uploadHashtags(newPost._id, extractedHashtags.value, loggedInUsername.value)
    }
    
    showAlert('Post submitted successfully!', false)
    channel.publish('newOpinion', newPost)
    resetForm()

    if (extractedTags.value.length > 0) {
      await fetch('https://2damnit.vercel.app/api/Alerts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'send-push-Alert',
          taggedUsers: extractedTags.value,
          postId: newPost._id,
          message: `${loggedInUsername.value} tagged you in a post!`
        }),
      })
    }

    router.push({ path: '/posts' })
  } catch (error) {
    showAlert('Error submitting post: ' + error.message, true)
  }
}

// Create Group
async function createGroup() {
  if (!newGroupName.value.trim()) return

  try {
    const response = await fetch('https://sports321.vercel.app/api/Group', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json',
      },
      credentials: 'include',
      body: JSON.stringify({
        name: newGroupName.value.trim(),
        creator: loggedInUsername.value,
        image: groupImageData.value
      }),
    })

    if (!response.ok) throw new Error('Failed to create group')

    const newGroup = await response.json()
    showAlert('Group created successfully!', false)

    // Reset
    newGroupName.value = ''
    groupImageData.value = null
    groupImagePreview.value = null
    if (groupImageInput.value) groupImageInput.value.value = ''
  } catch (error) {
    console.error('Error creating group:', error)
    showAlert('Error creating group.', true)
  }
}

// Reset post form
function resetForm() {
  postText.value = ''
  contentEditable.value.innerHTML = ''
  imagePreview.value = null
  imageData.value = null
  uploadedImage.value = null
  if (fileInput.value) fileInput.value.value = ''
}

// Realtime listener
onMounted(() => {
  channel.subscribe('newOpinion', (message) => {
    const incomingPost = message.data
    if (incomingPost?._id && incomingPost._id !== lastSentPostId.value) {
      showAlert('New post added!', false)
    }
  })
})
</script>

<style scoped>
.floating-circle {
  position: fixed;
  bottom: 80px;
  right: 30px;
  width: 48px;
  height: 48px;
  background: linear-gradient(135deg, #667eea, #764ba2);
  color: #fff;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: 0 8px 25px rgba(102, 126, 234, 0.3);
  z-index: 1000;
  cursor: pointer;
  transition: transform 0.3s ease, box-shadow 0.3s ease;
  font-size: 18px;
}
.floating-panel {
  position: fixed;
  inset: 60px 0 0 0;
  background: #000;
  z-index: 9;
  border-radius: 24px 24px 0 0;
  box-shadow: 0 -10px 50px rgba(0, 0, 0, 0.3);
  display: flex;
  flex-direction: column;
  overflow: hidden;
  backdrop-filter: blur(10px);
}
.panel-fixed-header {
  background: #000;
  padding: 20px 24px;
}

.panel-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}
.panel-content {
  flex: 1;
  overflow-y: auto;
  padding: 0 24px 24px;
}
.post-input {
  margin-bottom: 20px;
}

.textarea-wrapper {
  position: relative;
  margin-bottom: 16px;
}

.content-editable, .post-input input,.group-name-input, .post-input textarea {
  width: 100%;
  min-height: 80px;
  padding: 12px 16px;
  border-radius: 15px;
  background: #111;
  color: #fff;
  font-size: 1rem;
  outline: none;
  white-space: pre-wrap;
  border: 2px solid transparent;
  transition: all 0.3s ease;
}

.content-editable:focus {
  border-color: rgba(102, 126, 234, 0.5);
  background: rgba(255, 255, 255, 0.08);
  box-shadow: 0 0 0 4px rgba(102, 126, 234, 0.1);
}

.content-editable:empty::before {
  content: attr(data-placeholder);
  color: #888;
  position: absolute;
  pointer-events: none;
}

.tagged-user, .hashtag {
  color: #fff;
  padding: 2px 8px;
  border-radius: 12px;
  font-weight: 600;
  font-size: 14px;
}
.close-btn {
  width: 50px;
  height: 50px;
  background: none;
  font-size: 31px;
  position: fixed;
  right: 8%;
  top: 0.5%;
}

.tagged-user {
  background: linear-gradient(135deg, #667eea, #764ba2);
}

.hashtag {
  background: linear-gradient(135deg, #f093fb, #f5576c);
}

.suggestions-dropdown {
  position: absolute;
  top: 100%;
  left: 0;
  right: 0;
  background: rgba(26, 26, 26, 0.95);
  backdrop-filter: blur(20px);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 12px;
  max-height: 200px;
  overflow-y: auto;
  z-index: 1000;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.3);
}

.suggestion-item {
  padding: 12px 16px;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 8px;
  border-bottom: 1px solid rgba(255, 255, 255, 0.05);
  transition: background-color 0.2s ease;
}

.suggestion-item:hover, .suggestion-item.active {
  background: rgba(102, 126, 234, 0.2);
}

.suggestion-item:last-child {
  border-bottom: none;
}

.suggestion-prefix {
  color: #667eea;
  font-weight: bold;
}

.suggestion-text {
  color: #fff;
}

.no-suggestions {
  padding: 12px 16px;
  color: rgba(255, 255, 255, 0.5);
  text-align: center;
  font-style: italic;
}

.file-upload-icon {
  position: absolute;
  top: 20px;
  right: 20px;
  width: 40px;
  height: 40px;
  background: rgba(102, 126, 234, 0.2);
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  color: #667eea;
  border: 1px solid rgba(102, 126, 234, 0.3);
  transition: all 0.2s ease;
}

.file-upload-icon:hover {
  background: rgba(102, 126, 234, 0.3);
  transform: scale(1.05);
}
.image-preview {
  max-width: 300px;
  width: 100%;
  height: auto;
  border-radius: 12px;
  margin-bottom: 16px;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.3);
}
.post-btn:hover {
  transform: translateY(-2px);
  box-shadow: 0 8px 25px rgba(102, 126, 234, 0.4);
}
.divider {
  height: 1px;
  background: linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.2), transparent);
  margin: 32px 0;
}
.create-group-section {
  margin-top: 32px;
}
.create-group-section h3 {
  font-size: 20px;
  font-weight: 700;
  color: transparent;
  background: linear-gradient(135deg, #f093fb, #f5576c);
  background-clip: text;
  -webkit-background-clip: text;
  margin: 0 0 20px;
}
.group-form {
  display: flex;
  flex-direction: column;
  gap: 20px;
}
.group-image-section {
  display: flex;
  flex-direction: column;
  gap: 12px;
}
.group-image-upload {
  background: rgba(240, 147, 251, 0.2);
  border: 2px dashed rgba(240, 147, 251, 0.4);
  border-radius: 12px;
  padding: 12px;
  text-align: center;
  cursor: pointer;
  color: #f093fb;
  font-weight: 600;
  transition: all 0.3s ease;
}
button {
  background: #333;
  color: #fff;
  padding: 10px 18px;
  border-radius: 999px;
  font-size: 14px;
}

button:hover {
  background: #111;
  transform: scale(1.03);
}

.slide-up-enter-active, .slide-up-leave-active {
  transition: transform 0.3s ease;
}

.slide-up-enter-from, .slide-up-leave-to {
  transform: translateY(100%);
}
.typed-highlight {
  margin-top: 14px;
  padding: 6px 10px;
  border-radius: 6px;
  font-size: 21px;
  color: red;
}
.typed-highlight .trigger {
  font-weight: bold;
  color: #007bff;
}

</style>
