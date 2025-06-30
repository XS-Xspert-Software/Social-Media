<template>
  <section class="chat-section">
    <div class="chat-container" :class="{ 'side-by-side': isLargeScreen && selectedUser }">
      <div class="tabs">
        <button :class="{ active: activeSection === 'users-section' }" @click="switchSection('users-section')" style="padding: 6px 21px;margin-left: 20px; background-color:#111; border-radius: 9999px; color:#fff; font-size: 14px; cursor: pointer; transition: all 0.3s ease; border-color:purple;">Chat</button>
        <button :class="{ active: activeSection === 'World Chat' }" @click="switchSection('World Chat')" style="padding: 6px 21px;margin-right: 20px; background-color:#111; border-radius: 9999px; color:#fff; font-size: 14px; cursor: pointer; transition: all 0.3s ease; border-color:purple;">Global</button>
      </div>
      <div class="sections">
        <div v-show="activeSection === 'users-section'" class="section user-list-section">
          <div id="loading" class="loading" v-if="userStore.loading"><div class="spinner"></div></div>
          <div id="load-more-trigger"></div>
          <div class="users-container">
            <div v-for="user in userStore.users" :key="user.username" class="user-card" @click="handleUserClick(user)" style="display: flex; align-items: center; padding: 12px 16px; margin: 20px 0; border-radius: 8px; box-shadow: 0 2px 6px rgba(0, 0, 0, 0.1); transition: transform 0.2s, box-shadow 0.3s; border-bottom: 2px solid #581c87;">
              <div class="profile-picture" style="width: 30px; height: 30px; border-radius: 30%; margin-right: 20px; object-fit: cover;"><img :src="user.profile_picture || 'default-pfp.jpg'" :alt="user.username + ' profile'" /></div>
              <div class="username" style="font-size: 0.8rem;color: #fff;"><strong>{{ user.username }}</strong><div v-if="user.lastMessage" style="font-size: 0.85rem; color: #ccc; font-weight: 400; color: #fff;">{{ user.lastMessage }}</div></div>
            </div>
          </div>
        </div>
        <div v-show="activeSection === 'World Chat'" class="section">
          <div id="chat-container" style="min-height: 500px;">
            <div id="messages">
              <div v-for="message in messages" :key="message.id" class="message">
                <div class="bubble">
                  <div class="text-row">
                    <div class="username" :style="getusernameStyle(message.username)">{{ message.username || 'Unknown' }}</div>
                    <span class="message-text">{{ message.text || '[Empty Message]' }}</span>
                  </div>
                </div>
              </div>
            </div>
            <div id="input-container">
              <input v-model="inputMessage" id="input-message" type="text" placeholder="Type a message..." @keyup.enter="sendMessage" />
              <button id="send-button" @click="sendMessage">Send</button>
            </div>
            <div id="warning-message">{{ userStore.warningMessage }}</div>
          </div>
        </div>
        <div v-if="isLargeScreen && selectedUser && activeSection === 'users-section'" class="chatbox-section" :class="{ 'active': isLargeScreen }">
          <Chatbox :key="selectedUser?.id" :chatWith="selectedUser.username" :chatWithId="selectedUser.id" :profileImage="selectedUser.profile_picture || 'default-pfp.jpg'" @go-back="handleGoBack" />
        </div>
      </div>
    </div>
  </section>
</template>

<script>
import { defineAsyncComponent, nextTick, onMounted } from 'vue';
import Chatbox from './Chatbox.vue';
import { useUserStore } from './stores/userStore';

const loadAbly = () => import('ably');

