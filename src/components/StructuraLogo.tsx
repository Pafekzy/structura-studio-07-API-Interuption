import React from 'react';

interface StructuraLogoProps {
  size?: 'sm' | 'md' | 'lg' | 'xl' | 'hero';
  showText?: boolean;
  showSubtitle?: boolean;
  showSlogan?: boolean;
  variant?: 'auto' | 'light' | 'dark';
  className?: string;
}

export const StructuraLogo: React.FC<StructuraLogoProps> = ({
  size = 'md',
  showText = true,
  showSubtitle = false,
  showSlogan = false,
  variant = 'auto',
  className = '',
}) => {
  // Dimensions based on size
  const iconDimensions = {
    sm: { width: 28, height: 28 },
    md: { width: 36, height: 36 },
    lg: { width: 48, height: 48 },
    xl: { width: 64, height: 64 },
    hero: { width: 96, height: 96 },
  }[size];

  const textSizes = {
    sm: 'text-sm tracking-tight',
    md: 'text-base sm:text-lg tracking-tight',
    lg: 'text-xl sm:text-2xl tracking-tight',
    xl: 'text-2xl sm:text-3xl tracking-tight',
    hero: 'text-3xl sm:text-4xl tracking-tight',
  }[size];

  const subTextSizes = {
    sm: 'text-[8px] tracking-[0.2em]',
    md: 'text-[9px] tracking-[0.22em]',
    lg: 'text-[11px] tracking-[0.24em]',
    xl: 'text-[12px] tracking-[0.26em]',
    hero: 'text-[14px] tracking-[0.28em]',
  }[size];

  // Unique ID for gradients to prevent clashes
  const gradId = React.useId().replace(/:/g, '');

  return (
    <div className={`flex items-center gap-2.5 sm:gap-3 select-none ${className}`}>
      {/* 3D Isometric Hexagonal Monogram SVG */}
      <svg
        width={iconDimensions.width}
        height={iconDimensions.height}
        viewBox="0 0 100 100"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="shrink-0 drop-shadow-sm transition-transform duration-300 group-hover:scale-105"
      >
        <defs>
          {/* Deep Navy Gradients */}
          <linearGradient id={`navyTop_${gradId}`} x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#1E3E62" />
            <stop offset="50%" stopColor="#112942" />
            <stop offset="100%" stopColor="#0B1A2C" />
          </linearGradient>

          <linearGradient id={`navyDark_${gradId}`} x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#163250" />
            <stop offset="100%" stopColor="#081422" />
          </linearGradient>

          <linearGradient id={`navyMid_${gradId}`} x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#254A72" />
            <stop offset="100%" stopColor="#142E4B" />
          </linearGradient>

          {/* Architectural Gold Gradients */}
          <linearGradient id={`goldMain_${gradId}`} x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#FBBF24" />
            <stop offset="40%" stopColor="#F59E0B" />
            <stop offset="100%" stopColor="#B45309" />
          </linearGradient>

          <linearGradient id={`goldLight_${gradId}`} x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#FDE68A" />
            <stop offset="100%" stopColor="#D97706" />
          </linearGradient>

          <linearGradient id={`goldDark_${gradId}`} x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#D97706" />
            <stop offset="100%" stopColor="#78350F" />
          </linearGradient>

          {/* Steel Gray Gradients */}
          <linearGradient id={`steelLight_${gradId}`} x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#CBD5E1" />
            <stop offset="100%" stopColor="#64748B" />
          </linearGradient>

          <linearGradient id={`steelDark_${gradId}`} x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#64748B" />
            <stop offset="100%" stopColor="#334155" />
          </linearGradient>

          {/* Glow filter */}
          <filter id={`goldGlow_${gradId}`} x="-20%" y="-20%" width="140%" height="140%">
            <feDropShadow dx="0" dy="1" stdDeviation="1.5" floodColor="#F59E0B" floodOpacity="0.3" />
          </filter>
        </defs>

        {/* --- 1. TOP NAVY HEXAGONAL 'S' LOOP --- */}
        {/* Top-Right Upper Bevel */}
        <path
          d="M50 8 L68 18 L68 32 L50 22 Z"
          fill={`url(#navyMid_${gradId})`}
        />
        {/* Top-Left Roof Crest */}
        <path
          d="M50 8 L32 18 L50 28 L68 18 Z"
          fill={`url(#navyTop_${gradId})`}
        />
        {/* Left Upper Arm */}
        <path
          d="M32 18 L32 40 L40 45 L40 23 Z"
          fill={`url(#navyDark_${gradId})`}
        />
        {/* Upper Outer Right Edge */}
        <path
          d="M68 18 L68 36 L60 31 L60 23 Z"
          fill={`url(#navyDark_${gradId})`}
        />

        {/* --- 2. INNER SKYSCRAPER TOWERS (The core architectural skyline) --- */}
        {/* Left Skyscraper (Steel Gray) */}
        <path
          d="M41 33 L45 31 L45 50 L41 47 Z"
          fill={`url(#steelLight_${gradId})`}
        />
        <path
          d="M45 31 L47 32 L47 51 L45 50 Z"
          fill={`url(#steelDark_${gradId})`}
        />

        {/* Center Skyscraper - Tallest Golden Tower */}
        <path
          d="M48 24 L53 21 L53 54 L48 51 Z"
          fill={`url(#goldLight_${gradId})`}
          filter={`url(#goldGlow_${gradId})`}
        />
        <path
          d="M53 21 L55 23 L55 55 L53 54 Z"
          fill={`url(#goldDark_${gradId})`}
        />

        {/* Right Skyscraper (Navy Architecture) */}
        <path
          d="M56 31 L60 28 L60 55 L56 52 Z"
          fill={`url(#navyMid_${gradId})`}
        />
        <path
          d="M60 28 L61 29 L61 55 L60 55 Z"
          fill={`url(#navyDark_${gradId})`}
        />

        {/* --- 3. MIDDLE 'S' DIAGONAL TRANSITION --- */}
        <path
          d="M32 40 L53 53 L53 62 L32 49 Z"
          fill={`url(#navyTop_${gradId})`}
        />
        <path
          d="M53 53 L61 48 L61 57 L53 62 Z"
          fill={`url(#navyDark_${gradId})`}
        />

        {/* --- 4. BOTTOM GOLD ACCENT ARM (Isometric Highlight) --- */}
        {/* Bottom Left Gold Arm - Upper Facet */}
        <path
          d="M32 49 L53 62 L53 68 L32 55 Z"
          fill={`url(#goldLight_${gradId})`}
        />
        {/* Bottom Left Gold Arm - Front 3D Drop */}
        <path
          d="M32 55 L53 68 L53 74 L32 61 Z"
          fill={`url(#goldMain_${gradId})`}
        />
        {/* Bottom Left Gold Base Bevel */}
        <path
          d="M53 68 L53 74 L50 77 L32 61 Z"
          fill={`url(#goldDark_${gradId})`}
        />

        {/* --- 5. BOTTOM-RIGHT STEEL CORNER & BASE FINISH --- */}
        {/* Right Lower Outer Wall (Steel Gray) */}
        <path
          d="M61 41 L68 46 L68 64 L61 58 Z"
          fill={`url(#steelLight_${gradId})`}
        />
        {/* Bottom Right Hex Base Return */}
        <path
          d="M68 64 L53 74 L50 77 L68 67 Z"
          fill={`url(#steelDark_${gradId})`}
        />
        {/* Inner bottom shadow shelf */}
        <path
          d="M53 62 L61 57 L61 63 L53 68 Z"
          fill={`url(#navyDark_${gradId})`}
        />
      </svg>

      {/* Typography Lockup */}
      {showText && (
        <div className="flex flex-col justify-center">
          <div className="flex items-baseline font-black leading-none tracking-tight">
            <span
              className={`font-black uppercase tracking-[0.14em] font-sans ${
                variant === 'light'
                  ? 'text-[#0B192C]'
                  : variant === 'dark'
                  ? 'text-white'
                  : 'text-[#0B192C] dark:text-white'
              } ${textSizes}`}
            >
              STRUCTUR
            </span>
            {/* Custom Architectural Golden 'A' */}
            <span
              className={`font-black uppercase tracking-[0.06em] bg-gradient-to-br from-amber-400 via-amber-500 to-amber-600 bg-clip-text text-transparent drop-shadow-xs ${textSizes}`}
            >
              A
            </span>
          </div>

          {/* Optional Subtitle: CONSTRUCTION | ENGINEERING | INFRASTRUCTURE */}
          {showSubtitle && (
            <div
              className={`font-semibold uppercase text-slate-500 dark:text-slate-400 mt-1 ${subTextSizes}`}
            >
              CONSTRUCTION <span className="text-amber-500 font-bold mx-0.5">|</span> ENGINEERING <span className="text-amber-500 font-bold mx-0.5">|</span> INFRASTRUCTURE
            </div>
          )}

          {/* Optional Slogan: BUILDING TOMORROW. TOGETHER. */}
          {showSlogan && (
            <div className="flex items-center gap-1.5 mt-1">
              <span className="h-[1px] w-4 bg-slate-300 dark:bg-slate-700" />
              <span className="text-[8px] sm:text-[9px] font-medium tracking-[0.2em] text-slate-400 dark:text-slate-500 uppercase">
                BUILDING TOMORROW. TOGETHER.
              </span>
              <span className="h-[1px] w-4 bg-slate-300 dark:bg-slate-700" />
            </div>
          )}
        </div>
      )}
    </div>
  );
};
