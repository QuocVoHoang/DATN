# DATN MotionGuard

Ứng dụng phân tích chuyển động trên trình duyệt, dùng core WebAssembly SIMD + 4 threads từ Scenario 4.

## Yêu cầu

- Node.js
- Chrome hoặc Edge

## Chạy

```bash
npm install
npm run setup:emsdk
npm run build:wasm
npm run dev
```

Mở URL Vite in ra trong terminal. Không mở bằng `file://`; WASM pthreads cần COOP/COEP headers do Vite cung cấp.
