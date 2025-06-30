<template>
  <div>
    <!-- Floating Bolt Button -->
    <div class="floating-circle" @click="togglePanel">
      <i class="fas fa-bolt"></i>
    </div>

    <!-- Slide-up Fullscreen Panel -->
    <transition name="slide-up">
      <div v-if="showPanel" class="floating-panel">
        <div class="panel-header">
          <h2>Upload Section</h2>
          <button class="close-btn" @click="togglePanel">&times;</button>
        </div>
        <div class="panel-content">
          <!-- Post Input Form -->
          <div class="post-input">
            <div class="textarea-wrapper">
              <textarea v-model="postText" id="postText" placeholder="What's your opinion?"></textarea>
              <label for="file-input" class="file-upload-icon">
                <i class="fas fa-image"></i>
              </label>
            </div>
            <input
              type="file"
              id="file-input"
              accept="image/*"
              @change="handleImageUpload"
              ref="fileInput"
              hidden
            />
            <img
              v-if="imagePreview"
              :src="imagePreview"
              id="image-preview"
              alt="Image Preview"
            />
            <button id="submitBtn" @click="postOpinion">Post Opinion</button>
          </div>
        </div>
      </div>
    </transition>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import Ably from 'ably';

// Reactive state
const showPanel = ref(false)
const postText = ref('')
const imagePreview = ref(null)
const imageData = ref(null)
const uploadedImage = ref(null)
const fileInput = ref(null)
const lastSentPostId = ref(null)

// User info
const loggedInUsername = ref(localStorage.getItem('username') || '')
const userId = ref(localStorage.getItem('userId') || '')
const profilePic = ref(localStorage.getItem('profilePic') || '')
const sessionId = ref(localStorage.getItem('sessionId') || '')

// Ably setup
  const ably = new Ably.Realtime('eCkrsA.JzcmYQ:JLywAltPtm-KWD6Rd0MItQRgi-I4R7zn6BpI1UVQ3Eg'); 
const channel = ably.channels.get('posts-channel')

// Toggle panel visibility
function togglePanel() {
  showPanel.value = !showPanel.value
}

// Handle image upload and resizing
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
      showNotification('Error processing image.', true)
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

// Convert Blob to Base64 string
function blobToBase64(blob) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onloadend = () => resolve(reader.result)
    reader.onerror = reject
    reader.readAsDataURL(blob)
  })
}

// Dummy showNotification - replace with your app’s notification system
function showNotification(message, isError = false) {
  alert((isError ? 'Error: ' : '') + message)
}

// Post opinion submission
async function postOpinion() {
  if (!sessionId.value || !loggedInUsername.value) {
    showNotification('Error: Session ID and Username are required', true)
    return
  }
  if (!postText.value && !imageData.value) {
    showNotification('Post content cannot be empty!', true)
    return
  }

  const postData = {
    message: postText.value,
    username: loggedInUsername.value,
    sessionId: sessionId.value,
    userId: userId.value,
    profilePic: profilePic.value,
    photo: imageData.value,
  }

  try {
    const response = await fetch('https://sports321.vercel.app/api/postOpinion', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json',
      },
      credentials: 'include',
      body: JSON.stringify(postData),
    })

    if (!response.ok) throw new Error('Failed to submit post')

    const newPost = await response.json()
    lastSentPostId.value = newPost._id
    // Call your method to add post to feed if exists
    // addPostToFeed(newPost, true)
    showNotification('Post submitted successfully!', false)
    channel.publish('newOpinion', newPost)
    resetForm()

    // Optional: push notifications call
    await fetch('https://2damnit.vercel.app/api/notifications', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'send-push-notification' }),
    })
  } catch (error) {
    showNotification('Error submitting post: ' + error.message, true)
  }
}

// Reset form after submit
function resetForm() {
  postText.value = ''
  imagePreview.value = null
  imageData.value = null
  uploadedImage.value = null
  if (fileInput.value) fileInput.value.value = ''
}

// Listen to real-time new opinions
onMounted(() => {
  channel.subscribe('newOpinion', (message) => {
    const incomingPost = message.data
    if (incomingPost?._id && incomingPost._id !== lastSentPostId.value) {
      showNotification('New post added!', false)
      // addPostToFeed(incomingPost, true)
    }
  })
})
</script>

<style scoped>
.floating-circle {
  position: fixed;
  margin-bottom: 12%;
  bottom: 70px;
  right: 20px;
  width: 48px;
  height: 48px;
  background-color: #0d6efd;
  color: white;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: 0 4px 10px rgba(0, 0, 0, 0.25);
  z-index: 21;
  cursor: pointer;
  transition: transform 0.3s ease;
}
.floating-circle:hover {
  transform: scale(1.1);
}
.floating-panel {
  position: fixed;
  bottom: 8%;
  right: 0%;
  left: 0%;
  top: 8.5%;
  background-color: #000;
  z-index: 6;
  box-shadow: 0 -4px 10px rgba(0, 0, 0, 0.15);
  padding: 20px;
  display: flex;
  flex-direction: column;
}
.panel-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}
.close-btn {
  font-size: 24px;
  border: none;
  background: none;
  cursor: pointer;
}
.panel-content {
  margin-top: 20px;
  overflow-y: auto;
  flex-grow: 1;
}
/* Simple slide-up transition */
.slide-up-enter-active, .slide-up-leave-active {
  transition: transform 0.3s ease;
}
.slide-up-enter-from, .slide-up-leave-to {
  transform: translateY(100%);
}
.textarea-wrapper {
  position: relative;
  width: 100%;
}

#postText {
  width: 100%;
  padding-right: 40px; /* Make space for icon */
  box-sizing: border-box;
  resize: vertical;
  min-height: 80px;
}
/* Post Input Form */
.post-input {
  margin-bottom: 20px;
}
.post-input {
  margin-bottom: 20px;
  background: #000;
  padding: 20px;
  border-radius: 20px; /* More rounded corners */
  color: #fff;
  font-family: sans-serif;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3); /* Optional: for a softer UI */
  border: 1px solid #333; /* Optional: for a subtle border */
}

/* Optional: If there are input or textarea fields inside */
.post-input input,
.post-input textarea {
  width: 100%;
  padding: 12px 16px;
  border-radius: 15px;
  border: none;
  outline: none;
  background: #111;
  color: #fff;
  font-size: 1rem;
}

</style>
