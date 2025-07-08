<template>
  <section class="settings-section">
    <!-- Sidebar -->
    <div class="sidebar p-3">
      <h2 class="sidebar-title mb-4">Settings</h2>

      <!-- User Settings Section -->
      <div class="mb-4">
        <h6 class="section-header text-uppercase mb-2">User Settings</h6>
        <ul class="nav flex-column">
          <!-- Profile -->
          <li class="nav-item">
            <a
              class="nav-link"
              :class="{ active: activeSection === 'profile' }"
              @click="toggleSection('profile')"
              href="#profile"
            >
              <i class="fas fa-user me-2"></i> Profile
            </a>
            <div v-if="activeSection === 'profile'" class="section-details">
              <div class="mb-3 d-flex align-items-center">
                <strong class="me-2">Username:</strong>
                <span>{{ userProfile.username || 'Loading...' }}</span>
                <i class="fas fa-edit edit-icon ms-auto" @click="changeUsername"></i>
              </div>
              <hr class="section-divider">
              <div class="mb-3">
                <strong>Profile Picture:</strong>
                <div class="d-flex align-items-center mt-2">
                  <a
                    :href="profileLink"
                    target="_blank"
                    style="display: inline-block;"
                    title="Go to your profile"
                  >
                    <img
                      :src="userProfile.profilePicture"  
                      alt="Profile Picture"
                      class="rounded-circle me-3"
                      style="width: 60px; height: 60px; object-fit: cover;"
                    />
                  </a>
                  <i class="fas fa-edit edit-icon" @click="triggerFileInput"></i>
                  <input
                    type="file"
                    ref="profileFileInput"
                    @change="handleProfilePictureChange"
                    accept="image/*"
                    style="display: none;"
                  />
                  <button
                    v-if="newProfilePicture"
                    class="btn btn-success btn-sm ms-3"
                    @click="saveProfilePicture"
                  >
                    Save
                  </button>
                </div>
              </div>
              <hr class="section-divider">
              <div class="mb-3 d-flex align-items-center">
                <strong class="me-2">Description:</strong>
                <span>{{ userProfile.description || 'No description available' }}</span>
                <i class="fas fa-edit edit-icon ms-auto" @click="editDescription"></i>
              </div>
              <hr class="section-divider">
              <div class="mb-3 d-flex align-items-center">
                <strong class="me-2">Location:</strong>
                <span>{{ userProfile.location || 'Location not available' }}</span>
                <i class="fas fa-edit edit-icon ms-auto" @click="editLocation"></i>
              </div>
              <hr class="section-divider">
              <div class="mb-3 d-flex align-items-center">
                <strong class="me-2">Status:</strong>
                <span>{{ userProfile.status || 'Status not available' }}</span>
                <i class="fas fa-edit edit-icon ms-auto" @click="editStatus"></i>
              </div>
              <hr class="section-divider">
              <div class="mb-3 d-flex align-items-center">
                <strong class="me-2">Profession:</strong>
                <span>{{ userProfile.profession || 'Profession not available' }}</span>
                <i class="fas fa-edit edit-icon ms-auto" @click="editProfession"></i>
              </div>
              <hr class="section-divider">
              <div class="mb-3 d-flex align-items-center">
                <strong class="me-2">Hobby:</strong>
                <span>{{ userProfile.hobby || 'Hobby not available' }}</span>
                <i class="fas fa-edit edit-icon ms-auto" @click="editHobby"></i>
              </div>
            </div>
          </li>
          <!-- General -->
          <li class="nav-item">
            <a
              class="nav-link"
              :class="{ active: activeSection === 'general' }"
              @click="toggleSection('general')"
              href="#general"
            >
              <i class="fas fa-cog me-2"></i> General
            </a>
            <div v-if="activeSection === 'general'" class="section-details">
              <div
                v-for="item in toggleSettings"
                :key="item.key"
                class="d-flex justify-content-between align-items-center mb-3"
              >
                <span>{{ item.label }}</span>
                <div class="d-flex align-items-center">
                  <div
                    class="toggle-switch"
                    :aria-pressed="settings[item.key]"
                    role="switch"
                    tabindex="0"
                    @click="toggleSetting(item.key)"
                    @keydown.space.prevent="toggleSetting(item.key)"
                    @keydown.enter.prevent="toggleSetting(item.key)"
                    :style="getToggleStyle(item.key)"
                  >
                    <div class="toggle-knob" :style="getKnobStyle(item.key)"></div>
                  </div>
                  <span class="ms-3 status-text">{{ getStatusText(item.key) }}</span>
                </div>
              </div>
              <button class="btn btn-custom mt-3 w-100" @click="saveSettings">
                Save Settings
              </button>
            </div>
          </li>
          <!-- History -->
          <li class="nav-item">
            <a
              class="nav-link"
              :class="{ active: activeSection === 'history' }"
              @click="toggleSection('history')"
              href="#history"
            >
              <i class="fas fa-history me-2"></i> History
            </a>
            <div v-if="activeSection === 'history'" class="section-details">
              <button class="btn btn-custom w-100" @click="viewMyActivity">
                View My Activity
              </button>
            </div>
          </li>
          <!-- About -->
          <li class="nav-item">
            <a
              class="nav-link"
              :class="{ active: activeSection === 'About' }"
              @click="toggleSection('About')"
              href="#About"
            >
              <i class="fas fa-info-circle me-2"></i> About
            </a>
            <div v-if="activeSection === 'About'" class="section-details">
              <button class="btn btn-custom w-100" @click="viewAboutUs">
                View About Us
              </button>
            </div>
          </li>
          <!-- Terms -->
          <li class="nav-item">
            <a
              class="nav-link"
              :class="{ active: activeSection === 'Terms' }"
              @click="toggleSection('Terms')"
              href="#Terms"
            >
              <i class="fas fa-file-alt me-2"></i> Terms and Conditions
            </a>
            <div v-if="activeSection === 'Terms'" class="section-details">
              <button class="btn btn-custom w-100" @click="viewTerms">
                View Terms and Conditions
              </button>
            </div>
          </li>
          <!-- Account -->
          <li class="nav-item">
            <a
              class="nav-link"
              :class="{ active: activeSection === 'account' }"
              @click="toggleSection('account')"
              href="#account"
            >
              <i class="fas fa-shield-alt me-2"></i> Account
            </a>
            <div v-if="activeSection === 'account'" class="section-details">
              <button class="btn btn-custom w-100 mb-3" @click="openBlockedUsers">
                Blocked Users
              </button>
              <button class="btn btn-danger w-100" @click="logOut">Log Out</button>
            </div>
          </li>
        </ul>
      </div>

      <!-- Separator -->
      <hr class="sidebar-divider mb-4">

      <!-- Separator -->
      <hr class="sidebar-divider mb-4">

      <!-- App Settings Section -->
    </div>

    <!-- Modal for displaying info -->
    <div v-if="modal.visible" class="modal-backdrop" @click.self="closeModal">
      <div class="modal-content-custom">
        <div class="modal-header-custom">
          <span>{{ modal.title }}</span>
          <button class="close-btn" @click="closeModal">&times;</button>
        </div>
        <div class="modal-body-custom">
          <div v-html="modal.body"></div>
        </div>
      </div>
    </div>

    <!-- Toast message -->
    <div v-if="message" class="toast-message">{{ message }}</div>
  </section>
