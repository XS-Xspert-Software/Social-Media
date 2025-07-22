<template>
  <div :class="['app-wrapper', { 'Chatbox-fullscreen': isChatboxRoute, 'no-header-padding': postsStore.selectedPost }]">
    <!-- Header -->
    <header v-if="!isChatboxRoute && !postsStore.selectedPost">
      <h1 style="font-size: 23px; margin-left: 3%; display: flex; align-items: center; gap: 8px;">
        <svg viewBox="0 0 64 64" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linejoin="round" stroke-linecap="round" xmlns="http://www.w3.org/2000/svg" style="width:24px; height:24px;">
          <path d="M32 2 L38 26 L62 32 L38 38 L32 62 L26 38 L2 32 L26 26 Z"/>
          <path d="M32 12 L36 28 L52 32 L36 36 L32 52 L28 36 L12 32 L28 28 Z"/>
          <line x1="32" y1="2" x2="32" y2="62"/>
          <line x1="2" y1="32" x2="62" y2="32"/>
        </svg> 𝓢𝔂𝓷𝓬
      </h1>

      <!-- Profile and Search -->
      <div class="user-section" style="gap: 12px; display: flex; align-items: center;">
        <i class="fas fa-search" @click="navigateToSearch" style="font-size: 24px; cursor: pointer;" aria-label="Open search page"></i>
        <div class="relative">
          <span class="username-display" @click.stop="toggleProfileMenu" style="cursor: pointer;">{{ userProfile.username }}</span>
          <Transition name="fade">
            <div v-if="showProfileMenu" class="profile-menu" @click.outside="showProfileMenu = false" tabindex="0">
              <button @click="authAction">{{ isSignedIn ? 'Logout' : 'Login' }}</button>
            </div>
          </Transition>
        </div>
      </div>
    </header>

    <!-- Layout -->
    <div class="layout-container" :class="{ 'with-right-sidebar': !isChatRoute }">
      <!-- Sidebar -->
      <div class="sidebar">
        <ul class="sidebar-tabs">
          <li  v-for="tab in tabs"
      :key="tab.name"
      :class="{ active: currentTab === tab.name }"
      @click="switchTab(tab.name)"
      class="sidebar-tab-btn">

      <span class="tab-label">{{ tab.label }}</span>

            <!-- 🔴 Notification badge -->
            <span
              v-if="tab.name === 'notification' && unreadCount > 0"
              class="notification-badge"
            >
              {{ unreadCount > 9 ? '9+' : unreadCount }}
            </span>
             
          </li>
        </ul>

        <div class="sidebar-sort" v-if="currentTab === 'posts'">
          <button class="sort-button" :class="{ active: selectedSort === 'most-liked' }" @click="emitSort('most-liked')">General</button>
          <button class="sort-button" :class="{ active: selectedSort === 'most-comments' }" @click="emitSort('most-comments')">Trending</button>
          <button class="sort-button" :class="{ active: selectedSort === 'newest' }" @click="emitSort('newest')">Newest</button>
        </div>
      </div>

      <!-- Main content -->
      <div class="main-content" :class="{ 'no-right-sidebar': isChatRoute }">
        <Suspense>
          <router-view v-slot="{ Component }">
            <keep-alive include="Posts,Videos,Chat,Notification,Settings,Search2,PostPage">
              <component :is="Component" />
            </keep-alive>
          </router-view>
          <template #fallback><div class="loading-spinner">Loading...</div></template>
        </Suspense>
      </div>

      <div class="right-sidebar" v-if="!isChatRoute"></div>
    </div>
    
    <Float />

     <Notification
      v-if="notificationActive"
      :logged-in-username="userProfile.username"
      @notify="handleNotify"
      @friend-request-accepted="handleFriendRequestAccepted"
      @update-unread-count="updateUnreadCount"
      ref="notificationRef"
    />

    <!-- Mobile nav -->
   <!-- Mobile nav -->
