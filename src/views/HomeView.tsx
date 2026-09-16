import React from 'react';
import { HeroSlider } from '../components/HeroSlider';
import { CategorySlider } from '../components/CategorySlider';
import { FeaturedSlider } from '../components/FeaturedSlider';
import { CustomerReviewsSlider } from '../components/CustomerReviewsSlider';
import { WhyChooseUs } from '../components/WhyChooseUs';
import { LocalSEOSection } from '../components/LocalSEOSection';
import { Product, Category } from '../types';
import { ArrowRight } from 'lucide-react';

interface HomeViewProps {
  products: Product[];
  categories: Category[];
  onSelectProduct: (product: Product) => void;
  onQuickOrder: (product: Product) => void;
  onNavigateToShop: (category?: string) => void;
}

export const HomeView: React.FC<HomeViewProps> = ({
  products,
  categories,
  onSelectProduct,
  onQuickOrder,
  onNavigateToShop,
}) => {
  return (
    <div className="space-y-0 bg-[#FAF7F2]">
      {/* 1. Showroom Hero */}
      <HeroSlider
        onShopClick={(cat) => onNavigateToShop(cat || 'all')}
        onExploreCategories={() => {
          document.getElementById('categories-section')?.scrollIntoView({ behavior: 'smooth' });
        }}
      />

      {/* 2. Curated Categories */}
      <CategorySlider
        categories={categories}
        onSelectCategory={(catId) => onNavigateToShop(catId)}
      />

      {/* 3. Signature Pieces */}
      <FeaturedSlider
        products={products}
        onSelectProduct={onSelectProduct}
        onQuickOrder={onQuickOrder}
        onNavigateToShop={onNavigateToShop}
      />

      {/* 4. Lahore Authority, Workshop Verification & Local SEO FAQ */}
      <LocalSEOSection />

      {/* 5. Artisanal Standards */}
      <WhyChooseUs />

      {/* 6. Client Testimonials */}
      <CustomerReviewsSlider />

      {/* 7. Bespoke Commission Invitation */}
      <section className="py-16 sm:py-24 bg-[#F4EFEA] border-b border-[#E8E1D7]">
        <div className="max-w-4xl mx-auto px-6 sm:px-8 text-center space-y-5">
          <span className="text-[11px] uppercase tracking-[0.2em] text-[#8C7A6B] font-medium block">
            Bespoke Services • کسٹم فرنیچر
          </span>

          <h2 className="text-2xl sm:text-4xl font-serif-luxury font-normal text-[#231B15] tracking-tight">
            Commission a Custom Piece
          </h2>

          <p className="text-sm sm:text-base text-[#5C5046] max-w-xl mx-auto leading-relaxed font-light">
            Share your room measurements, design references, or fabric preferences. Our Lahore workshop crafts custom dimensions in solid seasoned timber.
          </p>

          <div className="pt-3 flex items-center justify-center">
            <button
              onClick={() => onNavigateToShop('all')}
              className="px-7 py-3.5 rounded-full bg-[#6E4D2E] hover:bg-[#583B20] text-white text-xs sm:text-sm font-medium tracking-wide transition-all inline-flex items-center gap-2 cursor-pointer shadow-xs active:scale-98"
            >
              <span>Explore All Furniture</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </section>
    </div>
  );
};

