
import React, { useState, useRef, useEffect } from 'react';
import { HeroSlide, PromoCode } from '../types';
import { api } from '../services/api';
import { DEFAULT_HERO_SLIDES } from '../constants';

interface OwnerSettingsProps {
  currentQrCode?: string;
  heroSlides?: HeroSlide[];
  stats: {
    totalCars: number;
    totalUsers: number;
    totalBookings: number;
  };
  onSave: (qrCodeBase64: string) => void;
  onSaveSlides: (slides: HeroSlide[]) => void;
}

const OwnerSettings: React.FC<OwnerSettingsProps> = ({ currentQrCode, heroSlides = [], stats, onSave, onSaveSlides }) => {
  const [preview, setPreview] = useState<string | null>(currentQrCode || null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Slide State
  const [slideTitle, setSlideTitle] = useState('');
  const [slideDesc, setSlideDesc] = useState('');
  const [slideImage, setSlideImage] = useState<string | null>(null);
  const slideInputRef = useRef<HTMLInputElement>(null);

  // Promo State
  const [promos, setPromos] = useState<PromoCode[]>([]);
  const [newPromoCode, setNewPromoCode] = useState('');
  const [newPromoPercent, setNewPromoPercent] = useState('');
  const [promoLoading, setPromoLoading] = useState(false);

  const [showDebug, setShowDebug] = useState(false);

  // Determine which slides to show. If DB is empty, show defaults so user can manage them.
  const displaySlides = heroSlides.length > 0 ? heroSlides : DEFAULT_HERO_SLIDES;
  const isUsingDefaults = heroSlides.length === 0;

  useEffect(() => {
    fetchPromos();
  }, []);

  const fetchPromos = async () => {
    try {
      const data = await api.promos.getAll();
      setPromos(data);
    } catch (e) {
      console.error("Failed to fetch promos");
    }
  };

  const handleAddPromo = async () => {
    if (!newPromoCode || !newPromoPercent) {
      alert("Please enter both code and percentage");
      return;
    }
    const percent = parseInt(newPromoPercent);
    if (isNaN(percent) || percent <= 0 || percent > 100) {
      alert("Percentage must be between 1 and 100");
      return;
    }

    setPromoLoading(true);
    try {
      await api.promos.create({ code: newPromoCode, percentage: percent });
      setNewPromoCode('');
      setNewPromoPercent('');
      fetchPromos();
    } catch (e: any) {
      alert(e.message || "Failed to create promo");
    } finally {
      setPromoLoading(false);
    }
  };

  const handleDeletePromo = async (id: number) => {
    if(!confirm("Are you sure you want to delete this promo code?")) return;
    try {
      await api.promos.delete(id);
      fetchPromos();
    } catch (e) {
      alert("Failed to delete promo");
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 1024 * 1024 * 2) {
        alert("File too large. Max 2MB.");
        return;
      }
      const reader = new FileReader();
      reader.onloadend = () => {
        const result = reader.result as string;
        setPreview(result);
        onSave(result);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSlideImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => setSlideImage(reader.result as string);
      reader.readAsDataURL(file);
    }
  };

  const handleAddSlide = () => {
    if (!slideTitle || !slideDesc || !slideImage) {
      alert("Please fill all slide fields");
      return;
    }
    const newSlide: HeroSlide = {
      id: crypto.randomUUID(),
      title: slideTitle,
      description: slideDesc,
      imageUrl: slideImage
    };
    
    // If we were using defaults, we now start a fresh list with the new slide
    // OR, we append to the existing defaults (usually better UX if they just want to add one)
    // However, usually "custom" overrides "default". 
    // Let's decide: Add to current display list.
    const baseList = isUsingDefaults ? [] : heroSlides;
    onSaveSlides([...baseList, newSlide]);

    setSlideTitle('');
    setSlideDesc('');
    setSlideImage(null);
  };

  const handleDeleteSlide = (id: string) => {
    // If we are deleting a default slide, we effectively save the *remaining* default slides as our new custom list.
    const newList = displaySlides.filter(s => s.id !== id);
    onSaveSlides(newList);
  };

  return (
    // Changed: bg-white -> bg-white/60 backdrop-blur-lg border-white/40
    <div className="bg-white/60 backdrop-blur-lg rounded-2xl shadow-xl border border-white/40 p-8 animate-fade-in max-w-4xl mx-auto space-y-12">
      
      {/* QR Code Section */}
      <div>
        <div className="flex items-center gap-4 mb-6">
          <div className="w-12 h-12 bg-red-50/80 rounded-xl flex items-center justify-center text-red-600">
            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v1m6 11h2m-6 0h-2v4h-4v-4H8m13-4V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2h14a2 2 0 002-2v-6z" />
            </svg>
          </div>
          <div>
            <h2 className="text-2xl font-bold text-gray-900">Payment Settings</h2>
            <p className="text-gray-500 text-sm">Configure how you accept payments.</p>
          </div>
        </div>

        <div className="bg-red-50/50 p-4 rounded-xl border border-red-100 text-red-900 text-sm mb-4 font-medium">
           ℹ️ This QR code will be shown to customers when they book a car. They will be asked to pay 10% advance.
        </div>

        <div 
          onClick={() => fileInputRef.current?.click()}
          className="border-2 border-dashed border-gray-300 rounded-2xl h-48 flex flex-col items-center justify-center cursor-pointer hover:bg-white/40 hover:border-red-400 transition-all relative overflow-hidden group max-w-md bg-white/20"
        >
          {preview ? (
            <>
              <img src={preview} alt="QR Code" className="w-full h-full object-contain p-4" />
              <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white font-bold">
                Click to Change
              </div>
            </>
          ) : (
            <div className="text-center p-6">
                <span className="text-gray-500 font-medium">Upload QR Image</span>
            </div>
          )}
          <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handleFileChange} />
        </div>
      </div>

      <hr className="border-gray-200/50" />

      {/* Promo Codes Section */}
      <div>
         <div className="flex items-center gap-4 mb-6">
          <div className="w-12 h-12 bg-emerald-50/80 rounded-xl flex items-center justify-center text-emerald-600">
            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
            </svg>
          </div>
          <div>
            <h2 className="text-2xl font-bold text-gray-900">Promo Codes</h2>
            <p className="text-gray-500 text-sm">Create discounts for your customers (One-time use per user).</p>
          </div>
        </div>

        {/* Add Promo Form */}
        <div className="flex flex-col sm:flex-row gap-4 mb-6 bg-white/40 p-4 rounded-xl border border-gray-200">
          <input 
            type="text" 
            placeholder="Code (e.g. SAVE20)" 
            value={newPromoCode}
            onChange={(e) => setNewPromoCode(e.target.value.toUpperCase())}
            className="flex-1 px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none uppercase font-bold bg-white/60"
          />
          <div className="relative w-32">
             <input 
               type="number" 
               placeholder="20" 
               value={newPromoPercent}
               onChange={(e) => setNewPromoPercent(e.target.value)}
               className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none bg-white/60"
             />
             <span className="absolute right-3 top-3 text-gray-400 font-bold">%</span>
          </div>
          <button 
            onClick={handleAddPromo}
            disabled={promoLoading}
            className="bg-black text-white px-6 py-3 rounded-xl font-bold uppercase tracking-wide hover:bg-gray-800 transition-colors disabled:opacity-50"
          >
            {promoLoading ? 'Adding...' : 'Add Code'}
          </button>
        </div>

        {/* Promo List */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
           {promos.map(promo => (
              <div key={promo.id} className="bg-white/80 border border-emerald-100 rounded-xl p-4 flex justify-between items-center shadow-sm">
                 <div>
                    <span className="block font-black text-emerald-600 text-lg">{promo.code}</span>
                    <span className="text-sm text-gray-500">{promo.percentage}% Discount</span>
                 </div>
                 <button 
                   onClick={() => handleDeletePromo(promo.id)}
                   className="text-gray-400 hover:text-red-600 p-2"
                 >
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                 </button>
              </div>
           ))}
           {promos.length === 0 && (
             <div className="col-span-full text-center py-6 text-gray-400 italic">No active promo codes</div>
           )}
        </div>
      </div>

      <hr className="border-gray-200/50" />

      {/* Hero Slides Section */}
      <div>
         <div className="flex items-center gap-4 mb-6">
          <div className="w-12 h-12 bg-red-50/80 rounded-xl flex items-center justify-center text-red-600">
            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
          </div>
          <div>
            <h2 className="text-2xl font-bold text-gray-900">Hero Gallery</h2>
            <p className="text-gray-500 text-sm">Add promotions, reviews, or offers to the home carousel.</p>
          </div>
        </div>

        {/* Add Slide Form */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 bg-white/40 p-6 rounded-2xl border border-gray-200 mb-6">
           <div className="space-y-4">
              <input 
                type="text" 
                placeholder="Title (e.g. SUMMER SALE)" 
                value={slideTitle}
                onChange={(e) => setSlideTitle(e.target.value)}
                className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-red-600 outline-none bg-white/60"
              />
              <textarea 
                placeholder="Description" 
                value={slideDesc}
                onChange={(e) => setSlideDesc(e.target.value)}
                className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-red-600 outline-none h-24 resize-none bg-white/60"
              />
           </div>
           
           <div 
              onClick={() => slideInputRef.current?.click()}
              className="border-2 border-dashed border-gray-300 rounded-xl flex items-center justify-center cursor-pointer hover:bg-white/60 transition-colors h-full min-h-[150px] relative overflow-hidden bg-white/20"
           >
              {slideImage ? (
                 <img src={slideImage} alt="Preview" className="w-full h-full object-cover" />
              ) : (
                 <div className="text-center text-gray-400 text-sm font-bold">
                    + Upload Slide Image
                 </div>
              )}
              <input ref={slideInputRef} type="file" accept="image/*" className="hidden" onChange={handleSlideImageChange} />
           </div>

           <div className="md:col-span-2">
              <button 
                onClick={handleAddSlide}
                className="w-full bg-black text-white py-3 rounded-xl font-bold uppercase tracking-wide hover:bg-gray-800 transition-colors"
              >
                Add Slide
              </button>
           </div>
        </div>

        {/* Slide List */}
        {isUsingDefaults && (
          <div className="mb-4 p-3 bg-blue-50/50 border border-blue-100 rounded-xl text-blue-700 text-xs font-bold text-center">
             Currently displaying default slides. Deleting a slide here will save the remaining ones as your custom configuration.
          </div>
        )}

        <div className="grid grid-cols-2 gap-4">
           {displaySlides.map(slide => (
              <div key={slide.id} className="relative aspect-video rounded-xl overflow-hidden group shadow-lg border border-white/20">
                 <img src={slide.imageUrl} alt={slide.title} className="w-full h-full object-cover" />
                 <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center text-white p-4 text-center backdrop-blur-sm">
                    <h4 className="font-bold">{slide.title}</h4>
                    <p className="text-xs line-clamp-2">{slide.description}</p>
                    <button 
                      onClick={() => handleDeleteSlide(slide.id)}
                      className="mt-3 bg-red-600 px-3 py-1 rounded text-xs font-bold hover:bg-red-700"
                    >
                      Remove
                    </button>
                 </div>
              </div>
           ))}
        </div>
      </div>

      <hr className="border-gray-200/50" />

      {/* Real Database Inspector */}
      <div>
         <div 
            className="flex items-center justify-between cursor-pointer"
            onClick={() => setShowDebug(!showDebug)}
         >
            <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-gray-100/50 rounded-xl flex items-center justify-center text-gray-600">
                    <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 7v10c0 2.21 3.582 4 8 4s8-1.79 8-4V7M4 7c0 2.21 3.582 4 8 4s8-1.79 8-4M4 7c0-2.21 3.582-4 8-4s8 1.79 8 4m0 5c0 2.21-3.582 4-8 4s-8-1.79-8-4" />
                    </svg>
                </div>
                <div>
                    <h2 className="text-2xl font-bold text-gray-900">Database Status</h2>
                    <p className="text-gray-500 text-sm">View live database statistics.</p>
                </div>
            </div>
            <button className="text-gray-400">
                {showDebug ? '▼' : '▶'}
            </button>
         </div>

         {showDebug && (
             <div className="mt-6 bg-gray-50/50 border border-gray-200 rounded-xl p-6 font-mono text-sm overflow-x-auto">
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <div className="bg-white/80 p-4 rounded-lg border border-gray-200 shadow-sm">
                        <span className="block text-gray-400 text-xs font-bold uppercase mb-1">Total Cars</span>
                        <span className="text-2xl font-black text-blue-600">{stats.totalCars}</span>
                    </div>
                    <div className="bg-white/80 p-4 rounded-lg border border-gray-200 shadow-sm">
                        <span className="block text-gray-400 text-xs font-bold uppercase mb-1">Registered Users</span>
                        <span className="text-2xl font-black text-blue-600">{stats.totalUsers}</span>
                    </div>
                    <div className="bg-white/80 p-4 rounded-lg border border-gray-200 shadow-sm">
                        <span className="block text-gray-400 text-xs font-bold uppercase mb-1">Total Bookings</span>
                        <span className="text-2xl font-black text-blue-600">{stats.totalBookings}</span>
                    </div>
                </div>
                <div className="mt-4 text-xs text-gray-500 text-center">
                   These numbers reflect real-time data from your D1 Database.
                </div>
             </div>
         )}
      </div>

    </div>
  );
};

export default OwnerSettings;
