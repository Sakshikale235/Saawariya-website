import { Search, Eye, UserCheck } from 'lucide-react';

export function UsersPage() {
  const dummyUsers = [
    {
      id: 'USR-001',
      name: 'Aditya Vardhan',
      email: 'aditya.vardhan@saawariya.com',
      role: 'Admin',
      joined: 'Mar 12, 2025',
      status: 'Active',
      initials: 'AV',
    },
    {
      id: 'USR-102',
      name: 'Aarav Sharma',
      email: 'aarav.sharma@gmail.com',
      role: 'Customer',
      joined: 'Jan 04, 2026',
      status: 'Active',
      initials: 'AS',
    },
    {
      id: 'USR-103',
      name: 'Isha Patel',
      email: 'isha.patel@yahoo.com',
      role: 'Customer',
      joined: 'Jan 15, 2026',
      status: 'Active',
      initials: 'IP',
    },
    {
      id: 'USR-104',
      name: 'Vikram Singh',
      email: 'vikram.singh@outlook.com',
      role: 'Customer',
      joined: 'Feb 10, 2026',
      status: 'Active',
      initials: 'VS',
    },
    {
      id: 'USR-105',
      name: 'Ananya Roy',
      email: 'ananya.roy@gmail.com',
      role: 'Customer',
      joined: 'May 20, 2026',
      status: 'Active',
      initials: 'AR',
    },
    {
      id: 'USR-106',
      name: 'Rajesh Gokhale',
      email: 'rajesh.g@gokhale.co.in',
      role: 'Customer',
      joined: 'Jun 02, 2026',
      status: 'Suspended',
      initials: 'RG',
    },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-[#6B1D1D] font-heading">User Management</h2>
          <p className="text-xs text-[#6B6560]">View registered accounts, customer records, and admin roles</p>
        </div>
      </div>

      {/* Search toolbar */}
      <div className="bg-white p-4 rounded-xl border border-[#E8DFD0] shadow-soft">
        <div className="relative w-full md:w-96">
          <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-[#6B6560]">
            <Search size={18} />
          </span>
          <input
            type="text"
            placeholder="Search users by name, email or ID..."
            className="w-full bg-[#FDFBF7] border border-[#E8DFD0] rounded-lg pl-10 pr-4 py-2 text-sm focus:outline-none focus:border-[#C4A35A]/60"
            disabled
          />
        </div>
      </div>

      {/* Users table */}
      <div className="bg-white rounded-xl border border-[#E8DFD0] shadow-soft overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-[#E8DFD0] bg-[#F7F2E8]/40 text-xs font-semibold text-[#6B6560] uppercase tracking-wider">
                <th className="py-4 px-6 font-medium">User Account</th>
                <th className="py-4 px-6 font-medium">User ID</th>
                <th className="py-4 px-6 font-medium">Role</th>
                <th className="py-4 px-6 font-medium">Joined Date</th>
                <th className="py-4 px-6 font-medium">Status</th>
                <th className="py-4 px-6 font-medium text-right">Profile</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#F7F2E8] text-sm">
              {dummyUsers.map((user) => (
                <tr key={user.id} className="hover:bg-[#FDFBF7]/50 transition-colors">
                  {/* Avatar / Name / Email */}
                  <td className="py-4 px-6">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-full bg-[#F7F2E8] border border-[#C4A35A]/30 flex items-center justify-center font-bold text-xs text-[#6B1D1D] shrink-0">
                        {user.initials}
                      </div>
                      <div>
                        <p className="font-semibold text-[#2C2C2C]">{user.name}</p>
                        <p className="text-[11px] text-[#6B6560]">{user.email}</p>
                      </div>
                    </div>
                  </td>

                  {/* ID */}
                  <td className="py-4 px-6 font-mono text-xs text-[#6B6560]">
                    {user.id}
                  </td>

                  {/* Role */}
                  <td className="py-4 px-6">
                    <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold ${
                      user.role === 'Admin' 
                        ? 'bg-purple-50 text-purple-700 border border-purple-200' 
                        : 'bg-blue-50 text-blue-700 border border-blue-200'
                    }`}>
                      {user.role === 'Admin' && <UserCheck size={10} />}
                      {user.role}
                    </span>
                  </td>

                  {/* Joined */}
                  <td className="py-4 px-6 text-[#6B6560]">
                    {user.joined}
                  </td>

                  {/* Status */}
                  <td className="py-4 px-6">
                    <span className={`inline-flex px-2 py-0.5 rounded-full text-[11px] font-semibold ${
                      user.status === 'Active' ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'
                    }`}>
                      {user.status}
                    </span>
                  </td>

                  {/* Action */}
                  <td className="py-4 px-6 text-right">
                    <button className="flex items-center gap-1.5 ml-auto text-xs font-semibold text-[#C4A35A] hover:text-[#D4B76A] hover:bg-[#F7F2E8]/40 px-3 py-1.5 rounded-lg border border-[#C4A35A]/20 transition-all">
                      <Eye size={13} />
                      <span>View Profile</span>
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
