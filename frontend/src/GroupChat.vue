<template>
 <div class="group-list-section">
  <div class="groups-container">
 <div
    v-for="group in groups"
    :key="group.id"
    class="group-card"
    @click="handleGroupClick(group)" 
    style="display: flex; align-items: center; padding: 12px 16px; margin: 10px 0; border-radius: 8px; box-shadow: 0 2px 6px rgba(0,0,0,0.1); transition: transform 0.2s, box-shadow 0.3s; cursor: pointer;"
  >
      <div class="profile-picture" style="width: 30px; height: 30px; border-radius: 50%; margin-right: 20px; overflow: hidden; background-color: #ccc;"><img :src="group.image || 'https://latestnewsandaffairs.site/public/pfp1.jpg'" :alt="group.name + ' image'" style="width: 100%; height: 100%; object-fit: cover;" /></div>
      <div class="group-name" style="font-size: 1.05rem; color: #fff;"><strong>{{ group.name }}</strong></div>
    </div>
  </div>
</div>
</template>

<script>
import { useUserStore } from './stores/userStore';

export default {
  name: 'GroupChat',
  data() {
    return {
      groups: [],
      loggedInUsername: localStorage.getItem('username')?.trim() || null,
    };
  },
  computed: {
    userStore() {
      return useUserStore();
    },
  },
  methods: {
    async fetchGroups() {
      try {
        const response = await fetch('https://sports321.vercel.app/api/Group', {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
            Accept: 'application/json',
          },
          credentials: 'include',
        });
        if (!response.ok) throw new Error('Failed to fetch groups');
        this.groups = await response.json();
      } catch (error) {
        console.error('Error fetching groups:', error);
        this.userStore.warningMessage = 'Failed to fetch groups.';
      }
    },
    handleGroupClick(group) {
      this.$router.push({
        name: 'GroupChatbox',
        params: {
          groupId: group.id,
          groupName: group.name,
        },
      });
    },
  },
  mounted() {
    this.fetchGroups();
  },
};
</script>
<style src="./Chatbox.css"></style>
