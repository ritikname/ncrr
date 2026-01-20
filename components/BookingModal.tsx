
import React, { useState, useEffect } from 'react';
import { Car, UserProfile, Booking } from '../types';

interface BookingModalProps {
  car: Car | null;
  isOpen: boolean;
  userProfile: UserProfile | null;
  paymentQrCode?: string;
  existingBookings: Booking[];
  prefillDates?: { start: string, end: string };
  onClose: () => void;
  onConfirm: (bookingData: any) => Promise<void> | void;
}

const TERMS_TEXT = `
Terms & Conditions – Self Drive Rental Cars
Company Name: NCR Drive Rental Cars
Email: ncrdrivecar@gmail.com Contact: +91-9971143873

1. Eligibility
- Customer must be at least 21 years old (or as per state law).
- Must hold a valid driving license recognized in India.
- Must provide a valid government ID proof (Aadhar/Passport/Voter ID).
- International renters must provide a valid passport and International Driving Permit (IDP).

2. Booking & Payment
- Booking confirmation is subject to payment of the rental fee and refundable security deposit.
- Payment can be made via cash, UPI, card, or online transfer.
- Security deposit will be refunded within 7 working days after return, subject to deductions (if any).

3. Vehicle Usage
- The vehicle shall be used only for personal use, not for sub-rental, commercial, racing, illegal or hazardous activities.
- Customer must drive responsibly and follow all traffic rules.
- Smoking, alcohol consumption, or carrying illegal substances in the car is strictly prohibited.
- Only the registered driver(s) may operate the vehicle.

4. Fuel & Mileage
- Vehicles are provided with a certain fuel level and must be returned with the same level.
- Any shortage will be charged as per fuel rates.
- Mileage limits (if applicable) will be informed at the time of booking. Excess usage will be charged per kilometer.

5. Damages & Accidents
- Customer is responsible for any damage, accident, or loss caused to the vehicle during the rental period.
- In case of accident/theft, customer must immediately inform the company and police.
- Insurance will cover major damages as per policy, but minor damages, scratches, tyre punctures, interior damage, towing, and traffic fines are chargeable to the customer.

6. Insurance & Liability
- Vehicles are covered under comprehensive motor insurance as per law.
- Insurance will not cover damages caused due to negligence, drunk driving, unauthorized driver, or illegal activities.
- Customer is liable to pay the deductible/excess amount in case of insurance claim.

7. Traffic Rules & Fines
- All traffic violations, challans, and penalties during the rental period will be borne by the customer.
- Delay in payment of challans may result in deduction from security deposit.

8. Return Policy
- Vehicle must be returned at the agreed time and location.
- Late return will be charged at hourly rates (or as decided by company).
- If not returned within 24 hours of due time without notice, it will be treated as vehicle theft and reported to police.

9. Cancellation & Refund
- Cancellations before 24 hours of booking start time: Full refund (minus admin fee).
- Cancellations within 24 hours: 50% refund.
- No refund after the rental period has started.

10. Company Rights
- Company reserves the right to refuse rental to any person deemed unsuitable.
- Company may repossess the vehicle at any time if terms are violated.

11. Indemnity
- The customer agrees to indemnify and hold the company harmless from any claims, damages, liabilities, or costs arising from use of the vehicle during the rental period.

12. Jurisdiction
- This Agreement shall be governed by the laws of India, and any disputes shall be subject to the jurisdiction of courts in Delhi, NCR.

Agreement & Signature
I hereby declare that I have read and understood the above Terms & Conditions of NCR Drive Rental Cars. I agree to abide by all rules and accept full responsibility for the rented vehicle during my rental period.
`;

