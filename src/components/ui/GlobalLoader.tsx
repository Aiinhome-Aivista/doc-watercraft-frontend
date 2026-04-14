import React from 'react';

const GlobalLoader: React.FC = () => {
  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-slate-950/70 backdrop-blur-sm">
      <div className="flex flex-col items-center">
        <div className="relative h-40 w-40 rounded-full bg-[#001a26] p-2 shadow-[0_0_0_4px_#0a0e12,0_20px_50px_rgba(0,0,0,0.8)]">
          <div className="relative h-full w-full overflow-hidden rounded-full border border-cyan-400/20 bg-gradient-to-b from-[#00354d] to-[#00121a]">
            <div className="absolute left-1/2 top-[40%] z-10 -translate-x-1/2 -translate-y-1/2 animate-bounce text-[46px] leading-none text-amber-300 [animation-duration:1.8s]">
              <span className="material-symbols-outlined">directions_boat</span>
            </div>

            <div className="absolute -bottom-8 left-0 h-20 w-full animate-pulse rounded-t-[999px] bg-cyan-500/20" />
            <div className="absolute -bottom-6 left-0 h-16 w-full animate-pulse rounded-t-[999px] bg-cyan-700/35 [animation-delay:200ms]" />
            <div className="absolute -bottom-4 left-0 h-12 w-full animate-pulse rounded-t-[999px] bg-cyan-900/55 [animation-delay:400ms]" />
          </div>
        </div>

        <div className="mt-7 text-center">
          <span className="block text-[13px] font-medium uppercase tracking-[0.2em] text-slate-300 [font-family:'IBM_Plex_Mono',monospace]">
            Synchronizing Fleet Data
          </span>
          <div className="mt-2 flex items-center justify-center gap-2">
            <span className="h-1 w-1 animate-pulse rounded-full bg-cyan-400" />
            <span className="h-1 w-1 animate-pulse rounded-full bg-cyan-400 [animation-delay:200ms]" />
            <span className="h-1 w-1 animate-pulse rounded-full bg-cyan-400 [animation-delay:400ms]" />
          </div>
        </div>
      </div>
    </div>
  );
};

export default GlobalLoader;