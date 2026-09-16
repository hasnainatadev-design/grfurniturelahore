import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { Category, Product, Order, OrderStatus } from '../src/types';

// Lazy-initialized Supabase client
let supabaseClient: SupabaseClient | null = null;
let supabaseInitializationAttempted = false;

export function getSupabaseClient(): SupabaseClient | null {
  if (supabaseClient) return supabaseClient;
  if (supabaseInitializationAttempted) return supabaseClient;

  supabaseInitializationAttempted = true;

  const url = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
  const key =
    process.env.SUPABASE_SERVICE_ROLE_KEY ||
    process.env.SUPABASE_ANON_KEY ||
    process.env.SUPABASE_KEY ||
    process.env.VITE_SUPABASE_ANON_KEY;

  if (!url || !key) {
    console.log('ℹ️ Supabase credentials not set in environment. Operating in local database mode.');
    return null;
  }

  try {
    supabaseClient = createClient(url, key, {
      auth: {
        persistSession: false,
        autoRefreshToken: false,
      },
    });
    console.log('✅ Supabase client successfully initialized for URL:', url);
    return supabaseClient;
  } catch (err) {
    console.error('❌ Failed to initialize Supabase client:', err);
    return null;
  }
}

export function isSupabaseConfigured(): boolean {
  const url = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
  const key =
    process.env.SUPABASE_SERVICE_ROLE_KEY ||
    process.env.SUPABASE_ANON_KEY ||
    process.env.SUPABASE_KEY ||
    process.env.VITE_SUPABASE_ANON_KEY;
  return Boolean(url && key);
}

// Convert Supabase DB product row to application Product interface
function mapSupabaseProduct(row: any): Product {
  return {
    id: row.id,
    name: row.name,
    slug: row.slug || row.name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, ''),
    category: row.category_id || row.category,
    price: Number(row.price),
    originalPrice: row.original_price ? Number(row.original_price) : undefined,
    description: row.description || '',
    features: Array.isArray(row.features)
      ? row.features
      : typeof row.features === 'string'
      ? JSON.parse(row.features || '[]')
      : [],
    dimensions: row.dimensions || undefined,
    material: row.material || undefined,
    images: Array.isArray(row.images)
      ? row.images
      : typeof row.images === 'string'
      ? JSON.parse(row.images || '[]')
      : [],
    imageLabels: Array.isArray(row.image_labels)
      ? row.image_labels
      : typeof row.image_labels === 'string'
      ? JSON.parse(row.image_labels || '[]')
      : [],
    inStock: row.in_stock !== undefined ? Boolean(row.in_stock) : true,
    isFeatured: Boolean(row.is_featured),
    createdAt: row.created_at || new Date().toISOString(),
  };
}

// Convert Supabase DB category row to application Category interface
function mapSupabaseCategory(row: any): Category {
  return {
    id: row.id,
    name: row.name,
    slug: row.slug || row.id,
    description: row.description || '',
    image: row.image || '',
  };
}

// Convert Supabase DB order row to application Order interface
function mapSupabaseOrder(row: any, items: any[] = []): Order {
  return {
    id: row.id,
    orderNumber: row.order_number,
    customerName: row.customer_name,
    phone: row.phone,
    whatsappNumber: row.whatsapp_number || row.phone,
    address: row.address,
    city: row.city,
    notes: row.notes || '',
    items: items.map((it) => ({
      productId: it.product_id,
      productName: it.product_name,
      price: Number(it.price),
      quantity: Number(it.quantity || 1),
      image: it.image || '',
    })),
    totalAmount: Number(row.total_amount),
    status: (row.status as OrderStatus) || 'New',
    createdAt: row.created_at || new Date().toISOString(),
  };
}

// ======================== SLUG UTILITIES ========================
export async function generateUniqueProductSlug(
  sb: SupabaseClient,
  baseNameOrSlug: string,
  excludeProductId?: string
): Promise<string> {
  const baseSlug = (baseNameOrSlug || 'furniture')
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '') || 'furniture';

  let candidate = baseSlug;
  let attempt = 1;

  while (attempt <= 20) {
    let query = sb.from('products').select('id').eq('slug', candidate);
    if (excludeProductId) {
      query = query.neq('id', excludeProductId);
    }
    const { data, error } = await query;
    if (error || !data || data.length === 0) {
      return candidate;
    }
    attempt++;
    if (attempt <= 10) {
      candidate = `${baseSlug}-${attempt}`;
    } else {
      const shortId = Math.random().toString(36).substring(2, 6);
      candidate = `${baseSlug}-${shortId}`;
    }
  }
  return `${baseSlug}-${Date.now()}`;
}

