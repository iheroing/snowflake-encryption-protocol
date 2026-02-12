import React, { useState } from 'react';
import { encrypt } from '../utils/encryption';
import { saveSnowflake } from '../utils/storage';
import { createSnowflakeSignature } from '../utils/share';

interface Props {
  onCrystallized: (payload: { message: string; ttl: number; signature: string }) => void;
  onBack: () => void;
}

const EncryptView: React.FC<Props> = ({ onCrystallized, onBack }) => {
  const [text, setText] = useState("");
  const [essence, setEssence] = useState<'aurora' | 'stardust'>('aurora');
  const [isGenerating, setIsGenerating] = useState(false);
  const [ttl, setTtl] = useState(60); // 默认60秒
  const [enablePassword, setEnablePassword] = useState(false);
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [passwordError, setPasswordError] = useState("");

  const handleCrystallize = async () => {
    const message = text.trim();
    if (!message) return;

    const canPersist = ttl === -1;
    const shouldEncrypt = canPersist && enablePassword;

    if (shouldEncrypt) {
      if (password.length < 6) {
        setPasswordError('密码至少需要 6 位');
        return;
      }
      if (password !== confirmPassword) {
        setPasswordError('两次输入的密码不一致');
        return;
      }
    }
    
    setIsGenerating(true);
    
    try {
      let encryptedMessage: string | undefined;
      if (shouldEncrypt) {
        encryptedMessage = await encrypt(message, password);
      }

      let signature = createSnowflakeSignature();
      if (canPersist) {
        const saved = saveSnowflake(message, essence, encryptedMessage, shouldEncrypt);
        if (saved?.id) {
          signature = saved.id;
        }
      }
      
      // 模拟生成过程
      setTimeout(() => {
        onCrystallized({ message, ttl, signature });
      }, 1500);
    } catch (error) {
      console.error('Crystallization failed:', error);
      alert('凝结失败，请重试');
      setIsGenerating(false);
    }
  };

  return (
    <main className="relative z-10 min-h-screen w-full flex flex-col items-center px-4 md:px-6 py-4 md:py-6 overflow-y-auto">
      <header className="w-full max-w-5xl flex items-center justify-between px-0 md:px-4 py-2 mb-3 md:mb-4">
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

      <div className="w-full max-w-5xl flex flex-col items-center pb-6">
        <span className="text-primary/40 text-[10px] tracking-widest mb-2 uppercase">Whisper Phase</span>
        <h1 className="text-glacial text-xl md:text-2xl tracking-wide font-light">写下你的心语...</h1>
        
        <div className="w-full relative mt-5 md:mt-6">
          <textarea 
            className="w-full bg-transparent border-none focus:ring-0 text-white text-center text-3xl md:text-5xl font-light placeholder:text-white/5 resize-none min-h-[120px] md:min-h-[150px] leading-relaxed tracking-tight font-serif italic"
            placeholder="此刻的心语..."
            value={text}
            onChange={(e) => setText(e.target.value)}
            spellCheck={false}
          />
          <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 w-48 h-[1px] bg-gradient-to-r from-transparent via-primary/50 to-transparent"></div>
          <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 w-12 h-[3px] bg-primary blur-sm opacity-50"></div>
        </div>

        <div className="mt-6 md:mt-8 flex flex-col items-center gap-4">
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

        <div className="mt-5 w-full max-w-3xl rounded-2xl p-4 md:p-5 bg-white/5 border border-white/10">
          <div className="flex items-center justify-between gap-4">
            <div>
              <h3 className="text-sm font-bold text-white/90 flex items-center gap-2">
                <span className="material-symbols-outlined text-base text-primary">lock</span>
                密码保护（可选）
              </h3>
              <p className="text-[11px] text-white/50 mt-1">
                仅“永久保存”支持密码保护；画廊查看时需要输入密码解密。
              </p>
            </div>
            <button
              type="button"
              disabled={ttl !== -1}
              onClick={() => {
                setEnablePassword(prev => !prev);
                setPasswordError("");
              }}
              className={`px-4 py-2 rounded-lg text-xs font-bold transition-all ${
                ttl !== -1
                  ? 'bg-white/5 border border-white/10 text-white/30 cursor-not-allowed'
                  : enablePassword
                    ? 'bg-primary/20 border border-primary/40 text-primary'
                    : 'bg-white/5 border border-white/10 text-white/70 hover:text-white'
              }`}
            >
              {enablePassword ? '已开启' : '未开启'}
            </button>
          </div>

          {enablePassword && ttl === -1 && (
            <div className="mt-3 grid grid-cols-1 md:grid-cols-2 gap-2">
              <input
                type="password"
                placeholder="设置密码（至少 6 位）"
                value={password}
                onChange={(e) => {
                  setPassword(e.target.value);
                  setPasswordError("");
                }}
                className="w-full bg-black/20 border border-white/10 rounded-lg px-4 py-3 text-white placeholder:text-white/30 focus:border-primary/40 focus:outline-none transition-all"
                autoComplete="new-password"
              />
              <input
                type="password"
                placeholder="再次输入密码"
                value={confirmPassword}
                onChange={(e) => {
                  setConfirmPassword(e.target.value);
                  setPasswordError("");
                }}
                className="w-full bg-black/20 border border-white/10 rounded-lg px-4 py-3 text-white placeholder:text-white/30 focus:border-primary/40 focus:outline-none transition-all"
                autoComplete="new-password"
              />
            </div>
          )}

          {passwordError && (
            <p className="mt-3 text-xs text-red-400 flex items-center gap-1">
              <span className="material-symbols-outlined text-sm">error</span>
              {passwordError}
            </p>
          )}
        </div>

        {/* 时间选择器 */}
        <div className="mt-5 w-full max-w-3xl">
          <div className="flex flex-col items-center gap-4">
            <span className="text-[10px] tracking-widest text-white/30 uppercase flex items-center gap-2">
              <span className="material-symbols-outlined text-sm">schedule</span>
              Time Limit
            </span>
            <div className="flex flex-wrap gap-2 justify-center">
              {[
                { label: '30秒', value: 30 },
                { label: '60秒', value: 60 },
                { label: '5分钟', value: 300 },
                { label: '10分钟', value: 600 },
                { label: '30分钟', value: 1800 },
                { label: '永久', value: -1 },
              ].map((option) => (
                <button
                  key={option.value}
                  onClick={() => setTtl(option.value)}
                    className={`px-4 py-2.5 rounded-xl text-xs md:text-sm font-medium transition-all ${
                    ttl === option.value
                      ? option.value === -1
                        ? 'bg-green-500/20 border-2 border-green-500/60 text-green-400 shadow-[0_0_20px_rgba(34,197,94,0.3)]'
                        : 'bg-red-500/20 border-2 border-red-500/60 text-red-400 shadow-[0_0_20px_rgba(239,68,68,0.3)]'
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
        <div className={`mt-5 w-full max-w-3xl rounded-2xl p-4 md:p-5 backdrop-blur-sm ${
          ttl === -1 
            ? 'bg-green-500/10 border border-green-500/30'
            : 'bg-red-500/10 border border-red-500/30'
        }`}>
          <div className="flex items-start gap-4">
            <span className={`material-symbols-outlined text-2xl animate-pulse ${
              ttl === -1 ? 'text-green-400' : 'text-red-400'
            }`}>
              {ttl === -1 ? 'bookmark' : 'warning'}
            </span>
            <div className="flex-1">
              {ttl === -1 ? (
                <>
                  <h3 className="text-green-400 font-bold text-sm md:text-base mb-1">💚 永久保存</h3>
                  <p className="text-white/60 text-xs md:text-sm leading-relaxed">
                    这片雪花将永久保存到画廊，你可以随时查看。<br/>
                    <span className="text-green-400/80">适合珍贵的回忆和重要的心语。</span>
                  </p>
                </>
              ) : (
                <>
                  <h3 className="text-red-400 font-bold text-sm md:text-base mb-1">⚠️ 阅后即焚</h3>
                  <p className="text-white/60 text-xs md:text-sm leading-relaxed">
                    时间到期后，雪花将自动融化消散，心语将永远消失。<br/>
                    <span className="text-red-400/80">不会保存到画廊，请珍惜这短暂的美好时光。</span>
                  </p>
                </>
              )}
            </div>
          </div>
        </div>

        <div className="mt-5 w-full max-w-sm sticky bottom-3 z-20">
          <button 
            onClick={handleCrystallize}
            disabled={!text.trim() || isGenerating}
            className="group relative w-full py-4 rounded-xl bg-gradient-to-r from-primary/80 to-primary text-white font-bold text-sm tracking-wide transition-all hover:scale-[1.02] active:scale-95 disabled:opacity-30 disabled:pointer-events-none shadow-[0_10px_30px_rgba(56,218,250,0.25)]"
          >
            <span className="relative z-10 flex items-center justify-center gap-3">
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
      </div>
    </main>
  );
};

export default EncryptView;
