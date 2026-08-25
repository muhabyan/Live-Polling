import React from 'react';

export const GlobalAppSkeleton: React.FC = () => {
  return (
    <div className="min-h-screen bg-[#FFF8F0] p-6 sm:p-8 flex flex-col">
      {/* Header Skeleton */}
      <div className="w-full max-w-7xl mx-auto flex items-center justify-between mb-8 animate-pulse">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 bg-[#4F46E5]/20 border-2 border-[#1E1E1E] rounded-lg"></div>
          <div className="w-32 h-6 bg-gray-200 border-2 border-[#1E1E1E] rounded-md hidden sm:block"></div>
        </div>
        <div className="flex items-center space-x-2">
          <div className="w-24 h-9 bg-white border-2 border-[#1E1E1E] rounded-lg shadow-[2px_2px_0px_#1E1E1E]"></div>
          <div className="w-24 h-9 bg-white border-2 border-[#1E1E1E] rounded-lg shadow-[2px_2px_0px_#1E1E1E]"></div>
          <div className="w-24 h-9 bg-white border-2 border-[#1E1E1E] rounded-lg shadow-[2px_2px_0px_#1E1E1E]"></div>
        </div>
      </div>

      {/* Main Content Area Skeleton */}
      <div className="flex-1 w-full max-w-6xl mx-auto flex flex-col lg:flex-row gap-6 animate-pulse">
        {/* Left main block */}
        <div className="flex-[2] space-y-6">
          <div className="w-full h-32 md:h-48 neo-card"></div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
            <div className="h-32 sm:h-48 neo-card"></div>
            <div className="h-32 sm:h-48 neo-card"></div>
          </div>
          <div className="w-full h-64 neo-card"></div>
        </div>
        
        {/* Right sidebar block */}
        <div className="flex-1 neo-card min-h-[400px] flex flex-col p-6 space-y-4">
          <div className="w-1/2 h-6 bg-gray-200 border-2 border-[#1E1E1E] rounded-md"></div>
          <div className="w-full h-12 bg-white border-2 border-[#1E1E1E] rounded-lg"></div>
          <div className="w-full h-12 bg-white border-2 border-[#1E1E1E] rounded-lg"></div>
          <div className="w-full h-12 bg-white border-2 border-[#1E1E1E] rounded-lg"></div>
          <div className="w-full h-12 bg-white border-2 border-[#1E1E1E] rounded-lg"></div>
        </div>
      </div>
    </div>
  );
};

export const ButtonSpinner: React.FC<{ color?: string; size?: string }> = ({ color = 'text-white', size = 'w-4 h-4' }) => (
  <svg className={`${size} ${color} animate-spin`} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3"></circle>
    <path className="opacity-90" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
  </svg>
);

export const AiGeneratingSpinner: React.FC<{ color?: string; size?: string }> = ({ color = 'text-violet-500', size = 'w-5 h-5' }) => (
  <svg className={`${size} ${color} animate-spin`} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M12 2V6M12 18V22M6 12H2M22 12H18M19.0711 19.0711L16.2426 16.2426M19.0711 4.92893L16.2426 7.75736M4.92893 4.92893L7.75736 7.75736M4.92893 19.0711L7.75736 16.2426" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
    <circle cx="12" cy="12" r="4" fill="currentColor" className="animate-pulse" />
  </svg>
);
