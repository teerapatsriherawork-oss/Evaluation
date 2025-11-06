<v-textarea 
            v-model="editedIndicator.detail" 
            label="รายละเอียด" 
            variant="underlined"
          /> ```

---

### 2. โค้ดฉบับเต็ม (Full Code)

และนี่คือโค้ดฉบับเต็ม (Full Code) ของ **`frontend/src/components/Admin.vue`** ที่แก้ไข Syntax Error นี้แล้วครับ คุณสามารถคัดลอกไปทับได้เลย

```vue
<template>
  <v-card class="rounded-lg">
    <v-card-title class="text-h6 font-weight-medium pa-4">
      Admin Dashboard (แผงควบคุมผู้ดูแลระบบ)
    </v-card-title>

    <v-tabs v-model="tab" color="primary" grow>
      <v-tab value="users">
        <v-icon start>mdi-account-group</v-icon>
        จัดการผู้ใช้ (Users)
      </v-tab>
      <v-tab value="topics">
        <v-icon start>mdi-format-list-bulleted-type</v-icon>
        จัดการหัวข้อ (Topics)
      </v-tab>
      <v-tab value="indicators">
        <v-icon start>mdi-format-list-checks</v-icon>
        จัดการตัวชี้วัด (Indicators)
      </v-tab>
    </v-tabs>

    <v-card-text>
      <v-window v-model="tab">
        <v-window-item value="users">
          <v-data-table
            :headers="userHeaders"
            :items="users"
            :loading="loading.users"
            class="elevation-1"
          >
            <template v-slot:top>
              <v-toolbar flat color="white">
                <v-toolbar-title>รายชื่อผู้ใช้</v-toolbar-title>
                <v-spacer></v-spacer>
                <v-btn color="primary" @click="openUserDialog()">
                  <v-icon start>mdi-plus</v-icon>
                  เพิ่มผู้ใช้ใหม่
                </v-btn>
              </v-toolbar>
            </template>
            <template v-slot:item.full_name="{ item }">
              {{ getFullName(item) }}
            </template>
            <template v-slot:item.assessor_email="{ item }">
              {{ getAssessorEmail(item.assessor_id) }}
            </template>
            <template v-slot:item.actions="{ item }">
              <v-icon size="small" class="me-2" @click="openUserDialog(item)">mdi-pencil</v-icon>
              <v-icon size="small" color="error" @click="deleteUser(item)">mdi-delete</v-icon>
            </template>
          </v-data-table>
        </v-window-item>

        <v-window-item value="topics">
          <v-data-table
            :headers="topicHeaders"
            :items="topics"
            :loading="loading.topics"
            class="elevation-1"
          >
            <template v-slot:top>
              <v-toolbar flat color="white">
                <v-toolbar-title>รายการหัวข้อ</v-toolbar-title>
                <v-spacer></v-spacer>
                <v-btn color="primary" @click="openTopicDialog()">
                  <v-icon start>mdi-plus</v-icon>
                  เพิ่มหัวข้อใหม่
                </v-btn>
              </v-toolbar>
            </template>
            <template v-slot:item.actions="{ item }">
              <v-icon size="small" class="me-2" @click="openTopicDialog(item)">mdi-pencil</v-icon>
              <v-icon size="small" color="error" @click="openDeleteDialog(item, 'topic')">mdi-delete</v-icon>
            </template>
          </v-data-table>
        </v-window-item>

        <v-window-item value="indicators">
          <v-data-table
            :headers="indicatorHeaders"
            :items="indicators"
            :loading="loading.indicators"
            class="elevation-1"
            :group-by="[{ key: 'topic_name', order: 'asc' }]"
          >
            <template v-slot:top>
              <v-toolbar flat color="white">
                <v-toolbar-title>รายการตัวชี้วัด</v-toolbar-title>
                <v-spacer></v-spacer>
                <v-btn color="primary" @click="openIndicatorDialog()">
                  <v-icon start>mdi-plus</v-icon>
                  เพิ่มตัวชี้วัด
                </v-btn>
              </v-toolbar>
            </template>
            <template v-slot:item.actions="{ item }">
              <v-icon size="small" class="me-2" @click="openIndicatorDialog(item)">mdi-pencil</v-icon>
              <v-icon size="small" color="error" @click="openDeleteDialog(item, 'indicator')">mdi-delete</v-icon>
            </template>
          </v-data-table>
        </v-window-item>
      </v-window>
    </v-card-text>
  </v-card>

  <v-dialog v-model="dialogs.user" max-width="600px" persistent>
    <v-card>
      <v-form ref="userForm" @submit.prevent="saveUser">
        <v-card-title>
          <span class="text-h5">{{ editedUser.id ? 'แก้ไข' : 'เพิ่ม' }} ผู้ใช้</span>
        </v-card-title>
        <v-card-text>
          <v-alert v-if="errors.user" type="error" density="compact" class="mb-3">{{ errors.user }}</v-alert>
          <v-row>
            <v-col cols="12" sm="6">
              <v-text-field v-model="editedUser.first_name" label="ชื่อจริง" variant="underlined"></v-text-field>
            </v-col>
            <v-col cols="12" sm="6">
              <v-text-field v-model="editedUser.last_name" label="นามสกุล" variant="underlined"></v-text-field>
            </v-col>
          </v-row>
          <v-text-field v-model="editedUser.email" label="อีเมล" :rules="[rules.required, rules.email]" variant="underlined"></v-text-field>
          <v-text-field v-model="editedUser.password" :label="editedUser.id ? 'รหัสผ่านใหม่ (ว่างไว้ถ้าไม่เปลี่ยน)' : 'รหัสผ่าน'" type="password" :rules="[editedUser.id ? rules.optional : rules.required]" variant="underlined"></v-text-field>
          <v-select v-model="editedUser.role" :items="roles" label="บทบาท" :rules="[rules.required]" variant="underlined"></v-select>
          <v-select
            v-if="editedUser.role === 'employee'"
            v-model="editedUser.assessor_id"
            :items="assessors"
            item-title="email"
            item-value="id"
            label="ผู้ประเมิน (Assessor)"
            :rules="[rules.required]"
            variant="underlined"
          ></v-select>
        </v-card-text>
        <v-card-actions>
          <v-spacer></v-spacer>
          <v-btn color="grey" @click="closeUserDialog">ยกเลิก</v-btn>
          <v-btn color="primary" type="submit" :loading="loading.dialog">บันทึก</v-btn>
        </v-card-actions>
      </v-form>
    </v-card>
  </v-dialog>

  <v-dialog v-model="dialogs.topic" max-width="500px" persistent>
     <v-card>
      <v-form ref="topicForm" @submit.prevent="saveTopic">
        <v-card-title>
          <span class="text-h5">{{ editedTopic.id ? 'แก้ไข' : 'เพิ่ม' }} หัวข้อ</span>
        </v-card-title>
        <v-card-text>
          <v-alert v-if="errors.topic" type="error" density="compact" class="mb-3">{{ errors.topic }}</v-alert>
          <v-text-field
            v-model="editedTopic.name"
            label="ชื่อหัวข้อ (Topic)"
            :rules="[rules.required]"
            variant="underlined"
          ></v-text-field>
          </v-card-text>
        <v-card-actions>
          <v-spacer></v-spacer>
          <v-btn color="grey" @click="closeTopicDialog">ยกเลิก</v-btn>
          <v-btn color="primary" type="submit" :loading="loading.dialog">บันทึก</v-btn>
        </v-card-actions>
      </v-form>
    </v-card>
  </v-dialog>

  <v-dialog v-model="dialogs.indicator" max-width="600px" persistent>
     <v-card>
      <v-form ref="indicatorForm" @submit.prevent="saveIndicator">
        <v-card-title>
          <span class="text-h5">{{ editedIndicator.id ? 'แก้ไข' : 'เพิ่ม' }} ตัวชี้วัด</span>
        </v-card-title>
        <v-card-text>
          <v-alert v-if="errors.indicator" type="error" density="compact" class="mb-3">{{ errors.indicator }}</v-alert>
          <v-select v-model="editedIndicator.topic_id" :items="topics" item-title="name" item-value="id" label="หัวข้อ (Topic)" :rules="[rules.required]" variant="underlined"></v-select>
          <v-text-field v-model="editedIndicator.name" label="ชื่อตัวชี้วัด" :rules="[rules.required]" variant="underlined"></v-text-field>
          
          <v-textarea 
            v-model="editedIndicator.detail" 
            label="รายละเอียด" 
            variant="underlined"
          />

          </v-card-text>
        <v-card-actions>
          <v-spacer></v-spacer>
          <v-btn color="grey" @click="closeIndicatorDialog">ยกเลิก</v-btn>
          <v-btn color="primary" type="submit" :loading="loading.dialog">บันทึก</v-btn>
        </v-card-actions>
      </v-form>
    </v-card>
  </v-dialog>

  <v-dialog v-model="dialogs.confirmDelete" max-width="500px">
    <v-card>
      <v-card-title class="text-h5">ยืนยันการลบ</v-card-title>
      <v-card-text v-if="itemToDelete">
        คุณแน่ใจหรือไม่ว่าต้องการลบ <strong>{{ itemToDelete.name }}</strong>?
        
        <br>
        <v-alert v-if="itemToDelete.type === 'user'" type="warning" variant="tonal" density="compact" class="mt-2">
          การดำเนินการนี้จะลบผู้ใช้และข้อมูลการประเมินทั้งหมดของพวกเขา
        </v-alert>
        <v-alert v-if="itemToDelete.type === 'topic'" type="warning" variant="tonal" density="compact" class="mt-2">
          การดำเนินการนี้จะลบหัวข้อ และ **ตัวชี้วัดทั้งหมด** ที่อยู่ใต้หัวข้อนี้
        </v-alert>
         <v-alert v-if="itemToDelete.type === 'indicator'" type="warning" variant="tonal" density="compact" class="mt-2">
          การดำเนินการนี้จะลบตัวชี้วัด และ **ผลการประเมินทั้งหมด** ที่เกี่ยวข้อง
        </v-alert>

      </v-card-text>
      <v-card-text v-if="errors.delete" class="mt-2">
        <v-alert type="error" density="compact">{{ errors.delete }}</v-alert>
      </v-card-text>
      <v-card-actions>
        <v-spacer></v-spacer>
        <v-btn color="grey" @click="closeDeleteDialog" :disabled="loading.dialog">ยกเลิก</v-btn>
        <v-btn color="error" @click="confirmDelete" :loading="loading.dialog">ลบ</v-btn>
      </v-card-actions>
    </v-card>
  </v-dialog>

