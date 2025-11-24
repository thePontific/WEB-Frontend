// src/tauri.d.ts
declare module '@tauri-apps/api/tauri' {
  export function invoke<T>(command: string, args?: any): Promise<T>;
}