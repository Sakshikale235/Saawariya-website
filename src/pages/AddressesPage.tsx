import { useEffect, useMemo, useState } from 'react';
import { Edit2, Trash2, Plus, MapPin, Loader2 } from 'lucide-react';
import { useNavigate } from "react-router-dom";
import { useApp } from '../context/AppContext';
import { useSupabaseAuth } from '../context/SupabaseAuthContext';
import { supabase } from '../supabaseClient';

type AddressType = 'Home' | 'Work' | 'Other' | string;

type Address = {
  id: string;
  user_id: string;
  full_name: string;
  phone: string | null;
  address_line1: string;
  address_line2: string | null;
  landmark: string | null;
  city: string;
  state: string;
  postal_code: string;
  country: string;
  address_type: AddressType;
  is_default: boolean;
  created_at?: string | null;
  updated_at?: string | null;
};

function isValidPhone(phone: string) {
  const digits = phone.replace(/\D/g, '');
  return digits.length === 10;
}

function isValidPostal(postal: string) {
  const digits = postal.replace(/\D/g, '');
  return digits.length === 6;
}

type FormState = {
  full_name: string;
  phone: string;
  address_line1: string;
  address_line2: string;
  landmark: string;
  city: string;
  state: string;
  postal_code: string;
  country: string;
  address_type: AddressType;
  is_default: boolean;
};

type ValidationErrors = Partial<Record<keyof FormState, string>>;

const emptyForm: FormState = {
  full_name: '',
  phone: '',
  address_line1: '',
  address_line2: '',
  landmark: '',
  city: '',
  state: '',
  postal_code: '',
  country: '',
  address_type: 'Home',
  is_default: false,
};

