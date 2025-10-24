<template>
  <div>
    <!-- Floating Action Button (FAB) -->
    <div
      class="floating-circle"
      @click="togglePanel"
      :aria-expanded="showPanel.toString()"
      aria-label="Create post or group"
      role="button"
      tabindex="0"
      @keydown.enter="togglePanel"
      @keydown.space.prevent="togglePanel"
    >
      <i class="fas fa-bolt"></i>
    </div>

    <!-- Dimmed overlay behind panel -->
    <div v-if="showPanel" class="floating-overlay" @click="togglePanel"></div>

    <div class="sections">
      <transition name="slide-up">
        <div v-if="showPanel" class="floating-panel" role="dialog" aria-modal="true">
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
import { ref, onMounted, onUnmounted, watch, computed, nextTick } from 'vue'
import { useRoute, useRouter } from 'vue-router'

// Refs for UI
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

const currentTrigger = ref(null)
const currentWord = ref('')

// Route
const route = useRoute()
const router = useRouter()
const replyToPostId = ref(route.query.replyToPostId || null)
const replyToUsername = ref(route.query.replyToUsername || null)

// User info (kept in sync on action)
const loggedInUserId = ref(localStorage.getItem('userId') || '')
const loggedInUsername = ref(localStorage.getItem('username') || '')
const profilePic = ref(localStorage.getItem('profilePic') || '')
const sessionId = ref(localStorage.getItem('sessionId') || '')
const loginHref = 'https://endless.sbs/public/signup'

const isAuthenticated = computed(() => !!(loggedInUsername.value && loggedInUsername.value !== 'Guest'))

function refreshAuthRefs() {
  loggedInUserId.value = localStorage.getItem('userId') || ''
  loggedInUsername.value = localStorage.getItem('username') || ''
  profilePic.value = localStorage.getItem('profilePic') || ''
  sessionId.value = localStorage.getItem('sessionId') || ''
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
  window.addEventListener('keydown', handleGlobalKeydown)
})

onUnmounted(() => {
  window.removeEventListener('keydown', handleGlobalKeydown)
  document.body.style.overflow = ''
})

function handleGlobalKeydown(e){
  if(e.key === 'Escape' && showPanel.value){
    togglePanel()
  }
}

// Toggle post panel
function togglePanel() {
  refreshAuthRefs()
  if (!isAuthenticated.value) {
    // Make login requirement obvious and fast-path users to login
    window.location.href = loginHref
    return
  }
  showPanel.value = !showPanel.value
  if (!showPanel.value) {
    router.push({ path: '/posts' })
  }
}

// Prevent background scroll while panel is open
watch(showPanel, (open) => {
  document.body.style.overflow = open ? 'hidden' : ''
})

