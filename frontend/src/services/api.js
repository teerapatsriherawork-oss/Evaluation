// [!!! DEBUG TEST !!!]
// นี่คือ "บททดสอบ" ของเรา
// ถ้าเบราว์เซอร์โหลดไฟล์นี้ (ไฟล์ที่ถูกต้อง) จริง...
// มัน "ต้อง" พิมพ์ Log นี้ใน F12 Console "ทันที" ที่เว็บโหลด
// console.log('--- [SUCCESS] api.js (FIXED Version) IS LOADED! ---');
// [!!! END DEBUG TEST !!!]

import axios from 'axios';

// [!!! FIXED !!!]
// ลบ `headers: { 'Content-Type': 'application/json' }` ที่เป็น "default" ทิ้ง
// Axios จะฉลาดพอที่จะตั้งค่า Content-Type ที่ถูกต้อง (json หรือ multipart)
// ให้เองโดยอัตโนมัติตามสิ่งที่เราส่ง (Payload)
const api = axios.create({
  baseURL: 'http://localhost:3000/api',
});
// [!!! FIXED !!!]


/**
 * ตั้งค่า Axios Interceptor เพื่อแนบ JWT Token ไปกับทุก Request
 * (ฟังก์ชันนี้ถูกเรียกโดย auth.js)
 * @param {string | null} token
 */
export const setupApiInterceptors = (token) => {
  api.interceptors.request.clear(); // ล้าง Interceptor เก่า (ถ้ามี)
  api.interceptors.request.use(
    (config) => {
      // ไม่ตั้งค่า Content-Type ที่นี่!
      // ปล่อยให้ Axios จัดการเอง

      if (token) {
        config.headers['Authorization'] = `Bearer ${token}`;
      }
      return config;
    },
    (error) => {
      return Promise.reject(error);
    }
  );
};

// (Initialize interceptor เผื่อรีเฟรชหน้า)
// เราจะย้ายไปให้ auth.js (ใน fetchProfile) เรียกแทน
// const initialToken = localStorage.getItem('token');
// if (initialToken) {
//   setupApiInterceptors(initialToken);
// }

export default api;

