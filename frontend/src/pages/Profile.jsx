import { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import api from '../lib/api';

export default function Profile() {
  const { user, isAuthenticated } = useAuth();
  const toast = useToast();
  const [form, setForm] = useState({ name: user?.name || '', phone: user?.phone || '', address: user?.address || '' });
  const [loading, setLoading] = useState(false);

  if (!isAuthenticated) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '60dvh', gap: 20, textAlign: 'center', padding: '2rem' }}>
        <span style={{ fontSize: '3rem' }} aria-hidden="true">👤</span>
        <h2 style={{ fontFamily: 'var(--font-display)', fontSize: '1.5rem', color: 'var(--text-primary)' }}>Sign in to view profile</h2>
        <button onClick={() => window.dispatchEvent(new CustomEvent('vg:open-auth'))} style={{ padding: '14px 32px', background: 'var(--color-forest)', color: '#fff', border: 'none', borderRadius: 32, fontSize: '1rem', fontWeight: 600, cursor: 'pointer' }}>
          Sign In
        </button>
      </div>
    );
  }

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await api.put('/users/me', form);
      toast.success('Profile updated!');
    } catch {
      toast.error('Failed to update profile');
    } finally {
      setLoading(false);
    }
  };

  const inputStyle = { width: '100%', height: 48, padding: '0 16px', borderRadius: 12, border: '1.5px solid var(--border-medium)', fontFamily: 'var(--font-body)', fontSize: '1rem', background: 'var(--bg-primary)', color: 'var(--text-primary)', outline: 'none' };
  const labelStyle = { display: 'block', fontWeight: 600, marginBottom: 6, fontSize: '0.875rem', color: 'var(--text-secondary)' };

  return (
    <div style={{ maxWidth: 560, margin: '0 auto', padding: '2rem 1rem 4rem' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 20, marginBottom: '2rem' }}>
        <div style={{ width: 72, height: 72, borderRadius: '50%', background: 'var(--color-mint)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '2rem', fontWeight: 700, color: 'var(--color-forest)', border: '3px solid var(--color-sage)', flexShrink: 0 }}>
          {user?.name?.[0]?.toUpperCase() || 'U'}
        </div>
        <div>
          <h1 style={{ fontFamily: 'var(--font-display)', fontSize: '1.75rem', color: 'var(--text-primary)', marginBottom: 4 }}>{user?.name}</h1>
          <p style={{ fontSize: '0.875rem', color: 'var(--text-muted)' }}>{user?.email}</p>
        </div>
      </div>

      <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border-light)', borderRadius: 24, padding: '1.75rem' }}>
        <h2 style={{ fontFamily: 'var(--font-display)', fontSize: '1.25rem', color: 'var(--text-primary)', marginBottom: '1.5rem' }}>Edit Profile</h2>
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          <div><label style={labelStyle}>Full Name</label><input style={inputStyle} value={form.name} onChange={e => setForm(f => ({...f, name: e.target.value}))} autoComplete="name" /></div>
          <div><label style={labelStyle}>Phone</label><input style={inputStyle} type="tel" inputMode="tel" value={form.phone} onChange={e => setForm(f => ({...f, phone: e.target.value}))} autoComplete="tel" placeholder="+977 98XXXXXXXX" /></div>
          <div>
            <label style={labelStyle}>Default Delivery Address</label>
            <textarea value={form.address} onChange={e => setForm(f => ({...f, address: e.target.value}))} rows={3} placeholder="Enter your delivery address…" style={{ ...inputStyle, height: 'auto', padding: '12px 16px', resize: 'vertical' }} />
          </div>
          <button type="submit" disabled={loading} style={{ height: 52, background: 'var(--color-forest)', color: '#fff', border: 'none', borderRadius: 14, fontSize: '1rem', fontWeight: 600, cursor: loading ? 'not-allowed' : 'pointer', opacity: loading ? 0.7 : 1, fontFamily: 'var(--font-body)' }}>
            {loading ? 'Saving…' : 'Save Changes'}
          </button>
        </form>
      </div>
    </div>
  );
}
