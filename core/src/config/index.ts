/**
 * Miaoda 配置加载器
 * 运行时配置管理和热重载支持
 */

import type {
  AppConfig,
  ConfigManager as IConfigManager,
  ConfigValidationResult,
  ConfigChangeEvent,
  Environment,
  DEFAULT_CONFIG
} from '../types/config'

/**
 * 环境变量到配置的映射
 */
const ENV_MAPPING = {
  // 基础配置
  'APP_NAME': 'base.appName',
  'APP_VERSION': 'base.appVersion',
  'NODE_ENV': 'base.nodeEnv',
  'ENVIRONMENT': 'base.environment',
  'PORT': 'base.port',
  'TAURI_DEV_HOST': 'base.tauriDevHost',
  'IS_TAURI': 'base.isTauri',
  'IS_CLEAN': 'base.isClean',

  // 外部服务
  'POSTHOG_KEY': 'external.posthog.key',
  'POSTHOG_HOST': 'external.posthog.host',
  'MODEL_CATALOG_URL': 'external.modelCatalogUrl',
  'OPENAI_API_KEY': 'external.openai.apiKey',
  'OPENAI_API_BASE': 'external.openai.apiBase',
  'OPENAI_API_MODEL': 'external.openai.model',
  'GROK_API_KEY': 'external.grok.apiKey',
  'GROK_API_BASE': 'external.grok.apiBase',
  'GROK_API_MODEL': 'external.grok.model',
  'AUTO_UPDATER_DISABLED': 'external.updater.disabled',
  'UPDATE_ENDPOINT': 'external.updater.endpoint',

  // UI 配置
  'DEFAULT_THEME': 'ui.theme.default',
  'THEME_SYNC_OS': 'ui.theme.syncOS',
  'DEFAULT_LOCALE': 'ui.locale.default',
  'FALLBACK_LOCALE': 'ui.locale.fallback',
  'WINDOW_WIDTH': 'ui.window.width',
  'WINDOW_HEIGHT': 'ui.window.height',
  'WINDOW_MIN_WIDTH': 'ui.window.minWidth',
  'WINDOW_MIN_HEIGHT': 'ui.window.minHeight',

  // 开发工具
  'LOG_LEVEL': 'devTools.logging.level',
  'ENABLE_CONSOLE_LOG': 'devTools.logging.enableConsole',
  'LOG_FILE': 'devTools.logging.file',
  'DEBUG_MODE': 'devTools.debug.enabled',
  'ENABLE_DEV_TOOLS': 'devTools.debug.enableDevTools',
  'ENABLE_HMR': 'devTools.hmr.enabled',
  'HMR_PORT': 'devTools.hmr.port',
  'ESLINT_ENABLED': 'devTools.quality.eslint',
  'PRETTIER_ENABLED': 'devTools.quality.prettier',
  'TYPE_CHECK_ENABLED': 'devTools.quality.typeCheck',

  // 构建配置
  'ENABLE_BUNDLE_ANALYZER': 'build.bundleAnalyzer',
  'ENABLE_SOURCE_MAPS': 'build.sourceMaps',
  'CHUNK_SIZE_LIMIT': 'build.chunkSizeLimit',
  'BUILD_TARGET': 'build.target',
  'BUILD_FEATURES': 'build.features',
  'CARGO_BUILD_TARGET': 'build.cargoTarget',

  // 网络配置
  'NETWORK_TIMEOUT': 'network.networkTimeout',
  'REQUEST_TIMEOUT': 'network.requestTimeout',
  'HTTP_PROXY': 'network.proxy.http',
  'HTTPS_PROXY': 'network.proxy.https',
  'PROXY_USERNAME': 'network.proxy.username',
  'PROXY_PASSWORD': 'network.proxy.password',

  // 安全配置
  'TAURI_SIGNING_PRIVATE_KEY': 'security.signing.privateKey',
  'TAURI_SIGNING_PRIVATE_KEY_PASSWORD': 'security.signing.privateKeyPassword',

  // 性能配置
  'MEMORY_LIMIT': 'performance.memoryLimit',
  'CPU_THREADS': 'performance.cpuThreads',
  'CACHE_SIZE': 'performance.cacheSize',

  // 扩展配置
  'MCP_ENABLED': 'extensions.mcp.enabled',
  'MCP_REGISTRY_URL': 'extensions.mcp.registryUrl',
  'MCP_AUTO_INSTALL': 'extensions.mcp.autoInstall',
  'LLAMACPP_BACKEND': 'extensions.llamacpp.backend',
  'LLAMACPP_THREADS': 'extensions.llamacpp.threads',
  'LLAMACPP_GPU_LAYERS': 'extensions.llamacpp.gpuLayers',

  // 存储配置
  'DATA_DIR': 'storage.dataDir',
  'MODELS_DIR': 'storage.modelsDir',
  'EXTENSIONS_DIR': 'storage.extensionsDir',

  // 测试配置
  'TEST_TIMEOUT': 'test.timeout',
  'COVERAGE_THRESHOLD': 'test.coverageThreshold',
  'ENABLE_E2E_TESTS': 'test.enableE2E',
  'ENABLE_REPORTPORTAL': 'test.reportPortal.enabled',
  'RP_TOKEN': 'test.reportPortal.token',
  'RP_ENDPOINT': 'test.reportPortal.endpoint',
  'RP_PROJECT': 'test.reportPortal.project',
  'RP_LAUNCH': 'test.reportPortal.launch',

  // 监控配置
  'ENABLE_PERFORMANCE_MONITORING': 'monitoring.performance.enabled',
  'PERFORMANCE_API_KEY': 'monitoring.performance.apiKey',
  'ENABLE_ERROR_TRACKING': 'monitoring.errorTracking.enabled',
  'ERROR_TRACKING_DSN': 'monitoring.errorTracking.dsn',
  'ENABLE_ANALYTICS': 'monitoring.analytics.enabled',
  'ANALYTICS_ENDPOINT': 'monitoring.analytics.endpoint',

  // CI/CD 配置
  'GITHUB_TOKEN': 'cicd.github.token',
  'RELEASE_DRAFT': 'cicd.github.releaseDraft',
  'RELEASE_PRERELEASE': 'cicd.github.releasePrerelease'
} as const

