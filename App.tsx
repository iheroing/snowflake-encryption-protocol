
import React, { useState } from 'react';
import LandingView from './components/LandingView';
import DecryptView from './components/DecryptView';
import GalleryView from './components/GalleryView';
import EncryptView from './components/EncryptView';
import AfterglowView from './components/AfterglowView';

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

  return (
    <div className="relative w-full min-h-screen bg-background-dark select-none">
      {/* Dynamic Background */}
      <div className="fixed inset-0 stardust-bg opacity-30 pointer-events-none z-0"></div>
      
      {currentView === View.LANDING && (
        <LandingView 
          onCrystallize={() => setCurrentView(View.ENCRYPT)} 
          onEnterMuseum={() => setCurrentView(View.GALLERY)} 
        />
      )}

      {currentView === View.ENCRYPT && (
        <EncryptView 
          onCrystallized={(msg, time) => {
            setMessage(msg);
            setTtl(time);
            setCurrentView(View.DECRYPT);
          }}
          onBack={() => setCurrentView(View.LANDING)}
        />
      )}

      {currentView === View.DECRYPT && (
        <DecryptView 
          message={message}
          ttl={ttl}
          onClose={() => setCurrentView(View.LANDING)}
          onExport={() => setCurrentView(View.AFTERGLOW)}
          onOpenGallery={() => setCurrentView(View.GALLERY)}
        />
      )}

      {currentView === View.GALLERY && (
        <GalleryView 
          onExit={() => setCurrentView(View.LANDING)}
          onViewSnowflake={(msg) => {
            setMessage(msg);
            setTtl(60);
            setCurrentView(View.DECRYPT);
          }}
        />
      )}

      {currentView === View.AFTERGLOW && (
        <AfterglowView 
          message={message}
          onBack={() => setCurrentView(View.DECRYPT)}
          onExit={() => setCurrentView(View.LANDING)}
        />
      )}
    </div>
  );
};

export default App;
