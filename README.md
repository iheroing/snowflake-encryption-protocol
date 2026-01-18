# ❄️ 雪花加密协议 | Snowflake Encryption Protocol

<div align="center">

![Version](https://img.shields.io/badge/version-1.0.0-blue)
![License](https://img.shields.io/badge/license-MIT-green)
![React](https://img.shields.io/badge/React-19-61dafb)
![TypeScript](https://img.shields.io/badge/TypeScript-5.8-3178c6)

**极致的浪漫 × 极致的加密**

*A poetic encryption experience inspired by the uniqueness of snowflakes*

[快速开始](#-快速开始) • [在线演示](#) • [文档](#-文档) • [部署](#-部署)

</div>

---

## ✨ 核心概念 | Core Concept

利用"世上没有两片相同的雪花"这个自然界定律，将文字信息编码在独一无二的3D雪花晶体结构里。

*Leveraging nature's law that "no two snowflakes are alike," this app encodes text into unique 3D snowflake crystal structures.*

### 🎯 四大特性 | Four Key Features

| 特性 | 说明 | Feature | Description |
|------|------|---------|-------------|
| ❄️ **独特性** | 基于Hash值通过分形算法生成独一无二的雪花 | **Uniqueness** | Each text generates a unique snowflake via fractal algorithms |
| ⏱️ **易逝性** | 60秒倒计时后雪花融化，信息永远销毁 | **Ephemerality** | Snowflakes melt after 60 seconds, data destroyed forever |
| 🎨 **艺术性** | 生成的雪花极致美丽，可导出保存 | **Artistry** | Beautiful snowflakes that can be exported as art |
| 💕 **浪漫性** | 完美的情话传递方式 | **Romance** | Perfect for sharing secret messages |

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

### 1️⃣ 输入秘密 | Enter Your Secret
在加密页面输入你想要传递的暗号或情话

*Enter your message or secret on the encryption page*

### 2️⃣ 选择氛围 | Choose Essence
- **极光辉光** Aurora Glow - 冰蓝色调
- **星尘闪耀** Stardust Sparkle - 紫色调

### 3️⃣ 生成雪花 | Generate Snowflake
点击"结晶秘密"生成独特的雪花

*Click "Crystallize Secret" to generate your unique snowflake*

### 4️⃣ 观赏倒计时 | Watch the Countdown
雪花会在屏幕上旋转，60秒后融化

*The snowflake rotates on screen and melts after 60 seconds*

### 5️⃣ 导出留念 | Export as Art
在融化前可以导出雪花图像作为永久纪念

*Export the snowflake as high-resolution SVG before it melts*

---

## 🌟 使用场景 | Use Cases

### 💕 浪漫表白 | Romantic Confession
```
"在我们第一次看到星星的地方见面"
"Meet me where we first saw the stars"
```

### 🔐 秘密传递 | Secret Sharing
```
"密码是：极光2026"
"The password is: Aurora2026"
```

### 📝 诗意记录 | Poetic Notes
```
"时间冻结的瞬间，像掌心的雪花"
"A moment frozen in time, like a snowflake in my palm"
```

### 🎂 纪念日期 | Special Dates
```
"2026.01.18 - 一切改变的那一天"
"2026.01.18 - The day everything changed"
```

---

## 🛠️ 技术栈 | Tech Stack

- ⚛️ **React 19** - 用户界面框架
- 📘 **TypeScript** - 类型安全
- ⚡ **Vite** - 构建工具
- 🎨 **Tailwind CSS** - 样式框架
- 🌸 **SVG** - 雪花渲染
- 🔢 **分形算法** - 雪花生成

---

## 📁 项目结构 | Project Structure

```
snowflake-encryption-protocol/
├── components/              # React组件
│   ├── LandingView.tsx     # 首页
│   ├── EncryptView.tsx     # 加密页
│   ├── DecryptView.tsx     # 解密页
│   ├── AfterglowView.tsx   # 余晖页
│   └── GalleryView.tsx     # 博物馆
├── utils/                   # 工具函数
│   ├── snowflakeGenerator.ts  # 雪花生成算法
│   └── encryption.ts        # 加密工具
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

- 🚀 [快速开始.md](快速开始.md) - 3分钟上手指南
- 📖 [USAGE.md](USAGE.md) - 详细使用说明
- 🌐 [DEPLOYMENT.md](DEPLOYMENT.md) - 部署指南
- 🏗️ [PROJECT_STRUCTURE.md](PROJECT_STRUCTURE.md) - 项目结构
- ✅ [测试清单.md](测试清单.md) - 完整测试清单

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

- ✅ 本地生成雪花 | Local generation
- ✅ 不存储用户数据 | No data storage
- ✅ 不发送到服务器 | No server transmission
- ✅ 倒计时后自动销毁 | Auto-destruction after countdown

**注意**: 这是一个艺术性加密项目，主要用于浪漫表白和临时信息传递。如需真正的加密安全，请使用专业加密工具。

*Note: This is an artistic encryption project for romantic messages and temporary sharing. For serious encryption needs, use professional tools.*

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
