<template>
  <v-card class="rounded-lg">
    <v-card-title class="text-h6 font-weight-medium pa-4">
      Assessor Dashboard (หน้าสำหรับผู้ประเมิน)
    </v-card-title>
    <v-card-text>
      <v-alert v-if="loading" type="info" variant="tonal">กำลังโหลดรายการประเมิน...</v-alert>
      <v-alert v-if="error" type="error" variant="tonal">{{ error }}</v-alert>
      
      <v-alert v-if="!loading && employeesToReview.length === 0" type="info" variant="tonal">
        ไม่พบรายการที่ส่งประเมินในขณะนี้
      </v-alert>

      <v-expansion-panels
        v-if="!loading && employeesToReview.length > 0"
        variant="accordion"
        class="pa-2"
      >
        <v-expansion-panel
          v-for="employee in employeesToReview"
          :key="employee.user_id"
          class="mb-3 rounded-lg elevation-1"
        >
          <v-expansion-panel-title class="font-weight-medium">
            <v-icon start>mdi-account-circle-outline</v-icon>
            
            พนักงาน: {{ getEmployeeDisplayName(employee) }}
            
            <span v-if="employee.user_first_name || employee.user_last_name" class="text-caption text-disabled ml-2">
              ({{ employee.user_email }})
            </span>

            <v-chip size="small" color="primary" class="ml-4">{{ employee.submissions.length }} รายการ</v-chip>
          </v-expansion-panel-title>
          
          <v-expansion-panel-text class="bg-white pa-4">
            <v-container fluid class="pa-0">
              <v-row>
                <v-col
                  v-for="sub in employee.submissions"
                  :key="sub.submission_id" 
                  cols="12"
                  md="6"
                  lg="4"
                >
                  <v-card class="rounded-lg elevation-2 fill-height d-flex flex-column">
                    <v-card-title class="text-subtitle-1 font-weight-medium">
                      {{ sub.indicator_name }}
                    </v-card-title>

                    <v-card-text class="flex-grow-1">
                      <v-btn
                        v-if="sub.file_url"
                        :href="getBaseUrl() + sub.file_url"
                        target="_blank"
                        color="primary"
                        variant="tonal"
                        prepend-icon="mdi-download-circle-outline"
                        class="mb-4"
                      >
                        ดูไฟล์ที่ส่ง
                      </v-btn>

                      <v-label class="mb-2">ให้คะแนน (1-5)</v-label>
                      <v-slider
                        v-model="sub.score_model"
                        :min="1"
                        :max="5"
                        :step="1"
                        thumb-label
                        show-ticks="always"  
                        color="primary" 
                      ></v-slider>

                      <v-textarea
                        v-model="sub.comment_model"
                        label="ความคิดเห็น (Comment)"
                        variant="outlined"
                        rows="3"
                        auto-grow
                        density="compact"
                      ></v-textarea>
                      
                      <v-slide-y-transition>
                        <v-alert v-if="sub.evalError" type="error" density="compact" class="mt-3">{{ sub.evalError }}</v-alert>
                      </v-slide-y-transition>
                       <v-slide-y-transition>
                        <v-alert v-if="sub.evalSuccess" type="success" density="compact" class="mt-3">{{ sub.evalSuccess }}</v-alert>
                      </v-slide-y-transition>

                    </v-card-text>

                    <v-card-actions class="pa-4">
                      <v-spacer></v-spacer>
                      <v-btn
                        color="primary"
                        variant="flat"
                        @click="submitEvaluation(sub)"
                        :disabled="!sub.score_model || sub.loading"
                        :loading="sub.loading"
                      >
                        บันทึกผลการประเมิน
                      </v-btn>
                    </v-card-actions>
                  </v-card>
                </v-col>
              </v-row>
            </v-container>
          </v-expansion-panel-text>
        </v-expansion-panel>
      </v-expansion-panels>

    </v-card-text>
  </v-card>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import api from '../services/api';

const loading = ref(true);
const error = ref(null);
const employeesToReview = ref([]);

const getBaseUrl = () => {
  return api.defaults.baseURL.replace('/api', '/');
}

// [!!! แก้ไข 2/3 !!!] เพิ่มฟังก์ชันแสดงชื่อ
const getEmployeeDisplayName = (employee) => {
  if (employee.user_first_name || employee.user_last_name) {
    // ถ้ามีชื่อ ให้แสดงชื่อ
    const firstName = employee.user_first_name || '';
    const lastName = employee.user_last_name || '';
    return `${firstName} ${lastName}`.trim();
  }
  // ถ้าไม่มีชื่อ ให้แสดงอีเมล
  return employee.user_email;
};

const fetchData = async () => {
  loading.value = true;
  error.value = null;
  try {
    const res = await api.get('/submissions');
    const rawData = res.data; 
    
    const groups = rawData.reduce((acc, sub) => {
      const submissionItem = {
        ...sub,
        score_model: sub.score || null,
        comment_model: sub.comment || '',
        loading: false,
        evalError: null,
        evalSuccess: null,
      };

      let employeeGroup = acc.find(e => e.user_id === sub.user_id);

      if (employeeGroup) {
        employeeGroup.submissions.push(submissionItem);
      } else {
        // [!!! แก้ไข 3/3 !!!] เพิ่ม first_name, last_name ตอนสร้างกลุ่ม
        acc.push({
          user_id: sub.user_id,
          user_email: sub.user_email,
          user_first_name: sub.user_first_name, // <-- เพิ่ม
          user_last_name: sub.user_last_name,   // <-- เพิ่ม
          submissions: [submissionItem]
        });
      }

      return acc;
    }, []); 

    employeesToReview.value = groups;

  } catch (err) {
    console.error(err);
    error.value = err.response?.data?.message || 'Failed to load data.';
  } finally {
    loading.value = false;
  }
};

const submitEvaluation = async (submission) => {
  submission.loading = true;
  submission.evalError = null;
  submission.evalSuccess = null;

  try {
    const payload = {
      submission_id: submission.submission_id, 
      score: submission.score_model,
      comment: submission.comment_model,
    };

    const config = {
      headers: {
        'Content-Type': 'application/json',
      }
    };

    await api.post('/submissions/evaluate', payload, config);
    
    submission.score = submission.score_model;
    submission.comment = submission.comment_model;
    submission.evalSuccess = "บันทึกผลสำเร็จ!";
    
  } catch (err) {
    console.error(err);
    submission.evalError = err.response?.data?.message || 'Failed to submit evaluation.';
  } finally {
    submission.loading = false;
  }
};

onMounted(fetchData);
</script>

<style scoped>
.v-expansion-panel-text {
  background-color: #f9f9f9 !important;
}
</style>