</template>

<script setup>
import { ref, onMounted, computed } from 'vue';
import api from '../services/api';

const tab = ref('users');

const loading = ref({ users: false, topics: false, indicators: false, dialog: false });
const errors = ref({ user: null, topic: null, indicator: null, delete: null });

// --- Users ---
const users = ref([]);
const userForm = ref(null);
const dialogs = ref({ user: false, topic: false, indicator: false, confirmDelete: false });
const editedUser = ref({});
const itemToDelete = ref(null); 
const roles = ref(['admin', 'employee', 'assessor']);
const userHeaders = ref([
  { title: 'ชื่อ-นามสกุล', key: 'full_name' },
  { title: 'Email', key: 'email' },
  { title: 'Role', key: 'role' },
  { title: 'Assessor', key: 'assessor_email' },
  { title: 'Actions', key: 'actions', sortable: false }, 
]);

const assessors = computed(() => users.value.filter(u => u.role === 'assessor'));
const getAssessorEmail = (id) => assessors.value.find(a => a.id === id)?.email || 'N/A';
const getFullName = (item) => {
  const firstName = item.first_name || '';
  const lastName = item.last_name || '';
  const fullName = `${firstName} ${lastName}`.trim();
  return fullName || '(ไม่มีชื่อ)';
};

const fetchUsers = async () => {
  loading.value.users = true;
  try {
    const res = await api.get('/users');
    users.value = res.data;
  } catch (err) {
    console.error(err);
  } finally {
    loading.value.users = false;
  }
};

