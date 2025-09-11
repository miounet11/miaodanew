/**
 * Web Extensions Package
 * Contains browser-compatible extensions for Miaoda AI
 */

import type { WebExtensionRegistry } from './types'

export { default as AssistantExtensionWeb } from './assistant-web'
export { default as ConversationalExtensionWeb } from './conversational-web'
export { default as MiaodaProviderWeb } from './miaoda-provider-web'

// Re-export types
export type { 
  WebExtensionRegistry, 
  WebExtensionModule,
  WebExtensionName,
  WebExtensionLoader,
  AssistantWebModule,
  ConversationalWebModule,
  MiaodaProviderWebModule
} from './types'

// Extension registry for dynamic loading
export const WEB_EXTENSIONS: WebExtensionRegistry = {
  'assistant-web': () => import('./assistant-web'),
  'conversational-web': () => import('./conversational-web'),
  'miaoda-provider-web': () => import('./miaoda-provider-web'),
}