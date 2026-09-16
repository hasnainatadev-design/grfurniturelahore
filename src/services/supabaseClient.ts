import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { Category, Product, Order } from '../types';

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

    // Test tables
    const { error: catError } = await sb.from('categories').select('id').limit(1);
    const { error: prodError } = await sb.from('products').select('id').limit(1);
    const { error: ordError } = await sb.from('orders').select('id').limit(1);

    if (catError && catError.code === '42P01') {
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

    if (catError) {
      return {
        connected: false,
        url,
        hasKey: true,
        categoriesTableOk: false,
        productsTableOk: false,
        ordersTableOk: false,
        error: `Supabase error: ${catError.message} (code ${catError.code || 'unknown'})`,
      };
    }

    return {
      connected: true,
      url,
      hasKey: true,
      categoriesTableOk: !catError,
      productsTableOk: !prodError,
      ordersTableOk: !ordError,
      details: 'Connected successfully to Supabase! All tables are accessible.',
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
    const { error } = await sb.from('products').upsert(
      {
        id: prod.id,
        name: prod.name,
        slug: prod.slug,
        category: prod.category,
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
      },
      { onConflict: 'id' }
    );
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

export async function fetchDirectFromSupabase(): Promise<{
  categories: Category[] | null;
  products: Product[] | null;
  orders: Order[] | null;
}> {
  const sb = getClientSupabase();
  if (!sb) return { categories: null, products: null, orders: null };

  try {
    const [catRes, prodRes, ordRes] = await Promise.all([
      sb.from('categories').select('*'),
      sb.from('products').select('*'),
      sb.from('orders').select('*').order('created_at', { ascending: false }),
    ]);

    const categories: Category[] | null = catRes.data
      ? catRes.data.map((c: any) => ({
          id: c.id,
          name: c.name,
          slug: c.slug,
          description: c.description || '',
          image: c.image || '',
        }))
      : null;

    const products: Product[] | null = prodRes.data
      ? prodRes.data.map((p: any) => ({
          id: p.id,
          name: p.name,
          slug: p.slug,
          category: p.category,
          price: Number(p.price),
          originalPrice: p.original_price ? Number(p.original_price) : undefined,
          description: p.description || '',
          features: p.features || [],
          dimensions: p.dimensions,
          material: p.material,
          images: p.images || [],
          imageLabels: p.image_labels || [],
          inStock: Boolean(p.in_stock),
          isFeatured: Boolean(p.is_featured),
          createdAt: p.created_at || new Date().toISOString(),
        }))
      : null;

    const orders: Order[] | null = ordRes.data
      ? ordRes.data.map((o: any) => ({
          id: o.id,
          orderNumber: o.order_number || o.id,
          customerName: o.customer_name,
          phone: o.phone,
          whatsappNumber: o.whatsapp_number || o.phone,
          address: o.address,
          city: o.city,
          notes: o.notes,
          items: [],
          totalAmount: Number(o.total_amount),
          status: o.status || 'New',
          createdAt: o.created_at,
        }))
      : null;

    return { categories, products, orders };
  } catch (err) {
    console.error('Error fetching direct from Supabase:', err);
    return { categories: null, products: null, orders: null };
  }
}
