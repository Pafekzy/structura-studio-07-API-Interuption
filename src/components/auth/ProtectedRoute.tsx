import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { StructuraLogo } from '../StructuraLogo';
import { motion } from 'motion/react';

interface ProtectedRouteProps {
  children: React.ReactNode;
}

export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children }) => {
  const { isAuthenticated, isLoading } = useAuth();
  const location = useLocation();

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#070e17] flex flex-col items-center justify-center text-white p-6 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-96 h-96 bg-amber-500/10 rounded-full blur-3xl pointer-events-none -mr-32 -mt-32" />
        <div className="relative z-10 flex flex-col items-center text-center">
          <StructuraLogo size="hero" showText={true} showSubtitle={true} variant="dark" />
          
          <div className="w-64 h-1 bg-slate-800 rounded-full mt-8 overflow-hidden relative">
            <motion.div
              initial={{ x: '-100%' }}
              animate={{ x: '100%' }}
              transition={{ repeat: Infinity, duration: 1.2, ease: 'easeInOut' }}
              className="w-1/2 h-full bg-gradient-to-r from-amber-500 via-amber-400 to-amber-600 rounded-full"
            />
          </div>
          
          <p className="text-xs uppercase tracking-[0.25em] text-slate-400 mt-4 font-mono">
            Verifying Authenticated Clearance & Profile...
          </p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    // Redirect to login, preserving intended destination
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  return <>{children}</>;
};
