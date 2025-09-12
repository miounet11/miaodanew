#!/usr/bin/env node
/**
 * Miaoda 版本同步脚本
 * 用途：统一更新所有配置文件中的版本号
 * 使用：node scripts/update-version.js <version>
 */

const fs = require('fs');
const path = require('path');

// 获取命令行参数
const newVersion = process.argv[2];

if (!newVersion) {
    console.error('❌ 请提供版本号！');
    console.log('使用方法: node scripts/update-version.js <version>');
    console.log('示例: node scripts/update-version.js 3.0.1');
    process.exit(1);
}

// 验证版本号格式
const versionRegex = /^\d+\.\d+\.\d+$/;
if (!versionRegex.test(newVersion)) {
    console.error('❌ 版本号格式错误！应为 x.y.z 格式');
    process.exit(1);
}

console.log(`\n🔄 开始更新版本号到 ${newVersion}...\n`);

// 需要更新的文件列表
const filesToUpdate = [
    {
        path: 'src-tauri/tauri.conf.json',
        type: 'json',
        field: 'version',
        description: 'Tauri 配置'
    },
    {
        path: 'src-tauri/Cargo.toml',
        type: 'toml',
        pattern: /^version = ".*"/m,
        replacement: `version = "${newVersion}"`,
        description: 'Rust Cargo 配置'
    },
    {
        path: 'web-app/package.json',
        type: 'json',
        field: 'version',
        description: 'Web App 包配置'
    },
    {
        path: 'core/package.json',
        type: 'json',
        field: 'version',
        description: 'Core 包配置'
    },
    {
        path: 'extensions-web/package.json',
        type: 'json',
        field: 'version',
        description: 'Extensions Web 包配置'
    },
    {
        path: '.env.production',
        type: 'env',
        pattern: /^APP_VERSION=.*/m,
        replacement: `APP_VERSION=${newVersion}`,
        description: '生产环境变量'
    }
];

// 更新文件函数
function updateFile(fileConfig) {
    const filePath = path.join(process.cwd(), fileConfig.path);
    
    // 检查文件是否存在
    if (!fs.existsSync(filePath)) {
        console.warn(`⚠️  文件不存在: ${fileConfig.path}`);
        return false;
    }
    
    try {
        let content = fs.readFileSync(filePath, 'utf8');
        let updated = false;
        
        switch (fileConfig.type) {
            case 'json':
                const json = JSON.parse(content);
                const oldVersion = json[fileConfig.field];
                json[fileConfig.field] = newVersion;
                content = JSON.stringify(json, null, 2);
                updated = oldVersion !== newVersion;
                if (updated) {
                    console.log(`✅ ${fileConfig.description}: ${oldVersion} → ${newVersion}`);
                } else {
                    console.log(`ℹ️  ${fileConfig.description}: 已是最新版本`);
                }
                break;
                
            case 'toml':
            case 'env':
                const oldContent = content;
                content = content.replace(fileConfig.pattern, fileConfig.replacement);
                updated = oldContent !== content;
                if (updated) {
                    console.log(`✅ ${fileConfig.description}: 已更新`);
                } else {
                    console.log(`ℹ️  ${fileConfig.description}: 已是最新版本`);
                }
                break;
        }
        
        if (updated) {
            fs.writeFileSync(filePath, content, 'utf8');
        }
        
        return true;
    } catch (error) {
        console.error(`❌ 更新失败 ${fileConfig.path}: ${error.message}`);
        return false;
    }
}

// 执行更新
let successCount = 0;
let failCount = 0;

filesToUpdate.forEach(fileConfig => {
    if (updateFile(fileConfig)) {
        successCount++;
    } else {
        failCount++;
    }
});

// 输出结果
console.log('\n' + '='.repeat(50));
console.log(`📊 更新完成！`);
console.log(`   成功: ${successCount} 个文件`);
if (failCount > 0) {
    console.log(`   失败: ${failCount} 个文件`);
}
console.log(`   版本: ${newVersion}`);
console.log('='.repeat(50) + '\n');

// 额外提示
console.log('💡 提示：');
console.log('   1. 请提交这些更改: git add -A && git commit -m "chore: bump version to ' + newVersion + '"');
console.log('   2. 创建标签: git tag v' + newVersion);
console.log('   3. 推送更改: git push && git push --tags');
console.log('   4. 运行构建: ./scripts/build-release.sh');

process.exit(failCount > 0 ? 1 : 0);