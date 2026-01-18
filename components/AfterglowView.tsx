
import React, { useState, useMemo, useRef } from 'react';
import { generateSnowflakeDataURL } from '../utils/snowflakeGenerator';

interface Props {
  onBack: () => void;
  onExit: () => void;
  message?: string;
}

const AfterglowView: React.FC<Props> = ({ onBack, onExit, message = "A whisper from the void" }) => {
  const [selectedCanvas, setSelectedCanvas] = useState('postcard');
  const canvasRef = useRef<HTMLDivElement>(null);
  
  const snowflakeURL = useMemo(() => generateSnowflakeDataURL(message, 1200), [message]);
  
  const handleExport = async () => {
    if (!canvasRef.current) return;
    
    try {
      // 使用html2canvas或直接下载SVG
      const link = document.createElement('a');
      link.download = `snowflake-${Date.now()}.svg`;
      link.href = snowflakeURL;
      link.click();
    } catch (error) {
      console.error('Export failed:', error);
    }
  };

  return (
    <div className="relative z-10 h-full w-full flex flex-col overflow-hidden bg-background-dark">
      {/* Background Decor */}
      <div className="absolute top-1/2 left-1/3 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-primary rounded-full blur-[120px] opacity-10"></div>
      
      <header className="relative z-50 flex items-center justify-between px-12 py-8 border-b border-white/5">
        <div className="flex items-center gap-6">
          <button onClick={onBack} className="flex items-center gap-2 text-primary hover:text-white transition-colors">
            <span className="material-symbols-outlined">arrow_back</span>
            <span className="text-xs font-bold tracking-widest uppercase">Return</span>
          </button>
          <div className="h-4 w-px bg-white/10"></div>
          <div className="flex items-center gap-3">
            <span className="material-symbols-outlined text-primary">ac_unit</span>
            <h2 className="font-serif italic text-lg tracking-tight">雪花加密</h2>
          </div>
        </div>
        <button onClick={onExit} className="size-10 rounded-full border border-white/10 flex items-center justify-center hover:bg-white/20 transition-all">
           <span className="material-symbols-outlined">close</span>
        </button>
      </header>

      <main className="relative flex-1 flex px-12 pb-12 gap-12 overflow-hidden items-center justify-center">
        {/* Preview Container */}
        <div className="flex-1 flex flex-col items-center justify-center">
           <div ref={canvasRef} className="relative w-full max-w-2xl aspect-[1.6/1] bg-white/5 border border-white/10 rounded-2xl flex items-center justify-center p-12 crystal-glow">
              <div className="absolute inset-0 stardust-bg opacity-10"></div>
              <div className="relative z-10 w-full h-full flex flex-col items-center justify-center gap-8">
                 <img 
                    src={snowflakeURL}
                    className="w-48 h-48 md:w-64 md:h-64 object-contain drop-shadow-[0_0_40px_rgba(56,218,250,0.5)] animate-[spin_20s_linear_infinite]"
                    alt="Afterglow Fractal"
                 />
                 <div className="text-center">
                    <p className="font-serif text-3xl italic text-glacial font-light">"{message}"</p>
                    <p className="text-[10px] tracking-[0.4em] uppercase text-white/30 mt-4">
                      Captured at {new Date().toLocaleTimeString()} • {new Date().toLocaleDateString()}
                    </p>
                 </div>
              </div>
           </div>
        </div>

        {/* Sidebar Controls */}
        <aside className="w-[420px] h-full bg-white/5 backdrop-blur-xl border border-white/10 rounded-3xl p-8 flex flex-col gap-10">
          <div>
            <h1 className="font-serif text-3xl font-bold mb-3">余晖</h1>
            <p className="text-white/40 text-sm leading-relaxed">保存易逝之美。将你的加密秘密转化为永久的数字艺术品。</p>
          </div>

          <div className="space-y-4">
            <h3 className="text-[10px] font-bold tracking-widest text-white/40 uppercase">Canvas Selection</h3>
            <div className="flex flex-col gap-3">
              {[
                { id: 'postcard', label: '极简明信片', icon: 'drafts' },
                { id: 'desktop', label: '桌面壁纸', icon: 'desktop_windows' },
                { id: 'mobile', label: '手机锁屏', icon: 'smartphone' }
              ].map(opt => (
                <div 
                  key={opt.id}
                  onClick={() => setSelectedCanvas(opt.id)}
                  className={`flex items-center gap-4 p-4 rounded-xl border transition-all cursor-pointer ${selectedCanvas === opt.id ? 'bg-primary/20 border-primary shadow-[0_0_15px_rgba(56,218,250,0.2)]' : 'bg-white/5 border-white/10 hover:bg-white/10'}`}
                >
                  <span className="material-symbols-outlined opacity-60">{opt.icon}</span>
                  <span className="text-sm font-medium">{opt.label}</span>
                  {selectedCanvas === opt.id && <span className="material-symbols-outlined ml-auto text-primary text-sm">check_circle</span>}
                </div>
              ))}
            </div>
          </div>

          <div className="mt-auto space-y-6">
             <button onClick={handleExport} className="w-full bg-primary text-background-dark font-bold py-5 rounded-2xl flex items-center justify-center gap-3 hover:brightness-110 active:scale-[0.98] transition-all shadow-lg shadow-primary/20">
                <span className="material-symbols-outlined">download</span>
                导出艺术品
             </button>
             <p className="text-[10px] text-center text-white/30 tracking-widest uppercase">High-Resolution SVG</p>
          </div>
        </aside>
      </main>

      <footer className="px-12 py-6 border-t border-white/5 bg-background-dark/80 flex items-center justify-between">
         <div className="flex items-center gap-2">
            <span className="size-1.5 bg-primary rounded-full animate-pulse"></span>
            <span className="text-[10px] font-bold text-white/40 tracking-widest uppercase">Fractal Engine Online</span>
         </div>
         <div className="flex gap-8 text-[10px] text-white/30 tracking-widest">
            <span>Render: 4096 x 2304</span>
            <span>Complexity: 8.4M poly</span>
         </div>
      </footer>
    </div>
  );
};

export default AfterglowView;
