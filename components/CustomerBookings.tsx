
import React from 'react';
import { Booking } from '../types';
import { useNavigate } from 'react-router-dom';

interface CustomerBookingsProps {
  bookings: Booking[];
}

const CustomerBookings: React.FC<CustomerBookingsProps> = ({ bookings }) => {
  const navigate = useNavigate();

  return (
    <div className="max-w-5xl mx-auto px-4 py-8 animate-fade-in">
      <div className="flex items-center justify-between mb-8">
        <div>
           <h1 className="text-3xl font-black text-gray-900 uppercase italic">My Bookings</h1>
           <p className="text-gray-500 text-sm mt-1">Track your past and upcoming trips.</p>
        </div>
        <button 
           onClick={() => navigate('/')}
           className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-xl font-bold text-sm transition-colors"
        >
           ← Back to Home
        </button>
      </div>

      {bookings.length === 0 ? (
        <div className="text-center py-24 bg-white rounded-3xl border border-gray-100 shadow-sm">
           <div className="w-20 h-20 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-4 text-3xl">
              📭
           </div>
           <h3 className="text-xl font-bold text-gray-900 mb-2">No Bookings Found</h3>
           <p className="text-gray-500 mb-6">You haven't made any bookings yet.</p>
           <button 
              onClick={() => navigate('/')}
              className="px-6 py-3 bg-red-600 hover:bg-red-700 text-white rounded-xl font-bold shadow-lg shadow-red-500/30 transition-all"
           >
              Book a Car Now
           </button>
        </div>
      ) : (
        <div className="space-y-6">
           {bookings.map((booking) => {
              const isCancelled = booking.status === 'cancelled';
              const isApproved = booking.isApproved;
              
              // Status Logic
              let statusLabel = 'Pending Approval';
              let statusColor = 'bg-amber-100 text-amber-700 border-amber-200';
              
              if (isCancelled) {
                 statusLabel = 'Cancelled / Rejected';
                 statusColor = 'bg-red-100 text-red-700 border-red-200';
              } else if (isApproved) {
                 statusLabel = 'Approved & Confirmed';
                 statusColor = 'bg-emerald-100 text-emerald-700 border-emerald-200';
              }

              return (
                 <div key={booking.id} className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden hover:shadow-md transition-shadow">
                    <div className="flex flex-col md:flex-row">
                       {/* Image Section */}
                       <div className="w-full md:w-64 h-48 md:h-auto relative bg-gray-100 flex-shrink-0">
                          <img src={booking.carImage} alt={booking.carName} className="w-full h-full object-cover" />
                          <div className={`absolute top-4 left-4 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest border ${statusColor}`}>
                             {statusLabel}
                          </div>
                       </div>

                       {/* Info Section */}
                       <div className="p-6 flex-1 flex flex-col justify-between">
                          <div className="flex justify-between items-start mb-4">
                             <div>
                                <h3 className="text-xl font-black text-gray-900">{booking.carName}</h3>
                                <p className="text-xs font-bold text-gray-400 mt-1 uppercase tracking-wider">Ref: {booking.transactionId || booking.id.slice(0,8)}</p>
                             </div>
                             <div className="text-right">
                                <p className="text-lg font-black text-red-600">₹{booking.totalCost.toLocaleString()}</p>
                                <p className="text-xs text-gray-500 font-medium">Total Cost</p>
                             </div>
                          </div>

                          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 bg-gray-50 p-4 rounded-xl border border-gray-100">
                             <div>
                                <span className="block text-[10px] text-gray-400 font-bold uppercase mb-1">Pick-up Date</span>
                                <span className="text-sm font-bold text-gray-900">{new Date(booking.startDate).toLocaleDateString()}</span>
                             </div>
                             <div>
                                <span className="block text-[10px] text-gray-400 font-bold uppercase mb-1">Return Date</span>
                                <span className="text-sm font-bold text-gray-900">{new Date(booking.endDate).toLocaleDateString()}</span>
                             </div>
                             <div className="col-span-2 md:col-span-2">
                                <span className="block text-[10px] text-gray-400 font-bold uppercase mb-1">Pick-up Location</span>
                                <span className="text-sm font-bold text-gray-900 truncate block">{booking.location}</span>
                             </div>
                          </div>
                          
                          {/* Footer Info */}
                          <div className="mt-4 pt-4 border-t border-gray-100 flex justify-between items-center">
                             <span className="text-xs text-gray-400 font-medium">Booked on {new Date(booking.createdAt).toLocaleDateString()}</span>
                             {isApproved && (
                                <a 
                                  href="https://wa.link/cr2zns" 
                                  target="_blank" 
                                  rel="noreferrer"
                                  className="text-xs font-bold text-emerald-600 flex items-center gap-1 hover:underline"
                                >
                                   Need Help? Contact Support →
                                </a>
                             )}
                          </div>
                       </div>
                    </div>
                 </div>
              );
           })}
        </div>
      )}
    </div>
  );
};

export default CustomerBookings;
