import React, { useState, useEffect } from 'react';
import { ArrowRight, ChevronLeft, ChevronRight } from 'lucide-react';

interface HeroSliderProps {
  onShopClick: (category?: string) => void;
  onExploreCategories: () => void;
}

interface SlideItem {
  id: string;
  kicker: string;
  title: string;
  description: string;
  category: string;
  image: string;
}

const SLIDES: SlideItem[] = [
  {
    id: 'slide-1',
    kicker: 'Solid Wood Furniture',
    title: 'Handmade Bed Sets',
    description:
      'Made from solid Sheesham wood with comfortable padding in our Lahore workshop.',
    category: 'beds',
    image: 'https://images.unsplash.com/photo-1616486338812-3dadae4b4ace?auto=format&fit=crop&w=1800&q=80',
  },
  {
    id: 'slide-2',
    kicker: 'Comfortable Sofas',
    title: 'Luxury Velvet Sofas',
    description:
      'Soft Turkish velvet fabric with durable foam cushions for your living room.',
    category: 'sofas',
    image: 'https://images.unsplash.com/photo-1555041469-a586c61ea9bc?auto=format&fit=crop&w=1800&q=80',
  },
  {
    id: 'slide-3',
    kicker: 'Dining Room Sets',
    title: 'Marble Dining Tables',
    description:
      'Solid wood dining sets with smooth marble tops and matching comfortable chairs.',
    category: 'dining-tables',
    image: 'https://images.unsplash.com/photo-1617806118233-18e1de247200?auto=format&fit=crop&w=1800&q=80',
  },
];

export const HeroSlider: React.FC<HeroSliderProps> = ({ onShopClick }) => {
  const [currentSlide, setCurrentSlide] = useState(0);
  const [touchStartX, setTouchStartX] = useState<number | null>(null);

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % SLIDES.length);
    }, 3800);
    return () => clearInterval(interval);
  }, [currentSlide]);

  const goToNext = () => {
    setCurrentSlide((prev) => (prev + 1) % SLIDES.length);
  };

  const goToPrev = () => {
    setCurrentSlide((prev) => (prev - 1 + SLIDES.length) % SLIDES.length);
  };

  const handleTouchStart = (e: React.TouchEvent) => {
    setTouchStartX(e.touches[0].clientX);
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    if (touchStartX === null) return;
    const touchEndX = e.changedTouches[0].clientX;
    const diff = touchStartX - touchEndX;
    if (Math.abs(diff) > 40) {
      if (diff > 0) {
        goToNext();
      } else {
        goToPrev();
      }
    }
    setTouchStartX(null);
  };

  const current = SLIDES[currentSlide];

  return (
    <section
      id="hero-slider-section"
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
      className="relative overflow-hidden bg-[#1E1712] text-white min-h-[480px] sm:min-h-[540px] md:min-h-[580px] flex items-center select-none"
      aria-label="Showroom Showcase"
    >
      {/* Background Slide Image with Crossfade */}
      <div className="absolute inset-0">
        {SLIDES.map((slide, index) => (
          <div
            key={slide.id}
            className={`absolute inset-0 transition-opacity duration-700 ease-in-out ${
              index === currentSlide ? 'opacity-100' : 'opacity-0 pointer-events-none'
            }`}
          >
            <img
              src={slide.image}
              alt={slide.title}
              className="w-full h-full object-cover object-center"
            />
            {/* Elegant warm mocha dark overlay */}
            <div className="absolute inset-0 bg-[#1E1712]/65 sm:bg-[#1E1712]/55" />
          </div>
        ))}
      </div>

      {/* Main Slide Content */}
      <div className="relative z-10 max-w-7xl mx-auto px-6 sm:px-8 lg:px-12 py-16 sm:py-24 w-full">
        <div className="max-w-2xl space-y-4 sm:space-y-6 text-left">
          <span className="text-[11px] sm:text-xs uppercase tracking-[0.2em] text-[#C4A882] font-medium block">
            {current.kicker}
          </span>

          <h1 className="text-3xl sm:text-5xl lg:text-6xl font-serif-luxury font-normal text-white tracking-tight leading-[1.15]">
            {current.title}
          </h1>

          <p className="text-[#E0D7CD] text-sm sm:text-base leading-relaxed max-w-lg font-light">
            {current.description}
          </p>

          <div className="pt-2 flex items-center gap-4">
            <button
              onClick={() => onShopClick(current.category)}
              className="px-6 sm:px-7 py-3 sm:py-3.5 rounded-full bg-[#FAF7F2] text-[#231B15] hover:bg-[#6E4D2E] hover:text-white text-xs sm:text-sm font-medium tracking-wide transition-all cursor-pointer flex items-center gap-2 active:scale-98 shadow-md"
            >
              <span>View Furniture</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Understated Slide Controls */}
      <div className="absolute bottom-6 right-6 sm:right-12 z-20 flex items-center gap-2">
        <button
          onClick={goToPrev}
          aria-label="Previous slide"
          className="w-9 h-9 rounded-full bg-white/10 hover:bg-[#6E4D2E] text-white flex items-center justify-center transition-colors cursor-pointer"
        >
          <ChevronLeft className="w-4 h-4" />
        </button>
        <div className="text-xs font-mono text-[#C4B7A7] px-1">
          0{currentSlide + 1} / 0{SLIDES.length}
        </div>
        <button
          onClick={goToNext}
          aria-label="Next slide"
          className="w-9 h-9 rounded-full bg-white/10 hover:bg-[#6E4D2E] text-white flex items-center justify-center transition-colors cursor-pointer"
        >
          <ChevronRight className="w-4 h-4" />
        </button>
      </div>
    </section>
  );
};
