
import React, { useState, useEffect } from 'react';
import { getSnowflakes, type SnowflakeRecord } from '../utils/storage';
import { generateSnowflakeDataURL } from '../utils/snowflakeGenerator';

interface Props {
  onExit: () => void;
  onViewSnowflake?: (message: string) => void;
}

const GalleryView: React.FC<Props> = ({ onExit, onViewSnowflake }) => {
  const [records, setRecords] = useState<SnowflakeRecord[]>([]);
  const [selectedRecord, setSelectedRecord] = useState<SnowflakeRecord | null>(null);

  useEffect(() => {
    // 加载历史记录
    const loadedRecords = getSnowflakes();
    setRecords(loadedRecords);
  }, []);

  const handleViewSnowflake = (record: SnowflakeRecord) => {
    setSelectedRecord(record);
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
            {records.map((record) => (
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
                    <span className="material-symbols-outlined text-primary/40 group-hover:text-primary transition-colors">
                      visibility
                    </span>
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
      {selectedRecord && (
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
          <button className="p-3 hover:text-primary transition-colors rounded-xl"><span className="material-symbols-outlined text-[20px]">orbit</span></button>
          <button className="p-3 hover:text-primary transition-colors rounded-xl"><span className="material-symbols-outlined text-[20px]">near_me</span></button>
          <button className="p-3 hover:text-primary transition-colors rounded-xl"><span className="material-symbols-outlined text-[20px]">zoom_in</span></button>
        </div>
        <button onClick={onExit} className="bg-primary text-background-dark font-bold py-3 px-8 rounded-xl flex items-center gap-2 hover:brightness-110 active:scale-95 transition-all">
          <span className="material-symbols-outlined text-[20px]">add_comment</span>
          创建雪花
        </button>
      </div>
    </div>
  );
};

export default GalleryView;
