import fs from 'fs';
import path from 'path';
import { Category, Product, Order, OrderStatus } from '../src/types';
import {
  isSupabaseConfigured,
  getSupabaseCategories,
  createSupabaseCategory,
  updateSupabaseCategory,
  deleteSupabaseCategory,
  getSupabaseProducts,
  getSupabaseProductById,
  createSupabaseProduct,
  updateSupabaseProduct,
  deleteSupabaseProduct,
  getSupabaseOrders,
  createSupabaseOrder,
  updateSupabaseOrderStatus,
  deleteSupabaseOrder,
  syncLocalDataToSupabase,
} from './supabase';

const DATA_DIR = path.join(process.cwd(), 'data');
const DB_FILE = path.join(DATA_DIR, 'db.json');

interface DatabaseSchema {
  categories: Category[];
  products: Product[];
  orders: Order[];
}

const defaultCategories: Category[] = [
  {
    id: 'beds',
    name: 'Beds & Bedroom',
    slug: 'beds',
    description: 'Royal master beds, upholstered tufted headboards, and solid Sheesham wood bed sets.',
    image: 'https://images.unsplash.com/photo-1505693416388-ac5ce068fe85?auto=format&fit=crop&w=800&q=80',
  },
  {
    id: 'sofas',
    name: 'Sofas & Living',
    slug: 'sofas',
    description: 'Handcrafted luxury velvet sofas, L-shape sectionals, and classic Chesterfield sets.',
    image: 'https://images.unsplash.com/photo-1555041469-a586c61ea9bc?auto=format&fit=crop&w=800&q=80',
  },
  {
    id: 'dining-tables',
    name: 'Dining Tables',
    slug: 'dining-tables',
    description: '6-seater and 8-seater dining tables in solid wood and marble top finishes.',
    image: 'https://images.unsplash.com/photo-1617806118233-18e1de247200?auto=format&fit=crop&w=800&q=80',
  },
  {
    id: 'wardrobes',
    name: 'Wardrobes & Closets',
    slug: 'wardrobes',
    description: 'Spacious sliding and hinged wardrobes crafted with moisture-resistant Turkish hardware.',
    image: 'https://images.unsplash.com/photo-1595428774223-ef52624120d2?auto=format&fit=crop&w=800&q=80',
  },
  {
    id: 'dressing-tables',
    name: 'Dressing Tables',
    slug: 'dressing-tables',
    description: 'Modern vanity dressing tables with LED touch mirrors, cushioned stools, and gold trims.',
    image: 'https://images.unsplash.com/photo-1533090161767-e6ffed986c88?auto=format&fit=crop&w=800&q=80',
  },
  {
    id: 'chairs',
    name: 'Chairs & Armchairs',
    slug: 'chairs',
    description: 'Ergonomic dining chairs, accent armchairs, and luxury velvet statement seating.',
    image: 'https://images.unsplash.com/photo-1586023492125-27b2c045efd7?auto=format&fit=crop&w=800&q=80',
  },
  {
    id: 'tables',
    name: 'Coffee & Center Tables',
    slug: 'tables',
    description: 'Designer coffee tables, nest of tables, and console tables for elegant hallways.',
    image: 'https://images.unsplash.com/photo-1532323544230-7191fd51bc1b?auto=format&fit=crop&w=800&q=80',
  },
  {
    id: 'other-furniture',
    name: 'Other Furniture',
    slug: 'other-furniture',
    description: 'TV units, shoe racks, bookshelves, and bespoke custom furniture solutions.',
    image: 'https://images.unsplash.com/photo-1540518614846-7ede433c4ef0?auto=format&fit=crop&w=800&q=80',
  }
];

