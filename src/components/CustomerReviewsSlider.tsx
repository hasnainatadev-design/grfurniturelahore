import React, { useState, useEffect } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';

interface Review {
  id: string;
  author: string;
  city: string;
  furnitureBought: string;
  comment: string;
  image?: string;
}

const REVIEWS: Review[] = [
  {
    id: 'r1',
    author: 'Brigadier (R) Salman Raza',
    city: 'DHA Phase 6, Lahore',
    furnitureBought: 'Royal Sheesham Master Bed',
    comment:
      'The solid Sheesham wood weight and grain finish are exceptional. Direct workshop pricing with polite in-home assembly.',
    image: 'https://images.unsplash.com/photo-1616486338812-3dadae4b4ace?auto=format&fit=crop&w=800&q=80',
  },
  {
    id: 'r2',
    author: 'Mrs. Ayesha Malik',
    city: 'Bahria Town, Islamabad',
    furnitureBought: 'Velvet Living Suite',
    comment:
      'We customized emerald velvet fabric and high-resilience MoltyFoam cores. Arrived in Islamabad in immaculate protective packaging.',
    image: 'https://images.unsplash.com/photo-1555041469-a586c61ea9bc?auto=format&fit=crop&w=800&q=80',
  },
  {
    id: 'r3',
    author: 'Dr. Usman Farooq',
    city: 'Gulberg III, Lahore',
    furnitureBought: 'Carrara Marble Dining Table',
    comment:
      'The polished marble slab and solid fluted base rival imported luxury brands. Reliable Cash on Delivery process.',
    image: 'https://images.unsplash.com/photo-1617806118233-18e1de247200?auto=format&fit=crop&w=800&q=80',
  },
];

export const CustomerReviewsSlider: React.FC = () => {
  const [currentIdx, setCurrentIdx] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentIdx((prev) => (prev + 1) % REVIEWS.length);
    }, 5500);
    return () => clearInterval(timer);
  }, [currentIdx]);

  const prev = () => {
    setCurrentIdx((prev) => (prev - 1 + REVIEWS.length) % REVIEWS.length);
  };

  const next = () => {
    setCurrentIdx((prev) => (prev + 1) % REVIEWS.length);
  };

  const review = REVIEWS[currentIdx];

  return (
    <section className="py-16 sm:py-24 bg-white border-b border-[#E8E1D7]">
      <div className="max-w-5xl mx-auto px-6 sm:px-8">
        <div className="text-center mb-10 sm:mb-14">
          <span className="text-[11px] uppercase tracking-[0.2em] text-[#8C7A6B] font-medium block mb-1">
            Testimonials
          </span>
          <h2 className="text-2xl sm:text-3xl md:text-4xl font-normal font-serif-luxury text-[#231B15] tracking-tight">
            Client Impressions
          </h2>
        </div>

        {/* Minimal Editorial Quote */}
        <div className="relative text-center max-w-3xl mx-auto space-y-6">
          <blockquote className="text-lg sm:text-2xl font-serif-luxury text-[#3B3128] leading-relaxed font-normal">
            “{review.comment}”
          </blockquote>

          <div className="pt-2">
            <span className="block text-sm sm:text-base font-medium text-[#231B15]">
              {review.author}
            </span>
            <span className="block text-xs text-[#7A6E63] mt-0.5">
              {review.city} • {review.furnitureBought}
            </span>
          </div>

          {/* Understated Controls */}
          <div className="pt-6 flex items-center justify-center gap-3">
            <button
              onClick={prev}
              className="w-8 h-8 rounded-full border border-[#E8E1D7] text-[#5C5046] hover:text-[#231B15] hover:border-[#6E4D2E] flex items-center justify-center transition-colors cursor-pointer shadow-2xs"
              aria-label="Previous testimonial"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <div className="text-xs font-mono text-[#8C7A6B]">
              0{currentIdx + 1} / 0{REVIEWS.length}
            </div>
            <button
              onClick={next}
              className="w-8 h-8 rounded-full border border-[#E8E1D7] text-[#5C5046] hover:text-[#231B15] hover:border-[#6E4D2E] flex items-center justify-center transition-colors cursor-pointer shadow-2xs"
              aria-label="Next testimonial"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </section>
  );
};
