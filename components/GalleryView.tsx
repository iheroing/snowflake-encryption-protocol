
import React from 'react';

interface Props {
  onExit: () => void;
}

const GalleryView: React.FC<Props> = ({ onExit }) => {
  const items = [
    { title: "一个保守了七个冬天的秘密，现在终于融化了。", author: "匿名-921", tag: "七个冬天前" },
    { title: "初雪的记忆。我们很冷，但我们的手很温暖。", author: "奥斯陆档案", tag: "初雪" },
    { title: "霜冻中的午夜。我仍能在风中听到你的名字。", author: "深蓝", tag: "午夜" },
    { title: "被遗忘誓言的回声。我会在冰与海相遇的地方等待。", author: "量子保险箱", tag: "遗忘的誓言" },
    { title: "结晶的沉默是我们对话留下的全部。", author: "霜之守护者", tag: "沉默" }
  ];

  return (
    <div className="relative z-10 h-full w-full overflow-y-auto bg-background-dark/80 backdrop-blur-sm scroll-smooth pb-32">
      <header className="sticky top-0 z-50 flex items-center justify-between px-12 py-8 bg-background-dark/90 backdrop-blur-md border-b border-primary/10">
        <div className="flex items-center gap-3">
          <span className="material-symbols-outlined text-primary text-3xl">ac_unit</span>
          <h2 className="font-display text-xl font-bold tracking-wide">雪花博物馆</h2>
        </div>
        <button onClick={onExit} className="bg-primary text-background-dark px-8 py-3 rounded-full font-bold text-sm tracking-tight hover:brightness-110 transition-all">
          退出
        </button>
      </header>

      <main className="max-w-7xl mx-auto px-12 pt-16">
        <section className="text-center mb-20">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-primary/20 bg-primary/5 text-primary text-[10px] font-bold tracking-wide mb-8 animate-pulse uppercase">
            Live Afterglow Stream
          </div>
          <h1 className="font-display text-6xl md:text-8xl font-black mb-8 tracking-tighter leading-tight italic">
            消逝低语 <br/><span className="text-primary not-italic">博物馆</span>
          </h1>
          <p className="max-w-2xl mx-auto text-lg text-white/50 font-light leading-relaxed">
            一个宇宙级的秘密档案馆。滑过无尽的冰晶大教堂，见证成千上万匿名信息的冰封回声。
          </p>
        </section>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {items.map((item, idx) => (
            <div key={idx} className="group relative aspect-[4/5] rounded-3xl p-8 border border-white/10 bg-white/5 backdrop-blur-xl overflow-hidden transition-all duration-500 hover:border-primary/40 hover:-translate-y-2">
              <div className="absolute inset-0 bg-primary/5 group-hover:bg-primary/10 transition-colors"></div>
              <div className="absolute inset-0 opacity-10 group-hover:opacity-20 transition-opacity bg-[url('https://lh3.googleusercontent.com/aida-public/AB6AXuAIG-Sq06Clgms_GqgoXsrL7ihFDigHPsLQ4y7lE-8KJoEyaVjKNfn7I4S05d0AqG8n-SEMJvAkO-voSKKMEMaJH1qCML70wqZYNxYlno2SxVpurDo5zctnwsYzMh4yNan3lNkmjwv7elrD3_Q3Fm83AyhNpo16cNCMKtu4Csx-lwL61ky2oJqPa2rked4_yiw7cjmHT3JOGQQy7eDIpeMJRkQmBnxMp4b3WbfRHhLcsb3nYmWLx6ribi2aP5-bkOaGV6cCzVgYwx0')] bg-cover bg-center"></div>
              
              <div className="relative z-10 h-full flex flex-col justify-between">
                <div className="flex justify-between items-start">
                  <span className="px-3 py-1 rounded-full bg-white/5 border border-white/10 text-[10px] tracking-widest">{item.tag}</span>
                  <span className="material-symbols-outlined text-primary/40 group-hover:text-primary transition-colors">favorite</span>
                </div>
                <div>
                  <h4 className="font-serif text-2xl mb-4 italic leading-snug text-white/90">{item.title}</h4>
                  <div className="flex items-center gap-2 text-white/30 text-xs tracking-widest uppercase">
                    <span className="material-symbols-outlined text-sm">person</span>
                    {item.author}
                  </div>
                </div>
              </div>
            </div>
          ))}

          {/* Special CTA Card */}
          <div className="group relative aspect-[4/5] rounded-3xl p-8 border border-dashed border-primary/30 flex flex-col items-center justify-center text-center gap-6 hover:bg-primary/5 transition-all">
             <div className="size-20 rounded-full border border-primary/40 bg-primary/10 flex items-center justify-center text-primary animate-pulse">
                <span className="material-symbols-outlined text-4xl">add</span>
             </div>
             <h4 className="font-display text-2xl">添加你的低语</h4>
             <p className="text-sm text-white/40 leading-relaxed px-4">为无限画廊做出贡献。你的信息将被编码成独特的3D雪花。</p>
             <button onClick={onExit} className="px-8 py-3 bg-white/5 border border-white/10 rounded-full text-xs font-bold tracking-widest hover:bg-white/10">立即编码</button>
          </div>
        </div>
      </main>

      {/* Floating HUD */}
      <div className="fixed bottom-10 left-1/2 -translate-x-1/2 z-50 flex items-center gap-4 bg-background-dark/60 backdrop-blur-xl border border-white/10 p-2 rounded-2xl">
        <div className="flex gap-1 border-r border-white/10 pr-2">
          <button className="p-3 hover:text-primary transition-colors rounded-xl"><span className="material-symbols-outlined text-[20px]">orbit</span></button>
          <button className="p-3 hover:text-primary transition-colors rounded-xl"><span className="material-symbols-outlined text-[20px]">near_me</span></button>
          <button className="p-3 hover:text-primary transition-colors rounded-xl"><span className="material-symbols-outlined text-[20px]">zoom_in</span></button>
        </div>
        <button onClick={onExit} className="bg-primary text-background-dark font-bold py-3 px-8 rounded-xl flex items-center gap-2 hover:brightness-110 active:scale-95 transition-all">
          <span className="material-symbols-outlined text-[20px]">add_comment</span>
          创建雪花
        </button>
      </div>
    </div>
  );
};

export default GalleryView;
