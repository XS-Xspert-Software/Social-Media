<template>
  <div class="shorts-feed">
    <!-- Upload Button -->
    <div v-if="!fullscreenIndex && fullscreenIndex !== 0" class="upload-fab" @click="currentView = 'upload'">
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
        <line x1="12" y1="5" x2="12" y2="19"/>
        <line x1="5" y1="12" x2="19" y2="12"/>
      </svg>
    </div>

    <!-- Upload View -->
    <div v-if="currentView === 'upload'" class="upload-view">
      <div class="upload-header">
        <button @click="currentView = 'feed'" class="back-btn">←</button>
        <h1>Create Short</h1>
      </div>

      <div class="upload-content">
        <label class="file-upload-area" :class="{'has-file': selectedFile}">
          <input type="file" @change="handleFileSelect" accept="video/*" hidden/>
          
          <div v-if="!selectedFile" class="upload-placeholder">
            <div class="upload-icon">
              <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
                <polyline points="17 8 12 3 7 8"/>
                <line x1="12" y1="3" x2="12" y2="15"/>
              </svg>
            </div>
            <p class="upload-text">Tap to select video</p>
            <p class="upload-hint">MP4, MOV, AVI up to 100MB</p>
          </div>

          <video v-else :src="previewUrl" controls class="preview-video"/>
        </label>

        <div class="form-inputs">
          <div class="input-group">
            <input 
              v-model="uploadForm.title" 
              type="text" 
              placeholder="Add a catchy title..."
              class="custom-input"
              maxlength="100"
            />
            <span class="char-count">{{ uploadForm.title.length }}/100</span>
          </div>

          <div class="input-group">
            <textarea 
              v-model="uploadForm.description" 
              placeholder="Tell viewers about your video..."
              class="custom-textarea"
              maxlength="500"
              rows="4"
            />
            <span class="char-count">{{ uploadForm.description.length }}/500</span>
          </div>

          <div class="input-group">
            <input
              v-model="uploadForm.hashtags"
              type="text"
              placeholder="Add hashtags (comma or space separated)"
              class="custom-input"
              maxlength="100"
              required
            />
            <span class="char-count">At least 1 hashtag required</span>
          </div>

          <button 
            @click="uploadShort" 
            :disabled="!selectedFile || uploading"
            class="upload-submit-btn"
          >
            <span v-if="!uploading">Post</span>
            <span v-else>
              <span class="spinner"></span>
              Uploading...
            </span>
          </button>

          <div v-if="uploadProgress > 0" class="progress-container">
            <div class="progress-bar">
              <div class="progress-fill" :style="{width: uploadProgress + '%'}"/>
            </div>
            <span class="progress-text">{{ uploadProgress }}%</span>
          </div>

          <div v-if="uploadMessage" :class="['upload-message', uploadError ? 'error' : 'success']">
            {{ uploadMessage }}
          </div>
        </div>
      </div>
    </div>

    <!-- Grid View -->
    <div v-if="!fullscreenIndex && fullscreenIndex !== 0 && currentView === 'feed'" class="grid-view">
      <button class="profile-feed-btn" @click="loadMyShorts">My Feed</button>
      <div 
        v-for="(short, index) in shorts" 
        :key="short.id"
        @click="openFullscreen(index)"
        class="grid-item"
      >
        <video :src="short.videoUrl" class="grid-video" />
        <div class="grid-overlay">
          <div class="grid-stats">
            <span>❤️ {{ formatCount(short.hearts) }}</span>
            <span>👁️ {{ formatCount(short.views) }}</span>
          </div>
        </div>
      </div>
    </div>

    <!-- Fullscreen View -->
    <div v-if="fullscreenIndex !== null" class="fullscreen-view">
      <div class="fullscreen-container">
        <div class="video-flex-row">
          <div class="video-flex-main" ref="container">
            <video
              ref="video"
              :src="shorts[fullscreenIndex].videoUrl"
              class="fullscreen-video"
              loop
              autoplay
              playsinline
              @click="togglePlay"
            />
            <!-- Preload next 3 videos for instant navigation -->
            <template v-for="i in [1,2,3]" :key="i">
              <video
                v-if="shorts[fullscreenIndex + i]"
                :src="shorts[fullscreenIndex + i].videoUrl"
                preload="auto"
                style="display:none;"
              />
            </template>

            <button @click="closeFullscreen" class="close-btn">✕</button>

            <div class="video-info">
              <p class="username">@{{ shorts[fullscreenIndex].userId }}</p>
              <h3>{{ shorts[fullscreenIndex].title }}</h3>
              <p class="description">{{ shorts[fullscreenIndex].description }}</p>
            </div>

            <div class="swipe-controls">
              <button 
                v-if="fullscreenIndex > 0"
                @click="prevVideo" 
                class="swipe-arrow"
              >
                ↑
              </button>
              <button 
                v-if="fullscreenIndex < shorts.length - 1"
                @click="nextVideo" 
                class="swipe-arrow"
              >
                ↓
              </button>
            </div>

            <!-- Comments Drawer -->
            <div v-if="showComments" class="comments-drawer" @click.stop>
              <div class="comments-header">
                <div class="title">Comments</div>
                <button class="close-comments" @click="closeComments">✕</button>
              </div>
              <div class="comments-body" ref="commentsBody">
                <div v-if="commentsLoading" class="comments-loading">Loading…</div>
                <div v-else>
                  <div v-if="comments.length === 0" class="comments-empty">Be the first to comment.</div>
                  <div v-for="c in comments" :key="c.id" class="comment-item">
                    <div class="avatar tiny">{{ (c.authorId || 'U')[0].toUpperCase() }}</div>
                    <div class="comment-content">
                      <div class="meta">
                        <span class="user">@{{ c.authorId?.slice(0,6) || 'user' }}</span>
                        <span class="dot">•</span>
                        <span class="time">{{ formatDate(c.createdAt) }}</span>
                      </div>
                      <div class="text">{{ c.content }}</div>
                    </div>
                  </div>
                </div>
              </div>
              <div class="comments-input">
                <input
                  v-model="newComment"
                  type="text"
                  placeholder="Write a comment…"
                  @keyup.enter="submitComment"
                />
                <button class="send-btn glass-btn" :disabled="!newComment.trim()" @click="submitComment">Send</button>
              </div>
            </div>
          </div>
          <div class="video-flex-side">
            <div class="video-actions">
              <div class="action-group">
                <button class="action-btn glass-btn" @click="likeShort">
                  <span class="icon">❤️</span>
                </button>
                <span class="action-label">{{ formatCount(shorts[fullscreenIndex].hearts) }}</span>
              </div>

              <div class="action-group">
                <button class="action-btn glass-btn" @click="openComments(shorts[fullscreenIndex].id)">
                  <span class="icon">💬</span>
                </button>
                <span class="action-label">{{ formatCount(shorts[fullscreenIndex].comments) }}</span>
              </div>

              <div class="action-group">
                <button class="action-btn glass-btn" @click="shareShort(shorts[fullscreenIndex].id)">
                  <span class="icon">🔗</span>
                </button>
                <span class="action-label">Share</span>
              </div>
              <div class="avatar">{{ shorts[fullscreenIndex].userId[0].toUpperCase() }}</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
