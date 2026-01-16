
import React from 'react';
import { CarCategory, FuelType, Transmission } from '../types';

interface CarFiltersProps {
  filters: {
    category: string;
    transmission: string;
    fuelType: string;
  };
  onFilterChange: (key: string, value: string) => void;
  resultCount: number;
}

const CarFilters: React.FC<CarFiltersProps> = ({ filters, onFilterChange, resultCount }) => {
  return (
    <div className="bg-white p-4 rounded-2xl shadow-sm border border-gray-100 mb-8 flex flex-col md:flex-row items-center justify-between gap-4 animate-fade-in">
      <div className="flex items-center gap-4 flex-wrap w-full md:w-auto">
         {/* Category */}
         <div className="relative">
            <select 
                value={filters.category}
                onChange={(e) => onFilterChange('category', e.target.value)}
                className="appearance-none bg-gray-50 hover:bg-gray-100 border border-gray-200 text-gray-700 py-2 pl-4 pr-8 rounded-xl text-sm font-bold focus:outline-none focus:ring-2 focus:ring-red-600 cursor-pointer"
            >
                <option value="All">All Types</option>
                <option value="SUV">SUV</option>
                <option value="Sedan">Sedan</option>
                <option value="Hatchback">Hatchback</option>
            </select>
            <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-gray-500">
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" /></svg>
            </div>
         </div>

         {/* Transmission */}
         <div className="relative">
            <select 
                value={filters.transmission}
                onChange={(e) => onFilterChange('transmission', e.target.value)}
                className="appearance-none bg-gray-50 hover:bg-gray-100 border border-gray-200 text-gray-700 py-2 pl-4 pr-8 rounded-xl text-sm font-bold focus:outline-none focus:ring-2 focus:ring-red-600 cursor-pointer"
            >
                <option value="All">All Transmissions</option>
                <option value="Automatic">Automatic</option>
                <option value="Manual">Manual</option>
            </select>
            <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-gray-500">
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" /></svg>
            </div>
         </div>

         {/* Fuel */}
         <div className="relative">
            <select 
                value={filters.fuelType}
                onChange={(e) => onFilterChange('fuelType', e.target.value)}
                className="appearance-none bg-gray-50 hover:bg-gray-100 border border-gray-200 text-gray-700 py-2 pl-4 pr-8 rounded-xl text-sm font-bold focus:outline-none focus:ring-2 focus:ring-red-600 cursor-pointer"
            >
                <option value="All">All Fuels</option>
                <option value="Petrol">Petrol</option>
                <option value="Diesel">Diesel</option>
                <option value="Electric">Electric</option>
                <option value="Hybrid">Hybrid</option>
            </select>
            <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-gray-500">
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" /></svg>
            </div>
         </div>
      </div>

      <div className="text-gray-500 text-sm font-medium">
         Found <span className="text-black font-bold">{resultCount}</span> available cars
      </div>
    </div>
  );
};

export default CarFilters;
