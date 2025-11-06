<template>
  <v-card class="rounded-lg">
    <v-card-title class="text-h6 font-weight-medium pa-4">
      Employee Dashboard (หน้าสำหรับพนักงาน)
    </v-card-title>
    <v-card-text>
      <v-alert v-if="loading" type="info" variant="tonal">กำลังโหลดข้อมูล...</v-alert>
      <v-alert v-if="error" type="error" variant="tonal">{{ error }}</v-alert>

      <v-expansion-panels v-if="!loading" v-model="panel" variant="accordion" class="pa-2">
        <v-expansion-panel
          v-for="topic in topics"
          :key="topic.topic_id"
          class="mb-3 rounded-lg elevation-1"
        >
          <v-expansion-panel-title class="font-weight-medium">
            {{ topic.topic_name }}
            <v-chip size="small" color="primary" class="ml-4">{{ topic.indicators.length }} รายการ</v-chip>
          </v-expansion-panel-title>
          
          <v-expansion-panel-text class="pa-0">
            <v-list lines="two">
              <v-list-item
                v-for="(indicator, i) in topic.indicators"
                :key="`${indicator.indicator_id}-${indicator.file_url || 'no-file'}`"
                :class="{ 'border-t': i > 0 }"
                class="pa-4"
              >
                <v-list-item-title class="font-weight-medium mb-1">{{ indicator.indicator_name }}</v-list-item-title>
                <v-list-item-subtitle class="mb-3">{{ indicator.indicator_detail }}</v-list-item-subtitle>
                
                <v-row align="center">
                  <v-col cols="12" md="6">
                    <v-file-input
                      :label="indicator.file_url ? 'อัปโหลดไฟล์ใหม่ (ทับไฟล์เดิม)' : 'เลือกไฟล์เพื่ออัปโหลด'"
                      variant="outlined"
                      density="compact"
                      v-model="indicator.selectedFile"
                      :loading="indicator.uploading"
                      @update:modelValue="handleFileSelect(indicator, $event)"
                      clearable
                      class="mb-md-0 mb-2"
                      prepend-icon="mdi-paperclip"
                    ></v-file-input>
                  </v-col>
                  <v-col cols="12" md="6" class="d-flex align-center">
                    <v-btn
                      color="primary"
                      @click="uploadFile(indicator)"
                      :disabled="!indicator.selectedFile || indicator.uploading"
                      :loading="indicator.uploading"
                      class="mr-3"
                    >
                      <v-icon start>mdi-upload</v-icon>
                      อัปโหลด
                    </v-btn>
                    
                    <v-chip 
                      v-if="indicator.file_url && !indicator.selectedFile" 
                      :key="indicator.file_url"
                      color="success" 
                      variant="tonal" 
                      class="mr-3" 
                      :href="getBaseUrl() + indicator.file_url" 
                      target="_blank"
                    >
                      <v-icon start>mdi-check-circle</v-icon>
                      ส่งแล้ว (ดูไฟล์)
                    </v-chip>
                    
                    <v-chip v-if="indicator.score" color="info" variant="tonal">
                      <v-icon start>mdi-star</v-icon>
                      คะแนน: {{ indicator.score }}/5
                    </v-chip>
                  </v-col>
                </v-row>
                
                <v-slide-y-transition>
                  <v-alert v-if="indicator.uploadError" type="error" density="compact" class="mt-3">{{ indicator.uploadError }}</v-alert>
                </v-slide-y-transition>
                 <v-slide-y-transition>
                  <v-alert v-if="indicator.uploadSuccess" type="success" density="compact" class="mt-3">{{ indicator.uploadSuccess }}</v-alert>
                </v-slide-y-transition>

                <div v-if="indicator.comment" class="mt-4 pa-3 bg-grey-lighten-4 rounded">
                  <strong>ความคิดเห็นจากผู้ประเมิน:</strong>
                  <p class="text-medium-emphasis mt-1">{{ indicator.comment }}</p>
                </div>

              </v-list-item>
            </v-list>
          </v-expansion-panel-text>
        </v-expansion-panel>
      </v-expansion-panels>
    </v-card-text>
  </v-card>
</template>

<script setup>
// ✅ 1. เพิ่ม `reactive`
import { ref, onMounted, nextTick, reactive } from 'vue'; 
import api from '../services/api';

const loading = ref(true);
const error = ref(null);
const panel = ref(0); 
const topics = ref([]); // <-- ใช้ ref เปล่ารอ