export default {
  name: 'ShortsApp',
  data() {
    return {
      // Videos service base URL (remote) - per request, use chyna backend for shorts
      API_URL: 'https://chyna.vercel.app/api',
      userId: '20',
      currentView: 'feed',
      shorts: [],
      loading: false,
      currentIndex: 0,
      fullscreenIndex: null,
  showComments: false,
  comments: [],
  commentsLoading: false,
  newComment: '',
      uploadForm: {
        title: '',
        description: '',
        hashtags: '' // comma or space separated
      },
      selectedFile: null,
      previewUrl: null,
      uploading: false,
      uploadProgress: 0,
      uploadMessage: '',
      uploadError: false,
      wheelTimeout: null, // Moved from methods to data
      lastWheelTime: 0,   // Moved from methods to data
      // Touch swipe state and handlers for mobile navigation
      _touchStartY: 0,
      _touchStartX: 0,
      _touching: false,
      _touchHandlers: null,
    };
  },

  mounted() {
    this.loadShorts();
    this.setupSwipeGestures();
    // Keyboard/mouse navigation for shorts
    window.addEventListener('keydown', this.handleKeydown);
    window.addEventListener('wheel', this.handleWheel, { passive: false });
  },
  watch: {
    fullscreenIndex(val) {
      // Only enable navigation when in fullscreen
      if (val !== null && val !== undefined) {
        window.addEventListener('keydown', this.handleKeydown);
        window.addEventListener('wheel', this.handleWheel, { passive: false });
        // Attach swipe listeners after DOM updates so ref exists
        this.$nextTick(() => {
          this.setupSwipeGestures();
        });
      } else {
        window.removeEventListener('keydown', this.handleKeydown);
        window.removeEventListener('wheel', this.handleWheel);
        this.teardownSwipeGestures();
      }
    }
  },

  methods: {
    formatCount(num) {
      if (num >= 1000000) return (num / 1000000).toFixed(1) + 'M';
      if (num >= 1000) return (num / 1000).toFixed(1) + 'K';
      return num;
    },

    openFullscreen(index) {
      this.fullscreenIndex = index;
    },

    closeFullscreen() {
      this.fullscreenIndex = null;
      // Remove navigation listeners
      window.removeEventListener('keydown', this.handleKeydown);
      window.removeEventListener('wheel', this.handleWheel);
    },

    handleKeydown(e) {
      if (this.fullscreenIndex === null || this.fullscreenIndex === undefined) return;
      if (e.key === 'ArrowUp') {
        this.prevVideo();
        e.preventDefault();
      } else if (e.key === 'ArrowDown') {
        this.nextVideo();
        e.preventDefault();
      }
    },

    handleWheel(e) {
      if (this.fullscreenIndex === null || this.fullscreenIndex === undefined) return;
      const now = Date.now();
      if (now - this.lastWheelTime < 350) return; // debounce
      this.lastWheelTime = now;
      if (e.deltaY > 0) {
        this.nextVideo();
      } else if (e.deltaY < 0) {
        this.prevVideo();
      }
      e.preventDefault();
    },

    togglePlay() {
      const video = this.$refs.video;
      if (video) {
        if (video.paused) {
          video.play();
        } else {
          video.pause();
        }
      }
    },

    async likeShort() {
      const short = this.shorts[this.fullscreenIndex];
      if (!short) return;
      try {
        // Optimistic UI update
        short.hearts = (short.hearts || 0) + 1;
        const res = await fetch(`${this.API_URL}/posts/${short.id}/like`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ userId: this.userId })
        });
        const data = await res.json();
        if (!data.success) {
          short.hearts = (short.hearts || 1) - 1;
          alert(data.error || 'Failed to like');
        }
      } catch (e) {
        short.hearts = (short.hearts || 1) - 1;
        alert('Failed to like: ' + e.message);
      }
    },

    nextVideo() {
      if (this.fullscreenIndex < this.shorts.length - 1) {
        this.fullscreenIndex++;
      }
    },

    prevVideo() {
      if (this.fullscreenIndex > 0) {
        this.fullscreenIndex--;
      }
    },

    async loadShorts() {
      this.loading = true;
      this.currentView = 'feed';
      this.currentIndex = 0;
      
      try {
  const response = await fetch(`${this.API_URL}/shorts`);
        const data = await response.json();
        
        if (data.success) {
          this.shorts = data.shorts;
        }
      } catch (error) {
        console.error('Error loading shorts:', error);
      } finally {
        this.loading = false;
      }
    },

    async loadMyShorts() {
      this.loading = true;
      // If user is guest (id 20), show random posts from all users
      if (this.userId === '20') {
        this.currentView = 'feed';
        this.currentIndex = 0;
        try {
          const response = await fetch(`${this.API_URL}/shorts`);
          const data = await response.json();
          if (data.success) {
            // Shuffle posts for randomness
            this.shorts = data.shorts.sort(() => Math.random() - 0.5);
          }
        } catch (error) {
          console.error('Error loading shorts:', error);
        } finally {
          this.loading = false;
        }
        return;
      }
      this.currentView = 'profile';
      this.currentIndex = 0;
      
      try {
        const response = await fetch(`${this.API_URL}/shorts?userId=${this.userId}`);
        const data = await response.json();
        
        if (data.success) {
          this.shorts = data.shorts;
        }
      } catch (error) {
        console.error('Error loading shorts:', error);
      } finally {
        this.loading = false;
      }
    },

    setupSwipeGestures() {
      const container = this.$refs.container;
      if (!container) return;
      // Avoid double-binding
      if (this._touchHandlers) return;

      // Ensure vertical pan works smoothly and doesn't trigger browser back/forward gestures
      try { container.style.touchAction = 'pan-y'; } catch {}

      const onStart = (e) => {
        if (this.fullscreenIndex === null || this.fullscreenIndex === undefined) return;
        const t = e.touches && e.touches[0];
        if (!t) return;
        this._touchStartY = t.clientY;
        this._touchStartX = t.clientX;
        this._touching = true;
      };

      const onMove = (e) => {
        // Optional: could add feedback; prevent accidental horizontal page scroll if mostly vertical
        if (!this._touching) return;
        const t = e.touches && e.touches[0];
        if (!t) return;
        const dy = Math.abs(t.clientY - this._touchStartY);
        const dx = Math.abs(t.clientX - this._touchStartX);
        if (dy > dx) {
          // Primarily vertical gesture; prevent scroll bounce
          e.preventDefault();
        }
      };

      const onEnd = (e) => {
        if (!this._touching) return;
        this._touching = false;
        const t = e.changedTouches && e.changedTouches[0];
        if (!t) return;
        const diffY = this._touchStartY - t.clientY;
        const diffX = this._touchStartX - t.clientX;
        // Require vertical dominance and threshold
        if (Math.abs(diffY) > 50 && Math.abs(diffY) > Math.abs(diffX) * 1.2) {
          if (diffY > 0) this.nextVideo();
          else this.prevVideo();
        }
      };

      container.addEventListener('touchstart', onStart, { passive: true });
      container.addEventListener('touchmove', onMove, { passive: false });
      container.addEventListener('touchend', onEnd, { passive: true });

      this._touchHandlers = { onStart, onMove, onEnd };
    },

    teardownSwipeGestures() {
      const container = this.$refs.container;
      if (!container || !this._touchHandlers) return;
      const { onStart, onMove, onEnd } = this._touchHandlers;
      container.removeEventListener('touchstart', onStart);
      container.removeEventListener('touchmove', onMove);
      container.removeEventListener('touchend', onEnd);
      this._touchHandlers = null;
    },

    handleFileSelect(event) {
      const file = event.target.files[0];
      if (file) {
        this.selectedFile = file;
        this.previewUrl = URL.createObjectURL(file);
        this.uploadMessage = '';
      }
    },

    async uploadShort() {
      if (!this.selectedFile || !this.userId) return;

      // Validate hashtags
      const hashtagsArr = (this.uploadForm.hashtags || '').split(/[ ,]+/).map(h => h.trim()).filter(Boolean);
      if (hashtagsArr.length < 1) {
        this.uploadError = true;
        this.uploadMessage = 'Please enter at least one hashtag.';
        return;
      }

      this.uploading = true;
      this.uploadProgress = 0;
      this.uploadMessage = '';
      this.uploadError = false;

      try {
        const file = this.selectedFile;

        this.uploadProgress = 10;
        this.uploadMessage = 'Preparing upload...';

        const presignRes = await fetch(`${this.API_URL}/upload`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            filename: file.name,
            contentType: file.type,
            userId: this.userId
          })
        });

        if (!presignRes.ok) throw new Error('Failed to get upload URL');

        const { uploadUrl, uploadToken, key, contentType } = await presignRes.json();
        if (!uploadUrl || !uploadToken) throw new Error('No upload credentials');

        this.uploadProgress = 20;
        this.uploadMessage = 'Uploading video...';

        const fileBuffer = await file.arrayBuffer();
        const sha1Hash = await this.calculateSHA1(fileBuffer);

        const uploadResp = await fetch(uploadUrl, {
          method: 'POST',
          headers: {
            'Authorization': uploadToken,
            'X-Bz-File-Name': encodeURIComponent(key),
            'Content-Type': contentType,
            'Content-Length': file.size.toString(),
            'X-Bz-Content-Sha1': sha1Hash
          },
          body: file
        });

        if (!uploadResp.ok) throw new Error(`Upload failed: ${uploadResp.status}`);

        this.uploadProgress = 60;
        this.uploadMessage = 'Processing...';

        const metaRes = await fetch(`${this.API_URL}/saveMetadata`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            key,
            userId: this.userId,
            title: this.uploadForm.title || 'Untitled',
            description: this.uploadForm.description || '',
            hashtags: hashtagsArr
          })
        });

        const metaData = await metaRes.json();

        if (metaData.success) {
          this.uploadMessage = 'Posted successfully!';
          this.uploadProgress = 100;

          setTimeout(() => {
            this.uploadForm.title = '';
            this.uploadForm.description = '';
            this.uploadForm.hashtags = '';
            this.selectedFile = null;
            this.previewUrl = null;
            this.uploadProgress = 0;
            this.uploadMessage = '';
            this.loadShorts();
          }, 1500);
        } else {
          this.uploadError = true;
          this.uploadMessage = metaData.error || 'Failed to save';
        }
      } catch (error) {
        console.error('Upload error:', error);
        this.uploadError = true;
        this.uploadMessage = 'Upload failed: ' + error.message;
      } finally {
        this.uploading = false;
      }
    },

    async calculateSHA1(arrayBuffer) {
      const hashBuffer = await crypto.subtle.digest('SHA-1', arrayBuffer);
      const hashArray = Array.from(new Uint8Array(hashBuffer));
      return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
    },

    async deleteShort(id) {
      if (!confirm('Delete this short?')) return;
      
      try {
        const response = await fetch(`${this.API_URL}/delete`, {
          method: 'DELETE',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ id, userId: this.userId })
        });
        
        const data = await response.json();
        
        if (data.success) {
          this.shorts = this.shorts.filter(s => s.id !== id);
          if (this.currentIndex >= this.shorts.length) {
            this.currentIndex = Math.max(0, this.shorts.length - 1);
          }
        } else {
          alert('Failed to delete');
        }
      } catch (error) {
        console.error('Error deleting:', error);
      }
    },

    async openComments(postId) {
      this.showComments = true;
      this.commentsLoading = true;
      this.comments = [];
      try {
        const res = await fetch(`${this.API_URL}/comments?postId=${encodeURIComponent(postId)}`);
        const data = await res.json();
        if (data.success) {
          this.comments = Array.isArray(data.comments) ? data.comments : [];
        }
      } catch (e) {
        console.error('Failed to load comments', e);
      } finally {
        this.commentsLoading = false;
        this.$nextTick(() => {
          const el = this.$refs.commentsBody;
          if (el && typeof el.scrollHeight === 'number') {
            el.scrollTop = el.scrollHeight;
          }
        });
      }
    },

    closeComments() {
      this.showComments = false;
      this.newComment = '';
    },

    async submitComment() {
      if (!this.newComment.trim()) return;
      const post = this.shorts[this.fullscreenIndex];
      if (!post) return;
      const optimistic = {
        id: 'tmp-' + Date.now(),
        postId: post.id,
        authorId: this.userId,
        content: this.newComment.trim(),
        createdAt: new Date().toISOString(),
      };
      // Optimistic UI
      this.comments.push(optimistic);
      post.comments = (post.comments || 0) + 1;
      const toSend = this.newComment.trim();
      this.newComment = '';
      try {
        const res = await fetch(`${this.API_URL}/comments`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ postId: post.id, authorId: this.userId, content: toSend })
        });
        const data = await res.json();
        if (data.success && data.comment) {
          // replace optimistic with actual
          const idx = this.comments.findIndex(c => c.id === optimistic.id);
          if (idx !== -1) this.comments.splice(idx, 1, data.comment);
        }
      } catch (e) {
        console.error('Failed to comment', e);
      }
      this.$nextTick(() => {
        const el = this.$refs.commentsBody;
        if (el && typeof el.scrollHeight === 'number') {
          el.scrollTop = el.scrollHeight;
        }
      });
    },

    async shareShort(id) {
      const short = this.shorts.find(s => s.id === id);
      const shareUrl = window.location.origin + '/short/' + id;
      if (navigator.share) {
        try {
          await navigator.share({
            title: short?.title || 'Short',
            text: short?.description || '',
            url: shareUrl
          });
        } catch (e) {
          // User cancelled or error
        }
      } else {
        try {
          await navigator.clipboard.writeText(shareUrl);
          alert('Link copied to clipboard!');
        } catch {
          alert('Could not copy link');
        }
      }
    },

    formatDate(dateString) {
      const date = new Date(dateString);
      const now = new Date();
      const diff = now - date;
      
      const minutes = Math.floor(diff / 60000);
      const hours = Math.floor(diff / 3600000);
      const days = Math.floor(diff / 86400000);
      
      if (minutes < 1) return 'Just now';
      if (minutes < 60) return `${minutes}m ago`;
      if (hours < 24) return `${hours}h ago`;
      if (days < 7) return `${days}d ago`;
      return date.toLocaleDateString();
    }
  }
};
</script>

