import { useEffect, useState } from 'react';
import { ArrowRight, ChevronLeft, ChevronRight } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { DividerLine } from './IndianMotifs';
import { fetchActiveHeroBanner, type HeroBanner } from '../api/heroBanners';

type LoadState = 'loading' | 'loaded' | 'empty' | 'error';

function mapButtonLink(link: string): string {
  switch (link) {
    case 'shop': return '/shop';
    case 'cart': return '/cart';
    case 'wishlist': return '/wishlist';
    case 'home': return '/';
    default: return link.startsWith('/') ? link : '/shop';
  }
}

export function HeroSection() {
  const navigate = useNavigate();
  const [state, setState] = useState<LoadState>('loading');
  const [banners, setBanners] = useState<HeroBanner[]>([]);
  const [current, setCurrent] = useState(0);
  const [isAnimating, setIsAnimating] = useState(false);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      try {
        const data = await fetchActiveHeroBanner();
        if (cancelled) return;
        if (data.length === 0) {
          setState('empty');
        } else {
          setBanners(data);
          setState('loaded');
        }
      } catch (err) {
        console.error('[HeroSection] Error fetching banners:', err);
        if (!cancelled) setState('error');
      }
    }

    load();
    return () => { cancelled = true; };
  }, []);

  useEffect(() => {
    if (state !== 'loaded' || banners.length <= 1) return;
    const timer = setInterval(() => {
      goToSlide((current + 1) % banners.length);
    }, 6000);
    return () => clearInterval(timer);
  }, [state, banners.length, current]);

  const goToSlide = (index: number) => {
    if (isAnimating || index === current) return;
    setIsAnimating(true);
    setCurrent(index);
    setTimeout(() => setIsAnimating(false), 700);
  };

  if (state === "loading") {
  return (
    <section className="relative bg-[#F7F2E8] overflow-hidden">
      <div className="max-w-7xl mx-auto">
        <div className="grid lg:grid-cols-2 min-h-[500px] lg:min-h-[600px]">

          <div className="flex flex-col justify-center px-6 sm:px-10 lg:px-16 py-12 lg:py-0 order-2 lg:order-1">
            <div className="max-w-lg animate-pulse space-y-4">
              <div className="h-4 w-24 bg-gray-300 rounded" />
              <div className="h-10 w-3/4 bg-gray-300 rounded" />
              <div className="h-6 w-1/2 bg-gray-300 rounded" />
              <div className="h-12 w-36 bg-gray-300 rounded-lg" />
            </div>
          </div>

          <div className="relative order-1 lg:order-2 overflow-hidden">
            <div className="h-64 sm:h-80 lg:h-full bg-gray-300 animate-pulse" />
          </div>

        </div>
      </div>
    </section>
  );
}
  

  if (state === "empty" || state === "error") {
  return (
    <section className="relative bg-[#F7F2E8] overflow-hidden">
      <div className="max-w-7xl mx-auto">
        <div className="grid lg:grid-cols-2 min-h-[400px] lg:min-h-[500px]">

          <div className="flex flex-col justify-center px-6 sm:px-10 lg:px-16 py-12 lg:py-0 order-2 lg:order-1">
            <div className="max-w-lg">
              <DividerLine className="mb-6 justify-start" />

              <h2
                className="text-3xl sm:text-4xl lg:text-5xl font-bold text-[#2C2C2C] leading-tight mb-4"
                style={{ fontFamily: "'Playfair Display', serif" }}
              >
                Welcome to Saawariya
              </h2>

              <p className="text-[#6B6560] text-base sm:text-lg mb-8">
                Discover India's finest handcrafted treasures.
              </p>

              <button
                onClick={() => navigate(mapButtonLink("shop"))}
                className="group inline-flex items-center gap-3 bg-[#6B1D1D] text-white px-8 py-3.5 rounded-lg text-sm font-semibold tracking-wider hover:bg-[#4A1212] transition-all duration-300 shadow-md hover:shadow-lg"
              >
                Start Shopping
                <ArrowRight
                  size={16}
                  className="group-hover:translate-x-1 transition-transform"
                />
              </button>
            </div>
          </div>

          <div className="relative order-1 lg:order-2 overflow-hidden">
            <div className="h-64 sm:h-80 lg:h-full bg-gradient-to-br from-[#6B1D1D]/10 to-[#C4A35A]/10" />
          </div>

        </div>
      </div>
    </section>
  );
}

  return (
  <section className="relative bg-[#F7F2E8] overflow-hidden">
    <div className="max-w-7xl mx-auto">
      <div className="relative grid lg:grid-cols-2 min-h-[500px] lg:min-h-[600px]">

        {/* Left Content */}
        <div className="flex flex-col justify-center px-6 sm:px-10 lg:px-16 py-12 lg:py-0 order-2 lg:order-1">
          <div className="max-w-lg">
            <DividerLine className="mb-6 justify-start" />

            <h2
              className="text-3xl sm:text-4xl lg:text-5xl font-bold text-[#2C2C2C] leading-tight mb-4 whitespace-pre-line"
              style={{ fontFamily: "'Playfair Display', serif" }}
            >
              {banners[current].title}
            </h2>

            <p className="text-[#6B6560] text-base sm:text-lg mb-8">
              {banners[current].subtitle}
            </p>

            <button
              onClick={() =>
                navigate(mapButtonLink(banners[current].button_link))
              }
              className="group inline-flex items-center gap-3 bg-[#6B1D1D] text-white px-8 py-3.5 rounded-lg text-sm font-semibold hover:bg-[#4A1212] transition-all"
            >
              {banners[current].button_text}
              <ArrowRight
                size={16}
                className="group-hover:translate-x-1 transition-transform"
              />
            </button>
          </div>
        </div>

        {/* Right Image */}
        <div className="relative order-1 lg:order-2 overflow-hidden">
          <div className="relative h-64 sm:h-80 lg:h-full">
            {banners.map((banner, index) => (
              <img
                key={banner.id}
                src={banner.image_url}
                alt={banner.title}
                className={`absolute inset-0 w-full h-full object-cover transition-all duration-700 ${
                  index === current
                    ? "opacity-100"
                    : "opacity-0 pointer-events-none"
                }`}
              />
            ))}

            <div className="absolute inset-0 bg-gradient-to-r from-[#F7F2E8]/40 to-transparent" />
          </div>

          {/* Slider Controls */}
          {banners.length > 1 && (
            <div className="absolute bottom-6 left-1/2 -translate-x-1/2 flex items-center gap-3 z-20">
              <button
                onClick={() =>
                  goToSlide((current - 1 + banners.length) % banners.length)
                }
                className="w-10 h-10 rounded-full bg-white shadow flex items-center justify-center"
              >
                <ChevronLeft size={18} />
              </button>

              <div className="flex gap-2">
                {banners.map((banner, index) => (
                  <button
                    key={banner.id}
                    onClick={() => goToSlide(index)}
                    className={`rounded-full transition-all ${
                      index === current
                        ? "w-8 h-2 bg-[#6B1D1D]"
                        : "w-2 h-2 bg-gray-400"
                    }`}
                  />
                ))}
              </div>

              <button
                onClick={() =>
                  goToSlide((current + 1) % banners.length)
                }
                className="w-10 h-10 rounded-full bg-white shadow flex items-center justify-center"
              >
                <ChevronRight size={18} />
              </button>
            </div>
          )}
        </div>

      </div>
    </div>
  </section>
);
}
