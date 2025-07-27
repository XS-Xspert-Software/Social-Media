<template>
  <section class="settings-section">
    <!-- Minimal, Instagram-style Settings UI -->
    <div class="settings-card">
      <h2 class="settings-title">Profile Settings</h2>
      <!-- Profile Image Upload -->
      <div class="profile-image-block">
        <img
          :src="userProfile.profile_picture"
          alt="Profile Picture"
          class="profile-img"
          @error="e => e.target.src = defaultProfilePic"
        />
        <input
          type="file"
          ref="profileFileInput"
          id="profileFileInput"
          @change="handleProfilePictureChange"
          accept="image/*"
          style="display: none;"
        />
        <button class="btn btn-secondary" @click="triggerFileInput">Change</button>
        <button
          v-if="newProfilePicture"
          class="btn btn-success"
          @click="saveProfilePicture"
        >Save</button>
      </div>
      <!-- Username -->
      <div class="profile-field">
        <label>Username</label>
        <input
          v-model="userProfile.username"
          class="input"
          @blur="updateUserProfileField('username', userProfile.username)"
          :disabled="loading"
        />
      </div>
      <!-- Description -->
      <div class="profile-field">
        <label>Description</label>
        <textarea
          v-model="userProfile.description"
          class="input"
          rows="2"
          @blur="updateUserProfileField('description', userProfile.description)"
          :disabled="loading"
        ></textarea>
      </div>
      <!-- Location -->
      <div class="profile-field">
        <label>Location</label>
        <input
          v-model="userProfile.location"
          class="input"
          @blur="updateUserProfileField('location', userProfile.location)"
          :disabled="loading"
        />
      </div>
      <!-- Dark Mode Toggle -->
      <div class="profile-field darkmode-toggle">
        <label>Dark Mode</label>
        <div
          class="toggle-switch"
          :aria-pressed="settings.darkMode"
          role="switch"
          tabindex="0"
          @click="toggleSetting('darkMode')"
          @keydown.space.prevent="toggleSetting('darkMode')"
          @keydown.enter.prevent="toggleSetting('darkMode')"
          :aria-label="'Toggle Dark Mode'"
        >
          <div class="toggle-knob" :style="getKnobStyle('darkMode')"></div>
        </div>
        <span class="status-text">{{ settings.darkMode ? 'On' : 'Off' }}</span>
      </div>
      <!-- Feedback Message -->
      <div v-if="message" class="settings-message" :class="{ error: message.toLowerCase().includes('fail') }">
        <span>{{ message }}</span>
      </div>
    </div>
  </section>
</template>

<script setup>
import { ref, onMounted } from 'vue';

// Default profile picture fallback
const defaultProfilePic = 'https://latestnewsandaffairs.site/public/pfp.jpg';

// Reactive state for user profile
const userProfile = ref({
  username: '',
  profile_picture: defaultProfilePic,
  description: '',
  location: ''
});
const newProfilePicture = ref(null);
const loading = ref(false);
const message = ref('');

// Settings for dark mode
const settings = ref({ darkMode: false });

// File input ref
const profileFileInput = ref(null);

// Fetch user profile from backend
const fetchUserProfile = async () => {
  loading.value = true;
  try {
    const username = localStorage.getItem('username');
    if (!username) {
      message.value = 'Username not found!';
      return;
    }
    // Call backend endpoint for user profile
    const response = await fetch(`/api/user/settings?username=${encodeURIComponent(username)}`);
    if (!response.ok) throw new Error('Failed to fetch profile');
    const user = await response.json();
    userProfile.value = {
      username: user.username || username,
      profile_picture: user.profile_picture || defaultProfilePic,
      description: user.description || '',
      location: user.location || ''
    };
    // Load dark mode preference
    if (user.preferences && typeof user.preferences.darkMode === 'boolean') {
      settings.value.darkMode = user.preferences.darkMode;
      if (settings.value.darkMode) {
        document.documentElement.classList.add('dark-mode');
      } else {
        document.documentElement.classList.remove('dark-mode');
      }
    }
  } catch (error) {
    message.value = 'Error loading profile.';
    console.error(error);
  } finally {
    loading.value = false;
  }
};

// Update a user profile field (username, description, location)
const updateUserProfileField = async (field, newValue) => {
  if (!userProfile.value.username) return;
  loading.value = true;
  try {
    const body = { username: userProfile.value.username, [field]: newValue };
    const response = await fetch('/api/user/settings', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body)
    });
    if (!response.ok) throw new Error('Update failed');
    message.value = `${field.charAt(0).toUpperCase() + field.slice(1)} updated!`;
    if (field === 'username') localStorage.setItem('username', newValue);
  } catch (error) {
    message.value = `Failed to update ${field}`;
    console.error(error);
  } finally {
    loading.value = false;
  }
};

