<template>
  <section class="chat-section">
    <div class="chat-container" :class="{ 'side-by-side': isLargeScreen && selectedUser }">
      <div class="tabs">
        <button :class="{ active: activeSection === 'users-section' }" @click="switchSection('users-section')" style="padding: 6px 21px; margin-left: 20px; background-color: #111; border-radius: 9999px; color: #fff; font-size: 14px; cursor: pointer; border-color: #fff;">
          Chat
        </button>
        <button :class="{ active: activeSection === 'WorldChat' }" @click="switchSection('WorldChat')" style="padding: 6px 21px; margin-right: 20px; background-color: #111; border-radius: 99px; color: #fff; font-size: 14px; cursor: pointer; border-color: #fff;">
          Global
        </button>
        <button :class="{ active: activeSection === 'GroupChat' }" @click="switchSection('GroupChat')" style="padding: 6px 21px; margin-right: 20px; background-color: #111; border-radius: 99px; color: #fff; font-size: 14px; cursor: pointer; border-color: #fff;">
          Groups
        </button>
      </div>

      <div class="sections">
        <!-- Users List -->
        <div v-if="activeSection === 'users-section'" class="section user-list-section">
          <div id="loading" class="loading" v-if="userStore.loading"><div class="spinner"></div></div>
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

        <!-- World Chat (lazy load only when accessed) -->
        <div v-if="worldChatLoaded && activeSection === 'WorldChat'" class="section">
          <WorldChat />
        </div>

        <!-- Group Chat (lazy load only when accessed) -->
        <div v-if="groupChatLoaded && activeSection === 'GroupChat'" class="section">
          <GroupChat ref="groupChat" @group-click="handleGroupClick" />
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
  </section>
</template>

<script>
import { defineAsyncComponent } from 'vue';
import Chatbox from './Chatbox.vue';
import { useUserStore } from './stores/userStore';

export default {
  name: 'UsersSection',
  components: {
    Chatbox,
    WorldChat: defineAsyncComponent(() => import('./WorldChat.vue')),
    GroupChat: defineAsyncComponent(() => import('./GroupChat.vue')),
  },
  data() {
    return {
      activeSection: 'users-section',
      loggedInUsername: localStorage.getItem('username')?.trim() || null,
      selectedUser: null,
      isLargeScreen: window.innerWidth >= 768,
      worldChatLoaded: false,
      groupChatLoaded: false,
    };
  },
  computed: {
    userStore() {
      return useUserStore();
    },
  },
  methods: {
    switchSection(section) {
      if (this.activeSection === section) return;
      this.activeSection = section;
      this.selectedUser = null;

      if (section === 'WorldChat') {
        this.worldChatLoaded = true;
      }
      if (section === 'GroupChat') {
        this.groupChatLoaded = true;
        this.$nextTick(() => {
          this.$refs.groupChat?.fetchGroups?.();
        });
      }
    },
    handleUserClick(user) {
      if (user.username === this.loggedInUsername) return;
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
          name: 'GroupChatbox',
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
        const updates = {
          chatWith: this.selectedUser.username,
          chatWithId: this.selectedUser.id,
          profileImage: this.selectedUser.profile_picture || 'default-pfp.jpg',
        };
        Object.entries(updates).forEach(([key, value]) => {
          localStorage.setItem(key, value);
        });
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
  mounted() {
    this.userStore.fetchUsers();
    window.addEventListener('resize', this.handleResize);
  },
  beforeUnmount() {
    window.removeEventListener('resize', this.handleResize);
  },
};
</script>

<style src="./Chatbox.css"></style>
