<template>
  <div :class="[ 'app-wrapper', { 'chatbox-fullscreen': isChatboxRoute }]">
    <!-- Header (hidden in Chatbox) -->
    <header v-if="!isChatboxRoute">
   <h1 style="font-size: 23px; margin-left: 3%; display: flex; align-items: center; gap: 8px;"><svg viewBox="0 0 64 64" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linejoin="round" stroke-linecap="round" xmlns="http://www.w3.org/2000/svg" style="width:24px; height:24px;"><path d="M32 2 L38 26 L62 32 L38 38 L32 62 L26 38 L2 32 L26 26 Z"/><path d="M32 12 L36 28 L52 32 L36 36 L32 52 L28 36 L12 32 L28 28 Z"/><line x1="32" y1="2" x2="32" y2="62"/><line x1="2" y1="32" x2="62" y2="32"/></svg>𝓢𝔂𝓷𝓬</h1>

      <div class="user-section" style="gap: 12px; display: flex; align-items: center;">
        <i
          class="fas fa-search"
          @click="navigateToSearch"
          style="font-size: 24px;  cursor: pointer;"
          aria-label="Open search page"
        ></i>
        <div class="relative">
          <span
            class="username-display"
            @click.stop="toggleProfileMenu"
            style="cursor: pointer;"
          >
            {{ userProfile.username }}
          </span>
          <Transition name="fade">
            <div
              v-if="showProfileMenu"
              class="profile-menu"
              @click.outside="showProfileMenu = false"
              tabindex="0"
            >
              <button @click="authAction">{{ isSignedIn ? 'Logout' : 'Login' }}</button>
            </div>
          </Transition>
        </div>
      </div>
    </header>

    <!-- Main Content -->
  <Suspense>
    <keep-alive include="Posts,Videos,Chat,Settings,Search2">
      <router-view />
    </keep-alive>

    <template #fallback>
      <div class="loading-spinner">Loading...</div>
    </template>
  </Suspense>

    <!-- Notifications -->
    <Notification ref="notifier" />

    <!-- Nav (hidden in Chatbox) -->
    <nav class="glassmorphism" v-if="!isChatboxRoute">
      <ul>
        <li
          v-for="tab in tabs"
          :key="tab.name"
          :class="{ active: currentTab === tab.name }"
          @click="switchTab(tab.name)"
          style="cursor: pointer;"
        >
          <i :class="tab.icon"></i>
        </li>
      </ul>
    </nav>

    <!-- Floating Action Button (optional: hide if needed) -->
    <Float v-if="!isChatboxRoute" />
  </div>
</template>

<script>
import { defineAsyncComponent, shallowReactive } from 'vue'
import Button from 'primevue/button';

const Posts = defineAsyncComponent(() => import('./Posts.vue'))
const Videos = defineAsyncComponent(() => import('./Videos.vue'))
const Chat = defineAsyncComponent(() => import('./Chat.vue'))
const Settings = defineAsyncComponent(() => import('./Settings.vue'))
const Search2 = defineAsyncComponent(() => import('./Search2.vue'))
const Float = defineAsyncComponent(() => import('./Float.vue'))

import Chatbox from './Chatbox.vue'
import Notification from './Notification.vue'

const jwtCache = new Map()