/**
 * 配置管理器实现
 */
export class ConfigManager implements IConfigManager {
  private config: AppConfig
  private listeners: Array<(event: ConfigChangeEvent) => void> = []
  private environment: Environment

  constructor(environment: Environment = 'development') {
    this.environment = environment
    this.config = this.createDefaultConfig()
  }

  /**
   * 创建默认配置
   */
  private createDefaultConfig(): AppConfig {
    // 深拷贝默认配置
    return JSON.parse(JSON.stringify({
      base: {
        appName: 'miaoda',
        appVersion: '0.6.599',
        environment: this.environment,
        nodeEnv: this.environment,
        port: 1420,
        tauriDevHost: 'localhost',
        isTauri: false,
        isClean: false
      },
      external: {
        posthog: {
          host: 'https://app.posthog.com'
        },
        modelCatalogUrl: 'https://raw.githubusercontent.com/miounet11/miaoda/main/model_catalog.json',
        openai: {
          apiBase: 'https://api.openai.com/v1',
          model: 'gpt-3.5-turbo'
        },
        grok: {
          apiBase: 'https://api.x.ai/v1',
          model: 'grok-3'
        },
        updater: {
          disabled: this.environment !== 'production',
          endpoint: 'https://github.com/miounet11/miaoda/releases/latest/download/latest.json'
        }
      },
      ui: {
        theme: {
          default: 'light',
          syncOS: true
        },
        locale: {
          default: 'zh-CN',
          fallback: 'en-US'
        },
        window: {
          width: 1024,
          height: 800,
          minWidth: 375,
          minHeight: 667
        }
      },
      devTools: {
        logging: {
          level: this.environment === 'development' ? 'debug' : 'info',
          enableConsole: this.environment === 'development'
        },
        debug: {
          enabled: this.environment === 'development',
          enableDevTools: this.environment === 'development'
        },
        hmr: {
          enabled: this.environment === 'development',
          port: 1421
        },
        quality: {
          eslint: true,
          prettier: true,
          typeCheck: true
        }
      },
      build: {
        bundleAnalyzer: false,
        sourceMaps: this.environment === 'development',
        chunkSizeLimit: 1000
      },
      network: {
        networkTimeout: 30000,
        requestTimeout: 10000
      },
      security: {},
      performance: {
        cpuThreads: 0,
        cacheSize: 100
      },
      extensions: {
        mcp: {
          enabled: true,
          autoInstall: this.environment === 'production'
        },
        llamacpp: {
          backend: 'auto',
          threads: 0,
          gpuLayers: -1
        }
      },
      storage: {},
      test: {
        timeout: 30000,
        coverageThreshold: this.environment === 'production' ? 80 : 70,
        enableE2E: this.environment !== 'production',
        reportPortal: {
          enabled: false,
          project: 'miaoda',
          launch: 'miaoda-tests'
        }
      },
      monitoring: {
        performance: {
          enabled: this.environment === 'production'
        },
        errorTracking: {
          enabled: this.environment === 'production'
        },
        analytics: {
          enabled: this.environment === 'production'
        }
      },
      cicd: {
        github: {
          releaseDraft: false,
          releasePrerelease: false
        }
      }
    }))
  }

