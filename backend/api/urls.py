from django.urls import path

from api.admin_orders_views import AdminOrderStatusUpdateView, AdminOrdersView
from api.addresses_views import AddressesView, AddressDetailView
from api.cart_views import CartAddView, CartRemoveView, CartUpdateView, CartView
from api.orders_views import OrderDetailView, OrdersView, OrderStatusUpdateView
from api.profile_views import ProfileView
from api.products_views import ProductDetailView, ProductsView
from api.reviews_views import ReviewsByProductView
from api.payments_views import CreateRazorpayOrderView, VerifyRazorpayPaymentView, RazorpayWebhookView
from api.product_image_views import ProductImageUploadView

from api.views import SupabaseTestView, HealthView
from api.wishlist_views import WishlistAddView, WishlistRemoveView, WishlistView



urlpatterns = [
    path('api/health/', HealthView.as_view(), name='health'),
    path('api/supabase-test/', SupabaseTestView.as_view(), name='supabase-test'),
    path('api/profile/', ProfileView.as_view(), name='profile'),
    path('api/addresses/', AddressesView.as_view(), name='addresses'),
    path('api/addresses/<str:id>/', AddressDetailView.as_view(), name='address-detail'),
    path('api/products/', ProductsView.as_view(), name='products'),
    # NOTE: the image upload route MUST come before <str:id>/ so Django does
    # not swallow the literal word "image" as a product ID.
    path('api/products/<str:id>/image/', ProductImageUploadView.as_view(), name='product-image-upload'),
    path('api/products/<str:id>/', ProductDetailView.as_view(), name='product-detail'),
    path('api/wishlist/', WishlistView.as_view(), name='wishlist'),
    path('api/wishlist/add/', WishlistAddView.as_view(), name='wishlist-add'),
    path('api/wishlist/remove/<str:product_id>/', WishlistRemoveView.as_view(), name='wishlist-remove'),
    path('api/cart/', CartView.as_view(), name='cart'),
    path('api/cart/add/', CartAddView.as_view(), name='cart-add'),
    path('api/cart/update/', CartUpdateView.as_view(), name='cart-update'),
    path('api/cart/remove/<str:product_id>/', CartRemoveView.as_view(), name='cart-remove'),
    path('api/orders/', OrdersView.as_view(), name='orders'),
    path('api/orders/<str:id>/', OrderDetailView.as_view(), name='order-detail'),
    path('api/orders/<str:id>/status/', OrderStatusUpdateView.as_view(), name='order-status-update'),
    path('api/admin/orders/', AdminOrdersView.as_view(), name='admin-orders'),
    path('api/admin/orders/<str:id>/status/', AdminOrderStatusUpdateView.as_view(), name='admin-order-status-update'),
    path('api/reviews/', ReviewsByProductView.as_view(), name='reviews-create'),
    path('api/reviews/<str:product_id>/', ReviewsByProductView.as_view(), name='reviews-by-product'),

    path('api/payments/create-order/', CreateRazorpayOrderView.as_view(), name='payments-create-order'),
    path('api/payments/verify/', VerifyRazorpayPaymentView.as_view(), name='payments-verify'),
    path('api/payments/webhook/', RazorpayWebhookView.as_view(), name='payments-webhook'),
]







