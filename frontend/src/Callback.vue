<template>
  <div class="callback-wrapper" aria-busy="true" aria-live="polite">
    <div class="spinner" />
    <p>Signing you in…</p>
  </div>
</template>

<script setup>
import { onMounted } from 'vue';
import { useRouter } from 'vue-router';
import { useAuth0 } from '@auth0/auth0-vue';

const router = useRouter();
const { handleRedirectCallback, isAuthenticated } = useAuth0();

onMounted(async () => {
  let target = '/';
  try {
    const result = await handleRedirectCallback();
    target = result?.appState?.target || '/';
  } catch (_) {
    // ignore; SDK may already handle this internally
  } finally {
    router.replace(isAuthenticated.value ? String(target) : '/');
  }
});
</script>

<style scoped>
.callback-wrapper { display:flex; flex-direction:column; gap:12px; align-items:center; justify-content:center; height: 70vh; color:#fff; }
.spinner { width:32px; height:32px; border-radius:50%; border:3px solid rgba(255,255,255,.2); border-top-color:#fff; animation:spin 1s linear infinite; }
@keyframes spin { to { transform: rotate(360deg); } }
</style>
