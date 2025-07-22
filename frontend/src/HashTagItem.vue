<template>
  <div class="hashtag-item">
    <h3>#{{ hashtag.hashtag }}</h3>
    <p>Trending Score: {{ hashtag.trending_score }}</p>
    <p>Used by {{ hashtag.unique_user_count }} users</p>
    <p>Total mentions: {{ hashtag.count }}</p>
    <div class="recent-posts">
      <strong>Recent Posts</strong>
      <ul>
        <li v-for="post in hashtag.recent_posts" :key="post.post_id">
          <span><b>{{ post.username }}</b></span>
          <small> — {{ formatTime(post.created_at) }}</small>
        </li>
      </ul>
    </div>
  </div>
</template>

<script>
export default {
  props: {
    hashtag: Object,
  },
  methods: {
    formatTime(timestamp) {
      return new Date(timestamp).toLocaleString();
    }
  }
};
</script>

<style scoped>
.hashtag-item {
  background: #1e1e1e;
  padding: 1em;
  border-radius: 10px;
  margin-bottom: 1em;
  color: white;
}
.recent-posts ul {
  padding-left: 1em;
}
</style>

