import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import path from 'path'
import { TanStackRouterVite } from '@tanstack/router-plugin/vite'
import { nodePolyfills } from 'vite-plugin-node-polyfills'
import packageJson from './package.json'

// 简化的配置加载器，直接使用环境变量
const loadProjectConfig = async (mode: string) => {
  console.warn('⚠️  使用简化配置加载器，直接从环境变量读取配置')
  const env = loadEnv(mode, process.cwd(), '')
  return {
    get: (key: string, defaultValue?: any) => env[key] || process.env[key] || defaultValue
  }
}

// https://vite.dev/config/
export default defineConfig(async ({ mode }: { mode: string }) => {
  // Load configuration using new config manager
  const config = await loadProjectConfig(mode)
  
  // Fallback environment loading for backward compatibility
  const env = loadEnv(mode, process.cwd(), '')
  
  // Configuration values with defaults
  const PORT = config.get('PORT', 1420)
  const HMR_PORT = config.get('HMR_PORT', 1421)
  const TAURI_DEV_HOST = config.get('TAURI_DEV_HOST', process.env.TAURI_DEV_HOST)
  const CHUNK_SIZE_LIMIT = config.get('CHUNK_SIZE_LIMIT', 1000)
  const ENABLE_SOURCE_MAPS = config.get('ENABLE_SOURCE_MAPS', mode === 'development')
  const ENABLE_BUNDLE_ANALYZER = config.get('ENABLE_BUNDLE_ANALYZER', false)
  
  console.log(`🚀 [Vite] 启动模式: ${mode}`)
  console.log(`🚀 [Vite] 端口: ${PORT}, HMR端口: ${HMR_PORT}`)
  console.log(`🚀 [Vite] Source Maps: ${ENABLE_SOURCE_MAPS ? '启用' : '禁用'}`)
  console.log(`🚀 [Vite] Bundle Analyzer: ${ENABLE_BUNDLE_ANALYZER ? '启用' : '禁用'}`)

  return {
    base: './', // 确保使用相对路径
    plugins: [
      TanStackRouterVite({
        target: 'react',
        autoCodeSplitting: true,
        routeFileIgnorePattern: '.((test).ts)|test-page',
      }),
      react({
        // React 优化配置
        babel: {
          plugins: mode === 'production' ? [
            ['babel-plugin-react-remove-properties', { properties: ['data-testid'] }]
          ] : [],
        },
      }),
      tailwindcss(),
      nodePolyfills({
        include: ['path'],
      }),
    ],
    
    // 构建性能优化
    esbuild: {
      // 移除生产环境的 console 和 debugger
      drop: mode === 'production' ? ['console', 'debugger'] : [],
      // 启用目标优化
      target: 'es2020',
      // 法律注释处理
      legalComments: 'none',
    },
    
    build: {
      // 构建性能优化
      target: 'es2020',
      minify: 'esbuild',
      cssMinify: 'esbuild',
      
      // 代码分割优化
      chunkSizeWarningLimit: CHUNK_SIZE_LIMIT,
      rollupOptions: {
        output: {
          // 手动分块，优化加载性能
          manualChunks: {
            vendor: ['react', 'react-dom'],
            ui: ['@radix-ui/react-dialog', '@radix-ui/react-dropdown-menu', '@radix-ui/react-tooltip'],
            router: ['@tanstack/react-router'],
            utils: ['lodash.debounce', 'lodash.clonedeep', 'uuid']
          },
        },
      },
      
      // 并行构建
      terserOptions: {
        compress: {
          drop_console: true,
          drop_debugger: true,
        },
      },
      
      // 生成 source map 用于调试（可选）
      sourcemap: ENABLE_SOURCE_MAPS,
    },
    
    // 优化依赖预构建
    optimizeDeps: {
      include: [
        'react',
        'react-dom',
        '@radix-ui/react-dialog',
        '@radix-ui/react-dropdown-menu',
        '@radix-ui/react-tooltip',
        '@tanstack/react-router',
        'lodash.debounce',
        'lodash.clonedeep',
        'uuid'
      ],
      // 强制依赖优化
      force: false,
    },
    
    resolve: {
      alias: {
        '@': path.resolve(__dirname, './src'),
      },
    },
    define: {
      IS_TAURI: JSON.stringify(process.env.IS_TAURI),
      IS_WEB_APP: JSON.stringify(false),
      IS_MACOS: JSON.stringify(
        process.env.TAURI_ENV_PLATFORM?.includes('darwin') ?? false
      ),
      IS_WINDOWS: JSON.stringify(
        process.env.TAURI_ENV_PLATFORM?.includes('windows') ?? false
      ),
      IS_LINUX: JSON.stringify(
        process.env.TAURI_ENV_PLATFORM?.includes('linux') ?? false
      ),
      IS_IOS: JSON.stringify(
        process.env.TAURI_ENV_PLATFORM?.includes('ios') ?? false
      ),
      IS_ANDROID: JSON.stringify(
        process.env.TAURI_ENV_PLATFORM?.includes('android') ?? false
      ),
      PLATFORM: JSON.stringify(process.env.TAURI_ENV_PLATFORM),

      VERSION: JSON.stringify(packageJson.version),

      // 使用配置管理器的值，带后备方案
      POSTHOG_KEY: JSON.stringify(config.get('POSTHOG_KEY', env.POSTHOG_KEY)),
      POSTHOG_HOST: JSON.stringify(config.get('POSTHOG_HOST', env.POSTHOG_HOST || 'https://app.posthog.com')),
      MODEL_CATALOG_URL: JSON.stringify(config.get('MODEL_CATALOG_URL', 'https://raw.githubusercontent.com/miounet11/miaoda/main/model_catalog.json')),
      AUTO_UPDATER_DISABLED: JSON.stringify(config.get('AUTO_UPDATER_DISABLED', env.AUTO_UPDATER_DISABLED === 'true')),
      
      // 新增配置项
      ENVIRONMENT: JSON.stringify(config.get('ENVIRONMENT', mode)),
      DEBUG_MODE: JSON.stringify(config.get('DEBUG_MODE', mode === 'development')),
      LOG_LEVEL: JSON.stringify(config.get('LOG_LEVEL', mode === 'development' ? 'debug' : 'info')),
    },

    // Vite options tailored for Tauri development and only applied in `tauri dev` or `tauri build`
    //
    // 1. prevent vite from obscuring rust errors
    clearScreen: false,
    // 2. tauri expects a fixed port, fail if that port is not available
    server: {
      port: PORT,
      strictPort: false,
      host: TAURI_DEV_HOST || false,
      hmr: TAURI_DEV_HOST
        ? {
            protocol: 'ws',
            host: TAURI_DEV_HOST,
            port: HMR_PORT,
          }
        : undefined,
      watch: {
        // 3. tell vite to ignore watching `src-tauri`
        ignored: ['**/src-tauri/**', '**/node_modules/**', '**/dist/**'],
        // 提高文件监控性能
        usePolling: false,
      },
    },
  }
})
