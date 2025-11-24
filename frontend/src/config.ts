const SERVER_IP = '172.20.0.1';
const SERVER_PORT = '8080';

// Для изображений используем ваш IP для MinIO
const isTauriApp = !!(window as any).__TAURI__;

export const API_BASE_URL = isTauriApp 
  ? `http://${SERVER_IP}:${SERVER_PORT}/api`
  : '/api';

export const IMAGE_BASE_URL = isTauriApp 
  ? `http://${SERVER_IP}:9000`  // ⭐ Ваш IP для MinIO в Tauri
  : 'http://127.0.0.1:9000';    // localhost для браузера

console.log('Tauri Environment:', isTauriApp);
console.log('API Base URL:', API_BASE_URL);
console.log('Image Base URL:', IMAGE_BASE_URL);