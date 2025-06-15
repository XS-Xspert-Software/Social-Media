<template>
  <section class="viewer-section">
    <h2>Decentralized Viewer</h2>
    <form @submit.prevent="fetchRemoteContent">
      <label for="remote-url" style="display: block; margin-bottom: 8px;">Remote Server Feed URL:</label>
      <input id="remote-url" v-model="remoteUrl" placeholder="Enter remote server feed URL (e.g. https://example.com/api/feed-json/)" style="width: 80%" />
      <button type="submit">View</button>
    </form>
    <div v-if="loading">Loading...</div>
    <div v-if="error" class="error">{{ error }}</div>
    <div v-if="content">
      <pre style="white-space: pre-wrap; word-break: break-all; background: #222; color: #fff; padding: 1em; border-radius: 8px;">{{ content }}</pre>
    </div>
  </section>
</template>

<script>
export default {
  name: 'Viewer',
  data() {
    return {
      remoteUrl: '',
      loading: false,
      error: '',
      content: ''
    }
  },
  methods: {
    async fetchRemoteContent() {
      if (!this.remoteUrl) {
        this.error = 'Please enter a remote URL.';
        return;
      }
      this.loading = true;
      this.error = '';
      this.content = '';
      try {
        const res = await fetch(`/viewer?url=${encodeURIComponent(this.remoteUrl)}`);
        const contentType = res.headers.get('content-type') || '';
        if (contentType.includes('application/json')) {
          const data = await res.json();
          // If the backend returned an error, show it
          if (data.error) {
            this.error = data.error;
            this.content = '';
            return;
          }
          this.content = JSON.stringify(data, null, 2);
        } else if (contentType.includes('text/plain')) {
          this.content = await res.text();
        } else if (contentType.includes('text/html')) {
          this.error = 'Remote server returned HTML, not API data. Check the URL.';
          this.content = '';
        } else {
          this.content = await res.text();
        }
      } catch (e) {
        this.error = e.message;
      } finally {
        this.loading = false;
      }
    }
  }
}
</script>

<style scoped>
.viewer-section {
  max-width: 700px;
  margin: 40px auto;
  padding: 24px;
  background: #18181b;
  border-radius: 12px;
  color: #fff;
}
input {
  padding: 8px;
  border-radius: 4px;
  border: 1px solid #444;
  margin-right: 8px;
}
button {
  padding: 8px 16px;
  border-radius: 4px;
  background: #5eead4;
  color: #222;
  border: none;
  font-weight: 600;
  cursor: pointer;
}
.error {
  color: #f87171;
  margin-top: 12px;
}
</style>
