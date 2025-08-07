import { defineStore } from 'pinia';

export const useUserStore = defineStore('userStore', {
  state: () => ({
    users: [],
    loading: false,
    error: null,
    fetched: false,
    lastFetchedAt: null,
  }),

  getters: {
    loggedInUserId: (state) => {
      return localStorage.getItem('userId')?.trim() || null;
    },

    loggedInUsername: (state) => {
      return localStorage.getItem('username')?.trim() || null;
    },

    isUserLoggedIn: (state) => {
      return !!state.loggedInUserId;
    },
  },

  actions: {
    async initializeStore() {
      if (!this.loggedInUserId) {
        this.error = 'Please log in to view users';
        return false;
      }
      await this.fetchUsers();
      return true;
    },

    async fetchUsers(forceRefresh = false) {
      // Allow refresh to bypass the fetched check, but still prevent concurrent requests
      if (!forceRefresh && (this.fetched || this.loading)) return;
      if (this.loading) return; // Prevent concurrent requests

      this.loading = true;
      this.error = null;

      try {
        // Skip cache if forcing refresh
        if (!forceRefresh) {
          const cachedUsers = localStorage.getItem('cachedUsers');
          const cachedTimestamp = localStorage.getItem('cachedUsersTimestamp');

          const now = Date.now();
          const maxAge = 5 * 60 * 1000; // 5 minutes

          if (cachedUsers && cachedTimestamp && now - parseInt(cachedTimestamp) < maxAge) {
            const parsedUsers = JSON.parse(cachedUsers);

            // Sync lastMessage from localStorage (as it's stored separately)
            parsedUsers.forEach(user => {
              user.lastMessage = localStorage.getItem(`lastMessage-${user.id}`) || '';
            });

            this.users = parsedUsers;
            this.fetched = true;
            this.lastFetchedAt = parseInt(cachedTimestamp);
            return;
          }
        }

        // Fetch fresh data
        const response = await fetch('https://1999-theta.vercel.app/api/UserListChat', {
          headers: { 'Content-Type': 'application/json' },
        });

        if (!response.ok) throw new Error('Failed to fetch users');

        const users = await response.json();
        const seenUsernames = new Set();

        const uniqueUsers = users.filter(user => {
          if (seenUsernames.has(user.username)) return false;
          seenUsernames.add(user.username);

          const lastMessage = localStorage.getItem(`lastMessage-${user.id}`) || '';
          user.lastMessage = lastMessage;
          return true;
        });

        this.users = uniqueUsers;
        this.fetched = true;
        this.lastFetchedAt = Date.now();

        // Cache in localStorage
        localStorage.setItem('cachedUsers', JSON.stringify(uniqueUsers));
        localStorage.setItem('cachedUsersTimestamp', String(Date.now()));

      } catch (error) {
        console.error('User fetch error:', error);
        this.error = 'Failed to load users';
        throw error;
      } finally {
        this.loading = false;
      }
    },

    clearUsers() {
      this.users = [];
      this.fetched = false;
      this.lastFetchedAt = null;
      localStorage.removeItem('cachedUsers');
      localStorage.removeItem('cachedUsersTimestamp');
    },

    clearError() {
      this.error = null;
    },

    async forceRefresh() {
      try {
        this.clearError();
        await this.fetchUsers(true); // Pass true to bypass cache
        return true;
      } catch (error) {
        console.error('Force refresh failed:', error);
        return false;
      }
    }
  },
});