</template>

<style scoped>
.settings-section {
  font-family: 'Whitney', 'Helvetica Neue', Helvetica, Arial, sans-serif;
  background-color: #000;
  display: flex;
  justify-content: center;
}
.sidebar {
  width: 100%;
  max-width: 600px;
  background-color: #000;
  overflow-y: auto;
padding: 0 15px 15px 15px;
  border-radius: 8px;
}
.sidebar-title {
  font-size: 10px;
  font-weight: 600;
  color: #060607;
}
.section-header {
  font-size: 12px;
  font-weight: 600;
  color: #F2F3F5;
  letter-spacing: 0.5px;
}
.nav-link {
  font-size: 14px;
  font-weight: 500;
  color: #FFFFFF;
  padding: 8px 16px;
  border-radius: 4px;
  transition: all 0.2s ease;
  cursor: pointer;
}
.nav-link:hover {
  background-color: #F2F3F5;
  color: #060607;
}

.nav-link.active {
  background-color: #E3E5E8;
  color: #060607;
}

.nav-link.disabled {
  color: #A3A6AA;
  cursor: not-allowed;
}

.section-details {
  padding: 8px 16px 8px 30px; /* Indent to align under menu item */
  font-size: 13px;
  color: #FFFFFF;
}

.section-details strong {
  font-size: 13px;
  font-weight: 600;
  color: #F2F3F5;
}

