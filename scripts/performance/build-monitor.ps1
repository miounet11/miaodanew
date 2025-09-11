# ============================================================================
# Windows 构建性能监控脚本
# 监控并报告构建过程中的性能指标
# ============================================================================

param(
    [string]$LogFile = "build-performance.json",
    [switch]$ShowRealtime = $false
)

# 初始化性能数据结构
$global:BuildMetrics = @{
    StartTime = Get-Date
    EndTime = $null
    TotalDuration = $null
    Stages = @{}
    Resources = @{
        PeakMemoryMB = 0
        PeakCpuPercent = 0
        DiskSpaceUsedMB = 0
    }
    CacheStats = @{}
    BuildSizes = @{}
}

function Start-StageTimer {
    param([string]$StageName)
    
    $global:BuildMetrics.Stages[$StageName] = @{
        StartTime = Get-Date
        EndTime = $null
        Duration = $null
        Status = "Running"
    }
    
    Write-Host "🚀 开始阶段: $StageName" -ForegroundColor Green
}

function End-StageTimer {
    param([string]$StageName, [string]$Status = "Completed")
    
    if ($global:BuildMetrics.Stages.ContainsKey($StageName)) {
        $stage = $global:BuildMetrics.Stages[$StageName]
        $stage.EndTime = Get-Date
        $stage.Duration = $stage.EndTime - $stage.StartTime
        $stage.Status = $Status
        
        Write-Host "✅ 完成阶段: $StageName (用时: $($stage.Duration.TotalSeconds.ToString('F2'))s)" -ForegroundColor Cyan
    }
}

function Monitor-SystemResources {
    $cpu = Get-Counter "\Processor(_Total)\% Processor Time" -SampleInterval 1 -MaxSamples 1
    $memory = Get-Counter "\Memory\Available MBytes" -SampleInterval 1 -MaxSamples 1
    
    $cpuPercent = [math]::Round($cpu.CounterSamples[0].CookedValue, 2)
    $memoryUsedMB = [math]::Round((8192 - $memory.CounterSamples[0].CookedValue), 2) # 假设8GB系统
    
    if ($cpuPercent -gt $global:BuildMetrics.Resources.PeakCpuPercent) {
        $global:BuildMetrics.Resources.PeakCpuPercent = $cpuPercent
    }
    
    if ($memoryUsedMB -gt $global:BuildMetrics.Resources.PeakMemoryMB) {
        $global:BuildMetrics.Resources.PeakMemoryMB = $memoryUsedMB
    }
    
    if ($ShowRealtime) {
        Write-Host "📊 CPU: $cpuPercent% | 内存: $memoryUsedMB MB" -ForegroundColor Yellow
    }
}

function Get-CacheStatistics {
    # sccache 统计
    try {
        $sccacheOutput = sccache --show-stats 2>$null | Out-String
        if ($sccacheOutput) {
            $global:BuildMetrics.CacheStats.Sccache = $sccacheOutput
        }
    } catch {
        Write-Warning "无法获取 sccache 统计信息"
    }
    
    # Yarn 缓存统计
    try {
        $yarnCacheOutput = yarn cache dir 2>$null
        if (Test-Path $yarnCacheOutput) {
            $cacheSize = (Get-ChildItem -Path $yarnCacheOutput -Recurse | Measure-Object -Property Length -Sum).Sum / 1MB
            $global:BuildMetrics.CacheStats.YarnCacheSizeMB = [math]::Round($cacheSize, 2)
        }
    } catch {
        Write-Warning "无法获取 Yarn 缓存统计信息"
    }
}

function Get-BuildArtifactSizes {
    $artifacts = @{
        "core/dist" = 0
        "extensions-web/dist" = 0
        "web-app/dist" = 0
        "src-tauri/target/release" = 0
        "release" = 0
    }
    
    foreach ($path in $artifacts.Keys) {
        if (Test-Path $path) {
            $size = (Get-ChildItem -Path $path -Recurse -File | Measure-Object -Property Length -Sum).Sum / 1MB
            $artifacts[$path] = [math]::Round($size, 2)
        }
    }
    
    $global:BuildMetrics.BuildSizes = $artifacts
}

