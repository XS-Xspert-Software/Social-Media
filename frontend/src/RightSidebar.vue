// Message to who ever is maintaning this file: change the api servers; those are official if you are the client
<template>
  <aside class="right-sidebar-wrapper simple-ui">
    <div class="panel-section soft-bg outline-accent">
      <h3 class="panel-title">Quick Stats</h3>
      <ul class="stat-list">
        <li v-for="s in stats" :key="s.label">
          <span class="label">{{ s.label }}</span>
          <span class="value">{{ s.value }}</span>
        </li>
      </ul>
    </div>
    <div class="panel-section soft-bg" v-if="suggested.length">
      <h3 class="panel-title">Suggested</h3>
      <ul class="suggest-list">
        <li v-for="u in suggested" :key="u.username" class="suggest-item simple-item">
          <img :src="u.avatar" :alt="u.username" class="avatar large" @error="e=>e.target.src=defaultAvatar" />
          <div class="info">
            <strong>{{ u.username }}</strong>
            <small>{{ u.tagline }}</small>
          </div>
          <button class="follow-btn modern" @click="follow(u)">Follow</button>
        </li>
      </ul>
    </div>
    <div class="panel-section soft-bg" v-if="shorts.length">
      <h3 class="panel-title">Shorts of the Day</h3>
      <ul class="stat-list">
        <li v-for="s in shorts" :key="s.id" class="simple-item">
          <video v-if="s.videoUrl" :src="s.videoUrl" class="mini-video" muted playsinline preload="metadata" />
          <div class="mini-info">
            <strong>{{ s.userId }}</strong>
            <div class="mini-desc">{{ s.title || s.description || '' }}</div>
          </div>
        </li>
      </ul>
    </div>
    <div class="panel-section soft-bg" v-if="postsOfDay.length">
      <h3 class="panel-title">Posts of the Day</h3>
      <ul class="stat-list">
        <li v-for="p in postsOfDay" :key="p._id" class="simple-item">
          <img v-if="p.photo" :src="p.photo" alt="post" class="mini-img" />
          <div class="mini-info">
            <strong>{{ p.username }}</strong>
            <div class="mini-desc">{{ p.message.slice(0, 48) }}<span v-if="p.message.length>48">…</span></div>
          </div>
        </li>
      </ul>
    </div>
  </aside>
</template>
<script setup>
import { ref, onMounted } from 'vue';
const defaultAvatar = '/default-avatar.jpg';
const stats = ref([
  { label: 'Posts', value: 0 },
  { label: 'Followers', value: 0 },
  { label: 'Following', value: 0 }
]);
const suggested = ref([]);
const shorts = ref([]);
const postsOfDay = ref([]);
function follow(u){/* placeholder follow action */}
onMounted(async ()=>{
  // Fetch random shorts (videos)
  try {
    // Use videos API base; in dev you can set VITE_VIDEOS_API or rely on hardcoded URL
    const videosApi = import.meta?.env?.DEV ? 'https://chyna.vercel.app/api' : 'https://chyna.vercel.app/api';
    const shortsRes = await fetch(`${videosApi}/shorts`);
    const shortsData = await shortsRes.json();
    if (shortsData.success && Array.isArray(shortsData.shorts)) {
      // Shuffle and take 3
      shorts.value = shortsData.shorts.sort(() => Math.random() - 0.5).slice(0, 3);
    }
  } catch {}
  // Fetch random posts of the day (reverted to old API)
  try {
    const postsApi = import.meta?.env?.DEV ? '/oldapi/api/posts' : 'https://sports321.vercel.app/api/posts';
    const postsRes = await fetch(postsApi);
    const postsData = await postsRes.json();
    if (Array.isArray(postsData.posts)) {
      // Shuffle and take 3
      postsOfDay.value = postsData.posts.sort(() => Math.random() - 0.5).slice(0, 3);
    }
  } catch {}
});
</script>
<style scoped>
/* Simpler, more beautiful sidebar */
.right-sidebar-wrapper.simple-ui {
  flex: 0 0 auto;
  width: 100%;
  max-width: 250px;
  padding: 0 8px 28px;
  box-sizing: border-box;
  display: flex;
  flex-direction: column;
  gap: 26px;
  position: sticky;
  top: 72px;
  align-self: flex-start;
  background: none;
}

/* Allow panels to shrink gracefully */
/* Softer, lighter panel background */
.panel-section.soft-bg {
  padding: 24px 24px 18px 24px;
  border-radius: 24px;
  background: linear-gradient(135deg, rgba(34,40,60,0.45) 0%, rgba(80,120,255,0.18) 100%);
  box-shadow: 0 8px 32px 0 rgba(31, 38, 135, 0.22), 0 1.5px 4px 0 rgba(30,40,60,0.10);
  border: 2px solid rgba(255,255,255,0.25);
  position: relative;
  overflow: hidden;
  margin-bottom: 0;
  backdrop-filter: blur(32px) saturate(180%);
  -webkit-backdrop-filter: blur(32px) saturate(180%);
  transition: all 0.4s cubic-bezier(.16,1,.3,1);
  /* Glass shine overlay */
}

.panel-section.soft-bg:hover {
  transform: translateY(-2px);
  box-shadow: 0 12px 40px 0 rgba(31, 38, 135, 0.35), 0 2px 6px 0 rgba(30,40,60,0.15);
  border-color: rgba(255,255,255,0.35);
}

