import { useState, useRef, useEffect, ReactNode } from 'react';
import { 
  LayoutDashboard, 
  Package, 
  Tags, 
  ClipboardList, 
  Image as ImageIcon, 
  Layers, 
  Users, 
  Settings as SettingsIcon, 
  Menu, 
  X, 
  Store, 
  LogOut, 
  ChevronDown 
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { useNavigate } from "react-router-dom"; 
import { useSupabaseAuth } from '../../context/SupabaseAuthContext';

interface AdminLayoutProps {
  children: ReactNode;
  activePage: string;
}

export function AdminLayout({ children, activePage }: AdminLayoutProps) {
  const navigate = useNavigate();
  const { session, logout } = useSupabaseAuth();
  
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [profileDropdownOpen, setProfileDropdownOpen] = useState(false);
  
  const profileRef = useRef<HTMLDivElement>(null);

  // Close dropdown on click outside
  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (profileRef.current && !profileRef.current.contains(e.target as Node)) {
        setProfileDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  const menuItems = [
    { label: 'Dashboard', page: 'admin/dashboard', icon: LayoutDashboard },
    { label: 'Products', page: 'admin/products', icon: Package },
    { label: 'Categories', page: 'admin/categories', icon: Tags },
    { label: 'Orders', page: 'admin/orders', icon: ClipboardList },
    { label: 'Hero Banners', page: 'admin/hero-banners', icon: ImageIcon },
    { label: 'Homepage Management', page: 'admin/homepage', icon: Layers },
    { label: 'Users', page: 'admin/users', icon: Users },
    { label: 'Settings', page: 'admin/settings', icon: SettingsIcon },
  ];

   const handleLogout = async () => {
  try {
    await logout();
    navigate('/', { replace: true });
  } catch (err) {
    console.error('Logout error:', err);
    navigate('/', { replace: true });
  }
};

  const getPageTitle = () => {
    const activeItem = menuItems.find(item => item.page === activePage);
    return activeItem ? activeItem.label : 'Admin Portal';
  };

  // Extract initials or name for profile display
  const userEmail = session?.user?.email ?? 'admin@saawariya.com';
  const displayEmail = session?.user?.email ?? 'admin@saawariya.com';
  const initials = userEmail.substring(0, 2).toUpperCase();

  return (
    <div className="min-h-screen bg-[#FDFBF7] flex">
      {/* Sidebar - Desktop */}
      <aside className="hidden lg:flex flex-col w-64 bg-[#2C2C2C] text-[#D4CFC8] border-r border-[#C4A35A]/30 shrink-0">
        {/* Sidebar Header / Brand */}
        <div className="h-16 flex items-center gap-3 px-6 border-b border-[#C4A35A]/10 bg-[#252525]">
          <div className="w-8 h-8 rounded-full border border-[#C4A35A] flex items-center justify-center bg-[#F7F2E8]">
            <span className="font-accent text-[#6B1D1D] text-sm font-bold">S</span>
          </div>
          <div>
            <h2 className="text-[#FDFBF7] text-sm font-bold tracking-wider uppercase font-accent">
              SAAWARIYA
            </h2>
            <p className="text-[#C4A35A] text-[9px] tracking-widest uppercase">Admin Panel</p>
          </div>
        </div>

        {/* Sidebar Links */}
        <nav className="flex-1 px-4 py-6 space-y-1.5 overflow-y-auto">
          {menuItems.map((item) => {
            const Icon = item.icon;
            const isActive = activePage === item.page;
            return (
              <button
                key={item.page}
                onClick={() => navigate(`/${item.page}`)}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-all duration-300 ${
                  isActive
                    ? 'bg-[#6B1D1D] text-[#FDFBF7] border-l-4 border-[#C4A35A]'
                    : 'hover:bg-[#383838] hover:text-[#FDFBF7]'
                }`}
              >
                <Icon size={18} className={isActive ? 'text-[#C4A35A]' : 'text-[#D4CFC8]'} />
                <span>{item.label}</span>
              </button>
            );
          })}
        </nav>

        {/* Sidebar Footer */}
        <div className="p-4 border-t border-[#C4A35A]/10 bg-[#252525] flex items-center justify-between">
          <button
            onClick={() => navigate('/')}
            className="flex items-center gap-2 text-xs font-semibold text-[#C4A35A] hover:text-[#D4B76A] transition-colors"
          >
            <Store size={14} />
            <span>Storefront</span>
          </button>
          <button
            onClick={handleLogout}
            className="flex items-center gap-2 text-xs font-semibold text-red-400 hover:text-red-300 transition-colors"
          >
            <LogOut size={14} />
            <span>Logout</span>
          </button>
        </div>
      </aside>

      {/* Sidebar - Mobile drawer */}
      {sidebarOpen && (
        <div className="fixed inset-0 z-50 lg:hidden flex">
          {/* Backdrop */}
          <div 
            className="fixed inset-0 bg-black/60 transition-opacity duration-300 animate-fade-in"
            onClick={() => setSidebarOpen(false)}
          />

          {/* Drawer Content */}
          <aside className="relative flex flex-col w-64 bg-[#2C2C2C] text-[#D4CFC8] border-r border-[#C4A35A]/30 z-10 animate-slide-right h-full">
            <div className="h-16 flex items-center justify-between px-6 border-b border-[#C4A35A]/10 bg-[#252525]">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full border border-[#C4A35A] flex items-center justify-center bg-[#F7F2E8]">
                  <span className="font-accent text-[#6B1D1D] text-sm font-bold">S</span>
                </div>
                <div>
                  <h2 className="text-[#FDFBF7] text-sm font-bold tracking-wider uppercase font-accent">
                    SAAWARIYA
                  </h2>
                  <p className="text-[#C4A35A] text-[9px] tracking-widest uppercase">Admin Panel</p>
                </div>
              </div>
              <button 
                onClick={() => setSidebarOpen(false)}
                className="text-[#D4CFC8] hover:text-white p-1"
              >
                <X size={20} />
              </button>
            </div>

            <nav className="flex-1 px-4 py-6 space-y-1.5 overflow-y-auto">
              {menuItems.map((item) => {
                const Icon = item.icon;
                const isActive = activePage === item.page;
                return (
                  <button
                    key={item.page}
                    onClick={() => {
                      navigate(`/${item.page}`);
                      setSidebarOpen(false);
                    }}  
                    className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-all duration-300 ${
                      isActive
                        ? 'bg-[#6B1D1D] text-[#FDFBF7] border-l-4 border-[#C4A35A]'
                        : 'hover:bg-[#383838] hover:text-[#FDFBF7]'
                    }`}
                  >
                    <Icon size={18} className={isActive ? 'text-[#C4A35A]' : 'text-[#D4CFC8]'} />
                    <span>{item.label}</span>
                  </button>
                );
              })}
            </nav>

            <div className="p-4 border-t border-[#C4A35A]/10 bg-[#252525] flex items-center justify-between">
              <button
                onClick={() => navigate('/')}
                className="flex items-center gap-2 text-xs font-semibold text-[#C4A35A] hover:text-[#D4B76A] transition-colors"
              >
                <Store size={14} />
                <span>Storefront</span>
              </button>
              <button
                onClick={handleLogout}
                className="flex items-center gap-2 text-xs font-semibold text-red-400 hover:text-red-300 transition-colors"
              >
                <LogOut size={14} />
                <span>Logout</span>
              </button>
            </div>
          </aside>
        </div>
      )}

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Top Navbar */}
        <header className="h-16 bg-white border-b border-[#E8DFD0] flex items-center justify-between px-6 sticky top-0 z-30 shadow-sm">
          <div className="flex items-center gap-4">
            {/* Hamburger menu for mobile */}
            <button
              onClick={() => setSidebarOpen(true)}
              className="lg:hidden p-2 text-[#2C2C2C] hover:bg-[#F7F2E8] rounded-lg transition-colors"
            >
              <Menu size={22} />
            </button>
            <h1 className="text-xl font-bold text-[#6B1D1D] font-heading capitalize">
              {getPageTitle()}
            </h1>
          </div>

          {/* User profile dropdown button */}
          <div className="relative" ref={profileRef}>
            <button
              onClick={() => setProfileDropdownOpen(!profileDropdownOpen)}
              className="flex items-center gap-2 px-3 py-1.5 rounded-full border border-[#E8DFD0] hover:bg-[#F7F2E8] transition-all duration-300"
            >
              <div className="w-8 h-8 rounded-full bg-[#6B1D1D] text-[#FDFBF7] flex items-center justify-center font-bold text-xs">
                {initials}
              </div>
              <span className="hidden sm:block text-xs font-semibold text-[#2C2C2C] max-w-[120px] truncate">
                {displayEmail.split('@')[0]}
              </span>
              <ChevronDown size={14} className="text-[#6B6560]" />
            </button>

            {/* Profile Dropdown */}
            {profileDropdownOpen && (
              <div className="absolute right-0 mt-2 w-56 bg-white rounded-lg shadow-lg border border-[#C4A35A]/30 py-2 z-40 animate-scale-in">
                {/* Account info header */}
                <div className="px-4 py-2 border-b border-[#E8DFD0] mb-1">
                  <p className="text-[10px] uppercase tracking-wider text-[#C4A35A] font-semibold">Logged in as</p>
                  <p className="text-xs font-semibold text-[#2C2C2C] truncate mt-0.5">{displayEmail}</p>
                  <p className="text-[10px] text-green-700 bg-green-50 rounded px-1.5 py-0.5 inline-block font-semibold mt-1">
                    System Admin
                  </p>
                </div>

                {/* Back to store */}
                <button
                  onClick={() => {
                    setProfileDropdownOpen(false);
                    navigate('/');
                  }}
                  className="w-full flex items-center gap-2.5 px-4 py-2.5 text-xs text-[#2C2C2C] hover:bg-[#F7F2E8] hover:text-[#6B1D1D] font-medium transition-colors text-left"
                >
                  <Store size={14} className="text-[#C4A35A]" />
                  <span>Back to Store</span>
                </button>

                {/* Divider */}
                <div className="h-[1px] bg-[#E8DFD0] my-1" />

                {/* Logout */}
                <button
                  onClick={handleLogout}
                  className="w-full flex items-center gap-2.5 px-4 py-2.5 text-xs text-red-600 hover:bg-red-50 font-semibold transition-colors text-left"
                >
                  <LogOut size={14} className="text-red-500" />
                  <span>Logout</span>
                </button>
              </div>
            )}
          </div>
        </header>

        {/* Content Container */}
        <main className="flex-1 p-6 md:p-8 overflow-y-auto max-w-7xl w-full mx-auto animate-fade-in">
          {children}
        </main>
      </div>
    </div>
  );
}
