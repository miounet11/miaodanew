import { Link } from '@tanstack/react-router'
import { route } from '@/constants/routes'
import { useTranslation } from '@/i18n/react-i18next-compat'
import { useState, useEffect } from 'react'
import {
  IconChevronDown,
  IconChevronRight,
  IconMenu2,
  IconX,
  IconSettings,
} from '@tabler/icons-react'
import { useMatches, useNavigate } from '@tanstack/react-router'
import { cn } from '@/lib/utils'

import { useModelProvider } from '@/hooks/useModelProvider'
import { getProviderTitle } from '@/lib/utils'
import ProvidersAvatar from '@/containers/ProvidersAvatar'
import { PlatformFeatures } from '@/lib/platform/const'
import { PlatformFeature } from '@/lib/platform/types'

const SettingsMenu = () => {
  const { t } = useTranslation()
  const [expandedProviders, setExpandedProviders] = useState(false)
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const matches = useMatches()
  const navigate = useNavigate()

  const { providers } = useModelProvider()

  // Filter providers that have active API keys (or are llama.cpp which doesn't need one)
  // On web: exclude llamacpp provider as it's not available
  const activeProviders = providers.filter((provider) => {
    if (!provider.active) return false
    
    // On web version, hide llamacpp provider
    if (!PlatformFeatures[PlatformFeature.LOCAL_INFERENCE] && provider.provider === 'llama.cpp') {
      return false
    }
    
    return true
  })

  // Check if current route has a providerName parameter and expand providers submenu
  useEffect(() => {
    const hasProviderName = matches.some(
      (match) =>
        match.routeId === '/settings/providers/$providerName' &&
        'providerName' in match.params
    )
    const isProvidersRoute = matches.some(
      (match) => match.routeId === '/settings/providers/'
    )
    if (hasProviderName || isProvidersRoute) {
      setExpandedProviders(true)
    }
  }, [matches])

  // Check if we're in the setup remote provider step
  const stepSetupRemoteProvider = matches.some(
    (match) =>
      match.search &&
      typeof match.search === 'object' &&
      'step' in match.search &&
      match.search.step === 'setup_remote_provider'
  )

  const menuSettings = [
    {
      title: 'common:general',
      route: route.settings.general,
      hasSubMenu: false,
      isEnabled: true,
    },
    {
      title: 'common:appearance',
      route: route.settings.appearance,
      hasSubMenu: false,
      isEnabled: true,
    },
    {
      title: 'common:privacy',
      route: route.settings.privacy,
      hasSubMenu: false,
      isEnabled: PlatformFeatures[PlatformFeature.ANALYTICS],
    },
    {
      title: 'common:modelProviders',
      route: route.settings.model_providers,
      hasSubMenu: activeProviders.length > 0,
      isEnabled: PlatformFeatures[PlatformFeature.MODEL_PROVIDER_SETTINGS],
    },
    {
      title: 'common:keyboardShortcuts',
      route: route.settings.shortcuts,
      hasSubMenu: false,
      isEnabled: true,
    },
    {
      title: 'common:hardware',
      route: route.settings.hardware,
      hasSubMenu: false,
      isEnabled: PlatformFeatures[PlatformFeature.HARDWARE_MONITORING],
    },
    {
      title: 'common:mcp-servers',
      route: route.settings.mcp_servers,
      hasSubMenu: false,
      isEnabled: PlatformFeatures[PlatformFeature.MCP_SERVERS],
    },
    {
      title: 'common:local_api_server',
      route: route.settings.local_api_server,
      hasSubMenu: false,
      isEnabled: PlatformFeatures[PlatformFeature.LOCAL_API_SERVER],
    },
    {
      title: 'common:https_proxy',
      route: route.settings.https_proxy,
      hasSubMenu: false,
      isEnabled: PlatformFeatures[PlatformFeature.HTTPS_PROXY],
    },
    {
      title: 'common:extensions',
      route: route.settings.extensions,
      hasSubMenu: false,
      isEnabled: PlatformFeatures[PlatformFeature.EXTENSION_MANAGEMENT],
    },
  ]

  const toggleProvidersExpansion = () => {
    setExpandedProviders(!expandedProviders)
  }

  const toggleMenu = () => {
    setIsMenuOpen(!isMenuOpen)
  }

  return (
    <>
      <button
        className="fixed top-4 right-4 sm:hidden size-8 cursor-pointer flex items-center justify-center rounded-lg hover:bg-main-view-fg/8 transition-all duration-200 ease-in-out data-[state=open]:bg-main-view-fg/10 z-20 shadow-sm"
        onClick={toggleMenu}
        aria-label="Toggle settings menu"
      >
        {isMenuOpen ? (
          <IconX size={20} className="text-main-view-fg relative z-20" />
        ) : (
          <IconMenu2 size={20} className="text-main-view-fg relative z-20" />
        )}
      </button>
      <div
        className={cn(
          'h-full w-56 shrink-0 bg-main-view/95 backdrop-blur-sm border-r border-main-view-fg/8',
          'sm:flex flex-col',
          isMenuOpen
            ? 'flex fixed sm:hidden top-0 z-10 h-full border-r-0 bg-main-view/98 backdrop-blur-md right-0 shadow-2xl'
            : 'hidden'
        )}
      >
        {/* Brand Header */}
        <div className="px-4 py-5 border-b border-main-view-fg/8">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl flex items-center justify-center shadow-lg">
              <IconSettings size={22} className="text-white" />
            </div>
            <div>
              <h2 className="text-lg font-bold tracking-wide text-blue-600 font-extrabold">
                Miaoda
              </h2>
              <p className="text-xs text-main-view-fg/60 font-medium">
                {t('common:settings')}
              </p>
            </div>
          </div>
        </div>
        
        {/* Navigation List */}
        <div className="flex-1 overflow-y-auto px-3 py-4">
          <div className="flex flex-col gap-1.5 w-full">
          {menuSettings.map((menu) => {
            if (!menu.isEnabled) {
              return null
            }
            return (
            <div key={menu.title}>
              <Link
                to={menu.route}
                className="group block px-3 py-2.5 cursor-pointer hover:bg-main-view-fg/8 w-full rounded-lg transition-all duration-200 ease-in-out [&.active]:bg-main-view-fg/10 [&.active]:shadow-sm relative overflow-hidden"
              >
                <div className="flex items-center justify-between relative z-10">
                  <span className="text-sm font-medium text-main-view-fg/85 group-hover:text-main-view-fg transition-colors duration-200">
                    {t(menu.title)}
                  </span>
                  {menu.hasSubMenu && (
                    <button
                      onClick={(e) => {
                        e.preventDefault()
                        e.stopPropagation()
                        toggleProvidersExpansion()
                      }}
                      className="text-main-view-fg/60 hover:text-main-view-fg/80 transition-all duration-200"
                    >
                      {expandedProviders ? (
                        <IconChevronDown size={16} className="transition-transform duration-200" />
                      ) : (
                        <IconChevronRight size={16} className="transition-transform duration-200" />
                      )}
                    </button>
                  )}
                </div>
              </Link>

              {/* Sub-menu for model providers */}
              {menu.hasSubMenu && expandedProviders && (
                <div className="ml-4 mt-2 space-y-1.5 first-step-setup-remote-provider animate-in slide-in-from-top-2 duration-200">
                  {activeProviders.map((provider) => {
                    const isActive = matches.some(
                      (match) =>
                        match.routeId === '/settings/providers/$providerName' &&
                        'providerName' in match.params &&
                        match.params.providerName === provider.provider
                    )

                    return (
                      <div key={provider.provider}>
                        <div
                          className={cn(
                            'group flex px-3 py-2 items-center gap-2.5 cursor-pointer hover:bg-main-view-fg/6 w-full rounded-lg transition-all duration-200 ease-in-out text-main-view-fg/75',
                            isActive && 'bg-main-view-fg/8 border-l-2 border-blue-500/50 shadow-sm',
                            // hidden for llama.cpp provider for setup remote provider
                            provider.provider === 'llama.cpp' &&
                              stepSetupRemoteProvider &&
                              'hidden'
                          )}
                          onClick={() =>
                            navigate({
                              to: route.settings.providers,
                              params: {
                                providerName: provider.provider,
                              },
                              ...(stepSetupRemoteProvider
                                ? { search: { step: 'setup_remote_provider' } }
                                : {}),
                            })
                          }
                        >
                          <ProvidersAvatar provider={provider} />
                          <div className="truncate flex-1">
                            <span className="text-xs font-medium group-hover:text-main-view-fg/90 transition-colors duration-200">
                              {getProviderTitle(provider.provider)}
                            </span>
                          </div>
                        </div>
                      </div>
                    )
                  })}
                </div>
              )}
            </div>
            )
          })}
          </div>
        </div>
      </div>
    </>
  )
}

export default SettingsMenu
