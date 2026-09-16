import React, { useState, useEffect } from 'react';
import { Database, Server, CheckCircle2, Copy, Check, ArrowRight, ShieldCheck, AlertCircle, RefreshCw, Key, Link2, ExternalLink } from 'lucide-react';
import { api } from '../services/api';
import { getClientSupabaseConfig, saveClientSupabaseConfig, testDirectSupabaseConnection } from '../services/supabaseClient';

interface DatabaseTabProps {
  token: string | null;
  onDataChanged?: () => void;
  showToast: (type: 'success' | 'error', text: string) => void;
}

export const DatabaseTab: React.FC<DatabaseTabProps> = ({ token, onDataChanged, showToast }) => {
  const [status, setStatus] = useState<{
    supabaseConfigured: boolean;
    databaseProvider: string;
    totalProducts: number;
    totalCategories: number;
    totalOrders: number;
    supabaseUrl: string;
    schemaFile: string;
  } | null>(null);

  const [loading, setLoading] = useState(false);
  const [syncing, setSyncing] = useState(false);
  const [copiedSql, setCopiedSql] = useState(false);
  const [copiedEnv, setCopiedEnv] = useState(false);
  const [diagnostics, setDiagnostics] = useState<{
    configured: boolean;
    connected: boolean;
    url: string;
    hasKey: boolean;
    keyType: string;
    categoriesTableOk: boolean;
    productsTableOk: boolean;
    ordersTableOk: boolean;
    storageOk: boolean;
    error?: string;
    details?: string;
  } | null>(null);
  const [testingDiagnostics, setTestingDiagnostics] = useState(false);

  // Direct Supabase Settings inputs
  const [supabaseUrlInput, setSupabaseUrlInput] = useState('');
  const [supabaseKeyInput, setSupabaseKeyInput] = useState('');
  const [isSavingConfig, setIsSavingConfig] = useState(false);

  useEffect(() => {
    loadStatus();
    const config = getClientSupabaseConfig();
    setSupabaseUrlInput(config.url || 'https://cprgtuyfytwfhigofvsj.supabase.co');
    setSupabaseKeyInput(config.key || '');
  }, [token]);

  const loadStatus = async () => {
    setLoading(true);
    try {
      const res = await api.getDatabaseStatus(token || undefined);
      setStatus(res);
    } catch (err: any) {
      console.error('Failed to get database status:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSaveDirectSupabase = async () => {
    if (!supabaseUrlInput.trim()) {
      showToast('error', 'Please enter your Supabase Project URL');
      return;
    }
    if (!supabaseKeyInput.trim()) {
      showToast('error', 'Please paste your Supabase API Key (service_role or anon)');
      return;
    }

    setIsSavingConfig(true);
    try {
      saveClientSupabaseConfig(supabaseUrlInput.trim(), supabaseKeyInput.trim());
      showToast('success', 'Supabase credentials saved in browser!');
      await handleTestConnection();
    } catch (err: any) {
      showToast('error', err.message || 'Failed to save configuration');
    } finally {
      setIsSavingConfig(false);
    }
  };

  const handleTestConnection = async () => {
    setTestingDiagnostics(true);
    try {
      const diag = await api.testDatabaseConnection(token || undefined);
      setDiagnostics(diag);
      if (diag.connected) {
        showToast('success', 'Supabase connected successfully and all tables are ready!');
      } else {
        showToast('error', diag.error || 'Connection check failed.');
      }
      await loadStatus();
    } catch (err: any) {
      showToast('error', err.message || 'Diagnostic test failed.');
    } finally {
      setTestingDiagnostics(false);
    }
  };

  const handleSyncToSupabase = async () => {
    const config = getClientSupabaseConfig();
    if (!status?.supabaseConfigured && !config.key) {
      showToast('error', 'Please paste your Supabase Key in the Direct Connection box below and click Save.');
      return;
    }

    setSyncing(true);
    try {
      const res = await api.syncToSupabase(token || undefined);
      showToast('success', res.message || 'All categories, products, and orders synced to Supabase!');
      await loadStatus();
      if (onDataChanged) onDataChanged();
    } catch (err: any) {
      showToast('error', err.message || 'Failed to sync to Supabase');
    } finally {
      setSyncing(false);
    }
  };

  const sqlScript = `-- 1. CATEGORIES TABLE
CREATE TABLE IF NOT EXISTS public.categories (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  description TEXT,
  image TEXT,
  display_order INT DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- 2. PRODUCTS TABLE
CREATE TABLE IF NOT EXISTS public.products (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  category_id TEXT REFERENCES public.categories(id) ON DELETE SET NULL,
  price NUMERIC NOT NULL,
  original_price NUMERIC,
  description TEXT,
  features JSONB DEFAULT '[]'::jsonb,
  dimensions TEXT,
  material TEXT,
  images JSONB DEFAULT '[]'::jsonb,
  image_labels JSONB DEFAULT '[]'::jsonb,
  in_stock BOOLEAN DEFAULT TRUE,
  is_featured BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- 3. ORDERS TABLE
CREATE TABLE IF NOT EXISTS public.orders (
  id TEXT PRIMARY KEY,
  order_number TEXT NOT NULL UNIQUE,
  customer_name TEXT NOT NULL,
  phone TEXT NOT NULL,
  whatsapp_number TEXT,
  address TEXT NOT NULL,
  city TEXT NOT NULL,
  notes TEXT,
  total_amount NUMERIC NOT NULL,
  status TEXT DEFAULT 'New' NOT NULL,
  created_at TIMESTAMPTZ DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- 4. ORDER ITEMS TABLE
CREATE TABLE IF NOT EXISTS public.order_items (
  id TEXT PRIMARY KEY,
  order_id TEXT NOT NULL REFERENCES public.orders(id) ON DELETE CASCADE,
  product_id TEXT,
  product_name TEXT NOT NULL,
  price NUMERIC NOT NULL,
  quantity INT DEFAULT 1 NOT NULL,
  image TEXT
);

-- 5. ENABLE ROW LEVEL SECURITY & POLICIES
ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.order_items ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public can view categories" ON public.categories FOR SELECT USING (true);
CREATE POLICY "Public can view products" ON public.products FOR SELECT USING (true);
CREATE POLICY "Public can create orders" ON public.orders FOR INSERT WITH CHECK (true);
CREATE POLICY "Public can view own order" ON public.orders FOR SELECT USING (true);
CREATE POLICY "Public can insert order items" ON public.order_items FOR INSERT WITH CHECK (true);
CREATE POLICY "Public can view order items" ON public.order_items FOR SELECT USING (true);

-- Full access for service role
CREATE POLICY "Service role full categories" ON public.categories FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Service role full products" ON public.products FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Service role full orders" ON public.orders FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Service role full order items" ON public.order_items FOR ALL USING (true) WITH CHECK (true);

-- 6. STORAGE BUCKET FOR PRODUCT IMAGES
INSERT INTO storage.buckets (id, name, public)
VALUES ('product-images', 'product-images', true)
ON CONFLICT (id) DO UPDATE SET public = true;

CREATE POLICY "Public Access to Product Images" ON storage.objects FOR SELECT USING (bucket_id = 'product-images');
CREATE POLICY "Allow Uploads to Product Images" ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'product-images');`;

  const copySql = () => {
    navigator.clipboard.writeText(sqlScript);
    setCopiedSql(true);
    showToast('success', 'Supabase SQL script copied to clipboard!');
    setTimeout(() => setCopiedSql(false), 3000);
  };

  const copyEnv = () => {
    const envText = `SUPABASE_URL="https://your-project.supabase.co"\nSUPABASE_ANON_KEY="your-anon-key"\nSUPABASE_SERVICE_ROLE_KEY="your-service-role-key"`;
    navigator.clipboard.writeText(envText);
    setCopiedEnv(true);
    showToast('success', 'Environment variables copied to clipboard!');
    setTimeout(() => setCopiedEnv(false), 3000);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold font-serif-luxury text-[#231B15]">
            Database & Cloud Persistence
          </h2>
          <p className="text-xs text-[#82756A] mt-0.5">
            Manage your Supabase PostgreSQL database, storage bucket, and data synchronization.
          </p>
        </div>

        <div className="flex items-center gap-2 self-start sm:self-auto">
          <button
            onClick={handleTestConnection}
            disabled={testingDiagnostics}
            className="px-3.5 py-2 rounded-xl bg-[#6E4D2E] text-white hover:bg-[#583B20] text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer shadow-xs disabled:opacity-50"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${testingDiagnostics ? 'animate-spin' : ''}`} />
            <span>{testingDiagnostics ? 'Testing...' : 'Test Connection'}</span>
          </button>

          <button
            onClick={loadStatus}
            disabled={loading}
            className="px-3.5 py-2 rounded-xl bg-white border border-[#E8E1D7] text-[#5C5046] hover:text-[#231B15] text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
            <span>Refresh</span>
          </button>
        </div>
      </div>

      {/* Diagnostics Alert Box (if run) */}
      {diagnostics && (
        <div
          className={`p-4 rounded-2xl border transition-all ${
            diagnostics.connected
              ? 'bg-emerald-50 border-emerald-200 text-emerald-900'
              : 'bg-amber-50 border-amber-200 text-amber-900'
          }`}
        >
          <div className="flex items-start gap-3">
            {diagnostics.connected ? (
              <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
            ) : (
              <AlertCircle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
            )}
            <div className="flex-1 space-y-2">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1">
                <h4 className="font-bold text-sm">
                  {diagnostics.connected
                    ? 'Supabase Connection Verified'
                    : 'Supabase Connection Check'}
                </h4>
                <span className="text-[11px] font-mono px-2 py-0.5 rounded bg-black/5 self-start sm:self-auto">
                  Key Type: {diagnostics.keyType}
                </span>
              </div>

              {diagnostics.error && (
                <p className="text-xs bg-red-100/80 text-red-900 p-2.5 rounded-xl border border-red-200 font-mono">
                  {diagnostics.error}
                </p>
              )}

              {diagnostics.details && (
                <p className="text-xs text-emerald-800 font-medium">
                  {diagnostics.details}
                </p>
              )}

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-1">
                <div className="bg-white/80 p-2 rounded-xl text-center border border-black/5">
                  <span className="text-[10px] text-gray-500 block">Categories Table</span>
                  <span className={`text-xs font-bold ${diagnostics.categoriesTableOk ? 'text-emerald-700' : 'text-red-600'}`}>
                    {diagnostics.categoriesTableOk ? 'Ready' : 'Missing'}
                  </span>
                </div>
                <div className="bg-white/80 p-2 rounded-xl text-center border border-black/5">
                  <span className="text-[10px] text-gray-500 block">Products Table</span>
                  <span className={`text-xs font-bold ${diagnostics.productsTableOk ? 'text-emerald-700' : 'text-red-600'}`}>
                    {diagnostics.productsTableOk ? 'Ready' : 'Missing'}
                  </span>
                </div>
                <div className="bg-white/80 p-2 rounded-xl text-center border border-black/5">
                  <span className="text-[10px] text-gray-500 block">Orders Table</span>
                  <span className={`text-xs font-bold ${diagnostics.ordersTableOk ? 'text-emerald-700' : 'text-red-600'}`}>
                    {diagnostics.ordersTableOk ? 'Ready' : 'Missing'}
                  </span>
                </div>
                <div className="bg-white/80 p-2 rounded-xl text-center border border-black/5">
                  <span className="text-[10px] text-gray-500 block">Cloud Storage</span>
                  <span className={`text-xs font-bold ${diagnostics.storageOk ? 'text-emerald-700' : 'text-amber-600'}`}>
                    {diagnostics.storageOk ? 'Active' : 'Not setup'}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Connection Status Card */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Status Indicator */}
        <div className="bg-white rounded-2xl border border-[#E8E1D7] p-5 shadow-2xs space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-[#82756A] uppercase tracking-wider">
              Backend Database
            </span>
            {status?.supabaseConfigured ? (
              <span className="inline-flex items-center gap-1 bg-emerald-100 text-emerald-800 text-[10px] font-bold px-2 py-0.5 rounded-full">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-600 animate-pulse" />
                Connected
              </span>
            ) : (
              <span className="inline-flex items-center gap-1 bg-amber-100 text-amber-800 text-[10px] font-bold px-2 py-0.5 rounded-full">
                <span className="w-1.5 h-1.5 rounded-full bg-amber-600" />
                Local Storage
              </span>
            )}
          </div>

          <div>
            <h3 className="text-lg font-bold text-[#231B15] flex items-center gap-2">
              <Database className="w-5 h-5 text-[#6E4D2E]" />
              <span>{status?.databaseProvider || 'Checking...'}</span>
            </h3>
            <p className="text-xs text-[#82756A] mt-1 font-mono break-all">
              {status?.supabaseUrl || 'Local server file system'}
            </p>
          </div>

          <div className="pt-2 border-t border-[#F5EFE6] text-xs text-[#5C5046]">
            {status?.supabaseConfigured ? (
              <span className="text-emerald-700 flex items-center gap-1">
                <CheckCircle2 className="w-3.5 h-3.5 shrink-0" />
                Live PostgreSQL database active with RLS.
              </span>
            ) : (
              <span className="text-amber-700 flex items-center gap-1">
                <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                Ready to connect to Supabase anytime.
              </span>
            )}
          </div>
        </div>

        {/* Storage Status */}
        <div className="bg-white rounded-2xl border border-[#E8E1D7] p-5 shadow-2xs space-y-3">
          <span className="text-[11px] font-bold text-[#82756A] uppercase tracking-wider">
            Image Storage
          </span>
          <div>
            <h3 className="text-lg font-bold text-[#231B15] flex items-center gap-2">
              <Server className="w-5 h-5 text-[#6E4D2E]" />
              <span>{status?.supabaseConfigured ? 'Supabase CDN Bucket' : 'Local Disk Storage'}</span>
            </h3>
            <p className="text-xs text-[#82756A] mt-1">
              {status?.supabaseConfigured
                ? 'Bucket: product-images (Public CDN)'
                : 'Uploads saved to public/uploads/'}
            </p>
          </div>
          <div className="pt-2 border-t border-[#F5EFE6] text-xs text-[#5C5046]">
            Up to 5 images per product with cover labels.
          </div>
        </div>

        {/* Synced Records Count */}
        <div className="bg-white rounded-2xl border border-[#E8E1D7] p-5 shadow-2xs space-y-3">
          <span className="text-[11px] font-bold text-[#82756A] uppercase tracking-wider">
            Current Inventory
          </span>
          <div className="grid grid-cols-3 gap-2 text-center pt-1">
            <div className="p-2 bg-[#FAF7F2] rounded-xl border border-[#E8E1D7]">
              <span className="text-lg font-bold text-[#231B15] block">
                {status?.totalProducts ?? 0}
              </span>
              <span className="text-[10px] text-[#82756A]">Furniture</span>
            </div>
            <div className="p-2 bg-[#FAF7F2] rounded-xl border border-[#E8E1D7]">
              <span className="text-lg font-bold text-[#231B15] block">
                {status?.totalCategories ?? 0}
              </span>
              <span className="text-[10px] text-[#82756A]">Categories</span>
            </div>
            <div className="p-2 bg-[#FAF7F2] rounded-xl border border-[#E8E1D7]">
              <span className="text-lg font-bold text-[#231B15] block">
                {status?.totalOrders ?? 0}
              </span>
              <span className="text-[10px] text-[#82756A]">Orders</span>
            </div>
          </div>
          <div className="pt-1 text-center">
            <button
              onClick={handleSyncToSupabase}
              disabled={syncing || !status?.supabaseConfigured}
              className={`w-full py-2 px-3 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                status?.supabaseConfigured
                  ? 'bg-[#6E4D2E] text-white hover:bg-[#583B20] shadow-xs'
                  : 'bg-gray-100 text-gray-400 cursor-not-allowed'
              }`}
            >
              {syncing ? (
                <>
                  <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  <span>Syncing to Supabase...</span>
                </>
              ) : (
                <>
                  <RefreshCw className="w-3.5 h-3.5" />
                  <span>Sync All Items to Supabase</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Direct Supabase Key & Instant Connect Box */}
      <div className="bg-white rounded-2xl border border-[#E8E1D7] p-6 shadow-2xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-[#FAF7F2] border border-[#E8E1D7] flex items-center justify-center text-[#6E4D2E]">
              <Key className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-base font-bold text-[#231B15]">
                Direct Supabase Connection (Instant Browser Sync)
              </h3>
              <p className="text-xs text-[#82756A]">
                Paste your Supabase credentials here to connect immediately from your browser without restarting servers.
              </p>
            </div>
          </div>

          <a
            href="https://supabase.com/dashboard/project/cprgtuyfytwfhigofvsj/settings/api"
            target="_blank"
            rel="noreferrer"
            className="text-xs font-semibold text-[#6E4D2E] hover:text-[#583B20] inline-flex items-center gap-1 self-start sm:self-auto"
          >
            <span>Supabase API Keys</span>
            <ExternalLink className="w-3.5 h-3.5" />
          </a>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
          <div>
            <label className="block text-xs font-bold text-[#231B15] mb-1">
              Supabase Project URL
            </label>
            <div className="relative">
              <Link2 className="w-4 h-4 text-[#82756A] absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={supabaseUrlInput}
                onChange={(e) => setSupabaseUrlInput(e.target.value)}
                placeholder="https://your-project.supabase.co"
                className="w-full pl-9 pr-3.5 py-2.5 rounded-xl border border-[#E8E1D7] bg-[#FAF7F2] text-xs font-mono text-[#231B15] focus:outline-none focus:border-[#6E4D2E] focus:bg-white transition-colors"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-[#231B15] mb-1">
              Supabase API Key (<span className="text-[#6E4D2E]">service_role</span> or <span className="text-[#6E4D2E]">anon</span>)
            </label>
            <div className="relative">
              <Key className="w-4 h-4 text-[#82756A] absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="password"
                value={supabaseKeyInput}
                onChange={(e) => setSupabaseKeyInput(e.target.value)}
                placeholder="Paste your Supabase API key (eyJhbGci...)"
                className="w-full pl-9 pr-3.5 py-2.5 rounded-xl border border-[#E8E1D7] bg-[#FAF7F2] text-xs font-mono text-[#231B15] focus:outline-none focus:border-[#6E4D2E] focus:bg-white transition-colors"
              />
            </div>
          </div>
        </div>

        <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
          <p className="text-[11px] text-[#82756A]">
            💡 Tip: Use your <strong>service_role</strong> key for full sync privileges or <strong>anon</strong> public key.
          </p>

          <button
            onClick={handleSaveDirectSupabase}
            disabled={isSavingConfig}
            className="px-5 py-2.5 rounded-xl bg-[#6E4D2E] text-white hover:bg-[#583B20] text-xs font-bold flex items-center gap-2 transition-colors cursor-pointer shadow-xs disabled:opacity-50"
          >
            {isSavingConfig ? (
              <RefreshCw className="w-3.5 h-3.5 animate-spin" />
            ) : (
              <Check className="w-3.5 h-3.5" />
            )}
            <span>{isSavingConfig ? 'Saving & Testing...' : 'Save & Connect Supabase'}</span>
          </button>
        </div>
      </div>

      {/* Supabase 3-Step Quick Setup Guide */}
      <div className="bg-white rounded-2xl border border-[#E8E1D7] p-6 shadow-2xs space-y-4">
        <div className="flex items-center gap-2">
          <ShieldCheck className="w-5 h-5 text-[#6E4D2E]" />
          <h3 className="text-base font-bold text-[#231B15]">
            How to Connect Your Supabase Project (3 Easy Steps)
          </h3>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-2">
          {/* Step 1 */}
          <div className="p-4 bg-[#FAF7F2] rounded-xl border border-[#E8E1D7] space-y-2">
            <div className="w-6 h-6 rounded-full bg-[#6E4D2E] text-white text-xs font-bold flex items-center justify-center">
              1
            </div>
            <h4 className="text-xs font-bold text-[#231B15]">Create Supabase Project</h4>
            <p className="text-[11px] text-[#5C5046]">
              Sign up for free at <a href="https://supabase.com" target="_blank" rel="noreferrer" className="text-[#6E4D2E] underline font-bold">supabase.com</a> and create a new project.
            </p>
          </div>

          {/* Step 2 */}
          <div className="p-4 bg-[#FAF7F2] rounded-xl border border-[#E8E1D7] space-y-2">
            <div className="w-6 h-6 rounded-full bg-[#6E4D2E] text-white text-xs font-bold flex items-center justify-center">
              2
            </div>
            <h4 className="text-xs font-bold text-[#231B15]">Run the SQL Schema</h4>
            <p className="text-[11px] text-[#5C5046]">
              Go to <strong>SQL Editor</strong> in your Supabase dashboard, paste the SQL below and click <strong>Run</strong>.
            </p>
          </div>

          {/* Step 3 */}
          <div className="p-4 bg-[#FAF7F2] rounded-xl border border-[#E8E1D7] space-y-2">
            <div className="w-6 h-6 rounded-full bg-[#6E4D2E] text-white text-xs font-bold flex items-center justify-center">
              3
            </div>
            <h4 className="text-xs font-bold text-[#231B15]">Add Environment Keys</h4>
            <p className="text-[11px] text-[#5C5046]">
              Copy your Project URL & Service Role key into <code className="bg-white px-1 py-0.5 rounded border border-[#E8E1D7]">.env</code> or Secrets panel.
            </p>
          </div>
        </div>
      </div>

      {/* Supabase SQL Script Viewer */}
      <div className="bg-[#1D1713] text-white rounded-2xl p-6 shadow-md space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h3 className="text-base font-bold text-[#F5EFE6]">
              Supabase SQL Schema Script (PostgreSQL + RLS)
            </h3>
            <p className="text-xs text-[#B5A89B] mt-0.5">
              Copy and execute this script in your Supabase SQL Editor to set up tables, relationships, and policies.
            </p>
          </div>

          <button
            onClick={copySql}
            className="self-start sm:self-auto px-4 py-2 bg-[#6E4D2E] hover:bg-[#583B20] text-white rounded-xl text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer shrink-0"
          >
            {copiedSql ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
            <span>{copiedSql ? 'Copied to Clipboard!' : 'Copy SQL Script'}</span>
          </button>
        </div>

        <div className="relative">
          <pre className="bg-[#120E0B] p-4 rounded-xl text-[11px] font-mono text-[#D8CEBE] overflow-x-auto max-h-72 leading-relaxed border border-[#3B3128]">
            {sqlScript}
          </pre>
        </div>
      </div>
    </div>
  );
};
