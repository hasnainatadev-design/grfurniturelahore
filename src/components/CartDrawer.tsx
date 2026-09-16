import React from 'react';
import { X, Trash2, Plus, Minus, ArrowRight } from 'lucide-react';
import { WhatsAppIcon } from './WhatsAppIcon';
import { useCart, formatPKR } from '../context/CartContext';

interface CartDrawerProps {
  onProceedToCheckout: () => void;
  onContinueShopping: () => void;
}

export const CartDrawer: React.FC<CartDrawerProps> = ({
  onProceedToCheckout,
  onContinueShopping,
}) => {
  const { cart, removeFromCart, updateQuantity, isCartOpen, setIsCartOpen, cartTotal } = useCart();

  if (!isCartOpen) return null;

  const handleWhatsAppOrder = () => {
    let msg = 'Hello GR Furniture, I want to order:\n';
    cart.forEach((item, idx) => {
      msg += `${idx + 1}. ${item.product.name} (Qty: ${item.quantity}) - ${formatPKR(
        item.product.price * item.quantity
      )}\n`;
    });
    msg += `\nTotal: ${formatPKR(cartTotal)}\nPlease let me know delivery time.`;
    window.open(`https://wa.me/923446784419?text=${encodeURIComponent(msg)}`, '_blank');
  };

  return (
    <div className="fixed inset-0 z-50 overflow-hidden">
      {/* Backdrop */}
      <div
        onClick={() => setIsCartOpen(false)}
        className="fixed inset-0 bg-stone-950/40 backdrop-blur-xs transition-opacity"
      />

      <div className="fixed inset-y-0 right-0 max-w-full flex pl-10">
        <div className="w-screen max-w-md bg-[#FAF7F2] flex flex-col border-l border-[#E8E1D7] shadow-2xl">
          {/* Header */}
          <div className="px-6 py-5 border-b border-[#E8E1D7] flex items-center justify-between bg-white">
            <div>
              <h2 className="text-base font-serif-luxury text-[#231B15] font-medium">
                Your Order ({cart.length})
              </h2>
            </div>
            <button
              onClick={() => setIsCartOpen(false)}
              className="p-1 text-[#8C7A6B] hover:text-[#231B15] transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Cart Items List */}
          <div className="flex-1 overflow-y-auto p-6 space-y-4">
            {cart.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-center py-12 space-y-3">
                <h3 className="text-base font-serif-luxury text-[#231B15]">Your order is empty</h3>
                <p className="text-xs text-[#82756A] max-w-xs leading-relaxed font-light">
                  Browse our beds, sofas, dining tables, and other handmade wood furniture.
                </p>
                <button
                  onClick={() => {
                    setIsCartOpen(false);
                    onContinueShopping();
                  }}
                  className="mt-4 px-6 py-2.5 rounded-full bg-[#6E4D2E] text-white text-xs font-medium hover:bg-[#583B20] transition-colors cursor-pointer shadow-xs"
                >
                  View Furniture
                </button>
              </div>
            ) : (
              cart.map((item) => (
                <div
                  key={item.product.id}
                  className="flex gap-4 p-4 bg-white rounded-xl border border-[#E8E1D7] shadow-2xs"
                >
                  <img
                    src={item.product.images[0]}
                    alt={item.product.name}
                    className="w-16 h-16 sm:w-20 sm:h-20 object-cover rounded-lg bg-[#F5EFE6] shrink-0"
                  />
                  <div className="flex-1 flex flex-col justify-between">
                    <div>
                      <div className="flex items-start justify-between gap-2">
                        <h4 className="text-xs sm:text-sm font-medium text-[#231B15] line-clamp-1">
                          {item.product.name}
                        </h4>
                        <button
                          onClick={() => removeFromCart(item.product.id)}
                          className="text-[#9E9083] hover:text-red-700 transition-colors p-0.5 cursor-pointer"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                      <p className="text-xs text-[#6E4D2E] font-medium mt-1">
                        {formatPKR(item.product.price)}
                      </p>
                    </div>

                    <div className="flex items-center justify-between pt-2">
                      <div className="flex items-center border border-[#E8E1D7] rounded-md bg-[#FAF7F2]">
                        <button
                          onClick={() => updateQuantity(item.product.id, item.quantity - 1)}
                          className="px-2 py-0.5 text-[#5C5046] hover:text-[#231B15] cursor-pointer text-xs"
                        >
                          <Minus className="w-3 h-3" />
                        </button>
                        <span className="px-2 py-0.5 text-xs font-medium text-[#231B15]">{item.quantity}</span>
                        <button
                          onClick={() => updateQuantity(item.product.id, item.quantity + 1)}
                          className="px-2 py-0.5 text-[#5C5046] hover:text-[#231B15] cursor-pointer text-xs"
                        >
                          <Plus className="w-3 h-3" />
                        </button>
                      </div>
                      <span className="text-xs font-medium text-[#231B15]">
                        {formatPKR(item.product.price * item.quantity)}
                      </span>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Footer */}
          {cart.length > 0 && (
            <div className="p-6 border-t border-[#E8E1D7] bg-white space-y-4">
              <div className="flex items-baseline justify-between">
                <span className="text-xs text-[#82756A] font-light">Total Amount</span>
                <span className="text-lg font-serif-luxury font-medium text-[#231B15]">
                  {formatPKR(cartTotal)}
                </span>
              </div>
              <p className="text-[11px] text-[#82756A] font-light">
                Cash on delivery with free fitting in Lahore.
              </p>

              <div className="space-y-2 pt-1">
                <button
                  id="drawer-checkout-btn"
                  onClick={() => {
                    setIsCartOpen(false);
                    onProceedToCheckout();
                  }}
                  className="w-full py-3 px-4 rounded-full bg-[#6E4D2E] text-white text-xs sm:text-sm font-medium hover:bg-[#583B20] transition-colors flex items-center justify-center gap-2 cursor-pointer shadow-xs"
                >
                  <span>Place Order</span>
                  <ArrowRight className="w-4 h-4" />
                </button>

                <button
                  id="drawer-whatsapp-btn"
                  onClick={handleWhatsAppOrder}
                  className="w-full py-2.5 px-4 text-xs text-[#6E4D2E] hover:text-[#583B20] transition-colors flex items-center justify-center gap-1.5 cursor-pointer underline underline-offset-4"
                >
                  <WhatsAppIcon className="w-3.5 h-3.5 text-[#25D366]" />
                  <span>Order on WhatsApp</span>
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
