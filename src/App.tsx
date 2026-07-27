import { AppProvider, useApp } from './context/AppContext';
import { SupabaseAuthProvider } from './context/SupabaseAuthContext';

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
import './index.css';



function AppContent() {
  const { page } = useApp();

  if (page === 'loading') {
    return <LoadingScreen />;
  }

  return (
    <div className="min-h-screen bg-white flex flex-col">
      <Navbar />
      <main className="flex-1">
        {page === 'home' && <HomePage />}
        {page === 'shop' && <ShopPage />}
        {page === 'product' && <ProductPage />}
        {page === 'cart' && <CartPage />}
        {page === 'wishlist' && <WishlistPage />}
        {page === 'profile' && <ProfilePage />}
        {page === 'addresses' && <AddressesPage />}
        {page === 'login' && <LoginPage />}

        {page === 'signup' && <SignupPage />}
        {page === 'forgot_password' && <ForgotPasswordPage />}
        {page === 'reset_password' && <ResetPasswordPage />}
        {page === 'email_verification' && <EmailVerificationPage />}


      </main>
      <Footer />
    </div>
  );
}

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
