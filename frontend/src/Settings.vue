<template>
  <div class="profile-page" style="margin-top: 50px;">
    <!-- profile top bar - simplified -->
    <div class="profile-top-bar">
      <div class="top-content">
        <div class="top-left">
          <button class="back-btn">
            <i class="fas fa-arrow-left"></i>
          </button>
        </div>
        <div class="top-right">
          <button
            class="icon-btn"
            @click.stop="toggleDropdown"
            @keydown.enter.prevent="openDropdown"
            @keydown.space.prevent="openDropdown"
            @keydown.down.prevent="focusFirstItem"
            aria-haspopup="true"
            :aria-expanded="showDropdown.toString()"
            aria-label="Profile menu"
            ref="menuTrigger"
          >
            <i class="fas fa-ellipsis-h"></i>
          </button>
          <div
            v-if="showDropdown"
            class="dropdown-menu"
            role="menu"
            ref="dropdownMenu"
            @click.stop
            @keydown.down.prevent="focusNextItem"
            @keydown.up.prevent="focusPrevItem"
            @keydown.escape.prevent="closeDropdown"
            @keydown.home.prevent="focusFirstItem"
            @keydown.end.prevent="focusLastItem"
          >
            <button v-if="!isGuest" @click="showSettings = !showSettings" class="dropdown-item">
              <i class="fas fa-cog"></i>
              Settings
            </button>
            <button v-if="!isGuest" @click="viewMyActivity" class="dropdown-item">
              <i class="fas fa-chart-line"></i>
              Activity
            </button>
            <button v-if="!isGuest" @click="openBlockedUsers" class="dropdown-item">
              <i class="fas fa-user-slash"></i>
              Blocked Users
            </button>
            <div class="dropdown-divider"></div>
            <button v-if="!isGuest" @click="logOut" class="dropdown-item danger">
              <i class="fas fa-sign-out-alt"></i>
              Log Out
            </button>
            <div v-if="isGuest" class="dropdown-item" style="opacity:.65;cursor:default;">
              <i class="fas fa-user-secret"></i>
              Guest Mode
            </div>
          </div>
        </div>
      </div>
    </div>
    <!-- Clear guest banner for Settings -->
    <LoginPrompt
      v-if="isGuest"
      message="Login to edit your profile and access settings."
      :href="loginHref"
    />
      <LoginPrompt
        v-if="isGuest"
        message="Login to edit your profile and access settings."
        @login="goLogin"
      />

    <!-- Profile Content -->
    <main class="main-content">
      <!-- Profile Section -->
      <div class="profile-section">
        <!-- Profile header - improved layout -->
        <div class="profile-header">
          <div class="header-top">
            <div class="avatar-section">
              <div class="avatar-container" @click="triggerFileInput">
                <img
                  :src="userProfile.profile_picture"
                  alt="Profile Picture"
                  class="profile-avatar"
                  @error="e => e.target.src = 'https://latestnewsandaffairs.site/public/pfp.jpg'"
                />
                <div class="avatar-overlay">
                  <i class="fas fa-camera"></i>
                </div>
                <div v-if="hasBlueMarkAccess" class="verified-badge">
                  <i class="fas fa-check"></i>
                </div>
              </div>
            </div>

            <div class="profile-stats">
              <div class="stat-item">
                <span class="stat-number">{{ userStats.posts }}</span>
                <span class="stat-label">Posts</span>
              </div>
              <div class="stat-item">
                <span class="stat-number">{{ userStats.followers }}</span>
                <span class="stat-label">Followers</span>
              </div>
              <div class="stat-item">
                <span class="stat-number">{{ userStats.following }}</span>
                <span class="stat-label">Following</span>
              </div>
            </div>
          </div>

          <!-- Username and info below avatar -->
          <div class="profile-info" style="margin-left: 20px;">
  <div class="profile-name">
    <h2>{{ userProfile.display_name || userProfile.username }}</h2>
  <button v-if="!isGuest" class="edit-btn" @click="editDisplayName">
      <i class="fas fa-edit"></i>
    </button>
  </div>       
            <div class="profile-bio">
        <p>{{ isGuest ? 'Guest viewing mode' : (userProfile.description || 'No description available') }}</p>
        <button v-if="!isGuest" class="edit-btn" @click="editDescription">
                <i class="fas fa-edit"></i>
              </button>
            </div>

            <div v-if="userProfile.Music" class="profile-music">
              <i class="fas fa-music"></i>
              <span>{{ userProfile.Music }}</span>
        <button v-if="!isGuest" class="edit-btn" @click="editMusic">
                <i class="fas fa-edit"></i>
              </button>
            </div>

            <div class="profile-joined">
              <i class="fas fa-calendar-alt"></i>
              <span>Joined {{ formatDate(userProfile.created_at) }}</span>
            </div>
          </div>
        </div>

      </div>

      <!-- Content Tabs -->
      <div class="content-tabs">
                    const goLogin = () => {
                      try { localStorage.setItem('postLoginRedirect', window.location.pathname + window.location.search); } catch {}
                      const next = encodeURIComponent(window.location.pathname + window.location.search);
                      window.location.href = `${loginHref}?next=${next}`;
                    };
        <button 
          v-for="tab in contentTabs" 
          :key="tab.key"
          class="tab-btn"
          :class="{ active: activeTab === tab.key }"
          @click="activeTab = tab.key"
        >
          <i :class="tab.icon"></i>
          <span>{{ tab.label }}</span>
        </button>
      </div>

      <!-- Content Area -->
      <div class="content-area">
        <!-- Posts Grid -->
        <div v-if="activeTab === 'posts'" class="posts-grid">
          <div v-for="n in 9" :key="n" class="post-item">
            <div class="post-placeholder">
              <i class="fas fa-image"></i>
              <span>No posts yet</span>
            </div>
          </div>
        </div>

        <!-- Tagged Posts -->
        <div v-if="activeTab === 'tagged'" class="posts-grid">
          <div class="empty-state">
            <i class="fas fa-user-tag"></i>
            <h3>No tagged posts</h3>
            <p>When people tag you in posts, they'll appear here.</p>
          </div>
        </div>

        <!-- Saved Posts -->
        <div v-if="activeTab === 'saved'" class="posts-grid">
          <div class="empty-state">
            <i class="fas fa-bookmark"></i>
            <h3>No saved posts</h3>
            <p>Posts you save will appear here.</p>
          </div>
        </div>
      </div>
    </main>

    <!-- Settings Overlay -->
    <div v-if="showSettings" class="settings-overlay" @click.self="showSettings = false">
      <div class="settings-modal">
        <div class="modal-header">
          <h3>Settings</h3>
          <button @click="showSettings = false" class="close-btn">
            <i class="fas fa-times"></i>
          </button>
        </div>
        <div class="modal-content">
          <div class="settings-list">
            <div
              v-for="item in toggleSettings"
              :key="item.key"
              class="setting-item"
            >
              <div class="setting-info">
                <div class="setting-icon">
                  <i :class="item.icon"></i>
                </div>
                <div class="setting-details">
                  <h4>{{ item.label }}</h4>
                  <p>{{ item.description }}</p>
                </div>
              </div>
              <div class="setting-control">
                <div
                  class="toggle-switch"
                  :class="{ active: settings[item.key] }"
                  @click="toggleSetting(item.key)"
                >
                  <div class="toggle-slider"></div>
                </div>
              </div>
            </div>
          </div>
          <div class="modal-actions">
            <button class="btn-primary full-width" @click="saveSettings" :disabled="loading">
              <span v-if="loading">
                <i class="fas fa-spinner fa-spin"></i>
                Saving...
              </span>
              <span v-else">
                <i class="fas fa-save"></i>
                Save Settings
              </span>
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- Success/Error Messages -->
    <div v-if="message" class="toast" :class="{ error: message.toLowerCase().includes('fail') }">
      <div class="toast-content">
        <i :class="message.toLowerCase().includes('fail') ? 'fas fa-exclamation-circle' : 'fas fa-check-circle'"></i>
        <span>{{ message }}</span>
      </div>
    </div>

    <!-- Hidden File Input -->
    <input
      type="file"
      ref="profileFileInput"
      @change="handleProfilePictureChange"
      accept="image/*"
      style="display: none;"
    />
  </div>
