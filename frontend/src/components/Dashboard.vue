<template>
  <!-- App Bar -->
  <v-app-bar app color="white" flat class="border-b">
    <v-toolbar-title class="font-weight-bold text-primary">
      Personnel Evaluation System
    </v-toolbar-title>
    <v-spacer></v-spacer>
    <v-chip color="blue" variant="tonal" class="mr-4">
      <v-icon start icon="mdi-account-circle"></v-icon>
      <!-- ใช้ authStore.user.role โดยตรง -->
      {{ authStore.user?.email }} ({{ authStore.user?.role }})
    </v-chip>
    
    <!-- [FIX 1] เปลี่ยน @click เป็น handleLogout -->
    <v-btn @click="handleLogout" color="grey-darken-1" icon="mdi-logout">
      <v-icon>mdi-logout</v-icon>
      <v-tooltip activator="parent" location="bottom">ออกจากระบบ</v-tooltip>
    </v-btn>
  </v-app-bar>

  <!-- Content Area (โค้ดของคุณถูกต้องแล้ว) -->
  <v-container class="mt-4">
    
    <!-- เริ่มด้วย v-if -->
    <Admin v-if="authStore.user?.role === 'admin'" />

    <!-- ใช้ v-else-if เพื่อสร้างเงื่อนไขต่อกัน -->
    <Assessor v-else-if="authStore.user?.role === 'assessor'" />

    <!-- ใช้ v-else-if เป็นเงื่อนไขสุดท้าย -->
    <Employee v-else-if="authStore.user?.role === 'employee'" />

    <!-- (ทางเลือก) เพิ่ม Fallback เผื่อ Role ไม่มีค่า -->
    <v-alert v-else type="warning">
      ไม่พบบทบาทผู้ใช้ ({{ authStore.user?.role }}) หรือกำลังโหลดข้อมูล...
    </v-alert>

  </v-container>
</template>

<script setup>
import { useAuthStore } from '../store/auth';
import { useRouter } from 'vue-router'; // [FIX 2] Import router
import Admin from './Admin.vue';
import Employee from './Employee.vue';
import Assessor from './Assessor.vue';

const authStore = useAuthStore();
const router = useRouter(); // [FIX 3] Get router instance

// [FIX 4] สร้างฟังก์ชัน handleLogout
const handleLogout = () => {
  // ส่ง router ไปให้ action เพื่อให้มันสั่ง .push('/login')
  authStore.logout(router); 
};
</script>