<style scoped>
.shorts-feed {
  min-height: 100vh;
  color: #fff;
}

/* Glassmorphic Shorts Action Buttons */
.action-btn {
  width: 56px;
  height: 56px;
  border-radius: 50%;
  font-size: 22px;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  margin-bottom: 12px;
  border: none;
  background: none;
  transition: all 0.4s cubic-bezier(.16,1,.3,1);
}

.glass-btn {
  background: linear-gradient(135deg, rgba(34,40,60,0.45) 0%, rgba(80,120,255,0.18) 100%);
  border: 2px solid rgba(255,255,255,0.25);
  color: #e8eefc;
  box-shadow: 0 8px 32px 0 rgba(31, 38, 135, 0.22), 0 1.5px 4px 0 rgba(30,40,60,0.10);
  backdrop-filter: blur(32px) saturate(180%);
  -webkit-backdrop-filter: blur(32px) saturate(180%);
  position: relative;
  overflow: hidden;
}
.glass-btn::before {
  content: "";
  position: absolute;
  inset: 0;
  border-radius: inherit;
  pointer-events: none;
  background: linear-gradient(120deg,rgba(255,255,255,0.25) 0%,rgba(255,255,255,0.08) 100%);
  z-index: 0;
}
.glass-btn::after {
  content: "";
  position: absolute;
  left: 14px; top: 10px;
  width: 50%; height: 20px;
  background: linear-gradient(90deg,rgba(255,255,255,0.4) 0%,rgba(255,255,255,0.05) 100%);
  border-radius: 12px;
  filter: blur(14px);
  opacity: 0.6;
  pointer-events: none;
  z-index: 1;
}
.glass-btn:hover {
  background: linear-gradient(135deg, rgba(34,44,74,0.65) 0%, rgba(80,120,255,0.28) 100%);
  box-shadow: 0 12px 40px 0 rgba(31, 38, 135, 0.35), 0 2px 6px 0 rgba(30,40,60,0.15);
  transform: scale(1.1) translateY(-2px);
  border-color: rgba(255,255,255,0.35);
}
.glass-btn:active {
  transform: scale(0.95);
  box-shadow: 0 4px 16px 0 rgba(31, 38, 135, 0.20);
}
.glass-btn .icon {
  font-size: 24px;
  filter: drop-shadow(0 2px 4px rgba(0,0,0,0.3));
  line-height: 1;
  display: inline-flex;
  align-items: center;
  justify-content: center;
}

