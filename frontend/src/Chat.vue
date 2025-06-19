<template>
  <div class="chat-section card">
    <div class="tabs">
      <button
        :class="{ active: activeSection === 'users-section' }"
        @click="switchSection('users-section')"
      >
        Conversation
      </button>
      <button
        :class="{ active: activeSection === 'World Chat' }"
        @click="switchSection('World Chat')"
      >
        World Chat
      </button>
    </div>
    <div class="sections" >
      <div v-show="activeSection === 'users-section'" class="section active">
        <div id="loading" class="loading" v-if="loading">
          <div class="spinner"></div>
        </div>
        <div id="load-more-trigger"></div>
     <div class="users-container">
          <div
            v-for="user in users"
            :key="user.username"
            class="user-card" 
           
            @click="handleUserClick(user)"
            style="display: flex;align-items: center;padding: 12px 16px;margin: 20px 0; border-radius: 8px; box-shadow: 0 2px 6px rgba(0, 0, 0, 0.1); cursor: pointer; transition: transform 0.2s, box-shadow 0.3s; border-bottom: 2px solid #581c87;gap: 20px;">
            <div class="profile-picture" style="  width: 30px; height: 30px; border-radius: 30%;margin-right: 20px; object-fit: cover;">
              <img :src="user.profile_picture || 'default-pfp.jpg'" :alt="user.username + ' profile'" />
            </div>
            <div class="username" style="font-size: 1.1rem;font-weight: 700;color: #fff;"><strong>{{ user.username }}</strong></div>
          </div>
        </div>
      </div>
      <div v-show="activeSection === 'World Chat'" class="section">
        <div id="chat-container" style=" min-height: 500px;">
          <div id="messages">
            <div
              v-for="message in messages"
              :key="message.id"
              class="message"
            >
              <div class="bubble">
                <div class="text-row">
                  <div
                    class="username"
                    :style="getusernameStyle(message.username)"
                  >
                    {{ message.username || 'Unknown' }}
                  </div>
                  <span class="message-text">{{ message.text || '[Empty Message]' }}</span>
                </div>
              </div>
            </div>
          </div>
          <div id="input-container">
            <input
              v-model="inputMessage"
              id="input-message"
              type="text"
              placeholder="Type a message..."
              @keyup.enter="sendMessage"
            />
            <button id="send-button" @click="sendMessage">Send</button>
          </div>
          <div id="warning-message">{{ warningMessage }}</div>
        </div>
      </div>
    </div>
  </div>
</template>
<script>
import { defineAsyncComponent, nextTick } from 'vue'

// Lazy load Ably only when needed
const loadAbly = () => import('ably')

function log(level, ...args) {
  const ts = new Date().toISOString();
  if (level === 'error') {
    console.error(`[${ts}]`, ...args);
  } else if (level === 'warn') {
    console.warn(`[${ts}]`, ...args);
  } else {
    console.log(`[${ts}]`, ...args);
  }
}

