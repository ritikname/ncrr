
import React, { useState, useEffect, useRef } from 'react';
import { HeroSlide } from '../types';

interface HeroProps {
  slides: HeroSlide[];
  onSearch: (criteria: { location: string; start: string; end: string }) => void;
}

const DEFAULT_SLIDES: HeroSlide[] = [
  {
    id: 'default-1',
    imageUrl: 'https://images.unsplash.com/photo-1549317661-bd32c8ce0db2?q=80&w=2070&auto=format&fit=crop',
    title: 'LUXURY SEDANS',
    description: 'Starting at ₹2000/day'
  },
  {
    id: 'default-2',
    imageUrl: 'https://images.unsplash.com/photo-1503376763036-066120622c74?q=80&w=2000&auto=format&fit=crop',
    title: 'OFF-ROAD BEASTS',
    description: 'Conquer the terrain.'
  },
  {
    id: 'default-3',
    imageUrl: 'https://images.unsplash.com/photo-1492144534655-ae79c964c9d7?q=80&w=2000&auto=format&fit=crop',
    title: 'CITY DRIVES',
    description: 'Compact & Efficient.'
  },
  {
    id: 'default-4',
    imageUrl: 'https://images.unsplash.com/photo-1533473359331-0135ef1b58bf?q=80&w=2000&auto=format&fit=crop',
    title: 'PREMIUM SUVS',
    description: 'Space & Comfort.'
  }
];

