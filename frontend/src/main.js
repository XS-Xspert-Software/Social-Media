import { createApp } from 'vue';
import App from './App.vue';
import './style.css';
import router from './router/index.js';
import { createPinia } from 'pinia';
import { createAuth0 } from '@auth0/auth0-vue';

const app = createApp(App);
const pinia = createPinia();

// Configure Auth0 via env; fallback to empty strings so build doesn't break
const auth0 = createAuth0({
	domain: import.meta.env.VITE_AUTH0_DOMAIN || '',
	clientId: import.meta.env.VITE_AUTH0_CLIENT_ID || '',
	authorizationParams: {
		redirect_uri: window.location.origin + '/callback',
		audience: import.meta.env.VITE_AUTH0_AUDIENCE || undefined,
		scope: 'openid profile email',
	},
	cacheLocation: 'localstorage',
	useRefreshTokens: true,
});

app.use(pinia);
app.use(auth0);
app.use(router);

app.mount('#app');
