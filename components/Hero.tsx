
import React, { useState, useEffect } from 'react';
import { HeroSlide } from '../types';

interface HeroProps {
  slides: HeroSlide[];
  onSearch: (criteria: { location: string; start: string; end: string }) => void;
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
  }
];

const Hero: React.FC<HeroProps> = ({ slides, onSearch }) => {
  const activeSlides = slides && slides.length > 0 ? slides : DEFAULT_SLIDES;
  const [currentIndex, setCurrentIndex] = useState(0);

  // Search State
  const [location, setLocation] = useState('');
  const [start, setStart] = useState('');
  const [end, setEnd] = useState('');

  // Auto-scroll logic
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % activeSlides.length);
    }, 5000); 
    return () => clearInterval(timer);
  }, [activeSlides.length]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!start || !end) {
        alert("Please select pickup and return dates.");
        return;
    }
    onSearch({ location, start, end });
  };

  return (
    <div className="relative w-full h-[600px] bg-black rounded-3xl overflow-hidden mb-8 shadow-2xl animate-fade-in mx-auto group">
      
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
              className="w-full h-full object-cover opacity-50 transition-transform duration-[10s] scale-105"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black via-transparent to-black/30"></div>
          </div>
        </div>
      ))}

      {/* Content Overlay */}
      <div className="absolute inset-0 z-20 flex flex-col items-center justify-center px-4">
          <div className="text-center mb-8 animate-fade-in">
             <h1 className="text-4xl sm:text-6xl font-black text-white tracking-tighter uppercase italic drop-shadow-xl mb-2">
                Find Your <span className="text-red-600">Drive</span>
             </h1>
             <p className="text-lg text-gray-200 font-medium">Premium self-drive cars in Delhi NCR</p>
          </div>

          {/* Search Widget */}
          <div className="bg-white/10 backdrop-blur-md border border-white/20 p-4 rounded-3xl shadow-2xl w-full max-w-4xl animate-fade-in mt-4">
              <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-4 gap-4">
                  {/* Location */}
                  <div className="bg-white rounded-2xl p-3 flex flex-col justify-center">
                     <label className="text-[10px] uppercase font-bold text-gray-500 mb-1 flex items-center gap-1">
                        <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
                        Pick-up City / Area
                     </label>
                     <input 
                        type="text" 
                        placeholder="e.g. Connaught Place, Delhi" 
                        value={location}
                        onChange={(e) => setLocation(e.target.value)}
                        className="w-full bg-transparent outline-none font-bold text-gray-900 placeholder-gray-300 text-sm"
                     />
                  </div>

                  {/* Start Date */}
                  <div className="bg-white rounded-2xl p-3 flex flex-col justify-center">
                     <label className="text-[10px] uppercase font-bold text-gray-500 mb-1">Pick-up Date</label>
                     <input 
                        type="date" 
                        min={new Date().toISOString().split('T')[0]}
                        value={start}
                        onChange={(e) => setStart(e.target.value)}
                        className="w-full bg-transparent outline-none font-bold text-gray-900 text-sm"
                     />
                  </div>

                  {/* End Date */}
                  <div className="bg-white rounded-2xl p-3 flex flex-col justify-center">
                     <label className="text-[10px] uppercase font-bold text-gray-500 mb-1">Return Date</label>
                     <input 
                        type="date" 
                        min={start || new Date().toISOString().split('T')[0]}
                        value={end}
                        onChange={(e) => setEnd(e.target.value)}
                        className="w-full bg-transparent outline-none font-bold text-gray-900 text-sm"
                     />
                  </div>

                  {/* Submit */}
                  <button 
                    type="submit"
                    className="bg-red-600 hover:bg-red-700 text-white rounded-2xl font-bold uppercase tracking-wide shadow-lg shadow-red-600/30 transition-all active:scale-95 flex items-center justify-center gap-2"
                  >
                     <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
                     Find Cars
                  </button>
              </form>
          </div>
      </div>
    </div>
  );
};

export default Hero;
