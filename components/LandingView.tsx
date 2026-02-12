
import React from 'react';

interface Props {
  onCrystallize: () => void;
  onEnterMuseum: () => void;
}

const LandingView: React.FC<Props> = ({ onCrystallize, onEnterMuseum }) => {
  return (
    <main className="relative z-10 min-h-screen w-full flex flex-col items-center justify-center text-center px-6 py-10 md:py-12">
      {/* Top Header */}
      <div className="absolute top-6 md:top-8 left-1/2 -translate-x-1/2 opacity-30 tracking-[0.3em] text-[10px] font-light uppercase">
        Snowflake Whisper
      </div>

      <div className="mb-7 md:mb-8 space-y-2 opacity-80">
        <span className="text-primary text-xs tracking-widest font-medium uppercase">Ephemeral Message</span>
        <p className="text-xl font-light italic text-glacial/80 font-serif">"心语凝结成雪，随风而逝..."</p>
      </div>

      {/* Hero Interactive Seed */}
      <div onClick={onCrystallize} className="relative group cursor-pointer transition-all duration-700 hover:scale-105">
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

      <div className="mt-10 md:mt-12 space-y-4">
        <h1 className="text-xl md:text-3xl font-bold tracking-wide text-white/90">
          轻触晶核 <br/>
          <span className="text-primary font-display italic">凝结你的心语</span>
        </h1>
        <div className="flex items-center justify-center space-x-4">
          <div className="h-[1px] w-12 bg-gradient-to-r from-transparent to-primary/50"></div>
          <div className="w-2 h-2 rounded-full bg-primary animate-ping"></div>
          <div className="h-[1px] w-12 bg-gradient-to-l from-transparent to-primary/50"></div>
        </div>
      </div>

      {/* Floating Side Action */}
      <div className="fixed left-6 bottom-6 flex flex-col gap-4 opacity-40 hover:opacity-100 transition-opacity">
        <div className="w-px h-16 bg-gradient-to-t from-primary to-transparent mx-auto"></div>
        <button onClick={onEnterMuseum} className="rotate-[-90deg] origin-center text-[10px] tracking-widest hover:text-primary transition-colors uppercase">
          The Museum
        </button>
      </div>
    </main>
  );
};

export default LandingView;
