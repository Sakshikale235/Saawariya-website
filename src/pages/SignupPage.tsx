import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { AuthLayout } from '../components/AuthLayout';
import { supabase } from '../supabaseClient';

export function SignupPage() {
  const navigate = useNavigate();
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{ type: 'error' | 'success'; text: string } | null>(null);

  const onSignup = async () => {
    setLoading(true);
    setMessage(null);

    try {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            full_name: fullName,
          },
        },
      });

      if (error) throw error;

      // Create profile row on first signup.
      // Note: at signUp time, user may not be immediately available in `data.user` if email verification is required.
      // We still attempt creation if `data.user` exists.
      const authUser = data?.user;
      if (authUser?.id) {
        const { error: upsertError } = await supabase
          .from('profiles')
          .upsert({
            user_id: authUser.id,
            full_name: fullName || null,
            email: authUser.email || email,
            phone: null,
            gender: null,
            updated_at: new Date().toISOString(),
            created_at: new Date().toISOString(),
          }, { onConflict: 'user_id' as any });

        // If profile insert fails, surface it but keep account creation message consistent.
        if (upsertError) throw upsertError;
      }

      setMessage({
        type: 'success',
        text: 'Account created. Please check your email to verify your address.',
      });

      // Keep user on this page until they verify.
      void data;
    } catch (e) {
      setMessage({ type: 'error', text: (e as Error).message || 'Signup failed.' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthLayout title="Create Account" subtitle="Join Saawariya for curated luxury essentials.">
      <div className="space-y-4">
        <div>
          <label className="block text-xs font-medium text-[#2C2C2C] mb-2">Name</label>
          <input
            value={fullName}
            onChange={(e) => setFullName(e.target.value)}
            type="text"
            placeholder="Your name"
            className="w-full px-4 py-2.5 rounded-lg border border-gray-200 bg-white outline-none text-sm"
          />
        </div>

        <div>
          <label className="block text-xs font-medium text-[#2C2C2C] mb-2">Email</label>
          <input
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            type="email"
            placeholder="you@example.com"
            className="w-full px-4 py-2.5 rounded-lg border border-gray-200 bg-white outline-none text-sm"
          />
        </div>

        <div>
          <label className="block text-xs font-medium text-[#2C2C2C] mb-2">Password</label>
          <input
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            type="password"
            placeholder="••••••••"
            className="w-full px-4 py-2.5 rounded-lg border border-gray-200 bg-white outline-none text-sm"
          />
        </div>

        {message ? (
          <div
            className={
              message.type === 'error'
                ? 'text-sm text-[#C62828] bg-[#C62828]/5 border border-[#C62828]/20 rounded-lg px-3 py-2'
                : 'text-sm text-[#2C6B2C] bg-[#2C6B2C]/5 border border-[#2C6B2C]/20 rounded-lg px-3 py-2'
            }
          >
            {message.text}
          </div>
        ) : null}

        <button
          className="w-full bg-[#6B1D1D] text-white px-4 py-3 rounded-lg text-sm font-semibold hover:bg-[#4A1212] transition-colors disabled:opacity-60"
          type="button"
          onClick={onSignup}
          disabled={loading}
        >
          {loading ? 'Creating...' : 'Create Account'}
        </button>

        <button
          type="button"
          onClick={() => navigate('/login')}
          className="w-full text-center text-xs text-[#6B6560] hover:underline"
        >
          Already have an account? Login
        </button>
      </div>
    </AuthLayout>
  );
}
