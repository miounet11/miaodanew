# 妙答项目最佳实践指南

## 开发规范

### 代码风格

#### TypeScript 最佳实践
```typescript
// ✅ 推荐：明确的类型定义
interface User {
  id: string
  name: string
  email: string
  createdAt: Date
}

// ❌ 避免：使用 any 类型
// const user: any = { id: 1, name: 'John' }

// ✅ 推荐：联合类型和枚举
type UserRole = 'admin' | 'user' | 'guest'
enum ModelStatus {
  Loading = 'loading',
  Ready = 'ready',
  Error = 'error'
}

// ✅ 推荐：泛型使用
interface ApiResponse<T> {
  data: T
  success: boolean
  message?: string
}

async function fetchUser<T extends User>(id: string): Promise<ApiResponse<T>> {
  // 实现
}
```

#### React 组件设计
```tsx
// ✅ 推荐：函数式组件 + Hooks
interface UserCardProps {
  user: User
  onEdit?: (user: User) => void
  className?: string
}

const UserCard: React.FC<UserCardProps> = ({
  user,
  onEdit,
  className = ''
}) => {
  const handleEdit = useCallback(() => {
    onEdit?.(user)
  }, [onEdit, user])

  return (
    <div className={`user-card ${className}`}>
      <h3>{user.name}</h3>
      <p>{user.email}</p>
      {onEdit && (
        <button onClick={handleEdit}>编辑</button>
      )}
    </div>
  )
}

// ❌ 避免：类组件（除非必要）
class UserCard extends React.Component {
  // 不推荐在新代码中使用
}
```

### 状态管理

#### Zustand Store 设计
```typescript
// ✅ 推荐：Store 分离和组合
interface UserState {
  currentUser: User | null
  users: User[]
  isLoading: boolean
  error: string | null
}

interface UserActions {
  setCurrentUser: (user: User) => void
  fetchUsers: () => Promise<void>
  updateUser: (id: string, updates: Partial<User>) => Promise<void>
  clearError: () => void
}

const useUserStore = create<UserState & UserActions>((set, get) => ({
  // 初始状态
  currentUser: null,
  users: [],
  isLoading: false,
  error: null,

  // 操作方法
  setCurrentUser: (user) => set({ currentUser: user }),

  fetchUsers: async () => {
    set({ isLoading: true, error: null })
    try {
      const users = await api.getUsers()
      set({ users, isLoading: false })
    } catch (error) {
      set({
        error: error.message,
        isLoading: false
      })
    }
  },

  updateUser: async (id, updates) => {
    try {
      const updatedUser = await api.updateUser(id, updates)
      set(state => ({
        users: state.users.map(user =>
          user.id === id ? updatedUser : user
        )
      }))
    } catch (error) {
      set({ error: error.message })
    }
  },

  clearError: () => set({ error: null })
}))
```

#### 异步操作处理
```typescript
// ✅ 推荐：自定义 Hook 处理异步操作
const useAsyncOperation = <T,>(
  operation: () => Promise<T>,
  deps: React.DependencyList = []
) => {
  const [state, setState] = useState<{
    data: T | null
    loading: boolean
    error: Error | null
  }>({
    data: null,
    loading: false,
    error: null
  })

  const execute = useCallback(async () => {
    setState(prev => ({ ...prev, loading: true, error: null }))
    try {
      const data = await operation()
      setState({ data, loading: false, error: null })
      return data
    } catch (error) {
      setState(prev => ({
        ...prev,
        loading: false,
        error: error as Error
      }))
      throw error
    }
  }, deps)

  return { ...state, execute, refetch: execute }
}

// 使用示例
const { data: users, loading, error, execute: fetchUsers } = useAsyncOperation(
  () => api.getUsers(),
  []
)
```

## 性能优化

### React 性能优化

#### 组件优化
```tsx
// ✅ 推荐：使用 React.memo 避免不必要的重渲染
interface ExpensiveComponentProps {
  data: ComplexData
  onAction: (id: string) => void
}

const ExpensiveComponent = React.memo<ExpensiveComponentProps>(({
  data,
  onAction
}) => {
  console.log('ExpensiveComponent rendered')

  return (
    <div>
      {/* 复杂渲染逻辑 */}
    </div>
  )
})

// 自定义比较函数（如果需要）
const areEqual = (prevProps: ExpensiveComponentProps, nextProps: ExpensiveComponentProps) => {
  return prevProps.data.id === nextProps.data.id
}

const OptimizedComponent = React.memo(ExpensiveComponent, areEqual)
```