// Helper: Resize Base64 String directly (used for Car Image optimization)
const resizeBase64 = (base64Str: string, maxWidth = 600, quality = 0.5): Promise<string> => {
  return new Promise((resolve) => {
    const img = new Image();
    img.src = base64Str;
    img.onload = () => {
      const canvas = document.createElement('canvas');
      let width = img.width;
      let height = img.height;
      if (width > maxWidth) {
        height *= maxWidth / width;
        width = maxWidth;
      }
      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext('2d');
      ctx?.drawImage(img, 0, 0, width, height);
      resolve(canvas.toDataURL('image/jpeg', quality));
    };
    img.onerror = () => resolve(base64Str); // Return original if fail
  });
};

const BookingModal: React.FC<BookingModalProps> = ({ 
  car, isOpen, userProfile, paymentQrCode, existingBookings, prefillDates, onClose, onConfirm 
}) => {
  // Step 1 State
  const [customerName, setCustomerName] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [email, setEmail] = useState('');
  const [userLocation, setUserLocation] = useState('');
  const [aadharPhone, setAadharPhone] = useState('');
  const [altPhone, setAltPhone] = useState('');
  
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [totalCost, setTotalCost] = useState(0);
  const [days, setDays] = useState(0);
  const [availabilityError, setAvailabilityError] = useState('');
  
  // Step 2 State (Signature)
  const [signatureName, setSignatureName] = useState('');

  // Step 3 State (Payment)
  const [transactionId, setTransactionId] = useState('');

  // Step 4 State (KYC)
  const [aadharFront, setAadharFront] = useState<string | null>(null);
  const [aadharBack, setAadharBack] = useState<string | null>(null);
  const [licensePhoto, setLicensePhoto] = useState<string | null>(null);
  const [securityDepositType, setSecurityDepositType] = useState('₹5,000 Cash');
  const [securityDepositUtr, setSecurityDepositUtr] = useState('');
  
  const [step, setStep] = useState<1 | 2 | 3 | 4>(1);
  const [isProcessing, setIsProcessing] = useState(false);
  const [locLoading, setLocLoading] = useState(false);

  // Helper for local date YYYY-MM-DD
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
      setEmail('');
      setUserLocation('');
      setAadharPhone('');
      setAltPhone('');
      
      const s = prefillDates?.start || '';
      const e = prefillDates?.end || '';
      setStartDate(s);
      setEndDate(e);
      
      if (!s || !e) {
          setTotalCost(0);
          setDays(0);
      }
      
      setTransactionId('');
      setAadharFront(null);
      setAadharBack(null);
      setLicensePhoto(null);
      setSecurityDepositType('₹5,000 Cash');
      setSecurityDepositUtr('');
      setSignatureName('');
      setStep(1);
      setIsProcessing(false);
      setAvailabilityError('');
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen]); 

  // --- Helper: Compress Image to avoid mobile crash & reduce payload ---
  const compressImage = (file: File): Promise<string> => {
    return new Promise((resolve) => {
        const reader = new FileReader();
        reader.readAsDataURL(file);
        reader.onload = (event) => {
            const img = new Image();
            img.src = event.target?.result as string;
            img.onload = () => {
                const canvas = document.createElement('canvas');
                // Aggressive compression for mobile uploads
                const MAX_WIDTH = 800; 
                let width = img.width;
                let height = img.height;

                if (width > MAX_WIDTH) {
                  height *= MAX_WIDTH / width;
                  width = MAX_WIDTH;
                }

                canvas.width = width;
                canvas.height = height;

                const ctx = canvas.getContext('2d');
                ctx?.drawImage(img, 0, 0, width, height);
                // 0.5 Quality for very small file size
                resolve(canvas.toDataURL('image/jpeg', 0.5)); 
            };
            img.onerror = () => {
                resolve(""); // Fallback empty if fail
            };
        };
        reader.onerror = () => resolve("");
    });
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>, setter: React.Dispatch<React.SetStateAction<string | null>>) => {
    const file = e.target.files?.[0];
    if (file) {
      try {
        const compressedBase64 = await compressImage(file);
        if (!compressedBase64) {
             alert("Error reading image. Try another.");
             return;
        }
        setter(compressedBase64);
      } catch(e) {
        alert("Error processing image. Please try a different photo.");
      }
    }
  };

  // --- Geolocation Handler ---
  const handleDetectLocation = () => {
    setLocLoading(true);
    setUserLocation("Triangulating precise location...");
    
    if (!navigator.geolocation) {
      alert("Geolocation is not supported by this browser.");
      setUserLocation("");
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
             setUserLocation(`${parts} [${preciseCoords}]`);
          } else {
             setUserLocation(preciseCoords);
          }
        } catch (e) {
          setUserLocation(preciseCoords);
        }
        setLocLoading(false);
      },
      (error) => {
        alert("Unable to fetch location. Please check permissions.");
        setUserLocation(""); 
        setLocLoading(false);
      },
      { enableHighAccuracy: true, timeout: 15000, maximumAge: 0 }
    );
  };

  // --- Logic ---
  const checkConflicts = (start: string, end: string) => {
    if (!car || !start || !end) return false;
    const totalStock = car.totalStock || 1;
    const conflictingBookings = existingBookings.filter(b => 
      b.carId === car.id &&
      b.status === 'confirmed' &&
      start <= b.endDate && b.startDate <= end
    );

    if (conflictingBookings.length >= totalStock) {
      setAvailabilityError(`Sold out for selected dates. (${conflictingBookings.length}/${totalStock} booked)`);
      return true;
    }
    setAvailabilityError('');
    return false;
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
        setDays(0);
        setTotalCost(0);
        setAvailabilityError('End date must be after start date');
      }
    }
  }, [startDate, endDate, car]);

  const handleNext = () => {
    if (step === 1) {
        if (!startDate || !endDate || days <= 0 || !customerName || !customerPhone || !email || !userLocation || !aadharPhone || !altPhone) {
            alert("⚠️ Please fill ALL contact and trip details before proceeding.");
            return;
        }
        if (checkConflicts(startDate, endDate)) return;
        setStep(2); // Go to T&C
    } else if (step === 2) {
        if (!signatureName.trim()) {
            alert("⚠️ Please type your full name to sign the Terms & Conditions.");
            return;
        }
        setStep(3); // Go to Payment
    } else if (step === 3) {
        if (!transactionId.trim()) {
            alert("⚠️ Please enter the Transaction ID/UTR for the advance payment.");
            return;
        }
        setStep(4); // Go to KYC
    }
  };

  const handleFinalSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!aadharFront || !aadharBack || !licensePhoto) {
        alert("⚠️ Please upload all required KYC documents (Aadhar & License).");
        return;
    }
    
    if (securityDepositType === '₹5,000 Cash' && !securityDepositUtr.trim()) {
        alert("⚠️ Please enter the UTR / Transaction ID for the security deposit payment.");
        return;
    }

    setIsProcessing(true);
    
    // Tiny delay for UX smoother transition
    await new Promise(resolve => setTimeout(resolve, 300));

    if (car) {
        try {
            // FIX: Ensure car image is compressed before sending payload
            // Use existing car image or compress it if it looks huge
            let optimizedCarImage = car.imageBase64;
            if (optimizedCarImage && optimizedCarImage.length > 50000) {
               try {
                 optimizedCarImage = await resizeBase64(optimizedCarImage, 400, 0.6);
               } catch(e) {
                 console.warn("Could not optimize car image for payload");
               }
            }

            await onConfirm({
                carId: car.id,
                carName: car.name,
                carImage: optimizedCarImage,
                customerName,
                customerPhone,
                email,
                userLocation,
                aadharPhone,
                altPhone,
                startDate,
                endDate,
                totalCost,
                advanceAmount: totalCost * 0.10,
                transactionId,
                days,
                aadharFront,
                aadharBack,
                licensePhoto,
                securityDepositType,
                // Ensure null, not undefined, for database binding safety
                securityDepositTransactionId: securityDepositType === '₹5,000 Cash' ? securityDepositUtr : null,
                signature: signatureName
            });
            // If success, parent closes modal, component unmounts.
        } catch(e) {
            console.error("Booking error caught in modal:", e);
            alert("Booking Submission Failed. Please try again.");
        } finally {
            setIsProcessing(false);
        }
    }
  };

  if (!isOpen || !car) return null;

  const advanceAmount = Math.round(totalCost * 0.10);

  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-gray-900/70 backdrop-blur-sm transition-opacity" onClick={onClose}></div>
      
      <div className="relative bg-white rounded-3xl shadow-2xl max-w-lg w-full overflow-hidden animate-fade-in flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="relative h-20 bg-black flex items-center px-6 justify-between flex-shrink-0">
           <div>
             <div className="text-red-500 text-xs font-bold uppercase tracking-wider mb-0.5">Booking Step {step}/4</div>
             <div className="text-white text-lg font-bold">
                {step === 1 ? 'Trip & Contact Details' : 
                 step === 2 ? 'Terms & Conditions' : 
                 step === 3 ? 'Secure Payment' : 'KYC & Security'}
             </div>
           </div>
           <button onClick={onClose} className="bg-white/10 hover:bg-white/20 text-white p-2 rounded-full transition-colors">
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
          </button>
        </div>

        {/* Form Content */}
        <div className="overflow-y-auto p-6 scrollbar-hide">
            
            {step === 1 && (
                <div className="space-y-4">
                    {/* Car Summary */}
                    <div className="flex items-center gap-4 bg-gray-50 p-3 rounded-xl border border-gray-100">
                        <img src={car.imageBase64} className="w-16 h-16 object-cover rounded-lg" alt="car" />
                        <div>
                            <h4 className="font-bold text-gray-900">{car.name}</h4>
                            <div className="text-xs text-gray-500">₹{car.pricePerDay}/day • {days} Days</div>
                        </div>
                    </div>

                    {availabilityError && <div className="text-red-600 text-xs font-bold bg-red-50 p-2 rounded">{availabilityError}</div>}

                    {/* Dates */}
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-[10px] font-bold text-gray-500 uppercase mb-1">Pick-up</label>
                            <div className="relative w-full">
                                <input 
                                    type="date" 
                                    min={getTodayString()} 
                                    value={startDate} 
                                    onChange={(e) => setStartDate(e.target.value)} 
                                    className="w-full px-3 py-2 border rounded-lg text-sm appearance-none pr-8 relative z-10 bg-transparent" 
                                    style={{ WebkitAppearance: 'none' }}
                                />
                                <div className="absolute top-1/2 -translate-y-1/2 right-3 pointer-events-none text-gray-500 z-0">
                                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
                                </div>
                            </div>
                        </div>
                        <div>
                            <label className="block text-[10px] font-bold text-gray-500 uppercase mb-1">Return</label>
                            <div className="relative w-full">
                                <input 
                                    type="date" 
                                    min={startDate || getTodayString()} 
                                    value={endDate} 
                                    onChange={(e) => setEndDate(e.target.value)} 
                                    className="w-full px-3 py-2 border rounded-lg text-sm appearance-none pr-8 relative z-10 bg-transparent" 
                                    style={{ WebkitAppearance: 'none' }}
                                />
                                <div className="absolute top-1/2 -translate-y-1/2 right-3 pointer-events-none text-gray-500 z-0">
                                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Extended Contact Details */}
                    <div className="space-y-3 pt-2">
                        <div className="grid grid-cols-2 gap-3">
                             <div>
                               <label className="block text-[10px] font-bold text-gray-500 uppercase mb-1">Name</label>
                               <input type="text" placeholder="Name" value={customerName} readOnly className="w-full px-3 py-2 border rounded-lg bg-gray-50 text-sm" />
                             </div>
                             <div>
                               <label className="block text-[10px] font-bold text-gray-500 uppercase mb-1">Phone <span className="text-black font-extrabold">(WhatsApp)</span></label>
                               <input 
                                 type="text" 
                                 placeholder="Phone" 
                                 value={customerPhone} 
                                 onChange={(e) => setCustomerPhone(e.target.value)} 
                                 className="w-full px-3 py-2 border rounded-lg bg-white text-sm focus:ring-2 focus:ring-red-600 outline-none" 
                               />
                             </div>
                        </div>
                        <input type="email" placeholder="Email ID" value={email} onChange={(e) => setEmail(e.target.value)} className="w-full px-3 py-2 border rounded-lg text-sm" />
                        
                        <div className="flex gap-2">
                            <input type="text" placeholder="Exact Location & Coordinates" value={userLocation} onChange={(e) => setUserLocation(e.target.value)} disabled={locLoading} className={`w-full px-3 py-2 border rounded-lg text-sm ${locLoading ? 'bg-gray-50 text-gray-500' : 'bg-white'}`} />
                            <button onClick={handleDetectLocation} disabled={locLoading} className="bg-red-600 hover:bg-red-700 text-white px-3 py-2 rounded-lg text-xs font-bold whitespace-nowrap transition-colors flex items-center gap-1">
                                {locLoading ? 'Triangulating' : '📍 Fetch GPS'}
                            </button>
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
                        
                        <input 
                            type="text"
                            value={signatureName}
                            onChange={(e) => setSignatureName(e.target.value)}
                            placeholder="Type Full Name to Sign"
                            className="w-full px-4 py-3 border-2 border-gray-300 rounded-xl font-bold text-lg focus:border-black outline-none transition-colors"
                        />
                    </div>
                </div>
            )}

            {step === 3 && (
                <div className="space-y-6 animate-fade-in">
                    <div className="bg-red-50 p-4 rounded-xl border border-red-100">
                        <div className="flex justify-between text-sm text-gray-600 mb-1">
                            <span>Total Trip Cost ({days} days)</span>
                            <span className="line-through">₹{totalCost.toLocaleString()}</span>
                        </div>
                        <div className="flex justify-between items-center">
                            <span className="font-bold text-red-900">Advance (10%)</span>
                            <span className="font-bold text-2xl text-red-600">₹{advanceAmount.toLocaleString()}</span>
                        </div>
                    </div>

                    <div className="text-center">
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
                        {/* Security Deposit */}
                        <div>
                            <label className="block text-xs font-bold text-gray-700 uppercase mb-1">Security Deposit Type</label>
                            <select 
                                value={securityDepositType} 
                                onChange={(e) => setSecurityDepositType(e.target.value)} 
                                className="w-full px-3 py-3 border border-gray-200 rounded-xl bg-white focus:ring-2 focus:ring-red-600"
                            >
                                <option value="₹5,000 Cash">₹5,000 Cash</option>
                                <option value="Laptop">Laptop</option>
                                <option value="2-Wheeler">2-Wheeler</option>
                                <option value="Passport">Passport</option>
                            </select>
                        </div>
                        
                        {/* Cash Deposit Payment Section */}
                        {securityDepositType === '₹5,000 Cash' && (
                            <div className="bg-orange-50 p-4 rounded-xl border border-orange-100 animate-fade-in">
                                <h4 className="font-bold text-orange-900 text-sm mb-3 flex items-center gap-2">
                                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                                    Pay Security Deposit
                                </h4>
                                <div className="flex flex-col sm:flex-row gap-4 items-center">
                                     <div className="bg-white p-2 rounded-lg border border-gray-200 flex-shrink-0">
                                          {paymentQrCode ? (
                                              <img src={paymentQrCode} className="w-24 h-24 object-contain" alt="Security Deposit QR" />
                                          ) : (
                                              <div className="w-24 h-24 flex items-center justify-center text-[10px] text-gray-400">No QR</div>
                                          )}
                                     </div>
                                     <div className="flex-1 w-full">
                                          <label className="block text-xs font-bold text-gray-600 mb-1">Security Deposit UTR / Transaction ID</label>
                                          <input 
                                              type="text" 
                                              value={securityDepositUtr}
                                              onChange={e => setSecurityDepositUtr(e.target.value)}
                                              placeholder="Enter Deposit Payment Ref"
                                              className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-orange-500 bg-white font-mono uppercase text-sm"
                                          />
                                          <p className="text-[10px] text-gray-500 mt-1.5 leading-tight">Please scan the QR code to pay <strong>₹5,000</strong> as security deposit and enter the transaction reference number above.</p>
                                     </div>
                                </div>
                            </div>
                        )}

                        {/* File Uploads */}
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="block text-[10px] font-bold text-gray-500 uppercase mb-1">Aadhar Front</label>
                                <div className="relative h-24 border-2 border-dashed border-gray-300 rounded-xl overflow-hidden bg-gray-50 flex items-center justify-center">
                                    {aadharFront ? <img src={aadharFront} className="w-full h-full object-cover" /> : <span className="text-xs text-gray-400">+ Upload</span>}
                                    <input type="file" className="absolute inset-0 opacity-0" onChange={(e) => handleFileChange(e, setAadharFront)} accept="image/*" />
                                </div>
                            </div>
                            <div>
                                <label className="block text-[10px] font-bold text-gray-500 uppercase mb-1">Aadhar Back</label>
                                <div className="relative h-24 border-2 border-dashed border-gray-300 rounded-xl overflow-hidden bg-gray-50 flex items-center justify-center">
                                    {aadharBack ? <img src={aadharBack} className="w-full h-full object-cover" /> : <span className="text-xs text-gray-400">+ Upload</span>}
                                    <input type="file" className="absolute inset-0 opacity-0" onChange={(e) => handleFileChange(e, setAadharBack)} accept="image/*" />
                                </div>
                            </div>
                        </div>
                        <div>
                            <label className="block text-[10px] font-bold text-gray-500 uppercase mb-1">Driver's License</label>
                            <div className="relative h-24 border-2 border-dashed border-gray-300 rounded-xl overflow-hidden bg-gray-50 flex items-center justify-center">
                                {licensePhoto ? <img src={licensePhoto} className="w-full h-full object-cover" /> : <span className="text-xs text-gray-400">+ Upload</span>}
                                <input type="file" className="absolute inset-0 opacity-0" onChange={(e) => handleFileChange(e, setLicensePhoto)} accept="image/*" />
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>

        {/* Footer Actions */}
        <div className="p-6 border-t border-gray-100 mt-auto bg-gray-50">
            {step < 4 ? (
                <button 
                    onClick={handleNext}
                    disabled={step === 1 ? (days <= 0 || !!availabilityError) : (step === 2 ? !signatureName : !transactionId)}
                    className={`w-full py-4 rounded-xl font-bold text-white shadow-lg transition-all ${
                        ((step === 1 && (days <= 0 || !!availabilityError)) || 
                         (step === 2 && !signatureName) || 
                         (step === 3 && !transactionId)) 
                         ? 'bg-gray-300 cursor-not-allowed' : 'bg-red-600 hover:bg-red-700'}`}
                >
                    {step === 1 ? (availabilityError || `Proceed to Terms (₹${advanceAmount})`) : 
                     step === 2 ? 'Accept & Proceed to Payment' :
                     'Verify Payment & Proceed to KYC'}
                </button>
            ) : (
                <button 
                    onClick={handleFinalSubmit}
                    disabled={isProcessing}
                    className="w-full py-4 rounded-xl font-bold text-white shadow-lg transition-all bg-green-600 hover:bg-green-700 flex items-center justify-center gap-2"
                >
                    {isProcessing ? 'Confirming...' : 'Submit Booking'}
                </button>
            )}
        </div>
      </div>
    </div>
  );
};

export default BookingModal;
