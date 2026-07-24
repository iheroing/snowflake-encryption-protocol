import React, { useEffect, useMemo, useRef, useState, useCallback } from 'react';
import { playHaptic } from '../utils/haptics';
import { generateSnowflakeDataURL, generateSnowflakeParams } from '../utils/snowflakeGenerator';
import { getSnowflakeId } from '../utils/signature';
import { useSound } from '../contexts/SoundContext';
import Icon from './Icon';
import LanguageToggleButton from './LanguageToggleButton';
import SoundToggleButton from './SoundToggleButton';

interface Props {
  message: string;
  signature: string;
  displaySeconds?: number;
  onClose: () => void;
  onExport: () => void;
  isCollected: boolean;
  onCollect: () => void;
}

const RevealView: React.FC<Props> = ({
  message,
  signature,
  displaySeconds = 60,
  onClose,
  onExport,
  isCollected,
  onCollect,
}) => {
  const { t } = useI18n();
  const { play } = useSound();
  const [remainingMs, setRemainingMs] = useState(displaySeconds * 1000);
  const [isMelting, setIsMelting] = useState(false);
  const [meltProgress, setMeltProgress] = useState(0);
  const meltRafRef = useRef<number | null>(null);
  const deadlineRef = useRef(Date.now() + displaySeconds * 1000);
  const didCloseRef = useRef(false);
  const meltEase = useMemo(() => 1 - Math.pow(1 - Math.min(1, meltProgress), 3), [meltProgress]);
  
  const snowflakeUrl = useMemo(
    () => generateSnowflakeDataURL(message, 900, signature),
    [message, signature],
  );
  const revealMotion = useMemo(() => {
    const family = generateSnowflakeParams(message, signature).family;
    if (family === 'hex-plate' || family === 'needle-rosette') return 'thaw';
    if (family === 'split-star') return 'fracture';
    return 'bloom';
  }, [message, signature]);

  const startMelting = useCallback(() => {
    if (didCloseRef.current || isMelting) return;
    setIsMelting(true);
    setMeltProgress(0);
    play('melt');
    
    const startAt = performance.now();
    const meltDuration = 5000;
    
    const tick = (now: number) => {
      const progress = Math.min((now - startAt) / meltDuration, 1);
      setMeltProgress(progress);
      if (progress < 1) {
        meltRafRef.current = window.requestAnimationFrame(tick);
      } else {
        didCloseRef.current = true;
        onClose();
      }
    };
    meltRafRef.current = window.requestAnimationFrame(tick);
  }, [isMelting, onClose, play]);

  useEffect(() => {
    playHaptic('reveal');
    const closeImmediately = () => {
      if (didCloseRef.current) return;
      if (meltRafRef.current !== null) cancelAnimationFrame(meltRafRef.current);
      didCloseRef.current = true;
      onClose();
    };
    const tick = () => {
      if (isMelting) return;
      const next = Math.max(0, deadlineRef.current - Date.now());
      setRemainingMs(next);
      if (next === 0) startMelting();
    };
    const handleVisibility = () => {
      if (document.hidden) closeImmediately();
    };
    const timer = window.setInterval(tick, 250);
    const deadline = window.setTimeout(startMelting, displaySeconds * 1000);
    window.addEventListener('pagehide', closeImmediately);
    document.addEventListener('visibilitychange', handleVisibility);
    tick();
    return () => {
      window.clearInterval(timer);
      window.clearTimeout(deadline);
      if (meltRafRef.current !== null) cancelAnimationFrame(meltRafRef.current);
      window.removeEventListener('pagehide', closeImmediately);
      document.removeEventListener('visibilitychange', handleVisibility);
    };
  }, [displaySeconds, onClose, startMelting, isMelting]);

  const remainingSeconds = Math.ceil(remainingMs / 1000);
  const progress = Math.max(0, Math.min(1, remainingMs / (displaySeconds * 1000)));

  return (
    <main className="cine-page reveal-page px-4 md:px-8">
      <div className="cine-stage reveal-stage">
        <header className="product-header">
          <button type="button" onClick={onClose} className="icon-button" aria-label={t('common.close')}>
            <Icon name="close" />
          </button>
          <div className="product-header-title">
            <span aria-hidden="true">❄</span>
            <div>
              <strong>{t('common.appName')}</strong>
              <small>{t('reveal.step')}</small>
            </div>
          </div>
          <div className="product-header-tools">
            <LanguageToggleButton compact />
            <SoundToggleButton compact />
          </div>
        </header>

        <section className="reveal-layout" aria-labelledby="revealed-title">
          <div 
            className="reveal-art" 
            data-reveal-motion={revealMotion} 
            aria-hidden="true"
            style={isMelting ? {
              opacity: Math.max(0, 1 - meltEase * 1.1),
              transform: `scale(${1 - meltEase * 0.15}) translateY(${meltEase * 40}px)`,
              filter: `blur(${meltEase * 16}px) brightness(${1.2 - meltEase * 0.4})`
            } : undefined}
          >
            <div className="reveal-art-halo" />
            <img src={snowflakeUrl} alt="" />
            <span>{getSnowflakeId(signature)}</span>
          </div>

          <article 
            className="letter-card"
            style={isMelting ? {
              opacity: Math.max(0, 1 - meltEase * 1.5),
              transform: `translateY(${meltEase * 20}px)`,
              pointerEvents: 'none'
            } : undefined}
          >
            <div className="letter-status">
              <span><Icon name="check" size={16} />{t('reveal.consumed')}</span>
              <span className="letter-timer" aria-label={t('reveal.timeLeft', { count: remainingSeconds })}>
                {remainingSeconds}s
              </span>
            </div>
            <div className="letter-progress" aria-hidden="true">
              <span style={{ transform: `scaleX(${progress})` }} />
            </div>

            <p className="section-kicker">{t('reveal.kicker')}</p>
            <h1 id="revealed-title" className="sr-only" data-view-heading tabIndex={-1} autoFocus>{t('reveal.title')}</h1>
            <blockquote>{message}</blockquote>

            <div className="letter-boundary-note">
              <Icon name="shield" size={18} />
              <p>
                <strong>{t('reveal.destroyedTitle')}</strong>
                <span>{t('reveal.destroyedBody')}</span>
              </p>
            </div>

            <div className="letter-actions">
              <button
                type="button"
                className="secondary-action keepsake-action"
                onClick={onCollect}
                disabled={isCollected}
              >
                <Icon name={isCollected ? 'check' : 'snowflake'} size={18} />
                {isCollected ? t('reveal.collected') : t('reveal.collect')}
              </button>
              <button type="button" className="secondary-action" onClick={onExport}>
                <Icon name="download" size={18} />
                {t('reveal.saveArt')}
              </button>
              <button type="button" className="quiet-action" onClick={onClose}>
                {t('reveal.closeNow')}
              </button>
            </div>
            <p className="keepsake-boundary">{t('reveal.collectBoundary')}</p>
          </article>
        </section>
      </div>
    </main>
  );
};

export default RevealView;
