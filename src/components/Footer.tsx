import React from 'react';
import { Phone, MapPin, Youtube, Facebook } from 'lucide-react';
import { WhatsAppIcon } from './WhatsAppIcon';
import { TikTokIcon } from './TikTokIcon';

interface FooterProps {
  onNavigate: (view: string, cat?: string) => void;
}

export const Footer: React.FC<FooterProps> = ({ onNavigate }) => {
  return (
    <footer id="contact-section" className="bg-[#1E1712] text-[#D8CEBE] pt-16 pb-36 sm:pb-36 md:pb-28 lg:pb-24 border-t border-[#362B22]">
      <div className="max-w-7xl mx-auto px-6 sm:px-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-10 sm:gap-12 pb-12 border-b border-[#362B22]">
          {/* Brand Info */}
          <div className="space-y-4 md:col-span-1">
            <div
              onClick={() => {
                onNavigate('home');
                window.scrollTo({ top: 0, behavior: 'smooth' });
              }}
              className="flex items-center gap-3 cursor-pointer group select-none"
            >
              <div className="w-11 h-11 rounded-xl overflow-hidden border border-[#3D3025] bg-[#16100B] shrink-0 shadow-xs group-hover:border-[#C4A882]/70 transition-colors">
                <img
                  src="/logo.png"
                  alt="GR Furniture Lahore - Official Logo"
                  className="w-full h-full object-cover"
                  loading="lazy"
                  referrerPolicy="no-referrer"
                />
              </div>
              <div>
                <span className="font-serif-luxury text-xl font-normal tracking-wide text-white block leading-tight group-hover:text-[#E8DFC9] transition-colors">
                  GR FURNITURE
                </span>
                <span className="text-[10px] uppercase tracking-widest text-[#C4A882] font-medium block">
                  Workshop • Lahore
                </span>
              </div>
            </div>
            <p className="text-xs text-[#A89C8F] leading-relaxed font-light">
              Lahore handmade wood furniture workshop for solid Sheesham beds, velvet sofas, and marble dining sets. Direct factory prices with delivery across Pakistan.
            </p>
          </div>

          {/* Quick Links */}
          <div className="space-y-3">
            <h4 className="text-xs uppercase tracking-[0.15em] text-[#E8DFC9] font-medium">
              Furniture
            </h4>
            <ul className="space-y-2 text-xs text-[#A89C8F] font-light">
              <li>
                <button
                  onClick={() => onNavigate('shop', 'beds')}
                  className="hover:text-white transition-colors cursor-pointer text-left"
                >
                  Beds
                </button>
              </li>
              <li>
                <button
                  onClick={() => onNavigate('shop', 'sofas')}
                  className="hover:text-white transition-colors cursor-pointer text-left"
                >
                  Sofas
                </button>
              </li>
              <li>
                <button
                  onClick={() => onNavigate('shop', 'dining-tables')}
                  className="hover:text-white transition-colors cursor-pointer text-left"
                >
                  Dining Tables
                </button>
              </li>
              <li>
                <button
                  onClick={() => onNavigate('shop', 'wardrobes')}
                  className="hover:text-white transition-colors cursor-pointer text-left"
                >
                  Wardrobes
                </button>
              </li>
            </ul>
          </div>

          {/* Workshop & Showroom */}
          <div className="space-y-3">
            <h4 className="text-xs uppercase tracking-[0.15em] text-[#E8DFC9] font-medium">
              Workshop
            </h4>
            <div className="text-xs text-[#A89C8F] font-light space-y-2">
              <p className="flex items-start gap-2">
                <MapPin className="w-3.5 h-3.5 text-[#C4A882] shrink-0 mt-0.5" />
                <span>Lahore Workshop, Punjab, Pakistan</span>
              </p>
              <p className="text-[#8C7E72]">
                Monday - Saturday: 10:00 AM – 9:00 PM
              </p>
              <a
                href="https://maps.app.goo.gl/eidhnxs8N86PB2aN7"
                target="_blank"
                rel="noopener noreferrer"
                className="text-[#C4A882] hover:text-white underline underline-offset-4 inline-block text-[11px]"
              >
                View on Google Maps
              </a>
            </div>
          </div>

          {/* Direct Inquiries */}
          <div className="space-y-3">
            <h4 className="text-xs uppercase tracking-[0.15em] text-[#E8DFC9] font-medium">
              Contact Us
            </h4>
            <div className="space-y-2 text-xs text-[#A89C8F] font-light">
              <a
                href="https://wa.me/923446784419"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 text-[#EAE2D5] hover:text-white transition-colors"
              >
                <WhatsAppIcon className="w-3.5 h-3.5 text-[#25D366]" />
                <span>WhatsApp: 0344 6784419</span>
              </a>
              <a
                href="tel:03446784419"
                className="flex items-center gap-2 text-[#EAE2D5] hover:text-white transition-colors"
              >
                <Phone className="w-3.5 h-3.5 text-[#C4A882]" />
                <span>Phone: 0344 6784419</span>
              </a>
            </div>
          </div>
        </div>

        {/* Bottom copyright */}
        <div className="pt-8 border-t border-[#362B22]/60 flex flex-col md:flex-row items-start md:items-center justify-between text-xs text-[#8C7E72] gap-4 font-light pr-18 sm:pr-24 md:pr-28">
          <p className="leading-relaxed">
            © {new Date().getFullYear()} GR Furniture Lahore. Made in Pakistan.
          </p>
          <div className="flex flex-wrap items-center gap-2.5 sm:gap-3 shrink-0">
            <a
              href="https://youtube.com/@grfurniturefactory?si=9y-BxOetXKcMSaTe"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-[#2A211A] hover:bg-[#382C22] border border-[#44362B] hover:border-[#E85D5D]/60 text-[#D8CEBE] hover:text-white transition-all duration-200 text-xs font-medium group shadow-xs hover:shadow-sm"
              aria-label="GR Furniture YouTube Channel"
            >
              <div className="w-4 h-4 rounded-full bg-[#FF0000]/15 flex items-center justify-center group-hover:bg-[#FF0000] transition-colors">
                <Youtube className="w-2.5 h-2.5 text-[#FF6B6B] group-hover:text-white transition-colors shrink-0" />
              </div>
              <span>YouTube</span>
            </a>
            <a
              href="https://www.facebook.com/p/GR-Furniture-Lahore-100064194690152/"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-[#2A211A] hover:bg-[#382C22] border border-[#44362B] hover:border-[#3B82F6]/60 text-[#D8CEBE] hover:text-white transition-all duration-200 text-xs font-medium group shadow-xs hover:shadow-sm"
              aria-label="GR Furniture Facebook Page"
            >
              <div className="w-4 h-4 rounded-full bg-[#1877F2]/15 flex items-center justify-center group-hover:bg-[#1877F2] transition-colors">
                <Facebook className="w-2.5 h-2.5 text-[#60A5FA] group-hover:text-white transition-colors shrink-0" />
              </div>
              <span>Facebook</span>
            </a>
            <a
              href="https://www.tiktok.com/@grfurniturelahore1?_r=1&_t=ZS-99btFwCHWp3"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-[#2A211A] hover:bg-[#382C22] border border-[#44362B] hover:border-[#EE1D52]/60 text-[#D8CEBE] hover:text-white transition-all duration-200 text-xs font-medium group shadow-xs hover:shadow-sm"
              aria-label="GR Furniture TikTok Profile"
            >
              <div className="w-4 h-4 rounded-full bg-[#EE1D52]/15 flex items-center justify-center group-hover:bg-[#EE1D52] transition-colors">
                <TikTokIcon className="w-2.5 h-2.5 text-[#F472B6] group-hover:text-white transition-colors shrink-0" />
              </div>
              <span>TikTok</span>
            </a>
            <a
              href="https://wa.me/923446784419"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-[#2A211A] hover:bg-[#382C22] border border-[#44362B] hover:border-[#25D366]/60 text-[#D8CEBE] hover:text-white transition-all duration-200 text-xs font-medium group shadow-xs hover:shadow-sm"
              aria-label="GR Furniture WhatsApp"
            >
              <div className="w-4 h-4 rounded-full bg-[#25D366]/15 flex items-center justify-center group-hover:bg-[#25D366] transition-colors">
                <WhatsAppIcon className="w-2.5 h-2.5 text-[#4ADE80] group-hover:text-white transition-colors shrink-0" />
              </div>
              <span>WhatsApp</span>
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
};
