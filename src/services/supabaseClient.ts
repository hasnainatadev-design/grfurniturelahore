import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { Category, Product, Order, OrderStatus } from '../types';

const DEFAULT_SUPABASE_URL = 'https://cprgtuyfytwfhigofvsj.supabase.co';

export function getClientSupabaseConfig(): { url: string; key: string } {
  let url = '';
  let key = '';

  try {
    if (typeof window !== 'undefined') {
      url = localStorage.getItem('grf_supabase_url') || '';
      key = localStorage.getItem('grf_supabase_key') || '';
    }
  } catch {}

  if (!url) {
    url = ((import.meta as any).env?.VITE_SUPABASE_URL as string)?.trim() || DEFAULT_SUPABASE_URL;
  }

  if (!key) {
    key =
      ((import.meta as any).env?.VITE_SUPABASE_SERVICE_ROLE_KEY as string)?.trim() ||
      ((import.meta as any).env?.VITE_SUPABASE_ANON_KEY as string)?.trim() ||
      ((import.meta as any).env?.VITE_SUPABASE_KEY as string)?.trim() ||
      '';
  }

  return { url, key };
}

export function saveClientSupabaseConfig(url: string, key: string) {
  if (typeof window !== 'undefined') {
    localStorage.setItem('grf_supabase_url', url.trim());
    localStorage.setItem('grf_supabase_key', key.trim());
  }
}

let clientInstance: SupabaseClient | null = null;
let lastUrl = '';
let lastKey = '';

export function getClientSupabase(): SupabaseClient | null {
  const { url, key } = getClientSupabaseConfig();
  if (!url || !key) return null;

  if (clientInstance && url === lastUrl && key === lastKey) {
    return clientInstance;
  }

  try {
    clientInstance = createClient(url, key, {
      auth: { persistSession: false },
    });
    lastUrl = url;
    lastKey = key;
    return clientInstance;
  } catch (err) {
    console.error('Failed to initialize client Supabase:', err);
    return null;
  }
}

export async function testDirectSupabaseConnection(customUrl?: string, customKey?: string): Promise<{
  connected: boolean;
  url: string;
  hasKey: boolean;
  categoriesTableOk: boolean;
  productsTableOk: boolean;
  ordersTableOk: boolean;
  categoriesCount?: number;
  productsCount?: number;
  ordersCount?: number;
  error?: string;
  details?: string;
}> {
  const config = getClientSupabaseConfig();
  const url = (customUrl || config.url)?.trim();
  const key = (customKey || config.key)?.trim();

  if (!url) {
    return {
      connected: false,
      url: '',
      hasKey: false,
      categoriesTableOk: false,
      productsTableOk: false,
      ordersTableOk: false,
      error: 'Supabase URL is not set.',
    };
  }

  if (!key) {
    return {
      connected: false,
      url,
      hasKey: false,
      categoriesTableOk: false,
      productsTableOk: false,
      ordersTableOk: false,
      error: 'Supabase API Key is missing. Please provide your anon or service_role key.',
    };
  }

  try {
    const sb = createClient(url, key, { auth: { persistSession: false } });

    // Test tables & fetch live row counts
    const [catRes, prodRes, ordRes] = await Promise.all([
      sb.from('categories').select('*', { count: 'exact', head: true }),
      sb.from('products').select('*', { count: 'exact', head: true }),
      sb.from('orders').select('*', { count: 'exact', head: true }),
    ]);

    if (catRes.error && catRes.error.code === '42P01') {
      return {
        connected: false,
        url,
        hasKey: true,
        categoriesTableOk: false,
        productsTableOk: false,
        ordersTableOk: false,
        error: 'Tables do not exist in Supabase yet. Please run the SQL script in Supabase SQL Editor.',
      };
    }

    if (catRes.error) {
      return {
        connected: false,
        url,
        hasKey: true,
        categoriesTableOk: false,
        productsTableOk: false,
        ordersTableOk: false,
        error: `Supabase error: ${catRes.error.message} (code ${catRes.error.code || 'unknown'})`,
      };
    }

    const categoriesCount = catRes.count ?? 0;
    const productsCount = prodRes.count ?? 0;
    const ordersCount = ordRes.count ?? 0;

    return {
      connected: true,
      url,
      hasKey: true,
      categoriesTableOk: !catRes.error,
      productsTableOk: !prodRes.error,
      ordersTableOk: !ordRes.error,
      categoriesCount,
      productsCount,
      ordersCount,
      details: `Connected to Supabase! Live database contains: ${productsCount} products, ${categoriesCount} categories, ${ordersCount} orders.`,
    };
  } catch (err: any) {
    return {
      connected: false,
      url,
      hasKey: true,
      categoriesTableOk: false,
      productsTableOk: false,
      ordersTableOk: false,
      error: err.message || 'Failed to connect to Supabase.',
    };
  }
}

