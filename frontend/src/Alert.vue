<template>
  <div :class="['Alert', { 'error-Alert': isError, 'show-Alert': show }]">
    <p>{{ message }}</p>
  </div>
</template>

<script setup>
import { ref } from 'vue'

const message = ref('')
const show = ref(false)
const isError = ref(false)

function showAlert(msg, error = false) {
  message.value = msg
  isError.value = error
  show.value = true
  setTimeout(() => {
    show.value = false
  }, 2500)
}

defineExpose({ showAlert }) 
</script>
