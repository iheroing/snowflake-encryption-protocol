import React, { useEffect, useRef, useState } from 'react';
import LandingView from './components/LandingView';
import DecryptView from './components/DecryptView';
import GalleryView from './components/GalleryView';
import EncryptView from './components/EncryptView';
import AfterglowView from './components/AfterglowView';
import { createSnowflakeSignature, parseShareUrl, removeShareParamFromUrl } from './utils/share';
import { useSound } from './contexts/SoundContext';
import type { SoundScene } from './utils/sound';
import { useI18n } from './contexts/I18nContext';

enum View {
  LANDING = 'landing',
  DECRYPT = 'decrypt',
  GALLERY = 'gallery',
  ENCRYPT = 'encrypt',
  AFTERGLOW = 'afterglow'
}

const App: React.FC = () => {
  const [currentView, setCurrentView] = useState<View>(View.LANDING);
  const [message, setMessage] = useState<string>("");
  const [ttl, setTtl] = useState<number>(60); // 时间限制
  const [signature, setSignature] = useState<string>(createSnowflakeSignature());
  const [decryptSource, setDecryptSource] = useState<'local' | 'shared'>('local');
  const { setScene, play } = useSound();
  const { t, localeTag } = useI18n();
  const hasMountedRef = useRef(false);

  useEffect(() => {
    const sharedPayload = parseShareUrl();
    if (!sharedPayload) {
      return;
    }

    setMessage(sharedPayload.message);
    setTtl(-1);
    setSignature(sharedPayload.signature);
    setDecryptSource('shared');
    setCurrentView(View.DECRYPT);

    const cleanedUrl = removeShareParamFromUrl();
    window.history.replaceState({}, '', cleanedUrl);
  }, []);

  useEffect(() => {
    const sceneMap: Record<View, SoundScene> = {
      [View.LANDING]: 'landing',
      [View.ENCRYPT]: 'encrypt',
      [View.DECRYPT]: 'decrypt',
      [View.GALLERY]: 'gallery',
      [View.AFTERGLOW]: 'afterglow'
    };
    setScene(sceneMap[currentView]);

    if (!hasMountedRef.current) {
      hasMountedRef.current = true;
      return;
    }
    play('switch');
  }, [currentView, play, setScene]);

  useEffect(() => {
    document.title = `${t('common.appName')} | ${t('common.appSubtitle')}`;
    document.documentElement.lang = localeTag;
  }, [localeTag, t]);

  return (
    <div className="relative w-full min-h-[100svh] bg-background-dark select-none">
      {/* Dynamic Background */}
      <div className="fixed inset-0 stardust-bg opacity-30 pointer-events-none z-0"></div>
      <div className="fixed -top-24 -left-24 w-[520px] h-[520px] bg-primary/10 blur-[140px] rounded-full pointer-events-none z-0"></div>
      <div className="fixed -bottom-24 -right-24 w-[560px] h-[560px] bg-aurora-purple/10 blur-[160px] rounded-full pointer-events-none z-0"></div>
      
      {currentView === View.LANDING && (
        <LandingView 
          onCrystallize={() => setCurrentView(View.ENCRYPT)} 
          onEnterMuseum={() => setCurrentView(View.GALLERY)} 
        />
      )}

      {currentView === View.ENCRYPT && (
        <EncryptView 
          onCrystallized={({ message: nextMessage, ttl: nextTtl, signature: nextSignature }) => {
            setMessage(nextMessage);
            setTtl(nextTtl);
            setSignature(nextSignature);
            setDecryptSource('local');
            setCurrentView(View.DECRYPT);
          }}
          onBack={() => setCurrentView(View.LANDING)}
        />
      )}

      {currentView === View.DECRYPT && (
        <DecryptView 
          message={message}
          signature={signature}
          ttl={ttl}
          onClose={() => setCurrentView(View.LANDING)}
          onExport={() => setCurrentView(View.AFTERGLOW)}
          onOpenGallery={() => setCurrentView(View.GALLERY)}
          source={decryptSource}
        />
      )}

      {currentView === View.GALLERY && (
        <GalleryView 
          onExit={() => setCurrentView(View.LANDING)}
          onViewSnowflake={({ message: nextMessage, signature: nextSignature }) => {
            setMessage(nextMessage);
            setTtl(60);
            setSignature(nextSignature);
            setDecryptSource('local');
            setCurrentView(View.DECRYPT);
          }}
        />
      )}

      {currentView === View.AFTERGLOW && (
        <AfterglowView 
          message={message}
          signature={signature}
          onBack={() => setCurrentView(View.DECRYPT)}
          onExit={() => setCurrentView(View.LANDING)}
        />
      )}
    </div>
  );
};

export default App;
