import { useQuery } from '@tanstack/react-query';
import { orderApi } from '../lib/api';
import { OrderSkeleton } from '../components/skeleton/PageSkeleton';
import { useAuth } from '../context/AuthContext';
import { Link } from 'react-router-dom';

const STATUS_COLORS = {
  Pending:    { bg: '#fff3cd', text: '#856404' },
  Confirmed:  { bg: '#cce5ff', text: '#004085' },
  Processing: { bg: '#d4edda', text: '#155724' },
  Delivered:  { bg: '#d4edda', text: '#155724' },
  Cancelled:  { bg: '#f8d7da', text: '#721c24' },
};

export default function Orders() {
  const { isAuthenticated } = useAuth();
  const { data: orders, isLoading } = useQuery({
    queryKey: ['orders'],
    queryFn:  () => orderApi.list().then(r => r.data),
    enabled:  isAuthenticated,
  });

  if (!isAuthenticated) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '60dvh', gap: 20, textAlign: 'center', padding: '2rem' }}>
        <span style={{ fontSize: '3rem' }} aria-hidden="true">🔒</span>
        <h2 style={{ fontFamily: 'var(--font-display)', fontSize: '1.5rem', color: 'var(--text-primary)' }}>Sign in to view orders</h2>
        <button onClick={() => window.dispatchEvent(new CustomEvent('vg:open-auth'))} style={{ padding: '14px 32px', background: 'var(--color-forest)', color: '#fff', border: 'none', borderRadius: 32, fontSize: '1rem', fontWeight: 600, cursor: 'pointer' }}>
          Sign In
        </button>
      </div>
    );
  }

  return (
    <div style={{ maxWidth: 800, margin: '0 auto', padding: '2rem 1rem 4rem' }}>
      <h1 style={{ fontFamily: 'var(--font-display)', fontSize: 'clamp(1.875rem, 4vw, 2.5rem)', marginBottom: '2rem', color: 'var(--text-primary)' }}>My Orders</h1>

      {isLoading && <OrderSkeleton />}

      {!isLoading && (!orders || orders.length === 0) && (
        <div style={{ textAlign: 'center', padding: '4rem 2rem', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 16 }}>
          <span style={{ fontSize: '3.5rem' }} aria-hidden="true">📦</span>
          <h3 style={{ fontFamily: 'var(--font-display)', color: 'var(--text-primary)' }}>No orders yet</h3>
          <p style={{ color: 'var(--text-muted)' }}>Your orders will appear here once you place them.</p>
          <Link to="/shop" style={{ padding: '12px 28px', background: 'var(--color-forest)', color: '#fff', borderRadius: 32, fontWeight: 600, textDecoration: 'none' }}>Start Shopping</Link>
        </div>
      )}

      <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }} role="list">
        {orders?.map(order => {
          const sc = STATUS_COLORS[order.status] || STATUS_COLORS.Pending;
          return (
            <div key={order.id} style={{ background: 'var(--bg-card)', border: '1px solid var(--border-light)', borderRadius: 20, padding: '1.25rem 1.5rem' }} role="listitem">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 12 }}>
                <div>
                  <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: 4 }}>Order #{order.id.slice(0, 8).toUpperCase()}</p>
                  <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)' }}>{new Date(order.createdAt).toLocaleDateString('en-NP', { dateStyle: 'medium' })}</p>
                </div>
                <span style={{ padding: '4px 14px', borderRadius: 20, fontSize: '0.75rem', fontWeight: 600, background: sc.bg, color: sc.text }}>
                  {order.status}
                </span>
              </div>

              <div style={{ marginTop: 12, display: 'flex', flexDirection: 'column', gap: 8 }}>
                {order.items?.slice(0, 3).map(item => (
                  <div key={item.id} style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.875rem', color: 'var(--text-secondary)' }}>
                    <span>{item.vegetableName} × {item.quantity}</span>
                    <span>Rs. {(item.price * item.quantity).toLocaleString()}</span>
                  </div>
                ))}
                {order.items?.length > 3 && <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>+{order.items.length - 3} more items</p>}
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 12, paddingTop: 12, borderTop: '1px solid var(--border-light)' }}>
                <span style={{ fontWeight: 700, color: 'var(--text-primary)' }}>Rs. {order.total.toLocaleString()}</span>
                {order.status === 'Pending' && (
                  <button onClick={() => orderApi.cancel(order.id)} style={{ fontSize: '0.8rem', color: 'var(--color-red-soft)', background: 'none', border: 'none', cursor: 'pointer', textDecoration: 'underline' }}>
                    Cancel
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
