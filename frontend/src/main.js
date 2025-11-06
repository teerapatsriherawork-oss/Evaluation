import { createApp } from 'vue';
import App from './App.vue';
import vuetify from './plugins/vuetify';
import { createPinia } from 'pinia';
import { createRouter, createWebHistory } from 'vue-router'; // [FIX 1] Import router

// --- [FIX 2] สร้าง Router ---
const routes = [
  // [FIX] เพิ่ม "Catch-all" route (เส้นทางครอบจักรวาล)
  // บอกว่า "ไม่ว่าจะมา Path ไหนก็ตาม (/:pathMatch(.*)*)
  // ให้โหลด Component ที่ชื่อ App เสมอ"
  { 
    path: '/:pathMatch(.*)*', 
    name: 'App', 
    component: App 
  }
];

const router = createRouter({
  history: createWebHistory(),
  routes,
});
// --------------------------


const app = createApp(App);
const pinia = createPinia();

app.use(pinia);
app.use(vuetify);
app.use(router); // [FIX 3] บอกให้ App "ใช้" Router

app.mount('#app');