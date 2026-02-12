import React, { useState } from 'react';
import { encrypt } from '../utils/encryption';
import { saveSnowflake } from '../utils/storage';
import { createSnowflakeSignature } from '../utils/share';
import { useSound } from '../contexts/SoundContext';
import SoundToggleButton from './SoundToggleButton';
import LanguageToggleButton from './LanguageToggleButton';
import { useI18n } from '../contexts/I18nContext';

interface Props {
  onCrystallized: (payload: { message: string; ttl: number; signature: string }) => void;
  onBack: () => void;
}

const EncryptView: React.FC<Props> = ({ onCrystallized, onBack }) => {
  const [text, setText] = useState("");
  const [essence, setEssence] = useState<'aurora' | 'stardust'>('aurora');
  const [isGenerating, setIsGenerating] = useState(false);
  const [ttl, setTtl] = useState(60); // 默认60秒
  const [enablePassword, setEnablePassword] = useState(false);
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [passwordError, setPasswordError] = useState("");
  const [showAdvanced, setShowAdvanced] = useState(false);
  const { play } = useSound();
  const { t } = useI18n();

  const handleCrystallize = async () => {
    const message = text.trim();
    if (!message) return;

    const canPersist = ttl === -1;
    const shouldEncrypt = canPersist && enablePassword;

    if (shouldEncrypt) {
      if (password.length < 6) {
        setPasswordError(t('encrypt.passwordShort'));
        return;
      }
      if (password !== confirmPassword) {
        setPasswordError(t('encrypt.passwordMismatch'));
        return;
      }
    }
    
    setIsGenerating(true);
    
    try {
      let encryptedMessage: string | undefined;
      if (shouldEncrypt) {
        encryptedMessage = await encrypt(message, password);
      }

      let signature = createSnowflakeSignature();
      if (canPersist) {
        const saved = saveSnowflake(message, essence, encryptedMessage, shouldEncrypt);
        if (saved?.id) {
          signature = saved.id;
        }
      }
      
      // 模拟生成过程
      setTimeout(() => {
        play('crystallize');
        onCrystallized({ message, ttl, signature });
      }, 1500);
    } catch (error) {
      console.error('Crystallization failed:', error);
      alert(t('encrypt.failed'));
      setIsGenerating(false);
    }
  };

  return (
    <main className="cine-page px-4 md:px-6 overflow-y-auto">
      <div className="pointer-events-none absolute top-[20%] left-1/2 -translate-x-1/2 w-[620px] h-[620px] rounded-full bg-primary/10 blur-[160px]"></div>
      <div className="relative z-10 cine-stage cine-fold flex flex-col">
      <header className="w-full max-w-5xl mx-auto flex items-center justify-between px-4 md:px-5 py-3 mb-5 md:mb-6 cine-header">
        <div className="flex items-center gap-3 cursor-pointer" onClick={onBack}>
          <span className="material-symbols-outlined text-primary">ac_unit</span>
          <div className="flex flex-col">
            <h2 className="text-sm font-bold tracking-wide text-white/90">{t('common.appName')}</h2>
            <span className="text-[10px] tracking-[0.2em] text-primary/60 uppercase">{t('common.appSubtitle')}</span>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <LanguageToggleButton compact />
          <SoundToggleButton compact />
          <button onClick={onBack} className="size-10 cine-btn-ghost flex items-center justify-center rounded-full">
            <span className="material-symbols-outlined text-white/70">close</span>
          </button>
        </div>
      </header>

      <div className="relative z-10 w-full flex-1 min-h-0 overflow-y-auto md:overflow-visible flex items-center justify-center">
      <div className="w-full max-w-4xl flex flex-col items-center pb-10 md:pb-12">
        <span className="text-primary/35 text-[10px] tracking-[0.35em] mb-4 uppercase">{t('encrypt.phase')}</span>
        <h1 className="text-glacial text-2xl md:text-3xl tracking-wide font-light">{t('encrypt.title')}</h1>
        
        <div className="w-full relative mt-8 md:mt-10">
          <div className="absolute inset-0 rounded-3xl bg-[radial-gradient(circle_at_center,rgba(56,218,250,0.12),transparent_68%)] blur-2xl"></div>
          <textarea 
            className="relative w-full bg-white/[0.02] border border-white/10 rounded-3xl focus:ring-0 text-white/90 text-center text-4xl md:text-6xl font-light placeholder:text-white/15 resize-none min-h-[170px] md:min-h-[220px] leading-relaxed tracking-tight font-serif italic px-6 py-10 md:py-12 backdrop-blur-[2px]"
            placeholder={t('encrypt.placeholder')}
            value={text}
            onChange={(e) => setText(e.target.value)}
            spellCheck={false}
          />
          <div className="absolute -bottom-3 left-1/2 -translate-x-1/2 w-56 h-[1px] bg-gradient-to-r from-transparent via-primary/50 to-transparent"></div>
          <div className="absolute -bottom-3 left-1/2 -translate-x-1/2 w-16 h-[3px] bg-primary blur-sm opacity-55"></div>
        </div>

        <div className="mt-10 md:mt-11 flex flex-col items-center gap-4">
          <span className="text-[10px] tracking-[0.28em] text-white/30 uppercase">{t('encrypt.chooseEssence')}</span>
          <div className="cine-pill backdrop-blur-md p-2 rounded-full flex items-center gap-2">
            <button 
              onClick={() => setEssence('aurora')}
              className={`px-7 py-3 rounded-full text-[10px] tracking-widest font-medium transition-all ${essence === 'aurora' ? 'bg-primary/20 text-primary shadow-[0_0_18px_rgba(56,218,250,0.24)]' : 'text-white/45 hover:text-white/75'}`}
            >
              {t('encrypt.aurora')}
            </button>
            <button 
              onClick={() => setEssence('stardust')}
              className={`px-7 py-3 rounded-full text-[10px] tracking-widest font-medium transition-all ${essence === 'stardust' ? 'bg-aurora-purple/20 text-aurora-purple shadow-[0_0_18px_rgba(203,115,252,0.24)]' : 'text-white/45 hover:text-white/75'}`}
            >
              {t('encrypt.stardust')}
            </button>
          </div>
        </div>

        {/* 时间选择器 */}
        <div className="mt-8 w-full max-w-3xl">
          <div className="flex flex-col items-center gap-3">
            <span className="text-[10px] tracking-[0.24em] text-white/30 uppercase flex items-center gap-2">
              <span className="material-symbols-outlined text-sm">schedule</span>
              {t('encrypt.timeLimit')}
            </span>
            <div className="flex flex-wrap gap-2.5 justify-center">
              {[
                { label: t('encrypt.ttl30'), value: 30 },
                { label: t('encrypt.ttl60'), value: 60 },
                { label: t('encrypt.ttl5m'), value: 300 },
                { label: t('encrypt.ttl10m'), value: 600 },
                { label: t('encrypt.ttl30m'), value: 1800 },
                { label: t('encrypt.ttlForever'), value: -1 },
              ].map((option) => (
                <button
                  key={option.value}
                  onClick={() => setTtl(option.value)}
                    className={`px-4 md:px-5 py-2.5 rounded-xl text-xs md:text-sm font-medium transition-all ${
                    ttl === option.value
                      ? option.value === -1
                        ? 'bg-green-500/20 border-2 border-green-500/60 text-green-400 shadow-[0_0_20px_rgba(34,197,94,0.3)]'
                        : 'bg-red-500/20 border-2 border-red-500/60 text-red-400 shadow-[0_0_20px_rgba(239,68,68,0.3)]'
                      : 'bg-white/5 border border-white/10 text-white/50 hover:text-white/80 hover:border-white/30'
                  }`}
                >
                  {option.label}
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className={`mt-5 w-full max-w-3xl rounded-xl px-4 py-3 border text-xs ${
          ttl === -1
            ? 'bg-green-500/10 border-green-500/30 text-green-300'
            : 'bg-red-500/10 border-red-500/30 text-red-300'
        }`}>
          {ttl === -1
            ? t('encrypt.modePermanent')
            : t('encrypt.modeEphemeral')}
        </div>

        <div className="mt-5 w-full max-w-3xl">
          <button
            type="button"
            onClick={() => setShowAdvanced(prev => !prev)}
            className="w-full cine-btn-ghost px-4 py-3 text-xs flex items-center justify-between"
          >
            <span className="flex items-center gap-2">
              <span className="material-symbols-outlined text-sm">tune</span>
              {t('encrypt.advanced')}
            </span>
            <span className="material-symbols-outlined text-sm">{showAdvanced ? 'expand_less' : 'expand_more'}</span>
          </button>
        </div>

        {showAdvanced && (
          <div className="mt-5 w-full max-w-3xl rounded-2xl p-4 cine-panel">
            <div className="flex items-center justify-between gap-4">
              <div>
                <h3 className="text-sm font-bold text-white/90 flex items-center gap-2">
                  <span className="material-symbols-outlined text-base text-primary">lock</span>
                  {t('encrypt.passwordTitle')}
                </h3>
                <p className="text-[11px] text-white/50 mt-1">
                  {t('encrypt.passwordDesc')}
                </p>
              </div>
              <button
                type="button"
                disabled={ttl !== -1}
                onClick={() => {
                  setEnablePassword(prev => !prev);
                  setPasswordError("");
                }}
                className={`px-4 py-2 rounded-lg text-xs font-bold transition-all ${
                  ttl !== -1
                    ? 'bg-white/5 border border-white/10 text-white/30 cursor-not-allowed'
                    : enablePassword
                      ? 'bg-primary/20 border border-primary/40 text-primary'
                      : 'bg-white/5 border border-white/10 text-white/70 hover:text-white'
                }`}
              >
                {enablePassword ? t('encrypt.enabled') : t('encrypt.disabled')}
              </button>
            </div>

            {enablePassword && ttl === -1 && (
              <div className="mt-3 grid grid-cols-1 md:grid-cols-2 gap-2">
                <input
                  type="password"
                  placeholder={t('encrypt.setPassword')}
                  value={password}
                  onChange={(e) => {
                    setPassword(e.target.value);
                    setPasswordError("");
                  }}
                  className="w-full bg-black/20 border border-white/10 rounded-lg px-4 py-3 text-white placeholder:text-white/30 focus:border-primary/40 focus:outline-none transition-all"
                  autoComplete="new-password"
                />
                <input
                  type="password"
                  placeholder={t('encrypt.confirmPassword')}
                  value={confirmPassword}
                  onChange={(e) => {
                    setConfirmPassword(e.target.value);
                    setPasswordError("");
                  }}
                  className="w-full bg-black/20 border border-white/10 rounded-lg px-4 py-3 text-white placeholder:text-white/30 focus:border-primary/40 focus:outline-none transition-all"
                  autoComplete="new-password"
                />
              </div>
            )}

            {passwordError && (
              <p className="mt-3 text-xs text-red-400 flex items-center gap-1">
                <span className="material-symbols-outlined text-sm">error</span>
                {passwordError}
              </p>
            )}
          </div>
        )}

        <div className="mt-8 w-full max-w-md sticky bottom-[calc(var(--cine-safe-bottom)+8px)] z-20">
          <button 
            onClick={handleCrystallize}
            disabled={!text.trim() || isGenerating}
            className="group relative w-full py-4 cine-btn-primary text-sm font-bold tracking-[0.2em] disabled:opacity-30 disabled:pointer-events-none shadow-[0_16px_40px_rgba(56,218,250,0.28)]"
          >
            <span className="relative z-10 flex items-center justify-center gap-3">
              {isGenerating ? (
                <>
                  <span className="animate-spin material-symbols-outlined text-lg">progress_activity</span>
                  {t('encrypt.crystallizing')}
                </>
              ) : (
                <>
                  {t('encrypt.crystallize')}
                  <span className="material-symbols-outlined text-lg">auto_fix_high</span>
                </>
              )}
            </span>
          </button>
        </div>
      </div>
      </div>
      </div>
    </main>
  );
};

export default EncryptView;
