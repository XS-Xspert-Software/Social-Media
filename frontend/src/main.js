import { createApp } from 'vue';
import App from './App.vue';
import './style.css';
import router from './router/index.js';
import { createPinia } from 'pinia';

// Bootstrap theme before app mounts to avoid a flash (default to light)
const storedTheme = localStorage.getItem('sync-theme') || 'light';
const nextTheme = storedTheme === 'dark' ? 'dark' : 'light';
document.documentElement.setAttribute('data-theme', nextTheme);
document.body.classList.toggle('theme-light', nextTheme === 'light');
document.body.classList.toggle('theme-dark', nextTheme === 'dark');
localStorage.setItem('sync-theme', nextTheme);

const app = createApp(App);

const pinia = createPinia();

app.use(router);
app.use(pinia);

app.mount('#app');
