// 本地存储工具 - 保存和读取雪花历史

export interface SnowflakeRecord {
  id: string;
  message: string;
  encryptedMessage?: string;
  hasPassword: boolean;
  timestamp: number;
  essence: 'aurora' | 'stardust';
}

const STORAGE_KEY = 'snowflake_whispers';
const MAX_RECORDS = 50;
const ENCRYPTED_PLACEHOLDER = '🔒 ENCRYPTED_WHISPER';

const memoryStorage = new Map<string, string>();

const PRESET_WHISPERS: Array<{
  message: string;
  essence: 'aurora' | 'stardust';
}> = [
  { message: '在我们第一次看到星星的地方见面', essence: 'aurora' },
  { message: 'Meet me where we first saw the stars', essence: 'stardust' },
  { message: '时间冻结的瞬间，像掌心的雪花', essence: 'aurora' },
  { message: '月光洒在你的发梢，我想留住这一刻', essence: 'stardust' },
  { message: 'Every snowflake is a kiss from heaven', essence: 'aurora' },
  { message: '你的笑容，是我见过最美的风景', essence: 'stardust' },
  { message: '如果可以，我想把这一刻定格成永恒', essence: 'aurora' },
  { message: 'In your eyes, I found my universe', essence: 'stardust' },
  { message: '世上没有两片相同的雪花，也没有两个相同的灵魂', essence: 'stardust' },
  { message: '来自虚空的低语，在时间中结晶', essence: 'aurora' },
  { message: 'In the silence between heartbeats, I found eternity', essence: 'stardust' },
  { message: '所有的相遇都是久别重逢', essence: 'aurora' },
  { message: '时间是最温柔的刀，雕刻着我们的故事', essence: 'stardust' },
  { message: 'We are all stardust, temporarily gathered', essence: 'aurora' },
  { message: '愿你的每一天都像雪花一样独特而美丽', essence: 'stardust' },
  { message: 'May your dreams crystallize into reality', essence: 'aurora' },
  { message: '在最寒冷的冬天，也要保持心中的温暖', essence: 'stardust' },
  { message: '愿所有美好如期而至，愿所有温柔都被善待', essence: 'aurora' },
  { message: 'May the stars guide you home', essence: 'stardust' },
  { message: '午夜的钟声响起时，我会在老地方等你', essence: 'aurora' },
  { message: 'The secret garden blooms only for those who believe', essence: 'stardust' },
  { message: '北极光下的誓言，永不褪色', essence: 'aurora' },
  { message: '在星空下许下的愿望，总会实现', essence: 'stardust' },
  { message: 'Where the moonlight meets the ocean, our story begins', essence: 'aurora' },
  { message: '樱花落下的速度是每秒五厘米，我想你的速度是每秒一万次', essence: 'stardust' },
  { message: '如果云知道，它会带走我所有的思念', essence: 'aurora' },
  { message: 'Between the pages of time, I found your smile', essence: 'stardust' },
  { message: '风吹过的地方，都是你的温柔', essence: 'aurora' },
  { message: 'The universe whispered your name to me', essence: 'stardust' },
  { message: '即使融化，也要绽放最美的光芒', essence: 'aurora' },
  { message: 'Every ending is a new beginning in disguise', essence: 'stardust' },
  { message: '黎明前的黑暗，是为了迎接更灿烂的光', essence: 'aurora' },
  { message: 'You are braver than you believe', essence: 'stardust' },
  { message: '每一次跌倒，都是为了更好地站起来', essence: 'aurora' },
  { message: '当第七颗星星升起时，秘密将被揭晓', essence: 'aurora' },
  { message: 'The key is hidden where the moonlight touches the water', essence: 'stardust' },
  { message: '三个字，藏在这片雪花的第七个分支里', essence: 'aurora' },
  { message: 'Follow the northern lights to find the truth', essence: 'stardust' },
  { message: '答案就在你最初的选择里', essence: 'aurora' },
  { message: '2026.01.18 - 一切改变的那一天', essence: 'stardust' },
  { message: '这是我们的第1000天，也是新的开始', essence: 'aurora' },
  { message: '2026年的第一场雪，见证了我们的约定', essence: 'stardust' },
  { message: 'The day we met, the universe smiled', essence: 'aurora' },
  { message: '春天的第一朵花，为你而开', essence: 'stardust' },
  { message: '夏夜的萤火虫，带着我的思念飞向你', essence: 'aurora' },
  { message: '秋天的落叶，写满了我想说的话', essence: 'stardust' },
  { message: '冬日的暖阳，是你给我的温柔', essence: 'aurora' },
  { message: 'The ocean remembers every wave, as I remember you', essence: 'stardust' },
  { message: '你的名字，是我听过最美的旋律', essence: 'aurora' },
  { message: 'Life is a symphony, and you are my favorite note', essence: 'stardust' },
  { message: '在音乐停止的地方，我们的故事开始', essence: 'aurora' },
];

function getLocalStorage(): Storage | null {
  try {
    if (typeof window === 'undefined' || !window.localStorage) {
      return null;
    }
    return window.localStorage;
  } catch {
    return null;
  }
}

