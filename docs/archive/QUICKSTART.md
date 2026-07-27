# 快速开始

当前版本不是纯静态 Demo：本地开发使用内存 API，生产环境使用 Vercel Functions + Upstash Redis。
需要 Node.js 24.x。

```bash
npm ci
npm run dev
```

打开 <http://127.0.0.1:3000>。本地服务重启后，尚未读取的测试雪信会清空。

发布前运行：

```bash
npm run check:release
```

不要把 `dist/` 拖到静态托管，也不要直接运行 `vercel --prod`。正式环境需要先配置三个服务器端变量并完成一次性读取验收，完整步骤见 [DEPLOYMENT.md](./DEPLOYMENT.md)。

协议、安全边界和产品验收分别见 [SPEC.md](./SPEC.md)、[SECURITY.md](./SECURITY.md) 与 [PRODUCT_SPEC.md](./PRODUCT_SPEC.md)。仓库内其他带版本号的中文说明属于早期原型记录，不代表当前发布流程。
