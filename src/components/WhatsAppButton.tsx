import React from 'react';
import { WhatsAppIcon } from './WhatsAppIcon';

interface WhatsAppButtonProps {
  productName?: string;
  price?: number;
}

export const WhatsAppButton: React.FC<WhatsAppButtonProps> = ({ productName, price }) => {
  const handleClick = () => {
    let text = 'Hello GR Furniture, I would like to know more about your furniture.';
    if (productName) {
      text = `Hello GR Furniture, I want to ask about "${productName}"${
        price ? ` (Rs. ${price.toLocaleString()})` : ''
      }. Please share pictures, colors, and delivery time.`;
    }
    const encoded = encodeURIComponent(text);
    window.open(`https://wa.me/923446784419?text=${encoded}`, '_blank');
  };

  return (
    <div
      id="floating-whatsapp-container"
      className="fixed bottom-20 md:bottom-8 right-4 sm:right-6 md:right-8 z-30 flex items-center gap-2.5 group"
    >
      <div className="hidden sm:flex items-center gap-2 bg-white text-[#231B15] text-xs font-medium px-3.5 py-1.5 rounded-full border border-[#E8E1D7] shadow-md opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
        <span className="w-2 h-2 rounded-full bg-[#25D366] animate-pulse" />
        <span>Chat on WhatsApp</span>
      </div>

      <button
        id="floating-whatsapp-btn"
        onClick={handleClick}
        className="w-12 h-12 sm:w-14 sm:h-14 rounded-full bg-[#25D366] hover:bg-[#20BD5A] active:bg-[#1DA851] text-white flex items-center justify-center shadow-[0_4px_16px_rgba(37,211,102,0.45)] hover:shadow-[0_6px_22px_rgba(37,211,102,0.6)] transition-all duration-200 hover:scale-105 active:scale-95 cursor-pointer"
        aria-label="Chat with GR Furniture on WhatsApp"
        title="Chat with GR Furniture on WhatsApp (03446784419)"
      >
        <WhatsAppIcon className="w-6 h-6 sm:w-8 sm:h-8 text-white drop-shadow-xs" />
      </button>
    </div>
  );
};
