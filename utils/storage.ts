// 本地存储工具 - 保存和读取雪花历史

export interface SnowflakeRecord {
  id: string;
  message: string; // 明文消息（用于显示）
  encryptedMessage?: string; // 加密后的消息（可选）
  hasPassword: boolean; // 是否设置了密码
  timestamp: number;
  essence: 'aurora' | 'stardust';
}

const STORAGE_KEY = 'snowflake_whispers';
const PRESET_INITIALIZED_KEY = 'snowflake_preset_initialized';
const MAX_RECORDS = 50; // 最多保存50条记录

// 精美的预设心语
const PRESET_WHISPERS: Array<{
  message: string;
  essence: 'aurora' | 'stardust';
}> = [
  // 浪漫诗意类
  { message: '在我们第一次看到星星的地方见面', essence: 'aurora' },
  { message: 'Meet me where we first saw the stars', essence: 'stardust' },
  { message: '时间冻结的瞬间，像掌心的雪花', essence: 'aurora' },
  { message: '月光洒在你的发梢，我想留住这一刻', essence: 'stardust' },
  { message: 'Every snowflake is a kiss from heaven', essence: 'aurora' },
  
  // 哲理思考类
  { message: '世上没有两片相同的雪花，也没有两个相同的灵魂', essence: 'stardust' },
  { message: '来自虚空的低语，在时间中结晶', essence: 'aurora' },
  { message: 'In the silence between heartbeats, I found eternity', essence: 'stardust' },
  { message: '所有的相遇都是久别重逢', essence: 'aurora' },
  
  // 美好祝愿类
  { message: '愿你的每一天都像雪花一样独特而美丽', essence: 'stardust' },
  { message: 'May your dreams crystallize into reality', essence: 'aurora' },
  { message: '在最寒冷的冬天，也要保持心中的温暖', essence: 'stardust' },
  
  // 神秘浪漫类
  { message: '午夜的钟声响起时，我会在老地方等你', essence: 'aurora' },
  { message: 'The secret garden blooms only for those who believe', essence: 'stardust' },
  { message: '北极光下的誓言，永不褪色', essence: 'aurora' },
  
  // 文艺清新类
  { message: '樱花落下的速度是每秒五厘米，我想你的速度是每秒一万次', essence: 'stardust' },
  { message: '如果云知道，它会带走我所有的思念', essence: 'aurora' },
  { message: 'Between the pages of time, I found your smile', essence: 'stardust' },
  
  // 励志温暖类
  { message: '即使融化，也要绽放最美的光芒', essence: 'aurora' },
  { message: 'Every ending is a new beginning in disguise', essence: 'stardust' },
  
  // 神秘密语类
  { message: '当第七颗星星升起时，秘密将被揭晓', essence: 'aurora' },
  { message: 'The key is hidden where the moonlight touches the water', essence: 'stardust' },
  { message: '三个字，藏在这片雪花的第七个分支里', essence: 'aurora' },
  
  // 纪念日期类
  { message: '2026.01.18 - 一切改变的那一天', essence: 'stardust' },
  { message: '这是我们的第1000天，也是新的开始', essence: 'aurora' },
];

// 保存雪花记录
export function saveSnowflake(
  message: string, 
  essence: 'aurora' | 'stardust' = 'aurora',
  encryptedMessage?: string,
  hasPassword: boolean = false
): void {
  try {
    const records = getSnowflakes();
    const newRecord: SnowflakeRecord = {
      id: Date.now().toString(),
      message,
      encryptedMessage,
      hasPassword,
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

// 初始化预设心语
function initializePresets(): void {
  try {
    const isInitialized = localStorage.getItem(PRESET_INITIALIZED_KEY);
    if (isInitialized) return; // 已经初始化过了
    
    const records: SnowflakeRecord[] = [];
    const baseTimestamp = Date.now() - (PRESET_WHISPERS.length * 3600000); // 从几小时前开始
    
    // 创建预设记录
    PRESET_WHISPERS.forEach((preset, index) => {
      records.push({
        id: `preset_${index}_${Date.now()}`,
        message: preset.message,
        hasPassword: false,
        timestamp: baseTimestamp + (index * 3600000), // 每个相隔1小时
        essence: preset.essence
      });
    });
    
    // 保存到本地存储
    localStorage.setItem(STORAGE_KEY, JSON.stringify(records));
    localStorage.setItem(PRESET_INITIALIZED_KEY, 'true');
  } catch (error) {
    console.error('Failed to initialize presets:', error);
  }
}

// 获取所有雪花记录
export function getSnowflakes(): SnowflakeRecord[] {
  try {
    // 首次访问时初始化预设
    initializePresets();
    
    const data = localStorage.getItem(STORAGE_KEY);
    if (!data) return [];
    return JSON.parse(data);
  } catch (error) {
    console.error('Failed to load snowflakes:', error);
    return [];
  }
}

// 安全删除雪花记录（覆写后删除）
export function deleteSnowflake(id: string): void {
  try {
    const records = getSnowflakes();
    
    // 找到要删除的记录并覆写敏感数据
    const recordToDelete = records.find(r => r.id === id);
    if (recordToDelete) {
      // 多次覆写敏感数据
      for (let i = 0; i < 3; i++) {
        recordToDelete.message = Array(recordToDelete.message.length).fill('*').join('');
        if (recordToDelete.encryptedMessage) {
          recordToDelete.encryptedMessage = Array(recordToDelete.encryptedMessage.length).fill('*').join('');
        }
      }
    }
    
    // 过滤掉该记录
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

// 重置预设（用于测试或重新初始化）
export function resetPresets(): void {
  try {
    localStorage.removeItem(PRESET_INITIALIZED_KEY);
    localStorage.removeItem(STORAGE_KEY);
  } catch (error) {
    console.error('Failed to reset presets:', error);
  }
}
