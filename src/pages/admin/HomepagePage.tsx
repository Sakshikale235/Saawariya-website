import { useState } from 'react';
import { Layers, Sliders, Eye, EyeOff, Edit, Move, Save } from 'lucide-react';

export function HomepagePage() {
  const [sections, setSections] = useState([
    {
      id: 'sec-1',
      name: 'Hero Banner Carousel',
      description: 'Main promotional slider at the top of the homepage.',
      status: 'Active',
      details: '3 slides active (Festive Collection, Royal Maroon, Zari Kurtas)',
      icon: Sliders,
    },
    {
      id: 'sec-2',
      name: 'New Arrivals',
      description: 'Grid of newly added products matching the tag is_new=true.',
      status: 'Active',
      details: 'Displaying 8 products, sorted by created_at DESC',
      icon: Layers,
    },
    {
      id: 'sec-3',
      name: 'Featured Collection Banner',
      description: 'Promotional collection call-out banner with customized text.',
      status: 'Active',
      details: 'Current selection: Festive Collection 2024',
      icon: Layers,
    },
    {
      id: 'sec-4',
      name: 'Best Picks / Bestsellers',
      description: 'Carousel of popular items matching bestseller=true.',
      status: 'Active',
      details: 'Displaying 8 products, sorted by sales quantity',
      icon: Layers,
    },
  ]);

  const handleToggleStatus = (id: string) => {
    setSections(prev =>
      prev.map(s => 
        s.id === id 
          ? { ...s, status: s.status === 'Active' ? 'Hidden' : 'Active' } 
          : s
      )
    );
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-[#6B1D1D] font-heading">Homepage Management</h2>
          <p className="text-xs text-[#6B6560]">Configure dynamic section order and display rules on Saawariya frontpage</p>
        </div>
        <button className="flex items-center gap-2 bg-[#6B1D1D] text-white px-4 py-2.5 rounded-lg font-semibold text-xs tracking-wider uppercase hover:bg-[#4A1212] transition-colors shadow-sm self-start sm:self-auto">
          <Save size={16} />
          <span>Save Layout Order</span>
        </button>
      </div>

      {/* Main control panel list */}
      <div className="space-y-4">
        {sections.map((section) => {
          const Icon = section.icon;
          const isActive = section.status === 'Active';
          return (
            <div
              key={section.id}
              className={`bg-white rounded-xl border border-[#E8DFD0] shadow-soft p-5 md:p-6 transition-all duration-300 flex flex-col md:flex-row items-start md:items-center justify-between gap-4 hover:border-[#C4A35A]/50 ${
                !isActive ? 'opacity-60 bg-gray-50/50' : ''
              }`}
            >
              {/* Left Side: Drag Handle, Icon, and Info */}
              <div className="flex items-start md:items-center gap-4 w-full md:w-auto">
                <button className="cursor-grab text-gray-400 hover:text-gray-600 p-1 mt-1 md:mt-0">
                  <Move size={18} />
                </button>

                <div className={`p-3 rounded-lg flex items-center justify-center shrink-0 ${
                  isActive ? 'bg-[#F7F2E8] text-[#6B1D1D]' : 'bg-gray-100 text-gray-400'
                }`}>
                  <Icon size={20} />
                </div>

                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <h3 className="font-bold text-[#2C2C2C]">{section.name}</h3>
                    <span className={`text-[10px] px-2 py-0.5 rounded-full font-semibold ${
                      isActive ? 'bg-green-50 text-green-700' : 'bg-gray-200 text-gray-700'
                    }`}>
                      {section.status}
                    </span>
                  </div>
                  <p className="text-xs text-[#6B6560] leading-relaxed">{section.description}</p>
                  <div className="text-[11px] text-[#C4A35A] font-semibold flex items-center gap-1.5 mt-1">
                    <span>Config:</span>
                    <span className="text-[#6B6560] font-normal">{section.details}</span>
                  </div>
                </div>
              </div>

              {/* Right Side: Toggle & Edit Button */}
              <div className="flex items-center gap-3 w-full md:w-auto justify-end border-t border-[#F7F2E8] pt-3 md:border-0 md:pt-0">
                <button
                  onClick={() => handleToggleStatus(section.id)}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold border transition-all ${
                    isActive 
                      ? 'border-[#C4A35A]/30 text-[#6B6560] hover:bg-[#F7F2E8]/40' 
                      : 'border-gray-300 text-gray-500 hover:bg-gray-100'
                  }`}
                  title={isActive ? 'Hide Section' : 'Show Section'}
                >
                  {isActive ? <EyeOff size={14} /> : <Eye size={14} />}
                  <span>{isActive ? 'Hide' : 'Show'}</span>
                </button>

                <button className="flex items-center gap-1.5 px-3 py-1.5 bg-[#6B1D1D] text-white rounded-lg text-xs font-semibold hover:bg-[#4A1212] transition-colors shadow-sm">
                  <Edit size={14} />
                  <span>Configure Settings</span>
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
