import React, { useState } from 'react';
import {
  Search,
  ShoppingBag,
  Menu,
  X,
  Phone,
} from 'lucide-react';
import { useCart } from '../context/CartContext';
import { Category } from '../types';

interface HeaderProps {
  currentView: string;
  onNavigateHome: () => void;
  onNavigateShop: (category?: string) => void;
  categories: Category[];
  selectedCategory: string;
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  onOpenQuickCustomModal?: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  currentView,
  onNavigateHome,
  onNavigateShop,
  categories,
  searchQuery,
  setSearchQuery,
}) => {
  const { cartCount, setIsCartOpen } = useCart();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);

  return (
    <header className="sticky top-0 z-40 bg-[#FAF7F2]/95 backdrop-blur-md border-b border-[#E8E1D7]">
      {/* 1. Calm, User-Friendly Top Announcement Line */}
      <div className="bg-[#1F1813] text-[#D8CEBE] py-1.5 sm:py-2 px-3 sm:px-6 border-b border-[#332820]">
        <div className="max-w-7xl mx-auto flex items-center justify-between gap-2 sm:gap-4">
          {/* Workshop identity badge */}
          <div className="flex items-center gap-1.5 sm:gap-2 min-w-0 truncate text-[#C4B7A7] font-light">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 shrink-0" aria-hidden="true" />
            <span className="truncate tracking-wide text-[10px] sm:text-[11px]">
              <span className="hidden md:inline">Wood Furniture Workshop • Lahore, Pakistan • Direct Factory Prices</span>
              <span className="hidden sm:inline md:hidden">Lahore Workshop • Direct Factory Prices</span>
              <span className="sm:hidden">Lahore Workshop • Factory Prices</span>
            </span>
          </div>

          {/* Interactive Tap-to-Call Pill */}
          <a
            href="tel:03446784419"
            className="shrink-0 whitespace-nowrap inline-flex items-center gap-1.5 text-[#EFE7DC] hover:text-white bg-[#352920] hover:bg-[#46362C] active:bg-[#2B2019] px-2.5 py-1 rounded-full text-[10px] sm:text-[11px] font-medium border border-[#524135] transition-all cursor-pointer select-none active:scale-95"
            aria-label="Call GR Furniture at 0344 6784419"
            title="Call workshop: 0344 6784419"
          >
            <Phone className="w-2.5 h-2.5 text-[#C4A882] shrink-0" />
            <span className="tracking-wider font-mono">0344 6784419</span>
          </a>
        </div>
      </div>

      {/* 2. Main Navigation Bar */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 sm:h-20 gap-4">
          {/* Mobile Menu Toggle */}
          <div className="flex items-center md:hidden">
            <button
              id="mobile-menu-toggle-btn"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-2 -ml-2 rounded-lg text-[#231B15] hover:bg-[#F3EDE4] transition-colors cursor-pointer"
              aria-label="Toggle menu"
            >
              {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5 text-[#231B15]" />}
            </button>
          </div>

          {/* Brand Logo -> Navigates to Home */}
          <div
            id="brand-logo"
            onClick={() => {
              onNavigateHome();
              setMobileMenuOpen(false);
            }}
            className="flex items-center gap-3 cursor-pointer select-none group"
            role="button"
            tabIndex={0}
            aria-label="GR Furniture Home"
          >
            <div className="w-10 h-10 sm:w-11 sm:h-11 rounded-xl overflow-hidden border border-[#D5C9B8] bg-[#1E1712] shrink-0 shadow-xs group-hover:border-[#C4A882] transition-colors">
              <img
                src="/logo.png"
                alt="GR Furniture Lahore - Official Logo"
                className="w-full h-full object-cover"
                loading="eager"
                referrerPolicy="no-referrer"
              />
            </div>
            <div>
              <span className="font-serif-luxury text-lg sm:text-xl font-medium tracking-tight text-[#231B15] block leading-tight group-hover:text-[#6E4D2E] transition-colors">
                GR Furniture
              </span>
              <span className="text-[10px] uppercase tracking-widest text-[#82756A] font-medium block">
                Lahore
              </span>
            </div>
          </div>

          {/* Desktop Navigation Links */}
          <nav className="hidden md:flex items-center gap-6 text-xs sm:text-sm font-medium text-[#5A4D42]">
            <button
              onClick={() => onNavigateHome()}
              className={`transition-colors cursor-pointer ${
                currentView === 'home'
                  ? 'text-[#6E4D2E] font-semibold'
                  : 'hover:text-[#6E4D2E]'
              }`}
            >
              Home
            </button>

            <button
              onClick={() => onNavigateShop('all')}
              className={`transition-colors cursor-pointer ${
                currentView === 'shop'
                  ? 'text-[#6E4D2E] font-semibold'
                  : 'hover:text-[#6E4D2E]'
              }`}
            >
              Our Furniture
            </button>

            <button
              onClick={() => {
                onNavigateHome();
                setTimeout(() => {
                  document.getElementById('why-us-section')?.scrollIntoView({ behavior: 'smooth' });
                }, 100);
              }}
              className="hover:text-[#6E4D2E] transition-colors cursor-pointer"
            >
              Why Choose Us
            </button>

            <button
              onClick={() => {
                onNavigateHome();
                setTimeout(() => {
                  document.getElementById('contact-section')?.scrollIntoView({ behavior: 'smooth' });
                }, 100);
              }}
              className="hover:text-[#6E4D2E] transition-colors cursor-pointer"
            >
              Visit Workshop
            </button>
          </nav>

          {/* Right Action Icons: Search + Cart */}
          <div className="flex items-center gap-2 sm:gap-3">
            {/* Desktop Search Input */}
            <div className="relative hidden sm:block">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  if (currentView !== 'shop') onNavigateShop('all');
                }}
                placeholder="Search furniture..."
                className="w-40 lg:w-52 pl-8 pr-3 py-1.5 bg-white border border-[#E8E1D7] rounded-full text-xs text-[#231B15] placeholder:text-[#9E9083] focus:outline-hidden focus:border-[#6E4D2E] transition-all"
              />
              <Search className="w-3.5 h-3.5 text-[#9E9083] absolute left-2.5 top-1/2 -translate-y-1/2" />
            </div>

            {/* Mobile Search Icon */}
            <button
              onClick={() => {
                setSearchOpen(!searchOpen);
                if (currentView !== 'shop') onNavigateShop('all');
              }}
              className="sm:hidden p-2 rounded-lg text-[#5A4D42] hover:bg-[#F3EDE4] transition-colors cursor-pointer"
              aria-label="Search"
            >
              <Search className="w-4 h-4" />
            </button>

            {/* Shopping Cart Button */}
            <button
              id="header-cart-btn"
              onClick={() => setIsCartOpen(true)}
              className="p-2 sm:px-3.5 sm:py-2 rounded-full bg-[#6E4D2E] hover:bg-[#583B20] text-white text-xs font-medium flex items-center gap-2 transition-all cursor-pointer active:scale-95 shadow-xs"
              aria-label="Open Order Cart"
            >
              <ShoppingBag className="w-4 h-4" />
              <span className="hidden sm:inline">Order</span>
              {cartCount > 0 && (
                <span className="bg-[#FAF7F2] text-[#6E4D2E] font-bold text-[10px] w-4 h-4 rounded-full flex items-center justify-center border border-[#CBB8A3]">
                  {cartCount}
                </span>
              )}
            </button>
          </div>
        </div>

        {/* Mobile Search Field (if toggled) */}
        {searchOpen && (
          <div className="pb-3 pt-1 sm:hidden">
            <div className="relative">
              <input
                type="text"
                autoFocus
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search beds, sofas, dining..."
                className="w-full pl-8 pr-7 py-2 bg-white border border-[#E8E1D7] rounded-xl text-xs text-[#231B15] focus:outline-hidden focus:border-[#6E4D2E]"
              />
              <Search className="w-3.5 h-3.5 text-[#9E9083] absolute left-2.5 top-1/2 -translate-y-1/2" />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[#9E9083] cursor-pointer"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Mobile Drawer Menu */}
      {mobileMenuOpen && (
        <div className="md:hidden bg-white border-b border-[#E8E1D7] px-5 py-5 space-y-4 shadow-lg">
          <div className="flex flex-col space-y-3">
            <button
              onClick={() => {
                onNavigateHome();
                setMobileMenuOpen(false);
              }}
              className={`text-left text-sm py-1.5 font-medium cursor-pointer transition-colors ${
                currentView === 'home' ? 'text-[#6E4D2E] font-semibold' : 'text-[#5A4D42] hover:text-[#231B15]'
              }`}
            >
              Home
            </button>
            <button
              onClick={() => {
                onNavigateShop('all');
                setMobileMenuOpen(false);
              }}
              className={`text-left text-sm py-1.5 font-medium cursor-pointer transition-colors ${
                currentView === 'shop' ? 'text-[#6E4D2E] font-semibold' : 'text-[#5A4D42] hover:text-[#231B15]'
              }`}
            >
              Our Furniture
            </button>
            <button
              onClick={() => {
                onNavigateHome();
                setMobileMenuOpen(false);
                setTimeout(() => {
                  document.getElementById('why-us-section')?.scrollIntoView({ behavior: 'smooth' });
                }, 100);
              }}
              className="text-left text-sm py-1.5 font-medium text-[#5A4D42] hover:text-[#231B15] cursor-pointer transition-colors"
            >
              Why Choose Us
            </button>
            <button
              onClick={() => {
                onNavigateHome();
                setMobileMenuOpen(false);
                setTimeout(() => {
                  document.getElementById('contact-section')?.scrollIntoView({ behavior: 'smooth' });
                }, 100);
              }}
              className="text-left text-sm py-1.5 font-medium text-[#5A4D42] hover:text-[#231B15] cursor-pointer transition-colors"
            >
              Visit Workshop
            </button>
          </div>

          <div className="pt-3 border-t border-[#EFE9DF]">
            <span className="text-[10px] uppercase tracking-wider text-[#9E9083] font-medium block mb-2">
              Furniture Categories
            </span>
            <div className="grid grid-cols-2 gap-2">
              {categories.map((cat) => (
                <button
                  key={cat.id}
                  onClick={() => {
                    onNavigateShop(cat.id);
                    setMobileMenuOpen(false);
                  }}
                  className="p-2 rounded-lg bg-[#FAF7F2] text-left text-xs text-[#4A3D34] hover:bg-[#F3EDE4] hover:text-[#231B15] transition-colors border border-[#EFE9DF] cursor-pointer"
                >
                  {cat.name}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
    </header>
  );
};