// Handle input & detect tags/hashtags
function handleInput() {
  if (!contentEditable.value) return

  postText.value = contentEditable.value.innerText

  // Get caret offset relative to plain text
  const caretPos = getCaretCharacterOffsetWithin(contentEditable.value)

  // Regex to detect trigger (@ or #) and the current word
  const textUpToCaret = postText.value.slice(0, caretPos)
  const match = textUpToCaret.match(/(?:^|\s)([@#])(\w*)$/)

  currentTrigger.value = match ? match[1] : null
  currentWord.value = match ? match[2] : ''

  // Split text into words and rebuild html with span wrapping tags
  const words = postText.value.split(/(\s+)/)
  let html = ''
  words.forEach(word => {
    if (word.match(/^@\w+$/)) {
      html += `<span class="tagged-user">${word}</span>`
    } else if (word.match(/^#\w+$/)) {
      html += `<span class="hashtag">${word}</span>`
    } else {
      // escape HTML special characters in normal text for safety
      html += escapeHtml(word)
    }
  })

  // Only update innerHTML if changed to avoid infinite loop
  if (contentEditable.value.innerHTML !== html) {
    contentEditable.value.innerHTML = html

    // Restore caret position correctly
    setCaretCharacterOffsetWithin(contentEditable.value, caretPos)
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

// Utility: Escape HTML characters for safety
function escapeHtml(text) {
  const div = document.createElement('div')
  div.textContent = text
  return div.innerHTML
}

function placeCaretAtEnd(el) {
  const range = document.createRange()
  const sel = window.getSelection()
  range.selectNodeContents(el)
  range.collapse(false)
  sel.removeAllRanges()
  sel.addRange(range)
}

// Caret position helpers
function getCaretCharacterOffsetWithin(element) {
  const selection = window.getSelection()
  let caretOffset = 0
  if (selection.rangeCount > 0) {
    const range = selection.getRangeAt(0)
    const preCaretRange = range.cloneRange()
    preCaretRange.selectNodeContents(element)
    preCaretRange.setEnd(range.endContainer, range.endOffset)
    caretOffset = preCaretRange.toString().length
  }
  return caretOffset
}

function setCaretCharacterOffsetWithin(element, offset) {
  const range = document.createRange()
  const sel = window.getSelection()

  let currentNode = null
  let currentOffset = 0

  const treeWalker = document.createTreeWalker(
    element,
    NodeFilter.SHOW_TEXT,
    null,
    false
  )

  while (treeWalker.nextNode()) {
    const node = treeWalker.currentNode
    if (offset <= node.length) {
      currentNode = node
      currentOffset = offset
      break
    } else {
      offset -= node.length
    }
  }

  if (currentNode) {
    range.setStart(currentNode, currentOffset)
    range.collapse(true)
    sel.removeAllRanges()
    sel.addRange(range)
  }
}

// Extract tags/hashtags
const extractedTags = computed(() =>
  [...new Set(postText.value.match(/@(\w+)/g)?.map(tag => tag.slice(1)) || [])]
)

const extractedHashtags = computed(() =>
  [...new Set(postText.value.match(/#(\w+)/g)?.map(tag => tag.slice(1)) || [])]
)

// Upload image (post)
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
    } catch {
      showAlert('Error processing image.', true)
    }
  }
  reader.readAsDataURL(file)
}

// Upload group image
async function handleGroupImageUpload(event) {
  const file = event.target.files[0]
  if (!file) return

  const reader = new FileReader()
  reader.onloadend = async () => {
    try {
      const resizedBlob = await resizeImageToMaxSize(reader.result, 100)
      groupImageData.value = await blobToBase64(resizedBlob)
      groupImagePreview.value = reader.result
    } catch {
      showAlert('Error processing group image.', true)
    }
  }
  reader.readAsDataURL(file)
}

// Resize image
function resizeImageToMaxSize(imageSrc, maxSizeKB = 65) {
  return new Promise((resolve, reject) => {
    const img = new Image()
    img.src = imageSrc
    img.onload = () => {
      const canvas = document.createElement('canvas')
      const ctx = canvas.getContext('2d')
      const scale = 200 / img.width
      canvas.width = img.width * scale
      canvas.height = img.height * scale
      ctx.drawImage(img, 0, 0, canvas.width, canvas.height)
      canvas.toBlob(blob => {
        if (blob && blob.size / 1024 <= maxSizeKB) resolve(blob)
        else reject(new Error('Image exceeds max size.'))
      }, 'image/webp', 0.4)
    }
    img.onerror = () => reject(new Error('Image load error.'))
  })
}

// Blob to base64
function blobToBase64(blob) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onloadend = () => resolve(reader.result)
    reader.onerror = reject
    reader.readAsDataURL(blob)
  })
}

// Alert helper
function showAlert(message, isError = false) {
  alert((isError ? 'Error: ' : '') + message)
}

// Upload hashtags
async function uploadHashtags(postId, hashtags, username) {
  if (!hashtags.length) return
  try {
    await fetch('https://199-ten.vercel.app/api/features', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json'
      },
      credentials: 'include',
      body: JSON.stringify({ postId, hashtags, username }),
    })
  } catch {
    showAlert('Warning: Hashtags could not be saved.', true)
  }
}

// Post opinion
async function postOpinion() {
  refreshAuthRefs()
  if (!isAuthenticated.value) {
    showAlert('Please log in to post', true)
    window.location.href = loginHref
    return
  }
  if (!sessionId.value || !loggedInUsername.value) {
    showAlert('Session ID and Username required', true)
    return
  }
  if (!postText.value && !imageData.value) {
    showAlert('Post cannot be empty!', true)
    return
  }

  const postData = {
    message: postText.value,
    username: loggedInUsername.value,
    sessionId: sessionId.value,
    profilePic: profilePic.value,
    photo: imageData.value,
    tags: extractedTags.value,
    replyTo: replyToPostId.value
      ? { postId: replyToPostId.value, username: replyToUsername.value }
      : null
  }

  try {
    const response = await fetch('https://hamburger-henna.vercel.app/api/postOpinion', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
      credentials: 'include',
      body: JSON.stringify(postData),
    })

    if (!response.ok) throw new Error('Submit failed')
    const newPost = await response.json()
    lastSentPostId.value = newPost._id

    if (extractedHashtags.value.length > 0) {
      await uploadHashtags(newPost._id, extractedHashtags.value, loggedInUsername.value)
    }

    showAlert('Post submitted!', false)
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
    showAlert('Post error: ' + error.message, true)
  }
}

