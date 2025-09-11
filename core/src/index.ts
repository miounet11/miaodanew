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
export * from './config'

/**
 * Declare global object
 */
declare global {
  var core: any | undefined
}