export async function generateUniqueCategorySlug(
  sb: SupabaseClient,
  baseNameOrSlug: string,
  excludeCategoryId?: string
): Promise<string> {
  const baseSlug = (baseNameOrSlug || 'category')
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '') || 'category';

  let candidate = baseSlug;
  let attempt = 1;

  while (attempt <= 20) {
    let query = sb.from('categories').select('id').eq('slug', candidate);
    if (excludeCategoryId) {
      query = query.neq('id', excludeCategoryId);
    }
    const { data, error } = await query;
    if (error || !data || data.length === 0) {
      return candidate;
    }
    attempt++;
    if (attempt <= 10) {
      candidate = `${baseSlug}-${attempt}`;
    } else {
      const shortId = Math.random().toString(36).substring(2, 6);
      candidate = `${baseSlug}-${shortId}`;
    }
  }
  return `${baseSlug}-${Date.now()}`;
}

// ======================== CATEGORIES ========================
export async function getSupabaseCategories(): Promise<Category[] | null> {
  const sb = getSupabaseClient();
  if (!sb) return null;

  const { data, error } = await sb
    .from('categories')
    .select('*')
    .order('display_order', { ascending: true, nullsFirst: false });

  if (error) {
    console.error('Supabase getCategories error:', error.message);
    return null;
  }
  return (data || []).map(mapSupabaseCategory);
}

export async function createSupabaseCategory(cat: Partial<Category>): Promise<Category | null> {
  const sb = getSupabaseClient();
  if (!sb) return null;

  const id = cat.id || (cat.name ? cat.name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '') : `cat-${Date.now()}`);
  const baseSlug = cat.slug || cat.name || id;
  const slug = await generateUniqueCategorySlug(sb, baseSlug, id);

  const payload = {
    id,
    name: cat.name,
    slug,
    description: cat.description || '',
    image: cat.image || '',
  };

  const { data, error } = await sb.from('categories').upsert(payload, { onConflict: 'id' }).select().single();
  if (error) {
    console.error('Supabase createCategory error:', error.message);
    throw new Error(error.message);
  }
  return mapSupabaseCategory(data);
}

export async function updateSupabaseCategory(id: string, updates: Partial<Category>): Promise<Category | null> {
  const sb = getSupabaseClient();
  if (!sb) return null;

  const payload: any = {};
  if (updates.name !== undefined) payload.name = updates.name;
  if (updates.slug !== undefined || updates.name !== undefined) {
    const baseSlug = updates.slug || updates.name || '';
    if (baseSlug) {
      payload.slug = await generateUniqueCategorySlug(sb, baseSlug, id);
    }
  }
  if (updates.description !== undefined) payload.description = updates.description;
  if (updates.image !== undefined) payload.image = updates.image;

  const { data, error } = await sb.from('categories').update(payload).eq('id', id).select().single();
  if (error) {
    console.error('Supabase updateCategory error:', error.message);
    throw new Error(error.message);
  }
  return mapSupabaseCategory(data);
}

export async function deleteSupabaseCategory(id: string): Promise<boolean> {
  const sb = getSupabaseClient();
  if (!sb) return false;

  const { error } = await sb.from('categories').delete().eq('id', id);
  if (error) {
    console.error('Supabase deleteCategory error:', error.message);
    throw new Error(error.message);
  }
  return true;
}

// ======================== PRODUCTS ========================
export async function getSupabaseProducts(filter?: {
  category?: string;
  search?: string;
  featured?: boolean;
  sort?: string;
}): Promise<Product[] | null> {
  const sb = getSupabaseClient();
  if (!sb) return null;

  let query = sb.from('products').select('*');

  if (filter?.category && filter.category !== 'all') {
    query = query.eq('category_id', filter.category);
  }
  if (filter?.featured !== undefined) {
    query = query.eq('is_featured', filter.featured);
  }

  if (filter?.sort === 'price-low') {
    query = query.order('price', { ascending: true });
  } else if (filter?.sort === 'price-high') {
    query = query.order('price', { ascending: false });
  } else {
    query = query.order('created_at', { ascending: false });
  }

  const { data, error } = await query;
  if (error) {
    console.error('Supabase getProducts error:', error.message);
    return null;
  }

  let products = (data || []).map(mapSupabaseProduct);

  if (filter?.search) {
    const q = filter.search.toLowerCase();
    products = products.filter(
      (p) =>
        p.name.toLowerCase().includes(q) ||
        p.description.toLowerCase().includes(q) ||
        p.material?.toLowerCase().includes(q)
    );
  }

  return products;
}

