import React, { useState, useEffect } from 'react';
import { Routes, Route } from 'react-router-dom';
import Header from './components/Header';
import CarCard from './components/CarCard';
import Hero from './components/Hero';
import CarFilters from './components/CarFilters';
import DriftingLoader from './components/DriftingLoader';
import BookingModal from './components/BookingModal';
import EditCarModal from './components/EditCarModal';
import AuthModal from './components/AuthModal';
import OwnerBookings from './components/OwnerBookings';
import OwnerSettings from './components/OwnerSettings';
import OwnerUsersList from './components/OwnerUsersList';
import AddCarForm from './components/AddCarForm';
import Toast from './components/Toast';
import WhyChooseUs from './components/WhyChooseUs';
import FAQ from './components/FAQ';
import Login from './pages/Login';
import Signup from './pages/Signup';
import ForgotPassword from './pages/ForgotPassword';
import ResetPassword from './pages/ResetPassword';
import { Car, ViewMode, Booking, HeroSlide, UserProfile } from './types';
import { api } from './services/api';
import { useAuth } from './context/AuthContext';
import { STORAGE_KEYS } from './constants';

type OwnerTab = 'fleet' | 'bookings' | 'users' | 'settings';

export const App: React.FC = () => {
  const { user, loading: authLoading } = useAuth();
  const [viewMode, setViewMode] = useState<ViewMode>('customer');
  const [cars, setCars] = useState<Car[]>([]);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [usersList, setUsersList] = useState<(UserProfile & { joinedAt: number })[]>([]);
  
  // Public Availability (Limited Data)
  const [publicBookings, setPublicBookings] = useState<{car_id: string, start_date: string, end_date: string}[]>([]);

  // Owner Dashboard State
  const [ownerTab, setOwnerTab] = useState<OwnerTab>('fleet');
  const [showAddCarForm, setShowAddCarForm] = useState(false);

  // Settings State
  const [qrCode, setQrCode] = useState<string>('');
  const [heroSlides, setHeroSlides] = useState<HeroSlide[]>([]);

  // Search & Filter State
  const [hasSearched, setHasSearched] = useState(false);
  const [searchCriteria, setSearchCriteria] = useState({ location: '', start: '', end: '' });
  const [filters, setFilters] = useState({ category: 'All', transmission: 'All', fuelType: 'All' });

  const [loadingPhase, setLoadingPhase] = useState<'drift' | 'ready'>('drift');
  const [toast, setToast] = useState<{message: string, type: 'success' | 'error' | 'info'} | null>(null);

  // Modal State
  const [selectedCar, setSelectedCar] = useState<Car | null>(null);
  const [carToEdit, setCarToEdit] = useState<Car | null>(null);
  const [isBookingModalOpen, setIsBookingModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);

  useEffect(() => {
    localStorage.removeItem(STORAGE_KEYS.CARS);
    localStorage.removeItem(STORAGE_KEYS.VIEW_MODE);
  }, []);

  // Data Fetching Function
  const fetchData = async () => {
      try {
        const carsData = await api.cars.getAll();
        setCars(carsData);
        
        // Fetch Settings & Public Availability
        const settings = await api.settings.get();
        if (settings.paymentQr) setQrCode(settings.paymentQr);
        if (settings.heroSlides) setHeroSlides(settings.heroSlides);

        const avail = await api.bookings.getAvailability();
        setPublicBookings(avail);

        if (user) {
          const bookingsData = await api.bookings.getMyBookings();
          setBookings(bookingsData);
          
          if (user.role === 'owner') {
             const uList = await api.users.getAll();
             setUsersList(uList);
          }
        }
      } catch (err) {
        console.error("Failed to load data", err);
        showToast("Connection Error: Failed to load data", "error");
      }
  };

  useEffect(() => {
    // Initial Load
    fetchData().finally(() => {
       setTimeout(() => setLoadingPhase('ready'), 2000);
    });
  }, [user]);

  const handleRefresh = () => {
      fetchData();
      showToast("Dashboard updated", "success");
  };

  const showToast = (message: string, type: 'success' | 'error' | 'info' = 'success') => {
    setToast({ message, type });
  };

  // --- Search & Filter Logic ---
  
  const handleSearch = (criteria: { location: string; start: string; end: string }) => {
     setSearchCriteria(criteria);
     setHasSearched(true);
     showToast("Searching for cars...", "info");
  };

  const handleFilterChange = (key: string, value: string) => {
      setFilters(prev => ({ ...prev, [key]: value }));
  };

  // Helper to count active/conflicting bookings for a car
  const getBookedCount = (carId: string) => {
     let checkStart = new Date().getTime();
     let checkEnd = new Date().getTime();

     // If user searched for dates, check overlap with search range
     if (hasSearched && searchCriteria.start && searchCriteria.end) {
         checkStart = new Date(searchCriteria.start).getTime();
         checkEnd = new Date(searchCriteria.end).getTime();
     }

     return publicBookings.filter(b => {
         if (b.car_id !== carId) return false;
         const bStart = new Date(b.start_date).getTime();
         const bEnd = new Date(b.end_date).getTime();
         // Check overlap (or if checking TODAY, if today falls within booking)
         return (checkStart <= bEnd && bStart <= checkEnd);
     }).length;
  };

  const filteredCars = cars.filter(car => {
      // 1. Static Attribute Filters
      if (filters.category !== 'All' && car.category !== filters.category) return false;
      if (filters.transmission !== 'All' && car.transmission !== filters.transmission) return false;
      if (filters.fuelType !== 'All' && car.fuelType !== filters.fuelType) return false;
      
      // 2. Availability Filter (Only if searched)
      if (hasSearched && searchCriteria.start && searchCriteria.end) {
          const booked = getBookedCount(car.id);
          // If conflicts >= totalStock, car is unavailable
          if (booked >= (car.totalStock || 1)) {
              return false; // Hide unavailable cars
          }
      }

      return true;
  });

  // --- Handlers ---

  const handleBookClick = (car: Car) => {
    setSelectedCar(car);
    if (user) {
      setIsBookingModalOpen(true);
    } else {
      setIsAuthModalOpen(true);
    }
  };

  const handleEditClick = (car: Car) => {
    setCarToEdit(car);
    setIsEditModalOpen(true);
  };

  const handleAuthSuccess = () => {
    setIsAuthModalOpen(false);
    showToast("Logged in successfully!");
    if (selectedCar) {
      setIsBookingModalOpen(true);
    }
  };

  const handleAddCar = async (formData: FormData) => {
    try {
      const res = await api.cars.add(formData);
      if (res.success) {
        showToast("Car added successfully");
        setShowAddCarForm(false);
        fetchData(); 
      }
    } catch (e) {
      showToast("Failed to add car", "error");
    }
  };

  const handleUpdateCar = async (id: string, updates: any) => {
    try {
      await api.cars.update(id, updates);
      showToast("Vehicle updated successfully");
      setIsEditModalOpen(false);
      fetchData();
    } catch (e) {
      showToast("Failed to update vehicle", "error");
    }
  };

  const handleToggleCarStatus = async (id: string, currentStatus: 'available' | 'sold') => {
    try {
      const newStatus = currentStatus === 'available' ? 'sold' : 'available';
      await api.cars.updateStatus(id, newStatus);
      showToast(`Car marked as ${newStatus}`);
      fetchData();
    } catch (e) {
      showToast("Failed to update status", "error");
    }
  };

  const handleDeleteCar = async (id: string) => {
    try {
      await api.cars.delete(id);
      showToast("Car deleted successfully");
      fetchData();
    } catch (e) {
      showToast("Failed to delete car", "error");
    }
  };

  const handleBooking = async (bookingData: any) => {
    try {
      const res = await api.bookings.create(bookingData);
      if (res.success) {
        showToast("Booking request sent!", "success");
        setIsBookingModalOpen(false);
        fetchData();
      }
    } catch (e) {
      showToast("Booking failed", "error");
    }
  };

  const handleApproveBooking = async (id: string) => {
     try {
       await api.bookings.updateStatus(id, { isApproved: true });
       showToast("Booking Approved", "success");
       // Refetch everything to update availability
       fetchData();
     } catch (e) {
       showToast("Failed to approve", "error");
     }
  };

  const handleRejectBooking = async (id: string) => {
      try {
       await api.bookings.updateStatus(id, { status: 'cancelled' });
       showToast("Booking Rejected", "info");
       // Refetch everything to update availability
       fetchData();
     } catch (e) {
       showToast("Failed to reject", "error");
     }
  };

  const handleSaveQr = async (newQr: string) => {
    try {
        await api.settings.update({ paymentQr: newQr });
        setQrCode(newQr);
        showToast("QR Code Updated", "success");
    } catch (e) {
        showToast("Failed to save QR Code", "error");
    }
  };

  const handleSaveSlides = async (newSlides: HeroSlide[]) => {
    try {
        await api.settings.update({ heroSlides: newSlides });
        setHeroSlides(newSlides);
        showToast("Slides Updated", "success");
    } catch (e) {
        showToast("Failed to save Slides", "error");
    }
  };

  if (loadingPhase === 'drift' || authLoading) return <DriftingLoader />;

  const WHATSAPP_LINK = "https://wa.link/cr2zns";

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col font-sans text-gray-900 overflow-x-hidden relative">
      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
      <Header viewMode={viewMode} onToggleView={setViewMode} />

      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/signup" element={<Signup />} />
        <Route path="/forgot-password" element={<ForgotPassword />} />
        <Route path="/reset-password" element={<ResetPassword />} />
        
        <Route path="/" element={
           <main className="flex-grow max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
             {viewMode === 'customer' || !user || user.role !== 'owner' ? (
                // --- CUSTOMER VIEW ---
                <div className="animate-fade-in space-y-8">
                  <Hero 
                    slides={heroSlides} 
                    onSearch={handleSearch}
                  />

                  {/* Car Listings / Search Results */}
                  {hasSearched ? (
                     <div id="fleet-section">
                        <CarFilters filters={filters} onFilterChange={handleFilterChange} resultCount={filteredCars.length} />
                        
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8 pb-12">
                           {filteredCars.length > 0 ? (
                              filteredCars.map((car, index) => (
                                 <CarCard
                                    key={car.id}
                                    car={car}
                                    viewMode={'customer'}
                                    bookedCount={getBookedCount(car.id)} 
                                    onToggleStatus={() => {}}
                                    onDelete={() => {}}
                                    onBook={handleBookClick}
                                    onEdit={() => {}}
                                    onViewGallery={() => {}}
                                    index={index}
                                 />
                              ))
                           ) : (
                              <div className="col-span-full text-center py-20 text-gray-500 bg-white rounded-3xl border border-gray-100">
                                 <div className="text-4xl mb-4">😔</div>
                                 <p className="text-lg font-bold">No cars available for these dates/filters.</p>
                                 <p className="text-sm">Try changing your dates or filters.</p>
                              </div>
                           )}
                        </div>
                     </div>
                  ) : (
                     <div className="text-center py-20 bg-gradient-to-br from-white to-gray-50 rounded-3xl border border-gray-100 shadow-sm">
                        <div className="w-20 h-20 bg-red-50 rounded-full flex items-center justify-center mx-auto mb-6 text-3xl">
                           📅
                        </div>
                        <h3 className="text-2xl font-black text-gray-900 mb-2">Ready to Drive?</h3>
                        <p className="text-gray-500 max-w-md mx-auto">
                           Please select your <strong>Pick-up Location</strong> and <strong>Travel Dates</strong> above to view available cars.
                        </p>
                     </div>
                  )}

                  {/* Why Choose Us Section - NOW BELOW CARS */}
                  <WhyChooseUs />

                  {/* FAQ Section */}
                  <FAQ />

                </div>
             ) : (
                // --- OWNER VIEW (TABBED) ---
                <div className="animate-fade-in space-y-8">
                   <div className="bg-black text-white p-6 rounded-3xl text-center flex flex-col items-center justify-center relative">
                      <h2 className="text-2xl font-bold mb-2">Admin Dashboard</h2>
                      <p className="opacity-70">Manage your fleet, users, and bookings.</p>
                      <button 
                        onClick={handleRefresh}
                        className="absolute right-6 top-1/2 -translate-y-1/2 bg-white/10 hover:bg-white/20 p-2 rounded-full transition-all"
                        title="Refresh Data"
                      >
                         <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                           <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                         </svg>
                      </button>
                   </div>
                   
                   {/* TAB NAVIGATION */}
                   <div className="flex flex-wrap gap-2 bg-white p-2 rounded-2xl shadow-sm border border-gray-100 sticky top-20 z-40">
                      {[
                        { id: 'fleet', label: 'Fleet & Cars', icon: '🚗' },
                        { id: 'bookings', label: 'Bookings', icon: '📅' },
                        { id: 'users', label: 'Users', icon: '👥' },
                        { id: 'settings', label: 'Settings', icon: '⚙️' }
                      ].map((tab) => (
                         <button
                            key={tab.id}
                            onClick={() => setOwnerTab(tab.id as OwnerTab)}
                            className={`flex-1 flex items-center justify-center gap-2 py-3 px-4 rounded-xl font-bold text-sm transition-all ${
                               ownerTab === tab.id 
                               ? 'bg-red-600 text-white shadow-lg shadow-red-500/30' 
                               : 'bg-transparent text-gray-500 hover:bg-gray-50 hover:text-gray-900'
                            }`}
                         >
                            <span className="text-lg">{tab.icon}</span>
                            <span className="hidden sm:inline">{tab.label}</span>
                         </button>
                      ))}
                   </div>

                   {/* --- FLEET TAB --- */}
                   {ownerTab === 'fleet' && (
                      <div className="space-y-6 animate-fade-in">
                         {/* Collapsible Add Car Form */}
                         <div className="bg-white rounded-3xl border border-gray-100 overflow-hidden shadow-sm">
                            <button 
                              onClick={() => setShowAddCarForm(!showAddCarForm)}
                              className="w-full p-4 flex items-center justify-between text-left font-bold text-gray-700 hover:bg-gray-50 transition-colors"
                            >
                               <span className="flex items-center gap-2">
                                  <span className="bg-red-100 text-red-600 w-8 h-8 rounded-full flex items-center justify-center text-lg">+</span>
                                  Add New Vehicle
                               </span>
                               <svg className={`w-5 h-5 transition-transform ${showAddCarForm ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" /></svg>
                            </button>
                            {showAddCarForm && (
                               <div className="p-4 border-t border-gray-100">
                                  <AddCarForm onAddCar={handleAddCar} />
                               </div>
                            )}
                         </div>

                         {/* Car Grid for Owners */}
                         <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
                            {cars.length > 0 ? (
                                cars.map((car, index) => (
                                  <CarCard
                                      key={car.id}
                                      car={car}
                                      viewMode={'owner'}
                                      bookedCount={getBookedCount(car.id)}
                                      onToggleStatus={handleToggleCarStatus}
                                      onDelete={handleDeleteCar}
                                      onBook={() => {}}
                                      onEdit={handleEditClick}
                                      onViewGallery={() => {}}
                                      index={index}
                                  />
                                ))
                            ) : (
                                <div className="col-span-full py-24 text-center text-gray-400 bg-white rounded-3xl border border-dashed border-gray-200">
                                   <p>Your fleet is empty. Add a car to get started.</p>
                                </div>
                            )}
                         </div>
                      </div>
                   )}

                   {/* --- BOOKINGS TAB --- */}
                   {ownerTab === 'bookings' && (
                      <OwnerBookings 
                          bookings={bookings} 
                          onApprove={handleApproveBooking} 
                          onReject={handleRejectBooking} 
                      />
                   )}

                   {/* --- USERS TAB --- */}
                   {ownerTab === 'users' && (
                      <OwnerUsersList users={usersList} />
                   )}

                   {/* --- SETTINGS TAB --- */}
                   {ownerTab === 'settings' && (
                      <OwnerSettings 
                          currentQrCode={qrCode}
                          heroSlides={heroSlides}
                          stats={{
                            totalCars: cars.length,
                            totalBookings: bookings.length,
                            totalUsers: usersList.length
                          }}
                          onSave={handleSaveQr} 
                          onSaveSlides={handleSaveSlides} 
                      />
                   )}
                </div>
             )}
           </main>
        } />
      </Routes>
      
      <AuthModal 
        isOpen={isAuthModalOpen}
        onClose={() => setIsAuthModalOpen(false)}
        onAuthSuccess={handleAuthSuccess}
      />

      <BookingModal 
        isOpen={isBookingModalOpen}
        car={selectedCar}
        onClose={() => setIsBookingModalOpen(false)}
        onConfirm={handleBooking}
        userProfile={user ? { name: user.name || '', phone: '' } : null}
        // Pass existing bookings to modal so it can double check conflicts inside the modal UI if needed
        existingBookings={publicBookings.map(b => ({ carId: b.car_id, startDate: b.start_date, endDate: b.end_date, status: 'confirmed' } as any))} 
        prefillDates={{ start: searchCriteria.start, end: searchCriteria.end }} // Pass search dates
        paymentQrCode={qrCode}
      />

      <EditCarModal 
        isOpen={isEditModalOpen}
        car={carToEdit}
        onClose={() => setIsEditModalOpen(false)}
        onSave={handleUpdateCar}
      />

      {/* Sticky WhatsApp Button */}
      <a 
         href={WHATSAPP_LINK}
         target="_blank" 
         rel="noopener noreferrer"
         className="fixed bottom-6 right-6 z-[60] bg-[#25D366] text-white p-4 rounded-full shadow-2xl hover:scale-110 transition-transform duration-300 flex items-center justify-center group"
         style={{ boxShadow: '0 0 20px rgba(37, 211, 102, 0.6)' }}
      >
          <div className="absolute inset-0 rounded-full border-2 border-[#25D366] animate-ping opacity-75"></div>
          <svg className="w-8 h-8 relative z-10" fill="currentColor" viewBox="0 0 24 24">
            <path d="M.057 24l1.687-6.163c-1.041-1.804-1.588-3.849-1.587-5.946.003-6.556 5.338-11.891 11.893-11.891 3.181.001 6.167 1.24 8.413 3.488 2.245 2.248 3.481 5.236 3.48 8.414-.003 6.557-5.338 11.892-11.893 11.892-1.99-.001-3.951-.5-5.688-1.448l-6.305 1.654zm6.597-3.807c1.676.995 3.276 1.591 5.392 1.592 5.448 0 9.886-4.434 9.889-9.885.002-5.462-4.415-9.89-9.881-9.892-5.452 0-9.887 4.434-9.889 9.884-.001 2.225.651 3.891 1.746 5.634l-.999 3.648 3.742-.981zm11.387-5.464c-.074-.124-.272-.198-.57-.347-.297-.149-1.758-.868-2.031-.967-.272-.099-.47-.149-.669.149-.198.297-.768.967-.941 1.165-.173.198-.347.223-.644.074-.297-.149-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.297-.347.446-.521.151-.172.2-.296.3-.495.099-.198.05-.372-.025-.521-.075-.148-.669-1.611-.916-2.206-.242-.579-.487-.501-.669-.51l-.57-.01c-.198 0-.52.074-.792.372s-1.04 1.016-1.04 2.479 1.065 2.876 1.213 3.074c.149.198 2.095 3.2 5.076 4.487.709.306 1.263.489 1.694.626.712.226 1.36.194 1.872.118.571-.085 1.758-.719 2.006-1.413.248-.695.248-1.29.173-1.414z"/></svg>
      </a>

      <footer className="bg-black text-white mt-auto py-12">
        <div className="max-w-7xl mx-auto px-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
            
            {/* Brand */}
            <div className="space-y-4">
               <div className="flex flex-col leading-none select-none">
                  <span className="text-3xl font-black text-red-600 tracking-tighter transform -skew-x-6">NCR</span>
                  <span className="text-3xl font-black text-white tracking-tighter transform -skew-x-6 -mt-2">DRIVE</span>
              </div>
              <p className="text-gray-400 text-sm max-w-xs">
                Delhi NCR's premium self-drive car rental service. Drive with freedom, drive with luxury.
              </p>
              <div className="flex gap-4 pt-2">
                 {/* Instagram */}
                 <a href="https://www.instagram.com/selfdrive.delhi?igsh=MWRhNTYwd3YyMnpjZA==" className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center hover:bg-red-600 transition-colors">
                    <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24"><path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/></svg>
                 </a>
              </div>
            </div>

            {/* Contact Details */}
            <div className="space-y-4">
              <h4 className="font-bold text-lg text-white uppercase italic">Contact Us</h4>
              <ul className="space-y-3">
                <li className="flex items-center gap-3 text-gray-400">
                  <div className="w-8 h-8 rounded-lg bg-white/5 flex items-center justify-center text-red-500">
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" /></svg>
                  </div>
                  <span>+91 98703 75798</span>
                </li>
                <li className="flex items-center gap-3 text-gray-400">
                  <div className="w-8 h-8 rounded-lg bg-white/5 flex items-center justify-center text-red-500">
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" /></svg>
                  </div>
                  <span>ncrdrivecar@gmail.com</span>
                </li>
                <li className="flex items-center gap-3 text-gray-400">
                  <div className="w-8 h-8 rounded-lg bg-white/5 flex items-center justify-center text-red-500">
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
                  </div>
                  <span>Delhi NCR (Serving Noida, Delhi, Gurgaon)</span>
                </li>
              </ul>
            </div>
          </div>
          
          <div className="border-t border-gray-800 pt-8 text-center text-xs text-gray-600">
             &copy; {new Date().getFullYear()} NCR Drive Rental Services. All rights reserved.
          </div>
        </div>
      </footer>
    </div>
  );
};