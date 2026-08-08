import {
  Minus,
  Plus,
  Trash2,
  ShoppingBag,
  ArrowRight,
  Truck,
  RotateCcw,
  Shield,
  CreditCard,
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useApp } from '../context/AppContext';

export function CartPage() {
  const navigate = useNavigate();
  const { cart, cartTotal, cartCount, removeFromCart, updateCartQuantity } = useApp();

  const shipping = cartTotal >= 999 ? 0 : 99;
  const discount = Math.floor(cartTotal * 0.05);
  const total = cartTotal + shipping - discount;

  if (cart.length === 0) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-center max-w-sm px-4">
          <div className="w-20 h-20 rounded-full bg-[#F7F2E8] flex items-center justify-center mx-auto mb-6">
            <ShoppingBag size={32} className="text-[#6B1D1D]" />
          </div>

          <h2 className="text-xl font-bold text-[#2C2C2C] mb-2">
            Your Cart is Empty
          </h2>

          <p className="text-sm text-[#6B6560] mb-6">
            Looks like you haven't added anything to your cart yet.
          </p>

          <button
            onClick={() => navigate('/shop')}
            className="bg-[#6B1D1D] text-white px-8 py-3 rounded-lg text-sm font-semibold hover:bg-[#4A1212] transition-colors"
          >
            Continue Shopping
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <div className="bg-[#F7F2E8] py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <h1
            className="text-3xl font-bold text-[#2C2C2C] mb-2"
            style={{ fontFamily: "'Playfair Display', serif" }}
          >
            Your Cart
          </h1>

          <p className="text-[#6B6560] text-sm">
            {cartCount} {cartCount === 1 ? 'item' : 'items'} in your cart
          </p>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
        <div className="grid lg:grid-cols-3 gap-8">

          {/* Cart Items */}
          <div className="lg:col-span-2 space-y-4">
            {cart.map((item) => (
              <div
                key={`${item.product.id}-${item.size}-${item.color}`}
                className="flex gap-4 p-4 bg-white rounded-xl border border-gray-100 shadow-sm"
              >
                <div className="w-24 h-28 flex-shrink-0 rounded-lg overflow-hidden bg-[#F7F2E8]">
                  <img
                    src={item.product.image}
                    alt={item.product.name}
                    className="w-full h-full object-cover"
                  />
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <p className="text-xs text-[#6B6560] uppercase tracking-wider mb-1">
                        {item.product.subcategory}
                      </p>

                      <h3 className="text-sm font-semibold text-[#2C2C2C] mb-1">
                        {item.product.name}
                      </h3>

                      <p className="text-xs text-[#6B6560] mb-2">
                        Size: {item.size} | Color: {item.color}
                      </p>
                    </div>

                    <button
                      onClick={() =>
                        removeFromCart(item.product.id, item.size, item.color)
                      }
                      className="p-1.5 hover:bg-red-50 rounded-lg text-[#6B6560] hover:text-red-600 transition-colors"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() =>
                          updateCartQuantity(
                            item.product.id,
                            item.size,
                            item.color,
                            item.quantity - 1
                          )
                        }
                        className="w-8 h-8 rounded-lg border border-gray-200 flex items-center justify-center"
                      >
                        <Minus size={14} />
                      </button>

                      <span className="w-8 text-center text-sm font-semibold">
                        {item.quantity}
                      </span>

                      <button
                        onClick={() =>
                          updateCartQuantity(
                            item.product.id,
                            item.size,
                            item.color,
                            item.quantity + 1
                          )
                        }
                        className="w-8 h-8 rounded-lg border border-gray-200 flex items-center justify-center"
                      >
                        <Plus size={14} />
                      </button>
                    </div>

                    <div className="text-right">
                      <p className="text-sm font-semibold text-[#6B1D1D]">
                        ₹
                        {(item.product.price * item.quantity).toLocaleString()}
                      </p>

                      {item.product.originalPrice > item.product.price && (
                        <p className="text-xs text-[#6B6560] line-through">
                          ₹
                          {(
                            item.product.originalPrice * item.quantity
                          ).toLocaleString()}
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Summary */}
          <div className="space-y-4">

            <div className="bg-[#F7F2E8] rounded-xl p-6">
              <h3 className="text-lg font-bold text-[#2C2C2C] mb-4">
                Order Summary
              </h3>

              <div className="space-y-3 text-sm">
                <div className="flex justify-between">
                  <span>Subtotal</span>
                  <span>₹{cartTotal.toLocaleString()}</span>
                </div>

                <div className="flex justify-between">
                  <span>Shipping</span>
                  <span>{shipping === 0 ? 'Free' : `₹${shipping}`}</span>
                </div>

                <div className="flex justify-between text-green-700">
                  <span>Discount</span>
                  <span>-₹{discount.toLocaleString()}</span>
                </div>

                <div className="border-t border-gray-300" />

                <div className="flex justify-between text-lg font-bold">
                  <span>Total</span>
                  <span>₹{total.toLocaleString()}</span>
                </div>
              </div>

              <button
                onClick={() => navigate('/shop')}
                className="w-full mt-6 bg-[#6B1D1D] text-white py-3 rounded-lg flex items-center justify-center gap-2"
              >
                Proceed to Checkout
                <ArrowRight size={16} />
              </button>

              <button
                onClick={() => navigate('/shop')}
                className="w-full mt-3 text-[#6B1D1D] text-sm"
              >
                Continue Shopping
              </button>

              <div className="flex items-center justify-center gap-2 mt-4 text-xs text-[#6B6560]">
                <Shield size={14} />
                <span>100% Secure Payments</span>
              </div>
            </div>

            {/* Features */}
            <div className="grid grid-cols-2 gap-3">
              {[
                { icon: Truck, label: 'Free Shipping', sub: 'On orders above ₹999' },
                { icon: RotateCcw, label: 'Easy Returns', sub: '15 days return policy' },
                { icon: Shield, label: 'Secure Payments', sub: '100% safe & secure' },
                { icon: CreditCard, label: 'COD Available', sub: 'Pan India' },
              ].map((feature) => (
                <div
                  key={feature.label}
                  className="flex items-center gap-2 p-3 bg-[#F7F2E8] rounded-lg"
                >
                  <feature.icon
                    size={16}
                    className="text-[#6B1D1D] flex-shrink-0"
                  />

                  <div>
                    <p className="text-[10px] font-medium">
                      {feature.label}
                    </p>

                    <p className="text-[9px] text-[#6B6560]">
                      {feature.sub}
                    </p>
                  </div>
                </div>
              ))}
            </div>

          </div>

        </div>
      </div>
    </div>
  );
}