#### 列表渲染优化
```tsx
// ✅ 推荐：使用稳定的 key 和虚拟化
import { FixedSizeList as List } from 'react-window'

const UserList: React.FC<{ users: User[] }> = ({ users }) => {
  const renderUser = useCallback(({ index, style }) => {
    const user = users[index]
    return (
      <div style={style} key={user.id}>
        <UserCard user={user} />
      </div>
    )
  }, [users])

  return (
    <List
      height={400}
      itemCount={users.length}
      itemSize={50}
    >
      {renderUser}
    </List>
  )
}
```

### Bundle 优化

#### 代码分割
```typescript
// ✅ 推荐：路由级别的代码分割
import { lazy, Suspense } from 'react'
import { createBrowserRouter } from '@tanstack/react-router'

const HomePage = lazy(() => import('./pages/HomePage'))
const SettingsPage = lazy(() => import('./pages/SettingsPage'))
const ChatPage = lazy(() => import('./pages/ChatPage'))

const router = createBrowserRouter([
  {
    path: '/',
    element: (
      <Suspense fallback={<LoadingSpinner />}>
        <HomePage />
      </Suspense>
    )
  },
  {
    path: '/settings',
    element: (
      <Suspense fallback={<LoadingSpinner />}>
        <SettingsPage />
      </Suspense>
    )
  },
  {
    path: '/chat',
    element: (
      <Suspense fallback={<LoadingSpinner />}>
        <ChatPage />
      </Suspense>
    )
  }
])
```

#### 资源优化
```typescript
// ✅ 推荐：图片懒加载和优化
import { useState, useRef, useEffect } from 'react'

const LazyImage: React.FC<{ src: string, alt: string }> = ({ src, alt }) => {
  const [isLoaded, setIsLoaded] = useState(false)
  const [isInView, setIsInView] = useState(false)
  const imgRef = useRef<HTMLImageElement>(null)

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsInView(true)
          observer.disconnect()
        }
      }
    )

    if (imgRef.current) {
      observer.observe(imgRef.current)
    }

    return () => observer.disconnect()
  }, [])

  return (
    <div ref={imgRef} className="image-container">
      {isInView && (
        <img
          src={src}
          alt={alt}
          onLoad={() => setIsLoaded(true)}
          className={isLoaded ? 'loaded' : 'loading'}
        />
      )}
      {!isLoaded && <div className="image-placeholder" />}
    </div>
  )
}
```

## AI 模型优化

### 模型加载优化
```typescript
// ✅ 推荐：模型预加载和缓存策略
class ModelManager {
  private modelCache = new Map<string, Model>()
  private loadingPromises = new Map<string, Promise<Model>>()

  async loadModel(modelId: string): Promise<Model> {
    // 避免重复加载
    if (this.modelCache.has(modelId)) {
      return this.modelCache.get(modelId)!
    }

    // 避免并发加载同一个模型
    if (this.loadingPromises.has(modelId)) {
      return this.loadingPromises.get(modelId)!
    }

    const loadPromise = this.performModelLoad(modelId)
    this.loadingPromises.set(modelId, loadPromise)

    try {
      const model = await loadPromise
      this.modelCache.set(modelId, model)
      return model
    } finally {
      this.loadingPromises.delete(modelId)
    }
  }

  private async performModelLoad(modelId: string): Promise<Model> {
    // 实际的模型加载逻辑
    const model = await llama.load(modelId)
    return model
  }
}
```

### 推理优化
```typescript
// ✅ 推荐：批处理和流式输出
interface InferenceOptions {
  temperature?: number
  maxTokens?: number
  stream?: boolean
  onProgress?: (chunk: string) => void
}

class InferenceEngine {
  async generateText(
    prompt: string,
    options: InferenceOptions = {}
  ): Promise<string> {
    const { stream = false, onProgress, ...params } = options

    if (stream && onProgress) {
      return this.generateStream(prompt, params, onProgress)
    }

    return this.generateBatch(prompt, params)
  }

  private async generateStream(
    prompt: string,
    params: any,
    onProgress: (chunk: string) => void
  ): Promise<string> {
    let result = ''

    // 流式生成实现
    const stream = await this.model.generate(prompt, {
      ...params,
      stream: true
    })

    for await (const chunk of stream) {
      result += chunk
      onProgress(chunk)
    }

    return result
  }

  private async generateBatch(
    prompt: string,
    params: any
  ): Promise<string> {
    const result = await this.model.generate(prompt, params)
    return result
  }
}
```

## 插件开发规范

### 插件结构
```typescript
// ✅ 推荐：标准插件结构
interface PluginManifest {
  id: string
  name: string
  version: string
  description: string
  author: string
  main: string
  dependencies?: Record<string, string>
  permissions?: string[]
}

class BasePlugin {
  protected manifest: PluginManifest

  constructor(manifest: PluginManifest) {
    this.manifest = manifest
  }

  async onLoad(): Promise<void> {
    // 插件加载逻辑
  }

  async onUnload(): Promise<void> {
    // 插件卸载逻辑
  }

  getCommands(): Command[] {
    return []
  }

  getSettings(): Setting[] {
    return []
  }
}
```

