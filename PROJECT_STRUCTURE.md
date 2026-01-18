# 📁 项目结构说明

## 目录结构

```
snowflake-encryption-protocol/
├── components/              # React 组件
│   ├── LandingView.tsx     # 首页 - 晶体种子
│   ├── EncryptView.tsx     # 加密页 - 输入文字
│   ├── DecryptView.tsx     # 解密页 - 雪花展示 + 倒计时
│   ├── AfterglowView.tsx   # 余晖页 - 导出功能
│   └── GalleryView.tsx     # 博物馆 - 雪花画廊
├── utils/                   # 工具函数
│   ├── snowflakeGenerator.ts  # 雪花生成算法
│   └── encryption.ts        # 加密工具（可选）
├── App.tsx                  # 主应用 - 路由管理
├── index.tsx               # 入口文件
├── index.html              # HTML 模板
├── index.css               # 全局样式
├── vite.config.ts          # Vite 配置
├── tsconfig.json           # TypeScript 配置
├── package.json            # 依赖管理
├── README.md               # 项目说明
├── QUICKSTART.md           # 快速启动
├── USAGE.md                # 使用指南
├── DEPLOYMENT.md           # 部署指南
├── netlify.toml            # Netlify 配置
└── vercel.json             # Vercel 配置
```

---

## 核心文件说明

### 🎨 组件层 (components/)

#### LandingView.tsx
**职责**: 应用首页
- 展示"晶体种子"动画
- 提供进入加密页面的入口
- 提供进入博物馆的入口

**关键元素**:
- 中央可点击的晶体球
- 脉冲动画效果
- 侧边栏博物馆入口

---

#### EncryptView.tsx
**职责**: 文字输入和加密
- 接收用户输入的文字
- 选择水晶精华风格
- 触发雪花生成

**状态管理**:
```typescript
const [text, setText] = useState("");
const [essence, setEssence] = useState<'aurora' | 'stardust'>('aurora');
const [isGenerating, setIsGenerating] = useState(false);
```

**核心功能**:
- 实时文字输入
- 风格选择器
- 生成按钮（带加载状态）

---

#### DecryptView.tsx
**职责**: 雪花展示和倒计时
- 显示生成的雪花
- 60秒倒计时
- 雪花旋转动画
- 融化效果

**状态管理**:
```typescript
const [timeLeft, setTimeLeft] = useState(60);
const [rotation, setRotation] = useState(0);
const [isMelting, setIsMelting] = useState(false);
```

**核心功能**:
- 基于文字生成独特雪花
- 每秒更新倒计时
- 每50ms更新旋转角度
- 倒计时结束触发融化动画

---

#### AfterglowView.tsx
**职责**: 雪花导出和保存
- 预览雪花艺术品
- 选择画布类型
- 导出 SVG 文件

**画布类型**:
- Minimalist Postcard (明信片)
- Desktop Wallpaper (桌面壁纸)
- Mobile Lockscreen (手机锁屏)

**导出功能**:
```typescript
const handleExport = async () => {
  const link = document.createElement('a');
  link.download = `snowflake-${Date.now()}.svg`;
  link.href = snowflakeURL;
  link.click();
};
```

---

#### GalleryView.tsx
**职责**: 雪花博物馆
- 展示示例雪花
- 提供创作灵感
- 社区氛围营造

**特性**:
- 网格布局
- 悬停效果
- 返回首页按钮

---

### 🛠️ 工具层 (utils/)

#### snowflakeGenerator.ts
**核心算法文件**

**主要函数**:

1. `hashString(str: string): number`
   - 将文字转换为数字种子
   - 使用简单的哈希算法

2. `generateSnowflakeParams(text: string): SnowflakeParams`
   - 基于文字生成雪花参数
   - 返回分支数、复杂度、对称性等

3. `generateSnowflakeSVG(params, size): string`
   - 生成 SVG 代码
   - 包含渐变、滤镜、发光效果