export async function directPullFromSupabase(): Promise<{
  categories: Category[];
  products: Product[];
  orders: Order[];
  rawStats: { categories: number; products: number; orders: number };
}> {
  const sb = getClientSupabase();
  if (!sb) {
    throw new Error('Supabase client is not configured. Please enter your Supabase URL and Key.');
  }

  // Fetch categories
  const { data: catData, error: catError } = await sb.from('categories').select('*');
  if (catError) {
    console.warn('Supabase categories fetch error:', catError);
  }

  // Fetch products (newest first)
  const { data: prodData, error: prodError } = await sb.from('products').select('*').order('created_at', { ascending: false });
  if (prodError) {
    console.warn('Supabase products fetch error:', prodError);
  }

  // Fetch orders (newest first)
  const { data: ordData, error: ordError } = await sb.from('orders').select('*').order('created_at', { ascending: false });
  if (ordError) {
    console.warn('Supabase orders fetch error:', ordError);
  }

  const mappedCategories: Category[] = (catData || []).map((c: any) => ({
    id: String(c.id || c.category_id || c.slug || `cat-${Math.random()}`),
    name: c.name || c.title || c.category_name || 'Category',
    slug: c.slug || c.id || (c.name ? c.name.toLowerCase().replace(/\s+/g, '-') : 'category'),
    description: c.description || c.desc || '',
    image: c.image || c.image_url || c.imageUrl || 'https://images.unsplash.com/photo-1555041469-a586c61ea9bc?auto=format&fit=crop&w=800&q=80',
  }));

  const mappedProducts: Product[] = (prodData || []).map((p: any) => {
    let images: string[] = [];
    if (Array.isArray(p.images)) {
      images = p.images;
    } else if (typeof p.images === 'string') {
      try {
        const parsed = JSON.parse(p.images);
        if (Array.isArray(parsed)) images = parsed;
        else images = [p.images];
      } catch {
        images = p.images.split(',').map((s: string) => s.trim()).filter(Boolean);
      }
    } else if (p.image_url || p.image || p.imageUrl || p.primary_image) {
      images = [p.image_url || p.image || p.imageUrl || p.primary_image];
    }
    if (images.length === 0) {
      images = ['https://images.unsplash.com/photo-1555041469-a586c61ea9bc?auto=format&fit=crop&w=800&q=80'];
    }

    let features: string[] = [];
    if (Array.isArray(p.features)) {
      features = p.features;
    } else if (typeof p.features === 'string') {
      try {
        const parsed = JSON.parse(p.features);
        if (Array.isArray(parsed)) features = parsed;
        else features = [p.features];
      } catch {
        features = p.features.split('\n').map((s: string) => s.trim()).filter(Boolean);
      }
    }

    let numPrice = 0;
    if (typeof p.price === 'number') {
      numPrice = p.price;
    } else if (typeof p.price === 'string') {
      numPrice = parseFloat(p.price.replace(/[^0-9.]/g, '')) || 0;
    }

    let numOrigPrice = undefined;
    if (p.original_price || p.originalPrice) {
      const rawOrig = p.original_price || p.originalPrice;
      numOrigPrice = typeof rawOrig === 'number' ? rawOrig : parseFloat(String(rawOrig).replace(/[^0-9.]/g, '')) || undefined;
    }

    return {
      id: String(p.id || p.product_id || p.slug || `prod-${Math.random()}`),
      name: p.name || p.title || p.product_name || 'Furniture Item',
      slug: p.slug || p.id || (p.name ? p.name.toLowerCase().replace(/\s+/g, '-') : 'item'),
      category: p.category || p.category_id || p.categoryId || 'other-furniture',
      price: numPrice,
      originalPrice: numOrigPrice,
      description: p.description || p.desc || '',
      features,
      dimensions: p.dimensions || p.size || null,
      material: p.material || p.wood_type || null,
      images,
      imageLabels: Array.isArray(p.image_labels) ? p.image_labels : [],
      inStock: p.in_stock !== undefined ? Boolean(p.in_stock) : (p.inStock !== undefined ? Boolean(p.inStock) : true),
      isFeatured: p.is_featured !== undefined ? Boolean(p.is_featured) : (p.isFeatured !== undefined ? Boolean(p.isFeatured) : false),
      createdAt: p.created_at || p.createdAt || new Date().toISOString(),
    };
  });

  const mappedOrders: Order[] = (ordData || []).map((o: any) => ({
    id: String(o.id || o.order_number),
    orderNumber: o.order_number || o.id,
    customerName: o.customer_name || 'Customer',
    phone: o.phone || '',
    whatsappNumber: o.whatsapp_number || o.phone || '',
    address: o.address || '',
    city: o.city || 'Lahore',
    notes: o.notes || '',
    items: Array.isArray(o.items) ? o.items : [],
    totalAmount: Number(o.total_amount) || 0,
    status: o.status || 'New',
    createdAt: o.created_at || new Date().toISOString(),
  }));

  return {
    categories: mappedCategories,
    products: mappedProducts,
    orders: mappedOrders,
    rawStats: {
      categories: mappedCategories.length,
      products: mappedProducts.length,
      orders: mappedOrders.length,
    },
  };
}

