import { defineStore } from 'pinia';
import api, { setupApiInterceptors } from '../services/api';

export const useAuthStore = defineStore('auth', {
  state: () => ({
    token: localStorage.getItem('token') || null,
    user: JSON.parse(localStorage.getItem('user')) || null,
    error: null,
    loading: false,
    isAuthReady: false, // [FIX 1] เพิ่ม state "ความพร้อม"
  }),

  getters: {
    isAuthenticated: (state) => !!state.token,
    userRole: (state) => state.user?.role || null,
  },

  actions: {
    async login(credentials, router) {
      this.loading = true;
      this.error = null;
      try {
        const response = await api.post('/auth/login', credentials);
        const { token, user } = response.data;

        // 1. Store state
        this.token = token;
        this.user = user;
        this.isAuthReady = true; // [FIX 2] ตั้งค่า "พร้อม" หลังจากล็อกอิน

        // 2. Persist state & Setup Axios
        localStorage.setItem('token', token);
        localStorage.setItem('user', JSON.stringify(user));
        setupApiInterceptors(token);

        this.loading = false;
        
        // 3. Redirect (ทำหลังสุด)
        if (router) {
          router.push('/dashboard');
        }

      } catch (err) {
        this.error = err.response?.data?.message || 'Login failed. Please try again.';
        this.loading = false;
        this.isAuthReady = true; // [FIX 3] ตั้งค่า "พร้อม" แม้จะ Error
        throw err;
      }
    },

    async fetchProfile() {
      if (!this.token) {
        this.isAuthReady = true; // [FIX 4] ถ้าไม่มี token ก็ถือว่า "พร้อม" (เพื่อไปหน้า Login)
        return;
      }

      this.loading = true;
      try {
        // ตั้งค่า interceptor ก่อน (สำคัญมากสำหรับ Page Reload)
        setupApiInterceptors(this.token);
        
        const response = await api.get('/auth/profile');
        this.user = response.data;
        localStorage.setItem('user', JSON.stringify(this.user));

      } catch (err) {
        console.error('Failed to fetch profile', err);
        if (err.response?.status === 401) {
          // Token หมดอายุ, ให้ logout
          this.logout(null); // ส่ง null router, จะไม่ redirect
        }
      } finally {
        this.loading = false;
        this.isAuthReady = true; // [FIX 5] ตั้งค่า "พร้อม" เมื่อทำเสร็จ (ไม่ว่าจะสำเร็จหรือล้มเหลว)
      }
    },

    logout(router) {
      // 1. Clear state
      this.token = null;
      this.user = null;
      this.isAuthReady = true; // [FIX 6] ตั้งค่า "พร้อม" เสมอเมื่อ Logout

      // 2. Clear persistence & Axios
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      setupApiInterceptors(null);

      // 3. Redirect (ถ้า router ถูกส่งมา)
      if (router) {
        router.push('/');
      }
    },
  },
});