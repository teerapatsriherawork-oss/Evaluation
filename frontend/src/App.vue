<template>
  <v-app>
    <v-layout>
      <v-main>
        <!-- [FIX] เปลี่ยน Container ให้เต็มความสูง -->
        <v-container fluid class="pa-0 fill-height">

          <!-- 
            [FIX 1] แสดง Loading Spinner
            ขณะที่ "isAuthReady" ยังเป็น false (กำลัง fetchProfile)
          -->
          <v-row v-if="!authStore.isAuthReady" align="center" justify="center" class="fill-height">
            <v-progress-circular
              indeterminate
              color="primary"
              size="64"
            ></v-progress-circular>
          </v-row>
          
          <!-- 
            [FIX 2] แสดง Dashboard
            ต่อเมื่อ "isAuthReady" เป็น true และ "isAuthenticated" (ล็อกอินแล้ว)
          -->
          <Dashboard v-else-if="authStore.isAuthReady && authStore.isAuthenticated" />
          
          <!-- 
            [FIX 3] แสดง Login
            ต่อเมื่อ "isAuthReady" เป็น true และ "ไม่ได้" isAuthenticated
          -->
          <Login v-else-if="authStore.isAuthReady && !authStore.isAuthenticated" />

        </v-container>
      </v-main>
    </v-layout>
  </v-app>
</template>

<script setup>
import { onMounted } from 'vue';
import { useAuthStore } from './store/auth';
import Login from './components/Login.vue';
import Dashboard from './components/Dashboard.vue';

const authStore = useAuthStore();

onMounted(() => {
  // [FIX] เรียก fetchProfile() "เสมอ"
  // auth.js (ที่เราแก้) จะจัดการเองว่ามี token หรือไม่
  // และจะตั้ง isAuthReady = true เมื่อทำเสร็จ
  authStore.fetchProfile();
});
</script>

<style>
/* Global styles (optional) */
.v-main {
  background-color: #f4f5f7;
  /* min-height: 100vh; (fill-height ใน container จัดการแทนแล้ว) */
}
</style>
