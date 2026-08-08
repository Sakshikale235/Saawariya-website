import { useState } from 'react';
import { Plus, Edit2, Trash2, Link as LinkIcon, Move } from 'lucide-react';

export function HeroBannersPage() {
  // Use React state so the toggle is clickable for the demo UI, but no APIs are called.
  const [banners, setBanners] = useState([
    {
      id: 'BNR-01',
      title: 'Festive Collection 2026',
      subtitle: 'Experience regal threads of luxury Banarasi silks',
      link: '/shop?category=collections',
      isActive: true,
      image: 'https://images.unsplash.com/photo-1610030469983-98e550d6193c?auto=format&fit=crop&q=80&w=300&h=100',
    },
    {
      id: 'BNR-02',
      title: 'Royal Maroon Heritage',
      subtitle: 'Exquisite Lehenga collections designed for memory making',
      link: '/shop?category=lehengas',
      isActive: true,
      image: 'https://images.unsplash.com/photo-1595777457583-95e059d581b8?auto=format&fit=crop&q=80&w=300&h=100',
    },
    {
      id: 'BNR-03',
      title: 'Zari Crafted Kurtas',
      subtitle: 'Fine crafted handspun gold embroidered sherwanis & kurtas',
      link: '/shop?category=Men',
      isActive: false,
      image: 'https://images.unsplash.com/photo-1583391733956-3750e0ff4e8b?auto=format&fit=crop&q=80&w=300&h=100',
    },
  ]);

  const handleToggle = (id: string) => {
    setBanners(prev => 
      prev.map(b => b.id === id ? { ...b, isActive: !b.isActive } : b)
    );
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-[#6B1D1D] font-heading">Hero Banners</h2>
          <p className="text-xs text-[#6B6560]">Manage sliding banners on the storefront homepage</p>
        </div>
        <button className="flex items-center gap-2 bg-[#6B1D1D] text-white px-4 py-2.5 rounded-lg font-semibold text-xs tracking-wider uppercase hover:bg-[#4A1212] transition-colors shadow-sm self-start sm:self-auto">
          <Plus size={16} />
          <span>Add Banner</span>
        </button>
      </div>

      {/* Banner Table List */}
      <div className="bg-white rounded-xl border border-[#E8DFD0] shadow-soft overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-[#E8DFD0] bg-[#F7F2E8]/40 text-xs font-semibold text-[#6B6560] uppercase tracking-wider">
                <th className="py-4 px-6 font-medium w-16 text-center">Move</th>
                <th className="py-4 px-6 font-medium">Banner Preview</th>
                <th className="py-4 px-6 font-medium">Content Details</th>
                <th className="py-4 px-6 font-medium">Target Link</th>
                <th className="py-4 px-6 font-medium text-center">Active Status</th>
                <th className="py-4 px-6 font-medium text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#F7F2E8] text-sm">
              {banners.map((banner) => (
                <tr key={banner.id} className="hover:bg-[#FDFBF7]/50 transition-colors">
                  {/* Reorder drag handle placeholder */}
                  <td className="py-4 px-6 text-center text-gray-400">
                    <button className="cursor-grab p-1 hover:text-gray-600 rounded">
                      <Move size={16} />
                    </button>
                  </td>

                  {/* Banner Image Preview */}
                  <td className="py-4 px-6">
                    <div className="w-36 h-16 rounded overflow-hidden border border-[#E8DFD0] bg-[#F7F2E8]">
                      <img src={banner.image} alt={banner.title} className="w-full h-full object-cover" />
                    </div>
                  </td>

                  {/* Banner Content details */}
                  <td className="py-4 px-6">
                    <div className="max-w-xs">
                      <p className="font-semibold text-[#2C2C2C]">{banner.title}</p>
                      <p className="text-xs text-[#6B6560] truncate">{banner.subtitle}</p>
                    </div>
                  </td>

                  {/* Target Link */}
                  <td className="py-4 px-6">
                    <div className="flex items-center gap-1.5 text-xs text-[#C4A35A] font-semibold">
                      <LinkIcon size={12} />
                      <span className="font-mono">{banner.link}</span>
                    </div>
                  </td>

                  {/* Active Toggle Switch */}
                  <td className="py-4 px-6">
                    <div className="flex items-center justify-center">
                      <button
                        onClick={() => handleToggle(banner.id)}
                        className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors duration-300 focus:outline-none ${
                          banner.isActive ? 'bg-[#6B1D1D]' : 'bg-gray-300'
                        }`}
                      >
                        <span
                          className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform duration-300 ${
                            banner.isActive ? 'translate-x-6' : 'translate-x-1'
                          }`}
                        />
                      </button>
                    </div>
                  </td>

                  {/* Actions */}
                  <td className="py-4 px-6 text-right">
                    <div className="flex items-center justify-end gap-2.5">
                      <button className="p-1.5 text-gray-500 hover:text-[#C4A35A] hover:bg-[#F7F2E8] rounded transition-all">
                        <Edit2 size={15} />
                      </button>
                      <button className="p-1.5 text-gray-500 hover:text-red-600 hover:bg-red-50 rounded transition-all">
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
