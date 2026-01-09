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
        </svg> Sync
      </h1>
  
      <!-- Profile and Search -->
      <div class="user-section" style="gap: 12px; display: flex; align-items: center;">
         <i class="fas fa-search" @click="navigateToSearch" style="font-size: 24px; cursor: pointer;" aria-label="Open search page"></i>
        <button
          class="theme-toggle-btn"
          :aria-label="theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'"
          @click="toggleTheme"
        >
          <i :class="theme === 'dark' ? 'fas fa-sun' : 'fas fa-moon'"></i>
        </button>
        <div class="relative">
          <span class="username-display" @click.stop="toggleProfileMenu" style="cursor: pointer;">{{ userProfile.username }}</span>
          <Transition name="fade">
            <div v-if="showProfileMenu" class="profile-menu" @click.outside="showProfileMenu = false" tabindex="0">
              <button style="background-color: #e7e7e7;" @click="authAction">{{ isSignedIn ? 'Logout' : 'Login' }}</button>
            </div>
          </Transition>
        </div>
      </div>
    </header>

    <!-- New user welcome banner (dismissible) -->
    <WelcomeBanner v-if="showWelcomeBanner" @dismiss="dismissWelcomeBanner" />

    <!-- Login prompt for guests (hide on routes that render their own prompt) -->
    <LoginPrompt
      v-if="!isSignedIn && !routeHasOwnLoginPrompt"
      :inline="false"
      @login="() => authAction()"
    />

    <!-- Layout -->
    <div class="layout-container" :class="{ 'with-right-sidebar': !isChatRoute }">
      <!-- Sidebar -->
      <div class="sidebar">
        <ul class="sidebar-tabs">
 <li
  v-for="tab in tabs"
  :key="tab.name"
  :class="{ active: currentTab === tab.name }"
  @click="switchTab(tab.name)"
  class="sidebar-tab-btn"
  style="display: flex;gap: 30px;"
>
  <i :class="tab.icon" style="margin-right: 8px;"></i>
  <span>{{ tab.label }}</span>

            <!-- 🔴 Notification badge -->
            <span
              v-if="tab.name === 'notification' && unreadCount > 0"
              class="notification-badge"
            >
              {{ unreadCount > 9 ? '9+' : unreadCount }}
            </span>
             
            <span
      v-if="tab.name === 'chat' && unreadMessagesCount > 0"
      class="notification-badge"
      style="background-color: #10b981; color: white;"
    >
      {{ unreadMessagesCount > 99 ? '99+' : unreadMessagesCount }}
    </span>
          </li>
        </ul>

       <div class="sidebar-sort" v-if="currentTab === 'posts'">
  <button class="sort-button" :class="{ active: selectedSort === 'general' }" @click="emitSort('general')" style="display: flex; gap: 30px;"><i class="fas fa-atom"></i> General</button>
  <button class="sort-button" :class="{ active: selectedSort === 'trending' }" @click="emitSort('trending')" style="display: flex; gap: 30px;"><i class="fas fa-fire"></i> Trending</button>
  <button class="sort-button" :class="{ active: selectedSort === 'story_rant' }" @click="emitSort('story_rant')" style="display: flex; gap: 30px;"><i class="fas fa-comment-dots"></i> Stories</button>
  <button class="sort-button" :class="{ active: selectedSort === 'sports' }" @click="emitSort('sports')" style="display: flex; gap: 30px;"><i class="fas fa-futbol"></i> Sports</button>
  <button class="sort-button" :class="{ active: selectedSort === 'entertainment' }" @click="emitSort('entertainment')" style="display: flex; gap: 30px;"><i class="fas fa-film"></i> Entertainment</button>
  <button class="sort-button" :class="{ active: selectedSort === 'news' }" @click="emitSort('news')" style="display: flex; gap: 30px;"><i class="fas fa-newspaper"></i> News</button>
</div>
      </div>

      <!-- Main content -->
      <div class="main-content" :class="{ 'no-right-sidebar': isChatRoute}">
        <Suspense>
          <router-view v-slot="{ Component }">
            <keep-alive include="Posts,Videos,Chat,Notification,Settings,Search2,PostPage">
              <component :is="Component" />
            </keep-alive>
          </router-view>
          <template #fallback><div class="loading-spinner">Loading...</div></template>
        </Suspense>
      </div>

      <div class="right-sidebar" v-if="!isChatRoute">
        <RightSidebar />
      </div>
    </div>
    
