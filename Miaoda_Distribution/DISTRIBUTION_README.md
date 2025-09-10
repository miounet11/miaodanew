# Miaoda 分发说明

## 文件清单

向用户分发时，请提供以下文件：

```
📦 Miaoda_Distribution/
├── miaoda_0.6.599_aarch64.dmg      # macOS 安装包（Apple Silicon）
├── install_macos.sh                # macOS 安装脚本
└── MACOS_INSTALL_GUIDE.md          # 安装指南
```

## 分发步骤

### 1. 打包文件

```bash
# 创建分发文件夹
mkdir Miaoda_Distribution

# 复制文件
cp src-tauri/target/aarch64-apple-darwin/release/bundle/dmg/miaoda_0.6.599_aarch64.dmg Miaoda_Distribution/
cp install_macos.sh Miaoda_Distribution/
cp docs/MACOS_INSTALL_GUIDE.md Miaoda_Distribution/

# 创建压缩包
tar -czf Miaoda_v0.6.599_macOS.tar.gz Miaoda_Distribution/
```

### 2. 用户安装指导

发送给用户时，请包含以下说明：

> **Miaoda v0.6.599 安装包**
> 
> **快速安装：**
> 1. 解压缩文件
> 2. 双击 `miaoda_0.6.599_aarch64.dmg`
> 3. 将 Miaoda 拖拽到应用程序文件夹
> 4. 如果遇到安全警告，运行 `install_macos.sh` 脚本
> 
> **详细说明：** 请查看 `MACOS_INSTALL_GUIDE.md`

## 常见问题解答

### Q: 为什么其他用户无法直接安装？
A: macOS 的 Gatekeeper 安全机制会阻止未经 Apple 公证的应用。这是正常的安全保护。

### Q: 如何获得正式签名？
A: 需要申请 Apple Developer Program（$99/年），然后使用开发者证书进行签名和公证。

### Q: 有没有临时解决方案？
A: 提供了安装脚本和详细指南，用户可以手动解除安全限制。

### Q: 是否会影响系统安全？
A: 解除单个应用的限制不会显著降低系统安全性，但建议未来获得正式签名。

## 技术细节

### 当前签名状态
- **应用签名**: adhoc（开发者自签名）
- **公证状态**: 未公证
- **Gatekeeper**: 会阻止首次运行

### 改进建议
1. **短期**: 继续使用当前的用户指导方案
2. **中期**: 申请 Apple Developer Program
3. **长期**: 实现自动更新和分发系统

## 联系方式

- **技术支持**: service@miaoda.xin
- **GitHub**: https://github.com/miounet11/miaoda
- **问题反馈**: https://github.com/miounet11/miaoda/issues