export default {
  name: 'Chat',
  data() {
    return {
      activeSection: 'users-section',
      users: [],
      loading: false,
      loggedInUsername: localStorage.getItem('username')?.trim() || null,
      inputMessage: '',
      messages: [],
      visibleMessages: [], // Virtual scrolling
      warningMessage: '',
      sentMessages: new Set(),
      username: localStorage.getItem('username')?.trim() || 'Unknown',
      userColors: new Map(), // Use Map for better performance
      ably: null,
      channel: null,
       messageStartIndex: 0,
      messageEndIndex: 50,
      messageHeight: 60, // Estimated message height
      containerHeight: 500,
      tabs: [
        { key: 'users-section', label: 'Conversation' },
        { key: 'World Chat', label: 'World Chat' }
      ],
      isScrolling: false,
      scrollTimeout: null
    }
  },
  computed: {
    maxVisibleMessages() {
      return Math.ceil(this.containerHeight / this.messageHeight) + 5
    }
  },

  methods: {
    switchSection(section) {
      if (this.activeSection === section) return
      this.activeSection = section
      
      if (section === 'World Chat' && !this.ably) {
        this.initializeAbly()
      }
    },

    async fetchUsers() {
      if (this.loading) return
      
      this.loading = true
      try {
        const response = await fetch('https://1999-theta.vercel.app/api/UserListChat', {
          headers: { 'Content-Type': 'application/json' }
        })
        
        if (!response.ok) throw new Error('Failed to fetch users')
        
        const users = await response.json()
        const seenUsernames = new Set()
        
        this.users = users.filter(user => {
          if (seenUsernames.has(user.username)) return false
          seenUsernames.add(user.username)
          return true
        })
      } catch (error) {
        log('error', 'Error fetching users:', error)
        this.warningMessage = 'Failed to load users'
      } finally {
        this.loading = false
      }
    },

handleUserClick(user) {
  if (user.username === this.loggedInUsername) return;

  // Store chat target details for Chatbox.vue to use
  const updates = {
    chatWith: user.username,
    chatWithId: user.id,
    profileImage: user.profile_picture || 'default-pfp.jpg'
  };

  Object.entries(updates).forEach(([key, value]) => {
    localStorage.setItem(key, value);
  });

  // Navigate using Vue Router to Chatbox.vue
  this.$router.push({
    name: 'Chatbox',
    params: {
      userId: user.id,
      username: user.username
    }
  });
},
    getColorForUsername(name) {
      if (!this.userColors.has(name)) {
        const colors = [
          '#e6194b', '#3cb44b', '#ffe119', '#4363d8', '#f58231',
          '#911eb4', '#46f0f0', '#f032e6', '#bcf60c', '#fabebe',
          '#008080', '#e6beff', '#9a6324', '#800000'
        ]
        this.userColors.set(name, colors[Math.floor(Math.random() * colors.length)])
      }
      return this.userColors.get(name)
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
          borderRadius: '4px'
        }
      }
      return {
        fontWeight: 'bold',
        color: this.getColorForUsername(username)
      }
    },

    appendMessage(text, username, id) {
      if (this.sentMessages.has(id)) return
      
      this.messages.push({ text, username, id })
      this.sentMessages.add(id)
      this.updateVisibleMessages()
      
      nextTick(() => {
        this.scrollToBottom()
      })
    },

    updateVisibleMessages() {
      const start = Math.max(0, this.messages.length - this.maxVisibleMessages)
      this.visibleMessages = this.messages.slice(start)
    },

    handleScroll() {
      if (this.scrollTimeout) clearTimeout(this.scrollTimeout)
      
      this.isScrolling = true
      this.scrollTimeout = setTimeout(() => {
        this.isScrolling = false
      }, 150)
    },

    scrollToBottom() {
      if (this.$refs.messagesContainer && !this.isScrolling) {
        this.$refs.messagesContainer.scrollTop = this.$refs.messagesContainer.scrollHeight
      }
    },

    handleInputChange() {
      // Debounce input changes if needed
      this.warningMessage = ''
    },

    sendMessage() {
      const message = this.inputMessage.trim()
      if (!message) return
      
      if (!this.username || this.username === 'Unknown') {
        this.warningMessage = 'Please sign up before sending a message.'
        return
      }
      
      const messageId = Date.now() + Math.random()
      this.appendMessage(message, this.username, messageId)
      
      if (this.channel) {
        this.channel.publish('new-message', {
          text: message,
          id: messageId,
          username: this.username
        })
      }
      
      this.inputMessage = ''
    },

    async initializeAbly() {
      try {
        const Ably = await loadAbly()
        this.ably = new Ably.Realtime('9frHeA.Si13Zw:KVzVyovw6hCu4RRuy6P11Tyl0h7MJIzv2Q_n4YgbNnE')
        
        this.ably.connection.on('connected', () => {
          log('info', 'Connected to Ably')
          this.channel = this.ably.channels.get('chat-room')
          this.channel.subscribe('new-message', (msg) => {
            const { text, id, username } = msg.data
            if (!this.sentMessages.has(id)) {
              this.appendMessage(text, username, id)
            }
          })
        })
        
        this.ably.connection.on('failed', () => {
          log('error', 'Failed to connect to Ably')
          this.warningMessage = 'Failed to connect to chat service.'
        })
      } catch (error) {
        log('error', 'Failed to load Ably:', error)
        this.warningMessage = 'Failed to initialize chat service.'
      }
    }
  },

  mounted() {
    this.fetchUsers()
    this.updateVisibleMessages()
  },

  beforeUnmount() {
    if (this.channel) {
      this.channel.unsubscribe('new-message')
    }
    if (this.ably) {
      this.ably.close()
    }
    if (this.scrollTimeout) {
      clearTimeout(this.scrollTimeout)
    }
  }
}
</script>
<style scoped>
.chat-section {
     padding: 16px;
    border-radius: 12px;
    min-height: 650px;
    height: 100vh;        /* Fill the full viewport height */
    width: 100%;          /* Ensure full width */
    box-sizing: border-box; /* Ensure padding doesn't increase height */
}
 .username {
    font-size: 13px;
    cursor: pointer;
  }
      .user-card{
    padding: 9px 12px;
    cursor: pointer;
  }
  .profile-picture img {width: 29px;
  height: 29px;
  border-radius: 50%;
  cursor: pointer;
  object-fit: cover;
}
#messages {
        padding: 10px; /* Reduced from 20px */
        overflow-y: auto;
        scrollbar-width: thin;
        scrollbar-color: #888 #f0f0f0;
          transform: translateZ(0); /* Force GPU layer */
    }

