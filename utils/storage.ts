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
  { message: '你的笑容，是我见过最美的风景', essence: 'stardust' },
  { message: '如果可以，我想把这一刻定格成永恒', essence: 'aurora' },
  { message: 'In your eyes, I found my universe', essence: 'stardust' },
  
  // 哲理思考类
  { message: '世上没有两片相同的雪花，也没有两个相同的灵魂', essence: 'stardust' },
  { message: '来自虚空的低语，在时间中结晶', essence: 'aurora' },
  { message: 'In the silence between heartbeats, I found eternity', essence: 'stardust' },
  { message: '所有的相遇都是久别重逢', essence: 'aurora' },
  { message: '时间是最温柔的刀，雕刻着我们的故事', essence: 'stardust' },
  { message: 'We are all stardust, temporarily gathered', essence: 'aurora' },
  
  // 美好祝愿类
  { message: '愿你的每一天都像雪花一样独特而美丽', essence: 'stardust' },
  { message: 'May your dreams crystallize into reality', essence: 'aurora' },
  { message: '在最寒冷的冬天，也要保持心中的温暖', essence: 'stardust' },
  { message: '愿所有美好如期而至，愿所有温柔都被善待', essence: 'aurora' },
  { message: 'May the stars guide you home', essence: 'stardust' },
  
  // 神秘浪漫类
  { message: '午夜的钟声响起时，我会在老地方等你', essence: 'aurora' },
  { message: 'The secret garden blooms only for those who believe', essence: 'stardust' },
  { message: '北极光下的誓言，永不褪色', essence: 'aurora' },
  { message: '在星空下许下的愿望，总会实现', essence: 'stardust' },
  { message: 'Where the moonlight meets the ocean, our story begins', essence: 'aurora' },
  
  // 文艺清新类
  { message: '樱花落下的速度是每秒五厘米，我想你的速度是每秒一万次', essence: 'stardust' },
  { message: '如果云知道，它会带走我所有的思念', essence: 'aurora' },
  { message: 'Between the pages of time, I found your smile', essence: 'stardust' },
  { message: '风吹过的地方，都是你的温柔', essence: 'aurora' },
  { message: 'The universe whispered your name to me', essence: 'stardust' },
  
  // 励志温暖类
  { message: '即使融化，也要绽放最美的光芒', essence: 'aurora' },
  { message: 'Every ending is a new beginning in disguise', essence: 'stardust' },
  { message: '黎明前的黑暗，是为了迎接更灿烂的光', essence: 'aurora' },
  { message: 'You are braver than you believe', essence: 'stardust' },
  { message: '每一次跌倒，都是为了更好地站起来', essence: 'aurora' },
  
  // 神秘密语类
  { message: '当第七颗星星升起时，秘密将被揭晓', essence: 'aurora' },
  { message: 'The key is hidden where the moonlight touches the water', essence: 'stardust' },
  { message: '三个字，藏在这片雪花的第七个分支里', essence: 'aurora' },
  { message: 'Follow the northern lights to find the truth', essence: 'stardust' },
  { message: '答案就在你最初的选择里', essence: 'aurora' },
  
  // 纪念日期类
  { message: '2026.01.18 - 一切改变的那一天', essence: 'stardust' },
  { message: '这是我们的第1000天，也是新的开始', essence: 'aurora' },
  { message: '2026年的第一场雪，见证了我们的约定', essence: 'stardust' },
  { message: 'The day we met, the universe smiled', essence: 'aurora' },
  
  // 季节与自然类
  { message: '春天的第一朵花，为你而开', essence: 'stardust' },
  { message: '夏夜的萤火虫，带着我的思念飞向你', essence: 'aurora' },
  { message: '秋天的落叶，写满了我想说的话', essence: 'stardust' },
  { message: '冬日的暖阳，是你给我的温柔', essence: 'aurora' },
  { message: 'The ocean remembers every wave, as I remember you', essence: 'stardust' },
  
  // 音乐与艺术类
  { message: '你的名字，是我听过最美的旋律', essence: 'aurora' },
  { message: 'Life is a symphony, and you are my favorite note', essence: 'stardust' },
  { message: '在音乐停止的地方，我们的故事开始', essence: 'aurora' },
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

// 获取所有雪花记录
export function getSnowflakes(): SnowflakeRecord[] {
  try {
    console.log('[Storage] Getting snowflakes...');
    const data = localStorage.getItem(STORAGE_KEY);
    const records: SnowflakeRecord[] = data ? JSON.parse(data) : [];
    console.log('[Storage] Current records:', records.length);
    
    // 检查是否有预设（通过 ID 前缀判断）
    const hasPresets = records.some(r => r.id.startsWith('preset_'));
    console.log('[Storage] Has presets:', hasPresets);
    
    // 如果没有预设，自动加载
    if (!hasPresets && PRESET_WHISPERS.length > 0) {
      console.log('[Storage] Loading presets...', PRESET_WHISPERS.length);
      const baseTimestamp = Date.now() - (PRESET_WHISPERS.length * 3600000);
      const presetRecords: SnowflakeRecord[] = PRESET_WHISPERS.map((preset, index) => ({
        id: `preset_${index}_${Date.now()}`,
        message: preset.message,
        hasPassword: false,
        timestamp: baseTimestamp + (index * 3600000),
        essence: preset.essence
      }));
      
      // 合并预设和现有记录
      const allRecords = [...presetRecords, ...records];
      localStorage.setItem(STORAGE_KEY, JSON.stringify(allRecords));
      console.log('[Storage] Presets loaded! Total records:', allRecords.length);
      return allRecords;
    }
    
    console.log('[Storage] Returning existing records:', records.length);
    return records;
  } catch (error) {
    console.error('[Storage] Failed to load snowflakes:', error);
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
    localStorage.removeItem(STORAGE_KEY);
  } catch (error) {
    console.error('Failed to reset presets:', error);
  }
}

// 强制加载预设（即使已经初始化过）
export function forceLoadPresets(): void {
  try {
    // 获取现有记录
    const existingData = localStorage.getItem(STORAGE_KEY);
    const existingRecords: SnowflakeRecord[] = existingData ? JSON.parse(existingData) : [];
    
    // 检查是否已经有预设（通过 ID 前缀判断）
    const hasPresets = existingRecords.some(r => r.id.startsWith('preset_'));
    if (hasPresets) {
      console.log('Presets already loaded');
      return;
    }
    
    const baseTimestamp = Date.now() - (PRESET_WHISPERS.length * 3600000);
    
    // 创建预设记录
    const presetRecords: SnowflakeRecord[] = PRESET_WHISPERS.map((preset, index) => ({
      id: `preset_${index}_${Date.now()}`,
      message: preset.message,
      hasPassword: false,
      timestamp: baseTimestamp + (index * 3600000),
      essence: preset.essence
    }));
    
    // 合并预设和现有记录
    const allRecords = [...presetRecords, ...existingRecords];
    
    // 保存
    localStorage.setItem(STORAGE_KEY, JSON.stringify(allRecords));
    
    console.log('Presets loaded successfully!');
  } catch (error) {
    console.error('Failed to force load presets:', error);
  }
}
