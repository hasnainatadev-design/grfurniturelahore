import React, { useRef, useState, useEffect } from 'react';
import { ProductCard } from './ProductCard';
import { Product } from '../types';
import { ChevronLeft, ChevronRight, ArrowRight } from 'lucide-react';

interface FeaturedSliderProps {
  products: Product[];
  onSelectProduct: (product: Product) => void;
  onQuickOrder: (product: Product) => void;
  onNavigateToShop: (category?: string) => void;
}

export const FeaturedSlider: React.FC<FeaturedSliderProps> = ({
  products,
  onSelectProduct,
  onQuickOrder,
  onNavigateToShop,
}) => {
  const [featuredTab, setFeaturedTab] = useState<string>('all');
  const scrollRef = useRef<HTMLDivElement>(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(true);

  const featuredProducts = products.filter((p) => {
    if (featuredTab === 'all') return p.isFeatured;
    return p.category === featuredTab;
  });

  const displayProducts =
    featuredProducts.length > 0
      ? featuredProducts
      : products.filter((p) => featuredTab === 'all' || p.category === featuredTab);

  const checkScroll = () => {
    if (scrollRef.current) {
      const { scrollLeft, scrollWidth, clientWidth } = scrollRef.current;
      setCanScrollLeft(scrollLeft > 10);
      setCanScrollRight(scrollLeft < scrollWidth - clientWidth - 10);
    }
  };

  useEffect(() => {
    checkScroll();
  }, [displayProducts]);

  const slide = (direction: 'left' | 'right') => {
    if (scrollRef.current) {
      const scrollDist = scrollRef.current.clientWidth * 0.75;
      scrollRef.current.scrollBy({
        left: direction === 'left' ? -scrollDist : scrollDist,
        behavior: 'smooth',
      });
      setTimeout(checkScroll, 350);
    }
  };

  return (
    <section className="py-16 sm:py-24 bg-white border-b border-[#E8E1D7]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="flex flex-col sm:flex-row sm:items-end justify-between mb-8 sm:mb-12 gap-4">
          <div>
            <span className="text-[11px] uppercase tracking-[0.2em] text-[#8C7A6B] font-medium block mb-1">
              Popular Choices
            </span>
            <h2 className="text-2xl sm:text-3xl md:text-4xl font-normal font-serif-luxury text-[#231B15] tracking-tight">
              Featured Furniture
            </h2>
          </div>

          {/* Clean Filter Tabs & Slide Arrows */}
          <div className="flex items-center gap-3 self-end sm:self-auto">
            <div className="flex items-center gap-1 bg-[#F5EFE6] p-1 rounded-full border border-[#E8E1D7]">
              {[
                { id: 'all', label: 'All' },
                { id: 'beds', label: 'Beds' },
                { id: 'sofas', label: 'Sofas' },
                { id: 'dining-tables', label: 'Dining' },
              ].map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setFeaturedTab(tab.id)}
                  className={`text-xs px-3.5 py-1.5 rounded-full font-medium transition-all cursor-pointer ${
                    featuredTab === tab.id
                      ? 'bg-[#6E4D2E] text-white shadow-xs'
                      : 'text-[#6A5E54] hover:text-[#231B15]'
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>

            <div className="hidden sm:flex items-center gap-1.5">
              <button
                onClick={() => slide('left')}
                disabled={!canScrollLeft}
                className="w-8 h-8 rounded-full border border-[#E8E1D7] bg-white text-[#4A3E36] hover:text-[#231B15] hover:border-[#C4B29E] disabled:opacity-30 disabled:cursor-not-allowed flex items-center justify-center transition-all cursor-pointer shadow-2xs"
                aria-label="Previous items"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <button
                onClick={() => slide('right')}
                disabled={!canScrollRight}
                className="w-8 h-8 rounded-full border border-[#E8E1D7] bg-white text-[#4A3E36] hover:text-[#231B15] hover:border-[#C4B29E] disabled:opacity-30 disabled:cursor-not-allowed flex items-center justify-center transition-all cursor-pointer shadow-2xs"
                aria-label="Next items"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>

        {/* Horizontal Track */}
        <div
          ref={scrollRef}
          onScroll={checkScroll}
          className="flex gap-5 sm:gap-6 overflow-x-auto pb-4 scrollbar-none momentum-scroll snap-x snap-mandatory"
        >
          {displayProducts.map((product) => (
            <div
              key={product.id}
              className="flex-none w-[70vw] sm:w-[38vw] md:w-[28vw] lg:w-[22vw] snap-start"
            >
              <ProductCard
                product={product}
                onSelectProduct={onSelectProduct}
                onQuickOrder={onQuickOrder}
              />
            </div>
          ))}
        </div>

        {/* View All Collection Link */}
        <div className="mt-12 text-center">
          <button
            onClick={() => onNavigateToShop('all')}
            className="inline-flex items-center gap-2 px-6 py-2.5 rounded-full border border-[#CBB9A3] text-[#5C3E21] hover:border-[#6E4D2E] hover:bg-[#6E4D2E] hover:text-white transition-all text-xs sm:text-sm font-medium cursor-pointer shadow-2xs"
          >
            <span>View All Furniture</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </section>
  );
};
