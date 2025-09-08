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
      return 'You are in guest mode. Log in to chat, post, and receive notifications.'
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
  gap: 12px;
  background: #0b1020;
  color: #e8eefc;
  border: 1px solid #1b2a55;
  border-radius: 10px;
  padding: 10px 12px;
  margin: 8px 12px;
  box-shadow: 0 2px 8px rgba(0,0,0,0.25);
}
.login-prompt__content { display: flex; align-items: center; gap: 10px; }
.login-prompt__text { font-size: 14px; line-height: 1.3; }
.login-prompt__button {
  background: linear-gradient(180deg, #2563eb, #1d4ed8);
  color: white;
  border: none;
  border-radius: 8px;
  padding: 8px 12px;
  font-size: 14px;
  text-decoration: none;
  cursor: pointer;
  white-space: nowrap;
}
.login-prompt__button:active { transform: translateY(1px); }

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
