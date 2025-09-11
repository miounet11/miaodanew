#!/usr/bin/env node

/**
 * Miaoda 配置管理器
 * 提供配置加载、验证、模板替换等功能
 */

import fs from 'fs/promises'
import path from 'path'
import { fileURLToPath } from 'url'
import { config } from 'dotenv'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)
const ROOT_DIR = path.resolve(__dirname, '..')

/**
 * 配置管理器类
 */
class ConfigManager {
  constructor() {
    this.config = new Map()
    this.watchers = new Set()
    this.validationRules = new Map()
    
    this.setupValidationRules()
  }

  /**
   * 设置配置验证规则
   */
  setupValidationRules() {
    // 必需的配置项
    this.validationRules.set('required', [
      'APP_NAME',
      'APP_VERSION',
      'NODE_ENV',
      'ENVIRONMENT'
    ])

    // 端口号验证
    this.validationRules.set('port', [
      'PORT',
      'HMR_PORT'
    ])

    // URL 验证
    this.validationRules.set('url', [
      'MODEL_CATALOG_URL',
      'POSTHOG_HOST',
      'OPENAI_API_BASE',
      'GROK_API_BASE',
      'UPDATE_ENDPOINT'
    ])

    // 数值验证
    this.validationRules.set('number', [
      'NETWORK_TIMEOUT',
      'REQUEST_TIMEOUT',
      'TEST_TIMEOUT',
      'COVERAGE_THRESHOLD',
      'WINDOW_WIDTH',
      'WINDOW_HEIGHT',
      'WINDOW_MIN_WIDTH',
      'WINDOW_MIN_HEIGHT',
      'CHUNK_SIZE_LIMIT',
      'MEMORY_LIMIT',
      'CPU_THREADS',
      'CACHE_SIZE',
      'LLAMACPP_THREADS',
      'LLAMACPP_GPU_LAYERS'
    ])

    // 布尔值验证
    this.validationRules.set('boolean', [
      'IS_TAURI',
      'IS_CLEAN',
      'AUTO_UPDATER_DISABLED',
      'ENABLE_CONSOLE_LOG',
      'DEBUG_MODE',
      'ENABLE_DEV_TOOLS',
      'ENABLE_HMR',
      'ENABLE_BUNDLE_ANALYZER',
      'ENABLE_SOURCE_MAPS',
      'THEME_SYNC_OS',
      'MCP_ENABLED',
      'MCP_AUTO_INSTALL',
      'ESLINT_ENABLED',
      'PRETTIER_ENABLED',
      'TYPE_CHECK_ENABLED',
      'ENABLE_E2E_TESTS',
      'ENABLE_REPORTPORTAL',
      'ENABLE_PERFORMANCE_MONITORING',
      'ENABLE_ERROR_TRACKING',
      'ENABLE_ANALYTICS',
      'RELEASE_DRAFT',
      'RELEASE_PRERELEASE'
    ])

    // 枚举验证
    this.validationRules.set('enum', {
      'NODE_ENV': ['development', 'test', 'production'],
      'ENVIRONMENT': ['development', 'test', 'production'],
      'LOG_LEVEL': ['debug', 'info', 'warn', 'error'],
      'DEFAULT_THEME': ['light', 'dark', 'auto'],
      'DEFAULT_LOCALE': ['zh-CN', 'en-US', 'ja-JP'],
      'LLAMACPP_BACKEND': ['auto', 'cpu', 'cuda', 'opencl', 'metal']
    })
  }

  /**
   * 加载配置文件
   */
  async loadConfig(environment = process.env.NODE_ENV || 'development') {
    console.log(`🔧 正在加载 ${environment} 环境配置...`)

    // 配置文件优先级：
    // 1. .env.local（本地覆盖，不纳入版本控制）
    // 2. .env.[environment]（环境特定配置）
    // 3. .env.example（模板配置）
    
    const configFiles = [
      '.env.example',
      `.env.${environment}`,
      '.env.local'
    ]

    const loadedConfigs = new Map()

    for (const configFile of configFiles) {
      const filePath = path.join(ROOT_DIR, configFile)
      
      try {
        const exists = await this.fileExists(filePath)
        if (exists) {
          console.log(`  📄 加载配置文件: ${configFile}`)
          const result = config({ path: filePath, override: false })
          
          if (result.parsed) {
            // 合并配置，后加载的覆盖先加载的
            for (const [key, value] of Object.entries(result.parsed)) {
              loadedConfigs.set(key, value)
            }
          }
        } else {
          if (configFile === '.env.local') {
            console.log(`  ⚠️  本地配置文件不存在: ${configFile}`)
          } else {
            console.log(`  ❌ 配置文件不存在: ${configFile}`)
          }
        }
      } catch (error) {
        console.error(`  ❌ 加载配置文件失败 ${configFile}:`, error.message)
      }
    }

    // 环境变量优先级最高
    for (const [key, value] of Object.entries(process.env)) {
      if (value !== undefined) {
        loadedConfigs.set(key, value)
      }
    }

    this.config = loadedConfigs
    console.log(`✅ 配置加载完成，共 ${loadedConfigs.size} 项配置`)

    return this.config
  }