export function AddressesPage() {

  const navigate = useNavigate();
  const { session, loading: authLoading } = useSupabaseAuth();

  const [addresses, setAddresses] = useState<Address[]>([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const [modalOpen, setModalOpen] = useState(false);
  const [editingAddress, setEditingAddress] = useState<Address | null>(null);

  const [form, setForm] = useState<FormState>(emptyForm);
  const [errors, setErrors] = useState<ValidationErrors>({});
  const [saving, setSaving] = useState(false);

  const uid = session?.user?.id ?? '';

  const sortedAddresses = useMemo(() => {
    return [...addresses].sort((a, b) => {
      if (a.is_default === b.is_default) return 0;
      return a.is_default ? -1 : 1;
    });
  }, [addresses]);

  const load = async () => {
    if (!uid) return;

    setLoading(true);
    setMessage(null);
    try {
      const { data, error } = await supabase
        .from('addresses')
        .select('*')
        .eq('user_id', uid)
        .order('is_default', { ascending: false })
        .order('created_at', { ascending: false });

      if (error) throw error;
      setAddresses((data ?? []) as Address[]);
    } catch (e) {
      setMessage({ type: 'error', text: (e as Error).message || 'Failed to load addresses.' });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (authLoading) return;
    if (!session) {
      // Keep behavior consistent with other pages: if no session, route to home.
      navigate('/');
      return;
    }
    void load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [session, authLoading, uid]);

  const openAdd = () => {
    setEditingAddress(null);
    setErrors({});
    setMessage(null);
    setForm({
      ...emptyForm,
      is_default: addresses.length === 0,
    });
    setModalOpen(true);
  };

  const openEdit = (addr: Address) => {
    setEditingAddress(addr);
    setErrors({});
    setMessage(null);
    setForm({
      full_name: addr.full_name ?? '',
      phone: addr.phone ?? '',
      address_line1: addr.address_line1 ?? '',
      address_line2: addr.address_line2 ?? '',
      landmark: addr.landmark ?? '',
      city: addr.city ?? '',
      state: addr.state ?? '',
      postal_code: addr.postal_code ?? '',
      country: addr.country ?? '',
      address_type: addr.address_type ?? 'Home',
      is_default: addr.is_default ?? false,
    });
    setModalOpen(true);
  };

  const closeModal = () => {
    if (saving) return;
    setModalOpen(false);
  };

  const validate = () => {
    const next: ValidationErrors = {};

    if (!form.full_name.trim()) next.full_name = 'Full name is required.';
    if (!form.phone.trim()) next.phone = 'Phone number is required.';
    else if (!isValidPhone(form.phone)) next.phone = 'Phone must be 10 digits.';

    if (!form.address_line1.trim()) next.address_line1 = 'Address line 1 is required.';

    if (!form.city.trim()) next.city = 'City is required.';
    if (!form.state.trim()) next.state = 'State is required.';

    if (!form.postal_code.trim()) next.postal_code = 'Postal code is required.';
    else if (!isValidPostal(form.postal_code)) next.postal_code = 'Postal code must be 6 digits.';

    if (!form.country.trim()) next.country = 'Country is required.';

    setErrors(next);
    return Object.keys(next).length === 0;
  };

  const save = async () => {
    if (!uid) return;
    if (!validate()) return;

    setSaving(true);
    setMessage(null);

    const now = new Date().toISOString();

    try {
      if (editingAddress) {
        // Update existing address.
        if (form.is_default) {
          const { error: resetErr } = await supabase
            .from('addresses')
            .update({ is_default: false, updated_at: now })
            .eq('user_id', uid);

          if (resetErr) throw resetErr;
        }

        const payload = {
          full_name: form.full_name.trim(),
          phone: form.phone.trim(),
          address_line1: form.address_line1.trim(),
          address_line2: form.address_line2.trim() || null,
          landmark: form.landmark.trim() || null,
          city: form.city.trim(),
          state: form.state.trim(),
          postal_code: form.postal_code.trim(),
          country: form.country.trim(),
          address_type: form.address_type,
          is_default: form.is_default,
          updated_at: now,
        };

        const { error: upErr } = await supabase
          .from('addresses')
          .update(payload)
          .eq('id', editingAddress.id);

        if (upErr) throw upErr;

      } else {
        // Insert new address.
        // Ensure default uniqueness.
        if (form.is_default) {
          const { error: resetErr } = await supabase
            .from('addresses')
            .update({ is_default: false, updated_at: now })
            .eq('user_id', uid);

          if (resetErr) throw resetErr;
        }

        const payload = {
          user_id: uid,
          full_name: form.full_name.trim(),
          phone: form.phone.trim(),
          address_line1: form.address_line1.trim(),
          address_line2: form.address_line2.trim() || null,
          landmark: form.landmark.trim() || null,
          city: form.city.trim(),
          state: form.state.trim(),
          postal_code: form.postal_code.trim(),
          country: form.country.trim(),
          address_type: form.address_type,
          is_default: form.is_default,
          created_at: now,
          updated_at: now,
        };

        const { error: insErr } = await supabase.from('addresses').insert(payload);
        if (insErr) throw insErr;
      }

      await load();
      setMessage({ type: 'success', text: 'Address saved successfully.' });
      setModalOpen(false);
      setEditingAddress(null);
    } catch (e) {
      setMessage({ type: 'error', text: (e as Error).message || 'Save failed.' });
    } finally {
      setSaving(false);
    }
  };

  const deleteAddress = async (addr: Address) => {
    if (!uid) return;
    const ok = window.confirm('Are you sure you want to delete this address?');
    if (!ok) return;

    setSaving(true);
    setMessage(null);

    try {
      const { error } = await supabase.from('addresses').delete().eq('id', addr.id);
      if (error) throw error;

      await load();
      setMessage({ type: 'success', text: 'Address deleted successfully.' });
    } catch (e) {
      setMessage({ type: 'error', text: (e as Error).message || 'Delete failed.' });
    } finally {
      setSaving(false);
    }
  };

  const makeDefault = async (addr: Address) => {
    if (!uid) return;
    setSaving(true);
    setMessage(null);

    const now = new Date().toISOString();

    try {
      const { error: resetErr } = await supabase
        .from('addresses')
        .update({ is_default: false, updated_at: now })
        .eq('user_id', uid);
      if (resetErr) throw resetErr;

      const { error: updErr } = await supabase
        .from('addresses')
        .update({ is_default: true, updated_at: now })
        .eq('id', addr.id);

      if (updErr) throw updErr;

      await load();
      setMessage({ type: 'success', text: 'Default address updated.' });
    } catch (e) {
      setMessage({ type: 'error', text: (e as Error).message || 'Failed to set default.' });
    } finally {
      setSaving(false);
    }
  };

  if (authLoading || loading) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center px-4">
        <div className="w-full max-w-2xl">
          {message ? (
            <div
              className={
                message.type === 'success'
                  ? 'text-sm text-[#2C6B2C] bg-[#2C6B2C]/5 border border-[#2C6B2C]/20 rounded-lg px-3 py-2 mb-6'
                  : 'text-sm text-[#C62828] bg-[#C62828]/5 border border-[#C62828]/20 rounded-lg px-3 py-2 mb-6'
              }
            >
              {message.text}
            </div>
          ) : null}

          <div className="flex items-center justify-center">
            <Loader2 className="animate-spin text-[#6B1D1D]" size={28} />
          </div>
        </div>
      </div>
    );
  }


  if (!session) {
    return null;
  }

  return (
    <div className="min-h-screen bg-white">
      <div className="bg-[#F7F2E8] py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <h1 className="text-3xl font-bold text-[#2C2C2C]" style={{ fontFamily: "'Playfair Display', serif" }}>
            Address Book
          </h1>
          <p className="text-[#6B6560] text-sm mt-2">Manage your saved delivery addresses.</p>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-10">
        {message ? (
          <div
            className={
              message.type === 'success'
                ? 'text-sm text-[#2C6B2C] bg-[#2C6B2C]/5 border border-[#2C6B2C]/20 rounded-lg px-3 py-2 mb-6'
                : 'text-sm text-[#C62828] bg-[#C62828]/5 border border-[#C62828]/20 rounded-lg px-3 py-2 mb-6'
            }
          >
            {message.text}
          </div>
        ) : null}

        {addresses.length === 0 ? (
          <div className="min-h-[220px] flex flex-col items-center justify-center text-center">
            <div className="w-16 h-16 rounded-full bg-[#F7F2E8] flex items-center justify-center mb-4">
              <MapPin className="text-[#6B1D1D]" size={30} />
            </div>
            <h2 className="text-xl font-bold text-[#2C2C2C] mb-2">No addresses added yet</h2>
            <p className="text-sm text-[#6B6560] mb-6">Add your first address to make checkout faster.</p>
            <button
              onClick={openAdd}
              className="bg-[#6B1D1D] text-white px-8 py-3 rounded-lg text-sm font-semibold hover:bg-[#4A1212] transition-colors"
            >
              Add Address
            </button>
          </div>
        ) : (
          <div className="space-y-5">
            <div className="flex items-center justify-between">
              <button
                onClick={openAdd}
                className="inline-flex items-center gap-2 text-[#6B1D1D] text-sm font-semibold hover:underline"
              >
                <Plus size={16} /> Add Address
              </button>
            </div>

            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {sortedAddresses.map((addr) => (
                <div key={addr.id} className="bg-white rounded-xl border border-gray-100 shadow-sm p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="text-sm font-semibold text-[#2C2C2C]">{addr.full_name}</p>
                      <p className="text-xs text-[#6B6560] mt-1">{addr.address_type ?? 'Home'}</p>
                    </div>
                    {addr.is_default ? (
                      <span className="text-[11px] font-bold bg-[#6B1D1D] text-white px-2 py-1 rounded-full">Default</span>
                    ) : null}
                  </div>

                  <p className="text-sm text-[#2C2C2C] mt-3">
                    {addr.address_line1}
                    {addr.address_line2 ? `, ${addr.address_line2}` : ''}
                  </p>
                  <p className="text-sm text-[#2C2C2C]">
                    {addr.city}, {addr.state} {addr.postal_code}
                  </p>
                  <p className="text-sm text-[#2C2C2C]">{addr.country}</p>

                  <p className="text-xs text-[#6B6560] mt-2">Phone: {addr.phone ?? '—'}</p>

                  <div className="flex flex-wrap gap-2 mt-4">
                    <button
                      onClick={() => makeDefault(addr)}
                      className={
                        addr.is_default
                          ? 'px-3 py-1.5 rounded-lg text-xs bg-[#F7F2E8] text-[#6B1D1D] font-semibold'
                          : 'px-3 py-1.5 rounded-lg text-xs bg-[#6B1D1D] text-white font-semibold hover:bg-[#4A1212]'
                      }
                      disabled={saving}
                      type="button"
                    >
                      {addr.is_default ? 'Default' : 'Make Default'}
                    </button>

                    <button
                      onClick={() => openEdit(addr)}
                      className="px-3 py-1.5 rounded-lg text-xs bg-white border border-gray-200 text-[#6B1D1D] font-semibold hover:bg-[#F7F2E8]"
                      disabled={saving}
                      type="button"
                    >
                      <span className="inline-flex items-center gap-1">
                        <Edit2 size={14} /> Edit
                      </span>
                    </button>

                    <button
                      onClick={() => deleteAddress(addr)}
                      className="px-3 py-1.5 rounded-lg text-xs bg-white border border-gray-200 text-[#C62828] font-semibold hover:bg-[#FFF0F0]"
                      disabled={saving}
                      type="button"
                    >
                      <span className="inline-flex items-center gap-1">
                        <Trash2 size={14} /> Delete
                      </span>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {modalOpen ? (
        <div className="fixed inset-0 z-[60] bg-black/40 flex items-center justify-center p-3">
          <div className="w-full max-w-2xl bg-white rounded-2xl shadow-xl border border-gray-100 p-5">
            <div className="flex items-start justify-between gap-4 mb-4">
              <div>
                <h2 className="text-lg font-bold text-[#2C2C2C]">
                  {editingAddress ? 'Edit Address' : 'Add Address'}
                </h2>
                <p className="text-xs text-[#6B6560] mt-1">Provide your delivery address details.</p>
              </div>
              <button
                onClick={closeModal}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                disabled={saving}
                type="button"
              >
                ✕
              </button>
            </div>

            <div className="grid sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-medium text-[#2C2C2C] mb-2">Full Name</label>
                <input
                  value={form.full_name}
                  onChange={(e) => setForm((f) => ({ ...f, full_name: e.target.value }))}
                  className="w-full px-4 py-2.5 rounded-lg border border-gray-200 bg-white outline-none text-sm"
                  disabled={saving}
                />
                {errors.full_name ? <p className="mt-1 text-xs text-[#C62828]">{errors.full_name}</p> : null}
              </div>

              <div>
                <label className="block text-xs font-medium text-[#2C2C2C] mb-2">Phone</label>
                <input
                  value={form.phone}
                  onChange={(e) => setForm((f) => ({ ...f, phone: e.target.value }))}
                  className="w-full px-4 py-2.5 rounded-lg border border-gray-200 bg-white outline-none text-sm"
                  placeholder="10 digits"
                  disabled={saving}
                />
                {errors.phone ? <p className="mt-1 text-xs text-[#C62828]">{errors.phone}</p> : null}
              </div>

              <div className="sm:col-span-2">
                <label className="block text-xs font-medium text-[#2C2C2C] mb-2">Address Line 1</label>
                <input
                  value={form.address_line1}
                  onChange={(e) => setForm((f) => ({ ...f, address_line1: e.target.value }))}
                  className="w-full px-4 py-2.5 rounded-lg border border-gray-200 bg-white outline-none text-sm"
                  disabled={saving}
                />
                {errors.address_line1 ? (
                  <p className="mt-1 text-xs text-[#C62828]">{errors.address_line1}</p>
                ) : null}
              </div>

              <div className="sm:col-span-2">
                <label className="block text-xs font-medium text-[#2C2C2C] mb-2">Address Line 2</label>
                <input
                  value={form.address_line2}
                  onChange={(e) => setForm((f) => ({ ...f, address_line2: e.target.value }))}
                  className="w-full px-4 py-2.5 rounded-lg border border-gray-200 bg-white outline-none text-sm"
                  disabled={saving}
                />
              </div>

              <div className="sm:col-span-2">
                <label className="block text-xs font-medium text-[#2C2C2C] mb-2">Landmark</label>
                <input
                  value={form.landmark}
                  onChange={(e) => setForm((f) => ({ ...f, landmark: e.target.value }))}
                  className="w-full px-4 py-2.5 rounded-lg border border-gray-200 bg-white outline-none text-sm"
                  disabled={saving}
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-[#2C2C2C] mb-2">City</label>
                <input
                  value={form.city}
                  onChange={(e) => setForm((f) => ({ ...f, city: e.target.value }))}
                  className="w-full px-4 py-2.5 rounded-lg border border-gray-200 bg-white outline-none text-sm"
                  disabled={saving}
                />
                {errors.city ? <p className="mt-1 text-xs text-[#C62828]">{errors.city}</p> : null}
              </div>

              <div>
                <label className="block text-xs font-medium text-[#2C2C2C] mb-2">State</label>
                <input
                  value={form.state}
                  onChange={(e) => setForm((f) => ({ ...f, state: e.target.value }))}
                  className="w-full px-4 py-2.5 rounded-lg border border-gray-200 bg-white outline-none text-sm"
                  disabled={saving}
                />
                {errors.state ? <p className="mt-1 text-xs text-[#C62828]">{errors.state}</p> : null}
              </div>

              <div>
                <label className="block text-xs font-medium text-[#2C2C2C] mb-2">Postal Code</label>
                <input
                  value={form.postal_code}
                  onChange={(e) => setForm((f) => ({ ...f, postal_code: e.target.value }))}
                  className="w-full px-4 py-2.5 rounded-lg border border-gray-200 bg-white outline-none text-sm"
                  placeholder="6 digits"
                  disabled={saving}
                />
                {errors.postal_code ? (
                  <p className="mt-1 text-xs text-[#C62828]">{errors.postal_code}</p>
                ) : null}
              </div>

              <div>
                <label className="block text-xs font-medium text-[#2C2C2C] mb-2">Country</label>
                <input
                  value={form.country}
                  onChange={(e) => setForm((f) => ({ ...f, country: e.target.value }))}
                  className="w-full px-4 py-2.5 rounded-lg border border-gray-200 bg-white outline-none text-sm"
                  disabled={saving}
                />
                {errors.country ? <p className="mt-1 text-xs text-[#C62828]">{errors.country}</p> : null}
              </div>

              <div className="sm:col-span-2">
                <label className="block text-xs font-medium text-[#2C2C2C] mb-2">Address Type</label>
                <div className="flex gap-2 flex-wrap">
                  {(['Home', 'Work', 'Other'] as AddressType[]).map((t) => (
                    <button
                      key={t}
                      type="button"
                      onClick={() => setForm((f) => ({ ...f, address_type: t }))}
                      className={
                        form.address_type === t
                          ? 'px-4 py-2 rounded-lg text-xs font-semibold bg-[#6B1D1D] text-white'
                          : 'px-4 py-2 rounded-lg text-xs font-semibold bg-[#F7F2E8] text-[#2C2C2C] hover:bg-[#EDE0C8]'
                      }
                      disabled={saving}
                    >
                      {t}
                    </button>
                  ))}
                </div>
              </div>

              <div className="sm:col-span-2 flex items-center gap-3">
                <input
                  id="isDefault"
                  type="checkbox"
                  checked={form.is_default}
                  onChange={(e) => setForm((f) => ({ ...f, is_default: e.target.checked }))}
                  className="h-4 w-4"
                  disabled={saving}
                />
                <label htmlFor="isDefault" className="text-sm font-medium text-[#2C2C2C]">
                  Make this my default address
                </label>
              </div>
            </div>

            <div className="mt-5 flex items-center justify-end gap-3">
              <button
                type="button"
                onClick={closeModal}
                disabled={saving}
                className="bg-white border border-gray-200 text-[#6B1D1D] px-5 py-2.5 rounded-lg text-sm font-semibold hover:bg-[#F7F2E8] transition-colors"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => void save()}
                disabled={saving}
                className="bg-[#6B1D1D] text-white px-5 py-2.5 rounded-lg text-sm font-semibold hover:bg-[#4A1212] transition-colors disabled:opacity-60"
              >
                {saving ? 'Saving...' : editingAddress ? 'Update' : 'Save'}
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}