export async function getSupabaseProductById(id: string): Promise<Product | null> {
  const sb = getSupabaseClient();
  if (!sb) return null;

  const { data, error } = await sb
    .from('products')
    .select('*')
    .or(`id.eq.${id},slug.eq.${id}`)
    .single();

  if (error || !data) {
    return null;
  }
  return mapSupabaseProduct(data);
}

export async function createSupabaseProduct(product: Partial<Product>): Promise<Product | null> {
  const sb = getSupabaseClient();
  if (!sb) return null;

  const id = product.id || `prod-${Date.now()}`;
  const baseSlug = product.slug || product.name || `furniture-${Date.now()}`;
  const slug = await generateUniqueProductSlug(sb, baseSlug, id);

  const payload = {
    id,
    name: product.name,
    slug,
    category_id: product.category,
    price: Number(product.price),
    original_price: product.originalPrice ? Number(product.originalPrice) : null,
    description: product.description || '',
    features: product.features || [],
    dimensions: product.dimensions || null,
    material: product.material || null,
    images: product.images || [],
    image_labels: product.imageLabels || [],
    in_stock: product.inStock !== undefined ? product.inStock : true,
    is_featured: Boolean(product.isFeatured),
    updated_at: new Date().toISOString(),
  };

  try {
    const { data, error } = await sb.from('products').upsert(payload, { onConflict: 'id' }).select().single();
    if (error) {
      if (error.message.includes('slug') || error.code === '23505') {
        payload.slug = `${payload.slug}-${Date.now().toString(36).slice(-4)}`;
        const retry = await sb.from('products').upsert(payload, { onConflict: 'id' }).select().single();
        if (retry.error) throw new Error(retry.error.message);
        return mapSupabaseProduct(retry.data);
      }
      console.error('Supabase createProduct error:', error.message);
      throw new Error(error.message);
    }
    return mapSupabaseProduct(data);
  } catch (err: any) {
    console.error('Supabase createProduct exception:', err.message);
    throw err;
  }
}

export async function updateSupabaseProduct(id: string, updates: Partial<Product>): Promise<Product | null> {
  const sb = getSupabaseClient();
  if (!sb) return null;

  const payload: any = {
    updated_at: new Date().toISOString(),
  };

  if (updates.name !== undefined) {
    payload.name = updates.name;
    const baseSlug = updates.slug || updates.name;
    payload.slug = await generateUniqueProductSlug(sb, baseSlug, id);
  } else if (updates.slug !== undefined) {
    payload.slug = await generateUniqueProductSlug(sb, updates.slug, id);
  }

  if (updates.category !== undefined) payload.category_id = updates.category;
  if (updates.price !== undefined) payload.price = Number(updates.price);
  if (updates.originalPrice !== undefined) {
    payload.original_price = updates.originalPrice ? Number(updates.originalPrice) : null;
  }
  if (updates.description !== undefined) payload.description = updates.description;
  if (updates.features !== undefined) payload.features = updates.features;
  if (updates.dimensions !== undefined) payload.dimensions = updates.dimensions;
  if (updates.material !== undefined) payload.material = updates.material;
  if (updates.images !== undefined) payload.images = updates.images;
  if (updates.imageLabels !== undefined) payload.image_labels = updates.imageLabels;
  if (updates.inStock !== undefined) payload.in_stock = Boolean(updates.inStock);
  if (updates.isFeatured !== undefined) payload.is_featured = Boolean(updates.isFeatured);

  try {
    const { data, error } = await sb.from('products').update(payload).eq('id', id).select().single();
    if (error) {
      if (error.message.includes('slug') || error.code === '23505') {
        payload.slug = `${payload.slug}-${Date.now().toString(36).slice(-4)}`;
        const retry = await sb.from('products').update(payload).eq('id', id).select().single();
        if (retry.error) throw new Error(retry.error.message);
        return mapSupabaseProduct(retry.data);
      }
      console.error('Supabase updateProduct error:', error.message);
      throw new Error(error.message);
    }
    return mapSupabaseProduct(data);
  } catch (err: any) {
    console.error('Supabase updateProduct exception:', err.message);
    throw err;
  }
}