<Float />

  <!-- Render Notification globally except when already on notifications route -->
    <Notification
      v-if="!isNotificationsRoute"
      :logged-in-username="userProfile.username"
      :show-ui="notificationActive"
      @notify="handleNotify"
      @friend-request-accepted="handleFriendRequestAccepted"
      @update-unread-count="updateUnreadCount"
      ref="notificationRef"
    />

   <!-- Mobile nav -->
<nav v-if="!isChatboxRoute" class="mobile-bottom-nav" aria-label="Primary">
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
  @error="event => event.target.src = 'https://endless.sbs/download.jpeg'"
  />
</template>

      <template v-else>
        <i :class="tab.icon"></i>
      </template>

      <!-- Badge for notifications -->
      <span 
        v-if="tab.name === 'notification' && unreadCount > 0" 
        class="badge"
      >
        {{ unreadCount > 99 ? '99+' : unreadCount }}
      </span>
      <span 
        v-if="tab.name === 'chat' && unreadMessagesCount > 0" 
        class="badge"
        style="background-color: #10b981;"
      >
        {{ unreadMessagesCount > 99 ? '99+' : unreadMessagesCount }}
      </span>
    </li>
  </ul>
</nav>

  </div>
</template>

<script>
/*
  App.vue
  Main application shell for the Pulse frontend.

  Responsibilities:
  - Layout and global UI (header, sidebar, right sidebar, mobile nav)
  - Theme application and persistence
  - User profile synchronization with localStorage
  - Routing helpers to map tabs to routes
  - Global notification and alert plumbing

  Note: keep logic here focused on app-level concerns; heavy page logic
  belongs in the individual route components (Posts, Chat, etc.).
*/
import { ref, computed, shallowReactive, defineAsyncComponent } from 'vue';
import Notification from './Notification.vue';
import { usePostsStore } from './stores/postsStore';
import RightSidebar from './RightSidebar.vue';
import { getLocalStorage, setLocalStorage } from '@/utils/localStorage';
import { getTotalUnreadCount } from './recents.js';

const Posts = defineAsyncComponent(() => import('./Posts.vue'));
const Videos = defineAsyncComponent(() => import('./Videos.vue'));
const Chat = defineAsyncComponent(() => import('./Chat.vue'));
const Settings = defineAsyncComponent(() => import('./Settings.vue'));
const Search2 = defineAsyncComponent(() => import('./Search2.vue'));
const Float = defineAsyncComponent(() => import('./Float.vue'));
const PostPage = defineAsyncComponent(() => import('./PostPage.vue'));

