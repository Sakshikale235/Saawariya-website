import { ReactNode } from 'react';

export function AuthLayout({
  title,
  subtitle,
  children,
}: {
  title: string;
  subtitle?: string;
  children: ReactNode;
}) {
  return (
    <div className="min-h-screen bg-white">
      <div className="bg-[#F7F2E8] py-10 sm:py-14">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="max-w-2xl">
            <h1
              className="text-3xl sm:text-4xl font-bold text-[#2C2C2C]"
              style={{ fontFamily: "'Playfair Display', serif" }}
            >
              {title}
            </h1>
            {subtitle ? <p className="text-sm sm:text-base text-[#6B6560] mt-3">{subtitle}</p> : null}
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 -mt-10">
        <div className="bg-white border border-gray-100 rounded-2xl shadow-sm p-5 sm:p-8">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-start">
            <div className="md:pr-6">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-12 h-12 rounded-full bg-[#6B1D1D]/10 flex items-center justify-center">
                  <span className="text-[#6B1D1D] font-serif text-xl font-bold" style={{ fontFamily: "'Cinzel', serif" }}>
                    S
                  </span>
                </div>
                <div>
                  <p className="text-sm font-semibold text-[#2C2C2C]">SAAWARIYA</p>
                  <p className="text-xs text-[#6B6560] uppercase tracking-wider">Luxury Indian Aesthetic</p>
                </div>
              </div>

              <div className="space-y-3 text-sm text-[#6B6560]">
                <p className="leading-relaxed">
                  Crafted for elegance. Sign in to continue your journey.
                </p>
                <div className="h-px bg-gray-100" />
                <p className="text-[#2C2C2C] font-medium">
                  No authentication logic included yet.
                </p>
              </div>
            </div>

            <div className="bg-[#F7F2E8] rounded-xl p-4 sm:p-6">
              {children}
            </div>
          </div>
        </div>

        <div className="text-center text-xs text-[#6B6560] mt-6 pb-10">
          © {new Date().getFullYear()} Saawariya. All rights reserved.
        </div>
      </div>
    </div>
  );
}

