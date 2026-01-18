// 简单的加密工具（用于演示，实际应用需要更强的加密）

export function simpleEncrypt(text: string, key: string): string {
  const combined = text + key;
  return btoa(encodeURIComponent(combined));
}

export function simpleDecrypt(encrypted: string, key: string): string {
  try {
    const decoded = decodeURIComponent(atob(encrypted));
    return decoded.replace(key, '');
  } catch {
    return '';
  }
}

// 生成加密密钥（基于时间戳和随机数）
export function generateKey(): string {
  return Date.now().toString(36) + Math.random().toString(36).substring(2);
}
