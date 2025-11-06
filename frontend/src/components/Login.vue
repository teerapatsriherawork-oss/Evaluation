<template>
  <v-container fluid fill-height class="d-flex align-center justify-center" style="min-height: 100vh; background-color: #f0f2f5;">
    <v-row justify="center">
      <v-col cols="12" sm="8" md="4">
        <v-card class="elevation-12 rounded-lg pa-4">
          <v-card-title class="text-center text-h5 font-weight-bold pt-4 pb-2">
            ระบบประเมินบุคลากร
          </v-card-title>
          <v-card-subtitle class="text-center pb-4">
            (Personnel Evaluation System)
          </v-card-subtitle>

          <v-card-text>
            <v-form ref="loginForm" @submit.prevent="handleLogin">
              <v-alert
                v-if="errorMessage"
                type="error"
                variant="tonal"
                density="compact"
                class="mb-4"
              >
                {{ errorMessage }}
              </v-alert>

              <v-text-field
                v-model="email"
                label="อีเมล"
                prepend-inner-icon="mdi-email-outline"
                variant="outlined"
                :rules="[rules.required, rules.email]"
                class="mb-3"
                required
              ></v-text-field>

              <v-text-field
                v-model="password"
                label="รหัสผ่าน"
                prepend-inner-icon="mdi-lock-outline"
                :type="showPassword ? 'text' : 'password'"
                :append-inner-icon="showPassword ? 'mdi-eye-off' : 'mdi-eye'"
                @click:append-inner="showPassword = !showPassword"
                variant="outlined"
                :rules="[rules.required]"
                class="mb-3"
                required
              ></v-text-field>

              <v-btn
                :loading="authStore.loading"
                :disabled="authStore.loading"
                type="submit"
                color="primary"
                block
                size="large"
                class="mt-2"
              >
                ล็อกอิน
              </v-btn>
            </v-form>
          </v-card-text>
          
          <v-card-text class="text-center text-caption text-disabled">
            <p>admin@example.com / password123</p>
            <p>assessor@example.com / password123</p>
            <p>employee@example.com / password123</p>
          </v-card-text>
        </v-card>
      </v-col>
    </v-row>
  </v-container>
</template>

<script setup>
import { ref } from 'vue';
import { useAuthStore } from '../store/auth';
import { useRouter } from 'vue-router'; // [FIX 1] Import router

const authStore = useAuthStore();
const router = useRouter(); // [FIX 2] Get router instance

const loginForm = ref(null);
const email = ref('employee@example.com'); // ใช้ ref (ถูกต้อง)
const password = ref('password123'); // ใช้ ref (ถูกต้อง)
const showPassword = ref(false);
const errorMessage = ref(null);

const rules = {
  required: value => !!value || 'กรุณากรอกข้อมูล',
  email: value => /.+@.+\..+/.test(value) || 'รูปแบบอีเมลไม่ถูกต้อง',
};

const handleLogin = async () => {
  errorMessage.value = null;
  const { valid } = await loginForm.value.validate();
  
  if (!valid) return;

  try {
    // [FIX 3] ส่ง "object" และ "router"
    // (ซึ่งตรงกับ auth.js ที่คาดหวัง credentials object)
    await authStore.login(
      { email: email.value, password: password.value }, 
      router
    );
    // การเปลี่ยนหน้าจะเกิดขึ้นใน authStore.login
  } catch (err) {
    errorMessage.value = authStore.error;
  }
};
</script>