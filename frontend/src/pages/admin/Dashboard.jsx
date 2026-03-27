import { useQuery } from '@tanstack/react-query';
import { adminApi } from '../../lib/api';

export default function AdminDashboard() {
  const { data: stats, isLoading } = useQuery({
    queryKey: ['admin-stats'],
    queryFn: () => adminApi.stats().then(r => r.data),
    refetchInterval: 30000,
  });

  const cards = [
    { label: 'Total Orders',    value: stats?.totalOrders,    icon: '📦', color: '#cce5ff', delta: stats?.ordersDelta },
    { label: 'Revenue Today',   value: `Rs. ${stats?.revenueToday?.toLocaleString() ?? 0}`, icon: '💰', color: '#d4edda', delta: stats?.revenueDelta },
    { label: 'Active Users',    value: stats?.activeUsers,    icon: '👥', color: '#fff3cd' },
    { label: 'Low Stock Items', value: stats?.lowStockCount,  icon: '⚠️', color: '#f8d7da' },
  ];

  const statStyle = (color) => ({
    background: 'var(--bg-card)',
    border: '1px solid var(--border-light)',
    borderRadius: 20,
    padding: '1.5rem',
    borderTop: `4px solid ${color}`,
  });

  return (
    <div>
      <div style={{ marginBottom: '2rem' }}>
        <h1 style={{ fontFamily: 'var(--font-display)', fontSize: 'clamp(1.5rem, 3vw, 2rem)', color: 'var(--text-primary)', marginBottom: 4 }}>Dashboard</h1>
        <p style={{ fontSize: '0.875rem', color: 'var(--text-muted)' }}>Welcome back. Here's what's happening today.</p>
      </div>

      {/* Stats grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '1rem', marginBottom: '2rem' }}>
        {cards.map((c, i) => (
          <div key={i} style={statStyle(c.color)} role="region" aria-label={c.label}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.75rem' }}>
              <span style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>{c.label}</span>
              <span style={{ fontSize: '1.5rem', lineHeight: 1 }} aria-hidden="true">{c.icon}</span>
            </div>
            <div style={{ fontSize: isLoading ? '1rem' : '1.75rem', fontWeight: 800, color: 'var(--text-primary)', fontVariantNumeric: 'tabular-nums' }}>
              {isLoading ? <span style={{ display: 'block', height: 28, background: 'var(--bg-secondary)', borderRadius: 8, width: '60%', animation: 'shimmer 1.5s infinite' }} aria-hidden="true" /> : c.value ?? '—'}
            </div>
            {c.delta !== undefined && (
              <p style={{ fontSize: '0.75rem', color: c.delta >= 0 ? 'var(--color-sage)' : 'var(--color-red-soft)', fontWeight: 500, marginTop: 4 }}>
                {c.delta >= 0 ? '↑' : '↓'} {Math.abs(c.delta)}% vs yesterday
              </p>
            )}
          </div>
        ))}
      </div>

      {/* Recent orders */}
      <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border-light)', borderRadius: 24, padding: '1.5rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
          <h2 style={{ fontFamily: 'var(--font-display)', fontSize: '1.1rem', color: 'var(--text-primary)' }}>Recent Orders</h2>
          <a href="/admin/orders" style={{ fontSize: '0.8rem', color: 'var(--color-sage)', textDecoration: 'none', fontWeight: 600 }}>View all →</a>
        </div>

        {isLoading ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {[...Array(4)].map((_, i) => <div key={i} style={{ height: 52, background: 'var(--bg-secondary)', borderRadius: 12 }} aria-hidden="true" />)}
          </div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.875rem' }} aria-label="Recent orders">
              <thead>
                <tr style={{ borderBottom: '1px solid var(--border-light)' }}>
                  {['Order ID', 'Customer', 'Amount', 'Status', 'Date'].map(h => (
                    <th key={h} style={{ padding: '10px 12px', textAlign: 'left', fontWeight: 600, color: 'var(--text-muted)', whiteSpace: 'nowrap' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {stats?.recentOrders?.map(o => (
                  <tr key={o.id} style={{ borderBottom: '1px solid var(--border-light)' }}>
                    <td style={{ padding: '12px', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)', fontSize: '0.75rem' }}>#{o.id.slice(0, 8).toUpperCase()}</td>
                    <td style={{ padding: '12px', color: 'var(--text-primary)', fontWeight: 500 }}>{o.customerName}</td>
                    <td style={{ padding: '12px', color: 'var(--text-primary)', fontVariantNumeric: 'tabular-nums' }}>Rs. {o.total.toLocaleString()}</td>
                    <td style={{ padding: '12px' }}>
                      <span style={{ padding: '3px 10px', borderRadius: 20, fontSize: '0.72rem', fontWeight: 600, background: o.status === 'Delivered' ? '#d4edda' : o.status === 'Cancelled' ? '#f8d7da' : '#fff3cd', color: o.status === 'Delivered' ? '#155724' : o.status === 'Cancelled' ? '#721c24' : '#856404' }}>
                        {o.status}
                      </span>
                    </td>
                    <td style={{ padding: '12px', color: 'var(--text-muted)', whiteSpace: 'nowrap' }}>{new Date(o.createdAt).toLocaleDateString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