4. `generateSnowflakeDataURL(text, size): string`
   - 生成可直接使用的 Data URL
   - 用于 `<img>` 标签的 src 属性

**算法原理**:
```
文字 → Hash → 种子 → 伪随机数生成器 → 分形参数 → SVG路径
```

---

#### encryption.ts
**可选加密工具**

目前实现简单的 Base64 编码，可扩展为：
- AES 加密
- RSA 非对称加密
- 端到端加密

---

### 🎯 应用层

#### App.tsx
**职责**: 应用路由和状态管理

**视图枚举**:
```typescript
enum View {
  LANDING = 'landing',
  ENCRYPT = 'encrypt',
  DECRYPT = 'decrypt',
  AFTERGLOW = 'afterglow',
  GALLERY = 'gallery'
}
```

**状态流转**:
```
LANDING → ENCRYPT → DECRYPT → AFTERGLOW
   ↓                              ↓
GALLERY ←←←←←←←←←←←←←←←←←←←←←←←←←←←
```

---

## 🎨 样式系统

### Tailwind CSS 配置

**自定义颜色**:
```javascript
colors: {
  "primary": "#38dafa",           // 主色 - 冰蓝
  "background-dark": "#090B11",   // 背景 - 深空
  "aurora-purple": "#CB73FC",     // 极光紫
  "aurora-emerald": "#50fa7b",    // 极光绿
  "glacial": "#D1DCE3"            // 冰川白
}
```

**自定义字体**:
- `font-display`: Space Grotesk (标题)
- `font-serif`: Playfair Display (正文)
- `font-noto`: Noto Serif (中文优化)

**自定义工具类**:
- `.crystal-glow`: 水晶发光效果
- `.aurora-glow`: 极光光晕
- `.stardust-bg`: 星尘背景

---

## 🔄 数据流

### 加密流程
```
用户输入文字
    ↓
EncryptView 接收
    ↓
生成雪花参数
    ↓
传递给 DecryptView
    ↓
显示雪花 + 倒计时
    ↓
(可选) 进入 AfterglowView
    ↓
导出 SVG
```

### 状态传递
```typescript
// App.tsx
const [message, setMessage] = useState<string>("");

// EncryptView → DecryptView
onCrystallized={(msg) => {
  setMessage(msg);
  setCurrentView(View.DECRYPT);
}}

// DecryptView → AfterglowView
<AfterglowView message={message} />
```

---

## 🚀 性能优化

### 1. useMemo 缓存雪花生成
```typescript
const snowflakeURL = useMemo(
  () => generateSnowflakeDataURL(message, 800),
  [message]
);
```

### 2. 动画优化
- 使用 CSS transform 而非 position
- requestAnimationFrame 控制旋转
- GPU 加速 (transform, opacity)

### 3. 代码分割
Vite 自动进行代码分割，按需加载组件。

---

## 🧪 扩展建议

### 功能扩展
1. **用户账户系统**: 保存历史雪花
2. **分享功能**: 生成分享链接
3. **自定义倒计时**: 让用户设置时长
4. **音效**: 添加环境音乐
5. **3D 渲染**: 使用 Three.js 实现真 3D

### 技术升级
1. **状态管理**: 引入 Zustand 或 Redux
2. **路由**: 使用 React Router
3. **测试**: 添加 Jest + React Testing Library
4. **PWA**: 支持离线使用
5. **国际化**: 多语言支持

---

## 📝 代码规范

### 命名约定
- 组件: PascalCase (LandingView)
- 函数: camelCase (generateSnowflake)
- 常量: UPPER_SNAKE_CASE (MAX_TIME)
- 类型: PascalCase (SnowflakeParams)

### 文件组织
- 一个文件一个组件
- 工具函数独立文件
- 类型定义在文件顶部

### TypeScript
- 所有 props 必须定义接口
- 避免使用 any
- 优先使用类型推导

---

*这个项目结构清晰、易于扩展，祝你开发愉快！* 🎉
