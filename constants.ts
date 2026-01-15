
import { Car } from './types';

export const INITIAL_CARS: Car[] = [
  {
    id: '1',
    name: 'Toyota Fortuner Legender',
    pricePerDay: 5000,
    imageBase64: 'https://stimg.cardekho.com/images/carexteriorimages/630x420/Toyota/Fortuner-Legender/10229/1764935522846/front-left-side-47.jpg?tr=w-664',
    galleryImages: [
      'https://stimg.cardekho.com/images/carexteriorimages/630x420/Toyota/Fortuner-Legender/10229/1764935522846/front-left-side-47.jpg?tr=w-664',
      'https://imgd.aeplcdn.com/664x374/n/cw/ec/44777/fortuner-legender-exterior-right-front-three-quarter-5.jpeg?q=80',
    ],
    status: 'available',
    createdAt: Date.now() - 100000,
    fuelType: 'Diesel',
    transmission: 'Automatic',
    seats: 7,
    rating: 4.8,
    totalStock: 3,
    category: 'SUV'
  },
  {
    id: '2',
    name: 'Hyundai Creta SX',
    pricePerDay: 2500,
    imageBase64: 'https://stimg.cardekho.com/images/carexteriorimages/630x420/Hyundai/Creta/8667/1755765115423/front-left-side-47.jpg?tr=w-664',
    galleryImages: [],
    status: 'sold',
    createdAt: Date.now() - 200000,
    fuelType: 'Petrol',
    transmission: 'Manual',
    seats: 5,
    rating: 4.5,
    totalStock: 1,
    category: 'SUV'
  },
  {
    id: '3',
    name: 'Maruti Suzuki Swift',
    pricePerDay: 1200,
    imageBase64: 'https://stimg.cardekho.com/images/carexteriorimages/630x420/Maruti/Swift/9226/1755777061785/front-left-side-47.jpg?tr=w-664',
    galleryImages: [],
    status: 'available',
    createdAt: Date.now() - 300000,
    fuelType: 'Petrol',
    transmission: 'Manual',
    seats: 5,
    rating: 4.2,
    totalStock: 5,
    category: 'Hatchback'
  },
  {
    id: '4',
    name: 'Mahindra Thar 4x4',
    pricePerDay: 4000,
    imageBase64: 'https://stimg.cardekho.com/images/carexteriorimages/930x620/Mahindra/Thar/12264/1759841599514/front-left-side-47.jpg',
    galleryImages: [],
    status: 'available',
    createdAt: Date.now() - 400000,
    fuelType: 'Diesel',
    transmission: 'Manual',
    seats: 4,
    rating: 4.9,
    totalStock: 2,
    category: 'SUV'
  },
  {
    id: '5',
    name: 'Honda City',
    pricePerDay: 2000,
    imageBase64: 'https://stimg.cardekho.com/images/carexteriorimages/930x620/Honda/City/9710/1677914238296/front-left-side-47.jpg',
    galleryImages: [],
    status: 'available',
    createdAt: Date.now() - 500000,
    fuelType: 'Petrol',
    transmission: 'Automatic',
    seats: 5,
    rating: 4.6,
    totalStock: 3,
    category: 'Sedan'
  },
];

export const STORAGE_KEYS = {
  CARS: 'delhi_ncr_cars_v5', // Bumped version
  VIEW_MODE: 'delhi_ncr_view_mode_v1',
};
