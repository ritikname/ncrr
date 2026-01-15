
import React, { useState, useRef, useEffect } from 'react';
import { HeroSlide, Booking, UserProfile } from '../types';
import { getStoredBookings, getAllUsers, getStoredCars } from '../services/storage';

interface OwnerSettingsProps {
  currentQrCode?: string;
  heroSlides?: HeroSlide[];
  onSave: (qrCodeBase64: string) => void;
  onSaveSlides: (slides: HeroSlide[]) => void;
}

const OwnerSettings: React.FC<OwnerSettingsProps> = ({ currentQrCode, heroSlides = [], onSave, onSaveSlides }) => {
  const [preview, setPreview] = useState<string | null>(currentQrCode || null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Slide State
  const [slideTitle, setSlideTitle] = useState('');
  const [slideDesc, setSlideDesc] = useState('');
  const [slideImage, setSlideImage] = useState<string | null>(null);
  const slideInputRef = useRef<HTMLInputElement>(null);

  // Data Inspector State
  const [debugData, setDebugData] = useState<{ bookings: Booking[], users: any[], totalCars: number } | null>(null);
  const [showDebug, setShowDebug] = useState(false);

  useEffect(() => {
    if (showDebug) {
        setDebugData({
            bookings: getStoredBookings(),
            users: getAllUsers(),
            totalCars: getStoredCars().length
        });
    }
  }, [showDebug]);

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
    onSaveSlides([...heroSlides, newSlide]);
    setSlideTitle('');
    setSlideDesc('');
    setSlideImage(null);
  };

  const handleDeleteSlide = (id: string) => {
    onSaveSlides(heroSlides.filter(s => s.id !== id));
  };

  const handleClearData = () => {
    if (confirm('CRITICAL WARNING: This will delete ALL bookings and user accounts from this browser. This cannot be undone. Are you sure?')) {
        localStorage.clear();
        alert('Data cleared. Page will reload.');
        window.location.reload();
    }
  };

  return (
    <div className="bg-white rounded-2xl shadow-xl border border-gray-100 p-8 animate-fade-in max-w-4xl mx-auto space-y-12">
      
      {/* QR Code Section */}
      <div>
        <div className="flex items-center gap-4 mb-6">
          <div className="w-12 h-12 bg-red-50 rounded-xl flex items-center justify-center text-red-600">
            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v1m6 11h2m-6 0h-2v4h-4v-4H8m13-4V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2h14a2 2 0 002-2v-6z" />
            </svg>
          </div>
          <div>
            <h2 className="text-2xl font-bold text-gray-900">Payment Settings</h2>
            <p className="text-gray-500 text-sm">Configure how you accept payments.</p>
          </div>
        </div>

        <div className="bg-red-50 p-4 rounded-xl border border-red-100 text-red-900 text-sm mb-4 font-medium">
           ℹ️ This QR code will be shown to customers when they book a car. They will be asked to pay 10% advance.
        </div>

        <div 
          onClick={() => fileInputRef.current?.click()}
          className="border-2 border-dashed border-gray-300 rounded-2xl h-48 flex flex-col items-center justify-center cursor-pointer hover:bg-gray-50 hover:border-red-400 transition-all relative overflow-hidden group max-w-md"
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

      <hr className="border-gray-100" />

      {/* Hero Slides Section */}
      <div>
         <div className="flex items-center gap-4 mb-6">
          <div className="w-12 h-12 bg-red-50 rounded-xl flex items-center justify-center text-red-600">
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
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 bg-gray-50 p-6 rounded-2xl border border-gray-200 mb-6">
           <div className="space-y-4">
              <input 
                type="text" 
                placeholder="Title (e.g. SUMMER SALE)" 
                value={slideTitle}
                onChange={(e) => setSlideTitle(e.target.value)}
                className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-red-600 outline-none"
              />
              <textarea 
                placeholder="Description" 
                value={slideDesc}
                onChange={(e) => setSlideDesc(e.target.value)}
                className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-red-600 outline-none h-24 resize-none"
              />
           </div>
           
           <div 
              onClick={() => slideInputRef.current?.click()}
              className="border-2 border-dashed border-gray-300 rounded-xl flex items-center justify-center cursor-pointer hover:bg-white transition-colors h-full min-h-[150px] relative overflow-hidden"
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
        <div className="grid grid-cols-2 gap-4">
           {heroSlides.map(slide => (
              <div key={slide.id} className="relative aspect-video rounded-xl overflow-hidden group">
                 <img src={slide.imageUrl} alt={slide.title} className="w-full h-full object-cover" />
                 <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center text-white p-4 text-center">
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

      <hr className="border-gray-100" />

      {/* Data Inspector */}
      <div>
         <div 
            className="flex items-center justify-between cursor-pointer"
            onClick={() => setShowDebug(!showDebug)}
         >
            <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-gray-100 rounded-xl flex items-center justify-center text-gray-600">
                    <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 7v10c0 2.21 3.582 4 8 4s8-1.79 8-4V7M4 7c0 2.21 3.582 4 8 4s8-1.79 8-4M4 7c0-2.21 3.582-4 8-4s8 1.79 8 4m0 5c0 2.21-3.582 4-8 4s-8-1.79-8-4" />
                    </svg>
                </div>
                <div>
                    <h2 className="text-2xl font-bold text-gray-900">System Data</h2>
                    <p className="text-gray-500 text-sm">View local data stored in this browser.</p>
                </div>
            </div>
            <button className="text-gray-400">
                {showDebug ? '▼' : '▶'}
            </button>
         </div>

         {showDebug && debugData && (
             <div className="mt-6 bg-gray-50 border border-gray-200 rounded-xl p-6 font-mono text-xs overflow-x-auto">
                <div className="flex justify-between items-center mb-4">
                    <h4 className="font-bold text-gray-700 uppercase">LocalStorage Dump</h4>
                    <button onClick={handleClearData} className="bg-red-600 text-white px-3 py-1 rounded hover:bg-red-700 font-bold">
                        ⚠️ Factory Reset (Clear Data)
                    </button>
                </div>
                
                <div className="space-y-4">
                    <div>
                        <span className="text-blue-600 font-bold">Total Cars in Fleet:</span> {debugData.totalCars}
                    </div>
                    <div>
                        <span className="text-blue-600 font-bold">Registered Users:</span> {debugData.users.length}
                        <pre className="mt-1 text-gray-600 bg-gray-100 p-2 rounded">{JSON.stringify(debugData.users, null, 2)}</pre>
                    </div>
                    <div>
                        <span className="text-blue-600 font-bold">All Bookings:</span> {debugData.bookings.length}
                        <pre className="mt-1 text-gray-600 bg-gray-100 p-2 rounded">{JSON.stringify(debugData.bookings.map(b => ({id: b.id, car: b.carName, customer: b.customerName, status: b.status})), null, 2)}</pre>
                    </div>
                </div>
             </div>
         )}
      </div>

    </div>
  );
};

export default OwnerSettings;
