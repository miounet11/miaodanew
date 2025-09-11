#!/usr/bin/env node

/**
 * Miaoda 配置验证脚本
 * 用于在构建前验证配置的完整性和正确性
 */

import ConfigManager from './config-manager.mjs'
import fs from 'fs/promises'
import path from 'path'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)
const ROOT_DIR = path.resolve(__dirname, '..')

/**
 * 配置验证器
 */
class ConfigValidator {
  constructor() {
    this.errors = []
    this.warnings = []
    this.manager = new ConfigManager()
  }

  /**
   * 验证所有环境的配置
   */
  async validateAllEnvironments() {
    const environments = ['development', 'test', 'production']
    let allValid = true

    console.log('🔍 开始验证所有环境配置...\n')

    for (const env of environments) {
      console.log(`📋 验证 ${env} 环境配置:`)
      console.log('─'.repeat(50))

      try {
        // 加载环境配置
        await this.manager.loadConfig(env)
        
        // 基础验证
        const validation = this.manager.validateConfig()
        
        if (!validation.isValid) {
          allValid = false
          console.error(`❌ ${env} 环境配置验证失败:`)
          validation.errors.forEach(error => {
            console.error(`  - ${error.field}: ${error.message}`)
          })
        } else {
          console.log(`✅ ${env} 环境配置验证通过`)
        }

        // 显示警告
        if (validation.warnings.length > 0) {
          console.warn(`⚠️  ${env} 环境配置警告:`)
          validation.warnings.forEach(warning => {
            console.warn(`  - ${warning.field}: ${warning.message}`)
          })
        }

        // 环境特定验证
        await this.validateEnvironmentSpecific(env)

      } catch (error) {
        allValid = false
        console.error(`❌ ${env} 环境配置加载失败:`, error.message)
      }

      console.log() // 空行分隔
    }

    return allValid
  }

  /**
   * 环境特定验证
   */
  async validateEnvironmentSpecific(environment) {
    switch (environment) {
      case 'production':
        await this.validateProductionConfig()
        break
      case 'development':
        await this.validateDevelopmentConfig()
        break
      case 'test':
        await this.validateTestConfig()
        break
    }
  }

  /**
   * 生产环境特定验证
   */
  async validateProductionConfig() {
    const checks = [
      {
        key: 'AUTO_UPDATER_DISABLED',
        expected: false,
        message: '生产环境应该启用自动更新'
      },
      {
        key: 'DEBUG_MODE',
        expected: false,
        message: '生产环境不应启用调试模式'
      },
      {
        key: 'ENABLE_CONSOLE_LOG',
        expected: false,
        message: '生产环境不应启用控制台日志'
      },
      {
        key: 'LOG_LEVEL',
        expected: 'info',
        message: '生产环境日志级别应为 info'
      },
      {
        key: 'ENABLE_SOURCE_MAPS',
        expected: false,
        message: '生产环境不应启用 Source Maps'
      }
    ]

    for (const check of checks) {
      const value = this.manager.get(check.key)
      if (value !== check.expected) {
        console.warn(`  ⚠️  生产环境建议: ${check.message} (当前: ${value})`)
      }
    }

    // 检查必需的生产环境密钥
    const requiredKeys = [
      'POSTHOG_KEY',
      'TAURI_SIGNING_PRIVATE_KEY'
    ]

    for (const key of requiredKeys) {
      const value = this.manager.get(key)
      if (!value) {
        console.warn(`  ⚠️  生产环境缺少配置: ${key}`)
      }
    }
  }

  /**
   * 开发环境特定验证
   */
  async validateDevelopmentConfig() {
    const checks = [
      {
        key: 'AUTO_UPDATER_DISABLED',
        expected: true,
        message: '开发环境应该禁用自动更新'
      },
      {
        key: 'DEBUG_MODE',
        expected: true,
        message: '开发环境应该启用调试模式'
      },
      {
        key: 'ENABLE_CONSOLE_LOG',
        expected: true,
        message: '开发环境应该启用控制台日志'
      },
      {
        key: 'LOG_LEVEL',
        expected: 'debug',
        message: '开发环境日志级别应为 debug'
      }
    ]

    for (const check of checks) {
      const value = this.manager.get(check.key)
      if (value !== check.expected) {
        console.warn(`  ⚠️  开发环境建议: ${check.message} (当前: ${value})`)
      }
    }
  }