.panel-section.soft-bg::before {
  content: "";
  position: absolute;
  inset: 0;
  border-radius: inherit;
  pointer-events: none;
  background: linear-gradient(120deg,rgba(255,255,255,0.22) 0%,rgba(255,255,255,0.07) 100%);
  z-index: 0;
}
.panel-section.soft-bg::after {
  content: "";
  position: absolute;
  left: 20px;
  top: 10px;
  width: 50%;
  height: 20px;
  background: linear-gradient(90deg,rgba(255,255,255,0.4) 0%,rgba(255,255,255,0.05) 100%);
  border-radius: 12px;
  filter: blur(14px);
  opacity: 0.6;
  pointer-events: none;
  z-index: 1;
}

/* Subtle gradient outline on hover only */
.panel-section.outline-accent {
  border: 1px solid rgba(255,255,255,0.07);
}
.panel-section.outline-accent::after {
  content: "";
  position: absolute; inset: 0; border-radius: inherit;
  padding: 1px; opacity: 0; transition: .35s;
  background: linear-gradient(120deg,#1da1f2,#8951ff 55%,#43b581);
  -webkit-mask: linear-gradient(#000 0 0) content-box, linear-gradient(#000 0 0);
  mask: linear-gradient(#000 0 0) content-box, linear-gradient(#000 0 0);
  -webkit-mask-composite: xor; mask-composite: exclude;
  pointer-events: none;
}
.panel-section.outline-accent:hover::after { opacity: .85; }

.panel-title {
  margin: 0 0 10px;
  font-size: 0.92rem;
  letter-spacing: .5px;
  font-weight: 700;
  color: #f3f6fa;
  text-transform: none;
  letter-spacing: 0.01em;
}


.stat-list, .suggest-list {
  list-style: none;
  margin: 0;
  padding: 0;
  display: flex;
  flex-direction: column;
  gap: 8px;
}
.stat-list li, .simple-item {
  display: flex;
  align-items: center;
  gap: 12px;
  font-size: 0.92rem;
  color: #e0e6ef;
  background: none;
  border-radius: 12px;
  padding: 8px;
  border: none;
  min-height: 54px;
  height: 54px;
  transition: all 0.3s cubic-bezier(.16,1,.3,1);
}

.stat-list li:hover, .simple-item:hover {
  background: rgba(255,255,255,0.06);
  transform: translateX(4px);
}
.label { font-weight: 500; color: #b6c2d1; }
.value { font-weight: 700; color: #fff; }


.suggest-item.simple-item {
  background: none;
  box-shadow: none;
  padding: 8px 0;
  transition: background 0.18s;
}
.suggest-item.simple-item:hover {
  background: rgba(255,255,255,0.04);
}
.avatar.large {
  width: 38px;
  height: 38px;
  border-radius: 50%;
  object-fit: cover;
  border: 1.5px solid rgba(255,255,255,0.10);
}
.info {
  flex: 1;
  display: flex;
  flex-direction: column;
  line-height: 1.1;
  min-width: 0;
}
.info strong {
  font-size: 0.98em;
  color: #fff;
  font-weight: 600;
}
.info small {
  font-size: 0.82em;
  color: #b6c2d1;
  margin-top: 1px;
}
.follow-btn.modern {
  background: linear-gradient(135deg,#667eea,#764ba2);
  border: none;
  color: #fff;
  font-size: 0.92em;
  font-weight: 700;
  padding: 7px 20px;
  border-radius: 18px;
  cursor: pointer;
  box-shadow: 0 4px 12px rgba(102, 126, 234, 0.3);
  transition: all 0.3s cubic-bezier(.16,1,.3,1);
}
.follow-btn.modern:hover {
  filter: brightness(1.15);
  box-shadow: 0 6px 20px rgba(102, 126, 234, 0.5);
  transform: translateY(-2px);
}
.follow-btn.modern:active {
  filter: brightness(0.95);
  transform: translateY(0) scale(0.97);
}

/* Mini video and image for shorts/posts */
.mini-video, .mini-img {
  width: 36px;
  height: 36px;
  border-radius: 8px;
  object-fit: cover;
  background: #232b36;
  flex-shrink: 0;
}
.mini-info {
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
  gap: 1px;
}
.mini-info strong {
  font-size: 0.98em;
  color: #fff;
  font-weight: 600;
  line-height: 1.1;
}
.mini-desc {
  font-size: 0.89em;
  color: #b6c2d1;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  max-width: 140px;
}

/* Compact heights: if viewport short, allow internal scroll without cutting off */
@media (max-height: 800px) {
  .right-sidebar-wrapper.simple-ui { gap: 16px; }
  .panel-section.soft-bg { padding: 12px 10px; }
  .stat-list li, .simple-item { font-size: 0.88rem; }
}
@media (max-height: 640px) {
  .right-sidebar-wrapper.simple-ui { top: 64px; }
  .panel-section.soft-bg { max-height: 260px; overflow: auto; }
}
@media (min-width: 1500px) { .right-sidebar-wrapper.simple-ui { max-width: 280px; } }
@media (max-width: 1024px) { .right-sidebar-wrapper.simple-ui { top: 68px; } }
@media (max-width: 900px) { .right-sidebar-wrapper.simple-ui { display: none; } }
</style>