/* Action buttons layout (button + label) */
.action-group {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 6px;
}

.action-label {
  font-size: 12px;
  color: rgba(255,255,255,0.9);
  text-shadow: 0 1px 2px rgba(0,0,0,0.4);
  user-select: none;
}

/* Minimal avatar chip on the action rail */
.avatar {
  width: 44px;
  height: 44px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgba(24, 32, 54, 0.65);
  border: 1.5px solid rgba(255,255,255,0.25);
  color: #e8eefc;
  font-weight: 700;
  margin-top: 8px;
  box-shadow: 0 4px 18px 0 rgba(31, 38, 135, 0.15);
  backdrop-filter: blur(12px) saturate(160%);
  -webkit-backdrop-filter: blur(12px) saturate(160%);
}

/* Upload FAB */
.upload-fab {
  position: fixed;
  bottom: 80px;
  right: 20px;
  width: 51px;
  height: 51px;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  box-shadow: 0 4px 20px rgba(102, 126, 234, 0.5);
  z-index: 100;
  transition: all 0.3s cubic-bezier(.16,1,.3,1);
  animation: gentle-bounce 2s ease-in-out infinite;
}

.upload-fab:hover {
  transform: scale(1.15) rotate(90deg);
  box-shadow: 0 6px 30px rgba(102, 126, 234, 0.7);
  animation: none;
}

