import React from 'react';
import { Home, Armchair, ShoppingBag } from 'lucide-react';
import { useCart } from '../context/CartContext';

interface BottomNavProps {
  currentView: string;
  onNavigateHome: () => void;
  onNavigateShop: (category?: string) => void;
}

export const BottomNav: React.FC<BottomNavProps> = ({
  currentView,
  onNavigateHome,
  onNavigateShop,
}) => {
  const { cartCount, setIsCartOpen } = useCart();

  return (
    <nav
      id="mobile-bottom-nav"
      className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-white/95 backdrop-blur-md border-t border-[#E8E1D7] px-4 py-2 pb-[max(0.5rem,env(safe-area-inset-bottom))]"
    >
      <div className="grid grid-cols-3 items-center justify-items-center max-w-sm mx-auto text-[10px] text-[#82756A] font-medium">
        {/* Home */}
        <button
          onClick={() => onNavigateHome()}
          className={`flex flex-col items-center py-1 px-3 transition-colors cursor-pointer ${
            currentView === 'home' ? 'text-[#6E4D2E] font-semibold' : 'text-[#82756A] hover:text-[#231B15]'
          }`}
        >
          <Home className="w-4 h-4 mb-1" />
          <span>Home</span>
        </button>

        {/* Shop */}
        <button
          onClick={() => onNavigateShop('all')}
          className={`flex flex-col items-center py-1 px-3 transition-colors cursor-pointer ${
            currentView === 'shop' ? 'text-[#6E4D2E] font-semibold' : 'text-[#82756A] hover:text-[#231B15]'
          }`}
        >
          <Armchair className="w-4 h-4 mb-1" />
          <span>Furniture</span>
        </button>

        {/* Cart */}
        <button
          onClick={() => setIsCartOpen(true)}
          className="relative flex flex-col items-center py-1 px-3 text-[#82756A] hover:text-[#231B15] transition-colors cursor-pointer"
        >
          <div className="relative">
            <ShoppingBag className="w-4 h-4 mb-1" />
            {cartCount > 0 && (
              <span className="absolute -top-1 -right-2 bg-[#6E4D2E] text-white text-[9px] font-bold w-3.5 h-3.5 rounded-full flex items-center justify-center shadow-2xs">
                {cartCount}
              </span>
            )}
          </div>
          <span>Order</span>
        </button>
      </div>
    </nav>
  );
};
