import { ExtensionManager } from '@/lib/extension'
import { APIs } from '@/lib/service'
import { EventEmitter } from '@/services/events/EventEmitter'
import { EngineManager, ModelManager } from '@miaoda/core'
import { PropsWithChildren, useCallback, useEffect, useState } from 'react'

export function ExtensionProvider({ children }: PropsWithChildren) {
  const [finishedSetup, setFinishedSetup] = useState(false)
  const setupExtensions = useCallback(async () => {
    try {
      // Setup core window object for both platforms
      window.core = {
        api: APIs,
      }

      window.core.events = new EventEmitter()
      window.core.extensionManager = new ExtensionManager()
      window.core.engineManager = new EngineManager()
      window.core.modelManager = new ModelManager()

      // Register extensions - same pattern for both platforms
      console.log('Starting extension registration...')
      await ExtensionManager.getInstance().registerActive()
      console.log('Extensions registered, calling load...')
      await ExtensionManager.getInstance().load()
      console.log('Extensions loaded, setting finishedSetup to true')
      setFinishedSetup(true)
    } catch (error) {
      console.error('Failed to setup extensions:', error)
      // Still set finishedSetup to true to avoid blocking the UI
      setFinishedSetup(true)
    }
  }, [])

  useEffect(() => {
    setupExtensions()

    return () => {
      ExtensionManager.getInstance().unload()
    }
  }, [setupExtensions])

  return <>{finishedSetup && children}</>
}
