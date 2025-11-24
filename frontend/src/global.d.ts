// src/global.d.ts
declare module '@tauri-apps/api/tauri' {
  export function invoke<T>(command: string, args?: any): Promise<T>;
}

declare global {
  interface Window {
    __TAURI__?: {
      tauri: {
        invoke: <T>(command: string, args?: any) => Promise<T>;
      };
    };
  }
}

export {};