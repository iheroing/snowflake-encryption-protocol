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
      className={`sound-orb${compact ? ' is-compact' : ''}`}
      title={label}
      aria-label={label}
      aria-pressed={soundEnabled}
    >
      <svg
        viewBox="0 0 24 24"
        width="17"
        height="17"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
        aria-hidden="true"
      >
        <path d="M5.5 9.6h2.8L12 6.4v11.2l-3.7-3.2H5.5z" />
        {soundEnabled ? (
          <g className="sound-orb-waves">
            <path d="M15 9.4a3.7 3.7 0 0 1 0 5.2" />
            <path d="M17.4 7.2a6.9 6.9 0 0 1 0 9.6" />
          </g>
        ) : (
          <path d="M15.4 10.2 19 13.8m0-3.6-3.6 3.6" />
        )}
      </svg>
      {!compact && <span aria-hidden="true">{soundEnabled ? t('sound.ambient') : t('sound.muted')}</span>}
    </button>
  );
};

export default SoundToggleButton;
