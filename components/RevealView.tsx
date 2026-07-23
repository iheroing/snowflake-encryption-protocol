import React, { useEffect, useMemo, useRef, useState } from 'react';
import { useI18n } from '../contexts/I18nContext';
import { playHaptic } from '../utils/haptics';
import { generateSnowflakeDataURL, generateSnowflakeParams } from '../utils/snowflakeGenerator';
import { getSnowflakeId } from '../utils/signature';
import Icon from './Icon';
import LanguageToggleButton from './LanguageToggleButton';
import SoundToggleButton from './SoundToggleButton';

interface Props {
  message: string;
  signature: string;
  displaySeconds?: number;
  onClose: () => void;
  onExport: () => void;
}

const RevealView: React.FC<Props> = ({
  message,
  signature,
  displaySeconds = 60,
  onClose,
  onExport,
}) => {
  const { t } = useI18n();
  const [remainingMs, setRemainingMs] = useState(displaySeconds * 1000);
  const deadlineRef = useRef(Date.now() + displaySeconds * 1000);
  const didCloseRef = useRef(false);
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

  useEffect(() => {
    playHaptic('reveal');
    const closeOnce = () => {
      if (didCloseRef.current) return;
      didCloseRef.current = true;
      onClose();
    };
    const tick = () => {
      const next = Math.max(0, deadlineRef.current - Date.now());
      setRemainingMs(next);
      if (next === 0) closeOnce();
    };
    const handleVisibility = () => {
      if (document.hidden) closeOnce();
    };
    const timer = window.setInterval(tick, 250);
    const deadline = window.setTimeout(closeOnce, displaySeconds * 1000);
    window.addEventListener('pagehide', closeOnce);
    document.addEventListener('visibilitychange', handleVisibility);
    tick();
    return () => {
      window.clearInterval(timer);
      window.clearTimeout(deadline);
      window.removeEventListener('pagehide', closeOnce);
      document.removeEventListener('visibilitychange', handleVisibility);
    };
  }, [displaySeconds, onClose]);

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
          <div className="reveal-art" data-reveal-motion={revealMotion} aria-hidden="true">
            <div className="reveal-art-halo" />
            <img src={snowflakeUrl} alt="" />
            <span>{getSnowflakeId(signature)}</span>
          </div>

          <article className="letter-card">
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
              <button type="button" className="secondary-action" onClick={onExport}>
                <Icon name="download" size={18} />
                {t('reveal.saveArt')}
              </button>
              <button type="button" className="quiet-action" onClick={onClose}>
                {t('reveal.closeNow')}
              </button>
            </div>
          </article>
        </section>
      </div>
    </main>
  );
};

export default RevealView;
