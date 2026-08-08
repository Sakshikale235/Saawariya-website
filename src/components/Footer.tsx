import { Heart, MapPin, Phone, Mail } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { DividerLine } from './IndianMotifs';

export function Footer() {
  const navigate = useNavigate();

  return (
  <footer className="bg-[#6B1D1D] text-white">
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-12">

      {/* Top Section */}
      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-8 mb-10">

        {/* Brand */}
        <div>
          <div className="flex items-center gap-2 mb-4">
            <div className="w-10 h-10 rounded-full border-2 border-[#C4A35A] flex items-center justify-center bg-[#F7F2E8]/10">
              <span
                className="text-[#C4A35A] text-lg font-bold"
                style={{ fontFamily: "'Cinzel', serif" }}
              >
                S
              </span>
            </div>

            <div>
              <h3
                className="text-[#C4A35A] text-lg font-bold tracking-wider"
                style={{ fontFamily: "'Cinzel', serif" }}
              >
                SAAWARIYA
              </h3>
              <p className="text-[#C4A35A]/60 text-[10px] tracking-[0.2em] uppercase">
                Indian Coded
              </p>
            </div>
          </div>

          <p className="text-sm text-white/70 leading-relaxed mb-4">
            Timeless traditions, modern you. Bringing India's rich heritage to
            your wardrobe and home.
          </p>

          <div className="space-y-2">
            <div className="flex items-center gap-2 text-sm text-white/70">
              <Phone size={14} className="text-[#C4A35A]" />
              <span>+91 98765 43210</span>
            </div>

            <div className="flex items-center gap-2 text-sm text-white/70">
              <Mail size={14} className="text-[#C4A35A]" />
              <span>hello@saawariya.com</span>
            </div>

            <div className="flex items-center gap-2 text-sm text-white/70">
              <MapPin size={14} className="text-[#C4A35A]" />
              <span>Mumbai, India</span>
            </div>
          </div>
        </div>

        {/* Shop */}
        <div>
          <h4 className="text-sm font-semibold text-[#C4A35A] uppercase tracking-wider mb-4">
            Shop
          </h4>

          <ul className="space-y-2">
            {["Men", "Women", "Collections"].map((item) => (
              <li key={item}>
                <button
                  onClick={() => navigate("/shop")}
                  className="text-sm text-white/70 hover:text-white transition-colors"
                >
                  {item}
                </button>
              </li>
            ))}
          </ul>
        </div>

        {/* Customer Care */}
        <div>
          <h4 className="text-sm font-semibold text-[#C4A35A] uppercase tracking-wider mb-4">
            Customer Care
          </h4>

          <ul className="space-y-2">
            {[
              "My Orders",
              "Wishlist",
              "Track Order",
              "Shipping Policy",
              "Returns & Exchange",
              "FAQs",
            ].map((item) => (
              <li key={item}>
                <button
                  onClick={() => {
                    if (item === "My Orders") navigate("/cart");
                    else if (item === "Wishlist") navigate("/wishlist");
                  }}
                  className="text-sm text-white/70 hover:text-white transition-colors"
                >
                  {item}
                </button>
              </li>
            ))}
          </ul>
        </div>

        {/* About */}
        <div>
          <h4 className="text-sm font-semibold text-[#C4A35A] uppercase tracking-wider mb-4">
            About Saawariya
          </h4>

          <ul className="space-y-2">
            {[
              "Our Story",
              "Artisan Partners",
              "Sustainability",
              "Press",
              "Careers",
              "Contact Us",
            ].map((item) => (
              <li key={item}>
                <button className="text-sm text-white/70 hover:text-white transition-colors">
                  {item}
                </button>
              </li>
            ))}
          </ul>
        </div>
      </div>

      <DividerLine className="mb-6" />

      {/* Features */}
      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {[
          {
            label: "Premium Quality",
            sub: "Assured",
          },
          {
            label: "Designed for Elegance",
            sub: "Crafted perfection",
          },
          {
            label: "Loved by 1000+",
            sub: "Happy Customers",
          },
          {
            label: "Trendy Styles",
            sub: "Timeless You",
          },
        ].map((item) => (
          <div key={item.label} className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-[#C4A35A]/10 flex items-center justify-center">
              <svg
                width="18"
                height="18"
                viewBox="0 0 24 24"
                fill="none"
                stroke="#C4A35A"
                strokeWidth="1.5"
              >
                <circle cx="12" cy="12" r="10" />
                <path d="M12 8v8M8 12h8" />
              </svg>
            </div>

            <div>
              <p className="text-xs font-semibold text-white">
                {item.label}
              </p>
              <p className="text-[10px] text-white/60">
                {item.sub}
              </p>
            </div>
          </div>
        ))}
      </div>

      {/* Bottom */}
      <div className="border-t border-white/10 pt-6 flex flex-col sm:flex-row items-center justify-between gap-4">
        <p className="text-xs text-white/50">
          © 2024 Saawariya. All rights reserved. Made with{" "}
          <Heart
            size={12}
            className="inline text-[#C4A35A] fill-[#C4A35A]"
          />{" "}
          in India.
        </p>

        <div className="flex items-center gap-4">
          <button className="text-xs text-white/50 hover:text-white transition-colors">
            Privacy Policy
          </button>

          <button className="text-xs text-white/50 hover:text-white transition-colors">
            Terms of Service
          </button>

          <button className="text-xs text-white/50 hover:text-white transition-colors">
            Cookie Policy
          </button>
        </div>
      </div>

    </div>
  </footer>
);
}
