# ============================================================================
# Windows 本地构建脚本（性能优化版）
# 应用所有性能优化措施的本地构建脚本
# ============================================================================

param(
    [switch]$Clean = $false,
    [switch]$SkipTests = $false,
    [switch]$Release = $true,
    [string]$LogLevel = "info"
)

# 导入性能监控模块
$scriptPath = Split-Path -Parent $MyInvocation.MyCommand.Definition
Import-Module "$scriptPath\performance\build-monitor.ps1" -Force

Write-Host "🔧 Miaoda Windows 构建脚本（性能优化版）" -ForegroundColor Magenta
Write-Host "=" * 50 -ForegroundColor Blue

# 检查先决条件
function Test-Prerequisites {
    Start-StageTimer "Prerequisites Check"
    
    $requirements = @{
        "node" = "Node.js"
        "yarn" = "Yarn"
        "cargo" = "Rust/Cargo"
        "jq" = "jq (JSON processor)"
    }
    
    $missing = @()
    foreach ($cmd in $requirements.Keys) {
        try {
            $null = Get-Command $cmd -ErrorAction Stop
            Write-Host "✅ $($requirements[$cmd]) - 已安装" -ForegroundColor Green
        }
        catch {
            $missing += $requirements[$cmd]
            Write-Host "❌ $($requirements[$cmd]) - 未找到" -ForegroundColor Red
        }
    }
    
    if ($missing.Count -gt 0) {
        Write-Error "缺少必需的工具: $($missing -join ', ')"
        End-StageTimer "Prerequisites Check" "Failed"
        exit 1
    }
    
    End-StageTimer "Prerequisites Check"
}

# 清理构建目录
function Clear-BuildDirectories {
    if ($Clean) {
        Start-StageTimer "Clean"
        
        $cleanDirs = @(
            "core/dist",
            "extensions-web/dist", 
            "web-app/dist",
            "src-tauri/target",
            "node_modules/.vite",
            "release"
        )
        
        foreach ($dir in $cleanDirs) {
            if (Test-Path $dir) {
                Write-Host "🧹 清理 $dir" -ForegroundColor Yellow
                Remove-Item -Path $dir -Recurse -Force
            }
        }
        
        End-StageTimer "Clean"
    }
}

# 安装依赖（优化版）
function Install-Dependencies {
    Start-StageTimer "Dependencies Installation"
    
    # 配置 Yarn 性能优化
    yarn config set networkConcurrency 16
    yarn config set httpTimeout 600000
    yarn config set enableImmutableInstalls true
    
    Write-Host "📦 安装依赖（并行优化）..." -ForegroundColor Cyan
    yarn install --immutable --inline-builds
    
    if ($LASTEXITCODE -ne 0) {
        Write-Error "依赖安装失败"
        End-StageTimer "Dependencies Installation" "Failed"
        exit 1
    }
    
    End-StageTimer "Dependencies Installation"
}

# 并行构建核心模块
function Build-CoreModules {
    Start-StageTimer "Core Modules Build"
    
    Write-Host "🔧 并行构建核心模块..." -ForegroundColor Cyan
    
    # 启动并行构建进程
    $coreJob = Start-Job -ScriptBlock { 
        Set-Location $using:PWD
        yarn build:core 
    }
    
    $extensionsJob = Start-Job -ScriptBlock {
        Set-Location $using:PWD
        yarn build:extensions-web
    }
    
    # 等待核心构建完成
    Write-Host "⏳ 等待核心模块构建完成..." -ForegroundColor Yellow
    Wait-Job $coreJob, $extensionsJob | Out-Null
    
    # 检查构建结果
    $coreResult = Receive-Job $coreJob
    $extensionsResult = Receive-Job $extensionsJob
    
    Remove-Job $coreJob, $extensionsJob
    
    # 验证构建产物
    if (!(Test-Path "core/dist") -or !(Test-Path "extensions-web/dist")) {
        Write-Error "核心模块构建失败"
        End-StageTimer "Core Modules Build" "Failed"
        exit 1
    }
    
    Write-Host "✅ 核心模块构建完成" -ForegroundColor Green
    End-StageTimer "Core Modules Build"
}

# 构建 Web 应用
function Build-WebApp {
    Start-StageTimer "Web App Build"
    
    Write-Host "🌐 构建 Web 应用..." -ForegroundColor Cyan
    
    # 设置环境变量以优化 Vite 构建
    $env:NODE_ENV = if ($Release) { "production" } else { "development" }
    $env:VITE_BUILD_ANALYZE = "false"  # 禁用构建分析以提高速度
    
    yarn build:web
    
    if ($LASTEXITCODE -ne 0 -or !(Test-Path "web-app/dist")) {
        Write-Error "Web 应用构建失败"
        End-StageTimer "Web App Build" "Failed"
        exit 1
    }
    
    Write-Host "✅ Web 应用构建完成" -ForegroundColor Green
    End-StageTimer "Web App Build"
}