@keyframes gentle-bounce {
  0%, 100% { transform: translateY(0); }
  50% { transform: translateY(-8px); }
}

/* Upload View */
.upload-view {
  position: fixed;
  inset: 0;
  background: #000;
  z-index: 999;
  overflow-y: auto;
}

.upload-header {
  display: flex;
  align-items: center;
  gap: 16px;
  padding: 16px;
  border-bottom: 1px solid rgba(255,255,255,0.1);
}

.back-btn {
  background: rgba(24, 32, 54, 0.55);
  border: 1.5px solid rgba(255,255,255,0.18);
  color: #e8eefc;
  font-size: 22px;
  border-radius: 14px;
  cursor: pointer;
  padding: 7px 16px;
  box-shadow: 0 4px 18px 0 rgba(31, 38, 135, 0.10);
  backdrop-filter: blur(14px) saturate(160%);
  -webkit-backdrop-filter: blur(14px) saturate(160%);
  transition: box-shadow 0.2s, background 0.2s;
}

.upload-header h1 {
  font-size: 20px;
  margin: 0;
}

.upload-content {
  padding: 20px;
  max-width: 600px;
  margin: 0 auto;
}

.file-upload-area {
  display: block;
  border: 2px dashed rgba(255,255,255,0.3);
  border-radius: 12px;
  padding: 40px;
  text-align: center;
  cursor: pointer;
  margin-bottom: 20px;
  transition: border-color 0.2s;
}

