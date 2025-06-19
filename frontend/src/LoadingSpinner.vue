<template>
  <div v-if="visible" class="loading-spinner card">
    <div class="spinner"></div>
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
.loading-spinner.card {
  max-width: 120px;
  margin: 60px auto 0 auto;
  padding: 32px 28px 24px 28px;
  border-radius: 22px;
  box-shadow: 0 8px 32px 0 rgba(31, 38, 135, 0.28);
  border: 2px solid #fff8;
  color: #fff;
  backdrop-filter: blur(32px) saturate(1.8);
  -webkit-backdrop-filter: blur(32px) saturate(1.8);
}
.global-loading-spinner {
  position: fixed;
  top: 0; left: 0; right: 0; bottom: 0;
  background: rgba(0,0,0,0.25);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 10000;
}
.spinner {
  border: 6px solid #f1d1ac;
  border-top: 6px solid #0019f7;
  border-radius: 50%;
  width: 48px;
  height: 48px;
  animation: spin 1s linear infinite;
}
@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}
</style>
