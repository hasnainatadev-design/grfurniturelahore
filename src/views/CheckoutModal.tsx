import React, { useState } from 'react';
import { X, CheckCircle2, ArrowRight, Copy, Check } from 'lucide-react';
import { WhatsAppIcon } from '../components/WhatsAppIcon';
import { useCart, formatPKR } from '../context/CartContext';
import { api } from '../services/api';
import { Order } from '../types';

interface CheckoutModalProps {
  isOpen: boolean;
  onClose: () => void;
  onOrderSuccess: (order: Order) => void;
}

const COMMON_CITIES = [
  'Lahore',
  'Islamabad',
  'Rawalpindi',
  'Faisalabad',
  'Multan',
  'Gujranwala',
  'Sialkot',
  'Peshawar',
  'Karachi',
  'Other',
];

export const CheckoutModal: React.FC<CheckoutModalProps> = ({
  isOpen,
  onClose,
  onOrderSuccess,
}) => {
  const { cart, cartTotal, clearCart, directCheckoutItem, setDirectCheckoutItem } = useCart();

  const [customerName, setCustomerName] = useState('');
  const [phone, setPhone] = useState('');
  const [whatsappNumber, setWhatsappNumber] = useState('');
  const [sameAsPhone, setSameAsPhone] = useState(true);
  const [address, setAddress] = useState('');
  const [city, setCity] = useState('Lahore');
  const [customCity, setCustomCity] = useState('');
  const [notes, setNotes] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submittedOrder, setSubmittedOrder] = useState<Order | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  if (!isOpen) return null;

  const itemsToOrder = directCheckoutItem
    ? [
        {
          productId: directCheckoutItem.product.id,
          productName: directCheckoutItem.product.name,
          price: directCheckoutItem.product.price,
          quantity: directCheckoutItem.quantity,
          image: directCheckoutItem.product.images[0],
        },
      ]
    : cart.map((item) => ({
        productId: item.product.id,
        productName: item.product.name,
        price: item.product.price,
        quantity: item.quantity,
        image: item.product.images[0],
      }));

  const totalAmount = directCheckoutItem
    ? directCheckoutItem.product.price * directCheckoutItem.quantity
    : cartTotal;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!customerName.trim() || !phone.trim() || !address.trim()) {
      setError('Please enter your name, phone number, and address.');
      return;
    }

    if (itemsToOrder.length === 0) {
      setError('Your order is empty.');
      return;
    }

    setIsSubmitting(true);
    try {
      const selectedCity = city === 'Other' ? customCity || 'Other' : city;
      const finalWhatsApp = sameAsPhone ? phone : whatsappNumber || phone;

      const order = await api.createOrder({
        customerName: customerName.trim(),
        phone: phone.trim(),
        whatsappNumber: finalWhatsApp.trim(),
        address: address.trim(),
        city: selectedCity,
        notes: notes.trim(),
        items: itemsToOrder,
        totalAmount,
      });

      setSubmittedOrder(order);
      onOrderSuccess(order);

      if (!directCheckoutItem) {
        clearCart();
      } else {
        setDirectCheckoutItem(null);
      }
    } catch (err: any) {
      setError(err.message || 'Could not place order. Please try again or message us on WhatsApp.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCopyOrderNumber = (num: string) => {
    navigator.clipboard.writeText(num);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleWhatsAppConfirm = (order: Order) => {
    const text = encodeURIComponent(
      `Hello GR Furniture! I placed order #${order.orderNumber} for "${order.items
        .map((i) => i.productName)
        .join(', ')}" (Total: ${formatPKR(order.totalAmount)}). Please let me know the delivery time for ${order.city}.`
    );
    window.open(`https://wa.me/923446784419?text=${text}`, '_blank');
  };

  const handleClose = () => {
    setSubmittedOrder(null);
    setDirectCheckoutItem(null);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto flex items-center justify-center p-4 sm:p-6">
      {/* Backdrop */}
      <div
        onClick={handleClose}
        className="fixed inset-0 bg-stone-950/40 backdrop-blur-xs transition-opacity"
      />

      {/* Modal Container */}
      <div className="relative bg-[#FAF7F2] rounded-2xl max-w-lg w-full overflow-hidden shadow-xl z-10 border border-[#E8E1D7] flex flex-col max-h-[92vh]">
        {/* Header */}
        <div className="px-6 py-4 border-b border-[#E8E1D7] flex items-center justify-between bg-white">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg overflow-hidden border border-[#E8E1D7] bg-[#1E1712] shrink-0">
              <img
                src="/logo.png"
                alt="GR Furniture"
                className="w-full h-full object-cover"
                referrerPolicy="no-referrer"
              />
            </div>
            <div>
              <span className="text-[10px] uppercase tracking-[0.2em] text-[#8C7A6B] font-medium block">
                Cash On Delivery
              </span>
              <h2 className="text-base font-serif-luxury font-medium text-[#231B15]">
                {submittedOrder ? 'Order Confirmed' : 'Delivery Details'}
              </h2>
            </div>
          </div>
          <button
            onClick={handleClose}
            className="p-1 text-[#8C7A6B] hover:text-[#231B15] transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        {submittedOrder ? (
          <div className="p-6 sm:p-8 text-center space-y-6 overflow-y-auto">
            <div className="w-12 h-12 rounded-full bg-[#FAF7F2] border border-[#E8E1D7] flex items-center justify-center mx-auto text-[#6E4D2E]">
              <CheckCircle2 className="w-6 h-6 text-[#6E4D2E]" />
            </div>

            <div>
              <span className="text-xs uppercase tracking-wider text-[#8C7A6B]">
                Order Number
              </span>
              <div className="flex items-center justify-center gap-2 mt-1">
                <span className="text-2xl font-mono text-[#231B15] font-medium tracking-wider">
                  #{submittedOrder.orderNumber}
                </span>
                <button
                  onClick={() => handleCopyOrderNumber(submittedOrder.orderNumber)}
                  className="p-1 text-[#8C7A6B] hover:text-[#231B15] cursor-pointer"
                  title="Copy"
                >
                  {copied ? <Check className="w-4 h-4 text-[#6E4D2E]" /> : <Copy className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <p className="text-xs text-[#5C5046] leading-relaxed font-light">
              We received your order! We will call you on <strong>{submittedOrder.phone}</strong> to confirm the details and delivery date.
            </p>

            <div className="bg-white rounded-xl border border-[#E8E1D7] p-4 text-xs space-y-2 text-left shadow-2xs">
              <div className="flex justify-between py-1 border-b border-[#EFE9DF]">
                <span className="text-[#82756A]">Customer Name</span>
                <span className="text-[#231B15] font-medium">{submittedOrder.customerName}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-[#EFE9DF]">
                <span className="text-[#82756A]">City</span>
                <span className="text-[#231B15] font-medium">{submittedOrder.city}</span>
              </div>
              <div className="flex justify-between py-1">
                <span className="text-[#82756A]">Total (Pay on Delivery)</span>
                <span className="text-[#6E4D2E] font-medium font-serif-luxury text-sm">
                  {formatPKR(submittedOrder.totalAmount)}
                </span>
              </div>
            </div>

            <div className="pt-2 space-y-3">
              <button
                onClick={() => handleWhatsAppConfirm(submittedOrder)}
                className="w-full py-3 px-4 rounded-full bg-[#25D366] hover:bg-[#20BD5A] active:bg-[#1DA851] text-white text-xs sm:text-sm font-medium transition-colors flex items-center justify-center gap-2 cursor-pointer shadow-sm"
              >
                <WhatsAppIcon className="w-4 h-4 text-white" />
                <span>Confirm on WhatsApp</span>
              </button>

              <button
                onClick={handleClose}
                className="w-full py-2.5 text-xs text-[#82756A] hover:text-[#231B15] transition-colors cursor-pointer"
              >
                Back to Furniture
              </button>
            </div>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 space-y-4">
            {error && (
              <div className="p-3 bg-red-50 border border-red-200 text-red-700 text-xs rounded-lg">
                {error}
              </div>
            )}

            {/* Summary */}
            <div className="bg-white rounded-xl p-4 border border-[#E8E1D7] space-y-2 shadow-2xs">
              <div className="flex items-baseline justify-between text-xs pb-2 border-b border-[#EFE9DF]">
                <span className="text-[#82756A] font-light">{itemsToOrder.length} item{itemsToOrder.length > 1 ? 's' : ''}</span>
                <span className="text-[#6E4D2E] font-semibold">{formatPKR(totalAmount)}</span>
              </div>
              <div className="max-h-24 overflow-y-auto space-y-1 pt-1">
                {itemsToOrder.map((item, i) => (
                  <div key={i} className="flex justify-between text-xs text-[#5C5046]">
                    <span className="truncate max-w-[240px]">{item.productName} × {item.quantity}</span>
                    <span className="text-[#231B15] font-medium">{formatPKR(item.price * item.quantity)}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Form Fields */}
            <div className="space-y-3 text-left">
              <div>
                <label className="block text-xs text-[#4A3E36] font-medium mb-1">
                  Your Full Name *
                </label>
                <input
                  type="text"
                  required
                  value={customerName}
                  onChange={(e) => setCustomerName(e.target.value)}
                  placeholder="Enter your name"
                  className="w-full px-3.5 py-2 text-xs sm:text-sm bg-white border border-[#E8E1D7] rounded-xl text-[#231B15] focus:outline-hidden focus:border-[#6E4D2E]"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs text-[#4A3E36] font-medium mb-1">
                    Phone Number *
                  </label>
                  <input
                    type="tel"
                    required
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="0300 1234567"
                    className="w-full px-3.5 py-2 text-xs sm:text-sm bg-white border border-[#E8E1D7] rounded-xl text-[#231B15] focus:outline-hidden focus:border-[#6E4D2E]"
                  />
                </div>

                <div>
                  <label className="block text-xs text-[#4A3E36] font-medium mb-1">
                    WhatsApp Number
                  </label>
                  <input
                    type="tel"
                    disabled={sameAsPhone}
                    value={sameAsPhone ? phone : whatsappNumber}
                    onChange={(e) => setWhatsappNumber(e.target.value)}
                    placeholder="0344 6784419"
                    className="w-full px-3.5 py-2 text-xs sm:text-sm bg-white border border-[#E8E1D7] rounded-xl text-[#231B15] focus:outline-hidden focus:border-[#6E4D2E] disabled:opacity-50"
                  />
                  <label className="flex items-center gap-1.5 mt-1 text-[11px] text-[#82756A] cursor-pointer">
                    <input
                      type="checkbox"
                      checked={sameAsPhone}
                      onChange={(e) => setSameAsPhone(e.target.checked)}
                      className="accent-[#6E4D2E]"
                    />
                    <span>Same as phone</span>
                  </label>
                </div>
              </div>

              <div>
                <label className="block text-xs text-[#4A3E36] font-medium mb-1">
                  Delivery City *
                </label>
                <div className="flex flex-wrap gap-1.5 mb-2">
                  {COMMON_CITIES.map((c) => (
                    <button
                      key={c}
                      type="button"
                      onClick={() => setCity(c)}
                      className={`text-xs px-3 py-1 rounded-full border transition-colors cursor-pointer ${
                        city === c
                          ? 'bg-[#6E4D2E] text-white border-[#6E4D2E] font-medium shadow-xs'
                          : 'bg-white text-[#5C5046] border-[#E8E1D7] hover:border-[#6E4D2E]'
                      }`}
                    >
                      {c}
                    </button>
                  ))}
                </div>
                {city === 'Other' && (
                  <input
                    type="text"
                    required
                    value={customCity}
                    onChange={(e) => setCustomCity(e.target.value)}
                    placeholder="Enter city name"
                    className="w-full px-3.5 py-2 text-xs sm:text-sm bg-white border border-[#E8E1D7] rounded-xl text-[#231B15] focus:outline-hidden focus:border-[#6E4D2E]"
                  />
                )}
              </div>

              <div>
                <label className="block text-xs text-[#4A3E36] font-medium mb-1">
                  Delivery Address *
                </label>
                <textarea
                  required
                  rows={2}
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  placeholder="House number, Street, Area name"
                  className="w-full px-3.5 py-2 text-xs sm:text-sm bg-white border border-[#E8E1D7] rounded-xl text-[#231B15] focus:outline-hidden focus:border-[#6E4D2E]"
                />
              </div>

              <div>
                <label className="block text-xs text-[#4A3E36] font-medium mb-1">
                  Special Notes (Optional)
                </label>
                <input
                  type="text"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="e.g., Wood color, fabric color, or special size"
                  className="w-full px-3.5 py-2 text-xs sm:text-sm bg-white border border-[#E8E1D7] rounded-xl text-[#231B15] focus:outline-hidden focus:border-[#6E4D2E]"
                />
              </div>
            </div>

            {/* Submit */}
            <div className="pt-2">
              <button
                id="submit-order-btn"
                type="submit"
                disabled={isSubmitting}
                className="w-full py-3.5 px-4 rounded-full bg-[#6E4D2E] hover:bg-[#583B20] text-white text-xs sm:text-sm font-medium disabled:opacity-50 transition-colors flex items-center justify-center gap-2 cursor-pointer shadow-xs"
              >
                {isSubmitting ? (
                  <span>Placing Order...</span>
                ) : (
                  <>
                    <span>Place Order ({formatPKR(totalAmount)})</span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};
