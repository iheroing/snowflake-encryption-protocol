
import React, { useState, useEffect, useMemo, useRef } from 'react';
import { generateSnowflakeDataURL } from '../utils/snowflakeGenerator';
import { buildShareUrl, getSnowflakeId } from '../utils/share';

interface Props {
  message: string;
  signature: string;
  ttl: number; // 自定义时间（秒）
  onClose: () => void;
  onExport: () => void;
  onOpenGallery?: () => void;
  source?: 'local' | 'shared';
}

const DecryptView: React.FC<Props> = ({ message, signature, ttl, onClose, onExport, onOpenGallery, source = 'local' }) => {
  const [timeLeft, setTimeLeft] = useState(ttl);
  const [rotation, setRotation] = useState(0);
  const [isMelting, setIsMelting] = useState(false);
  const snowflakeRef = useRef<HTMLDivElement>(null);
  
  // 是否永久保存
  const isPermanent = ttl === -1;
  const snowflakeId = useMemo(() => getSnowflakeId(signature), [signature]);
  
  // 生成独特的雪花
  const snowflakeURL = useMemo(() => generateSnowflakeDataURL(message, 800, signature), [message, signature]);
  
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
    const shareUrl = buildShareUrl(message, signature);
    if (navigator.share) {
      try {
        await navigator.share({
          title: '雪花密语',
          text: `我分享了一片独特的雪花 ${snowflakeId} ❄️`,
          url: shareUrl
        });
        return;
      } catch (error) {
        // fallback to clipboard
      }
    }

    try {
      await navigator.clipboard.writeText(shareUrl);
      alert('分享链接已复制！快去分享你的心语吧 ✨');
    } catch {
      prompt('复制这条分享链接：', shareUrl);
    }
  };

  useEffect(() => {
    setTimeLeft(ttl);
    setIsMelting(false);
  }, [ttl, message, signature]);

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
    <main className="relative z-10 min-h-screen w-full px-4 md:px-8 py-4 md:py-6 overflow-y-auto md:overflow-hidden">
      {/* Background Blooms */}
      <div className="absolute top-[20%] left-[18%] w-[420px] h-[420px] bg-primary/10 rounded-full blur-[110px] pointer-events-none"></div>
      <div className="absolute bottom-[18%] right-[16%] w-[500px] h-[500px] bg-aurora-purple/10 rounded-full blur-[140px] pointer-events-none"></div>

      <div className="relative z-10 w-full max-w-6xl mx-auto h-[calc(100vh-2rem)] md:h-[calc(100vh-3rem)] grid grid-rows-[auto_auto_1fr_auto] gap-3 md:gap-4">
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

        <div className={`w-full rounded-2xl border px-4 py-3 backdrop-blur-sm ${
          isPermanent ? 'bg-green-500/10 border-green-500/30' : 'bg-red-500/10 border-red-500/30'
        }`}>
          {isPermanent ? (
            <div className="flex items-center gap-3">
              <span className="material-symbols-outlined text-green-400 text-2xl">bookmark</span>
              <div className="text-sm text-white/80">
                永久保存模式，已可在画廊管理
                {source === 'shared' && <span className="text-primary/80"> · 来自分享链接并已识别</span>}
              </div>
            </div>
          ) : (
            <div className="flex items-center gap-3">
              <span className="material-symbols-outlined text-red-400 text-2xl animate-pulse">warning</span>
              <div className="text-sm text-white/80">
                阅后即焚：剩余 <span className="text-red-400 font-bold tabular-nums">{timeLeft}s</span>，到期自动融化
              </div>
            </div>
          )}
        </div>

        <div ref={snowflakeRef} className="relative min-h-0 flex items-center justify-center text-center">
          <div className="absolute w-[85%] h-[85%] border border-primary/10 rounded-full animate-pulse"></div>
          <div className="absolute w-[98%] h-[98%] border border-aurora-purple/5 rounded-full animate-pulse delay-500"></div>

          <div className="relative z-10 w-full h-full max-h-[56vh] max-w-3xl aspect-square flex items-center justify-center">
            <img
              src={snowflakeURL}
              className={`w-[72%] h-[72%] object-contain brightness-125 transition-all duration-2000 ${
                isMelting ? 'opacity-0 scale-150 blur-xl' : 'opacity-100'
              }`}
              alt="Fractal snowflake"
              style={{
                transform: `rotate(${rotation}deg)`,
                filter: isMelting ? 'blur(20px)' : 'drop-shadow(0 0 30px rgba(56, 218, 250, 0.6))'
              }}
            />

            <div className={`absolute inset-0 flex flex-col items-center justify-center px-8 md:px-14 transition-all duration-1000 ${
              isMelting ? 'opacity-0 scale-90' : 'opacity-100'
            }`}>
              <span className="text-primary text-[10px] tracking-widest font-bold opacity-60 mb-3 uppercase">
                Crystallization Complete
              </span>
              <h1 className="text-xl md:text-3xl font-bold tracking-tight text-white drop-shadow-[0_0_25px_rgba(56,218,250,0.8)] leading-tight font-display italic text-center line-clamp-4">
                {message || "在我们第一次看到星星的地方见面"}
              </h1>
              <p className="mt-3 text-[10px] tracking-[0.2em] text-primary/60 uppercase">
                {snowflakeId}
              </p>
            </div>
          </div>
        </div>

        <div className="rounded-2xl border border-white/10 bg-background-dark/45 backdrop-blur-xl px-3 py-3 md:px-4 md:py-4">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
            {!isPermanent ? (
              <div className="min-w-[220px]">
                <div className="flex items-baseline gap-2">
                  <span className="text-[10px] uppercase tracking-widest text-primary/60">Melting in</span>
                  <span className="text-2xl font-bold tabular-nums text-white">{timeLeft}s</span>
                </div>
                <div className="w-full h-1.5 bg-white/10 mt-2 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-primary to-aurora-purple transition-all duration-1000"
                    style={{ width: `${(timeLeft / ttl) * 100}%` }}
                  />
                </div>
              </div>
            ) : (
              <div className="text-sm text-green-300/90 font-medium">Permanently Saved · Gallery Ready</div>
            )}

            <div className="flex flex-wrap gap-2 md:justify-end">
              <button
                onClick={handleScreenshot}
                className="flex items-center gap-2 px-4 py-2.5 bg-primary/20 border border-primary/40 rounded-xl text-primary hover:bg-primary/30 transition-all text-sm"
              >
                <span className="material-symbols-outlined text-lg">screenshot</span>
                保存此刻
              </button>

              <button
                onClick={handleShare}
                className="flex items-center gap-2 px-4 py-2.5 bg-aurora-purple/20 border border-aurora-purple/40 rounded-xl text-aurora-purple hover:bg-aurora-purple/30 transition-all text-sm"
              >
                <span className="material-symbols-outlined text-lg">share</span>
                分享心语
              </button>

              <button
                onClick={onExport}
                className="flex items-center gap-2 px-4 py-2.5 bg-white/10 border border-white/20 rounded-xl text-white hover:bg-white/20 transition-all text-sm"
              >
                <span className="material-symbols-outlined text-lg">download</span>
                珍藏永恒
              </button>

              {isPermanent && onOpenGallery && (
                <button
                  onClick={onOpenGallery}
                  className="flex items-center gap-2 px-4 py-2.5 bg-green-500/20 border border-green-500/40 rounded-xl text-green-300 hover:bg-green-500/30 transition-all text-sm"
                >
                  <span className="material-symbols-outlined text-lg">collections</span>
                  前往画廊
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </main>
  );
};

export default DecryptView;
