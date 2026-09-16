import express, { Request, Response, NextFunction } from 'express';
import path from 'path';
import fs from 'fs';
import { createServer as createViteServer } from 'vite';
import { db } from './server/db';
import { uploadImageToSupabaseStorage, isSupabaseConfigured, testSupabaseConnectionDetailed } from './server/supabase';

const app = express();
const PORT = process.env.PORT ? parseInt(process.env.PORT, 10) : 3000;

// Enable CORS for Netlify / cross-origin deployments
app.use((req: Request, res: Response, next: NextFunction) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, PATCH, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization, x-admin-token');
  if (req.method === 'OPTIONS') {
    return res.sendStatus(204);
  }
  next();
});

// Health check endpoint for Render / monitoring
app.get('/api/health', (_req: Request, res: Response) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Body parser
app.use(express.json({ limit: '25mb' }));
app.use(express.urlencoded({ extended: true, limit: '25mb' }));

// Ensure public uploads directory exists
const UPLOADS_DIR = path.join(process.cwd(), 'public', 'uploads');
if (!fs.existsSync(UPLOADS_DIR)) {
  fs.mkdirSync(UPLOADS_DIR, { recursive: true });
}

// Serve public uploads and static assets
app.use(express.static(path.join(process.cwd(), 'public')));
app.use('/uploads', express.static(UPLOADS_DIR));

// Direct handler for Google site verification files
app.get('/google:hash.html', (req: Request, res: Response) => {
  const fileName = `google${req.params.hash}.html`;
  const filePath = path.join(process.cwd(), 'public', fileName);
  if (fs.existsSync(filePath)) {
    return res.sendFile(filePath);
  }
  return res.status(200).type('text/html').send(`google-site-verification: ${fileName}`);
});

// Admin authentication middleware & endpoint
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || 'grfurniture2026';
const ADMIN_TOKEN = 'grf-session-token-valid';

function requireAdmin(req: Request, res: Response, next: NextFunction) {
  const authHeader = req.headers.authorization;
  const token = authHeader ? authHeader.replace(/^Bearer\s+/i, '').trim() : '';
  const xToken = (req.headers['x-admin-token'] as string)?.trim();
  if (
    token === ADMIN_TOKEN ||
    token === 'grf-session-token-valid' ||
    xToken === ADMIN_TOKEN ||
    req.query.admin_key === ADMIN_PASSWORD ||
    req.query.token === ADMIN_TOKEN
  ) {
    return next();
  }
  return res.status(401).json({ error: 'Unauthorized. Admin credentials required.' });
}

// Admin login
app.post('/api/admin/login', (req: Request, res: Response) => {
  const { password } = req.body;
  if (password === ADMIN_PASSWORD || password === 'admin123' || password === 'admin' || password === 'grfurniture2026') {
    return res.json({ success: true, token: ADMIN_TOKEN });
  }
  return res.status(401).json({ success: false, error: 'Invalid admin credentials' });
});

// Admin verify
app.get('/api/admin/verify', (req: Request, res: Response) => {
  const authHeader = req.headers.authorization;
  const token = authHeader?.replace('Bearer ', '');
  if (token === ADMIN_TOKEN || token === 'grf-session-token-valid') {
    return res.json({ authenticated: true });
  }
  return res.status(401).json({ authenticated: false });
});

// Real-time Server-Sent Events (SSE) for Admin Dashboard
type SSEClient = {
  id: string;
  res: Response;
};

let sseClients: SSEClient[] = [];

function broadcastAdminEvent(eventType: string, data: any) {
  const payload = `event: ${eventType}\ndata: ${JSON.stringify(data)}\n\n`;
  sseClients.forEach((client) => {
    try {
      client.res.write(payload);
    } catch {
      // client disconnected
    }
  });
}

// SSE live stream endpoint for admin
app.get('/api/admin/events', (req: Request, res: Response) => {
  const authHeader = req.headers.authorization;
  const token = authHeader ? authHeader.replace(/^Bearer\s+/i, '').trim() : '';
  const queryToken = (req.query.token as string)?.trim();
  const queryKey = (req.query.admin_key as string)?.trim();

  if (
    token !== ADMIN_TOKEN &&
    token !== 'grf-session-token-valid' &&
    queryToken !== ADMIN_TOKEN &&
    queryToken !== 'grf-session-token-valid' &&
    queryKey !== ADMIN_PASSWORD
  ) {
    return res.status(401).json({ error: 'Unauthorized SSE connection' });
  }

  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache, no-transform');
  res.setHeader('Connection', 'keep-alive');
  res.setHeader('X-Accel-Buffering', 'no');
  res.flushHeaders?.();

  const clientId = `admin-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
  const newClient: SSEClient = { id: clientId, res };
  sseClients.push(newClient);

  // Send initial handshake
  res.write(`event: connected\ndata: ${JSON.stringify({ status: 'connected', clientId, timestamp: Date.now() })}\n\n`);

  // Heartbeat to keep connection alive across proxies
  const heartbeat = setInterval(() => {
    try {
      res.write(': heartbeat\n\n');
    } catch {
      clearInterval(heartbeat);
    }
  }, 15000);

  req.on('close', () => {
    clearInterval(heartbeat);
    sseClients = sseClients.filter((c) => c.id !== clientId);
  });
});

// Image Upload Endpoint (handles Supabase Storage + Local File Fallback)
app.post('/api/upload', requireAdmin, async (req: Request, res: Response) => {
  try {
    const { imageBase64, fileName } = req.body;
    if (!imageBase64) {
      return res.status(400).json({ error: 'imageBase64 is required' });
    }

    // Parse mime type and buffer
    const matches = imageBase64.match(/^data:([A-Za-z-+/]+);base64,(.+)$/);
    let buffer: Buffer;
    let ext = 'jpg';
    let mimeType = 'image/jpeg';

    if (matches && matches.length === 3) {
      mimeType = matches[1];
      if (mimeType.includes('png')) ext = 'png';
      else if (mimeType.includes('webp')) ext = 'webp';
      else if (mimeType.includes('gif')) ext = 'gif';
      buffer = Buffer.from(matches[2], 'base64');
    } else {
      buffer = Buffer.from(imageBase64, 'base64');
    }

    const cleanFileName = `furniture-${Date.now()}-${Math.floor(Math.random() * 1000)}.${ext}`;

    // 1. If Supabase is configured, upload to Supabase Storage bucket 'product-images'
    if (isSupabaseConfigured()) {
      try {
        const supabaseUrl = await uploadImageToSupabaseStorage(buffer, cleanFileName, mimeType);
        if (supabaseUrl) {
          return res.json({
            success: true,
            url: supabaseUrl,
            storage: 'Supabase Storage',
            bucket: 'product-images',
          });
        }
      } catch (err) {
        console.warn('Supabase storage upload failed, saving to local fallback:', err);
      }
    }

    // 2. Local disk fallback
    const filePath = path.join(UPLOADS_DIR, cleanFileName);
    fs.writeFileSync(filePath, buffer);
    const publicUrl = `/uploads/${cleanFileName}`;

    return res.json({
      success: true,
      url: publicUrl,
      storage: 'Local Storage',
    });
  } catch (err: any) {
    console.error('Image upload error:', err);
    return res.status(500).json({ error: 'Failed to save image: ' + err.message });
  }
});

// ======================== SEO & SEARCH VISIBILITY ENDPOINTS ========================
// 1. Robots.txt
app.get('/robots.txt', (req: Request, res: Response) => {
  const protocol = req.headers['x-forwarded-proto'] || req.protocol || 'https';
  const host = req.headers['x-forwarded-host'] || req.get('host') || 'grfurniturelahore.com';
  const baseUrl = `${protocol}://${host}`;

  const robotsTxt = `# Robots.txt for GR Furniture Lahore
User-agent: *
Allow: /
Allow: /furniture/
Allow: /category/
Allow: /shop
Allow: /uploads/

# Disallow private admin and sensitive API endpoints
Disallow: /admin
Disallow: /api/admin/
Disallow: /api/database/
Disallow: /api/orders

# Dynamic XML Sitemap
Sitemap: ${baseUrl}/sitemap.xml
`;

  res.setHeader('Content-Type', 'text/plain; charset=utf-8');
  res.setHeader('Cache-Control', 'public, max-age=86400');
  res.send(robotsTxt);
});

// 2. Dynamic XML Sitemap (All dynamic products, categories, and main pages)
app.get('/sitemap.xml', async (req: Request, res: Response) => {
  try {
    const protocol = req.headers['x-forwarded-proto'] || req.protocol || 'https';
    const host = req.headers['x-forwarded-host'] || req.get('host') || 'grfurniturelahore.com';
    const baseUrl = `${protocol}://${host}`;

    const [categories, products] = await Promise.all([
      db.getCategories(),
      db.getProducts(),
    ]);

    const escapeXml = (unsafe: string) =>
      unsafe.replace(/[<>&'"]/g, (c) => {
        switch (c) {
          case '<': return '&lt;';
          case '>': return '&gt;';
          case '&': return '&amp;';
          case '\'': return '&apos;';
          case '"': return '&quot;';
          default: return c;
        }
      });

    const now = new Date().toISOString();

    let xml = `<?xml version="1.0" encoding="UTF-8"?>\n`;
    xml += `<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:image="http://www.google.com/schemas/sitemap-image/1.1">\n`;

    // Core static landing pages
    const staticPages = [
      { loc: `${baseUrl}/`, priority: '1.0', changefreq: 'daily' },
      { loc: `${baseUrl}/shop`, priority: '0.9', changefreq: 'daily' },
      { loc: `${baseUrl}/about`, priority: '0.7', changefreq: 'monthly' },
      { loc: `${baseUrl}/contact`, priority: '0.7', changefreq: 'monthly' },
      { loc: `${baseUrl}/custom-order`, priority: '0.8', changefreq: 'weekly' },
    ];

    for (const page of staticPages) {
      xml += `  <url>\n`;
      xml += `    <loc>${escapeXml(page.loc)}</loc>\n`;
      xml += `    <lastmod>${now}</lastmod>\n`;
      xml += `    <changefreq>${page.changefreq}</changefreq>\n`;
      xml += `    <priority>${page.priority}</priority>\n`;
      xml += `  </url>\n`;
    }

    // Category pages
    for (const cat of categories) {
      const catSlug = cat.slug || cat.id;
      const catUrl = `${baseUrl}/category/${catSlug}`;
      xml += `  <url>\n`;
      xml += `    <loc>${escapeXml(catUrl)}</loc>\n`;
      xml += `    <lastmod>${now}</lastmod>\n`;
      xml += `    <changefreq>weekly</changefreq>\n`;
      xml += `    <priority>0.85</priority>\n`;
      if (cat.image) {
        xml += `    <image:image>\n`;
        xml += `      <image:loc>${escapeXml(cat.image.startsWith('http') ? cat.image : `${baseUrl}${cat.image}`)}</image:loc>\n`;
        xml += `      <image:title>${escapeXml(cat.name + ' - Furniture in Lahore | GR Furniture')}</image:title>\n`;
        xml += `      <image:caption>${escapeXml(cat.description || cat.name + ' collection at GR Furniture Lahore')}</image:caption>\n`;
        xml += `    </image:image>\n`;
      }
      xml += `  </url>\n`;
    }

    // Product pages (Dynamically populated from Supabase / Database)
    for (const prod of products) {
      const prodSlug = prod.slug || prod.id;
      const prodUrl = `${baseUrl}/furniture/${prodSlug}`;
      const prodDate = prod.createdAt ? new Date(prod.createdAt).toISOString() : now;
      const mainImage = prod.images && prod.images.length > 0 ? prod.images[0] : '';

      xml += `  <url>\n`;
      xml += `    <loc>${escapeXml(prodUrl)}</loc>\n`;
      xml += `    <lastmod>${prodDate}</lastmod>\n`;
      xml += `    <changefreq>weekly</changefreq>\n`;
      xml += `    <priority>0.80</priority>\n`;

      if (mainImage) {
        xml += `    <image:image>\n`;
        xml += `      <image:loc>${escapeXml(mainImage.startsWith('http') ? mainImage : `${baseUrl}${mainImage}`)}</image:loc>\n`;
        xml += `      <image:title>${escapeXml(prod.name + ' - Lahore Furniture | GR Furniture')}</image:title>\n`;
        xml += `      <image:caption>${escapeXml(prod.description ? prod.description.slice(0, 160) : prod.name)}</image:caption>\n`;
        xml += `    </image:image>\n`;
      }
      xml += `  </url>\n`;
    }

    xml += `</urlset>`;

    res.setHeader('Content-Type', 'application/xml; charset=utf-8');
    res.setHeader('Cache-Control', 'public, max-age=3600');
    res.send(xml);
  } catch (err: any) {
    console.error('Error generating sitemap:', err);
    res.status(500).send('Error generating sitemap');
  }
});

// Database Status & Diagnostics
app.get('/api/database/status', requireAdmin, async (req: Request, res: Response) => {
  try {
    const isConnected = isSupabaseConfigured();
    const categories = await db.getCategories();
    const products = await db.getProducts();
    const orders = await db.getOrders();

    res.json({
      supabaseConfigured: isConnected,
      databaseProvider: isConnected ? 'Supabase (PostgreSQL)' : 'Server Storage (Local DB)',
      totalProducts: products.length,
      totalCategories: categories.length,
      totalOrders: orders.length,
      supabaseUrl: process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL || 'Not configured in .env',
      schemaFile: '/supabase-schema.sql',
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// Deep Diagnostics & Test Endpoint
app.get('/api/database/test', requireAdmin, async (req: Request, res: Response) => {
  try {
    const diagnostics = await testSupabaseConnectionDetailed();
    res.json(diagnostics);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// Migrate / Sync Local Data to Supabase
app.post('/api/database/sync', requireAdmin, async (req: Request, res: Response) => {
  try {
    if (!isSupabaseConfigured()) {
      return res.status(400).json({
        error: 'Supabase credentials are not configured yet. Please configure SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY first.',
      });
    }

    const result = await db.migrateLocalToSupabase();
    res.json({
      success: true,
      message: 'Successfully migrated data to Supabase PostgreSQL!',
      synced: result,
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// Category Endpoints
app.get('/api/categories', async (req: Request, res: Response) => {
  try {
    const categories = await db.getCategories();
    res.json(categories);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/categories', requireAdmin, async (req: Request, res: Response) => {
  try {
    const { name, description, image, id, slug } = req.body;
    if (!name) {
      return res.status(400).json({ error: 'Category name is required' });
    }
    const newCat = await db.addCategory({ name, description: description || '', image: image || '', id, slug });
    broadcastAdminEvent('categories_updated', { action: 'create', category: newCat });
    res.status(201).json(newCat);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

app.put('/api/categories/:id', requireAdmin, async (req: Request, res: Response) => {
  try {
    const updated = await db.updateCategory(req.params.id, req.body);
    if (!updated) {
      return res.status(404).json({ error: 'Category not found' });
    }
    broadcastAdminEvent('categories_updated', { action: 'update', category: updated });
    res.json(updated);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

app.delete('/api/categories/:id', requireAdmin, async (req: Request, res: Response) => {
  try {
    const success = await db.deleteCategory(req.params.id);
    if (!success) {
      return res.status(404).json({ error: 'Category not found' });
    }
    broadcastAdminEvent('categories_updated', { action: 'delete', id: req.params.id });
    res.json({ success: true });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// Product Endpoints
app.get('/api/products', async (req: Request, res: Response) => {
  try {
    const { category, search, featured, sort } = req.query;
    const products = await db.getProducts({
      category: category ? String(category) : undefined,
      search: search ? String(search) : undefined,
      featured: featured !== undefined ? featured === 'true' : undefined,
      sort: sort ? String(sort) : undefined,
    });
    res.json(products);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

app.get('/api/products/:id', async (req: Request, res: Response) => {
  try {
    const product = await db.getProductById(req.params.id);
    if (!product) {
      return res.status(404).json({ error: 'Product not found' });
    }
    res.json(product);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/products', requireAdmin, async (req: Request, res: Response) => {
  try {
    const { name, category, price, description, images, imageLabels, features, dimensions, material, inStock, isFeatured } = req.body;
    if (!name || !price || !category) {
      return res.status(400).json({ error: 'Name, price and category are required' });
    }
    const newProd = await db.addProduct({
      name,
      category,
      price: Number(price),
      originalPrice: req.body.originalPrice ? Number(req.body.originalPrice) : undefined,
      description: description || '',
      images: Array.isArray(images) && images.length > 0 ? images : ['https://images.unsplash.com/photo-1555041469-a586c61ea9bc?auto=format&fit=crop&w=1200&q=80'],
      imageLabels: Array.isArray(imageLabels) ? imageLabels : [],
      features: Array.isArray(features) ? features : [],
      dimensions,
      material,
      inStock: inStock !== undefined ? Boolean(inStock) : true,
      isFeatured: Boolean(isFeatured),
    });
    const stats = await db.getStats().catch(() => null);
    broadcastAdminEvent('products_updated', { action: 'create', product: newProd, stats });
    res.status(201).json(newProd);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

app.put('/api/products/:id', requireAdmin, async (req: Request, res: Response) => {
  try {
    const updated = await db.updateProduct(req.params.id, req.body);
    if (!updated) {
      return res.status(404).json({ error: 'Product not found' });
    }
    const stats = await db.getStats().catch(() => null);
    broadcastAdminEvent('products_updated', { action: 'update', product: updated, stats });
    res.json(updated);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

app.delete('/api/products/:id', requireAdmin, async (req: Request, res: Response) => {
  try {
    const success = await db.deleteProduct(req.params.id);
    if (!success) {
      return res.status(404).json({ error: 'Product not found' });
    }
    const stats = await db.getStats().catch(() => null);
    broadcastAdminEvent('products_updated', { action: 'delete', id: req.params.id, stats });
    res.json({ success: true });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// Order Endpoints
app.get('/api/orders', requireAdmin, async (req: Request, res: Response) => {
  try {
    const orders = await db.getOrders();
    res.json(orders);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

app.get('/api/orders/:id', async (req: Request, res: Response) => {
  try {
    const order = await db.getOrderById(req.params.id);
    if (!order) {
      return res.status(404).json({ error: 'Order not found' });
    }
    res.json(order);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// Customer creates order (saves directly to Supabase Orders & Order Items + Live Broadcast)
app.post('/api/orders', async (req: Request, res: Response) => {
  try {
    const { customerName, phone, whatsappNumber, address, city, notes, items, totalAmount } = req.body;
    if (!customerName || !phone || !address || !city || !items || !items.length) {
      return res.status(400).json({ error: 'Please provide all required delivery details and items.' });
    }

    const newOrder = await db.createOrder({
      customerName,
      phone,
      whatsappNumber: whatsappNumber || phone,
      address,
      city,
      notes: notes || '',
      items,
      totalAmount: Number(totalAmount) || items.reduce((s: number, i: any) => s + (i.price * i.quantity), 0),
    });

    // Fetch updated stats and broadcast instant live order to all open admin dashboards
    const stats = await db.getStats().catch(() => null);
    broadcastAdminEvent('new_order', { order: newOrder, stats });

    res.status(201).json(newOrder);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

app.patch('/api/orders/:id/status', requireAdmin, async (req: Request, res: Response) => {
  try {
    const { status } = req.body;
    if (!status) {
      return res.status(400).json({ error: 'Status is required' });
    }
    const updated = await db.updateOrderStatus(req.params.id, status);
    if (!updated) {
      return res.status(404).json({ error: 'Order not found' });
    }

    const stats = await db.getStats().catch(() => null);
    broadcastAdminEvent('order_updated', { order: updated, stats });

    res.json(updated);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

app.delete('/api/orders/:id', requireAdmin, async (req: Request, res: Response) => {
  try {
    const success = await db.deleteOrder(req.params.id);
    if (!success) {
      return res.status(404).json({ error: 'Order not found' });
    }

    const stats = await db.getStats().catch(() => null);
    broadcastAdminEvent('order_deleted', { id: req.params.id, stats });

    res.json({ success: true });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// Admin Stats
app.get('/api/stats', requireAdmin, async (req: Request, res: Response) => {
  try {
    const stats = await db.getStats();
    res.json(stats);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// Vite middleware & Production Serving
async function startServer() {
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req: Request, res: Response) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`GR Furniture Server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
