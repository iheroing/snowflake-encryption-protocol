
import React, { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import { generateSnowflakeDataURL } from '../utils/snowflakeGenerator';
import { buildShareUrl, getSnowflakeId } from '../utils/share';
import { useSound } from '../contexts/SoundContext';
import SoundToggleButton from './SoundToggleButton';
import LanguageToggleButton from './LanguageToggleButton';
import { useI18n } from '../contexts/I18nContext';

interface Props {
  message: string;
  signature: string;
  ttl: number; // 自定义时间（秒）
  onClose: () => void;
  onExport: () => void;
  onOpenGallery?: () => void;
  source?: 'local' | 'shared';
}

const MELT_DURATION_MS = 9000;

const DecryptView: React.FC<Props> = ({ message, signature, ttl, onClose, onExport, onOpenGallery, source = 'local' }) => {
  const [timeLeft, setTimeLeft] = useState(ttl);
  const [rotation, setRotation] = useState(0);
  const [isMelting, setIsMelting] = useState(false);
  const [meltProgress, setMeltProgress] = useState(0);
  const snowflakeRef = useRef<HTMLDivElement>(null);
  const meltRafRef = useRef<number | null>(null);
  const { play } = useSound();
  const { t, localeTag } = useI18n();
  
  const isPermanent = ttl === -1;
  const snowflakeId = useMemo(() => getSnowflakeId(signature), [signature]);
  const meltEase = useMemo(() => 1 - Math.pow(1 - Math.min(1, meltProgress), 3), [meltProgress]);
  const snowflakeURL = useMemo(() => generateSnowflakeDataURL(message, 800, signature), [message, signature]);

  const startMelting = useCallback(() => {
    if (isMelting) {
      return;
    }

    setIsMelting(true);
    setMeltProgress(0);
    play('melt');

    const startAt = performance.now();
    const tick = (now: number) => {
      const progress = Math.min((now - startAt) / MELT_DURATION_MS, 1);
      setMeltProgress(progress);
      if (progress < 1) {
        meltRafRef.current = window.requestAnimationFrame(tick);
      } else {
        onClose();
      }
    };

    meltRafRef.current = window.requestAnimationFrame(tick);
  }, [isMelting, onClose, play]);
  
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
        
      // 绘制底部识别标识，不写入明文内容
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillStyle = 'rgba(255, 255, 255, 0.52)';
      ctx.font = '500 18px "Space Grotesk", sans-serif';
      ctx.fillText(snowflakeId, width / 2, 1040);
        
        // 添加顶部标题
        ctx.fillStyle = 'rgba(56, 218, 250, 0.6)';
        ctx.font = '300 16px "Space Grotesk", sans-serif';
        ctx.fillText(t('common.appSubtitle'), width / 2, 60);
        
        // 添加底部时间戳
        ctx.fillStyle = 'rgba(255, 255, 255, 0.3)';
        ctx.font = '300 14px "Space Grotesk", sans-serif';
        const timestamp = new Date().toLocaleString(localeTag, {
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
            play('export');
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
        alert(t('decrypt.screenshotFailed'));
      };
    } catch (error) {
      console.error('Screenshot failed:', error);
      alert(t('decrypt.screenshotFailed'));
    }
  };
  
  const handleShare = async () => {
    const shareUrl = await buildShareUrl(message, signature);
    if (navigator.share) {
      try {
        play('share');
        await navigator.share({
          title: t('decrypt.shareTitle'),
          text: t('decrypt.shareText', { id: snowflakeId }),
          url: shareUrl
        });
        return;
      } catch (error) {
        // fallback to clipboard
      }
    }

    try {
      await navigator.clipboard.writeText(shareUrl);
      play('share');
      alert(t('decrypt.shareCopied'));
    } catch {
      prompt(t('common.copyPrompt'), shareUrl);
    }
  };

  const handleExport = () => {
    play('export');
    onExport();
  };

  useEffect(() => {
    setTimeLeft(ttl);
    setIsMelting(false);
    setMeltProgress(0);
    if (meltRafRef.current !== null) {
      cancelAnimationFrame(meltRafRef.current);
      meltRafRef.current = null;
    }
  }, [ttl, message, signature]);

  useEffect(() => {
    if (isPermanent) return;
    
    if (timeLeft <= 0) {
      startMelting();
      return;
    }
    const timer = setInterval(() => setTimeLeft(prev => prev - 1), 1000);
    return () => clearInterval(timer);
  }, [timeLeft, isPermanent, startMelting]);

  // 雪花旋转动画
  useEffect(() => {
    const rotationTimer = setInterval(() => {
      setRotation(prev => (prev + 0.5) % 360);
    }, 50);
    return () => clearInterval(rotationTimer);
  }, []);

  useEffect(() => {
    return () => {
      if (meltRafRef.current !== null) {
        cancelAnimationFrame(meltRafRef.current);
      }
    };
  }, []);

  return (
    <main className="cine-page px-4 md:px-8 overflow-y-auto md:overflow-hidden">
      <div className="absolute top-[20%] left-[18%] w-[420px] h-[420px] bg-primary/10 rounded-full blur-[110px] pointer-events-none"></div>
      <div className="absolute bottom-[18%] right-[16%] w-[500px] h-[500px] bg-aurora-purple/10 rounded-full blur-[140px] pointer-events-none"></div>

      <div className="relative z-10 cine-stage cine-fold grid grid-rows-[auto_auto_1fr_auto] gap-3 md:gap-4">
        <header className="w-full flex items-center justify-between px-4 md:px-5 py-3 cine-header">
          <div className="flex items-center gap-3">
            <div className="size-8 flex items-center justify-center bg-primary/20 rounded-lg border border-primary/40">
              <span className="material-symbols-outlined text-primary text-xl">ac_unit</span>
            </div>
            <div>
              <h2 className="text-white text-sm font-bold tracking-widest">{t('common.appName')}</h2>
              <p className="text-[10px] text-primary/70 tracking-wider font-medium uppercase">{t('decrypt.scene')}</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <LanguageToggleButton compact />
            <SoundToggleButton />
            <button onClick={onClose} className="size-10 flex items-center justify-center rounded-full cine-btn-ghost">
              <span className="material-symbols-outlined">close</span>
            </button>
          </div>
        </header>

        <div className={`w-full rounded-2xl border px-4 py-3 backdrop-blur-sm ${
          isPermanent ? 'bg-green-500/10 border-green-500/30' : 'bg-red-500/10 border-red-500/30'
        }`}>
          {isPermanent ? (
            <div className="flex items-center gap-3">
              <span className="material-symbols-outlined text-green-400 text-2xl">bookmark</span>
              <div className="text-sm text-white/80">
                {t('decrypt.permanent')}
                {source === 'shared' && <span className="text-primary/80"> · {t('decrypt.sharedRecognized')}</span>}
              </div>
            </div>
          ) : (
            <div className="flex items-center gap-3">
              <span className="material-symbols-outlined text-red-400 text-2xl animate-pulse">warning</span>
              <div className="text-sm text-white/80">
                {t('decrypt.ephemeralPrefix')} <span className="text-red-400 font-bold tabular-nums">{timeLeft}s</span> {t('decrypt.ephemeralSuffix')}
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
              className="w-[72%] h-[72%] object-contain brightness-125 transition-all duration-300"
              alt="Fractal snowflake"
              style={{
                opacity: 1 - meltEase * 0.95,
                transform: `rotate(${rotation + meltEase * 140}deg) scale(${1 + meltEase * 0.45}) translateY(${meltEase * 36}px)`,
                filter: `blur(${meltEase * 24}px) brightness(${1.25 - meltEase * 0.35}) drop-shadow(0 0 ${30 - meltEase * 18}px rgba(56, 218, 250, ${0.6 - meltEase * 0.35}))`
              }}
            />

            <div className="absolute inset-0 pointer-events-none" style={{ opacity: meltEase * 0.75 }}>
              <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(255,255,255,0.22),rgba(56,218,250,0.07)_35%,transparent_65%)] blur-2xl" />
            </div>

            <div className="absolute inset-0 flex flex-col items-center justify-center px-8 md:px-14 transition-all duration-300" style={{ opacity: 1 - meltEase * 1.1, transform: `translateY(${meltEase * 18}px) scale(${1 - meltEase * 0.12})` }}>
              <span className="text-primary text-[10px] tracking-widest font-bold opacity-60 mb-3 uppercase">
                {t('decrypt.completed')}
              </span>
              <p className="text-xs md:text-sm text-white/55 tracking-[0.16em] uppercase">
                {t('decrypt.secureNoText')}
              </p>
              <p className="mt-3 text-[10px] tracking-[0.2em] text-primary/60 uppercase">
                {snowflakeId}
              </p>
            </div>

            {isMelting && (
              <div className="absolute bottom-6 text-[11px] tracking-[0.2em] uppercase text-primary/70 animate-pulse">
                {t('decrypt.meltingIntoSilence')}
              </div>
            )}
          </div>
        </div>

        <div className="rounded-2xl cine-panel-strong px-3 py-3 md:px-4 md:py-4">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
            {!isPermanent ? (
              <div className="min-w-[220px]">
                <div className="flex items-baseline gap-2">
                  <span className="text-[10px] uppercase tracking-widest text-primary/60">
                    {isMelting ? t('decrypt.meltingLabel') : t('decrypt.meltingIn')}
                  </span>
                  <span className="text-2xl font-bold tabular-nums text-white">
                    {isMelting ? `${Math.round(meltEase * 100)}%` : `${timeLeft}s`}
                  </span>
                </div>
                <div className="w-full h-1.5 bg-white/10 mt-2 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-primary to-aurora-purple transition-all duration-1000"
                    style={{ width: `${isMelting ? meltEase * 100 : (timeLeft / ttl) * 100}%` }}
                  />
                </div>
              </div>
            ) : (
              <div className="text-sm text-green-300/90 font-medium">{t('decrypt.permanentReady')}</div>
            )}

            <div className="flex flex-wrap gap-2 md:justify-end">
              <button
                onClick={handleScreenshot}
                className="flex items-center gap-2 px-4 py-2.5 cine-btn-accent text-sm"
              >
                <span className="material-symbols-outlined text-lg">screenshot</span>
                {t('decrypt.saveMoment')}
              </button>

              <button
                onClick={handleShare}
                className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-aurora-purple transition-all text-sm bg-aurora-purple/20 border border-aurora-purple/40 hover:bg-aurora-purple/30"
              >
                <span className="material-symbols-outlined text-lg">share</span>
                {t('decrypt.shareWhisper')}
              </button>

              <button
                onClick={handleExport}
                className="flex items-center gap-2 px-4 py-2.5 cine-btn-ghost text-sm"
              >
                <span className="material-symbols-outlined text-lg">download</span>
                {t('decrypt.export')}
              </button>

              {isPermanent && onOpenGallery && (
                <button
                  onClick={onOpenGallery}
                  className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-green-300 transition-all text-sm bg-green-500/20 border border-green-500/40 hover:bg-green-500/30"
                >
                  <span className="material-symbols-outlined text-lg">collections</span>
                  {t('decrypt.gotoGallery')}
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
