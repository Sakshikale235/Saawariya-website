import { Store, Mail, Upload, Save } from 'lucide-react';

export function SettingsPage() {
  return (
    <div className="max-w-2xl space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-xl font-bold text-[#6B1D1D] font-heading">Store Settings</h2>
        <p className="text-xs text-[#6B6560]">Manage general configuration parameters for Saawariya</p>
      </div>

      {/* Settings Card */}
      <div className="bg-white rounded-xl border border-[#E8DFD0] shadow-soft p-6 md:p-8 space-y-6">
        {/* Store Name */}
        <div className="space-y-2">
          <label className="block text-xs font-bold text-[#2C2C2C] uppercase tracking-wider">
            Store Name
          </label>
          <div className="relative">
            <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-[#C4A35A]">
              <Store size={16} />
            </span>
            <input
              type="text"
              defaultValue="Saawariya"
              className="w-full bg-[#FDFBF7] border border-[#E8DFD0] rounded-lg pl-10 pr-4 py-2.5 text-sm font-semibold text-[#2C2C2C] focus:outline-none focus:border-[#C4A35A]/60"
              disabled
            />
          </div>
          <p className="text-[10px] text-[#6B6560]">The public brand name displayed on the customer store website.</p>
        </div>

        {/* Contact Email */}
        <div className="space-y-2">
          <label className="block text-xs font-bold text-[#2C2C2C] uppercase tracking-wider">
            Contact Email
          </label>
          <div className="relative">
            <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-[#C4A35A]">
              <Mail size={16} />
            </span>
            <input
              type="email"
              defaultValue="contact@saawariya.com"
              className="w-full bg-[#FDFBF7] border border-[#E8DFD0] rounded-lg pl-10 pr-4 py-2.5 text-sm font-semibold text-[#2C2C2C] focus:outline-none focus:border-[#C4A35A]/60"
              disabled
            />
          </div>
          <p className="text-[10px] text-[#6B6560]">Email used to receive customer support queries and store receipts.</p>
        </div>

        {/* Logo Placeholder */}
        <div className="space-y-3">
          <label className="block text-xs font-bold text-[#2C2C2C] uppercase tracking-wider">
            Store Logo
          </label>
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-6">
            {/* Logo Preview box */}
            <div className="w-20 h-20 rounded-full border-2 border-[#C4A35A] flex items-center justify-center bg-[#F7F2E8] shadow-soft shrink-0">
              <span className="font-accent text-[#6B1D1D] text-3xl font-bold">S</span>
            </div>

            {/* Logo action area */}
            <div className="space-y-2">
              <button 
                type="button"
                className="flex items-center gap-2 border border-[#C4A35A]/30 text-[#6B1D1D] bg-[#F7F2E8]/40 hover:bg-[#F7F2E8] px-4 py-2 rounded-lg text-xs font-semibold transition-all duration-300 shadow-sm"
              >
                <Upload size={14} className="text-[#C4A35A]" />
                <span>Upload New Logo</span>
              </button>
              <p className="text-[10px] text-[#6B6560] leading-relaxed">
                Accepts PNG, JPG or SVG formats. Recommended size: 512x512 pixels. Max size 2MB.
              </p>
            </div>
          </div>
        </div>

        {/* Divider */}
        <div className="h-[1px] bg-[#E8DFD0] pt-2" />

        {/* Form Actions */}
        <div className="flex justify-end pt-2">
          <button 
            type="button"
            className="flex items-center gap-2 bg-[#6B1D1D] text-white px-6 py-2.5 rounded-lg font-semibold text-xs tracking-wider uppercase hover:bg-[#4A1212] transition-colors shadow-md"
          >
            <Save size={15} />
            <span>Save Settings</span>
          </button>
        </div>
      </div>
    </div>
  );
}
