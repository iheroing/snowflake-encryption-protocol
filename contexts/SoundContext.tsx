import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { soundManager, type SoundCue, type SoundScene } from '../utils/sound';

interface SoundContextValue {
  soundEnabled: boolean;
  toggleSound: () => void;
  play: (cue: SoundCue) => void;
  setScene: (scene: SoundScene) => void;
}

const SoundContext = createContext<SoundContextValue | null>(null);

export const SoundProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [soundEnabled, setSoundEnabled] = useState<boolean>(() => soundManager.getEnabled());

  useEffect(() => soundManager.subscribe(setSoundEnabled), []);

  useEffect(() => {
    soundManager.prime();
  }, []);

  useEffect(() => {
    const unlock = () => {
      void soundManager.unlock();
    };

    window.addEventListener('pointerdown', unlock);
    window.addEventListener('keydown', unlock);
    return () => {
      window.removeEventListener('pointerdown', unlock);
      window.removeEventListener('keydown', unlock);
    };
  }, []);

  useEffect(() => {
    const handleTap = (event: PointerEvent) => {
      if (!soundManager.getEnabled()) {
        return;
      }
      const target = event.target as HTMLElement | null;
      if (!target) {
        return;
      }
      if (!target.closest('button, [role="button"], a, [data-audio-tap="true"]')) {
        return;
      }
      void soundManager.playCue('tap');
    };

    document.addEventListener('pointerdown', handleTap, true);
    return () => document.removeEventListener('pointerdown', handleTap, true);
  }, []);

  const toggleSound = useCallback(() => {
    soundManager.setEnabled(!soundEnabled);
  }, [soundEnabled]);

  const play = useCallback((cue: SoundCue) => {
    void soundManager.playCue(cue);
  }, []);

  const setScene = useCallback((scene: SoundScene) => {
    void soundManager.setScene(scene);
  }, []);

  const value = useMemo(
    () => ({ soundEnabled, toggleSound, play, setScene }),
    [play, setScene, soundEnabled, toggleSound]
  );

  return <SoundContext.Provider value={value}>{children}</SoundContext.Provider>;
};

export const useSound = (): SoundContextValue => {
  const ctx = useContext(SoundContext);
  if (!ctx) {
    throw new Error('useSound must be used within SoundProvider');
  }
  return ctx;
};
