
import React, { useState, useEffect } from 'react';
import { Routes, Route } from 'react-router-dom';
import Header from './components/Header';
import CarCard from './components/CarCard';
import Hero from './components/Hero';
import CarFilters from './components/CarFilters';
import DriftingLoader from './components/DriftingLoader';
import BookingModal from './components/BookingModal';
import AuthModal from './components/AuthModal';
import OwnerBookings from './components/OwnerBookings';
import OwnerSettings from './components/OwnerSettings';
import OwnerUsersList from './components/OwnerUsersList';
import AddCarForm from './components/AddCarForm';
import Toast from './components/Toast';
import Login from './pages/Login';
import Signup from './pages/Signup';
import ForgotPassword from './pages/ForgotPassword';
import ResetPassword from './pages/ResetPassword';
import { Car, ViewMode, Booking, HeroSlide, UserProfile } from './types';
import { api } from './services/api';
import { useAuth } from './context/AuthContext';
import { STORAGE_KEYS } from './constants';

type OwnerTab = 'fleet' | 'bookings' | 'users' | 'settings';

const App: React.FC = () => {
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
  const [isBookingModalOpen, setIsBookingModalOpen] = useState(false);
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

  const filteredCars = cars.filter(car => {
      // 1. Static Attribute Filters
      if (filters.category !== 'All' && car.category !== filters.category) return false;
      if (filters.transmission !== 'All' && car.transmission !== filters.transmission) return false;
      if (filters.fuelType !== 'All' && car.fuelType !== filters.fuelType) return false;
      
      // 2. Availability Filter (Only if searched)
      if (hasSearched && searchCriteria.start && searchCriteria.end) {
          const searchStart = new Date(searchCriteria.start).getTime();
          const searchEnd = new Date(searchCriteria.end).getTime();
          
          // Count confirmed bookings for this car overlapping with search dates
          const conflictingBookings = publicBookings.filter(b => {
              if (b.car_id !== car.id) return false;
              const bStart = new Date(b.start_date).getTime();
              const bEnd = new Date(b.end_date).getTime();
              return (searchStart <= bEnd && bStart <= searchEnd);
          });

          // If conflicts >= totalStock, car is unavailable
          if (conflictingBookings.length >= (car.totalStock || 1)) {
              return false; // Hide unavailable cars? Or show as sold out? Prompt implies "shown", let's hide unavailable to be cleaner, or show as sold out if user wants?
              // Let's hide them to make "Search" feel like a filter.
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
       const updated = await api.bookings.getMyBookings();
       setBookings(updated);
     } catch (e) {
       showToast("Failed to approve", "error");
     }
  };

  const handleRejectBooking = async (id: string) => {
      try {
       await api.bookings.updateStatus(id, { status: 'cancelled' });
       showToast("Booking Rejected", "info");
       const updated = await api.bookings.getMyBookings();
       setBookings(updated);
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
                                    bookedCount={0} // Availability is filtered out by list, so remaining cars are effectively "available"
                                    onToggleStatus={() => {}}
                                    onDelete={() => {}}
                                    onBook={handleBookClick}
                                    onEditStock={() => {}}
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
                                      bookedCount={0}
                                      onToggleStatus={handleToggleCarStatus}
                                      onDelete={handleDeleteCar}
                                      onBook={() => {}}
                                      onEditStock={() => {}}
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
        existingBookings={[]} // Conflicts handled by filters now
        prefillDates={{ start: searchCriteria.start, end: searchCriteria.end }} // Pass search dates
        paymentQrCode={qrCode}
      />

      <footer className="bg-white border-t border-gray-100 mt-auto">
        <div className="max-w-7xl mx-auto py-8 px-4 flex justify-between items-center">
          <span className="font-bold text-gray-800">NCR DRIVE</span>
          <p className="text-sm text-gray-400">© {new Date().getFullYear()} NCR Drive. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
};

export default App;