// Create group
async function createGroup() {
  refreshAuthRefs()
  if (!isAuthenticated.value) {
    showAlert('Please log in to create a group', true)
    window.location.href = loginHref
    return
  }
  try {
    const response = await fetch('https://yupitis.vercel.app/api/groups', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json',
        'x-user-id': loggedInUserId.value,
      },
      credentials: 'include',
      body: JSON.stringify({
        name: newGroupName.value.trim(),
        creator: loggedInUsername.value,
        image: groupImageData.value,
      }),
    })

    if (!response.ok) throw new Error('Group creation failed')

    showAlert('Group created!', false)
    newGroupName.value = ''
    groupImageData.value = null
    groupImagePreview.value = null
    if (groupImageInput.value) groupImageInput.value.value = ''
  } catch {
    showAlert('Error creating group.', true)
  }
}

// Reset form
function resetForm() {
  postText.value = ''
  if (contentEditable.value) contentEditable.value.innerHTML = ''
  imagePreview.value = null
  imageData.value = null
  uploadedImage.value = null
  if (fileInput.value) fileInput.value.value = ''
}

</script>


<style scoped>
/* Floating Elements */
.floating-circle {
  position: fixed;
  bottom: 18px;
  right: 22px;
  width: 62px;
  height: 62px;
  background: linear-gradient(135deg,#7f5af0,#6246ea,#5332d3);
  background-size: 300% 300%;
  border-radius: 22px;
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1200; /* Above everything */
  cursor: pointer;
  transition: transform .35s cubic-bezier(.22,1,.36,1), box-shadow .35s ease, background-position 6s linear;
  color: #fff;
  box-shadow: 0 10px 25px -5px rgba(127,90,240,.5), 0 4px 10px -2px rgba(0,0,0,.5);
  outline: none;
}
.floating-circle:focus-visible {
  box-shadow: 0 0 0 4px rgba(255,255,255,0.25), 0 10px 25px -5px rgba(127,90,240,.55);
}
.floating-circle:hover {
  transform: translateY(-4px) scale(1.05);
  background-position: 100% 50%;
}
.floating-circle:active {
  transform: translateY(0) scale(.96);
}
.floating-circle i { font-size: 1.4rem; filter: drop-shadow(0 2px 4px rgba(0,0,0,.4)); }

@keyframes floatPulse {
  0%,100% { box-shadow: 0 0 0 0 rgba(127,90,240,.55); }
  50% { box-shadow: 0 0 0 14px rgba(127,90,240,0); }
}
.floating-circle::after {
  content: '';
  position: absolute;
  inset: 0;
  border-radius: inherit;
  animation: floatPulse 3.2s ease-in-out infinite;
  pointer-events: none;
}

.floating-overlay {
  position: fixed;
  inset: 0;
  background: rgba(0,0,0,.55);
  backdrop-filter: blur(4px);
  -webkit-backdrop-filter: blur(4px);
  z-index: 1100;
  animation: fadeOverlay .3s ease;
}
@keyframes fadeOverlay { from { opacity: 0; } to { opacity: 1; } }

.floating-panel {
  position: fixed;
  top: clamp(12px,4vh,42px);
  bottom: clamp(12px,4vh,42px);
  right: clamp(12px,4vw,42px);
  left: clamp(12px,4vw,42px);
  max-width: 980px;
  margin: 0 auto;
  display: flex;
  flex-direction: column;
  background: linear-gradient(135deg,rgba(20,20,28,.85),rgba(45,27,64,.85));
  backdrop-filter: blur(22px) saturate(140%);
  -webkit-backdrop-filter: blur(22px) saturate(140%);
  border: 1px solid rgba(255,255,255,0.08);
  box-shadow: 0 20px 40px -10px rgba(0,0,0,.6), 0 0 0 1px rgba(255,255,255,0.04) inset;
  border-radius: 34px;
  z-index: 1250;
  overflow: hidden;
  animation: panelIn .45s cubic-bezier(.22,1,.36,1);
}
@keyframes panelIn { from { opacity:0; transform: translateY(24px) scale(.96); } to { opacity:1; transform: translateY(0) scale(1); } }

@media (max-width: 740px) {
  .floating-panel {
    top: 0; left: 0; right: 0; bottom: 0; border-radius: 0; max-width: none; animation: panelInFull .35s ease;
  }
  @keyframes panelInFull { from { opacity:0; transform: translateY(30px);} to { opacity:1; transform: translateY(0);} }
}
/* Panel Layout */
.panel-fixed-header {
  padding: 20px 28px 12px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  background: linear-gradient(90deg,rgba(255,255,255,0.04),rgba(255,255,255,0));
  border-bottom: 1px solid rgba(255,255,255,0.06);
}
.panel-fixed-header h3 { margin: 0; font-size: 1.15rem; letter-spacing: .5px; background: linear-gradient(135deg,#b892ff,#f093fb); -webkit-background-clip: text; background-clip: text; color: transparent; }
.panel-header { display: flex; }
.panel-content { flex: 1; overflow-y: auto; padding: 0 28px 32px; }
/* Input Elements */
.content-editable, 
.post-input input,
.group-name-input, 
.post-input textarea {
  width: 100%;
  min-height: 80px;
  padding: 12px 16px;
  border-radius: 15px;
  color: #fff;
  outline: none;
  white-space: pre-wrap;
  border: 2px solid rgba(102, 126, 234, 0.5);
  background: rgba(255, 255, 255, 0.08);
  transition: all 0.3s ease;
}
.content-editable:empty::before {
  content: attr(data-placeholder);
  color: #888;
  pointer-events: none;
}
/* Tags */
.tagged-user, .hashtag {
  color: #fff;
  padding: 2px 8px;
  border-radius: 12px;
}
.tagged-user {
  background: linear-gradient(135deg, #667eea, #764ba2);
}

.hashtag {
  background: linear-gradient(135deg, #f093fb, #f5576c);
}
/* Suggestions */
.suggestions-dropdown {
  position: absolute;
  top: 100%;
  left: 0;
  right: 0;
  backdrop-filter: blur(20px);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 12px;
  max-height: 200px;
  overflow-y: auto;
  z-index: 4;
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
.suggestion-item:hover, 
.suggestion-item.active {
  background: rgba(102, 126, 234, 0.2);
}
.suggestion-item:last-child {
  border-bottom: none;
}
/* Upload & Media */
.file-upload-icon {
  position: absolute;
  top: 14%;
  right: 18px;
  width: 54px;
  height: 54px;
  border-radius: 18px;
  cursor: pointer;
  color: #fff;
  background: linear-gradient(135deg,#f093fb33,#667eea22);
  display: flex; align-items: center; justify-content: center;
  transition: all .3s ease;
  backdrop-filter: blur(6px);
  border: 1px solid rgba(255,255,255,0.08);
}
.file-upload-icon:hover { background: linear-gradient(135deg,#f093fb66,#667eea55); transform: translateY(-2px); }
.file-upload-icon:active { transform: translateY(0) scale(.95); }
.image-preview {
  max-width: 300px;
  width: 100%;
  height: auto;
  border-radius: 12px;
  margin-bottom: 16px;
}
/* Buttons */
button {
  background: linear-gradient(135deg,#f093fb33,#667eea22);
  color: #fff;
  padding: 10px 20px;
  border-radius: 18px;
  cursor: pointer;
  transition: background .35s ease, transform .35s ease, box-shadow .35s ease;
  border: 1px solid rgba(255,255,255,0.08);
  font-weight: 500;
  backdrop-filter: blur(6px);
}
button:hover {
  background: linear-gradient(135deg,#f093fb88,#667eea66);
  transform: translateY(-3px);
  box-shadow: 0 10px 20px -5px rgba(0,0,0,.5);
}
button:active { transform: translateY(0) scale(.95); box-shadow: 0 4px 10px -3px rgba(0,0,0,.6); }
.close-btn {
  width: 48px;
  height: 48px;
  background: linear-gradient(135deg,#ff6a88,#ff99ac);
  border-radius: 16px;
  position: relative;
  right: 0;
  top: 0;
  font-size: 1.4rem;
  display: flex; align-items: center; justify-content: center;
  border: none;
  line-height: 1;
  padding: 0;
}
.close-btn:hover { background: linear-gradient(135deg,#ff6a88,#ff5e78); }
.close-btn:active { transform: scale(.9); }
/* Utility Classes */
.divider {
  height: 2px;
  background: linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.905), transparent);
  margin: 32px 0;
}
.post-input,
.create-group-section {
  margin-bottom: 20px;
}
.create-group-section h3 {
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
.group-image-upload {
  background: rgba(240, 147, 251, 0.2);
  border: 2px dashed rgba(240, 147, 251, 0.4);
  border-radius: 12px;
  padding: 12px;
  text-align: center;
  cursor: pointer;
  color: #f093fb;
  transition: all 0.3s ease;
}
/* Animations */
.slide-up-enter-active, 
.slide-up-leave-active {
  transition: transform 0.3s ease;
}
.slide-up-enter-from, 
.slide-up-leave-to {
  transform: translateY(100%);
}
.typed-highlight {
  margin-top: 14px;
  color: red;
}
.typed-highlight .trigger {
  color: #007bff;
}
</style>


















	