export async function syncDirectToSupabase(
  categories: Category[],
  products: Product[],
  orders: Order[]
): Promise<{ syncedCategories: number; syncedProducts: number; syncedOrders: number }> {
  const sb = getClientSupabase();
  if (!sb) {
    throw new Error('Supabase client is not configured. Please set your Supabase API Key.');
  }

  let syncedCategories = 0;
  let syncedProducts = 0;
  let syncedOrders = 0;

  // 1. Sync categories
  for (const cat of categories) {
    const { error } = await sb.from('categories').upsert(
      {
        id: cat.id,
        name: cat.name,
        slug: cat.slug,
        description: cat.description || '',
        image: cat.image || '',
      },
      { onConflict: 'id' }
    );
    if (!error) syncedCategories++;
    else console.warn(`Failed to upsert category ${cat.id}:`, error);
  }

  // 2. Sync products
  for (const prod of products) {
    const cleanPayload: Record<string, any> = {
      id: prod.id,
      name: prod.name,
      slug: prod.slug,
      category_id: prod.category || null,
      price: prod.price,
      original_price: prod.originalPrice || null,
      description: prod.description || '',
      features: prod.features || [],
      dimensions: prod.dimensions || null,
      material: prod.material || null,
      images: prod.images || [],
      image_labels: prod.imageLabels || [],
      in_stock: prod.inStock ?? true,
      is_featured: prod.isFeatured ?? false,
      created_at: prod.createdAt || new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    let { error } = await sb.from('products').upsert(cleanPayload, { onConflict: 'id' });
    if (error && (error.message?.includes('category_id') || error.code === 'PGRST204')) {
      // Fallback if table was defined with 'category' column instead of 'category_id'
      delete cleanPayload.category_id;
      cleanPayload.category = prod.category || 'other-furniture';
      const retry = await sb.from('products').upsert(cleanPayload, { onConflict: 'id' });
      error = retry.error;
    }

    if (!error) syncedProducts++;
    else console.warn(`Failed to upsert product ${prod.id}:`, error);
  }

  // 3. Sync orders
  for (const ord of orders) {
    const { error } = await sb.from('orders').upsert(
      {
        id: ord.id,
        order_number: ord.orderNumber,
        customer_name: ord.customerName,
        phone: ord.phone,
        whatsapp_number: ord.whatsappNumber,
        address: ord.address,
        city: ord.city,
        notes: ord.notes || null,
        total_amount: ord.totalAmount,
        status: ord.status,
        created_at: ord.createdAt,
      },
      { onConflict: 'id' }
    );
    if (!error) syncedOrders++;
    else console.warn(`Failed to upsert order ${ord.id}:`, error);
  }

  return { syncedCategories, syncedProducts, syncedOrders };
}

// ---------------- DIRECT CRUD OPERATIONS ---------------- //

export async function directGetCategories(): Promise<Category[] | null> {
  const sb = getClientSupabase();
  if (!sb) return null;

  try {
    const { data, error } = await sb.from('categories').select('*');
    if (error) {
      console.warn('Supabase categories fetch error:', error);
      return null;
    }
    if (!data || data.length === 0) return null;

    return data.map((c: any) => ({
      id: String(c.id || c.category_id || c.slug || `cat-${Math.random()}`),
      name: c.name || c.title || c.category_name || 'Category',
      slug: c.slug || c.id || (c.name ? c.name.toLowerCase().replace(/\s+/g, '-') : 'category'),
      description: c.description || c.desc || '',
      image: c.image || c.image_url || c.imageUrl || 'https://images.unsplash.com/photo-1555041469-a586c61ea9bc?auto=format&fit=crop&w=800&q=80',
    }));
  } catch (err) {
    console.warn('Error fetching categories from Supabase:', err);
    return null;
  }
}

export async function directUpsertCategory(cat: Partial<Category>): Promise<Category | null> {
  const sb = getClientSupabase();
  if (!sb) return null;

  const id = cat.id || `cat-${Date.now()}`;
  const payload = {
    id,
    name: cat.name || 'New Category',
    slug: cat.slug || cat.name?.toLowerCase().replace(/\s+/g, '-') || `category-${Date.now()}`,
    description: cat.description || '',
    image: cat.image || '',
  };

  try {
    const { data, error } = await sb.from('categories').upsert(payload, { onConflict: 'id' }).select().single();
    if (error || !data) return null;
    return {
      id: data.id,
      name: data.name,
      slug: data.slug,
      description: data.description || '',
      image: data.image || '',
    };
  } catch {
    return null;
  }
}

export async function directDeleteCategory(id: string): Promise<boolean> {
  const sb = getClientSupabase();
  if (!sb) return false;

  try {
    const { error } = await sb.from('categories').delete().eq('id', id);
    return !error;
  } catch {
    return false;
  }
}

export async function directGetProducts(params?: {
  category?: string;
  search?: string;
  featured?: boolean;
  sort?: string;
}): Promise<Product[] | null> {
  const sb = getClientSupabase();
  if (!sb) return null;

  try {
    let query = sb.from('products').select('*');

    if (params?.category && params.category !== 'all') {
      query = query.or(`category.eq.${params.category},category_id.eq.${params.category}`);
    }
    if (params?.featured !== undefined) {
      query = query.eq('is_featured', params.featured);
    }
    if (params?.search) {
      query = query.ilike('name', `%${params.search}%`);
    }

    query = query.order('created_at', { ascending: false });

    const { data, error } = await query;
    if (error) {
      console.warn('Supabase products fetch error:', error);
      return null;
    }
    if (!data || data.length === 0) return null;

    return data.map((p: any) => {
      // Parse images safely (can be array, JSON string, or single URL string)
      let images: string[] = [];
      if (Array.isArray(p.images)) {
        images = p.images;
      } else if (typeof p.images === 'string') {
        try {
          const parsed = JSON.parse(p.images);
          if (Array.isArray(parsed)) images = parsed;
          else images = [p.images];
        } catch {
          images = p.images.split(',').map((s: string) => s.trim()).filter(Boolean);
        }
      } else if (p.image_url || p.image || p.imageUrl || p.primary_image) {
        images = [p.image_url || p.image || p.imageUrl || p.primary_image];
      }

      if (images.length === 0) {
        images = ['https://images.unsplash.com/photo-1555041469-a586c61ea9bc?auto=format&fit=crop&w=800&q=80'];
      }

      // Parse features safely
      let features: string[] = [];
      if (Array.isArray(p.features)) {
        features = p.features;
      } else if (typeof p.features === 'string') {
        try {
          const parsed = JSON.parse(p.features);
          if (Array.isArray(parsed)) features = parsed;
          else features = [p.features];
        } catch {
          features = p.features.split('\n').map((s: string) => s.trim()).filter(Boolean);
        }
      }

      // Parse price safely
      let numPrice = 0;
      if (typeof p.price === 'number') {
        numPrice = p.price;
      } else if (typeof p.price === 'string') {
        numPrice = parseFloat(p.price.replace(/[^0-9.]/g, '')) || 0;
      }

      let numOrigPrice = undefined;
      if (p.original_price || p.originalPrice) {
        const rawOrig = p.original_price || p.originalPrice;
        numOrigPrice = typeof rawOrig === 'number' ? rawOrig : parseFloat(String(rawOrig).replace(/[^0-9.]/g, '')) || undefined;
      }

      return {
        id: String(p.id || p.product_id || p.slug || `prod-${Math.random()}`),
        name: p.name || p.title || p.product_name || 'Furniture Item',
        slug: p.slug || p.id || (p.name ? p.name.toLowerCase().replace(/\s+/g, '-') : 'item'),
        category: p.category || p.category_id || p.categoryId || 'other-furniture',
        price: numPrice,
        originalPrice: numOrigPrice,
        description: p.description || p.desc || '',
        features,
        dimensions: p.dimensions || p.size || null,
        material: p.material || p.wood_type || null,
        images,
        imageLabels: Array.isArray(p.image_labels) ? p.image_labels : [],
        inStock: p.in_stock !== undefined ? Boolean(p.in_stock) : (p.inStock !== undefined ? Boolean(p.inStock) : true),
        isFeatured: p.is_featured !== undefined ? Boolean(p.is_featured) : (p.isFeatured !== undefined ? Boolean(p.isFeatured) : false),
        createdAt: p.created_at || p.createdAt || new Date().toISOString(),
      };
    });
  } catch (err) {
    console.warn('Error fetching products from Supabase:', err);
    return null;
  }
}

export async function directGetProductById(id: string): Promise<Product | null> {
  const sb = getClientSupabase();
  if (!sb) return null;

  try {
    const { data, error } = await sb
      .from('products')
      .select('*')
      .or(`id.eq.${id},slug.eq.${id}`)
      .limit(1)
      .single();

    if (error || !data) return null;

    let images: string[] = [];
    if (Array.isArray(data.images)) images = data.images;
    else if (data.image_url || data.image) images = [data.image_url || data.image];
    if (images.length === 0) images = ['https://images.unsplash.com/photo-1555041469-a586c61ea9bc?auto=format&fit=crop&w=800&q=80'];

    return {
      id: String(data.id || data.slug),
      name: data.name || data.title || 'Furniture',
      slug: data.slug || data.id,
      category: data.category || data.category_id || 'other-furniture',
      price: Number(data.price) || 0,
      originalPrice: data.original_price ? Number(data.original_price) : undefined,
      description: data.description || '',
      features: Array.isArray(data.features) ? data.features : [],
      dimensions: data.dimensions,
      material: data.material,
      images,
      imageLabels: Array.isArray(data.image_labels) ? data.image_labels : [],
      inStock: Boolean(data.in_stock),
      isFeatured: Boolean(data.is_featured),
      createdAt: data.created_at,
    };
  } catch {
    return null;
  }
}

export async function directUpsertProduct(prod: Partial<Product>): Promise<Product | null> {
  const sb = getClientSupabase();
  if (!sb) return null;

  const id = prod.id || `prod-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`;
  
  // Format slug safely
  const baseSlug = (prod.name || 'furniture')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '');
  const slug = prod.slug || `${baseSlug}-${Math.random().toString(36).substring(2, 6)}`;

  const categoryId = prod.category || null;

  // Clean images array
  const images = prod.images && prod.images.length > 0
    ? prod.images
    : ['https://images.unsplash.com/photo-1555041469-a586c61ea9bc?auto=format&fit=crop&w=800&q=80'];

  // 1. Standard PostgreSQL schema payload
  let payload: Record<string, any> = {
    id,
    name: prod.name || 'New Furniture',
    slug,
    category_id: categoryId,
    price: Number(prod.price) || 0,
    original_price: prod.originalPrice !== undefined && prod.originalPrice !== null ? Number(prod.originalPrice) : null,
    description: prod.description || '',
    features: Array.isArray(prod.features) ? prod.features : [],
    dimensions: prod.dimensions || null,
    material: prod.material || null,
    images,
    image_labels: Array.isArray(prod.imageLabels) ? prod.imageLabels : [],
    in_stock: prod.inStock ?? true,
    is_featured: prod.isFeatured ?? false,
    updated_at: new Date().toISOString(),
  };

  if (prod.createdAt) {
    payload.created_at = prod.createdAt;
  }

  try {
    // Attempt 1: Standard upsert with category_id
    let { data, error } = await sb.from('products').upsert(payload, { onConflict: 'id' }).select().single();

    // Check if category_id column was missing or table was created with 'category' column
    if (error && (error.message?.includes('category_id') || error.code === 'PGRST204')) {
      delete payload.category_id;
      payload.category = categoryId || 'other-furniture';
      const retry = await sb.from('products').upsert(payload, { onConflict: 'id' }).select().single();
      data = retry.data;
      error = retry.error;
    }

    // Check if category foreign key constraint failed (e.g., category doesn't exist in categories table yet)
    if (error && (error.message?.includes('violates foreign key') || error.code === '23503')) {
      // If category doesn't exist, try ensuring the category exists or set to null
      if (categoryId) {
        try {
          await sb.from('categories').upsert({
            id: categoryId,
            name: categoryId.charAt(0).toUpperCase() + categoryId.slice(1).replace(/-/g, ' '),
            slug: categoryId,
          }, { onConflict: 'id' });
          const retryWithCategory = await sb.from('products').upsert(payload, { onConflict: 'id' }).select().single();
          data = retryWithCategory.data;
          error = retryWithCategory.error;
        } catch {
          // If still fails, set category_id to null
          payload.category_id = null;
          const retryNull = await sb.from('products').upsert(payload, { onConflict: 'id' }).select().single();
          data = retryNull.data;
          error = retryNull.error;
        }
      }
    }

    // Check if slug uniqueness failed
    if (error && (error.message?.includes('slug') || error.code === '23505')) {
      payload.slug = `${slug}-${Date.now().toString().slice(-4)}`;
      const retrySlug = await sb.from('products').upsert(payload, { onConflict: 'id' }).select().single();
      data = retrySlug.data;
      error = retrySlug.error;
    }

    if (error) {
      console.error('Supabase directUpsertProduct error:', error.message, error.details, error.hint, error.code);
      return null;
    }

    if (!data) return null;

    let parsedImages: string[] = [];
    if (Array.isArray(data.images)) parsedImages = data.images;
    else if (typeof data.images === 'string') {
      try {
        parsedImages = JSON.parse(data.images);
      } catch {
        parsedImages = [data.images];
      }
    } else if (data.image_url || data.image) {
      parsedImages = [data.image_url || data.image];
    }
    if (parsedImages.length === 0) parsedImages = images;

    return {
      id: String(data.id || id),
      name: data.name || prod.name || 'Furniture Item',
      slug: data.slug || slug,
      category: data.category || data.category_id || prod.category || 'other-furniture',
      price: Number(data.price) || Number(prod.price) || 0,
      originalPrice: data.original_price ? Number(data.original_price) : (prod.originalPrice ? Number(prod.originalPrice) : undefined),
      description: data.description || prod.description || '',
      features: Array.isArray(data.features) ? data.features : (prod.features || []),
      dimensions: data.dimensions || prod.dimensions || null,
      material: data.material || prod.material || null,
      images: parsedImages,
      imageLabels: Array.isArray(data.image_labels) ? data.image_labels : (prod.imageLabels || []),
      inStock: data.in_stock !== undefined ? Boolean(data.in_stock) : (prod.inStock ?? true),
      isFeatured: data.is_featured !== undefined ? Boolean(data.is_featured) : (prod.isFeatured ?? false),
      createdAt: data.created_at || prod.createdAt || new Date().toISOString(),
    };
  } catch (err: any) {
    console.error('Exception in directUpsertProduct:', err);
    return null;
  }
}