  /**
   * 获取配置值
   */
  get(key, defaultValue = undefined) {
    const value = this.config.get(key)
    
    if (value === undefined) {
      return defaultValue
    }

    // 自动类型转换
    return this.parseValue(key, value)
  }

  /**
   * 设置配置值
   */
  set(key, value) {
    const oldValue = this.config.get(key)
    this.config.set(key, value)

    // 触发变更事件
    this.notifyWatchers({
      key,
      oldValue,
      newValue: value,
      timestamp: Date.now()
    })
  }

  /**
   * 解析配置值（自动类型转换）
   */
  parseValue(key, value) {
    if (typeof value !== 'string') {
      return value
    }

    // 布尔值转换
    if (this.validationRules.get('boolean')?.includes(key)) {
      return value.toLowerCase() === 'true' || value === '1'
    }

    // 数值转换
    if (this.validationRules.get('number')?.includes(key) || this.validationRules.get('port')?.includes(key)) {
      const num = Number(value)
      return isNaN(num) ? value : num
    }

    // 空字符串转换为 undefined
    if (value === '') {
      return undefined
    }

    return value
  }

  /**
   * 验证配置
   */
  validateConfig() {
    const errors = []
    const warnings = []

    console.log('🔍 正在验证配置...')

    // 验证必需配置
    for (const key of this.validationRules.get('required') || []) {
      const value = this.get(key)
      if (value === undefined || value === '') {
        errors.push({
          field: key,
          message: `必需的配置项 ${key} 未设置`,
          severity: 'error'
        })
      }
    }

    // 验证端口号
    for (const key of this.validationRules.get('port') || []) {
      const value = this.get(key)
      if (value !== undefined) {
        const port = Number(value)
        if (isNaN(port) || port < 1 || port > 65535) {
          errors.push({
            field: key,
            message: `端口号 ${key} 无效，应该在 1-65535 之间`,
            severity: 'error'
          })
        }
      }
    }

    // 验证 URL
    for (const key of this.validationRules.get('url') || []) {
      const value = this.get(key)
      if (value && typeof value === 'string') {
        try {
          new URL(value)
        } catch {
          warnings.push({
            field: key,
            message: `URL 格式可能无效: ${key}`,
            severity: 'warning'
          })
        }
      }
    }

    // 验证枚举值
    const enums = this.validationRules.get('enum') || {}
    for (const [key, allowedValues] of Object.entries(enums)) {
      const value = this.get(key)
      if (value && !allowedValues.includes(value)) {
        errors.push({
          field: key,
          message: `${key} 的值 "${value}" 无效，允许的值: ${allowedValues.join(', ')}`,
          severity: 'error'
        })
      }
    }

    // 验证数值范围
    const numericValidations = {
      'COVERAGE_THRESHOLD': { min: 0, max: 100 },
      'WINDOW_WIDTH': { min: 200, max: 4000 },
      'WINDOW_HEIGHT': { min: 200, max: 3000 },
      'WINDOW_MIN_WIDTH': { min: 200, max: 1000 },
      'WINDOW_MIN_HEIGHT': { min: 200, max: 1000 },
      'MEMORY_LIMIT': { min: 256, max: 16384 },
      'CPU_THREADS': { min: 0, max: 128 },
      'CACHE_SIZE': { min: 10, max: 10000 }
    }

    for (const [key, { min, max }] of Object.entries(numericValidations)) {
      const value = this.get(key)
      if (typeof value === 'number') {
        if (value < min || value > max) {
          warnings.push({
            field: key,
            message: `${key} 的值 ${value} 超出推荐范围 ${min}-${max}`,
            severity: 'warning'
          })
        }
      }
    }

    // 验证端口冲突
    const port = this.get('PORT')
    const hmrPort = this.get('HMR_PORT')
    if (port && hmrPort && port === hmrPort) {
      errors.push({
        field: 'HMR_PORT',
        message: 'HMR_PORT 不能与 PORT 相同',
        severity: 'error'
      })
    }

    // 输出验证结果
    if (errors.length > 0) {
      console.error('❌ 配置验证失败:')
      errors.forEach(error => {
        console.error(`  - ${error.field}: ${error.message}`)
      })
    }

    if (warnings.length > 0) {
      console.warn('⚠️  配置警告:')
      warnings.forEach(warning => {
        console.warn(`  - ${warning.field}: ${warning.message}`)
      })
    }

    if (errors.length === 0 && warnings.length === 0) {
      console.log('✅ 配置验证通过')
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings
    }
  }

