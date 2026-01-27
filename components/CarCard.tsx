
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
      className={`relative bg-white rounded-3xl p-5 shadow-sm border border-gray-100 hover:shadow-lg transition-all duration-300 ${isSoldOut && !isOwner ? 'opacity-75 grayscale-[0.5]' : ''}`}
      style={{ animation: `fadeIn 0.5s ease-out ${index * 0.1}s backwards` }}
    >
      {/* Top Row: Name and Category */}
      <div className="flex justify-between items-start mb-2">
        <div>
           <h3 className="text-lg font-extrabold text-gray-900 leading-tight">{car.name}</h3>
           {isOwner && (
               <div className="flex gap-2 mt-1">
                 <button onClick={() => onEdit(car)} className="text-xs text-blue-600 font-bold hover:underline">Edit</button>
                 <button onClick={() => onDelete(car.id)} className="text-xs text-red-600 font-bold hover:underline">Delete</button>
                 <button onClick={() => onToggleStatus(car.id, car.status)} className="text-xs text-green-600 font-bold hover:underline">{isSoldOut ? 'Restock' : 'Mark Sold'}</button>
               </div>
           )}
        </div>
        <span className="text-xs font-bold text-gray-500 uppercase tracking-wider">{car.category}</span>
      </div>

      <div className="flex gap-4">
        {/* Left Column: Image */}
        <div 
          className="w-32 h-24 flex-shrink-0 flex items-center justify-center bg-gray-50 rounded-xl cursor-pointer overflow-hidden"
          onClick={() => onViewGallery(car)}
        >
             <img 
               src={car.imageBase64} 
               className="w-full h-full object-contain transform hover:scale-110 transition-transform duration-500" 
               alt={car.name} 
               loading="lazy" 
             />
        </div>

        {/* Right Column: Specs & Actions */}
        <div className="flex-1 flex flex-col justify-between h-full min-h-[6rem]">
           
           {/* Row 1: Icons (Seats, Transmission, Fuel) */}
           <div className="flex items-center justify-between text-[10px] sm:text-xs text-gray-600 font-medium mb-3 mt-1">
              <div className="flex items-center gap-1.5" title={`${car.seats} Seater`}>
                 <svg className="w-3.5 h-3.5 text-red-500" fill="currentColor" viewBox="0 0 20 20">
                    <path d="M13 6a3 3 0 11-6 0 3 3 0 016 0zM18 8a2 2 0 11-4 0 2 2 0 014 0zM14 15a4 4 0 00-8 0v3h8v-3zM6 8a2 2 0 11-4 0 2 2 0 014 0zM16 18v-3a5.972 5.972 0 00-.75-2.906A3.005 3.005 0 0119 15v3h-3zM4.75 12.094A5.973 5.973 0 004 15v3H1v-3a3 3 0 013.75-2.906z" />
                 </svg>
                 <span>{car.seats} seater</span>
              </div>
              <div className="flex items-center gap-1.5" title={car.transmission}>
                 <svg className="w-3.5 h-3.5 text-red-500" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M11.3 1.046A1 1 0 0112 2v5h4a1 1 0 01.82 1.573l-7 10A1 1 0 018 18v-5H4a1 1 0 01-.82-1.573l7-10a1 1 0 011.12-.38z" clipRule="evenodd" />
                 </svg>
                 <span>{car.transmission === 'Automatic' ? 'Auto' : 'Manual'}</span>
              </div>
              <div className="flex items-center gap-1.5" title={car.fuelType}>
                 <svg className="w-3.5 h-3.5 text-red-500" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M4 4a2 2 0 00-2 2v4a2 2 0 002 2V6h10a2 2 0 00-2-2H4zm2 6a2 2 0 012-2h8a2 2 0 012 2v4a2 2 0 01-2 2H8a2 2 0 01-2-2v-4zm6 4a2 2 0 100-4 2 2 0 000 4z" clipRule="evenodd" />
                 </svg>
                 <span>{car.fuelType}</span>
              </div>
           </div>

           {/* Row 2: Price & Action */}
           <div className="flex items-end justify-between mt-auto">
              <div className="flex items-baseline">
                 <span className="text-xl font-black text-gray-900">₹{car.pricePerDay}</span>
              </div>
              
              {isOwner ? (
                <div className="text-[10px] font-bold text-gray-400 bg-gray-100 px-3 py-1 rounded-full">
                   {availableStock} Left
                </div>
              ) : (
                <button
                    onClick={() => onBook(car)}
                    disabled={isSoldOut}
                    className={`px-8 py-2 rounded-full font-bold text-sm shadow-lg transition-all active:scale-95 ${
                        isSoldOut 
                        ? 'bg-gray-200 text-gray-400 cursor-not-allowed shadow-none' 
                        : 'bg-[#FF4500] hover:bg-red-600 text-white shadow-orange-200'
                    }`}
                >
                    {isSoldOut ? 'SOLD' : 'BOOK'}
                </button>
              )}
           </div>

        </div>
      </div>
      
      {/* Stock Overlay for Owners (Optional Visual Aid) */}
      {isOwner && availableStock === 0 && (
         <div className="absolute top-4 right-4 bg-red-100 text-red-600 text-[10px] font-bold px-2 py-0.5 rounded">
            Out of Stock
         </div>
      )}
    </div>
  );
};

export default CarCard;
