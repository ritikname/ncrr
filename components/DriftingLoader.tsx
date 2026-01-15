
import React from 'react';

const DriftingLoader: React.FC = () => {
  return (
    <div className="fixed inset-0 z-[100] bg-black flex flex-col items-center justify-center overflow-hidden">
      
      {/* Background Speed Lines */}
      <div className="absolute inset-0 opacity-20">
        <div className="w-full h-2 bg-white absolute top-1/4 animate-[speedLines_0.5s_linear_infinite]" style={{width: '20%'}}></div>
        <div className="w-full h-1 bg-white absolute top-2/3 animate-[speedLines_0.7s_linear_infinite_0.2s]" style={{width: '40%'}}></div>
        <div className="w-full h-3 bg-white absolute top-1/2 animate-[speedLines_0.3s_linear_infinite_0.1s]" style={{width: '15%'}}></div>
      </div>

      <div className="relative w-full h-64 flex items-center">
        
        {/* Skid Marks Container */}
        <div className="absolute top-1/2 left-0 w-full h-20 -translate-y-1/2">
             <div className="absolute top-8 h-2 bg-gray-800 rounded skid-mark skew-x-12 origin-left"></div>
             <div className="absolute top-12 h-2 bg-gray-800 rounded skid-mark skew-x-12 origin-left" style={{animationDelay: '0.05s'}}></div>
        </div>

        {/* The Car SVG - Red Body */}
        <div className="drift-car w-32 md:w-48 absolute left-0 z-10 filter drop-shadow-2xl">
          <svg viewBox="0 0 200 100" fill="none" xmlns="http://www.w3.org/2000/svg">
            {/* Body */}
            <path d="M10 55 L30 35 L70 30 L120 32 L160 45 L190 50 L190 75 L170 80 L30 80 L10 70 Z" fill="#DC2626" stroke="#991B1B" strokeWidth="2"/>
            {/* Windows */}
            <path d="M35 38 L65 35 L110 36 L110 50 L30 52 Z" fill="#111827"/>
            <path d="M115 36 L150 46 L155 50 L115 50 Z" fill="#111827"/>
            {/* Wheels */}
            <circle cx="45" cy="80" r="14" fill="#1F2937" stroke="#4B5563" strokeWidth="2"/>
            <circle cx="45" cy="80" r="5" fill="#9CA3AF"/>
            <circle cx="160" cy="80" r="14" fill="#1F2937" stroke="#4B5563" strokeWidth="2"/>
            <circle cx="160" cy="80" r="5" fill="#9CA3AF"/>
            {/* Spoiler */}
            <path d="M10 55 L0 40 L10 42 Z" fill="#991B1B"/>
            {/* Speed Streak */}
            <path d="M190 60 L240 60" stroke="white" strokeWidth="2" strokeDasharray="10 5" opacity="0.5"/>
          </svg>
          
          {/* Smoke Particles */}
          <div className="absolute -left-4 bottom-0 w-4 h-4 bg-gray-400 rounded-full animate-ping opacity-50"></div>
          <div className="absolute -left-8 bottom-2 w-6 h-6 bg-gray-300 rounded-full animate-ping opacity-30 delay-75"></div>
        </div>
      </div>

      <div className="mt-8 text-center z-10">
        <h2 className="text-3xl font-black text-white tracking-tighter uppercase italic">
          NCR <span className="text-red-600">DRIVE</span>
        </h2>
        <p className="text-gray-400 text-sm mt-2 font-medium animate-pulse">Igniting Engine...</p>
      </div>
    </div>
  );
};

export default DriftingLoader;
