# 🚀 部署指南

## 部署到 Vercel (推荐)

Vercel 是最简单的部署方式，完全免费。

### 步骤：

1. 将代码推送到 GitHub
2. 访问 [vercel.com](https://vercel.com)
3. 点击 "Import Project"
4. 选择你的 GitHub 仓库
5. Vercel 会自动检测 Vite 配置
6. 点击 "Deploy"

完成！你的应用会在几分钟内上线。

### 自定义域名

在 Vercel 项目设置中可以添加自定义域名。

---

## 部署到 Netlify

### 步骤：

1. 将代码推送到 GitHub
2. 访问 [netlify.com](https://netlify.com)
3. 点击 "Add new site" → "Import an existing project"
4. 选择你的 GitHub 仓库
5. 构建设置会自动从 `netlify.toml` 读取
6. 点击 "Deploy site"

---

## 部署到 GitHub Pages

### 步骤：

1. 修改 `vite.config.ts`，添加 base 路径：
```typescript
export default defineConfig({
  base: '/your-repo-name/',
  // ... 其他配置
})
```

2. 构建项目：
```bash
npm run build
```

3. 部署到 gh-pages 分支：
```bash
npm install -g gh-pages
gh-pages -d dist
```

4. 在 GitHub 仓库设置中启用 GitHub Pages，选择 gh-pages 分支

---

## 部署到自己的服务器

### 步骤：

1. 构建项目：
```bash
npm run build
```

2. 将 `dist` 文件夹上传到服务器

3. 配置 Nginx：
```nginx
server {
    listen 80;
    server_name your-domain.com;
    root /path/to/dist;
    index index.html;

    location / {
        try_files $uri $uri/ /index.html;
    }
}
```

4. 重启 Nginx：
```bash
sudo systemctl restart nginx
```

---

## 环境变量

如果需要使用 Gemini API（可选功能），在部署平台设置环境变量：

```
GEMINI_API_KEY=your_api_key_here
```

---

## 性能优化建议

1. **启用 Gzip 压缩**: 大多数托管平台默认启用
2. **CDN 加速**: Vercel 和 Netlify 自带全球 CDN
3. **图片优化**: 考虑使用 WebP 格式
4. **代码分割**: Vite 已自动处理

---

## 故障排查

### 页面刷新 404

确保配置了 SPA 路由重定向（已在 `vercel.json` 和 `netlify.toml` 中配置）

### 样式不显示

检查 Tailwind CDN 是否正常加载，或考虑使用本地 Tailwind 配置

### 字体加载失败

确保 Google Fonts 链接可访问，或使用本地字体文件

---

*祝部署顺利！❄️*