// ❌ 2. ลบ `const topics = computed(...)` ทิ้งทั้งหมด

const getBaseUrl = () => {
  if (api.defaults.baseURL) {
    return api.defaults.baseURL.replace('/api', '/');
  }
  return 'http://localhost:3000/';
}

const fetchData = async () => {
  loading.value = true;
  error.value = null;
  try {
    const res = await api.get('/submissions');
    const rawData = res.data; 

    // ✅ 3. ย้ายตรรกะ `reduce` มาไว้ที่นี่
    const groups = rawData.reduce((acc, item) => {
      
      // ✅ 4. หุ้มด้วย `reactive` (เพื่อแก้ UI Lag)
      const indicator = reactive({
        ...item,
        // ✅ 5. ใช้ `null` (ตามตรรกะที่ถูกต้องของคุณ)
        selectedFile: null, 
        uploading: false,
        uploadError: null,
        uploadSuccess: null,
      });
      
      let topic = acc.find(t => t.topic_id === item.topic_id);
      
      if (topic) {
        topic.indicators.push(indicator);
      } else {
        acc.push(reactive({ 
          topic_id: item.topic_id,
          topic_name: item.topic_name,
          indicators: [indicator]
        }));
      }
      return acc;
    }, []);
    
    topics.value = groups;

  } catch (err) {
    console.error(err);
    error.value = err.response?.data?.message || 'Failed to load data.';
  } finally {
    loading.value = false;
  }
};

const handleFileSelect = (indicator, file) => { // 'file' คือ File object หรือ null
  console.log('--- FILE SELECT EVENT ---');
  console.log('File object received:', file);
  
  indicator.uploadError = null;
  indicator.uploadSuccess = null;
  
  if (file && file instanceof File) {
    console.log('File name:', file.name);
  } else {
    console.log('File cleared by user');
  }
}

// ✅ 6. ยึดตรรกะ `uploadFile` เดิมของคุณ (ที่ถูกต้อง)
const uploadFile = async (indicator) => {
  console.log('--- FRONTEND DEBUG: UPLOAD START ---');
  console.log('selectedFile:', indicator.selectedFile);
  
  // (ตรรกะเดิมของคุณ)
  if (!indicator.selectedFile) {
    indicator.uploadError = 'กรุณาเลือกไฟล์ก่อนอัปโหลด';
    return;
  }

  // (ตรรกะเดิมของคุณ)
  const file = indicator.selectedFile; 
  
  // (ตรรกะเดิมของคุณ)
  if (!file || !(file instanceof File)) {
    indicator.uploadError = "ไม่พบ File Object ที่ถูกต้อง กรุณาลองเลือกไฟล์ใหม่";
    console.error("File is invalid:", file);
    return;
  }

  indicator.uploading = true;
  indicator.uploadError = null;
  indicator.uploadSuccess = null;

  const formData = new FormData();
  formData.append('evaluationFile', file); 
  formData.append('indicator_id', indicator.indicator_id);
  
  console.log('--- FormData Contents ---');
  for (let pair of formData.entries()) {
    console.log(pair[0], pair[1]);
  }

  try {
    const res = await api.post('/submissions/upload', formData, {
      headers: {
        'Content-Type': 'multipart/form-data'
      }
    });

    console.log('--- UPLOAD SUCCESS ---');
    console.log('Response:', res.data);

    // อัปเดต UI (ตรรกะนี้จะทำงานได้ดีเพราะ indicator เป็น reactive)
    indicator.file_url = res.data.filePath;
    indicator.submission_id = res.data.submission_id;
    indicator.score = null;
    indicator.comment = null;
    indicator.selectedFile = null; // Reset v-model (ล้างช่อง file input)
    indicator.uploadSuccess = "อัปโหลดไฟล์สำเร็จ!";

    await nextTick();
    
  } catch (err) {
    console.error('--- UPLOAD ERROR ---');
    console.error('Error object:', err);
    console.error('Error response:', err.response);
    
    const errorMessage = err.response?.data?.message || err.response?.data?.error || 'Upload failed. กรุณาตรวจสอบ Server Log';
    indicator.uploadError = errorMessage;
  } finally {
    indicator.uploading = false;
  }
};

onMounted(fetchData);
</script>

<style scoped>
.border-t {
  border-top: 1px solid rgba(0, 0, 0, 0.12) !important;
}
</style>

