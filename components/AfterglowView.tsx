
import React, { useState, useMemo, useRef } from 'react';
import { generateSnowflakeDataURL } from '../utils/snowflakeGenerator';
import { getSnowflakeId } from '../utils/share';
import SoundToggleButton from './SoundToggleButton';
import { useSound } from '../contexts/SoundContext';
import LanguageToggleButton from './LanguageToggleButton';
import { useI18n } from '../contexts/I18nContext';

interface Props {
  onBack: () => void;
  onExit: () => void;
  message?: string;
  signature?: string;
}

const AfterglowView: React.FC<Props> = ({ onBack, onExit, message = "A whisper from the void", signature = "afterglow_default" }) => {
  const [selectedCanvas, setSelectedCanvas] = useState('postcard');
  const canvasRef = useRef<HTMLDivElement>(null);
  const { play } = useSound();
  const { t, localeTag } = useI18n();
  
  const snowflakeURL = useMemo(() => generateSnowflakeDataURL(message, 1200, signature), [message, signature]);
  const snowflakeId = useMemo(() => getSnowflakeId(signature), [signature]);
  
  const handleExport = async () => {
    try {
      // 创建一个高分辨率的canvas
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      if (!ctx) return;
      
      // 根据选择的画布类型设置尺寸
      let width, height;
      switch (selectedCanvas) {
        case 'postcard':
          width = 1600;
          height = 1000;
          break;
        case 'desktop':
          width = 2560;
          height = 1440;
          break;
        case 'mobile':
          width = 1080;
          height = 1920;
          break;
        default:
          width = 1600;
          height = 1000;
      }
      
      canvas.width = width;
      canvas.height = height;
      
      // 绘制深色背景
      const gradient = ctx.createRadialGradient(width/2, height/2, 0, width/2, height/2, width/2);
      gradient.addColorStop(0, '#0a0d15');
      gradient.addColorStop(1, '#050608');
      ctx.fillStyle = gradient;
      ctx.fillRect(0, 0, width, height);
      
      // 添加星尘背景效果
      ctx.save();
      ctx.globalAlpha = 0.05;
      for (let i = 0; i < 100; i++) {
        const x = Math.random() * width;
        const y = Math.random() * height;
        const size = Math.random() * 2;
        ctx.fillStyle = '#ffffff';
        ctx.beginPath();
        ctx.arc(x, y, size, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.restore();
      
      // 添加光晕效果
      ctx.save();
      ctx.globalAlpha = 0.1;
      const glowGradient = ctx.createRadialGradient(width/2, height/2, 0, width/2, height/2, width * 0.4);
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
        // 计算雪花大小和位置
        const snowflakeSize = Math.min(width, height) * 0.5;
        const snowflakeX = (width - snowflakeSize) / 2;
        const snowflakeY = selectedCanvas === 'mobile' 
          ? height * 0.25 
          : (height - snowflakeSize) / 2 - 80;
        
        // 绘制雪花
        ctx.drawImage(img, snowflakeX, snowflakeY, snowflakeSize, snowflakeSize);
        
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillStyle = '#D1DCE3';
        ctx.font = `500 ${Math.max(12, width * 0.012)}px "Space Grotesk", sans-serif`;
        ctx.fillText(snowflakeId, width / 2, selectedCanvas === 'mobile' ? height * 0.7 : height * 0.78);
        
        // 添加顶部标题
        ctx.fillStyle = 'rgba(56, 218, 250, 0.6)';
        ctx.font = `300 ${width * 0.012}px "Space Grotesk", sans-serif`;
        ctx.fillText(t('common.appSubtitle'), width / 2, height * 0.05);
        
        // 添加底部时间戳
        ctx.fillStyle = 'rgba(255, 255, 255, 0.3)';
        ctx.font = `300 ${width * 0.01}px "Space Grotesk", sans-serif`;
        const timestamp = new Date().toLocaleString(localeTag, {
          year: 'numeric',
          month: '2-digit',
          day: '2-digit',
          hour: '2-digit',
          minute: '2-digit'
        });
        ctx.fillText(`${t('afterglow.stampPrefix')} ${timestamp}`, width / 2, height * 0.95);
        
        // 添加底部装饰文字
        ctx.fillStyle = 'rgba(255, 255, 255, 0.2)';
        ctx.font = `300 ${width * 0.008}px "Space Grotesk", sans-serif`;
        ctx.fillText(t('afterglow.footerEngine').toUpperCase(), width * 0.2, height * 0.97);
        ctx.fillText(`${t('afterglow.footerRender')}: ${width} x ${height}`, width * 0.8, height * 0.97);
        
        // 导出为 PNG
        canvas.toBlob((blob) => {
          if (blob) {
            play('export');
            const url = URL.createObjectURL(blob);
            const link = document.createElement('a');
            const canvasType = selectedCanvas === 'postcard' ? 'postcard' : 
                              selectedCanvas === 'desktop' ? 'wallpaper' : 'lockscreen';
            link.download = `snowflake-whisper-${canvasType}-${Date.now()}.png`;
            link.href = url;
            link.click();
            URL.revokeObjectURL(url);
          }
        }, 'image/png', 1.0);
      };
      
      img.onerror = () => {
        console.error('Failed to load snowflake image');
        alert(t('afterglow.exportFailed'));
      };
    } catch (error) {
      console.error('Export failed:', error);
      alert(t('afterglow.exportFailed'));
    }
  };

  return (
    <div className="relative z-10 cine-page w-full flex flex-col overflow-hidden bg-background-dark px-4 md:px-8">
      <div className="absolute top-1/2 left-1/3 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-primary rounded-full blur-[120px] opacity-10"></div>
      
      <div className="cine-stage cine-fold flex flex-col">
      <header className="relative z-50 w-full mx-auto mb-4 flex items-center justify-between px-4 md:px-5 py-3 cine-header">
        <div className="flex items-center gap-6">
          <button onClick={onBack} className="flex items-center gap-2 text-primary hover:text-white transition-colors">
            <span className="material-symbols-outlined">arrow_back</span>
            <span className="text-xs font-bold tracking-[0.2em] uppercase">{t('afterglow.return')}</span>
          </button>
          <div className="h-4 w-px bg-white/10"></div>
          <div className="flex items-center gap-3">
            <span className="material-symbols-outlined text-primary">ac_unit</span>
            <h2 className="font-serif italic text-lg tracking-tight">{t('common.appName')}</h2>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <LanguageToggleButton compact />
          <SoundToggleButton compact />
          <button onClick={onExit} className="size-10 rounded-full cine-btn-ghost flex items-center justify-center">
             <span className="material-symbols-outlined">close</span>
          </button>
        </div>
      </header>

      <main className="relative flex-1 min-h-0 flex pb-8 md:pb-10 gap-10 overflow-hidden items-center justify-center">
        <div className="flex-1 flex flex-col items-center justify-center">
           <div ref={canvasRef} className="relative w-full max-w-2xl aspect-[1.6/1] cine-panel-strong flex items-center justify-center p-12 crystal-glow">
              <div className="absolute inset-0 stardust-bg opacity-10"></div>
              <div className="relative z-10 w-full h-full flex flex-col items-center justify-center gap-8">
                 <img 
                    src={snowflakeURL}
                    className="w-48 h-48 md:w-64 md:h-64 object-contain drop-shadow-[0_0_40px_rgba(56,218,250,0.5)] animate-[spin_20s_linear_infinite]"
                    alt="Afterglow Fractal"
                 />
                 <div className="text-center">
                    <p className="text-xs uppercase tracking-[0.2em] text-white/45">{t('afterglow.secureNoText')}</p>
                    <p className="text-[10px] tracking-[0.4em] uppercase text-white/30 mt-4">
                      {t('afterglow.capturedAt')} {new Date().toLocaleTimeString(localeTag)} • {new Date().toLocaleDateString(localeTag)}
                    </p>
                    <p className="text-[10px] tracking-[0.25em] uppercase text-primary/50 mt-3">{snowflakeId}</p>
                 </div>
              </div>
           </div>
        </div>

        {/* Sidebar Controls */}
        <aside className="w-[420px] h-full cine-panel-strong p-8 flex flex-col gap-10">
          <div>
            <h1 className="font-serif text-3xl font-bold mb-3">{t('afterglow.title')}</h1>
            <p className="text-white/40 text-sm leading-relaxed">{t('afterglow.desc')}</p>
          </div>

          <div className="space-y-4">
            <h3 className="text-[10px] font-bold tracking-widest text-white/40 uppercase">{t('afterglow.canvasSelection')}</h3>
            <div className="flex flex-col gap-3">
              {[
                { id: 'postcard', label: t('afterglow.optionPostcard'), icon: 'drafts' },
                { id: 'desktop', label: t('afterglow.optionDesktop'), icon: 'desktop_windows' },
                { id: 'mobile', label: t('afterglow.optionMobile'), icon: 'smartphone' }
              ].map(opt => (
                <div 
                  key={opt.id}
                  onClick={() => setSelectedCanvas(opt.id)}
                  className={`flex items-center gap-4 p-4 rounded-xl border transition-all cursor-pointer ${selectedCanvas === opt.id ? 'bg-primary/20 border-primary shadow-[0_0_15px_rgba(56,218,250,0.2)]' : 'bg-white/5 border-white/10 hover:bg-white/10'}`}
                >
                  <span className="material-symbols-outlined opacity-60">{opt.icon}</span>
                  <span className="text-sm font-medium">{opt.label}</span>
                  {selectedCanvas === opt.id && <span className="material-symbols-outlined ml-auto text-primary text-sm">check_circle</span>}
                </div>
              ))}
            </div>
          </div>

          <div className="mt-auto space-y-6">
             <button onClick={handleExport} className="w-full cine-btn-primary font-bold py-5 rounded-2xl flex items-center justify-center gap-3 active:scale-[0.98] shadow-lg shadow-primary/20">
                <span className="material-symbols-outlined">download</span>
                {t('afterglow.export')}
             </button>
             <p className="text-[10px] text-center text-white/30 tracking-widest uppercase">{t('afterglow.hiRes')}</p>
          </div>
        </aside>
      </main>

      <footer className="px-2 md:px-4 py-5 border-t border-white/5 bg-background-dark/80 flex items-center justify-between">
         <div className="flex items-center gap-2">
            <span className="size-1.5 bg-primary rounded-full animate-pulse"></span>
            <span className="text-[10px] font-bold text-white/40 tracking-widest uppercase">{t('afterglow.footerEngine')}</span>
         </div>
         <div className="flex gap-8 text-[10px] text-white/30 tracking-widest">
            <span>{t('afterglow.footerRender')}: 4096 x 2304</span>
            <span>{t('afterglow.footerComplexity')}: 8.4M poly</span>
         </div>
      </footer>
      </div>
    </div>
  );
};

export default AfterglowView;
