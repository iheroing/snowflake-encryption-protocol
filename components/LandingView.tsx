
import React from 'react';
import { useSound } from '../contexts/SoundContext';
import SoundToggleButton from './SoundToggleButton';
import LanguageToggleButton from './LanguageToggleButton';
import { useI18n } from '../contexts/I18nContext';

interface Props {
  onCrystallize: () => void;
  onEnterMuseum: () => void;
}

const LandingView: React.FC<Props> = ({ onCrystallize, onEnterMuseum }) => {
  const { play } = useSound();
  const { t } = useI18n();

  return (
    <main className="cine-page px-5 md:px-8">
      <div className="cine-stage cine-fold flex flex-col">
      <header className="w-full px-4 md:px-5 py-3 cine-header flex items-center justify-between">
        <div className="flex items-center gap-3">
          <span className="material-symbols-outlined text-primary">ac_unit</span>
          <div className="text-left">
            <h2 className="text-sm font-bold tracking-wide text-white/90">{t('common.appName')}</h2>
            <p className="text-[10px] uppercase tracking-[0.2em] text-primary/60">{t('common.appSubtitle')}</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={onEnterMuseum} className="cine-btn-ghost px-4 py-2 text-xs font-semibold tracking-[0.16em] uppercase">
            {t('landing.museum')}
          </button>
          <LanguageToggleButton compact />
          <SoundToggleButton compact />
        </div>
      </header>

      <div className="flex-1 min-h-0 flex flex-col items-center justify-center text-center py-5 md:py-7">
      <div className="mb-7 md:mb-8 space-y-2 opacity-80">
        <span className="text-primary text-xs tracking-[0.24em] font-medium uppercase">{t('landing.phase')}</span>
        <p className="text-xl font-light italic text-glacial/80 font-serif">{t('landing.quote')}</p>
      </div>

      <div onClick={() => {
        play('crystallize');
        onCrystallize();
      }} className="relative group cursor-pointer transition-all duration-700 hover:scale-105">
        <div className="absolute inset-0 rounded-full border border-primary/10 scale-150 animate-pulse"></div>
        <div className="absolute inset-0 rounded-full border border-primary/5 scale-[2.2] animate-pulse delay-700"></div>
        
        <div className="relative w-56 h-56 md:w-72 md:h-72 flex items-center justify-center animate-[bounce_6s_ease-in-out_infinite]">
          <div className="absolute inset-0 bg-primary/20 rounded-full blur-[40px] animate-pulse"></div>
          
          <div className="relative z-20 w-44 h-44 md:w-52 md:h-52 overflow-hidden rounded-full border border-white/10 backdrop-blur-sm bg-white/5 flex items-center justify-center">
            <img 
              src="https://lh3.googleusercontent.com/aida-public/AB6AXuB9emQwz3McBFik7FpWZa3DKIXwUVJgUoj2-8A3nprYxkSFLnhbhA_iAw9NztzCsUNiAj8NROvHb5r8pevmC1s5NtH7BSrYQl85jhT4SOkrXwGaIB8z-MFX2b-D6367YLXWQGB6nDtJaqeGw44QU7HRkdSnd2xbdUdijPw1sVhhcRxOIKNrtw8DxElD4hDvWkd_k_i4peuZmDPzTfxlJOg_8BLiNvcA0hQbGtKv92TvTHfQ7r2Q4Clm8X6uNPpJV3gpysDKCv18Qyo" 
              className="w-full h-full object-cover opacity-60 mix-blend-screen scale-125"
              alt="Crystallizing Seed"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-primary/20 to-transparent"></div>
            <div className="absolute inset-0 flex items-center justify-center">
              <span className="material-symbols-outlined text-primary text-5xl opacity-40 group-hover:opacity-100 group-hover:scale-110 transition-all duration-700">
                fingerprint
              </span>
            </div>
          </div>
        </div>
      </div>

      <div className="mt-8 md:mt-10 space-y-4">
        <h1 className="text-xl md:text-3xl font-bold tracking-wide text-white/90">
          {t('landing.line1')} <br/>
          <span className="text-primary font-display italic">{t('landing.line2')}</span>
        </h1>
        <div className="flex items-center justify-center space-x-4">
          <div className="h-[1px] w-12 bg-gradient-to-r from-transparent to-primary/50"></div>
          <div className="w-2 h-2 rounded-full bg-primary animate-ping"></div>
          <div className="h-[1px] w-12 bg-gradient-to-l from-transparent to-primary/50"></div>
        </div>
      </div>

      <p className="mt-8 text-[10px] tracking-[0.2em] uppercase cine-muted">
        {t('landing.hint')}
      </p>
      </div>
      </div>
    </main>
  );
};

export default LandingView;
