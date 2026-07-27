# Vercel 部署说明

此文件曾记录纯静态原型的部署方式，已经失效。当前产品包含一次性消费 API，不能按旧流程直接部署。

请只使用最新的 [DEPLOYMENT.md](./DEPLOYMENT.md)。在配置 Upstash Redis、独立 `RATE_LIMIT_SALT` 并通过 `npm run check:release` 之前，不要覆盖生产环境。
