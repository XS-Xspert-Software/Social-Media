<template>
  <div :class="['app-wrapper', { 'Chatbox-fullscreen': iChatboxRoute }]">

    <!-- Header (hidden in'Chatbox) -->
    <header v-if="!iChatboxRoute">
      <h1 style="font-size: 23px; margin-left: 3%; display: flex; align-items: center; gap: 8px;">
        <svg viewBox="0 0 64 64" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linejoin="round" stroke-linecap="round" xmlns="http://www.w3.org/2000/svg" style="width:24px; height:24px;">
          <path d="M32 2 L38 26 L62 32 L38 38 L32 62 L26 38 L2 32 L26 26 Z"/>
          <path d="M32 12 L36 28 L52 32 L36 36 L32 52 L28 36 L12 32 L28 28 Z"/>
          <line x1="32" y1="2" x2="32" y2="62"/>
          <line x1="2" y1="32" x2="62" y2="32"/>
        </svg>
        𝓢𝔂𝓷𝓬
      </h1>

      <div class="user-section" style="gap: 12px; display: flex; align-items: center;">
        <i
          class="fas fa-search"
          @click="navigateToSearch"
          style="font-size: 24px; cursor: pointer;"
          aria-label="Open search page"
        ></i>
        <div class="relative">
          <span class="username-display" @click.stop="toggleProfileMenu" style="cursor: pointer;">
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

  <!-- Layout container adapts based on current route -->
<div class="layout-container" v-if="!iChatboxRoute">
    
    <div class="sidebar" v-if="!iChatboxRoute">
  <ul class="sidebar-tabs">
    <li
      v-for="tab in tabs"
      :key="tab.name"
      :class="{ active: currentTab === tab.name }"
      @click="switchTab(tab.name)"
      class="sidebar-tab-btn"
    >
     
      <span class="tab-label">{{ tab.label }}</span>

    </li>
  </ul>

<!-- Add sort buttons only for "posts" tab -->
<div class="sidebar-sort" v-if="currentTab === 'posts'">
  <button
    class="sort-button sort-general"
    :class="{ active: selectedSort === 'most-liked' }"
    @click="emitSort('most-liked')"
  >General</button>

  <button
    class="sort-button sort-trending"
    :class="{ active: selectedSort === 'most-comments' }"
    @click="emitSort('most-comments')"
  >Trending</button>

  <button
    class="sort-button sort-newest"
    :class="{ active: selectedSort === 'newest' }"
    @click="emitSort('newest')"
  >Newest</button>
</div>

<!-- Support Us Section -->
<div class="sidebar-support">
  <div class="support-header">
    <i class="fas fa-heart"></i>
    <span>Support Us</span>
  </div>
  <a 
    href="https://patreon.com/syncsocial" 
    target="_blank" 
    class="patreon-link"
    rel="noopener noreferrer"
  >
    <i class="fab fa-patreon"></i>
    <span>Patreon</span>
  </a>
</div>

</div>
      <!-- Main Content -->
      <div class="main-content">
        <Suspense>
          <keep-alive include="Posts,Videos'Chat,Settings,Search2">
            <router-view />
          </keep-alive>

          <template #fallback>
            <div class="loading-spinner">Loading...</div>
          </template>
        </Suspense>
      </div>
    </div>

    <!-- If'Chatbox Route (no sidebar) -->
    <div v-else>
      <Suspense>
        <router-view />
      </Suspense>
    </div>

    <!-- Notifications -->
    <Notification ref="notifier" />

    <!-- Bottom nav -->
  <nav v-if="!isChatboxRoute">
    <ul class="bottom-nav">
        <li
          v-for="tab in tabs"
          :key="tab.name"
          :class="{ active: currentTab === tab.name }"
          @click="switchTab(tab.name)"
          class="bottom-nav-btn"
          style="cursor: pointer;"
        >
          <i :class="tab.icon"></i>
        </li>
      </ul>
    </nav>

    <!-- Floating Action Button -->
  <Float />
  
  
  </div>
</template>


<script>
import { computed } from 'vue'
import { defineAsyncComponent, shallowReactive } from 'vue'

const posts = defineAsyncComponent(() => import('./Posts.vue'))
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
    posts, Videos,Chat,Chatbox, Settings, Search2, Float, Notification
  },

  data() {
    return {
      currentTab: 'posts',
      searchQuery: '',
      selectedSort: 'most-liked', // ← keep it as a normal string
      showProfileMenu: false,
      tabRoutes: ['posts', 'Videos', 'Chat', 'Settings'],
      hover: null,
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
  { name: 'posts', label: 'Posts', icon: 'fas fa-home' },
  { name: 'videos', label: 'Videos', icon: 'fab fa-youtube' },
  { name: 'chat', label: 'Chat', icon: 'fas fa-comment' },
  { name: 'settings', label: 'Settings', icon: 'fas fa-cog' },
]
    }
  },

  provide() {
    return {
      notify: this.showNotification,
      selectedSort: computed({
        get: () => this.selectedSort,
        set: (val) => { this.selectedSort = val }
      })
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
    emitSort(type) {
      this.selectedSort = type // ✅ this works now
    },

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
        posts: null,
        videos: 'Videos',
        chat: 'Chat',
        settings: 'Settings'
      }

      const routeName = componentMap[tab]
      if (routeName) {
        this.$router.push({ name: routeName }).catch(() => {})
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
        this.currentTab = 'posts'
      }
    },

    toggleFloatingPanel() {
      this.uiStore?.toggleFloatPanel?.()
    }
  },

  watch: {
    $route: {
      handler: 'handleRouteChange',
      immediate: true
    }
  },

  mounted() {
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
  cursor: pointer;
  margin-right: 16px;
  padding: 4px 8px;
  margin-top: 30%;
  border-radius: 4px;
  transition: background-color 0.2s;
}

