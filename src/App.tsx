import { AppProvider, useApp } from './context/AppContext';
import { Navbar } from './components/Navbar';
import { Footer } from './components/Footer';
import { LoadingScreen } from './components/LoadingScreen';
import { HomePage } from './pages/HomePage';
import { ShopPage } from './pages/ShopPage';
import { ProductPage } from './pages/ProductPage';
import { CartPage } from './pages/CartPage';
import { WishlistPage } from './pages/WishlistPage';
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
      </main>
      <Footer />
    </div>
  );
}

function App() {
  return (
    <AppProvider>
      <AppContent />
    </AppProvider>
  );
}

export default App;
