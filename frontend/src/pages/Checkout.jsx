// Checkout.jsx
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { orderApi } from '../lib/api';

export default function Checkout() {
  const { items, total, clearCart } = useCart();
  const { user } = useAuth();
  const toast = useToast();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    address: user?.address || '',
    phone:   user?.phone  || '',
    notes:   '',
    payment: 'cod',
  });
  const [errors, setErrors] = useState({});

  const validate = () => {
    const e = {};
    if (!form.address.trim()) e.address = 'Delivery address is required';
    if (!form.phone.match(/^\+?[0-9]{7,15}$/)) e.phone = 'Enter a valid phone number';
    setErrors(e);
    return !Object.keys(e).length;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) return;
    setLoading(true);
    try {
      const order = await orderApi.place({
        items: items.map(i => ({ vegetableId: i.id, quantity: i.quantity })),
        deliveryAddress: form.address,
        phone: form.phone,
        notes: form.notes,
        paymentMethod: form.payment,
      });
      clearCart();
      toast.success('Order placed successfully!');
      navigate(`/orders`);
    } catch (err) {
      toast.error(err?.response?.data?.message || 'Failed to place order');
    } finally {
      setLoading(false);
    }
  };

  if (!items.length) {
    navigate('/shop');
    return null;
  }

  return (
    <div style={{ maxWidth: 720, margin: '0 auto', padding: '2rem 1rem 4rem' }}>
      <h1 style={{ fontFamily: 'var(--font-display)', fontSize: 'clamp(1.875rem, 4vw, 2.5rem)', marginBottom: '2rem', color: 'var(--text-primary)' }}>Checkout</h1>
      <form onSubmit={handleSubmit} noValidate style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
        {/* Address */}
        <div>
          <label style={{ display: 'block', fontWeight: 600, marginBottom: 6, fontSize: '0.875rem', color: 'var(--text-secondary)' }}>
            Delivery Address <span style={{ color: 'var(--color-amber)' }}>*</span>
          </label>
          <textarea
            value={form.address} onChange={e => setForm(f => ({...f, address: e.target.value}))}
            rows={3} placeholder="Enter your full delivery address…"
            aria-invalid={!!errors.address}
            style={{ width: '100%', padding: '12px 16px', borderRadius: 12, border: `1.5px solid ${errors.address ? 'var(--color-red-soft)' : 'var(--border-medium)'}`, fontFamily: 'var(--font-body)', fontSize: '1rem', resize: 'vertical', minHeight: 80, background: 'var(--bg-primary)', color: 'var(--text-primary)', outline: 'none' }}
          />
          {errors.address && <span style={{ fontSize: '0.75rem', color: 'var(--color-red-soft)' }} role="alert">{errors.address}</span>}
        </div>

        {/* Phone */}
        <div>
          <label style={{ display: 'block', fontWeight: 600, marginBottom: 6, fontSize: '0.875rem', color: 'var(--text-secondary)' }}>
            Phone Number <span style={{ color: 'var(--color-amber)' }}>*</span>
          </label>
          <input
            type="tel" inputMode="tel" autoComplete="tel"
            value={form.phone} onChange={e => setForm(f => ({...f, phone: e.target.value}))}
            placeholder="+977 98XXXXXXXX"
            aria-invalid={!!errors.phone}
            style={{ width: '100%', height: 48, padding: '0 16px', borderRadius: 12, border: `1.5px solid ${errors.phone ? 'var(--color-red-soft)' : 'var(--border-medium)'}`, fontFamily: 'var(--font-body)', fontSize: '1rem', background: 'var(--bg-primary)', color: 'var(--text-primary)', outline: 'none' }}
          />
          {errors.phone && <span style={{ fontSize: '0.75rem', color: 'var(--color-red-soft)' }} role="alert">{errors.phone}</span>}
        </div>

        {/* Notes */}
        <div>
          <label style={{ display: 'block', fontWeight: 600, marginBottom: 6, fontSize: '0.875rem', color: 'var(--text-secondary)' }}>Delivery Notes (optional)</label>
          <textarea value={form.notes} onChange={e => setForm(f => ({...f, notes: e.target.value}))} rows={2} placeholder="e.g. Leave at door, call on arrival…" style={{ width: '100%', padding: '12px 16px', borderRadius: 12, border: '1.5px solid var(--border-medium)', fontFamily: 'var(--font-body)', fontSize: '1rem', resize: 'vertical', background: 'var(--bg-primary)', color: 'var(--text-primary)', outline: 'none' }} />
        </div>

        {/* Payment */}
        <div>
          <span style={{ display: 'block', fontWeight: 600, marginBottom: 10, fontSize: '0.875rem', color: 'var(--text-secondary)' }}>Payment Method</span>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {[['cod', '💵 Cash on Delivery'], ['esewa', '🟢 eSewa'], ['khalti', '🔵 Khalti']].map(([v, l]) => (
              <label key={v} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '14px 16px', background: form.payment === v ? 'rgba(74,124,89,0.08)' : 'var(--bg-card)', border: `1.5px solid ${form.payment === v ? 'var(--color-sage)' : 'var(--border-light)'}`, borderRadius: 12, cursor: 'pointer', transition: 'all 0.15s' }}>
                <input type="radio" name="payment" value={v} checked={form.payment === v} onChange={() => setForm(f => ({...f, payment: v}))} style={{ accentColor: 'var(--color-forest)', width: 18, height: 18 }} />
                <span style={{ fontSize: '0.9rem', fontWeight: 500 }}>{l}</span>
              </label>
            ))}
          </div>
        </div>

        {/* Order summary */}
        <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border-light)', borderRadius: 20, padding: '1.5rem' }}>
          <h2 style={{ fontFamily: 'var(--font-display)', fontSize: '1.1rem', marginBottom: '1rem', color: 'var(--text-primary)' }}>Order Summary</h2>
          {items.map(i => (
            <div key={i.id} style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.875rem', color: 'var(--text-secondary)', marginBottom: 8 }}>
              <span>{i.name} × {i.quantity}</span>
              <span>Rs. {(i.price * i.quantity).toLocaleString()}</span>
            </div>
          ))}
          <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 700, fontSize: '1rem', color: 'var(--text-primary)', borderTop: '1px solid var(--border-light)', paddingTop: '1rem', marginTop: '0.5rem' }}>
            <span>Total</span>
            <span>Rs. {(total >= 500 ? total : total + 50).toLocaleString()}</span>
          </div>
          {total < 500 && <p style={{ fontSize: '0.75rem', color: 'var(--color-amber)', marginTop: 4 }}>+ Rs. 50 delivery fee</p>}
        </div>

        <button type="submit" disabled={loading} style={{ height: 56, background: 'var(--color-forest)', color: '#fff', border: 'none', borderRadius: 16, fontSize: '1.05rem', fontWeight: 700, cursor: loading ? 'not-allowed' : 'pointer', opacity: loading ? 0.7 : 1, fontFamily: 'var(--font-body)', transition: 'background 0.15s' }}>
          {loading ? 'Placing Order…' : 'Place Order'}
        </button>
      </form>
    </div>
  );
}
