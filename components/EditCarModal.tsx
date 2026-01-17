
import React, { useState, useEffect } from 'react';
import { Car, FuelType, Transmission, CarCategory } from '../types';

interface EditCarModalProps {
  car: Car | null;
  isOpen: boolean;
  onClose: () => void;
  onSave: (id: string, updates: any) => void;
}

const EditCarModal: React.FC<EditCarModalProps> = ({ car, isOpen, onClose, onSave }) => {
  const [name, setName] = useState('');
  const [price, setPrice] = useState('');
  const [fuelType, setFuelType] = useState<FuelType>('Petrol');
  const [transmission, setTransmission] = useState<Transmission>('Manual');
  const [category, setCategory] = useState<CarCategory>('Hatchback');
  const [seats, setSeats] = useState<number>(5);
  const [rating, setRating] = useState<string>('4.5');
  const [totalStock, setTotalStock] = useState<string>('1');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (car && isOpen) {
      setName(car.name);
      setPrice(car.pricePerDay.toString());
      setFuelType(car.fuelType);
      setTransmission(car.transmission);
      setCategory(car.category);
      setSeats(car.seats);
      setRating(car.rating?.toString() || '4.5');
      setTotalStock(car.totalStock?.toString() || '1');
    }
  }, [car, isOpen]);

  if (!isOpen || !car) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    await onSave(car.id, {
      name,
      pricePerDay: Number(price),
      category,
      fuelType,
      transmission,
      seats,
      rating: Number(rating),
      totalStock: Number(totalStock)
    });
    setLoading(false);
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-gray-900/60 backdrop-blur-sm transition-opacity" onClick={onClose}></div>
      
      <div className="relative bg-white rounded-3xl shadow-2xl max-w-xl w-full overflow-hidden animate-fade-in flex flex-col max-h-[90vh]">
        <div className="bg-black p-6 text-white flex items-center justify-between">
            <div>
                <h2 className="text-xl font-black uppercase italic tracking-tighter">Edit Vehicle</h2>
                <p className="text-xs text-gray-400 font-bold uppercase tracking-widest mt-1">Ref: {car.id.slice(0, 8)}</p>
            </div>
            <button onClick={onClose} className="p-2 hover:bg-white/10 rounded-full transition-colors">
                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
            </button>
        </div>

        <div className="overflow-y-auto p-8">
            <form onSubmit={handleSubmit} className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="md:col-span-2">
                        <label className="block text-xs font-bold text-gray-400 uppercase tracking-widest mb-2">Model Name</label>
                        <input type="text" value={name} onChange={(e) => setName(e.target.value)} className="w-full px-4 py-3 border border-gray-200 rounded-xl bg-gray-50 focus:ring-2 focus:ring-red-600 outline-none" required />
                    </div>

                    <div>
                        <label className="block text-xs font-bold text-gray-400 uppercase tracking-widest mb-2">Category</label>
                        <select value={category} onChange={(e) => setCategory(e.target.value as CarCategory)} className="w-full px-4 py-3 border border-gray-200 rounded-xl bg-white focus:ring-2 focus:ring-red-600 outline-none">
                            <option value="Hatchback">Hatchback</option>
                            <option value="Sedan">Sedan</option>
                            <option value="SUV">SUV</option>
                        </select>
                    </div>

                    <div>
                        <label className="block text-xs font-bold text-gray-400 uppercase tracking-widest mb-2">Price per Day (₹)</label>
                        <input type="number" min="0" value={price} onChange={(e) => setPrice(e.target.value)} className="w-full px-4 py-3 border border-gray-200 rounded-xl bg-gray-50 focus:ring-2 focus:ring-red-600 outline-none" required />
                    </div>

                    <div>
                        <label className="block text-xs font-bold text-gray-400 uppercase tracking-widest mb-2">Total Stock</label>
                        <input type="number" min="1" value={totalStock} onChange={(e) => setTotalStock(e.target.value)} className="w-full px-4 py-3 border border-gray-200 rounded-xl bg-gray-50 focus:ring-2 focus:ring-red-600 outline-none" required />
                    </div>

                    <div>
                        <label className="block text-xs font-bold text-gray-400 uppercase tracking-widest mb-2">Rating</label>
                        <input type="number" step="0.1" min="0" max="5" value={rating} onChange={(e) => setRating(e.target.value)} className="w-full px-4 py-3 border border-gray-200 rounded-xl bg-gray-50 focus:ring-2 focus:ring-red-600 outline-none" required />
                    </div>

                    <div className="md:col-span-2 grid grid-cols-3 gap-4">
                        <div>
                            <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-2">Fuel</label>
                            <select value={fuelType} onChange={(e) => setFuelType(e.target.value as FuelType)} className="w-full p-2.5 border border-gray-200 rounded-lg bg-white">
                                <option>Petrol</option>
                                <option>Diesel</option>
                                <option>Electric</option>
                                <option>Hybrid</option>
                            </select>
                        </div>
                        <div>
                            <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-2">Trans.</label>
                            <select value={transmission} onChange={(e) => setTransmission(e.target.value as Transmission)} className="w-full p-2.5 border border-gray-200 rounded-lg bg-white">
                                <option>Manual</option>
                                <option>Automatic</option>
                            </select>
                        </div>
                        <div>
                            <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-2">Seats</label>
                            <select value={seats} onChange={(e) => setSeats(Number(e.target.value))} className="w-full p-2.5 border border-gray-200 rounded-lg bg-white">
                                <option value={2}>2 Seater</option>
                                <option value={4}>4 Seater</option>
                                <option value={5}>5 Seater</option>
                                <option value={7}>7 Seater</option>
                            </select>
                        </div>
                    </div>
                </div>
                
                <div className="pt-6">
                    <button 
                        disabled={loading} 
                        type="submit" 
                        className="w-full bg-red-600 hover:bg-red-700 text-white font-black py-4 px-6 rounded-xl shadow-lg transition-all uppercase tracking-widest text-sm disabled:opacity-50"
                    >
                        {loading ? 'Updating Vehicle...' : 'Save Changes'}
                    </button>
                </div>
            </form>
        </div>
      </div>
    </div>
  );
};

export default EditCarModal;
