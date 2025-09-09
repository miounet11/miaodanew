[根目录](../CLAUDE.md) > **docs**

# Docs 模块文档

> 基于 Next.js + Nextra 构建的项目文档和官网

## 模块职责

Docs 模块是 Miaoda 项目的官方文档站点，提供：
- 用户使用指南和教程
- 开发者技术文档
- API 参考文档
- 版本更新日志
- 博客文章和技术分享

## 入口与启动

### 配置文件
- `next.config.mjs` - Next.js 配置和 Nextra 集成
- `src/pages/_app.mdx` - 全局应用配置

### 启动命令
```bash
# 开发模式
npm run dev

# 构建静态站点
npm run build

# 本地预览
npm run start
```

## 对外接口

### 主要页面结构
- `/` - 首页
- `/docs/*` - 技术文档
- `/changelog` - 版本更新日志  
- `/blog` - 博客文章

### 内容组织
- `src/pages/docs/` - 技术文档 Markdown 文件
- `src/pages/changelog/` - 版本日志文件
- `public/assets/` - 静态资源（图片、视频等）

## 关键依赖与配置

### 核心依赖
- **Next.js** - React 全栈框架
- **Nextra** - 基于 Next.js 的文档框架
- **nextra-theme-docs** - 文档主题
- **@code-hike/mdx** - 代码高亮组件

### 关键特性
- **Code Hike** - 增强的代码高亮和交互
- **LaTeX 支持** - 数学公式渲染
- **Mermaid 图表** - 流程图和时序图
- **多语言支持** - 国际化文档
- **SEO 优化** - 搜索引擎优化
- **Google Analytics** - 访问统计

### 环境变量
```bash
GTM_ID=         # Google Tag Manager ID
POSTHOG_KEY=    # PostHog 分析密钥
POSTHOG_HOST=   # PostHog 服务器地址
```

## 数据模型

### 文档结构
```
docs/
├── src/pages/
│   ├── _app.mdx           # 全局配置
│   ├── blog.mdx           # 博客首页
│   ├── changelog.mdx      # 更新日志首页
│   ├── docs/              # 技术文档
│   │   ├── _assets/       # 文档资源
│   │   └── *.mdx         # 文档页面
│   └── changelog/         # 版本日志
│       └── *.mdx         # 日志文件
├── public/
│   └── assets/           # 静态资源
└── src/helpers/
    └── authors.yml       # 作者信息
```

### 文档元数据
- Front Matter 配置
- 作者信息管理
- 分类和标签
- 发布日期和更新时间

## 测试与质量

### 当前状态
- ❌ 单元测试 - 未配置
- ❌ 集成测试 - 未配置
- ❌ 链接检查 - 未配置
- ✅ 构建验证 - Next.js 内置

### 建议改进
1. 添加链接有效性检查
2. 文档构建自动化测试
3. 内容一致性验证
4. 性能监控和优化

## 常见问题 (FAQ)

### Q: 如何添加新的文档页面？
A: 在 `src/pages/docs/` 目录下创建新的 `.mdx` 文件，Nextra 会自动生成路由。

### Q: 如何配置导航菜单？
A: 通过 `theme.config.tsx` 文件配置导航结构和主题设置。

### Q: 如何添加代码高亮？
A: 使用 Code Hike 语法或标准 Markdown 代码块，支持多种编程语言。

### Q: 如何部署文档站点？
A: 执行 `npm run build` 生成静态文件，然后部署到任何静态托管服务。

## 相关文件清单

### 配置文件
- `next.config.mjs` - Next.js 和 Nextra 配置
- `theme.config.tsx` - 主题配置
- `package.json` - 依赖管理

### 内容文件
- `src/pages/**/*.mdx` - 文档内容
- `src/helpers/authors.yml` - 作者信息
- `public/assets/**/*` - 静态资源

### 部署文件
- `_headers` - Netlify 头部配置
- `_redirects` - URL 重定向规则

## 变更记录 (Changelog)

### 2025-09-08
- 完成 Docs 模块文档化
- 分析技术栈和配置结构
- 识别改进机会
- 添加操作指南和常见问题解答