export default {
  name: 'App',
  components: {
    Posts, Videos, Chat, Chatbox, Settings, Search2, Float, Notification
  },

  data() {
    return {
      currentTab: 'posts',
      searchQuery: '',
      showProfileMenu: false,
      tabRoutes: ['Posts', 'Videos', 'Chat', 'Settings'],
      userProfile: shallowReactive({
        username: localStorage.getItem('username') || 'Guest',
        userId: localStorage.getItem('userId') || null,
        profilePic: localStorage.getItem('profilePic') || 'default-pic.png',
      }),
      settings: shallowReactive({
        darkMode: false,
        notifications: true,
      }),
      tabs: [
        { name: 'posts', icon: 'fas fa-home' },
        { name: 'videos', icon: 'fab fa-youtube' },
        { name: 'chat', icon: 'fas fa-comment' },
        { name: 'settings', icon: 'fas fa-cog' },
      ]
    }
  },

  provide() {
    return {
      notify: this.showNotification
    }
  },

  computed: {
    isSignedIn() {
      return this.userProfile.username && this.userProfile.username !== 'Guest'
    },
    isChatboxRoute() {
      return this.$route.name === 'Chatbox'
    },
  },

  methods: {
    navigateToSearch() {
      this.showProfileMenu = false

      if (this.searchQuery.trim()) {
        this.$router.push('/user/' + this.searchQuery.trim())
        this.searchQuery = ''
      } else {
        this.$router.push('/search')
      }
    },

    showNotification(message, isError = false) {
      const notifier = this.$refs.notifier
      if (notifier && typeof notifier.showNotification === 'function') {
        notifier.showNotification(message, isError)
      } else {
        console.warn('Notifier not ready yet')
      }
    },

    switchTab(tab) {
      this.showProfileMenu = false
      if (this.currentTab === tab) return

      this.currentTab = tab

      const componentMap = {
        posts: null, // handled locally (root path)
        videos: 'Videos',
        chat: 'Chat',
        settings: 'Settings'
      }

      const routeName = componentMap[tab]
      if (routeName) {
        this.$router.push({ name: routeName }).catch(() => {}) // ignore redundant navigation
      } else {
        this.$router.push('/').catch(() => {})
      }
    },

    toggleProfileMenu() {
      this.showProfileMenu = !this.showProfileMenu
    },

    decodeJWT(token) {
      if (jwtCache.has(token)) return jwtCache.get(token)
      try {
        const base64Url = token.split('.')[1]
        const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/')
        const jsonPayload = decodeURIComponent(
          atob(base64)
            .split('')
            .map(c => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
            .join('')
        )
        const decoded = JSON.parse(jsonPayload)
        jwtCache.set(token, decoded)
        return decoded
      } catch {
        return null
      }
    },

    async verifyToken(token) {
      const decoded = this.decodeJWT(token)
      if (!decoded) return this.authAction()

      if (
        decoded?.username &&
        (!this.isSignedIn ||
          decoded.username !== this.userProfile.username ||
          !this.userProfile.userId)
      ) {
        try {
          const res = await fetch('https://1999-theta.vercel.app/api/authorize', {
            method: 'GET',
            headers: {
              Authorization: `Bearer ${token}`,
              'Content-Type': 'application/json',
            },
          })

          if (!res.ok) return this.authAction()

          const data = await res.json()

          const updates = {
            username: decoded.username,
            userId: decoded.userId || data.user.userId,
            profilePic: decoded.profilePic || data.user.profilePic || 'default-pic.png'
          }

          Object.entries(updates).forEach(([key, value]) => {
            if (localStorage.getItem(key) !== value) {
              localStorage.setItem(key, value)
            }
          })

          this.updateUserProfile()
        } catch {
          this.authAction()
        }
      }
    },

    authAction() {
      if (this.isSignedIn) {
        localStorage.clear()
        Object.assign(this.userProfile, {
          username: 'Guest',
          userId: null,
          profilePic: 'default-pic.png'
        })
      }
      this.showProfileMenu = false
      window.location.href = 'https://latestnewsandaffairs.site/public/signup'
    },

    updateUserProfile() {
      Object.assign(this.userProfile, {
        username: localStorage.getItem('username') || 'Guest',
        userId: localStorage.getItem('userId') || null,
        profilePic: localStorage.getItem('profilePic') || 'default-pic.png'
      })
    },

    updateSettings(newSettings) {
      Object.assign(this.settings, newSettings)
    },

    handleRouteChange(to) {
      const tabRoutes = this.tabRoutes.map(r => r.toLowerCase())
      if (to.name && tabRoutes.includes(to.name.toLowerCase())) {
        this.currentTab = to.name.toLowerCase()
      } else {
        this.currentTab = 'posts' // fallback tab
      }
    },

    // Example method to toggle floating panel from here via store
    toggleFloatingPanel() {
      this.uiStore.toggleFloatPanel()
    }
  },

  watch: {
    $route: {
      handler: 'handleRouteChange',
      immediate: true
    }
  },

  async mounted() {
    this.handleRouteChange(this.$route)

    const token = localStorage.getItem('authToken')
    if (token) {
      this.verifyToken(token)
    }

    let storageTimeout
    const handleStorage = (event) => {
      if (['username', 'userId', 'profilePic'].includes(event.key)) {
        clearTimeout(storageTimeout)
        storageTimeout = setTimeout(() => {
          this.updateUserProfile()
        }, 100)
      }
    }
    window.addEventListener('storage', handleStorage, { passive: true })
    this.$.appContext.app.config.globalProperties.__onUnmount = () => {
      window.removeEventListener('storage', handleStorage)
      clearTimeout(storageTimeout)
    }

    this.updateUserProfile()
  },
}
</script>
<style scoped>
.fade-enter-active, .fade-leave-active {
  transition: opacity 0.2s ease;
}
.fade-enter-from, .fade-leave-to {
  opacity: 0;
}
.username-display {
  font-size: 19px;
  cursor: pointer;
  margin-right: 16px;
  padding: 4px 8px;
  margin-top: 30%;
  border-radius: 4px;
  transition: background-color 0.2s;
}
</style>