export async function directDeleteProduct(id: string): Promise<boolean> {
  const sb = getClientSupabase();
  if (!sb) return false;

  try {
    const { error } = await sb.from('products').delete().eq('id', id);
    return !error;
  } catch {
    return false;
  }
}

export async function directGetOrders(): Promise<Order[] | null> {
  const sb = getClientSupabase();
  if (!sb) return null;

  try {
    const { data, error } = await sb.from('orders').select('*').order('created_at', { ascending: false });
    if (error || !data || data.length === 0) return null;

    // Collect order IDs that might need items fetched from order_items table
    const ordersNeedingItems = data.filter((o: any) => !Array.isArray(o.items) || o.items.length === 0);
    let orderItemsMap: Record<string, any[]> = {};

    if (ordersNeedingItems.length > 0) {
      try {
        const orderIds = ordersNeedingItems.map((o: any) => o.id || o.order_number);
        const { data: itemsData } = await sb
          .from('order_items')
          .select('*')
          .in('order_id', orderIds);

        if (Array.isArray(itemsData) && itemsData.length > 0) {
          itemsData.forEach((item: any) => {
            const orderId = item.order_id;
            if (!orderItemsMap[orderId]) orderItemsMap[orderId] = [];
            orderItemsMap[orderId].push({
              productId: item.product_id || item.productId || 'item',
              productName: item.product_name || item.productName || item.name || 'Furniture Item',
              price: Number(item.price) || 0,
              quantity: Number(item.quantity) || 1,
              image: item.image || item.image_url || '',
            });
          });
        }
      } catch {}
    }

    return data.map((o: any) => {
      const orderId = String(o.id || o.order_number);
      let items = Array.isArray(o.items) ? o.items : [];
      if (items.length === 0 && orderItemsMap[orderId]) {
        items = orderItemsMap[orderId];
      }

      return {
        id: orderId,
        orderNumber: o.order_number || o.orderNumber || o.id,
        customerName: o.customer_name || o.customerName || 'Customer',
        phone: o.phone || '',
        whatsappNumber: o.whatsapp_number || o.whatsappNumber || o.phone || '',
        address: o.address || '',
        city: o.city || 'Lahore',
        notes: o.notes || '',
        items,
        totalAmount: Number(o.total_amount || o.totalAmount) || 0,
        status: o.status || 'New',
        createdAt: o.created_at || o.createdAt || new Date().toISOString(),
      };
    });
  } catch (err) {
    console.warn('Error fetching orders from Supabase:', err);
    return null;
  }
}

