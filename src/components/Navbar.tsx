import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Vote, ShieldCheck, LogOut, Menu, X } from 'lucide-react';
import { cn } from '../utils/utils';

export const Navbar = () => {
  const location = useLocation();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const isAdmin = location.pathname.startsWith('/admin');

  const toggleMenu = () => setIsMenuOpen(!isMenuOpen);
  const closeMenu = () => setIsMenuOpen(false);

  return (
    <nav className="sticky top-0 z-50 bg-white/80 backdrop-blur-md border-b border-slate-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16 items-center">
          <Link to="/" className="flex items-center space-x-2 group" onClick={closeMenu}>
            <div className="bg-primary p-1.5 rounded-lg group-hover:scale-110 transition-transform">
              <Vote className="w-6 h-6 text-white" />
            </div>
            <span className="text-xl font-bold tracking-tight text-slate-900">
              SmartVote<span className="text-primary">AI</span>
            </span>
          </Link>

          {/* Desktop Menu */}
          <div className="hidden md:flex items-center space-x-8">
            <NavLink to="/" active={location.pathname === '/'}>Dashboard</NavLink>
            <NavLink to="/register" active={location.pathname === '/register'}>Register</NavLink>
            <NavLink to="/results" active={location.pathname === '/results'}>Results</NavLink>
            
            {isAdmin ? (
              <Link
                to="/"
                className="flex items-center space-x-1 text-sm font-medium text-red-600 hover:text-red-700"
              >
                <LogOut className="w-4 h-4" />
                <span>Exit Admin</span>
              </Link>
            ) : (
              <Link
                to="/admin/login"
                className="flex items-center space-x-1 px-4 py-2 rounded-full bg-slate-100 text-slate-700 text-sm font-semibold hover:bg-slate-200 transition-colors"
              >
                <ShieldCheck className="w-4 h-4" />
                <span>Admin Login</span>
              </Link>
            )}
          </div>

          {/* Mobile Menu Button */}
          <div className="md:hidden flex items-center">
            <button
              onClick={toggleMenu}
              className="p-2 rounded-lg text-slate-600 hover:bg-slate-100 transition-colors"
            >
              {isMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Menu Overlay */}
      {isMenuOpen && (
        <div className="md:hidden bg-white border-b border-slate-200 py-4 px-4 space-y-4 shadow-xl animate-in slide-in-from-top duration-200">
          <div className="flex flex-col space-y-4">
            <MobileNavLink to="/" active={location.pathname === '/'} onClick={closeMenu}>Dashboard</MobileNavLink>
            <MobileNavLink to="/register" active={location.pathname === '/register'} onClick={closeMenu}>Register</MobileNavLink>
            <MobileNavLink to="/results" active={location.pathname === '/results'} onClick={closeMenu}>Results</MobileNavLink>
            
            <div className="pt-4 border-t border-slate-100">
              {isAdmin ? (
                <Link
                  to="/"
                  onClick={closeMenu}
                  className="flex items-center space-x-2 text-sm font-bold text-red-600"
                >
                  <LogOut className="w-5 h-5" />
                  <span>Exit Admin</span>
                </Link>
              ) : (
                <Link
                  to="/admin/login"
                  onClick={closeMenu}
                  className="flex items-center justify-center space-x-2 w-full py-3 rounded-xl bg-slate-100 text-slate-700 font-bold hover:bg-slate-200 transition-colors"
                >
                  <ShieldCheck className="w-5 h-5" />
                  <span>Admin Login</span>
                </Link>
              )}
            </div>
          </div>
        </div>
      )}
    </nav>
  );
};

const NavLink = ({ to, children, active }: { to: string; children: React.ReactNode; active: boolean }) => (
  <Link
    to={to}
    className={cn(
      "text-sm font-semibold transition-colors",
      active ? "text-primary" : "text-slate-600 hover:text-primary"
    )}
  >
    {children}
  </Link>
);

const MobileNavLink = ({ to, children, active, onClick }: { to: string; children: React.ReactNode; active: boolean; onClick: () => void }) => (
  <Link
    to={to}
    onClick={onClick}
    className={cn(
      "text-lg font-bold transition-colors block px-4 py-2 rounded-xl",
      active ? "bg-primary/10 text-primary" : "text-slate-600 hover:bg-slate-50"
    )}
  >
    {children}
  </Link>
);