.file-upload-area:hover {
  border-color: rgba(255,255,255,0.5);
}

.upload-icon {
  margin-bottom: 16px;
  opacity: 0.7;
}

.upload-text {
  font-size: 16px;
  margin-bottom: 8px;
}

.upload-hint {
  font-size: 14px;
  opacity: 0.6;
}

.preview-video {
  width: 100%;
  max-height: 400px;
  border-radius: 8px;
}

.form-inputs {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.input-group {
  position: relative;
}

.custom-input,
.custom-textarea {
  width: 100%;
  background: rgba(255,255,255,0.1);
  border: 1px solid rgba(255,255,255,0.2);
  border-radius: 8px;
  padding: 12px;
  color: #fff;
  font-size: 14px;
}

.custom-textarea {
  resize: vertical;
  font-family: inherit;
}

.char-count {
  position: absolute;
  bottom: 8px;
  right: 12px;
  font-size: 12px;
  opacity: 0.5;
}

.upload-submit-btn {
  background: rgba(24, 32, 54, 0.55);
  border: 1.5px solid rgba(255,255,255,0.18);
  color: #e8eefc;
  padding: 12px 24px;
  border-radius: 16px;
  font-size: 16px;
  font-weight: 600;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  box-shadow: 0 4px 18px 0 rgba(31, 38, 135, 0.10);
  backdrop-filter: blur(14px) saturate(160%);
  -webkit-backdrop-filter: blur(14px) saturate(160%);
  transition: box-shadow 0.2s, background 0.2s;
}

.upload-submit-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.spinner {
  width: 16px;
  height: 16px;
  border: 2px solid rgba(255,255,255,0.3);
  border-top-color: #fff;
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

.progress-container {
  display: flex;
  align-items: center;
  gap: 12px;
}

.progress-bar {
  flex: 1;
  height: 8px;
  background: rgba(255,255,255,0.1);
  border-radius: 4px;
  overflow: hidden;
}

.progress-fill {
  height: 100%;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  transition: width 0.3s;
}

.progress-text {
  font-size: 12px;
  min-width: 40px;
}

.upload-message {
  padding: 12px;
  border-radius: 8px;
  text-align: center;
  font-size: 14px;
}

.upload-message.success {
  background: rgba(34, 197, 94, 0.2);
  border: 1px solid rgba(34, 197, 94, 0.4);
}

.upload-message.error {
  background: rgba(239, 68, 68, 0.2);
  border: 1px solid rgba(239, 68, 68, 0.4);
}

/* Grid View */
.grid-view {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 8px;
  padding: 8px;
}

.grid-item {
  position: relative;
  aspect-ratio: 9/16;
  cursor: pointer;
  overflow: hidden;
  border-radius: 16px;
  transition: all 0.3s cubic-bezier(.16,1,.3,1);
  animation: float-up 0.6s cubic-bezier(.16,1,.3,1) backwards;
}

.grid-item:nth-child(n) {
  animation-delay: calc(0.1s * (var(--i, 0)));
}

@keyframes float-up {
  0% { transform: translateY(20px); opacity: 0; }
  100% { transform: translateY(0); opacity: 1; }
}

.grid-item:hover {
  transform: translateY(-8px) scale(1.02);
  box-shadow: 0 12px 30px rgba(0,0,0,0.6);
}

.grid-video {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.grid-overlay {
  position: absolute;
  inset: 0;
  background: linear-gradient(to top, rgba(0,0,0,0.9), transparent 60%);
  display: flex;
  align-items: flex-end;
  padding: 12px;
  opacity: 0;
  transition: all 0.3s cubic-bezier(.16,1,.3,1);
}

.grid-item:hover .grid-overlay {
  opacity: 1;
  backdrop-filter: blur(4px);
  -webkit-backdrop-filter: blur(4px);
}

.grid-stats {
  display: flex;
  gap: 12px;
  font-size: 13px;
}

/* Fullscreen View */
.fullscreen-view {
  position: fixed;
  inset: 0;
  background: #000;
  z-index: 1000;
}

.fullscreen-container {
  position: relative;
  width: 100vw;
  height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
}

.video-flex-row {
  display: flex;
  flex-direction: row;
  width: 100vw;
  height: 100vh;
}

.video-flex-main {
  flex: 1 1 auto;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  position: relative;
}

.fullscreen-video {
  width: 100%;
  height: 100%;
  max-width: 480px;
  max-height: 100vh;
  object-fit: contain;
  background: #000;
  z-index: 1;
}

.video-flex-side {
  width: 90px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: transparent;
  z-index: 2;
}

.video-actions {
  position: static;
  display: flex;
  flex-direction: column;
  gap: 20px;
  align-items: center;
  justify-content: center;
  height: 60vh;
}

.close-btn {
  position: absolute;
  top: calc(env(safe-area-inset-top, 0px) + 16px);
  left: calc(env(safe-area-inset-left, 0px) + 16px);
  background: rgba(24, 32, 54, 0.65);
  border: 2px solid rgba(255,255,255,0.25);
  color: #e8eefc;
  font-size: 22px;
  width: 44px;
  height: 44px;
  border-radius: 50%;
  cursor: pointer;
  z-index: 10;
  box-shadow: 0 4px 18px 0 rgba(31, 38, 135, 0.15);
  backdrop-filter: blur(20px) saturate(170%);
  -webkit-backdrop-filter: blur(20px) saturate(170%);
  transition: all 0.3s cubic-bezier(.16,1,.3,1);
  display: flex;
  align-items: center;
  justify-content: center;
  line-height: 1;
}

.close-btn:hover {
  background: rgba(24, 32, 54, 0.85);
  transform: scale(1.1) rotate(90deg);
  box-shadow: 0 6px 24px 0 rgba(31, 38, 135, 0.25);
}

.video-info {
  position: absolute;
  left: 16px;
  bottom: 80px;
  right: 100px;
  animation: slide-in 0.5s cubic-bezier(.16,1,.3,1);
}

@keyframes slide-in {
  0% { transform: translateY(20px); opacity: 0; }
  100% { transform: translateY(0); opacity: 1; }
}

.username {
  font-size: 15px;
  font-weight: 700;
  margin-bottom: 6px;
  text-shadow: 0 2px 8px rgba(0,0,0,0.5);
}

.video-info h3 {
  font-size: 17px;
  margin-bottom: 6px;
  font-weight: 600;
  text-shadow: 0 2px 8px rgba(0,0,0,0.5);
}

.description {
  font-size: 14px;
  opacity: 0.95;
  line-height: 1.4;
  text-shadow: 0 1px 4px rgba(0,0,0,0.6);
}

.swipe-controls {
  position: absolute;
  right: 16px;
  top: 50%;
  transform: translateY(-50%);
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.swipe-arrow {
  background: linear-gradient(135deg, rgba(34,40,60,0.45) 0%, rgba(80,120,255,0.18) 100%);
  border: 2px solid rgba(255,255,255,0.25);
  color: #fff;
  width: 48px;
  height: 48px;
  border-radius: 50%;
  font-size: 24px;
  cursor: pointer;
  backdrop-filter: blur(20px) saturate(170%);
  -webkit-backdrop-filter: blur(20px) saturate(170%);
  box-shadow: 0 4px 16px 0 rgba(31, 38, 135, 0.2);
  transition: all 0.3s cubic-bezier(.16,1,.3,1);
  display: flex;
  align-items: center;
  justify-content: center;
}

.swipe-arrow:hover {
  transform: scale(1.15);
  background: linear-gradient(135deg, rgba(34,44,74,0.65) 0%, rgba(80,120,255,0.28) 100%);
  box-shadow: 0 6px 24px 0 rgba(31, 38, 135, 0.35);
  border-color: rgba(255,255,255,0.35);
}

.swipe-arrow:active {
  transform: scale(0.95);
}

.swipe-arrow:disabled {
  opacity: 0.3;
  cursor: not-allowed;
  transform: scale(1);
}

@media (min-width: 768px) {
  .grid-view {
    grid-template-columns: repeat(3, 1fr);
    gap: 8px;
    padding: 8px;
  }
}

@media (min-width: 1024px) {
  .grid-view {
    grid-template-columns: repeat(4, 1fr);
  }
}
</style>
