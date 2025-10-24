<template>
  <section class="chat-section">
    <!-- Show clear login requirement when not authenticated -->
    <LoginPrompt
      v-if="!isLoggedIn"
      message="Log in to see your recent chats and start messaging."
      @login="goLogin"
    />
    <div class="chat-container">
      <div class="tabs">
        <button :class="['tab-button', { active: activeSection === 'Recent' }]" @click="switchSectionWithRoute('Recent', '/chat')">Recent</button>
        <button :class="['tab-button', { active: activeSection === 'Friends' }]" @click="switchSectionWithRoute('Friends', '/chat/friends')">Friends</button>
      </div>

      <div v-if="activeSection === 'Recent'" class="section">
        <div class="chat-container" :class="{ 'side-by-side': isLargeScreen && selectedUser }">
          <div class="sections">
            <div class="section user-list-section">
              <transition name="fade"><div id="loading" class="loading" v-if="loading"><div class="spinner"></div></div></transition>
              <div id="load-more-trigger"></div>
              <div class="users-container">
                <transition-group name="fade" tag="div" class="fade-list">
                  <div v-for="recentChat in recentChats" :key="recentChat.userId || recentChat.id" class="user-card recent-chat" @click="handleUserClick(recentChat)" style="display:flex;align-items:center;padding:12px 16px;margin:5px 0;border-radius:8px;box-shadow:0 2px 6px rgba(0,0,0,0.1);">
                    <div class="profile-picture" style="width:30px;height:30px;border-radius:30%;margin-right:20px;">
                      <img :src="recentChat.profile_picture || 'default-pfp.jpg'" :alt="recentChat.username + ' profile'" style="width:100%;height:100%;object-fit:cover;" loading="lazy" />
                    </div>
                    <div class="user-info" style="flex:1;display:flex;flex-direction:column;">
                      <div style="display:flex;justify-content:space-between;align-items:center;">
                        <div class="username" style="font-size:1.05rem;color:#fff;"><strong>{{ recentChat.username }}</strong></div>
                        <div class="last-seen" style="font-size:0.75rem;color:#999;">{{ formatLastSeen(recentChat.lastSeen) }}</div>
                      </div>
                      <div class="last-message" style="font-size:0.85rem;color:#ccc;">{{ recentChat.lastMessage }}</div>
                    </div>
                    <div v-if="recentChat.unreadCount > 0" class="unread-badge" style="background:#ff4444;color:white;border-radius:50%;padding:2px 6px;font-size:0.7rem;min-width:18px;text-align:center;">{{ recentChat.unreadCount }}</div>
                  </div>
                </transition-group>

                <div v-if="recentChats.length > 0" class="separator" style="border-bottom:1px solid #333;margin:10px 0;"></div>

                <div v-for="user in filteredUsers" :key="getUserId(user)" @click="handleUserClick(user)" class="user-item" style="display:flex;align-items:center;padding:12px 16px;margin:5px 0;border-radius:8px;box-shadow:0 2px 6px rgba(0,0,0,0.1);">
                  <div class="profile-picture" style="width:30px;height:30px;border-radius:30%;margin-right:20px;">
                    <img :src="user.profile_picture || 'default-pfp.jpg'" :alt="user.username + ' profile'" style="width:100%;height:100%;object-fit:cover;" loading="lazy" />
                  </div>
                  <div class="username" style="font-size:1.05rem;color:#fff;">
                    <strong>{{ user.username }}</strong>
                    <div v-if="user.lastMessage" style="font-size:0.85rem;color:#ccc;">{{ user.lastMessage }}</div>
                  </div>
                </div>
              </div>
            </div>

            <div v-if="isLargeScreen && selectedUser" class="chatbox-section" :class="{ active: isLargeScreen }">
              <Chatbox
                :key="`chatbox-${getUserId(selectedUser)}-${selectedUser.username}`"
                :userId="getUserId(selectedUser)"
                :username="selectedUser.username"
                :chatWith="selectedUser.username"
                :chatWithId="getUserId(selectedUser)"
                :profileImage="selectedUser.profile_picture || 'default-pfp.jpg'"
                @go-back="handleGoBack"
                @message-sent="handleMessageSent"
                @message-received="handleMessageReceived"
                ref="chatboxComponent"
              />
            </div>
          </div>
        </div>
      </div>

      <div v-if="friendsLoaded && activeSection === 'Friends'" class="section">
        <FriendsChat />
      </div>
    </div>
  </section>
</template>


