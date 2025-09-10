/* eslint-disable react-hooks/exhaustive-deps */
import ReactMarkdown, { Components } from 'react-markdown'
import remarkGfm from 'remark-gfm'
import remarkEmoji from 'remark-emoji'
import remarkMath from 'remark-math'
import rehypeKatex from 'rehype-katex'
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter'
import * as prismStyles from 'react-syntax-highlighter/dist/cjs/styles/prism'
import { memo, useState, useMemo, useRef, useEffect } from 'react'
import { getReadableLanguageName } from '@/lib/utils'
import { cn } from '@/lib/utils'
import { useCodeblock } from '@/hooks/useCodeblock'
import 'katex/dist/katex.min.css'
import { IconCopy, IconCopyCheck } from '@tabler/icons-react'
import rehypeRaw from 'rehype-raw'
import { useTranslation } from '@/i18n/react-i18next-compat'
import { analyzeHtmlContent, generateArtifactId } from '@/lib/htmlDetector'
import { analyzeDocumentContent } from '@/lib/documentDetector'
import HtmlArtifact from '@/components/HtmlArtifact'
import HtmlArtifactPanel from '@/components/HtmlArtifactPanel'
import { DocumentArtifact } from '@/components/DocumentArtifact'
import { DocumentViewerPanel } from '@/components/DocumentViewerPanel'

interface MarkdownProps {
  content: string
  className?: string
  components?: Components
  enableRawHtml?: boolean
  isUser?: boolean
  isWrapping?: boolean
}