# 构建 Tauri 应用（优化版）
function Build-TauriApp {
    Start-StageTimer "Tauri Build"
    
    Write-Host "🦀 构建 Tauri 应用（优化配置）..." -ForegroundColor Cyan
    
    # 设置 Rust 编译优化环境变量
    $env:CARGO_BUILD_JOBS = "0"  # 使用所有 CPU 核心
    $env:RUSTFLAGS = "-C target-cpu=native -C opt-level=3"
    $env:CARGO_TARGET_DIR = "./src-tauri/target"
    
    if ($Release) {
        $env:TAURI_BUILD_PROFILE = "release"
    } else {
        $env:TAURI_BUILD_PROFILE = "dev"
    }
    
    # 启用 sccache（如果可用）
    if (Get-Command sccache -ErrorAction SilentlyContinue) {
        $env:RUSTC_WRAPPER = "sccache"
        Write-Host "🚀 启用 sccache 编译缓存" -ForegroundColor Green
    }
    
    # 执行 Tauri 构建
    yarn build:tauri:win32
    
    if ($LASTEXITCODE -ne 0) {
        Write-Error "Tauri 应用构建失败"
        End-StageTimer "Tauri Build" "Failed"
        exit 1
    }
    
    # 显示 sccache 统计（如果可用）
    if (Get-Command sccache -ErrorAction SilentlyContinue) {
        Write-Host "`n📊 sccache 构建统计:" -ForegroundColor Yellow
        sccache --show-stats
    }
    
    Write-Host "✅ Tauri 应用构建完成" -ForegroundColor Green
    End-StageTimer "Tauri Build"
}

# 准备发布文件
function Prepare-ReleaseFiles {
    Start-StageTimer "Release Preparation"
    
    Write-Host "📦 准备发布文件..." -ForegroundColor Cyan
    
    # 创建发布目录
    if (!(Test-Path "release")) {
        New-Item -ItemType Directory -Path "release" | Out-Null
    }
    
    # 复制构建产物
    $bundlePath = "src-tauri/target/release/bundle/nsis"
    if (Test-Path $bundlePath) {
        Copy-Item "$bundlePath/*.exe" "release/" -Force
        Copy-Item "$bundlePath/*.exe.sig" "release/" -Force -ErrorAction SilentlyContinue
        
        Write-Host "✅ 发布文件准备完成" -ForegroundColor Green
        
        # 显示文件信息
        Write-Host "`n📋 发布文件:" -ForegroundColor Yellow
        Get-ChildItem "release/" | ForEach-Object {
            $sizeMB = [math]::Round($_.Length / 1MB, 2)
            Write-Host "   $($_.Name) ($sizeMB MB)" -ForegroundColor White
        }
    } else {
        Write-Warning "未找到构建产物"
    }
    
    End-StageTimer "Release Preparation"
}

# 运行测试（可选）
function Run-Tests {
    if (!$SkipTests) {
        Start-StageTimer "Tests"
        
        Write-Host "🧪 运行测试..." -ForegroundColor Cyan
        yarn test
        
        if ($LASTEXITCODE -ne 0) {
            Write-Warning "测试失败，但继续构建"
            End-StageTimer "Tests" "Failed"
        } else {
            Write-Host "✅ 测试通过" -ForegroundColor Green
            End-StageTimer "Tests"
        }
    }
}

# 主构建流程
function Start-OptimizedBuild {
    $buildStart = Get-Date
    
    # 启动资源监控
    $monitorJob = Start-Job -ScriptBlock {
        while ($true) {
            $script = $using:scriptPath + "\performance\build-monitor.ps1"
            & $script -ShowRealtime
            Start-Sleep -Seconds 5
        }
    }
    
    try {
        # 执行构建步骤
        Test-Prerequisites
        Clear-BuildDirectories
        Install-Dependencies
        Build-CoreModules
        Build-WebApp
        Build-TauriApp
        Prepare-ReleaseFiles
        Run-Tests
        
        Write-Host "`n🎉 构建成功完成！" -ForegroundColor Green
        
    } catch {
        Write-Error "构建失败: $_"
        exit 1
    } finally {
        # 停止资源监控
        Stop-Job $monitorJob -ErrorAction SilentlyContinue
        Remove-Job $monitorJob -ErrorAction SilentlyContinue
        
        # 生成性能报告
        $reportFile = "build-performance-$(Get-Date -Format 'yyyyMMdd-HHmmss').json"
        Save-PerformanceReport $reportFile
        Show-PerformanceSummary
    }
}

# 显示使用帮助
function Show-Help {
    Write-Host "Windows 构建脚本（性能优化版）" -ForegroundColor Green
    Write-Host ""
    Write-Host "用法: .\build-windows-optimized.ps1 [选项]" -ForegroundColor Yellow
    Write-Host ""
    Write-Host "选项:" -ForegroundColor Yellow
    Write-Host "  -Clean          清理构建目录后再构建" -ForegroundColor Cyan
    Write-Host "  -SkipTests      跳过测试步骤" -ForegroundColor Cyan
    Write-Host "  -Release:`$false  构建开发版本" -ForegroundColor Cyan
    Write-Host "  -LogLevel debug 设置日志级别" -ForegroundColor Cyan
    Write-Host ""
    Write-Host "示例:" -ForegroundColor Yellow
    Write-Host "  .\build-windows-optimized.ps1 -Clean" -ForegroundColor Gray
    Write-Host "  .\build-windows-optimized.ps1 -SkipTests -Release:`$false" -ForegroundColor Gray
}

# 主入口
if ($args -contains "-help" -or $args -contains "-h") {
    Show-Help
} else {
    Start-OptimizedBuild
}