#messages::-webkit-scrollbar {
    width: 3px; /* Reduced from 6px */
}

#messages::-webkit-scrollbar-thumb {
    background: #888;
    border-radius: 2px; /* Reduced from 3px */
}
.message {
    display: flex;
    margin-bottom: 5px; /* Reduced from 10px */
     font-size: 15px; /* Reduced from 18px */
   border: none;
  
}
#input-container {
    padding: 16px; /* Reduced from 15px */
    background: rgba(245, 245, 245, 0.9);
    border-top: 1px solid rgba(0, 0, 0, 0.05);
   
}
#input-message {
    width: 80%; /* Reduced from 70% */
    padding: 6px 8px; /* Reduced from 12px 15px */
    border: none;
    border-radius: 25px; /* Reduced from 25px */
    background: #fff;
    box-shadow: 0 2px 3px rgba(0, 0, 0, 0.1); /* Reduced from 5px */
    font-size: 14px; /* Reduced from 14px */
    outline: none;
    margin-right: 5px; /* Reduced from 10px */
}

#input-message:focus {
    box-shadow: 0 2px 4px rgba(0, 123, 255, 0.2); /* Reduced from 8px */
}
#send-button {
    padding: 6px 12px; /* Reduced from 12px 25px */
    background: linear-gradient(45deg, #007bff, #00b4ff);
    color: white;
    border: none;
    border-radius: 19px; /* Reduced from 25px */
    cursor: pointer;
    font-weight: 600;
    text-transform: uppercase;
    letter-spacing: 0.5px; /* Reduced from 1px */
    transition: transform 0.2s, box-shadow 0.2s;
}

#send-button:hover {
    transform: translateY(-1px); /* Reduced from -2px */
    box-shadow: 0 2px 8px rgba(0, 123, 255, 0.3); /* Reduced from 15px */
}
@keyframes fadeIn {
  from { opacity: 0; transform: translateY(5px); } /* Reduced from 10px */
  to { opacity: 1; transform: translateY(0); }
}
     .bubble {
    background-color: #f9f9f9;
    margin-bottom: 8px;
    max-width: 80%;
    border: none;
  }

  .text-row {
    display: flex;
    align-items: center;
    gap: 10px; /* Space between username and message */
  }
  .message-text {
    color: #000;
    word-break: break-word;
    flex: 1;
     border: none;
  }
  .chat-section.card {
  max-width: 700px;
  margin: 60px auto 0 auto;
  padding: 32px 28px 24px 28px;
  border-radius: 22px;
  box-shadow: 0 8px 32px 0 rgba(31, 38, 135, 0.28);
  border: 2px solid #fff8;
  color: #fff;
  backdrop-filter: blur(32px) saturate(1.8);
  -webkit-backdrop-filter: blur(32px) saturate(1.8);
}
</style>
