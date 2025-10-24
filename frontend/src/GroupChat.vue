<template>
  <div class="group-list-section">
    <div v-if="groupsStore.loading" class="loading">
      <div class="spinner"></div>
    </div>
    
    <!-- Groups list -->
    <div v-else class="groups-container">
      <!-- My Groups Section -->
      <div v-if="groupsStore.joinedGroups.length > 0" class="groups-section">
        <h3 style="color: #fff; margin: 20px 0px 10px 20px; font-size: 1.2rem;">My Groups Joined</h3>
        <div
          v-for="group in groupsStore.joinedGroups"
          :key="'joined-' + group.id"
          class="group-card joined-group"
          @click="goToChatbox(group)"
          style="display: flex;width: 100%; padding: 20px 24px; margin: 10px 0; align-items: center; border-radius: 8px;transition: transform 0.2s, box-shadow 0.3s; cursor: pointer; "
        >
          <div class="profile-picture" style="width: 50px; height: 50px; border-radius: 50%; margin-right: 15px; overflow: hidden; background-color: #ccc;">
            <img 
              :src="group.image || 'https://endless.sbs/public/pfp1.jpg'" 
              :alt="group.name + ' image'" 
              style="width: 100%; height: 100%; object-fit: cover;" 
            />
          </div>
          <div class="group-info" style="flex: 1;">
            <div class="group-name" style="font-size: 1.1rem; color: #fff; font-weight: bold;">
              {{ group.name || 'Unnamed Group' }}
            </div>
            <div class="group-meta" style="font-size: 0.85rem; color: rgba(255,255,255,0.8); margin-top: 2px;">
              {{ group.userRole }} • {{ group.member_count }} members
            </div>
          </div>
          <div class="member-badge" style="background: rgba(255,255,255,0.2); padding: 4px 8px; border-radius: 12px; font-size: 0.75rem; color: #fff;">
            Joined
          </div>
        </div>
      </div>

      <!-- Available Groups Section -->
      <div v-if="groupsStore.availableGroups.length > 0" class="groups-section">
        <h3 style="color: #fff; margin: 5px 5px 10px 0; font-size: 1rem;">Available Groups</h3>
        <div
          v-for="group in groupsStore.availableGroups"
          :key="'available-' + group.id"
          class="group-card available-group"
          style="display: flex; align-items: center; padding: 4px 8px; margin: 10px 0; border-radius: 8px; box-shadow: 0 2px 6px rgba(0,0,0,0.1); transition: transform 0.2s, box-shadow 0.3s; background: rgba(255,255,255,0.1); border: 1px solid rgba(255,255,255,0.2);"
        >
          <div class="profile-picture" style="width: 40px; height: 40px; border-radius: 50%; margin-right: 15px; overflow: hidden; background-color: #ccc;">
            <img 
              :src="group.image || 'https://endless.sbs/public/pfp1.jpg'" 
              :alt="group.name + ' image'" 
              style="width: 100%; height: 100%; object-fit: cover;" 
            />
          </div>
          <div class="group-info" style="flex: 1;">
            <div class="group-name" style="font-size: 1.1rem; color: #fff; font-weight: bold;">
              {{ group.name || 'Unnamed Group' }}
            </div>
            <div class="group-meta" style="font-size: 0.85rem; color: rgba(255,255,255,0.7); margin-top: 2px;">
              {{ group.member_count }} members
              <span v-if="group.description" style="margin-left: 8px;">• {{ group.description }}</span>
            </div>
          </div>
          <button
                v-if="!group.hasPendingRequest && group.membershipStatus !== 'banned'"
                @click="handleJoinGroup(group)"
                :disabled="groupsStore.joiningGroupId === group.id"
                class="join-button"
                :class="{ 'joining': groupsStore.joiningGroupId === group.id }"
              >
                {{ groupsStore.joiningGroupId === group.id ? 'Joining...' : 'Join' }}
              </button>
              
              <!-- Pending Request Button -->
              <button
                v-else-if="group.hasPendingRequest || group.membershipStatus === 'pending'"
                class="pending-button"
                disabled
              >
                {{ group.isPrivate ? 'Request Pending' : 'Processing...' }}
              </button>
              
              <!-- Banned State -->
              <button
                v-else-if="group.membershipStatus === 'banned'"
                class="banned-button"
                disabled
              >
                Access Denied
              </button>
              
              <!-- Cancel Request Button (for pending requests) -->
              <button
                v-if="group.hasPendingRequest && group.canCancelRequest"
                @click="handleCancelRequest(group)"
                :disabled="groupsStore.cancellingRequestId === group.id"
                class="cancel-request-button"
              >
                {{ groupsStore.cancellingRequestId === group.id ? 'Cancelling...' : 'Cancel Request' }}
              </button>
        </div>
      </div>

      <!-- Empty state -->
      <div v-if="!groupsStore.loading && groupsStore.joinedGroups.length === 0 && groupsStore.availableGroups.length === 0" class="fallback-content" style="text-align: center; padding: 40px; color: #ccc;">
        <div style="font-size: 3rem; margin-bottom: 16px;">⚠️</div>
        <div style="font-size: 1.1rem; margin-bottom: 8px;">Something went wrong</div>
        <div style="font-size: 0.9rem; opacity: 0.7;">
          <button @click="handleForceRefresh" style="padding: 10px 20px; background: #007bff; color: #fff; border: none; border-radius: 4px; cursor: pointer;">
            Reload Groups
          </button>
        </div>
      </div>
    </div>

    <!-- Chatbox section for large screens -->
  </div>
