<template>
  <div class="welcome-banner" role="note" aria-live="polite">
    <div class="welcome-content">
      <h2 class="welcome-title">Welcome to {{ titleName }}</h2>
      <p class="welcome-text">
        <span v-if="isProd">
          This is the public experimental instance of Endless. Accounts and content here are part of the shared demo environment.
        </span>
        <span v-else>
          Endless is the original public experiment that inspired this project. This build is self-hosted (Sync) and runs independently on your server.
        </span>
      </p>
      <button class="btn btn-primary" @click="$emit('dismiss')">Got it</button>
    </div>
  </div>
</template>

<script>
export default {
  name: 'WelcomeBanner',
  computed: {
    isProd() {
      return (import.meta?.env?.VITE_DEPLOYMENT || '').toLowerCase() === 'prod';
    },
    instanceName() {
      return import.meta?.env?.VITE_INSTANCE_NAME || (this.isProd ? 'Endless' : 'Sync');
    },
    titleName() {
      return this.instanceName;
    },
  },
};
</script>

<style scoped>
.welcome-banner {
  margin: 80px auto 10px;
  max-width: 880px;
  background: var(--color-surface);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-lg);
  box-shadow: var(--shadow-sm);
}
.welcome-content {
  padding: 18px 20px;
  display: flex;
  flex-direction: column;
  gap: 12px;
}
.welcome-title {
  font-size: 1.1rem;
  color: var(--color-text);
}
.welcome-text {
  color: rgba(255,255,255,0.85);
}
:root:not([data-theme="dark"]) .welcome-text {
  color: #1f2937;
}
</style>