import Chatbox from './Chatbox.vue';
import Alert from './Alert.vue';
import LoginPrompt from './LoginPrompt.vue';
import WelcomeBanner from './WelcomeBanner.vue';

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
    RightSidebar,
    Float,
    Alert,
  LoginPrompt,
    WelcomeBanner,
    PostPage
  },

  data() {
    return {
      currentTab: 'posts',
      searchQuery: '',
      selectedSort: 'general',
      showProfileMenu: false,
      tabRoutes: ['posts', 'videos', 'chat', 'notification', 'settings'],
      unreadCount: 0,
      unreadMessagesCount: 0,

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

      theme: localStorage.getItem('sync-theme') || 'light',
      showWelcomeBanner: !localStorage.getItem('sync_seen_welcome_v1'),
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
  // Treat chat child views as chat route for layout purposes
  const n = this.$route.name;
    return ['Chat', 'ChatHome', 'LiveChat', 'WorldChat', 'GroupChat', 'Chatbox', 'ChatFriends', 'ChatLive', 'ChatWorld'].includes(n);
    },

    routeHasOwnLoginPrompt() {
      const name = this.$route.name;
      // Routes that already render their own login prompts
      const ownsPrompt = ['Settings', 'Chat', 'ChatHome', 'LiveChat', 'WorldChat', 'GroupChat', 'Chatbox', 'Notification', 'ChatFriends', 'ChatLive', 'ChatWorld'];
      return ownsPrompt.includes(name);
    },

    isNotificationsRoute() {
      return this.$route.name === 'Notification';
    },

    isChatboxRoute() {
      return this.$route.name === 'Chatbox';
    },

    notificationActive() {
      return this.currentTab === 'notification';
    },

    loginHref() {
      // Centralize login target so we can change it easily in one place
  return 'https://endless.sbs/public/signup';
    },
  },

  created() {
    // Ensure a theme is applied immediately when the app is created.
    // The theme is persisted in localStorage under 'sync-theme'. If no
    // value exists, default to 'light'.
    this.applyTheme(this.theme || 'light');
  },

  watch: {
    theme: {
      immediate: true,
      handler(val) {
        this.applyTheme(val);
      },
    },
  },

  methods: {
    dismissWelcomeBanner() {
      try {
        localStorage.setItem('sync_seen_welcome_v1', '1');
        this.showWelcomeBanner = false;
      } catch (e) {
        this.showWelcomeBanner = false;
      }
    },
    applyTheme(val) {
      // Apply a theme value to the document and persist it.
      // Accepts 'light' or 'dark' (any non-'light' value will use 'dark').
      const nextTheme = val === 'light' ? 'light' : 'dark';
      document.documentElement.setAttribute('data-theme', nextTheme);
      document.body.classList.toggle('theme-light', nextTheme === 'light');
      document.body.classList.toggle('theme-dark', nextTheme === 'dark');
      localStorage.setItem('sync-theme', nextTheme);
    },
    prepareLoginRedirect(targetPath) {
      try {
        const next = targetPath || this.$route.fullPath || '/';
        setLocalStorage('postLoginRedirect', next);
      } catch {}
    },
    async fetchUnreadMessagesCount() {
      if (!this.isSignedIn || !this.userProfile.userId) {
        this.unreadMessagesCount = 0;
        return;
      }

      try {
        this.unreadMessagesCount = await getTotalUnreadCount(this.userProfile.userId);
      } catch (error) {
        console.error('Error fetching unread messages:', error);
        this.unreadMessagesCount = 0;
      }
    },

    refreshNotifications() {
      if (this.$refs.notificationRef?.fetchNotifications) {
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
      this.postsStore.sortPosts(type);
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
      
      // Clear unread messages count when entering chat
      if (tab === 'chat') {
        this.unreadMessagesCount = 0;
      }
      
      this.currentTab = tab;

      const componentMap = {
        posts: null,
        videos: 'Videos',
        chat: 'Chat',
        settings: 'Settings',
        notification: 'Notification'
      };

      if (tab === 'notification') {
  // Use named route to avoid case/casing issues
  this.$router.push({ name: 'Notification' }).catch(() => {});
        return;
      }

      const routeName = componentMap[tab];
      if (routeName) {
        this.$router.push({ name: routeName }).catch(() => {});
      } else {
        this.$router.push('/').catch(() => {});
      }
    },

    toggleTheme() {
      this.theme = this.theme === 'dark' ? 'light' : 'dark';
      this.applyTheme(this.theme);
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
  this.prepareLoginRedirect();
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
  const next = encodeURIComponent(this.$route.fullPath || '/');
  window.location.href = `https://endless.sbs/public/signup?next=${next}`;
    },

    updateUserProfile() {
      Object.assign(this.userProfile, {
        username: getLocalStorage('username') || 'Guest',
        userId: getLocalStorage('userId') || null,
        profilePic: getLocalStorage('profilePic') || 'default-pic.png',
      });
      
      if (this.isSignedIn) {
        this.$nextTick(() => {
          this.refreshNotifications();
          this.fetchUnreadMessagesCount();
          // If we have a stored redirect target from pre-login, route to it once
          const next = getLocalStorage('postLoginRedirect');
          if (next) {
            try {
              this.$router.push(next).catch(() => {});
            } finally {
              setLocalStorage('postLoginRedirect', '');
            }
          }
        });
      }
    },

    updateUnreadCount(count) {
      this.unreadCount = count;
    },

    handleRouteChange(to) {
      const tabRoutes = this.tabRoutes.map((r) => r.toLowerCase());
      const name = (to.name || '').toString();
      const lower = name.toLowerCase();
      // Normalize chat child routes to 'chat'
  const chatNames = ['chat', 'chathome', 'livechat', 'worldchat'];
      if (chatNames.includes(lower)) {
        this.currentTab = 'chat';
        return;
      }
      if (name && tabRoutes.includes(lower)) {
        this.currentTab = lower;
        return;
      }
      this.currentTab = 'posts';
    },
  },

  watch: {
    $route: {
      handler: 'handleRouteChange',
      immediate: true,
    },

    'userProfile.username'(newUsername, oldUsername) {
      if (newUsername && newUsername !== 'Guest' && newUsername !== oldUsername) {
        this.$nextTick(() => {
          this.refreshNotifications();
          this.fetchUnreadMessagesCount();
        });
      } else if (newUsername === 'Guest') {
        this.unreadCount = 0;
        this.unreadMessagesCount = 0;
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
  transition: opacity 0.3s cubic-bezier(.16,1,.3,1);
}
.fade-enter-from, .fade-leave-to {
  opacity: 0;
}
.username-display {
  font-size: 19px;
  cursor: pointer;
  margin-right: 16px;
  padding: 6px 12px;
  border-radius: 12px;
  transition: all 0.3s cubic-bezier(.16,1,.3,1);
  background: rgba(255,255,255,0.05);
}
.username-display:hover {
  background: rgba(255,255,255,0.1);
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(0,0,0,0.2);
}
.fancy-title {
  font-size: 24px;
  margin-left: 3%;
  display: flex;
  align-items: center;
  gap: 10px;
  animation: fadeIn 0.6s ease-out;
}

/* 🟢 Mobile navigation bottom bar badge */
.badge {
  position: absolute;
  top: 2px;
  right: 2px;
  background: linear-gradient(135deg, #ef4444, #dc2626);
  color: white;
  font-size: 10px;
  font-weight: 700;
  line-height: 1;
  padding: 3px 6px;
  border-radius: 999px;
  min-width: 18px;
  height: 18px;
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 5;
  box-shadow: 0 2px 8px rgba(239, 68, 68, 0.4);
  border: 1.5px solid #111;
  animation: pulse-badge 2s ease-in-out infinite;
}

@keyframes pulse-badge {
  0%, 100% { transform: scale(1); }
  50% { transform: scale(1.05); }
}

/* 🟩 Chat-specific badge color */
.badge[style*="background-color: #10b981"] {
  background-color: #10b981 !important;
}

/* 🔲 Position the badge relative to icon wrapper */
.bottom-nav-btn {
  position: relative;
  display: flex;
  flex-direction: column;
  align-items: center;
}

</style>

<style scoped>
/* Mobile bottom navigation (only visible on small screens) */
@media (max-width: 767px) {
  .mobile-bottom-nav {
    position: fixed;
    left: 0;
    right: 0;
    bottom: 0;
    z-index: 1000;
    background: rgba(15, 15, 20, 0.7);
    backdrop-filter: blur(18px) saturate(160%);
    -webkit-backdrop-filter: blur(18px) saturate(160%);
    border-top: 1px solid rgba(255,255,255,0.15);
    padding: max(6px, env(safe-area-inset-bottom));
  }

  .mobile-bottom-nav ul {
    list-style: none;
    display: grid;
    grid-template-columns: repeat(5, 1fr);
    margin: 0;
    padding: 6px 10px;
    gap: 4px;
    align-items: center;
  }

  .bottom-nav-btn {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    padding: 8px 6px;
    min-height: 44px; /* iOS recommended touch target */
    gap: 4px;
    border-radius: 14px;
    font-size: 11px;
  }

  .bottom-nav-btn i {
    font-size: 18px;
    line-height: 1;
  }

  .bottom-nav-btn.active {
    background: rgba(255,255,255,0.08);
    box-shadow: inset 0 1px 0 rgba(255,255,255,0.15);
  }

  .profile-pic-icon {
    width: 22px;
    height: 22px;
    border-radius: 50%;
    object-fit: cover;
  }
}
</style>







