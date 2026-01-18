
import React, { useState, useEffect, useMemo } from 'react';
import { getSnowflakes, type SnowflakeRecord, deleteSnowflake } from '../utils/storage';
import { generateSnowflakeDataURL } from '../utils/snowflakeGenerator';
import { decrypt } from '../utils/encryption';

interface Props {
  onExit: () => void;
  onViewSnowflake?: (message: string) => void;
}

const GalleryView: React.FC<Props> = ({ onExit, onViewSnowflake }) => {
  const [records, setRecords] = useState<SnowflakeRecord[]>([]);
  const [selectedRecord, setSelectedRecord] = useState<SnowflakeRecord | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [showSearch, setShowSearch] = useState(false);
  const [sortBy, setSortBy] = useState<'newest' | 'oldest'>('newest');
  const [showPasswordPrompt, setShowPasswordPrompt] = useState(false);
  const [password, setPassword] = useState("");
  const [decryptError, setDecryptError] = useState("");

  useEffect(() => {
    // 加载历史记录
    loadRecords();
  }, []);

  const loadRecords = () => {
    const loadedRecords = getSnowflakes();
    setRecords(loadedRecords);
  };

  // 过滤和排序记录
  const filteredRecords = useMemo(() => {
    let filtered = [...records];
    
    // 搜索过滤
    if (searchQuery.trim()) {
      filtered = filtered.filter(record => 
        record.message.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }
    
    // 排序
    if (sortBy === 'oldest') {
      filtered.reverse();
    }
    
    return filtered;
  }, [records, searchQuery, sortBy]);

  const handleViewSnowflake = (record: SnowflakeRecord) => {
    if (record.hasPassword && record.encryptedMessage) {
      // 需要密码
      setSelectedRecord(record);
      setShowPasswordPrompt(true);
      setPassword("");
      setDecryptError("");
    } else {
      // 直接查看
      setSelectedRecord(record);
    }
  };

  const handleDecrypt = async () => {
    if (!selectedRecord || !selectedRecord.encryptedMessage) return;
    
    try {
      const decryptedMessage = await decrypt(selectedRecord.encryptedMessage, password);
      // 解密成功，更新显示的消息
      setSelectedRecord({
        ...selectedRecord,
        message: decryptedMessage
      });
      setShowPasswordPrompt(false);
      setPassword("");
      setDecryptError("");
    } catch (error) {
      setDecryptError("密码错误，请重试");
    }
  };

  const handleDeleteSnowflake = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (confirm('确定要永久销毁这片雪花吗？此操作不可恢复。')) {
      deleteSnowflake(id);
      loadRecords();
      if (selectedRecord?.id === id) {
        setSelectedRecord(null);
      }
    }
  };

  const handleCloseModal = () => {
    setSelectedRecord(null);
  };

  const formatDate = (timestamp: number) => {
    const date = new Date(timestamp);
    return date.toLocaleString('zh-CN', {
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const formatRelativeTime = (timestamp: number) => {
    const now = Date.now();
    const diff = now - timestamp;
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);

    if (minutes < 1) return '刚刚';
    if (minutes < 60) return `${minutes}分钟前`;
    if (hours < 24) return `${hours}小时前`;
    if (days < 7) return `${days}天前`;
    return formatDate(timestamp);
  };

  return (
    <div className="relative z-10 h-full w-full overflow-y-auto bg-background-dark/80 backdrop-blur-sm scroll-smooth pb-32">
      <header className="sticky top-0 z-50 flex items-center justify-between px-12 py-8 bg-background-dark/90 backdrop-blur-md border-b border-primary/10">
        <div className="flex items-center gap-3">
          <span className="material-symbols-outlined text-primary text-3xl">ac_unit</span>
          <h2 className="font-display text-xl font-bold tracking-wide">心语画廊</h2>
        </div>
        <button onClick={onExit} className="bg-primary text-background-dark px-8 py-3 rounded-full font-bold text-sm tracking-tight hover:brightness-110 transition-all">
          返回
        </button>
      </header>

      <main className="max-w-7xl mx-auto px-12 pt-16">
        <section className="text-center mb-20">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-primary/20 bg-primary/5 text-primary text-[10px] font-bold tracking-wide mb-8 animate-pulse uppercase">
            {records.length} Whispers Preserved
          </div>
          <h1 className="font-display text-6xl md:text-8xl font-black mb-8 tracking-tighter leading-tight italic">
            心语 <br/><span className="text-primary not-italic">画廊</span>
          </h1>
          <p className="max-w-2xl mx-auto text-lg text-white/50 font-light leading-relaxed">
            {records.length > 0 
              ? '这里保存着你凝结的每一片雪花，每一句心语。它们曾在60秒后消逝，但美好永远留存。'
              : '还没有保存的心语。去创建你的第一片雪花吧！'
            }
          </p>
        </section>

        {records.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20">
            <div className="size-32 rounded-full border-2 border-dashed border-primary/30 flex items-center justify-center mb-8">
              <span className="material-symbols-outlined text-6xl text-primary/40">ac_unit</span>
            </div>
            <h3 className="text-2xl font-bold mb-4">还没有心语</h3>
            <p className="text-white/40 mb-8">创建你的第一片雪花，开始记录美好时刻</p>
            <button 
              onClick={onExit}
              className="px-8 py-4 bg-primary text-background-dark font-bold rounded-xl hover:brightness-110 transition-all"
            >
              创建雪花
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {filteredRecords.map((record) => (
              <div 
                key={record.id} 
                onClick={() => handleViewSnowflake(record)}
                className="group relative aspect-[4/5] rounded-3xl p-8 border border-white/10 bg-white/5 backdrop-blur-xl overflow-hidden transition-all duration-500 hover:border-primary/40 hover:-translate-y-2 cursor-pointer"
              >
                <div className="absolute inset-0 bg-primary/5 group-hover:bg-primary/10 transition-colors"></div>
                
                {/* 雪花预览 */}
                <div className="absolute inset-0 opacity-10 group-hover:opacity-20 transition-opacity flex items-center justify-center">
                  <img 
                    src={generateSnowflakeDataURL(record.message, 400)}
                    alt="snowflake"
                    className="w-full h-full object-contain"
                  />
                </div>
                
                <div className="relative z-10 h-full flex flex-col justify-between">
                  <div className="flex justify-between items-start">
                    <span className="px-3 py-1 rounded-full bg-white/5 border border-white/10 text-[10px] tracking-widest uppercase">
                      {formatRelativeTime(record.timestamp)}
                    </span>
                    <div className="flex items-center gap-2">
                      {record.hasPassword && (
                        <span className="material-symbols-outlined text-primary/60 text-sm" title="密码保护">
                          lock
                        </span>
                      )}
                      <button
                        onClick={(e) => handleDeleteSnowflake(record.id, e)}
                        className="material-symbols-outlined text-red-400/40 hover:text-red-400 transition-colors text-sm"
                        title="销毁"
                      >
                        delete
                      </button>
                      <span className="material-symbols-outlined text-primary/40 group-hover:text-primary transition-colors">
                        visibility
                      </span>
                    </div>
                  </div>
                  <div>
                    <h4 className="font-serif text-2xl mb-4 italic leading-snug text-white/90 line-clamp-3">
                      {record.message}
                    </h4>
                    <div className="flex items-center gap-2 text-white/30 text-xs tracking-widest uppercase">
                      <span className="material-symbols-outlined text-sm">schedule</span>
                      {formatDate(record.timestamp)}
                    </div>
                  </div>
                </div>
              </div>
            ))}

            {/* 添加新心语卡片 */}
            <div 
              onClick={onExit}
              className="group relative aspect-[4/5] rounded-3xl p-8 border border-dashed border-primary/30 flex flex-col items-center justify-center text-center gap-6 hover:bg-primary/5 transition-all cursor-pointer"
            >
              <div className="size-20 rounded-full border border-primary/40 bg-primary/10 flex items-center justify-center text-primary animate-pulse">
                <span className="material-symbols-outlined text-4xl">add</span>
              </div>
              <h4 className="font-display text-2xl">凝结新的心语</h4>
              <p className="text-sm text-white/40 leading-relaxed px-4">
                创建一片新的雪花，记录此刻的心情
              </p>
            </div>
          </div>
        )}
      </main>

      {/* 雪花查看模态框 */}
      {selectedRecord && !showPasswordPrompt && (
        <div 
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm"
          onClick={handleCloseModal}
        >
          <div 
            className="relative max-w-4xl w-full mx-8 bg-background-dark/90 border border-primary/20 rounded-3xl p-12"
            onClick={(e) => e.stopPropagation()}
          >
            <button 
              onClick={handleCloseModal}
              className="absolute top-6 right-6 size-10 rounded-full bg-white/5 border border-white/10 flex items-center justify-center hover:bg-white/10 transition-all"
            >
              <span className="material-symbols-outlined">close</span>
            </button>

            <div className="flex flex-col items-center gap-8">
              <span className="text-primary/60 text-xs tracking-widest uppercase">
                {formatDate(selectedRecord.timestamp)}
              </span>
              
              <img 
                src={generateSnowflakeDataURL(selectedRecord.message, 600)}
                alt="snowflake"
                className="w-96 h-96 object-contain animate-[spin_20s_linear_infinite]"
              />
              
              <h2 className="text-4xl font-serif italic text-center leading-relaxed max-w-2xl">
                {selectedRecord.message}
              </h2>

              <div className="flex gap-4">
                <button 
                  onClick={() => {
                    // 重新查看这个雪花
                    if (onViewSnowflake) {
                      onViewSnowflake(selectedRecord.message);
                    }
                    handleCloseModal();
                  }}
                  className="px-6 py-3 bg-primary/20 border border-primary/40 rounded-xl text-primary hover:bg-primary/30 transition-all"
                >
                  <span className="flex items-center gap-2">
                    <span className="material-symbols-outlined text-lg">replay</span>
                    重新体验
                  </span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Floating HUD */}
      <div className="fixed bottom-10 left-1/2 -translate-x-1/2 z-50 flex items-center gap-4 bg-background-dark/60 backdrop-blur-xl border border-white/10 p-2 rounded-2xl">
        <div className="flex gap-1 border-r border-white/10 pr-2">
          <button 
            title="刷新画廊"
            onClick={loadRecords}
            className="p-3 hover:text-primary transition-colors rounded-xl"
          >
            <span className="material-symbols-outlined text-[20px]">refresh</span>
          </button>
          <button 
            title="搜索心语"
            onClick={() => setShowSearch(!showSearch)}
            className={`p-3 transition-colors rounded-xl ${showSearch ? 'text-primary' : 'hover:text-primary'}`}
          >
            <span className="material-symbols-outlined text-[20px]">search</span>
          </button>
          <button 
            title={sortBy === 'newest' ? '最新优先' : '最旧优先'}
            onClick={() => setSortBy(sortBy === 'newest' ? 'oldest' : 'newest')}
            className="p-3 hover:text-primary transition-colors rounded-xl"
          >
            <span className="material-symbols-outlined text-[20px]">
              {sortBy === 'newest' ? 'arrow_downward' : 'arrow_upward'}
            </span>
          </button>
        </div>
        <button onClick={onExit} className="bg-primary text-background-dark font-bold py-3 px-8 rounded-xl flex items-center gap-2 hover:brightness-110 active:scale-95 transition-all">
          <span className="material-symbols-outlined text-[20px]">add_comment</span>
          创建雪花
        </button>
      </div>

      {/* 搜索框 */}
      {showSearch && (
        <div className="fixed bottom-32 left-1/2 -translate-x-1/2 z-50 w-full max-w-md px-4">
          <div className="relative">
            <input
              type="text"
              placeholder="搜索心语..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-background-dark/90 backdrop-blur-xl border border-primary/20 rounded-2xl px-6 py-4 pr-12 text-white placeholder:text-white/30 focus:border-primary/40 focus:outline-none transition-all"
              autoFocus
            />
            <span className="absolute right-4 top-1/2 -translate-y-1/2 material-symbols-outlined text-primary/40">
              search
            </span>
          </div>
          {searchQuery && (
            <div className="mt-2 text-center text-xs text-white/40">
              找到 {filteredRecords.length} 条结果
            </div>
          )}
        </div>
      )}

      {/* 密码输入模态框 */}
      {showPasswordPrompt && selectedRecord && (
        <div 
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm"
          onClick={() => {
            setShowPasswordPrompt(false);
            setSelectedRecord(null);
            setPassword("");
            setDecryptError("");
          }}
        >
          <div 
            className="relative max-w-md w-full mx-8 bg-background-dark/90 border border-primary/20 rounded-3xl p-8"
            onClick={(e) => e.stopPropagation()}
          >
            <button 
              onClick={() => {
                setShowPasswordPrompt(false);
                setSelectedRecord(null);
                setPassword("");
                setDecryptError("");
              }}
              className="absolute top-4 right-4 size-8 rounded-full bg-white/5 border border-white/10 flex items-center justify-center hover:bg-white/10 transition-all"
            >
              <span className="material-symbols-outlined text-sm">close</span>
            </button>

            <div className="flex flex-col items-center gap-6">
              <div className="size-16 rounded-full bg-primary/20 border border-primary/40 flex items-center justify-center">
                <span className="material-symbols-outlined text-primary text-3xl">lock</span>
              </div>
              
              <div className="text-center">
                <h3 className="text-2xl font-bold mb-2">密码保护的心语</h3>
                <p className="text-white/50 text-sm">请输入密码以解密查看</p>
              </div>

              <div className="w-full space-y-4">
                <div className="relative">
                  <input
                    type="password"
                    placeholder="输入密码"
                    value={password}
                    onChange={(e) => {
                      setPassword(e.target.value);
                      setDecryptError("");
                    }}
                    onKeyPress={(e) => {
                      if (e.key === 'Enter') {
                        handleDecrypt();
                      }
                    }}
                    className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-3 text-white placeholder:text-white/30 focus:border-primary/40 focus:outline-none transition-all"
                    autoFocus
                  />
                  <span className="absolute right-3 top-1/2 -translate-y-1/2 material-symbols-outlined text-white/30 text-lg">
                    key
                  </span>
                </div>

                {decryptError && (
                  <div className="flex items-center gap-2 text-red-400 text-sm">
                    <span className="material-symbols-outlined text-sm">error</span>
                    {decryptError}
                  </div>
                )}

                <button
                  onClick={handleDecrypt}
                  disabled={!password}
                  className="w-full bg-primary text-background-dark font-bold py-3 rounded-xl hover:brightness-110 active:scale-95 transition-all disabled:opacity-30 disabled:pointer-events-none"
                >
                  解密查看
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default GalleryView;
