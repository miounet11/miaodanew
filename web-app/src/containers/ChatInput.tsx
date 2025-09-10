'use client'

import TextareaAutosize from 'react-textarea-autosize'
import { cn } from '@/lib/utils'
import { usePrompt } from '@/hooks/usePrompt'
import { useThreads } from '@/hooks/useThreads'
import { useCallback, useEffect, useRef, useState } from 'react'
import { Button } from '@/components/ui/button'
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip'
import { ArrowRight } from 'lucide-react'
import {
  IconWorld,
  IconAtom,
  IconTool,
  IconCodeCircle2,
  IconPlayerStopFilled,
  IconX,
  IconFile,
  IconFileTypePdf,
  IconFileTypeDoc,
  IconFileTypeXls,
  IconFileTypePpt,
  IconFileCode,
  IconFileText,
  IconPaperclip,
} from '@tabler/icons-react'
import { useTranslation } from '@/i18n/react-i18next-compat'
import { useGeneralSetting } from '@/hooks/useGeneralSetting'
import { useModelProvider } from '@/hooks/useModelProvider'

import { useAppState } from '@/hooks/useAppState'
import { MovingBorder } from './MovingBorder'
import { useChat } from '@/hooks/useChat'
import DropdownModelProvider from '@/containers/DropdownModelProvider'
import { ModelLoader } from '@/containers/loaders/ModelLoader'
import DropdownToolsAvailable from '@/containers/DropdownToolsAvailable'
import { useServiceHub } from '@/hooks/useServiceHub'
import { MentionSelector, type MentionItem } from '@/components/MentionSelector'
import { useContextManager } from '@/lib/contextManager'

type ChatInputProps = {
  className?: string
  showSpeedToken?: boolean
  model?: ThreadModel
  initialMessage?: boolean
}