<nav v-if="!isChatboxRoute">
  <ul>
    <li
      v-for="tab in tabs"
      :key="tab.name"
      :class="{ active: currentTab === tab.name }"
      @click="switchTab(tab.name)"
      class="bottom-nav-btn"
      style="cursor: pointer;"
    >
      <!-- Use profile pic for settings tab -->
      <template v-if="tab.name === 'settings'">
        <img
          :src="userProfile.profilePic"
          alt="Profile"
          class="profile-pic-icon"
        />
      </template>
      <template v-else>
        <i :class="tab.icon"></i>
      </template>

      <!-- Optional: badge for notifications -->
      <span 
        v-if="tab.name === 'notification' && unreadCount > 0" 
        class="badge"
      >
        {{ unreadCount }}
      </span>
    </li>
  </ul>
</nav>

  </div>
</template>

<script>
import { ref, computed, shallowReactive, defineAsyncComponent } from 'vue';
import Notification from './Notification.vue';
import { usePostsStore } from './stores/postsStore';
import { getLocalStorage, setLocalStorage } from '@/utils/localStorage';

const Posts = defineAsyncComponent(() => import('./posts.vue'));
const Videos = defineAsyncComponent(() => import('./Videos.vue'));
const Chat = defineAsyncComponent(() => import('./chat.vue'));
const Settings = defineAsyncComponent(() => import('./settings.vue'));
const Search2 = defineAsyncComponent(() => import('./Search2.vue'));
const Float = defineAsyncComponent(() => import('./Float.vue'));
const PostPage = defineAsyncComponent(() => import('./PostPage.vue'));

import Chatbox from './Chatbox.vue';
import Alert from './Alert.vue';


const jwtCache = new Map();

