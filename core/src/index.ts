/**
 * Export all types.
 * @module
 */
export * from './types'

/**
 * Export browser module
 * @module
 */
export * from './browser'

/**
 * Export config module
 * @module
 */
export { ConfigManager } from './config'
export type { AppConfiguration } from './types/config/appConfigEntity'

/**
 * Declare global object
 */
declare global {
  var core: any | undefined
}
