import { 
  TrendingUp, 
  ShoppingBag, 
  Users as UsersIcon, 
  DollarSign, 
  ArrowUpRight, 
  ArrowDownRight,
  Clock,
  CheckCircle,
  Truck
} from 'lucide-react';

export function DashboardPage() {
  const stats = [
    {
      label: 'Total Revenue',
      value: '₹12,45,800',
      change: '+12.5%',
      isPositive: true,
      timeframe: 'vs last month',
      icon: DollarSign,
    },
    {
      label: 'Total Orders',
      value: '1,482',
      change: '+8.3%',
      isPositive: true,
      timeframe: 'vs last month',
      icon: ShoppingBag,
    },
    {
      label: 'Active Users',
      value: '8,924',
      change: '+24.1%',
      isPositive: true,
      timeframe: 'vs last month',
      icon: UsersIcon,
    },
    {
      label: 'Avg. Order Value',
      value: '₹8,406',
      change: '-2.4%',
      isPositive: false,
      timeframe: 'vs last month',
      icon: TrendingUp,
    },
  ];

  const recentOrders = [
    { id: 'ORD-8924', customer: 'Aarav Sharma', date: 'Jul 28, 2026', total: '₹12,500', status: 'Delivered' },
    { id: 'ORD-8923', customer: 'Isha Patel', date: 'Jul 28, 2026', total: '₹8,900', status: 'Shipped' },
    { id: 'ORD-8922', customer: 'Vikram Singh', date: 'Jul 27, 2026', total: '₹24,200', status: 'Processing' },
    { id: 'ORD-8921', customer: 'Ananya Roy', date: 'Jul 27, 2026', total: '₹5,400', status: 'Pending' },
    { id: 'ORD-8920', customer: 'Rohan Mehta', date: 'Jul 26, 2026', total: '₹18,100', status: 'Delivered' },
  ];

  const topProducts = [
    { name: 'Royal Crimson Banarasi Saree', sales: 124, stock: '12 in stock', price: '₹18,500' },
    { name: 'Maroon Zardozi Embroidered Lehenga', sales: 98, stock: '8 in stock', price: '₹45,000' },
    { name: 'Golden Zari Silk Kurta Set', sales: 86, stock: 'Out of stock', price: '₹12,000' },
    { name: 'Elegant Ivory Pashmina Shawl', sales: 74, stock: '32 in stock', price: '₹9,500' },
  ];

  return (
    <div className="space-y-8">
      {/* Welcome Banner */}
      <div className="bg-[#6B1D1D] rounded-2xl p-6 md:p-8 text-[#FDFBF7] shadow-soft relative overflow-hidden">
        <div className="absolute right-0 top-0 translate-x-12 -translate-y-12 w-64 h-64 bg-[#C4A35A]/10 rounded-full blur-2xl" />
        <div className="absolute left-1/2 bottom-0 translate-y-16 w-80 h-80 bg-black/10 rounded-full blur-3xl" />
        
        <div className="relative z-10 space-y-2 max-w-xl">
          <span className="text-xs uppercase tracking-wider text-[#C4A35A] font-semibold">Saawariya Overview</span>
          <h2 className="text-2xl md:text-3xl font-bold font-heading">Namaste, Administrator</h2>
          <p className="text-sm text-[#F7F2E8] leading-relaxed">
            Welcome back. Here is the sales performance and overview of your store. Everything is running smoothly today.
          </p>
        </div>
      </div>

      {/* Grid: Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat, i) => {
          const Icon = stat.icon;
          return (
            <div 
              key={i} 
              className="bg-white p-6 rounded-xl border border-[#E8DFD0] shadow-soft hover:shadow-medium hover:border-[#C4A35A]/50 transition-all duration-300 flex flex-col justify-between"
            >
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-[#6B6560] uppercase tracking-wider">{stat.label}</span>
                <div className="w-10 h-10 rounded-lg bg-[#F7F2E8] flex items-center justify-center text-[#6B1D1D]">
                  <Icon size={20} />
                </div>
              </div>
              
              <div className="mt-4 space-y-1">
                <span className="text-2xl font-bold text-[#2C2C2C] tracking-tight">{stat.value}</span>
                <div className="flex items-center gap-1.5 text-xs">
                  <span className={`flex items-center font-bold ${stat.isPositive ? 'text-green-600' : 'text-red-500'}`}>
                    {stat.isPositive ? <ArrowUpRight size={14} /> : <ArrowDownRight size={14} />}
                    {stat.change}
                  </span>
                  <span className="text-[#6B6560]">{stat.timeframe}</span>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Grid: Details Table and Top selling products */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Recent Orders Table */}
        <div className="lg:col-span-2 bg-white rounded-xl border border-[#E8DFD0] shadow-soft p-6 space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-bold text-[#6B1D1D] font-heading">Recent Orders</h3>
              <p className="text-xs text-[#6B6560]">Verify recent customer order logs</p>
            </div>
            <button className="text-xs font-semibold text-[#C4A35A] hover:text-[#D4B76A] transition-colors">
              View All Orders
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-[#E8DFD0] text-xs font-semibold text-[#6B6560] uppercase tracking-wider">
                  <th className="pb-3 font-medium">Order ID</th>
                  <th className="pb-3 font-medium">Customer</th>
                  <th className="pb-3 font-medium">Date</th>
                  <th className="pb-3 font-medium">Total</th>
                  <th className="pb-3 font-medium">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#F7F2E8] text-sm">
                {recentOrders.map((order) => (
                  <tr key={order.id} className="hover:bg-[#FDFBF7]/50 transition-colors">
                    <td className="py-3.5 font-semibold text-[#2C2C2C]">{order.id}</td>
                    <td className="py-3.5 text-[#6B6560]">{order.customer}</td>
                    <td className="py-3.5 text-[#6B6560]">{order.date}</td>
                    <td className="py-3.5 font-medium text-[#2C2C2C]">{order.total}</td>
                    <td className="py-3.5">
                      <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold ${
                        order.status === 'Delivered' ? 'bg-green-50 text-green-700' :
                        order.status === 'Shipped' ? 'bg-blue-50 text-blue-700' :
                        order.status === 'Processing' ? 'bg-amber-50 text-amber-700' :
                        'bg-gray-100 text-gray-700'
                      }`}>
                        {order.status === 'Delivered' && <CheckCircle size={10} />}
                        {order.status === 'Shipped' && <Truck size={10} />}
                        {order.status === 'Processing' && <Clock size={10} />}
                        {order.status === 'Pending' && <Clock size={10} />}
                        {order.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Top Selling Products */}
        <div className="bg-white rounded-xl border border-[#E8DFD0] shadow-soft p-6 space-y-6">
          <div>
            <h3 className="text-lg font-bold text-[#6B1D1D] font-heading">Popular Collection</h3>
            <p className="text-xs text-[#6B6560]">Top selling products in high demand</p>
          </div>

          <div className="space-y-4">
            {topProducts.map((product, i) => (
              <div key={i} className="flex items-center justify-between py-3 border-b border-[#F7F2E8] last:border-0">
                <div className="space-y-1 max-w-[70%]">
                  <p className="text-sm font-semibold text-[#2C2C2C] truncate">{product.name}</p>
                  <p className={`text-xs ${product.stock.includes('Out') ? 'text-red-500 font-medium' : 'text-[#6B6560]'}`}>{product.stock}</p>
                </div>
                <div className="text-right space-y-1">
                  <p className="text-sm font-semibold text-[#6B1D1D]">{product.price}</p>
                  <p className="text-xs text-[#6B6560]">{product.sales} sales</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