function RenderMarkdownComponent({
  content,
  enableRawHtml,
  className,
  isUser,
  components,
  isWrapping,
}: MarkdownProps) {
  const { t } = useTranslation()
  const { codeBlockStyle, showLineNumbers } = useCodeblock()

  // State for tracking which code block has been copied
  const [copiedId, setCopiedId] = useState<string | null>(null)
  // Map to store unique IDs for code blocks based on content and position
  const codeBlockIds = useRef(new Map<string, string>())
  
  // State for HTML artifact viewer
  const [activeArtifact, setActiveArtifact] = useState<{
    id: string
    title: string
    content: string
  } | null>(null)
  
  // State for document viewer
  const [activeDocument, setActiveDocument] = useState<{
    content: string
    documentType: string
    language: string
    title?: string
  } | null>(null)

  // Clear ID map when content changes
  useEffect(() => {
    codeBlockIds.current.clear()
  }, [content])

  // Function to handle copying code to clipboard
  const handleCopy = (code: string, id: string) => {
    navigator.clipboard.writeText(code)
    setCopiedId(id)

    // Reset copied state after 2 seconds
    setTimeout(() => {
      setCopiedId(null)
    }, 2000)
  }

  // Default components for syntax highlighting and emoji rendering
  const defaultComponents: Components = useMemo(
    () => ({
      code: ({ className, children, ...props }) => {
        const match = /language-(\w+)/.exec(className || '')
        const language = match ? match[1] : ''
        const isInline = !match || !language

        const code = String(children).replace(/\n$/, '')

        // Generate a unique ID based on content and language
        const contentKey = `${code}-${language}`
        let codeId = codeBlockIds.current.get(contentKey)
        if (!codeId) {
          codeId = `code-${codeBlockIds.current.size}`
          codeBlockIds.current.set(contentKey, codeId)
        }

        // Check for document artifacts (not for user messages)
        if (!isUser && language) {
          // Special handling for HTML
          if (language === 'html') {
            const htmlAnalysis = analyzeHtmlContent(code)
            
            // If it's a complete HTML document, render as artifact
            if (htmlAnalysis.isComplete) {
              const artifactId = generateArtifactId()
              return (
                <HtmlArtifact
                  id={artifactId}
                  title={htmlAnalysis.title}
                  description={htmlAnalysis.description}
                  htmlContent={code}
                  onExpand={(id, content) => {
                    setActiveArtifact({
                      id,
                      title: htmlAnalysis.title,
                      content
                    })
                  }}
                />
              )
            }
          } else {
            // Check for other document types
            const docAnalysis = analyzeDocumentContent(code, language)
            
            // If it's a complete document, render as artifact
            if (docAnalysis.isComplete) {
              return (
                <DocumentArtifact
                  content={code}
                  documentType={docAnalysis.documentType}
                  language={docAnalysis.language}
                  title={docAnalysis.title}
                  lineCount={docAnalysis.lineCount}
                  onView={() => {
                    setActiveDocument({
                      content: code,
                      documentType: docAnalysis.documentType,
                      language: docAnalysis.language,
                      title: docAnalysis.title
                    })
                  }}
                />
              )
            }
          }
        }

        return !isInline && !isUser ? (
          <div className="relative overflow-hidden border rounded-md border-main-view-fg/2">
            <style>
              {/* Disable selection of line numbers. React Syntax Highlighter currently has
              unfixed bug so we can't use the lineNumberContainerStyleProp */}
              {`
              .react-syntax-highlighter-line-number {
                user-select: none;
                -webkit-user-select: none;
                -moz-user-select: none;
                -ms-user-select: none;
              }
            `}
            </style>
            <div className="flex items-center justify-between px-4 py-2 bg-main-view/10">
              <span className="font-medium text-xs font-sans">
                {getReadableLanguageName(language)}
              </span>
              <button
                onClick={(e) => {
                  e.stopPropagation()
                  handleCopy(code, codeId)
                }}
                className="flex items-center gap-1 text-xs font-sans transition-colors cursor-pointer"
              >
                {copiedId === codeId ? (
                  <>
                    <IconCopyCheck size={16} className="text-primary" />
                    <span>{t('copied')}</span>
                  </>
                ) : (
                  <>
                    <IconCopy size={16} />
                    <span>{t('copy')}</span>
                  </>
                )}
              </button>
            </div>
            <SyntaxHighlighter
              // @ts-expect-error - Type issues with style prop in react-syntax-highlighter
              style={
                prismStyles[
                  codeBlockStyle
                    .split('-')
                    .map((part: string, index: number) =>
                      index === 0
                        ? part
                        : part.charAt(0).toUpperCase() + part.slice(1)
                    )
                    .join('') as keyof typeof prismStyles
                ] || prismStyles.oneLight
              }
              language={language}
              showLineNumbers={showLineNumbers}
              wrapLines={true}
              // Temporary comment we try calculate main area width on __root
              lineProps={
                isWrapping
                  ? {
                      style: { wordBreak: 'break-all', whiteSpace: 'pre-wrap' },
                    }
                  : {}
              }
              customStyle={{
                margin: 0,
                padding: '8px',
                borderRadius: '0 0 4px 4px',
                overflow: 'auto',
                border: 'none',
              }}
              PreTag="div"
              CodeTag={'code'}
              {...props}
            >
              {String(children).replace(/\n$/, '')}
            </SyntaxHighlighter>
          </div>
        ) : (
          <code className={cn(className)}>{children}</code>
        )
      },
    }),
    [codeBlockStyle, showLineNumbers, copiedId, isUser]
  )

  // Memoize the remarkPlugins to prevent unnecessary re-renders
  const remarkPlugins = useMemo(() => {
    // Using a simpler configuration to avoid TypeScript errors
    return [remarkGfm, remarkMath, remarkEmoji]
  }, [])

  // Memoize the rehypePlugins to prevent unnecessary re-renders
  const rehypePlugins = useMemo(() => {
    return enableRawHtml ? [rehypeKatex, rehypeRaw] : [rehypeKatex]
  }, [enableRawHtml])

  // Merge custom components with default components
  const mergedComponents = useMemo(
    () => ({
      ...defaultComponents,
      ...components,
    }),
    [defaultComponents, components]
  )

  // Render the markdown content
  return (
    <>
      <div
        className={cn(
          'markdown break-words select-text',
          isUser && 'is-user',
          className
        )}
      >
        <ReactMarkdown
          remarkPlugins={remarkPlugins}
          rehypePlugins={rehypePlugins}
          components={mergedComponents}
        >
          {content}
        </ReactMarkdown>
      </div>
      
      {/* HTML Artifact Panel - 侧边面板 */}
      <HtmlArtifactPanel
        isOpen={!!activeArtifact}
        onClose={() => setActiveArtifact(null)}
        title={activeArtifact?.title || ''}
        htmlContent={activeArtifact?.content || ''}
        position="right"
      />
      
      {/* Document Viewer Panel - 通用文档查看器 */}
      {activeDocument && (
        <DocumentViewerPanel
          isOpen={!!activeDocument}
          onClose={() => setActiveDocument(null)}
          content={activeDocument.content}
          documentType={activeDocument.documentType as any}
          language={activeDocument.language}
          title={activeDocument.title}
        />
      )}
    </>
  )
}

// Use a simple memo without custom comparison to allow re-renders when content changes
// This is important for streaming content to render incrementally
export const RenderMarkdown = memo(RenderMarkdownComponent)