  /**
   * 测试环境特定验证
   */
  async validateTestConfig() {
    const checks = [
      {
        key: 'AUTO_UPDATER_DISABLED',
        expected: true,
        message: '测试环境应该禁用自动更新'
      },
      {
        key: 'MCP_ENABLED',
        expected: false,
        message: '测试环境通常禁用 MCP 服务'
      },
      {
        key: 'ENABLE_E2E_TESTS',
        expected: true,
        message: '测试环境应该启用 E2E 测试'
      }
    ]

    for (const check of checks) {
      const value = this.manager.get(check.key)
      if (value !== check.expected) {
        console.warn(`  ⚠️  测试环境建议: ${check.message} (当前: ${value})`)
      }
    }
  }

  /**
   * 验证配置文件是否存在
   */
  async validateConfigFiles() {
    console.log('📁 验证配置文件:')
    console.log('─'.repeat(30))

    const requiredFiles = [
      { file: '.env.example', required: true, description: '配置模板文件' },
      { file: '.env.development', required: true, description: '开发环境配置' },
      { file: '.env.test', required: true, description: '测试环境配置' },
      { file: '.env.production', required: true, description: '生产环境配置' },
      { file: '.env.local', required: false, description: '本地覆盖配置' }
    ]

    let allExist = true

    for (const { file, required, description } of requiredFiles) {
      const filePath = path.join(ROOT_DIR, file)
      
      try {
        await fs.access(filePath)
        console.log(`✅ ${file} - ${description}`)
      } catch {
        if (required) {
          allExist = false
          console.error(`❌ ${file} - ${description} (必需)`)
        } else {
          console.log(`⚪ ${file} - ${description} (可选，未找到)`)
        }
      }
    }

    console.log()
    return allExist
  }

  /**
   * 验证 .gitignore 配置
   */
  async validateGitignore() {
    console.log('🔒 验证 .gitignore 配置:')
    console.log('─'.repeat(30))

    const gitignorePath = path.join(ROOT_DIR, '.gitignore')
    
    try {
      const content = await fs.readFile(gitignorePath, 'utf8')
      const lines = content.split('\n').map(line => line.trim())

      const requiredPatterns = [
        '.env',
        '.env.local',
        '**/.env',
        '**/.env.*'
      ]

      let allProtected = true

      for (const pattern of requiredPatterns) {
        const isProtected = lines.some(line => 
          line === pattern || 
          (pattern.startsWith('**/') && lines.includes(pattern.substring(3)))
        )

        if (isProtected) {
          console.log(`✅ ${pattern} - 已保护`)
        } else {
          allProtected = false
          console.warn(`⚠️  ${pattern} - 未在 .gitignore 中保护`)
        }
      }

      console.log()
      return allProtected

    } catch (error) {
      console.error('❌ 无法读取 .gitignore 文件:', error.message)
      console.log()
      return false
    }
  }

