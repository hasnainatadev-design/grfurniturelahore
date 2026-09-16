import React, { useState, useEffect } from 'react';
import { Product } from '../types';
import { formatPKR, useCart } from '../context/CartContext';
import { WhatsAppIcon } from '../components/WhatsAppIcon';
import {
  ChevronLeft,
  ChevronRight,
  Check,
  ShoppingBag,
  Maximize2,
  X,
} from 'lucide-react';

interface ProductDetailViewProps {
  product: Product;
  onBack: () => void;
  onSelectProduct: (product: Product) => void;
  onQuickOrder: (product: Product) => void;
  allProducts: Product[];
  onNavigateToCategory?: (category: string) => void;
}

export const ProductDetailView: React.FC<ProductDetailViewProps> = ({
  product,
  onBack,
  onSelectProduct,
  onQuickOrder,
  allProducts,
  onNavigateToCategory,
}) => {
  const { addToCart } = useCart();
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);
  const [quantity, setQuantity] = useState(1);
  const [addedNotice, setAddedNotice] = useState(false);
  const [isLightboxOpen, setIsLightboxOpen] = useState(false);

  const images =
    product.images && product.images.length > 0
      ? product.images
      : ['https://images.unsplash.com/photo-1555041469-a586c61ea9bc?auto=format&fit=crop&w=1400&q=80'];

  const categoryName = product.category ? product.category.replace(/-/g, ' ') : 'Furniture';

  const handleNextImage = () => {
    setSelectedImageIndex((prev) => (prev + 1) % images.length);
  };

  const handlePrevImage = () => {
    setSelectedImageIndex((prev) => (prev - 1 + images.length) % images.length);
  };

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'ArrowRight') handleNextImage();
      if (e.key === 'ArrowLeft') handlePrevImage();
      if (e.key === 'Escape' && isLightboxOpen) setIsLightboxOpen(false);
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [images.length, isLightboxOpen]);

  const handleAddToCart = () => {
    addToCart(product, quantity);
    setAddedNotice(true);
    setTimeout(() => setAddedNotice(false), 2000);
  };

  const handleWhatsAppContact = () => {
    const msg = encodeURIComponent(
      `Hello GR Furniture, I would like to inquire about "${product.name}" (${formatPKR(
        product.price
      )}), including custom dimensions and fabric swatches.`
    );
    window.open(`https://wa.me/923446784419?text=${msg}`, '_blank');
  };

  const relatedProducts = allProducts
    .filter((p) => p.category === product.category && p.id !== product.id)
    .slice(0, 4);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-12 bg-[#FAF7F2]">
      {/* Breadcrumb Navigation (SEO & Internal Linking) */}
      <nav aria-label="Breadcrumb" className="mb-6 sm:mb-8 flex items-center flex-wrap gap-2 text-xs text-[#82756A]">
        <button
          onClick={onBack}
          className="hover:text-[#231B15] transition-colors inline-flex items-center gap-1 cursor-pointer"
        >
          <ChevronLeft className="w-3.5 h-3.5" />
          <span>Home</span>
        </button>
        <span className="text-[#C4B29E]">/</span>
        <button
          onClick={() => onNavigateToCategory ? onNavigateToCategory(product.category) : onBack()}
          className="capitalize hover:text-[#231B15] transition-colors cursor-pointer"
        >
          {categoryName}
        </button>
        <span className="text-[#C4B29E]">/</span>
        <span className="text-[#231B15] font-medium truncate max-w-[200px] sm:max-w-xs" aria-current="page">
          {product.name}
        </span>
      </nav>

      {/* Product Display Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-16 items-start">
        {/* Left: Image Gallery */}
        <div className="lg:col-span-7 space-y-4">
          <div className="relative aspect-4/3 sm:aspect-16/11 bg-[#F5EFE6] rounded-2xl overflow-hidden border border-[#E8E1D7] shadow-2xs">
            <img
              src={images[selectedImageIndex]}
              alt={`${product.name} - Handcrafted Solid Wood Furniture Lahore | GR Furniture Pakistan`}
              decoding="async"
              className="w-full h-full object-cover object-center"
            />

            {/* Subtle Controls */}
            {images.length > 1 && (
              <>
                <button
                  type="button"
                  onClick={handlePrevImage}
                  className="absolute left-3 top-1/2 -translate-y-1/2 w-9 h-9 rounded-full bg-white/90 hover:bg-[#6E4D2E] hover:text-white text-[#3B3128] flex items-center justify-center transition-all cursor-pointer shadow-xs"
                  aria-label="Previous image"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
                <button
                  type="button"
                  onClick={handleNextImage}
                  className="absolute right-3 top-1/2 -translate-y-1/2 w-9 h-9 rounded-full bg-white/90 hover:bg-[#6E4D2E] hover:text-white text-[#3B3128] flex items-center justify-center transition-all cursor-pointer shadow-xs"
                  aria-label="Next image"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              </>
            )}

            <button
              type="button"
              onClick={() => setIsLightboxOpen(true)}
              className="absolute bottom-3 right-3 p-2 rounded-full bg-white/90 hover:bg-[#6E4D2E] hover:text-white text-[#3B3128] transition-all cursor-pointer shadow-xs"
              title="Expand view"
            >
              <Maximize2 className="w-4 h-4" />
            </button>
          </div>

          {/* Minimal Thumbnails */}
          {images.length > 1 && (
            <div className="flex items-center gap-3 overflow-x-auto pb-2 scrollbar-none">
              {images.map((img, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => setSelectedImageIndex(idx)}
                  className={`relative aspect-4/3 w-20 rounded-xl overflow-hidden border transition-all cursor-pointer shrink-0 ${
                    selectedImageIndex === idx
                      ? 'border-[#6E4D2E] opacity-100 ring-2 ring-[#6E4D2E]'
                      : 'border-[#E8E1D7] opacity-65 hover:opacity-100'
                  }`}
                >
                  <img
                    src={img}
                    alt={`${product.name} angle view ${idx + 1}`}
                    loading="lazy"
                    decoding="async"
                    className="w-full h-full object-cover"
                  />
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Right: Details & Purchase */}
        <div className="lg:col-span-5 space-y-6">
          <div>
            <div className="flex items-center gap-2 mb-1.5">
              <span className="text-[11px] uppercase tracking-[0.2em] text-[#8C7A6B] font-medium block">
                GR Furniture Lahore
              </span>
              <span className="inline-block px-2 py-0.5 rounded-full bg-[#EAE0D2] text-[#6E4D2E] text-[10px] font-medium">
                لاہور میں فرنیچر
              </span>
            </div>

            <h1 className="text-2xl sm:text-3xl font-serif-luxury font-normal text-[#231B15] tracking-tight">
              {product.name}
            </h1>
            <div className="mt-3 flex items-baseline gap-3">
              <span className="text-2xl font-medium text-[#231B15] font-serif-luxury">
                {formatPKR(product.price)}
              </span>
              {product.originalPrice && product.originalPrice > product.price && (
                <span className="text-sm text-[#9E9083] line-through">
                  {formatPKR(product.originalPrice)}
                </span>
              )}
            </div>
          </div>

          <p className="text-[#5C5046] text-sm leading-relaxed font-light">
            {product.description}
          </p>

          {/* Clean Specifications Table */}
          <div className="border-t border-b border-[#E8E1D7] py-4 space-y-2 text-xs">
            <div className="flex justify-between py-1">
              <span className="text-[#82756A] font-normal">Material</span>
              <span className="text-[#231B15] font-medium">{product.material || 'Solid Seasoned Wood'}</span>
            </div>
            {product.dimensions && (
              <div className="flex justify-between py-1">
                <span className="text-[#82756A] font-normal">Size / Dimensions</span>
                <span className="text-[#231B15] font-medium">{product.dimensions}</span>
              </div>
            )}
            <div className="flex justify-between py-1">
              <span className="text-[#82756A] font-normal">Made In</span>
              <span className="text-[#231B15] font-medium">Lahore, Punjab, Pakistan</span>
            </div>
            <div className="flex justify-between py-1">
              <span className="text-[#82756A] font-normal">Delivery</span>
              <span className="text-[#231B15] font-medium">Doorstep in Lahore (DHA, Bahria, Gulberg)</span>
            </div>
            <div className="flex justify-between py-1">
              <span className="text-[#82756A] font-normal">Guarantee</span>
              <span className="text-[#231B15] font-medium">10 Years Wood Structure Guarantee</span>
            </div>
          </div>

          {/* Quantity & Order Actions */}
          <div className="space-y-3 pt-2">
            <div className="flex items-center gap-3">
              <span className="text-xs text-[#5C5046]">Quantity</span>
              <div className="flex items-center border border-[#E8E1D7] rounded-lg bg-white">
                <button
                  type="button"
                  onClick={() => setQuantity(Math.max(1, quantity - 1))}
                  className="px-3 py-1 text-sm text-[#5C5046] hover:text-[#231B15] cursor-pointer"
                >
                  -
                </button>
                <span className="px-3 py-1 text-xs font-medium text-[#231B15]">{quantity}</span>
                <button
                  type="button"
                  onClick={() => setQuantity(quantity + 1)}
                  className="px-3 py-1 text-sm text-[#5C5046] hover:text-[#231B15] cursor-pointer"
                >
                  +
                </button>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row gap-3 pt-2">
              <button
                type="button"
                onClick={() => onQuickOrder(product)}
                className="flex-1 py-3 px-5 rounded-full bg-[#6E4D2E] hover:bg-[#583B20] text-white text-xs sm:text-sm font-medium transition-colors cursor-pointer text-center shadow-xs"
              >
                Order Now (Cash on Delivery)
              </button>

              <button
                type="button"
                onClick={handleAddToCart}
                className="py-3 px-5 rounded-full border border-[#6E4D2E] text-[#6E4D2E] hover:bg-[#F5EFE6] text-xs sm:text-sm font-medium transition-colors cursor-pointer flex items-center justify-center gap-2"
              >
                {addedNotice ? (
                  <>
                    <Check className="w-4 h-4 text-emerald-600" />
                    <span>Added to Order</span>
                  </>
                ) : (
                  <>
                    <ShoppingBag className="w-4 h-4" />
                    <span>Add to Order</span>
                  </>
                )}
              </button>
            </div>

            <div className="pt-2 text-center">
              <button
                type="button"
                onClick={handleWhatsAppContact}
                className="text-xs text-[#6E4D2E] hover:text-[#583B20] inline-flex items-center gap-1.5 underline underline-offset-4 cursor-pointer"
              >
                <WhatsAppIcon className="w-3.5 h-3.5 text-[#25D366]" />
                <span>Ask about custom sizes or colors on WhatsApp (0344 6784419)</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Lightbox Modal */}
      {isLightboxOpen && (
        <div className="fixed inset-0 z-50 bg-[#1E1712]/92 backdrop-blur-xs flex flex-col justify-between p-4 sm:p-8">
          <div className="flex items-center justify-between text-white">
            <span className="text-xs tracking-wider uppercase text-[#D8CEBE] font-mono">
              {selectedImageIndex + 1} / {images.length}
            </span>
            <button
              type="button"
              onClick={() => setIsLightboxOpen(false)}
              className="p-2 text-[#A89C8F] hover:text-white cursor-pointer"
            >
              <X className="w-6 h-6" />
            </button>
          </div>

          <div className="flex-1 flex items-center justify-center my-4">
            <img
              src={images[selectedImageIndex]}
              alt={product.name}
              className="max-h-[80vh] max-w-full object-contain rounded-lg shadow-xl"
            />
          </div>

          {images.length > 1 && (
            <div className="flex items-center justify-center gap-2 py-2">
              <button
                type="button"
                onClick={handlePrevImage}
                className="p-2 text-[#A89C8F] hover:text-white cursor-pointer"
              >
                <ChevronLeft className="w-5 h-5" />
              </button>
              <button
                type="button"
                onClick={handleNextImage}
                className="p-2 text-[#A89C8F] hover:text-white cursor-pointer"
              >
                <ChevronRight className="w-5 h-5" />
              </button>
            </div>
          )}
        </div>
      )}

      {/* Related Collection */}
      {relatedProducts.length > 0 && (
        <div className="mt-20 pt-12 border-t border-[#E8E1D7]">
          <h2 className="text-xl sm:text-2xl font-serif-luxury font-normal text-[#231B15] mb-8">
            Similar Furniture
          </h2>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 sm:gap-6">
            {relatedProducts.map((prod) => (
              <div
                key={prod.id}
                onClick={() => {
                  onSelectProduct(prod);
                  window.scrollTo({ top: 0, behavior: 'smooth' });
                }}
                className="group cursor-pointer space-y-2"
              >
                <div className="aspect-4/3 rounded-xl overflow-hidden bg-[#F5EFE6] border border-[#E8E1D7]">
                  <img
                    src={prod.images[0]}
                    alt={prod.name}
                    className="w-full h-full object-cover group-hover:scale-103 transition-transform duration-500"
                  />
                </div>
                <div>
                  <h3 className="text-xs sm:text-sm font-medium text-[#231B15] truncate">
                    {prod.name}
                  </h3>
                  <span className="text-xs text-[#6E4D2E] font-medium block mt-0.5">
                    {formatPKR(prod.price)}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
