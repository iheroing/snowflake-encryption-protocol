import React from 'react';
import { useSound } from '../contexts/SoundContext';

interface Props {
  compact?: boolean;
}

const SoundToggleButton: React.FC<Props> = ({ compact = false }) => {
  const { soundEnabled, toggleSound } = useSound();

  return (
    <button
      onClick={toggleSound}
      className={`cine-btn-ghost rounded-full flex items-center justify-center gap-1 ${
        compact ? 'size-10' : 'h-10 px-3 text-xs'
      }`}
      title={soundEnabled ? '关闭环境音' : '开启环境音'}
    >
      <span className="material-symbols-outlined text-base">
        {soundEnabled ? 'volume_up' : 'volume_off'}
      </span>
      {!compact && (soundEnabled ? 'Ambient' : 'Muted')}
    </button>
  );
};

export default SoundToggleButton;