// Profile image upload logic
const triggerFileInput = () => {
  profileFileInput.value && profileFileInput.value.click();
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
  loading.value = true;
  try {
    const response = await fetch('/api/user/settings', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username: userProfile.value.username, profile_picture: newProfilePicture.value })
    });
    if (!response.ok) throw new Error('Profile picture update failed');
    message.value = 'Profile picture updated!';
    localStorage.setItem('profilePic', newProfilePicture.value);
    newProfilePicture.value = null;
  } catch (error) {
    message.value = 'Failed to update profile picture';
    console.error(error);
  } finally {
    loading.value = false;
  }
};

// Dark mode toggle logic
const toggleSetting = async (key) => {
  settings.value[key] = !settings.value[key];
  if (key === 'darkMode') {
    document.documentElement.classList.toggle('dark-mode', settings.value.darkMode);
    localStorage.setItem('darkMode', settings.value.darkMode);
    // Save preference to backend
    await savePreferences();
  }
};
const getKnobStyle = (key) => ({
  left: settings.value[key] ? '26px' : '2px'
});
const savePreferences = async () => {
  try {
    await fetch('/api/user/preferences', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username: userProfile.value.username, preferences: settings.value })
    });
  } catch (error) {
    // Silently fail for now
  }
};

onMounted(() => {
  fetchUserProfile();
  // Restore dark mode from localStorage
  const savedDarkMode = localStorage.getItem('darkMode');
  if (savedDarkMode !== null) {
    settings.value.darkMode = savedDarkMode === 'true';
    document.documentElement.classList.toggle('dark-mode', settings.value.darkMode);
  }
});
</script>

<style scoped>
.settings-section {
  display: flex;
  justify-content: center;
  align-items: flex-start;
  min-height: 100vh;
  background: var(--settings-bg, #fff);
  padding: 32px 0;
}
.settings-card {
  background: #fff;
  border-radius: 12px;
  box-shadow: 0 2px 16px rgba(0,0,0,0.07);
  padding: 32px 24px;
  width: 100%;
  max-width: 400px;
  display: flex;
  flex-direction: column;
  gap: 24px;
}
.settings-title {
  font-size: 1.5rem;
  font-weight: 700;
  margin-bottom: 12px;
  color: #222;
  text-align: center;
}
.profile-image-block {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
}
.profile-img {
  width: 80px;
  height: 80px;
  border-radius: 50%;
  object-fit: cover;
  border: 2px solid #eee;
  margin-bottom: 4px;
}
.btn {
  border: none;
  border-radius: 4px;
  padding: 6px 16px;
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  transition: background 0.2s;
}
.btn-secondary {
  background: #f2f2f2;
  color: #333;
  margin-right: 8px;
}
.btn-secondary:hover {
  background: #e0e0e0;
}
.btn-success {
  background: #43b581;
  color: #fff;
}
.btn-success:hover {
  background: #36996b;
}
.profile-field {
  display: flex;
  flex-direction: column;
  gap: 4px;
}
.profile-field label {
  font-size: 13px;
  color: #666;
  margin-bottom: 2px;
}
.input {
  border: 1px solid #ddd;
  border-radius: 4px;
  padding: 8px;
  font-size: 15px;
  background: #fafafa;
  color: #222;
  outline: none;
  transition: border 0.2s;
}
.input:focus {
  border: 1.5px solid #43b581;
}
.darkmode-toggle {
  flex-direction: row;
  align-items: center;
  gap: 12px;
}
.toggle-switch {
  width: 50px;
  height: 26px;
  border-radius: 13px;
  background: #4F545C;
  position: relative;
  cursor: pointer;
  transition: background 0.3s;
  margin-right: 8px;
  border: 1px solid #ddd;
}
.toggle-switch[aria-pressed="true"] {
  background: #43b581;
}
.toggle-knob {
  width: 22px;
  height: 22px;
  background: #fff;
  border-radius: 50%;
  position: absolute;
  top: 2px;
  transition: left 0.3s;
  box-shadow: 0 1px 4px rgba(0,0,0,0.08);
}
.status-text {
  font-size: 13px;
  color: #666;
}
.settings-message {
  background: #f7f7f7;
  color: #43b581;
  font-size: 14px;
  font-weight: 500;
  padding: 10px 16px;
  border-radius: 6px;
  margin-top: 10px;
  border: 1px solid #43b581;
  text-align: center;
}
.settings-message.error {
  color: #ed4245;
  border-color: #ed4245;
  background: #fff0f0;
}
/* Dark mode styles */
.dark-mode .settings-card {
  background: #23272a;
  color: #fff;
}
.dark-mode .settings-title {
  color: #fff;
}
.dark-mode .profile-field label,
.dark-mode .status-text {
  color: #b9bbbe;
}
.dark-mode .input {
  background: #2f3136;
  color: #fff;
  border: 1px solid #444;
}
.dark-mode .input:focus {
  border: 1.5px solid #43b581;
}
.dark-mode .toggle-switch {
  background: #444;
  border: 1px solid #333;
}
.dark-mode .toggle-switch[aria-pressed="true"] {
  background: #43b581;
}
.dark-mode .settings-message {
  background: #23272a;
  color: #43b581;
  border: 1px solid #43b581;
}
.dark-mode .settings-message.error {
  color: #ed4245;
  border-color: #ed4245;
  background: #2f1a1a;
}
</style>