.section-details span {
  font-size: 13px;
  color: #F2F3F5;
}
.section-divider {
  border-top: 1px solid #E3E5E8;
  margin: 8px 0;
}
.sidebar-divider {
  border-top: 1px solid #E3E5E8;
  margin: 8px 0;
}
.edit-icon {
  cursor: pointer;
  color: #4F5660;
  font-size: 13px;
  transition: all 0.2s ease;
}
.edit-icon:hover {
  color: #5865F2;
}
.btn-custom {
  background-color: #5865F2;
  color: #FFFFFF;
  border: none;
  border-radius: 4px;
  padding: 8px 16px;
  font-size: 13px;
  font-weight: 500;
  transition: all 0.2s ease;
}
.btn-custom:hover {
  background-color: #4752C4;
}
.btn-danger {
  background-color: #ED4245;
  color: #FFFFFF;
  border: none;
  border-radius: 4px;
  padding: 8px 16px;
  font-size: 13px;
  font-weight: 500;
  transition: all 0.2s ease;
}
.btn-danger:hover {
  background-color: #C73538;
}
.toggle-switch {
  width: 50px;
  height: 26px;
  border-radius: 13px;
  position: relative;
  cursor: pointer;
  transition: background 0.3s ease;
}

.toggle-knob {
  width: 22px;
  height: 22px;
  background-color: #FFFFFF;
  border-radius: 50%;
  position: absolute;
  top: 2px;
  transition: left 0.3s ease;
}

.status-text {
  font-size: 13px;
  color: #FFFFFF;
}
/* === GENERAL BACKGROUND === */
.dark-mode {
  background-color: #2F3136;
}

.dark-mode .sidebar {
  background-color: #36393F;
}

/* === TEXT COLORS === */
.dark-mode .sidebar-title,
.dark-mode .section-details strong {
  color: #FFFFFF;
}

.dark-mode .section-header,
.dark-mode .nav-link,
.dark-mode .section-details,
.dark-mode .section-details span,
.dark-mode .status-text,
.dark-mode .edit-icon {
  color: #B9BBBE;
}

.dark-mode .nav-link.disabled {
  color: #72767D;
}

/* === NAVIGATION STATES === */
.dark-mode .nav-link:hover {
  background-color: #3A3C43;
  color: #FFFFFF;
}

.dark-mode .nav-link.active {
  background-color: #40444B;
  color: #FFFFFF;
}

/* === ICON STATES === */
.dark-mode .edit-icon:hover {
  color: #5865F2;
}

/* === DIVIDERS === */
.dark-mode .section-divider,
.dark-mode .sidebar-divider {
  border-top: 1px solid #202225;
}

.modal-backdrop {
  position: fixed;
  top: 0; left: 0; right: 0; bottom: 0;
  background: rgba(0,0,0,0.5);
  z-index: 1000;
  display: flex;
  align-items: center;
  justify-content: center;
}
.modal-content-custom {
  background: #222;
  color: #fff;
  border-radius: 8px;
  padding: 24px;
  min-width: 320px;
  max-width: 90vw;
  box-shadow: 0 2px 16px rgba(0,0,0,0.3);
  position: relative;
}
.modal-header-custom {
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-weight: bold;
  font-size: 18px;
  margin-bottom: 12px;
}
.close-btn {
  background: none;
  border: none;
  color: #fff;
  font-size: 22px;
  cursor: pointer;
}
.modal-body-custom {
  font-size: 15px;
}
.toast-message {
  position: fixed;
  bottom: 32px;
  left: 50%;
  transform: translateX(-50%);
  background: #222;
  color: #fff;
  padding: 12px 24px;
  border-radius: 6px;
  z-index: 2000;
  font-size: 15px;
  box-shadow: 0 2px 8px rgba(0,0,0,0.2);
  animation: fadeInOut 2.5s;
}
@keyframes fadeInOut {
  0% { opacity: 0; }
  10% { opacity: 1; }
  90% { opacity: 1; }
  100% { opacity: 0; }
}
</style>
<script>
import { nodeAPI } from './config/api.js';

