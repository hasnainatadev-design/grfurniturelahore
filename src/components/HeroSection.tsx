import React from 'react';
import { ArrowRight, Sparkles, ShieldCheck, Award, MapPin } from 'lucide-react';
import { WhatsAppIcon } from './WhatsAppIcon';

interface HeroSectionProps {
  onShopClick: () => void;
  onExploreCategories: () => void;
}

export const HeroSection: React.FC<HeroSectionProps> = ({
  onShopClick,
  onExploreCategories,
}) => {
  const openWhatsApp = () => {
    const msg = encodeURIComponent('Hello GR Furniture! I would like to inquire about your furniture collection and custom sizing.');
    window.open(`https://wa.me/923446784419?text=${msg}`, '_blank');
  };

  return (
    <section className="relative overflow-hidden bg-[#FAF8F5] border-b border-[#EAE4DC]">
      {/* Subtle warm decorative background glow */}
      <div className="absolute top-0 right-1/4 w-96 h-96 bg-[#936B3B]/5 rounded-full blur-3xl pointer-events-none" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-16 md:py-20 relative z-10">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-14 items-center">
          {/* Left Text Column (6 cols) */}
          <div className="lg:col-span-6 space-y-5 sm:space-y-6 text-center lg:text-left">
            {/* Top Kicker */}
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-[#8C6239]/10 border border-[#8C6239]/20 text-[#7D5528] text-xs font-semibold tracking-wide">
              <Sparkles className="w-3.5 h-3.5 text-[#8C6239]" />
              <span>Lahore's Master Woodcraft & Upholstery</span>
            </div>

            {/* Display Headline */}
            <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-[54px] font-bold font-serif-luxury text-[#201D1A] tracking-tight leading-[1.12]">
              Handcrafted Luxury <br className="hidden sm:inline" />
              <span className="text-[#8C6239] font-normal italic">Furniture for Life.</span>
            </h1>

            {/* Supporting Copy */}
            <p className="text-sm sm:text-base text-[#5E554C] leading-relaxed max-w-xl mx-auto lg:mx-0">
              Welcome to <strong>GR Furniture</strong>. Discover bespoke master beds, luxury velvet sofas, and marble dining suites built from 100% seasoned solid hardwoods with factory-direct pricing in Lahore.
            </p>

            {/* CTA Actions */}
            <div className="flex flex-col sm:flex-row items-center justify-center lg:justify-start gap-3 pt-2">
              <button
                id="hero-shop-btn"
                onClick={onShopClick}
                className="w-full sm:w-auto px-7 py-3.5 rounded-xl bg-[#201D1A] text-[#FAF8F5] hover:bg-[#8C6239] active:scale-98 transition-all font-semibold text-sm flex items-center justify-center gap-2 shadow-[0_4px_14px_rgba(0,0,0,0.12)] hover:shadow-[0_6px_20px_rgba(140,98,57,0.25)] cursor-pointer"
              >
                <span>Explore Collection</span>
                <ArrowRight className="w-4 h-4" />
              </button>

              <button
                id="hero-whatsapp-btn"
                onClick={openWhatsApp}
                className="w-full sm:w-auto px-6 py-3.5 rounded-xl bg-[#25D366]/15 text-[#1E7E34] hover:bg-[#25D366]/25 border border-[#25D366]/30 active:scale-98 transition-all font-bold text-sm flex items-center justify-center gap-2 cursor-pointer shadow-2xs"
              >
                <WhatsAppIcon className="w-4 h-4 text-[#25D366]" />
                <span>WhatsApp: 0344 6784419</span>
              </button>
            </div>

            {/* Trust Metrics Bar */}
            <div className="pt-6 border-t border-[#EAE4DC] grid grid-cols-3 gap-3 text-center lg:text-left">
              <div className="space-y-0.5">
                <span className="block text-base sm:text-lg font-bold text-[#201D1A]">100% Solid</span>
                <span className="text-[11px] sm:text-xs text-[#786F66]">Seasoned Hardwood</span>
              </div>
              <div className="space-y-0.5">
                <span className="block text-base sm:text-lg font-bold text-[#8C6239]">Factory Direct</span>
                <span className="text-[11px] sm:text-xs text-[#786F66]">No Middleman Fees</span>
              </div>
              <div className="space-y-0.5">
                <span className="block text-base sm:text-lg font-bold text-[#201D1A]">10-Year</span>
                <span className="text-[11px] sm:text-xs text-[#786F66]">Termite Warranty</span>
              </div>
            </div>
          </div>

          {/* Right Visual Stage (6 cols) */}
          <div className="lg:col-span-6 relative">
            <div className="relative rounded-3xl overflow-hidden shadow-[0_20px_50px_rgba(32,29,26,0.12)] border border-[#EAE4DC] bg-[#EFEAE2] aspect-4/3 sm:aspect-16/11 group">
              <img
                src="https://images.unsplash.com/photo-1555041469-a586c61ea9bc?auto=format&fit=crop&w=1200&q=80"
                alt="GR Furniture Luxury Living Room Showroom"
                className="w-full h-full object-cover group-hover:scale-103 transition-transform duration-700 ease-out"
                loading="eager"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent pointer-events-none" />

              {/* Floating Assurance Card */}
              <div className="absolute bottom-4 left-4 right-4 sm:right-auto sm:max-w-xs bg-white/95 backdrop-blur-md p-3.5 rounded-2xl border border-white/60 shadow-lg">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-[#FAF8F5] border border-[#EAE4DC] flex items-center justify-center shrink-0 text-[#8C6239]">
                    <ShieldCheck className="w-5 h-5" />
                  </div>
                  <div>
                    <span className="text-xs font-bold text-[#201D1A] block">
                      Artisanal Custom Builds
                    </span>
                    <span className="text-[11px] text-[#786F66] leading-tight block">
                      Custom sizes, Turkish fabrics & polish tones
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
