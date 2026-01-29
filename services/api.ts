
import { Car, Booking, PromoCode } from '../types';

// In production, relative URL works because Frontend & Backend are on same domain (or proxy)
const API_URL = '/api';

const handleResponse = async (res: Response) => {
  const contentType = res.headers.get('content-type');
  if (!res.ok) {
    let errorMsg = 'Request failed';
    try {
      if (contentType && contentType.includes('application/json')) {
        const data = await res.json();
        errorMsg = data.error || errorMsg;
      } else {
        errorMsg = await res.text();
      }
    } catch (e) {
      // Ignore parsing errors
    }
    throw new Error(errorMsg);
  }
  return res.json();
};

export const api = {
  system: {
    init: () => fetch(`${API_URL}/init`).then(handleResponse)
  },
  settings: {
    get: () => fetch(`${API_URL}/settings`).then(handleResponse),
    update: (data: any) => fetch(`${API_URL}/settings`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
    }).then(handleResponse)
  },
  analytics: {
    getSalesReport: () => fetch(`${API_URL}/owner/sales-report`).then(handleResponse)
  },
  users: {
    getAll: () => fetch(`${API_URL}/users`).then(handleResponse)
  },
  auth: {
    me: () => fetch(`${API_URL}/auth/me`).then(handleResponse),
    
    login: (creds: any) => fetch(`${API_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(creds)
    }).then(handleResponse),
    
    signup: (data: any) => fetch(`${API_URL}/auth/signup`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    }).then(handleResponse),

    onboard: (data: {name: string, phone: string}) => fetch(`${API_URL}/auth/onboard`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
    }).then(handleResponse),
    
    logout: () => fetch(`${API_URL}/auth/logout`, { method: 'POST' }).then(handleResponse),
    
    forgotPassword: (email: string) => fetch(`${API_URL}/auth/forgot-password`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email })
    }).then(handleResponse),
    
    resetPassword: (data: any) => fetch(`${API_URL}/auth/reset-password`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    }).then(handleResponse),
  },
  
  promos: {
    getAll: async (): Promise<PromoCode[]> => fetch(`${API_URL}/promos`).then(handleResponse),
    create: (data: { code: string; percentage: number }) => fetch(`${API_URL}/promos`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
    }).then(handleResponse),
    delete: (id: number) => fetch(`${API_URL}/promos/${id}`, { method: 'DELETE' }).then(handleResponse),
    validate: (code: string, email: string) => fetch(`${API_URL}/promos/validate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code, email })
    }).then(handleResponse)
  },
  
  cars: {
    getAll: async (): Promise<Car[]> => {
      const cars = await fetch(`${API_URL}/cars`).then(handleResponse);
      return cars.map((c: any) => ({
        ...c,
        imageBase64: c.image_url, 
        // Parse gallery JSON string to array
        galleryImages: c.gallery_images ? JSON.parse(c.gallery_images) : [],
        pricePerDay: Number(c.price_per_day || 0),
        totalStock: Number(c.total_stock || 1),
        fuelType: c.fuel_type,
        id: c.uuid || c.id.toString(),
        createdAt: c.created_at || c.createdAt || Date.now() 
      }));
    },
    
    // Updated to send FormData
    add: async (formData: FormData) => {
      return fetch(`${API_URL}/cars`, {
        method: 'POST',
        body: formData, 
      }).then(handleResponse);
    },

    update: (id: string, data: any) => fetch(`${API_URL}/cars/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
    }).then(handleResponse),

    updateStatus: (id: string, status: string) => fetch(`${API_URL}/cars/${id}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status })
    }).then(handleResponse),

    delete: (id: string) => fetch(`${API_URL}/cars/${id}`, {
        method: 'DELETE'
    }).then(handleResponse)
  },
  
  bookings: {
    create: (formData: FormData) => fetch(`${API_URL}/bookings`, {
      method: 'POST',
      body: formData
    }).then(handleResponse),
    
    getMyBookings: async (): Promise<Booking[]> => {
      const bookings = await fetch(`${API_URL}/bookings`).then(handleResponse);
      return bookings.map((b: any) => {
        // Safe Number Parsing
        const parseCost = (val: any) => {
           const num = Number(val);
           return isNaN(num) ? 0 : num;
        };

        return {
            ...b,
            carName: b.car_name,
            carImage: b.car_image,
            userEmail: b.user_email,
            customerName: b.customer_name,
            customerPhone: b.customer_phone,
            startDate: b.start_date,
            endDate: b.end_date,
            
            // STRICT NUMBER CASTING
            totalCost: parseCost(b.total_cost),
            advanceAmount: parseCost(b.advance_amount),
            discountAmount: parseCost(b.discount_amount),
            
            transactionId: b.transaction_id,
            isApproved: b.is_approved === 1,
            userLocation: b.location, 
            location: b.location,
            userGps: b.user_gps,
            
            aadharFront: b.aadhar_front,
            aadharBack: b.aadhar_back,
            licensePhoto: b.license_photo,
            securityDepositType: b.security_deposit_type,
            securityDepositTransactionId: b.security_deposit_transaction_id,
            promoCode: b.promo_code,
            
            createdAt: b.created_at || b.createdAt || Date.now() 
        };
      });
    },

    getAvailability: () => fetch(`${API_URL}/public/availability`).then(handleResponse),
    
    updateStatus: (id: string, updates: any) => fetch(`${API_URL}/bookings/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(updates)
    }).then(handleResponse)
  }
};
