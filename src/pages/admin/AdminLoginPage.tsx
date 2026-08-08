import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../../supabaseClient';
import { KeyRound, Mail, Loader2, AlertCircle, Store } from 'lucide-react';

export function AdminLoginPage() {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) return;

    setLoading(true);
    setError(null);

    try {
      // 1. Authenticate with Supabase Auth
      const { data, error: authError } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (authError) throw authError;

      const user = data?.user;
      if (!user) throw new Error('Authentication succeeded but user details are unavailable.');

      // 2. Fetch profile from profiles table to check user role
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('role')
        .eq('user_id', user.id)
        .maybeSingle();

      if (profileError) throw profileError;

      // 3. Verify admin role
      if (profile?.role === 'admin') {
        // Success: Navigate to admin dashboard
        navigate('/admin/dashboard');
      } else {
        // Access Denied: Immediately sign out the session to prevent unauthorized access
        await supabase.auth.signOut();
        throw new Error('Access Denied. Administrator privileges are required to access this portal.');
      }
    } catch (err: any) {
      console.error('Admin login error:', err);
      setError(err.message || 'An unexpected error occurred. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#6B1D1D] flex flex-col justify-center items-center px-4 relative overflow-hidden">
      {/* Background decorations */}
      <div className="absolute top-0 right-0 w-96 h-96 bg-[#C4A35A]/5 rounded-full blur-3xl -translate-y-12 translate-x-12" />
      <div className="absolute bottom-0 left-0 w-96 h-96 bg-[#C4A35A]/5 rounded-full blur-3xl translate-y-12 -translate-x-12" />

      {/* Main card */}
      <div className="w-full max-w-md bg-[#FDFBF7] rounded-2xl border border-[#C4A35A]/30 p-8 shadow-strong relative z-10 animate-scale-in">
        {/* Branding header */}
        <div className="text-center mb-8">
          <button 
            onClick={() => navigate('/')}
            className="w-16 h-16 rounded-full border-2 border-[#C4A35A] flex items-center justify-center mx-auto mb-4 bg-[#6B1D1D] hover:scale-105 transition-transform duration-300"
          >
            <span className="text-[#FDFBF7] text-2xl font-bold font-accent">S</span>
          </button>
          <h1 className="text-[#6B1D1D] text-2xl font-bold tracking-[0.2em] font-accent uppercase">
            SAAWARIYA
          </h1>
          <p className="text-[#C4A35A] text-xs font-semibold tracking-wider uppercase mt-1">
            Admin Access Portal
          </p>
        </div>

        {/* Error message */}
        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg flex items-start gap-3 text-red-700 text-xs font-medium animate-fade-in">
            <AlertCircle size={16} className="shrink-0 mt-0.5" />
            <p>{error}</p>
          </div>
        )}

        {/* Login form */}
        <form onSubmit={handleSubmit} className="space-y-5">
          {/* Email input */}
          <div className="space-y-1.5">
            <label className="block text-xs font-bold text-[#2C2C2C] uppercase tracking-wider">
              Email Address
            </label>
            <div className="relative">
              <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-[#C4A35A]">
                <Mail size={16} />
              </span>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="admin@saawariya.com"
                disabled={loading}
                className="w-full bg-[#F7F2E8]/40 border border-[#E8DFD0] rounded-lg pl-10 pr-4 py-2.5 text-sm font-semibold text-[#2C2C2C] focus:outline-none focus:border-[#C4A35A]/60 transition-colors"
              />
            </div>
          </div>

          {/* Password input */}
          <div className="space-y-1.5">
            <label className="block text-xs font-bold text-[#2C2C2C] uppercase tracking-wider">
              Password
            </label>
            <div className="relative">
              <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-[#C4A35A]">
                <KeyRound size={16} />
              </span>
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                disabled={loading}
                className="w-full bg-[#F7F2E8]/40 border border-[#E8DFD0] rounded-lg pl-10 pr-4 py-2.5 text-sm font-semibold text-[#2C2C2C] focus:outline-none focus:border-[#C4A35A]/60 transition-colors"
              />
            </div>
          </div>

          {/* Action button */}
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-[#6B1D1D] hover:bg-[#4A1212] text-white py-3 rounded-lg font-semibold text-xs tracking-wider uppercase transition-all duration-300 shadow-md hover:shadow-lg flex items-center justify-center gap-2 mt-2 disabled:opacity-50"
          >
            {loading ? (
              <>
                <Loader2 size={16} className="animate-spin" />
                <span>Authenticating...</span>
              </>
            ) : (
              <span>Sign In as Admin</span>
            )}
          </button>
        </form>

        {/* Footer actions */}
        <div className="mt-8 border-t border-[#E8DFD0] pt-4 text-center">
          <button
            onClick={() => navigate('/')}
            className="inline-flex items-center gap-1.5 text-xs text-[#6B6560] hover:text-[#6B1D1D] font-semibold transition-colors"
          >
            <Store size={14} />
            <span>Return to Storefront</span>
          </button>
        </div>
      </div>
    </div>
  );
}
