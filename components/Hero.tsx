
import React, { useState, useEffect } from 'react';
import { HeroSlide } from '../types';

interface HeroProps {
  onBrowseFleet: () => void;
  onShowHowItWorks: () => void;
  slides: HeroSlide[];
}

const DEFAULT_SLIDES: HeroSlide[] = [
  {
    id: 'default-1',
    imageUrl: 'https://images.unsplash.com/photo-1492144534655-ae79c964c9d7?q=80&w=2000&auto=format&fit=crop',
    title: 'UNLIMITED KILOMETERS',
    description: 'Drive as much as you want. No limits, just open roads.'
  },
  {
    id: 'default-2',
    imageUrl: 'https://images.unsplash.com/photo-1533473359331-0135ef1b58bf?q=80&w=2000&auto=format&fit=crop',
    title: 'ZERO SECURITY DEPOSIT',
    description: 'Special offers on select premium sedans this season.'
  },
  {
    id: 'default-3',
    imageUrl: 'https://images.unsplash.com/photo-1511919884226-fd3cad34687c?q=80&w=2000&auto=format&fit=crop',
    title: 'FESTIVAL PROMOTIONS',
    description: 'Get flat 20% off during the festive week. Book now!'
  },
  {
    id: 'default-4',
    imageUrl: 'https://images.unsplash.com/photo-1522202176988-66273c2fd55f?q=80&w=2000&auto=format&fit=crop',
    title: 'HAPPY CUSTOMERS',
    description: '"Best service in Delhi NCR! The cars are brand new." - Rahul S.'
  }
];

const Hero: React.FC<HeroProps> = ({ onBrowseFleet, onShowHowItWorks, slides }) => {
  const activeSlides = slides && slides.length > 0 ? slides : DEFAULT_SLIDES;
  const [currentIndex, setCurrentIndex] = useState(0);

  // Auto-scroll logic
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % activeSlides.length);
    }, 4000); // 4 seconds per slide
    return () => clearInterval(timer);
  }, [activeSlides.length]);

  return (
    <div className="relative w-full h-[500px] bg-black rounded-3xl overflow-hidden mb-12 shadow-2xl animate-fade-in mx-auto group">
      
      {/* Slides */}
      {activeSlides.map((slide, index) => (
        <div 
          key={slide.id}
          className={`absolute inset-0 transition-opacity duration-1000 ease-in-out ${index === currentIndex ? 'opacity-100 z-10' : 'opacity-0 z-0'}`}
        >
          {/* Background Image */}
          <div className="absolute inset-0">
             <img 
              src={slide.imageUrl} 
              alt={slide.title} 
              className="w-full h-full object-cover opacity-60 transition-transform duration-[10s] scale-105"
            />
            <div className="absolute inset-0 bg-gradient-to-r from-black via-black/70 to-transparent"></div>
          </div>

          {/* Content */}
          <div className="relative z-20 px-8 py-16 sm:px-12 sm:py-24 max-w-2xl h-full flex flex-col justify-center">
            <div className="inline-block px-3 py-1 mb-4 text-xs font-bold tracking-widest text-white uppercase bg-red-600 rounded-sm w-max">
              Premium Offer
            </div>
            <h1 className="text-4xl sm:text-6xl font-black text-white tracking-tighter mb-4 leading-none italic uppercase drop-shadow-lg">
              {slide.title}
            </h1>
            <p className="text-lg text-gray-200 mb-8 leading-relaxed font-medium max-w-lg drop-shadow-md">
              {slide.description}
            </p>
            <div className="flex flex-wrap gap-4">
              <button 
                onClick={onBrowseFleet}
                className="px-8 py-4 bg-red-600 hover:bg-red-700 text-white font-bold rounded-xl shadow-lg shadow-red-600/30 transition-all transform hover:-translate-y-1 hover:scale-105 active:scale-95 uppercase tracking-wide text-sm"
              >
                Book Now
              </button>
              <button 
                onClick={onShowHowItWorks}
                className="px-8 py-4 bg-white/10 hover:bg-white/20 text-white font-bold rounded-xl backdrop-blur-sm border border-white/30 transition-all transform hover:-translate-y-1 hover:scale-105 active:scale-95 uppercase tracking-wide text-sm"
              >
                How It Works
              </button>
            </div>
          </div>
        </div>
      ))}

      {/* Indicators */}
      <div className="absolute bottom-6 left-1/2 -translate-x-1/2 z-30 flex space-x-2">
        {activeSlides.map((_, idx) => (
          <button
            key={idx}
            onClick={() => setCurrentIndex(idx)}
            className={`w-12 h-1.5 rounded-full transition-all duration-300 ${
              idx === currentIndex ? 'bg-red-600 w-16' : 'bg-white/30 hover:bg-white/50'
            }`}
          />
        ))}
      </div>
    </div>
  );
};

export default Hero;
