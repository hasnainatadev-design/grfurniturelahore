import React from 'react';
import { Product } from '../types';
import { formatPKR } from '../context/CartContext';
import { ArrowRight } from 'lucide-react';

interface ProductCardProps {
  product: Product;
  onSelectProduct: (product: Product) => void;
  onQuickOrder: (product: Product) => void;
}

export const ProductCard: React.FC<ProductCardProps> = ({
  product,
  onSelectProduct,
  onQuickOrder,
}) => {
  const imageUrl =
    product.images && product.images.length > 0
      ? product.images[0]
      : 'https://images.unsplash.com/photo-1555041469-a586c61ea9bc?auto=format&fit=crop&w=1200&q=80';

  return (
    <div
      id={`product-card-${product.id}`}
      onClick={() => onSelectProduct(product)}
      className="group bg-white rounded-2xl border border-[#E8E1D7] hover:border-[#C4B29E] overflow-hidden transition-all duration-300 flex flex-col justify-between cursor-pointer shadow-xs hover:shadow-sm"
    >
      {/* Furniture Image */}
      <div className="relative aspect-4/3 sm:aspect-1/1 w-full bg-[#F5EFE6] overflow-hidden">
        <img
          src={imageUrl}
          alt={`${product.name} - Handcrafted Furniture in Lahore | GR Furniture`}
          loading="lazy"
          decoding="async"
          className="w-full h-full object-cover object-center group-hover:scale-103 transition-transform duration-700 ease-out"
        />
      </div>

      {/* Card Info */}
      <div className="p-4 sm:p-5 flex-1 flex flex-col justify-between">
        <div>
          <span className="text-[11px] uppercase tracking-wider text-[#8C7A6B] font-medium block mb-1">
            {product.category.replace('-', ' ')}
          </span>
          <h3 className="text-sm sm:text-base font-medium font-serif-luxury text-[#231B15] group-hover:text-[#6E4D2E] transition-colors line-clamp-1">
            {product.name}
          </h3>
        </div>

        {/* Price & Single Clear CTA */}
        <div className="mt-4 pt-3 border-t border-[#EFE9DF] flex items-center justify-between gap-2">
          <div>
            <span className="text-sm sm:text-base font-semibold text-[#5C3E21]">
              {formatPKR(product.price)}
            </span>
          </div>

          <button
            onClick={(e) => {
              e.stopPropagation();
              onQuickOrder(product);
            }}
            className="px-3.5 py-1.5 rounded-lg bg-[#6E4D2E] hover:bg-[#583B20] text-white text-xs font-medium tracking-wide transition-all cursor-pointer flex items-center gap-1 active:scale-98 shadow-2xs"
          >
            <span>Order</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </div>
  );
};

