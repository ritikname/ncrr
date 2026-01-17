
import React, { useState } from 'react';
import { Booking } from '../types';
import { sendWhatsAppNotification } from '../services/notification';

interface OwnerBookingsProps {
  bookings: Booking[];
  onReject: (bookingId: string) => void;
  onApprove: (bookingId: string) => void;
}

const OwnerBookings: React.FC<OwnerBookingsProps> = ({ bookings, onReject, onApprove }) => {
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const handleWhatsAppClick = async (booking: Booking) => {
    try {
      const link = await sendWhatsAppNotification(booking);
      window.open(link, '_blank');
    } catch (e) {
      alert("Could not generate WhatsApp link");
    }
  };

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
    <div className="animate-fade-in space-y-8">
      {bookings.map((booking) => {
        const isCancelled = booking.status === 'cancelled';
        const isExpanded = expandedId === booking.id;
        const isApproved = booking.isApproved;

        // --- FINANCIAL CALCULATION LOGIC ---
        const isCashDeposit = booking.securityDepositType === '₹5,000 Cash';
        const securityDepositAmount = isCashDeposit ? 5000 : 0;
        const bookingCost = booking.totalCost;
        const totalPayable = bookingCost + securityDepositAmount;
        const advancePaid = booking.advanceAmount || 0;
        const balanceDue = totalPayable - advancePaid;

        return (
          <div key={booking.id} className={`bg-white rounded-3xl shadow-lg border border-gray-100 overflow-hidden transition-all ${isCancelled ? 'opacity-60 grayscale-[0.8]' : 'hover:shadow-2xl'}`}>
            
            {/* --- HEADER SECTION --- */}
            <div className="flex flex-col sm:flex-row border-b border-gray-100 bg-gray-50/50">
               {/* Car Image (Left) */}
               <div className="sm:w-1/3 md:w-48 h-48 sm:h-auto relative bg-gray-200">
                  <img src={booking.carImage} alt={booking.carName} className="w-full h-full object-cover absolute inset-0" />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent sm:hidden"></div>
                  <div className="absolute bottom-2 left-2 text-white font-bold text-lg sm:hidden drop-shadow-md">
                     {booking.carName}
                  </div>
               </div>

               {/* Header Info (Right) */}
               <div className="p-6 flex-1 flex flex-col justify-between">
                  <div className="flex justify-between items-start mb-4">
                     <div>
                        <div className="hidden sm:block">
                           <h3 className="text-xl font-black text-gray-900 uppercase italic leading-tight">{booking.carName}</h3>
                           <p className="text-xs text-gray-500 font-bold tracking-widest mt-1">REF: #{booking.id.slice(0,8).toUpperCase()}</p>
                        </div>
                     </div>
                     <div className="flex flex-col items-end gap-2">
                        {isCancelled ? (
                           <span className="bg-red-100 text-red-700 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wide">Cancelled</span>
                        ) : (
                           <>
                              {isApproved ? (
                                 <span className="bg-emerald-100 text-emerald-700 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wide flex items-center gap-1">
                                    <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" /></svg>
                                    Approved
                                 </span>
                              ) : (
                                 <span className="bg-amber-100 text-amber-700 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wide animate-pulse">Pending Action</span>
                              )}
                              <span className="text-xs font-medium text-gray-400">{new Date(booking.createdAt).toLocaleString()}</span>
                           </>
                        )}
                     </div>
                  </div>

                  {/* Quick Stats */}
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mt-auto">
                     <div>
                        <span className="block text-[10px] font-bold text-gray-400 uppercase">Trip Start</span>
                        <span className="text-sm font-bold text-gray-900">{new Date(booking.startDate).toLocaleDateString()}</span>
                     </div>
                     <div>
                        <span className="block text-[10px] font-bold text-gray-400 uppercase">Trip End</span>
                        <span className="text-sm font-bold text-gray-900">{new Date(booking.endDate).toLocaleDateString()}</span>
                     </div>
                     <div>
                        <span className="block text-[10px] font-bold text-gray-400 uppercase">Balance Due</span>
                        <span className="text-sm font-bold text-red-600">₹{balanceDue.toLocaleString()}</span>
                     </div>
                     <div>
                        <span className="block text-[10px] font-bold text-gray-400 uppercase">Deposit Type</span>
                        <span className="text-sm font-bold text-gray-900 truncate">{booking.securityDepositType || 'N/A'}</span>
                     </div>
                  </div>
               </div>
            </div>

            {/* --- DETAILS BODY --- */}
            <div className="p-6">
               <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  {/* Customer Info */}
                  <div className="space-y-4">
                     <h4 className="text-xs font-bold text-red-600 uppercase tracking-widest border-b border-red-100 pb-2 mb-3">Customer Details</h4>
                     <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center text-gray-500 font-bold">
                           {booking.customerName.charAt(0)}
                        </div>
                        <div>
                           <p className="font-bold text-gray-900">{booking.customerName}</p>
                           <p className="text-sm text-gray-500">{booking.userEmail}</p>
                        </div>
                     </div>
                     <div className="grid grid-cols-2 gap-4 bg-gray-50 p-3 rounded-xl border border-gray-100">
                        <div>
                           <span className="block text-[10px] text-gray-400 font-bold uppercase">Phone</span>
                           <span className="text-sm font-medium text-gray-900">{booking.customerPhone}</span>
                        </div>
                        <div>
                           <span className="block text-[10px] text-gray-400 font-bold uppercase">Location</span>
                           <span className="text-sm font-medium text-gray-900 truncate" title={booking.location || 'N/A'}>{booking.location || 'N/A'}</span>
                        </div>
                     </div>
                  </div>

                  {/* Payment Info - UPDATED WITH TOTAL CALCULATION */}
                  <div className="space-y-4">
                     <h4 className="text-xs font-bold text-red-600 uppercase tracking-widest border-b border-red-100 pb-2 mb-3">Payment Breakdown</h4>
                     <div className="bg-gray-50 p-3 rounded-xl border border-gray-100 space-y-2">
                        <div className="flex justify-between">
                           <span className="text-sm text-gray-600">Trip Cost</span>
                           <span className="text-sm font-medium text-gray-900">₹{bookingCost.toLocaleString()}</span>
                        </div>
                        {isCashDeposit && (
                            <div className="flex justify-between">
                                <span className="text-sm text-gray-600">Security Deposit (Cash)</span>
                                <span className="text-sm font-medium text-gray-900">+ ₹{securityDepositAmount.toLocaleString()}</span>
                            </div>
                        )}
                        <div className="flex justify-between border-t border-gray-200 pt-2">
                           <span className="text-sm font-bold text-gray-900">Total Payable</span>
                           <span className="text-sm font-bold text-gray-900">₹{totalPayable.toLocaleString()}</span>
                        </div>
                        <div className="flex justify-between">
                           <span className="text-sm text-green-600">Advance Paid</span>
                           <span className="text-sm font-bold text-green-600">- ₹{advancePaid.toLocaleString()}</span>
                        </div>
                        <div className="flex justify-between bg-white p-2 rounded-lg border border-red-100">
                           <span className="text-sm font-bold text-red-600">Balance to Collect</span>
                           <span className="text-sm font-black text-red-600">₹{balanceDue.toLocaleString()}</span>
                        </div>
                        <div className="border-t border-gray-200 mt-2 pt-2 flex justify-between">
                           <span className="text-xs text-gray-500 uppercase font-bold">Advance Tx Ref</span>
                           <span className="text-xs font-mono bg-white border px-2 py-0.5 rounded text-gray-700">{booking.transactionId}</span>
                        </div>
                        {booking.securityDepositTransactionId && (
                           <div className="flex justify-between">
                             <span className="text-xs text-gray-500 uppercase font-bold">Security Tx Ref</span>
                             <span className="text-xs font-mono bg-white border px-2 py-0.5 rounded text-gray-700">{booking.securityDepositTransactionId}</span>
                           </div>
                        )}
                     </div>
                  </div>
               </div>

               {/* Toggle for Documents */}
               <button 
                  onClick={() => setExpandedId(isExpanded ? null : booking.id)}
                  className="mt-6 w-full flex items-center justify-center gap-2 py-2 text-xs font-bold text-gray-400 hover:text-gray-600 transition-colors uppercase tracking-wider"
               >
                  {isExpanded ? 'Hide Documents' : 'View KYC Documents'} 
                  <svg className={`w-4 h-4 transition-transform ${isExpanded ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" /></svg>
               </button>

               {/* Expanded Documents */}
               {isExpanded && (
                  <div className="mt-4 pt-4 border-t border-dashed border-gray-200 animate-fade-in">
                     <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                        {[{label: 'Aadhar Front', src: booking.aadharFront}, {label: 'Aadhar Back', src: booking.aadharBack}, {label: 'License', src: booking.licensePhoto}].map((doc, idx) => (
                           <div key={idx} className="group relative">
                              <p className="text-[10px] font-bold text-gray-400 uppercase mb-2">{doc.label}</p>
                              <div className="aspect-video bg-gray-100 rounded-xl overflow-hidden border border-gray-200 relative cursor-pointer" onClick={() => doc.src && window.open(doc.src, '_blank')}>
                                 {doc.src ? (
                                    <>
                                       <img src={doc.src} className="w-full h-full object-cover transition-transform group-hover:scale-105" alt={doc.label} />
                                       <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors flex items-center justify-center">
                                          <svg className="w-8 h-8 text-white opacity-0 group-hover:opacity-100 transition-opacity" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" /></svg>
                                       </div>
                                    </>
                                 ) : (
                                    <div className="flex flex-col items-center justify-center h-full text-gray-300">
                                       <svg className="w-8 h-8 mb-1" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                                       <span className="text-[10px]">Missing</span>
                                    </div>
                                 )}
                              </div>
                           </div>
                        ))}
                     </div>
                     <div className="mt-4">
                        <p className="text-[10px] font-bold text-gray-400 uppercase mb-2">Signature</p>
                        <div className="bg-gray-50 border border-gray-200 rounded-xl p-2 max-w-sm">
                            {booking.signature ? <img src={booking.signature} alt="Signature" className="h-16 object-contain" /> : <span className="text-xs text-gray-400">Signed</span>}
                        </div>
                     </div>
                  </div>
               )}
            </div>

            {/* --- ACTION FOOTER --- */}
            <div className="bg-gray-50 border-t border-gray-100 p-4 flex gap-3 justify-end items-center flex-wrap">
               <button
                  onClick={() => handleWhatsAppClick(booking)}
                  className="px-4 py-3 rounded-xl bg-[#25D366] text-white font-bold text-sm hover:bg-green-600 transition-colors flex items-center gap-2"
               >
                  <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24"><path d="M.057 24l1.687-6.163c-1.041-1.804-1.588-3.849-1.587-5.946.003-6.556 5.338-11.891 11.893-11.891 3.181.001 6.167 1.24 8.413 3.488 2.245 2.248 3.481 5.236 3.48 8.414-.003 6.557-5.338 11.892-11.893 11.892-1.99-.001-3.951-.5-5.688-1.448l-6.305 1.654zm6.597-3.807c1.676.995 3.276 1.591 5.392 1.592 5.448 0 9.886-4.434 9.889-9.885.002-5.462-4.415-9.89-9.881-9.892-5.452 0-9.887 4.434-9.889 9.884-.001 2.225.651 3.891 1.746 5.634l-.999 3.648 3.742-.981zm11.387-5.464c-.074-.124-.272-.198-.57-.347-.297-.149-1.758-.868-2.031-.967-.272-.099-.47-.149-.669.149-.198.297-.768.967-.941 1.165-.173.198-.347.223-.644.074-.297-.149-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.297-.347.446-.521.151-.172.2-.296.3-.495.099-.198.05-.372-.025-.521-.075-.148-.669-1.611-.916-2.206-.242-.579-.487-.501-.669-.51l-.57-.01c-.198 0-.52.074-.792.372s-1.04 1.016-1.04 2.479 1.065 2.876 1.213 3.074c.149.198 2.095 3.2 5.076 4.487.709.306 1.263.489 1.694.626.712.226 1.36.194 1.872.118.571-.085 1.758-.719 2.006-1.413.248-.695.248-1.29.173-1.414z"/></svg>
                  Open WhatsApp
               </button>

               {!isCancelled && !isApproved && (
                  <>
                     <button 
                        onClick={() => { if(confirm('Are you sure you want to REJECT this booking?')) onReject(booking.id); }}
                        className="px-6 py-3 rounded-xl border border-red-200 text-red-600 font-bold text-sm hover:bg-red-50 transition-colors"
                     >
                        Reject
                     </button>
                     <button 
                        onClick={() => onApprove(booking.id)}
                        className="px-6 py-3 rounded-xl bg-emerald-600 text-white font-bold text-sm hover:bg-emerald-700 shadow-lg shadow-emerald-200 transition-all transform active:scale-95"
                     >
                        Approve & Send Email
                     </button>
                  </>
               )}
               {isApproved && !isCancelled && (
                  <button disabled className="px-6 py-3 rounded-xl bg-gray-100 text-gray-400 font-bold text-sm cursor-not-allowed">
                     Booking Approved
                  </button>
               )}
               {isCancelled && (
                  <button disabled className="px-6 py-3 rounded-xl bg-gray-100 text-gray-400 font-bold text-sm cursor-not-allowed">
                     Booking Cancelled
                  </button>
               )}
            </div>
          </div>
        );
      })}
    </div>
  );
};

export default OwnerBookings;
