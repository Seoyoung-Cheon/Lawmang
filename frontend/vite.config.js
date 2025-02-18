import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  assetsInclude: ['**/*.hwp'], // HWP 파일을 에셋으로 인식하도록 설정
  resolve: {
    alias: {
      '@': '/src'  // src 폴더에 대한 별칭 설정
    }
  }
}); 