export async function deleteSupabaseProduct(id: string): Promise<boolean> {
  const sb = getSupabaseClient();
  if (!sb) return false;

  const { error } = await sb.from('products').delete().eq('id', id);
  if (error) {
    console.error('Supabase deleteProduct error:', error.message);
    throw new Error(error.message);
  }
  return true;
}

// ======================== ORDERS ========================
export async function getSupabaseOrders(): Promise<Order[] | null> {
  const sb = getSupabaseClient();
  if (!sb) return null;

  const { data: orderRows, error: orderErr } = await sb
    .from('orders')
    .select('*')
    .order('created_at', { ascending: false });

  if (orderErr) {
    console.error('Supabase getOrders error:', orderErr.message);
    return null;
  }

  if (!orderRows || orderRows.length === 0) return [];

  const orderIds = orderRows.map((o) => o.id);
  const { data: itemRows, error: itemErr } = await sb
    .from('order_items')
    .select('*')
    .in('order_id', orderIds);

  if (itemErr) {
    console.error('Supabase getOrderItems error:', itemErr.message);
  }

  const itemsByOrder: Record<string, any[]> = {};
  (itemRows || []).forEach((it) => {
    if (!itemsByOrder[it.order_id]) itemsByOrder[it.order_id] = [];
    itemsByOrder[it.order_id].push(it);
  });

  return orderRows.map((ord) => mapSupabaseOrder(ord, itemsByOrder[ord.id] || []));
}

export async function createSupabaseOrder(orderData: {
  customerName: string;
  phone: string;
  whatsappNumber?: string;
  address: string;
  city: string;
  notes?: string;
  items: {
    productId: string;
    productName: string;
    price: number;
    quantity: number;
    image: string;
  }[];
  totalAmount: number;
}): Promise<Order | null> {
  const sb = getSupabaseClient();
  if (!sb) return null;

  const orderId = `ord-${Date.now()}`;
  const orderNumber = `GR-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`;

  const orderPayload = {
    id: orderId,
    order_number: orderNumber,
    customer_name: orderData.customerName,
    phone: orderData.phone,
    whatsapp_number: orderData.whatsappNumber || orderData.phone,
    address: orderData.address,
    city: orderData.city,
    notes: orderData.notes || '',
    total_amount: Number(orderData.totalAmount),
    status: 'New',
    created_at: new Date().toISOString(),
  };

  const { data: createdOrder, error: orderErr } = await sb
    .from('orders')
    .insert(orderPayload)
    .select()
    .single();

  if (orderErr) {
    console.error('Supabase createOrder error:', orderErr.message);
    throw new Error(orderErr.message);
  }

  const itemsPayload = orderData.items.map((it, idx) => ({
    id: `item-${Date.now()}-${idx}`,
    order_id: orderId,
    product_id: it.productId,
    product_name: it.productName,
    price: Number(it.price),
    quantity: Number(it.quantity || 1),
    image: it.image || '',
  }));

  const { error: itemsErr } = await sb.from('order_items').insert(itemsPayload);
  if (itemsErr) {
    console.error('Supabase insert order_items error:', itemsErr.message);
  }

  return mapSupabaseOrder(createdOrder, itemsPayload);
}

export async function updateSupabaseOrderStatus(id: string, status: OrderStatus): Promise<Order | null> {
  const sb = getSupabaseClient();
  if (!sb) return null;

  const { data, error } = await sb
    .from('orders')
    .update({ status, updated_at: new Date().toISOString() })
    .eq('id', id)
    .select()
    .single();

  if (error) {
    console.error('Supabase updateOrderStatus error:', error.message);
    throw new Error(error.message);
  }

  const { data: itemRows } = await sb.from('order_items').select('*').eq('order_id', id);
  return mapSupabaseOrder(data, itemRows || []);
}

export async function deleteSupabaseOrder(id: string): Promise<boolean> {
  const sb = getSupabaseClient();
  if (!sb) return false;

  await sb.from('order_items').delete().eq('order_id', id);
  const { error } = await sb.from('orders').delete().eq('id', id);
  if (error) {
    console.error('Supabase deleteOrder error:', error.message);
    throw new Error(error.message);
  }
  return true;
}

