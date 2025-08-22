import { defineStore } from 'pinia'

export const useFriendsStore = defineStore('friends', {
  state: () => ({
    friends: [],
    loading: false,
    error: null,
    lastFetched: null,
    currentUsername: null
  }),

  getters: {
    friendsCount: (state) => state.friends.length,
    
    getFriendByUsername: (state) => (username) => {
      return state.friends.find(friend => friend.username === username)
    },
    
    getFriendById: (state) => (id) => {
      return state.friends.find(friend => friend.id === id)
    },

  },

  actions: {
    async fetchFriends(username, forceRefresh = false) {
      // Don't fetch if we have recent data for the same user and not forcing refresh
      if (!forceRefresh && 
          this.currentUsername === username && 
          !this.needsRefresh && 
          this.friends.length > 0) {
        return this.friends
      }

      this.loading = true
      this.error = null

      try {
        const response = await fetch(`https://burger-eta-eight.vercel.app/api/friends?username=${encodeURIComponent(username)}`, {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json'
          }
        })

        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`)
        }

        const data = await response.json()
        
        this.friends = data.friends || []
        this.currentUsername = username
        this.lastFetched = Date.now()
        this.error = null

        return this.friends

      } catch (error) {
        console.error('Error fetching friends:', error)
        this.error = error.message
        throw error
      } finally {
        this.loading = false
      }
    },

  }
})
