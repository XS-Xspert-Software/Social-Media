// Message to who ever is maintaning this file: change the api servers; those are official if you are the client
<template>
  <aside class="right-sidebar-wrapper">
    <div class="panel-section gradient-soft outline-accent">
      <h3 class="panel-title">Quick Stats</h3>
      <ul class="stat-list">
        <li v-for="s in stats" :key="s.label">
          <span class="label">{{ s.label }}</span>
          <span class="value">{{ s.value }}</span>
        </li>
      </ul>
    </div>
    <div class="panel-section gradient-soft" v-if="suggested.length">
      <h3 class="panel-title">Suggested</h3>
      <ul class="suggest-list">
        <li v-for="u in suggested" :key="u.username" class="suggest-item">
          <img :src="u.avatar" :alt="u.username" class="avatar" @error="e=>e.target.src=defaultAvatar" />
          <div class="info">
            <strong>{{ u.username }}</strong>
            <small>{{ u.tagline }}</small>
          </div>
          <button class="follow-btn" @click="follow(u)">Follow</button>
        </li>
      </ul>
    </div>
    <div class="panel-section gradient-soft" v-if="shorts.length">
      <h3 class="panel-title">Shorts of the Day</h3>
      <ul class="stat-list">
        <li v-for="s in shorts" :key="s.id" style="display:flex;align-items:center;gap:8px;min-height:38px;">
          <video v-if="s.videoUrl" :src="s.videoUrl" style="width:28px;height:28px;border-radius:6px;object-fit:cover;" muted playsinline preload="metadata" />
          <div style="flex:1;overflow:hidden;">
            <strong style="font-size:0.72rem;color:#fff;">{{ s.userId }}</strong>
            <div style="font-size:0.68rem;color:#bbb;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;max-width:120px;">{{ s.title || s.description || '' }}</div>
          </div>
        </li>
      </ul>
    </div>
    <div class="panel-section gradient-soft" v-if="postsOfDay.length">
      <h3 class="panel-title">Posts of the Day</h3>
      <ul class="stat-list">
        <li v-for="p in postsOfDay" :key="p._id" style="display:flex;align-items:center;gap:8px;min-height:38px;">
          <img v-if="p.photo" :src="p.photo" alt="post" style="width:28px;height:28px;border-radius:6px;object-fit:cover;" />
          <div style="flex:1;overflow:hidden;">
            <strong style="font-size:0.72rem;color:#fff;">{{ p.username }}</strong>
            <div style="font-size:0.68rem;color:#bbb;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;max-width:120px;">{{ p.message.slice(0, 48) }}<span v-if="p.message.length>48">…</span></div>
          </div>
        </li>
      </ul>
    </div>
  </aside>
</template>
<script setup>
import { ref, onMounted } from 'vue';
const defaultAvatar = 'https://latestnewsandaffairs.site/public/pfp.jpg';
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
    const shortsRes = await fetch('https://chyna.vercel.app/api/shorts');
    const shortsData = await shortsRes.json();
    if (shortsData.success && Array.isArray(shortsData.shorts)) {
      // Shuffle and take 3
      shorts.value = shortsData.shorts.sort(() => Math.random() - 0.5).slice(0, 3);
    }
  } catch {}
  // Fetch random posts of the day
  try {
    const postsRes = await fetch('/api/posts');
    const postsData = await postsRes.json();
    if (Array.isArray(postsData.posts)) {
      // Shuffle and take 3
      postsOfDay.value = postsData.posts.sort(() => Math.random() - 0.5).slice(0, 3);
    }
  } catch {}
});
</script>
<style scoped>
/* Improved responsive + non cut-off layout */
.right-sidebar-wrapper {
  /* prevent stretching */
  flex: 0 0 auto;
  width: 100%;
  max-width: 240px; /* keep narrow so feed has room */
  padding: 0 4px 24px;
  box-sizing: border-box;
  display: flex;
  flex-direction: column;
  gap: 22px;
  position: sticky; /* stay visible while scrolling feed */
  top: 72px; /* sits below fixed header */
  align-self: flex-start; /* avoid full height stretch */
}

/* Allow panels to shrink gracefully */
.panel-section {
  padding: 12px 14px;
  border: 1px solid rgba(255,255,255,0.05);
  border-radius: 14px;
  background: linear-gradient(155deg,#121a23,#19232e 60%,#1d2833);
  backdrop-filter: blur(6px);
  -webkit-backdrop-filter: blur(6px);
  box-shadow: 0 2px 10px -3px rgba(0,0,0,0.55);
  position: relative;
  overflow: hidden; /* clip shine */
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
  margin: 0 0 8px;
  font-size: 0.78rem;
  letter-spacing: .6px;
  font-weight: 600;
  color: #e6edf3;
  text-transform: uppercase;
}

.stat-list, .suggest-list { list-style: none; margin: 0; padding: 0; display: flex; flex-direction: column; gap: 4px; }
.stat-list li {
  display: flex; justify-content: space-between; align-items: center;
  font-size: 0.68rem; padding: 4px 0 3px;
  color: #98a4b1; border-bottom: 1px solid rgba(255,255,255,0.05);
}
.stat-list li:last-child { border-bottom: none; }
.label { font-weight: 500; }
.value { font-weight: 600; color: #fff; }

.suggest-item { display: flex; align-items: center; gap: 10px; padding: 6px 6px; border-radius: 10px; transition: .25s; background: linear-gradient(135deg,#18222c,#1d2833); }
.suggest-item:hover { transform: translateY(-2px); box-shadow: 0 4px 12px -4px rgba(0,0,0,.65); }
.avatar { width: 32px; height: 32px; border-radius: 50%; object-fit: cover; border: 1px solid rgba(255,255,255,0.08); }
.info { flex: 1; display: flex; flex-direction: column; line-height: 1.05; }
.info strong { font-size: 0.66rem; color: #fff; font-weight: 600; }
.info small { font-size: 0.55rem; color: #7f8a96; margin-top: 2px; }
.follow-btn {
  background: none !important;
  border: none;
  color: #fff;
  font-size: 0.58rem;
  font-weight: 600;
  padding: 5px 10px;
  border-radius: 18px;
  cursor: pointer;
  transition: .25s;
}
.follow-btn:hover { filter: brightness(1.15); }
.follow-btn:active { transform: translateY(1px); }

/* Compact heights: if viewport short, allow internal scroll without cutting off */
@media (max-height: 800px) {
  .right-sidebar-wrapper { gap: 16px; }
  .panel-section { padding: 10px 12px; }
  .stat-list li { font-size: 0.64rem; }
}
@media (max-height: 640px) {
  .right-sidebar-wrapper { top: 64px; }
  .panel-section { max-height: 260px; overflow: auto; }
}

/* Large desktop can widen slightly */
@media (min-width: 1500px) { .right-sidebar-wrapper { max-width: 270px; } }

/* Hide entirely on tablets & phones (already handled at 768px in original) */
@media (max-width: 1024px) { .right-sidebar-wrapper { top: 68px; } }
@media (max-width: 900px) { .right-sidebar-wrapper { display: none; } }
</style>
