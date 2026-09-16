export interface Category {
  id: string;
  name: string;
  slug: string;
  description: string;
  image: string;
}

export interface Product {
  id: string;
  name: string;
  slug: string;
  category: string;
  price: number;
  originalPrice?: number;
  description: string;
  features: string[];
  dimensions?: string;
  material?: string;
  images: string[];
  imageLabels?: string[];
  inStock: boolean;
  isFeatured: boolean;
  createdAt: string;
}

export interface CartItem {
  product: Product;
  quantity: number;
  selectedColor?: string;
}

export type OrderStatus =
  | 'New'
  | 'Pending'
  | 'Confirmed'
  | 'Processing'
  | 'Out for Delivery'
  | 'Completed'
  | 'Cancelled';

export interface OrderItem {
  productId: string;
  productName: string;
  price: number;
  quantity: number;
  image: string;
}

export interface Order {
  id: string;
  orderNumber: string;
  customerName: string;
  phone: string;
  whatsappNumber: string;
  address: string;
  city: string;
  notes?: string;
  items: OrderItem[];
  totalAmount: number;
  status: OrderStatus;
  createdAt: string;
}

export interface AdminStats {
  totalOrders: number;
  newOrders: number;
  pendingOrders: number;
  confirmedOrders: number;
  completedOrders: number;
  totalProducts: number;
  totalRevenue: number;
}
