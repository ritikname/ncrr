
import React, { useState } from 'react';
import { Booking } from '../types';

interface OwnerBookingsProps {
  bookings: Booking[];
  onReject: (bookingId: string) => void;
  onApprove: (bookingId: string) => void;
}

const OwnerBookings: React.FC<OwnerBookingsProps> = ({ bookings, onReject, onApprove }) => {
  const [expandedId, setExpandedId] = useState<string | null>(null);

  if (bookings.length === 0) {
    return (
      <div className="text-center py-24 bg-white rounded-3xl shadow-sm border border-gray-100 animate-fade-in">
        <div className="mx-auto w-24 h-24 bg-red-50 rounded-full flex items-center justify-center mb-6">
           <svg className="w-10 h-10 text-red-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
           </svg>
        </div>
        <h3 className="text-xl font-bold text-gray-900 mb-2">No Bookings Yet</h3>
        <p className="text-gray-500 max-w-md mx-auto">
          When customers book your cars, the details will appear here.
        </p>
      </div>
    );
  }

  return (
    <div className="animate-fade-in space-y-6">
      <div className="grid gap-6">
        {bookings.map((booking) => {
          const isCancelled = booking.status === 'cancelled';
          const isExpanded = expandedId === booking.id;
          const isApproved = booking.isApproved;

          return (
            <div key={booking.id} className={`bg-white rounded-2xl shadow-sm border border-gray-100 p-6 flex flex-col transition-all ${isCancelled ? 'opacity-60 grayscale-[0.8]' : 'hover:shadow-md'}`}>
              
              <div className="flex flex-col lg:flex-row gap-6 items-start">
                  {/* Car Image Thumbnail */}
                  <div className="w-full lg:w-40 h-40 bg-gray-100 rounded-xl overflow-hidden flex-shrink-0 relative">
                    <img src={booking.carImage} alt={booking.carName} className="w-full h-full object-cover" />
                    {isCancelled && (
                      <div className="absolute inset-0 bg-black/10 flex items-center justify-center">
                        <span className="bg-white/80 backdrop-blur text-xs font-bold px-2 py-1 rounded text-gray-600">VOID</span>
                      </div>
                    )}
                  </div>

                  {/* Main Info */}
                  <div className="flex-1 min-w-0 w-full">
                    <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2">
                            {isCancelled ? (
                                <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-red-100 text-red-700">Cancelled</span>
                            ) : (
                                <div className="flex gap-2">
                                  <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-green-100 text-green-700">Paid</span>
                                  {isApproved ? (
                                     <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-emerald-600 text-white flex items-center gap-1">
                                       <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" /></svg>
                                       Approved
                                     </span>
                                  ) : (
                                     <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-yellow-100 text-yellow-700 animate-pulse">Pending Approval</span>
                                  )}
                                </div>
                            )}
                            <span className="text-gray-400 text-xs">#{booking.id.slice(0,8)}</span>
                        </div>
                        <span className="text-xs text-gray-400">{new Date(booking.createdAt).toLocaleString()}</span>
                    </div>
                    
                    <h3 className="text-xl font-bold text-gray-900 truncate mb-1">{booking.carName}</h3>
                    
                    {/* Basic Details Grid */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-4 bg-gray-50 p-4 rounded-xl">
                        <div>
                            <p className="text-xs text-gray-400 font-bold uppercase mb-1">Customer</p>
                            <p className="font-semibold text-gray-800">{booking.customerName}</p>
                            <p className="text-sm text-gray-600">{booking.customerPhone}</p>
                            <p className="text-xs text-gray-400">{booking.userEmail}</p>
                        </div>
                        <div>
                            <p className="text-xs text-gray-400 font-bold uppercase mb-1">Dates & Pickup</p>
                            <p className="font-semibold text-gray-800">{new Date(booking.startDate).toLocaleDateString()} - {new Date(booking.endDate).toLocaleDateString()}</p>
                            <div className="flex items-center gap-1 mt-1 text-red-600 font-medium text-sm">
                                <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
                                <span>{booking.location || 'N/A'}</span>
                            </div>
                        </div>
                        <div>
                            <p className="text-xs text-gray-400 font-bold uppercase mb-1">Payment</p>
                            <div className="flex items-center gap-2">
                                <span className="text-green-600 font-bold text-sm">₹{booking.advanceAmount?.toLocaleString() || 0} Paid</span>
                                <span className="text-gray-400 text-xs">(10% Adv)</span>
                            </div>
                            <p className="text-xs text-gray-500 mt-0.5">Total: ₹{booking.totalCost.toLocaleString()}</p>
                        </div>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex flex-row lg:flex-col items-center lg:justify-center w-full lg:w-auto mt-2 lg:mt-0 pt-4 lg:pt-0 lg:border-l lg:border-gray-100 lg:pl-6 gap-3">
                    
                    {!isCancelled && !isApproved && (
                      <button 
                         onClick={() => onApprove(booking.id)}
                         className="w-full lg:w-auto text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 px-4 py-3 rounded-xl transition-all whitespace-nowrap shadow-lg shadow-emerald-200 flex items-center justify-center gap-1"
                      >
                         <span>Approve</span>
                      </button>
                    )}

                    <button 
                      onClick={() => setExpandedId(isExpanded ? null : booking.id)}
                      className="w-full lg:w-auto text-xs font-bold text-gray-600 bg-gray-100 hover:bg-gray-200 px-4 py-3 rounded-xl transition-all whitespace-nowrap flex items-center justify-center gap-2"
                    >
                      {isExpanded ? 'Hide' : 'Details'}
                    </button>

                    {!isCancelled && (
                      <button 
                        onClick={() => {
                            if(confirm('Reject booking?')) {
                                onReject(booking.id);
                            }
                        }}
                        className="w-full lg:w-auto text-xs font-bold text-red-500 hover:text-white border border-red-200 hover:bg-red-500 hover:border-red-500 px-4 py-3 rounded-xl transition-all whitespace-nowrap"
                      >
                        Reject
                      </button>
                    )}
                  </div>
              </div>

              {/* EXPANDED DETAILS */}
              {isExpanded && (
                  <div className="mt-6 pt-6 border-t border-gray-100 animate-fade-in">
                      <h4 className="font-bold text-gray-900 mb-4 uppercase text-sm tracking-wider">Uploaded Documents (KYC)</h4>
                      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                          <div>
                              <p className="text-xs font-bold text-gray-400 mb-2">Aadhar Front</p>
                              <div className="bg-gray-100 rounded-lg overflow-hidden h-32 border border-gray-200">
                                  {booking.aadharFront ? (
                                      <img src={booking.aadharFront} alt="Aadhar Front" className="w-full h-full object-cover cursor-pointer hover:scale-105 transition-transform" onClick={() => window.open(booking.aadharFront)} />
                                  ) : <span className="flex items-center justify-center h-full text-xs text-gray-400">Missing</span>}
                              </div>
                          </div>
                          <div>
                              <p className="text-xs font-bold text-gray-400 mb-2">Aadhar Back</p>
                              <div className="bg-gray-100 rounded-lg overflow-hidden h-32 border border-gray-200">
                                  {booking.aadharBack ? (
                                      <img src={booking.aadharBack} alt="Aadhar Back" className="w-full h-full object-cover cursor-pointer hover:scale-105 transition-transform" onClick={() => window.open(booking.aadharBack)} />
                                  ) : <span className="flex items-center justify-center h-full text-xs text-gray-400">Missing</span>}
                              </div>
                          </div>
                          <div>
                              <p className="text-xs font-bold text-gray-400 mb-2">License</p>
                              <div className="bg-gray-100 rounded-lg overflow-hidden h-32 border border-gray-200">
                                  {booking.licensePhoto ? (
                                      <img src={booking.licensePhoto} alt="License" className="w-full h-full object-cover cursor-pointer hover:scale-105 transition-transform" onClick={() => window.open(booking.licensePhoto)} />
                                  ) : <span className="flex items-center justify-center h-full text-xs text-gray-400">Missing</span>}
                              </div>
                          </div>
                      </div>
                  </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default OwnerBookings;
