<template>
  <section class="videos-section">
    <!-- Video Upload Form -->
    <div class="upload-form" v-if="userId">
      <h3>Create Video Post</h3>
      <form @submit.prevent="uploadVideo" enctype="multipart/form-data">
        <div class="form-group">
          <label for="caption">Caption:</label>
          <input 
            type="text" 
            id="caption" 
            v-model="uploadForm.caption" 
            required
            placeholder="Enter video caption..."
          >
        </div>
        <div class="form-group">
          <label for="videoFile">Video File (.mp4):</label>
          <input 
            type="file" 
            id="videoFile" 
            @change="handleFileSelect"
            accept="video/mp4"
            required
          >
        </div>
        <button type="submit" :disabled="uploading">
          {{ uploading ? 'Uploading...' : 'Upload Video' }}
        </button>
      </form>
    </div>


<Avatar image="/images/avatar/amyelsner.png" class="mr-2" size="xlarge" shape="circle" />
<Avatar image="/images/avatar/asiyajavayant.png" class="mr-2" size="large" shape="circle" />
<Avatar image="/images/avatar/onyamalimba.png" shape="circle" />

<OverlayBadge value="4" severity="danger" class="inline-flex">
    <Avatar class="p-overlay-badge" image="https://primefaces.org/cdn/primevue/images/organization/walter.jpg" size="xlarge" />
</OverlayBadge>

<Avatar image="https://www.gravatar.com/avatar/05dfd4b41340d09cae045235eb0893c3?d=mp" class="flex items-center justify-center mr-2" size="xlarge" />


    <!-- Videos Feed -->
    <div class="videos-feed">
      <div v-if="loading" class="loading">Loading videos...</div>
      <div v-else-if="error" class="error">{{ error }}</div>
      <div v-else-if="filteredVideos.length === 0" class="no-videos">
        No videos available.
      </div>
      <div v-else>
        <div v-for="post in filteredVideos" :key="post.id" class="video-card hover-scale">
          <div class="video-header">
            <img :src="post.user?.avatar || 'https://i.pravatar.cc/40'" 
                 alt="User Avatar" 
                 class="user-avatar">
            <div class="user-info">
              <div class="username">{{ post.user?.username || 'Unknown' }}</div>
              <div class="timestamp">{{ formatTimestamp(post.created_at) }}</div>
            </div>
          </div>
          
          <p class="video-caption">{{ post.caption }}</p>
          
          <video 
            controls 
            class="video-player"
            @play="trackVideoWatch(post.video_id)"
            preload="metadata">
            <source :src="getVideoUrl(post.video_id)" type="video/mp4">
            Your browser does not support the video tag.
          </video>
        </div>
      </div>
    </div>
  </section>
</template>

<script>


import Avatar from 'primevue/avatar';