export default {
  name: 'Chat',
  components: {
    Chatbox,
  },
  data() {
    return {
      activeSection: 'users-section',
      loggedInUsername: localStorage.getItem('username')?.trim() || null,
      inputMessage: '',
      messages: [],
      visibleMessages: [],
      sentMessages: new Set(),
      username: localStorage.getItem('username')?.trim() || 'Unknown',
      userColors: new Map(),
      ably: null,
      channel: null,
      messageStartIndex: 0,
      messageEndIndex: 50,
      messageHeight: 60,
      containerHeight: 500,
      tabs: [
        { key: 'users-section', label: 'Conversation' },
        { key: 'World Chat', label: 'World Chat' },
      ],
      isScrolling: false,
      scrollTimeout: null,
      selectedUser: null,
      isLargeScreen: window.innerWidth >= 768,
    };
  },
  computed: {
    userStore() {
      return useUserStore();
    },
    maxVisibleMessages() {
      return Math.ceil(this.containerHeight / this.messageHeight) + 5;
    },
  },
  methods: {
    switchSection(section) {
      if (this.activeSection === section) return;
      this.activeSection = section;
      this.selectedUser = null;
      if (section === 'World Chat' && !this.ably) {
        this.initializeAbly();
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
        this.$router.push({ name: 'Chat' });
      }
    },
    getColorForUsername(name) {
      if (!this.userColors.has(name)) {
        const colors = [
          '#e6194b', '#3cb44b', '#ffe119', '#4363d8', '#f58231',
          '#911eb4', '#46f0f0', '#f032e6', '#bcf60c', '#fabebe',
          '#008080', '#e6beff', '#9a6324', '#800000',
        ];
        this.userColors.set(name, colors[Math.floor(Math.random() * colors.length)]);
      }
      return this.userColors.get(name);
    },
    getUsernameStyle(username) {
      if (username === 'username99') {
        return {
          backgroundColor: '#000',
          color: '#fff',
          fontSize: '23px',
          marginRight: '8px',
          whiteSpace: 'nowrap',
          padding: '4px 8px',
          borderRadius: '4px',
        };
      }
      return {
        fontWeight: 'bold',
        color: this.getColorForUsername(username),
      };
    },
    appendMessage(text, username, id) {
      if (this.sentMessages.has(id)) return;
      this.messages.push({ text, username, id });
      this.sentMessages.add(id);
      this.updateVisibleMessages();
      nextTick(() => {
        this.scrollToBottom();
      });
    },
    updateVisibleMessages() {
      const start = Math.max(0, this.messages.length - this.maxVisibleMessages);
      this.visibleMessages = this.messages.slice(start);
    },
    handleScroll() {
      if (this.scrollTimeout) clearTimeout(this.scrollTimeout);
      this.isScrolling = true;
      this.scrollTimeout = setTimeout(() => {
        this.isScrolling = false;
      }, 150);
    },
    scrollToBottom() {
      if (this.$refs.messagesContainer && !this.isScrolling) {
        this.$refs.messagesContainer.scrollTop = this.$refs.messagesContainer.scrollHeight;
      }
    },
    handleInputChange() {
      this.userStore.warningMessage = '';
    },
    sendMessage() {
      const message = this.inputMessage.trim();
      if (!message) return;
      if (!this.username || this.username === 'Unknown') {
        this.userStore.warningMessage = 'Please sign up before sending a message.';
        return;
      }
      const messageId = Date.now() + Math.random();
      this.appendMessage(message, this.username, messageId);
      if (this.channel) {
        this.channel.publish('new-message', {
          text: message,
          id: messageId,
          username: this.username,
        });
      }
      this.inputMessage = '';
    },
    async initializeAbly() {
      try {
        const Ably = await loadAbly();
        this.ably = new Ably.Realtime('9frHeA.Si13Zw:KVzVyovw6hCu4RRuy6P11Tyl0h7MJIzv2Q_n4YgbNnE');
        this.ably.connection.on('connected', () => {
          console.log('Connected to Ably');
          this.channel = this.ably.channels.get('chat-room');
          this.channel.subscribe('new-message', (msg) => {
            const { text, id, username } = msg.data;
            if (!this.sentMessages.has(id)) {
              this.appendMessage(text, username, id);
            }
          });
        });
        this.ably.connection.on('failed', () => {
          console.error('Failed to connect to Ably');
          this.userStore.warningMessage = 'Failed to connect to chat service.';
        });
      } catch (error) {
        console.error('Failed to load Ably:', error);
        this.userStore.warningMessage = 'Failed to initialize chat service.';
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
        this.$router.push({ name: 'Chat' });
        this.selectedUser = null;
      }
    },
  },
  mounted() {
    this.userStore.fetchUsers();
    this.updateVisibleMessages();
    window.addEventListener('resize', this.handleResize);
  },
  beforeUnmount() {
    if (this.channel) {
      this.channel.unsubscribe('new-message');
    }
    if (this.ably) {
      this.ably.close();
    }
    if (this.scrollTimeout) {
      clearTimeout(this.scrollTimeout);
    }
    window.removeEventListener('resize', this.handleResize);
  },
};
</script>
<style src="./Chatbox.css"></style>
