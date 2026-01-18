
import React, { useState, useEffect, useMemo, useRef } from 'react';
import { generateSnowflakeDataURL } from '../utils/snowflakeGenerator';

interface Props {
  message: string;
  onClose: () => void;
  onExport: () => void;
}

const DecryptView: React.FC<Props> = ({ message, onClose, onExport }) => {
  const [timeLeft, setTimeLeft] = useState(60);
  const [rotation, setRotation] = useState(0);
  const [isMelting, setIsMelting] = useState(false);
  const snowflakeRef = useRef<HTMLDivElement>(null);
  
  // 生成独特的雪花
  const snowflakeURL = useMemo(() => generateSnowflakeDataURL(message, 800), [message]);
  
  // 截图功能
  const handleScreenshot = async () => {
    if (!snowflakeRef.current) return;
    
    try {
      // 创建canvas截图
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      if (!ctx) return;
      
      canvas.width = 1200;
      canvas.height = 1200;
      
      // 绘制背景
      ctx.fillStyle = '#090B11';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      
      // 加载并绘制雪花
      const img = new Image();
      img.src = snowflakeURL;
      img.onload = () => {
        ctx.drawImage(img, 200, 200, 800, 800);
        
        // 添加文字
        ctx.fillStyle = '#ffffff';
        ctx.font = 'italic 48px "Playfair Display", serif';
        ctx.textAlign = 'center';
        ctx.fillText(message, canvas.width / 2, canvas.height - 100);
        
        // 下载
        canvas.toBlob((blob) => {
          if (blob) {
            const url = URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.download = `snowflake-${Date.now()}.png`;
            link.href = url;
            link.click();
            URL.revokeObjectURL(url);
          }
        });
      };
    } catch (error) {
      console.error('Screenshot failed:', error);
    }
  };
  
  // 分享功能
  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: '雪花加密',
          text: '我创建了一片独特的雪花 ❄️',
          url: window.location.href
        });
      } catch (error) {
        console.log('Share cancelled');
      }
    } else {
      // 复制链接
      navigator.clipboard.writeText(window.location.href);
      alert('链接已复制到剪贴板！');
    }
  };

  useEffect(() => {
    if (timeLeft <= 0) {
      setIsMelting(true);
      setTimeout(() => onClose(), 2000);
      return;
    }
    const timer = setInterval(() => setTimeLeft(prev => prev - 1), 1000);
    return () => clearInterval(timer);
  }, [timeLeft, onClose]);

  // 雪花旋转动画
  useEffect(() => {
    const rotationTimer = setInterval(() => {
      setRotation(prev => (prev + 0.5) % 360);
    }, 50);
    return () => clearInterval(rotationTimer);
  }, []);

  return (
    <main className="relative z-10 h-full w-full flex flex-col items-center justify-between py-12 px-8 overflow-y-auto">
      {/* Background Blooms */}
      <div className="absolute top-1/4 left-1/4 w-[500px] h-[500px] bg-primary/10 rounded-full blur-[120px]"></div>
      <div className="absolute bottom-1/4 right-1/4 w-[600px] h-[600px] bg-aurora-purple/10 rounded-full blur-[150px]"></div>

      <header className="w-full flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="size-8 flex items-center justify-center bg-primary/20 rounded-lg border border-primary/40">
            <span className="material-symbols-outlined text-primary text-xl">ac_unit</span>
          </div>
          <div>
            <h2 className="text-white text-sm font-bold tracking-widest">雪花加密</h2>
            <p className="text-[10px] text-primary/70 tracking-wider font-medium uppercase">Crystallized</p>
          </div>
        </div>
        <button onClick={onClose} className="size-10 flex items-center justify-center rounded-full bg-white/5 border border-white/10 hover:bg-white/20 transition-all">
          <span className="material-symbols-outlined">close</span>
        </button>
      </header>

      {/* 阅后即焚警告 */}
      <div className="w-full max-w-2xl mb-8 bg-red-500/10 border border-red-500/30 rounded-2xl p-6 backdrop-blur-sm">
        <div className="flex items-center gap-4">
          <span className="material-symbols-outlined text-red-400 text-3xl animate-pulse">warning</span>
          <div className="flex-1">
            <h3 className="text-red-400 font-bold text-lg mb-1">阅后即焚</h3>
            <p className="text-white/60 text-sm">此雪花将在 {timeLeft} 秒后永久融化，信息无法恢复。请及时截图保存。</p>
          </div>
        </div>
      </div>

      {/* Main Fractal Display */}
      <div ref={snowflakeRef} className="relative flex flex-col items-center justify-center text-center max-w-4xl w-full mb-8">
        <div className="absolute w-[120%] h-[120%] border border-primary/10 rounded-full animate-pulse"></div>
        <div className="absolute w-[140%] h-[140%] border border-aurora-purple/5 rounded-full animate-pulse delay-500"></div>
        
        <div className="relative z-10 w-full aspect-square flex items-center justify-center">
          <img 
            src={snowflakeURL}
            className={`w-3/4 h-3/4 object-contain brightness-125 transition-all duration-2000 ${
              isMelting ? 'opacity-0 scale-150 blur-xl' : 'opacity-100'
            }`}
            alt="Fractal snowflake"
            style={{ 
              transform: `rotate(${rotation}deg)`,
              filter: isMelting ? 'blur(20px)' : 'drop-shadow(0 0 30px rgba(56, 218, 250, 0.6))'
            }}
          />
          
          <div className={`absolute inset-0 flex flex-col items-center justify-center px-10 transition-all duration-1000 ${
            isMelting ? 'opacity-0 scale-90' : 'opacity-100'
          }`}>
            <span className="text-primary text-[10px] tracking-widest font-bold opacity-60 mb-4 uppercase">
              Crystallization Complete
            </span>
            <h1 className="text-2xl md:text-4xl font-bold tracking-tight text-white drop-shadow-[0_0_25px_rgba(56,218,250,0.8)] leading-tight font-display italic text-center">
              {message || "在我们第一次看到星星的地方见面"}
            </h1>
          </div>
        </div>
      </div>

      {/* Footer Interface */}
      <div className="flex flex-col items-center gap-8 w-full max-w-4xl">
        {/* 倒计时 */}
        <div className="relative group cursor-pointer" onClick={onExport}>
          <div className="flex flex-col items-center justify-center gap-1 px-14 py-8 bg-background-dark/40 backdrop-blur-2xl rounded-2xl border border-primary/20 crystal-glow group-hover:border-primary/50 transition-colors">
            <span className="text-[10px] tracking-widest font-bold text-primary/60 uppercase">Melting in</span>
            <div className="flex items-baseline gap-1">
              <span className="text-5xl font-bold text-white tabular-nums tracking-tighter">{timeLeft}</span>
              <span className="text-lg font-medium text-primary/80">s</span>
            </div>
            <div className="w-full h-1 bg-white/10 mt-6 rounded-full overflow-hidden">
              <div 
                className="h-full bg-gradient-to-r from-primary to-aurora-purple transition-all duration-1000"
                style={{ width: `${(timeLeft / 60) * 100}%` }}
              ></div>
            </div>
            <span className="mt-4 text-[9px] tracking-widest text-primary/30 group-hover:text-primary transition-colors uppercase">Capture Afterglow</span>
          </div>
        </div>

        {/* 操作按钮 */}
        <div className="flex flex-wrap gap-4 justify-center">
          <button 
            onClick={handleScreenshot}
            className="flex items-center gap-2 px-6 py-3 bg-primary/20 border border-primary/40 rounded-xl text-primary hover:bg-primary/30 transition-all"
          >
            <span className="material-symbols-outlined text-lg">screenshot</span>
            <span className="text-sm font-bold">截图保存</span>
          </button>
          
          <button 
            onClick={handleShare}
            className="flex items-center gap-2 px-6 py-3 bg-aurora-purple/20 border border-aurora-purple/40 rounded-xl text-aurora-purple hover:bg-aurora-purple/30 transition-all"
          >
            <span className="material-symbols-outlined text-lg">share</span>
            <span className="text-sm font-bold">分享</span>
          </button>
          
          <button 
            onClick={onExport}
            className="flex items-center gap-2 px-6 py-3 bg-white/10 border border-white/20 rounded-xl text-white hover:bg-white/20 transition-all"
          >
            <span className="material-symbols-outlined text-lg">download</span>
            <span className="text-sm font-bold">导出高清</span>
          </button>
        </div>

        {/* 标签 */}
        <div className="flex flex-wrap gap-4 justify-center">
          <div className="flex items-center gap-2 px-4 py-2 bg-white/5 rounded-full border border-white/5 text-[9px] font-medium text-white/40 tracking-widest uppercase">
            <span className="material-symbols-outlined text-sm text-primary">security</span>
            AES-256 Quantum
          </div>
          <div className="flex items-center gap-2 px-4 py-2 bg-white/5 rounded-full border border-white/5 text-[9px] font-medium text-white/40 tracking-widest uppercase">
            <span className="material-symbols-outlined text-sm text-primary">history_toggle_off</span>
            Ephemeral Seed
          </div>
          <div className="flex items-center gap-2 px-4 py-2 bg-white/5 rounded-full border border-white/5 text-[9px] font-medium text-white/40 tracking-widest uppercase">
            <span className="material-symbols-outlined text-sm text-red-400">auto_delete</span>
            Self-Destruct
          </div>
        </div>
      </div>
    </main>
  );
};

export default DecryptView;
