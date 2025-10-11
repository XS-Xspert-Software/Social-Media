<template>
  <!-- Lightweight login prompt banner; reusable across pages -->
  <div class="login-prompt" role="status" aria-live="polite">
    <div class="login-prompt__content">
      <i class="fas fa-lock" aria-hidden="true"></i>
      <span class="login-prompt__text">
        {{ message || defaultMessage }}
      </span>
    </div>
    <div class="login-prompt__actions">
      <button
        type="button"
        class="login-prompt__button"
        @click="$emit('login')"
      >
        {{ ctaLabel || 'Login' }}
      </button>
    </div>
  </div>
  
  <!-- Optional compact inline variant -->
  <div v-if="inline" class="login-inline" role="note">
    <i class="fas fa-info-circle" aria-hidden="true"></i>
    <span>{{ message || defaultMessage }}</span>
  <button class="login-inline__link" @click="$emit('login')">{{ ctaLabel || 'Login' }}</button>
  </div>
</template>

<script>
export default {
  name: 'LoginPrompt',
  props: {
    message: { type: String, default: '' },
    ctaLabel: { type: String, default: 'Login' },
  href: { type: String, default: '' }, // kept for backwards-compat, not used now
    inline: { type: Boolean, default: false },
  },
  computed: {
    defaultMessage() {
      // Human-like copy: short and clear for slow/older devices
  return 'Log in to chat, post, and get notifications.'
    }
  }
}
</script>

<style scoped>
/* Sticky but lightweight banner. Keeps UI responsive on low-end devices. */
.login-prompt {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 18px;
  background: linear-gradient(90deg, #10192b 80%, #1e293b 100%);
  color: #e8eefc;
  border: 1.5px solid #223366;
  border-radius: 16px;
  padding: 10px 22px 10px 18px;
  margin: 80px auto 10px auto;
  min-height: 36px;
  max-width: 420px;
  width: 100%;
  box-shadow: 0 4px 18px 0 rgba(0,0,0,0.18), 0 1.5px 4px 0 rgba(30,40,60,0.10);
  font-size: 15px;
  font-weight: 500;
  transition: box-shadow 0.2s, background 0.2s;
}
.login-prompt__content {
  display: flex;
  align-items: center;
  gap: 12px;
  min-width: 0;
}
.login-prompt__text {
  font-size: 15px;
  line-height: 1.3;
  color: #e8eefc;
  white-space: normal;
  overflow-wrap: anywhere;
  max-width: 100vw;
}
.login-prompt__button {
  background: linear-gradient(180deg, #2563eb 60%, #1d4ed8 100%);
  color: #fff;
  border: none;
  border-radius: 10px;
  padding: 7px 20px 7px 20px;
  font-size: 15px;
  font-weight: 600;
  box-shadow: 0 2px 8px rgba(37,99,235,0.10);
  text-decoration: none;
  cursor: pointer;
  white-space: nowrap;
  transition: background 0.18s, box-shadow 0.18s;
}
.login-prompt__button:active {
  transform: translateY(1.5px) scale(0.98);
  background: linear-gradient(180deg, #1d4ed8 80%, #2563eb 100%);
}

/* Inline variant for embedding within empty states */
.login-inline { display: flex; align-items: center; gap: 8px; color: #dbeafe; }
.login-inline__link {
  margin-left: 6px;
  color: #93c5fd;
  background: none;
  border: none;
  padding: 0;
  cursor: pointer;
  text-decoration: underline;
}

@media (prefers-reduced-motion: reduce) {
  .login-prompt__button { transition: none; }
}
</style>
