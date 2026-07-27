import { useEffect, useState } from 'react';
import { ShoppingBag, Star, Truck, RotateCcw, Shield, CreditCard, IndianRupee, Heart } from 'lucide-react';
import { useApp } from '../context/AppContext';
import { HeroSection } from '../components/HeroSection';
import { categories } from '../data/categories';
import { ProductCard } from '../components/ProductCard';
import { DividerLine } from '../components/IndianMotifs';
import { fetchFeaturedProducts, fetchBestsellers } from '../api/products';
import type { Product } from '../types';

export function HomePage() {
  const { navigate } = useApp();
  const [featured, setFeatured] = useState<Product[]>([]);
  const [bestsellers, setBestsellers] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [email, setEmail] = useState('');

  useEffect(() => {
    let cancelled = false;

    async function load() {
      try {
        setLoading(true);
        setError(null);

        const [featuredData, bestsellersData] = await Promise.all([
          fetchFeaturedProducts(),
          fetchBestsellers(),
        ]);

        if (!cancelled) {
          setFeatured(featuredData);
          setBestsellers(bestsellersData);
        }
      } catch (err) {
        console.error('[HomePage] Failed to load products:', err);
        if (!cancelled) {
          setError('Unable to load products right now. Please try again later.');
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    load();
    return () => { cancelled = true; };
  }, []);

  const categoryIcons: Record<string, string> = {
    men: 'Shirt', women: 'Dress', collections: 'Sparkles',
  };

  const iconSvgs: Record<string, React.ReactNode> = {
    Shirt: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="w-6 h-6">
        <path d="M6 4h3l2 3h2l2-3h3l2 4v14H4V8l2-4z" />
      </svg>
    ),
    Dress: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="w-6 h-6">
        <path d="M12 2l-3 5h6l-3-5zM8 7L4 20h16l-4-13h-8z" />
      </svg>
    ),
    // Baby: (
    //   <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="w-6 h-6">
    //     <circle cx="12" cy="8" r="4" /><path d="M12 12v4M8 16h8" />
    //   </svg>
    // ),
    // Home: (
    //   <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="w-6 h-6">
    //     <path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
    //   </svg>
    // ),
    Gem: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="w-6 h-6">
        <path d="M12 2L2 12l10 10 10-10L12 2z" />
      </svg>
    ),
    Sparkles: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="w-6 h-6">
        <path d="M12 3l1.5 4.5L18 9l-4.5 1.5L12 15l-1.5-4.5L6 9l4.5-1.5L12 3z" />
      </svg>
    ),
  };

  return (
    <div className="min-h-screen bg-white">
      <HeroSection />

      <section className="py-16 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="text-center mb-10">
            <h3 className="text-2xl sm:text-3xl font-bold text-[#2C2C2C] mb-3" style={{ fontFamily: "'Playfair Display', serif" }}>
              Shop by Category
            </h3>
            <DividerLine />
          </div>
          <div className="grid grid-cols-3 sm:grid-cols-6 gap-4 sm:gap-6">
            {categories.map((cat) => (
              <button
                key={cat.id}
                onClick={() => navigate('shop', undefined, cat.id)}
                className="group flex flex-col items-center gap-3 p-4 rounded-xl hover:bg-[#F7F2E8] transition-all duration-300"
              >
                <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-full border-2 border-[#D4C5A9] group-hover:border-[#6B1D1D] flex items-center justify-center transition-colors duration-300 bg-white">
                  <div className="text-[#6B1D1D] group-hover:text-[#6B1D1D] transition-colors">
                    {iconSvgs[cat.icon]}
                  </div>
                </div>
                <span className="text-xs sm:text-sm font-medium text-[#2C2C2C] group-hover:text-[#6B1D1D] transition-colors text-center">
                  {cat.name}
                </span>
              </button>
            ))}
          </div>
        </div>
      </section>

      <section className="py-8 bg-[#F7F2E8]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {[
              { icon: IndianRupee, label: 'Indian Crafted', sub: '100% Original' },
              { icon: Star, label: 'Premium Quality', sub: 'Handpicked' },
              { icon: Heart, label: 'Made for India', sub: 'Loved Worldwide' },
              { icon: Shield, label: 'Secure Payments', sub: '100% Safe' },
            ].map((item) => (
              <div key={item.label} className="flex items-center gap-3 p-3">
                <div className="w-10 h-10 rounded-full bg-[#6B1D1D]/10 flex items-center justify-center flex-shrink-0">
                  <item.icon size={18} className="text-[#6B1D1D]" />
                </div>
                <div>
                  <p className="text-sm font-medium text-[#2C2C2C]">{item.label}</p>
                  <p className="text-xs text-[#6B6560]">{item.sub}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {error ? (
        <section className="py-16 bg-white">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 text-center">
            <h3 className="text-2xl sm:text-3xl font-bold text-[#2C2C2C] mb-3" style={{ fontFamily: "'Playfair Display', serif" }}>
              Welcome to Saawariya
            </h3>
            <DividerLine />
            <p className="mt-6 text-[#6B6560] text-sm">{error}</p>
          </div>
        </section>
      ) : loading ? (
        <>
          <section className="py-16 bg-white">
            <div className="max-w-7xl mx-auto px-4 sm:px-6">
              <div className="flex items-center justify-between mb-10">
                <div>
                  <h3 className="text-2xl sm:text-3xl font-bold text-[#2C2C2C] mb-2" style={{ fontFamily: "'Playfair Display', serif" }}>
                    Best Picks for You
                  </h3>
                  <DividerLine className="justify-start" />
                </div>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-6">
                {[1, 2, 3, 4].map((i) => (
                  <div key={i} className="rounded-xl overflow-hidden bg-[#F7F2E8] animate-pulse">
                    <div className="aspect-[3/4] bg-[#E8DFD0]" />
                    <div className="p-4 space-y-2">
                      <div className="h-3 bg-[#E8DFD0] rounded w-1/3" />
                      <div className="h-4 bg-[#E8DFD0] rounded w-2/3" />
                      <div className="h-3 bg-[#E8DFD0] rounded w-1/4" />
                      <div className="h-5 bg-[#E8DFD0] rounded w-1/3" />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </section>

          <section className="py-16 bg-[#F7F2E8]">
            <div className="max-w-7xl mx-auto px-4 sm:px-6">
              <div className="flex items-center justify-between mb-10">
                <div>
                  <h3 className="text-2xl sm:text-3xl font-bold text-[#2C2C2C] mb-2" style={{ fontFamily: "'Playfair Display', serif" }}>
                    Featured Collection
                  </h3>
                  <DividerLine className="justify-start" />
                </div>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-6">
                {[1, 2, 3, 4].map((i) => (
                  <div key={i} className="rounded-xl overflow-hidden bg-white animate-pulse">
                    <div className="aspect-[3/4] bg-[#E8DFD0]" />
                    <div className="p-4 space-y-2">
                      <div className="h-3 bg-[#E8DFD0] rounded w-1/3" />
                      <div className="h-4 bg-[#E8DFD0] rounded w-2/3" />
                      <div className="h-3 bg-[#E8DFD0] rounded w-1/4" />
                      <div className="h-5 bg-[#E8DFD0] rounded w-1/3" />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </section>
        </>
      ) : (
        <>
          <section className="py-16 bg-white">
            <div className="max-w-7xl mx-auto px-4 sm:px-6">
              <div className="flex items-center justify-between mb-10">
                <div>
                  <h3 className="text-2xl sm:text-3xl font-bold text-[#2C2C2C] mb-2" style={{ fontFamily: "'Playfair Display', serif" }}>
                    Best Picks for You
                  </h3>
                  <DividerLine className="justify-start" />
                </div>
                <button
                  onClick={() => navigate('shop')}
                  className="text-sm font-medium text-[#6B1D1D] hover:text-[#4A1212] transition-colors flex items-center gap-1"
                >
                  View All <ChevronRight size={16} />
                </button>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-6">
                {bestsellers.slice(0, 4).map((product) => (
                  <ProductCard key={product.id} product={product} />
                ))}
              </div>
            </div>
          </section>

          <section className="py-16 bg-[#F7F2E8]">
            <div className="max-w-7xl mx-auto px-4 sm:px-6">
              <div className="flex items-center justify-between mb-10">
                <div>
                  <h3 className="text-2xl sm:text-3xl font-bold text-[#2C2C2C] mb-2" style={{ fontFamily: "'Playfair Display', serif" }}>
                    Featured Collection
                  </h3>
                  <DividerLine className="justify-start" />
                </div>
                <button
                  onClick={() => navigate('shop')}
                  className="text-sm font-medium text-[#6B1D1D] hover:text-[#4A1212] transition-colors flex items-center gap-1"
                >
                  View All <ChevronRight size={16} />
                </button>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-6">
                {featured.map((product) => (
                  <ProductCard key={product.id} product={product} />
                ))}
              </div>
            </div>
          </section>
        </>
      )}

      <section className="py-16 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="grid lg:grid-cols-2 gap-8 items-center">
            <div className="relative rounded-2xl overflow-hidden">
              <img src="/Picture2.png" alt="Collection" className="w-full h-80 object-cover" />
              <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent flex items-end p-8">
                <div>
                  <p className="text-[#C4A35A] text-sm font-medium tracking-wider mb-2 uppercase">New Arrivals</p>
                  <h3 className="text-white text-2xl font-bold mb-3" style={{ fontFamily: "'Playfair Display', serif" }}>
                    Festive Collection 2024
                  </h3>
                  <button
                    onClick={() => navigate('shop')}
                    className="bg-white text-[#6B1D1D] px-6 py-2.5 rounded-lg text-sm font-semibold hover:bg-[#6B1D1D] hover:text-white transition-colors"
                  >
                    Shop Collection
                  </button>
                </div>
              </div>
            </div>
            <div className="relative rounded-2xl overflow-hidden">
              <img src="/Picture4.png" alt="Home" className="w-full h-80 object-cover" />
              <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent flex items-end p-8">
                {/* <div>
                  <p className="text-[#C4A35A] text-sm font-medium tracking-wider mb-2 uppercase">Home Decor</p>
                  <h3 className="text-white text-2xl font-bold mb-3" style={{ fontFamily: "'Playfair Display', serif" }}>
                    Sacred & Beautiful
                  </h3>
                  <button
                    onClick={() => navigate('shop', undefined, 'home')}
                    className="bg-white text-[#6B1D1D] px-6 py-2.5 rounded-lg text-sm font-semibold hover:bg-[#6B1D1D] hover:text-white transition-colors"
                  >
                    Explore Home
                  </button>
                </div> */}
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="py-12 bg-[#F7F2E8]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="bg-[#6B1D1D] rounded-2xl p-6 sm:p-10 flex flex-col sm:flex-row items-center justify-between gap-6">
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 rounded-full bg-[#C4A35A]/20 flex items-center justify-center">
                <ShoppingBag size={24} className="text-[#C4A35A]" />
              </div>
              <div>
                <h3 className="text-white text-lg font-bold">Get 10% Off Your First Order</h3>
                <p className="text-white/70 text-sm">Join our newsletter and never miss an update</p>
              </div>
            </div>
            <div className="flex gap-2 w-full sm:w-auto">
              <input
                type="email"
                placeholder="Enter your email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="flex-1 sm:w-64 px-4 py-2.5 rounded-lg bg-white/10 border border-white/20 text-white placeholder:text-white/50 text-sm outline-none focus:border-[#C4A35A]"
              />
              <button className="bg-[#C4A35A] text-[#6B1D1D] px-6 py-2.5 rounded-lg text-sm font-semibold hover:bg-[#D4B76A] transition-colors whitespace-nowrap">
                Subscribe
              </button>
            </div>
          </div>
        </div>
      </section>

      <section className="py-10 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
            {[
              { icon: Truck, label: 'Free Shipping', sub: 'On orders above ₹999' },
              { icon: RotateCcw, label: 'Easy Returns', sub: '15 days return policy' },
              { icon: Shield, label: 'Secure Payments', sub: '100% safe & secure' },
              { icon: CreditCard, label: 'COD Available', sub: 'Pan India' },
            ].map((item) => (
              <div key={item.label} className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-[#F7F2E8] flex items-center justify-center">
                  <item.icon size={18} className="text-[#6B1D1D]" />
                </div>
                <div>
                  <p className="text-sm font-medium text-[#2C2C2C]">{item.label}</p>
                  <p className="text-xs text-[#6B6560]">{item.sub}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}

function ChevronRight({ size }: { size: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M9 18l6-6-6-6" />
    </svg>
  );
}
