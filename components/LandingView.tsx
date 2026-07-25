import React, { useMemo, useState } from 'react';
import { useSound } from '../contexts/SoundContext';
import SoundToggleButton from './SoundToggleButton';
import LanguageToggleButton from './LanguageToggleButton';
import AlgorithmModal from './AlgorithmModal';
import { useI18n } from '../contexts/I18nContext';
import Icon from './Icon';
import { createSnowflakeSignature } from '../utils/signature';
import { generateSnowflakeDataURL, generateSnowflakeParams } from '../utils/snowflakeGenerator';

interface Props {
  onCrystallize: () => void;
  onOpenGallery: () => void;
}

const LandingView: React.FC<Props> = ({ onCrystallize, onOpenGallery }) => {
  const { play } = useSound();
  const { t } = useI18n();
  const [isHomageExpanded, setIsHomageExpanded] = useState(false);
  const [showAlgo, setShowAlgo] = useState(false);

  // 每次到访都落下一片新的雪：临时签名只用于门面标本，不参与任何信件。
  const specimen = useMemo(() => {
    const signature = createSnowflakeSignature();
    const params = generateSnowflakeParams('landing-specimen', signature);
    return {
      url: generateSnowflakeDataURL('landing-specimen', 640, signature),
      family: params.family,
      no: params.seedKey.slice(0, 6).toUpperCase(),
    };
  }, []);

  const handleCrystallize = () => {
    play('crystallize');
    onCrystallize();
  };

  return (
    <main className="cine-page landing-page px-4 md:px-8">
      <div className="cine-stage cine-fold landing-stage flex flex-col">
        <header className="landing-header flex w-full items-center justify-between gap-3">
          <div className="landing-brand flex min-w-0 items-center gap-3">
            <span className="landing-brand-mark" aria-hidden="true">❄</span>
            <div className="min-w-0 text-left">
              <h2 className="truncate text-sm font-semibold tracking-[0.12em] text-white/90">
                {t('common.appName')}
              </h2>
              <p className="truncate text-[9px] uppercase tracking-[0.24em] text-white/40">
                {t('common.appSubtitle')}
              </p>
            </div>
          </div>

          <div className="landing-tools flex shrink-0 items-center gap-2">
            <button 
              type="button" 
              className="algo-orb" 
              onClick={() => setShowAlgo(true)}
              aria-label={t('algo.title')}
              title={t('algo.title')}
            >
              <Icon name="info" size={16} />
            </button>
            <button type="button" className="cine-btn-ghost landing-gallery-link" onClick={onOpenGallery}>
              <Icon name="snowflake" size={16} />
              <span>{t('landing.museum')}</span>
            </button>
            <LanguageToggleButton compact />
            <SoundToggleButton compact />
          </div>
        </header>

        <section className="landing-hero flex flex-1 flex-col items-center justify-center text-center" aria-labelledby="landing-title">
          <div className="landing-intro">
            <p className="landing-kicker">{t('landing.phase')}</p>
            <h1 id="landing-title" className="landing-title">
              <span>{t('landing.line1')}</span>
              <em>{t('landing.line2')}</em>
            </h1>
            <p className="landing-quote">{t('landing.quote')}</p>
          </div>

          <button
            type="button"
            onClick={handleCrystallize}
            className="landing-seal"
            aria-describedby="landing-action-hint"
          >
            <span className="landing-seal-ring" aria-hidden="true">
              <i />
              <i />
            </span>
            <img className="landing-seal-flake" src={specimen.url} alt="" aria-hidden="true" />
            <span className="sr-only">{t('landing.hint')}</span>
          </button>

          <p className="landing-specimen-label" aria-hidden="true">
            <span className="landing-specimen-no">№ {specimen.no}</span>
            <span className="landing-specimen-divider" />
            <span>{t(`gallery.families.${specimen.family}`)}</span>
          </p>

          <p id="landing-action-hint" className="landing-hint">
            <span aria-hidden="true" />
            {t('landing.hint')}
            <span aria-hidden="true" />
          </p>
        </section>

        <footer className={`landing-homage ${isHomageExpanded ? 'is-expanded' : ''}`}>
          <button 
            type="button" 
            className="landing-homage-mark" 
            onClick={() => setIsHomageExpanded(prev => !prev)}
            aria-label={isHomageExpanded ? '收起介绍' : '了解 Bentley'}
          >
            ❋
          </button>
          <div className="landing-homage-content">
            <p>
              {t('landing.bentley')}
              <a 
                href="https://en.wikipedia.org/wiki/Wilson_Bentley" 
                target="_blank" 
                rel="noopener noreferrer" 
                className="landing-homage-link"
              >
                (Wikipedia)
              </a>
            </p>
          </div>
        </footer>
      </div>
      
      {showAlgo && <AlgorithmModal onClose={() => setShowAlgo(false)} />}
    </main>
  );
};

export default LandingView;
