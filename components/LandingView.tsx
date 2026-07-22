import React from 'react';
import { useSound } from '../contexts/SoundContext';
import SoundToggleButton from './SoundToggleButton';
import LanguageToggleButton from './LanguageToggleButton';
import { useI18n } from '../contexts/I18nContext';

interface Props {
  onCrystallize: () => void;
}

const LandingView: React.FC<Props> = ({ onCrystallize }) => {
  const { play } = useSound();
  const { t } = useI18n();

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
            <span className="landing-seal-ring" aria-hidden="true" />
            <span className="landing-seal-core" aria-hidden="true">
              <span className="landing-envelope-fold" />
              <span className="landing-snow-mark">❄</span>
            </span>
            <span className="sr-only">{t('landing.hint')}</span>
          </button>

          <p id="landing-action-hint" className="landing-hint">
            <span aria-hidden="true" />
            {t('landing.hint')}
            <span aria-hidden="true" />
          </p>
        </section>

        <footer className="landing-footer" aria-hidden="true">
          <span>01</span>
          <span className="landing-footer-line" />
          <span>· SNOW LETTER ·</span>
        </footer>
      </div>
    </main>
  );
};

export default LandingView;