const ChatInput = ({ model, className, initialMessage }: ChatInputProps) => {
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const [isFocused, setIsFocused] = useState(false)
  const [rows, setRows] = useState(1)
  const serviceHub = useServiceHub()
  const {
    streamingContent,
    abortControllers,
    loadingModel,
    tools,
    cancelToolCall,
  } = useAppState()
  const { prompt, setPrompt } = usePrompt()
  const { currentThreadId } = useThreads()
  const { t } = useTranslation()
  const { spellCheckChatInput } = useGeneralSetting()

  const maxRows = 10

  const { selectedModel, selectedProvider } = useModelProvider()
  const { sendMessage } = useChat()
  const [message, setMessage] = useState('')
  const [dropdownToolsAvailable, setDropdownToolsAvailable] = useState(false)
  const [tooltipToolsAvailable, setTooltipToolsAvailable] = useState(false)
  const [uploadedFiles, setUploadedFiles] = useState<
    Array<{
      name: string
      type: string
      size: number
      base64: string
      dataUrl: string
    }>
  >([])
  const [connectedServers, setConnectedServers] = useState<string[]>([])
  const [isDragOver, setIsDragOver] = useState(false)
  const [hasMmproj, setHasMmproj] = useState(false)
  
  // @ Mention 功能状态
  const [showMentionSelector, setShowMentionSelector] = useState(false)
  const [mentionQuery, setMentionQuery] = useState('')
  const [mentionPosition, setMentionPosition] = useState({ x: 0, y: 0 })
  const [mentionStartIndex, setMentionStartIndex] = useState(-1)
  const [mentionedItems, setMentionedItems] = useState<MentionItem[]>([])
  const inputContainerRef = useRef<HTMLDivElement>(null)
  const { addResource } = useContextManager()

  // Check for connected MCP servers
  useEffect(() => {
    const checkConnectedServers = async () => {
      try {
        const servers = await serviceHub.mcp().getConnectedServers()
        setConnectedServers(servers)
      } catch (error) {
        console.error('Failed to get connected servers:', error)
        setConnectedServers([])
      }
    }

    checkConnectedServers()

    // Poll for connected servers every 3 seconds
    const intervalId = setInterval(checkConnectedServers, 3000)

    return () => clearInterval(intervalId)
  }, [serviceHub])

  // Check for file upload support - enable for most modern models
  useEffect(() => {
    const checkFileUploadSupport = async () => {
      if (selectedModel && selectedModel?.id) {
        try {
          // Check for llamacpp provider with mmproj
          if (selectedProvider === 'llamacpp') {
            const hasLocalMmproj = await serviceHub.models().checkMmprojExists(selectedModel.id)
            setHasMmproj(hasLocalMmproj)
          }
          // Enable for models with vision capability
          else if (selectedModel?.capabilities?.includes('vision')) {
            setHasMmproj(true)
          }
          // Enable for popular AI models that support multimodal input
          else if (
            selectedProvider === 'openai' ||
            selectedProvider === 'openai-compatible' ||
            selectedProvider === 'anthropic' ||
            selectedProvider === 'gemini' ||
            selectedProvider === 'openrouter' ||
            // Check if model ID contains indicators of multimodal support
            selectedModel.id?.toLowerCase().includes('gpt-4') ||
            selectedModel.id?.toLowerCase().includes('claude') ||
            selectedModel.id?.toLowerCase().includes('gemini') ||
            selectedModel.id?.toLowerCase().includes('grok') ||
            selectedModel.id?.toLowerCase().includes('vision') ||
            selectedModel.id?.toLowerCase().includes('multimodal')
          ) {
            setHasMmproj(true)
          } else {
            setHasMmproj(false)
          }
        } catch (error) {
          console.error('Error checking file upload support:', error)
          setHasMmproj(false)
        }
      }
    }

    checkFileUploadSupport()
  }, [selectedModel, selectedModel?.capabilities, selectedProvider, serviceHub])

  // Check if there are active MCP servers
  const hasActiveMCPServers = connectedServers.length > 0 || tools.length > 0

  const handleSendMesage = (prompt: string) => {
    if (!selectedModel) {
      setMessage('Please select a model to start chatting.')
      return
    }
    if (!prompt.trim() && uploadedFiles.length === 0) {
      return
    }
    setMessage('')
    sendMessage(
      prompt,
      true,
      uploadedFiles.length > 0 ? uploadedFiles : undefined
    )
    setUploadedFiles([])
  }

  useEffect(() => {
    const handleFocusIn = () => {
      if (document.activeElement === textareaRef.current) {
        setIsFocused(true)
      }
    }

    const handleFocusOut = () => {
      if (document.activeElement !== textareaRef.current) {
        setIsFocused(false)
      }
    }

    document.addEventListener('focusin', handleFocusIn)
    document.addEventListener('focusout', handleFocusOut)

    return () => {
      document.removeEventListener('focusin', handleFocusIn)
      document.removeEventListener('focusout', handleFocusOut)
    }
  }, [])

  // Focus when component mounts
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.focus()
    }
  }, [])

  useEffect(() => {
    if (tooltipToolsAvailable && dropdownToolsAvailable) {
      setTooltipToolsAvailable(false)
    }
  }, [dropdownToolsAvailable, tooltipToolsAvailable])

  // Focus when thread changes
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.focus()
    }
  }, [currentThreadId])

  // Focus when streaming content finishes
  useEffect(() => {
    if (!streamingContent && textareaRef.current) {
      // Small delay to ensure UI has updated
      setTimeout(() => {
        textareaRef.current?.focus()
      }, 10)
    }
  }, [streamingContent])

  const stopStreaming = useCallback(
    (threadId: string) => {
      abortControllers[threadId]?.abort()
      cancelToolCall?.()
    },
    [abortControllers, cancelToolCall]
  )

  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleAttachmentClick = () => {
    fileInputRef.current?.click()
  }

  const handleRemoveFile = (indexToRemove: number) => {
    setUploadedFiles((prev) =>
      prev.filter((_, index) => index !== indexToRemove)
    )
  }

  const getFileIcon = (type: string, fileName: string) => {
    const extension = fileName.toLowerCase().split('.').pop()
    
    // Check for specific file types
    if (type === 'application/pdf') return IconFileTypePdf
    if (type.includes('word') || extension === 'doc' || extension === 'docx') return IconFileTypeDoc
    if (type.includes('excel') || type.includes('spreadsheet') || extension === 'xls' || extension === 'xlsx') return IconFileTypeXls
    if (type.includes('powerpoint') || type.includes('presentation') || extension === 'ppt' || extension === 'pptx') return IconFileTypePpt
    
    // Check for code files
    const codeExtensions = ['js', 'jsx', 'ts', 'tsx', 'py', 'java', 'cpp', 'c', 'cs', 'go', 'rs', 'php', 'rb', 'swift', 'kt', 'scala', 'r', 'sql', 'sh', 'bash', 'ps1', 'yaml', 'yml', 'json', 'xml', 'html', 'css', 'scss', 'less', 'vue', 'dart']
    if (codeExtensions.includes(extension || '')) return IconFileCode
    
    // Check for text files
    if (type.includes('text') || extension === 'txt' || extension === 'md') return IconFileText
    
    // Default file icon
    return IconFile
  }

  const formatFileSize = (size: number) => {
    if (size < 1024) return `${size} B`
    if (size < 1024 * 1024) return `${(size / 1024).toFixed(1)} KB`
    return `${(size / (1024 * 1024)).toFixed(1)} MB`
  }
  
  // @ Mention 处理函数
  const handleMentionSelect = (item: MentionItem) => {
    if (mentionStartIndex >= 0) {
      const beforeMention = prompt.slice(0, mentionStartIndex)
      const afterMention = prompt.slice(mentionStartIndex + mentionQuery.length + 1)
      const mentionText = `@${item.type}:${item.name}`
      const newPrompt = beforeMention + mentionText + ' ' + afterMention
      setPrompt(newPrompt)
      
      // 添加到已引用的资源
      setMentionedItems([...mentionedItems, item])
      
      // 如果是资源类型，添加到上下文管理器
      if (item.type === 'file' || item.type === 'mcp' || item.type === 'resource') {
        addResource({
          type: item.type,
          name: item.name,
          path: item.path,
          pinned: false,
        })
      }
    }
    
    setShowMentionSelector(false)
    setMentionQuery('')
    setMentionStartIndex(-1)
    
    // 重新聚焦输入框
    setTimeout(() => {
      textareaRef.current?.focus()
    }, 0)
  }
  
  const detectMention = (text: string, cursorPosition: number) => {
    // 查找光标前最近的 @ 符号
    const beforeCursor = text.slice(0, cursorPosition)
    const lastAtIndex = beforeCursor.lastIndexOf('@')
    
    if (lastAtIndex >= 0) {
      const afterAt = beforeCursor.slice(lastAtIndex + 1)
      
      // 检查 @ 后面是否是有效的查询（没有空格）
      if (!afterAt.includes(' ') && !afterAt.includes('\n')) {
        // 获取 @ 符号在文本框中的位置
        if (textareaRef.current) {
          const rect = textareaRef.current.getBoundingClientRect()
          // 简单估算光标位置（这里可以根据需要改进）
          setMentionPosition({
            x: rect.left + 20,
            y: rect.top + 30,
          })
        }
        
        setMentionQuery(afterAt)
        setMentionStartIndex(lastAtIndex)
        setShowMentionSelector(true)
        return true
      }
    }
    
    setShowMentionSelector(false)
    setMentionQuery('')
    setMentionStartIndex(-1)
    return false
  }

  const getFileTypeFromExtension = (fileName: string): string => {
    const extension = fileName.toLowerCase().split('.').pop()
    switch (extension) {
      // Image formats
      case 'jpg':
      case 'jpeg':
        return 'image/jpeg'
      case 'png':
        return 'image/png'
      case 'gif':
        return 'image/gif'
      case 'webp':
        return 'image/webp'
      case 'bmp':
        return 'image/bmp'
      // Document formats
      case 'pdf':
        return 'application/pdf'
      case 'txt':
        return 'text/plain'
      case 'md':
        return 'text/markdown'
      case 'doc':
        return 'application/msword'
      case 'docx':
        return 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
      case 'xls':
        return 'application/vnd.ms-excel'
      case 'xlsx':
        return 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
      case 'ppt':
        return 'application/vnd.ms-powerpoint'
      case 'pptx':
        return 'application/vnd.openxmlformats-officedocument.presentationml.presentation'
      case 'csv':
        return 'text/csv'
      case 'json':
        return 'application/json'
      case 'xml':
        return 'application/xml'
      // Code files
      case 'js':
      case 'jsx':
      case 'ts':
      case 'tsx':
      case 'py':
      case 'java':
      case 'cpp':
      case 'c':
      case 'cs':
      case 'go':
      case 'rs':
      case 'php':
      case 'rb':
      case 'swift':
      case 'kt':
      case 'scala':
      case 'r':
      case 'sql':
      case 'sh':
      case 'bash':
      case 'ps1':
      case 'yaml':
      case 'yml':
      case 'toml':
      case 'ini':
      case 'conf':
      case 'cfg':
        return 'text/plain'
      default:
        return 'application/octet-stream'
    }
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files

    if (files && files.length > 0) {
      const maxSize = 10 * 1024 * 1024 // 10MB in bytes
      const newFiles: Array<{
        name: string
        type: string
        size: number
        base64: string
        dataUrl: string
      }> = []

      Array.from(files).forEach((file) => {
        // Check file size
        if (file.size > maxSize) {
          setMessage(`File is too large. Maximum size is 10MB.`)
          // Reset file input to allow re-uploading
          if (fileInputRef.current) {
            fileInputRef.current.value = ''
          }
          return
        }

        // Get file type - use extension as fallback if MIME type is incorrect
        const detectedType = file.type || getFileTypeFromExtension(file.name)
        const actualType = getFileTypeFromExtension(file.name) || detectedType

        // Check file type - allow images and documents
        const allowedImageTypes = [
          'image/jpeg', 'image/jpg', 'image/png', 'image/gif', 
          'image/webp', 'image/bmp'
        ]
        const allowedDocTypes = [
          'application/pdf', 'text/plain', 'text/markdown',
          'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
          'application/vnd.ms-excel', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
          'application/vnd.ms-powerpoint', 'application/vnd.openxmlformats-officedocument.presentationml.presentation',
          'text/csv', 'application/json', 'application/xml'
        ]
        const allowedTypes = [...allowedImageTypes, ...allowedDocTypes]

        if (!allowedTypes.includes(actualType)) {
          // Check if it's a code/text file by extension
          const extension = file.name.toLowerCase().split('.').pop()
          const codeExtensions = ['js', 'jsx', 'ts', 'tsx', 'py', 'java', 'cpp', 'c', 'cs', 'go', 'rs', 'php', 'rb', 'swift', 'kt', 'scala', 'r', 'sql', 'sh', 'bash', 'ps1', 'yaml', 'yml', 'toml', 'ini', 'conf', 'cfg', 'html', 'css', 'scss', 'less', 'vue', 'dart']
          
          if (!codeExtensions.includes(extension || '')) {
            setMessage(
              `不支持的文件类型。支持图片（JPG、PNG、GIF等）、文档（PDF、Word、Excel等）和代码文件。`
            )
            // Reset file input to allow re-uploading
            if (fileInputRef.current) {
              fileInputRef.current.value = ''
            }
            return
          }
        }

        const reader = new FileReader()
        reader.onload = () => {
          const result = reader.result
          if (typeof result === 'string') {
            const base64String = result.split(',')[1]
            const fileData = {
              name: file.name,
              size: file.size,
              type: actualType,
              base64: base64String,
              dataUrl: result,
            }
            newFiles.push(fileData)
            // Update state
            if (
              newFiles.length ===
              Array.from(files).filter((f) => {
                const fType = getFileTypeFromExtension(f.name) || f.type
                return f.size <= maxSize && allowedTypes.includes(fType)
              }).length
            ) {
              setUploadedFiles((prev) => {
                const updated = [...prev, ...newFiles]
                return updated
              })
              // Reset the file input value to allow re-uploading the same file
              if (fileInputRef.current) {
                fileInputRef.current.value = ''
                setMessage('')
              }
            }
          }
        }
        reader.readAsDataURL(file)
      })
    }

    if (textareaRef.current) {
      textareaRef.current.focus()
    }
  }

  const handleDragEnter = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    // Only allow drag if model supports mmproj
    if (hasMmproj) {
      setIsDragOver(true)
    }
  }

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    // Only set dragOver to false if we're leaving the drop zone entirely
    // In Tauri, relatedTarget can be null, so we need to handle that case
    const relatedTarget = e.relatedTarget as Node | null
    if (!relatedTarget || !e.currentTarget.contains(relatedTarget)) {
      setIsDragOver(false)
    }
  }

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    // Ensure drag state is maintained during drag over
    if (hasMmproj) {
      setIsDragOver(true)
    }
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDragOver(false)

    // Only allow drop if model supports mmproj
    if (!hasMmproj) {
      return
    }

    // Check if dataTransfer exists (it might not in some Tauri scenarios)
    if (!e.dataTransfer) {
      console.warn('No dataTransfer available in drop event')
      return
    }

    const files = e.dataTransfer.files
    if (files && files.length > 0) {
      // Create a synthetic event to reuse existing file handling logic
      const syntheticEvent = {
        target: {
          files: files,
        },
      } as React.ChangeEvent<HTMLInputElement>

      handleFileChange(syntheticEvent)
    }
  }

  const handlePaste = async (e: React.ClipboardEvent) => {
    // Only process images if model supports mmproj
    if (hasMmproj) {
      const clipboardItems = e.clipboardData?.items
      let hasProcessedImage = false

      // Try clipboardData.items first (traditional method)
      if (clipboardItems && clipboardItems.length > 0) {
        const imageItems = Array.from(clipboardItems).filter((item) =>
          item.type.startsWith('image/')
        )

        if (imageItems.length > 0) {
          e.preventDefault()

          const files: File[] = []
          let processedCount = 0

          imageItems.forEach((item) => {
            const file = item.getAsFile()
            if (file) {
              files.push(file)
            }
            processedCount++

            // When all items are processed, handle the valid files
            if (processedCount === imageItems.length) {
              if (files.length > 0) {
                const syntheticEvent = {
                  target: {
                    files: files,
                  },
                } as unknown as React.ChangeEvent<HTMLInputElement>

                handleFileChange(syntheticEvent)
                hasProcessedImage = true
              }
            }
          })

          // If we found image items but couldn't get files, fall through to modern API
          if (processedCount === imageItems.length && !hasProcessedImage) {
            // Continue to modern clipboard API fallback below
          } else {
            return // Successfully processed with traditional method
          }
        }
      }

      // Modern Clipboard API fallback (for Linux, images copied from web, etc.)
      if (
        navigator.clipboard &&
        'read' in navigator.clipboard &&
        !hasProcessedImage
      ) {
        try {
          const clipboardContents = await navigator.clipboard.read()
          const files: File[] = []

          for (const item of clipboardContents) {
            const imageTypes = item.types.filter((type) =>
              type.startsWith('image/')
            )

            for (const type of imageTypes) {
              try {
                const blob = await item.getType(type)
                // Convert blob to File with better naming
                const extension = type.split('/')[1] || 'png'
                const file = new File(
                  [blob],
                  `pasted-image-${Date.now()}.${extension}`,
                  { type }
                )
                files.push(file)
              } catch (error) {
                console.error('Error reading clipboard item:', error)
              }
            }
          }

          if (files.length > 0) {
            e.preventDefault()
            const syntheticEvent = {
              target: {
                files: files,
              },
            } as unknown as React.ChangeEvent<HTMLInputElement>

            handleFileChange(syntheticEvent)
            return
          }
        } catch (error) {
          console.error('Clipboard API access failed:', error)
        }
      }

      // If we reach here, no image was found - allow normal text pasting to continue
      console.log(
        'No image data found in clipboard, allowing normal text paste'
      )
    }
    // If hasMmproj is false or no images found, allow normal text pasting to continue
  }

  return (
    <div className="relative" ref={inputContainerRef}>
      <div className="relative">
        <div
          className={cn(
            'relative overflow-hidden p-[2px] rounded-lg',
            Boolean(streamingContent) && 'opacity-70'
          )}
        >
          {streamingContent && (
            <div className="absolute inset-0">
              <MovingBorder rx="10%" ry="10%">
                <div
                  className={cn(
                    'h-100 w-100 bg-[radial-gradient(var(--app-primary),transparent_60%)]'
                  )}
                />
              </MovingBorder>
            </div>
          )}

          <div
            className={cn(
              'relative z-20 px-0 pb-10 border border-main-view-fg/5 rounded-lg text-main-view-fg bg-main-view',
              isFocused && 'ring-1 ring-main-view-fg/10',
              isDragOver && 'ring-2 ring-accent border-accent'
            )}
            data-drop-zone={hasMmproj ? 'true' : undefined}
            onDragEnter={hasMmproj ? handleDragEnter : undefined}
            onDragLeave={hasMmproj ? handleDragLeave : undefined}
            onDragOver={hasMmproj ? handleDragOver : undefined}
            onDrop={hasMmproj ? handleDrop : undefined}
          >
            {uploadedFiles.length > 0 && (
              <div className="flex gap-3 items-center p-2 pb-0 flex-wrap">
                {uploadedFiles.map((file, index) => {
                  const FileIcon = getFileIcon(file.type, file.name)
                  const isImage = file.type.startsWith('image/')
                  
                  return (
                    <div
                      key={index}
                      className={cn(
                        'relative border border-main-view-fg/10 rounded-lg hover:border-main-view-fg/20 transition-colors',
                        isImage ? 'size-14' : 'px-3 py-2 min-w-[120px] max-w-[200px]'
                      )}
                      title={`${file.name} (${formatFileSize(file.size)})`}
                    >
                      {isImage ? (
                        <img
                          className="object-cover w-full h-full rounded-lg"
                          src={file.dataUrl}
                          alt={`${file.name} - ${index}`}
                        />
                      ) : (
                        <div className="flex items-center gap-2">
                          <FileIcon size={20} className="text-main-view-fg/60 shrink-0" />
                          <div className="flex-1 min-w-0">
                            <div className="text-xs font-medium text-main-view-fg/80 truncate">
                              {file.name}
                            </div>
                            <div className="text-xs text-main-view-fg/50">
                              {formatFileSize(file.size)}
                            </div>
                          </div>
                        </div>
                      )}
                      <div
                        className="absolute -top-1 -right-1 bg-destructive size-5 flex rounded-full items-center justify-center cursor-pointer hover:scale-110 transition-transform"
                        onClick={() => handleRemoveFile(index)}
                      >
                        <IconX className="text-destructive-fg" size={14} />
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
            <TextareaAutosize
              ref={textareaRef}
              disabled={Boolean(streamingContent)}
              minRows={2}
              rows={1}
              maxRows={10}
              value={prompt}
              data-testid={'chat-input'}
              onChange={(e) => {
                setPrompt(e.target.value)
                // Count the number of newlines to estimate rows
                const newRows = (e.target.value.match(/\n/g) || []).length + 1
                setRows(Math.min(newRows, maxRows))
                
                // 检测 @ 提及
                const cursorPosition = e.target.selectionStart || 0
                detectMention(e.target.value, cursorPosition)
              }}
              onKeyDown={(e) => {
                // e.keyCode 229 is for IME input with Safari
                const isComposing =
                  e.nativeEvent.isComposing || e.keyCode === 229
                if (
                  e.key === 'Enter' &&
                  !e.shiftKey &&
                  prompt.trim() &&
                  !isComposing
                ) {
                  e.preventDefault()
                  // Submit the message when Enter is pressed without Shift
                  handleSendMesage(prompt)
                  // When Shift+Enter is pressed, a new line is added (default behavior)
                }
              }}
              onPaste={handlePaste}
              placeholder={t('common:placeholder.chatInput')}
              autoFocus
              spellCheck={spellCheckChatInput}
              data-gramm={spellCheckChatInput}
              data-gramm_editor={spellCheckChatInput}
              data-gramm_grammarly={spellCheckChatInput}
              className={cn(
                'bg-transparent pt-4 w-full flex-shrink-0 border-none resize-none outline-0 px-4',
                rows < maxRows && 'scrollbar-hide',
                className
              )}
            />
          </div>
        </div>

        <div className="absolute z-20 bg-transparent bottom-0 w-full p-2 ">
          <div className="flex justify-between items-center w-full">
            <div className="px-1 flex items-center gap-1">
              <div
                className={cn(
                  'px-1 flex items-center',
                  streamingContent && 'opacity-50 pointer-events-none'
                )}
              >
                {model?.provider === 'llamacpp' && loadingModel ? (
                  <ModelLoader />
                ) : (
                  <DropdownModelProvider
                    model={model}
                    useLastUsedModel={initialMessage}
                  />
                )}
                {/* File attachment - show for supported models */}
                {hasMmproj && (
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <div
                          className="h-7 p-1 flex items-center justify-center rounded-sm hover:bg-main-view-fg/10 transition-all duration-200 ease-in-out gap-1 cursor-pointer"
                          onClick={handleAttachmentClick}
                        >
                          <IconPaperclip
                            size={18}
                            className="text-main-view-fg/50"
                          />
                          <input
                            type="file"
                            ref={fileInputRef}
                            className="hidden"
                            multiple
                            onChange={handleFileChange}
                            accept="image/*,.pdf,.txt,.md,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.csv,.json,.xml,.html,.css,.js,.jsx,.ts,.tsx,.py,.java,.cpp,.c,.cs,.go,.rs,.php,.rb,.swift,.kt,.scala,.r,.sql,.sh,.bash,.ps1,.yaml,.yml,.toml,.ini,.conf,.cfg"
                          />
                        </div>
                      </TooltipTrigger>
                      <TooltipContent>
                        <p>上传文件（图片、文档、代码）</p>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                )}
                {/* Microphone - always available - Temp Hide */}
                {/* <div className="h-7 p-1 flex items-center justify-center rounded-sm hover:bg-main-view-fg/10 transition-all duration-200 ease-in-out gap-1">
                <IconMicrophone size={18} className="text-main-view-fg/50" />
              </div> */}
                {selectedModel?.capabilities?.includes('embeddings') && (
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <div className="h-7 p-1 flex items-center justify-center rounded-sm hover:bg-main-view-fg/10 transition-all duration-200 ease-in-out gap-1">
                          <IconCodeCircle2
                            size={18}
                            className="text-main-view-fg/50"
                          />
                        </div>
                      </TooltipTrigger>
                      <TooltipContent>
                        <p>{t('embeddings')}</p>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                )}

                {selectedModel?.capabilities?.includes('tools') &&
                  hasActiveMCPServers && (
                    <TooltipProvider>
                      <Tooltip
                        open={tooltipToolsAvailable}
                        onOpenChange={setTooltipToolsAvailable}
                      >
                        <TooltipTrigger
                          asChild
                          disabled={dropdownToolsAvailable}
                        >
                          <div
                            onClick={(e) => {
                              setDropdownToolsAvailable(false)
                              e.stopPropagation()
                            }}
                          >
                            <DropdownToolsAvailable
                              initialMessage={initialMessage}
                              onOpenChange={(isOpen) => {
                                setDropdownToolsAvailable(isOpen)
                                if (isOpen) {
                                  setTooltipToolsAvailable(false)
                                }
                              }}
                            >
                              {(isOpen, toolsCount) => {
                                return (
                                  <div
                                    className={cn(
                                      'h-7 p-1 flex items-center justify-center rounded-sm hover:bg-main-view-fg/10 transition-all duration-200 ease-in-out gap-1 cursor-pointer relative',
                                      isOpen && 'bg-main-view-fg/10'
                                    )}
                                  >
                                    <IconTool
                                      size={18}
                                      className="text-main-view-fg/50"
                                    />
                                    {toolsCount > 0 && (
                                      <div className="absolute -top-2 -right-2 bg-accent text-accent-fg text-xs rounded-full size-5 flex items-center justify-center font-medium">
                                        <span className="leading-0 text-xs">
                                          {toolsCount > 99 ? '99+' : toolsCount}
                                        </span>
                                      </div>
                                    )}
                                  </div>
                                )
                              }}
                            </DropdownToolsAvailable>
                          </div>
                        </TooltipTrigger>
                        <TooltipContent>
                          <p>{t('tools')}</p>
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                  )}
                {selectedModel?.capabilities?.includes('web_search') && (
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <div className="h-7 p-1 flex items-center justify-center rounded-sm hover:bg-main-view-fg/10 transition-all duration-200 ease-in-out gap-1">
                          <IconWorld
                            size={18}
                            className="text-main-view-fg/50"
                          />
                        </div>
                      </TooltipTrigger>
                      <TooltipContent>
                        <p>Web Search</p>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                )}
                {selectedModel?.capabilities?.includes('reasoning') && (
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <div className="h-7 p-1 flex items-center justify-center rounded-sm hover:bg-main-view-fg/10 transition-all duration-200 ease-in-out gap-1">
                          <IconAtom
                            size={18}
                            className="text-main-view-fg/50"
                          />
                        </div>
                      </TooltipTrigger>
                      <TooltipContent>
                        <p>{t('reasoning')}</p>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                )}
              </div>
            </div>

            {streamingContent ? (
              <Button
                variant="destructive"
                size="icon"
                onClick={() =>
                  stopStreaming(currentThreadId ?? streamingContent.thread_id)
                }
              >
                <IconPlayerStopFilled />
              </Button>
            ) : (
              <Button
                variant={
                  !prompt.trim() && uploadedFiles.length === 0
                    ? null
                    : 'default'
                }
                size="icon"
                disabled={!prompt.trim() && uploadedFiles.length === 0}
                data-test-id="send-message-button"
                onClick={() => handleSendMesage(prompt)}
              >
                {streamingContent ? (
                  <span className="animate-spin h-4 w-4 border-2 border-current border-t-transparent rounded-full" />
                ) : (
                  <ArrowRight className="text-primary-fg" />
                )}
              </Button>
            )}
          </div>
        </div>
      </div>

      {message && (
        <div className="bg-main-view-fg/2 -mt-0.5 mx-2 pb-2 px-3 pt-1.5 rounded-b-lg text-xs text-destructive transition-all duration-200 ease-in-out">
          <div className="flex items-center gap-1 justify-between">
            {message}
            <IconX
              className="size-3 text-main-view-fg/30 cursor-pointer"
              onClick={() => {
                setMessage('')
                // Reset file input to allow re-uploading the same file
                if (fileInputRef.current) {
                  fileInputRef.current.value = ''
                }
              }}
            />
          </div>
        </div>
      )}
      
      {/* @ Mention 选择器 */}
      <MentionSelector
        isOpen={showMentionSelector}
        query={mentionQuery}
        position={mentionPosition}
        onSelect={handleMentionSelect}
        onClose={() => {
          setShowMentionSelector(false)
          setMentionQuery('')
          setMentionStartIndex(-1)
        }}
        containerRef={inputContainerRef}
      />
    </div>
  )
}

export default ChatInput
