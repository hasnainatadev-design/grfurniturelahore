import React from 'react';

export const WhyChooseUs: React.FC = () => {
  const pillars = [
    {
      title: 'Real Solid Wood',
      desc: 'We use strong, pure Sheesham and Oak wood that lasts for many years without bending or breaking.',
    },
    {
      title: 'Direct Factory Prices',
      desc: 'We make all furniture in our own Lahore workshop. No middlemen or extra showroom commissions.',
    },
    {
      title: 'Custom Made for You',
      desc: 'Choose your favorite size, fabric color, and wood polish to match your room perfectly.',
    },
  ];

  return (
    <section id="why-us-section" className="py-16 sm:py-24 bg-[#FAF7F2] border-b border-[#E8E1D7]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="max-w-2xl mx-auto text-center mb-12 sm:mb-16">
          <span className="text-[11px] uppercase tracking-[0.2em] text-[#8C7A6B] font-medium block mb-1">
            Why Us
          </span>
          <h2 className="text-2xl sm:text-3xl md:text-4xl font-normal font-serif-luxury text-[#231B15] tracking-tight">
            Why Choose GR Furniture
          </h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 sm:gap-12">
          {pillars.map((item, idx) => (
            <div key={idx} className="text-left space-y-3">
              <span className="text-xs font-mono text-[#6E4D2E] block font-medium">
                0{idx + 1}
              </span>
              <h3 className="text-lg font-serif-luxury text-[#231B15] font-medium">
                {item.title}
              </h3>
              <p className="text-[#5C5046] text-sm leading-relaxed font-light">
                {item.desc}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};
