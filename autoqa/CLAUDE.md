[根目录](../CLAUDE.md) > **autoqa**

# AutoQA 模块文档

> 基于 CUA Computer 框架的端到端自动化测试系统

## 模块职责

AutoQA 模块是 Miaoda 项目的自动化质量保证系统，提供：
- 端到端 UI 自动化测试
- 硬件性能监控测试
- 模型加载和推理测试
- 跨平台兼容性测试
- ReportPortal 集成报告
- 屏幕录制和回放功能

## 入口与启动

### 主要入口点
- `main.py` - 主测试执行器
- `test_runner.py` - 单个测试运行器
- `scripts/` - 平台特定的安装和清理脚本

### 启动命令
```bash
# 安装依赖
pip install -r requirements.txt

# 本地运行（无 ReportPortal）
python main.py

# 启用 ReportPortal 集成
python main.py --enable-reportportal --rp-token YOUR_TOKEN

# 自定义配置运行
python main.py --model-name "gpt-4" --max-turns 50
```

## 对外接口

### 测试接口
- `test_new_user_chatting` - 新用户聊天流程测试
- 硬件监控测试
- 模型加载性能测试
- UI 交互自动化测试

### 报告接口
- **ReportPortal 集成** - 测试结果可视化
- **屏幕录制** - 测试过程视频记录
- **详细日志** - 多级别日志输出
- **跨平台支持** - Windows/macOS/Linux

### 配置接口
```python
# 支持的配置参数
--model-name          # AI 模型名称
--model-base-url      # 模型 API 端点
--max-turns          # 最大测试轮次
--jan-app-path       # Jan 应用路径
--enable-reportportal # 启用 ReportPortal
--rp-token           # ReportPortal API 令牌
```

## 关键依赖与配置

### 核心依赖
- **cua-computer** - 计算机控制框架
- **cua-agent** - AI 智能体
- **reportportal-client** - 测试报告平台
- **opencv-python** - 计算机视觉
- **PyAutoGUI** - GUI 自动化
- **psutil** - 系统监控

### 测试配置
```python
# 默认配置
MODEL_LOOP = "uitars"
MODEL_PROVIDER = "oaicompat"
MODEL_NAME = "ByteDance-Seed/UI-TARS-1.5-7B"
MODEL_BASE_URL = "http://10.200.108.58:1234/v1"
MAX_TURNS = 30
```

### 平台适配
- **Windows** - PowerShell 脚本支持
- **macOS** - Shell 脚本和权限管理
- **Linux** - Ubuntu 特定配置

## 数据模型

### 测试用例结构
```
autoqa/
├── tests/
│   └── new-user/
│       └── 1-user-start-chatting.txt
├── scripts/
│   ├── macos_*.sh      # macOS 脚本
│   ├── ubuntu_*.sh     # Ubuntu 脚本
│   └── windows_*.ps1   # Windows 脚本
└── *.py               # Python 模块
```

### 测试数据
- 测试步骤文本文件
- 屏幕截图和录像
- 性能指标数据
- 错误日志和堆栈跟踪

### 报告数据
- 测试执行结果
- 时间戳和持续时间
- 硬件使用情况
- 模型推理性能

## 测试与质量

### 测试类型
- ✅ **端到端测试** - 完整用户流程
- ✅ **UI 自动化** - 界面交互测试
- ✅ **性能测试** - 硬件资源监控
- ✅ **兼容性测试** - 跨平台验证

### 质量保证
- **自动化测试执行**
- **结果可视化报告**
- **持续集成支持**
- **多环境验证**

### 监控指标
- 测试执行成功率
- 平均响应时间
- 内存和 CPU 使用率
- 模型加载时间

## 常见问题 (FAQ)

### Q: 如何配置 Jan 应用路径？
A: 使用 `--jan-app-path` 参数或设置 `JAN_APP_PATH` 环境变量。

### Q: ReportPortal 配置失败怎么办？
A: 检查 `--rp-token` 是否正确，确保网络连接到 ReportPortal 服务器。

### Q: 测试在特定平台失败？
A: 检查对应平台的脚本文件（scripts/目录），确保依赖正确安装。

### Q: 如何添加新的测试用例？
A: 在 `tests/` 目录下创建新的文本文件，描述测试步骤。

### Q: 屏幕录制不工作？
A: 确保安装了 OpenCV 和相关的系统权限（特别是 macOS 的屏幕录制权限）。

## 相关文件清单

### 核心文件
- `main.py` - 主程序入口
- `test_runner.py` - 测试运行逻辑
- `requirements.txt` - Python 依赖
- `utils.py` - 工具函数
- `screen_recorder.py` - 屏幕录制
- `reportportal_handler.py` - ReportPortal 集成

### 配置文件
- `README.md` - 使用说明
- `checklist.md` - 测试检查清单

### 测试文件
- `tests/new-user/` - 新用户测试用例

### 脚本文件
- `scripts/macos_*` - macOS 相关脚本
- `scripts/ubuntu_*` - Ubuntu 相关脚本  
- `scripts/windows_*` - Windows 相关脚本
- `scripts/run_tests.*` - 跨平台测试脚本

## 变更记录 (Changelog)

### 2025-09-08
- 完成 AutoQA 模块文档化
- 分析自动化测试架构
- 整理跨平台脚本结构
- 识别 ReportPortal 集成方案
- 添加常见问题解答和使用指南