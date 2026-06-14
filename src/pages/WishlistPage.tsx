import { Heart, ShoppingBag, Trash2, ArrowRight } from 'lucide-react';
import { useApp } from '../context/AppContext';
import { DividerLine } from '../components/IndianMotifs';

export function WishlistPage() {
  const { wishlist, removeFromWishlist, addToCart, navigate } = useApp();

  if (wishlist.length === 0) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-center max-w-sm px-4">
          <div className="w-20 h-20 rounded-full bg-[#F7F2E8] flex items-center justify-center mx-auto mb-6">
            <Heart size={32} className="text-[#6B1D1D]" />
          </div>
          <h2 className="text-xl font-bold text-[#2C2C2C] mb-2">Your Wishlist is Empty</h2>
          <p className="text-sm text-[#6B6560] mb-6">Save items you love to your wishlist and find them here anytime.</p>
          <button
            onClick={() => navigate('shop')}
            className="bg-[#6B1D1D] text-white px-8 py-3 rounded-lg text-sm font-semibold hover:bg-[#4A1212] transition-colors"
          >
            Explore Products
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white">
      <div className="bg-[#F7F2E8] py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <h1 className="text-3xl font-bold text-[#2C2C2C] mb-2" style={{ fontFamily: "'Playfair Display', serif" }}>
            My Wishlist
          </h1>
          <p className="text-[#6B6560] text-sm">
            {wishlist.length} {wishlist.length === 1 ? 'item' : 'items'} saved
          </p>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-6">
          {wishlist.map((item) => {
            const product = item.product;
            const discount = Math.round(((product.originalPrice - product.price) / product.originalPrice) * 100);
            return (
              <div key={product.id} className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden group">
                <div className="relative aspect-[3/4] overflow-hidden bg-[#F7F2E8] cursor-pointer"
                  onClick={() => navigate('product', product.id)}>
                  <img
                    src={product.image}
                    alt={product.name}
                    className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                  />
                  {discount > 0 && (
                    <div className="absolute top-3 left-3 bg-[#6B1D1D] text-white text-xs font-semibold px-2.5 py-1 rounded">
                      {discount}% OFF
                    </div>
                  )}
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      removeFromWishlist(product.id);
                    }}
                    className="absolute top-3 right-3 w-9 h-9 rounded-full bg-white/90 backdrop-blur-sm flex items-center justify-center shadow-sm hover:shadow-md transition-all"
                  >
                    <Trash2 size={16} className="text-[#C62828]" />
                  </button>
                </div>
                <div className="p-4">
                  <p className="text-xs text-[#6B6560] uppercase tracking-wider mb-1">{product.subcategory}</p>
                  <h3 className="font-medium text-[#2C2C2C] text-sm leading-tight mb-2">{product.name}</h3>
                  <div className="flex items-center gap-2 mb-3">
                    <span className="text-lg font-semibold text-[#6B1D1D]">₹{product.price.toLocaleString()}</span>
                    {product.originalPrice > product.price && (
                      <span className="text-sm text-[#6B6560] line-through">₹{product.originalPrice.toLocaleString()}</span>
                    )}
                  </div>
                  <button
                    onClick={() => {
                      addToCart(product, product.sizes[0], product.colors[0], 1);
                    }}
                    className="w-full flex items-center justify-center gap-2 bg-[#6B1D1D] text-white py-2.5 rounded-lg text-sm font-semibold hover:bg-[#4A1212] transition-colors"
                  >
                    <ShoppingBag size={16} /> Move to Cart
                  </button>
                </div>
              </div>
            );
          })}
        </div>

        <div className="mt-10 text-center">
          <button
            onClick={() => navigate('shop')}
            className="inline-flex items-center gap-2 text-[#6B1D1D] text-sm font-semibold hover:underline"
          >
            Continue Shopping <ArrowRight size={16} />
          </button>
        </div>
      </div>
    </div>
  );
}
