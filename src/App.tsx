import { useEffect } from 'react';
import {
  Routes,
  Route,
  Navigate,
  Outlet,
  useNavigate,
  useParams,
  useLocation,
} from 'react-router-dom';
import { AppProvider, useApp } from './context/AppContext';
import { SupabaseAuthProvider, useSupabaseAuth } from './context/SupabaseAuthContext';

import { Navbar } from './components/Navbar';
import { Footer } from './components/Footer';
import { LoadingScreen } from './components/LoadingScreen';
import { HomePage } from './pages/HomePage';
import { ShopPage } from './pages/ShopPage';
import { ProductPage } from './pages/ProductPage';
import { CartPage } from './pages/CartPage';
import { WishlistPage } from './pages/WishlistPage';
import { ProfilePage } from './pages/ProfilePage';
import { LoginPage } from './pages/LoginPage';
import { SignupPage } from './pages/SignupPage';
import { ForgotPasswordPage } from './pages/ForgotPasswordPage';
import { ResetPasswordPage } from './pages/ResetPasswordPage';
import { EmailVerificationPage } from './pages/EmailVerificationPage';
import { AddressesPage } from './pages/AddressesPage';
import { AdminLayout } from './components/admin/AdminLayout';
import { DashboardPage } from './pages/admin/DashboardPage';
import { ProductsPage } from './pages/admin/ProductsPage';
import { CategoriesPage } from './pages/admin/CategoriesPage';
import { OrdersPage } from './pages/admin/OrdersPage';
import { HeroBannersPage } from './pages/admin/HeroBannersPage';
import { HomepagePage } from './pages/admin/HomepagePage';
import { UsersPage } from './pages/admin/UsersPage';
import { SettingsPage } from './pages/admin/SettingsPage';
import { AdminLoginPage } from './pages/admin/AdminLoginPage';
import './index.css';

// ─── Layout ──────────────────────────────────────────────────────────────────

/** Shared layout for all customer pages: Navbar on top, Footer at bottom. */
function CustomerLayout() {
  return (
    <div className="min-h-screen bg-white flex flex-col">
      <Navbar />
      <main className="flex-1">
        <Outlet />
      </main>
      <Footer />
    </div>
  );
}



/**
 * Syncs the product id from the URL into AppContext
 * so that ProductPage (not yet migrated to useParams) can still read it.
 */
function ProductPageWrapper() {
  const { id } = useParams<{ id: string }>();
  const { navigate: appNavigate } = useApp();

  useEffect(() => {
    if (id) appNavigate('product' as any, id);
  }, [id, appNavigate]);

  return <ProductPage />;
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

/** Maps an AppContext page name to its canonical URL path. */
function pageToPath(pg: string, pid: string | null): string {
  switch (pg) {
    case 'home':               return '/';
    case 'shop':               return '/shop';
    case 'cart':               return '/cart';
    case 'wishlist':           return '/wishlist';
    case 'profile':            return '/profile';
    case 'addresses':          return '/addresses';
    case 'login':              return '/login';
    case 'signup':             return '/signup';
    case 'forgot_password':    return '/forgot-password';
    case 'reset_password':     return '/reset-password';
    case 'email_verification': return '/verify-email';
    case 'product':            return pid ? `/product/${pid}` : '/shop';
    default:                   return '/';
  }
}

// ─── Main content component ───────────────────────────────────────────────────

function AppContent() {
  const { page, navigate, productId } = useApp();
  const { session, loading: authLoading, role, roleLoading } = useSupabaseAuth();
  const routerNavigate = useNavigate();
  const location = useLocation();

  const isAdminPath = page.startsWith('admin/');
  const isAuthChecking = authLoading || roleLoading;

  /**
   * AppContext → URL sync.
   *
   * Customer components that still call AppContext.navigate() (Navbar, Footer,
   * ProductCard, etc.) update the `page` state. This effect converts that page
   * change into a real URL push so React Router can take over rendering.
   *
   * No loop risk: Effect 1 (URL → AppContext) has been fully removed.
   * URL changes made here do NOT bounce back into AppContext, so there is no
   * circular dependency.
   */
  useEffect(() => {
    if (page === 'loading' || page.startsWith('admin')) return;
    const expectedPath = pageToPath(page, productId);
    if (location.pathname !== expectedPath) {
      routerNavigate(expectedPath, { replace: true });
    }
  // location.pathname is read to compare, not to react to URL changes.
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page, productId, routerNavigate]);

  /** Admin route-protection guard (unchanged). */
  useEffect(() => {
    if (isAuthChecking) return;

    if (isAdminPath && page !== 'admin/login') {
      if (!session || role !== 'admin') {
        navigate('admin/login');
      }
    } else if (page === 'admin/login') {
      if (session && role === 'admin') {
        navigate('admin/dashboard');;
      }
    }
  }, [page, session, role, isAuthChecking, isAdminPath, navigate]);

  // ── Admin rendering (page-state driven, unchanged from before) ────────────
  // Prevent flashing admin content while auth is being verified.
  if (isAdminPath && page !== 'admin/login' && isAuthChecking) {
    return <LoadingScreen />;
  }

  
  // ── Customer routing via React Router ─────────────────────────────────────
  return (
  <Routes>

    {/* ================= CUSTOMER ROUTES ================= */}

    <Route element={<CustomerLayout />}>
      <Route path="/" element={<HomePage />} />
      <Route path="/shop" element={<ShopPage />} />
      <Route path="/product/:id" element={<ProductPageWrapper />} />
      <Route path="/cart" element={<CartPage />} />
      <Route path="/wishlist" element={<WishlistPage />} />
      <Route path="/profile" element={<ProfilePage />} />
      <Route path="/addresses" element={<AddressesPage />} />
      <Route path="/login" element={<LoginPage />} />
      <Route path="/signup" element={<SignupPage />} />
      <Route path="/forgot-password" element={<ForgotPasswordPage />} />
      <Route path="/reset-password" element={<ResetPasswordPage />} />
      <Route path="/verify-email" element={<EmailVerificationPage />} />
    </Route>


    {/* ================= ADMIN LOGIN ================= */}

    <Route path="/admin/login" element={<AdminLoginPage />} />


    {/* ================= ADMIN PANEL ================= */}

    <Route
      path="/admin"
      element={
        <AdminLayout activePage={location.pathname}>
          <Outlet />
        </AdminLayout>
      }
    >
      <Route path="dashboard" element={<DashboardPage />} />
      <Route path="products" element={<ProductsPage />} />
      <Route path="categories" element={<CategoriesPage />} />
      <Route path="orders" element={<OrdersPage />} />
      <Route path="hero-banners" element={<HeroBannersPage />} />
      <Route path="homepage" element={<HomepagePage />} />
      <Route path="users" element={<UsersPage />} />
      <Route path="settings" element={<SettingsPage />} />
    </Route>


    {/* ================= FALLBACK ================= */}

    <Route path="*" element={<Navigate to="/" replace />} />

  </Routes>
);
} 

// ─── Root ─────────────────────────────────────────────────────────────────────

function App() {
  return (
    <SupabaseAuthProvider>
      <AppProvider>
        <AppContent />
      </AppProvider>
    </SupabaseAuthProvider>
  );
}

export default App;

