import { useEffect, useState } from 'react';
import {
  Heart,
  ShoppingBag,
  Star,
  ChevronLeft,
  ChevronRight,
  Truck,
  RotateCcw,
  Shield,
  Check,
  Share2,
  Info,
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { fetchProductById, fetchProductsByCategory } from '../api/products';
import { ProductCard } from '../components/ProductCard';
import { DividerLine } from '../components/IndianMotifs';
import type { Product } from '../types';

export function ProductPage() {
  const { productId, navigate, addToCart, addToWishlist, removeFromWishlist, isInWishlist } = useApp();
  const [product, setProduct] = useState<Product | null>(null);
  const [notFound, setNotFound] = useState(false);
  const [related, setRelated] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedImage, setSelectedImage] = useState(0);
  const [selectedSize, setSelectedSize] = useState('');
  const [selectedColor, setSelectedColor] = useState('');
  const [quantity, setQuantity] = useState(1);
  const [addedToCart, setAddedToCart] = useState(false);
  const [activeTab, setActiveTab] = useState<'details' | 'care' | 'reviews'>('details');

  useEffect(() => {
    let cancelled = false;

    async function load() {
      try {
        setLoading(true);
        setNotFound(false);
        setSelectedImage(0);
        setSelectedSize('');
        setSelectedColor('');
        setQuantity(1);

        const id = productId ?? '';
        if (!id) {
          if (!cancelled) setNotFound(true);
          return;
        }

        const fetched = await fetchProductById(id);
        if (cancelled) return;

        if (!fetched) {
          setNotFound(true);
          return;
        }

        setProduct(fetched);

        // Load related products
        const catProducts = await fetchProductsByCategory(fetched.category);
        if (!cancelled) {
          setRelated(catProducts.filter((p) => p.id !== fetched.id).slice(0, 4));
        }
      } catch (err) {
        console.error('[ProductPage] Failed to load product:', err);
        if (!cancelled) setNotFound(true);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    load();
    return () => { cancelled = true; };
  }, [productId]);

  if (loading) {
    return (
      <div className="min-h-screen bg-white">
        <div className="bg-[#F7F2E8] py-3">
          <div className="max-w-7xl mx-auto px-4 sm:px-6">
            <div className="h-4 bg-[#E8DFD0] rounded w-64 animate-pulse" />
          </div>
        </div>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
          <div className="grid lg:grid-cols-2 gap-8 lg:gap-12">
            <div className="space-y-4">
              <div className="aspect-[3/4] rounded-xl bg-[#F7F2E8] animate-pulse" />
              <div className="flex gap-3">
                {[1, 2, 3, 4].map((i) => (
                  <div key={i} className="w-20 h-24 rounded-lg bg-[#F7F2E8] animate-pulse" />
                ))}
              </div>
            </div>
            <div className="space-y-6">
              <div className="h-4 bg-[#E8DFD0] rounded w-1/3 animate-pulse" />
              <div className="h-8 bg-[#E8DFD0] rounded w-3/4 animate-pulse" />
              <div className="h-4 bg-[#E8DFD0] rounded w-1/2 animate-pulse" />
              <div className="h-10 bg-[#E8DFD0] rounded w-1/3 animate-pulse" />
              <div className="h-6 bg-[#E8DFD0] rounded w-1/4 animate-pulse" />
              <div className="h-12 bg-[#E8DFD0] rounded w-full animate-pulse" />
              <div className="h-12 bg-[#E8DFD0] rounded w-full animate-pulse" />
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (notFound || !product) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-xl font-semibold text-[#2C2C2C] mb-2">Product not found</h2>
          <button
            onClick={() => navigate('shop')}
            className="text-[#6B1D1D] text-sm font-medium hover:underline"
          >
            Back to Shop
          </button>
        </div>
      </div>
    );
  }

  const inWishlist = isInWishlist(product.id);
  const discount = Math.round(((product.originalPrice - product.price) / product.originalPrice) * 100);

  const handleAddToCart = () => {
    const size = selectedSize || product.sizes[0];
    const color = selectedColor || product.colors[0];
    addToCart(product, size, color, quantity);
    setAddedToCart(true);
    setTimeout(() => setAddedToCart(false), 2000);
  };

  const handleBuyNow = () => {
    const size = selectedSize || product.sizes[0];
    const color = selectedColor || product.colors[0];
    addToCart(product, size, color, quantity);
    navigate('cart');
  };

  return (
    <div className="min-h-screen bg-white">
      <div className="bg-[#F7F2E8] py-3">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="flex items-center gap-2 text-sm text-[#6B6560]">
            <button onClick={() => navigate('home')} className="hover:text-[#6B1D1D] transition-colors">
              Home
            </button>
            <span>/</span>
            <button onClick={() => navigate('shop', undefined, product.category)} className="hover:text-[#6B1D1D] transition-colors capitalize">
              {product.category}
            </button>
            <span>/</span>
            <button onClick={() => navigate('shop')} className="hover:text-[#6B1D1D] transition-colors">
              {product.subcategory}
            </button>
            <span>/</span>
            <span className="text-[#2C2C2C] font-medium">{product.name}</span>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
        <div className="grid lg:grid-cols-2 gap-8 lg:gap-12">
          <div className="space-y-4">
            <div className="relative aspect-[3/4] rounded-xl overflow-hidden bg-[#F7F2E8]">
              <img
                src={product.images[selectedImage]}
                alt={product.name}
                className="w-full h-full object-cover"
              />
              {discount > 0 && (
                <div className="absolute top-4 left-4 bg-[#6B1D1D] text-white text-sm font-bold px-3 py-1.5 rounded">
                  {discount}% OFF
                </div>
              )}
              <button
                onClick={() => setSelectedImage((prev) => (prev - 1 + product.images.length) % product.images.length)}
                className="absolute left-3 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-white/80 backdrop-blur-sm flex items-center justify-center shadow-sm hover:bg-white transition-colors"
              >
                <ChevronLeft size={18} />
              </button>
              <button
                onClick={() => setSelectedImage((prev) => (prev + 1) % product.images.length)}
                className="absolute right-3 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-white/80 backdrop-blur-sm flex items-center justify-center shadow-sm hover:bg-white transition-colors"
              >
                <ChevronRight size={18} />
              </button>
            </div>
            <div className="flex gap-3">
              {product.images.map((img, idx) => (
                <button
                  key={idx}
                  onClick={() => setSelectedImage(idx)}
                  className={`w-20 h-24 rounded-lg overflow-hidden border-2 transition-colors ${
                    idx === selectedImage ? 'border-[#6B1D1D]' : 'border-transparent hover:border-[#D4C5A9]'
                  }`}
                >
                  <img src={img} alt="" className="w-full h-full object-cover" />
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-6">
            <div>
              <div className="flex items-center gap-3 mb-2">
                <span className="text-xs text-[#6B6560] uppercase tracking-wider">{product.brand}</span>
                <span className="text-xs text-[#6B6560]">|</span>
                <span className="text-xs text-[#6B6560] uppercase tracking-wider">{product.subcategory}</span>
              </div>
              <h1 className="text-2xl sm:text-3xl font-bold text-[#2C2C2C] mb-3" style={{ fontFamily: "'Playfair Display', serif" }}>
                {product.name}
              </h1>
              <div className="flex items-center gap-3 mb-4">
                <div className="flex items-center gap-1">
                  <Star size={16} className="fill-[#C4A35A] text-[#C4A35A]" />
                  <span className="text-sm font-semibold text-[#2C2C2C]">{product.rating}</span>
                </div>
                <span className="text-sm text-[#6B6560]">({product.reviews} Reviews)</span>
                <span className="text-sm text-[#2E7D32] font-medium flex items-center gap-1">
                  <Check size={14} /> In Stock
                </span>
              </div>
              <div className="flex items-baseline gap-3">
                <span className="text-3xl font-bold text-[#6B1D1D]">₹{product.price.toLocaleString()}</span>
                {product.originalPrice > product.price && (
                  <>
                    <span className="text-lg text-[#6B6560] line-through">₹{product.originalPrice.toLocaleString()}</span>
                    <span className="text-sm text-[#2E7D32] font-medium">Save ₹{(product.originalPrice - product.price).toLocaleString()}</span>
                  </>
                )}
              </div>
            </div>

            <DividerLine />

            {product.colors.length > 1 && (
              <div>
                <p className="text-sm font-semibold text-[#2C2C2C] mb-2">Color: <span className="font-normal text-[#6B6560]">{selectedColor || product.colors[0]}</span></p>
                <div className="flex gap-2">
                  {product.colors.map((color) => (
                    <button
                      key={color}
                      onClick={() => setSelectedColor(color)}
                      className={`px-4 py-2 rounded-lg border text-sm transition-colors ${
                        (selectedColor || product.colors[0]) === color
                          ? 'bg-[#6B1D1D] text-white border-[#6B1D1D]'
                          : 'bg-white text-[#6B6560] border-gray-200 hover:border-[#6B1D1D]'
                      }`}
                    >
                      {color}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {product.sizes.length > 1 && (
              <div>
                <p className="text-sm font-semibold text-[#2C2C2C] mb-2">Size: <span className="font-normal text-[#6B6560]">{selectedSize || product.sizes[0]}</span></p>
                <div className="flex flex-wrap gap-2">
                  {product.sizes.map((size) => (
                    <button
                      key={size}
                      onClick={() => setSelectedSize(size)}
                      className={`w-12 h-12 rounded-lg border text-sm flex items-center justify-center transition-colors ${
                        (selectedSize || product.sizes[0]) === size
                          ? 'bg-[#6B1D1D] text-white border-[#6B1D1D]'
                          : 'bg-white text-[#6B6560] border-gray-200 hover:border-[#6B1D1D]'
                      }`}
                    >
                      {size}
                    </button>
                  ))}
                </div>
              </div>
            )}

            <div>
              <p className="text-sm font-semibold text-[#2C2C2C] mb-2">Quantity</p>
              <div className="flex items-center gap-3">
                <button
                  onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                  className="w-10 h-10 rounded-lg border border-gray-200 flex items-center justify-center text-[#2C2C2C] hover:border-[#6B1D1D] transition-colors"
                >
                  -
                </button>
                <span className="w-10 text-center font-semibold text-[#2C2C2C]">{quantity}</span>
                <button
                  onClick={() => setQuantity((q) => q + 1)}
                  className="w-10 h-10 rounded-lg border border-gray-200 flex items-center justify-center text-[#2C2C2C] hover:border-[#6B1D1D] transition-colors"
                >
                  +
                </button>
              </div>
            </div>

            <div className="flex gap-3">
              <button
                onClick={handleAddToCart}
                className={`flex-1 flex items-center justify-center gap-2 py-3.5 rounded-lg text-sm font-semibold transition-all duration-300 ${
                  addedToCart
                    ? 'bg-[#2E7D32] text-white'
                    : 'bg-[#6B1D1D] text-white hover:bg-[#4A1212]'
                }`}
              >
                {addedToCart ? (
                  <>
                    <Check size={18} /> Added to Cart
                  </>
                ) : (
                  <>
                    <ShoppingBag size={18} /> Add to Cart
                  </>
                )}
              </button>
              <button
                onClick={handleBuyNow}
                className="flex-1 border-2 border-[#6B1D1D] text-[#6B1D1D] py-3.5 rounded-lg text-sm font-semibold hover:bg-[#6B1D1D] hover:text-white transition-all duration-300"
              >
                Buy Now
              </button>
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => {
                  if (inWishlist) removeFromWishlist(product.id);
                  else addToWishlist(product);
                }}
                className={`flex items-center gap-2 px-4 py-2.5 rounded-lg border text-sm transition-colors ${
                  inWishlist
                    ? 'bg-[#6B1D1D] text-white border-[#6B1D1D]'
                    : 'bg-white text-[#6B6560] border-gray-200 hover:border-[#6B1D1D]'
                }`}
              >
                <Heart size={16} className={inWishlist ? 'fill-white' : ''} />
                {inWishlist ? 'In Wishlist' : 'Add to Wishlist'}
              </button>
              <button className="flex items-center gap-2 px-4 py-2.5 rounded-lg border border-gray-200 text-sm text-[#6B6560] hover:border-[#6B1D1D] transition-colors bg-white">
                <Share2 size={16} /> Share
              </button>
            </div>

            <div className="grid grid-cols-2 gap-3">
              {[
                { icon: Shield, label: 'Secure', sub: 'Payments' },
                { icon: RotateCcw, label: 'Easy', sub: 'Returns' },
                { icon: Truck, label: 'Free', sub: 'Shipping' },
                { icon: Check, label: 'COD', sub: 'Available' },
              ].map((item) => (
                <div key={item.label} className="flex items-center gap-3 p-3 bg-[#F7F2E8] rounded-lg">
                  <item.icon size={20} className="text-[#6B1D1D]" />
                  <div>
                    <p className="text-xs font-semibold text-[#2C2C2C]">{item.label}</p>
                    <p className="text-[10px] text-[#6B6560]">{item.sub}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="mt-12">
          <div className="flex gap-6 border-b border-gray-200 mb-6">
            {(['details', 'care', 'reviews'] as const).map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`pb-3 text-sm font-semibold capitalize transition-colors relative ${
                  activeTab === tab ? 'text-[#6B1D1D]' : 'text-[#6B6560] hover:text-[#2C2C2C]'
                }`}
              >
                {tab}
                {activeTab === tab && (
                  <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-[#6B1D1D]" />
                )}
              </button>
            ))}
          </div>

          {activeTab === 'details' && (
            <div className="grid sm:grid-cols-2 gap-6">
              <div className="bg-[#F7F2E8] rounded-xl p-6">
                <h3 className="text-sm font-semibold text-[#2C2C2C] mb-4 uppercase tracking-wider">Product Details</h3>
                <div className="space-y-3">
                  {[
                    { label: 'Fabric', value: product.material },
                    { label: 'Work', value: product.tags.join(', ') },
                    { label: 'Type', value: product.subcategory },
                    { label: 'Occasion', value: 'Festive, Party, Wedding' },
                    { label: 'Color', value: product.colors.join(', ') },
                    { label: 'Care', value: product.care },
                  ].map((item) => (
                    <div key={item.label} className="flex justify-between text-sm">
                      <span className="text-[#6B6560]">{item.label}</span>
                      <span className="text-[#2C2C2C] font-medium">{item.value}</span>
                    </div>
                  ))}
                </div>
              </div>
              <div>
                <h3 className="text-sm font-semibold text-[#2C2C2C] mb-4 uppercase tracking-wider">Why You'll Love It</h3>
                <p className="text-sm text-[#6B6560] leading-relaxed mb-4">{product.description}</p>
                <div className="space-y-2">
                  {[
                    'Handcrafted with intricate embroidery & sequence work',
                    'Featuring fit with semi-stitched customization',
                    'Rich, heritage feel for timeless elegance',
                    'Ideal for weddings, festivals & parties',
                  ].map((point, i) => (
                    <div key={i} className="flex items-start gap-2">
                      <Check size={14} className="text-[#2E7D32] mt-0.5 flex-shrink-0" />
                      <span className="text-sm text-[#6B6560]">{point}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {activeTab === 'care' && (
            <div className="bg-[#F7F2E8] rounded-xl p-6 max-w-2xl">
              <h3 className="text-sm font-semibold text-[#2C2C2C] mb-4 uppercase tracking-wider">Care Instructions</h3>
              <div className="space-y-3">
                <div className="flex items-start gap-3">
                  <Info size={16} className="text-[#6B1D1D] mt-0.5 flex-shrink-0" />
                  <span className="text-sm text-[#6B6560]">{product.care}</span>
                </div>
                <div className="flex items-start gap-3">
                  <Info size={16} className="text-[#6B1D1D] mt-0.5 flex-shrink-0" />
                  <span className="text-sm text-[#6B6560]">Do not bleach or use harsh detergents</span>
                </div>
                <div className="flex items-start gap-3">
                  <Info size={16} className="text-[#6B1D1D] mt-0.5 flex-shrink-0" />
                  <span className="text-sm text-[#6B6560]">Store in a cool, dry place away from direct sunlight</span>
                </div>
                <div className="flex items-start gap-3">
                  <Info size={16} className="text-[#6B1D1D] mt-0.5 flex-shrink-0" />
                  <span className="text-sm text-[#6B6560]">Iron on low heat if needed</span>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'reviews' && (
            <div className="max-w-2xl">
              <div className="flex items-center gap-4 mb-6">
                <div className="text-center">
                  <div className="text-4xl font-bold text-[#6B1D1D]">{product.rating}</div>
                  <div className="flex items-center gap-0.5 mt-1">
                    {Array.from({ length: 5 }).map((_, i) => (
                      <Star
                        key={i}
                        size={14}
                        className={i < Math.floor(product.rating) ? 'fill-[#C4A35A] text-[#C4A35A]' : 'text-[#D4C5A9]'}
                      />
                    ))}
                  </div>
                  <p className="text-xs text-[#6B6560] mt-1">{product.reviews} reviews</p>
                </div>
                <div className="flex-1 space-y-1">
                  {[5, 4, 3, 2, 1].map((star) => {
                    const count = Math.round(product.reviews * (star === 5 ? 0.6 : star === 4 ? 0.25 : 0.05));
                    const pct = (count / product.reviews) * 100;
                    return (
                      <div key={star} className="flex items-center gap-2">
                        <span className="text-xs text-[#6B6560] w-3">{star}</span>
                        <Star size={10} className="text-[#C4A35A] fill-[#C4A35A]" />
                        <div className="flex-1 h-1.5 bg-[#E8DFD0] rounded-full overflow-hidden">
                          <div className="h-full bg-[#C4A35A] rounded-full" style={{ width: `${pct}%` }} />
                        </div>
                        <span className="text-xs text-[#6B6560] w-6">{count}</span>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          )}
        </div>

        {related.length > 0 && (
          <div className="mt-16">
            <div className="flex items-center justify-between mb-8">
              <div>
                <h3 className="text-2xl font-bold text-[#2C2C2C] mb-2" style={{ fontFamily: "'Playfair Display', serif" }}>
                  You May Also Like
                </h3>
                <DividerLine className="justify-start" />
              </div>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-6">
              {related.map((p) => (
                <ProductCard key={p.id} product={p} />
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
