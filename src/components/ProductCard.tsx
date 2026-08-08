import { useState } from 'react';
import { Heart, ShoppingBag, Star, Check } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useApp } from '../context/AppContext';
import type { Product } from '../types';

export function ProductCard({ product }: { product: Product }) {
  const navigate = useNavigate();
  const { addToCart, addToWishlist, removeFromWishlist, isInWishlist } = useApp();
  const [hovered, setHovered] = useState(false);
  const [added, setAdded] = useState(false);
  const inWishlist = isInWishlist(product.id);
  const discount = Math.round(((product.originalPrice - product.price) / product.originalPrice) * 100);

  const handleQuickAdd = (e: React.MouseEvent) => {
    e.stopPropagation();
    addToCart(product, product.sizes[0], product.colors[0], 1);
    setAdded(true);
    setTimeout(() => setAdded(false), 1500);
  };

  const handleWishlist = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (inWishlist) {
      removeFromWishlist(product.id);
    } else {
      addToWishlist(product);
    }
  };

 return (
  <div
    className="group relative bg-white rounded-xl overflow-hidden shadow-sm hover:shadow-lg transition-all duration-500 cursor-pointer"
    onMouseEnter={() => setHovered(true)}
    onMouseLeave={() => setHovered(false)}
    onClick={() => navigate(`/product/${product.id}`)}
  >
    {/* Image */}
    <div className="relative aspect-[3/4] overflow-hidden bg-[#F7F2E8]">
      <img
        src={product.image}
        alt={product.name}
        className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
      />

      {discount > 0 && (
        <div className="absolute top-3 left-3 bg-[#6B1D1D] text-white text-xs font-semibold px-2.5 py-1 rounded">
          {discount}% OFF
        </div>
      )}

      <button
        onClick={handleWishlist}
        className="absolute top-3 right-3 w-9 h-9 rounded-full bg-white/90 backdrop-blur-sm flex items-center justify-center shadow-sm hover:shadow-md transition-all duration-300"
      >
        <Heart
          size={16}
          className={
            inWishlist
              ? "fill-[#6B1D1D] text-[#6B1D1D]"
              : "text-[#6B6560]"
          }
        />
      </button>

      <div
        className={`absolute bottom-0 left-0 right-0 p-3 bg-gradient-to-t from-black/40 to-transparent transition-opacity duration-300 ${
          hovered ? "opacity-100" : "opacity-0"
        }`}
      >
        <button
          onClick={handleQuickAdd}
          className="w-full bg-white text-[#6B1D1D] text-sm font-semibold py-2.5 rounded-lg flex items-center justify-center gap-2 hover:bg-[#6B1D1D] hover:text-white transition-colors duration-300"
        >
          {added ? (
            <>
              <Check size={16} />
              Added
            </>
          ) : (
            <>
              <ShoppingBag size={16} />
              Add to Cart
            </>
          )}
        </button>
      </div>
    </div>

    {/* Content */}
    <div className="p-4">
      <p className="text-xs text-[#6B6560] uppercase tracking-wider mb-1">
        {product.subcategory}
      </p>

      <h3 className="font-medium text-[#2C2C2C] text-sm leading-tight mb-2 group-hover:text-[#6B1D1D] transition-colors duration-300">
        {product.name}
      </h3>

      <div className="flex items-center gap-2 mb-2">
        <div className="flex items-center gap-1">
          <Star
            size={12}
            className="fill-[#C4A35A] text-[#C4A35A]"
          />
          <span className="text-xs font-medium text-[#2C2C2C]">
            {product.rating}
          </span>
        </div>

        <span className="text-xs text-[#6B6560]">
          ({product.reviews})
        </span>
      </div>

      <div className="flex items-center gap-2">
        <span className="text-lg font-semibold text-[#6B1D1D]">
          ₹{product.price.toLocaleString()}
        </span>

        {product.originalPrice > product.price && (
          <span className="text-sm text-[#6B6560] line-through">
            ₹{product.originalPrice.toLocaleString()}
          </span>
        )}
      </div>
    </div>
  </div>
);}