const openUserDialog = (item = null) => {
  editedUser.value = item ? { ...item } : { role: 'employee' };
  errors.value.user = null;
  dialogs.value.user = true;
};

const closeUserDialog = () => {
  dialogs.value.user = false;
  setTimeout(() => {
    editedUser.value = {};
    if (userForm.value) userForm.value.resetValidation();
  }, 300);
};

const saveUser = async () => {
  const { valid } = await userForm.value.validate();
  if (!valid) return;

  loading.value.dialog = true;
  errors.value.user = null;
  try {
    const payload = { ...editedUser.value };
    if (payload.id && !payload.password) {
      delete payload.password;
    }
    if (payload.role !== 'employee') {
      payload.assessor_id = null;
    }

    if (payload.id) {
      await api.put(`/users/${payload.id}`, payload);
    } else {
      await api.post('/users', payload);
    }
    
    closeUserDialog();
    await fetchUsers();
  } catch (err) {
    errors.value.user = err.response?.data?.message || 'Error saving user.';
  } finally {
    loading.value.dialog = false;
  }
};

const deleteUser = (item) => {
  openDeleteDialog(item, 'user');
};


// --- Topics ---
const topics = ref([]);
const topicForm = ref(null);
const editedTopic = ref({});
const topicHeaders = ref([
  { title: 'ID', key: 'id', width: '100px' },
  { title: 'ชื่อหัวข้อ (Topic Name)', key: 'name' },
  { title: 'Actions', key: 'actions', sortable: false, align: 'end' },
]);