const Hero: React.FC<HeroProps> = ({ slides, onSearch }) => {
  const activeSlides = slides && slides.length > 0 ? slides : DEFAULT_SLIDES;
  const [currentIndex, setCurrentIndex] = useState(0);
  const [itemsPerView, setItemsPerView] = useState(1);

  // Search State
  const [location, setLocation] = useState('');
  const [start, setStart] = useState('');
  const [end, setEnd] = useState('');

  const startInputRef = useRef<HTMLInputElement>(null);
  const endInputRef = useRef<HTMLInputElement>(null);

  // Helper for local date YYYY-MM-DD
  const getTodayString = () => {
    const today = new Date();
    const year = today.getFullYear();
    const month = String(today.getMonth() + 1).padStart(2, '0');
    const day = String(today.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  const handleStartDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selected = e.target.value;
    const today = getTodayString();
    if (selected && selected < today) {
        alert("You cannot select a past date.");
        setStart(today);
    } else {
        setStart(selected);
    }
  };

  const handleEndDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selected = e.target.value;
    const minDate = start || getTodayString();
    if (selected && selected < minDate) {
        alert("Return date cannot be before pick-up date.");
        setEnd('');
    } else {
        setEnd(selected);
    }
  };

  // Responsive logic
  useEffect(() => {
    const handleResize = () => {
        if (window.innerWidth >= 1280) setItemsPerView(3); // XL Desktop
        else if (window.innerWidth >= 768) setItemsPerView(2); // Tablet
        else setItemsPerView(1); // Mobile
    };
    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Auto-scroll logic (Every 1 second)
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % activeSlides.length);
    }, 1000); 
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

  const openPicker = (ref: React.RefObject<HTMLInputElement>) => {
    try {
        if (ref.current && 'showPicker' in ref.current) {
            (ref.current as any).showPicker();
        } else {
            ref.current?.focus();
        }
    } catch (e) {
        console.log("Picker open failed", e);
    }
  };

  // Navigation handlers
  const prevSlide = () => setCurrentIndex(prev => (prev - 1 + activeSlides.length) % activeSlides.length);
  const nextSlide = () => setCurrentIndex(prev => (prev + 1) % activeSlides.length);

  return (
    <div className="relative w-full mb-[28rem] md:mb-32 mx-auto group animate-fade-in">
      
      {/* Navigation Buttons (Top Right) */}
      <div className="flex justify-end gap-3 mb-4 px-4 max-w-[98%] mx-auto">
         <button onClick={prevSlide} className="w-10 h-10 rounded-full bg-white border border-gray-200 shadow-sm flex items-center justify-center hover:bg-gray-50 transition-colors">
            <svg className="w-5 h-5 text-gray-700" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg>
         </button>
         <button onClick={nextSlide} className="w-10 h-10 rounded-full bg-white border border-gray-200 shadow-sm flex items-center justify-center hover:bg-gray-50 transition-colors">
            <svg className="w-5 h-5 text-gray-700" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg>
         </button>
      </div>

      {/* Carousel Container */}
      <div className="relative w-full overflow-hidden px-4 md:px-0">
        <div 
            className="flex transition-transform duration-500 ease-in-out"
            style={{ transform: `translateX(-${currentIndex * (100 / itemsPerView)}%)` }}
        >
            {activeSlides.map((slide) => (
                <div 
                    key={slide.id} 
                    className="flex-shrink-0 px-2"
                    style={{ width: `${100 / itemsPerView}%` }}
                >
                    <div className="relative h-[250px] md:h-[350px] rounded-3xl overflow-hidden shadow-md bg-gray-100 group-hover:shadow-xl transition-shadow">
                        <img 
                            src={slide.imageUrl} 
                            alt={slide.title} 
                            className="w-full h-full object-cover transform hover:scale-105 transition-transform duration-700"
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-80"></div>
                        <div className="absolute bottom-0 left-0 p-6 w-full">
                            <span className="text-[10px] font-bold text-red-400 uppercase tracking-widest bg-black/50 backdrop-blur-md px-2 py-1 rounded-md mb-2 inline-block">Featured</span>
                            <h3 className="text-xl md:text-2xl font-black text-white uppercase italic leading-tight mb-1">{slide.title}</h3>
                            <p className="text-sm font-medium text-gray-300 line-clamp-2">{slide.description}</p>
                        </div>
                    </div>
                </div>
            ))}
        </div>
      </div>

      {/* Search Widget - Kept Overlaying */}
      <div className="absolute left-0 right-0 top-[100%] z-40 px-4 flex justify-center -translate-y-16 md:-translate-y-1/2">
          <div className="bg-white p-5 rounded-[2rem] shadow-2xl w-full max-w-5xl border border-gray-100 relative">
              <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-4 gap-4 items-end">
                  {/* Location */}
                  <div className="bg-gray-50 rounded-2xl p-3 flex flex-col justify-center relative border border-gray-100 hover:border-red-200 transition-colors h-[62px]">
                     <label className="text-[10px] uppercase font-bold text-gray-500 mb-1 flex items-center gap-1">
                        <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
                        Pick-up Point
                     </label>
                     <div className="relative">
                        <select 
                            value={location}
                            onChange={(e) => setLocation(e.target.value)}
                            className="w-full bg-transparent outline-none font-bold text-gray-900 text-sm appearance-none cursor-pointer pr-6 py-1 relative z-10"
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
                  <div 
                    onClick={() => openPicker(startInputRef)}
                    className="bg-gray-50 rounded-2xl p-3 flex flex-col justify-center border border-gray-100 hover:border-red-200 transition-colors relative h-[62px] group cursor-pointer"
                  >
                     <label className="text-[10px] uppercase font-bold text-gray-500 mb-1 pointer-events-none">Pick-up Date</label>
                     
                     <div className="flex items-center justify-between w-full h-6 pointer-events-none">
                        <span className={`text-sm font-bold ${start ? 'text-gray-900' : 'text-gray-400'}`}>
                            {start || 'Select Date'}
                        </span>
                        <svg className="w-4 h-4 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
                     </div>

                     <input 
                        ref={startInputRef}
                        type="date" 
                        min={getTodayString()}
                        value={start}
                        onChange={handleStartDateChange}
                        className="absolute inset-0 w-full h-full opacity-0 z-20 cursor-pointer"
                        style={{opacity: 0.01}} 
                     />
                  </div>

                  {/* End Date */}
                  <div 
                    onClick={() => openPicker(endInputRef)}
                    className="bg-gray-50 rounded-2xl p-3 flex flex-col justify-center border border-gray-100 hover:border-red-200 transition-colors relative h-[62px] group cursor-pointer"
                  >
                     <label className="text-[10px] uppercase font-bold text-gray-500 mb-1 pointer-events-none">Return Date</label>
                     
                     <div className="flex items-center justify-between w-full h-6 pointer-events-none">
                        <span className={`text-sm font-bold ${end ? 'text-gray-900' : 'text-gray-400'}`}>
                            {end || 'Select Date'}
                        </span>
                        <svg className="w-4 h-4 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
                     </div>

                     <input 
                        ref={endInputRef}
                        type="date" 
                        min={start || getTodayString()}
                        value={end}
                        onChange={handleEndDateChange}
                        className="absolute inset-0 w-full h-full opacity-0 z-20 cursor-pointer"
                        style={{opacity: 0.01}} 
                     />
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
