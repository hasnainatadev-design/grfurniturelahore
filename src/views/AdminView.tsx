import React, { useState, useEffect, useMemo, useRef } from 'react';
import {
  ShieldCheck,
  Package,
  FolderTree,
  ShoppingBag,
  TrendingUp,
  Plus,
  Edit2,
  Trash2,
  CheckCircle,
  Clock,
  Truck,
  AlertCircle,
  X,
  Upload,
  MessageCircle,
  Search,
  ExternalLink,
  LogOut,
  RefreshCw,
  Database,
  Bell,
  Volume2,
  VolumeX,
  Radio,
  Image as ImageIcon,
  Sparkles,
} from 'lucide-react';
import { WhatsAppIcon } from '../components/WhatsAppIcon';
import { DatabaseTab } from '../components/DatabaseTab';
import { api } from '../services/api';
import { Product, Category, Order, OrderStatus, AdminStats } from '../types';
import { formatPKR } from '../context/CartContext';
import { getClientSupabase } from '../services/supabaseClient';

interface AdminViewProps {
  onBackToStore: () => void;
  onDataChanged?: () => void;
}

export const AdminView: React.FC<AdminViewProps> = ({ onBackToStore, onDataChanged }) => {
  const [token, setToken] = useState<string | null>(() => localStorage.getItem('grf_admin_token'));
  const [passwordInput, setPasswordInput] = useState('');
  const [loginError, setLoginError] = useState<string | null>(null);

  // Active Tab
  const [activeTab, setActiveTab] = useState<'overview' | 'products' | 'categories' | 'orders' | 'database'>('overview');

  // Data
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);

  // Real-time synchronization & sound alerts
  const [realTimeConnected, setRealTimeConnected] = useState(false);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [soundTested, setSoundTested] = useState(false);

  // Modals
  const [productModalOpen, setProductModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);

  const [categoryModalOpen, setCategoryModalOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);

  const [selectedOrderDetails, setSelectedOrderDetails] = useState<Order | null>(null);

  // Delete Confirmation Modal State
  const [deleteTarget, setDeleteTarget] = useState<{
    type: 'product' | 'category' | 'order';
    id: string;
    name: string;
    extraInfo?: string;
  } | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // Toast Notification State
  const [toastMessage, setToastMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const showToast = (type: 'success' | 'error', text: string) => {
    setToastMessage({ type, text });
    setTimeout(() => {
      setToastMessage((cur) => (cur?.text === text ? null : cur));
    }, 6000);
  };

  // Filters
  const [orderStatusFilter, setOrderStatusFilter] = useState<string>('all');
  const [orderSearchQuery, setOrderSearchQuery] = useState('');
  const [productSearchQuery, setProductSearchQuery] = useState('');
  const [productCategoryFilter, setProductCategoryFilter] = useState('all');

  // Audio Context & Order Tracking references
  const audioCtxRef = useRef<AudioContext | null>(null);
  const knownOrderIdsRef = useRef<Set<string>>(new Set());
  const isInitialLoadRef = useRef<boolean>(true);

  const getAudioContext = () => {
    try {
      if (!audioCtxRef.current) {
        const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
        if (AudioCtx) {
          audioCtxRef.current = new AudioCtx();
        }
      }
      if (audioCtxRef.current && audioCtxRef.current.state === 'suspended') {
        audioCtxRef.current.resume().catch(() => {});
      }
    } catch {}
    return audioCtxRef.current;
  };

  // Unlock browser audio context on any click/touch
  useEffect(() => {
    const unlockAudio = () => {
      getAudioContext();
    };
    window.addEventListener('click', unlockAudio, { passive: true });
    window.addEventListener('touchstart', unlockAudio, { passive: true });
    window.addEventListener('keydown', unlockAudio, { passive: true });
    return () => {
      window.removeEventListener('click', unlockAudio);
      window.removeEventListener('touchstart', unlockAudio);
      window.removeEventListener('keydown', unlockAudio);
    };
  }, []);

  // Audio notification chime & voice announcement for real-time orders
  const playOrderChime = (customerName?: string, totalAmount?: number) => {
    if (!soundEnabled) return;

    // 1. Play clear, loud multi-tone chime (D5 -> A5 -> D6 -> F#6)
    try {
      const ctx = getAudioContext();
      if (ctx) {
        if (ctx.state === 'suspended') {
          ctx.resume();
        }

        const notes = [
          { freq: 587.33, start: 0, duration: 0.16, type: 'sine' as OscillatorType, vol: 0.35 },
          { freq: 880.0, start: 0.12, duration: 0.18, type: 'triangle' as OscillatorType, vol: 0.45 },
          { freq: 1174.66, start: 0.25, duration: 0.22, type: 'sine' as OscillatorType, vol: 0.45 },
          { freq: 1479.98, start: 0.40, duration: 0.45, type: 'sine' as OscillatorType, vol: 0.5 },
        ];

        notes.forEach((note) => {
          const osc = ctx.createOscillator();
          const gain = ctx.createGain();
          osc.type = note.type;
          osc.frequency.setValueAtTime(note.freq, ctx.currentTime + note.start);

          gain.gain.setValueAtTime(0.001, ctx.currentTime + note.start);
          gain.gain.linearRampToValueAtTime(note.vol, ctx.currentTime + note.start + 0.03);
          gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + note.start + note.duration);

          osc.connect(gain);
          gain.connect(ctx.destination);

          osc.start(ctx.currentTime + note.start);
          osc.stop(ctx.currentTime + note.start + note.duration + 0.05);
        });
      }
    } catch (err) {
      console.warn('Audio chime playback error:', err);
    }

    // 2. Voice announcement via SpeechSynthesis
    try {
      if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
        window.speechSynthesis.cancel();
        const text = customerName
          ? `New order received from ${customerName}.`
          : 'New order received on GR Furniture.';
        const utterance = new SpeechSynthesisUtterance(text);
        utterance.rate = 1.05;
        utterance.pitch = 1.1;
        utterance.volume = 1;
        window.speechSynthesis.speak(utterance);
      }
    } catch (err) {
      console.warn('Voice announcement error:', err);
    }
  };

  // Test sound function for admin
  const handleTestSound = () => {
    getAudioContext();
    playOrderChime('Ahmed Khan (Test)', 125000);
    setSoundTested(true);
    showToast('success', '🔊 Order chime & voice announcement tested successfully!');
    setTimeout(() => setSoundTested(false), 3000);
  };

  // Handle incoming order list (checks for new orders to trigger chime)
  const processIncomingOrders = (incomingOrders: Order[]) => {
    if (isInitialLoadRef.current) {
      knownOrderIdsRef.current = new Set(incomingOrders.map((o) => o.id));
      isInitialLoadRef.current = false;
      setOrders(incomingOrders);
      return;
    }

    // Detect newly arrived orders
    const newOrders = incomingOrders.filter((o) => !knownOrderIdsRef.current.has(o.id));
    if (newOrders.length > 0) {
      const latestOrder = newOrders[0];
      playOrderChime(latestOrder.customerName, latestOrder.totalAmount);
      showToast(
        'success',
        `🔔 New Order Received: #${latestOrder.orderNumber} - ${latestOrder.customerName} (${formatPKR(latestOrder.totalAmount)})`
      );
      newOrders.forEach((o) => knownOrderIdsRef.current.add(o.id));
      if (onDataChanged) onDataChanged();
    }

    setOrders(incomingOrders);
  };

  // Check login on load
  useEffect(() => {
    if (token) {
      loadAllData(token);
    }
  }, [token, refreshKey]);

  // Real-Time SSE + Supabase Realtime + Fast Fallback Polling
  useEffect(() => {
    if (!token) return;

    // 1. SSE Stream
    const sseUrl = `/api/admin/events?token=${encodeURIComponent(token)}`;
    const eventSource = new EventSource(sseUrl);

    eventSource.addEventListener('connected', () => {
      setRealTimeConnected(true);
    });

    eventSource.addEventListener('new_order', (e: MessageEvent) => {
      try {
        const data = JSON.parse(e.data);
        if (data.order) {
          const ord = data.order;
          if (!knownOrderIdsRef.current.has(ord.id)) {
            knownOrderIdsRef.current.add(ord.id);
            setOrders((prev) => [ord, ...prev.filter((o) => o.id !== ord.id)]);
            playOrderChime(ord.customerName, ord.totalAmount);
            showToast(
              'success',
              `🔔 New Order Placed: #${ord.orderNumber} - ${ord.customerName} (${formatPKR(ord.totalAmount)})`
            );
          }
        }
        if (data.stats) setStats(data.stats);
        if (onDataChanged) onDataChanged();
      } catch (err) {
        console.error('Error handling new_order event:', err);
      }
    });

    eventSource.addEventListener('order_updated', (e: MessageEvent) => {
      try {
        const data = JSON.parse(e.data);
        if (data.order) {
          setOrders((prev) => prev.map((o) => (o.id === data.order.id ? data.order : o)));
        }
        if (data.stats) setStats(data.stats);
      } catch (err) {
        console.error('Error handling order_updated event:', err);
      }
    });

    eventSource.addEventListener('order_deleted', (e: MessageEvent) => {
      try {
        const data = JSON.parse(e.data);
        if (data.id) {
          setOrders((prev) => prev.filter((o) => o.id !== data.id));
        }
        if (data.stats) setStats(data.stats);
      } catch (err) {
        console.error('Error handling order_deleted event:', err);
      }
    });

    eventSource.addEventListener('products_updated', async (e: MessageEvent) => {
      try {
        const productsRes = await api.getProducts();
        setProducts(productsRes);
        const data = JSON.parse(e.data || '{}');
        if (data.stats) setStats(data.stats);
        if (onDataChanged) onDataChanged();
      } catch {}
    });

    eventSource.addEventListener('categories_updated', async () => {
      try {
        const categoriesRes = await api.getCategories();
        setCategories(categoriesRes);
        if (onDataChanged) onDataChanged();
      } catch {}
    });

    eventSource.onopen = () => {
      setRealTimeConnected(true);
    };

    eventSource.onerror = () => {
      // Backend SSE not available in static/serverless mode, fallback polling handles updates
      setRealTimeConnected(false);
    };

    // 2. Direct Supabase Realtime Channel
    const sb = getClientSupabase();
    let supabaseChannel: any = null;
    if (sb) {
      try {
        supabaseChannel = sb
          .channel('public:orders_realtime')
          .on(
            'postgres_changes',
            { event: 'INSERT', schema: 'public', table: 'orders' },
            (payload: any) => {
              const raw = payload.new;
              if (raw) {
                const newId = String(raw.id || raw.order_number);
                if (!knownOrderIdsRef.current.has(newId)) {
                  knownOrderIdsRef.current.add(newId);
                  const newOrd: Order = {
                    id: newId,
                    orderNumber: raw.order_number || newId,
                    customerName: raw.customer_name || 'Customer',
                    phone: raw.phone || '',
                    whatsappNumber: raw.whatsapp_number || raw.phone || '',
                    address: raw.address || '',
                    city: raw.city || 'Lahore',
                    notes: raw.notes || '',
                    items: Array.isArray(raw.items) ? raw.items : [],
                    totalAmount: Number(raw.total_amount) || 0,
                    status: raw.status || 'New',
                    createdAt: raw.created_at || new Date().toISOString(),
                  };
                  setOrders((prev) => [newOrd, ...prev.filter((o) => o.id !== newId)]);
                  playOrderChime(newOrd.customerName, newOrd.totalAmount);
                  showToast(
                    'success',
                    `🔔 New Order Placed: #${newOrd.orderNumber} - ${newOrd.customerName} (${formatPKR(newOrd.totalAmount)})`
                  );
                  api.getStats(token).then(setStats).catch(() => {});
                  if (onDataChanged) onDataChanged();
                }
              }
            }
          )
          .subscribe();
      } catch {}
    }

    // 3. Fast responsive polling fallback (every 6 seconds)
    const fallbackSync = setInterval(() => {
      api.getOrders(token)
        .then((res) => {
          processIncomingOrders(res);
        })
        .catch(() => {});

      api.getStats(token)
        .then((res) => {
          setStats(res);
        })
        .catch(() => {});
    }, 6000);

    return () => {
      eventSource.close();
      if (supabaseChannel) {
        try {
          sb?.removeChannel(supabaseChannel);
        } catch {}
      }
      clearInterval(fallbackSync);
    };
  }, [token, soundEnabled]);

  const loadAllData = async (adminToken: string) => {
    setLoading(true);
    try {
      const [statsRes, productsRes, categoriesRes, ordersRes] = await Promise.all([
        api.getStats(adminToken),
        api.getProducts(),
        api.getCategories(),
        api.getOrders(adminToken),
      ]);
      setStats(statsRes);
      setProducts(productsRes);
      setCategories(categoriesRes);
      processIncomingOrders(ordersRes);
    } catch (err: any) {
      console.error('Failed to load admin data:', err);
      if (err.message?.includes('Unauthorized')) {
        setToken(null);
        localStorage.removeItem('grf_admin_token');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoginError(null);
    try {
      const res = await api.adminLogin(passwordInput.trim());
      if (res.success && res.token) {
        setToken(res.token);
        localStorage.setItem('grf_admin_token', res.token);
        setPasswordInput('');
        loadAllData(res.token);
      } else {
        setLoginError('Invalid credentials. Please try again.');
      }
    } catch {
      setLoginError('Could not connect to server.');
    }
  };

  const handleLogout = () => {
    setToken(null);
    localStorage.removeItem('grf_admin_token');
  };

  // Quick order status updater
  const handleUpdateOrderStatus = async (orderId: string, newStatus: OrderStatus) => {
    const activeToken = token || localStorage.getItem('grf_admin_token') || 'grf-session-token-valid';
    try {
      await api.updateOrderStatus(orderId, newStatus, activeToken);
      setOrders((prev) => prev.map((o) => (o.id === orderId ? { ...o, status: newStatus } : o)));
      if (selectedOrderDetails && selectedOrderDetails.id === orderId) {
        setSelectedOrderDetails((prev) => (prev ? { ...prev, status: newStatus } : null));
      }
      showToast('success', `Order status updated to ${newStatus}`);
      setRefreshKey((k) => k + 1);
      onDataChanged?.();
    } catch (e: any) {
      showToast('error', e.message || 'Failed to update status');
    }
  };

  // WhatsApp customer regarding order
  const handleWhatsAppCustomer = (order: Order) => {
    const text = `Hello ${order.customerName}, this is GR Furniture Lahore regarding your order #${order.orderNumber} for total ${formatPKR(
      order.totalAmount
    )}. We would like to confirm your delivery details.`;
    const num = order.whatsappNumber || order.phone;
    const cleanNum = num.replace(/[^0-9]/g, '');
    const finalNum = cleanNum.startsWith('0') ? '92' + cleanNum.substring(1) : cleanNum;
    window.open(`https://wa.me/${finalNum}?text=${encodeURIComponent(text)}`, '_blank');
  };

  // Trigger delete dialog for Product
  const handleDeleteProduct = (id: string, name: string, price?: number) => {
    setDeleteTarget({
      type: 'product',
      id,
      name,
      extraInfo: price !== undefined ? formatPKR(price) : undefined,
    });
  };

  // Trigger delete dialog for Category
  const handleDeleteCategory = (id: string, name: string, itemCount?: number) => {
    setDeleteTarget({
      type: 'category',
      id,
      name,
      extraInfo: itemCount !== undefined ? `${itemCount} items linked` : undefined,
    });
  };

  // Trigger delete dialog for Order
  const handleDeleteOrder = (id: string, orderNumber: string, customerName?: string) => {
    setDeleteTarget({
      type: 'order',
      id,
      name: orderNumber,
      extraInfo: customerName ? `Customer: ${customerName}` : undefined,
    });
  };

  // Execute confirmed deletion
  const handleConfirmDelete = async () => {
    if (!deleteTarget) return;
    setIsDeleting(true);
    const activeToken = token || localStorage.getItem('grf_admin_token') || 'grf-session-token-valid';

    try {
      if (deleteTarget.type === 'product') {
        await api.deleteProduct(deleteTarget.id, activeToken);
        // Instant optimistic removal from UI
        setProducts((prev) => prev.filter((p) => p.id !== deleteTarget.id && p.slug !== deleteTarget.id));
        showToast('success', `Product "${deleteTarget.name}" deleted successfully.`);
      } else if (deleteTarget.type === 'category') {
        await api.deleteCategory(deleteTarget.id, activeToken);
        // Instant optimistic removal from UI
        setCategories((prev) => prev.filter((c) => c.id !== deleteTarget.id && c.slug !== deleteTarget.id));
        showToast('success', `Category "${deleteTarget.name}" deleted successfully.`);
      } else if (deleteTarget.type === 'order') {
        await api.deleteOrder(deleteTarget.id, activeToken);
        // Instant optimistic removal from UI
        setOrders((prev) => prev.filter((o) => o.id !== deleteTarget.id && o.orderNumber !== deleteTarget.id));
        if (
          selectedOrderDetails &&
          (selectedOrderDetails.id === deleteTarget.id || selectedOrderDetails.orderNumber === deleteTarget.id)
        ) {
          setSelectedOrderDetails(null);
        }
        showToast('success', `Order #${deleteTarget.name} deleted successfully.`);
      }

      setDeleteTarget(null);
      setRefreshKey((k) => k + 1);
      onDataChanged?.();
    } catch (err: any) {
      console.error('Delete error:', err);
      showToast('error', err.message || 'Failed to delete item. Please try again.');
    } finally {
      setIsDeleting(false);
    }
  };

  // -------------------------------------------------------------
  // LOGIN SCREEN
  // -------------------------------------------------------------
  if (!token) {
    return (
      <div className="min-h-[80vh] flex items-center justify-center p-4 bg-[#FAF7F2]">
        <div className="max-w-md w-full bg-white rounded-2xl border border-[#E8E1D7] p-6 sm:p-8 shadow-lg">
          <div className="text-center space-y-3 mb-6">
            <div className="w-16 h-16 rounded-2xl overflow-hidden border border-[#D5C9B8] bg-[#1E1712] mx-auto shadow-md">
              <img
                src="/logo.png"
                alt="GR Furniture Lahore - Official Logo"
                className="w-full h-full object-cover"
                referrerPolicy="no-referrer"
              />
            </div>
            <div>
              <h2 className="text-xl font-bold font-serif-luxury text-[#231B15]">
                GR Furniture Admin Login
              </h2>
              <p className="text-xs text-[#82756A] mt-1">
                Sign in to manage furniture, categories, and customer orders.
              </p>
            </div>
          </div>

          <form onSubmit={handleLogin} className="space-y-4">
            {loginError && (
              <div className="p-3 bg-red-50 border border-red-200 text-red-700 text-xs rounded-xl">
                {loginError}
              </div>
            )}

            <div>
              <label className="block text-xs font-semibold text-[#4A3E36] mb-1">
                Admin Password
              </label>
              <input
                type="password"
                required
                value={passwordInput}
                onChange={(e) => setPasswordInput(e.target.value)}
                placeholder="Enter admin password"
                className="w-full px-3.5 py-2.5 bg-[#FAF7F2] border border-[#E8E1D7] rounded-xl text-sm focus:outline-hidden focus:border-[#6E4D2E] text-[#231B15]"
              />
            </div>

            <button
              type="submit"
              className="w-full py-3 px-4 bg-[#6E4D2E] text-white rounded-xl font-bold text-sm hover:bg-[#583B20] transition-colors shadow-xs cursor-pointer"
            >
              Sign In
            </button>
          </form>

          <div className="mt-6 pt-4 border-t border-[#E8E1D7] text-center">
            <button
              onClick={onBackToStore}
              className="text-xs text-[#82756A] hover:text-[#231B15] cursor-pointer"
            >
              ← Back to Furniture
            </button>
          </div>
        </div>
      </div>
    );
  }

  // -------------------------------------------------------------
  // DASHBOARD MAIN
  // -------------------------------------------------------------
  const filteredOrders = orders.filter((o) => {
    const matchesStatus = orderStatusFilter === 'all' || o.status === orderStatusFilter;
    const matchesSearch =
      !orderSearchQuery ||
      o.orderNumber.toLowerCase().includes(orderSearchQuery.toLowerCase()) ||
      o.customerName.toLowerCase().includes(orderSearchQuery.toLowerCase()) ||
      o.phone.includes(orderSearchQuery) ||
      o.city.toLowerCase().includes(orderSearchQuery.toLowerCase());
    return matchesStatus && matchesSearch;
  });

  const displayedProducts = useMemo(() => {
    let list = [...products].sort((a, b) => {
      const timeA = a.createdAt ? new Date(a.createdAt).getTime() : 0;
      const timeB = b.createdAt ? new Date(b.createdAt).getTime() : 0;
      if (timeA !== timeB) return timeB - timeA;
      return (b.id || '').localeCompare(a.id || '');
    });

    if (productCategoryFilter !== 'all') {
      list = list.filter((p) => p.category === productCategoryFilter);
    }

    if (productSearchQuery.trim()) {
      const q = productSearchQuery.toLowerCase();
      list = list.filter(
        (p) =>
          p.name.toLowerCase().includes(q) ||
          p.description?.toLowerCase().includes(q) ||
          p.category.toLowerCase().includes(q) ||
          p.material?.toLowerCase().includes(q)
      );
    }

    return list;
  }, [products, productCategoryFilter, productSearchQuery]);

  return (
    <div className="bg-[#FAF7F2] min-h-screen pb-20">
      {/* Top Admin Bar */}
      <div className="bg-[#231B15] text-[#ECE5DC] border-b border-[#3B3128]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg overflow-hidden border border-[#4A3D31] bg-[#16100B] shrink-0">
              <img
                src="/logo.png"
                alt="GR Furniture Admin"
                className="w-full h-full object-cover"
                referrerPolicy="no-referrer"
              />
            </div>
            <div className="flex items-center gap-2">
              <span className="font-serif-luxury text-lg font-bold text-white tracking-tight">
                GR FURNITURE
              </span>
              <span className="bg-[#6E4D2E] text-[#F5EFE6] text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-md">
                Admin
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2 sm:gap-3">
            {/* Sound & Voice Alert Controls */}
            <div className="flex items-center bg-white/5 border border-white/10 rounded-xl p-1 gap-1">
              <button
                type="button"
                onClick={() => {
                  const next = !soundEnabled;
                  setSoundEnabled(next);
                  if (next) {
                    getAudioContext();
                    showToast('success', '🔊 Sound alerts & voice announcements turned ON');
                  } else {
                    showToast('error', '🔇 Sound alerts turned OFF');
                  }
                }}
                className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-semibold transition-colors cursor-pointer ${
                  soundEnabled
                    ? 'bg-[#936B3B] text-white shadow-xs'
                    : 'text-[#9B9185] hover:text-white hover:bg-white/10'
                }`}
                title={soundEnabled ? 'Order sound alert is ON (Click to mute)' : 'Order sound alert is OFF (Click to turn on)'}
              >
                {soundEnabled ? <Volume2 className="w-3.5 h-3.5" /> : <VolumeX className="w-3.5 h-3.5" />}
                <span className="hidden md:inline">{soundEnabled ? 'Sound Alert: ON' : 'Muted'}</span>
              </button>

              <button
                type="button"
                onClick={handleTestSound}
                className="px-2 py-1.5 text-[11px] font-bold text-amber-300 hover:text-amber-200 hover:bg-white/10 rounded-lg transition-colors cursor-pointer flex items-center gap-1"
                title="Click to test new order beep and voice announcement"
              >
                <Sparkles className="w-3 h-3 text-amber-300" />
                <span className="hidden sm:inline">{soundTested ? 'Playing...' : 'Test Voice'}</span>
              </button>
            </div>

            <button
              onClick={() => setRefreshKey((k) => k + 1)}
              className="p-2 text-[#D8CEBE] hover:text-white rounded-lg hover:bg-white/10 transition-colors cursor-pointer"
              title="Manual Refresh"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            </button>

            <button
              onClick={onBackToStore}
              className="hidden sm:inline-flex items-center gap-1 text-xs text-[#D8CEBE] hover:text-white py-1.5 px-3 rounded-lg border border-[#4A3E36] transition-colors cursor-pointer"
            >
              <span>View Store</span>
              <ExternalLink className="w-3 h-3" />
            </button>

            <button
              onClick={handleLogout}
              className="flex items-center gap-1.5 text-xs text-red-300 hover:text-red-200 py-1.5 px-2.5 rounded-lg hover:bg-red-950/40 transition-colors cursor-pointer"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Logout</span>
            </button>
          </div>
        </div>
      </div>

      {/* Tabs Navigation */}
      <div className="bg-white border-b border-[#E8E1D7] sticky top-0 z-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center gap-2 sm:gap-6 overflow-x-auto scrollbar-none py-2">
            <button
              onClick={() => setActiveTab('overview')}
              className={`flex items-center gap-2 py-2.5 px-3 rounded-xl text-xs sm:text-sm font-semibold transition-all shrink-0 cursor-pointer ${
                activeTab === 'overview'
                  ? 'bg-[#6E4D2E] text-white shadow-xs'
                  : 'text-[#5C5046] hover:bg-[#FAF7F2]'
              }`}
            >
              <TrendingUp className="w-4 h-4" />
              <span>Overview</span>
            </button>

            <button
              onClick={() => setActiveTab('orders')}
              className={`flex items-center gap-2 py-2.5 px-3 rounded-xl text-xs sm:text-sm font-semibold transition-all shrink-0 relative cursor-pointer ${
                activeTab === 'orders'
                  ? 'bg-[#6E4D2E] text-white shadow-xs'
                  : 'text-[#5C5046] hover:bg-[#FAF7F2]'
              }`}
            >
              <ShoppingBag className="w-4 h-4" />
              <span>Orders</span>
              {stats && stats.newOrders > 0 && (
                <span className="bg-red-600 text-white text-[10px] font-bold px-1.5 py-0.2 rounded-full ml-1">
                  {stats.newOrders} new
                </span>
              )}
            </button>

            <button
              onClick={() => setActiveTab('products')}
              className={`flex items-center gap-2 py-2.5 px-3 rounded-xl text-xs sm:text-sm font-semibold transition-all shrink-0 cursor-pointer ${
                activeTab === 'products'
                  ? 'bg-[#6E4D2E] text-white shadow-xs'
                  : 'text-[#5C5046] hover:bg-[#FAF7F2]'
              }`}
            >
              <Package className="w-4 h-4" />
              <span>Furniture ({products.length})</span>
            </button>

            <button
              onClick={() => setActiveTab('categories')}
              className={`flex items-center gap-2 py-2.5 px-3 rounded-xl text-xs sm:text-sm font-semibold transition-all shrink-0 cursor-pointer ${
                activeTab === 'categories'
                  ? 'bg-[#6E4D2E] text-white shadow-xs'
                  : 'text-[#5C5046] hover:bg-[#FAF7F2]'
              }`}
            >
              <FolderTree className="w-4 h-4" />
              <span>Categories ({categories.length})</span>
            </button>

            <button
              onClick={() => setActiveTab('database')}
              className={`flex items-center gap-2 py-2.5 px-3 rounded-xl text-xs sm:text-sm font-semibold transition-all shrink-0 cursor-pointer ${
                activeTab === 'database'
                  ? 'bg-[#6E4D2E] text-white shadow-xs'
                  : 'text-[#5C5046] hover:bg-[#FAF7F2]'
              }`}
            >
              <Database className="w-4 h-4" />
              <span>Database & Cloud</span>
            </button>
          </div>
        </div>
      </div>

      {/* Main Container */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
        {/* ========================================================= */}
        {/* 1. OVERVIEW TAB */}
        {/* ========================================================= */}
        {activeTab === 'overview' && (
          <div className="space-y-6 sm:space-y-8">
            {/* Stats Row */}
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 sm:gap-4">
              <div className="bg-white p-4 rounded-2xl border border-[#EAE4DC] shadow-2xs">
                <span className="text-[11px] font-bold text-[#786F66] uppercase tracking-wider block">
                  Total Orders
                </span>
                <span className="text-2xl sm:text-3xl font-bold text-[#201D1A] mt-1 block">
                  {stats?.totalOrders ?? 0}
                </span>
              </div>

              <div className="bg-white p-4 rounded-2xl border border-red-200 bg-red-50/30 shadow-2xs">
                <span className="text-[11px] font-bold text-red-800 uppercase tracking-wider block">
                  New Orders
                </span>
                <span className="text-2xl sm:text-3xl font-bold text-red-600 mt-1 block">
                  {stats?.newOrders ?? 0}
                </span>
              </div>

              <div className="bg-white p-4 rounded-2xl border border-amber-200 bg-amber-50/30 shadow-2xs">
                <span className="text-[11px] font-bold text-amber-800 uppercase tracking-wider block">
                  Pending Orders
                </span>
                <span className="text-2xl sm:text-3xl font-bold text-amber-600 mt-1 block">
                  {stats?.pendingOrders ?? 0}
                </span>
              </div>

              <div className="bg-white p-4 rounded-2xl border border-blue-200 bg-blue-50/30 shadow-2xs">
                <span className="text-[11px] font-bold text-blue-800 uppercase tracking-wider block">
                  Confirmed Orders
                </span>
                <span className="text-2xl sm:text-3xl font-bold text-blue-600 mt-1 block">
                  {stats?.confirmedOrders ?? 0}
                </span>
              </div>

              <div className="bg-white p-4 rounded-2xl border border-emerald-200 bg-emerald-50/30 shadow-2xs">
                <span className="text-[11px] font-bold text-emerald-800 uppercase tracking-wider block">
                  Completed
                </span>
                <span className="text-2xl sm:text-3xl font-bold text-emerald-600 mt-1 block">
                  {stats?.completedOrders ?? 0}
                </span>
              </div>

              <div className="bg-white p-4 rounded-2xl border border-[#EAE4DC] shadow-2xs">
                <span className="text-[11px] font-bold text-[#786F66] uppercase tracking-wider block">
                  Total Furniture
                </span>
                <span className="text-2xl sm:text-3xl font-bold text-[#201D1A] mt-1 block">
                  {stats?.totalProducts ?? 0}
                </span>
              </div>
            </div>

            {/* Revenue Card */}
            <div className="bg-gradient-to-r from-[#24201D] to-[#3B342F] rounded-2xl p-6 text-white shadow-md flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div>
                <span className="text-xs text-amber-300 font-bold uppercase tracking-wider block">
                  Total Sales
                </span>
                <h3 className="text-2xl sm:text-3xl font-bold mt-1">
                  {formatPKR(stats?.totalRevenue ?? 0)}
                </h3>
                <p className="text-xs text-[#D8CEBF] mt-1">
                  Total price of all active customer orders.
                </p>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => setActiveTab('orders')}
                  className="px-4 py-2.5 bg-[#936B3B] hover:bg-[#7D5A2F] text-white rounded-xl text-xs font-bold transition-colors cursor-pointer"
                >
                  View Orders
                </button>
                <button
                  onClick={() => {
                    setEditingProduct(null);
                    setProductModalOpen(true);
                  }}
                  className="px-4 py-2.5 bg-white/10 hover:bg-white/20 text-white border border-white/20 rounded-xl text-xs font-bold transition-colors flex items-center gap-1 cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Add Furniture</span>
                </button>
              </div>
            </div>

            {/* Recent Orders List */}
            <div className="bg-white rounded-2xl border border-[#EAE4DC] p-5 sm:p-6 shadow-2xs">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className="text-base font-bold text-[#201D1A]">Recent Orders</h3>
                  <p className="text-xs text-[#786F66]">
                    Latest orders from customers.
                  </p>
                </div>
                <button
                  onClick={() => setActiveTab('orders')}
                  className="text-xs font-bold text-[#936B3B] hover:underline cursor-pointer"
                >
                  View All Orders →
                </button>
              </div>

              <div className="divide-y divide-[#F0EBE3] overflow-x-auto">
                {orders.slice(0, 5).map((ord) => (
                  <div key={ord.id} className="py-3.5 flex items-center justify-between gap-4 min-w-[500px]">
                    <div className="space-y-0.5">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-xs sm:text-sm text-[#201D1A]">
                          #{ord.orderNumber}
                        </span>
                        <StatusBadge status={ord.status} />
                      </div>
                      <p className="text-xs text-[#5E554C]">
                        {ord.customerName} • {ord.phone} ({ord.city})
                      </p>
                    </div>

                    <div className="text-right space-y-0.5">
                      <span className="font-bold text-xs sm:text-sm text-[#936B3B]">
                        {formatPKR(ord.totalAmount)}
                      </span>
                      <p className="text-[11px] text-[#786F66]">
                        {ord.items.length} item{ord.items.length > 1 ? 's' : ''}
                      </p>
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => setSelectedOrderDetails(ord)}
                        className="text-xs px-3 py-1.5 rounded-lg bg-[#FAF8F5] border border-[#DDD5CA] hover:bg-[#F0EBE3] font-semibold text-[#201D1A]"
                      >
                        View Details
                      </button>
                      <button
                        onClick={() => handleWhatsAppCustomer(ord)}
                        className="text-xs p-1.5 rounded-lg bg-[#25D366]/15 text-[#1E7E34] hover:bg-[#25D366]/25 border border-[#25D366]/30"
                        title="Chat with customer on WhatsApp"
                      >
                        <WhatsAppIcon className="w-4 h-4 text-[#25D366]" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* ========================================================= */}
        {/* 2. ORDERS MANAGEMENT TAB */}
        {/* ========================================================= */}
        {activeTab === 'orders' && (
          <div className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <h2 className="text-xl font-bold font-serif-luxury text-[#201D1A]">
                  Orders ({orders.length})
                </h2>
                <p className="text-xs text-[#786F66]">
                  Check order details, change status, or message customers on WhatsApp.
                </p>
              </div>

              {/* Status Filter & Search */}
              <div className="flex flex-wrap items-center gap-2">
                <div className="relative">
                  <Search className="w-3.5 h-3.5 text-[#786F66] absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    value={orderSearchQuery}
                    onChange={(e) => setOrderSearchQuery(e.target.value)}
                    placeholder="Search order number, name, or city..."
                    className="pl-8 pr-3 py-1.5 text-xs bg-white border border-[#DDD5CA] rounded-xl text-[#201D1A] w-48 sm:w-60 focus:outline-hidden focus:border-[#936B3B]"
                  />
                </div>

                <select
                  value={orderStatusFilter}
                  onChange={(e) => setOrderStatusFilter(e.target.value)}
                  className="bg-white border border-[#DDD5CA] rounded-xl px-3 py-1.5 text-xs text-[#201D1A] font-medium focus:outline-hidden"
                >
                  <option value="all">All Orders</option>
                  <option value="New">New</option>
                  <option value="Pending">Pending</option>
                  <option value="Confirmed">Confirmed</option>
                  <option value="Processing">Processing</option>
                  <option value="Out for Delivery">Out for Delivery</option>
                  <option value="Completed">Completed</option>
                  <option value="Cancelled">Cancelled</option>
                </select>
              </div>
            </div>

            {/* Orders Table */}
            <div className="bg-white rounded-2xl border border-[#EAE4DC] overflow-hidden shadow-2xs">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-[#FAF8F5] text-[#786F66] border-b border-[#EAE4DC] font-bold uppercase tracking-wider text-[10px]">
                    <tr>
                      <th className="p-3.5">Order Number & Date</th>
                      <th className="p-3.5">Customer</th>
                      <th className="p-3.5">Items</th>
                      <th className="p-3.5">Total</th>
                      <th className="p-3.5">Status</th>
                      <th className="p-3.5 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#F0EBE3]">
                    {filteredOrders.length === 0 ? (
                      <tr>
                        <td colSpan={6} className="p-8 text-center text-[#786F66]">
                          No orders found.
                        </td>
                      </tr>
                    ) : (
                      filteredOrders.map((ord) => (
                        <tr key={ord.id} className="hover:bg-[#FAF8F5]/80 transition-colors">
                          <td className="p-3.5">
                            <span className="font-bold text-[#201D1A] block">
                              #{ord.orderNumber}
                            </span>
                            <span className="text-[11px] text-[#786F66]">
                              {new Date(ord.createdAt).toLocaleDateString()}
                            </span>
                          </td>
                          <td className="p-3.5">
                            <span className="font-semibold text-[#201D1A] block">
                              {ord.customerName}
                            </span>
                            <span className="text-[11px] text-[#786F66]">
                              {ord.phone} • {ord.city}
                            </span>
                          </td>
                          <td className="p-3.5">
                            <span className="font-medium text-[#201D1A]">
                              {ord.items.map((i) => `${i.productName} (x${i.quantity})`).join(', ')}
                            </span>
                          </td>
                          <td className="p-3.5 font-bold text-[#936B3B]">
                            {formatPKR(ord.totalAmount)}
                          </td>
                          <td className="p-3.5">
                            <select
                              value={ord.status}
                              onChange={(e) =>
                                handleUpdateOrderStatus(ord.id, e.target.value as OrderStatus)
                              }
                              className="text-xs px-2.5 py-1 rounded-lg border font-semibold bg-white cursor-pointer"
                            >
                              <option value="New">New</option>
                              <option value="Pending">Pending</option>
                              <option value="Confirmed">Confirmed</option>
                              <option value="Processing">Processing</option>
                              <option value="Out for Delivery">Out for Delivery</option>
                              <option value="Completed">Completed</option>
                              <option value="Cancelled">Cancelled</option>
                            </select>
                          </td>
                          <td className="p-3.5 text-right space-x-1.5">
                            <button
                              onClick={() => setSelectedOrderDetails(ord)}
                              className="px-2.5 py-1 bg-[#FAF8F5] border border-[#DDD5CA] rounded-lg text-xs font-semibold hover:bg-[#F0EBE3] transition-colors cursor-pointer"
                            >
                              View
                            </button>
                            <button
                              onClick={() => handleWhatsAppCustomer(ord)}
                              className="px-2.5 py-1 bg-[#25D366]/15 text-[#1E7E34] border border-[#25D366]/30 rounded-lg text-xs font-bold hover:bg-[#25D366]/25 transition-colors cursor-pointer"
                              title="Message customer on WhatsApp"
                            >
                              WhatsApp
                            </button>
                            <button
                              onClick={() => handleDeleteOrder(ord.id, ord.orderNumber, ord.customerName)}
                              className="p-1 rounded-lg text-[#9B9185] hover:text-red-600 hover:bg-red-50 border border-transparent hover:border-red-200 transition-colors inline-flex items-center align-middle cursor-pointer"
                              title="Delete order"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* ========================================================= */}
        {/* 3. PRODUCTS MANAGEMENT TAB */}
        {/* ========================================================= */}
        {activeTab === 'products' && (
          <div className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <h2 className="text-xl font-bold font-serif-luxury text-[#201D1A]">
                  Furniture ({products.length})
                </h2>
                <p className="text-xs text-[#786F66]">
                  Latest created furniture appears at the top. Add, edit, or upload multiple photos.
                </p>
              </div>

              <button
                id="admin-add-product-btn"
                onClick={() => {
                  setEditingProduct(null);
                  setProductModalOpen(true);
                }}
                className="px-4 py-2.5 bg-[#936B3B] hover:bg-[#7D5A2F] text-white rounded-xl text-xs font-bold transition-colors flex items-center justify-center gap-1.5 shadow-sm cursor-pointer"
              >
                <Plus className="w-4 h-4" />
                <span>Add Furniture</span>
              </button>
            </div>

            {/* Filter & Search Bar */}
            <div className="flex flex-col sm:flex-row items-center gap-3 bg-white p-3.5 rounded-2xl border border-[#EAE4DC] shadow-2xs">
              <div className="relative flex-1 w-full">
                <Search className="w-4 h-4 text-[#9B9185] absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={productSearchQuery}
                  onChange={(e) => setProductSearchQuery(e.target.value)}
                  placeholder="Search furniture by name, material, or keyword..."
                  className="w-full pl-9 pr-4 py-2 bg-[#FAF8F5] border border-[#DDD5CA] rounded-xl text-xs text-[#201D1A] focus:outline-hidden focus:border-[#936B3B]"
                />
                {productSearchQuery && (
                  <button
                    onClick={() => setProductSearchQuery('')}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 text-xs font-bold"
                  >
                    Clear
                  </button>
                )}
              </div>

              <div className="flex items-center gap-2 w-full sm:w-auto">
                <select
                  value={productCategoryFilter}
                  onChange={(e) => setProductCategoryFilter(e.target.value)}
                  className="w-full sm:w-auto px-3 py-2 bg-[#FAF8F5] border border-[#DDD5CA] rounded-xl text-xs font-semibold text-[#201D1A] focus:outline-hidden focus:border-[#936B3B] cursor-pointer"
                >
                  <option value="all">All Categories ({products.length})</option>
                  {categories.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Products Grid */}
            {displayedProducts.length === 0 ? (
              <div className="bg-white rounded-2xl border border-[#EAE4DC] p-12 text-center space-y-3">
                <Package className="w-12 h-12 text-[#B8ADA1] mx-auto opacity-50" />
                <h4 className="font-bold text-[#201D1A] text-sm">No furniture items found</h4>
                <p className="text-xs text-[#786F66] max-w-sm mx-auto">
                  {productSearchQuery || productCategoryFilter !== 'all'
                    ? 'No products match your current search or category filter.'
                    : 'Click "Add Furniture" above to add your first luxury furniture piece.'}
                </p>
                {(productSearchQuery || productCategoryFilter !== 'all') && (
                  <button
                    onClick={() => {
                      setProductSearchQuery('');
                      setProductCategoryFilter('all');
                    }}
                    className="text-xs font-bold text-[#936B3B] hover:underline"
                  >
                    Reset Filters
                  </button>
                )}
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {displayedProducts.map((prod, idx) => (
                  <div
                    key={prod.id}
                    className="bg-white rounded-2xl border border-[#EAE4DC] p-4 shadow-2xs flex flex-col justify-between hover:border-[#936B3B]/40 transition-all"
                  >
                    <div className="space-y-3">
                      <div className="aspect-16/10 rounded-xl overflow-hidden bg-[#F4EFEA] relative">
                        <img
                          src={prod.images[0]}
                          alt={prod.name}
                          className="w-full h-full object-cover"
                        />
                        <div className="absolute top-2 left-2 flex flex-wrap gap-1">
                          <span className="text-[10px] bg-[#24201D] text-white px-2 py-0.5 rounded-md font-medium">
                            {prod.category}
                          </span>
                          {prod.isFeatured && (
                            <span className="text-[10px] bg-[#936B3B] text-white px-2 py-0.5 rounded-md font-bold">
                              Featured
                            </span>
                          )}
                          {idx === 0 && (
                            <span className="text-[10px] bg-emerald-700 text-white px-2 py-0.5 rounded-md font-bold">
                              Newest
                            </span>
                          )}
                        </div>

                        {prod.images.length > 1 && (
                          <div className="absolute bottom-2 right-2 bg-black/70 backdrop-blur-xs text-white text-[10px] font-bold px-2 py-0.5 rounded-md flex items-center gap-1">
                            <ImageIcon className="w-3 h-3" />
                            <span>{prod.images.length} photos</span>
                          </div>
                        )}
                      </div>

                      <div>
                        <h4 className="font-bold text-sm text-[#201D1A] line-clamp-1">{prod.name}</h4>
                        <p className="text-xs font-bold text-[#936B3B] mt-0.5">
                          {formatPKR(prod.price)}
                          {prod.originalPrice && (
                            <span className="text-[10px] text-[#9B9185] line-through ml-2 font-normal">
                              {formatPKR(prod.originalPrice)}
                            </span>
                          )}
                        </p>
                        <p className="text-xs text-[#5E554C] line-clamp-2 mt-1">
                          {prod.description}
                        </p>
                      </div>
                    </div>

                    <div className="pt-3 mt-3 border-t border-[#F0EBE3] flex items-center justify-between">
                      <span
                        className={`text-[11px] font-semibold ${
                          prod.inStock ? 'text-emerald-700' : 'text-amber-700'
                        }`}
                      >
                        {prod.inStock ? '● In Stock' : '○ Made to Order'}
                      </span>

                      <div className="flex items-center gap-1.5">
                        <button
                          onClick={() => {
                            setEditingProduct(prod);
                            setProductModalOpen(true);
                          }}
                          className="p-1.5 rounded-lg text-[#786F66] hover:text-[#201D1A] hover:bg-[#FAF8F5] border border-[#DDD5CA] cursor-pointer"
                          title="Edit product"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => handleDeleteProduct(prod.id, prod.name, prod.price)}
                          className="p-1.5 rounded-lg text-red-600 hover:bg-red-50 border border-red-200 transition-colors cursor-pointer"
                          title="Delete product"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* ========================================================= */}
        {/* 4. CATEGORIES MANAGEMENT TAB */}
        {/* ========================================================= */}
        {activeTab === 'categories' && (
          <div className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <h2 className="text-xl font-bold font-serif-luxury text-[#201D1A]">
                  Categories ({categories.length})
                </h2>
                <p className="text-xs text-[#786F66]">
                  Manage categories for beds, sofas, tables, and sets.
                </p>
              </div>

              <button
                onClick={() => {
                  setEditingCategory(null);
                  setCategoryModalOpen(true);
                }}
                className="px-4 py-2.5 bg-[#936B3B] hover:bg-[#7D5A2F] text-white rounded-xl text-xs font-bold transition-colors flex items-center justify-center gap-1.5 shadow-sm cursor-pointer"
              >
                <Plus className="w-4 h-4" />
                <span>Add Category</span>
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {categories.map((cat) => {
                const count = products.filter((p) => p.category === cat.id).length;
                return (
                  <div
                    key={cat.id}
                    className="bg-white rounded-2xl border border-[#EAE4DC] p-4 shadow-2xs flex gap-3.5"
                  >
                    <img
                      src={cat.image}
                      alt={cat.name}
                      className="w-20 h-20 rounded-xl object-cover bg-[#F4EFEA] shrink-0"
                    />
                    <div className="flex-1 flex flex-col justify-between">
                      <div>
                        <div className="flex items-start justify-between">
                          <h4 className="font-bold text-sm text-[#201D1A]">{cat.name}</h4>
                          <span className="text-[10px] bg-[#FAF8F5] border border-[#DDD5CA] px-2 py-0.5 rounded-full font-bold text-[#786F66]">
                            {count} items
                          </span>
                        </div>
                        <p className="text-xs text-[#786F66] line-clamp-2 mt-1">
                          {cat.description}
                        </p>
                      </div>

                      <div className="flex items-center justify-end gap-1.5 pt-2">
                        <button
                          onClick={() => {
                            setEditingCategory(cat);
                            setCategoryModalOpen(true);
                          }}
                          className="p-1 rounded-md text-[#786F66] hover:text-[#201D1A] cursor-pointer"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => handleDeleteCategory(cat.id, cat.name, count)}
                          className="p-1 rounded-md text-red-600 hover:bg-red-50 hover:text-red-700 transition-colors cursor-pointer"
                          title="Delete category"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* ========================================================= */}
        {/* 5. DATABASE & SUPABASE TAB */}
        {/* ========================================================= */}
        {activeTab === 'database' && (
          <DatabaseTab
            token={token}
            onDataChanged={() => setRefreshKey((k) => k + 1)}
            showToast={showToast}
          />
        )}
      </div>

      {/* ========================================================= */}
      {/* PRODUCT ADD / EDIT MODAL */}
      {/* ========================================================= */}
      {productModalOpen && (
        <ProductFormModal
          product={editingProduct}
          categories={categories}
          token={token}
          onClose={() => {
            setProductModalOpen(false);
            setEditingProduct(null);
          }}
          onSaved={() => {
            setProductModalOpen(false);
            setEditingProduct(null);
            setRefreshKey((k) => k + 1);
          }}
        />
      )}

      {/* ========================================================= */}
      {/* CATEGORY ADD / EDIT MODAL */}
      {/* ========================================================= */}
      {categoryModalOpen && (
        <CategoryFormModal
          category={editingCategory}
          token={token}
          onClose={() => {
            setCategoryModalOpen(false);
            setEditingCategory(null);
          }}
          onSaved={() => {
            setCategoryModalOpen(false);
            setEditingCategory(null);
            setRefreshKey((k) => k + 1);
          }}
        />
      )}

      {/* ========================================================= */}
      {/* ORDER DETAILS MODAL */}
      {/* ========================================================= */}
      {selectedOrderDetails && (
        <OrderDetailsModal
          order={selectedOrderDetails}
          onClose={() => setSelectedOrderDetails(null)}
          onUpdateStatus={handleUpdateOrderStatus}
          onWhatsAppCustomer={handleWhatsAppCustomer}
          onDeleteOrder={handleDeleteOrder}
        />
      )}

      {/* ========================================================= */}
      {/* DELETE CONFIRMATION MODAL (Replaces window.confirm) */}
      {/* ========================================================= */}
      {deleteTarget && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in">
          <div className="bg-white rounded-2xl max-w-sm w-full p-6 shadow-2xl border border-[#EAE4DC] space-y-4">
            <div className="w-12 h-12 rounded-full bg-red-100 text-red-600 flex items-center justify-center mx-auto">
              <Trash2 className="w-6 h-6" />
            </div>

            <div className="text-center space-y-1.5">
              <h3 className="text-base font-bold text-[#201D1A]">
                Delete {deleteTarget.type === 'product' ? 'Furniture' : deleteTarget.type === 'category' ? 'Category' : 'Order'}?
              </h3>
              <p className="text-xs text-[#786F66]">
                Are you sure you want to delete{' '}
                <strong className="text-[#201D1A]">"{deleteTarget.name}"</strong>?
              </p>
              {deleteTarget.extraInfo && (
                <p className="text-[11px] text-[#9B9185] bg-[#FAF8F5] py-1 px-2.5 rounded-lg inline-block">
                  {deleteTarget.extraInfo}
                </p>
              )}
              <p className="text-[11px] text-red-600 font-medium pt-1">
                This item will be permanently removed.
              </p>
            </div>

            <div className="grid grid-cols-2 gap-2.5 pt-2">
              <button
                type="button"
                onClick={() => !isDeleting && setDeleteTarget(null)}
                disabled={isDeleting}
                className="py-2.5 px-4 rounded-xl border border-[#DDD5CA] text-xs font-bold text-[#5E554C] hover:bg-[#FAF8F5] transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmDelete}
                disabled={isDeleting}
                className="py-2.5 px-4 rounded-xl bg-red-600 hover:bg-red-700 text-white text-xs font-bold transition-colors flex items-center justify-center gap-1.5 shadow-sm disabled:opacity-50 cursor-pointer"
              >
                {isDeleting ? (
                  <>
                    <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    <span>Deleting...</span>
                  </>
                ) : (
                  <>
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>Delete</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* FLOATING TOAST NOTIFICATION */}
      {/* ========================================================= */}
      {toastMessage && (
        <div
          className={`fixed bottom-6 right-6 z-50 px-4 py-3 rounded-xl shadow-2xl flex items-center gap-2.5 text-xs font-semibold animate-in fade-in slide-in-from-bottom-3 ${
            toastMessage.type === 'success'
              ? 'bg-[#193B2D] text-emerald-100 border border-emerald-700/60'
              : 'bg-[#401212] text-red-100 border border-red-700/60'
          }`}
        >
          {toastMessage.type === 'success' ? (
            <CheckCircle className="w-4 h-4 text-emerald-400 shrink-0" />
          ) : (
            <AlertCircle className="w-4 h-4 text-red-400 shrink-0" />
          )}
          <span>{toastMessage.text}</span>
          <button
            onClick={() => setToastMessage(null)}
            className="ml-2 text-white/60 hover:text-white transition-colors"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}
    </div>
  );
};

// =================================================================
// SUB-COMPONENTS FOR ADMIN
// =================================================================

function StatusBadge({ status }: { status: OrderStatus }) {
  switch (status) {
    case 'New':
      return <span className="bg-red-100 text-red-700 text-[10px] font-bold px-2 py-0.5 rounded-full">New</span>;
    case 'Pending':
      return <span className="bg-amber-100 text-amber-700 text-[10px] font-bold px-2 py-0.5 rounded-full">Pending</span>;
    case 'Confirmed':
      return <span className="bg-blue-100 text-blue-700 text-[10px] font-bold px-2 py-0.5 rounded-full">Confirmed</span>;
    case 'Processing':
      return <span className="bg-purple-100 text-purple-700 text-[10px] font-bold px-2 py-0.5 rounded-full">Processing</span>;
    case 'Out for Delivery':
      return <span className="bg-indigo-100 text-indigo-700 text-[10px] font-bold px-2 py-0.5 rounded-full">Out for Delivery</span>;
    case 'Completed':
      return <span className="bg-emerald-100 text-emerald-700 text-[10px] font-bold px-2 py-0.5 rounded-full">Completed</span>;
    case 'Cancelled':
      return <span className="bg-gray-100 text-gray-700 text-[10px] font-bold px-2 py-0.5 rounded-full">Cancelled</span>;
    default:
      return null;
  }
}

// -----------------------------------------------------------------
// ORDER DETAILS MODAL
// -----------------------------------------------------------------
function OrderDetailsModal({
  order,
  onClose,
  onUpdateStatus,
  onWhatsAppCustomer,
  onDeleteOrder,
}: {
  order: Order;
  onClose: () => void;
  onUpdateStatus: (id: string, status: OrderStatus) => void;
  onWhatsAppCustomer: (order: Order) => void;
  onDeleteOrder?: (id: string, orderNumber: string, customerName?: string) => void;
}) {
  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-black/50 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4">
      <div className="bg-white rounded-2xl max-w-lg w-full overflow-hidden shadow-2xl border border-[#EAE4DC] flex flex-col max-h-[92vh]">
        <div className="px-5 py-4 border-b border-[#EAE4DC] flex items-center justify-between bg-[#FAF8F5]">
          <div>
            <h3 className="text-base font-bold text-[#201D1A]">Order #{order.orderNumber}</h3>
            <span className="text-xs text-[#786F66]">
              Placed on {new Date(order.createdAt).toLocaleString()}
            </span>
          </div>
          <button onClick={onClose} className="p-1 rounded-md text-[#786F66] hover:text-[#201D1A]">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-5 overflow-y-auto space-y-4 text-xs">
          {/* Status updater */}
          <div className="p-3 bg-[#FAF8F5] rounded-xl border border-[#EAE4DC] flex items-center justify-between">
            <span className="font-bold text-[#463F38]">Order Status:</span>
            <select
              value={order.status}
              onChange={(e) => onUpdateStatus(order.id, e.target.value as OrderStatus)}
              className="text-xs px-3 py-1.5 rounded-lg border font-bold bg-white text-[#201D1A]"
            >
              <option value="New">New</option>
              <option value="Pending">Pending</option>
              <option value="Confirmed">Confirmed</option>
              <option value="Processing">Processing</option>
              <option value="Out for Delivery">Out for Delivery</option>
              <option value="Completed">Completed</option>
              <option value="Cancelled">Cancelled</option>
            </select>
          </div>

          {/* Customer info */}
          <div className="p-3 bg-white rounded-xl border border-[#EAE4DC] space-y-2">
            <h4 className="font-bold uppercase tracking-wider text-[#786F66] text-[10px]">
              Customer Details
            </h4>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <span className="text-[#786F66] block">Name</span>
                <span className="font-semibold text-[#201D1A]">{order.customerName}</span>
              </div>
              <div>
                <span className="text-[#786F66] block">Phone Number</span>
                <a href={`tel:${order.phone}`} className="font-semibold text-blue-600 hover:underline">
                  {order.phone}
                </a>
              </div>
              <div>
                <span className="text-[#786F66] block">WhatsApp</span>
                <span className="font-semibold text-[#201D1A]">
                  {order.whatsappNumber || order.phone}
                </span>
              </div>
              <div>
                <span className="text-[#786F66] block">City</span>
                <span className="font-semibold text-[#201D1A]">{order.city}</span>
              </div>
            </div>
            <div className="pt-2 border-t border-[#F0EBE3]">
              <span className="text-[#786F66] block">Address</span>
              <p className="font-semibold text-[#201D1A]">{order.address}</p>
            </div>
            {order.notes && (
              <div className="pt-2 border-t border-[#F0EBE3]">
                <span className="text-[#786F66] block">Customer Notes</span>
                <p className="font-semibold text-amber-900 bg-amber-50 p-2 rounded-lg mt-0.5">
                  "{order.notes}"
                </p>
              </div>
            )}
          </div>

          {/* Items ordered */}
          <div className="p-3 bg-white rounded-xl border border-[#EAE4DC] space-y-2">
            <h4 className="font-bold uppercase tracking-wider text-[#786F66] text-[10px]">
              Order Items
            </h4>
            <div className="space-y-2">
              {order.items.map((item, i) => (
                <div key={i} className="flex items-center justify-between pb-1 border-b border-[#F0EBE3]">
                  <div className="flex items-center gap-2">
                    <img src={item.image} alt={item.productName} className="w-9 h-9 rounded object-cover" />
                    <div>
                      <span className="font-bold text-[#201D1A] block">{item.productName}</span>
                      <span className="text-[#786F66]">
                        {formatPKR(item.price)} × {item.quantity}
                      </span>
                    </div>
                  </div>
                  <span className="font-bold text-[#201D1A]">
                    {formatPKR(item.price * item.quantity)}
                  </span>
                </div>
              ))}
            </div>
            <div className="pt-2 flex justify-between font-bold text-sm text-[#201D1A]">
              <span>Total Price:</span>
              <span className="text-[#936B3B]">{formatPKR(order.totalAmount)}</span>
            </div>
          </div>
        </div>

        {/* Footer actions */}
        <div className="p-4 border-t border-[#EAE4DC] bg-[#FAF8F5] flex flex-wrap gap-2 items-center justify-between">
          {onDeleteOrder && (
            <button
              onClick={() => {
                onClose();
                onDeleteOrder(order.id, order.orderNumber, order.customerName);
              }}
              className="px-3 py-2.5 bg-red-50 hover:bg-red-100 text-red-600 border border-red-200 rounded-xl font-bold text-xs flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
              title="Delete this order"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>Delete Order</span>
            </button>
          )}
          <div className="flex-1 flex gap-2 justify-end">
            <button
              onClick={() => onWhatsAppCustomer(order)}
              className="flex-1 sm:flex-none py-2.5 px-4 bg-[#25D366] text-white rounded-xl font-bold hover:bg-[#20b858] transition-colors flex items-center justify-center gap-2 text-xs cursor-pointer"
            >
              <WhatsAppIcon className="w-4 h-4 text-white" />
              <span>Message on WhatsApp</span>
            </button>
            <button
              onClick={onClose}
              className="px-4 py-2.5 bg-white border border-[#DDD5CA] rounded-xl font-semibold text-[#201D1A] hover:bg-[#F4EFEA] text-xs transition-colors cursor-pointer"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// -----------------------------------------------------------------
// PRODUCT FORM MODAL (Add / Edit + Image Upload & Preview)
// -----------------------------------------------------------------
function ProductFormModal({
  product,
  categories,
  token,
  onClose,
  onSaved,
}: {
  product: Product | null;
  categories: Category[];
  token: string;
  onClose: () => void;
  onSaved: () => void;
}) {
  const [name, setName] = useState(product?.name || '');
  const [category, setCategory] = useState(product?.category || categories[0]?.id || 'beds');
  const [price, setPrice] = useState(product ? String(product.price) : '');
  const [originalPrice, setOriginalPrice] = useState(product?.originalPrice ? String(product.originalPrice) : '');
  const [description, setDescription] = useState(product?.description || '');
  const [dimensions, setDimensions] = useState(product?.dimensions || '');
  const [material, setMaterial] = useState(product?.material || '');
  const [featuresText, setFeaturesText] = useState(product?.features?.join('\n') || '');
  const [inStock, setInStock] = useState(product ? product.inStock : true);
  const [isFeatured, setIsFeatured] = useState(product ? product.isFeatured : false);
  const [images, setImages] = useState<string[]>(
    product?.images && product.images.length > 0
      ? product.images
      : ['https://images.unsplash.com/photo-1555041469-a586c61ea9bc?auto=format&fit=crop&w=1200&q=80']
  );
  const [imageLabels, setImageLabels] = useState<string[]>(() => {
    if (product?.imageLabels && product.imageLabels.length === (product.images?.length || 0)) {
      return [...product.imageLabels];
    }
    const baseImages = product?.images && product.images.length > 0
      ? product.images
      : ['https://images.unsplash.com/photo-1555041469-a586c61ea9bc?auto=format&fit=crop&w=1200&q=80'];
    return baseImages.map((_, i) => (i === 0 ? 'Main View (Cover)' : `Angle / Piece ${i + 1}`));
  });
  const [newImageUrl, setNewImageUrl] = useState('');
  const [newImageLabel, setNewImageLabel] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [uploadStatus, setUploadStatus] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  const compressImageFile = (file: File): Promise<string> => {
    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.onload = (event) => {
        const img = new Image();
        img.onload = () => {
          const canvas = document.createElement('canvas');
          let width = img.width;
          let height = img.height;
          const maxDim = 1200;
          if (width > maxDim || height > maxDim) {
            if (width > height) {
              height = Math.round((height * maxDim) / width);
              width = maxDim;
            } else {
              width = Math.round((width * maxDim) / height);
              height = maxDim;
            }
          }
          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext('2d');
          if (!ctx) {
            resolve(event.target?.result as string);
            return;
          }
          ctx.drawImage(img, 0, 0, width, height);
          const compressedBase64 = canvas.toDataURL('image/jpeg', 0.85);
          resolve(compressedBase64);
        };
        img.onerror = () => resolve(event.target?.result as string);
        img.src = event.target?.result as string;
      };
      reader.onerror = () => resolve('');
      reader.readAsDataURL(file);
    });
  };

  const processAndUploadFiles = async (files: FileList | File[]) => {
    if (!files || files.length === 0) return;

    const fileList = Array.from(files).filter((f) => f.type.startsWith('image/'));
    if (fileList.length === 0) {
      setFormError('Please select valid image files (JPG, PNG, WEBP)');
      return;
    }

    setUploadingImage(true);
    setFormError(null);

    const newUploadedImages: string[] = [];
    const newUploadedLabels: string[] = [];

    try {
      for (let i = 0; i < fileList.length; i++) {
        const file = fileList[i];
        setUploadStatus(`Processing photo ${i + 1} of ${fileList.length} (${file.name.slice(0, 20)})...`);

        const base64 = await compressImageFile(file);
        if (!base64) continue;

        let finalUrl = base64;
        try {
          const uploadedUrl = await api.uploadImage(base64, token);
          if (uploadedUrl) {
            finalUrl = uploadedUrl;
          }
        } catch {
          // Fallback to base64
          finalUrl = base64;
        }

        newUploadedImages.push(finalUrl);
        const autoLabel =
          newImageLabel.trim() && fileList.length === 1
            ? newImageLabel.trim()
            : file.name.replace(/\.[^/.]+$/, '').replace(/[-_]/g, ' ') || `Angle ${images.length + newUploadedImages.length}`;
        newUploadedLabels.push(autoLabel);
      }

      if (newUploadedImages.length > 0) {
        setImages((prev) => [...prev, ...newUploadedImages]);
        setImageLabels((prev) => [...prev, ...newUploadedLabels]);
        setNewImageLabel('');
      } else {
        setFormError('Failed to upload selected photos');
      }
    } catch {
      setFormError('An error occurred during photo upload');
    } finally {
      setUploadingImage(false);
      setUploadStatus(null);
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;
    await processAndUploadFiles(files);
    e.target.value = ''; // Reset input
  };

  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      await processAndUploadFiles(e.dataTransfer.files);
    }
  };

  const handleAddImageUrl = () => {
    if (!newImageUrl.trim()) return;

    // Support multiple URLs separated by newline or comma
    const rawUrls = newImageUrl
      .split(/[\n,]+/)
      .map((u) => u.trim())
      .filter((u) => u.startsWith('http://') || u.startsWith('https://') || u.startsWith('data:image/'));

    if (rawUrls.length === 0) {
      setFormError('Please enter a valid photo URL (starting with http:// or https://)');
      return;
    }

    setImages((prev) => [...prev, ...rawUrls]);
    setImageLabels((prev) => [
      ...prev,
      ...rawUrls.map((_, i) =>
        newImageLabel.trim() && rawUrls.length === 1
          ? newImageLabel.trim()
          : `Photo ${prev.length + i + 1}`
      ),
    ]);
    setNewImageUrl('');
    setNewImageLabel('');
  };

  const handleRemoveImage = (idx: number) => {
    setImages((prev) => prev.filter((_, i) => i !== idx));
    setImageLabels((prev) => prev.filter((_, i) => i !== idx));
  };

  const handleSetCover = (idx: number) => {
    if (idx === 0) return;
    setImages((prev) => {
      const updated = [...prev];
      const [chosen] = updated.splice(idx, 1);
      updated.unshift(chosen);
      return updated;
    });
    setImageLabels((prev) => {
      const updated = [...prev];
      const [chosen] = updated.splice(idx, 1);
      updated.unshift(chosen || 'Main View (Cover)');
      return updated;
    });
  };

  const handleLabelChange = (idx: number, val: string) => {
    setImageLabels((prev) => {
      const next = [...prev];
      next[idx] = val;
      return next;
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);
    if (!name.trim() || !price || !category) {
      setFormError('Please provide furniture name, price, and category');
      return;
    }

    setIsSubmitting(true);
    try {
      const features = featuresText
        .split('\n')
        .map((f) => f.trim())
        .filter(Boolean);

      const finalImages = images.length > 0 ? images : ['https://images.unsplash.com/photo-1555041469-a586c61ea9bc?auto=format&fit=crop&w=1200&q=80'];
      const finalLabels = finalImages.map((_, i) => imageLabels[i] || (i === 0 ? 'Main View (Cover)' : `Angle / Piece ${i + 1}`));

      const payload = {
        name: name.trim(),
        category,
        price: Number(price),
        originalPrice: originalPrice ? Number(originalPrice) : undefined,
        description: description.trim(),
        dimensions: dimensions.trim(),
        material: material.trim(),
        features,
        inStock,
        isFeatured,
        images: finalImages,
        imageLabels: finalLabels,
      };

      if (product) {
        await api.updateProduct(product.id, payload, token);
      } else {
        await api.createProduct(payload, token);
      }
      onSaved();
    } catch (err: any) {
      setFormError(err.message || 'Error saving furniture');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-black/50 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4">
      <div className="bg-white rounded-2xl max-w-2xl w-full overflow-hidden shadow-2xl border border-[#EAE4DC] flex flex-col max-h-[92vh]">
        <div className="px-5 py-4 border-b border-[#EAE4DC] flex items-center justify-between bg-[#FAF8F5]">
          <h3 className="text-base font-bold text-[#201D1A]">
            {product ? 'Edit Furniture' : 'Add Furniture'}
          </h3>
          <button onClick={onClose} className="p-1 rounded-md text-[#786F66] hover:text-[#201D1A]">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-5 overflow-y-auto space-y-4 text-xs">
          {formError && (
            <div className="p-3 bg-red-50 border border-red-200 text-red-700 text-xs rounded-xl flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{formError}</span>
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block font-bold text-[#463F38] mb-1">Furniture Name *</label>
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. Royal King Bed Set"
                className="w-full px-3 py-2 bg-[#FAF8F5] border border-[#DDD5CA] rounded-xl text-xs text-[#201D1A] focus:outline-hidden focus:border-[#936B3B]"
              />
            </div>

            <div>
              <label className="block font-bold text-[#463F38] mb-1">Category *</label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full px-3 py-2 bg-[#FAF8F5] border border-[#DDD5CA] rounded-xl text-xs text-[#201D1A] focus:outline-hidden focus:border-[#936B3B]"
              >
                {categories.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-bold text-[#463F38] mb-1">Price (Rs) *</label>
              <input
                type="number"
                required
                value={price}
                onChange={(e) => setPrice(e.target.value)}
                placeholder="165000"
                className="w-full px-3 py-2 bg-[#FAF8F5] border border-[#DDD5CA] rounded-xl text-xs text-[#201D1A] focus:outline-hidden focus:border-[#936B3B]"
              />
            </div>

            <div>
              <label className="block font-bold text-[#463F38] mb-1">Old Price (Optional)</label>
              <input
                type="number"
                value={originalPrice}
                onChange={(e) => setOriginalPrice(e.target.value)}
                placeholder="185000"
                className="w-full px-3 py-2 bg-[#FAF8F5] border border-[#DDD5CA] rounded-xl text-xs text-[#201D1A] focus:outline-hidden focus:border-[#936B3B]"
              />
            </div>
          </div>

          <div>
            <label className="block font-bold text-[#463F38] mb-1">Description</label>
            <textarea
              rows={3}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Describe wood type, foam quality, and finish..."
              className="w-full px-3 py-2 bg-[#FAF8F5] border border-[#DDD5CA] rounded-xl text-xs text-[#201D1A] focus:outline-hidden focus:border-[#936B3B]"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-bold text-[#463F38] mb-1">Size / Dimensions</label>
              <input
                type="text"
                value={dimensions}
                onChange={(e) => setDimensions(e.target.value)}
                placeholder="e.g. King Size: 6.5 ft x 6.0 ft"
                className="w-full px-3 py-2 bg-[#FAF8F5] border border-[#DDD5CA] rounded-xl text-xs text-[#201D1A] focus:outline-hidden focus:border-[#936B3B]"
              />
            </div>

            <div>
              <label className="block font-bold text-[#463F38] mb-1">Material</label>
              <input
                type="text"
                value={material}
                onChange={(e) => setMaterial(e.target.value)}
                placeholder="e.g. Solid Sheesham Wood & Velvet"
                className="w-full px-3 py-2 bg-[#FAF8F5] border border-[#DDD5CA] rounded-xl text-xs text-[#201D1A] focus:outline-hidden focus:border-[#936B3B]"
              />
            </div>
          </div>

          <div>
            <label className="block font-bold text-[#463F38] mb-1">Features (One per line)</label>
            <textarea
              rows={3}
              value={featuresText}
              onChange={(e) => setFeaturesText(e.target.value)}
              placeholder="Solid Sheesham wood&#10;10-Year warranty&#10;High quality foam"
              className="w-full px-3 py-2 bg-[#FAF8F5] border border-[#DDD5CA] rounded-xl text-xs text-[#201D1A] focus:outline-hidden focus:border-[#936B3B]"
            />
          </div>

          {/* Product Images Management with File Upload & Preview */}
          <div className="p-3.5 bg-[#FAF8F5] rounded-xl border border-[#EAE4DC] space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <label className="block font-bold text-[#463F38]">Product Photos (Multi-Upload)</label>
                <p className="text-[11px] text-[#786F66]">
                  Upload multiple photos at once or drop them below. First photo is the <strong>Main Photo</strong>.
                </p>
              </div>
              <div className="flex items-center gap-2">
                {images.length > 1 && (
                  <button
                    type="button"
                    onClick={() => {
                      if (window.confirm('Remove all photos except cover?')) {
                        setImages([images[0]]);
                        setImageLabels([imageLabels[0] || 'Main Photo']);
                      }
                    }}
                    className="text-[10px] text-red-600 hover:underline cursor-pointer"
                  >
                    Reset to 1
                  </button>
                )}
                <span className="text-[11px] font-bold text-[#936B3B] bg-[#936B3B]/10 px-2 py-0.5 rounded-md">
                  {images.length} {images.length === 1 ? 'Photo' : 'Photos'}
                </span>
              </div>
            </div>

            {/* Drag and Drop Zone */}
            <div
              onDragOver={(e) => {
                e.preventDefault();
                setIsDragging(true);
              }}
              onDragLeave={() => setIsDragging(false)}
              onDrop={handleDrop}
              className={`border-2 border-dashed rounded-xl p-4 text-center transition-all ${
                isDragging
                  ? 'border-[#936B3B] bg-[#936B3B]/10 scale-[1.01]'
                  : 'border-[#DDD5CA] bg-white hover:border-[#936B3B]/50'
              }`}
            >
              <div className="flex flex-col items-center justify-center gap-1.5 pointer-events-none">
                <Upload className="w-6 h-6 text-[#936B3B]" />
                <p className="text-xs font-bold text-[#201D1A]">
                  Drag & Drop Multiple Photos Here, or Browse
                </p>
                <p className="text-[10px] text-[#786F66]">
                  Select multiple files at once (JPG, PNG, WebP) — automatic image optimization
                </p>
              </div>

              <div className="mt-3 flex items-center justify-center gap-2">
                <label className="inline-flex items-center gap-1.5 px-4 py-2 bg-[#936B3B] hover:bg-[#7D5A2F] text-white rounded-xl font-bold text-xs cursor-pointer shadow-xs transition-colors">
                  <Upload className="w-3.5 h-3.5" />
                  <span>{uploadingImage ? 'Uploading Photos...' : 'Select Multiple Photos'}</span>
                  <input
                    type="file"
                    accept="image/*"
                    multiple
                    onChange={handleFileUpload}
                    className="hidden"
                    disabled={uploadingImage}
                  />
                </label>
              </div>

              {uploadStatus && (
                <div className="mt-2 text-xs font-semibold text-[#936B3B] animate-pulse">
                  {uploadStatus}
                </div>
              )}
            </div>

            {/* Thumbnail Previews with Label Inputs and Cover Selector */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 max-h-64 overflow-y-auto pr-1">
              {images.map((img, i) => (
                <div
                  key={i}
                  className={`p-2 rounded-xl border flex items-center gap-2.5 bg-white transition-all ${
                    i === 0 ? 'border-amber-500 ring-1 ring-amber-500/30 shadow-xs' : 'border-[#DDD5CA]'
                  }`}
                >
                  <div className="relative w-16 h-16 rounded-lg overflow-hidden border border-[#EAE4DC] bg-slate-50 shrink-0">
                    <img src={img} alt={`Preview ${i}`} className="w-full h-full object-cover" />
                    {i === 0 && (
                      <span className="absolute bottom-0 inset-x-0 bg-amber-600 text-white text-[9px] font-bold py-0.5 text-center leading-tight">
                        MAIN PHOTO
                      </span>
                    )}
                  </div>

                  <div className="flex-1 min-w-0 space-y-1">
                    <div className="flex items-center justify-between gap-1">
                      <span className="text-[10px] font-bold text-[#786F66]">
                        {i === 0 ? 'Main Photo' : `Angle / Photo ${i + 1}`}
                      </span>
                      {i !== 0 && (
                        <button
                          type="button"
                          onClick={() => handleSetCover(i)}
                          className="text-[10px] font-bold text-amber-700 hover:text-amber-800 bg-amber-50 hover:bg-amber-100 px-1.5 py-0.5 rounded-md transition-colors cursor-pointer"
                        >
                          Make Main
                        </button>
                      )}
                    </div>
                    <input
                      type="text"
                      value={imageLabels[i] || ''}
                      onChange={(e) => handleLabelChange(i, e.target.value)}
                      placeholder={i === 0 ? 'Main View' : `Photo ${i + 1}`}
                      className="w-full px-2 py-1 bg-[#FAF8F5] border border-[#DDD5CA] rounded-lg text-[11px] text-[#201D1A] focus:outline-hidden focus:border-[#936B3B]"
                    />
                  </div>

                  <button
                    type="button"
                    onClick={() => handleRemoveImage(i)}
                    className="p-1.5 text-slate-400 hover:text-red-600 rounded-lg hover:bg-red-50 transition-colors cursor-pointer"
                    title="Remove photo"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))}
            </div>

            {/* Paste Photo URL (Single or Multiple) */}
            <div className="pt-2 border-t border-[#EAE4DC] space-y-2">
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  value={newImageLabel}
                  onChange={(e) => setNewImageLabel(e.target.value)}
                  placeholder="Optional label for next link (e.g. Side Angle, Wood Finish)"
                  className="w-full px-2.5 py-1.5 bg-white border border-[#DDD5CA] rounded-xl text-xs text-[#201D1A] focus:outline-hidden focus:border-[#936B3B]"
                />
              </div>

              <div className="flex items-center gap-1.5">
                <input
                  type="text"
                  value={newImageUrl}
                  onChange={(e) => setNewImageUrl(e.target.value)}
                  placeholder="Paste photo link(s)... (separate multiple with comma)"
                  className="flex-1 px-2.5 py-2 bg-white border border-[#DDD5CA] rounded-xl text-xs text-[#201D1A]"
                />
                <button
                  type="button"
                  onClick={handleAddImageUrl}
                  className="px-3.5 py-2 bg-[#24201D] text-white rounded-xl text-xs font-bold hover:bg-[#936B3B] transition-colors cursor-pointer shrink-0"
                >
                  Add Link
                </button>
              </div>
            </div>
          </div>

          {/* Toggles */}
          <div className="flex items-center gap-6 pt-1">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={inStock}
                onChange={(e) => setInStock(e.target.checked)}
                className="rounded text-[#936B3B] focus:ring-[#936B3B]"
              />
              <span className="font-semibold text-[#201D1A]">In Stock & Ready</span>
            </label>

            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={isFeatured}
                onChange={(e) => setIsFeatured(e.target.checked)}
                className="rounded text-[#936B3B] focus:ring-[#936B3B]"
              />
              <span className="font-semibold text-[#201D1A]">Show on Homepage</span>
            </label>
          </div>

          {/* Buttons */}
          <div className="pt-3 border-t border-[#EAE4DC] flex justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 bg-[#FAF8F5] border border-[#DDD5CA] rounded-xl font-semibold text-[#463F38] cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-6 py-2 bg-[#936B3B] text-white rounded-xl font-bold hover:bg-[#7D5A2F] disabled:opacity-50 cursor-pointer"
            >
              {isSubmitting ? 'Saving...' : product ? 'Save Changes' : 'Save Furniture'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// -----------------------------------------------------------------
// CATEGORY FORM MODAL
// -----------------------------------------------------------------
function CategoryFormModal({
  category,
  token,
  onClose,
  onSaved,
}: {
  category: Category | null;
  token: string;
  onClose: () => void;
  onSaved: () => void;
}) {
  const [name, setName] = useState(category?.name || '');
  const [description, setDescription] = useState(category?.description || '');
  const [image, setImage] = useState(
    category?.image || 'https://images.unsplash.com/photo-1555041469-a586c61ea9bc?auto=format&fit=crop&w=800&q=80'
  );
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);
    if (!name.trim()) {
      setFormError('Category name is required');
      return;
    }

    setIsSubmitting(true);
    try {
      const payload = {
        name: name.trim(),
        description: description.trim(),
        image: image.trim(),
      };
      if (category) {
        await api.updateCategory(category.id, payload, token);
      } else {
        await api.createCategory(payload, token);
      }
      onSaved();
    } catch (err: any) {
      setFormError(err.message || 'Failed to save category');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-black/50 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4">
      <div className="bg-white rounded-2xl max-w-md w-full overflow-hidden shadow-2xl border border-[#EAE4DC]">
        <div className="px-5 py-4 border-b border-[#EAE4DC] flex items-center justify-between bg-[#FAF8F5]">
          <h3 className="text-base font-bold text-[#201D1A]">
            {category ? 'Edit Category' : 'Add Category'}
          </h3>
          <button onClick={onClose} className="p-1 rounded-md text-[#786F66] hover:text-[#201D1A]">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-5 space-y-4 text-xs">
          {formError && (
            <div className="p-3 bg-red-50 border border-red-200 text-red-700 text-xs rounded-xl flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{formError}</span>
            </div>
          )}

          <div>
            <label className="block font-bold text-[#463F38] mb-1">Category Name *</label>
            <input
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Master Beds, Luxury Sofas"
              className="w-full px-3 py-2 bg-[#FAF8F5] border border-[#DDD5CA] rounded-xl text-xs text-[#201D1A] focus:outline-hidden focus:border-[#936B3B]"
            />
          </div>

          <div>
            <label className="block font-bold text-[#463F38] mb-1">Short Description</label>
            <input
              type="text"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="e.g. Solid wood king beds and headboards"
              className="w-full px-3 py-2 bg-[#FAF8F5] border border-[#DDD5CA] rounded-xl text-xs text-[#201D1A] focus:outline-hidden focus:border-[#936B3B]"
            />
          </div>

          <div>
            <label className="block font-bold text-[#463F38] mb-1">Photo Link</label>
            <input
              type="url"
              value={image}
              onChange={(e) => setImage(e.target.value)}
              placeholder="https://..."
              className="w-full px-3 py-2 bg-[#FAF8F5] border border-[#DDD5CA] rounded-xl text-xs text-[#201D1A] focus:outline-hidden focus:border-[#936B3B]"
            />
            {image && (
              <div className="mt-2 w-full h-24 rounded-lg overflow-hidden border border-[#DDD5CA]">
                <img src={image} alt="Preview" className="w-full h-full object-cover" />
              </div>
            )}
          </div>

          <div className="pt-2 flex justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 bg-[#FAF8F5] border border-[#DDD5CA] rounded-xl font-semibold text-[#463F38] cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-6 py-2 bg-[#936B3B] text-white rounded-xl font-bold hover:bg-[#7D5A2F] disabled:opacity-50 cursor-pointer"
            >
              {isSubmitting ? 'Saving...' : category ? 'Save Changes' : 'Save Category'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
