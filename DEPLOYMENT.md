# 生产部署

当前后端是 Vercel Functions + Upstash Redis。纯静态托管无法提供一次性消费语义，因此不要将当前版本直接部署到 GitHub Pages。

仓库通过 `package.json` 固定 Node.js 24.x，并让 Vercel 使用 `npm ci` 按锁文件安装；不要在控制台用不同的 Install Command 覆盖它。

## 1. 准备 Redis

1. 在 Upstash 创建 Redis 数据库，区域尽量接近 Vercel Functions 的主要访问区域。
2. 复制 REST URL；优先创建只允许所需命令与 `snow:*` key 的 ACL REST Token。ACL 不可用时应使用项目独立数据库并记录这一风险。
3. 为生产、预览和本地环境使用不同数据库或至少不同凭证。

## 2. 配置 Vercel

推荐在 Vercel Marketplace 中创建并连接 Upstash for Redis；集成会自动设置：

```dotenv
KV_REST_API_URL=https://your-database.upstash.io
KV_REST_API_TOKEN=...
RATE_LIMIT_SALT=...
```

若使用直接在 Upstash Console 管理的数据库，也兼容
`UPSTASH_REDIS_REST_URL` 与 `UPSTASH_REDIS_REST_TOKEN`。两套凭据无需同时配置。

`RATE_LIMIT_SALT` 应是独立的高熵值：

```bash
openssl rand -base64 32
```

不要使用 `VITE_` 前缀，也不要把这些值写入前端配置。

## 3. 发布门禁

```bash
npm ci
npm run type-check
npm test
npm run build
npm audit
```

发布后验证：

1. 创建一封测试雪信，确认生成 `/snowflake/s/{id}#k=...&c=...&r=...` 链接；本地内存 API 可以没有 `r`。历史 `/s/{id}` 链接应继续可用。
2. 另开一个无痕窗口，确认进入收信页但未自动显示正文。
3. 刷新收信页，确认仍可揭开。
4. 点击揭开，确认正文解密成功。
5. 再次打开原链接，确认返回「已揭开或已过期」，不泄露具体原因。
6. 检查响应头中的 CSP、`Referrer-Policy: no-referrer`、HSTS 和 `X-Content-Type-Options: nosniff`。
7. 检查 Vercel 日志：不得出现正文、fragment secret、撤回令牌或完整请求体。
8. 使用隔离的生产同构 Redis 做 25 路并发消费、错误 token、真实 TTL、撤回和跨函数立即读取测试；只有一个请求可以成功。

## 4. 运维边界

- Redis 数据是临时密文，不应启用用于内容恢复的长期备份。
- 分析和错误监控不得采集 URL fragment、请求体或剪贴板。
- 密文在到期前占用 Redis 空间；需监控总条数、失败率、限流率与 API 延迟，但不记录内容。
- 轮换 Redis Token 会立即影响所有 API，应通过 Vercel 环境变量更新并重新部署。
- Upstash 的复制模型是最终一致；URL 中的一致性检查点覆盖常规跨函数 read-your-writes，但不能把基础设施故障描述为严格线性一致。