/* Sidebar tab buttons */
.sidebar-tabs {
  list-style: none;
  padding: 0;
  margin: 0 0 16px 0;
}
.sidebar-tab-btn {
  margin-bottom: 8px;
  border-radius: 8px;
  background: #f5f6fa;
  color: #222;
  padding: 10px 18px;
  font-weight: 500;
  font-size: 17px;
  transition: background 0.18s, color 0.18s, box-shadow 0.18s;
  cursor: pointer;
  border: none;
  outline: none;
  box-shadow: 0 1px 2px rgba(0,0,0,0.03);
  display: flex;
  align-items: center;
}
.sidebar-tab-btn:hover,
.sidebar-tab-btn.active {
  background: linear-gradient(90deg, #6a82fb 0%, #fc5c7d 100%);
  color: #fff;
  box-shadow: 0 2px 8px rgba(108, 99, 255, 0.10);
}

/* Sort buttons */
.sidebar-sort {
  display: flex;
  flex-direction: column;
  gap: 6px;
  margin-top: 12px;
  margin-left: -16px;
  margin-right: -16px;
  padding: 0 16px;
}
.sort-button {
  border: none;
  border-radius: 16px;
  padding: 5px 12px;
  font-size: 13px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.18s ease;
  color: #fff;
  width: 100%;
  text-align: left;
}

/* General button */
.sort-general {
  background: linear-gradient(90deg, #43cea2 0%, #185a9d 100%);
}
.sort-general:not(.active) {
  background: linear-gradient(90deg, rgba(67, 206, 162, 0.6) 0%, rgba(24, 90, 157, 0.6) 100%);
  opacity: 0.7;
}
.sort-general.active {
  box-shadow: 0 4px 15px rgba(67, 206, 162, 0.3);
  transform: translateY(-1px);
}

/* Trending button */
.sort-trending {
  background: linear-gradient(90deg, #ff9800 0%, #ff512f 100%);
}
.sort-trending:not(.active) {
  background: linear-gradient(90deg, rgba(255, 152, 0, 0.6) 0%, rgba(255, 81, 47, 0.6) 100%);
  opacity: 0.7;
}
.sort-trending.active {
  box-shadow: 0 4px 15px rgba(255, 152, 0, 0.3);
  transform: translateY(-1px);
}

/* Newest button */
.sort-newest {
  background: linear-gradient(90deg, #667eea 0%, #764ba2 100%);
}
.sort-newest:not(.active) {
  background: linear-gradient(90deg, rgba(102, 126, 234, 0.6) 0%, rgba(118, 75, 162, 0.6) 100%);
  opacity: 0.7;
}
.sort-newest.active {
  box-shadow: 0 4px 15px rgba(102, 126, 234, 0.3);
  transform: translateY(-1px);
}

/* Bottom nav styling */
.bottom-nav {
  display: flex;
  justify-content: space-around;
  align-items: center;
  background: #fff;
  border-top: 1px solid #ececec;
  padding: 8px 0;
  margin: 0;
  list-style: none;
}
.bottom-nav-btn {
  flex: 1;
  text-align: center;
  border-radius: 50%;
  padding: 8px;
  transition: background 0.18s, color 0.18s;
  color: #888;
  font-size: 22px;
  border: none;
  background: none;
}
.bottom-nav-btn.active,
.bottom-nav-btn:hover {
  background: linear-gradient(90deg, #fc5c7d 0%, #6a82fb 100%);
  color: #fff;
}

/* Layout containers */
.app-wrapper {
  display: flex;
  flex-direction: column;
  height: 100vh;
}

header {
  flex-shrink: 0;
}

.layout-container {
  display: flex;
  flex: 1;
  overflow: hidden;
}

.sidebar {
  width: 240px;
  flex-shrink: 0;
  padding: 16px;
  overflow-y: auto;
}

.main-content {
  flex: 1;
  overflow-y: auto;
}

nav {
  flex-shrink: 0;
}

/* Support section styles */
.sidebar-support {
  margin-top: 24px;
  padding: 16px;
  margin-left: -16px;
  margin-right: -16px;
  border-top: 1px solid rgba(255, 255, 255, 0.1);
}

.support-header {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 14px;
  font-weight: 600;
  color: #fff;
  margin-bottom: 12px;
}

.support-header i {
  color: #ff6b6b;
  font-size: 16px;
}

.patreon-link {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 8px 12px;
  background: linear-gradient(90deg, #ff424d 0%, #ff6b35 100%);
  color: #fff;
  text-decoration: none;
  border-radius: 16px;
  font-size: 13px;
  font-weight: 500;
  transition: all 0.18s ease;
  width: 100%;
  box-sizing: border-box;
}

.patreon-link:hover {
  background: linear-gradient(90deg, #e63946 0%, #f77f00 100%);
  transform: translateY(-1px);
  box-shadow: 0 4px 15px rgba(255, 66, 77, 0.3);
  text-decoration: none;
  color: #fff;
}

.patreon-link i {
  font-size: 16px;
}
</style>



