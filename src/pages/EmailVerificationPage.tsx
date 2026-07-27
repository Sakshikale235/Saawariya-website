import { useEffect, useState } from 'react';
import { AuthLayout } from '../components/AuthLayout';
import { supabase } from '../supabaseClient';
import { useApp } from '../context/AppContext';

export function EmailVerificationPage() {
  const { navigate } = useApp();
  const [message, setMessage] = useState<{ type: 'error' | 'success'; text: string } | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const { data } = await supabase.auth.getSession();
        if (!mounted) return;

        if (data.session?.user) {
          setMessage({ type: 'success', text: 'Email verified. Welcome!' });
          navigate('home');
        } else {
          setMessage({
            type: 'success',
            text: 'Please verify your email. If you already did, you will be redirected automatically.',
          });
        }
      } catch (e) {
        if (!mounted) return;
        setMessage({ type: 'error', text: (e as Error).message || 'Verification check failed.' });
      } finally {
        if (mounted) setLoading(false);
      }
    })();

    return () => {
      mounted = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <AuthLayout
      title="Verify Email"
      subtitle="Enter the code sent to your email address."
    >
      <div className="space-y-4">
        <div>
          <label className="block text-xs font-medium text-[#2C2C2C] mb-2">Verification Code</label>
          <input
            type="text"
            placeholder="123456"
            className="w-full px-4 py-2.5 rounded-lg border border-gray-200 bg-white outline-none text-sm"
            disabled
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
            {loading ? 'Checking...' : message.text}
          </div>
        ) : null}

        <button
          className="w-full bg-[#6B1D1D] text-white px-4 py-3 rounded-lg text-sm font-semibold hover:bg-[#4A1212] transition-colors disabled:opacity-60"
          type="button"
          onClick={() => navigate('login')}
        >
          {loading ? 'Please wait' : 'Verify'}
        </button>
      </div>
    </AuthLayout>
  );
}


