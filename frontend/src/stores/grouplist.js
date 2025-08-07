import { defineStore } from 'pinia'

export const useGroupsStore = defineStore('groups', {
  state: () => ({
    loading: false,
    error: null,
    joinedGroups: [],
    availableGroups: [],
    joiningGroupId: null,
    cancellingRequestId: null
  }),

  getters: {
    loggedInUserId: (state) => {
      return localStorage.getItem('userId')?.trim() || null
    },
    
    loggedInUsername: (state) => {
      return localStorage.getItem('username')?.trim() || null
    },

    isUserLoggedIn: (state) => {
      return !!state.loggedInUserId
    },

    totalJoinedGroups: (state) => state.joinedGroups.length,
    totalAvailableGroups: (state) => state.availableGroups.length,
    
    pendingRequests: (state) => {
      return state.availableGroups.filter(group => group.hasPendingRequest)
    }
  },

  actions: {
    async initializeStore() {
      if (!this.loggedInUserId) {
        this.error = 'Please log in to view groups'
        return false
      }
      await this.fetchGroups()
      return true
    },

    async apiRequest(url, options = {}) {
      const headers = {
        'Content-Type': 'application/json',
        'X-User-ID': this.loggedInUserId,
        ...options.headers
      }

      const response = await fetch(url, {
        headers,
        credentials: 'include',
        ...options
      })

      const text = await response.text()

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${text}`)
      }

      const data = JSON.parse(text)
      if (!data.success) {
        throw new Error(data.error || 'Request failed')
      }

      return data
    },

    async fetchGroups() {
      this.loading = true
      this.error = null

      try {
        const url = `https://yupitis.vercel.app/api/groups?userId=${this.loggedInUserId}`
        const response = await this.apiRequest(url)

        this.joinedGroups = (response.joinedGroups || []).map(group => ({
          ...group,
          isPrivate: !!group.isPrivate,
          isMember: true,
          membershipStatus: 'active'
        }))

        this.availableGroups = (response.availableGroups || []).map(group => {
          const pendingRequest = response.pendingRequests?.find(r => r.groupId === group.id)
          return {
            ...group,
            isPrivate: !!group.isPrivate,
            hasPendingRequest: !!pendingRequest,
            membershipStatus: pendingRequest ? 'pending' : 'not_member',
            canCancelRequest: false,
            requestId: pendingRequest?.id,
            isMember: false
          }
        })
      } catch (error) {
        this.error = error.message
        // Note: showWarning method should be handled in component
        throw error
      } finally {
        this.loading = false
      }
    },

    async joinGroup(group) {
      if (!this.loggedInUserId || group.membershipStatus === 'pending') {
        return false
      }

      this.joiningGroupId = group.id

      try {
        const url = `https://yupitis.vercel.app/api/join?groupId=${group.id}`

        const response = await this.apiRequest(url, {
          method: 'POST',
          body: JSON.stringify({
            userId: this.loggedInUserId,
            username: this.loggedInUsername
          })
        })

        const index = this.availableGroups.findIndex(g => g.id === group.id)
        if (index === -1) return false

        if (response.requiresApproval) {
          this.availableGroups[index] = {
            ...this.availableGroups[index],
            hasPendingRequest: true,
            membershipStatus: 'pending',
            canCancelRequest: false
          }
          return { success: true, requiresApproval: true, groupName: group.name }
        } else {
          const joinedGroup = {
            ...this.availableGroups[index],
            isMember: true,
            membershipStatus: 'active'
          }
          this.availableGroups.splice(index, 1)
          this.joinedGroups.unshift(joinedGroup)
          return { success: true, requiresApproval: false, groupName: group.name }
        }
      } catch (error) {
        throw error
      } finally {
        this.joiningGroupId = null
      }
    },

    async refreshGroups() {
      await this.fetchGroups()
    },

    // Additional helper actions
    clearError() {
      this.error = null
    },

    getGroupById(groupId) {
      return this.joinedGroups.find(group => group.id === groupId) ||
             this.availableGroups.find(group => group.id === groupId)
    },

    isGroupMember(groupId) {
      return this.joinedGroups.some(group => group.id === groupId)
    },

    canJoinGroup(group) {
      return this.loggedInUserId && 
             group.membershipStatus !== 'pending' && 
             !group.isMember &&
             this.joiningGroupId !== group.id
    },

    async cancelJoinRequest(group) {
      if (!this.loggedInUserId || !group.hasPendingRequest) {
        return false
      }

      this.cancellingRequestId = group.id

      try {
        const url = `https://yupitis.vercel.app/api/cancel-request?groupId=${group.id}`
        
        const response = await this.apiRequest(url, {
          method: 'POST',
          body: JSON.stringify({
            userId: this.loggedInUserId,
            requestId: group.requestId
          })
        })

        const index = this.availableGroups.findIndex(g => g.id === group.id)
        if (index !== -1) {
          this.availableGroups[index] = {
            ...this.availableGroups[index],
            hasPendingRequest: false,
            membershipStatus: 'not_member',
            canCancelRequest: false,
            requestId: null
          }
        }

        return { success: true, groupName: group.name }
      } catch (error) {
        throw error
      } finally {
        this.cancellingRequestId = null
      }
    },

    // Force refresh method
    async forceRefresh() {
      this.clearError()
      await this.fetchGroups()
    }
  }
})
