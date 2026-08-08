import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { AuthLayout } from '../components/AuthLayout';
import { supabase } from '../supabaseClient';

export function LoginPage() {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{ type: 'error' | 'success'; text: string } | null>(null);

  const onLogin = async () => {
    setLoading(true);
    setMessage(null);
    try {
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) throw error;

      setMessage({ type: 'success', text: 'Login successful.' });
      navigate('/');
    } catch (e) {
      setMessage({ type: 'error', text: (e as Error).message || 'Login failed.' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthLayout
      title="Login"
      subtitle="Welcome back. Please enter your details."
    >
      <div className="space-y-4">
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
          onClick={onLogin}
          disabled={loading}
        >
          {loading ? 'Signing in...' : 'Sign In'}
        </button>

        <button
          type="button"
          onClick={() => navigate('/forgot-password')}
          className="w-full text-center text-xs text-[#6B6560] hover:underline"
        >
          Forgot password?
        </button>

        <button
          type="button"
          onClick={() => navigate('/signup')}
          className="w-full text-center text-xs text-[#6B6560] hover:underline"
        >
          Create an account
        </button>
      </div>
    </AuthLayout>
  );
}
