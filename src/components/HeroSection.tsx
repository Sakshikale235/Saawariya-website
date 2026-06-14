import { useEffect, useState } from 'react';
import { ArrowRight, ChevronLeft, ChevronRight } from 'lucide-react';
import { useApp } from '../context/AppContext';
import { DividerLine } from './IndianMotifs';

const slides = [
  {
    title: 'Rooted in India.\nDesigned for You.',
    subtitle: 'Traditional values. Contemporary style.',
    cta: 'Shop Now',
    image: '/Picture1.png',
    category: 'men',
  },
  {
    title: 'Elegant Weaves.\nTimeless Grace.',
    subtitle: 'Handloom sarees crafted with love.',
    cta: 'Explore Women',
    image: '/Picture2.png',
    category: 'women',
  },
  {
    title: 'Sacred Spaces.\nBeautiful Homes.',
    subtitle: 'Traditional decor for modern living.',
    cta: 'Shop Home',
    image: '/Picture4.png',
    category: 'home',
  },
];

export function HeroSection() {
  const { navigate } = useApp();
  const [current, setCurrent] = useState(0);
  const [isAnimating, setIsAnimating] = useState(false);

  useEffect(() => {
    const timer = setInterval(() => {
      goToSlide((current + 1) % slides.length);
    }, 6000);
    return () => clearInterval(timer);
  }, [current]);

  const goToSlide = (index: number) => {
    if (isAnimating || index === current) return;
    setIsAnimating(true);
    setCurrent(index);
    setTimeout(() => setIsAnimating(false), 700);
  };

  return (
    <section className="relative bg-[#F7F2E8] overflow-hidden">
      <div className="max-w-7xl mx-auto">
        <div className="relative grid lg:grid-cols-2 min-h-[500px] lg:min-h-[600px]">
          <div className="flex flex-col justify-center px-6 sm:px-10 lg:px-16 py-12 lg:py-0 order-2 lg:order-1">
            <div className="max-w-lg">
              <DividerLine className="mb-6 justify-start" />
              <h2
                className="text-3xl sm:text-4xl lg:text-5xl font-bold text-[#2C2C2C] leading-tight mb-4 whitespace-pre-line transition-all duration-700"
                style={{ fontFamily: "'Playfair Display', serif" }}
              >
                {slides[current].title}
              </h2>
              <p className="text-[#6B6560] text-base sm:text-lg mb-8 transition-all duration-700">
                {slides[current].subtitle}
              </p>
              <button
                onClick={() => navigate('shop', undefined, slides[current].category)}
                className="group inline-flex items-center gap-3 bg-[#6B1D1D] text-white px-8 py-3.5 rounded-lg text-sm font-semibold tracking-wider hover:bg-[#4A1212] transition-all duration-300 shadow-md hover:shadow-lg"
              >
                {slides[current].cta}
                <ArrowRight size={16} className="group-hover:translate-x-1 transition-transform" />
              </button>
            </div>
          </div>
          <div className="relative order-1 lg:order-2 overflow-hidden">
            <div className="relative h-64 sm:h-80 lg:h-full">
              {slides.map((slide, index) => (
                <img
                  key={index}
                  src={slide.image}
                  alt={slide.title}
                  className={`absolute inset-0 w-full h-full object-cover transition-all duration-700 ${
                    index === current ? 'opacity-100 scale-100' : 'opacity-0 scale-105'
                  }`}
                />
              ))}
              <div className="absolute inset-0 bg-gradient-to-r from-[#F7F2E8] via-transparent to-transparent lg:from-[#F7F2E8]/60 lg:via-transparent" />
            </div>
          </div>
        </div>
      </div>

      <div className="absolute bottom-6 left-1/2 -translate-x-1/2 lg:left-auto lg:right-8 lg:translate-x-0 flex items-center gap-3 z-10">
        <button
          onClick={() => goToSlide((current - 1 + slides.length) % slides.length)}
          className="w-10 h-10 rounded-full bg-white/80 backdrop-blur-sm flex items-center justify-center shadow-sm hover:bg-white transition-colors"
        >
          <ChevronLeft size={18} />
        </button>
        <div className="flex items-center gap-2">
          {slides.map((_, index) => (
            <button
              key={index}
              onClick={() => goToSlide(index)}
              className={`transition-all duration-300 rounded-full ${
                index === current ? 'w-8 h-2 bg-[#6B1D1D]' : 'w-2 h-2 bg-[#6B6560]/40 hover:bg-[#6B6560]/60'
              }`}
            />
          ))}
        </div>
        <button
          onClick={() => goToSlide((current + 1) % slides.length)}
          className="w-10 h-10 rounded-full bg-white/80 backdrop-blur-sm flex items-center justify-center shadow-sm hover:bg-white transition-colors"
        >
          <ChevronRight size={18} />
        </button>
      </div>
    </section>
  );
}
