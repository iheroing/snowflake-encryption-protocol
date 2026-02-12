
import React, { useState, useEffect, useMemo, useRef } from 'react';
import { generateSnowflakeDataURL } from '../utils/snowflakeGenerator';

interface Props {
  message: string;
  ttl: number; // 自定义时间（秒）
  onClose: () => void;
  onExport: () => void;
  onOpenGallery?: () => void;
}

const DecryptView: React.FC<Props> = ({ message, ttl, onClose, onExport, onOpenGallery }) => {
  const [timeLeft, setTimeLeft] = useState(ttl);
  const [rotation, setRotation] = useState(0);
  const [isMelting, setIsMelting] = useState(false);
  const snowflakeRef = useRef<HTMLDivElement>(null);
  
  // 是否永久保存
  const isPermanent = ttl === -1;
  
  // 生成独特的雪花
  const snowflakeURL = useMemo(() => generateSnowflakeDataURL(message, 800), [message]);
  
  // 截图功能 - 修复版本
  const handleScreenshot = async () => {
    if (!snowflakeRef.current) return;
    
    try {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      if (!ctx) return;
      
      // 设置更大的画布尺寸以获得更好的质量
      const width = 1200;
      const height = 1400;
      canvas.width = width;
      canvas.height = height;
      
      // 绘制深色背景
      const gradient = ctx.createRadialGradient(width/2, height/2, 0, width/2, height/2, width/2);
      gradient.addColorStop(0, '#0a0d15');
      gradient.addColorStop(1, '#050608');
      ctx.fillStyle = gradient;
      ctx.fillRect(0, 0, width, height);
      
      // 添加光晕效果
      ctx.save();
      ctx.globalAlpha = 0.1;
      const glowGradient = ctx.createRadialGradient(width/2, height/2, 0, width/2, height/2, 400);
      glowGradient.addColorStop(0, '#38dafa');
      glowGradient.addColorStop(1, 'transparent');
      ctx.fillStyle = glowGradient;
      ctx.fillRect(0, 0, width, height);
      ctx.restore();
      
      // 加载并绘制雪花
      const img = new Image();
      img.crossOrigin = 'anonymous';
      img.src = snowflakeURL;
      
      img.onload = () => {
        // 绘制雪花（居中，占据大部分空间）
        const snowflakeSize = 800;
        const snowflakeX = (width - snowflakeSize) / 2;
        const snowflakeY = 150;
        ctx.drawImage(img, snowflakeX, snowflakeY, snowflakeSize, snowflakeSize);
        
        // 绘制文字
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        
        // 主文字
        ctx.fillStyle = '#ffffff';
        ctx.font = 'italic 600 42px "Playfair Display", serif';
        ctx.shadowColor = 'rgba(56, 218, 250, 0.8)';
        ctx.shadowBlur = 20;
        
        // 处理长文本换行
        const maxWidth = width - 200;
        const words = message.split('');
        let line = '';
        let y = snowflakeY + snowflakeSize + 80;
        const lineHeight = 60;
        
        for (let i = 0; i < words.length; i++) {
          const testLine = line + words[i];
          const metrics = ctx.measureText(testLine);
          
          if (metrics.width > maxWidth && i > 0) {
            ctx.fillText(line, width / 2, y);
            line = words[i];
            y += lineHeight;
          } else {
            line = testLine;
          }
        }
        ctx.fillText(line, width / 2, y);
        
        // 重置阴影
        ctx.shadowBlur = 0;
        
        // 添加顶部标题
        ctx.fillStyle = 'rgba(56, 218, 250, 0.6)';
        ctx.font = '300 16px "Space Grotesk", sans-serif';
        ctx.fillText('SNOWFLAKE WHISPER', width / 2, 60);
        
        // 添加底部时间戳
        ctx.fillStyle = 'rgba(255, 255, 255, 0.3)';
        ctx.font = '300 14px "Space Grotesk", sans-serif';
        const timestamp = new Date().toLocaleString('zh-CN', {
          year: 'numeric',
          month: '2-digit',
          day: '2-digit',
          hour: '2-digit',
          minute: '2-digit'
        });
        ctx.fillText(timestamp, width / 2, height - 40);
        
        // 导出为 PNG
        canvas.toBlob((blob) => {
          if (blob) {
            const url = URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.download = `snowflake-whisper-${Date.now()}.png`;
            link.href = url;
            link.click();
            URL.revokeObjectURL(url);
          }
        }, 'image/png', 1.0);
      };
      
      img.onerror = () => {
        console.error('Failed to load snowflake image');
        alert('截图失败，请重试');
      };
    } catch (error) {
      console.error('Screenshot failed:', error);
      alert('截图失败，请重试');
    }
  };
  
  // 分享功能
  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: '雪花密语',
          text: '我凝结了一片独特的雪花 ❄️',
          url: window.location.href
        });
      } catch (error) {
        console.log('Share cancelled');
      }
    } else {
      // 复制链接
      navigator.clipboard.writeText(window.location.href);
      alert('链接已复制！快去分享你的心语吧 ✨');
    }
  };

  useEffect(() => {
    if (isPermanent) return; // 永久保存不需要倒计时
    
    if (timeLeft <= 0) {
      setIsMelting(true);
      setTimeout(() => onClose(), 2000);
      return;
    }
    const timer = setInterval(() => setTimeLeft(prev => prev - 1), 1000);
    return () => clearInterval(timer);
  }, [timeLeft, onClose, isPermanent]);

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
            <h2 className="text-white text-sm font-bold tracking-widest">雪花密语</h2>
            <p className="text-[10px] text-primary/70 tracking-wider font-medium uppercase">Crystallized</p>
          </div>
        </div>
        <button onClick={onClose} className="size-10 flex items-center justify-center rounded-full bg-white/5 border border-white/10 hover:bg-white/20 transition-all">
          <span className="material-symbols-outlined">close</span>
        </button>
      </header>

      {/* 阅后即焚警告 */}
      {!isPermanent && (
        <div className="w-full max-w-2xl mb-8 bg-red-500/10 border border-red-500/30 rounded-2xl p-6 backdrop-blur-sm">
          <div className="flex items-center gap-4">
            <span className="material-symbols-outlined text-red-400 text-3xl animate-pulse">warning</span>
            <div className="flex-1">
              <h3 className="text-red-400 font-bold text-lg mb-1">⚠️ 阅后即焚</h3>
              <p className="text-white/60 text-sm">这片雪花将在 <span className="text-red-400 font-bold">{timeLeft}</span> 秒后融化消散，心语将随风而逝，永不复现。</p>
            </div>
          </div>
        </div>
      )}

      {/* 永久保存提示 */}
      {isPermanent && (
        <div className="w-full max-w-2xl mb-8 bg-green-500/10 border border-green-500/30 rounded-2xl p-6 backdrop-blur-sm">
          <div className="flex items-center gap-4">
            <span className="material-symbols-outlined text-green-400 text-3xl">bookmark</span>
            <div className="flex-1">
              <h3 className="text-green-400 font-bold text-lg mb-1">💚 永久保存</h3>
              <p className="text-white/60 text-sm">这片雪花已保存到画廊，你可以随时在画廊中查看和管理。</p>
            </div>
          </div>
        </div>
      )}

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
        {!isPermanent && (
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
                  style={{ width: `${(timeLeft / ttl) * 100}%` }}
                ></div>
              </div>
              <span className="mt-4 text-[9px] tracking-widest text-primary/30 group-hover:text-primary transition-colors uppercase">Capture Afterglow</span>
            </div>
          </div>
        )}

        {/* 永久保存提示 */}
        {isPermanent && (
          <div className="relative">
            <div className="flex flex-col items-center justify-center gap-1 px-14 py-8 bg-background-dark/40 backdrop-blur-2xl rounded-2xl border border-green-500/20 shadow-[0_0_50px_10px_rgba(34,197,94,0.15)]">
              <span className="text-[10px] tracking-widest font-bold text-green-400/60 uppercase">Permanently Saved</span>
              <div className="flex items-center gap-2 mt-2">
                <span className="material-symbols-outlined text-green-400 text-4xl">bookmark</span>
                <span className="text-2xl font-bold text-green-400">画廊</span>
              </div>
              <span className="mt-4 text-[9px] tracking-widest text-green-400/50 uppercase">Saved to Gallery</span>
            </div>
          </div>
        )}

        {/* 操作按钮 */}
        <div className="flex flex-wrap gap-4 justify-center">
          <button 
            onClick={handleScreenshot}
            className="flex items-center gap-2 px-6 py-3 bg-primary/20 border border-primary/40 rounded-xl text-primary hover:bg-primary/30 transition-all"
          >
            <span className="material-symbols-outlined text-lg">screenshot</span>
            <span className="text-sm font-bold">保存此刻</span>
          </button>
          
          <button 
            onClick={handleShare}
            className="flex items-center gap-2 px-6 py-3 bg-aurora-purple/20 border border-aurora-purple/40 rounded-xl text-aurora-purple hover:bg-aurora-purple/30 transition-all"
          >
            <span className="material-symbols-outlined text-lg">share</span>
            <span className="text-sm font-bold">分享心语</span>
          </button>
          
          <button 
            onClick={onExport}
            className="flex items-center gap-2 px-6 py-3 bg-white/10 border border-white/20 rounded-xl text-white hover:bg-white/20 transition-all"
          >
            <span className="material-symbols-outlined text-lg">download</span>
            <span className="text-sm font-bold">珍藏永恒</span>
          </button>

          {isPermanent && onOpenGallery && (
            <button
              onClick={onOpenGallery}
              className="flex items-center gap-2 px-6 py-3 bg-green-500/20 border border-green-500/40 rounded-xl text-green-300 hover:bg-green-500/30 transition-all"
            >
              <span className="material-symbols-outlined text-lg">collections</span>
              <span className="text-sm font-bold">前往画廊</span>
            </button>
          )}
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