</template>

<style scoped>
:root{--primary:#405de6;--text:#262626;--text-light:#8e8e8e;--bg:#fafafa;--white:#fff;--border:#dbdbdb;--shadow:0 2px 8px rgba(0,0,0,0.1);--anim-fast:120ms cubic-bezier(.4,0,.2,1)}
.profile-page{margin-top:50px;margin-left:20px;background:var(--bg);font-family:system-ui;min-height:100vh}
button{border:none;cursor:pointer;transition:0.2s}
.back-btn,.icon-btn,.close-btn,.edit-btn,.settings-btn{background:none;color:var(--text);padding:8px;border-radius:6px}
.back-btn:hover,.icon-btn:hover,.close-btn:hover,.edit-btn:hover,.settings-btn:hover{background:var(--bg)}
.profile-top-bar{background:var(--white);box-shadow:var(--shadow)}
.top-content{display:flex;justify-content:space-between;align-items:center;padding:16px 18px;max-width:600px;margin:0 auto}

.main-content{width:100%;margin:0 auto}
.header-top{display:flex;align-items:flex-start;gap:20px;margin-bottom:16px}
.avatar-container{width:120px;height:120px;position:relative;cursor:pointer;flex-shrink:0}
.profile-avatar{width:100%;height:100%;border-radius:50%;object-fit:cover}
.avatar-overlay{position:absolute;inset:0;background:rgba(0,0,0,0.5);border-radius:50%;display:flex;align-items:center;justify-content:center;opacity:0;color:var(--white)}
.avatar-container:hover .avatar-overlay{opacity:1}
.verified-badge{position:absolute;bottom:8px;right:8px;background:var(--primary);color:var(--white);border-radius:50%;width:28px;height:28px;display:flex;align-items:center;justify-content:center;border:3px solid var(--white)}
.profile-stats{display:flex;gap:24px;flex:1}
.stat-item{text-align:center;cursor:pointer}
.stat-number{font-size:1.5rem;font-weight:700;display:block}
.stat-label{color:var(--text-light);font-size:0.9rem}
.header-actions{display:flex;flex-direction:column;align-items:center;gap:8px}
.settings-btn{background:var(--bg);border:1px solid var(--border);border-radius:8px;padding:12px;color:var(--text)}
.settings-btn:hover{background:var(--border)}
.profile-info{width:100%}
.profile-name{display:flex;align-items:center;gap:8px;margin-bottom:8px}
.profile-name h2{font-size:1.5rem;margin:0}
.username-handle{color:var(--text-light);font-size:1rem}
.bio-placeholder{color:var(--text-light);cursor:pointer}
.profile-bio,.profile-music,.profile-joined{display:flex;align-items:center;gap:8px;margin-bottom:8px}
.profile-music,.profile-joined{color:var(--text-light);font-size:0.9rem}
.profile-actions{display:flex;gap:12px;margin:20px 0}
.btn-secondary{background:var(--bg);border:1px solid var(--border);padding:8px 16px;border-radius:8px;font-weight:500;display:flex;align-items:center;gap:6px}
.btn-secondary:hover{background:var(--border)}
.content-tabs{background:var(--white);border-radius:12px;padding:1%;margin-bottom:3%;box-shadow:var(--shadow);display:flex}
.tab-btn{flex:1;padding:4%;background:none;color:var(--text-light);border-radius:8px;display:flex;align-items:center;justify-content:center;gap:8px}
.tab-btn.active{background:var(--primary);color:var(--white)}
.posts-grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(200px,1fr));gap:4%}
.post-item{aspect-ratio:1}
.post-placeholder{height:100%;background:var(--bg);border:2px dashed var(--border);border-radius:8px;display:flex;flex-direction:column;align-items:center;justify-content:center;color:var(--text-light)}
.empty-state{text-align:center;padding:40px;color:var(--text-light)}
.empty-state h3{margin:16px 0 8px;color:var(--text)}
.top-right{position:relative;display:flex;align-items:center}
.dropdown-menu{position:absolute;top:100%;right:0;background:var(--white);border:1px solid var(--border);border-radius:12px;box-shadow:0 8px 24px -6px rgba(0,0,0,.15),0 4px 12px -4px rgba(0,0,0,.08);min-width:210px;z-index:1200;margin-top:0.55rem;padding:4px 0;overflow:hidden;animation:dropdownIn .25s var(--anim-fast);transform-origin: top right}
.dropdown-menu:focus{outline:none}
@keyframes dropdownIn{from{opacity:0;transform:translateY(-6px) scale(.96)}to{opacity:1;transform:translateY(0) scale(1)}}
.dropdown-item{display:flex;align-items:center;gap:0.75rem;width:100%;padding:0.75rem 1rem;background:none;border:none;text-align:left;cursor:pointer;font-size:0.85rem;color:var(--text);line-height:1.2;transition:background .18s ease, color .18s ease}
.dropdown-item:hover,.dropdown-item:focus{background:linear-gradient(90deg,var(--bg),#fff);color:#111;outline:none}
.dropdown-item.danger{color:#fd1d1d}
.dropdown-divider{height:1px;background:var(--border);margin:0.5rem 0}
.settings-overlay{position:fixed;inset:0;background:rgba(0,0,0,0.5);display:flex;align-items:center;justify-content:center;z-index:1000;backdrop-filter:blur(4px)}
.settings-modal{background:var(--white);border-radius:8px;max-width:500px;width:90%;max-height:80vh;overflow:hidden;box-shadow:0 20px 40px rgba(0,0,0,0.2)}
.modal-header{display:flex;justify-content:space-between;align-items:center;padding:1.5rem;border-bottom:1px solid var(--border)}
.modal-header h3{font-size:1.25rem;font-weight:600;color:var(--text)}
.modal-content{padding:24px;max-height:60vh;overflow-y:auto}
.settings-list{display:flex;flex-direction:column;gap:1rem;margin-bottom:2rem}
.setting-item{display:flex;justify-content:space-between;align-items:center;padding:1rem;background:var(--bg);border-radius:8px}
.setting-info{display:flex;align-items:center;gap:1rem;flex:1}
.setting-icon{width:40px;height:40px;background:var(--white);border-radius:50%;display:flex;align-items:center;justify-content:center;color:var(--primary)}
.setting-details h4{font-size:1rem;font-weight:600;color:var(--text);margin-bottom:0.25rem}
.setting-details p{font-size:0.875rem;color:var(--text-light)}
.toggle-switch{width:50px;height:28px;background:var(--border);border-radius:14px;cursor:pointer;position:relative;transition:0.3s}
.toggle-switch.active{background:var(--primary)}
.toggle-slider{width:24px;height:24px;background:var(--white);border-radius:50%;position:absolute;top:2px;left:2px;transition:0.3s;box-shadow:var(--shadow)}
.toggle-switch.active .toggle-slider{transform:translateX(22px)}
.btn-primary{background:var(--primary);color:var(--white);padding:12px 24px;border-radius:8px;font-weight:500;display:flex;align-items:center;justify-content:center;gap:8px}
.btn-primary:hover{background:#3748d6}
.btn-primary:disabled{opacity:0.6;cursor:not-allowed}
.full-width{width:100%}
.toast{position:fixed;top:80px;right:20px;background:var(--primary);color:var(--white);padding:16px 20px;border-radius:8px;box-shadow:0 4px 12px rgba(0,0,0,0.15);z-index:1001;animation:slideIn 0.3s}
.toast.error{background:#fd1d1d}
.toast-content{display:flex;align-items:center;gap:8px}
@keyframes slideIn{from{transform:translateX(100%);opacity:0}to{transform:translateX(0);opacity:1}}
</style>

<script>
import { ref, computed, onMounted, onUnmounted, nextTick } from 'vue';
import LoginPrompt from './LoginPrompt.vue';

export default {
  name: 'ProfilePage',
  components: { LoginPrompt },
  setup() {
    // Reactive state
  const showDropdown = ref(false);
  const dropdownMenu = ref(null);
  const menuTrigger = ref(null);
  const isGuest = ref(!(localStorage.getItem('username') && localStorage.getItem('username') !== 'Guest'));
    const showSettings = ref(false);
    const activeTab = ref('posts');
    const loading = ref(false);
    const message = ref('');
    const newProfilePicture = ref(null);

    // User profile data
  const storedUsername = localStorage.getItem('username') || '';
    const userProfile = ref({
      username: storedUsername,
      display_name: storedUsername || 'Guest',
      profile_picture: 'https://latestnewsandaffairs.site/public/pfp.jpg',
      description: storedUsername ? 'No description available' : 'Guest viewing mode',
      created_at: storedUsername ? 'Date not available' : '—',
      Music: storedUsername ? 'Music not available' : ''
    });

    // User stats (can be fetched from API later)
    const userStats = ref({
      posts: 0,
      followers: 0,
      following: 0
    });

    // Settings
    const settings = ref({
      notifications: true,
      privacy: false,
      darkMode: false,
      autoPlay: true
    });

    // Keep isGuest reactive to username changes
    const updateGuest = () => {
      const un = localStorage.getItem('username') || '';
      isGuest.value = !(un && un !== 'Guest');
    };
    onMounted(() => {
      window.addEventListener('storage', updateGuest);
    });
    onUnmounted(() => {
      window.removeEventListener('storage', updateGuest);
    });

    const hasBlueMarkAccess = ref(false);

    // Content tabs configuration
    const contentTabs = ref([
      { key: 'posts', label: 'Posts', icon: 'fas fa-th' },
      { key: 'tagged', label: 'Tagged', icon: 'fas fa-user-tag' },
      { key: 'saved', label: 'Saved', icon: 'fas fa-bookmark' }
    ]);


    // Computed properties
    const toggleSettings = computed(() => [
      {
        key: 'notifications',
        label: 'Push Notifications',
        description: 'Get notified about new messages and activity',
        icon: 'fas fa-bell'
      },
      {
        key: 'privacy',
        label: 'Private Account',
        description: 'Only followers can see your posts',
        icon: 'fas fa-lock'
      },
      {
        key: 'darkMode',
        label: 'Dark Mode',
        description: 'Use dark theme across the app',
        icon: 'fas fa-moon'
      },
      {
        key: 'autoPlay',
        label: 'Auto-play Videos',
        description: 'Videos play automatically in feed',
        icon: 'fas fa-play-circle'
      }
    ]);

    // Check for saved files to determine blue mark access
    const checkBlueMarkAccess = () => {
      const keys = Object.keys(localStorage);
      const hasUserFiles = keys.some(key => 
        key.includes('userFile') || 
        key.includes('savedDocument') || 
        key.includes('userContent') ||
        key.includes('profile') ||
        key.includes('settings')
      ) || keys.length > 5;
      hasBlueMarkAccess.value = hasUserFiles;
    };

    // Methods
    const openDropdown = () => {
      if (!showDropdown.value) {
        showDropdown.value = true;
        nextTick(() => focusFirstItem());
      }
    };

    const closeDropdown = () => {
      if (showDropdown.value) {
        showDropdown.value = false;
        nextTick(() => menuTrigger.value?.focus());
      }
    };

    const toggleDropdown = () => {
      showDropdown.value ? closeDropdown() : openDropdown();
    };

    const focusableItems = () => dropdownMenu.value ? Array.from(dropdownMenu.value.querySelectorAll('.dropdown-item')) : [];
    const focusFirstItem = () => { const items = focusableItems(); if(items.length) items[0].focus(); };
    const focusLastItem = () => { const items = focusableItems(); if(items.length) items[items.length-1].focus(); };
    const focusNextItem = () => {
      const items = focusableItems();
      const idx = items.indexOf(document.activeElement);
      if(items.length) items[(idx+1+items.length) % items.length].focus();
    };
    const focusPrevItem = () => {
      const items = focusableItems();
      const idx = items.indexOf(document.activeElement);
      if(items.length) items[(idx - 1 + items.length) % items.length].focus();
    };

    const formatDate = (dateString) => {
      if (!dateString || dateString === 'Date not available') return 'Recently';
      try {
        return new Date(dateString).toLocaleDateString('en-US', {
          year: 'numeric',
          month: 'long'
        });
      } catch {
        return 'Recently';
      }
    };

    const fetchUserSettings = async () => {
      loading.value = true;
      try {
        const username = localStorage.getItem('username');
        if (!username) { // guest: skip remote
          loading.value = false;
          return;
        }

        const response = await fetch(`https://sports321.vercel.app/api/posts?username=${username}`);
        const user = await response.json();

        userProfile.value = {
          username: username,
          display_name: user.display_name || username,
          created_at: user.created_at || 'Date not available',
          Music: user.Music || 'Music not available',
          description: user.description || 'No description available',
          profile_picture: user.profile_picture || 'https://latestnewsandaffairs.site/public/pfp.jpg'
        };

        // Update stats if available
        if (user.stats) {
          userStats.value = { ...userStats.value, ...user.stats };
        }

        if (user.preferences) {
          Object.keys(settings.value).forEach(key => {
            if (user.preferences.hasOwnProperty(key)) {
              settings.value[key] = user.preferences[key];
            }
          });

          if (settings.value.darkMode) {
            document.documentElement.classList.add('dark-mode');
          } else {
            document.documentElement.classList.remove('dark-mode');
          }
        }
      } catch (error) {
        message.value = 'Error fetching user settings.';
        console.error('Error fetching user settings:', error);
      } finally {
        loading.value = false;
      }
    };

    const updateUserProfileField = async (field, newValue) => {
      if (isGuest.value) return;
      loading.value = true;
      const username = localStorage.getItem('username');
      if (!username) {
        message.value = 'Username not found!';
        loading.value = false;
        return;
      }
      try {
        const body = { username, [field]: newValue };
        const response = await fetch('https://venus-ecru.vercel.app/api/ProfileUpdate', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(body)
        });

        if (response.ok) {
          userProfile.value[field] = newValue;
          if (field === 'username') {
            localStorage.setItem('username', newValue);
          }
          message.value = `Your ${field} has been updated!`;
          setTimeout(() => message.value = '', 3000);
        } else {
          throw new Error('Update failed');
        }
      } catch (error) {
        message.value = `Failed to update ${field}`;
        console.error(`Error updating ${field}:`, error);
        setTimeout(() => message.value = '', 3000);
      } finally {
        loading.value = false;
      }
    };

    const changeUsername = () => {
      const newUsername = prompt('Enter your new username:', userProfile.value.username);
      if (newUsername?.trim() && newUsername.trim() !== userProfile.value.username) {
        updateUserProfileField('username', newUsername.trim());
      }
    };

    const editDisplayName = () => {
      const newDisplayName = prompt('Enter your display name:', userProfile.value.display_name || userProfile.value.username);
      if (newDisplayName?.trim()) {
        updateUserProfileField('display_name', newDisplayName.trim());
      }
    };

    const editDescription = () => {
      const newDescription = prompt('Tell us about yourself:', userProfile.value.description === 'No description available' ? '' : userProfile.value.description);
      if (newDescription?.trim()) {
        updateUserProfileField('description', newDescription.trim());
      }
    };

    const editMusic = () => {
      const newMusic = prompt('Enter your favorite music:', userProfile.value.Music === 'Music not available' ? '' : userProfile.value.Music);
      if (newMusic?.trim()) {
        updateUserProfileField('Music', newMusic.trim());
      }
    };

    const triggerFileInput = () => {
      const fileInput = document.querySelector('input[type="file"]');
      if (fileInput) {
        fileInput.click();
      }
    };

    const handleProfilePictureChange = (event) => {
      const file = event.target.files[0];
      if (file) {
        const reader = new FileReader();
        reader.onload = (e) => {
          newProfilePicture.value = e.target.result;
          userProfile.value.profile_picture = e.target.result;
          // Auto-save profile picture
          saveProfilePicture();
        };
        reader.readAsDataURL(file);
      }
    };

    const saveProfilePicture = async () => {
      if (isGuest.value) return;
      if (!newProfilePicture.value) return;
      loading.value = true;
      try {
        const username = localStorage.getItem('username');
        if (!username) {
          message.value = 'Username not found!';
          loading.value = false;
          return;
        }
        const response = await fetch('https://venus-ecru.vercel.app/api/ProfileUpdate', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ username, profile_picture: newProfilePicture.value })
        });
        if (response.ok) {
          userProfile.value.profile_picture = newProfilePicture.value;
          localStorage.setItem('profilePic', newProfilePicture.value);
          newProfilePicture.value = null;
          message.value = 'Profile picture updated!';
          setTimeout(() => message.value = '', 3000);
        } else {
          throw new Error('Profile picture update failed');
        }
      } catch (error) {
        message.value = 'Failed to update profile picture';
        console.error('Error updating profile picture:', error);
        setTimeout(() => message.value = '', 3000);
      } finally {
        loading.value = false;
      }
    };

    const toggleSetting = async (key) => {
      if (isGuest.value) return;
      settings.value[key] = !settings.value[key];
      if (key === 'darkMode') {
        toggleDarkMode();
      }
      await saveSettings();
    };

    const toggleDarkMode = () => {
      document.documentElement.classList.toggle('dark-mode', settings.value.darkMode);
      localStorage.setItem('darkMode', settings.value.darkMode);
    };

    const saveSettings = async () => {
      if (isGuest.value) return;
      loading.value = true;
      const username = localStorage.getItem('username');
      if (!username) {
        message.value = 'Username not found!';
        loading.value = false;
        return;
      }
      try {
        const response = await fetch('https://venus-ecru.vercel.app/api/ProfileUpdate', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ username, preferences: settings.value })
        });
        if (response.ok) {
          message.value = 'Settings saved successfully!';
          setTimeout(() => message.value = '', 3000);
        } else {
          throw new Error('Settings save failed');
        }
      } catch (error) {
        message.value = 'Failed to save settings';
        console.error('Error saving settings:', error);
        setTimeout(() => message.value = '', 3000);
      } finally {
        loading.value = false;
      }
    };

    const shareProfile = () => {
      if (navigator.share) {
        navigator.share({
          title: `${userProfile.value.display_name || userProfile.value.username}'s Profile`,
          text: userProfile.value.description,
          url: window.location.href
        });
      } else {
        // Fallback - copy to clipboard
        navigator.clipboard.writeText(window.location.href);
        message.value = 'Profile link copied to clipboard!';
        setTimeout(() => message.value = '', 3000);
      }
    };

    const openBlockedUsers = () => {
      message.value = 'Blocked users feature coming soon!';
      setTimeout(() => message.value = '', 3000);
      showDropdown.value = false;
    };

    const viewMyActivity = () => {
      message.value = 'Activity history feature coming soon!';
      setTimeout(() => message.value = '', 3000);
      showDropdown.value = false;
    };

    const logOut = () => {
      if (isGuest.value) return;
      if (confirm('Are you sure you want to log out?')) {
        localStorage.clear();
        window.location.reload();
      }
      showDropdown.value = false;
    };

    // Close dropdowns when clicking outside
    const handleClickOutside = (event) => {
      if(!showDropdown.value) return; // no need to compute
      const inMenu = event.target.closest('.dropdown-menu');
      const trigger = event.target.closest('.icon-btn');
      if(!inMenu && !trigger) {
        closeDropdown();
      }
    };

    // Lifecycle hooks
    onMounted(() => {
      fetchUserSettings();
      if (!isGuest.value) {
        checkBlueMarkAccess();
      }
      
      // Load saved dark mode preference
      const savedDarkMode = localStorage.getItem('darkMode');
      if (savedDarkMode !== null) {
        settings.value.darkMode = savedDarkMode === 'true';
        if (settings.value.darkMode) {
          document.documentElement.classList.add('dark-mode');
        }
      }

      // Add click outside listener
      document.addEventListener('click', handleClickOutside);
    });

    onUnmounted(() => {
      // Clean up event listener
      document.removeEventListener('click', handleClickOutside);
    });

    // Return all reactive data and methods
    return {
      showDropdown,
      showSettings,
      activeTab,
      loading,
      message,
      newProfilePicture,
      userProfile,
      userStats,
      settings,
      hasBlueMarkAccess,
      contentTabs,
      toggleSettings,
      checkBlueMarkAccess,
  toggleDropdown,
  openDropdown,
  closeDropdown,
  focusFirstItem,
  focusLastItem,
  focusNextItem,
  focusPrevItem,
  dropdownMenu,
  menuTrigger,
      formatDate,
      fetchUserSettings,
      updateUserProfileField,
      changeUsername,
      editDisplayName,
      editDescription,
      editMusic,
      triggerFileInput,
      handleProfilePictureChange,
      saveProfilePicture,
      toggleSetting,
      toggleDarkMode,
      saveSettings,
      shareProfile,
      openBlockedUsers,
      viewMyActivity,
      logOut,
  handleClickOutside,
  isGuest
    };
  }
};
</script>





