
import React, { useState } from 'react';

interface GalleryModalProps {
  isOpen: boolean;
  images: string[];
  onClose: () => void;
  title: string;
}

const GalleryModal: React.FC<GalleryModalProps> = ({ isOpen, images, onClose, title }) => {
  const [currentIndex, setCurrentIndex] = useState(0);

  if (!isOpen) return null;

  const handleNext = (e: React.MouseEvent) => {
    e.stopPropagation();
    setCurrentIndex((prev) => (prev + 1) % images.length);
  };

  const handlePrev = (e: React.MouseEvent) => {
    e.stopPropagation();
    setCurrentIndex((prev) => (prev - 1 + images.length) % images.length);
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      {/* Frosted Glass Backdrop */}
      <div 
        className="absolute inset-0 bg-gray-900/80 backdrop-blur-md transition-opacity" 
        onClick={onClose}
      ></div>

      {/* Main Content */}
      <div className="relative w-full max-w-5xl h-[80vh] flex flex-col items-center justify-center animate-fade-in">
        
        {/* Close Button */}
        <button 
            onClick={onClose}
            className="absolute top-0 right-0 md:-top-10 md:-right-10 bg-white/10 hover:bg-white/20 text-white p-3 rounded-full backdrop-blur-md transition-all z-20"
        >
            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
        </button>

        {/* Image Container */}
        <div className="relative w-full h-full rounded-3xl overflow-hidden shadow-2xl bg-black/40 border border-white/10 backdrop-blur-sm">
            {images.length > 0 ? (
                <>
                    <img 
                        src={images[currentIndex]} 
                        alt={`${title} - view ${currentIndex + 1}`} 
                        className="w-full h-full object-contain"
                    />
                    
                    {/* Caption */}
                    <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/90 to-transparent p-6 text-white text-center">
                        <h3 className="text-xl font-bold uppercase italic">{title}</h3>
                        <p className="text-sm opacity-70">Photo {currentIndex + 1} of {images.length}</p>
                    </div>

                    {/* Navigation Buttons */}
                    {images.length > 1 && (
                        <>
                            <button 
                                onClick={handlePrev}
                                className="absolute left-4 top-1/2 -translate-y-1/2 bg-black/30 hover:bg-black/50 text-white p-4 rounded-full backdrop-blur-md transition-all border border-white/10 group"
                            >
                                <svg className="w-6 h-6 group-hover:-translate-x-1 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                                </svg>
                            </button>
                            <button 
                                onClick={handleNext}
                                className="absolute right-4 top-1/2 -translate-y-1/2 bg-black/30 hover:bg-black/50 text-white p-4 rounded-full backdrop-blur-md transition-all border border-white/10 group"
                            >
                                <svg className="w-6 h-6 group-hover:translate-x-1 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                                </svg>
                            </button>
                        </>
                    )}
                </>
            ) : (
                <div className="flex items-center justify-center h-full text-white/50">
                    No images available
                </div>
            )}
        </div>

        {/* Thumbnails */}
        {images.length > 1 && (
             <div className="mt-6 flex gap-3 overflow-x-auto max-w-full pb-2 px-4 scrollbar-hide">
                {images.map((img, idx) => (
                    <button 
                        key={idx}
                        onClick={(e) => { e.stopPropagation(); setCurrentIndex(idx); }}
                        className={`relative w-16 h-16 rounded-xl overflow-hidden flex-shrink-0 border-2 transition-all ${idx === currentIndex ? 'border-red-600 scale-110 shadow-lg' : 'border-transparent opacity-60 hover:opacity-100'}`}
                    >
                        <img src={img} alt="thumb" className="w-full h-full object-cover" />
                    </button>
                ))}
            </div>
        )}
      </div>
    </div>
  );
};

export default GalleryModal;