  /**
   * 加载配置
   */
  async load(): Promise<AppConfig> {
    console.log(`🔧 [ConfigManager] 加载 ${this.environment} 环境配置`)

    // 从环境变量加载配置
    this.loadFromEnvironment()

    console.log(`✅ [ConfigManager] 配置加载完成`)
    return this.config
  }

  /**
   * 从环境变量加载配置
   */
  private loadFromEnvironment(): void {
    for (const [envKey, configPath] of Object.entries(ENV_MAPPING)) {
      const envValue = this.getEnvValue(envKey)
      if (envValue !== undefined) {
        this.setNestedValue(this.config, configPath, envValue)
      }
    }
  }

  /**
   * 获取环境变量值并进行类型转换
   */
  private getEnvValue(key: string): unknown {
    const value = process.env[key]
    if (value === undefined || value === '') {
      return undefined
    }

    // 布尔值转换
    if (value.toLowerCase() === 'true' || value === '1') {
      return true
    }
    if (value.toLowerCase() === 'false' || value === '0') {
      return false
    }

    // 数字转换
    if (/^\d+$/.test(value)) {
      const num = parseInt(value, 10)
      return isNaN(num) ? value : num
    }
    if (/^\d+\.\d+$/.test(value)) {
      const num = parseFloat(value)
      return isNaN(num) ? value : num
    }

    return value
  }

  /**
   * 设置嵌套对象的值
   */
  private setNestedValue(obj: any, path: string, value: unknown): void {
    const keys = path.split('.')
    let current = obj

    for (let i = 0; i < keys.length - 1; i++) {
      const key = keys[i]
      if (!(key in current) || typeof current[key] !== 'object') {
        current[key] = {}
      }
      current = current[key]
    }

    const lastKey = keys[keys.length - 1]
    current[lastKey] = value
  }

  /**
   * 获取嵌套对象的值
   */
  private getNestedValue(obj: any, path: string): unknown {
    return path.split('.').reduce((current, key) => current?.[key], obj)
  }

  /**
   * 获取配置值
   */
  get<T>(key: string): T | undefined {
    return this.getNestedValue(this.config, key) as T | undefined
  }

  /**
   * 设置配置值
   */
  async set<T>(key: string, value: T): Promise<void> {
    const oldValue = this.getNestedValue(this.config, key)
    this.setNestedValue(this.config, key, value)

    // 触发变更事件
    const event: ConfigChangeEvent = {
      key,
      oldValue,
      newValue: value,
      timestamp: Date.now()
    }

    this.listeners.forEach(listener => {
      try {
        listener(event)
      } catch (error) {
        console.error('[ConfigManager] 配置变更监听器执行错误:', error)
      }
    })
  }

  /**
   * 验证配置
   */
  validate(config: Partial<AppConfig>): ConfigValidationResult {
    const errors = []
    const warnings = []

    // 基础配置验证
    if (!config.base?.appName) {
      errors.push({
        field: 'base.appName',
        message: '应用名称不能为空',
        severity: 'error' as const
      })
    }

    if (!config.base?.appVersion) {
      errors.push({
        field: 'base.appVersion',
        message: '应用版本不能为空',
        severity: 'error' as const
      })
    }

    // 端口验证
    if (config.base?.port) {
      const port = config.base.port
      if (port < 1 || port > 65535) {
        errors.push({
          field: 'base.port',
          message: '端口号必须在 1-65535 之间',
          severity: 'error' as const
        })
      }
    }

    // URL 验证
    const urlFields = [
      { path: 'external.posthog.host', value: config.external?.posthog?.host },
      { path: 'external.modelCatalogUrl', value: config.external?.modelCatalogUrl },
      { path: 'external.openai.apiBase', value: config.external?.openai?.apiBase },
      { path: 'external.grok.apiBase', value: config.external?.grok?.apiBase }
    ]

    for (const { path, value } of urlFields) {
      if (value && typeof value === 'string') {
        try {
          new URL(value)
        } catch {
          warnings.push({
            field: path,
            message: `URL 格式无效: ${value}`,
            severity: 'warning' as const
          })
        }
      }
    }

    // 窗口尺寸验证
    if (config.ui?.window) {
      const window = config.ui.window
      if (window.width && window.width < 200) {
        warnings.push({
          field: 'ui.window.width',
          message: '窗口宽度过小，建议至少 200px',
          severity: 'warning' as const
        })
      }
      if (window.height && window.height < 200) {
        warnings.push({
          field: 'ui.window.height',
          message: '窗口高度过小，建议至少 200px',
          severity: 'warning' as const
        })
      }
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings
    }
  }

