
import React, { useState, useEffect, useRef } from 'react';
import { HeroSlide } from '../types';
import { DEFAULT_HERO_SLIDES } from '../constants';

interface HeroProps {
  slides: HeroSlide[];
  onSearch: (criteria: { location: string; start: string; end: string }) => void;
}

const Hero: React.FC<HeroProps> = ({ slides, onSearch }) => {
  const activeSlides = slides && slides.length > 0 ? slides : DEFAULT_HERO_SLIDES;
  
  // Continuous Scroll State
  const [itemsPerView, setItemsPerView] = useState(1);
  const [isPaused, setIsPaused] = useState(false);

  // Animation & Drag Refs
  const sliderRef = useRef<HTMLDivElement>(null);
  const animationRef = useRef<number | null>(null);
  const progressRef = useRef(0);
  
  const isDragging = useRef(false);
  const startX = useRef(0);
  const canHover = useRef(true);

  // Search State
  const [location, setLocation] = useState('');
  const [start, setStart] = useState('');
  const [end, setEnd] = useState('');

  // Tripling slides ensures we have enough buffer for a seamless loop
  const extendedSlides = [...activeSlides, ...activeSlides, ...activeSlides];

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

  // Responsive logic & Feature Detection
  useEffect(() => {
    const handleResize = () => {
        if (window.innerWidth >= 1280) setItemsPerView(3); // XL Desktop
        else if (window.innerWidth >= 768) setItemsPerView(2); // Tablet
        else setItemsPerView(1); // Mobile
    };
    handleResize();
    window.addEventListener('resize', handleResize);
    
    // Detect Hover Capability (Fixes stuck issue on mobile)
    if (typeof window !== 'undefined') {
        canHover.current = window.matchMedia('(hover: hover)').matches;
    }

    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // --- TOUCH / DRAG HANDLERS ---
  const handleDragStart = (clientX: number) => {
    setIsPaused(true);
    isDragging.current = true;
    startX.current = clientX;
  };

  const handleDragMove = (clientX: number) => {
    if (!isDragging.current || !sliderRef.current) return;
    
    const diff = startX.current - clientX; // Positive if dragging LEFT
    startX.current = clientX;

    const containerWidth = sliderRef.current.parentElement?.offsetWidth || 1;
    // Calculate percentage movement
    const percentMove = (diff / containerWidth) * 100;
    
    progressRef.current += percentMove;
  };

  const handleDragEnd = () => {
    isDragging.current = false;
    // On mobile (or anytime drag ends via mouse up), check if we should unpause.
    // If it's a touch device (cannot hover), we MUST unpause.
    if (!canHover.current) {
        setIsPaused(false);
    }
    // For desktop, if mouse is still inside, onMouseEnter/Leave handles it.
  };

  // Mouse Events
  const onMouseDown = (e: React.MouseEvent) => {
      e.preventDefault();
      handleDragStart(e.clientX);
  };
  const onMouseMove = (e: React.MouseEvent) => handleDragMove(e.clientX);
  const onMouseUp = () => handleDragEnd();
  const onMouseLeave = () => {
      handleDragEnd();
      if (canHover.current) setIsPaused(false);
  };
  const onMouseEnter = () => {
      if (canHover.current) setIsPaused(true);
  };

  // Touch Events
  const onTouchStart = (e: React.TouchEvent) => {
      // e.preventDefault(); // DO NOT prevent default here, allows vertical scrolling
      handleDragStart(e.touches[0].clientX);
  };
  const onTouchMove = (e: React.TouchEvent) => handleDragMove(e.touches[0].clientX);
  
  const onTouchEnd = () => {
      isDragging.current = false;
      // Always unpause on touch end to prevent stuck slider on mobile
      setIsPaused(false);
  };

  // Continuous Animation Loop
  useEffect(() => {
    const animate = () => {
        // Auto-increment if not paused and not dragging
        if (!isPaused && !isDragging.current) {
            const speed = 0.1; 
            progressRef.current += speed;
        }

        const singleSetWidth = (100 / itemsPerView) * activeSlides.length;

        // Infinite Loop Logic (Wrap Around)
        if (progressRef.current >= singleSetWidth) {
            progressRef.current = 0;
        } else if (progressRef.current < 0) {
            // Support reverse scrolling (dragging left to right past 0)
            progressRef.current = singleSetWidth; 
        }

        // Apply Transform
        if (sliderRef.current) {
            sliderRef.current.style.transform = `translateX(-${progressRef.current}%)`;
        }
        
        animationRef.current = requestAnimationFrame(animate);
    };

    animationRef.current = requestAnimationFrame(animate);

    return () => {
        if (animationRef.current) cancelAnimationFrame(animationRef.current);
    };
  }, [isPaused, itemsPerView, activeSlides.length]);

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
    <div className="relative w-full mb-[28rem] md:mb-32 mx-auto group animate-fade-in select-none">
      
      {/* Carousel Container */}
      <div 
        className="relative w-full overflow-hidden px-4 md:px-0 pt-8 cursor-grab active:cursor-grabbing select-none"
        onMouseEnter={onMouseEnter}
        onMouseLeave={onMouseLeave}
        onMouseDown={onMouseDown}
        onMouseMove={onMouseMove}
        onMouseUp={onMouseUp}
        onTouchStart={onTouchStart}
        onTouchMove={onTouchMove}
        onTouchEnd={onTouchEnd}
        onContextMenu={(e) => e.preventDefault()} // Prevent context menu on long press
        style={{ 
            touchAction: 'pan-y', // Allows vertical scroll but captures horizontal
            userSelect: 'none',
            WebkitUserSelect: 'none',
            WebkitTouchCallout: 'none' // Disable callout (like save image) on iOS
        }} 
      >
        {/* Track */}
        <div 
            ref={sliderRef}
            className="flex will-change-transform"
            style={{ 
                // Initial transform
                transform: `translateX(0%)`
            }}
        >
            {extendedSlides.map((slide, index) => (
                <div 
                    key={`${slide.id}-${index}`} 
                    className="flex-shrink-0 px-2"
                    style={{ width: `${100 / itemsPerView}%` }}
                >
                    <div className="relative h-[250px] md:h-[350px] rounded-3xl overflow-hidden shadow-md bg-black transition-shadow pointer-events-none select-none border border-gray-800">
                        <img 
                            src={slide.imageUrl} 
                            alt={slide.title} 
                            className="w-full h-full object-contain select-none"
                            draggable={false}
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-80 pointer-events-none"></div>
                        <div className="absolute bottom-0 left-0 p-6 w-full pointer-events-none">
                            <span className="text-[10px] font-bold text-red-400 uppercase tracking-widest bg-black/50 backdrop-blur-md px-2 py-1 rounded-md mb-2 inline-block">Featured</span>
                            <h3 className="text-xl md:text-2xl font-black text-white uppercase italic leading-tight mb-1">{slide.title}</h3>
                            <p className="text-sm font-medium text-gray-300 line-clamp-2">{slide.description}</p>
                        </div>
                    </div>
                </div>
            ))}
        </div>
      </div>

      {/* Search Widget */}
      <div className="absolute left-0 right-0 top-[100%] z-40 px-4 flex justify-center translate-y-4">
          <div className="bg-white p-5 rounded-[2rem] shadow-2xl w-full max-w-5xl border border-gray-100 relative">
              <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-4 gap-4 items-end">
                  {/* Location */}
                  <div className="bg-gray-50 rounded-2xl p-3 flex flex-col justify-center relative border border-gray-100 hover:border-red-200 transition-colors h-[62px]">
                     <label className="text-[10px] uppercase font-bold text-gray-500 mb-1 flex items-center gap-1 select-none">
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
                  <div className="bg-gray-50 rounded-2xl p-3 flex flex-col justify-center border border-gray-100 hover:border-red-200 transition-colors relative h-[62px] group">
                     <label className="text-[10px] uppercase font-bold text-gray-500 mb-1 pointer-events-none select-none">Pick-up Date</label>
                     
                     <div className="flex items-center justify-between w-full h-6 pointer-events-none gap-2">
                        <span className={`text-sm font-bold truncate ${start ? 'text-gray-900' : 'text-gray-400'}`}>
                            {start || 'Select Date'}
                        </span>
                        <svg className="w-4 h-4 text-gray-500 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
                     </div>

                     {/* Invisible Input covering the entire parent */}
                     <input 
                        type="date" 
                        min={getTodayString()}
                        value={start}
                        onChange={handleStartDateChange}
                        className="!absolute inset-0 w-full h-full opacity-0 z-20 cursor-pointer appearance-none"
                     />
                  </div>

                  {/* End Date */}
                  <div className="bg-gray-50 rounded-2xl p-3 flex flex-col justify-center border border-gray-100 hover:border-red-200 transition-colors relative h-[62px] group">
                     <label className="text-[10px] uppercase font-bold text-gray-500 mb-1 pointer-events-none select-none">Return Date</label>
                     
                     <div className="flex items-center justify-between w-full h-6 pointer-events-none gap-2">
                        <span className={`text-sm font-bold truncate ${end ? 'text-gray-900' : 'text-gray-400'}`}>
                            {end || 'Select Date'}
                        </span>
                        <svg className="w-4 h-4 text-gray-500 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
                     </div>

                     {/* Invisible Input covering the entire parent */}
                     <input 
                        type="date" 
                        min={start || getTodayString()}
                        value={end}
                        onChange={handleEndDateChange}
                        className="!absolute inset-0 w-full h-full opacity-0 z-20 cursor-pointer appearance-none"
                     />
                  </div>

                  {/* Submit */}
                  <button 
                    type="submit"
                    className="h-[62px] bg-red-600 hover:bg-red-700 text-white rounded-2xl font-bold uppercase tracking-wide shadow-lg shadow-red-600/30 transition-all active:scale-95 flex items-center justify-center gap-2 select-none"
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