  /**
   * 生成配置对象
   */
  generateAppConfig() {
    return {
      base: {
        appName: this.get('APP_NAME'),
        appVersion: this.get('APP_VERSION'),
        environment: this.get('ENVIRONMENT'),
        nodeEnv: this.get('NODE_ENV'),
        port: this.get('PORT'),
        tauriDevHost: this.get('TAURI_DEV_HOST'),
        isTauri: this.get('IS_TAURI'),
        isClean: this.get('IS_CLEAN')
      },
      
      external: {
        posthog: {
          key: this.get('POSTHOG_KEY'),
          host: this.get('POSTHOG_HOST')
        },
        modelCatalogUrl: this.get('MODEL_CATALOG_URL'),
        openai: {
          apiKey: this.get('OPENAI_API_KEY'),
          apiBase: this.get('OPENAI_API_BASE'),
          model: this.get('OPENAI_API_MODEL')
        },
        grok: {
          apiKey: this.get('GROK_API_KEY'),
          apiBase: this.get('GROK_API_BASE'),
          model: this.get('GROK_API_MODEL')
        },
        updater: {
          disabled: this.get('AUTO_UPDATER_DISABLED'),
          endpoint: this.get('UPDATE_ENDPOINT')
        }
      },
      
      ui: {
        theme: {
          default: this.get('DEFAULT_THEME'),
          syncOS: this.get('THEME_SYNC_OS')
        },
        locale: {
          default: this.get('DEFAULT_LOCALE'),
          fallback: this.get('FALLBACK_LOCALE')
        },
        window: {
          width: this.get('WINDOW_WIDTH'),
          height: this.get('WINDOW_HEIGHT'),
          minWidth: this.get('WINDOW_MIN_WIDTH'),
          minHeight: this.get('WINDOW_MIN_HEIGHT')
        }
      },
      
      devTools: {
        logging: {
          level: this.get('LOG_LEVEL'),
          enableConsole: this.get('ENABLE_CONSOLE_LOG'),
          file: this.get('LOG_FILE')
        },
        debug: {
          enabled: this.get('DEBUG_MODE'),
          enableDevTools: this.get('ENABLE_DEV_TOOLS')
        },
        hmr: {
          enabled: this.get('ENABLE_HMR'),
          port: this.get('HMR_PORT')
        },
        quality: {
          eslint: this.get('ESLINT_ENABLED'),
          prettier: this.get('PRETTIER_ENABLED'),
          typeCheck: this.get('TYPE_CHECK_ENABLED')
        }
      },
      
      build: {
        bundleAnalyzer: this.get('ENABLE_BUNDLE_ANALYZER'),
        sourceMaps: this.get('ENABLE_SOURCE_MAPS'),
        chunkSizeLimit: this.get('CHUNK_SIZE_LIMIT'),
        target: this.get('BUILD_TARGET'),
        features: this.get('BUILD_FEATURES'),
        cargoTarget: this.get('CARGO_BUILD_TARGET')
      },
      
      network: {
        networkTimeout: this.get('NETWORK_TIMEOUT'),
        requestTimeout: this.get('REQUEST_TIMEOUT'),
        proxy: {
          http: this.get('HTTP_PROXY'),
          https: this.get('HTTPS_PROXY'),
          username: this.get('PROXY_USERNAME'),
          password: this.get('PROXY_PASSWORD')
        }
      },
      
      security: {
        signing: {
          privateKey: this.get('TAURI_SIGNING_PRIVATE_KEY'),
          privateKeyPassword: this.get('TAURI_SIGNING_PRIVATE_KEY_PASSWORD')
        }
      },
      
      performance: {
        memoryLimit: this.get('MEMORY_LIMIT'),
        cpuThreads: this.get('CPU_THREADS'),
        cacheSize: this.get('CACHE_SIZE')
      },
      
      extensions: {
        mcp: {
          enabled: this.get('MCP_ENABLED'),
          registryUrl: this.get('MCP_REGISTRY_URL'),
          autoInstall: this.get('MCP_AUTO_INSTALL')
        },
        llamacpp: {
          backend: this.get('LLAMACPP_BACKEND'),
          threads: this.get('LLAMACPP_THREADS'),
          gpuLayers: this.get('LLAMACPP_GPU_LAYERS')
        }
      },
      
      storage: {
        dataDir: this.get('DATA_DIR'),
        modelsDir: this.get('MODELS_DIR'),
        extensionsDir: this.get('EXTENSIONS_DIR')
      },
      
      test: {
        timeout: this.get('TEST_TIMEOUT'),
        coverageThreshold: this.get('COVERAGE_THRESHOLD'),
        enableE2E: this.get('ENABLE_E2E_TESTS'),
        reportPortal: {
          enabled: this.get('ENABLE_REPORTPORTAL'),
          token: this.get('RP_TOKEN'),
          endpoint: this.get('RP_ENDPOINT'),
          project: this.get('RP_PROJECT'),
          launch: this.get('RP_LAUNCH')
        }
      },
      
      monitoring: {
        performance: {
          enabled: this.get('ENABLE_PERFORMANCE_MONITORING'),
          apiKey: this.get('PERFORMANCE_API_KEY')
        },
        errorTracking: {
          enabled: this.get('ENABLE_ERROR_TRACKING'),
          dsn: this.get('ERROR_TRACKING_DSN')
        },
        analytics: {
          enabled: this.get('ENABLE_ANALYTICS'),
          endpoint: this.get('ANALYTICS_ENDPOINT')
        }
      },
      
      cicd: {
        github: {
          token: this.get('GITHUB_TOKEN'),
          releaseDraft: this.get('RELEASE_DRAFT'),
          releasePrerelease: this.get('RELEASE_PRERELEASE')
        }
      }
    }
  }

