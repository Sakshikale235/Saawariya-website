import { Search, Filter, Plus, Edit2, Trash2, ChevronDown } from 'lucide-react';

export function ProductsPage() {
  const dummyProducts = [
    {
      id: 'PRD-101',
      name: 'Royal Crimson Banarasi Saree',
      sku: 'SAR-BAN-CRM-01',
      category: 'Saree',
      price: '₹18,500',
      stock: 12,
      status: 'In Stock',
      image: 'https://images.unsplash.com/photo-1610030469983-98e550d6193c?auto=format&fit=crop&q=80&w=150', // Mock Saree
    },
    {
      id: 'PRD-102',
      name: 'Maroon Zardozi Embroidered Lehenga',
      sku: 'LHG-ZAR-MAR-02',
      category: 'Lehenga',
      price: '₹45,000',
      stock: 8,
      status: 'In Stock',
      image: 'https://images.unsplash.com/photo-1595777457583-95e059d581b8?auto=format&fit=crop&q=80&w=150', // Mock Lehenga
    },
    {
      id: 'PRD-103',
      name: 'Golden Zari Silk Kurta Set',
      sku: 'KRT-SIL-GLD-03',
      category: 'Kurta Set',
      price: '₹12,000',
      stock: 0,
      status: 'Out of Stock',
      image: 'https://images.unsplash.com/photo-1583391733956-3750e0ff4e8b?auto=format&fit=crop&q=80&w=150', // Mock Kurta
    },
    {
      id: 'PRD-104',
      name: 'Elegant Ivory Pashmina Shawl',
      sku: 'SHL-PAS-IVR-04',
      category: 'Shawls',
      price: '₹9,500',
      stock: 32,
      status: 'In Stock',
      image: 'https://images.unsplash.com/photo-1601924994987-69e26d50dc26?auto=format&fit=crop&q=80&w=150', // Mock Shawl
    },
    {
      id: 'PRD-105',
      name: 'Emerald Peacock Silk Dupatta',
      sku: 'DPT-SLK-EME-05',
      category: 'Dupatta',
      price: '₹4,200',
      stock: 4,
      status: 'Low Stock',
      image: 'https://images.unsplash.com/photo-1583391265517-35bbdba0120a?auto=format&fit=crop&q=80&w=150', // Mock Dupatta
    },
  ];

  return (
    <div className="space-y-6">
      {/* Header Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-[#6B1D1D] font-heading">Manage Products</h2>
          <p className="text-xs text-[#6B6560]">Create, modify, and manage Saawariya catalog items</p>
        </div>
        <button className="flex items-center gap-2 bg-[#6B1D1D] text-white px-4 py-2.5 rounded-lg font-semibold text-xs tracking-wider uppercase hover:bg-[#4A1212] transition-colors shadow-sm self-start sm:self-auto">
          <Plus size={16} />
          <span>Add Product</span>
        </button>
      </div>

      {/* Search & Filter Toolbar */}
      <div className="bg-white p-4 rounded-xl border border-[#E8DFD0] shadow-soft flex flex-col md:flex-row gap-4 items-center justify-between">
        {/* Search */}
        <div className="relative w-full md:w-96">
          <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-[#6B6560]">
            <Search size={18} />
          </span>
          <input
            type="text"
            placeholder="Search by product name or SKU..."
            className="w-full bg-[#FDFBF7] border border-[#E8DFD0] rounded-lg pl-10 pr-4 py-2 text-sm focus:outline-none focus:border-[#C4A35A]/60"
            disabled
          />
        </div>

        {/* Filters */}
        <div className="flex items-center gap-3 w-full md:w-auto justify-end">
          <button className="flex items-center gap-2 border border-[#E8DFD0] bg-[#FDFBF7] text-[#2C2C2C] px-4.5 py-2 rounded-lg text-xs font-semibold hover:bg-[#F7F2E8] transition-colors duration-300">
            <Filter size={14} className="text-[#C4A35A]" />
            <span>Filter</span>
            <ChevronDown size={14} className="text-[#6B6560]" />
          </button>
          <button className="flex items-center gap-2 border border-[#E8DFD0] bg-[#FDFBF7] text-[#2C2C2C] px-4.5 py-2 rounded-lg text-xs font-semibold hover:bg-[#F7F2E8] transition-colors duration-300">
            <span>Sort By</span>
            <ChevronDown size={14} className="text-[#6B6560]" />
          </button>
        </div>
      </div>

      {/* Products Table Container */}
      <div className="bg-white rounded-xl border border-[#E8DFD0] shadow-soft overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-[#E8DFD0] bg-[#F7F2E8]/40 text-xs font-semibold text-[#6B6560] uppercase tracking-wider">
                <th className="py-4 px-6 font-medium">Product</th>
                <th className="py-4 px-6 font-medium">SKU</th>
                <th className="py-4 px-6 font-medium">Category</th>
                <th className="py-4 px-6 font-medium">Price</th>
                <th className="py-4 px-6 font-medium text-center">Stock</th>
                <th className="py-4 px-6 font-medium">Status</th>
                <th className="py-4 px-6 font-medium text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#F7F2E8] text-sm">
              {dummyProducts.map((product) => (
                <tr key={product.id} className="hover:bg-[#FDFBF7]/50 transition-colors">
                  {/* Product Info */}
                  <td className="py-4 px-6">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 rounded-lg overflow-hidden bg-gray-100 border border-[#E8DFD0] shrink-0">
                        <img src={product.image} alt={product.name} className="w-full h-full object-cover" />
                      </div>
                      <div className="max-w-xs md:max-w-sm truncate">
                        <p className="font-semibold text-[#2C2C2C] hover:text-[#6B1D1D] transition-colors">
                          {product.name}
                        </p>
                        <p className="text-[11px] text-[#6B6560]">ID: {product.id}</p>
                      </div>
                    </div>
                  </td>
                  
                  {/* SKU */}
                  <td className="py-4 px-6 text-xs font-mono text-[#6B6560]">
                    {product.sku}
                  </td>
                  
                  {/* Category */}
                  <td className="py-4 px-6 text-[#6B6560]">
                    {product.category}
                  </td>
                  
                  {/* Price */}
                  <td className="py-4 px-6 font-semibold text-[#2C2C2C]">
                    {product.price}
                  </td>

                  {/* Stock count */}
                  <td className="py-4 px-6 text-center font-medium text-[#2C2C2C]">
                    {product.stock}
                  </td>

                  {/* Status Badge */}
                  <td className="py-4 px-6">
                    <span className={`inline-flex px-2.5 py-0.5 rounded-full text-xs font-semibold ${
                      product.status === 'In Stock' ? 'bg-green-50 text-green-700' :
                      product.status === 'Low Stock' ? 'bg-amber-50 text-amber-700' :
                      'bg-red-50 text-red-700'
                    }`}>
                      {product.status}
                    </span>
                  </td>

                  {/* Actions */}
                  <td className="py-4 px-6 text-right">
                    <div className="flex items-center justify-end gap-2.5">
                      <button className="p-1.5 text-gray-500 hover:text-[#C4A35A] hover:bg-[#F7F2E8] rounded transition-all" title="Edit Product">
                        <Edit2 size={15} />
                      </button>
                      <button className="p-1.5 text-gray-500 hover:text-red-600 hover:bg-red-50 rounded transition-all" title="Delete Product">
                        <Trash2 size={15} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        
        {/* Pagination placeholder */}
        <div className="px-6 py-4 border-t border-[#E8DFD0] flex items-center justify-between text-xs text-[#6B6560] bg-[#F7F2E8]/10">
          <span>Showing 1-5 of 32 products</span>
          <div className="flex gap-2">
            <button className="px-3 py-1.5 border border-[#E8DFD0] rounded bg-white hover:bg-gray-50 disabled:opacity-50" disabled>Previous</button>
            <button className="px-3 py-1.5 border border-[#E8DFD0] rounded bg-white hover:bg-gray-50 disabled:opacity-50" disabled>Next</button>
          </div>
        </div>
      </div>
    </div>
  );
}