  /**
   * 生成配置报告
   */
  async generateReport() {
    console.log('📊 生成配置报告:')
    console.log('─'.repeat(30))

    const environments = ['development', 'test', 'production']
    const report = {
      timestamp: new Date().toISOString(),
      environments: {},
      summary: {
        total: 0,
        valid: 0,
        warnings: 0,
        errors: 0
      }
    }

    for (const env of environments) {
      try {
        await this.manager.loadConfig(env)
        const validation = this.manager.validateConfig()
        const config = this.manager.generateAppConfig()

        report.environments[env] = {
          isValid: validation.isValid,
          errors: validation.errors,
          warnings: validation.warnings,
          keyCount: Object.keys(this.manager.config).length,
          config: this.sanitizeConfig(config)
        }

        report.summary.total++
        if (validation.isValid) {
          report.summary.valid++
        }
        report.summary.warnings += validation.warnings.length
        report.summary.errors += validation.errors.length

      } catch (error) {
        report.environments[env] = {
          isValid: false,
          error: error.message,
          keyCount: 0
        }
        report.summary.total++
        report.summary.errors++
      }
    }

    // 保存报告
    const reportPath = path.join(ROOT_DIR, 'config-report.json')
    await fs.writeFile(reportPath, JSON.stringify(report, null, 2))
    
    console.log(`✅ 配置报告已保存到: ${reportPath}`)
    console.log(`📈 总结: ${report.summary.valid}/${report.summary.total} 环境有效`)
    console.log(`⚠️  警告: ${report.summary.warnings} 个`)
    console.log(`❌ 错误: ${report.summary.errors} 个`)
    console.log()

    return report
  }

  /**
   * 清理敏感信息用于报告
   */
  sanitizeConfig(config) {
    const sensitive = [
      'POSTHOG_KEY',
      'OPENAI_API_KEY', 
      'GROK_API_KEY',
      'RP_TOKEN',
      'TAURI_SIGNING_PRIVATE_KEY',
      'TAURI_SIGNING_PRIVATE_KEY_PASSWORD',
      'GITHUB_TOKEN',
      'PROXY_PASSWORD',
      'PERFORMANCE_API_KEY',
      'ERROR_TRACKING_DSN'
    ]

    const sanitized = JSON.parse(JSON.stringify(config))
    
    function maskSensitive(obj) {
      for (const [key, value] of Object.entries(obj)) {
        if (typeof value === 'object' && value !== null) {
          maskSensitive(value)
        } else if (typeof value === 'string' && value) {
          // 检查是否是敏感字段
          const isSensitive = sensitive.some(pattern => 
            key.toUpperCase().includes(pattern) ||
            pattern.includes(key.toUpperCase())
          )
          
          if (isSensitive) {
            obj[key] = value.length > 0 ? '***masked***' : ''
          }
        }
      }
    }

    maskSensitive(sanitized)
    return sanitized
  }
}

// CLI 接口
if (import.meta.url === `file://${process.argv[1]}`) {
  const validator = new ConfigValidator()

  async function main() {
    const command = process.argv[2] || 'all'

    try {
      switch (command) {
        case 'all':
          console.log('🚀 Miaoda 配置验证器\n')
          
          const filesValid = await validator.validateConfigFiles()
          const gitignoreValid = await validator.validateGitignore()
          const configsValid = await validator.validateAllEnvironments()
          
          await validator.generateReport()
          
          const allValid = filesValid && gitignoreValid && configsValid
          
          console.log('🎯 验证完成!')
          console.log('─'.repeat(30))
          console.log(`配置文件: ${filesValid ? '✅' : '❌'}`)
          console.log(`Gitignore: ${gitignoreValid ? '✅' : '⚠️'}`)
          console.log(`环境配置: ${configsValid ? '✅' : '❌'}`)
          console.log(`总体状态: ${allValid ? '✅ 通过' : '❌ 失败'}`)
          
          process.exit(allValid ? 0 : 1)
          break

        case 'files':
          await validator.validateConfigFiles()
          break

        case 'gitignore':
          await validator.validateGitignore()
          break

        case 'environments':
          const valid = await validator.validateAllEnvironments()
          process.exit(valid ? 0 : 1)
          break

        case 'report':
          await validator.generateReport()
          break

        default:
          console.log(`
使用方法: node validate-config.mjs <command>

命令:
  all           完整验证 (默认)
  files         验证配置文件存在性
  gitignore     验证 .gitignore 保护
  environments  验证所有环境配置
  report        生成配置报告

示例:
  node validate-config.mjs
  node validate-config.mjs environments
  node validate-config.mjs report
          `)
          break
      }
    } catch (error) {
      console.error('❌ 验证失败:', error.message)
      console.error(error.stack)
      process.exit(1)
    }
  }

  main()
}

export default ConfigValidator