export default {
  name: 'App',
  components: {
    Posts,
    Videos,
    Chat,
    Chatbox,
    Settings,
    Notification,
    Search2,
    Float,
    Alert,
    PostPage
  },

  data() {
    return {
      currentTab: 'posts',
      searchQuery: '',
      selectedSort: 'most-liked',
      showProfileMenu: false,
      tabRoutes: ['posts', 'videos', 'chat', 'notification','settings'],
      unreadCount: 0, // unread count for notification badge

      userProfile: shallowReactive({
        username: getLocalStorage('username') || 'Guest',
        userId: getLocalStorage('userId') || null,
        profilePic: getLocalStorage('profilePic') || 'default-pic.png',
      }),

      settings: shallowReactive({
        darkMode: false,
        Alert: true,
      }),

      tabs: [
        { name: 'posts', label: 'Posts', icon: 'fas fa-home' },
        { name: 'videos', label: 'Videos', icon: 'fab fa-youtube' },
        { name: 'chat', label: 'Chat', icon: 'fas fa-comment' },
        { name: 'notification', label: 'Notification', icon: 'fas fa-bolt' },
        { name: 'settings', label: 'Settings', icon: 'fas fa-cog' },
      ],
    };
  },

  provide() {
    return {
      notify: this.showAlert,
      selectedSort: computed({
        get: () => this.selectedSort,
        set: (val) => {
          this.selectedSort = val;
        },
      }),
    };
  },

  computed: {
    postsStore() {
      return usePostsStore();
    },

    isSignedIn() {
      return this.userProfile.username && this.userProfile.username !== 'Guest';
    },

    isChatRoute() {
      return ['Chat', 'Chatbox'].includes(this.$route.name);
    },

    isChatboxRoute() {
      return this.$route.name === 'Chatbox';
    },

    notificationActive() {
      return this.currentTab === 'notification';
    },
  },

  methods: {
    refreshNotifications() {
      if (this.notificationActive && this.$refs.notificationRef?.fetchNotifications) {
        this.$refs.notificationRef.fetchNotifications();
      }
    },

    handleNotify(message, isError = false) {
      this.showAlert(message, isError);
    },

    handleFriendRequestAccepted(friendUsername) {
      this.refreshNotifications();
    },

    emitSort(type) {
      this.selectedSort = type;
    },

    navigateToSearch() {
      this.showProfileMenu = false;
      const trimmed = this.searchQuery.trim();
      if (trimmed) {
        this.$router.push('/user/' + trimmed);
        this.searchQuery = '';
      } else {
        this.$router.push('/search');
      }
    },

    showAlert(message, isError = false) {
      const Alert = this.$refs.Alert;
      if (Alert?.showAlert) {
        Alert.showAlert(message, isError);
      }
    },

    switchTab(tab) {
      this.showProfileMenu = false;
      if (this.currentTab === tab) return;
      this.currentTab = tab;

      const componentMap = {
        posts: null,
        videos: 'Videos',
        chat: 'Chat',
        notification: 'Notification',
        settings:'Settings'
      };

      const routeName = componentMap[tab];
      if (routeName) {
        this.$router.push({ name: routeName }).catch(() => {});
      } else {
        this.$router.push('/').catch(() => {});
      }

      if (tab === 'notification') {
        this.refreshNotifications();
      }
    },

    toggleProfileMenu() {
      this.showProfileMenu = !this.showProfileMenu;
    },

    decodeJWT(token) {
      if (jwtCache.has(token)) return jwtCache.get(token);
      try {
        const base64Url = token.split('.')[1];
        const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
        const jsonPayload = decodeURIComponent(
          atob(base64)
            .split('')
            .map((c) => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
            .join('')
        );
        const decoded = JSON.parse(jsonPayload);
        jwtCache.set(token, decoded);
        return decoded;
      } catch {
        return null;
      }
    },

    async verifyToken(token) {
      const decoded = this.decodeJWT(token);
      if (!decoded) return this.authAction();

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
          });

          if (!res.ok) return this.authAction();

          const data = await res.json();

          const updates = {
            username: decoded.username,
            userId: decoded.userId || data.user.userId,
            profilePic: decoded.profilePic || data.user.profilePic || 'default-pic.png',
          };

          Object.entries(updates).forEach(([key, value]) => {
            if (getLocalStorage(key) !== value) {
              setLocalStorage(key, value);
            }
          });

          this.updateUserProfile();
        } catch {
          this.authAction();
        }
      }
    },

    authAction() {
      if (this.isSignedIn) {
        ['username', 'userId', 'profilePic', 'authToken'].forEach((key) => {
          setLocalStorage(key, '');
        });
        Object.assign(this.userProfile, {
          username: 'Guest',
          userId: null,
          profilePic: 'default-pic.png',
        });
      }
      this.showProfileMenu = false;
      window.location.href = 'https://latestnewsandaffairs.site/public/signup';
    },

    updateUserProfile() {
      Object.assign(this.userProfile, {
        username: getLocalStorage('username') || 'Guest',
        userId: getLocalStorage('userId') || null,
        profilePic: getLocalStorage('profilePic') || 'default-pic.png',
      });
    },

    updateUnreadCount(count) {
      this.unreadCount = count;
    },

    handleRouteChange(to) {
      const tabRoutes = this.tabRoutes.map((r) => r.toLowerCase());
      if (to.name && tabRoutes.includes(to.name.toLowerCase())) {
        this.currentTab = to.name.toLowerCase();
      } else {
        this.currentTab = 'posts';
      }
    },
  },

  watch: {
    $route: {
      handler: 'handleRouteChange',
      immediate: true,
    },

    currentTab(newTab) {
      if (newTab === 'notification') {
        this.refreshNotifications();
      }
    },
  },

  mounted() {
    this.handleRouteChange(this.$route);
    this.postsStore.initialize(this.showAlert);

    const token = getLocalStorage('authToken');
    if (token) {
      this.verifyToken(token);
    }

    let storageTimeout;
    const handleStorage = (event) => {
      if (['username', 'userId', 'profilePic'].includes(event.key)) {
        clearTimeout(storageTimeout);
        storageTimeout = setTimeout(() => {
          this.updateUserProfile();
        }, 100);
      }
    };

    window.addEventListener('storage', handleStorage, { passive: true });

    this.$.appContext.app.config.globalProperties.__onUnmount = () => {
      window.removeEventListener('storage', handleStorage);
      clearTimeout(storageTimeout);
    };

    this.updateUserProfile();
  },

  unmounted() {
    if (this.$refs.notificationRef?.cleanup) {
      this.$refs.notificationRef.cleanup();
    }
  },
};
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