const defaultProducts: Product[] = [
  {
    id: 'prod-1',
    name: 'The Royal Venetian Master Bed Set',
    slug: 'royal-venetian-master-bed-set',
    category: 'beds',
    price: 165000,
    originalPrice: 185000,
    description: 'Indulge in unmatched royalty with The Royal Venetian Master Bed Set. Hand-carved in premium seasoned Sheesham wood with high-density velvet tufting and brass foot accents. Includes the king-size upholstered bed frame, padded headboard, and two matching bedside tables.',
    features: [
      'Solid seasoned Sheesham hardwood inner skeleton',
      'Imported anti-stain velvet upholstered tufted headboard',
      'Heavy-duty central spine with noiseless acoustic slats',
      'Includes 2 matching nightstands with soft-close drawers',
      '10-year structural termite warranty'
    ],
    dimensions: 'King Size: 6.5 ft x 6.0 ft mattress fit',
    material: 'Seasoned Sheesham Wood & Turkish Velvet',
    images: [
      'https://images.unsplash.com/photo-1505693416388-ac5ce068fe85?auto=format&fit=crop&w=1400&q=80',
      'https://images.unsplash.com/photo-1540518614846-7ede433c4ef0?auto=format&fit=crop&w=1400&q=80',
      'https://images.unsplash.com/photo-1582582621959-48d27397dc69?auto=format&fit=crop&w=1400&q=80',
      'https://images.unsplash.com/photo-1566665797739-1674de7a421a?auto=format&fit=crop&w=1400&q=80',
      'https://images.unsplash.com/photo-1598928506311-c55ded91a20c?auto=format&fit=crop&w=1400&q=80'
    ],
    imageLabels: [
      'Main Front View (Cover)',
      'Side Angle & Nightstand',
      'Headboard Tufting Detail',
      'Master Bedroom Suite View',
      'Matching Bedside Pieces'
    ],
    inStock: true,
    isFeatured: true,
    createdAt: '2026-08-15T10:00:00Z'
  },
  {
    id: 'prod-2',
    name: 'Milanese Emerald Velvet 7-Seater Living Room Suite',
    slug: 'milanese-emerald-velvet-7-seater-living-room-suite',
    category: 'sofas',
    price: 195000,
    originalPrice: 220000,
    description: 'The Milanese 7-Seater Suite combines contemporary Italian lines with deep lounge comfort. Wrapped in imported moss emerald velvet with high-resilience Master MoltyFoam filling and brushed brass legs. Configured with a 3-seater sofa, 2-seater loveseat, and 2 individual accent armchairs.',
    features: [
      'Complete 7-seater suite (3-seater + 2-seater + 2 accent chairs)',
      'Original Diamond MoltyFoam with 10-year sagging guarantee',
      'Reinforced solid acacia inner structural skeleton',
      'Stain-resistant easy-wipe velvet upholstery',
      'Brushed champagne gold steel legs'
    ],
    dimensions: '3-Seater: 84" W x 36" D; 2-Seater: 64" W x 36" D; Chairs: 34" W x 34" D',
    material: 'Acacia Hardwood, Turkish Velvet, High-Resilience Foam',
    images: [
      'https://images.unsplash.com/photo-1555041469-a586c61ea9bc?auto=format&fit=crop&w=1400&q=80',
      'https://images.unsplash.com/photo-1493663284031-b7e3aefcae8e?auto=format&fit=crop&w=1400&q=80',
      'https://images.unsplash.com/photo-1586023492125-27b2c045efd7?auto=format&fit=crop&w=1400&q=80',
      'https://images.unsplash.com/photo-1550581190-9c1c48d21d6c?auto=format&fit=crop&w=1400&q=80',
      'https://images.unsplash.com/photo-1567016432779-094069958ea5?auto=format&fit=crop&w=1400&q=80'
    ],
    imageLabels: [
      'Full 7-Seater Suite (Cover)',
      '3-Seater Living Room Setup',
      'Single Accent Armchair View',
      'Velvet Texture & Stitching Detail',
      'Angle & Champagne Gold Base'
    ],
    inStock: true,
    isFeatured: true,
    createdAt: '2026-08-18T12:00:00Z'
  },
  {
    id: 'prod-3',
    name: 'Imperial 8-Seater Onyx Marble Dining Suite',
    slug: 'imperial-8-seater-onyx-marble-dining-suite',
    category: 'dining-tables',
    price: 235000,
    originalPrice: 260000,
    description: 'Elevate family gatherings and formal feasts with the Imperial 8-Seater Dining Suite. Features a heavy natural white-veined onyx marble top resting on a fluted pedestal base, accompanied by 8 high-back ergonomic dining chairs wrapped in warm sand boucle fabric.',
    features: [
      'Solid 35mm natural veined polished marble top with beveled edges',
      'Anti-stain sealed nano-coating protection on stone surface',
      'Fluted solid oak double pedestal base with internal steel weights',
      'Includes 8 ergonomic high-back chairs in textured boucle',
      'Heat, scratch, and liquid spill resistant'
    ],
    dimensions: 'Table: 8.0 ft L x 4.0 ft W x 30" H',
    material: 'Natural Onyx Marble, Solid Oak Wood, Boucle Fabric',
    images: [
      'https://images.unsplash.com/photo-1617806118233-18e1de247200?auto=format&fit=crop&w=1400&q=80',
      'https://images.unsplash.com/photo-1530018607912-eff2daa1bac4?auto=format&fit=crop&w=1400&q=80',
      'https://images.unsplash.com/photo-1577140917170-285929fb55b7?auto=format&fit=crop&w=1400&q=80',
      'https://images.unsplash.com/photo-1615066390971-03e4e1c36ddf?auto=format&fit=crop&w=1400&q=80',
      'https://images.unsplash.com/photo-1544457070-4cd773b4d71e?auto=format&fit=crop&w=1400&q=80'
    ],
    imageLabels: [
      'Complete 8-Seater Table & Chairs (Cover)',
      'Marble Top Texture & Polished Edge',
      'Dining Chair Back & Boucle Fabric',
      'Side Angle Perspective',
      'Under-Table Fluted Oak Base'
    ],
    inStock: true,
    isFeatured: true,
    createdAt: '2026-08-20T14:30:00Z'
  },
  {
    id: 'prod-4',
    name: 'Nordic 6-Door Sliding Wardrobe with Glass Accents',
    slug: 'nordic-6-door-sliding-wardrobe-glass-accents',
    category: 'wardrobes',
    price: 185000,
    originalPrice: 210000,
    description: 'A contemporary storage powerhouse featuring smooth whisper-quiet German sliding tracks, integrated automatic motion-sensor LED clothing rails, fluted glass showcase doors, and multiple organizing drawers for jewelry and accessories.',
    features: [
      'Heavy-gauge aluminum silent sliding rails (Hettich certified)',
      'Tempered tinted fluted glass door panels with aluminum frame',
      'Concealed warm-white motion LED sensor lighting on all hanging rails',
      'Built-in security locker box and velvet jewelry drawer partitions',
      'Moisture and pest resistant compressed core boards'
    ],
    dimensions: '8.0 ft Width x 7.5 ft Height x 2.2 ft Depth',
    material: 'High-Density Moisture-Resistant MDF, Fluted Glass, Aluminum',
    images: [
      'https://images.unsplash.com/photo-1595428774223-ef52624120d2?auto=format&fit=crop&w=1400&q=80',
      'https://images.unsplash.com/photo-1558997519-83ea9252def8?auto=format&fit=crop&w=1400&q=80',
      'https://images.unsplash.com/photo-1616486338812-3dadae4b4ace?auto=format&fit=crop&w=1400&q=80',
      'https://images.unsplash.com/photo-1583847268964-b28dc8f51f92?auto=format&fit=crop&w=1400&q=80'
    ],
    imageLabels: [
      'Front Full Wardrobe (Cover)',
      'Interior Shelves & Hanging Space',
      'Sliding Door Glass Detail',
      'Integrated LED Light Demonstration'
    ],
    inStock: true,
    isFeatured: false,
    createdAt: '2026-08-21T09:15:00Z'
  },
  {
    id: 'prod-5',
    name: 'Lumière LED Hollywood Dressing Table & Stool Set',
    slug: 'lumiere-led-hollywood-dressing-table-stool-set',
    category: 'dressing-tables',
    price: 95000,
    originalPrice: 110000,
    description: 'Transform your morning routine with the Lumière Vanity Dressing Suite. Equipped with an oversized smart touch 3-color LED mirror, soft-close velvet organizers, and a comfortable matching cylindrical ottoman stool.',
    features: [
      'Smart touch-dimmable LED mirror (Warm, Cool & Natural Daylight modes)',
      '6 smooth-glide drawers with brushed gold brass pulls',
      'Clear tempered glass vanity top to view jewelry compartments',
      'Includes matching high-density velvet cushioned vanity stool'
    ],
    dimensions: 'Table: 48" W x 18" D x 32" H; Mirror: 36" Dia',
    material: 'Engineered Wood, Tempered Glass, Brushed Brass, Velvet',
    images: [
      'https://images.unsplash.com/photo-1533090161767-e6ffed986c88?auto=format&fit=crop&w=1400&q=80',
      'https://images.unsplash.com/photo-1524758631624-e2822e304c36?auto=format&fit=crop&w=1400&q=80',
      'https://images.unsplash.com/photo-1618221195710-dd6b41faaea6?auto=format&fit=crop&w=1400&q=80',
      'https://images.unsplash.com/photo-1507652313519-d4e9174996dd?auto=format&fit=crop&w=1400&q=80'
    ],
    imageLabels: [
      'Front Table & LED Mirror (Cover)',
      'Side Profile & Drawers',
      'Touch LED Light Modes',
      'Matching Circular Velvet Stool'
    ],
    inStock: true,
    isFeatured: true,
    createdAt: '2026-08-22T11:45:00Z'
  },
  {
    id: 'prod-6',
    name: 'The Heritage Wingback Lounge Reading Armchair',
    slug: 'heritage-wingback-lounge-reading-armchair',
    category: 'chairs',
    price: 48000,
    originalPrice: 55000,
    description: 'A classic British reading chair reimagined with modern Lahore artisanal flair. Features deep button diamond tufting, flared scroll arms, and dark walnut hand-turned wooden legs with antique brass castor wheels.',
    features: [
      'Full hand-tufted backrest with high-grade buttons',
      'Dual-spring suspension core for lifelong lumbar support',
      'Choice of Royal Blue, Emerald Green, or Charcoal upholstery',
      'Solid rosewood legs with antique brass castor wheels'
    ],
    dimensions: '34" W x 32" D x 42" H',
    material: 'Velvet Tweed, Solid Rosewood Frame',
    images: [
      'https://images.unsplash.com/photo-1586023492125-27b2c045efd7?auto=format&fit=crop&w=1400&q=80',
      'https://images.unsplash.com/photo-1567538096630-e0c55bd6374c?auto=format&fit=crop&w=1400&q=80',
      'https://images.unsplash.com/photo-1580481077111-94498305c6c2?auto=format&fit=crop&w=1400&q=80',
      'https://images.unsplash.com/photo-1506439773649-6e0eb8cfb237?auto=format&fit=crop&w=1400&q=80',
      'https://images.unsplash.com/photo-1584622650111-993a426fbf0a?auto=format&fit=crop&w=1400&q=80'
    ],
    imageLabels: [
      'Main Front View (Cover)',
      'Side Scroll Profile',
      'Diamond Tufting Detail',
      'Lounge Reading Corner',
      'Turned Rosewood Legs & Castors'
    ],
    inStock: true,
    isFeatured: false,
    createdAt: '2026-08-23T15:20:00Z'
  },
  {
    id: 'prod-7',
    name: 'Aura Dual Marble & Fluted Oak Nesting Coffee Tables',
    slug: 'aura-dual-marble-fluted-oak-nesting-coffee-tables',
    category: 'tables',
    price: 52000,
    originalPrice: 62000,
    description: 'A pair of concentric nesting center tables featuring one Black Marquina polished marble slab and one fluted oak wooden cylinder with concealed internal 360-degree rotating storage.',
    features: [
      'Set of 2 nesting pieces that slide together or separate',
      'Natural polished black marble with white veining',
      'Secondary table has 360-degree hidden drawer compartment',
      'Electroplated anti-scratch titanium gold rim base'
    ],
    dimensions: 'Large: 32" Dia x 16" H, Small: 24" Dia x 18" H',
    material: 'Natural Marble, Fluted Oak, Gold Titanium Stainless Steel',
    images: [
      'https://images.unsplash.com/photo-1532323544230-7191fd51bc1b?auto=format&fit=crop&w=1400&q=80',
      'https://images.unsplash.com/photo-1533779283484-84e12c9cb568?auto=format&fit=crop&w=1400&q=80',
      'https://images.unsplash.com/photo-1615066390971-03e4e1c36ddf?auto=format&fit=crop&w=1400&q=80',
      'https://images.unsplash.com/photo-1519710164239-da123dc03ef4?auto=format&fit=crop&w=1400&q=80',
      'https://images.unsplash.com/photo-1600210492486-724fe5c67fb0?auto=format&fit=crop&w=1400&q=80'
    ],
    imageLabels: [
      'Main Nested View (Cover)',
      'Separated Configuration',
      'Black Marquina Marble Veining',
      'Fluted Oak Cylinder & Base',
      'Living Room Centerpiece Setup'
    ],
    inStock: true,
    isFeatured: true,
    createdAt: '2026-08-25T13:10:00Z'
  },
  {
    id: 'prod-8',
    name: 'Grand Slotted Oak Media Console & Wall Unit',
    slug: 'grand-slotted-oak-media-console-wall-unit',
    category: 'other-furniture',
    price: 115000,
    originalPrice: 130000,
    description: 'Bespoke modern entertainment credenza crafted with solid vertical fluted oak slats, soft-drop hydraulic doors, internal acoustic speaker shelving, and concealed cable organizing raceways.',
    features: [
      'Solid seasoned white oak vertical acoustic slats',
      'Soft-drop hydraulic stay hinges for noiseless opening',
      'Concealed cable passthrough for TVs, soundbars, and gaming consoles',
      'Dual side storage drawers with push-to-open German slides'
    ],
    dimensions: '80" L x 18" D x 22" H',
    material: 'Solid White Oak, Matte Black Steel Accents',
    images: [
      'https://images.unsplash.com/photo-1540518614846-7ede433c4ef0?auto=format&fit=crop&w=1400&q=80',
      'https://images.unsplash.com/photo-1513694203232-719a280e022f?auto=format&fit=crop&w=1400&q=80',
      'https://images.unsplash.com/photo-1598928506311-c55ded91a20c?auto=format&fit=crop&w=1400&q=80',
      'https://images.unsplash.com/photo-1616486338812-3dadae4b4ace?auto=format&fit=crop&w=1400&q=80',
      'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=1400&q=80'
    ],
    imageLabels: [
      'Main Front View (Cover)',
      'Side Floating Angle',
      'Fluted Oak Slats Close-up',
      'Interior Media Storage',
      'Living Room Entertainment Setup'
    ],
    inStock: true,
    isFeatured: false,
    createdAt: '2026-08-28T10:00:00Z'
  }
];

