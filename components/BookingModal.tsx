
import React, { useState, useEffect, useRef } from 'react';
import { Car, UserProfile, Booking } from '../types';
import { api } from '../services/api';

interface BookingModalProps {
  car: Car | null;
  isOpen: boolean;
  userProfile: UserProfile | null;
  paymentQrCode?: string;
  existingBookings: Booking[];
  prefillDates?: { start: string, end: string };
  prefillLocation?: string;
  onClose: () => void;
  onConfirm: (bookingData: any) => Promise<void> | void;
}

const TERMS_TEXT = `
TERMS & CONDITIONS - NCR DRIVE RENTAL CARS

1. ELIGIBILITY & DOCUMENTS
   • Valid Driving License (Original) and Aadhar Card/Passport are mandatory.
   • Minimum age of the driver must be 21 years.
   • Local IDs may be subject to additional verification.

2. SECURITY DEPOSIT
   • A refundable security deposit (₹5,000 or Asset) is required before pickup.
   • Refund is processed within 48 hours of vehicle return, subject to inspection.
   • Deductions will apply for damages, fuel shortage, challans, or Fastag usage.

3. FUEL POLICY
   • Fuel is NOT included in the rental amount.
   • The vehicle must be returned with the same fuel level as at the time of pickup.
   • No refund is provided for excess fuel left in the vehicle.

4. SPEED LIMIT & COMPLIANCE
   • Maximum speed limit: 100 km/hr (or as per government highway norms).
   • Overspeeding Fine: ₹500 for the first instance, ₹2,000 for repeated violations.
   • The customer is solely responsible for all traffic challans/fines incurred during the trip.

5. DAMAGE & ACCIDENTS
   • The customer is liable for any scratches, dents, or damages caused during the rental period.
   • For major accidents (damages > ₹10,000), insurance may be claimed. The customer must pay the insurance difference + file charges.
   • Downtime charges (50% of daily rent) apply for every day the car is in the garage for repairs caused by the customer.

6. PROHIBITED ACTIVITIES
   • NO SMOKING / NO ALCOHOL allowed inside the car. (Fine: ₹1,000 + Cleaning charges).
   • No racing, drifting, or using the car for commercial purposes (taxi/goods transport).
   • Taking the car to unauthorized regions (like Leh/Ladakh) without prior permission is strictly prohibited.

7. LATE RETURN POLICY
   • A grace period of 30 minutes is allowed.
   • Late returns are charged at ₹500/hour for the first 3 hours.
   • Delays beyond 3 hours will attract a full day's rental charge.

8. CANCELLATION & REFUNDS
   • 24+ hours before trip: 100% Refund of Advance.
   • 12-24 hours before trip: 50% Refund of Advance.
   • Less than 12 hours: No Refund.

By signing digitally below, you acknowledge that you have read and agreed to these terms.
`;

