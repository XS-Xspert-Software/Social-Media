<template>
  <div id="chat-container" style="min-height: 500px;">
    <div id="messages" ref="messagesContainer">
      <div v-for="message in visibleMessages" :key="message.id" class="message">
        <div class="bubble">
          <div class="text-row">
            <div class="username" :style="getUsernameStyle(message.username)">{{ message.username || 'Unknown' }}</div>
            <span class="message-text">{{ message.text || '[Empty Message]' }}</span>
          </div>
        </div>
      </div>
    </div>
    <div id="input-container">
      <input v-model="inputMessage" id="input-message" type="text" placeholder="Type a message..." @keyup.enter="sendMessage" @input="handleInputChange" />
      <button id="send-button" @click="sendMessage">Send</button>
    </div>
    <div id="warning-message">{{ userStore.warningMessage }}</div>
  </div>
</template>

<script>
import { nextTick, onMounted } from 'vue';
import { useUserStore } from './stores/userStore';

const loadAbly = () => import('ably');

export default {
  name: 'WorldChat',
  data() {
    return {
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
      isScrolling: false,
      scrollTimeout: null,
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
  },
  mounted() {
    this.initializeAbly();
    this.$refs.messagesContainer?.addEventListener('scroll', this.handleScroll);
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
    this.$refs.messagesContainer?.removeEventListener('scroll', this.handleScroll);
  },
};
</script>
<style src="./Chatbox.css"></style>
