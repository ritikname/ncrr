
import React, { useState, useEffect } from 'react';
import { Routes, Route } from 'react-router-dom';
import Header from './components/Header';
import CarCard from './components/CarCard';
import Hero from './components/Hero';
import DriftingLoader from './components/DriftingLoader';
import BookingModal from './components/BookingModal';
import AuthModal from './components/AuthModal';
import OwnerBookings from './components/OwnerBookings';
import OwnerSettings from './components/OwnerSettings';
import AddCarForm from './components/AddCarForm';
import Toast from './components/Toast';
import Login from './pages/Login';
import Signup from './pages/Signup';
import ForgotPassword from './pages/ForgotPassword';
import ResetPassword from './pages/ResetPassword';
import { Car, ViewMode, Booking, HeroSlide } from './types';
import { api } from './services/api';
import { useAuth } from './context/AuthContext';

const App: React.FC = () => {
  const { user, loading: authLoading } = useAuth();
  const [viewMode, setViewMode] = useState<ViewMode>('customer');
  const [cars, setCars] = useState<Car[]>([]);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loadingPhase, setLoadingPhase] = useState<'drift' | 'ready'>('drift');
  const [toast, setToast] = useState<{message: string, type: 'success' | 'error' | 'info'} | null>(null);

  // Modal State
  const [selectedCar, setSelectedCar] = useState<Car | null>(null);
  const [isBookingModalOpen, setIsBookingModalOpen] = useState(false);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);

  useEffect(() => {
    // Initial Data Fetch
    const fetchData = async () => {
      try {
        const carsData = await api.cars.getAll();
        setCars(carsData);
        if (user) {
          const bookingsData = await api.bookings.getMyBookings();
          setBookings(bookingsData);
        }
      } catch (err) {
        console.error("Failed to load data", err);
      } finally {
        // Ensure loader stays for at least 2s for effect, but allows app to render
        setTimeout(() => setLoadingPhase('ready'), 2000);
      }
    };
    fetchData();
  }, [user]);

  const showToast = (message: string, type: 'success' | 'error' | 'info' = 'success') => {
    setToast({ message, type });
  };

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
    // If they were trying to book a car, open the booking modal now
    if (selectedCar) {
      setIsBookingModalOpen(true);
    }
  };

  const handleAddCar = async (formData: FormData) => {
    try {
      const res = await api.cars.add(formData);
      if (res.success) {
        showToast("Car added successfully");
        const updatedCars = await api.cars.getAll();
        setCars(updatedCars);
      }
    } catch (e) {
      showToast("Failed to add car", "error");
    }
  };

  const handleBooking = async (bookingData: any) => {
    try {
      const res = await api.bookings.create(bookingData);
      if (res.success) {
        showToast("Booking request sent!", "success");
        setIsBookingModalOpen(false);
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
                <div className="animate-fade-in space-y-8">
                  <Hero onBrowseFleet={() => {}} onShowHowItWorks={() => {}} slides={[]} />
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8 pb-12">
                      {cars.length > 0 ? (
                        cars.map((car, index) => (
                          <CarCard
                              key={car.id}
                              car={car}
                              viewMode={'customer'}
                              bookedCount={0}
                              onToggleStatus={() => {}}
                              onDelete={() => {}}
                              onBook={handleBookClick}
                              onEditStock={() => {}}
                              onViewGallery={() => {}}
                              index={index}
                          />
                        ))
                      ) : (
                        <div className="col-span-full text-center py-20 text-gray-500">
                           <p>No cars available at the moment. Please check back later.</p>
                        </div>
                      )}
                  </div>
                </div>
             ) : (
                <div className="animate-fade-in space-y-12">
                   <div className="bg-black text-white p-6 rounded-3xl text-center">
                      <h2 className="text-2xl font-bold mb-2">Admin Dashboard</h2>
                      <p className="opacity-70">Manage your fleet and bookings.</p>
                   </div>
                   
                   <AddCarForm onAddCar={handleAddCar} />
                   
                   <div>
                     <h3 className="text-xl font-bold mb-6 px-2 border-l-4 border-red-600">Recent Bookings</h3>
                     <OwnerBookings 
                        bookings={bookings} 
                        onApprove={handleApproveBooking} 
                        onReject={handleRejectBooking} 
                     />
                   </div>

                   <OwnerSettings onSave={() => {}} onSaveSlides={() => {}} />
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
        existingBookings={[]}
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
