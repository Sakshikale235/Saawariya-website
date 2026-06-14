import { useEffect, useState } from 'react';
import { useApp } from '../context/AppContext';

export function LoadingScreen() {
  const { navigate } = useApp();
  const [progress, setProgress] = useState(0);
  const [fadeOut, setFadeOut] = useState(false);

  useEffect(() => {
    const interval = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 100) {
          clearInterval(interval);
          setTimeout(() => {
            setFadeOut(true);
            setTimeout(() => navigate('home'), 600);
          }, 300);
          return 100;
        }
        return prev + Math.random() * 15 + 5;
      });
    }, 200);
    return () => clearInterval(interval);
  }, [navigate]);

  return (
    <div
      className={`fixed inset-0 z-[100] bg-[#6B1D1D] flex flex-col items-center justify-center transition-opacity duration-600 ${
        fadeOut ? 'opacity-0 pointer-events-none' : 'opacity-100'
      }`}
    >
      <div className="relative w-full max-w-md px-8">

        <div className="text-center mb-8">
          <div className="w-20 h-20 rounded-full border-2 border-[#C4A35A] flex items-center justify-center mx-auto mb-4 bg-[#F7F2E8]/10">
            <span className="text-[#C4A35A] text-3xl font-bold" style={{ fontFamily: "'Cinzel', serif" }}>
              S
            </span>
          </div>
          <h1 className="text-[#C4A35A] text-2xl font-bold tracking-[0.3em] mb-1" style={{ fontFamily: "'Cinzel', serif" }}>
            SAAWARIYA
          </h1>
          <p className="text-[#C4A35A]/80 text-xs tracking-[0.2em] uppercase">Indian Coded</p>
        </div>
        <div className="text-center mb-6">
          <p className="text-[#C4A35A]/70 text-sm tracking-wide">Timeless Traditions. Modern You.</p>
        </div>
        <div className="grid grid-cols-5 gap-2 mb-8 max-w-sm mx-auto">
          {['WOMEN', 'MEN', 'ACCESSORIES', 'HOME', 'GIFTS'].map((label) => (
            <div key={label} className="text-center">
              <div className="w-10 h-10 rounded-full border border-[#C4A35A]/40 flex items-center justify-center mx-auto mb-1">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#C4A35A" strokeWidth="1">
                  <circle cx="12" cy="8" r="5" />
                  <path d="M12 13v8M8 21h8" />
                </svg>
              </div>
              <span className="text-[#C4A35A]/60 text-[9px] tracking-wider">{label}</span>
            </div>
          ))}
        </div>
        <div className="relative h-1 bg-[#C4A35A]/20 rounded-full overflow-hidden">
          <div
            className="absolute top-0 left-0 h-full bg-[#C4A35A] rounded-full transition-all duration-300 ease-out"
            style={{ width: `${Math.min(progress, 100)}%` }}
          />
        </div>
        <p className="text-center text-[#C4A35A]/50 text-xs mt-3 tracking-[0.2em] uppercase">Loading...</p>
      </div>
      <div className="absolute bottom-0 left-0 right-0">
        <div className="grid grid-cols-4 gap-px bg-[#C4A35A]/10">
          {[
            { icon: 'Shield', label: 'Premium Quality', sub: 'Finest Materials' },
            { icon: 'Heart', label: 'Made in India', sub: 'Proudly Indian' },
            { icon: 'Lock', label: 'Secure Payments', sub: '100% Safe & Secure' },
            { icon: 'Truck', label: 'Fast Delivery', sub: 'Across India' },
          ].map((item) => (
            <div key={item.label} className="py-4 text-center">
              <p className="text-[#C4A35A] text-[10px] font-semibold tracking-wider uppercase">{item.label}</p>
              <p className="text-[#C4A35A]/50 text-[9px]">{item.sub}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
