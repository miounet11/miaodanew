/**
 * Miaoda 配置类型定义
 * 提供类型安全的配置管理
 */

/**
 * 环境类型
 */
export type Environment = 'development' | 'test' | 'production'

/**
 * 日志级别
 */
export type LogLevel = 'debug' | 'info' | 'warn' | 'error'

/**
 * 主题类型
 */
export type Theme = 'light' | 'dark' | 'auto'

/**
 * 语言类型
 */
export type Locale = 'zh-CN' | 'en-US' | 'ja-JP'

/**
 * Llamacpp 后端类型
 */
export type LlamacppBackend = 'auto' | 'cpu' | 'cuda' | 'opencl' | 'metal'

/**
 * 基础应用配置
 */
export interface BaseConfig {
  appName: string
  appVersion: string
  environment: Environment
  nodeEnv: Environment
  port: number
  tauriDevHost?: string
  isTauri: boolean
  isClean: boolean
}

/**
 * 外部服务配置
 */
export interface ExternalServicesConfig {
  // PostHog 分析服务
  posthog: {
    key?: string
    host?: string
  }
  
  // 模型目录服务
  modelCatalogUrl: string
  
  // OpenAI API 配置
  openai: {
    apiKey?: string
    apiBase: string
    model: string
  }
  
  // Grok API 配置
  grok: {
    apiKey?: string
    apiBase: string
    model: string
  }
  
  // 自动更新服务
  updater: {
    disabled: boolean
    endpoint?: string
  }
}

/**
 * UI 和用户体验配置
 */
export interface UIConfig {
  // 主题配置
  theme: {
    default: Theme
    syncOS: boolean
  }
  
  // 国际化配置
  locale: {
    default: Locale
    fallback: Locale
  }
  
  // 窗口配置
  window: {
    width: number
    height: number
    minWidth: number
    minHeight: number
  }
}

/**
 * 开发工具配置
 */
export interface DevToolsConfig {
  // 日志配置
  logging: {
    level: LogLevel
    enableConsole: boolean
    file?: string
  }
  
  // 调试配置
  debug: {
    enabled: boolean
    enableDevTools: boolean
  }
  
  // 热重载配置
  hmr: {
    enabled: boolean
    port: number
  }
  
  // 代码质量工具
  quality: {
    eslint: boolean
    prettier: boolean
    typeCheck: boolean
  }
}

/**
 * 构建配置
 */
export interface BuildConfig {
  // 构建优化
  bundleAnalyzer: boolean
  sourceMaps: boolean
  chunkSizeLimit: number
  
  // 目标配置
  target?: string
  features?: string
  cargoTarget?: string
}

/**
 * 网络配置
 */
export interface NetworkConfig {
  // 超时配置
  networkTimeout: number
  requestTimeout: number
  
  // 代理配置
  proxy?: {
    http?: string
    https?: string
    username?: string
    password?: string
  }
}

/**
 * 安全配置
 */
export interface SecurityConfig {
  // Tauri 签名配置
  signing?: {
    privateKey?: string
    privateKeyPassword?: string
  }
}

/**
 * 性能配置
 */
export interface PerformanceConfig {
  memoryLimit?: number
  cpuThreads: number
  cacheSize: number
}

/**
 * 扩展系统配置
 */
export interface ExtensionsConfig {
  // MCP 服务器配置
  mcp: {
    enabled: boolean
    registryUrl?: string
    autoInstall: boolean
  }
  
  // Llamacpp 扩展配置
  llamacpp: {
    backend: LlamacppBackend
    threads: number
    gpuLayers: number
  }
}

/**
 * 存储配置
 */
export interface StorageConfig {
  dataDir?: string
  modelsDir?: string
  extensionsDir?: string
}

/**
 * 测试配置
 */
export interface TestConfig {
  timeout: number
  coverageThreshold: number
  enableE2E: boolean
  
  // ReportPortal 配置
  reportPortal?: {
    enabled: boolean
    token?: string
    endpoint?: string
    project: string
    launch: string
  }
}

/**
 * 监控配置
 */
export interface MonitoringConfig {
  // 性能监控
  performance: {
    enabled: boolean
    apiKey?: string
  }
  
  // 错误追踪
  errorTracking: {
    enabled: boolean
    dsn?: string
  }
  
  // 使用统计
  analytics: {
    enabled: boolean
    endpoint?: string
  }
}

/**
 * CI/CD 配置
 */
export interface CICDConfig {
  // GitHub 配置
  github: {
    token?: string
    releaseDraft: boolean
    releasePrerelease: boolean
  }
}

/**
 * 完整的应用配置
 */
export interface AppConfig {
  base: BaseConfig
  external: ExternalServicesConfig
  ui: UIConfig
  devTools: DevToolsConfig
  build: BuildConfig
  network: NetworkConfig
  security: SecurityConfig
  performance: PerformanceConfig
  extensions: ExtensionsConfig
  storage: StorageConfig
  test: TestConfig
  monitoring: MonitoringConfig
  cicd: CICDConfig
}

/**
 * 配置验证错误
 */
export interface ConfigValidationError {
  field: string
  message: string
  severity: 'error' | 'warning'
}

/**
 * 配置验证结果
 */
export interface ConfigValidationResult {
  isValid: boolean
  errors: ConfigValidationError[]
  warnings: ConfigValidationError[]
}

/**
 * 配置变更事件
 */
export interface ConfigChangeEvent {
  key: string
  oldValue: unknown
  newValue: unknown
  timestamp: number
}

/**
 * 配置管理器接口
 */
export interface ConfigManager {
  /**
   * 加载配置
   */
  load(): Promise<AppConfig>
  
  /**
   * 获取配置值
   */
  get<T>(key: string): T | undefined
  
  /**
   * 设置配置值
   */
  set<T>(key: string, value: T): Promise<void>
  
  /**
   * 验证配置
   */
  validate(config: Partial<AppConfig>): ConfigValidationResult
  
  /**
   * 重新加载配置
   */
  reload(): Promise<AppConfig>
  
  /**
   * 监听配置变更
   */
  onChange(callback: (event: ConfigChangeEvent) => void): () => void
  
  /**
   * 获取环境特定配置
   */
  getEnvironmentConfig(env: Environment): Partial<AppConfig>
}

/**
 * 配置默认值
 */
export const DEFAULT_CONFIG: AppConfig = {
  base: {
    appName: 'miaoda',
    appVersion: '0.6.599',
    environment: 'development',
    nodeEnv: 'development',
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
      disabled: false,
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
      level: 'info',
      enableConsole: true
    },
    debug: {
      enabled: false,
      enableDevTools: false
    },
    hmr: {
      enabled: true,
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
    sourceMaps: false,
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
      autoInstall: false
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
    coverageThreshold: 80,
    enableE2E: false,
    reportPortal: {
      enabled: false,
      project: 'miaoda',
      launch: 'miaoda-tests'
    }
  },
  
  monitoring: {
    performance: {
      enabled: false
    },
    errorTracking: {
      enabled: false
    },
    analytics: {
      enabled: false
    }
  },
  
  cicd: {
    github: {
      releaseDraft: false,
      releasePrerelease: false
    }
  }
}