const BookingModal: React.FC<BookingModalProps> = ({ 
  car, isOpen, userProfile, paymentQrCode, existingBookings, prefillDates, prefillLocation, onClose, onConfirm 
}) => {
  // Step 1 State
  const [customerName, setCustomerName] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [email, setEmail] = useState('');
  
  const [pickupPoint, setPickupPoint] = useState('');
  const [gpsLocation, setGpsLocation] = useState('');
  
  const [aadharPhone, setAadharPhone] = useState('');
  const [altPhone, setAltPhone] = useState('');
  
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [totalCost, setTotalCost] = useState(0);
  const [days, setDays] = useState(0);
  const [availabilityError, setAvailabilityError] = useState('');
  
  // Step 2 State
  const [signatureName, setSignatureName] = useState('');

  // Step 3 State
  const [transactionId, setTransactionId] = useState('');
  const [promoCode, setPromoCode] = useState('');
  const [appliedPromo, setAppliedPromo] = useState<{code: string, percentage: number} | null>(null);
  const [promoLoading, setPromoLoading] = useState(false);
  const [promoError, setPromoError] = useState('');

  // Step 4 State (KYC - Changed to hold File objects)
  const [aadharFrontFile, setAadharFrontFile] = useState<File | null>(null);
  const [aadharBackFile, setAadharBackFile] = useState<File | null>(null);
  const [licenseFile, setLicenseFile] = useState<File | null>(null);
  
  const [aadharFrontPreview, setAadharFrontPreview] = useState<string | null>(null);
  const [aadharBackPreview, setAadharBackPreview] = useState<string | null>(null);
  const [licensePreview, setLicensePreview] = useState<string | null>(null);

  const [securityDepositType, setSecurityDepositType] = useState('₹5,000 Cash');
  const [securityDepositUtr, setSecurityDepositUtr] = useState('');
  
  const [step, setStep] = useState<1 | 2 | 3 | 4>(1);
  const [isProcessing, setIsProcessing] = useState(false);
  const [locLoading, setLocLoading] = useState(false);

  const startInputRef = useRef<HTMLInputElement>(null);
  const endInputRef = useRef<HTMLInputElement>(null);

  const getTodayString = () => {
    const today = new Date();
    const year = today.getFullYear();
    const month = String(today.getMonth() + 1).padStart(2, '0');
    const day = String(today.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  useEffect(() => {
    if (isOpen) {
      setCustomerName(userProfile?.name || '');
      setCustomerPhone(userProfile?.phone || '');
      setEmail(userProfile?.email || ''); 
      setPickupPoint(prefillLocation || '');
      setGpsLocation('');
      setAadharPhone('');
      setAltPhone('');
      setStartDate(prefillDates?.start || '');
      setEndDate(prefillDates?.end || '');
      
      if (!prefillDates?.start || !prefillDates?.end) {
          setTotalCost(0);
          setDays(0);
      }
      
      setTransactionId('');
      setAadharFrontFile(null); setAadharFrontPreview(null);
      setAadharBackFile(null); setAadharBackPreview(null);
      setLicenseFile(null); setLicensePreview(null);
      setSecurityDepositType('₹5,000 Cash');
      setSecurityDepositUtr('');
      setSignatureName('');
      setStep(1);
      setIsProcessing(false);
      setAvailabilityError('');
      setPromoCode('');
      setAppliedPromo(null);
      setPromoError('');
    }
  }, [isOpen]); 

  // Helper: Create preview for UI
  const createPreview = (file: File): Promise<string> => {
    return new Promise((resolve) => {
        const reader = new FileReader();
        reader.readAsDataURL(file);
        reader.onload = (event) => resolve(event.target?.result as string);
        reader.onerror = () => resolve("");
    });
  };

  const handleFileChange = async (
      e: React.ChangeEvent<HTMLInputElement>, 
      setFile: React.Dispatch<React.SetStateAction<File | null>>,
      setPreview: React.Dispatch<React.SetStateAction<string | null>>
  ) => {
    const file = e.target.files?.[0];
    if (file) {
      setFile(file);
      const prev = await createPreview(file);
      setPreview(prev);
    }
  };

  // ... Geolocation, Conflict Logic, Dates (Same as before) ...
  const handleDetectLocation = () => {
    setLocLoading(true);
    setGpsLocation("Triangulating precise location...");
    if (!navigator.geolocation) {
      alert("Geolocation is not supported by this browser.");
      setGpsLocation("GPS Not Supported");
      setLocLoading(false);
      return;
    }
    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const { latitude, longitude } = position.coords;
        const preciseCoords = `${latitude.toFixed(7)}, ${longitude.toFixed(7)}`;
        try {
          const response = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}`);
          const data = await response.json();
          if (data && data.display_name) {
             const parts = data.display_name.split(',').slice(0, 3).join(',');
             setGpsLocation(`${parts} [${preciseCoords}]`);
          } else {
             setGpsLocation(preciseCoords);
          }
        } catch (e) {
          setGpsLocation(preciseCoords);
        }
        setLocLoading(false);
      },
      (error) => {
        alert("Unable to fetch location. Please check permissions.");
        setGpsLocation("Permission Denied"); 
        setLocLoading(false);
      },
      { enableHighAccuracy: true, timeout: 15000, maximumAge: 0 }
    );
  };

  const checkConflicts = (start: string, end: string) => {
    if (!car || !start || !end) return false;
    const totalStock = car.totalStock || 1;
    const conflictingBookings = existingBookings.filter(b => 
      b.carId === car.id &&
      b.status === 'confirmed' &&
      start <= b.endDate && b.startDate <= end
    );
    if (conflictingBookings.length >= totalStock) {
      setAvailabilityError(`Sold out for selected dates.`);
      return true;
    }
    setAvailabilityError('');
    return false;
  };

  const handleStartDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selected = e.target.value;
    const today = getTodayString();
    if (selected && selected < today) setStartDate(today);
    else setStartDate(selected);
  };

  const handleEndDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selected = e.target.value;
    const minDate = startDate || getTodayString();
    if (selected && selected < minDate) setEndDate('');
    else setEndDate(selected);
  };

  useEffect(() => {
    if (startDate && endDate && car) {
      const start = new Date(startDate);
      const end = new Date(endDate);
      if (end >= start) {
        const diffTime = Math.abs(end.getTime() - start.getTime());
        const dayCount = Math.round(diffTime / (1000 * 60 * 60 * 24)) + 1; 
        setDays(dayCount);
        setTotalCost(dayCount * car.pricePerDay);
        checkConflicts(startDate, endDate);
      } else {
        setDays(0); setTotalCost(0);
        setAvailabilityError('End date must be after start date');
      }
    }
  }, [startDate, endDate, car]);

  // ... Promo Logic ...
  const handleApplyPromo = async () => {
     if (!promoCode) return;
     if (!email) {
         setPromoError("Please enter email in step 1 to use promo codes.");
         return;
     }
     setPromoLoading(true);
     setPromoError('');
     try {
        const res = await api.promos.validate(promoCode, email);
        setAppliedPromo({ code: promoCode, percentage: res.percentage });
        setPromoCode('');
     } catch (e: any) {
        setPromoError(e.message || "Invalid or used promo code.");
        setAppliedPromo(null);
     } finally {
        setPromoLoading(false);
     }
  };
  const removePromo = () => {
      setAppliedPromo(null);
      setPromoCode('');
      setPromoError('');
  };

  const handleNext = () => {
    if (step === 1) {
        if (!startDate || !endDate || days <= 0 || !customerName || !customerPhone || !email || !pickupPoint || !aadharPhone || !altPhone) {
            alert("⚠️ Please fill ALL contact and trip details.");
            return;
        }
        if (checkConflicts(startDate, endDate)) return;
        setStep(2); 
    } else if (step === 2) {
        if (!signatureName.trim()) {
            alert("⚠️ Please sign the Terms & Conditions.");
            return;
        }
        setStep(3);
    } else if (step === 3) {
        if (!transactionId.trim()) {
            alert("⚠️ Please enter the Transaction ID/UTR.");
            return;
        }
        setStep(4);
    }
  };

  const handleBack = () => { if (step > 1) setStep((prev) => (prev - 1) as 1 | 2 | 3 | 4); };

  const handleFinalSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!aadharFrontFile || !aadharBackFile || !licenseFile) {
        alert("⚠️ Please upload all required KYC documents.");
        return;
    }
    
    if (securityDepositType === '₹5,000 Cash' && !securityDepositUtr.trim()) {
        alert("⚠️ Please enter the UTR for the security deposit.");
        return;
    }

    setIsProcessing(true);
    await new Promise(resolve => setTimeout(resolve, 300));

    if (car) {
        try {
            let finalCost = totalCost;
            let discountAmount = 0;
            if (appliedPromo) {
               discountAmount = Math.round(totalCost * (appliedPromo.percentage / 100));
               finalCost = totalCost - discountAmount;
            }
            // Logic Change: Advance is 10% of ORIGINAL Total Cost, not Discounted Cost
            const finalAdvance = Math.round(totalCost * 0.10);

            // Create FormData object
            const formData = new FormData();
            formData.append('carId', car.id);
            formData.append('carName', car.name);
            formData.append('carImage', car.imageBase64);
            formData.append('customerName', customerName);
            formData.append('customerPhone', customerPhone);
            formData.append('email', email);
            formData.append('location', pickupPoint);
            formData.append('userGps', gpsLocation);
            formData.append('aadharPhone', aadharPhone);
            formData.append('altPhone', altPhone);
            formData.append('startDate', startDate);
            formData.append('endDate', endDate);
            // We store the Net Cost as totalCost in DB for balance logic
            formData.append('totalCost', finalCost.toString());
            formData.append('advanceAmount', finalAdvance.toString());
            formData.append('transactionId', transactionId);
            formData.append('days', days.toString());
            formData.append('securityDepositType', securityDepositType);
            if(securityDepositType === '₹5,000 Cash') formData.append('securityDepositTransactionId', securityDepositUtr);
            formData.append('signature', signatureName);
            if(appliedPromo) {
                formData.append('promoCode', appliedPromo.code);
                formData.append('discountAmount', discountAmount.toString());
            }

            // Append Files
            formData.append('aadharFront', aadharFrontFile);
            formData.append('aadharBack', aadharBackFile);
            formData.append('licensePhoto', licenseFile);

            await onConfirm(formData);
        } catch(e: any) {
            console.error("Booking error:", e);
            alert(`Booking Failed: ${e.message || "Please try again."}`);
        } finally {
            setIsProcessing(false);
        }
    }
  };

  if (!isOpen || !car) return null;

  let currentTotal = totalCost;
  let discountAmount = 0;
  if (appliedPromo) {
     discountAmount = Math.round(totalCost * (appliedPromo.percentage / 100));
     currentTotal = totalCost - discountAmount;
  }
  // Logic Change: Advance is 10% of ORIGINAL Total Cost for display as well
  const advanceAmount = Math.round(totalCost * 0.10);

  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-gray-900/70 backdrop-blur-sm transition-opacity" onClick={onClose}></div>
      
      <div className="relative bg-white rounded-3xl shadow-2xl max-w-lg w-full overflow-hidden animate-fade-in flex flex-col max-h-[90vh]">
        <div className="relative h-20 bg-black flex items-center px-6 justify-between flex-shrink-0">
           <div>
             <div className="text-red-500 text-xs font-bold uppercase tracking-wider mb-0.5">Booking Step {step}/4</div>
             <div className="text-white text-lg font-bold">
                {step === 1 ? 'Trip & Contact Details' : step === 2 ? 'Terms & Conditions' : step === 3 ? 'Secure Payment' : 'KYC & Security'}
             </div>
           </div>
           <button onClick={onClose} className="bg-white/10 hover:bg-white/20 text-white p-2 rounded-full transition-colors">
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
          </button>
        </div>

        <div className="overflow-y-auto p-6 scrollbar-hide">
            {step === 1 && (
                <div className="space-y-4">
                    <div className="flex items-center gap-4 bg-gray-50 p-3 rounded-xl border border-gray-100">
                        <img src={car.imageBase64} className="w-16 h-16 object-cover rounded-lg" alt="car" />
                        <div>
                            <h4 className="font-bold text-gray-900">{car.name}</h4>
                            <div className="text-xs text-gray-500">₹{car.pricePerDay}/day • {days} Days</div>
                        </div>
                    </div>
                    {availabilityError && <div className="text-red-600 text-xs font-bold bg-red-50 p-2 rounded">{availabilityError}</div>}
                    <div className="grid grid-cols-2 gap-4">
                        <div className="relative">
                            <label className="block text-[10px] font-bold text-gray-500 uppercase mb-1">Pick-up</label>
                            <div className="relative w-full h-10 border rounded-lg bg-transparent flex items-center px-3 cursor-pointer group">
                                <span className={`text-sm ${startDate ? 'text-gray-900' : 'text-gray-400'} font-bold flex-1 pointer-events-none`}>{startDate || 'Select Date'}</span>
                                <input ref={startInputRef} type="date" min={getTodayString()} value={startDate} onChange={handleStartDateChange} className="absolute inset-0 w-full h-full opacity-0 z-20 cursor-pointer appearance-none" style={{opacity: 0.01}}/>
                            </div>
                        </div>
                        <div className="relative">
                            <label className="block text-[10px] font-bold text-gray-500 uppercase mb-1">Return</label>
                            <div className="relative w-full h-10 border rounded-lg bg-transparent flex items-center px-3 cursor-pointer group">
                                <span className={`text-sm ${endDate ? 'text-gray-900' : 'text-gray-400'} font-bold flex-1 pointer-events-none`}>{endDate || 'Select Date'}</span>
                                <input ref={endInputRef} type="date" min={startDate || getTodayString()} value={endDate} onChange={handleEndDateChange} className="absolute inset-0 w-full h-full opacity-0 z-20 cursor-pointer appearance-none" style={{opacity: 0.01}} />
                            </div>
                        </div>
                    </div>
                    <div className="space-y-3 pt-2">
                        <div className="grid grid-cols-2 gap-3">
                             <div>
                               <label className="block text-[10px] font-bold text-gray-500 uppercase mb-1">Name</label>
                               <input type="text" placeholder="Name" value={customerName} readOnly className="w-full px-3 py-2 border rounded-lg bg-gray-50 text-sm" />
                             </div>
                             <div>
                               <label className="block text-[10px] font-bold text-gray-500 uppercase mb-1">Phone <span className="text-black font-extrabold">(WhatsApp)</span></label>
                               <input type="text" placeholder="Phone" value={customerPhone} onChange={(e) => setCustomerPhone(e.target.value)} className="w-full px-3 py-2 border rounded-lg bg-white text-sm focus:ring-2 focus:ring-red-600 outline-none" />
                             </div>
                        </div>
                        <input type="email" placeholder="Email ID" value={email} onChange={(e) => setEmail(e.target.value)} className="w-full px-3 py-2 border rounded-lg text-sm" />
                        <div>
                            <label className="block text-[10px] font-bold text-gray-500 uppercase mb-1">Pick-up Point (Station)</label>
                            <input type="text" placeholder="e.g. Hauz Khas Metro" value={pickupPoint} onChange={(e) => setPickupPoint(e.target.value)} className="w-full px-3 py-2 border rounded-lg bg-white text-sm" />
                        </div>
                        <div>
                            <label className="block text-[10px] font-bold text-gray-500 uppercase mb-1">Current Location (For KYC/Security)</label>
                            <div className="flex gap-2">
                                <input type="text" placeholder="Tap button to fetch coordinates" value={gpsLocation} readOnly className={`w-full px-3 py-2 border rounded-lg text-xs font-mono ${locLoading ? 'bg-gray-100 text-gray-400' : 'bg-gray-50 text-gray-700'}`} />
                                <button onClick={handleDetectLocation} disabled={locLoading} className="bg-red-600 hover:bg-red-700 text-white px-3 py-2 rounded-lg text-xs font-bold whitespace-nowrap transition-colors flex items-center gap-1">
                                    {locLoading ? 'Triangulating' : '📍 Fetch GPS'}
                                </button>
                            </div>
                        </div>
                        <div className="grid grid-cols-2 gap-3">
                             <input type="tel" placeholder="Aadhar Reg. Phone" value={aadharPhone} onChange={(e) => setAadharPhone(e.target.value)} className="w-full px-3 py-2 border rounded-lg text-sm" />
                             <input type="tel" placeholder="Alternative Contact" value={altPhone} onChange={(e) => setAltPhone(e.target.value)} className="w-full px-3 py-2 border rounded-lg text-sm" />
                        </div>
                    </div>  
                </div>
            )}
            
            {step === 2 && (
                <div className="space-y-4 animate-fade-in">
                    <div className="bg-gray-50 border border-gray-200 rounded-xl p-4 h-64 overflow-y-auto text-xs text-gray-700 leading-relaxed font-medium">
                        <pre className="whitespace-pre-wrap font-sans">{TERMS_TEXT}</pre>
                    </div>
                    <div>
                        <label className="block text-sm font-bold text-gray-900 mb-2">Digital Signature</label>
                        <p className="text-[10px] text-gray-500 mb-2">Type your full name in the box below to sign and accept the Terms & Conditions.</p>
                        <input type="text" value={signatureName} onChange={(e) => setSignatureName(e.target.value)} placeholder="Type Full Name to Sign" className="w-full px-4 py-3 border-2 border-gray-300 rounded-xl font-bold text-lg focus:border-black outline-none transition-colors"/>
                    </div>
                </div>
            )}

            {step === 3 && (
                <div className="space-y-6 animate-fade-in">
                    <div className="bg-red-50 p-4 rounded-xl border border-red-100">
                        <div className="flex justify-between text-sm text-gray-600 mb-1">
                            <span>Total Trip Cost ({days} days)</span>
                            <span className={`${appliedPromo ? 'line-through text-red-400' : 'text-gray-900 font-bold'}`}>₹{totalCost.toLocaleString()}</span>
                        </div>
                        {appliedPromo && (<div className="flex justify-between text-sm text-emerald-600 mb-1 font-bold"><span>Discount ({appliedPromo.code})</span><span>-₹{discountAmount.toLocaleString()}</span></div>)}
                        {appliedPromo && (
                             <div className="flex justify-between text-sm text-gray-800 mb-1 font-bold">
                                <span>Net Trip Cost</span>
                                <span>₹{currentTotal.toLocaleString()}</span>
                             </div>
                        )}
                        <div className="flex justify-between items-center mt-2 pt-2 border-t border-red-100">
                            <span className="font-bold text-red-900">Advance (10% of Total)</span>
                            <span className="font-bold text-2xl text-red-600">₹{advanceAmount.toLocaleString()}</span>
                        </div>
                    </div>
                    <div>
                        <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Have a Promo Code?</label>
                        <div className="flex gap-2">
                           {appliedPromo ? (
                               <div className="flex-1 bg-emerald-50 border border-emerald-200 rounded-xl px-4 py-3 flex items-center justify-between"><span className="text-emerald-700 font-bold tracking-wide">{appliedPromo.code} Applied!</span><button onClick={removePromo} className="text-emerald-500 hover:text-red-500 font-bold text-xs">REMOVE</button></div>
                           ) : (
                               <>
                                <input type="text" value={promoCode} onChange={(e) => setPromoCode(e.target.value.toUpperCase())} placeholder="Enter Code" className="flex-1 px-4 py-3 border border-gray-200 rounded-xl outline-none uppercase font-bold text-sm" />
                                <button onClick={handleApplyPromo} disabled={promoLoading || !promoCode} className="bg-black text-white px-5 rounded-xl font-bold text-sm hover:bg-gray-800 disabled:opacity-50">{promoLoading ? '...' : 'Apply'}</button>
                               </>
                           )}
                        </div>
                        {promoError && <p className="text-red-500 text-xs mt-1 font-bold">{promoError}</p>}
                    </div>
                    <div className="text-center pt-2">
                        <p className="text-sm text-gray-500 mb-3">Scan QR to Pay Advance</p>
                        <div className="border-2 border-dashed border-gray-200 rounded-xl p-2 inline-block bg-white">
                            {paymentQrCode ? <img src={paymentQrCode} alt="Payment QR" className="w-48 h-48 object-contain" /> : <div className="w-48 h-48 flex items-center justify-center text-xs">No QR</div>}
                        </div>
                    </div>
                    <div>
                        <label className="block text-sm font-bold text-gray-700 mb-2">Transaction ID / UTR</label>
                        <input type="text" value={transactionId} onChange={(e) => setTransactionId(e.target.value)} className="w-full px-4 py-3 border border-gray-200 rounded-xl font-mono text-center uppercase" placeholder="UPI123456" />
                    </div>
                </div>
            )}

            {step === 4 && (
                <div className="space-y-5 animate-fade-in">
                    <div className="bg-blue-50 p-3 rounded-lg border border-blue-100 text-blue-800 text-xs font-medium">
                        Almost done! Please upload documents for verification and select your security deposit preference.
                    </div>
                    <div className="space-y-4">
                        <div>
                            <label className="block text-xs font-bold text-gray-700 uppercase mb-1">Security Deposit Type</label>
                            <select value={securityDepositType} onChange={(e) => setSecurityDepositType(e.target.value)} className="w-full px-3 py-3 border border-gray-200 rounded-xl bg-white focus:ring-2 focus:ring-red-600">
                                <option value="₹5,000 Cash">₹5,000 Cash</option>
                                <option value="Laptop">Laptop</option>
                                <option value="2-Wheeler">2-Wheeler</option>
                                <option value="Passport">Passport</option>
                            </select>
                        </div>
                        {securityDepositType === '₹5,000 Cash' && (
                            <div className="bg-orange-50 p-4 rounded-xl border border-orange-100 animate-fade-in">
                                <h4 className="font-bold text-orange-900 text-sm mb-3 flex items-center gap-2">Pay Security Deposit</h4>
                                <div className="flex flex-col sm:flex-row gap-4 items-center">
                                     <div className="bg-white p-2 rounded-lg border border-gray-200 flex-shrink-0">
                                          {paymentQrCode ? (<img src={paymentQrCode} className="w-24 h-24 object-contain" alt="Security Deposit QR" />) : (<div className="w-24 h-24 flex items-center justify-center text-[10px] text-gray-400">No QR</div>)}
                                     </div>
                                     <div className="flex-1 w-full">
                                          <label className="block text-xs font-bold text-gray-600 mb-1">Security Deposit UTR / Transaction ID</label>
                                          <input type="text" value={securityDepositUtr} onChange={e => setSecurityDepositUtr(e.target.value)} placeholder="Enter Deposit Payment Ref" className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-orange-500 bg-white font-mono uppercase text-sm"/>
                                     </div>
                                </div>
                            </div>
                        )}
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="block text-[10px] font-bold text-gray-500 uppercase mb-1">Aadhar Front</label>
                                <div className="relative h-24 border-2 border-dashed border-gray-300 rounded-xl overflow-hidden bg-gray-50 flex items-center justify-center">
                                    {aadharFrontPreview ? <img src={aadharFrontPreview} className="w-full h-full object-cover" /> : <span className="text-xs text-gray-400">+ Upload</span>}
                                    <input type="file" className="absolute inset-0 opacity-0" onChange={(e) => handleFileChange(e, setAadharFrontFile, setAadharFrontPreview)} accept="image/*" />
                                </div>
                            </div>
                            <div>
                                <label className="block text-[10px] font-bold text-gray-500 uppercase mb-1">Aadhar Back</label>
                                <div className="relative h-24 border-2 border-dashed border-gray-300 rounded-xl overflow-hidden bg-gray-50 flex items-center justify-center">
                                    {aadharBackPreview ? <img src={aadharBackPreview} className="w-full h-full object-cover" /> : <span className="text-xs text-gray-400">+ Upload</span>}
                                    <input type="file" className="absolute inset-0 opacity-0" onChange={(e) => handleFileChange(e, setAadharBackFile, setAadharBackPreview)} accept="image/*" />
                                </div>
                            </div>
                        </div>
                        <div>
                            <label className="block text-[10px] font-bold text-gray-500 uppercase mb-1">Driver's License</label>
                            <div className="relative h-24 border-2 border-dashed border-gray-300 rounded-xl overflow-hidden bg-gray-50 flex items-center justify-center">
                                {licensePreview ? <img src={licensePreview} className="w-full h-full object-cover" /> : <span className="text-xs text-gray-400">+ Upload</span>}
                                <input type="file" className="absolute inset-0 opacity-0" onChange={(e) => handleFileChange(e, setLicenseFile, setLicensePreview)} accept="image/*" />
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>

        <div className="p-6 border-t border-gray-100 mt-auto bg-gray-50 flex gap-3">
            {step > 1 && (
                <button onClick={handleBack} disabled={isProcessing} className="px-6 py-4 rounded-xl font-bold text-gray-700 bg-white border-2 border-gray-200 hover:bg-gray-100 transition-all uppercase tracking-wide text-sm">Back</button>
            )}
            {step < 4 ? (
                <button 
                    onClick={handleNext}
                    disabled={step === 1 ? (days <= 0 || !!availabilityError) : (step === 2 ? !signatureName : !transactionId)}
                    className={`flex-1 py-4 rounded-xl font-bold text-white shadow-lg transition-all ${((step === 1 && (days <= 0 || !!availabilityError)) || (step === 2 && !signatureName) || (step === 3 && !transactionId)) ? 'bg-gray-300 cursor-not-allowed' : 'bg-red-600 hover:bg-red-700'}`}
                >
                    {step === 1 ? (availabilityError || `Proceed to Terms (₹${advanceAmount})`) : step === 2 ? 'Accept & Proceed to Payment' : 'Verify Payment & Proceed to KYC'}
                </button>
            ) : (
                <button onClick={handleFinalSubmit} disabled={isProcessing} className="flex-1 py-4 rounded-xl font-bold text-white shadow-lg transition-all bg-green-600 hover:bg-green-700 flex items-center justify-center gap-2">
                    {isProcessing ? 'Confirming...' : 'Submit Booking'}
                </button>
            )}
        </div>
      </div>
    </div>
  );
};

export default BookingModal;
