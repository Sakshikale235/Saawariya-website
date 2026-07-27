import { useState, useRef, useEffect } from 'react';
import { Search, Heart, ShoppingBag, User, Menu, X } from 'lucide-react';
import { useApp } from '../context/AppContext';
import { useSupabaseAuth } from "../context/SupabaseAuthContext";
import { DividerLine } from './IndianMotifs';

export function Navbar() {
  const { page, navigate, cartCount, wishlistCount, searchQuery, setSearchQuery } = useApp();
  const { session, loading } = useSupabaseAuth();
  const [localQuery, setLocalQuery] = useState(searchQuery);
  const [searchOpen, setSearchOpen] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const searchRef = useRef<HTMLDivElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setLocalQuery(searchQuery);
  }, [searchQuery]);

  useEffect(() => {
    const timer = setTimeout(() => {
      if (localQuery !== searchQuery) {
        setSearchQuery(localQuery);
        if (localQuery.trim() !== '' && page !== 'shop') {
          navigate('shop');
        }
      }
    }, 300);
    return () => clearTimeout(timer);
  }, [localQuery, searchQuery, setSearchQuery, page, navigate]);

  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(e.target as Node)) {
        setSearchOpen(false);
      }
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  const handleSearchSubmit = () => {
    setSearchQuery(localQuery);
    if (page !== 'shop') {
      navigate('shop');
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      handleSearchSubmit();
    }
  };

  const navItems = [
    { label: 'MEN', category: 'Men' },
    { label: 'WOMEN', category: 'Women' },
    { label: 'COLLECTIONS', category: 'collections' },
  ];

  return (
    <>
      <div className="bg-[#6B1D1D] text-white text-xs py-1.5 text-center tracking-wide">
        Proudly Indian. Thoughtfully Coded.
      </div>
      <nav className="sticky top-0 z-50 bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-4">
              <button
                className="lg:hidden p-2 hover:bg-gray-100 rounded-lg"
                onClick={() => setMenuOpen(!menuOpen)}
              >
                {menuOpen ? <X size={20} /> : <Menu size={20} />}
              </button>
              <button
                onClick={() => navigate('home')}
                className="flex items-center gap-2"
              >
                <div className="w-10 h-10 rounded-full border-2 border-[#C4A35A] flex items-center justify-center bg-[#F7F2E8]">
                  <span className="font-serif text-[#6B1D1D] text-lg font-bold" style={{ fontFamily: "'Cinzel', serif" }}>S</span>
                </div>
                <div className="hidden sm:block">
                  <h1 className="text-[#6B1D1D] text-lg font-bold tracking-wide leading-tight" style={{ fontFamily: "'Cinzel', serif" }}>
                    SAAWARIYA
                  </h1>
                  <p className="text-[#6B6560] text-[10px] tracking-[0.2em] uppercase">Indian Coded</p>
                </div>
              </button>
            </div>

            <div className="hidden lg:flex items-center gap-1">
              {navItems.map((item) => (
                <button
                  key={item.category}
                  onClick={() => navigate('shop', undefined, item.category)}
                  className={`px-3 py-2 text-xs font-medium tracking-wider transition-colors duration-300 hover:text-[#6B1D1D] ${
                    page === 'shop' && searchQuery === '' ? 'text-[#6B1D1D]' : 'text-[#2C2C2C]'
                  }`}
                >
                  {item.label}
                </button>
              ))}
            </div>

            <div className="flex items-center gap-1 sm:gap-2">
              <div className="hidden md:flex items-center gap-2 bg-[#F7F2E8] border border-transparent focus-within:border-[#C4A35A]/50 rounded-lg px-3 py-1.5 w-60 lg:w-72 transition-all duration-300">
                <Search size={16} className="text-[#6B6560] flex-shrink-0" />
                <input
                  type="text"
                  placeholder="Search for sarees, paithani, peshwai..."
                  value={localQuery}
                  onChange={(e) => setLocalQuery(e.target.value)}
                  onKeyDown={handleKeyDown}
                  className="bg-transparent text-xs w-full outline-none text-[#2C2C2C] placeholder:text-[#6B6560]/60"
                />
                {localQuery && (
                  <button
                    onClick={() => { setLocalQuery(''); setSearchQuery(''); }}
                    className="p-0.5 hover:bg-gray-200/50 rounded-full transition-colors flex-shrink-0"
                  >
                    <X size={14} className="text-[#6B6560]" />
                  </button>
                )}
              </div>

              <div ref={searchRef} className="relative md:hidden">
                <button
                  onClick={() => setSearchOpen(!searchOpen)}
                  className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  <Search size={20} className="text-[#2C2C2C]" />
                </button>
                {searchOpen && (
                  <div className="absolute right-0 top-full mt-2 w-72 sm:w-96 bg-white rounded-xl shadow-lg border border-gray-100 p-3 z-50">
                    <div className="flex items-center gap-2 bg-[#F7F2E8] rounded-lg px-3 py-2">
                      <Search size={16} className="text-[#6B6560] flex-shrink-0" />
                      <input
                        type="text"
                        placeholder="Search for sarees, paithani, peshwai..."
                        value={localQuery}
                        onChange={(e) => setLocalQuery(e.target.value)}
                        onKeyDown={handleKeyDown}
                        className="bg-transparent text-sm w-full outline-none text-[#2C2C2C] placeholder:text-[#6B6560]/60"
                        autoFocus
                      />
                      {localQuery && (
                        <button
                          onClick={() => { setLocalQuery(''); setSearchQuery(''); }}
                          className="flex-shrink-0"
                        >
                          <X size={14} className="text-[#6B6560]" />
                        </button>
                      )}
                    </div>
                    <div className="mt-2">
                      <p className="text-xs text-[#6B6560] uppercase tracking-wider mb-2 px-1">Popular Searches</p>
                      <div className="flex flex-wrap gap-1.5">
                        {['Saree', 'Kurta'].map((term) => (
                          <button
                            key={term}
                            onClick={() => { setLocalQuery(term); setSearchQuery(term); navigate('shop'); setSearchOpen(false); }}
                            className="text-xs px-3 py-1.5 bg-[#F7F2E8] rounded-full text-[#2C2C2C] hover:bg-[#6B1D1D] hover:text-white transition-colors"
                          >
                            {term}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>
                )}
              </div>

              <button
                onClick={() => { if (loading) return; navigate('profile'); }}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors hidden sm:block"
                aria-label="Profile"
              >
                <User size={20} className="text-[#2C2C2C]" />
              </button>

              <button
                onClick={() => navigate('wishlist')}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors relative"
              >
                <Heart size={20} className="text-[#2C2C2C]" />
                {wishlistCount > 0 && (
                  <span className="absolute -top-0.5 -right-0.5 w-5 h-5 bg-[#6B1D1D] text-white text-[10px] font-bold rounded-full flex items-center justify-center">
                    {wishlistCount}
                  </span>
                )}
              </button>

              <button
                onClick={() => navigate('cart')}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors relative"
              >
                <ShoppingBag size={20} className="text-[#2C2C2C]" />
                {cartCount > 0 && (
                  <span className="absolute -top-0.5 -right-0.5 w-5 h-5 bg-[#6B1D1D] text-white text-[10px] font-bold rounded-full flex items-center justify-center">
                    {cartCount}
                  </span>
                )}
              </button>
            </div>
          </div>

          <div className="lg:hidden" ref={menuRef}>
            {menuOpen && (
              <div className="border-t border-gray-100 bg-white shadow-lg">
                <div className="px-4 py-3 space-y-1">
                  {navItems.map((item) => (
                    <button
                      key={item.category}
                      onClick={() => { navigate('shop', undefined, item.category); setMenuOpen(false); }}
                      className="block w-full text-left px-3 py-2.5 text-sm text-[#2C2C2C] hover:bg-[#F7F2E8] rounded-lg transition-colors"
                    >
                      {item.label}
                    </button>
                  ))}
                  <DividerLine className="py-3" />
                  <button
                    onClick={() => { navigate('profile'); setMenuOpen(false); }}
                    className="block w-full text-left px-3 py-2.5 text-sm text-[#2C2C2C] hover:bg-[#F7F2E8] rounded-lg transition-colors"
                  >
                    My Profile
                  </button>
                  <button
                    onClick={() => { navigate('wishlist'); setMenuOpen(false); }}
                    className="block w-full text-left px-3 py-2.5 text-sm text-[#2C2C2C] hover:bg-[#F7F2E8] rounded-lg transition-colors"
                  >
                    My Wishlist
                  </button>
                  <button
                    onClick={() => { navigate('cart'); setMenuOpen(false); }}
                    className="block w-full text-left px-3 py-2.5 text-sm text-[#2C2C2C] hover:bg-[#F7F2E8] rounded-lg transition-colors"
                  >
                    My Cart
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </nav>
    </>
  );
}
