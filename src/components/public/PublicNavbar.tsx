import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { 
  Building2, 
  ShieldCheck, 
  Sparkles, 
  Menu, 
  X, 
  Sun, 
  Moon, 
  ArrowRight,
  ChevronRight,
  HardHat
} from 'lucide-react';
import { StructuraLogo } from '../StructuraLogo';
import { useTheme } from '../../context/ThemeContext';

export const PublicNavbar: React.FC = () => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const { theme, toggleTheme } = useTheme();
  const location = useLocation();

  const navLinks = [
    { label: 'Platform', href: '/services' },
    { label: 'About', href: '/about' },
    { label: 'Contact', href: '/contact' },
  ];

  const isActive = (path: string) => location.pathname === path;

  return (
    <header className="bg-white/95 dark:bg-[#070e17]/95 backdrop-blur-md border-b border-slate-200 dark:border-[#182c44] sticky top-0 z-50 transition-colors duration-250">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 sm:h-20">
          
          {/* Logo */}
          <Link to="/" className="flex items-center gap-2 group">
            <StructuraLogo size="md" showText={true} showSubtitle={true} />
          </Link>

          {/* Desktop Navigation Links */}
          <nav className="hidden md:flex items-center gap-8">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                to={link.href}
                className={`text-sm font-medium transition-colors duration-150 ${
                  isActive(link.href)
                    ? 'text-amber-500 font-semibold'
                    : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                {link.label}
              </Link>
            ))}
          </nav>

          {/* Right Action Buttons */}
          <div className="hidden md:flex items-center gap-3">
            {/* Theme Toggle */}
            <button
              onClick={toggleTheme}
              aria-label="Toggle dark/light theme"
              className="w-9 h-9 rounded-lg flex items-center justify-center text-slate-600 dark:text-slate-300 hover:text-slate-950 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-[#0e2136] border border-slate-200 dark:border-[#182c44] transition"
            >
              {theme === 'dark' ? (
                <Sun className="w-4 h-4 text-amber-400" />
              ) : (
                <Moon className="w-4 h-4 text-slate-700" />
              )}
            </button>

            {/* Login Link */}
            <Link
              to="/login"
              className="px-4 py-2 rounded-lg text-sm font-medium text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-[#0f243a] transition"
            >
              Sign In
            </Link>

            {/* Launch OS Workspace CTA */}
            <Link
              to="/app"
              className="px-4 py-2.5 rounded-lg bg-[#0B192C] text-white dark:bg-amber-500 dark:text-slate-950 hover:bg-[#122b4a] dark:hover:bg-amber-400 font-bold text-xs uppercase tracking-wider flex items-center gap-2 transition shadow-sm"
            >
              <span>Launch Platform</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          {/* Mobile Menu Button */}
          <div className="flex items-center gap-2 md:hidden">
            <button
              onClick={toggleTheme}
              aria-label="Toggle theme"
              className="w-8 h-8 rounded-lg flex items-center justify-center text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-[#182c44]"
            >
              {theme === 'dark' ? (
                <Sun className="w-4 h-4 text-amber-400" />
              ) : (
                <Moon className="w-4 h-4 text-slate-700" />
              )}
            </button>

            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-2 rounded-lg text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-[#182c44]"
            >
              {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Drawer */}
      {mobileMenuOpen && (
        <div className="md:hidden border-t border-slate-200 dark:border-[#182c44] bg-white dark:bg-[#070e17] px-4 pt-3 pb-6 space-y-3">
          {navLinks.map((link) => (
            <Link
              key={link.href}
              to={link.href}
              onClick={() => setMobileMenuOpen(false)}
              className={`block px-3 py-2.5 rounded-lg text-sm font-medium ${
                isActive(link.href)
                  ? 'bg-amber-500/10 text-amber-600 dark:text-amber-400 font-semibold'
                  : 'text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-[#0e2136]'
              }`}
            >
              {link.label}
            </Link>
          ))}

          <div className="pt-3 border-t border-slate-200 dark:border-[#182c44] flex flex-col gap-2">
            <Link
              to="/login"
              onClick={() => setMobileMenuOpen(false)}
              className="w-full py-2.5 rounded-lg text-center text-sm font-medium text-slate-700 dark:text-slate-200 bg-slate-100 dark:bg-[#0e2136]"
            >
              Sign In
            </Link>
            <Link
              to="/app"
              onClick={() => setMobileMenuOpen(false)}
              className="w-full py-2.5 rounded-lg text-center text-xs font-bold uppercase tracking-wider text-white bg-[#0B192C] dark:bg-amber-500 dark:text-slate-950 flex items-center justify-center gap-2"
            >
              <span>Launch Platform</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </div>
      )}
    </header>
  );
};
