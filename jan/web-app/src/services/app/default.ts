/**
 * Default App Service - Generic implementation with minimal returns
 */

import type { AppService, LogEntry } from './types'

export class DefaultAppService implements AppService {
  async factoryReset(): Promise<void> {
    // No-op
  }

  async readLogs(): Promise<LogEntry[]> {
    return []
  }

  parseLogLine(line: string): LogEntry {
    return {
      timestamp: Date.now(),
      level: 'info',
      target: 'default',
      message: line ?? '',
    }
  }

  async getMiaodaDataFolder(): Promise<string | undefined> {
    return undefined
  }

  async relocateMiaodaDataFolder(path: string): Promise<void> {
    console.log('relocateMiaodaDataFolder called with path:', path)
    // No-op - not implemented in default service
  }

  async getServerStatus(): Promise<boolean> {
    return false
  }

  async readYaml<T = unknown>(path: string): Promise<T> {
    console.log('readYaml called with path:', path)
    throw new Error('readYaml not implemented in default app service')
  }
}