import React from 'react';
import { useSound } from '../contexts/SoundContext';
import { useI18n } from '../contexts/I18nContext';

interface Props {
  compact?: boolean;
}

const SoundToggleButton: React.FC<Props> = ({ compact = false }) => {
  const { soundEnabled, toggleSound } = useSound();
  const { t } = useI18n();
  const label = soundEnabled ? t('sound.onTitle') : t('sound.offTitle');

  return (
    <button
      type="button"
      onClick={toggleSound}
      className={`cine-btn-ghost inline-flex min-h-11 items-center justify-center gap-1.5 rounded-full ${
        compact ? 'min-w-11 px-0' : 'px-3 text-xs'
      }`}
      title={label}
      aria-label={label}
      aria-pressed={soundEnabled}
    >
      <svg
        viewBox="0 0 24 24"
        width="18"
        height="18"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinecap="round"
        strokeLinejoin="round"
        aria-hidden="true"
      >
        <path d="M5 9.5h3L12 6v12l-4-3.5H5z" />
        {soundEnabled ? (
          <>
            <path d="M15 9a4 4 0 0 1 0 6" />
            <path d="M17.5 6.5a7.4 7.4 0 0 1 0 11" />
          </>
        ) : (
          <>
            <path d="m15.5 10 4 4" />
            <path d="m19.5 10-4 4" />
          </>
        )}
      </svg>
      {!compact && <span aria-hidden="true">{soundEnabled ? t('sound.ambient') : t('sound.muted')}</span>}
    </button>
  );
};

export default SoundToggleButton;