<script>
import { defineAsyncComponent } from 'vue';
import Chatbox from './Chatbox.vue';
import LoginPrompt from './LoginPrompt.vue';
import {
  getUserId,
  normalizeUser,
  cacheUser,
  fetchAllUsers,
  updateRecentChat,
  loadRecentChats,
  clearUnreadCount,
  refreshRecentChats,
  cleanup
} from './recents.js';

export default {
  name: 'ChatSection',
  components: {
    Chatbox,
    FriendsChat: defineAsyncComponent(() => import('./FriendsChat.vue')),
  LoginPrompt,
  },
  data() {
    return {
      activeSection: 'Recent',
      friendsLoaded: false,
      selectedUser: null,
      isLargeScreen: window.innerWidth >= 768,
      recentChats: JSON.parse(localStorage.getItem('cachedRecentChats') || '[]'),
      loading: false,
      lastKnownMessages: {},
      currentUserId: null,
    };
  },
  computed: {
    isLoggedIn() {
      const u = localStorage.getItem('username');
      return !!(u && u !== 'Guest');
    },
    filteredUsers() {
      const recentUserIds = this.recentChats.map(chat => getUserId(chat));
      const allUsers = fetchAllUsers();
      const currentUsername = localStorage.getItem('username');
      return allUsers.filter(user =>
        user.username !== currentUsername &&
        !recentUserIds.includes(getUserId(user))
      );
    },
  },
  watch: {
    $route: {
      handler(to) {
        const sectionMap = {
          '/chat': 'Recent',
          '/chat/friends': 'Friends',
        };
        const newSection = sectionMap[to.path];
        if (newSection && newSection !== this.activeSection) {
          this.switchSection(newSection);
        }
      },
      immediate: true,
    },
  },
  methods: {
    goLogin() {
      try { localStorage.setItem('postLoginRedirect', this.$route.fullPath || '/chat'); } catch {}
      const next = encodeURIComponent(this.$route.fullPath || '/chat');
      window.location.href = `${this.loginHref()}?next=${next}`;
    },
  loginHref() { return 'https://endless.sbs/public/signup'; },
    getUserId,
    normalizeUser,
    cacheUser,
    fetchAllUsers,

    async handleUserClick(user) {
      if (!user || !user.username) return;

      const normalizedUser = normalizeUser(user);
      const userId = getUserId(normalizedUser);
      if (!userId) return;

      this.saveRecentChat(normalizedUser);
      this.clearUnreadCount(userId);

      const updates = {
        chatWith: normalizedUser.username,
        chatWithId: userId,
        profileImage: normalizedUser.profile_picture || 'default-pfp.jpg',
      };
      Object.entries(updates).forEach(([key, value]) => {
        localStorage.setItem(key, value);
      });

      if (this.isLargeScreen) {
        this.selectedUser = normalizedUser;
      } else {
        this.selectedUser = null;
        this.$router.push({
          name: 'Chatbox',
          params: {
            userId: userId,
            username: normalizedUser.username,
          },
        });
      }
    },

    async saveRecentChat(user) {
      if (!this.currentUserId) return;

      const recentChat = {
        userId: user.userId,
        id: user.userId,
        username: user.username || `User ${user.userId}`,
        profile_picture: user.profile_picture || 'default-pfp.jpg',
        lastMessage: user.lastMessage || 'Tap to start chatting',
        lastSeen: new Date().toISOString(),
        unreadCount: 0,
        isOnline: user.isOnline || false,
      };

      updateRecentChat(this.currentUserId, recentChat);
      this.loadRecentChats();
    },

    async clearUnreadCount(userId) {
      if (!this.currentUserId) return;
      try {
        await clearUnreadCount(this.currentUserId, userId);
        const chatIndex = this.recentChats.findIndex(c => getUserId(c) === userId);
        if (chatIndex !== -1) {
          this.recentChats[chatIndex].unreadCount = 0;
        }
      } catch (error) {
        console.error('Error clearing unread count:', error);
      }
    },

    async loadRecentChats() {
      if (!this.currentUserId) {
        this.recentChats = [];
        return;
      }
      try {
        this.loading = true;
        const chats = await loadRecentChats(this.currentUserId);
        const sorted = chats
          .sort((a, b) => new Date(b.lastSeen) - new Date(a.lastSeen))
          .slice(0, 10);
        this.recentChats = sorted;
        localStorage.setItem('cachedRecentChats', JSON.stringify(sorted));
      } catch (error) {
        console.error('Error loading recent chats:', error);
      } finally {
        this.loading = false;
      }
    },

    formatLastSeen(timestamp) {
      if (!timestamp) return '';
      const now = new Date();
      const lastSeen = new Date(timestamp);
      const diff = now - lastSeen;
      const minutes = Math.floor(diff / (1000 * 60));
      const hours = Math.floor(diff / (1000 * 60 * 60));
      const days = Math.floor(diff / (1000 * 60 * 60 * 24));

      if (minutes < 1) return 'Just now';
      if (minutes < 60) return `${minutes}m ago`;
      if (hours < 24) return `${hours}h ago`;
      if (days === 1) return 'Yesterday';
      if (days < 7) return `${days}d ago`;
      return lastSeen.toLocaleDateString();
    },

    async switchSection(section) {
      if (this.activeSection === section) return;
      this.activeSection = section;
      if (section === 'Friends') {
        this.friendsLoaded = true;
      } else {
        this.loadRecentChats();
      }
    },

    switchSectionWithRoute(section, route) {
      this.switchSection(section);
      if (this.$route.path !== route) {
        this.$router.push(route);
      }
    },

    handleResize() {
      const wasLargeScreen = this.isLargeScreen;
      this.isLargeScreen = window.innerWidth >= 768;

      if (wasLargeScreen && !this.isLargeScreen && this.selectedUser) {
        this.$router.push({
          name: 'Chatbox',
          params: {
            userId: this.getUserId(this.selectedUser),
            username: this.selectedUser.username,
          },
        });
        this.selectedUser = null;
      }
    },

    async handleIncomingMessage(messageData) {
      if (!this.currentUserId) return;

      const chatData = {
        userId: messageData.senderId,
        username: messageData.senderUsername,
        profile_picture: messageData.senderProfilePicture || 'default-pfp.jpg',
        lastMessage: messageData.message,
        lastSeen: messageData.timestamp,
        unreadCount: 1,
        isOnline: true,
      };

      updateRecentChat(this.currentUserId, chatData);
      setTimeout(() => this.loadRecentChats(), 1000);
    },

    async handleOutgoingMessage(messageData) {
      if (!this.currentUserId) return;

      const chatData = {
        userId: messageData.receiverId,
        username: messageData.receiverUsername,
        profile_picture: messageData.receiverProfilePicture || 'default-pfp.jpg',
        lastMessage: messageData.message,
        lastSeen: messageData.timestamp,
        unreadCount: 0,
        isOnline: false,
      };

      updateRecentChat(this.currentUserId, chatData);

      const existingIndex = this.recentChats.findIndex(
        chat => getUserId(chat) === messageData.receiverId
      );

      if (existingIndex >= 0) {
        const existing = this.recentChats[existingIndex];
        this.recentChats[existingIndex] = { ...existing, ...chatData };
        const [updatedChat] = this.recentChats.splice(existingIndex, 1);
        this.recentChats.unshift(updatedChat);
      } else {
        this.recentChats.unshift(chatData);
      }

      this.recentChats = this.recentChats.slice(0, 10);
      localStorage.setItem('cachedRecentChats', JSON.stringify(this.recentChats));
    },

    async refreshRecentChats() {
      if (!this.currentUserId) return;

      try {
        this.loading = true;
        const chats = await refreshRecentChats(this.currentUserId);
        const sorted = chats
          .sort((a, b) => new Date(b.lastSeen) - new Date(a.lastSeen))
          .slice(0, 10);
        this.recentChats = sorted;
        localStorage.setItem('cachedRecentChats', JSON.stringify(sorted));
      } catch (error) {
        console.error('Error refreshing recent chats:', error);
      } finally {
        this.loading = false;
      }
    },

    handleVisibilityChange() {
      if (!document.hidden && this.activeSection === 'Recent') {
        this.refreshRecentChats();
      }
    },
  },

  mounted() {
    this.currentUserId = localStorage.getItem('userId');
    this.loadRecentChats(); // non-blocking
    window.addEventListener('resize', this.handleResize);
    document.addEventListener('visibilitychange', this.handleVisibilityChange);
  },

  beforeUnmount() {
    window.removeEventListener('resize', this.handleResize);
    document.removeEventListener('visibilitychange', this.handleVisibilityChange);
    cleanup(); // cleanup API timers etc.
  },
};
</script>

<style src="./Chatbox.css"></style>
<style scoped>
.fade-list .fade-enter-active,
.fade-list .fade-leave-active,
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.3s ease;
}
.fade-list .fade-enter-from,
.fade-list .fade-leave-to,
.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}
</style>