const defaultOrders: Order[] = [
  {
    id: 'ord-101',
    orderNumber: 'GR-2026-8941',
    customerName: 'Muhammad Salman',
    phone: '03001234567',
    whatsappNumber: '03001234567',
    address: 'House 42, Block D, DHA Phase 6',
    city: 'Lahore',
    notes: 'Please call before delivery. Need white glove room assembly.',
    items: [
      {
        productId: 'prod-1',
        productName: 'The Royal Venetian King Bed Set',
        price: 165000,
        quantity: 1,
        image: 'https://images.unsplash.com/photo-1505693416388-ac5ce068fe85?auto=format&fit=crop&w=1200&q=80'
      }
    ],
    totalAmount: 165000,
    status: 'New',
    createdAt: '2026-09-06T14:20:00Z'
  },
  {
    id: 'ord-102',
    orderNumber: 'GR-2026-8938',
    customerName: 'Ayesha Tariq',
    phone: '03218765432',
    whatsappNumber: '03218765432',
    address: 'Apartment 5B, Gulberg Heights',
    city: 'Lahore',
    notes: 'Confirm fabric swatch colors on WhatsApp first.',
    items: [
      {
        productId: 'prod-2',
        productName: 'Milanese Emerald Velvet 7-Seater Sofa',
        price: 195000,
        quantity: 1,
        image: 'https://images.unsplash.com/photo-1555041469-a586c61ea9bc?auto=format&fit=crop&w=1200&q=80'
      },
      {
        productId: 'prod-7',
        productName: 'Aura Dual Marble Nesting Coffee Tables',
        price: 52000,
        quantity: 1,
        image: 'https://images.unsplash.com/photo-1532323544230-7191fd51bc1b?auto=format&fit=crop&w=1200&q=80'
      }
    ],
    totalAmount: 247000,
    status: 'Confirmed',
    createdAt: '2026-09-05T11:15:00Z'
  },
  {
    id: 'ord-103',
    orderNumber: 'GR-2026-8920',
    customerName: 'Chaudhry Bilal',
    phone: '03334445555',
    whatsappNumber: '03334445555',
    address: 'Plot 18, Bahria Town Sector C',
    city: 'Lahore',
    notes: 'Delivered and assembled smoothly.',
    items: [
      {
        productId: 'prod-5',
        productName: 'Lumière LED Hollywood Dressing Vanity',
        price: 95000,
        quantity: 1,
        image: 'https://images.unsplash.com/photo-1533090161767-e6ffed986c88?auto=format&fit=crop&w=1200&q=80'
      }
    ],
    totalAmount: 95000,
    status: 'Completed',
    createdAt: '2026-09-02T16:00:00Z'
  }
];

