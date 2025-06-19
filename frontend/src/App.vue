<template>
  <div id="app" class="card">
    <div class="min-h-screen flex flex-col">
      <header>
        <h1 style="font-size: 23px; margin-left: 5%">𝓢𝔂𝓷𝓬</h1>
        <div class="user-section" style="gap: 12px; display: flex; align-items: center;">
          <i
            class="fas fa-search"
            @click="navigateToSearch"
            style="font-size: 24px; color: #007bff; cursor: pointer;"
            aria-label="Open search page"
          ></i>
          <div class="relative">
            <span class="username-display" @click="toggleProfileMenu">{{ userProfile.username }}</span>
            <Transition name="fade">
              <div v-if="showProfileMenu" class="profile-menu">
                <button @click="authAction">{{ isSignedIn ? 'Logout' : 'Login' }}</button>
              </div>
            </Transition>
          </div>
        </div>
      </header>

      <main>
        <Suspense>
          <router-view />

          <template #fallback>
            <div class="loading-spinner">Loading...</div>
          </template>
        </Suspense>
      </main>

      <Notification ref="notifier" />

      <nav class="glassmorphism">
        <ul>
          <li
            v-for="tab in tabs"
            :key="tab.name"
            :class="{ active: currentTab === tab.name }"
            @click="switchTab(tab.name)"
          >
            <i :class="tab.icon"></i>
          </li>
        </ul>
      </nav>

      <Float />
    </div>
  </div>
</template>

<script>
import { defineAsyncComponent, shallowReactive } from 'vue'

// Lazy load components
const Posts = defineAsyncComponent(() => import('./Posts.vue'))
const Videos = defineAsyncComponent(() => import('./Videos.vue'))
const Chat = defineAsyncComponent(() => import('./Chat.vue'))        // User list
const Settings = defineAsyncComponent(() => import('./Settings.vue'))
const Search2 = defineAsyncComponent(() => import('./Search2.vue'))
const Float = defineAsyncComponent(() => import('./Float.vue'))

import Chatbox from './Chatbox.vue'  // Single chatbox component
import Notification from './Notification.vue'

// Cache for decoded JWTs
const jwtCache = new Map()

export default {
  name: 'App',
  components: { Posts, Videos, Chat, Chatbox, Settings, Search2, Float, Notification },

  data() {
    return {
      currentTab: 'posts',
      searchQuery: '',
      showProfileMenu: false,
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
        { name: 'settings', icon: 'fas fa-cog' }
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
      const username = this.userProfile.username
      return username && username !== 'Guest'
    }
  },
    
  
  methods: {
    navigateToSearch() {
      this.showProfileMenu = false

      if (this.searchQuery.trim()) {
        this.$router.push('/user/' + this.searchQuery.trim())
        this.searchQuery = ''
      } else {
        this.switchTab('search')
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
      if (this.currentTab === tab) return

      this.showProfileMenu = false
      this.currentTab = tab

      switch (tab) {
        case 'posts':
          this.$router.push('/posts')
          break
        case 'videos':
          this.$router.push('/videos')
          break
        case 'chat':
          this.$router.push('/chat')  // User list route
          break
        case 'settings':
          this.$router.push('/settings')
          break
        case 'search':
          this.$router.push('/search')
          break
        default:
          this.$router.push('/')
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

      const currentUsername = this.userProfile.username
      if (decoded?.username && decoded.username !== currentUsername) {
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
            localStorage.setItem(key, value)
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
      const routeTabMap = {
        UserProfile: 'search',
        Posts: 'posts',
        Videos: 'videos',
        Chat: 'chat',
        Chatbox: 'chat',
        Settings: 'settings',
        Search2: 'search'
      }

      this.currentTab = routeTabMap[to.name] || 'posts'
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

    // Validate userId: must be a valid UUID (36 chars, 4 dashes)
    const userId = localStorage.getItem('userId')
    if (userId && !/^([0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12})$/i.test(userId)) {
      // Invalid userId, force logout and clear storage
      localStorage.clear()
      Object.assign(this.userProfile, {
        username: 'Guest',
        userId: null,
        profilePic: 'default-pic.png'
      })
      this.showNotification('Session expired or invalid user. Please log in again.', true)
      this.$router.push('/')
      return
    }

    const token = localStorage.getItem('authToken')
    if (token) {
      this.verifyToken(token)
    }

    let storageTimeout
    const handleStorage = (event) => {
      if (["username", "userId", "profilePic"].includes(event.key)) {
        clearTimeout(storageTimeout)
        storageTimeout = setTimeout(() => {
          this.updateUserProfile()
        }, 100)
      }
    }

    window.addEventListener('storage', handleStorage, { passive: true })
    // Cleanup for Vue 3
    this.$.appContext.app.config.globalProperties.__onUnmount = () => {
      window.removeEventListener('storage', handleStorage)
      clearTimeout(storageTimeout)
    }

    this.updateUserProfile()
  }
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
  color: blue;
  cursor: pointer;
  margin-right: 16px;
  padding: 4px 8px;
  margin-top: 30%;
  border-radius: 4px;
  transition: background-color 0.2s;
}
#app.card {
  min-height: 100vh;
  background: none;
  box-shadow: none;
  border: none;
}
</style>
