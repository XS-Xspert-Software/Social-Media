<template>
  <section class="settings-section">
    <!-- Feedback/Message Area -->
    <div v-if="message" class="settings-message" :class="{ error: message.toLowerCase().includes('fail') }">
      <i v-if="message.toLowerCase().includes('fail')" class="fas fa-exclamation-triangle"></i>
      <i v-else class="fas fa-check-circle"></i>
      {{ message }}
    </div>
    <!-- SSBAR -->
    <div class="SSBAR">
      <h2 class="SSBAR-title">Settings</h2>
      <!-- User Settings Section -->
      <div class="settings-group">
        <h6 class="section-header">USER SETTINGS</h6>
        <ul class="nav">
          <!-- Profile -->
          <li class="nav-item">
            <a
              class="nav-link"
              :class="{ active: activeSection === 'profile' }"
              @click="toggleSection('profile')"
              href="#profile"
              aria-current="profile"
              tabindex="0"
            >
              <i class="fas fa-user"></i> Profile
            </a>
            <div v-if="activeSection === 'profile'" class="section-details">
              <div class="profile-item">
                <strong>Username:</strong>
                <span>{{ userProfile.username || 'Loading...' }}</span>
                <i class="fas fa-edit edit-icon" @click="changeUsername" title="Edit Username" tabindex="0" aria-label="Edit Username"></i>
              </div>
              <hr class="divider">
              <div class="profile-item">
                <strong>Profile Picture:</strong>
                <div class="picture-controls">
                  <img
                    :src="userProfile.profile_picture"
                    alt="Profile Picture"
                    class="profile-img"
                    @error="e => e.target.src = 'https://latestnewsandaffairs.site/public/pfp.jpg'"
                  />
                  <i class="fas fa-edit edit-icon" @click="triggerFileInput" title="Change Profile Picture" tabindex="0" aria-label="Change Profile Picture"></i>
                  <input
                    type="file"
                    ref="profileFileInput"
                    id="profileFileInput"
                    @change="handleProfilePictureChange"
                    accept="image/*"
                    style="display: none;"
                  />
                  <button
                    v-if="newProfilePicture"
                    class="btn btn-success"
                    @click="saveProfilePicture"
                  >
                    Save
                  </button>
                </div>
              </div>
              <hr class="divider">
              <div class="profile-item">
                <strong>Description:</strong>
                <span>{{ userProfile.description || 'No description available' }}</span>
                <i class="fas fa-edit edit-icon" @click="editDescription" title="Edit Description" tabindex="0" aria-label="Edit Description"></i>
              </div>
              <hr class="divider">
              <div class="profile-item">
                <strong>Location:</strong>
                <span>{{ userProfile.location || 'Location not available' }}</span>
                <i class="fas fa-edit edit-icon" @click="editLocation" title="Edit Location" tabindex="0" aria-label="Edit Location"></i>
              </div>
              <hr class="divider">
              <div class="profile-item">
                <strong>Status:</strong>
                <span>{{ userProfile.status || 'Status not available' }}</span>
                <i class="fas fa-edit edit-icon" @click="editStatus" title="Edit Status" tabindex="0" aria-label="Edit Status"></i>
              </div>
              <hr class="divider">
              <div class="profile-item">
                <strong>Profession:</strong>
                <span>{{ userProfile.profession || 'Profession not available' }}</span>
                <i class="fas fa-edit edit-icon" @click="editProfession" title="Edit Profession" tabindex="0" aria-label="Edit Profession"></i>
              </div>
              <hr class="divider">
              <div class="profile-item">
                <strong>Hobby:</strong>
                <span>{{ userProfile.hobby || 'Hobby not available' }}</span>
                <i class="fas fa-edit edit-icon" @click="editHobby" title="Edit Hobby" tabindex="0" aria-label="Edit Hobby"></i>
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
              aria-current="general"
              tabindex="0"
            >
              <i class="fas fa-cog"></i> General
            </a>
            <div v-if="activeSection === 'general'" class="section-details">
              <div
                v-for="item in toggleSettings"
                :key="item.key"
                class="toggle-item"
              >
                <span>{{ item.label }}</span>
                <div class="toggle-controls">
                  <div
                    class="toggle-switch"
                    :aria-pressed="settings[item.key]"
                    role="switch"
                    tabindex="0"
                    @click="toggleSetting(item.key)"
                    @keydown.space.prevent="toggleSetting(item.key)"
                    @keydown.enter.prevent="toggleSetting(item.key)"
                    :style="getToggleStyle(item.key)"
                    :aria-label="'Toggle ' + item.label"
                  >
                    <div class="toggle-knob" :style="getKnobStyle(item.key)"></div>
                  </div>
                  <span class="status-text">{{ getStatusText(item.key) }}</span>
                </div>
              </div>
              <button class="btn btn-primary full-width" @click="saveSettings" :disabled="loading">
                <span v-if="loading"><i class="fas fa-spinner fa-spin"></i> Saving...</span>
                <span v-else>Save Settings</span>
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
              aria-current="history"
              tabindex="0"
            >
              <i class="fas fa-history"></i> History
            </a>
            <div v-if="activeSection === 'history'" class="section-details">
              <button class="btn btn-primary full-width" @click="viewMyActivity">
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
              aria-current="About"
              tabindex="0"
            >
              <i class="fas fa-info-circle"></i> About
            </a>
            <div v-if="activeSection === 'About'" class="section-details">
              <button class="btn btn-primary full-width" @click="viewAboutUs">
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
              aria-current="Terms"
              tabindex="0"
            >
              <i class="fas fa-file-alt"></i> Terms and Conditions
            </a>
            <div v-if="activeSection === 'Terms'" class="section-details">
              <button class="btn btn-primary full-width" @click="viewTerms">
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
              aria-current="account"
              tabindex="0"
            >
              <i class="fas fa-shield-alt"></i> Account
            </a>
            <div v-if="activeSection === 'account'" class="section-details">
              <button class="btn btn-primary full-width" @click="openBlockedUsers">
                Blocked Users
              </button>
              <button class="btn btn-danger full-width" @click="logOut">Log Out</button>
            </div>
          </li>
        </ul>
      </div>
      <!-- Separator -->
      <hr class="section-divider">
      <!-- Payment Settings Section -->
      <div class="settings-group">
        <h6 class="section-header">PAYMENT SETTINGS</h6>
        <ul class="nav">
          <li class="nav-item">
            <a class="nav-link disabled" href="#">Quests</a>
          </li>
          <li class="nav-item">
            <a class="nav-link disabled" href="#">Server Boost</a>
          </li>
          <li class="nav-item">
            <a class="nav-link disabled" href="#">Nitro Gifting</a>
          </li>
        </ul>
      </div>
      <!-- Separator -->
      <hr class="section-divider">
      <!-- App Settings Section -->
      <div class="settings-group">
        <h6 class="section-header">APP SETTINGS</h6>
        <ul class="nav">
          <li class="nav-item">
            <a class="nav-link disabled" href="#">Voice</a>
          </li>
          <li class="nav-item">
            <a class="nav-link disabled" href="#">Appearance</a>
          </li>
          <li class="nav-item">
            <a class="nav-link disabled" href="#">Accessibility</a>
          </li>
          <li class="nav-item">
            <a class="nav-link disabled" href="#">Language</a>
          </li>
          <li class="nav-item">
            <a class="nav-link disabled" href="#">Chat</a>
          </li>
        </ul>
      </div>
    </div>
  </section>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue';

