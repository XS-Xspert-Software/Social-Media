<template>
  <div class="friends-container">
    <div class="friends-section" :class="{ 'split-view': isLargeScreen && selectedFriend }">

      <div v-if="loading && friends.length === 0" class="loading">
        <div class="spinner"></div>
      </div>

      <div v-if="!loading && friends.length === 0" class="no-friends">
        <p>No friends yet. Visit user profiles to add friends!</p>
      </div>

      <div class="friends-list">
        <div 
          v-for="friend in friends" 
          :key="friend.id" 
          class="friend-card"
           style="display: flex; align-items: center; padding: 12px 16px; margin: 5px 0; border-radius: 8px; box-shadow: 0 2px 6px rgba(0, 0, 0, 0.1);"
          @click="handleFriendClick(friend)"
          :class="{ 
            'online': friend.isOnline,
            'selected': selectedFriend?.id === friend.id 
          }"
        >
          <div class="profile-picture" style="width: 30px; height: 30px; border-radius: 30%; margin-right: 20px;">
            <img 
              :src="friend.profile_picture || 'default-pfp.jpg'" 
              :alt="friend.username + ' profile'" style="width: 100%; height: 100%; object-fit: cover;" 
            />
            <div v-if="friend.isOnline" class="online-indicator"></div>
          </div>
          
          <div class="friend-info">
            <div class="friend-username" style="font-size: 1.05rem; color: #fff;">{{ friend.username }}</div>
            <div v-if="friend.lastMessage" class="last-message" style="font-size: 0.85rem; color: #ccc;">
              {{ friend.lastMessage }}
            </div>
          </div>
        </div>
      </div>
    </div>

    <div v-if="isLargeScreen && selectedFriend" class="chatbox-section">
      <Chatbox
        :key="selectedFriend.id"
        :chatWith="selectedFriend.username"
        :chatWithId="selectedFriend.id"
        :profileImage="selectedFriend.profile_picture || 'default-pfp.jpg'"
        @go-back="selectedFriend = null"
      />
    </div>
        <!-- Chatbox for large screens -->
  </div>
</template>

<script>
// Correct relative paths to Pinia stores (file lives in src/ alongside stores/ folder)
import { useUserStore } from './stores/userStore';
import { useFriendsStore } from './stores/friendsStore';
import Chatbox from './Chatbox.vue';

export default {
  name: 'FriendsChat',
  components: {
    Chatbox
  },
  data() {
    return {
      userStore: useUserStore(),
      friendsStore: useFriendsStore(),
      selectedFriend: null,
      isLargeScreen: window.innerWidth >= 768,
    };
  },
  computed: {
    friends() {
      return this.friendsStore.friends;
    },
    loading() {
      return this.friendsStore.loading;
    },
    currentUsername() {
      return localStorage.getItem('username') || this.userStore.loggedInUsername;
    }
  },
  methods: {
    async loadFriends() {
      if (!this.currentUsername) {
        this.userStore.warningMessage = 'Please log in to view friends';
        return;
      }

      try {
        await this.friendsStore.fetchFriends(this.currentUsername);
      } catch (error) {
        console.error('Error fetching friends:', error);
        this.userStore.warningMessage = 'Failed to load friends';
      }
    },

    handleFriendClick(friend) {
      // Store chat data in localStorage
      localStorage.setItem('chatWith', friend.username);
      localStorage.setItem('chatWithId', friend.id.toString());
      localStorage.setItem('profileImage', friend.profile_picture || 'default-pfp.jpg');

      if (this.isLargeScreen) {
        // Show chatbox inline
        this.selectedFriend = friend;
      } else {
        // Navigate to Chatbox page
        this.$router.push({
          name: 'Chatbox',
          params: {
            userId: friend.id.toString(),
            username: friend.username,
          },
        });
      }
    },

    handleResize() {
      const wasLarge = this.isLargeScreen;
      this.isLargeScreen = window.innerWidth >= 768;

      // If switching to small screen with active chat, navigate to Chatbox
      if (wasLarge && !this.isLargeScreen && this.selectedFriend) {
        this.$router.push({
          name: 'Chatbox',
          params: {
            userId: this.selectedFriend.id.toString(),
            username: this.selectedFriend.username,
          },
        });
        this.selectedFriend = null;
      }
    }
  },
  
  async mounted() {
    await this.loadFriends();
    window.addEventListener('resize', this.handleResize);
  },
  
  async activated() {
    if (this.friendsStore.needsRefresh || 
        this.friendsStore.currentUsername !== this.currentUsername) {
      await this.loadFriends();
    }
  },

  beforeUnmount() {
    window.removeEventListener('resize', this.handleResize);
  }
};
</script>

<style src="./Chatbox.css"></style>
