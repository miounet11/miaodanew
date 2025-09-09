export type Language = 'en' | 'zh-CN' | 'zh-TW' | 'id' | 'vn' | 'pl' | 'de'

export interface LogEntry {
  timestamp: string | number
  level: 'info' | 'warn' | 'error' | 'debug'
  target: string
  message: string
}

export type ErrorObject = {
  code?: string
  message: string
  details?: string
}
