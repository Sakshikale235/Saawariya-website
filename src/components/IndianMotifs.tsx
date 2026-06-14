import { theme } from '../theme';

export function CornerMotif({ className = '', color = theme.colors.gold }: { className?: string; color?: string }) {
  return (
    <svg className={className} viewBox="0 0 60 60" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M2 2C2 30 30 30 30 58" stroke={color} strokeWidth="1.5" fill="none" />
      <circle cx="8" cy="8" r="3" fill={color} opacity="0.6" />
      <path d="M2 20 L8 14 L14 20" stroke={color} strokeWidth="1" fill="none" />
      <path d="M20 2 L14 8 L20 14" stroke={color} strokeWidth="1" fill="none" />
    </svg>
  );
}

export function DividerLine({ className = '' }: { className?: string }) {
  return (
    <div className={`flex items-center justify-center gap-3 ${className}`}>
      <div className="h-px w-16 bg-[#C4A35A]" />
      <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
        <path d="M10 2L12 8L18 10L12 12L10 18L8 12L2 10L8 8L10 2Z" stroke="#C4A35A" strokeWidth="1" fill="none" />
      </svg>
      <div className="h-px w-16 bg-[#C4A35A]" />
    </div>
  );
}

export function LotusIcon({ className = '', color = '#C4A35A' }: { className?: string; color?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M12 4C10 8 8 12 4 14C8 16 10 20 12 22C14 20 16 16 20 14C16 12 14 8 12 4Z" stroke={color} strokeWidth="1.5" fill="none" />
      <path d="M12 8C10 10 9 12 7 13C9 14 10 16 12 17C14 16 15 14 17 13C15 12 14 10 12 8Z" stroke={color} strokeWidth="1" fill="none" />
    </svg>
  );
}

export function ArchFrame({ className = '', children }: { className?: string; children?: React.ReactNode }) {
  return (
    <div className={`relative ${className}`}>
      <svg className="absolute inset-0 w-full h-full pointer-events-none" viewBox="0 0 100 100" preserveAspectRatio="none">
        <path d="M0 100 L0 30 Q50 0 100 30 L100 100" stroke="#C4A35A" strokeWidth="0.5" fill="none" opacity="0.3" />
      </svg>
      {children}
    </div>
  );
}

export function PaisleyPattern({ className = '' }: { className?: string }) {
  return (
    <svg className={`absolute inset-0 w-full h-full opacity-[0.04] pointer-events-none ${className}`} viewBox="0 0 200 200" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <pattern id="paisley" x="0" y="0" width="40" height="40" patternUnits="userSpaceOnUse">
          <path d="M20 5C15 5 10 10 10 15C10 20 15 22 20 25C25 22 30 20 30 15C30 10 25 5 20 5Z" stroke="#6B1D1D" strokeWidth="1" fill="none" />
          <circle cx="20" cy="15" r="3" stroke="#6B1D1D" strokeWidth="0.5" fill="none" />
          <path d="M20 25 C20 30, 15 35, 20 38 C25 35, 20 30, 20 25" stroke="#6B1D1D" strokeWidth="0.5" fill="none" />
        </pattern>
      </defs>
      <rect width="100%" height="100%" fill="url(#paisley)" />
    </svg>
  );
}
