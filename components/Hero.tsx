
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

  // Helper for local date YYYY-MM-DD to fix iOS timezone issue
  const getTodayString = () => {
    const today = new Date();
    const year = today.getFullYear();
    const month = String(today.getMonth() + 1).padStart(2, '0');
    const day = String(today.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  // Auto-scroll logic
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % activeSlides.length);
    }, 5000); 
    return () => clearInterval(timer);
  }, [activeSlides.length]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!location) {
        alert("Please select a pick-up location.");
        return;
    }
    if (!start || !end) {
        alert("Please select pickup and return dates.");
        return;
    }
    onSearch({ location, start, end });
  };

  return (
    <div className="relative w-full mb-[28rem] md:mb-24 mx-auto group animate-fade-in">
      
      {/* Slides Container */}
      <div className="relative h-[550px] w-full rounded-3xl overflow-hidden shadow-xl bg-black">
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
                <div className="absolute inset-0 bg-gradient-to-t from-black via-transparent to-black/30"></div>
            </div>
            
            {/* Content Overlay - Positioned Higher */}
            <div className="absolute inset-0 flex flex-col items-center justify-center pb-24 md:pb-20 px-4 text-center">
                 <h1 className="text-4xl sm:text-6xl font-black text-white tracking-tighter uppercase italic drop-shadow-2xl mb-4 transform translate-y-0 transition-transform duration-700">
                    {slide.title}
                </h1>
                <p className="text-lg sm:text-xl text-gray-200 font-medium max-w-2xl drop-shadow-md bg-black/30 backdrop-blur-sm p-2 rounded-lg">
                    {slide.description}
                </p>
            </div>
            </div>
        ))}
      </div>

      {/* Search Widget - Smart Positioning */}
      {/* 
         On Mobile: Using top-[100%] aligns the top of the widget to the bottom of the image.
         -translate-y-12 pulls it up slightly to overlap. 
         This ensures the widget grows DOWNWARDS without covering the hero image content.
      */}
      <div className="absolute left-0 right-0 top-[100%] -translate-y-12 md:-translate-y-1/2 z-40 px-4 flex justify-center">
          <div className="bg-white p-5 rounded-[2rem] shadow-2xl w-full max-w-5xl border border-gray-100 relative">
              <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-4 gap-4 items-end">
                  {/* Location */}
                  <div className="bg-gray-50 rounded-2xl p-3 flex flex-col justify-center relative border border-gray-100 hover:border-red-200 transition-colors">
                     <label className="text-[10px] uppercase font-bold text-gray-500 mb-1 flex items-center gap-1">
                        <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
                        Pick-up Point
                     </label>
                     <div className="relative">
                        <select 
                            value={location}
                            onChange={(e) => setLocation(e.target.value)}
                            className="w-full bg-transparent outline-none font-bold text-gray-900 text-sm appearance-none cursor-pointer pr-6 py-1"
                        >
                            <option value="" disabled>Select Station</option>
                            <option value="Hauz Khas Metro">Hauz Khas Metro</option>
                            <option value="Kaushambi Metro">Kaushambi Metro</option>
                            <option value="Shiv Vihar Metro">Shiv Vihar Metro</option>
                        </select>
                        <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center text-gray-500">
                           <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" /></svg>
                        </div>
                     </div>
                  </div>

                  {/* Start Date */}
                  <div className="bg-gray-50 rounded-2xl p-3 flex flex-col justify-center border border-gray-100 hover:border-red-200 transition-colors relative">
                     <label className="text-[10px] uppercase font-bold text-gray-500 mb-1">Pick-up Date</label>
                     <input 
                        type="date" 
                        min={getTodayString()}
                        value={start}
                        onChange={(e) => setStart(e.target.value)}
                        className="w-full bg-transparent outline-none font-bold text-gray-900 text-sm h-6 appearance-none relative z-10"
                        style={{ WebkitAppearance: 'none' }}
                     />
                     {!start && <div className="absolute bottom-3 left-3 pointer-events-none text-sm font-bold text-gray-400">Select Date</div>}
                  </div>

                  {/* End Date */}
                  <div className="bg-gray-50 rounded-2xl p-3 flex flex-col justify-center border border-gray-100 hover:border-red-200 transition-colors relative">
                     <label className="text-[10px] uppercase font-bold text-gray-500 mb-1">Return Date</label>
                     <input 
                        type="date" 
                        min={start || getTodayString()}
                        value={end}
                        onChange={(e) => setEnd(e.target.value)}
                        className="w-full bg-transparent outline-none font-bold text-gray-900 text-sm h-6 appearance-none relative z-10"
                        style={{ WebkitAppearance: 'none' }}
                     />
                     {!end && <div className="absolute bottom-3 left-3 pointer-events-none text-sm font-bold text-gray-400">Select Date</div>}
                  </div>

                  {/* Submit */}
                  <button 
                    type="submit"
                    className="h-[62px] bg-red-600 hover:bg-red-700 text-white rounded-2xl font-bold uppercase tracking-wide shadow-lg shadow-red-600/30 transition-all active:scale-95 flex items-center justify-center gap-2"
                  >
                     <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
                     Search
                  </button>
              </form>
          </div>
      </div>
    </div>
  );
};

export default Hero;
