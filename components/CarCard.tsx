
import React from 'react';
import { Car, ViewMode } from '../types';

interface CarCardProps {
  car: Car;
  viewMode: ViewMode;
  bookedCount: number;
  onToggleStatus: (id: string, currentStatus: 'available' | 'sold') => void;
  onDelete: (id: string) => void;
  onBook: (car: Car) => void;
  onEditStock: (id: string) => void;
  onViewGallery: (car: Car) => void; // New prop
  index: number;
}

const CarCard: React.FC<CarCardProps> = ({ car, viewMode, bookedCount, onToggleStatus, onDelete, onBook, onEditStock, onViewGallery, index }) => {
  const isOwner = viewMode === 'owner';
  
  // Dynamic Availability Calculation
  const totalStock = car.totalStock || 1;
  const availableStock = Math.max(0, totalStock - bookedCount);
  const isSoldOut = availableStock === 0;

  return (
    <div 
      className={`group relative bg-white rounded-2xl shadow-sm hover:shadow-2xl hover:shadow-red-900/10 transition-all duration-300 overflow-hidden border border-gray-100 flex flex-col h-full animate-fade-in ${isSoldOut && !isOwner ? 'grayscale opacity-75' : ''}`}
      style={{ animationDelay: `${index * 100}ms` }}
    >
      
      {/* Image Container - Click to view gallery */}
      <div 
        className="relative h-56 w-full overflow-hidden bg-gray-100 cursor-pointer"
        onClick={() => onViewGallery(car)}
      >
        <img 
          src={car.imageBase64} 
          alt={car.name} 
          className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent opacity-60"></div>
        
        {/* Rating Badge */}
        <div className="absolute top-4 right-4 bg-black/80 backdrop-blur-md px-2 py-1 rounded-md flex items-center shadow-lg border border-white/10">
          <svg className="w-3 h-3 text-red-500 mr-1" fill="currentColor" viewBox="0 0 20 20"><path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" /></svg>
          <span className="text-xs font-bold text-white">{car.rating || 4.5}</span>
        </div>

        {/* Status Badge */}
        <div className="absolute top-4 left-4">
           {isSoldOut ? (
            <span className="bg-red-600/90 backdrop-blur text-white text-[10px] font-bold px-3 py-1.5 rounded-sm shadow-lg uppercase tracking-wider flex items-center gap-1">
              Sold Out
            </span>
          ) : (
            <span className="bg-emerald-600/90 backdrop-blur text-white text-[10px] font-bold px-3 py-1.5 rounded-sm shadow-lg uppercase tracking-wider flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-white"></span>
              {availableStock} Available
            </span>
          )}
        </div>

        {/* Hint for Gallery */}
        <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
            <span className="bg-black/70 backdrop-blur-md text-white text-xs font-bold px-4 py-2 rounded-full border border-white/20 flex items-center gap-2">
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
                View Gallery
            </span>
        </div>
      </div>

      {/* Content */}
      <div className="p-5 flex-1 flex flex-col relative">
        <div className="flex justify-between items-start">
             <div>
                <span className="text-[10px] font-bold text-red-600 uppercase tracking-widest">{car.category || 'Car'}</span>
                <h3 className="text-xl font-black text-gray-900 mb-1 leading-tight uppercase italic">{car.name}</h3>
             </div>
        </div>
        
        {/* Stock Meter */}
        <div className="mb-4 mt-2">
            <div className="flex justify-between text-[10px] font-bold uppercase tracking-wider text-gray-400 mb-1">
                <span>Stock Level</span>
                <div className="flex items-center gap-2">
                  <span>{availableStock} / {totalStock}</span>
                  {isOwner && (
                    <button 
                      onClick={(e) => {
                        e.stopPropagation();
                        onEditStock(car.id);
                      }}
                      className="text-red-600 hover:text-red-800 hover:bg-red-50 rounded p-0.5 transition-colors"
                      title="Edit Stock Quantity"
                    >
                      <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" /></svg>
                    </button>
                  )}
                </div>
            </div>
            <div className="w-full h-1.5 bg-gray-100 rounded-full overflow-hidden">
                <div 
                    className={`h-full rounded-full transition-all duration-500 ${isSoldOut ? 'bg-red-500' : 'bg-emerald-500'}`}
                    style={{ width: `${Math.min(100, (availableStock / totalStock) * 100)}%` }}
                ></div>
            </div>
        </div>

        {/* Specs Grid */}
        <div className="grid grid-cols-3 gap-2 mb-6 p-3 bg-gray-50 rounded-xl border border-gray-100">
          <div className="flex flex-col items-center justify-center text-center">
             <svg className="w-5 h-5 text-red-600 mb-1" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" /></svg>
             <span className="text-[10px] text-gray-600 font-bold uppercase">{car.fuelType}</span>
          </div>
          <div className="flex flex-col items-center justify-center text-center border-l border-r border-gray-200">
             <svg className="w-5 h-5 text-red-600 mb-1" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4" /></svg>
             <span className="text-[10px] text-gray-600 font-bold uppercase">{car.transmission === 'Automatic' ? 'Auto' : 'Manual'}</span>
          </div>
          <div className="flex flex-col items-center justify-center text-center">
             <svg className="w-5 h-5 text-red-600 mb-1" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" /></svg>
             <span className="text-[10px] text-gray-600 font-bold uppercase">{car.seats} Seats</span>
          </div>
        </div>
        
        <div className="flex items-end justify-between mb-4">
          <div>
            <span className="block text-gray-400 text-[10px] font-bold uppercase tracking-wider mb-0.5">Daily Rate</span>
            <span className="text-2xl font-black text-gray-900">₹{car.pricePerDay.toLocaleString('en-IN')}</span>
          </div>
        </div>

        <div className="mt-auto pt-4 border-t border-gray-100">
          {isOwner ? (
            <div className="flex gap-3">
              <button
                onClick={() => onToggleStatus(car.id, car.status)}
                className={`flex-1 py-2.5 rounded-xl font-bold text-xs uppercase tracking-wider transition-colors ${!isSoldOut ? 'bg-emerald-50 text-emerald-600 hover:bg-emerald-100' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}
              >
                {isSoldOut ? 'Force Available' : 'Force Sold Out'}
              </button>

              <button
                onClick={() => {
                  if (confirm('Are you sure you want to delete this car?')) onDelete(car.id);
                }}
                className="px-3 py-2.5 bg-red-50 text-red-600 rounded-xl hover:bg-red-100 transition-colors"
                title="Delete Vehicle"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z" clipRule="evenodd" />
                </svg>
              </button>
            </div>
          ) : (
            <button
              disabled={isSoldOut}
              className={`w-full py-3 rounded-xl font-bold shadow-lg transition-all flex items-center justify-center gap-2 group-hover:scale-[1.02] active:scale-[0.98] uppercase tracking-wider text-sm ${
                isSoldOut
                  ? 'bg-gray-200 text-gray-400 cursor-not-allowed shadow-none'
                  : 'bg-red-600 text-white hover:bg-red-700 shadow-red-600/30'
              }`}
              onClick={() => onBook(car)}
            >
              {isSoldOut ? 'Sold Out' : 'Book Now'}
              {!isSoldOut && (
                <svg className="w-4 h-4 transition-transform group-hover:translate-x-1" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" /></svg>
              )}
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default CarCard;
