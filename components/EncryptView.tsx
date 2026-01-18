
import React, { useState } from 'react';
import { generateSnowflakeDataURL } from '../utils/snowflakeGenerator';
import { saveSnowflake } from '../utils/storage';
import { encrypt } from '../utils/encryption';

interface Props {
  onCrystallized: (msg: string, encrypted?: string, hasPassword?: boolean) => void;
  onBack: () => void;
}

const EncryptView: React.FC<Props> = ({ onCrystallized, onBack }) => {
  const [text, setText] = useState("");
  const [essence, setEssence] = useState<'aurora' | 'stardust'>('aurora');
  const [isGenerating, setIsGenerating] = useState(false);
  const [usePassword, setUsePassword] = useState(false);
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const handleCrystallize = async () => {
    if (!text.trim()) return;
    
    // 如果使用密码，验证密码
    if (usePassword) {
      if (!password) {
        alert('请输入密码');
        return;
      }
      if (password !== confirmPassword) {
        alert('两次输入的密码不一致');
        return;
      }
      if (password.length < 6) {
        alert('密码长度至少为 6 位');
        return;
      }
    }
    
    setIsGenerating(true);
    
    try {
      let encryptedMessage: string | undefined;
      
      // 如果使用密码，加密消息
      if (usePassword && password) {
        encryptedMessage = await encrypt(text.trim(), password);
      }
      
      // 保存到本地存储
      saveSnowflake(text.trim(), essence, encryptedMessage, usePassword);
      
      // 模拟生成过程
      setTimeout(() => {
        onCrystallized(text, encryptedMessage, usePassword);
      }, 1500);
    } catch (error) {
      console.error('Crystallization failed:', error);
      alert('凝结失败，请重试');
      setIsGenerating(false);
    }
  };

  return (
    <main className="relative z-10 h-full w-full flex flex-col items-center justify-center px-6 py-20">
      <header className="fixed top-0 w-full flex items-center justify-between px-12 py-8">
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

      <div className="w-full max-w-4xl flex flex-col items-center">
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

        {/* 密码保护选项 */}
        <div className="mt-8 w-full max-w-md">
          <div className="flex items-center justify-center gap-3 mb-4">
            <button
              onClick={() => setUsePassword(!usePassword)}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg border transition-all ${
                usePassword 
                  ? 'bg-primary/20 border-primary/40 text-primary' 
                  : 'bg-white/5 border-white/10 text-white/40 hover:text-white/70'
              }`}
            >
              <span className="material-symbols-outlined text-lg">
                {usePassword ? 'lock' : 'lock_open'}
              </span>
              <span className="text-xs font-medium">密码保护</span>
            </button>
          </div>

          {usePassword && (
            <div className="space-y-3 animate-[fadeIn_0.3s_ease-in-out]">
              <div className="relative">
                <input
                  type="password"
                  placeholder="设置密码（至少6位）"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-3 text-white text-sm placeholder:text-white/30 focus:border-primary/40 focus:outline-none transition-all"
                />
                <span className="absolute right-3 top-1/2 -translate-y-1/2 material-symbols-outlined text-white/30 text-lg">
                  key
                </span>
              </div>
              <div className="relative">
                <input
                  type="password"
                  placeholder="确认密码"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-3 text-white text-sm placeholder:text-white/30 focus:border-primary/40 focus:outline-none transition-all"
                />
                <span className="absolute right-3 top-1/2 -translate-y-1/2 material-symbols-outlined text-white/30 text-lg">
                  check_circle
                </span>
              </div>
              <p className="text-xs text-white/40 text-center">
                <span className="material-symbols-outlined text-xs align-middle mr-1">info</span>
                使用 AES-256 加密，密码不会被保存
              </p>
            </div>
          )}
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

      <footer className="fixed bottom-10 w-full px-12 flex justify-between items-end text-[9px] tracking-wide opacity-30">
        <div className="space-y-2">
          <p className="uppercase">Quantum-Resistant Layer Active</p>
          <p className="uppercase">Fractal Geometry: Class 7</p>
        </div>
        <div className="text-right">
          <p>© 2026 Snowflake Protocol</p>
          <p className="uppercase">Ephemeral by Design</p>
        </div>
      </footer>
    </main>
  );
};

export default EncryptView;
