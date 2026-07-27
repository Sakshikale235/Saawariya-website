import { useEffect, useMemo, useState } from 'react';
import { Heart, MapPin, Package, ShoppingBag } from 'lucide-react';

import { useApp } from '../context/AppContext';
import { useSupabaseAuth } from '../context/SupabaseAuthContext';

type Gender = 'male' | 'female' | 'other' | '';

type Profile = {
  user_id: string;
  full_name: string | null;
  email: string | null;
  phone: string | null;
  gender: string | null;
  created_at?: string | null;
  updated_at?: string | null;
};

type FormState = {
  full_name: string;
  phone: string;
  gender: Gender;
};

export function ProfilePage() {
  const { navigate } = useApp();
  const { session, loading: authLoading, logout } = useSupabaseAuth();

  const [pageLoading, setPageLoading] = useState(true);
  const [profile, setProfile] = useState<Profile | null>(null);

  const [isEditing, setIsEditing] = useState(false);
  const [form, setForm] = useState<FormState>({
    full_name: '',
    phone: '',
    gender: '',
  });

  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({});

  const uid = session?.user?.id ?? '';
  const email = session?.user?.email ?? '';

  const canAccess = !!session && !authLoading;
  const loading = authLoading || pageLoading;

  useEffect(() => {
    if (!session) {
      setProfile(null);
      setPageLoading(false);
      setIsEditing(false);
      return;
    }

    let cancelled = false;

    (async () => {
      try {
        setPageLoading(true);
        setMessage(null);
        setValidationErrors({});

        const { supabase } = await import('../supabaseClient');
        const { data, error } = await supabase
          .from('profiles')
          .select('*')
          .eq('user_id', uid)
          .maybeSingle();

        if (error) throw error;

        if (!data) {
          setProfile(null);
        } else {
          setProfile(data as Profile);
        }
      } catch (e) {
        setMessage({
          type: 'error',
          text: (e as Error).message || 'Failed to load profile.',
        });
        setProfile({
          user_id: uid,
          full_name: null,
          email: email,
          phone: null,
          gender: null,
        });
      } finally {
        if (!cancelled) setPageLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [session, uid, email]);

  const derived = useMemo(() => {
    return {
      full_name: profile?.full_name ?? '',
      phone: profile?.phone ?? '',
      gender: (profile?.gender ?? '') as Gender,
    };
  }, [profile]);

  useEffect(() => {
    if (!profile) return;
    setForm({
      full_name: derived.full_name,
      phone: derived.phone,
      gender: derived.gender,
    });
  }, [profile, derived.full_name, derived.phone, derived.gender]);

  const validate = () => {
    const errs: Record<string, string> = {};
    if (!form.full_name.trim()) errs.full_name = 'Full name is required.';
    if (!form.phone.trim()) errs.phone = 'Phone number is required.';
    if (!form.gender) errs.gender = 'Gender is required.';
    setValidationErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const startEdit = () => {
    setMessage(null);
    setValidationErrors({});
    setIsEditing(true);
  };

  const cancelEdit = () => {
    setValidationErrors({});
    setMessage(null);
    setIsEditing(false);
    setForm({
      full_name: derived.full_name,
      phone: derived.phone,
      gender: derived.gender,
    });
  };

  const onSave = async () => {
    setMessage(null);
    setValidationErrors({});

    if (!canAccess) return;
    if (!validate()) return;

    setSaving(true);
    try {
      const payload = {
        user_id: uid,
        full_name: form.full_name.trim(),
        email,
        phone: form.phone.trim(),
        gender: form.gender,
        updated_at: new Date().toISOString(),
      };

      const { supabase } = await import('../supabaseClient');
      const { data, error } = await supabase
        .from('profiles')
        .upsert(payload)
        .select()
        .maybeSingle();

      if (error) throw error;

      const nextProfile: Profile = (data ?? {
        ...payload,
        full_name: payload.full_name,
        email: payload.email,
        phone: payload.phone,
        gender: payload.gender,
      }) as Profile;

      setProfile(nextProfile);
      setForm({
        full_name: nextProfile.full_name ?? '',
        phone: nextProfile.phone ?? '',
        gender: (nextProfile.gender ?? '') as Gender,
      });

      setIsEditing(false);
      setMessage({ type: 'success', text: 'Profile updated successfully.' });
    } catch (e) {
      setMessage({
        type: 'error',
        text: (e as Error).message || 'Failed to save profile.',
      });
    } finally {
      setSaving(false);
    }
  };

  const Field = ({
    label,
    value,
    placeholder,
    name,
  }: {
    label: string;
    value: string;
    placeholder: string;
    name: 'full_name' | 'phone' | 'gender';
  }) => {
    const readOnly = !isEditing;

    return (
      <div>
        <label className="block text-xs font-medium text-[#2C2C2C] mb-2">{label}</label>
        {name === 'gender' ? (
          <select
            value={value}
            disabled={readOnly}
            onChange={(e) => setForm((f) => ({ ...f, gender: e.target.value as Gender }))}
            className="w-full px-4 py-2.5 rounded-lg border border-gray-200 bg-white outline-none text-sm"
          >
            <option value="">Select gender</option>
            <option value="male">Male</option>
            <option value="female">Female</option>
            <option value="other">Other</option>
          </select>
        ) : (
          <input
            value={value}
            disabled={readOnly}
            onChange={(e) => {
              const next = e.target.value;
              setForm((f) => ({ ...f, [name]: next } as any));
            }}
            placeholder={placeholder}
            className="w-full px-4 py-2.5 rounded-lg border border-gray-200 bg-white outline-none text-sm"
          />
        )}

        {validationErrors[name] ? <p className="mt-2 text-xs text-[#C62828]">{validationErrors[name]}</p> : null}
      </div>
    );
  };

  if (!session && !authLoading) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center px-4">
        <div className="text-center max-w-md">
          <p className="text-sm text-[#6B6560] mb-4">Please log in to view your account.</p>
          <button
            onClick={() => navigate('login')}
            className="bg-[#6B1D1D] text-white px-8 py-3 rounded-lg text-sm font-semibold hover:bg-[#4A1212] transition-colors"
          >
            Go to Login
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white">
      <div className="bg-[#F7F2E8] py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <h1 className="text-3xl font-bold text-[#2C2C2C]" style={{ fontFamily: "'Playfair Display', serif" }}>
            My Account
          </h1>
          <p className="text-sm text-[#6B6560] mt-2">{loading ? 'Loading your profile...' : 'Manage your personal information'}</p>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-10">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2">
            <div className="bg-white border border-gray-100 rounded-xl shadow-sm p-6 sm:p-8">
              {message ? (
                <div
                  className={
                    message.type === 'success'
                      ? 'text-sm text-[#2C6B2C] bg-[#2C6B2C]/5 border border-[#2C6B2C]/20 rounded-lg px-3 py-2 mb-4'
                      : 'text-sm text-[#C62828] bg-[#C62828]/5 border border-[#C62828]/20 rounded-lg px-3 py-2 mb-4'
                  }
                >
                  {message.text}
                </div>
              ) : null}

              <div className="flex items-start justify-between gap-6">
                <div>
                  <p className="text-[#2C2C2C] font-medium">Personal Information</p>
                  <p className="text-xs text-[#6B6560] mt-1">Your details are stored securely.</p>
                </div>

                <div className="flex gap-2 flex-wrap justify-end">
                  {!isEditing ? (
                    <button
                      onClick={startEdit}
                      className="bg-[#6B1D1D] text-white px-5 py-2.5 rounded-lg text-sm font-semibold hover:bg-[#4A1212] transition-colors"
                    >
                      Edit Profile
                    </button>
                  ) : (
                    <>
                      <button
                        onClick={cancelEdit}
                        className="bg-white border border-gray-200 text-[#6B1D1D] px-5 py-2.5 rounded-lg text-sm font-semibold hover:bg-[#F7F2E8] transition-colors"
                        disabled={saving}
                      >
                        Cancel
                      </button>
                      <button
                        onClick={onSave}
                        disabled={saving}
                        className="bg-[#6B1D1D] text-white px-5 py-2.5 rounded-lg text-sm font-semibold hover:bg-[#4A1212] transition-colors disabled:opacity-60"
                      >
                        {saving ? 'Saving...' : 'Save'}
                      </button>
                    </>
                  )}
                </div>
              </div>

              <div className="mt-6 grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="sm:col-span-2">
                  <label className="block text-xs font-medium text-[#2C2C2C] mb-2">Email</label>
                  <input
                    value={email}
                    disabled
                    className="w-full px-4 py-2.5 rounded-lg border border-gray-200 bg-[#F7F2E8] outline-none text-sm"
                  />
                </div>

                <div className="sm:col-span-1">
                  <Field label="Full Name" value={form.full_name} placeholder="Enter your full name" name="full_name" />
                </div>

                <div className="sm:col-span-1">
                  <Field label="Phone Number" value={form.phone} placeholder="Enter your phone" name="phone" />
                </div>

                <div className="sm:col-span-1">
                  <Field label="Gender" value={form.gender} placeholder="Select gender" name="gender" />
                </div>
              </div>

              <div className="mt-6 border-t border-gray-100 pt-6">
                <div className="flex flex-col sm:flex-row gap-3 sm:items-center sm:justify-between">
                  <p className="text-sm text-[#6B6560]">Need help? Contact support (placeholder).</p>

                  <button
                    onClick={async () => {
                      setMessage(null);
                      await logout();
                      navigate('home');
                    }}
                    className="bg-[#6B1D1D] text-white px-6 py-2.5 rounded-lg text-sm font-semibold hover:bg-[#4A1212] transition-colors"
                    disabled={saving}
                  >
                    Logout
                  </button>
                </div>
              </div>
            </div>
          </div>

          <div>
            <div className="bg-white border border-gray-100 rounded-xl shadow-sm p-6">
              <p className="text-[#2C2C2C] font-medium">More</p>
              <p className="text-xs text-[#6B6560] mt-1">Coming soon:</p>

                <div className="mt-5 space-y-3">
                <button
                  type="button"
                  onClick={() => navigate('addresses')}
                  className="w-full text-left flex items-center gap-3 p-4 rounded-xl bg-[#F7F2E8] hover:bg-[#EDE0C8] transition-colors"
                  data-testid="address-book-button"
                >
                  <MapPin className="text-[#6B1D1D]" size={18} />
                  <div>
                    <p className="text-sm font-semibold text-[#2C2C2C]">Address Book</p>
                    <p className="text-xs text-[#6B6560]">Save and manage addresses</p>
                  </div>
                </button>

                <div className="flex items-center gap-3 p-4 rounded-xl bg-[#F7F2E8]">
                  <ShoppingBag className="text-[#6B1D1D]" size={18} />
                  <div>
                    <p className="text-sm font-semibold text-[#2C2C2C]">My Orders</p>
                    <p className="text-xs text-[#6B6560]">Track your order history</p>
                  </div>
                </div>

                <div className="flex items-center gap-3 p-4 rounded-xl bg-[#F7F2E8]">
                  <Heart className="text-[#6B1D1D]" size={18} />
                  <div>
                    <p className="text-sm font-semibold text-[#2C2C2C]">Wishlist</p>
                    <p className="text-xs text-[#6B6560]">Your saved favorites</p>
                  </div>
                </div>

                <div className="flex items-center gap-3 p-4 rounded-xl bg-[#F7F2E8]">
                  <Package className="text-[#6B1D1D]" size={18} />
                  <div>
                    <p className="text-sm font-semibold text-[#2C2C2C]">Saved Cards</p>
                    <p className="text-xs text-[#6B6560]">Future payment management</p>
                  </div>
                </div>
              </div>

              <div className="mt-5 text-xs text-[#6B6560]">
                Tip: You can edit your details using the “Edit Profile” button.
              </div>
            </div>

            <div className="mt-4 text-xs text-[#6B6560]">
              Backend endpoint used: <span className="font-mono">Supabase profiles</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