export default {
  props: ['searchQuery', 'userId'],
   
  data() {
    return {
      videos: [],
      loading: false,
      error: null,
      uploading: false,
      uploadForm: {
        caption: '',
        videoFile: null
      }
    };
  },
  computed: {
    filteredVideos() {
      if (!this.searchQuery) return this.videos;
      return this.videos.filter(video =>
        video.caption?.toLowerCase().includes(this.searchQuery.toLowerCase()) ||
        video.user?.username?.toLowerCase().includes(this.searchQuery.toLowerCase())
      );
    }
  },
  async mounted() {
    await this.loadVideos();
  },
  methods: {
    async loadVideos() {
      this.loading = true;
      this.error = null;
      
      try {
        const response = await djangoAPI.request(`/api/feed-json/?user_id=${this.userId || 'anonymous'}`);
        
        if (response.success) {
          this.videos = response.feed;
        } else {
          this.error = 'Failed to load videos';
        }
      } catch (error) {
        console.error('Error loading videos:', error);
        this.error = 'Failed to load videos: ' + error.message;
      } finally {
        this.loading = false;
      }
    },
    
    handleFileSelect(event) {
      this.uploadForm.videoFile = event.target.files[0];
    },
    
    async uploadVideo() {
      if (!this.uploadForm.caption || !this.uploadForm.videoFile) {
        alert('Please fill in all fields');
        return;
      }
      
      this.uploading = true;
      
      try {
        const formData = new FormData();
        formData.append('caption', this.uploadForm.caption);
        formData.append('video_file', this.uploadForm.videoFile);
        
        const response = await djangoAPI.createVideoPost(formData);
        
        // Reset form
        this.uploadForm.caption = '';
        this.uploadForm.videoFile = null;
        document.getElementById('videoFile').value = '';
        
        // Reload videos
        await this.loadVideos();
        
        alert('Video uploaded successfully!');
        
      } catch (error) {
        console.error('Error uploading video:', error);
        alert('Failed to upload video: ' + error.message);
      } finally {
        this.uploading = false;
      }
    },
    
    getVideoUrl(videoId) {
      return `${djangoAPI.baseURL}/api/videopost/?video_id=${videoId}&user_id=${this.userId || 'anonymous'}`;
    },
    
    async trackVideoWatch(videoId) {
      try {
        await djangoAPI.trackVideoWatch(videoId, this.userId);
        console.log('Video watch tracked:', videoId);
      } catch (error) {
        console.error('Error tracking video watch:', error);
      }
    },
    
    formatTimestamp(timestamp) {
      if (!timestamp) return '';
      const date = new Date(timestamp);
      return date.toLocaleDateString() + ' ' + date.toLocaleTimeString();
    }
  }
};
definePageMeta({
  ssr: false
})
</script>

<style scoped>
.videos-section {
  max-width: 600px;
  margin: 0 auto;
  padding: 20px;
}

.upload-form {
  background: #f8f9fa;
  padding: 20px;
  border-radius: 10px;
  margin-bottom: 30px;
  border: 1px solid #e9ecef;
}

.upload-form h3 {
  margin-bottom: 15px;
  color: #333;
}

.form-group {
  margin-bottom: 15px;
}

.form-group label {
  display: block;
  margin-bottom: 5px;
  font-weight: 500;
  color: #555;
}

.form-group input {
  width: 100%;
  padding: 10px;
  border: 1px solid #ddd;
  border-radius: 5px;
  font-size: 14px;
}

.form-group input:focus {
  outline: none;
  border-color: #5eead4;
  box-shadow: 0 0 0 2px rgba(94, 234, 212, 0.2);
}

button {
  background: #5eead4;
  color: #333;
  border: none;
  padding: 10px 20px;
  border-radius: 5px;
  cursor: pointer;
  font-weight: 500;
  transition: background-color 0.3s;
}

button:hover:not(:disabled) {
  background: #4fd1c7;
}

button:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.videos-feed > * + * {
  margin-top: 20px;
}

.loading, .error, .no-videos {
  text-align: center;
  padding: 40px;
  color: #666;
  font-size: 16px;
}

.error {
  color: #dc3545;
}

.video-card {
  background: white;
  border-radius: 10px;
  padding: 20px;
  margin-bottom: 20px;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
  transition: transform 0.2s;
}

.video-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.15);
}

.video-header {
  display: flex;
  align-items: center;
  margin-bottom: 15px;
}

.user-avatar {
  width: 40px;
  height: 40px;
  border-radius: 50%;
  margin-right: 10px;
  border: 2px solid #e9ecef;
}

.user-info {
  flex: 1;
}

.username {
  font-weight: 600;
  color: #333;
  margin-bottom: 2px;
}

.timestamp {
  font-size: 12px;
  color: #666;
}

.video-caption {
  margin-bottom: 15px;
  color: #555;
  line-height: 1.5;
}

.video-player {
  width: 100%;
  border-radius: 8px;
  outline: none;
}
</style>
