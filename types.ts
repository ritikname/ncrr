
export type ViewMode = 'customer' | 'owner';

export type CarStatus = 'available' | 'sold';

export type FuelType = 'Petrol' | 'Diesel' | 'Electric' | 'Hybrid';
export type Transmission = 'Automatic' | 'Manual';
export type CarCategory = 'All' | 'SUV' | 'Sedan' | 'Hatchback';

export interface Car {
  id: string;
  name: string;
  pricePerDay: number;
  imageBase64: string; // This will now hold the R2 URL
  galleryImages: string[]; 
  status: CarStatus;
  createdAt: number;
  
  fuelType: FuelType;
  transmission: Transmission;
  seats: number;
  rating: number; 
  totalStock: number; 
  category: CarCategory; 
}

export interface Booking {
  id: string;
  carId: string;
  carName: string;
  carImage: string;
  userEmail?: string;
  customerName: string;
  customerPhone: string;
  
  email: string;
  userLocation: string;
  aadharPhone: string;
  altPhone: string;
  
  startDate: string;
  endDate: string;
  totalCost: number;
  advanceAmount: number;
  transactionId: string;
  days: number;
  location: string; 
  createdAt: number;
  status: 'confirmed' | 'completed' | 'cancelled';
  
  isApproved?: boolean;
  
  aadharFront?: string; // R2 URL
  aadharBack?: string; // R2 URL
  licensePhoto?: string; // R2 URL
  securityDepositType?: string;
  securityDepositTransactionId?: string; 
  signature?: string; 
}

export interface UserProfile {
  name: string;
  phone: string;
  email?: string;
  role?: string;
}

export interface HeroSlide {
  id: string;
  imageUrl: string;
  title: string;
  description: string;
}
