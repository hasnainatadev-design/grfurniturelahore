import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { Header } from './components/Header';
import { BottomNav } from './components/BottomNav';
import { Footer } from './components/Footer';
import { WhatsAppButton } from './components/WhatsAppButton';
import { CartDrawer } from './components/CartDrawer';
import { SEOHead } from './components/SEOHead';
import { HomeView } from './views/HomeView';
import { ShopView } from './views/ShopView';
import { ProductDetailView } from './views/ProductDetailView';
import { CheckoutModal } from './views/CheckoutModal';
import { AdminView } from './views/AdminView';
import { CartProvider, useCart } from './context/CartContext';
import { api } from './services/api';
import { realtimeStore } from './services/realtime';
import { Product, Category, Order } from './types';
import {
  getHomeSEO,
  generateProductSEO,
  generateCategorySEO,
  getShopSEO,
  SEOMetadata,
} from './utils/seo';

function AppContent() {
  const [currentView, setCurrentView] = useState<'home' | 'shop' | 'admin'>('home');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [sortBy, setSortBy] = useState<string>('newest');

  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  const { isCheckoutOpen, setIsCheckoutOpen, setDirectCheckoutItem } = useCart();

  // Load initial products and categories from backend
  const loadStoreData = async () => {
    try {
      setLoading(true);
      const [fetchedProducts, fetchedCategories] = await Promise.all([
        api.getProducts(),
        api.getCategories(),
      ]);
      setProducts(fetchedProducts);
      setCategories(fetchedCategories);
      return { products: fetchedProducts, categories: fetchedCategories };
    } catch (err) {
      console.error('Failed to load store data:', err);
      return { products: [], categories: [] };
    } finally {
      setLoading(false);
    }
  };

  // Sync URL from state
  const updateBrowserUrl = useCallback((path: string) => {
    if (typeof window !== 'undefined' && window.location.pathname !== path) {
      window.history.pushState(null, '', path);
    }
  }, []);

  // Handle URL on mount or browser back/forward (Popstate)
  const handleUrlRoute = useCallback((productList: Product[], categoryList: Category[]) => {
    if (typeof window === 'undefined') return;
    const path = window.location.pathname;

    if (path === '/admin') {
      setCurrentView('admin');
      setSelectedProduct(null);
      return;
    }

    // Match /furniture/:slug or /product/:slug
    const productMatch = path.match(/^\/(?:furniture|product)\/([^/]+)/);
    if (productMatch && productMatch[1]) {
      const slug = decodeURIComponent(productMatch[1]);
      const found = productList.find((p) => (p.slug || p.id) === slug || p.id === slug);
      if (found) {
        setSelectedProduct(found);
        setCurrentView('shop');
        return;
      }
    }

    // Match /category/:slug or direct category names like /beds, /sofas
    const categoryMatch = path.match(/^\/category\/([^/]+)/);
    if (categoryMatch && categoryMatch[1]) {
      const catSlug = decodeURIComponent(categoryMatch[1]);
      const foundCat = categoryList.find((c) => (c.slug || c.id) === catSlug || c.id === catSlug);
      if (foundCat) {
        setSelectedCategory(foundCat.id);
        setSelectedProduct(null);
        setCurrentView('shop');
        return;
      }
    }

    // Check direct category shortcuts (e.g. /beds, /sofas)
    const directSlug = path.replace(/^\//, '');
    const directCat = categoryList.find((c) => (c.slug || c.id) === directSlug || c.id === directSlug);
    if (directCat) {
      setSelectedCategory(directCat.id);
      setSelectedProduct(null);
      setCurrentView('shop');
      return;
    }

    if (path === '/shop') {
      setCurrentView('shop');
      setSelectedCategory('all');
      setSelectedProduct(null);
      return;
    }

    // Default to home
    setCurrentView('home');
    setSelectedProduct(null);
  }, []);

  // Track if initial routing has already been performed
  const initialRouteCheckedRef = React.useRef(false);

  useEffect(() => {
    loadStoreData().then(({ products: loadedProds, categories: loadedCats }) => {
      handleUrlRoute(loadedProds, loadedCats);
      initialRouteCheckedRef.current = true;
    });

    const onPopState = () => {
      handleUrlRoute(products, categories);
    };

    window.addEventListener('popstate', onPopState);

    // Subscribe to realtime catalog updates (Supabase Realtime + Cross-Tab BroadcastChannel + Polling)
    const unsubscribe = realtimeStore.subscribe(async (event) => {
      if (event.type === 'products_changed') {
        try {
          const freshProducts = await api.getProducts();
          setProducts(freshProducts);
          // If a product is currently viewed, update its reference if it changed
          setSelectedProduct((currentSelected) => {
            if (!currentSelected) return null;
            const updatedMatch = freshProducts.find(
              (p) => p.id === currentSelected.id || (p.slug && p.slug === currentSelected.slug)
            );
            return updatedMatch || currentSelected;
          });
        } catch (err) {
          console.warn('Realtime products refresh error:', err);
        }
      } else if (event.type === 'categories_changed') {
        try {
          const freshCategories = await api.getCategories();
          setCategories(freshCategories);
        } catch (err) {
          console.warn('Realtime categories refresh error:', err);
        }
      }
    });

    return () => {
      window.removeEventListener('popstate', onPopState);
      unsubscribe();
    };
  }, []);

  // Dynamic SEO Metadata computation
  const currentSEO: SEOMetadata = useMemo(() => {
    if (selectedProduct) {
      const catName = categories.find((c) => c.id === selectedProduct.category)?.name;
      return generateProductSEO(selectedProduct, catName);
    }

    if (currentView === 'shop') {
      if (selectedCategory !== 'all') {
        const cat = categories.find((c) => c.id === selectedCategory);
        if (cat) {
          const count = products.filter((p) => p.category === cat.id).length;
          return generateCategorySEO(cat, count);
        }
      }
      return getShopSEO(searchQuery);
    }

    if (currentView === 'admin') {
      return {
        title: 'Admin Dashboard | GR Furniture Lahore',
        description: 'Secure inventory and order management system for GR Furniture Lahore.',
        canonicalUrl: `${window.location.origin}/admin`,
      };
    }

    return getHomeSEO();
  }, [selectedProduct, currentView, selectedCategory, searchQuery, categories, products]);

  // Handle product selection & update URL
  const handleSelectProduct = (product: Product) => {
    setSelectedProduct(product);
    updateBrowserUrl(`/furniture/${product.slug || product.id}`);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Handle direct "Order Now" action
  const handleQuickOrder = (product: Product, quantity = 1) => {
    setDirectCheckoutItem({ product, quantity });
    setIsCheckoutOpen(true);
  };

  const handleNavigateToShop = (category = 'all') => {
    setSelectedProduct(null);
    setSelectedCategory(category);
    setCurrentView('shop');
    if (category === 'all') {
      updateBrowserUrl('/shop');
    } else {
      const catObj = categories.find((c) => c.id === category);
      updateBrowserUrl(`/category/${catObj?.slug || category}`);
    }
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleNavigateHome = () => {
    setSelectedProduct(null);
    setSelectedCategory('all');
    setSearchQuery('');
    setCurrentView('home');
    updateBrowserUrl('/');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleNavigateAdmin = () => {
    setSelectedProduct(null);
    setCurrentView('admin');
    updateBrowserUrl('/admin');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleOrderSuccess = (_order: Order) => {
    // Order placed successfully
  };

  return (
    <div className="min-h-screen bg-[#FAF7F2] text-[#231B15] flex flex-col font-sans selection:bg-[#E8DCCF] selection:text-[#231B15]">
      {/* Dynamic SEO Meta Tags & JSON-LD Structured Data */}
      <SEOHead seo={currentSEO} />

      {/* Header */}
      {currentView !== 'admin' && (
        <Header
          currentView={selectedProduct ? 'shop' : currentView}
          onNavigateHome={handleNavigateHome}
          onNavigateShop={handleNavigateToShop}
          categories={categories}
          selectedCategory={selectedCategory}
          searchQuery={searchQuery}
          setSearchQuery={setSearchQuery}
          onOpenQuickCustomModal={() => {
            const msg = encodeURIComponent(
              'Hello GR Furniture Lahore, I would like to inquire about custom furniture and workshop visit on Ferozepur Road.'
            );
            window.open(`https://wa.me/923446784419?text=${msg}`, '_blank');
          }}
        />
      )}

      {/* Main Content Area */}
      <main className="flex-1">
        {loading && products.length === 0 ? (
          <div className="min-h-[70vh] flex flex-col items-center justify-center p-6 space-y-4">
            <div className="w-12 h-12 border-3 border-[#6E4D2E] border-t-transparent rounded-full animate-spin"></div>
            <p className="text-xs sm:text-sm font-medium text-[#82756A] tracking-wide">
              Loading GR Furniture collections...
            </p>
          </div>
        ) : currentView === 'admin' ? (
          <AdminView
            onBackToStore={() => {
              handleNavigateHome();
              loadStoreData();
            }}
            onDataChanged={() => {
              loadStoreData();
            }}
          />
        ) : selectedProduct ? (
          <div className="animate-in fade-in duration-300">
            <ProductDetailView
              product={selectedProduct}
              allProducts={products}
              onBack={() => {
                setSelectedProduct(null);
                updateBrowserUrl(selectedCategory === 'all' ? '/shop' : `/category/${selectedCategory}`);
              }}
              onSelectProduct={handleSelectProduct}
              onQuickOrder={handleQuickOrder}
              onNavigateToCategory={(cat) => handleNavigateToShop(cat)}
            />
          </div>
        ) : currentView === 'shop' ? (
          <div className="animate-in fade-in duration-300">
            <ShopView
              products={products}
              categories={categories}
              selectedCategory={selectedCategory}
              setSelectedCategory={(cat) => {
                setSelectedCategory(cat);
                if (cat === 'all') {
                  updateBrowserUrl('/shop');
                } else {
                  const catObj = categories.find((c) => c.id === cat);
                  updateBrowserUrl(`/category/${catObj?.slug || cat}`);
                }
              }}
              searchQuery={searchQuery}
              setSearchQuery={setSearchQuery}
              sortBy={sortBy}
              setSortBy={setSortBy}
              onSelectProduct={handleSelectProduct}
              onQuickOrder={handleQuickOrder}
            />
          </div>
        ) : (
          <div className="animate-in fade-in duration-300">
            <HomeView
              products={products}
              categories={categories}
              onSelectProduct={handleSelectProduct}
              onQuickOrder={handleQuickOrder}
              onNavigateToShop={handleNavigateToShop}
            />
          </div>
        )}
      </main>

      {/* Footer */}
      {currentView !== 'admin' && (
        <Footer
          onNavigate={(view, cat) => {
            if (view === 'home') handleNavigateHome();
            else if (view === 'admin') handleNavigateAdmin();
            else if (view === 'shop') handleNavigateToShop(cat || 'all');
          }}
        />
      )}

      {/* Floating WhatsApp Button with Context */}
      {currentView !== 'admin' && (
        <WhatsAppButton
          productName={selectedProduct ? selectedProduct.name : undefined}
          price={selectedProduct ? selectedProduct.price : undefined}
        />
      )}

      {/* Mobile Bottom Navigation */}
      {currentView !== 'admin' && (
        <BottomNav
          currentView={selectedProduct ? 'shop' : currentView}
          onNavigateHome={handleNavigateHome}
          onNavigateShop={handleNavigateToShop}
        />
      )}

      {/* Cart Slide-Over Drawer */}
      <CartDrawer
        onProceedToCheckout={() => setIsCheckoutOpen(true)}
        onContinueShopping={() => {
          setSelectedProduct(null);
          handleNavigateToShop('all');
        }}
      />

      {/* Simple Checkout Modal (No Online Payment) */}
      <CheckoutModal
        isOpen={isCheckoutOpen}
        onClose={() => setIsCheckoutOpen(false)}
        onOrderSuccess={handleOrderSuccess}
      />
    </div>
  );
}

export default function App() {
  return (
    <CartProvider>
      <AppContent />
    </CartProvider>
  );
}