  /**
   * 重新加载配置
   */
  async reload(): Promise<AppConfig> {
    console.log('🔄 [ConfigManager] 重新加载配置')
    return this.load()
  }

  /**
   * 监听配置变更
   */
  onChange(callback: (event: ConfigChangeEvent) => void): () => void {
    this.listeners.push(callback)

    // 返回取消监听的函数
    return () => {
      const index = this.listeners.indexOf(callback)
      if (index > -1) {
        this.listeners.splice(index, 1)
      }
    }
  }

  /**
   * 获取环境特定配置
   */
  getEnvironmentConfig(env: Environment): Partial<AppConfig> {
    const envConfig: Partial<AppConfig> = {}

    switch (env) {
      case 'development':
        return {
          devTools: {
            logging: { level: 'debug', enableConsole: true },
            debug: { enabled: true, enableDevTools: true },
            hmr: { enabled: true, port: 1421 },
            quality: { eslint: true, prettier: true, typeCheck: true }
          },
          external: {
            updater: { disabled: true },
            posthog: { key: '', host: '' },
            modelCatalogUrl: '',
            openai: { apiKey: undefined, apiBase: 'https://api.openai.com/v1', model: 'gpt-4' },
            grok: { apiKey: undefined, apiBase: 'https://api.x.ai/v1', model: 'grok-3' }
          },
          build: {
            sourceMaps: true,
            chunkSizeLimit: 2000,
            bundleAnalyzer: false
          }
        }

      case 'test':
        return {
          devTools: {
            logging: { level: 'warn', enableConsole: false },
            debug: { enabled: false, enableDevTools: false },
            hmr: { enabled: false, port: 1421 },
            quality: { eslint: true, prettier: false, typeCheck: true }
          },
          external: {
            updater: { disabled: true },
            posthog: { key: '', host: '' },
            modelCatalogUrl: '',
            openai: { apiKey: undefined, apiBase: 'https://api.openai.com/v1', model: 'gpt-4' },
            grok: { apiKey: undefined, apiBase: 'https://api.x.ai/v1', model: 'grok-3' }
          },
          extensions: {
            mcp: { enabled: false, autoInstall: false },
            llamacpp: { backend: 'auto' as const, threads: 4, gpuLayers: 0 }
          },
          test: {
            enableE2E: true,
            coverageThreshold: 80,
            timeout: 30000
          }
        }

      case 'production':
        return {
          devTools: {
            logging: { level: 'info', enableConsole: false },
            debug: { enabled: false, enableDevTools: false },
            hmr: { enabled: false, port: 1421 },
            quality: { eslint: false, prettier: false, typeCheck: false }
          },
          external: {
            updater: { disabled: false },
            posthog: { key: '', host: '' },
            modelCatalogUrl: '',
            openai: { apiKey: undefined, apiBase: 'https://api.openai.com/v1', model: 'gpt-4' },
            grok: { apiKey: undefined, apiBase: 'https://api.x.ai/v1', model: 'grok-3' }
          },
          build: {
            sourceMaps: false,
            bundleAnalyzer: false,
            chunkSizeLimit: 1000
          },
          monitoring: {
            performance: { enabled: true },
            errorTracking: { enabled: true },
            analytics: { enabled: true }
          }
        }

      default:
        return envConfig
    }
  }

  /**
   * 获取完整配置对象
   */
  getConfig(): AppConfig {
    return this.config
  }
}

/**
 * 全局配置管理器实例
 */
let globalConfigManager: ConfigManager | null = null

/**
 * 获取全局配置管理器
 */
export function getConfigManager(): ConfigManager {
  if (!globalConfigManager) {
    const environment = (process.env.NODE_ENV || 'development') as Environment
    globalConfigManager = new ConfigManager(environment)
  }
  return globalConfigManager
}

/**
 * 初始化配置管理器
 */
export async function initializeConfig(environment?: Environment): Promise<AppConfig> {
  if (environment) {
    globalConfigManager = new ConfigManager(environment)
  } else if (!globalConfigManager) {
    const env = (process.env.NODE_ENV || 'development') as Environment
    globalConfigManager = new ConfigManager(env)
  }

  return globalConfigManager.load()
}

/**
 * 获取配置值的便捷函数
 */
export function getConfig<T>(key: string): T | undefined {
  return getConfigManager().get<T>(key)
}

/**
 * 设置配置值的便捷函数
 */
export async function setConfig<T>(key: string, value: T): Promise<void> {
  return getConfigManager().set(key, value)
}

/**
 * 导出类型和默认值
 */
export * from '../types/config'