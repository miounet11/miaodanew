import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import path from 'path'
import { TanStackRouterVite } from '@tanstack/router-plugin/vite'

export default defineConfig({
  base: './', // 添加相对路径基础配置
  plugins: [
    TanStackRouterVite({
      target: 'react',
      autoCodeSplitting: true,
      routeFileIgnorePattern: '.((test).ts)|test-page',
    }),
    react(),
    tailwindcss(),
  ],
  build: {
    outDir: './dist-web',
    emptyOutDir: true,
    rollupOptions: {
      output: {
        // 确保资源文件使用相对路径
        assetFileNames: 'assets/[name]-[hash][extname]',
        chunkFileNames: 'assets/[name]-[hash].js',
        entryFileNames: 'assets/[name]-[hash].js',
      },
      // 移除 external 配置，让 Tauri API 被正确打包
    },
    target: 'esnext',
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  define: {
    IS_TAURI: JSON.stringify(true), // Tauri 环境构建
    // Platform detection constants for Tauri build
    IS_WEB_APP: JSON.stringify(false),
    // Disable auto-updater temporarily
    AUTO_UPDATER_DISABLED: JSON.stringify(true),
    IS_MACOS: JSON.stringify(process.env.TAURI_ENV_PLATFORM?.includes('darwin') ?? false),
    IS_WINDOWS: JSON.stringify(process.env.TAURI_ENV_PLATFORM?.includes('windows') ?? false),
    IS_LINUX: JSON.stringify(process.env.TAURI_ENV_PLATFORM?.includes('linux') ?? false),
    IS_IOS: JSON.stringify(false),
    IS_ANDROID: JSON.stringify(false),
    PLATFORM: JSON.stringify(process.env.TAURI_ENV_PLATFORM || 'unknown'),
    VERSION: JSON.stringify(process.env.npm_package_version || '3.0.1'),
    POSTHOG_KEY: JSON.stringify(process.env.POSTHOG_KEY || ''),
    POSTHOG_HOST: JSON.stringify(process.env.POSTHOG_HOST || 'https://app.posthog.com'),
    MODEL_CATALOG_URL: JSON.stringify('https://raw.githubusercontent.com/miounet11/miaoda/main/model_catalog.json'),
  },
  server: {
    port: 3001,
    strictPort: true,
  },
  // Enable SPA mode - fallback to index.html for all routes
  appType: 'spa',
})
