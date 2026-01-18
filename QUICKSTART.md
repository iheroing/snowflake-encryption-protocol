# ⚡ 快速启动指南

## 🚀 3步启动

### 1️⃣ 安装依赖
```bash
npm install
```

### 2️⃣ 启动开发服务器
```bash
npm run dev
```

### 3️⃣ 打开浏览器
访问: http://localhost:3000

---

## ✅ 验证安装

启动后你应该看到：

```
  VITE v6.2.0  ready in XXX ms

  ➜  Local:   http://localhost:3000/
  ➜  Network: use --host to expose
```

---

## 🎯 第一次使用

1. 点击中央的"晶体种子"
2. 输入 "Hello World 2026"
3. 点击 "Crystallize Secret"
4. 观看你的第一片雪花诞生！

---

## 📦 构建生产版本

```bash
npm run build
```

构建产物在 `dist/` 文件夹中。

---

## 🌐 部署到线上

### 最简单方式 - Vercel

1. 推送代码到 GitHub
2. 访问 [vercel.com](https://vercel.com)
3. 导入你的仓库
4. 点击 Deploy

**完成！** 你的应用会在几分钟内上线。

### 其他选择

- **Netlify**: 同样简单，拖拽 `dist` 文件夹即可
- **GitHub Pages**: 免费，适合个人项目
- **自己的服务器**: 上传 `dist` 文件夹

详细部署指南见 [DEPLOYMENT.md](DEPLOYMENT.md)

---

## 🛠️ 故障排查

### 端口被占用
```bash
# 使用其他端口
npm run dev -- --port 3001
```

### 依赖安装失败
```bash
# 清除缓存重试
rm -rf node_modules package-lock.json
npm install
```

### 构建失败
```bash
# 检查 TypeScript 错误
npx tsc --noEmit
```

---

## 📚 更多资源

- [完整使用指南](USAGE.md)
- [部署指南](DEPLOYMENT.md)
- [项目说明](README.md)

---

**准备好了吗？开始创造你的第一片雪花吧！** ❄️✨