// Reactive state
const activeSection = ref(null);
const userProfile = ref({
  username: localStorage.getItem('username') || '',
  profile_picture: 'https://latestnewsandaffairs.site/public/pfp.jpg',
  description: 'No description available',
  location: 'Location not available',
  status: 'Status not available',
  profession: 'Profession not available',
  hobby: 'Hobby not available'
});
const newProfilePicture = ref(null);
const settings = ref({
  darkMode: false,
  notifications: true,
  privateAccount: false,
  showOnlineStatus: true,
  twoFactorAuth: false
});
const loading = ref(false);
const message = ref('');

// Computed properties
const toggleSettings = computed(() => [
  { key: 'darkMode', label: 'Dark Mode' },
  { key: 'notifications', label: 'Notifications' },
  { key: 'privateAccount', label: 'Private Account' },
  { key: 'showOnlineStatus', label: 'Show Online Status' },
  { key: 'twoFactorAuth', label: 'Two-Factor Authentication' }
]);

// Methods
const toggleSection = (section) => {
  activeSection.value = activeSection.value === section ? null : section;
};

const fetchUserSettings = async () => {
  loading.value = true;
  try {
    const username = localStorage.getItem('username');
    if (!username) {
      message.value = 'Username not found!';
      return;
    }
    const response = await fetch(`https://sports321.vercel.app/api/posts?username=${username}`);
    const user = await response.json();
    userProfile.value = {
      username: username,
      location: user.location || 'Location not available',
      status: user.status || 'Status not available',
      profession: user.profession || 'Profession not available',
      hobby: user.hobby || 'Hobby not available',
      description: user.description || 'No description available',
      profile_picture: user.profile_picture || 'https://latestnewsandaffairs.site/public/pfp.jpg'
    };
  } catch (error) {
    message.value = 'Error fetching user settings.';
    console.error('Error fetching user settings:', error);
  } finally {
    loading.value = false;
  }
};

