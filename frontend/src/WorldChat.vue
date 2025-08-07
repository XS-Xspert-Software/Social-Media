<template>
 <div class="chat-container" :class="{ 'side-by-side': isLargeScreen && selectedUser }">
       <div class="sections">
        <!-- Users List -->
        <div v-if="activeSection === 'users-section'" class="section user-list-section">
          <div id="loading" class="loading" v-if="userStore.loading"><div class="spinner"></div></div>
          <button @click="refreshUsers" :disabled="userStore.loading">
            <i class="fas fa-sync-alt" style="margin-right: 6px;" :class="{ 'fa-spin': userStore.loading }"></i> 
            {{ userStore.loading ? 'Refreshing...' : 'Refresh' }}
          </button>
          <div id="load-more-trigger"></div>
          <div class="users-container">
            <div v-for="user in userStore.users" :key="user.username" class="user-card" @click="handleUserClick(user)" style="display: flex; align-items: center; padding: 12px 16px; margin: 10px 0; border-radius: 8px; box-shadow: 0 2px 6px rgba(0, 0, 0, 0.1);">
              <div class="profile-picture" style="width: 30px; height: 30px; border-radius: 30%; margin-right: 20px;"><img :src="user.profile_picture || 'default-pfp.jpg'" :alt="user.username + ' profile'" style="width: 100%; height: 100%; object-fit: cover;" /></div>
              <div class="username" style="font-size: 1.05rem; color: #fff;">
                <strong>{{ user.username }}</strong>
                <div v-if="user.lastMessage" style="font-size: 0.85rem; color: #ccc;">{{ user.lastMessage }}</div>
              </div>
            </div>
          </div>
        </div>
    
        <!-- Chatbox on large screens -->
        <div v-if="isLargeScreen && selectedUser && activeSection === 'users-section'" class="chatbox-section" :class="{ 'active': isLargeScreen }">
          <Chatbox
            :key="selectedUser?.id"
            :chatWith="selectedUser.username"
            :chatWithId="selectedUser.id"
            :profileImage="selectedUser.profile_picture || 'default-pfp.jpg'"
            @go-back="handleGoBack"
          />
        </div>
      </div>
      </div>
</template>

<script>
import Chatbox from './Chatbox.vue';
import { useUserStore } from './stores/userStore';

export default {
  name: 'WorldChat',
  components: {
    Chatbox,
  },

  data() {
    return {
      userStore: useUserStore(),
      activeSection: 'users-section',
      selectedUser: null,
      isLargeScreen: window.innerWidth >= 768,
    };
  },

  async mounted() {
    await this.initializeComponent();
    window.addEventListener('resize', this.handleResize);
  },

  async activated() {
    await this.userStore.forceRefresh();
  },

  beforeUnmount() {
    window.removeEventListener('resize', this.handleResize);
  },

  methods: {
    async refreshUsers() {
      console.log("Refresh button clicked");
      try {
        const success = await this.userStore.forceRefresh();
        if (success) {
          console.log("User list refreshed successfully");
        } else {
          console.log("Refresh failed");
        }
      } catch (error) {
        console.error("Error during refresh:", error);
      }
    },

    async initializeComponent() {
      try {
        const success = await this.userStore.initializeStore();
        if (!success) {
          console.warn('Please log in to view users');
        }
      } catch (error) {
        console.warn(`Failed to load users: ${error.message}`);
      }
    },

    handleUserClick(user) {
      // Fix: Use the store's getter instead of undefined property
      if (user.username === this.userStore.loggedInUsername) return;

      const updates = {
        chatWith: user.username,
        chatWithId: user.id,
        profileImage: user.profile_picture || 'default-pfp.jpg',
      };
      Object.entries(updates).forEach(([key, value]) => {
        localStorage.setItem(key, value);
      });

      if (this.isLargeScreen && this.activeSection === 'users-section') {
        this.selectedUser = user;
      } else {
        this.selectedUser = null;
        this.$router.push({
          name: 'Chatbox',
          params: {
            userId: user.id,
            username: user.username,
          },
        });
      }
    },

    handleGoBack() {
      this.selectedUser = null;
      if (!this.isLargeScreen) {
        this.$router.push({ name: 'UsersSection' });
      }
    },

    handleResize() {
      const wasLargeScreen = this.isLargeScreen;
      this.isLargeScreen = window.innerWidth >= 768;

      if (wasLargeScreen && !this.isLargeScreen && this.selectedUser) {
        this.$router.push({
          name: 'Chatbox',
          params: {
            userId: this.selectedUser.id,
            username: this.selectedUser.username,
          },
        });
        this.selectedUser = null;
      } else if (this.isLargeScreen && this.$route.name === 'Chatbox') {
        this.$router.push({ name: 'UsersSection' });
        this.selectedUser = null;
      }
    },
  },
};
</script>

<style src="./Chatbox.css"></style>
