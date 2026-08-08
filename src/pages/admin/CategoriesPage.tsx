import { Plus, Edit2, Trash2 } from 'lucide-react';

export function CategoriesPage() {
  const dummyCategories = [
    {
      id: 'CAT-01',
      name: 'Sarees',
      slug: 'sarees',
      description: 'Elegant Banarasi, Kanjeevaram and Silk sarees.',
      productCount: 14,
      image: 'https://images.unsplash.com/photo-1610030469983-98e550d6193c?auto=format&fit=crop&q=80&w=150',
    },
    {
      id: 'CAT-02',
      name: 'Lehengas',
      slug: 'lehengas',
      description: 'Handcrafted designer lehengas for brides and wedding guests.',
      productCount: 8,
      image: 'https://images.unsplash.com/photo-1595777457583-95e059d581b8?auto=format&fit=crop&q=80&w=150',
    },
    {
      id: 'CAT-03',
      name: 'Kurta Sets',
      slug: 'kurta-sets',
      description: 'Traditional and fusion men and women kurta pyjama sets.',
      productCount: 22,
      image: 'https://images.unsplash.com/photo-1583391733956-3750e0ff4e8b?auto=format&fit=crop&q=80&w=150',
    },
    {
      id: 'CAT-04',
      name: 'Shawls',
      slug: 'shawls',
      description: 'Pure Pashmina and wool shawls from Kashmir.',
      productCount: 6,
      image: 'https://images.unsplash.com/photo-1601924994987-69e26d50dc26?auto=format&fit=crop&q=80&w=150',
    },
    {
      id: 'CAT-05',
      name: 'Dupattas',
      slug: 'dupattas',
      description: 'Premium silk, organza, and velvet handwoven dupattas.',
      productCount: 11,
      image: 'https://images.unsplash.com/photo-1583391265517-35bbdba0120a?auto=format&fit=crop&q=80&w=150',
    },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-[#6B1D1D] font-heading">Manage Categories</h2>
          <p className="text-xs text-[#6B6560]">Create and organize clothing categories for your storefront</p>
        </div>
        <button className="flex items-center gap-2 bg-[#6B1D1D] text-white px-4 py-2.5 rounded-lg font-semibold text-xs tracking-wider uppercase hover:bg-[#4A1212] transition-colors shadow-sm self-start sm:self-auto">
          <Plus size={16} />
          <span>Add Category</span>
        </button>
      </div>

      {/* Categories Table Container */}
      <div className="bg-white rounded-xl border border-[#E8DFD0] shadow-soft overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-[#E8DFD0] bg-[#F7F2E8]/40 text-xs font-semibold text-[#6B6560] uppercase tracking-wider">
                <th className="py-4 px-6 font-medium">Category Info</th>
                <th className="py-4 px-6 font-medium">Slug</th>
                <th className="py-4 px-6 font-medium">Description</th>
                <th className="py-4 px-6 font-medium text-center">Total Products</th>
                <th className="py-4 px-6 font-medium text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#F7F2E8] text-sm">
              {dummyCategories.map((category) => (
                <tr key={category.id} className="hover:bg-[#FDFBF7]/50 transition-colors">
                  {/* Category Name & Image */}
                  <td className="py-4 px-6">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 rounded-lg overflow-hidden bg-gray-100 border border-[#E8DFD0] shrink-0">
                        <img src={category.image} alt={category.name} className="w-full h-full object-cover" />
                      </div>
                      <div>
                        <p className="font-semibold text-[#2C2C2C]">{category.name}</p>
                        <p className="text-[11px] text-[#6B6560]">ID: {category.id}</p>
                      </div>
                    </div>
                  </td>

                  {/* Slug */}
                  <td className="py-4 px-6 font-mono text-xs text-[#C4A35A] font-semibold">
                    {category.slug}
                  </td>

                  {/* Description */}
                  <td className="py-4 px-6 text-[#6B6560] max-w-sm truncate">
                    {category.description}
                  </td>

                  {/* Product Count */}
                  <td className="py-4 px-6 text-center font-semibold text-[#2C2C2C]">
                    {category.productCount}
                  </td>

                  {/* Actions */}
                  <td className="py-4 px-6 text-right">
                    <div className="flex items-center justify-end gap-2.5">
                      <button className="p-1.5 text-gray-500 hover:text-[#C4A35A] hover:bg-[#F7F2E8] rounded transition-all" title="Edit Category">
                        <Edit2 size={15} />
                      </button>
                      <button className="p-1.5 text-gray-500 hover:text-red-600 hover:bg-red-50 rounded transition-all" title="Delete Category">
                        <Trash2 size={15} />
                      </button>
                    </div>
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