export async function directCreateOrder(orderData: {
  customerName: string;
  phone: string;
  whatsappNumber?: string;
  address: string;
  city: string;
  notes?: string;
  items: any[];
  totalAmount: number;
}): Promise<Order | null> {
  const sb = getClientSupabase();
  if (!sb) {
    console.warn('directCreateOrder: Supabase client is null or missing credentials.');
    return null;
  }

  const id = `ord-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`;
  const orderNumber = `GR-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`;
  
  // Format clean items
  const cleanItems = (orderData.items || []).map((item) => ({
    productId: item.productId || item.id || '',
    productName: item.productName || item.name || 'Furniture Item',
    price: Number(item.price) || 0,
    quantity: Number(item.quantity) || 1,
    image: item.image || '',
  }));

  // Standard payload with JSONB items
  let payload: Record<string, any> = {
    id,
    order_number: orderNumber,
    customer_name: orderData.customerName,
    phone: orderData.phone,
    whatsapp_number: orderData.whatsappNumber || orderData.phone,
    address: orderData.address,
    city: orderData.city,
    notes: orderData.notes || null,
    items: cleanItems,
    total_amount: orderData.totalAmount,
    status: 'New',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };

  try {
    let orderRow: any = null;
    let currentPayload = { ...payload };

    // Attempt 1: Full payload insert
    let { data, error } = await sb.from('orders').insert(currentPayload).select().single();

    // Attempt 2: If error mentions 'items' or schema cache mismatch
    if (error && (error.message?.includes('items') || error.code === 'PGRST204' || error.code === '42703')) {
      delete currentPayload.items;
      const retry1 = await sb.from('orders').insert(currentPayload).select().single();
      data = retry1.data;
      error = retry1.error;
    }

    // Attempt 3: If error mentions 'whatsapp_number'
    if (error && (error.message?.includes('whatsapp_number') || error.code === 'PGRST204' || error.code === '42703')) {
      delete currentPayload.whatsapp_number;
      const retry2 = await sb.from('orders').insert(currentPayload).select().single();
      data = retry2.data;
      error = retry2.error;
    }

    // Attempt 4: Minimal core columns fallback if table schema is strict
    if (error) {
      const minimalPayload: Record<string, any> = {
        id,
        order_number: orderNumber,
        customer_name: orderData.customerName,
        phone: orderData.phone,
        address: orderData.address,
        city: orderData.city,
        total_amount: orderData.totalAmount,
        status: 'New',
        created_at: new Date().toISOString(),
      };
      if (orderData.notes) minimalPayload.notes = orderData.notes;
      const retryMin = await sb.from('orders').insert(minimalPayload).select().single();
      data = retryMin.data;
      error = retryMin.error;
    }

    if (error) {
      console.error('Supabase directCreateOrder error:', error.message, error.details, error.code);
      return null;
    }

    orderRow = data;

    // Also attempt to insert breakdown into order_items table if it exists
    if (cleanItems.length > 0) {
      try {
        const orderItemRows = cleanItems.map((item, idx) => ({
          id: `item-${id}-${idx + 1}`,
          order_id: id,
          product_id: item.productId || null,
          product_name: item.productName,
          price: item.price,
          quantity: item.quantity,
          image: item.image || null,
        }));
        await sb.from('order_items').insert(orderItemRows);
      } catch (itemErr) {
        // order_items table is optional if items json is saved
        console.warn('Could not insert to order_items table (optional):', itemErr);
      }
    }

    return {
      id: orderRow.id || id,
      orderNumber: orderRow.order_number || orderNumber,
      customerName: orderRow.customer_name || orderData.customerName,
      phone: orderRow.phone || orderData.phone,
      whatsappNumber: orderRow.whatsapp_number || orderData.whatsappNumber || orderData.phone,
      address: orderRow.address || orderData.address,
      city: orderRow.city || orderData.city,
      notes: orderRow.notes || orderData.notes,
      items: cleanItems,
      totalAmount: Number(orderRow.total_amount) || orderData.totalAmount,
      status: (orderRow.status as OrderStatus) || 'New',
      createdAt: orderRow.created_at || payload.created_at,
    };
  } catch (err: any) {
    console.error('Exception in directCreateOrder:', err);
    return null;
  }
}

