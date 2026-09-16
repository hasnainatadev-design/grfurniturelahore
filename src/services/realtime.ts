import { getClientSupabase } from './supabaseClient';
import { Product, Category, Order } from '../types';

type RealtimeListener = (event: {
  type: 'products_changed' | 'categories_changed' | 'orders_changed' | 'new_order';
  data?: any;
}) => void;

class RealtimeStoreSync {
  private listeners: Set<RealtimeListener> = new Set();
  private broadcastChannel: BroadcastChannel | null = null;
  private supabaseChannel: any = null;
  private isSubscribedToSupabase = false;
  private pollIntervalId: any = null;

  constructor() {
    this.initBroadcastChannel();
    this.initStorageListener();
    this.initVisibilityListener();
    this.setupSupabaseSubscription();
    this.startBackgroundPolling();
  }

  private initBroadcastChannel() {
    try {
      if (typeof window !== 'undefined' && 'BroadcastChannel' in window) {
        this.broadcastChannel = new BroadcastChannel('grf_store_sync_channel');
        this.broadcastChannel.onmessage = (event) => {
          if (event.data && event.data.type) {
            this.notifyListeners(event.data);
          }
        };
      }
    } catch (err) {
      console.warn('BroadcastChannel not supported or error:', err);
    }
  }

  private initStorageListener() {
    if (typeof window === 'undefined') return;
    window.addEventListener('storage', (e) => {
      if (e.key === 'grf_local_products') {
        this.notifyListeners({ type: 'products_changed' });
      } else if (e.key === 'grf_local_categories') {
        this.notifyListeners({ type: 'categories_changed' });
      } else if (e.key === 'grf_local_orders') {
        this.notifyListeners({ type: 'orders_changed' });
      }
    });
  }

  private initVisibilityListener() {
    if (typeof window === 'undefined') return;
    document.addEventListener('visibilitychange', () => {
      if (document.visibilityState === 'visible') {
        // Tab became active again - trigger fresh sync
        this.notifyListeners({ type: 'products_changed' });
        this.notifyListeners({ type: 'categories_changed' });
        this.notifyListeners({ type: 'orders_changed' });
      }
    });

    window.addEventListener('focus', () => {
      this.notifyListeners({ type: 'products_changed' });
      this.notifyListeners({ type: 'categories_changed' });
    });
  }

  public setupSupabaseSubscription() {
    const sb = getClientSupabase();
    if (!sb || this.isSubscribedToSupabase) return;

    try {
      this.supabaseChannel = sb
        .channel('grf_global_realtime')
        .on(
          'postgres_changes',
          { event: '*', schema: 'public', table: 'products' },
          (payload: any) => {
            this.broadcast('products_changed', payload.new || payload.old);
          }
        )
        .on(
          'postgres_changes',
          { event: '*', schema: 'public', table: 'categories' },
          (payload: any) => {
            this.broadcast('categories_changed', payload.new || payload.old);
          }
        )
        .on(
          'postgres_changes',
          { event: 'INSERT', schema: 'public', table: 'orders' },
          (payload: any) => {
            this.broadcast('new_order', payload.new);
            this.broadcast('orders_changed', payload.new);
          }
        )
        .on(
          'postgres_changes',
          { event: 'UPDATE', schema: 'public', table: 'orders' },
          (payload: any) => {
            this.broadcast('orders_changed', payload.new);
          }
        )
        .on(
          'postgres_changes',
          { event: 'DELETE', schema: 'public', table: 'orders' },
          (payload: any) => {
            this.broadcast('orders_changed', payload.old);
          }
        )
        .subscribe((status: string) => {
          if (status === 'SUBSCRIBED') {
            this.isSubscribedToSupabase = true;
          }
        });
    } catch (err) {
      console.warn('Could not initialize Supabase Realtime channel:', err);
    }
  }

  private startBackgroundPolling() {
    if (this.pollIntervalId) return;
    // Check every 15 seconds silently in the background
    this.pollIntervalId = setInterval(() => {
      if (typeof document !== 'undefined' && document.visibilityState === 'visible') {
        this.notifyListeners({ type: 'products_changed' });
        this.notifyListeners({ type: 'categories_changed' });
        this.notifyListeners({ type: 'orders_changed' });
      }
    }, 15000);
  }

  public broadcast(
    type: 'products_changed' | 'categories_changed' | 'orders_changed' | 'new_order',
    data?: any
  ) {
    const message = { type, data, timestamp: Date.now() };

    // 1. Notify local in-memory listeners
    this.notifyListeners(message);

    // 2. Broadcast to other open browser tabs & windows
    try {
      if (this.broadcastChannel) {
        this.broadcastChannel.postMessage(message);
      }
    } catch {}
  }

  private notifyListeners(event: {
    type: 'products_changed' | 'categories_changed' | 'orders_changed' | 'new_order';
    data?: any;
  }) {
    this.listeners.forEach((listener) => {
      try {
        listener(event);
      } catch (err) {
        console.error('Error in realtime listener:', err);
      }
    });
  }

  public subscribe(listener: RealtimeListener): () => void {
    this.listeners.add(listener);
    this.setupSupabaseSubscription();

    return () => {
      this.listeners.delete(listener);
    };
  }
}

export const realtimeStore = new RealtimeStoreSync();
