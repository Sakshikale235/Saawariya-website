import { Search, Filter, Eye, ChevronDown, Calendar } from 'lucide-react';

export function OrdersPage() {
  const dummyOrders = [
    {
      id: 'ORD-8924',
      customer: 'Aarav Sharma',
      email: 'aarav.sharma@gmail.com',
      date: 'Jul 28, 2026',
      items: '2 items',
      total: '₹12,500',
      status: 'Delivered',
    },
    {
      id: 'ORD-8923',
      customer: 'Isha Patel',
      email: 'isha.patel@yahoo.com',
      date: 'Jul 28, 2026',
      items: '1 item',
      total: '₹8,900',
      status: 'Shipped',
    },
    {
      id: 'ORD-8922',
      customer: 'Vikram Singh',
      email: 'vikram.singh@outlook.com',
      date: 'Jul 27, 2026',
      items: '4 items',
      total: '₹24,200',
      status: 'Processing',
    },
    {
      id: 'ORD-8921',
      customer: 'Ananya Roy',
      email: 'ananya.roy@gmail.com',
      date: 'Jul 27, 2026',
      items: '1 item',
      total: '₹5,400',
      status: 'Pending',
    },
    {
      id: 'ORD-8920',
      customer: 'Rohan Mehta',
      email: 'rohan.mehta@gmail.com',
      date: 'Jul 26, 2026',
      items: '3 items',
      total: '₹18,100',
      status: 'Delivered',
    },
    {
      id: 'ORD-8919',
      customer: 'Priyanka Sen',
      email: 'priyanka.sen@gmail.com',
      date: 'Jul 25, 2026',
      items: '2 items',
      total: '₹15,000',
      status: 'Cancelled',
    },
  ];

  const getStatusStyle = (status: string) => {
    switch (status) {
      case 'Delivered':
        return 'bg-green-50 text-green-700 border-green-200';
      case 'Shipped':
        return 'bg-blue-50 text-blue-700 border-blue-200';
      case 'Processing':
        return 'bg-amber-50 text-amber-700 border-amber-200';
      case 'Pending':
        return 'bg-purple-50 text-purple-700 border-purple-200';
      case 'Cancelled':
        return 'bg-red-50 text-red-700 border-red-200';
      default:
        return 'bg-gray-50 text-gray-700 border-gray-200';
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-[#6B1D1D] font-heading">Customer Orders</h2>
          <p className="text-xs text-[#6B6560]">Monitor and fulfill customer transaction activities</p>
        </div>
      </div>

      {/* Search & Filters */}
      <div className="bg-white p-4 rounded-xl border border-[#E8DFD0] shadow-soft flex flex-col md:flex-row gap-4 items-center justify-between">
        {/* Search */}
        <div className="relative w-full md:w-96">
          <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-[#6B6560]">
            <Search size={18} />
          </span>
          <input
            type="text"
            placeholder="Search by Order ID or customer..."
            className="w-full bg-[#FDFBF7] border border-[#E8DFD0] rounded-lg pl-10 pr-4 py-2 text-sm focus:outline-none focus:border-[#C4A35A]/60"
            disabled
          />
        </div>

        {/* Filters */}
        <div className="flex items-center gap-3 w-full md:w-auto justify-end">
          <button className="flex items-center gap-2 border border-[#E8DFD0] bg-[#FDFBF7] text-[#2C2C2C] px-4.5 py-2 rounded-lg text-xs font-semibold hover:bg-[#F7F2E8] transition-colors duration-300">
            <Calendar size={14} className="text-[#C4A35A]" />
            <span>Select Date</span>
            <ChevronDown size={14} className="text-[#6B6560]" />
          </button>
          <button className="flex items-center gap-2 border border-[#E8DFD0] bg-[#FDFBF7] text-[#2C2C2C] px-4.5 py-2 rounded-lg text-xs font-semibold hover:bg-[#F7F2E8] transition-colors duration-300">
            <Filter size={14} className="text-[#C4A35A]" />
            <span>Status</span>
            <ChevronDown size={14} className="text-[#6B6560]" />
          </button>
        </div>
      </div>

      {/* Orders Table Container */}
      <div className="bg-white rounded-xl border border-[#E8DFD0] shadow-soft overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-[#E8DFD0] bg-[#F7F2E8]/40 text-xs font-semibold text-[#6B6560] uppercase tracking-wider">
                <th className="py-4 px-6 font-medium">Order ID</th>
                <th className="py-4 px-6 font-medium">Customer</th>
                <th className="py-4 px-6 font-medium">Date</th>
                <th className="py-4 px-6 font-medium text-center">Items</th>
                <th className="py-4 px-6 font-medium">Total</th>
                <th className="py-4 px-6 font-medium">Status</th>
                <th className="py-4 px-6 font-medium text-right">Details</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#F7F2E8] text-sm">
              {dummyOrders.map((order) => (
                <tr key={order.id} className="hover:bg-[#FDFBF7]/50 transition-colors">
                  {/* ID */}
                  <td className="py-4 px-6 font-semibold text-[#2C2C2C]">
                    {order.id}
                  </td>

                  {/* Customer Info */}
                  <td className="py-4 px-6">
                    <div>
                      <p className="font-semibold text-[#2C2C2C]">{order.customer}</p>
                      <p className="text-[11px] text-[#6B6560]">{order.email}</p>
                    </div>
                  </td>

                  {/* Date */}
                  <td className="py-4 px-6 text-[#6B6560]">
                    {order.date}
                  </td>

                  {/* Item count */}
                  <td className="py-4 px-6 text-center text-[#6B6560]">
                    {order.items}
                  </td>

                  {/* Total */}
                  <td className="py-4 px-6 font-semibold text-[#6B1D1D]">
                    {order.total}
                  </td>

                  {/* Status Badges */}
                  <td className="py-4 px-6">
                    <span className={`inline-flex px-2.5 py-0.5 rounded-full text-xs font-semibold border ${getStatusStyle(order.status)}`}>
                      {order.status}
                    </span>
                  </td>

                  {/* View details action */}
                  <td className="py-4 px-6 text-right">
                    <button className="flex items-center gap-1.5 ml-auto text-xs font-semibold text-[#C4A35A] hover:text-[#D4B76A] hover:bg-[#F7F2E8]/40 px-3 py-1.5 rounded-lg border border-[#C4A35A]/20 transition-all">
                      <Eye size={13} />
                      <span>View Details</span>
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