const updateUserProfileField = async (field, newValue) => {
  const username = localStorage.getItem('username');
  if (!username) {
    message.value = 'Username not found!';
    return;
  }
  try {
    const body = { username, [field]: newValue };
    const response = await fetch('https://sports321.vercel.app/api/posts', {
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
    } else {
      throw new Error('Update failed');
    }
  } catch (error) {
    message.value = `Failed to update ${field}`;
    console.error(`Error updating ${field}:`, error);
  }
};

const changeUsername = () => {
  const newUsername = prompt('Enter your new username:', userProfile.value.username);
  if (newUsername?.trim()) {
    updateUserProfileField('username', newUsername.trim());
  }
};

const editDescription = () => {
  const newDescription = prompt('Tell us about yourself:', userProfile.value.description);
  if (newDescription?.trim()) {
    updateUserProfileField('description', newDescription.trim());
  }
};

const editLocation = () => {
  const newLocation = prompt('Enter your new location:', userProfile.value.location);
  if (newLocation?.trim()) {
    updateUserProfileField('location', newLocation.trim());
  }
};

const editStatus = () => {
  const newStatus = prompt('Enter your new status:', userProfile.value.status);
  if (newStatus?.trim()) {
    updateUserProfileField('status', newStatus.trim());
  }
};

const editProfession = () => {
  const newProfession = prompt('Enter your new profession:', userProfile.value.profession);
  if (newProfession?.trim()) {
    updateUserProfileField('profession', newProfession.trim());
  }
};

const editHobby = () => {
  const newHobby = prompt('Enter your new hobby:', userProfile.value.hobby);
  if (newHobby?.trim()) {
    updateUserProfileField('hobby', newHobby.trim());
  }
};

const triggerFileInput = () => {
  const fileInput = document.querySelector('#profileFileInput');
  fileInput.click();
};

const handleProfilePictureChange = (event) => {
  const file = event.target.files[0];
  if (file) {
    const reader = new FileReader();
    reader.onload = (e) => {
      newProfilePicture.value = e.target.result;
      userProfile.value.profile_picture = e.target.result;
    };
    reader.readAsDataURL(file);
  }
};

const saveProfilePicture = async () => {
  if (!newProfilePicture.value) return;
  try {
    const username = localStorage.getItem('username');
    if (!username) {
      message.value = 'Username not found!';
      return;
    }
    const response = await fetch('https://sports321.vercel.app/api/posts', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, profilePicture: newProfilePicture.value })
    });
    if (response.ok) {
      userProfile.value.profile_picture = newProfilePicture.value;
      localStorage.setItem('profilePic', newProfilePicture.value);
      newProfilePicture.value = null;
      message.value = 'Profile picture updated!';
    } else {
      throw new Error('Profile picture update failed');
    }
  } catch (error) {
    message.value = 'Failed to update profile picture';
    console.error('Error updating profile picture:', error);
  }
};