  /**
   * 添加配置变更监听器
   */
  onChange(callback) {
    this.watchers.add(callback)
    
    // 返回取消监听的函数
    return () => {
      this.watchers.delete(callback)
    }
  }

  /**
   * 通知配置变更监听器
   */
  notifyWatchers(event) {
    for (const callback of this.watchers) {
      try {
        callback(event)
      } catch (error) {
        console.error('配置变更回调执行失败:', error)
      }
    }
  }

  /**
   * 导出配置到文件
   */
  async exportConfig(filePath, format = 'json') {
    const appConfig = this.generateAppConfig()
    
    let content
    switch (format) {
      case 'json':
        content = JSON.stringify(appConfig, null, 2)
        break
      case 'yaml':
        // 简单的 YAML 导出（可以使用 yaml 库增强）
        content = this.toYaml(appConfig)
        break
      default:
        throw new Error(`不支持的导出格式: ${format}`)
    }
    
    await fs.writeFile(filePath, content, 'utf8')
    console.log(`✅ 配置已导出到: ${filePath}`)
  }

  /**
   * 简单的对象转 YAML
   */
  toYaml(obj, indent = 0) {
    const spaces = '  '.repeat(indent)
    let yaml = ''
    
    for (const [key, value] of Object.entries(obj)) {
      if (value === null || value === undefined) {
        yaml += `${spaces}${key}:\n`
      } else if (typeof value === 'object' && !Array.isArray(value)) {
        yaml += `${spaces}${key}:\n`
        yaml += this.toYaml(value, indent + 1)
      } else if (Array.isArray(value)) {
        yaml += `${spaces}${key}:\n`
        for (const item of value) {
          yaml += `${spaces}  - ${item}\n`
        }
      } else {
        const val = typeof value === 'string' ? `"${value}"` : value
        yaml += `${spaces}${key}: ${val}\n`
      }
    }
    
    return yaml
  }

  /**
   * 检查文件是否存在
   */
  async fileExists(filePath) {
    try {
      await fs.access(filePath)
      return true
    } catch {
      return false
    }
  }
}

// CLI 接口
if (import.meta.url === `file://${process.argv[1]}`) {
  const manager = new ConfigManager()
  
  async function main() {
    const command = process.argv[2]
    const environment = process.argv[3] || process.env.NODE_ENV || 'development'
    
    try {
      switch (command) {
        case 'load':
          await manager.loadConfig(environment)
          console.log('配置加载完成')
          break
          
        case 'validate':
          await manager.loadConfig(environment)
          const result = manager.validateConfig()
          process.exit(result.isValid ? 0 : 1)
          break
          
        case 'export':
          const outputPath = process.argv[4] || `config-${environment}.json`
          const format = process.argv[5] || 'json'
          await manager.loadConfig(environment)
          await manager.exportConfig(outputPath, format)
          break
          
        case 'get':
          const key = process.argv[4]
          if (!key) {
            console.error('请指定配置键')
            process.exit(1)
          }
          await manager.loadConfig(environment)
          const value = manager.get(key)
          console.log(value)
          break
          
        default:
          console.log(`
使用方法: node config-manager.mjs <command> [environment] [args...]

命令:
  load [env]           加载指定环境的配置
  validate [env]       验证配置
  export [env] [path] [format]  导出配置到文件
  get [env] <key>      获取配置值

环境: development | test | production (默认: development)
格式: json | yaml (默认: json)

示例:
  node config-manager.mjs load development
  node config-manager.mjs validate production
  node config-manager.mjs export production config.json
  node config-manager.mjs get development PORT
          `)
          break
      }
    } catch (error) {
      console.error('执行失败:', error.message)
      process.exit(1)
    }
  }
  
  main()
}

export default ConfigManager