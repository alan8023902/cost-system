import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'

export default defineConfig({
  plugins: [vue()],
  server: {
    port: 38443,
    proxy: {
      '/api': {
        target: 'http://localhost:31943',
        changeOrigin: true
      }
    },
    // 强制预优化依赖
    force: true
  },
  // 优化依赖预构建
  optimizeDeps: {
    include: [
      'vue',
      'vue-router',
      'pinia',
      'axios',
      'element-plus',
      '@element-plus/icons-vue'
    ],
    force: true  // 强制重新预优化
  },
  css: {
    preprocessorOptions: {
      scss: {
        // 禁用 Sass 弃用警告（开发阶段）
        quietDeps: true,
        // 使用现代 API
        api: 'modern-compiler',
        // 静默模式，隐藏弃用警告
        silenceDeprecations: ['import', 'legacy-js-api']
      }
    }
  }
})