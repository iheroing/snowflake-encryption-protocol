# ❄️ 雪花密语 | Snowflake Whisper

<div align="center">

![Version](https://img.shields.io/badge/version-1.5.0-blue)
![License](https://img.shields.io/badge/license-MIT-green)
![React](https://img.shields.io/badge/React-19-61dafb)
![TypeScript](https://img.shields.io/badge/TypeScript-5.8-3178c6)
![Status](https://img.shields.io/badge/status-阅后即焚-red)

**极致的浪漫 × 极致的简约**

*A poetic experience where emotions crystallize into snowflakes*

[快速开始](#-快速开始) • [在线演示](https://snowflake-encryption-protocol.vercel.app) • [文档](#-文档) • [部署](#-部署)

</div>

---

## ✨ 核心概念 | Core Concept

2026年第一场雪的灵感 - 将情绪凝结成雪花，随风而逝。

利用"世上没有两片相同的雪花"这个自然界定律，将文字信息编码在独一无二的雪花晶体结构里。专注于"阅后即焚"的核心体验，简单、纯粹、美好。

*Inspired by the first snow of 2026 - crystallizing emotions into snowflakes that drift away with the wind. Each text generates a unique snowflake, focusing on the "burn after reading" experience.*

### 🎯 核心特性 | Key Features

| 特性 | 说明 | Feature | Description |
|------|------|---------|-------------|
| ❄️ **独特性** | 基于Hash值通过分形算法生成独一无二的雪花 | **Uniqueness** | Each text generates a unique snowflake via fractal algorithms |
| ⏱️ **自定义时间** | 30秒-30分钟可选，时间到期自动融化 | **Custom Time** | 30s to 30min options, auto-melt after expiration |
| 🔥 **阅后即焚** | 不保存到画廊，真正的临时消息 | **Burn After Reading** | No gallery save, truly ephemeral messages |
| 🎨 **艺术性** | 生成的雪花极致美丽，可截图保存 | **Artistry** | Beautiful snowflakes that can be screenshot |
| 🖼️ **精美预设** | 25条预设心语，8种风格 | **Presets** | 25 preset whispers in 8 styles |
| ✨ **简约设计** | 专注核心体验，简单纯粹 | **Minimalist** | Focus on core experience, simple and pure |

---

## 🆕 v1.5 新功能 | What's New in v1.5

### 🔥 真正的阅后即焚
- ✅ **移除密码保护**：简化交互流程
- ✅ **移除自动保存**：不保存到画廊，真正的临时消息
- ✅ **自定义时间**：30秒、60秒、5分钟、10分钟、30分钟
- ✅ **强化警告**：红色警告框，明确提示
- ✅ **预设自动加载**：画廊始终有内容

### 💡 设计理念
- **珍惜当下** - 不是所有美好都需要永久保存
- **简约纯粹** - 专注核心体验，移除复杂功能
- **自然之美** - 就像雪花一样，短暂而美好

### v1.4 功能

### 🎨 精美预设心语
- ✅ **25 条预设心语**：涵盖 8 种风格
- ✅ **首次访问自动加载**：画廊不再空空
- ✅ **中英文混合**：60% 中文 + 40% 英文
- ✅ **提供创作灵感**：多种风格供参考
- ✅ **可以删除**：不喜欢的可以删除

### v1.3 核心功能

### 🔐 真实加密系统
- ✅ **AES-256-GCM** 加密算法（美国政府标准）
- ✅ **PBKDF2** 密钥派生（100,000 次迭代）
- ✅ **Web Crypto API**（浏览器原生加密）
- ✅ 随机盐和 IV（每次加密都不同）
- ✅ 认证加密（防篡改）

### 🎯 密码保护
- 可选的密码保护功能
- 密码强度验证（至少 6 位）
- 密码不会被保存
- 只有正确密码才能解密

### 🔍 画廊功能
- **搜索**：按内容搜索心语
- **排序**：最新/最旧优先切换
- **刷新**：重新加载画廊
- **删除**：单独删除每条心语

### 🗑️ 安全销毁
- 内存中多次覆写数据
- 永久删除，无法恢复
- 两种销毁方式：60秒自动 + 手动删除

---

## 🚀 快速开始 | Quick Start

### 安装依赖 | Install Dependencies
```bash
npm install
```

### 启动开发服务器 | Start Dev Server
```bash
npm run dev
```

### 访问应用 | Open Browser
访问 http://localhost:3000

---

## 🎯 使用方法 | How to Use

### 1️⃣ 输入心语 | Enter Your Message
在加密页面输入你想要传递的心语

*Enter your message or secret on the encryption page*

### 2️⃣ 选择保护 | Choose Protection
- **无密码**：快速创建，适合日常心语
- **密码保护**：AES-256 加密，适合私密内容

*No password for quick sharing, or password protection for sensitive content*

### 3️⃣ 选择精华 | Choose Essence
- **极光之息** Aurora Breath - 冰蓝色调
- **星尘之梦** Stardust Dream - 紫色调

### 4️⃣ 生成雪花 | Generate Snowflake
点击"凝结心语"生成独特的雪花

*Click "Crystallize Whisper" to generate your unique snowflake*

### 5️⃣ 观赏倒计时 | Watch the Countdown
雪花会在屏幕上旋转，60秒后融化消散

*The snowflake rotates on screen and melts after 60 seconds*

### 6️⃣ 保存或分享 | Save or Share
- **保存此刻**：截图保存（包含雪花+文字）
- **分享心语**：分享给朋友
- **珍藏永恒**：导出高清图片

*Screenshot, share, or export as high-resolution image*

### 7️⃣ 画廊管理 | Gallery Management
- **查看历史**：所有心语保存在画廊
- **搜索**：按内容搜索
- **排序**：按时间排序
- **删除**：安全销毁不需要的心语

*View history, search, sort, and securely delete messages*

---

## 🌟 使用场景 | Use Cases

### 💕 浪漫表白 | Romantic Confession
```
"在我们第一次看到星星的地方见面"
"Meet me where we first saw the stars"
```
💡 建议：使用密码保护，只有对方知道密码

### 🔐 私密信息 | Private Information
```
"账号密码：Aurora2026"
"Account password: Aurora2026"
```
💡 建议：必须使用密码保护 + 60秒后自动销毁

### 📝 诗意记录 | Poetic Notes
```
"时间冻结的瞬间，像掌心的雪花"
"A moment frozen in time, like a snowflake in my palm"
```
💡 建议：无需密码，保存到画廊作为回忆

### 🎂 纪念日期 | Special Dates
```
"2026.01.18 - 一切改变的那一天"
"2026.01.18 - The day everything changed"
```
💡 建议：导出为图片，永久保存

### 🎁 惊喜礼物 | Surprise Gift
```
"生日礼物藏在你最喜欢的书里"
"Your birthday gift is hidden in your favorite book"
```
💡 建议：密码保护 + 分享链接

---

## 🛠️ 技术栈 | Tech Stack

### 前端框架 | Frontend
- ⚛️ **React 19** - 用户界面框架
- 📘 **TypeScript** - 类型安全
- ⚡ **Vite** - 构建工具
- 🎨 **Tailwind CSS** - 样式框架

### 加密技术 | Encryption
- 🔐 **AES-256-GCM** - 对称加密算法
- 🔑 **PBKDF2** - 密钥派生函数
- 🌐 **Web Crypto API** - 浏览器原生加密
- 🔒 **SHA-256** - 哈希函数

### 视觉效果 | Visual
- 🌸 **SVG** - 雪花渲染
- 🔢 **分形算法** - 雪花生成
- 🎭 **Canvas API** - 图片导出
- ✨ **CSS Animations** - 动画效果

---

## 📁 项目结构 | Project Structure

```
snowflake-encryption-protocol/
├── components/              # React组件
│   ├── LandingView.tsx     # 首页
│   ├── EncryptView.tsx     # 加密页（支持密码保护）
│   ├── DecryptView.tsx     # 解密页（60秒倒计时）
│   ├── AfterglowView.tsx   # 余晖页（导出图片）
│   └── GalleryView.tsx     # 画廊（搜索/排序/删除）
├── utils/                   # 工具函数
│   ├── snowflakeGenerator.ts  # 雪花生成算法
│   ├── encryption.ts        # AES-256 加密工具
│   └── storage.ts           # 本地存储管理
├── App.tsx                  # 主应用
├── index.tsx               # 入口文件
└── index.html              # HTML模板
```

---

## 🚀 部署 | Deployment

### Vercel (推荐 | Recommended)

1. 推送代码到 GitHub | Push to GitHub
2. 访问 [vercel.com](https://vercel.com)
3. 导入仓库 | Import repository
4. 点击 Deploy

**3分钟上线！完全免费，自带全球CDN**

*Live in 3 minutes! Free with global CDN*

### 其他选择 | Other Options

- **Netlify** - 拖拽部署
- **GitHub Pages** - 免费托管
- **自己的服务器** - 完全控制

详见 [DEPLOYMENT.md](DEPLOYMENT.md) | See [DEPLOYMENT.md](DEPLOYMENT.md)

---

## 📚 文档 | Documentation

### 快速参考 | Quick Reference
- 🚀 [快速开始.md](快速开始.md) - 3分钟上手指南
- 🔐 [加密功能说明.md](加密功能说明.md) - 加密系统详解
- 🎯 [画廊按钮说明.md](画廊按钮说明.md) - 按钮功能指南
- 🎨 [预设心语说明.md](预设心语说明.md) - 预设内容详解

### 详细文档 | Detailed Docs
- 📖 [USAGE.md](USAGE.md) - 详细使用说明
- 🌐 [DEPLOYMENT.md](DEPLOYMENT.md) - 部署指南
- 🏗️ [PROJECT_STRUCTURE.md](PROJECT_STRUCTURE.md) - 项目结构

### 版本更新 | Version History
- 📝 [v1.4更新说明.md](v1.4更新说明.md) - 最新版本更新
- 📝 [v1.3更新说明.md](v1.3更新说明.md) - 加密系统更新
- 📋 [更新日志.md](更新日志.md) - 完整更新历史

---

## 🎨 设计理念 | Design Philosophy

> "世上没有两片相同的雪花"
> 
> *"No two snowflakes are alike"*

这个应用将自然界的美学与现代加密技术结合，创造出一种全新的信息传递方式。每一片雪花都是独一无二的艺术品，承载着你的秘密，在短暂的60秒后融化消失，就像真实的雪花一样。

*This app combines nature's aesthetics with modern encryption, creating a new way to share messages. Each snowflake is a unique artwork carrying your secret, melting away after 60 seconds like real snowflakes.*

---

## 🌐 语言支持 | Language Support

- ✅ 简体中文 | Simplified Chinese
- ✅ English
- 🔜 繁體中文 | Traditional Chinese
- 🔜 日本語 | Japanese
- 🔜 한국어 | Korean

---

## 🔒 隐私和安全 | Privacy & Security

### ✅ 安全特性
- ✅ **AES-256-GCM 加密**：军事级加密标准
- ✅ **PBKDF2 密钥派生**：防止暴力破解（100,000 次迭代）
- ✅ **本地加密**：所有加密在浏览器本地完成
- ✅ **密码不保存**：密码只在加密/解密时使用
- ✅ **随机盐和 IV**：每次加密都不同
- ✅ **认证加密**：GCM 模式提供完整性验证
- ✅ **安全销毁**：多次覆写后永久删除
- ✅ **不发送到服务器**：所有数据保存在本地
- ✅ **60秒自动销毁**：倒计时后自动清除

### ⚠️ 安全建议
1. **使用强密码**：至少 8 位，包含字母、数字、符号
2. **不要重复使用密码**：每条重要心语使用不同密码
3. **及时销毁**：不需要的心语及时删除
4. **密码丢失无法恢复**：没有「忘记密码」功能
5. **本地存储**：清除浏览器数据会丢失所有心语

### 🎯 适用场景
- ✅ 浪漫表白和情话传递
- ✅ 临时信息分享
- ✅ 诗意记录和日记
- ✅ 一般性私密信息
- ⚠️ 不适合：国家机密、商业机密、法律文件

**注意**: 虽然使用了军事级加密，但这是一个艺术性加密项目。如需最高级别的安全保障，请使用专业加密工具。

*Note: While using military-grade encryption, this is an artistic encryption project. For maximum security, use professional encryption tools.*

---

## 🤝 贡献 | Contributing

欢迎提交 Issue 和 Pull Request！

*Issues and Pull Requests are welcome!*

### 开发指南 | Development Guide

```bash
# 克隆仓库 | Clone repository
git clone https://github.com/yourusername/snowflake-encryption-protocol.git

# 安装依赖 | Install dependencies
npm install

# 启动开发服务器 | Start dev server
npm run dev

# 构建生产版本 | Build for production
npm run build

# 类型检查 | Type check
npm run type-check
```

---

## 📝 许可证 | License

MIT License - 详见 [LICENSE](LICENSE) 文件

*MIT License - see [LICENSE](LICENSE) file*

---

## 🙏 致谢 | Acknowledgments

- 灵感来源于自然界雪花的独特性 | Inspired by nature's unique snowflakes
- 感谢所有开源项目的贡献者 | Thanks to all open-source contributors
- 特别感谢使用和反馈的用户 | Special thanks to all users

---

## 📞 联系方式 | Contact

- 📧 Email: your@email.com
- 🐦 Twitter: @yourusername
- 💬 Discord: [加入我们](https://discord.gg/yourserver)

---

<div align="center">

**⭐ 如果你喜欢这个项目，请给它一个星标！**

*If you like this project, please give it a star!*

---

*"来自虚空的低语，在时间中结晶。"*

*"A whisper from the void, crystallized in time."*

**享受你的雪花加密之旅！** ❄️✨

*Enjoy your snowflake encryption journey!*

</div>
