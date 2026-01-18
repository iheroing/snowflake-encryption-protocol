// 本地存储工具 - 保存和读取雪花历史

export interface SnowflakeRecord {
  id: string;
  message: string;
  timestamp: number;
  essence: 'aurora' | 'stardust';
}

const STORAGE_KEY = 'snowflake_whispers';
const MAX_RECORDS = 50; // 最多保存50条记录

// 保存雪花记录
export function saveSnowflake(message: string, essence: 'aurora' | 'stardust' = 'aurora'): void {
  try {
    const records = getSnowflakes();
    const newRecord: SnowflakeRecord = {
      id: Date.now().toString(),
      message,
      timestamp: Date.now(),
      essence
    };
    
    // 添加到开头
    records.unshift(newRecord);
    
    // 限制数量
    if (records.length > MAX_RECORDS) {
      records.splice(MAX_RECORDS);
    }
    
    localStorage.setItem(STORAGE_KEY, JSON.stringify(records));
  } catch (error) {
    console.error('Failed to save snowflake:', error);
  }
}

// 获取所有雪花记录
export function getSnowflakes(): SnowflakeRecord[] {
  try {
    const data = localStorage.getItem(STORAGE_KEY);
    if (!data) return [];
    return JSON.parse(data);
  } catch (error) {
    console.error('Failed to load snowflakes:', error);
    return [];
  }
}

// 删除雪花记录
export function deleteSnowflake(id: string): void {
  try {
    const records = getSnowflakes();
    const filtered = records.filter(r => r.id !== id);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(filtered));
  } catch (error) {
    console.error('Failed to delete snowflake:', error);
  }
}

// 清空所有记录
export function clearSnowflakes(): void {
  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch (error) {
    console.error('Failed to clear snowflakes:', error);
  }
}

// 获取记录数量
export function getSnowflakeCount(): number {
  return getSnowflakes().length;
}