</template>

<script>
import { useGroupsStore } from './stores/grouplist' // Adjust path as needed

export default {
  name: 'GroupsList',
  
  setup() {
    const groupsStore = useGroupsStore()
    return { groupsStore }
  },

  async mounted() {
    await this.initializeComponent()
  },

  methods: {
    async initializeComponent() {
      try {
        const success = await this.groupsStore.initializeStore()
        if (!success) {
          this.showWarning('Please log in to view groups')
        }
      } catch (error) {
        this.showWarning(`Failed to load groups: ${error.message}`)
      }
    },

    async handleJoinGroup(group) {
      try {
        const result = await this.groupsStore.joinGroup(group)
        
        if (result.success) {
          if (result.requiresApproval) {
            this.showSuccess(`Join request sent for ${result.groupName}!`)
          } else {
            this.showSuccess(`Successfully joined ${result.groupName}!`)
          }
        }
      } catch (error) {
        this.showWarning(error.message)
      }
    },

    async handleCancelRequest(group) {
      try {
        const result = await this.groupsStore.cancelJoinRequest(group)
        
        if (result.success) {
          this.showSuccess(`Join request cancelled for ${result.groupName}`)
        }
      } catch (error) {
        this.showWarning(error.message)
      }
    },

    goToChatbox(group) {
      if (!group.isMember) {
        alert('Join the group first')
        return
      }

      this.$router.push({
        name: 'GroupChatbox',
        params: {
          groupId: String(group.id),
          groupName: group.name
        }
      })
    },

    async handleForceRefresh() {
      try {
        await this.groupsStore.forceRefresh()
        this.showSuccess('Groups refreshed successfully!')
      } catch (error) {
        this.showWarning(`Failed to refresh groups: ${error.message}`)
      }
    },

    // Notification methods - you can customize these based on your notification system
    showSuccess(message) {
      // Replace with your preferred notification method
      // Examples: toast, alert, notification library
      console.log('Success:', message)
      // this.$toast.success(message)
      // this.$notify({ type: 'success', message })
    },

    showWarning(message) {
      // Replace with your preferred notification method
      console.warn('Warning:', message)
      // this.$toast.warning(message)
      // this.$notify({ type: 'warning', message })
    }
  }
}
</script>

<style src="./Chatbox.css"></style>
<style scoped>
.group-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(0,0,0,0.2);
}

.joined-group:hover {
  box-shadow: 0 4px 16px rgba(102, 126, 234, 0.4);
}

.join-button:hover:not(:disabled) {
  background: #45a049;
  transform: scale(1.05);
}

.join-button:disabled {
  cursor: not-allowed;
}

.groups-section {
  margin-bottom: 30px;
}

.groups-section h3 {
  border-bottom: 2px solid rgba(255,255,255,0.1);
  padding-bottom: 8px;
}
</style>



