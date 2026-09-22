import { Product, Order, PushNotification, UserProfile, AppConfigSettings, Banner, Superstore } from "./types";

export const INITIAL_PRODUCTS: Product[] = [];

export const INITIAL_ORDERS: Order[] = [];

export const INITIAL_NOTIFICATIONS: PushNotification[] = [
  {
    id: "notif-001",
    title: "🎉 Flat 50% OFF Flash Sale!",
    body: "Get fresh organic mangoes & milk delivered in 8 minutes. Order now!",
    targetAudience: "All Users",
    sentAt: "2026-09-09T09:00:00Z",
    reachCount: 1420,
    status: "SENT"
  },
  {
    id: "notif-002",
    title: "🥦 Organic Veggie Festival",
    body: "Fresh farm picks straight from local farmers to your doorstep.",
    targetAudience: "Active Buyers",
    sentAt: "2026-09-07T14:30:00Z",
    reachCount: 890,
    status: "SENT"
  }
];

export const INITIAL_USERS: UserProfile[] = [
  {
    id: "usr-001",
    fullName: "Rita Sharma (Admin)",
    email: "rita48050@gmail.com",
    phone: "+91 98765 43210",
    addressesCount: 3,
    registeredDate: "2026-01-15",
    role: "admin",
    addresses: [
      "Flat 402, Green Glen Layout, Bellandur, Bengaluru",
      "Office #501, Outer Ring Road, Devarabeesanahalli",
      "Home Town, Sector 4, Noida"
    ]
  },
  {
    id: "usr-002",
    fullName: "Priya Nair",
    email: "priya.nair@example.com",
    phone: "+91 91234 56789",
    addressesCount: 2,
    registeredDate: "2026-03-22",
    role: "user",
    addresses: [
      "House #12, 4th Cross, Koramangala 5th Block, Bengaluru"
    ]
  },
  {
    id: "usr-003",
    fullName: "Amit Gupta",
    email: "amit.g@example.com",
    phone: "+91 99887 76655",
    addressesCount: 1,
    registeredDate: "2026-05-10",
    role: "user",
    addresses: [
      "Villa 88, Prestige Lakeside Habitat, Varthur, Bengaluru"
    ]
  },
  {
    id: "usr-004",
    fullName: "Sneha Patel",
    email: "sneha.p@example.com",
    phone: "+91 97766 55443",
    addressesCount: 2,
    registeredDate: "2026-06-01",
    role: "user",
    addresses: [
      "Apt 201, Sobha Dream Acres, Panathur, Bengaluru"
    ]
  }
];

export const INITIAL_APP_CONFIG: AppConfigSettings = {
  minOrderAmount: 100,
  handlingFee: 10,
  deliveryFee: 40,
  freeDeliveryThreshold: 300,
  cancelOrderTimer: 300,
  termsAndConditions: `# Magozi Terms & Conditions

Welcome to **Magozi Grocery & Food Delivery**. By using our service, you agree to comply with the following terms:

1. **Ordering & Availability**: All orders are subject to stock availability and quick 8-minute dispatch within service zones.
2. **Pricing & Charges**: Minimum order requirement is ₹100. Deliveries under ₹300 incur a standard ₹40 delivery fee and ₹10 handling fee. Orders above ₹300 qualify for **FREE Delivery**.
3. **Payment Terms**: We accept Cash on Delivery (COD) and all major online UPI / Card payment methods.
4. **User Conduct**: Fraudulent orders or repeated non-acceptance of COD deliveries will lead to account suspension.`,
  privacyPolicy: `# Magozi Privacy Policy

Your privacy is paramount at Magozi.

- **Data Collection**: We collect minimal required information (Name, Delivery Address, Phone Number, Email) solely for executing quick order fulfillment.
- **Location Services**: Used strictly during active delivery tracking.
- **Data Protection**: Your details are safely encrypted and never sold to third parties.`,
  refundPolicy: `# Magozi Refund & Return Policy

- **Instant Refund**: Damaged or defective items reported within 15 minutes of delivery qualify for instant replacement or 100% full refund.
- **Perishables**: Fresh produce (fruits, dairy, vegetables) can be verified upon delivery with the delivery executive.`,
  shippingPolicy: `# Magozi 8-Minute Delivery Commitment

- We operate dark stores strategically located within 3 km radii to ensure ultrafast delivery within 8 to 15 minutes.
- Delivery executives follow strict food safety guidelines.`,
  aboutUs: `# About Magozi Delivery

Magozi is India's leading hyper-local grocery & food delivery platform committed to freshness, transparency, and speed. From farm-fresh Alphonso mangoes to daily organic milk, we deliver everything in minutes.`
};

