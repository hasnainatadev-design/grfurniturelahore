import React, { useState } from 'react';
import { ChevronDown, MapPin, Truck, ShieldCheck, Hammer, Sparkles, Phone, MessageSquare } from 'lucide-react';
import { WhatsAppIcon } from './WhatsAppIcon';
import { BUSINESS_INFO } from '../utils/seo';

export const LocalSEOSection: React.FC = () => {
  const [openFaq, setOpenFaq] = useState<number | null>(0);

  const faqs = [
    {
      q: 'Where is GR Furniture showroom and factory located in Lahore?',
      ur: 'جی آر فرنیچر کا شوروم اور فیکٹری لاہور میں کہاں واقع ہے؟',
      roman: 'GR Furniture Lahore factory aur showroom kahan hai?',
      a: 'Our master woodcraft factory and main showroom is located on Main Ferozepur Road (Chungi Amar Sidhu), Lahore. We welcome clients to visit our workshop to see live timber seasoning, master wood carving, frame assembly, and Turkish velvet upholstery.',
      highlight: 'Chungi Amar Sidhu, Main Ferozepur Road, Lahore',
    },
    {
      q: 'Can I order customized bed sets, sofa sets, or dining tables?',
      ur: 'کیا ہم اپنی پسند کے سائز، ڈیزائن اور لکڑی میں فرنیچر بنوا سکتے ہیں؟',
      roman: 'Kya custom size aur fabric mein furniture ban sakta hai?',
      a: 'Absolutely. Over 60% of our orders are bespoke. You can specify exact room dimensions, choose timber (Seasoned Solid Sheesham / Rosewood, Imported Ash Wood, Solid Oak), select luxury fabric swatches (Turkish velvet, Belgian suede, water-resistant bouclé), and choose matte or high-gloss polishes.',
      highlight: 'Custom Sizing & Fabric Swatches Available',
    },
    {
      q: 'Which areas in Lahore and other cities do you deliver to?',
      ur: 'لاہور کے کن علاقوں اور دیگر شہروں میں ڈیلیوری کی سہولت موجود ہے؟',
      roman: 'Lahore ke kon se ilaqon mein delivery hoti hai?',
      a: 'We provide specialized furniture logistics and doorstep assembly across all areas of Lahore including DHA (Phases 1-9), Bahria Town, Gulberg, Model Town, Johar Town, Cantt, Wapda Town, Lake City, and Askari. We also arrange secured door-to-door delivery across Punjab and Pakistan.',
      highlight: 'Delivery across DHA, Bahria, Gulberg, Johar Town & All Lahore',
    },
    {
      q: 'Why are GR Furniture prices lower than retail furniture shops in Lahore?',
      ur: 'جی آر فرنیچر کی قیمتیں لاہور کی دیگر مارکیٹوں سے کم کیوں ہیں؟',
      roman: 'GR Furniture ki wholesale factory prices itni affordable kyun hain?',
      a: 'We operate as direct wholesale manufacturers with an integrated in-house woodcraft and upholstery factory. By buying directly from our Lahore workshop, you bypass retail middlemen, showroom distributor margins, and commercial lease markups.',
      highlight: 'Direct Factory Workshop Rates — No Middleman Markup',
    },
    {
      q: 'How do I place an order or confirm fabric details?',
      ur: 'آرڈر کیسے بک کروائیں اور فیکٹری سے کیسے رابطہ کریں؟',
      roman: 'Order place karne aur confirm karne ka tareeqa kya hai?',
      a: 'You can order directly online with zero advance required for standard inventory, or tap the WhatsApp button to speak directly with our workshop master craftsmen (Ustad) for personalized fabric swatch photos and video tours.',
      highlight: 'Direct WhatsApp Assistance & Pay upon Inspection',
    },
  ];

  return (
    <section className="py-16 sm:py-24 bg-[#F5EFE6] border-b border-[#E8E1D7]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="text-center max-w-3xl mx-auto mb-12 sm:mb-16 space-y-3">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-[#EAE0D2] border border-[#D9CBB9] text-[#6E4D2E] text-[11px] font-medium tracking-wider uppercase">
            <Sparkles className="w-3 h-3 text-[#A87948]" />
            <span>Lahore Woodcraft Authority • لاہور فرنیچر</span>
          </div>

          <h2 className="text-2xl sm:text-3xl md:text-4xl font-normal font-serif-luxury text-[#231B15] tracking-tight">
            Handcrafted Furniture in Lahore
          </h2>

          <p className="text-xs sm:text-sm text-[#6A5E54] leading-relaxed max-w-2xl mx-auto font-light">
            Specializing in solid Sheesham wood bed sets, luxury velvet 7-seater sofas, natural marble dining tables, and bespoke interior woodwork at factory-direct wholesale rates in Lahore, Pakistan.
          </p>
        </div>

        {/* 4 Pillars of GR Furniture Lahore */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 mb-16">
          <div className="bg-white/80 backdrop-blur-xs p-5 sm:p-6 rounded-2xl border border-[#E8E1D7] shadow-2xs space-y-3">
            <div className="w-10 h-10 rounded-xl bg-[#FAF7F2] border border-[#E8E1D7] flex items-center justify-center text-[#6E4D2E]">
              <Hammer className="w-5 h-5" />
            </div>
            <h3 className="font-serif-luxury text-base sm:text-lg font-medium text-[#231B15]">
              100% Solid Seasoned Wood
            </h3>
            <p className="text-xs text-[#6A5E54] leading-relaxed">
              Termite-treated, seasoned Sheesham and imported Ash wood engineered for decades of structural stability.
            </p>
            <span className="text-[11px] text-[#A87948] font-medium block">
              خالص شیشم کی پکی لکڑی
            </span>
          </div>

          <div className="bg-white/80 backdrop-blur-xs p-5 sm:p-6 rounded-2xl border border-[#E8E1D7] shadow-2xs space-y-3">
            <div className="w-10 h-10 rounded-xl bg-[#FAF7F2] border border-[#E8E1D7] flex items-center justify-center text-[#6E4D2E]">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <h3 className="font-serif-luxury text-base sm:text-lg font-medium text-[#231B15]">
              Direct Factory Wholesale
            </h3>
            <p className="text-xs text-[#6A5E54] leading-relaxed">
              Wholesale pricing straight from our Lahore factory floor without commercial dealer markups.
            </p>
            <span className="text-[11px] text-[#A87948] font-medium block">
              فیکٹری ریٹ پر دستیاب
            </span>
          </div>

          <div className="bg-white/80 backdrop-blur-xs p-5 sm:p-6 rounded-2xl border border-[#E8E1D7] shadow-2xs space-y-3">
            <div className="w-10 h-10 rounded-xl bg-[#FAF7F2] border border-[#E8E1D7] flex items-center justify-center text-[#6E4D2E]">
              <Truck className="w-5 h-5" />
            </div>
            <h3 className="font-serif-luxury text-base sm:text-lg font-medium text-[#231B15]">
              Doorstep Lahore Delivery
            </h3>
            <p className="text-xs text-[#6A5E54] leading-relaxed">
              Careful padded transport and complimentary on-site assembly across DHA, Bahria, Gulberg, and all Lahore areas.
            </p>
            <span className="text-[11px] text-[#A87948] font-medium block">
              پورے لاہور میں محفوظ ڈیلیوری
            </span>
          </div>

          <div className="bg-white/80 backdrop-blur-xs p-5 sm:p-6 rounded-2xl border border-[#E8E1D7] shadow-2xs space-y-3">
            <div className="w-10 h-10 rounded-xl bg-[#FAF7F2] border border-[#E8E1D7] flex items-center justify-center text-[#6E4D2E]">
              <MapPin className="w-5 h-5" />
            </div>
            <h3 className="font-serif-luxury text-base sm:text-lg font-medium text-[#231B15]">
              Visit Workshop Showroom
            </h3>
            <p className="text-xs text-[#6A5E54] leading-relaxed">
              Main Ferozepur Road (Chungi Amar Sidhu) showroom open Mon–Sat 10 AM to 9 PM for physical inspections.
            </p>
            <span className="text-[11px] text-[#A87948] font-medium block">
              چونگی امر سدھو فیروزپور روڈ
            </span>
          </div>
        </div>

        {/* Local Lahore & Furniture FAQs */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-start">
          {/* Left Column: Local Business Card */}
          <div className="lg:col-span-5 bg-white p-6 sm:p-8 rounded-2xl border border-[#E8E1D7] shadow-xs space-y-5">
            <div className="space-y-2">
              <span className="text-[11px] uppercase tracking-widest text-[#8C7A6B] font-semibold block">
                Local Factory & Showroom
              </span>
              <h3 className="font-serif-luxury text-xl sm:text-2xl font-normal text-[#231B15]">
                GR Furniture Lahore
              </h3>
              <p className="text-xs sm:text-sm text-[#6A5E54] leading-relaxed font-light">
                Serving homeowners, interior architects, and bridal suites across Lahore and Punjab with bespoke solid wood craftsmanship.
              </p>
            </div>

            <div className="space-y-3 pt-2 text-xs text-[#5C5046] border-t border-[#EFE9DF]">
              <div className="flex items-start gap-3">
                <MapPin className="w-4 h-4 text-[#6E4D2E] shrink-0 mt-0.5" />
                <div>
                  <strong className="text-[#231B15] block font-medium">Showroom & Workshop Address:</strong>
                  <span>{BUSINESS_INFO.address}, {BUSINESS_INFO.city}, {BUSINESS_INFO.region}, Pakistan</span>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <Phone className="w-4 h-4 text-[#6E4D2E] shrink-0 mt-0.5" />
                <div>
                  <strong className="text-[#231B15] block font-medium">Phone & Inquiries:</strong>
                  <a href={`tel:${BUSINESS_INFO.phone}`} className="hover:text-[#6E4D2E] underline underline-offset-2">
                    {BUSINESS_INFO.phoneDisplay}
                  </a>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <MessageSquare className="w-4 h-4 text-[#25D366] shrink-0 mt-0.5" />
                <div>
                  <strong className="text-[#231B15] block font-medium">WhatsApp Support:</strong>
                  <span>Instant fabric catalog swatches, videos & pricing</span>
                </div>
              </div>
            </div>

            <div className="pt-2 flex flex-col sm:flex-row gap-2.5">
              <a
                href={BUSINESS_INFO.mapUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="flex-1 px-4 py-2.5 rounded-xl border border-[#D9CBB9] bg-[#FAF7F2] hover:bg-[#F2ECE3] text-center text-xs font-medium text-[#4A3E36] transition-colors"
              >
                Open Google Maps
              </a>
              <a
                href={`https://wa.me/923446784419?text=${encodeURIComponent('Hello GR Furniture Lahore, I would like to inquire about furniture options and custom designs.')}`}
                target="_blank"
                rel="noopener noreferrer"
                className="flex-1 px-4 py-2.5 rounded-xl bg-[#25D366] hover:bg-[#20BA5A] text-white text-center text-xs font-medium flex items-center justify-center gap-1.5 transition-colors shadow-2xs"
              >
                <WhatsAppIcon className="w-3.5 h-3.5" />
                <span>Chat on WhatsApp</span>
              </a>
            </div>
          </div>

          {/* Right Column: FAQ Accordion */}
          <div className="lg:col-span-7 space-y-3">
            <div className="mb-4">
              <span className="text-[11px] uppercase tracking-widest text-[#8C7A6B] font-semibold block mb-1">
                Frequently Asked Questions
              </span>
              <h3 className="font-serif-luxury text-xl sm:text-2xl font-normal text-[#231B15]">
                Everything You Need to Know
              </h3>
            </div>

            {faqs.map((faq, index) => {
              const isOpen = openFaq === index;
              return (
                <div
                  key={index}
                  className="bg-white rounded-xl border border-[#E8E1D7] overflow-hidden transition-all shadow-2xs"
                >
                  <button
                    onClick={() => setOpenFaq(isOpen ? null : index)}
                    className="w-full text-left px-5 py-4 flex items-center justify-between gap-4 cursor-pointer hover:bg-[#FAF7F2] transition-colors"
                  >
                    <div className="space-y-0.5">
                      <span className="text-xs sm:text-sm font-medium text-[#231B15] block">
                        {faq.q}
                      </span>
                      <span className="text-[11px] text-[#8C7A6B] block font-light">
                        {faq.ur}
                      </span>
                    </div>
                    <ChevronDown
                      className={`w-4 h-4 text-[#8C7A6B] shrink-0 transition-transform duration-200 ${
                        isOpen ? 'rotate-180 text-[#6E4D2E]' : ''
                      }`}
                    />
                  </button>

                  {isOpen && (
                    <div className="px-5 pb-4 pt-1 border-t border-[#F2ECE3] text-xs sm:text-sm text-[#5C5046] leading-relaxed space-y-2">
                      <p>{faq.a}</p>
                      <div className="inline-block px-2.5 py-1 rounded-md bg-[#FAF7F2] border border-[#E8E1D7] text-[11px] text-[#6E4D2E] font-medium">
                        ✓ {faq.highlight}
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </section>
  );
};