function Save-PerformanceReport {
    param([string]$FilePath)
    
    $global:BuildMetrics.EndTime = Get-Date
    $global:BuildMetrics.TotalDuration = $global:BuildMetrics.EndTime - $global:BuildMetrics.StartTime
    
    # 获取最终统计
    Get-CacheStatistics
    Get-BuildArtifactSizes
    
    # 生成JSON报告
    $jsonReport = $global:BuildMetrics | ConvertTo-Json -Depth 10
    $jsonReport | Out-File -FilePath $FilePath -Encoding UTF8
    
    Write-Host "`n🎯 性能报告已保存到: $FilePath" -ForegroundColor Magenta
}

function Show-PerformanceSummary {
    Write-Host "`n" + "="*60 -ForegroundColor Blue
    Write-Host "🚀 构建性能总结报告" -ForegroundColor Blue
    Write-Host "="*60 -ForegroundColor Blue
    
    $totalMinutes = $global:BuildMetrics.TotalDuration.TotalMinutes
    Write-Host "⏱️  总构建时间: $($totalMinutes.ToString('F2')) 分钟" -ForegroundColor White
    
    Write-Host "`n📋 各阶段用时:" -ForegroundColor Yellow
    foreach ($stage in $global:BuildMetrics.Stages.GetEnumerator()) {
        $duration = if ($stage.Value.Duration) { $stage.Value.Duration.TotalSeconds.ToString('F2') } else { "N/A" }
        $status = $stage.Value.Status
        $statusColor = if ($status -eq "Completed") { "Green" } else { "Red" }
        Write-Host "   $($stage.Key): ${duration}s [$status]" -ForegroundColor $statusColor
    }
    
    Write-Host "`n💾 资源使用峰值:" -ForegroundColor Yellow
    Write-Host "   CPU: $($global:BuildMetrics.Resources.PeakCpuPercent)%" -ForegroundColor White
    Write-Host "   内存: $($global:BuildMetrics.Resources.PeakMemoryMB) MB" -ForegroundColor White
    
    Write-Host "`n📦 构建产物大小:" -ForegroundColor Yellow
    foreach ($artifact in $global:BuildMetrics.BuildSizes.GetEnumerator()) {
        if ($artifact.Value -gt 0) {
            Write-Host "   $($artifact.Key): $($artifact.Value) MB" -ForegroundColor White
        }
    }
    
    if ($global:BuildMetrics.CacheStats.Count -gt 0) {
        Write-Host "`n🗄️  缓存统计:" -ForegroundColor Yellow
        if ($global:BuildMetrics.CacheStats.YarnCacheSizeMB) {
            Write-Host "   Yarn 缓存: $($global:BuildMetrics.CacheStats.YarnCacheSizeMB) MB" -ForegroundColor White
        }
    }
    
    # 性能等级评估
    Write-Host "`n⭐ 性能等级: " -NoNewline -ForegroundColor Yellow
    if ($totalMinutes -le 10) {
        Write-Host "🔥 极速 (≤10分钟)" -ForegroundColor Green
    } elseif ($totalMinutes -le 20) {
        Write-Host "⚡ 快速 (≤20分钟)" -ForegroundColor Cyan
    } elseif ($totalMinutes -le 30) {
        Write-Host "⏳ 中等 (≤30分钟)" -ForegroundColor Yellow
    } else {
        Write-Host "🐌 需要优化 (>30分钟)" -ForegroundColor Red
    }
    
    Write-Host "="*60 -ForegroundColor Blue
}

# 导出函数供外部调用
Export-ModuleMember -Function Start-StageTimer, End-StageTimer, Monitor-SystemResources, Save-PerformanceReport, Show-PerformanceSummary

# 如果直接运行此脚本，显示帮助信息
if ($MyInvocation.InvocationName -eq $MyInvocation.MyCommand.Name) {
    Write-Host "Windows 构建性能监控脚本" -ForegroundColor Green
    Write-Host "用法示例:" -ForegroundColor Yellow
    Write-Host "  # 在构建脚本中导入此模块" -ForegroundColor Cyan
    Write-Host "  Import-Module .\build-monitor.ps1" -ForegroundColor Gray
    Write-Host "  Start-StageTimer 'Core Build'" -ForegroundColor Gray
    Write-Host "  # ... 执行构建 ..." -ForegroundColor Gray
    Write-Host "  End-StageTimer 'Core Build'" -ForegroundColor Gray
    Write-Host "  Save-PerformanceReport 'performance.json'" -ForegroundColor Gray
    Write-Host "  Show-PerformanceSummary" -ForegroundColor Gray
}
