import React from 'react';
import { motion } from 'motion/react';
import { StructuraLogo } from './StructuraLogo';

interface MotionBackgroundProps {
  variant?: 'cockpit' | 'full' | 'subtle';
  className?: string;
  showLogo?: boolean;
}

export const MotionBackground: React.FC<MotionBackgroundProps> = ({
  variant = 'full',
  className = '',
  showLogo = false,
}) => {
  return (
    <div
      aria-hidden="true"
      className={`pointer-events-none fixed inset-0 overflow-hidden select-none z-0 ${className}`}
    >
      {showLogo && (
        <motion.div
          className="absolute inset-0 flex items-center justify-center pointer-events-none"
          animate={{ scale: [1, 1.05, 1], opacity: [0.15, 0.25, 0.15] }}
          transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut' }}
        >
          <StructuraLogo size="hero" showText={false} variant="auto" />
        </motion.div>
      )}

      {/* 1. Fluid, Organic Architectural Ambient Light Orbs (Clearly Visible & Smooth) */}
      <motion.div
        className="absolute -top-[10%] -left-[5%] w-[55vw] h-[55vw] max-w-[650px] max-h-[650px] rounded-full opacity-30 dark:opacity-25 blur-[90px] bg-gradient-to-br from-amber-400/80 via-amber-500/40 to-transparent pointer-events-none"
        animate={{
          x: [0, 45, -30, 0],
          y: [0, -40, 25, 0],
          scale: [1, 1.12, 0.95, 1],
        }}
        transition={{
          duration: 16,
          repeat: Infinity,
          ease: 'easeInOut',
        }}
      />

      <motion.div
        className="absolute top-[35%] -right-[10%] w-[60vw] h-[60vw] max-w-[700px] max-h-[700px] rounded-full opacity-35 dark:opacity-25 blur-[100px] bg-gradient-to-bl from-slate-400 via-sky-600/30 dark:from-slate-700 dark:via-blue-900/40 to-transparent pointer-events-none"
        animate={{
          x: [0, -50, 35, 0],
          y: [0, 50, -30, 0],
          scale: [1, 0.92, 1.14, 1],
        }}
        transition={{
          duration: 20,
          repeat: Infinity,
          ease: 'easeInOut',
          delay: 1,
        }}
      />

      <motion.div
        className="absolute -bottom-[15%] left-[25%] w-[45vw] h-[45vw] max-w-[550px] max-h-[550px] rounded-full opacity-25 dark:opacity-20 blur-[95px] bg-gradient-to-tr from-amber-500/50 via-slate-500/30 to-transparent pointer-events-none"
        animate={{
          x: [0, 35, -40, 0],
          y: [0, -35, 30, 0],
          scale: [1, 1.15, 0.9, 1],
        }}
        transition={{
          duration: 22,
          repeat: Infinity,
          ease: 'easeInOut',
          delay: 2,
        }}
      />

      {/* 2. Precision Architectural CAD Grid with crisp contrast */}
      <svg
        className="absolute inset-0 w-full h-full opacity-40 dark:opacity-30"
        xmlns="http://www.w3.org/2000/svg"
      >
        <defs>
          <pattern
            id="architectural-precision-grid"
            width="64"
            height="64"
            patternUnits="userSpaceOnUse"
          >
            <path
              d="M 64 0 L 0 0 0 64"
              fill="none"
              stroke="currentColor"
              strokeWidth="0.5"
              className="text-slate-300 dark:text-slate-700/70"
            />
            {/* Architectural Grid Intersection Tick */}
            <path
              d="M -3 0 L 3 0 M 0 -3 L 0 3"
              stroke="currentColor"
              strokeWidth="0.75"
              className="text-slate-400 dark:text-slate-600"
            />
          </pattern>
        </defs>
        <rect width="100%" height="100%" fill="url(#architectural-precision-grid)" />
      </svg>

      {/* 3. Visible, Graceful Floating Architectural Crosshairs & Datum Markers */}
      <motion.div
        className="absolute top-24 right-16 hidden lg:flex items-center gap-2 text-slate-400/60 dark:text-slate-500/50 pointer-events-none"
        animate={{
          y: [0, -8, 0],
          opacity: [0.4, 0.8, 0.4],
        }}
        transition={{
          duration: 6,
          repeat: Infinity,
          ease: 'easeInOut',
        }}
      >
        <div className="relative w-6 h-6">
          <div className="absolute inset-x-0 top-1/2 h-[1px] bg-current" />
          <div className="absolute inset-y-0 left-1/2 w-[1px] bg-current" />
          <div className="absolute inset-1 rounded-full border border-current" />
        </div>
        <span className="text-[10px] font-mono tracking-wider">AXIS N.01 [DATUM +12.4m]</span>
      </motion.div>

      <motion.div
        className="absolute bottom-28 left-12 hidden lg:flex items-center gap-2 text-amber-500/50 dark:text-amber-400/40 pointer-events-none"
        animate={{
          y: [0, 10, 0],
          opacity: [0.35, 0.75, 0.35],
        }}
        transition={{
          duration: 7,
          repeat: Infinity,
          ease: 'easeInOut',
          delay: 1.5,
        }}
      >
        <div className="relative w-6 h-6">
          <div className="absolute inset-x-0 top-1/2 h-[1px] bg-current" />
          <div className="absolute inset-y-0 left-1/2 w-[1px] bg-current" />
          <div className="absolute inset-1.5 border border-current transform rotate-45" />
        </div>
        <span className="text-[10px] font-mono tracking-wider">BM-04 REF ±0.00</span>
      </motion.div>

      {/* 4. Subtle CAD Elevation Datum Markers in corners */}
      <div className="absolute top-4 left-4 hidden sm:flex items-center gap-1.5 text-[10px] font-mono text-slate-400 dark:text-slate-500 select-none">
        <span>REF: CAD-GRID [0,0]</span>
        <span className="w-1.5 h-1.5 rounded-full bg-amber-500/80 dark:bg-amber-400/80 inline-block animate-pulse" />
        <span>TOLERANCE ±0.5mm</span>
      </div>
      
      <div className="absolute bottom-4 right-4 hidden sm:flex items-center gap-1.5 text-[10px] font-mono text-slate-400 dark:text-slate-500 select-none">
        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500/80 inline-block animate-pulse" />
        <span>ARCHITECTURAL INTEGRITY LEVEL 4</span>
      </div>
    </div>
  );
};