const toggleSetting = (key) => {
  settings.value[key] = !settings.value[key];
  if (key === 'darkMode') {
    toggleDarkMode();
  }
};

const toggleDarkMode = () => {
  document.documentElement.classList.toggle('dark-mode', settings.value.darkMode);
  localStorage.setItem('darkMode', settings.value.darkMode);
};

const getStatusText = (key) => {
  switch (key) {
    case 'darkMode': return settings.value.darkMode ? 'On' : 'Off';
    case 'notifications': return settings.value.notifications ? 'On' : 'Off';
    case 'privateAccount': return settings.value.privateAccount ? 'On' : 'Off';
    case 'showOnlineStatus': return settings.value.showOnlineStatus ? 'Visible' : 'Hidden';
    case 'twoFactorAuth': return settings.value.twoFactorAuth ? 'Enabled' : 'Disabled';
    default: return '';
  }
};

const getToggleStyle = (key) => ({
  width: '50px',
  height: '26px',
  borderRadius: '13px',
  background: settings.value[key] ? '#5865F2' : '#4F545C',
  position: 'relative',
  cursor: 'pointer',
  transition: 'background 0.3s ease'
});

const getKnobStyle = (key) => ({
  height: '22px',
  width: '22px',
  background: '#FFFFFF',
  borderRadius: '50%',
  position: 'absolute',
  top: '2px',
  left: settings.value[key] ? '26px' : '2px',
  transition: 'left 0.3s ease'
});

const saveSettings = async () => {
  const username = localStorage.getItem('username');
  if (!username) {
    message.value = 'Username not found!';
    return;
  }
  try {
    const response = await fetch('https://sports321.vercel.app/api/posts', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, preferences: settings.value })
    });
    if (response.ok) {
      message.value = 'Settings saved successfully!';
    } else {
      throw new Error('Settings save failed');
    }
  } catch (error) {
    message.value = 'Failed to save settings';
    console.error('Error saving settings:', error);
  }
};

const openBlockedUsers = () => {
  message.value = 'Blocked users feature coming soon!';
};

const viewMyActivity = () => {
  message.value = 'Activity history feature coming soon!';
};

const viewAboutUs = () => {
  message.value = 'About us page coming soon!';
};

const viewTerms = () => {
  message.value = 'Terms and conditions page coming soon!';
};

const logOut = () => {
  localStorage.clear();
  window.location.reload();
};

// Lifecycle hook
onMounted(() => {
  fetchUserSettings();
  const savedDarkMode = localStorage.getItem('darkMode');
  if (savedDarkMode !== null) {
    settings.value.darkMode = savedDarkMode === 'true';
    if (settings.value.darkMode) {
      document.documentElement.classList.add('dark-mode');
    }
  }
});
</script>

<style scoped>
/* Base styles */
.settings-section {
  font-family: 'Whitney', 'Helvetica Neue', Helvetica, Arial, sans-serif;
  background-color: #000;
  display: flex;
  justify-content: center;
  margin-top: 50PX;
}

.SSBAR {
  width: 100%;
  max-width: 600px;
  background-color: #000;
  overflow-y: auto;
  padding: 15px;
  border-radius: 8px;
}

.SSBAR-title {
  font-size: 10px;
  font-weight: 600;
  color: #060607;
  margin-bottom: 16px;
}

.section-header {
  font-size: 12px;
  font-weight: 600;
  color: #F2F3F5;
  letter-spacing: 0.5px;
  margin-bottom: 8px;
}

.settings-group {
  margin-bottom: 16px;
}

.nav {
  list-style: none;
  padding: 0;
  margin: 0;
}

.nav-item {
  margin-bottom: 0;
}

.nav-link {
  font-size: 14px;
  font-weight: 500;
  color: #FFFFFF;
  padding: 8px 16px;
  border-radius: 4px;
  transition: all 0.2s ease;
  cursor: pointer;
  text-decoration: none;
  display: block;
}

