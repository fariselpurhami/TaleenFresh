// src/app/(customer)/loading.tsx

import React from 'react';

const CONFIG = {
  SKELETON_ITEMS_COUNT: 4, 
} as const;

const PulseElement = ({ className = "" }: { className?: string }) => (
  <div 
    className={`bg-neutral-200/60 dark:bg-neutral-800/60 animate-pulse ${className}`} 
    aria-hidden="true"
  />
);

export default function Loading() {
  return (
    
    <div dir="rtl" className="relative min-h-[100dvh] bg-transparent pb-24 overflow-hidden">

      <header className="flex items-center justify-between px-6 pt-0 pb-4">
        <div className="flex items-center gap-3">
          <div className="relative w-12 h-12 rounded-full overflow-hidden border-2 border-white shadow-md bg-white flex items-center justify-center">
            <PulseElement className="w-full h-full rounded-full" />
          </div>
         
          <div>
            <PulseElement className="h-4 w-20 rounded-md mb-1" />
            <PulseElement className="h-3 w-32 rounded-md" />
          </div>
        </div>
      </header>

      <div className="px-6 py-2 mb-4 flex flex-col items-end">
        <PulseElement className="h-8 w-64 rounded-lg mb-2" />
        <PulseElement className="h-8 w-48 rounded-lg mb-4" />
        <PulseElement className="h-6 w-full max-w-[320px] rounded-lg" />
      </div>

      <div className="px-6 mt-2 mb-6 relative z-10">
        <div className="w-full rounded-2xl bg-white px-4 py-4 shadow-[0_8px_30px_rgb(0,0,0,0.06)] h-[56px] flex items-center">
           <PulseElement className="w-full h-5 rounded-md" />
        </div>
      </div>

      <div className="mb-8">
        <div className="flex items-center justify-between px-6 mb-4">
          <PulseElement className="h-6 w-16 rounded-md" />
        </div>
        <div className="flex justify-center gap-10 pb-2 pt-1">
          {[1, 2, 3].map((i) => (
            <div key={i} className="flex flex-col items-center gap-2 flex-shrink-0">
              <PulseElement className="h-16 w-16 rounded-full border-2 border-white shadow-sm" />
              <PulseElement className="h-3 w-10 rounded-md" />
            </div>
          ))}
        </div>
      </div>

      <div className="px-6 mb-8">
        <div className="flex items-center justify-between mb-4">
          <PulseElement className="h-6 w-28 rounded-md" />
          <PulseElement className="h-6 w-16 rounded-md" />
        </div>

        <div className="grid grid-cols-2 gap-4">
          {Array.from({ length: CONFIG.SKELETON_ITEMS_COUNT }).map((_, index) => (
            <div 
              key={index}
              className="relative flex flex-col justify-between overflow-hidden rounded-[1.5rem] bg-white p-3.5 shadow-[0_8px_30px_rgb(0,0,0,0.06)] border border-gray-100/50 h-[280px]"
            >
       
              <PulseElement className="absolute top-0 left-0 h-6 w-16 rounded-br-[1.2rem] rounded-tl-[1.5rem] z-10" />
              
              <PulseElement className="relative h-36 w-full mb-3 mt-4 rounded-xl" />
              
              <div className="flex flex-col gap-2 mt-auto w-full items-end">
                <PulseElement className="h-4 w-3/4 rounded-md" />
                <PulseElement className="h-5 w-1/2 rounded-md mb-1" />
                
                <PulseElement className="h-10 w-full rounded-xl" />
              </div>
            </div>
          ))}
        </div>
      </div>

    </div>
  );
}