export async function directUpdateOrderStatus(id: string, status: OrderStatus): Promise<Order | null> {
  const sb = getClientSupabase();
  if (!sb) return null;

  try {
    const { data, error } = await sb.from('orders').update({ status }).eq('id', id).select().single();
    if (error || !data) return null;
    return {
      id: data.id,
      orderNumber: data.order_number,
      customerName: data.customer_name,
      phone: data.phone,
      whatsappNumber: data.whatsapp_number,
      address: data.address,
      city: data.city,
      notes: data.notes,
      items: Array.isArray(data.items) ? data.items : [],
      totalAmount: Number(data.total_amount),
      status: data.status,
      createdAt: data.created_at,
    };
  } catch {
    return null;
  }
}

export async function directDeleteOrder(id: string): Promise<boolean> {
  const sb = getClientSupabase();
  if (!sb) return false;

  try {
    const { error } = await sb.from('orders').delete().eq('id', id);
    return !error;
  } catch {
    return false;
  }
}

export async function directUploadImage(base64: string): Promise<string | null> {
  const sb = getClientSupabase();
  if (!sb) return null;

  try {
    const match = base64.match(/^data:([A-Za-z-+\/]+);base64,(.+)$/);
    if (!match) return null;

    const mimeType = match[1];
    const base64Data = match[2];
    const byteCharacters = atob(base64Data);
    const byteNumbers = new Array(byteCharacters.length);
    for (let i = 0; i < byteCharacters.length; i++) {
      byteNumbers[i] = byteCharacters.charCodeAt(i);
    }
    const byteArray = new Uint8Array(byteNumbers);
    const blob = new Blob([byteArray], { type: mimeType });

    const ext = mimeType.split('/')[1] || 'jpg';
    const fileName = `furniture-${Date.now()}-${Math.random().toString(36).substring(2, 8)}.${ext}`;

    const { error: uploadError } = await sb.storage.from('product-images').upload(fileName, blob, {
      contentType: mimeType,
      upsert: true,
    });

    if (uploadError) {
      console.warn('Supabase storage upload error:', uploadError);
      return null;
    }

    const { data: publicUrlData } = sb.storage.from('product-images').getPublicUrl(fileName);
    return publicUrlData?.publicUrl || null;
  } catch (err) {
    console.warn('Error in directUploadImage:', err);
    return null;
  }
}
