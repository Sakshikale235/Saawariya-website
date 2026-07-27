import { useMemo, useState } from 'react';
import { AuthLayout } from '../components/AuthLayout';
import { supabase } from '../supabaseClient';
import { useApp } from '../context/AppContext';

export function ResetPasswordPage() {
  const { navigate } = useApp();
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{ type: 'error' | 'success'; text: string } | null>(null);

  const recoveryToken = useMemo(() => {
    const params = new URLSearchParams(window.location.search);
    // Supabase commonly uses access_token in the URL for recovery flows
    return params.get('access_token') ?? params.get('token') ?? '';
  }, []);

  const onUpdate = async () => {
    setLoading(true);
    setMessage(null);
    try {
      if (!password || password !== confirm) {
        throw new Error('Passwords do not match.');
      }

      // If using password recovery, Supabase typically expects the recovery session.
      // `updateUser` requires the user to be authenticated with the recovery session.
      if (recoveryToken) {
        // Set the session using the token from URL (recovery flow)
        const { error: authError } = await supabase.auth.setSession({
          access_token: recoveryToken,
          refresh_token: recoveryToken,
        });
        // Even if refresh token differs, Supabase will reject invalid pairs.
        if (authError) throw authError;
      }

      const { error } = await supabase.auth.updateUser({ password });
      if (error) throw error;

      setMessage({ type: 'success', text: 'Password updated successfully.' });
      navigate('login');
    } catch (e) {
      setMessage({ type: 'error', text: (e as Error).message || 'Failed to update password.' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthLayout
      title="Reset Password"
      subtitle="Create a new password for your account."
    >
      <div className="space-y-4">
        <div>
          <label className="block text-xs font-medium text-[#2C2C2C] mb-2">New Password</label>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="••••••••"
            className="w-full px-4 py-2.5 rounded-lg border border-gray-200 bg-white outline-none text-sm"
          />
        </div>
        <div>
          <label className="block text-xs font-medium text-[#2C2C2C] mb-2">Confirm Password</label>
          <input
            type="password"
            value={confirm}
            onChange={(e) => setConfirm(e.target.value)}
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
          onClick={onUpdate}
          disabled={loading}
        >
          {loading ? 'Updating...' : 'Update Password'}
        </button>

        <button
          type="button"
          onClick={() => navigate('login')}
          className="w-full text-center text-xs text-[#6B6560] hover:underline"
        >
          Back to Login
        </button>
      </div>
    </AuthLayout>
  );
}


