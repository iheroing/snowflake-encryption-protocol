import React from 'react';
import { useSound } from '../contexts/SoundContext';
import { useI18n } from '../contexts/I18nContext';

interface Props {
  compact?: boolean;
}

const SoundToggleButton: React.FC<Props> = ({ compact = false }) => {
  const { soundEnabled, toggleSound } = useSound();
  const { t } = useI18n();

  return (
    <button
      onClick={toggleSound}
      className={`cine-btn-ghost rounded-full flex items-center justify-center gap-1 ${
        compact ? 'size-10' : 'h-10 px-3 text-xs'
      }`}
      title={soundEnabled ? t('sound.onTitle') : t('sound.offTitle')}
    >
      <span className="material-symbols-outlined text-base">
        {soundEnabled ? 'volume_up' : 'volume_off'}
      </span>
      {!compact && (soundEnabled ? t('sound.ambient') : t('sound.muted'))}
    </button>
  );
};

export default SoundToggleButton;