### 插件通信
```typescript
// ✅ 推荐：类型安全的插件通信
interface PluginMessage<T = any> {
  type: string
  payload: T
  source: string
  target?: string
}

class PluginMessenger {
  private listeners = new Map<string, Set<(message: PluginMessage) => void>>()

  send<T>(message: PluginMessage<T>): void {
    const listeners = this.listeners.get(message.type)
    if (listeners) {
      listeners.forEach(listener => listener(message))
    }
  }

  on<T>(
    type: string,
    listener: (message: PluginMessage<T>) => void
  ): () => void {
    if (!this.listeners.has(type)) {
      this.listeners.set(type, new Set())
    }

    this.listeners.get(type)!.add(listener as any)

    // 返回取消订阅函数
    return () => {
      this.listeners.get(type)?.delete(listener as any)
    }
  }
}
```

## 测试策略

### 单元测试
```typescript
// ✅ 推荐：组件测试
import { render, screen, fireEvent } from '@testing-library/react'
import { expect, test } from 'vitest'

test('UserCard displays user information', () => {
  const mockUser: User = {
    id: '1',
    name: 'John Doe',
    email: 'john@example.com'
  }

  render(<UserCard user={mockUser} />)

  expect(screen.getByText('John Doe')).toBeInTheDocument()
  expect(screen.getByText('john@example.com')).toBeInTheDocument()
})

test('UserCard calls onEdit when edit button is clicked', () => {
  const mockUser: User = { id: '1', name: 'John', email: 'john@test.com' }
  const mockOnEdit = vi.fn()

  render(<UserCard user={mockUser} onEdit={mockOnEdit} />)

  const editButton = screen.getByRole('button', { name: /edit/i })
  fireEvent.click(editButton)

  expect(mockOnEdit).toHaveBeenCalledWith(mockUser)
})
```

### 集成测试
```typescript
// ✅ 推荐：Store测试
import { renderHook, act } from '@testing-library/react'
import { expect, test } from 'vitest'

test('useUserStore manages user state correctly', () => {
  const { result } = renderHook(() => useUserStore())

  act(() => {
    result.current.setCurrentUser(mockUser)
  })

  expect(result.current.currentUser).toEqual(mockUser)

  act(() => {
    result.current.clearError()
  })

  expect(result.current.error).toBeNull()
})
```

## 错误处理

### 错误边界
```tsx
// ✅ 推荐：React错误边界
interface ErrorBoundaryState {
  hasError: boolean
  error?: Error
}

class ErrorBoundary extends React.Component<
  React.PropsWithChildren<{}>,
  ErrorBoundaryState
> {
  constructor(props: React.PropsWithChildren<{}>) {
    super(props)
    this.state = { hasError: false }
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error }
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    // 错误上报逻辑
    console.error('Error caught by boundary:', error, errorInfo)
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="error-boundary">
          <h2>出错了</h2>
          <p>应用程序遇到了一个错误</p>
          <button onClick={() => this.setState({ hasError: false })}>
            重试
          </button>
        </div>
      )
    }

    return this.props.children
  }
}
```

### API错误处理
```typescript
// ✅ 推荐：统一的API错误处理
class ApiClient {
  private async request<T>(config: RequestConfig): Promise<T> {
    try {
      const response = await fetch(config.url, {
        method: config.method,
        headers: config.headers,
        body: config.body
      })

      if (!response.ok) {
        throw new ApiError(
          `HTTP ${response.status}: ${response.statusText}`,
          response.status,
          await response.text()
        )
      }

      return response.json()
    } catch (error) {
      if (error instanceof ApiError) {
        throw error
      }

      // 网络错误或其他未知错误
      throw new ApiError(
        '网络请求失败，请检查网络连接',
        0,
        error.message
      )
    }
  }
}

class ApiError extends Error {
  constructor(
    message: string,
    public status: number,
    public details?: string
  ) {
    super(message)
    this.name = 'ApiError'
  }
}
```

## 总结

遵循这些最佳实践可以显著提升代码质量、性能和可维护性：

1. **类型安全**: 使用TypeScript，编写明确的类型定义
2. **组件设计**: 优先使用函数式组件和Hooks
3. **状态管理**: 合理使用Zustand，保持状态简洁
4. **性能优化**: 实施代码分割、懒加载和缓存策略
5. **错误处理**: 实现错误边界和统一的错误处理机制
6. **测试覆盖**: 编写单元测试和集成测试
7. **代码规范**: 保持一致的代码风格和命名约定

持续关注新技术发展和最佳实践的更新，定期review和重构代码。

---

*最佳实践制定时间: 2025年9月10日*
*基于React、TypeScript和现代Web开发最佳实践*
