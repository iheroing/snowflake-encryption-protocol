# 🤖 Dev Story: How I Built This with Kiro

> **Project**: Snowflake Whisper
> **Role**: AI-Assisted Developer

## 1. 灵感与挑战 (The Spark)
我想做一个"看得见的加密"工具。普通的加密是乱码，无聊且冰冷。我想让加密变成"雪花"——美丽、独特、易逝。
**难点**：我不懂分形几何算法，也不熟悉 Web Crypto API 的底层实现。

## 2. Kiro 的魔法 (The Kiro Magic)

### A. 算法生成 (The Algorithm)
我向 Kiro 描述需求：
> "写一个函数，输入字符串，输出一个 SVG Path。要求基于字符串的 Hash 值决定分支数量、长度和角度，必须对称。"

Kiro 直接生成了 `snowflakeGenerator.ts`，使用了递归分形逻辑。它甚至自动考虑了性能，限制了递归深度。
*Human effort: 0% | AI effort: 100%*

### B. 安全实现 (The Security)
我要求使用"真正的加密，不要只是编码"。
Kiro 引入了 `window.crypto.subtle`，实现了：
- PBKDF2 密钥派生 (从密码生成 Key)
- AES-GCM 加密 (带 Auth Tag 防篡改)
- 随机 IV 生成
这让原本只是"玩具"的项目拥有了军事级的安全性。

### C. 视觉调优 (The Aesthetics)
我告诉 Kiro："要看起来像科幻电影里的全息投影"。
Kiro 推荐了 Tailwind CSS 的配置：
- `backdrop-blur-xl` (毛玻璃)
- `animate-pulse` (呼吸感)
- 自定义颜色 `aurora-purple` 和 `stardust-bg`

## 3. 效率提升 (The Speed)
- **Concept to Prototype**: 20 分钟
- **Refinement**: 30 分钟
- **Documentation**: 10 分钟 (Kiro 帮我写了 README)

**结论**:
Kiro 不仅仅是 Copilot，它是我的 **Algorithm Architect** 和 **Security Consultant**。它填补了我从"想法"到"实现"之间最大的技术鸿沟。
