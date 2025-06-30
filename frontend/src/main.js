import { createApp } from 'vue';
import App from './App.vue';
import './style.css';
import router from './router/index.js';
import { createPinia } from 'pinia';

import PrimeVue from 'primevue/config';
import Aura from '@primeuix/themes/aura';

const app = createApp(App);
app.use(PrimeVue, {
    theme: {
        preset: Aura
    }
});

createApp(App)
  .use(router)   // <-- tell Vue to use the router
  .mount('#app');


const pinia = createPinia();
app.use(pinia);
