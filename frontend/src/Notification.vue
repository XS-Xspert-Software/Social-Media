<template>
  <div v-if="visible" class="notification card">
    <div :class="['notification', isError ? 'error' : 'success']">
      {{ message }}
    </div>
  </div>
</template>

<script>
export default {
  name: 'Notification',
  data() {
    return {
      visible: false,
      message: '',
      isError: false,
      timeoutId: null
    }
  },
  methods: {
    showNotification(message, isError = false) {
      this.message = message
      this.isError = isError
      this.visible = true
      clearTimeout(this.timeoutId)
      this.timeoutId = setTimeout(() => {
        this.visible = false
      }, 3000)
    }
  }
}
</script>

<style scoped>
.notification {
  position: fixed;
  bottom: 32px;
  left: 50%;
  transform: translateX(-50%);
  background: #222;
  color: #fff;
  padding: 12px 32px;
  border-radius: 8px;
  font-size: 16px;
  z-index: 9999;
  box-shadow: 0 2px 8px rgba(0,0,0,0.2);
  opacity: 0.95;
  transition: background 0.2s;
}
.notification.success {
  background: #4caf50;
}
.notification.error {
  background: #e53935;
}
.notification.card {
  max-width: 400px;
  margin: 20px auto 0 auto;
  padding: 18px 18px 14px 18px;
  border-radius: 18px;
  box-shadow: 0 8px 32px 0 rgba(31, 38, 135, 0.28);
  border: 2px solid #fff8;
  color: #fff;
  backdrop-filter: blur(32px) saturate(1.8);
  -webkit-backdrop-filter: blur(32px) saturate(1.8);
}
</style>