function ensureDataFile(): DatabaseSchema {
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }

  if (!fs.existsSync(DB_FILE)) {
    const initialData: DatabaseSchema = {
      categories: defaultCategories,
      products: defaultProducts,
      orders: defaultOrders
    };
    fs.writeFileSync(DB_FILE, JSON.stringify(initialData, null, 2), 'utf-8');
    return initialData;
  }

  try {
    const raw = fs.readFileSync(DB_FILE, 'utf-8');
    const parsed = JSON.parse(raw);
    if (!parsed.categories || !parsed.products || !parsed.orders) {
      throw new Error('Incomplete data schema');
    }
    return parsed;
  } catch (err) {
    console.error('Error reading db.json, restoring defaults', err);
    const initialData: DatabaseSchema = {
      categories: defaultCategories,
      products: defaultProducts,
      orders: defaultOrders
    };
    fs.writeFileSync(DB_FILE, JSON.stringify(initialData, null, 2), 'utf-8');
    return initialData;
  }
}

function saveData(data: DatabaseSchema): void {
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }
  fs.writeFileSync(DB_FILE, JSON.stringify(data, null, 2), 'utf-8');
}

export const db = {
  isUsingSupabase(): boolean {
    return isSupabaseConfigured();
  },

  async getCategories(): Promise<Category[]> {
    if (isSupabaseConfigured()) {
      try {
        const sbCats = await getSupabaseCategories();
        if (sbCats && sbCats.length > 0) return sbCats;
      } catch (err) {
        console.warn('Supabase fetch categories fallback:', err);
      }
    }
    const data = ensureDataFile();
    return data.categories;
  },

  async addCategory(cat: Omit<Category, 'id' | 'slug'> & { id?: string; slug?: string }): Promise<Category> {
    if (isSupabaseConfigured()) {
      try {
        const res = await createSupabaseCategory(cat);
        if (res) return res;
      } catch (err) {
        console.error('Supabase add category error:', err);
      }
    }
    const data = ensureDataFile();
    const id = cat.id || `cat-${Date.now()}`;
    const slug = cat.slug || cat.name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
    const newCat: Category = { ...cat, id, slug };
    data.categories.push(newCat);
    saveData(data);
    return newCat;
  },

  async updateCategory(id: string, updates: Partial<Category>): Promise<Category | null> {
    if (isSupabaseConfigured()) {
      try {
        const res = await updateSupabaseCategory(id, updates);
        if (res) return res;
      } catch (err) {
        console.error('Supabase update category error:', err);
      }
    }
    const data = ensureDataFile();
    const idx = data.categories.findIndex((c) => c.id === id);
    if (idx === -1) return null;
    data.categories[idx] = { ...data.categories[idx], ...updates };
    saveData(data);
    return data.categories[idx];
  },

  async deleteCategory(id: string): Promise<boolean> {
    if (isSupabaseConfigured()) {
      try {
        const res = await deleteSupabaseCategory(id);
        if (res) return true;
      } catch (err) {
        console.error('Supabase delete category error:', err);
      }
    }
    const data = ensureDataFile();
    const len = data.categories.length;
    const cleanId = String(id).trim();
    data.categories = data.categories.filter((c) => c.id !== cleanId && c.slug !== cleanId);
    if (data.categories.length !== len) {
      saveData(data);
      return true;
    }
    return false;
  },

  async getProducts(filter?: { category?: string; search?: string; featured?: boolean; sort?: string }): Promise<Product[]> {
    if (isSupabaseConfigured()) {
      try {
        const sbProds = await getSupabaseProducts(filter);
        if (sbProds !== null) return sbProds;
      } catch (err) {
        console.warn('Supabase get products fallback:', err);
      }
    }

    const data = ensureDataFile();
    let result = [...data.products];

    if (filter?.category && filter.category !== 'all') {
      result = result.filter((p) => p.category === filter.category);
    }

    if (filter?.featured !== undefined) {
      result = result.filter((p) => p.isFeatured === filter.featured);
    }

    if (filter?.search) {
      const q = filter.search.toLowerCase();
      result = result.filter(
        (p) =>
          p.name.toLowerCase().includes(q) ||
          p.description.toLowerCase().includes(q) ||
          p.category.toLowerCase().includes(q)
      );
    }

    if (filter?.sort) {
      switch (filter.sort) {
        case 'price-low':
          result.sort((a, b) => a.price - b.price);
          break;
        case 'price-high':
          result.sort((a, b) => b.price - a.price);
          break;
        case 'newest':
        default:
          result.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
          break;
      }
    }

    return result;
  },

  async getProductById(id: string): Promise<Product | null> {
    if (isSupabaseConfigured()) {
      try {
        const sbProd = await getSupabaseProductById(id);
        if (sbProd) return sbProd;
      } catch (err) {
        console.warn('Supabase get product by ID fallback:', err);
      }
    }
    const data = ensureDataFile();
    return data.products.find((p) => p.id === id || p.slug === id) || null;
  },

  async addProduct(prod: Omit<Product, 'id' | 'slug' | 'createdAt'> & { id?: string; slug?: string }): Promise<Product> {
    if (isSupabaseConfigured()) {
      try {
        const res = await createSupabaseProduct(prod);
        if (res) return res;
      } catch (err) {
        console.error('Supabase add product error:', err);
      }
    }
    const data = ensureDataFile();
    const id = prod.id || `prod-${Date.now()}`;
    const baseSlug = prod.slug || prod.name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '') || 'furniture';
    let uniqueSlug = baseSlug;
    let counter = 1;
    while (data.products.some((p) => p.slug === uniqueSlug && p.id !== id)) {
      counter++;
      uniqueSlug = `${baseSlug}-${counter}`;
    }

    const newProd: Product = {
      ...prod,
      id,
      slug: uniqueSlug,
      createdAt: new Date().toISOString()
    };
    data.products.unshift(newProd);
    saveData(data);
    return newProd;
  },

  async updateProduct(id: string, updates: Partial<Product>): Promise<Product | null> {
    if (isSupabaseConfigured()) {
      try {
        const res = await updateSupabaseProduct(id, updates);
        if (res) return res;
      } catch (err) {
        console.error('Supabase update product error:', err);
      }
    }
    const data = ensureDataFile();
    const idx = data.products.findIndex((p) => p.id === id);
    if (idx === -1) return null;
    data.products[idx] = { ...data.products[idx], ...updates };
    saveData(data);
    return data.products[idx];
  },

  async deleteProduct(id: string): Promise<boolean> {
    if (isSupabaseConfigured()) {
      try {
        const res = await deleteSupabaseProduct(id);
        if (res) return true;
      } catch (err) {
        console.error('Supabase delete product error:', err);
      }
    }
    const data = ensureDataFile();
    const len = data.products.length;
    const cleanId = String(id).trim();
    data.products = data.products.filter((p) => p.id !== cleanId && p.slug !== cleanId);
    if (data.products.length !== len) {
      saveData(data);
      return true;
    }
    return false;
  },

  async getOrders(): Promise<Order[]> {
    if (isSupabaseConfigured()) {
      try {
        const sbOrders = await getSupabaseOrders();
        if (sbOrders !== null) return sbOrders;
      } catch (err) {
        console.warn('Supabase get orders fallback:', err);
      }
    }
    const data = ensureDataFile();
    return data.orders.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  },

  async getOrderById(id: string): Promise<Order | null> {
    const orders = await this.getOrders();
    return orders.find((o) => o.id === id || o.orderNumber === id) || null;
  },

  async createOrder(orderData: Omit<Order, 'id' | 'orderNumber' | 'status' | 'createdAt'>): Promise<Order> {
    if (isSupabaseConfigured()) {
      try {
        const res = await createSupabaseOrder(orderData);
        if (res) return res;
      } catch (err) {
        console.error('Supabase create order error:', err);
      }
    }
    const data = ensureDataFile();
    const randomSuffix = Math.floor(1000 + Math.random() * 9000);
    const orderNumber = `GR-2026-${randomSuffix}`;
    const newOrder: Order = {
      ...orderData,
      id: `ord-${Date.now()}`,
      orderNumber,
      status: 'New',
      createdAt: new Date().toISOString()
    };
    data.orders.unshift(newOrder);
    saveData(data);
    return newOrder;
  },

  async updateOrderStatus(id: string, status: Order['status']): Promise<Order | null> {
    if (isSupabaseConfigured()) {
      try {
        const res = await updateSupabaseOrderStatus(id, status);
        if (res) return res;
      } catch (err) {
        console.error('Supabase update order status error:', err);
      }
    }
    const data = ensureDataFile();
    const idx = data.orders.findIndex((o) => o.id === id || o.orderNumber === id);
    if (idx === -1) return null;
    data.orders[idx].status = status;
    saveData(data);
    return data.orders[idx];
  },

  async deleteOrder(id: string): Promise<boolean> {
    if (isSupabaseConfigured()) {
      try {
        const res = await deleteSupabaseOrder(id);
        if (res) return true;
      } catch (err) {
        console.error('Supabase delete order error:', err);
      }
    }
    const data = ensureDataFile();
    const len = data.orders.length;
    const cleanId = String(id).trim();
    data.orders = data.orders.filter((o) => o.id !== cleanId && o.orderNumber !== cleanId);
    if (data.orders.length !== len) {
      saveData(data);
      return true;
    }
    return false;
  },

  async getStats() {
    const orders = await this.getOrders();
    const products = await this.getProducts();

    const totalOrders = orders.length;
    const newOrders = orders.filter((o) => o.status === 'New').length;
    const pendingOrders = orders.filter((o) => o.status === 'Pending').length;
    const confirmedOrders = orders.filter((o) => o.status === 'Confirmed' || o.status === 'Processing' || o.status === 'Out for Delivery').length;
    const completedOrders = orders.filter((o) => o.status === 'Completed').length;
    const totalProducts = products.length;
    const totalRevenue = orders
      .filter((o) => o.status !== 'Cancelled')
      .reduce((sum, o) => sum + (o.totalAmount || 0), 0);

    return {
      totalOrders,
      newOrders,
      pendingOrders,
      confirmedOrders,
      completedOrders,
      totalProducts,
      totalRevenue,
      databaseType: isSupabaseConfigured() ? 'Supabase PostgreSQL' : 'Persistent Storage',
      isSupabaseConnected: isSupabaseConfigured(),
    };
  },

  async migrateLocalToSupabase() {
    const data = ensureDataFile();
    return await syncLocalDataToSupabase(data);
  }
};
