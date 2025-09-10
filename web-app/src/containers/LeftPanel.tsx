import { Link, useNavigate, useRouterState } from '@tanstack/react-router'
import { useLeftPanel } from '@/hooks/useLeftPanel'
import { cn } from '@/lib/utils'
import {
  IconLayoutSidebar,
  IconDots,
  IconCirclePlusFilled,
  IconSettings,
  IconTrash,
  IconStar,
  IconMessageFilled,
  IconApps,
  IconX,
  IconSearch,
  IconClipboardSmile,
} from '@tabler/icons-react'
import { route } from '@/constants/routes'
import ThreadList from './ThreadList'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'

import { useThreads } from '@/hooks/useThreads'

import { useTranslation } from '@/i18n/react-i18next-compat'
import { useMemo, useState, useEffect, useRef } from 'react'
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { toast } from 'sonner'
import { DownloadManagement } from '@/containers/DownloadManegement'
import { useSmallScreen } from '@/hooks/useMediaQuery'
import { useClickOutside } from '@/hooks/useClickOutside'
import { useDownloadStore } from '@/hooks/useDownloadStore'
import { PlatformFeatures } from '@/lib/platform/const'
import { PlatformFeature } from '@/lib/platform/types'

const LeftPanel = () => {
  const mainMenus = [
    {
      title: 'common:assistants',
      icon: IconClipboardSmile,
      route: route.assistant,
      isEnabled: true,
    },
    {
      title: 'common:hub',
      icon: IconApps,
      route: route.hub.index,
      isEnabled: PlatformFeatures[PlatformFeature.MODEL_HUB],
    },
    {
      title: 'common:settings',
      icon: IconSettings,
      route: route.settings.general,
      isEnabled: true,
    },
  ]
  
  const { open, setLeftPanel } = useLeftPanel()
  const { t } = useTranslation()
  const navigate = useNavigate()
  const [searchTerm, setSearchTerm] = useState('')

  const isSmallScreen = useSmallScreen()
  const prevScreenSizeRef = useRef<boolean | null>(null)
  const isInitialMountRef = useRef(true)
  const panelRef = useRef<HTMLElement>(null)
  const searchContainerRef = useRef<HTMLDivElement>(null)
  const searchContainerMacRef = useRef<HTMLDivElement>(null)

  // Determine if we're in a resizable context (large screen with panel open)
  const isResizableContext = !isSmallScreen && open

  // Use click outside hook for panel with debugging
  useClickOutside(
    () => {
      if (isSmallScreen && open) {
        setLeftPanel(false)
      }
    },
    null,
    [
      panelRef.current,
      searchContainerRef.current,
      searchContainerMacRef.current,
    ]
  )

  // Auto-collapse panel only when window is resized
  useEffect(() => {
    const handleResize = () => {
      const currentIsSmallScreen = window.innerWidth <= 768

      // Skip on initial mount
      if (isInitialMountRef.current) {
        isInitialMountRef.current = false
        prevScreenSizeRef.current = currentIsSmallScreen
        return
      }

      // Only trigger if the screen size actually changed
      if (
        prevScreenSizeRef.current !== null &&
        prevScreenSizeRef.current !== currentIsSmallScreen
      ) {
        if (currentIsSmallScreen) {
          setLeftPanel(false)
        } else {
          setLeftPanel(true)
        }
        prevScreenSizeRef.current = currentIsSmallScreen
      }
    }

    // Add resize listener
    window.addEventListener('resize', handleResize)

    // Initialize the previous screen size on mount
    if (isInitialMountRef.current) {
      prevScreenSizeRef.current = window.innerWidth <= 768
      isInitialMountRef.current = false
    }

    return () => {
      window.removeEventListener('resize', handleResize)
    }
  }, [setLeftPanel])

  const currentPath = useRouterState({
    select: (state) => state.location.pathname,
  })

  const { deleteAllThreads, unstarAllThreads, getFilteredThreads, threads } =
    useThreads()

  const filteredThreads = useMemo(() => {
    return getFilteredThreads(searchTerm)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [getFilteredThreads, searchTerm, threads])

  // Memoize categorized threads based on filteredThreads
  const favoritedThreads = useMemo(() => {
    return filteredThreads.filter((t) => t.isFavorite)
  }, [filteredThreads])

  const unFavoritedThreads = useMemo(() => {
    return filteredThreads.filter((t) => !t.isFavorite)
  }, [filteredThreads])

  // Disable body scroll when panel is open on small screens
  useEffect(() => {
    if (isSmallScreen && open) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = ''
    }

    return () => {
      document.body.style.overflow = ''
    }
  }, [isSmallScreen, open])

  const { downloads, localDownloadingModels } = useDownloadStore()

  return (
    <>
      {/* Backdrop overlay for small screens */}
      {isSmallScreen && open && (
        <div
          className="fixed inset-0 bg-black/50 backdrop-blur z-30"
          onClick={(e) => {
            // Don't close if clicking on search container or if currently searching
            if (
              searchContainerRef.current?.contains(e.target as Node) ||
              searchContainerMacRef.current?.contains(e.target as Node)
            ) {
              return
            }
            setLeftPanel(false)
          }}
        />
      )}
      <aside
        ref={panelRef}
        className={cn(
          'text-left-panel-fg overflow-hidden flex flex-col',
          // Resizable context: full height and width, no margins
          isResizableContext && 'h-full w-full',
          // Small screen context: fixed positioning and styling
          isSmallScreen &&
            'fixed h-[calc(100%-16px)] bg-app z-50 rounded-sm border border-left-panel-fg/10 m-2 px-1 w-48',
          // Default context: original styling
          !isResizableContext &&
            !isSmallScreen &&
            'w-48 shrink-0 rounded-lg m-1.5 mr-0 h-full',
          // Visibility controls
          open
            ? 'opacity-100 visibility-visible'
            : 'w-0 absolute -top-100 -left-100 visibility-hidden pointer-events-none'
        )}
      >
        {/* macOS 窗口控制按钮占位 */}
        {IS_MACOS && (
          <div className="h-8" />
        )}
        
        {/* 顶部区域 - Logo 和收起按钮 */}
        <div className="flex items-center justify-between px-2 py-2">
          {/* Miaoda Logo */}
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 bg-gradient-to-br from-blue-500 to-blue-600 rounded-lg flex items-center justify-center shadow-lg">
              <span className="text-white font-bold text-xs">M</span>
            </div>
            <span className="text-left-panel-fg font-bold text-base tracking-wide">Miaoda</span>
          </div>
          
          {/* 收起按钮 */}
          <button
            className=""
            onClick={() => setLeftPanel(!open)}
          >
            <div className="size-6 cursor-pointer flex items-center justify-center rounded hover:bg-left-panel-fg/10 transition-all duration-200 ease-in-out data-[state=open]:bg-left-panel-fg/10">
              <IconLayoutSidebar size={18} className="text-left-panel-fg" />
            </div>
          </button>
        </div>
        
        {/* 搜索框 */}
        <div className="relative">
          {!IS_MACOS && (
            <div
              ref={searchContainerRef}
              className="px-2 py-2"
              data-ignore-outside-clicks
            >
              <div className="relative">
                <IconSearch className="absolute size-4 top-1/2 left-2 -translate-y-1/2 text-left-panel-fg/50" />
                <input
                  type="text"
                  placeholder={t('common:search')}
                  className="w-full pl-7 pr-8 py-1.5 bg-left-panel-fg/10 rounded-md text-left-panel-fg focus:outline-none focus:ring-1 focus:ring-left-panel-fg/20"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
                {searchTerm && (
                  <button
                    className="absolute right-2 top-1/2 -translate-y-1/2 text-left-panel-fg/70 hover:text-left-panel-fg"
                    onClick={(e) => {
                      e.preventDefault()
                      e.stopPropagation()
                      setSearchTerm('')
                    }}
                  >
                    <IconX size={14} />
                  </button>
                )}
              </div>
            </div>
          )}
        </div>

        {/* 对话列表区域 */}
        <div className="flex flex-col overflow-hidden flex-1">
          <div className="flex flex-col flex-1 overflow-hidden">
            {IS_MACOS && (
              <div
                ref={searchContainerMacRef}
                className="px-2 py-2"
                data-ignore-outside-clicks
              >
                <div className="relative">
                  <IconSearch className="absolute size-4 top-1/2 left-2 -translate-y-1/2 text-left-panel-fg/50" />
                  <input
                    type="text"
                    placeholder={t('common:search')}
                    className="w-full pl-7 pr-8 py-1.5 bg-left-panel-fg/10 rounded-md text-left-panel-fg focus:outline-none focus:ring-1 focus:ring-left-panel-fg/20"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                  />
                  {searchTerm && (
                    <button
                      data-ignore-outside-clicks
                      className="absolute right-2 top-1/2 -translate-y-1/2 text-left-panel-fg/70 hover:text-left-panel-fg"
                      onClick={(e) => {
                        e.preventDefault()
                        e.stopPropagation()
                        setSearchTerm('')
                      }}
                    >
                      <IconX size={14} />
                    </button>
                  )}
                </div>
              </div>
            )}
            
            {/* 新建聊天按钮 - 放在搜索框下面 */}
            <div className="px-2 pb-2">
              <Link
                to={route.home}
                onClick={() => {
                  isSmallScreen && setLeftPanel(false)
                }}
                className="relative flex items-center justify-center gap-2 w-full py-2 px-3 bg-gradient-to-r from-left-panel-fg/5 to-left-panel-fg/10 hover:from-left-panel-fg/10 hover:to-left-panel-fg/15 text-left-panel-fg border border-left-panel-fg/20 hover:border-left-panel-fg/30 rounded-md transition-all duration-200 group shadow-sm hover:shadow-md"
              >
                <div className="absolute inset-0 rounded-md bg-gradient-to-r from-transparent via-left-panel-fg/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                <IconCirclePlusFilled size={18} className="relative text-left-panel-fg/70 group-hover:text-left-panel-fg transition-colors" />
                <span className="relative font-medium text-sm">{t('common:newChat')}</span>
              </Link>
            </div>
            <div className="flex flex-col flex-1 w-full overflow-y-auto overflow-x-hidden">
              <div className="flex-1 w-full overflow-y-auto">
                {favoritedThreads.length > 0 && (
                  <>
                    <div className="flex items-center justify-between mb-2">
                      <span className="block text-xs text-left-panel-fg/50 px-1 font-semibold sticky top-0">
                        {t('common:favorites')}
                      </span>
                      <div className="relative">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <button className="size-6 flex cursor-pointer items-center justify-center rounded hover:bg-left-panel-fg/10 transition-all duration-200 ease-in-out data-[state=open]:bg-left-panel-fg/10">
                              <IconDots
                                size={18}
                                className="text-left-panel-fg/60"
                              />
                            </button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent side="bottom" align="end">
                            <DropdownMenuItem
                              onClick={() => {
                                unstarAllThreads()
                                toast.success(
                                  t('common:toast.allThreadsUnfavorited.title'),
                                  {
                                    id: 'unfav-all-threads',
                                    description: t(
                                      'common:toast.allThreadsUnfavorited.description'
                                    ),
                                  }
                                )
                              }}
                            >
                              <IconStar size={16} />
                              <span>{t('common:unstarAll')}</span>
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                    </div>
                    <div className="flex flex-col mb-4">
                      <ThreadList
                        threads={favoritedThreads}
                        isFavoriteSection={true}
                      />
                      {favoritedThreads.length === 0 && (
                        <p className="text-xs text-left-panel-fg/50 px-1 font-semibold">
                          {t('chat.status.empty', { ns: 'chat' })}
                        </p>
                      )}
                    </div>
                  </>
                )}

                {unFavoritedThreads.length > 0 && (
                  <div className="flex items-center justify-between mb-2">
                    <span className="block text-xs text-left-panel-fg/50 px-1 font-semibold">
                      {t('common:recents')}
                    </span>
                    <div className="relative">
                      <Dialog>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <button
                              className="size-6 flex cursor-pointer items-center justify-center rounded hover:bg-left-panel-fg/10 transition-all duration-200 ease-in-out data-[state=open]:bg-left-panel-fg/10"
                              onClick={(e) => {
                                e.preventDefault()
                                e.stopPropagation()
                              }}
                            >
                              <IconDots
                                size={18}
                                className="text-left-panel-fg/60"
                              />
                            </button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent side="bottom" align="end">
                            <DialogTrigger asChild>
                              <DropdownMenuItem
                                onSelect={(e) => e.preventDefault()}
                              >
                                <IconTrash size={16} />
                                <span>{t('common:deleteAll')}</span>
                              </DropdownMenuItem>
                            </DialogTrigger>
                            <DialogContent>
                              <DialogHeader>
                                <DialogTitle>
                                  {t('common:dialogs.deleteAllThreads.title')}
                                </DialogTitle>
                                <DialogDescription>
                                  {t(
                                    'common:dialogs.deleteAllThreads.description'
                                  )}
                                </DialogDescription>
                                <DialogFooter className="mt-2">
                                  <DialogClose asChild>
                                    <Button
                                      variant="link"
                                      size="sm"
                                      className="hover:no-underline"
                                    >
                                      {t('common:cancel')}
                                    </Button>
                                  </DialogClose>
                                  <Button
                                    variant="destructive"
                                    size="sm"
                                    onClick={() => {
                                      deleteAllThreads()
                                      toast.success(
                                        t(
                                          'common:toast.deleteAllThreads.title'
                                        ),
                                        {
                                          id: 'delete-all-thread',
                                          description: t(
                                            'common:toast.deleteAllThreads.description'
                                          ),
                                        }
                                      )
                                      setTimeout(() => {
                                        navigate({ to: route.home })
                                      }, 0)
                                    }}
                                  >
                                    {t('common:deleteAll')}
                                  </Button>
                                </DialogFooter>
                              </DialogHeader>
                            </DialogContent>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </Dialog>
                    </div>
                  </div>
                )}

                {filteredThreads.length === 0 && searchTerm.length > 0 && (
                  <div className="px-1 mt-2">
                    <div className="flex items-center gap-1 text-left-panel-fg/80">
                      <IconSearch size={18} />
                      <h6 className="font-medium text-base">
                        {t('common:noResultsFound')}
                      </h6>
                    </div>
                    <p className="text-left-panel-fg/60 mt-1 text-xs leading-relaxed">
                      {t('common:noResultsFoundDesc')}
                    </p>
                  </div>
                )}

                {Object.keys(threads).length === 0 && !searchTerm && (
                  <>
                    <div className="px-1 mt-2">
                      <div className="flex items-center gap-1 text-left-panel-fg/80">
                        <IconMessageFilled size={18} />
                        <h6 className="font-medium text-base">
                          {t('common:noThreadsYet')}
                        </h6>
                      </div>
                      <p className="text-left-panel-fg/60 mt-1 text-xs leading-relaxed">
                        {t('common:noThreadsYetDesc')}
                      </p>
                    </div>
                  </>
                )}

                <div className="flex flex-col">
                  <ThreadList threads={unFavoritedThreads} />
                </div>
              </div>
            </div>
          </div>
        </div>
        
        {/* 下载管理 */}
        {(Object.keys(downloads).length > 0 || localDownloadingModels.size > 0) && (
          <div className="shrink-0 border-t border-left-panel-fg/10 pt-2">
            <DownloadManagement />
          </div>
        )}
        
        {/* 底部菜单 - 文字形式 */}
        <div className="shrink-0 border-t border-left-panel-fg/10">
          <div className="px-2 py-2 space-y-1">
            {mainMenus.filter(m => m.isEnabled).map((menu) => (
              <Link
                key={menu.title}
                to={menu.route}
                onClick={() => isSmallScreen && setLeftPanel(false)}
                data-test-id={`menu-${menu.title}`}
                className={cn(
                  'flex items-center gap-2.5 px-2.5 py-1.5 rounded-md hover:bg-left-panel-fg/5 transition-all',
                  'text-black hover:text-left-panel-fg',
                  currentPath.includes(route.settings.index) && menu.route.includes(route.settings.index)
                    ? 'bg-left-panel-fg/5 text-left-panel-fg'
                    : '[&.active]:bg-left-panel-fg/5 [&.active]:text-left-panel-fg'
                )}
              >
                <menu.icon size={16} className="shrink-0" />
                <span className="text-xs">{t(menu.title)}</span>
              </Link>
            ))}
          </div>
        </div>
      </aside>
    </>
  )
}

export default LeftPanel
