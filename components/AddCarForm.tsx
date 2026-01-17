
import React, { useState, useRef } from 'react';
import { FuelType, Transmission, CarCategory } from '../types';

interface AddCarFormProps {
  onAddCar: (data: any) => void;
}

const AddCarForm: React.FC<AddCarFormProps> = ({ onAddCar }) => {
  const [name, setName] = useState('');
  const [price, setPrice] = useState('');
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [mainImageBase64, setMainImageBase64] = useState<string>('');
  
  const [galleryPreviews, setGalleryPreviews] = useState<string[]>([]);
  const [galleryImagesBase64, setGalleryImagesBase64] = useState<string[]>([]);

  const [loading, setLoading] = useState(false);
  
  const [fuelType, setFuelType] = useState<FuelType>('Petrol');
  const [transmission, setTransmission] = useState<Transmission>('Manual');
  const [category, setCategory] = useState<CarCategory>('Hatchback');
  const [seats, setSeats] = useState<number>(5);
  const [rating, setRating] = useState<string>('4.5');
  const [totalStock, setTotalStock] = useState<string>('1');

  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const galleryInputRef = useRef<HTMLInputElement>(null);

  const convertToBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.readAsDataURL(file);
        reader.onload = () => resolve(reader.result as string);
        reader.onerror = error => reject(error);
    });
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (f) {
        if (!f.type.startsWith('image/')) {
            alert('Please upload an image file');
            return;
        }
        const base64 = await convertToBase64(f);
        setMainImageBase64(base64);
        setImagePreview(base64);
    }
  };

  const handleGalleryChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files) {
        const newPreviews: string[] = [];
        const newBase64s: string[] = [];

        for (let i = 0; i < files.length; i++) {
            const file = files[i];
            if (file.type.startsWith('image/')) {
                const base64 = await convertToBase64(file);
                newPreviews.push(base64);
                newBase64s.push(base64);
            }
        }
        setGalleryPreviews(prev => [...prev, ...newPreviews]);
        setGalleryImagesBase64(prev => [...prev, ...newBase64s]);
    }
  };

  const removeGalleryImage = (index: number) => {
    setGalleryPreviews(prev => prev.filter((_, i) => i !== index));
    setGalleryImagesBase64(prev => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !price || !mainImageBase64 || !totalStock) {
      alert('Please fill in all fields and provide the main image.');
      return;
    }
    setLoading(true);

    const carPayload = {
        name,
        price,
        image: mainImageBase64,
        gallery: galleryImagesBase64,
        fuelType,
        transmission,
        category,
        seats: seats.toString(),
        rating,
        totalStock
    };

    await onAddCar(carPayload);
    setLoading(false);

    // Reset form
    setName('');
    setPrice('');
    setImagePreview(null);
    setMainImageBase64('');
    setGalleryPreviews([]);
    setGalleryImagesBase64([]);
    if (fileInputRef.current) fileInputRef.current.value = '';
    if (galleryInputRef.current) galleryInputRef.current.value = '';
  };

  return (
    <div className="bg-white rounded-2xl shadow-xl border border-gray-100 p-8 mb-12 animate-fade-in relative overflow-hidden">
      <div className="absolute top-0 right-0 w-32 h-32 bg-red-50 rounded-bl-full -z-0"></div>
      
      <h2 className="text-2xl font-bold text-gray-900 mb-8 flex items-center relative z-10">
        <span className="bg-red-600 text-white p-2.5 rounded-xl mr-3 shadow-lg shadow-red-600/20">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
          </svg>
        </span>
        Add Vehicle to Fleet
      </h2>
      
      <form onSubmit={handleSubmit} className="space-y-8 relative z-10">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          <div className="lg:col-span-1 space-y-6">
             {/* Main Image */}
             <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Main Thumbnail</label>
                <div
                    className={`border-2 border-dashed rounded-2xl h-48 flex flex-col items-center justify-center text-center transition-all cursor-pointer relative overflow-hidden group ${
                        isDragging ? 'border-red-500 bg-red-50' : 'border-gray-300 hover:border-red-400 hover:bg-gray-50'
                    }`}
                    onClick={() => fileInputRef.current?.click()}
                >
                    {imagePreview ? (
                        <>
                        <img src={imagePreview} alt="Preview" className="absolute inset-0 w-full h-full object-cover" />
                        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white font-medium">Change Image</div>
                        </>
                    ) : (
                        <div className="space-y-2 p-4">
                            <span className="text-sm text-gray-500">Click to upload Main Photo</span>
                        </div>
                    )}
                    <input ref={fileInputRef} type="file" className="hidden" accept="image/*" onChange={handleFileChange} />
                </div>
             </div>

             {/* Gallery Images */}
             <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Gallery Images</label>
                <div className="grid grid-cols-3 gap-2 mb-2">
                    {galleryPreviews.map((src, idx) => (
                        <div key={idx} className="relative h-16 rounded-lg overflow-hidden group">
                            <img src={src} className="w-full h-full object-cover" alt="gallery" />
                            <button 
                                type="button" 
                                onClick={() => removeGalleryImage(idx)}
                                className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 flex items-center justify-center text-white transition-opacity"
                            >
                                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                            </button>
                        </div>
                    ))}
                    <div 
                        onClick={() => galleryInputRef.current?.click()}
                        className="h-16 border-2 border-dashed border-gray-300 rounded-lg flex items-center justify-center cursor-pointer hover:bg-gray-50 hover:border-red-400"
                    >
                        <span className="text-2xl text-gray-400">+</span>
                    </div>
                </div>
                <input ref={galleryInputRef} type="file" className="hidden" accept="image/*" multiple onChange={handleGalleryChange} />
             </div>
          </div>

          <div className="lg:col-span-2 grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="md:col-span-2">
              <label className="block text-sm font-semibold text-gray-700 mb-2">Model Name</label>
              <input type="text" value={name} onChange={(e) => setName(e.target.value)} className="w-full px-4 py-3 border border-gray-200 rounded-xl bg-gray-50" placeholder="e.g. Toyota Fortuner" required />
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">Category</label>
              <select value={category} onChange={(e) => setCategory(e.target.value as CarCategory)} className="w-full px-4 py-3 border border-gray-200 rounded-xl bg-white">
                  <option value="Hatchback">Hatchback</option>
                  <option value="Sedan">Sedan</option>
                  <option value="SUV">SUV</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">Price per Day</label>
              <input type="number" min="0" value={price} onChange={(e) => setPrice(e.target.value)} className="w-full px-4 py-3 border border-gray-200 rounded-xl bg-gray-50" required />
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">Total Stock</label>
              <input type="number" min="1" value={totalStock} onChange={(e) => setTotalStock(e.target.value)} className="w-full px-4 py-3 border border-gray-200 rounded-xl bg-gray-50" required />
            </div>

            <div className="md:col-span-2 grid grid-cols-3 gap-4">
              <div>
                <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">Fuel</label>
                <select value={fuelType} onChange={(e) => setFuelType(e.target.value as FuelType)} className="w-full p-2.5 border border-gray-200 rounded-lg bg-white">
                  <option>Petrol</option>
                  <option>Diesel</option>
                  <option>Electric</option>
                  <option>Hybrid</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">Trans.</label>
                <select value={transmission} onChange={(e) => setTransmission(e.target.value as Transmission)} className="w-full p-2.5 border border-gray-200 rounded-lg bg-white">
                  <option>Manual</option>
                  <option>Automatic</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">Seats</label>
                <select value={seats} onChange={(e) => setSeats(Number(e.target.value))} className="w-full p-2.5 border border-gray-200 rounded-lg bg-white">
                  <option value={2}>2 Seater</option>
                  <option value={4}>4 Seater</option>
                  <option value={5}>5 Seater</option>
                  <option value={7}>7 Seater</option>
                </select>
              </div>
            </div>
          </div>
        </div>
        
        <div className="pt-4 border-t border-gray-100">
             <button disabled={loading} type="submit" className="w-full bg-black hover:bg-gray-800 text-white font-bold py-4 px-6 rounded-xl shadow-lg transition-all uppercase tracking-wider text-sm disabled:opacity-50">
              {loading ? 'Processing Images & Adding...' : 'Add Vehicle'}
            </button>
        </div>
      </form>
    </div>
  );
};

export default AddCarForm;
