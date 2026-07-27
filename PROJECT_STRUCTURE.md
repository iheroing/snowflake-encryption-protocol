# 项目结构说明

这份文档描述当前生产主链路。历史原型说明和旧版本记录已归档到 `docs/archive/`，不作为当前产品承诺。

## 根目录权威文档

- `README.md`：产品入口、快速开发、协议概要与安全边界。
- `SPEC.md`：Snowflake Whisper v1 协议、AAD、API 与测试向量。
- `SECURITY.md`：威胁模型、安全边界和运营要求。
- `PRODUCT_SPEC.md`：V1 主流程、验收门槛和体验语气。
- `DEPLOYMENT.md`：Vercel + Upstash Redis 部署说明。
- `PROJECT_STRUCTURE.md`：当前仓库结构索引。

## 当前生产结构

```text
snowflake-whisper/
├── App.tsx                         # 生产视图路由与敏感状态清理
├── index.tsx                       # React 入口、Provider 与 Vercel Analytics redaction
├── index.html                      # HTML shell、SEO/OG、noscript fallback
├── index.css                       # 主视觉、响应式、可访问性与动效样式
├── vite.config.ts                  # /snowflake/ mount、Tailwind v4 entry、开发 API 插件
├── vercel.json                     # 安全头、rewrites 与生产路由
├── components/
│   ├── LandingView.tsx             # 首页与入口
│   ├── ComposeView.tsx             # 写信、TTL、雪花实时预览
│   ├── ShareReadyView.tsx          # 分享、复制、二维码、撤回、收藏入口
│   ├── ReceiveView.tsx             # 收信状态、非消费状态检查、揭开入口
│   ├── RevealView.tsx              # 一次性展示、倒计时、消散与收藏入口
│   ├── SnowflakeGalleryView.tsx    # 不含正文的本机雪花标本馆
│   ├── AfterglowView.tsx           # 不含正文的雪花纪念卡导出
│   ├── AppErrorBoundary.tsx        # 渲染失败兜底
│   ├── Icon.tsx                    # 本地图标组件
│   ├── LanguageToggleButton.tsx    # 中英文切换
│   └── SoundToggleButton.tsx       # 环境音开关
├── contexts/
│   ├── I18nContext.tsx             # 多语言上下文
│   └── SoundContext.tsx            # 声音场景上下文
├── i18n/
│   └── translations.ts             # 中英文产品文案
├── protocol/
│   ├── oneTimeWhisper.ts           # 浏览器端协议实现
│   └── vectors/v1.json             # 冻结测试向量
├── utils/
│   ├── oneTimeWhisper.ts           # 前端 API 客户端与 fragment 处理
│   ├── snowflakeGenerator.ts       # 六重对称雪花视觉引擎
│   ├── signature.ts                # 本地视觉签名与私盐
│   ├── keepsakeGallery.ts          # 无明文本机标本馆
│   ├── analyticsPrivacy.ts         # Vercel Analytics URL 脱敏
│   ├── appPaths.ts                 # /snowflake/ 与历史 /s/:id 路径兼容
│   ├── retryTransient.ts           # 状态检查瞬时错误重试
│   ├── sound.ts                    # 环境音与事件音
│   └── haptics.ts                  # 触觉自然降级
├── api/
│   ├── snow/                       # Vercel Function endpoint wrappers
│   └── _lib/                       # 服务、校验、内存/Upstash store
├── dev/
│   └── snowApiPlugin.ts            # Vite 本地内存 API
├── public/                         # PWA/OG/icon/404/ambience 资源
├── tests/                          # API 与 Vercel entrypoint 测试
├── e2e/                            # Playwright 键盘、移动端与动效回归
├── playwright.config.ts            # 浏览器回归与临时测试产物配置
└── docs/archive/                   # 历史原型文档与旧版本说明
```

## 生产视图状态流

```text
Landing
  ├─ Compose -> ShareReady -> Compose
  ├─ Gallery -> Compose
  └─ Receive -> Reveal -> Landing

ShareReady -> Afterglow -> ShareReady
Reveal -> Afterglow -> Landing
```

## 数据边界

- 正文只进入 `ComposeView`、协议加密流程、`RevealView` 的短时展示状态。
- 服务端只保存密文、过期时间、非秘密元数据和 token hash。
- URL fragment 中的解密密钥不随 HTTP 请求发送。
- `SnowflakeGalleryView` 只读取 `snowflake:keepsakes:v1`，不保存正文、密钥、分享链接或可消费 ID。
- `docs/archive/` 中的早期明文画廊、预设心语和旧部署方案仅用于追溯，不进入生产导航。