const fetchTopics = async () => {
  loading.value.topics = true;
  try {
    const res = await api.get('/topics');
    topics.value = res.data;
  } catch (err) { console.error(err); }
  finally {
    loading.value.topics = false;
  }
};

const openTopicDialog = (item = null) => {
  editedTopic.value = item ? { ...item } : { name: '' };
  errors.value.topic = null;
  dialogs.value.topic = true;
};

const closeTopicDialog = () => {
  dialogs.value.topic = false;
  setTimeout(() => {
    editedTopic.value = {};
    if (topicForm.value) topicForm.value.resetValidation();
  }, 300);
};

const saveTopic = async () => {
  const { valid } = await topicForm.value.validate();
  if (!valid) return;

  loading.value.dialog = true;
  errors.value.topic = null;
  try {
    if (editedTopic.value.id) {
      await api.put(`/topics/${editedTopic.value.id}`, editedTopic.value);
    } else {
      await api.post('/topics', editedTopic.value);
    }
    closeTopicDialog();
    await fetchTopics();
  } catch (err) {
    errors.value.topic = err.response?.data?.message || 'Error saving topic.';
  } finally {
    loading.value.dialog = false;
  }
};


// --- Indicators ---
const indicators = ref([]);
const indicatorForm = ref(null);
const editedIndicator = ref({});
const indicatorHeaders = ref([
  { title: 'Topic', key: 'topic_name', align: ' d-none' }, 
  { title: 'Indicator Name', key: 'name' },
  { title: 'Detail', key: 'detail' },
  { title: 'Actions', key: 'actions', sortable: false },
]);

const fetchIndicators = async () => {
  loading.value.indicators = true;
  try {
    const res = await api.get('/indicators');
    indicators.value = res.data;
  } catch (err) { console.error(err); }
  finally { loading.value.indicators = false; }
};

const openIndicatorDialog = (item = null) => {
  editedIndicator.value = item ? { ...item } : { topic_id: null, name: '', detail: '' };
  errors.value.indicator = null;
  dialogs.value.indicator = true;
};

const closeIndicatorDialog = () => {
  dialogs.value.indicator = false;
  setTimeout(() => {
    editedIndicator.value = {};
    if (indicatorForm.value) indicatorForm.value.resetValidation();
  }, 300);
};

const saveIndicator = async () => {
  const { valid } = await indicatorForm.value.validate();
  if (!valid) return;

  loading.value.dialog = true;
  errors.value.indicator = null;
  try {
    if (editedIndicator.value.id) {
      await api.put(`/indicators/${editedIndicator.value.id}`, editedIndicator.value);
    } else {
      await api.post('/indicators', editedIndicator.value);
    }
    closeIndicatorDialog();
    await fetchIndicators();
    await fetchTopics(); 
  } catch (err) {
    errors.value.indicator = err.response?.data?.message || 'Error saving indicator.';
  } finally {
    loading.value.dialog = false;
  }
};


// --- Delete Logic (All Types) ---
const openDeleteDialog = (item, type) => {
  itemToDelete.value = { ...item, type: type };
  errors.value.delete = null;
  dialogs.value.confirmDelete = true;
};

const closeDeleteDialog = () => {
  dialogs.value.confirmDelete = false;
  setTimeout(() => {
    itemToDelete.value = null;
    errors.value.delete = null;
  }, 300);
};

const confirmDelete = async () => {
  if (!itemToDelete.value) return;

  loading.value.dialog = true;
  errors.value.delete = null;
  
  try {
    const { id, type } = itemToDelete.value;
    
    if (type === 'topic') {
      await api.delete(`/topics/${id}`);
      await fetchTopics();
      await fetchIndicators();
    } else if (type === 'indicator') {
      await api.delete(`/indicators/${id}`);
      await fetchIndicators(); 
    } else if (type === 'user') {
      await api.delete(`/users/${id}`);
      await fetchUsers(); 
    }
    closeDeleteDialog();
  } catch (err) {
    errors.value.delete = err.response?.data?.message || 'Error deleting item.';
  } finally {
    loading.value.dialog = false;
  }
};


// --- On Mount ---
onMounted(() => {
  fetchUsers();
  fetchTopics();
  fetchIndicators();
});

// --- Validation Rules ---
const rules = ref({
  required: value => !!value || 'กรุณากรอกข้อมูล',
  optional: () => true, 
  email: value => /.+@.+\..+/.test(value) || 'รูปแบบอีเมลไม่ถูกต้อง',
});

</script>