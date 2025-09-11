/**
 * Web Extension Types
 */

import type { AssistantExtension, ConversationalExtension, BaseExtension, AIEngine } from '@miaoda/core'

type ExtensionConstructorParams = ConstructorParameters<typeof BaseExtension>

export interface AssistantWebModule {
  default: new (...args: ExtensionConstructorParams) => AssistantExtension
}

export interface ConversationalWebModule {
  default: new (...args: ExtensionConstructorParams) => ConversationalExtension
}

export interface MiaodaProviderWebModule {
  default: new (...args: ExtensionConstructorParams) => AIEngine
}

export type WebExtensionModule = AssistantWebModule | ConversationalWebModule | MiaodaProviderWebModule

export interface WebExtensionRegistry {
  'assistant-web': () => Promise<AssistantWebModule>
  'conversational-web': () => Promise<ConversationalWebModule>
  'miaoda-provider-web': () => Promise<MiaodaProviderWebModule>
}

export type WebExtensionName = keyof WebExtensionRegistry

export type WebExtensionLoader<T extends WebExtensionName> = WebExtensionRegistry[T]

export interface IndexedDBConfig {
  dbName: string
  version: number
  stores: {
    name: string
    keyPath: string
    indexes?: { name: string; keyPath: string | string[]; unique?: boolean }[]
  }[]
}