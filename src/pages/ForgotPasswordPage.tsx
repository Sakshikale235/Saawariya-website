import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { AuthLayout } from '../components/AuthLayout';
import { supabase } from '../supabaseClient';

export function ForgotPasswordPage() {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{ type: 'error' | 'success'; text: string } | null>(null);

  const onSendReset = async () => {
    setLoading(true);
    setMessage(null);
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: window.location.origin,
      });
      if (error) throw error;

      setMessage({
        type: 'success',
        text: 'Reset link sent. Please check your email.',
      });
    } catch (e) {
      setMessage({ type: 'error', text: (e as Error).message || 'Failed to send reset link.' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthLayout
      title="Forgot Password"
      subtitle="Enter your email to receive reset instructions."
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
          onClick={onSendReset}
          disabled={loading}
        >
          {loading ? 'Sending...' : 'Send Reset Link'}
        </button>

        <button
          type="button"
          onClick={() => navigate('/login')}
          className="w-full text-center text-xs text-[#6B6560] hover:underline"
        >
          Back to Login
        </button>
      </div>
    </AuthLayout>
  );
}
