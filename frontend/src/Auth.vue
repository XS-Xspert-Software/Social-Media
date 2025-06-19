<template>
  <div class="auth-container">
    <div class="auth-card card">
      <h2>{{ isLogin ? 'Login' : 'Register' }}</h2>
      
      <form @submit.prevent="handleSubmit">
        <div class="form-group" v-if="!isLogin">
          <label for="username">Username:</label>
          <input 
            type="text" 
            id="username" 
            v-model="form.username" 
            required
            placeholder="Enter username"
          >
        </div>
        
        <div class="form-group">
          <label for="email">Email:</label>
          <input 
            type="email" 
            id="email" 
            v-model="form.email" 
            required
            placeholder="Enter email"
          >
        </div>
        
        <div class="form-group">
          <label for="password">Password:</label>
          <input 
            type="password" 
            id="password" 
            v-model="form.password" 
            required
            placeholder="Enter password"
          >
        </div>
        
        <div v-if="error" class="error-message">{{ error }}</div>
        
        <button type="submit" :disabled="loading">
          {{ loading ? 'Please wait...' : (isLogin ? 'Login' : 'Register') }}
        </button>
      </form>
      
      <p class="toggle-text">
        {{ isLogin ? "Don't have an account?" : "Already have an account?" }}
        <button type="button" @click="toggleMode" class="toggle-btn">
          {{ isLogin ? 'Register' : 'Login' }}
        </button>
      </p>
    </div>
  </div>
</template>

<script>
import { nodeAPI } from './config/api.js';

export default {
  data() {
    return {
      isLogin: true,
      loading: false,
      error: null,
      form: {
        username: '',
        email: '',
        password: ''
      }
    };
  },
  methods: {
    toggleMode() {
      this.isLogin = !this.isLogin;
      this.error = null;
      this.resetForm();
    },
    
    resetForm() {
      this.form = {
        username: '',
        email: '',
        password: ''
      };
    },
    
    async handleSubmit() {
      this.loading = true;
      this.error = null;
      
      try {
        let response;
        
        if (this.isLogin) {
          response = await nodeAPI.login({
            email: this.form.email,
            password: this.form.password
          });
        } else {
          response = await nodeAPI.register({
            username: this.form.username,
            email: this.form.email,
            password: this.form.password
          });
        }
        
        // Store auth data
        if (response.token && response.user) {
          localStorage.setItem('authToken', response.token);
          localStorage.setItem('userId', response.user.id);
          localStorage.setItem('username', response.user.username);
          
          // Emit success event to parent
          this.$emit('auth-success', {
            user: response.user,
            token: response.token
          });
        }
        
      } catch (error) {
        console.error('Auth error:', error);
        this.error = error.message || 'Authentication failed';
      } finally {
        this.loading = false;
      }
    }
  }
};
</script>

<style scoped>
.auth-container {
  display: flex;
  justify-content: center;
  align-items: center;
  min-height: 100vh;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  padding: 20px;
}

.auth-card {
  max-width: 400px;
  margin: 60px auto 0 auto;
  padding: 32px 28px 24px 28px;
  border-radius: 22px;
  box-shadow: 0 8px 32px 0 rgba(31, 38, 135, 0.28);
  border: 2px solid #fff8;
  color: #fff;
  backdrop-filter: blur(32px) saturate(1.8);
  -webkit-backdrop-filter: blur(32px) saturate(1.8);
}

.auth-card h2 {
  text-align: center;
  margin-bottom: 30px;
  color: #333;
  font-size: 28px;
}

.form-group {
  margin-bottom: 20px;
}

.form-group label {
  display: block;
  margin-bottom: 8px;
  font-weight: 500;
  color: #555;
}

.form-group input {
  width: 100%;
  padding: 12px;
  border: 1px solid #ddd;
  border-radius: 5px;
  font-size: 16px;
  transition: border-color 0.3s;
}

.form-group input:focus {
  outline: none;
  border-color: #667eea;
  box-shadow: 0 0 0 2px rgba(102, 126, 234, 0.2);
}

button[type="submit"] {
  width: 100%;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  border: none;
  padding: 12px;
  border-radius: 5px;
  font-size: 16px;
  font-weight: 500;
  cursor: pointer;
  transition: transform 0.2s;
}

button[type="submit"]:hover:not(:disabled) {
  transform: translateY(-2px);
}

button[type="submit"]:disabled {
  opacity: 0.6;
  cursor: not-allowed;
  transform: none;
}

.error-message {
  background: #fee;
  color: #c33;
  padding: 10px;
  border-radius: 5px;
  margin-bottom: 20px;
  text-align: center;
  border: 1px solid #fcc;
}

.toggle-text {
  text-align: center;
  margin-top: 20px;
  color: #666;
}

.toggle-btn {
  background: none;
  border: none;
  color: #667eea;
  cursor: pointer;
  text-decoration: underline;
  font-weight: 500;
}

.toggle-btn:hover {
  color: #764ba2;
}
</style>
