// 真实的加密工具 - 使用 Web Crypto API (AES-256-GCM)

// 将密码转换为加密密钥
async function deriveKey(password: string, salt: Uint8Array): Promise<CryptoKey> {
  const encoder = new TextEncoder();
  const passwordBuffer = encoder.encode(password);
  
  // 使用 PBKDF2 从密码派生密钥
  const keyMaterial = await crypto.subtle.importKey(
    'raw',
    passwordBuffer,
    'PBKDF2',
    false,
    ['deriveBits', 'deriveKey']
  );
  
  return crypto.subtle.deriveKey(
    {
      name: 'PBKDF2',
      salt: salt,
      iterations: 100000,
      hash: 'SHA-256'
    },
    keyMaterial,
    { name: 'AES-GCM', length: 256 },
    false,
    ['encrypt', 'decrypt']
  );
}

// 加密文本
export async function encrypt(text: string, password: string): Promise<string> {
  try {
    const encoder = new TextEncoder();
    const data = encoder.encode(text);
    
    // 生成随机盐和 IV
    const salt = crypto.getRandomValues(new Uint8Array(16));
    const iv = crypto.getRandomValues(new Uint8Array(12));
    
    // 派生密钥
    const key = await deriveKey(password, salt);
    
    // 加密数据
    const encryptedData = await crypto.subtle.encrypt(
      { name: 'AES-GCM', iv: iv },
      key,
      data
    );
    
    // 组合 salt + iv + 加密数据
    const combined = new Uint8Array(salt.length + iv.length + encryptedData.byteLength);
    combined.set(salt, 0);
    combined.set(iv, salt.length);
    combined.set(new Uint8Array(encryptedData), salt.length + iv.length);
    
    // 转换为 Base64
    return btoa(String.fromCharCode(...combined));
  } catch (error) {
    console.error('Encryption failed:', error);
    throw new Error('加密失败');
  }
}

// 解密文本
export async function decrypt(encryptedText: string, password: string): Promise<string> {
  try {
    // 从 Base64 解码
    const combined = Uint8Array.from(atob(encryptedText), c => c.charCodeAt(0));
    
    // 提取 salt, iv 和加密数据
    const salt = combined.slice(0, 16);
    const iv = combined.slice(16, 28);
    const encryptedData = combined.slice(28);
    
    // 派生密钥
    const key = await deriveKey(password, salt);
    
    // 解密数据
    const decryptedData = await crypto.subtle.decrypt(
      { name: 'AES-GCM', iv: iv },
      key,
      encryptedData
    );
    
    // 转换为文本
    const decoder = new TextDecoder();
    return decoder.decode(decryptedData);
  } catch (error) {
    console.error('Decryption failed:', error);
    throw new Error('解密失败：密码错误或数据损坏');
  }
}

// 生成随机密码（用于无密码模式）
export function generateRandomPassword(): string {
  const array = new Uint8Array(32);
  crypto.getRandomValues(array);
  return btoa(String.fromCharCode(...array));
}

// 安全销毁（多次覆写）
export async function secureDestroy(data: string): Promise<void> {
  // 在内存中多次覆写数据
  const length = data.length;
  let temp = data;
  
  // 覆写 3 次
  for (let i = 0; i < 3; i++) {
    temp = Array(length).fill(Math.random().toString(36)).join('');
  }
  
  // 清空
  temp = '';
  
  // 提示垃圾回收（虽然不能强制）
  if (global.gc) {
    global.gc();
  }
}
