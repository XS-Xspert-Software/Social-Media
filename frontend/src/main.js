import { createApp } from 'vue';
import App from './App.vue';
import './style.css';
import router from './router/index.js';
import { createPinia } from 'pinia';

import PrimeVue from 'primevue/config';
import Aura from '@primeuix/themes/aura';

const app = createApp(App);

const pinia = createPinia();

app.use(PrimeVue, {
  theme: {
    preset: Aura
  }
});

app.use(router);
app.use(pinia);

app.mount('#app');