export const INITIAL_SUPPORT_CONFIG = {
  phone: "+91 98765 43210",
  email: "support@magozi.com",
  whatsapp: "https://wa.me/919876543210",
  telegram: "https://t.me/magozisupport"
};

export const INITIAL_APP_OPEN_CLOSE = {
  isStoreOpen: true,
  openTime: "06:00 AM",
  closeTime: "11:30 PM",
  openingHours: "06:00 AM - 11:30 PM",
  closedMessage: "We are currently closed for orders. Operating hours are 06:00 AM - 11:30 PM.",
  autoTimingEnabled: true,
  auto_timing_enabled: true
};

export const INITIAL_BANNERS: Banner[] = [
  {
    id: "ban-001",
    title: "Fresh Summer Alphonso Mangoes 🥭",
    subtitle: "Directly from GI-certified orchards. Flat 30% OFF today!",
    imageUrl: "https://images.unsplash.com/photo-1553279768-865429fa0078?auto=format&fit=crop&w=1200&q=80",
    targetCategoryId: "cat_fruits",
    priority: 1,
    active: true
  },
  {
    id: "ban-002",
    title: "Daily Fresh Dairy & Organic Milk 🥛",
    subtitle: "Chilled milk, butter & paneer delivered in 8 mins.",
    imageUrl: "https://images.unsplash.com/photo-1528498033373-3c6c08e93d79?auto=format&fit=crop&w=1200&q=80",
    targetCategoryId: "cat_dairy",
    priority: 2,
    active: true
  }
];