export default {
  name: 'Settings',
  data() {
    return {
      activeSection: null,
      userProfile: {
        username: '',
        profilePicture: 'default.jpg',
        description: '',
        location: '',
        status: '',
        profession: '',
        hobby: ''
      },
      newProfilePicture: null,
      settings: {
        darkMode: false,
        notifications: true,
        privateAccount: false,
        showOnlineStatus: true,
        twoFactorAuth: false
      },
      loading: false,
      message: '',
      modal: {
        visible: false,
        title: '',
        body: ''
      }
    };
  },
  computed: {
    toggleSettings() {
      return [
        { key: 'darkMode', label: 'Dark Mode' },
        { key: 'notifications', label: 'Notifications' },
        { key: 'privateAccount', label: 'Private Account' },
        { key: 'showOnlineStatus', label: 'Show Online Status' },
        { key: 'twoFactorAuth', label: 'Two-Factor Authentication' }
      ];
    },
    profileLink() {
      const userId = localStorage.getItem('userId');
      return userId ? `/profile/${userId}` : '#';
    }
  },
  methods: {
    toggleSection(section) {
      this.activeSection = this.activeSection === section ? null : section;
    },
    async fetchUserSettings() {
      this.loading = true;
      try {
        const userId = localStorage.getItem('userId');
        if (!userId) {
          this.message = 'User ID not found!';
          return;
        }
        const { user } = await nodeAPI.getUserInfo(userId);
        this.userProfile = {
          username: user.username,
          location: user.location || 'Location not available',
          status: user.status || 'Status not available',
          profession: user.profession || 'Profession not available',
          hobby: user.hobby || 'Hobby not available',
          description: user.description || 'No description available',
          profilePicture: user.profilePicture || 'default.jpg',
        };
        if (user.preferences) {
          this.settings = { ...this.settings, ...user.preferences };
        }
      } catch (error) {
        this.message = 'Error fetching user settings.';
        console.error('Error fetching user settings:', error);
      } finally {
        this.loading = false;
      }
    },
    async updateUserProfileField(field, newValue) {
      const userId = localStorage.getItem('userId');
      if (!userId) {
        this.message = 'User ID not found!';
        return;
      }
      try {
        const { user } = await nodeAPI.request('/api/user-update', {
          method: 'PUT',
          body: JSON.stringify({ userId, updates: { [field]: newValue } })
        });
        this.userProfile[field] = user[field];
        this.message = `Your ${field} has been updated!`;
      } catch (error) {
        this.message = `Failed to update ${field}`;
        console.error(`Error updating ${field}:`, error);
      }
    },
    changeUsername() {
      const newUsername = prompt('Enter your new username:', this.userProfile.username);
      if (newUsername?.trim()) {
        this.updateUserProfileField('username', newUsername.trim());
      }
    },
    editDescription() {
      const newDescription = prompt('Enter your new description:', this.userProfile.description);
      if (newDescription?.trim()) {
        this.updateUserProfileField('description', newDescription.trim());
      }
    },
    editLocation() {
      const newLocation = prompt('Enter your new location:', this.userProfile.location);
      if (newLocation?.trim()) {
        this.updateUserProfileField('location', newLocation.trim());
      }
    },
    editStatus() {
      const newStatus = prompt('Enter your new status:', this.userProfile.status);
      if (newStatus?.trim()) {
        this.updateUserProfileField('status', newStatus.trim());
      }
    },
    editProfession() {
      const newProfession = prompt('Enter your new profession:', this.userProfile.profession);
      if (newProfession?.trim()) {
        this.updateUserProfileField('profession', newProfession.trim());
      }
    },
    editHobby() {
      const newHobby = prompt('Enter your new hobby:', this.userProfile.hobby);
      if (newHobby?.trim()) {
        this.updateUserProfileField('hobby', newHobby.trim());
      }
    },
    triggerFileInput() {
      this.$refs.profileFileInput.click();
    },
    handleProfilePictureChange(event) {
      const file = event.target.files[0];
      if (file) {
        const reader = new FileReader();
        reader.onload = (e) => {
          this.newProfilePicture = e.target.result;
          this.userProfile.profilePicture = e.target.result;
        };
        reader.readAsDataURL(file);
      }
    },
    async saveProfilePicture() {
      if (!this.newProfilePicture) return;
      try {
        const userId = localStorage.getItem('userId');
        if (!userId) {
          this.message = 'User ID not found!';
          return;
        }
        const { user } = await nodeAPI.request('/api/user-update', {
          method: 'PUT',
          body: JSON.stringify({ userId, updates: { profilePicture: this.newProfilePicture } })
        });
        this.userProfile.profilePicture = user.profilePicture;
        localStorage.setItem('profilePic', user.profilePicture);
        this.newProfilePicture = null;
        this.message = 'Profile picture updated!';
      } catch (error) {
        this.message = 'Failed to update profile picture';
        console.error('Error updating profile picture:', error);
      }
    },
    toggleSetting(key) {
      this.settings[key] = !this.settings[key];
      if (key === 'darkMode') {
        this.toggleDarkMode();
      }
    },
    toggleDarkMode() {
      document.documentElement.classList.toggle('dark-mode', this.settings.darkMode);
      localStorage.setItem('darkMode', this.settings.darkMode);
    },
    getStatusText(key) {
      switch (key) {
        case 'darkMode': return this.settings.darkMode ? 'On' : 'Off';
        case 'notifications': return this.settings.notifications ? 'On' : 'Off';
        case 'privateAccount': return this.settings.privateAccount ? 'On' : 'Off';
        case 'showOnlineStatus': return this.settings.showOnlineStatus ? 'Visible' : 'Hidden';
        case 'twoFactorAuth': return this.settings.twoFactorAuth ? 'Enabled' : 'Disabled';
        default: return '';
      }
    },
    getToggleStyle(key) {
      return {
        width: '50px',
        height: '26px',
        borderRadius: '13px',
        background: this.settings[key] ? '#5865F2' : '#4F545C',
        position: 'relative',
        cursor: 'pointer',
        transition: 'background 0.3s ease'
      };
    },
    getKnobStyle(key) {
      return {
        height: '22px',
        width: '22px',
        background: '#FFFFFF',
        borderRadius: '50%',
        position: 'absolute',
        top: '2px',
        left: this.settings[key] ? '26px' : '2px',
        transition: 'left 0.3s ease'
      };
    },
    async saveSettings() {
      const userId = localStorage.getItem('userId');
      if (!userId) {
        this.message = 'User ID not found!';
        return;
      }
      try {
        await nodeAPI.request('/api/user-update', {
          method: 'PUT',
          body: JSON.stringify({ userId, updates: { preferences: this.settings } })
        });
        this.message = 'Settings saved successfully!';
      } catch (error) {
        this.message = 'Failed to save settings';
        console.error('Error saving settings:', error);
      }
    },
    openBlockedUsers() {
      this.showModal(
        'Blocked Users',
        '<p>This feature will allow you to manage your blocked users.<br><br><em>Coming soon!</em></p>'
      );
    },
    viewMyActivity() {
      this.showModal(
        'My Activity',
        '<p>Your activity history will be shown here.<br><br><em>Coming soon!</em></p>'
      );
    },
    viewAboutUs() {
      this.showModal(
        'About Us',
        `<p><strong>Pulse</strong> is a modern social platform.<br>
        <br>Version: 1.0.0<br>
        <br>Made with ❤️ by the Pulse Team.<br>
        <br>Contact: <a href="mailto:support@pulse.com" style="color:#5865F2">support@pulse.com</a></p>`
      );
    },
    viewTerms() {
      this.showModal(
        'Terms and Conditions',
        `<p>By using Pulse, you agree to our terms and conditions.<br>
        <br><em>Full terms and conditions coming soon!</em></p>`
      );
    },
    showModal(title, body) {
      this.modal.title = title;
      this.modal.body = body;
      this.modal.visible = true;
    },
    closeModal() {
      this.modal.visible = false;
    },
    logOut() {
      localStorage.clear();
      window.location.reload();
    }
  },
  watch: {
    message(val) {
      if (val) {
        setTimeout(() => { this.message = ''; }, 2000);
      }
    }
  },
  mounted() {
    this.fetchUserSettings();
    const savedDarkMode = localStorage.getItem('darkMode');
    if (savedDarkMode !== null) {
      this.settings.darkMode = savedDarkMode === 'true';
      if (this.settings.darkMode) {
        document.documentElement.classList.add('dark-mode');
      }
    }
  }
};
</script>


