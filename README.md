# 雪花密语 Snowflake Whisper

一封只能被主动揭开一次的雪信。写信人的文字在浏览器中加密，服务端只保存限时密文；收信人主动揭开后，密文会被原子地读取并删除。

## 产品特性

- 浏览器端 AES-256-GCM 加密，每封信使用随机内容密钥。
- 解密密钥、独立消费凭证和可选的一致性检查点只放在 URL fragment（`#k=...&c=...&r=...`）中；解密密钥不随 HTTP 请求发给服务端。
- Redis Lua 在同一存储会话中原子校验消费凭证、读取并删除；只知道公开路径 ID 不能销毁雪信。
- 1 小时、24 小时、7 天三种未读有效期。
- 链接预览与状态检查不消耗阅读机会；只有用户点击「揭开雪信」才会消费。
- 每封信用本地随机私盐与文字派生高熵视觉签名，再从星枝、蕨枝、六角板、针晶、分叉星五类晶型中生成稳定的六重对称雪花；相同文字在不同信中也拥有不同雪印。
- 支持复制、系统分享和按需生成的跨设备二维码；二维码完全在浏览器内生成，不经过第三方服务。
- 中英文、键盘操作、减弱动效、高对比度与 320px 起的响应式界面。

## 快速开发

要求 Node.js 24.x；本地、CI 与 Vercel Functions 使用同一主版本。

```bash
npm install
npm run dev
```

Vite 开发服务器内置了仅用于本地测试的内存 API，重启后数据会清空。生产环境必须配置 Upstash Redis 和 Vercel Functions；Vercel Marketplace 的 `KV_REST_API_*` 与直接管理 Upstash 时的 `UPSTASH_REDIS_REST_*` 均受支持，参见 [DEPLOYMENT.md](./DEPLOYMENT.md)。

发布前执行：

```bash
npm run type-check
npm test
npm run build
npm audit
```

## 协议概要

1. 客户端生成 128-bit 随机 ID、256-bit fragment secret、独立消费凭证和内容密钥。
2. 正文用 AES-256-GCM 加密；fragment secret 经 HKDF-SHA-256 派生包装密钥，再包装内容密钥。
3. AAD 绑定协议版本、ID、有效期与雪花签名，防止密文与元数据被静默替换。
4. 服务端仅存储信封、消费凭证哈希和撤回令牌哈希。收信人先在本地校验 fragment secret，再携带独立消费凭证和最新一致性检查点调用原子 consume。

精确字段、规范 AAD 和 API 语义见 [SPEC.md](./SPEC.md)；状态机与发布验收条件见 [PRODUCT_SPEC.md](./PRODUCT_SPEC.md)。

## 安全边界

这不是匿名通信工具、密码管理器或永久云笔记。它无法阻止收信人截图、录屏或复制已经显示的内容。服务运营方仍可能看到 IP、访问时间和密文大小；端到端加密也仍需信任当前网站交付的前端代码。

请不要用它传递密码、私钥、身份凭证或其他高风险秘密。在完成独立安全审计前，项目不宣称「绝对安全」「物理安全擦除」或基础设施故障下的严格线性一致。
完整威胁模型与漏洞报告方式见 [SECURITY.md](./SECURITY.md)。

## 设计参考

[nxfu/binthere](https://github.com/nxfu/binthere) 证明了「fragment 携带客户端密钥 + 服务端原子一次消费」是一条简洁、可审计的路径。本项目借鉴这些协议思想和本地二维码分享方式，但使用自己的版本化信封、AAD 绑定、删除令牌与雪花产品交互。

## 项目结构

```text
components/                 核心界面
protocol/oneTimeWhisper.ts  浏览器加解密协议
utils/oneTimeWhisper.ts     前端 API 客户端
api/snow/                   Vercel Functions 路由
api/_lib/                   验证、服务和 Redis 适配器
```

`components/EncryptView.tsx`、`GalleryView.tsx` 等旧组件仅作为历史原型保留，不在生产主链路中加载。仓库中较早的中文说明文档记录原型演进，不代表当前产品承诺。
