<template>
  <div v-if="visible" class="global-loading-spinner">
    <div class="loading-content">
      <div class="logo-section">
        <svg viewBox="0 0 64 64" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linejoin="round" stroke-linecap="round" xmlns="http://www.w3.org/2000/svg" class="sync-logo">
          <path d="M32 2 L38 26 L62 32 L38 38 L32 62 L26 38 L2 32 L26 26 Z"/>
          <path d="M32 12 L36 28 L52 32 L36 36 L32 52 L28 36 L12 32 L28 28 Z"/>
          <line x1="32" y1="2" x2="32" y2="62"/>
          <line x1="2" y1="32" x2="62" y2="32"/>
        </svg>
      </div>
      <h1 class="loading-title">Sync</h1>
      <div class="spinner"></div>
      <p class="loading-text">Starting your social experience...</p>
    </div>
  </div>
</template>

<script>
export default {
  name: 'LoadingSpinner',
  data() {
    return { visible: false }
  },
  methods: {
    show() { this.visible = true },
    hide() { this.visible = false }
  }
}
</script>

<style scoped>
.global-loading-spinner {
  position: fixed;
  top: 0; left: 0; right: 0; bottom: 0;
  background: linear-gradient(135deg, rgba(0,0,0,0.95), rgba(20,20,40,0.95));
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 10000;
  backdrop-filter: blur(8px);
}
.loading-content {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 24px;
  padding: 40px;
  border-radius: 24px;
  background: rgba(255,255,255,0.06);
  border: 1px solid rgba(255,255,255,0.12);
  box-shadow: 0 8px 32px rgba(0,0,0,0.3);
  backdrop-filter: blur(24px);
  -webkit-backdrop-filter: blur(24px);
}
.logo-section {
  perspective: 1000px;
}
.sync-logo {
  width: 56px;
  height: 56px;
  color: #22d3ee;
  filter: drop-shadow(0 0 8px rgba(34,211,238,0.4));
  animation: spin-logo 3s linear infinite;
}
.loading-title {
  font-size: 24px;
  font-weight: 600;
  color: #fff;
  margin: 0;
  letter-spacing: 1px;
}
.spinner {
  border: 6px solid #f3f3f3;
  border-top: 6px solid #22d3ee;
  border-right: 6px solid #f59e0b;
  border-radius: 50%;
  width: 48px;
  height: 48px;
  animation: spin 1s linear infinite;
}
.loading-text {
  font-size: 12px;
  color: rgba(255,255,255,0.6);
  margin: 0;
  letter-spacing: 0.5px;
}
@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}
@keyframes spin-logo {
  0% { transform: rotateZ(0deg); }
  100% { transform: rotateZ(360deg); }
}
</style>