function readStorage(): string | null {
  const local = getLocalStorage();
  if (local) {
    try {
      return local.getItem(STORAGE_KEY);
    } catch {
      return memoryStorage.get(STORAGE_KEY) ?? null;
    }
  }
  return memoryStorage.get(STORAGE_KEY) ?? null;
}

function writeStorage(value: string): void {
  const local = getLocalStorage();
  if (local) {
    try {
      local.setItem(STORAGE_KEY, value);
      return;
    } catch {
      // ignore and fallback to in-memory store
    }
  }
  memoryStorage.set(STORAGE_KEY, value);
}

function removeStorage(): void {
  const local = getLocalStorage();
  if (local) {
    try {
      local.removeItem(STORAGE_KEY);
    } catch {
      // ignore
    }
  }
  memoryStorage.delete(STORAGE_KEY);
}

function normalizeRecord(raw: unknown, index: number): SnowflakeRecord | null {
  if (!raw || typeof raw !== 'object') {
    return null;
  }

  const candidate = raw as Partial<SnowflakeRecord> & { id?: string | number };
  const encryptedMessage = typeof candidate.encryptedMessage === 'string' && candidate.encryptedMessage.length > 0
    ? candidate.encryptedMessage
    : undefined;

  const hasPassword = Boolean(candidate.hasPassword) || Boolean(encryptedMessage);
  const messageSource = typeof candidate.message === 'string' ? candidate.message.trim() : '';
  const message = messageSource || (hasPassword ? ENCRYPTED_PLACEHOLDER : '');
  if (!message) {
    return null;
  }

  const idSource = candidate.id;
  const id = typeof idSource === 'string'
    ? idSource
    : typeof idSource === 'number'
      ? String(idSource)
      : `legacy_${Date.now()}_${index}`;

  const timestamp = typeof candidate.timestamp === 'number' && Number.isFinite(candidate.timestamp)
    ? candidate.timestamp
    : Date.now() - index * 1000;

  const essence = candidate.essence === 'stardust' ? 'stardust' : 'aurora';

  return {
    id,
    message,
    encryptedMessage,
    hasPassword,
    timestamp,
    essence
  };
}

function parseRecords(rawData: string | null): SnowflakeRecord[] {
  if (!rawData) {
    return [];
  }

  try {
    const parsed = JSON.parse(rawData);
    if (!Array.isArray(parsed)) {
      return [];
    }

    const unique = new Set<string>();
    const records: SnowflakeRecord[] = [];

    parsed.forEach((item, index) => {
      const normalized = normalizeRecord(item, index);
      if (normalized && !unique.has(normalized.id)) {
        unique.add(normalized.id);
        records.push(normalized);
      }
    });

    return records;
  } catch {
    return [];
  }
}

function createPresetRecords(): SnowflakeRecord[] {
  const baseTimestamp = Date.now() - PRESET_WHISPERS.length * 3600000;
  return PRESET_WHISPERS.map((preset, index) => ({
    id: `preset_${index}`,
    message: preset.message,
    hasPassword: false,
    timestamp: baseTimestamp + index * 3600000,
    essence: preset.essence,
  }));
}

function limitRecords(records: SnowflakeRecord[]): SnowflakeRecord[] {
  return records
    .sort((a, b) => b.timestamp - a.timestamp)
    .slice(0, MAX_RECORDS);
}

export function saveSnowflake(
  message: string,
  essence: 'aurora' | 'stardust' = 'aurora',
  encryptedMessage?: string,
  hasPassword: boolean = false
): SnowflakeRecord | null {
  const normalizedMessage = message.trim();
  const passwordEnabled = hasPassword && Boolean(encryptedMessage);
  if (!normalizedMessage && !passwordEnabled) {
    return null;
  }

  const records = getSnowflakes();
  const newRecord: SnowflakeRecord = {
    id: `user_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
    message: passwordEnabled ? ENCRYPTED_PLACEHOLDER : normalizedMessage,
    encryptedMessage: passwordEnabled ? encryptedMessage : undefined,
    hasPassword: passwordEnabled,
    timestamp: Date.now(),
    essence
  };

  const nextRecords = limitRecords([newRecord, ...records]);
  writeStorage(JSON.stringify(nextRecords));
  return newRecord;
}

export function getSnowflakes(): SnowflakeRecord[] {
  const records = parseRecords(readStorage());
  if (records.length > 0) {
    return limitRecords(records);
  }

  const presets = createPresetRecords();
  writeStorage(JSON.stringify(presets));
  return presets;
}

export function deleteSnowflake(id: string): void {
  if (!id) {
    return;
  }

  const records = getSnowflakes();
  const filtered = records.filter(record => record.id !== id);
  writeStorage(JSON.stringify(filtered));
}

export function clearSnowflakes(): void {
  removeStorage();
}

export function getSnowflakeCount(): number {
  return getSnowflakes().length;
}

export function resetPresets(): void {
  removeStorage();
}

export function forceLoadPresets(): void {
  const existing = getSnowflakes();
  const hasPreset = existing.some(record => record.id.startsWith('preset_'));
  if (hasPreset) {
    return;
  }

  const merged = limitRecords([...createPresetRecords(), ...existing]);
  writeStorage(JSON.stringify(merged));
}