// ======================== STORAGE (IMAGES) ========================
export async function uploadImageToSupabaseStorage(
  buffer: Buffer,
  fileName: string,
  contentType: string = 'image/jpeg'
): Promise<string | null> {
  const sb = getSupabaseClient();
  if (!sb) return null;

  const bucketName = 'product-images';

  try {
    // Try upload
    const { data, error } = await sb.storage.from(bucketName).upload(fileName, buffer, {
      contentType,
      upsert: true,
    });

    if (error) {
      console.warn('Supabase storage upload error:', error.message);
      return null;
    }

    // Get public URL
    const { data: urlData } = sb.storage.from(bucketName).getPublicUrl(fileName);
    return urlData.publicUrl;
  } catch (err: any) {
    console.error('Supabase storage exception:', err.message);
    return null;
  }
}

// ======================== SAFE ONE-TIME MIGRATION / SYNC ========================
export async function syncLocalDataToSupabase(localData: {
  categories: Category[];
  products: Product[];
  orders: Order[];
}): Promise<{ syncedCategories: number; syncedProducts: number; syncedOrders: number }> {
  const sb = getSupabaseClient();
  if (!sb) {
    throw new Error('Supabase is not configured. Set SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY.');
  }

  let syncedCategories = 0;
  let syncedProducts = 0;
  let syncedOrders = 0;

  // 1. Sync Categories (upsert)
  for (const cat of localData.categories) {
    try {
      await sb.from('categories').upsert({
        id: cat.id,
        name: cat.name,
        slug: cat.slug || cat.id,
        description: cat.description || '',
        image: cat.image || '',
      });
      syncedCategories++;
    } catch (err) {
      console.error(`Failed to sync category ${cat.name}:`, err);
    }
  }

  // 2. Sync Products (upsert)
  for (const prod of localData.products) {
    try {
      const baseSlug = prod.slug || prod.name || 'furniture';
      const slug = await generateUniqueProductSlug(sb, baseSlug, prod.id);

      const payload = {
        id: prod.id,
        name: prod.name,
        slug,
        category_id: prod.category,
        price: Number(prod.price),
        original_price: prod.originalPrice ? Number(prod.originalPrice) : null,
        description: prod.description || '',
        features: prod.features || [],
        dimensions: prod.dimensions || null,
        material: prod.material || null,
        images: prod.images || [],
        image_labels: prod.imageLabels || [],
        in_stock: prod.inStock !== undefined ? prod.inStock : true,
        is_featured: Boolean(prod.isFeatured),
        created_at: prod.createdAt || new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };

      const { error } = await sb.from('products').upsert(payload, { onConflict: 'id' });
      if (error) {
        if (error.message.includes('slug') || error.code === '23505') {
          payload.slug = `${payload.slug}-${Date.now().toString(36).slice(-4)}`;
          await sb.from('products').upsert(payload, { onConflict: 'id' });
        } else {
          throw error;
        }
      }
      syncedProducts++;
    } catch (err) {
      console.error(`Failed to sync product ${prod.name}:`, err);
    }
  }

  // 3. Sync Orders (upsert)
  for (const ord of localData.orders) {
    try {
      await sb.from('orders').upsert({
        id: ord.id,
        order_number: ord.orderNumber,
        customer_name: ord.customerName,
        phone: ord.phone,
        whatsapp_number: ord.whatsappNumber || ord.phone,
        address: ord.address,
        city: ord.city,
        notes: ord.notes || '',
        total_amount: Number(ord.totalAmount),
        status: ord.status || 'New',
        created_at: ord.createdAt || new Date().toISOString(),
        updated_at: new Date().toISOString(),
      });

      if (ord.items && ord.items.length > 0) {
        const itemRows = ord.items.map((it, idx) => ({
          id: `item-${ord.id}-${idx}`,
          order_id: ord.id,
          product_id: it.productId,
          product_name: it.productName,
          price: Number(it.price),
          quantity: Number(it.quantity || 1),
          image: it.image || '',
        }));
        await sb.from('order_items').upsert(itemRows);
      }
      syncedOrders++;
    } catch (err) {
      console.error(`Failed to sync order ${ord.orderNumber}:`, err);
    }
  }

  return { syncedCategories, syncedProducts, syncedOrders };
}