export const INITIAL_SUPERSTORES: Superstore[] = [
  {
    id: "st_magozi_express",
    name: "Magozi Express Store",
    branchName: "Magozi Express Store",
    isOpen: true,
    openStatus: "OPEN",
    openTime: "06:00 AM",
    closeTime: "11:30 PM",
    autoTimingEnabled: true,
    rating: "4.9 ★ (2.5k+)",
    location: "Sector 14, MG Road, Gurgaon",
    fullAddress: "Sector 14, MG Road, Gurgaon",
    address: "Sector 14, MG Road, Gurgaon",
    contactNumber: "+91 9288585939",
    phone: "+91 9288585939",
    description: "Official Magozi flagship express superstore delivering farm-fresh organic produce, dairy, bakery, snacks, beverages, and household essentials in 8-10 minutes.",
    openCloseTime: "06:00 AM - 11:30 PM",
    vegType: "Pure Veg",
    emoji: "🏪",
    imageUrl: "https://images.unsplash.com/photo-1542838132-92c53300491e?q=80&w=1200&auto=format&fit=crop",
    image: "https://images.unsplash.com/photo-1542838132-92c53300491e?q=80&w=1200&auto=format&fit=crop",
    photoUrl: "https://images.unsplash.com/photo-1542838132-92c53300491e?q=80&w=1200&auto=format&fit=crop",
    logoUrl: "https://images.unsplash.com/photo-1542838132-92c53300491e?q=80&w=300&auto=format&fit=crop",
    logo: "https://images.unsplash.com/photo-1542838132-92c53300491e?q=80&w=300&auto=format&fit=crop",
    storeLogo: "https://images.unsplash.com/photo-1542838132-92c53300491e?q=80&w=300&auto=format&fit=crop"
  },
  {
    id: "st_harshit_sweets",
    name: "Harshit Sweets & Namkeen",
    branchName: "Harshit Sweets & Namkeen",
    isOpen: true,
    openStatus: "OPEN",
    openTime: "07:00 AM",
    closeTime: "10:00 PM",
    autoTimingEnabled: true,
    rating: "4.9 ★ (3.1k+)",
    location: "Sadar Bazar, Gurgaon",
    fullAddress: "Sadar Bazar, Gurgaon",
    address: "Sadar Bazar, Gurgaon",
    contactNumber: "+91 9818877665",
    phone: "+91 9818877665",
    description: "Famous traditional Indian sweets, kaju katli, gulab jamun, roasted salted cashews, and crispy namkeen snacks.",
    openCloseTime: "07:00 AM - 10:00 PM",
    vegType: "Pure Veg",
    emoji: "🍧",
    imageUrl: "https://images.unsplash.com/photo-1599785209707-a456a5668d27?q=80&w=1200&auto=format&fit=crop",
    image: "https://images.unsplash.com/photo-1599785209707-a456a5668d27?q=80&w=1200&auto=format&fit=crop",
    photoUrl: "https://images.unsplash.com/photo-1599785209707-a456a5668d27?q=80&w=1200&auto=format&fit=crop",
    logoUrl: "https://images.unsplash.com/photo-1599785209707-a456a5668d27?q=80&w=300&auto=format&fit=crop",
    logo: "https://images.unsplash.com/photo-1599785209707-a456a5668d27?q=80&w=300&auto=format&fit=crop",
    storeLogo: "https://images.unsplash.com/photo-1599785209707-a456a5668d27?q=80&w=300&auto=format&fit=crop"
  },
  {
    id: "st_radhe_krishna",
    name: "Radhe Krishna Organic Mart",
    branchName: "Radhe Krishna Organic Mart",
    isOpen: true,
    openStatus: "OPEN",
    openTime: "06:30 AM",
    closeTime: "09:30 PM",
    autoTimingEnabled: true,
    rating: "4.8 ★ (1.4k+)",
    location: "DLF Phase 4, Supermart 1, Gurgaon",
    fullAddress: "DLF Phase 4, Supermart 1, Gurgaon",
    address: "DLF Phase 4, Supermart 1, Gurgaon",
    contactNumber: "+91 9811223344",
    phone: "+91 9811223344",
    description: "100% certified organic fruits, green vegetables, farm-fresh Alphonso mangoes, Nagpur oranges, and natural dairy.",
    openCloseTime: "06:30 AM - 09:30 PM",
    vegType: "Pure Veg",
    emoji: "🥦",
    imageUrl: "https://images.unsplash.com/photo-1610832958506-aa56368176cf?q=80&w=1200&auto=format&fit=crop",
    image: "https://images.unsplash.com/photo-1610832958506-aa56368176cf?q=80&w=1200&auto=format&fit=crop",
    photoUrl: "https://images.unsplash.com/photo-1610832958506-aa56368176cf?q=80&w=1200&auto=format&fit=crop",
    logoUrl: "https://images.unsplash.com/photo-1610832958506-aa56368176cf?q=80&w=300&auto=format&fit=crop",
    logo: "https://images.unsplash.com/photo-1610832958506-aa56368176cf?q=80&w=300&auto=format&fit=crop",
    storeLogo: "https://images.unsplash.com/photo-1610832958506-aa56368176cf?q=80&w=300&auto=format&fit=crop"
  },
  {
    id: "st_darjeeling_momos",
    name: "Darjeeling Momos & Asian Kitchen",
    branchName: "Darjeeling Momos & Asian Kitchen",
    isOpen: true,
    openStatus: "OPEN",
    openTime: "11:00 AM",
    closeTime: "11:00 PM",
    autoTimingEnabled: true,
    rating: "4.7 ★ (950+)",
    location: "Sector 29, Food Street, Gurgaon",
    fullAddress: "Sector 29, Food Street, Gurgaon",
    address: "Sector 29, Food Street, Gurgaon",
    contactNumber: "+91 9871122334",
    phone: "+91 9871122334",
    description: "Authentic steamed veg & chicken momos, spicy red chutney, spring rolls, and pan-asian delights cooked fresh to order.",
    openCloseTime: "11:00 AM - 11:00 PM",
    vegType: "Veg & Non-Veg",
    emoji: "🥟",
    imageUrl: "https://images.unsplash.com/photo-1534422298391-e4f8c172dddb?q=80&w=1200&auto=format&fit=crop",
    image: "https://images.unsplash.com/photo-1534422298391-e4f8c172dddb?q=80&w=1200&auto=format&fit=crop",
    photoUrl: "https://images.unsplash.com/photo-1534422298391-e4f8c172dddb?q=80&w=1200&auto=format&fit=crop",
    logoUrl: "https://images.unsplash.com/photo-1534422298391-e4f8c172dddb?q=80&w=300&auto=format&fit=crop",
    logo: "https://images.unsplash.com/photo-1534422298391-e4f8c172dddb?q=80&w=300&auto=format&fit=crop",
    storeLogo: "https://images.unsplash.com/photo-1534422298391-e4f8c172dddb?q=80&w=300&auto=format&fit=crop"
  },
  {
    id: "st_family_hotel",
    name: "Family Hotel & Kitchen",
    branchName: "Family Hotel & Kitchen",
    isOpen: true,
    openStatus: "OPEN",
    rating: "4.6 ★ (1.1k+)",
    location: "Old Railway Road, Gurgaon",
    fullAddress: "Old Railway Road, Gurgaon",
    address: "Old Railway Road, Gurgaon",
    contactNumber: "+91 9953344556",
    phone: "+91 9953344556",
    description: "Rich Paneer Tikka meal bowls, dal makhani, farmhouse cheese pizzas, burgers, and authentic North Indian thalis.",
    openCloseTime: "10:00 AM - 11:00 PM (Open Now)",
    vegType: "Pure Veg",
    emoji: "🍲",
    imageUrl: "https://images.unsplash.com/photo-1546069901-ba9599a7e63c?q=80&w=1200&auto=format&fit=crop",
    image: "https://images.unsplash.com/photo-1546069901-ba9599a7e63c?q=80&w=1200&auto=format&fit=crop",
    photoUrl: "https://images.unsplash.com/photo-1546069901-ba9599a7e63c?q=80&w=1200&auto=format&fit=crop",
    logoUrl: "https://images.unsplash.com/photo-1546069901-ba9599a7e63c?q=80&w=300&auto=format&fit=crop",
    logo: "https://images.unsplash.com/photo-1546069901-ba9599a7e63c?q=80&w=300&auto=format&fit=crop",
    storeLogo: "https://images.unsplash.com/photo-1546069901-ba9599a7e63c?q=80&w=300&auto=format&fit=crop"
  },
  {
    id: "st_celebrations",
    name: "Celebrations Bakers & Cafe",
    branchName: "Celebrations Bakers & Cafe",
    isOpen: true,
    openStatus: "OPEN",
    rating: "4.9 ★ (2.1k+)",
    location: "Galleria Market, DLF Phase 4, Gurgaon",
    fullAddress: "Galleria Market, DLF Phase 4, Gurgaon",
    address: "Galleria Market, DLF Phase 4, Gurgaon",
    contactNumber: "+91 9810011223",
    phone: "+91 9810011223",
    description: "Artisanal sourdough bread, fresh chocolate truffle cakes, croissants, pastries, and gourmet coffee.",
    openCloseTime: "08:00 AM - 11:00 PM (Open Now)",
    vegType: "Pure Veg",
    emoji: "🥐",
    imageUrl: "https://images.unsplash.com/photo-1509440159596-0249088772ff?q=80&w=1200&auto=format&fit=crop",
    image: "https://images.unsplash.com/photo-1509440159596-0249088772ff?q=80&w=1200&auto=format&fit=crop",
    photoUrl: "https://images.unsplash.com/photo-1509440159596-0249088772ff?q=80&w=1200&auto=format&fit=crop",
    logoUrl: "https://images.unsplash.com/photo-1509440159596-0249088772ff?q=80&w=300&auto=format&fit=crop",
    logo: "https://images.unsplash.com/photo-1509440159596-0249088772ff?q=80&w=300&auto=format&fit=crop",
    storeLogo: "https://images.unsplash.com/photo-1509440159596-0249088772ff?q=80&w=300&auto=format&fit=crop"
  }
];
