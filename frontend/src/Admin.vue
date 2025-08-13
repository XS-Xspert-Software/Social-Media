<template>
  <section class="admin-page">
    <div class="admin-card">
      <h1>Admin</h1>
      <p class="hint">Enter the access code to continue.</p>

      <form @submit.prevent="handleSubmit" class="code-form">
        <input
          v-model.trim="code"
          class="code-input"
          :type="show ? 'text' : 'password'"
          inputmode="text"
          autocomplete="one-time-code"
          placeholder="Enter code"
          aria-label="Admin access code"
          maxlength="32"
        />
        <button class="btn" type="submit" :disabled="loading || !code">
          {{ loading ? 'Checking…' : 'Enter' }}
        </button>
        <button type="button" class="btn ghost" @click="show = !show">{{ show ? 'Hide' : 'Show' }}</button>
      </form>

      <p v-if="error" class="error">{{ error }}</p>

      <div v-if="granted" class="panel">
        <h2>Welcome, Admin</h2>
        <ul class="quick-links">
          <li><router-link to="/">Feed</router-link></li>
          <li><router-link to="/videos">Videos</router-link></li>
          <li><router-link to="/settings">Settings</router-link></li>
        </ul>
      </div>
    </div>
  </section>
</template>

<script>
import { nodeAPI } from './config/api';
export default {
  name: 'AdminPage',
  data() {
    return {
      code: '',
      loading: false,
      error: '',
      granted: false,
      show: false,
    };
  },
  mounted() {
    const cached = sessionStorage.getItem('admin-granted');
    if (cached === '1') this.granted = true;
  },
  methods: {
    async handleSubmit() {
      this.error = '';
      this.loading = true;
      try {
        const res = await nodeAPI.request('/api/admin/verify', {
          method: 'POST',
          body: JSON.stringify({ code: this.code })
        });
        if (res?.ok) {
          this.granted = true;
          sessionStorage.setItem('admin-granted', '1');
        } else {
          this.error = 'Invalid code';
        }
      } catch (e) {
        this.error = e?.message || 'Failed to verify code';
      } finally {
        this.loading = false;
      }
    },
  },
};
</script>

<style scoped>
.admin-page {
  display: grid;
  place-items: center;
  min-height: calc(100vh - var(--app-header-height, 64px));
  padding: 72px 16px 24px;
}
.admin-card {
  width: min(560px, 92vw);
  background: var(--gradient-panel);
  border: 1px solid var(--color-border-soft);
  border-radius: var(--radius-lg);
  box-shadow: var(--shadow-soft);
  padding: 20px 18px;
}
.admin-card h1 {
  font-size: 1.25rem;
  margin-bottom: 6px;
}
.hint { color: var(--color-text-secondary); margin-bottom: 14px; }
.code-form { display: flex; gap: 8px; align-items: center; flex-wrap: wrap; }
.code-input {
  flex: 1 1 260px;
  padding: 10px 12px;
  border-radius: var(--radius-md);
  border: 1px solid var(--color-border-soft);
  background: #0f1115;
  color: #fff;
}
.btn { padding: 10px 14px; border-radius: var(--radius-md); cursor: pointer; }
.btn.ghost { background: transparent; border: 1px solid var(--color-border-soft); color: var(--color-text-secondary); }
.error { color: #f87171; margin-top: 8px; }
.panel { margin-top: 18px; padding: 12px; border: 1px solid var(--color-border-soft); border-radius: var(--radius-md); }
.quick-links { display: flex; gap: 12px; flex-wrap: wrap; }
.quick-links a { color: #9bd1ff; text-decoration: none; }
.quick-links a:hover { text-decoration: underline; }
</style>
