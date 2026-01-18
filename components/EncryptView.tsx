import React, { useState } from 'react';
import { generateSnowflakeDataURL } from '../utils/snowflakeGenerator';

interface Props {
  onCrystallized: (msg: string, ttl: number) => void;
  onBack: () => void;
}

const EncryptView: React.FC<Props> = ({ onCrystallized, onBack }) => {
  const [text, setText] = useState("");
  const [essence, setEssence] = useState<'aurora' | 'stardust'>('aurora');
  const [isGenerating, setIsGenerating] = useState(false);
  const [ttl, setTtl] = useState(60); // 默认60秒

  const handleCrystallize = async () => {
    if (!text.trim()) return;
    
    setIsGenerating(true);
    
    try {
      // 模拟生成过程
      setTimeout(() => {
        onCrystallized(text, ttl);
      }, 1500);
    } catch (error) {
      console.error('Crystallization failed:', error);
      alert('凝结失败，请重试');
      setIsGenerating(false);
    }
  };

  return (
    <main className="relative z-10 min-h-screen w-full flex flex-col items-center px-6 py-20 overflow-y-auto">
      <header className="w-full flex items-center justify-between px-0 md:px-12 py-8 mb-8">
        <div className="flex items-center gap-4 cursor-pointer" onClick={onBack}>
          <span className="material-symbols-outlined text-primary text-3xl">ac_unit</span>
          <div className="flex flex-col">
            <h2 className="text-sm font-bold tracking-wide text-white/90">雪花密语</h2>
            <span className="text-[8px] tracking-wider text-primary/60 uppercase">Snowflake Whisper</span>
          </div>
        </div>
        <button onClick={onBack} className="w-10 h-10 rounded-full border border-white/10 flex items-center justify-center hover:bg-white/10 transition-all">
          <span className="material-symbols-outlined text-white/70">close</span>
        </button>
      </header>

      <div className="w-full max-w-4xl flex flex-col items-center pb-20">
        <span className="text-primary/40 text-[10px] tracking-widest mb-4 uppercase">Whisper Phase</span>
        <h1 className="text-glacial text-2xl tracking-wide font-light">写下你的心语...</h1>
        
        <div className="w-full relative mt-12">
          <textarea 
            className="w-full bg-transparent border-none focus:ring-0 text-white text-center text-4xl md:text-6xl font-light placeholder:text-white/5 resize-none min-h-[200px] leading-relaxed tracking-tight font-serif italic"
            placeholder="此刻的心语..."
            value={text}
            onChange={(e) => setText(e.target.value)}
            spellCheck={false}
          />
          <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 w-48 h-[1px] bg-gradient-to-r from-transparent via-primary/50 to-transparent"></div>
          <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 w-12 h-[3px] bg-primary blur-sm opacity-50"></div>
        </div>

        <div className="mt-16 flex flex-col items-center gap-6">
          <span className="text-[10px] tracking-widest text-white/30 uppercase">Choose Your Essence</span>
          <div className="bg-white/5 backdrop-blur-md p-1.5 rounded-full flex items-center gap-2 border border-white/5">
            <button 
              onClick={() => setEssence('aurora')}
              className={`px-8 py-3 rounded-full text-[10px] tracking-wide font-medium transition-all ${essence === 'aurora' ? 'bg-primary/20 text-primary shadow-[0_0_15px_rgba(56,218,250,0.2)]' : 'text-white/40 hover:text-white/70'}`}
            >
              极光之息
            </button>
            <button 
              onClick={() => setEssence('stardust')}
              className={`px-8 py-3 rounded-full text-[10px] tracking-wide font-medium transition-all ${essence === 'stardust' ? 'bg-aurora-purple/20 text-aurora-purple shadow-[0_0_15px_rgba(203,115,252,0.2)]' : 'text-white/40 hover:text-white/70'}`}
            >
              星尘之梦
            </button>
          </div>
        </div>

        {/* 时间选择器 */}
        <div className="mt-8 w-full max-w-2xl">
          <div className="flex flex-col items-center gap-4">
            <span className="text-[10px] tracking-widest text-white/30 uppercase flex items-center gap-2">
              <span className="material-symbols-outlined text-sm">schedule</span>
              Time Limit
            </span>
            <div className="flex flex-wrap gap-3 justify-center">
              {[
                { label: '30秒', value: 30 },
                { label: '60秒', value: 60 },
                { label: '5分钟', value: 300 },
                { label: '10分钟', value: 600 },
                { label: '30分钟', value: 1800 },
              ].map((option) => (
                <button
                  key={option.value}
                  onClick={() => setTtl(option.value)}
                  className={`px-6 py-3 rounded-xl text-sm font-medium transition-all ${
                    ttl === option.value
                      ? 'bg-red-500/20 border-2 border-red-500/60 text-red-400 shadow-[0_0_20px_rgba(239,68,68,0.3)]'
                      : 'bg-white/5 border border-white/10 text-white/50 hover:text-white/80 hover:border-white/30'
                  }`}
                >
                  {option.label}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* 阅后即焚警告 */}
        <div className="mt-8 w-full max-w-2xl bg-red-500/10 border border-red-500/30 rounded-2xl p-6 backdrop-blur-sm">
          <div className="flex items-start gap-4">
            <span className="material-symbols-outlined text-red-400 text-2xl animate-pulse">warning</span>
            <div className="flex-1">
              <h3 className="text-red-400 font-bold text-base mb-2">⚠️ 阅后即焚</h3>
              <p className="text-white/60 text-sm leading-relaxed">
                时间到期后，雪花将自动融化消散，心语将永远消失。<br/>
                <span className="text-red-400/80">不会保存到画廊，请珍惜这短暂的美好时光。</span>
              </p>
            </div>
          </div>
        </div>

        <button 
          onClick={handleCrystallize}
          disabled={!text.trim() || isGenerating}
          className="mt-12 group relative w-full max-w-sm py-5 rounded-xl bg-gradient-to-r from-primary/80 to-primary text-white font-bold text-sm tracking-wide transition-all hover:scale-[1.02] active:scale-95 disabled:opacity-30 disabled:pointer-events-none"
        >
          <span className="relative z-10 flex items-center justify-center gap-4">
            {isGenerating ? (
              <>
                <span className="animate-spin material-symbols-outlined text-lg">progress_activity</span>
                凝结中...
              </>
            ) : (
              <>
                凝结心语
                <span className="material-symbols-outlined text-lg">auto_fix_high</span>
              </>
            )}
          </span>
        </button>
      </div>
    </main>
  );
};

export default EncryptView;