.nav-link:hover {
  background-color: #F2F3F5;
  color: #060607;
}

.nav-link.active {
  background-color: #E3E5E8;
  color: #060607;
  font-weight: 700;
  box-shadow: 0 2px 8px rgba(88,101,242,0.08);
}

.nav-link.disabled {
  color: #A3A6AA;
  cursor: not-allowed;
}

.nav-link i {
  margin-right: 8px;
}

.section-details {
  padding: 8px 16px 8px 30px;
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

/* Profile items */
.profile-item {
  display: flex;
  align-items: center;
  margin-bottom: 12px;
}

.profile-item strong {
  margin-right: 8px;
}

.profile-item .edit-icon {
  margin-left: auto;
}

.picture-controls {
  display: flex;
  align-items: center;
  margin-top: 8px;
}

.profile-img {
  width: 60px;
  height: 60px;
  border-radius: 50%;
  object-fit: cover;
  margin-right: 12px;
}

/* Toggle items */
.toggle-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 12px;
}

.toggle-controls {
  display: flex;
  align-items: center;
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
  margin-left: 12px;
}

/* Buttons */
.btn {
  border: none;
  border-radius: 4px;
  padding: 8px 16px;
  font-size: 13px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s ease;
  text-decoration: none;
  display: inline-block;
}

.btn-primary {
  background-color: #5865F2;
  color: #FFFFFF;
}

.btn-primary:hover {
  background-color: #4752C4;
}

.btn-success {
  background-color: #00C851;
  color: #FFFFFF;
  margin-left: 12px;
}

.btn-success:hover {
  background-color: #00A63F;
}

.btn-danger {
  background-color: #ED4245;
  color: #FFFFFF;
  margin-top: 12px;
}

.btn-danger:hover {
  background-color: #C73538;
}

.full-width {
  width: 100%;
}

/* Dividers */
.divider {
  border: none;
  border-top: 1px solid #E3E5E8;
  margin: 8px 0;
}

.section-divider {
  border: none;
  border-top: 1px solid #E3E5E8;
  margin: 16px 0;
}

/* Edit icons */
.edit-icon {
  cursor: pointer;
  color: #4F5660;
  font-size: 13px;
  transition: all 0.2s ease;
}

.edit-icon:hover {
  color: #5865F2;
}

/* Dark mode */
.dark-mode {
  background-color: #2F3136;
}

.dark-mode .SSBAR {
  background-color: #36393F;
}

.dark-mode .SSBAR-title,
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

.dark-mode .nav-link:hover {
  background-color: #3A3C43;
  color: #FFFFFF;
}

.dark-mode .nav-link.active {
  background-color: #40444B;
  color: #FFFFFF;
}

.dark-mode .edit-icon:hover {
  color: #5865F2;
}

.dark-mode .divider,
.dark-mode .section-divider {
  border-top: 1px solid #202225;
}

/* New styles */
.settings-message {
  display: flex;
  align-items: center;
  justify-content: center;
  background: #23272a;
  color: #43b581;
  font-size: 14px;
  font-weight: 500;
  padding: 10px 16px;
  border-radius: 6px;
  margin-bottom: 18px;
  gap: 8px;
  border: 1px solid #43b581;
  transition: background 0.2s, color 0.2s;
}
.settings-message.error {
  color: #ed4245;
  border-color: #ed4245;
  background: #2f1a1a;
}

/* Focus style for toggles and edit icons for accessibility */
.toggle-switch:focus, .edit-icon:focus {
  outline: 2px solid #5865F2;
  outline-offset: 2px;
}

/* Improve nav-link active/hover for clarity */
.nav-link.active {
  background-color: #E3E5E8;
  color: #060607;
  font-weight: 700;
  box-shadow: 0 2px 8px rgba(88,101,242,0.08);
}
.nav-link:hover:not(.disabled) {
  background-color: #F2F3F5;
  color: #060607;
  font-weight: 600;
}

/* Loading spinner for save button */
.fa-spinner {
  margin-right: 6px;
}
</style>
