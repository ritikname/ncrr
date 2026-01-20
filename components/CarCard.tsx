
import React from 'react';
import { Car, ViewMode } from '../types';

interface CarCardProps {
  car: Car;
  viewMode: ViewMode;
  bookedCount: number;
  onToggleStatus: (id: string, currentStatus: 'available' | 'sold') => void;
  onDelete: (id: string) => void;
  onBook: (car: Car) => void;
  onEdit: (car: Car) => void;
  onViewGallery: (car: Car) => void;
  index: number;
}

const CarCard: React.FC<CarCardProps> = ({ car, viewMode, bookedCount, onToggleStatus, onDelete, onBook, onEdit, onViewGallery, index }) => {
  const isOwner = viewMode === 'owner';
  
  // Dynamic Availability Calculation
  const totalStock = car.totalStock || 1;
  const availableStock = Math.max(0, totalStock - bookedCount);
  const isSoldOut = availableStock === 0;

  return (
    <div 
      className={`group bg-white rounded-2xl border border-gray-100 flex flex-col h-full overflow-hidden transition-all duration-300 hover:shadow-xl hover:border-red-600/30 hover:-translate-y-1 ${isSoldOut && !isOwner ? 'opacity-75 grayscale-[0.5]' : ''}`}
      style={{ animation: `fadeIn 0.5s ease-out ${index * 0.1}s backwards` }}
    >
      
      {/* Top Section: Image */}
      <div 
        className="relative aspect-[16/9] bg-gray-100 overflow-hidden cursor-pointer"
        onClick={() => onViewGallery(car)}
      >
        <img 
          src={car.imageBase64} 
          alt={car.name} 
          className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>

        {/* Status Badge (Top-Left) */}
        <div className="absolute top-3 left-3 z-10">
          {isSoldOut ? (
             <span className="bg-red-600 text-white text-[10px] font-bold px-2.5 py-1 rounded shadow-sm uppercase tracking-wider">
               Sold Out
             </span>
          ) : (
             <span className="bg-emerald-500 text-white text-[10px] font-bold px-2.5 py-1 rounded shadow-sm uppercase tracking-wider flex items-center gap-1">
               <span className="w-1.5 h-1.5 rounded-full bg-white animate-pulse"></span>
               Available
             </span>
          )}
        </div>

        {/* Rating Badge (Top-Right) */}
        <div className="absolute top-3 right-3 z-10 bg-white/95 backdrop-blur-sm px-2 py-1 rounded shadow-sm flex items-center border border-gray-100">
           <svg className="w-3 h-3 text-yellow-500 mr-1 fill-current" viewBox="0 0 20 20">
             <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
           </svg>
           <span className="text-xs font-bold text-gray-800">{car.rating || 4.5}</span>
        </div>
      </div>

      {/* Middle Section: Details */}
      <div className="p-5 flex-1 flex flex-col">
        <div className="mb-4">
          <span className="text-xs font-bold text-red-600 uppercase tracking-widest block mb-1">{car.category || 'Vehicle'}</span>
          <h3 className="text-xl font-black text-gray-900 leading-tight group-hover:text-red-700 transition-colors line-clamp-1" title={car.name}>
            {car.name}
          </h3>
        </div>

        {/* Specs Grid */}
        <div className="grid grid-cols-3 gap-0 border-t border-b border-gray-100 py-3 mb-4">
          <div className="flex flex-col items-center justify-center text-center px-2">
            <svg className="w-4 h-4 text-gray-400 mb-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
            </svg>
            <span className="text-[10px] font-bold text-gray-600 uppercase tracking-tight">{car.fuelType}</span>
          </div>
          <div className="flex flex-col items-center justify-center text-center px-2 border-l border-r border-gray-100">
            <svg className="w-4 h-4 text-gray-400 mb-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4" />
            </svg>
            <span className="text-[10px] font-bold text-gray-600 uppercase tracking-tight">{car.transmission === 'Automatic' ? 'Auto' : 'Manual'}</span>
          </div>
          <div className="flex flex-col items-center justify-center text-center px-2">
            <svg className="w-4 h-4 text-gray-400 mb-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
               <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
            </svg>
            <span className="text-[10px] font-bold text-gray-600 uppercase tracking-tight">{car.seats} Seats</span>
          </div>
        </div>
        
        {/* Stock Indicator */}
         <div className="flex items-center gap-2 mb-4">
             <div className="flex-1 h-1.5 bg-gray-100 rounded-full overflow-hidden">
                <div 
                    className={`h-full rounded-full transition-all duration-500 ${isSoldOut ? 'bg-red-500' : 'bg-emerald-500'}`}
                    style={{ width: `${Math.min(100, (availableStock / totalStock) * 100)}%` }}
                ></div>
             </div>
             <span className="text-[10px] font-bold text-gray-400 uppercase whitespace-nowrap">{availableStock} Left</span>
             {isOwner && (
               <button 
                onClick={(e) => { e.stopPropagation(); onEdit(car); }}
                className="text-gray-400 hover:text-red-600 transition-colors"
                title="Edit Details"
               >
                 <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" /></svg>
               </button>
             )}
         </div>

        {/* Bottom Section */}
        <div className="mt-auto">
           <div className="flex items-end gap-1 mb-4">
              <span className="text-2xl font-black text-gray-900">₹{car.pricePerDay.toLocaleString('en-IN')}</span>
              <span className="text-xs font-bold text-gray-400 mb-1.5 uppercase">/ Day</span>
           </div>

           {isOwner ? (
             <div className="grid grid-cols-2 gap-2">
                <button
                   onClick={() => onToggleStatus(car.id, car.status)}
                   className={`py-2 rounded-lg text-xs font-bold uppercase tracking-wider transition-colors ${!isSoldOut ? 'bg-emerald-50 text-emerald-600 hover:bg-emerald-100' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}
                >
                   {isSoldOut ? 'Make Available' : 'Mark Sold'}
                </button>
                <button
                   onClick={() => { if(confirm('Delete car?')) onDelete(car.id); }}
                   className="py-2 rounded-lg bg-red-50 text-red-600 hover:bg-red-100 text-xs font-bold uppercase tracking-wider transition-colors"
                >
                   Delete
                </button>
             </div>
           ) : (
             <button
                onClick={() => onBook(car)}
                disabled={isSoldOut}
                className={`w-full py-3 rounded-lg font-bold text-sm uppercase tracking-widest shadow-lg hover:shadow-xl transition-all active:scale-[0.98] ${
                    isSoldOut 
                    ? 'bg-gray-200 text-gray-400 cursor-not-allowed shadow-none' 
                    : 'bg-red-600 text-white hover:bg-red-700 shadow-red-600/30'
                }`}
             >
                {isSoldOut ? 'Unavailable' : 'Book Now'}
             </button>
           )}
        </div>
      </div>
    </div>
  );
};

export default CarCard;
