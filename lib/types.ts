export type ProductCategory = 
  | 'none'
  | 'cat_fruits' 
  | 'cat_veggies' 
  | 'cat_dairy' 
  | 'cat_bakery' 
  | 'cat_meals' 
  | 'cat_snacks'
  | 'cart_page'
  | (string & {});

export const CATEGORY_LABELS: Record<string, string> = {
  none: '🚫 None (No Redirection)',
  cat_fruits: 'Fresh Fruits',
  cat_veggies: 'Vegetables & Herbs',
  cat_dairy: 'Dairy & Milk',
  cat_bakery: 'Bakery & Bread',
  cat_meals: 'Ready Meals & Instant',
  cat_snacks: 'Snacks & Beverages',
  cart_page: '🛒 Open Cart Page / Checkout',
};

export interface Product {
  id: string;
  name: string;
  category: ProductCategory;
  price: number;
  originalPrice: number;
  discountTag?: string;
  unit: string; // e.g. "1 Litre", "1 kg", "500g", "Dozen"
  inStock: boolean;
  image: string;
  createdAt?: string;
  updatedAt?: string;
}

export type OrderStatus = 'PLACED' | 'PACKING' | 'OUT_FOR_DELIVERY' | 'AT_DOORSTEPS' | 'DELIVERED' | 'CANCELLED';

export interface OrderItem {
  productId: string;
  name: string;
  price: number;
  quantity: number;
  unit: string;
  image?: string;
}

export interface Order {
  id: string; // e.g. "#MAG-987452"
  customerName: string;
  phone: string;
  contactNumber?: string;
  address: string;
  location?: string;
  latitude?: number;
  longitude?: number;
  notifyuser?: string;
  deliveryTiming?: string;
  items: OrderItem[];
  totalAmount: number;
  deliveryFee?: number;
  discount?: number;
  paymentStatus: 'COD' | 'ONLINE_PAID';
  status: OrderStatus;
  deliveryStatus?: string;
  isPinned?: boolean;
  createdAt: string;
  updatedAt?: string;
}

export interface PushNotification {
  id: string;
  title: string;
  body: string;
  targetAudience: 'All Users' | 'Active Buyers';
  sentAt: string;
  reachCount: number;
  status: 'SENT' | 'FAILED';
}

export interface UserProfile {
  id: string;
  magoziId?: string;
  fullName: string;
  email: string;
  phone: string;
  photoUrl?: string;
  deliveryAddresses?: any[];
  savedAddresses?: any[];
  location?: string;
  addressesCount: number;
  registeredDate: string;
  registrationDate?: string;
  createdAt?: string;
  role: 'admin' | 'user';
  addresses?: string[];
}

export interface AdminRole {
  email: string;
  uid?: string;
  role: 'admin';
  assignedAt?: string;
}

export interface AppConfigSettings {
  minOrderAmount: number;
  handlingFee: number;
  deliveryFee: number;
  freeDeliveryThreshold: number;
  cancelOrderTimer: number; // Order cancel window limit (in seconds)
  termsAndConditions: string;
  privacyPolicy: string;
  refundPolicy: string;
  shippingPolicy: string;
  aboutUs: string;
}

export interface SupportConfigSettings {
  phone: string;
  email: string;
  whatsapp: string;
  telegram: string;
}

export interface Banner {
  id: string;
  title?: string;
  subtitle?: string;
  imageUrl: string;
  targetCategoryId: ProductCategory;
  priority: number;
  active: boolean;
}

export interface Superstore {
  id: string;
  name?: string;
  branchName?: string;
  isOpen?: boolean;
  openStatus?: 'OPEN' | 'CLOSED' | string;
  rating?: string | number;
  location?: string;
  fullAddress?: string;
  address?: string;
  contactNumber?: string;
  phone?: string;
  description?: string;
  openCloseTime?: string;
  vegType?: string;
  emoji?: string;
  imageUrl: string;
  image?: string;
  photoUrl?: string;
  logoUrl?: string;
  logo?: string;
  storeLogo?: string;
  distanceKm?: string | number;
  lastUpdated?: number;
  updatedAt?: string;
}

export interface CategoryItem {
  id: string;
  name: string;
  imageUrl: string;
  priority?: number;
  isActive?: boolean;
  createdAt?: string;
  updatedAt?: string;
}

