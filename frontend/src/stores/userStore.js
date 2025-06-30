import { defineStore } from 'pinia';

export const useUserStore = defineStore('userStore', {
  state: () => ({
    users: [],
    loading: false,
    warningMessage: '',
    fetched: false, // ✅ prevents re-fetching
  }),
  actions: {
    async fetchUsers() {
      if (this.fetched || this.loading) return;

      this.loading = true;
      try {
        const response = await fetch('https://1999-theta.vercel.app/api/UserListChat', {
          headers: { 'Content-Type': 'application/json' },
        });

        if (!response.ok) throw new Error('Failed to fetch users');

        const users = await response.json();
        const seenUsernames = new Set();

        this.users = users.filter(user => {
          if (seenUsernames.has(user.username)) return false;
          seenUsernames.add(user.username);

          const lastMessage = localStorage.getItem(`lastMessage-${user.id}`) || '';
          user.lastMessage = lastMessage;
          return true;
        });

        this.fetched = true;
      } catch (error) {
        console.error('User fetch error:', error);
        this.warningMessage = 'Failed to load users';
      } finally {
        this.loading = false;
      }
    },
    clearUsers() {
      this.users = [];
      this.fetched = false;
    },
  },
});
