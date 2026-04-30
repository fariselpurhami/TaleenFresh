// src/app/loading.tsx
// تم إزالة استيراد React غير الضروري

const SKELETON_ITEMS_COUNT = 8; // عدم استخدام Magic Numbers

export default function Loading() {
  return (
    <div className="w-full min-h-[70vh] p-4 md:p-6 lg:p-8 flex flex-col gap-6 animate-in fade-in duration-500">
      
      {/* هيدر وهمي */}
      <div className="flex justify-between items-center mb-4">
        <div className="h-8 w-32 bg-neutral-200/60 dark:bg-neutral-800/60 rounded-lg animate-pulse" />
        <div className="h-10 w-10 bg-neutral-200/60 dark:bg-neutral-800/60 rounded-full animate-pulse" />
      </div>

      {/* مساحة إعلانية وهمية */}
      <div className="h-40 md:h-64 w-full bg-neutral-200/60 dark:bg-neutral-800/60 rounded-2xl animate-pulse mb-2" />

      {/* شبكة المنتجات الوهمية */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
        {Array.from({ length: SKELETON_ITEMS_COUNT }).map((_, i) => (
          <div 
            key={i} 
            className="flex flex-col gap-3 p-3 border border-neutral-100 dark:border-neutral-800 rounded-2xl shadow-sm bg-white dark:bg-neutral-900"
          >
            <div className="h-32 md:h-40 w-full bg-neutral-200/60 dark:bg-neutral-800/60 rounded-xl animate-pulse" />
            <div className="h-4 w-3/4 bg-neutral-200/60 dark:bg-neutral-800/60 rounded-md animate-pulse mt-2" />
            <div className="h-4 w-1/3 bg-neutral-200/60 dark:bg-neutral-800/60 rounded-md animate-pulse" />
            <div className="h-10 w-full bg-neutral-200/60 dark:bg-neutral-800/60 rounded-lg animate-pulse mt-3" />
          </div>
        ))}
      </div>
    </div>
  );
}
