// Admin Orders page
import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { orderApi } from '../../lib/api';
import { useToast } from '../../context/ToastContext';

const STATUSES = ['Pending', 'Confirmed', 'Processing', 'Delivered', 'Cancelled'];
const STATUS_COLORS = {
  Pending:    { bg: '#fff3cd', text: '#856404' },
  Confirmed:  { bg: '#cce5ff', text: '#004085' },
  Processing: { bg: '#d4edda', text: '#155724' },
  Delivered:  { bg: '#d1ecf1', text: '#0c5460' },
  Cancelled:  { bg: '#f8d7da', text: '#721c24' },
};

export default function AdminOrders() {
  const [statusFilter, setStatusFilter] = useState('');
  const [page, setPage] = useState(1);
  const toast = useToast();
  const qc = useQueryClient();

  const { data, isLoading } = useQuery({
    queryKey: ['admin-orders', statusFilter, page],
    queryFn: () => orderApi.all({ status: statusFilter || undefined, page, pageSize: 20 }).then(r => r.data),
    keepPreviousData: true,
  });

  const statusMutation = useMutation({
    mutationFn: ({ id, status }) => orderApi.status(id, status),
    onSuccess: () => {
      qc.invalidateQueries(['admin-orders']);
      toast.success('Order status updated');
    },
    onError: () => toast.error('Failed to update status'),
  });

  return (
    <div>
      <div style={{ marginBottom: '1.5rem' }}>
        <h1 style={{ fontFamily: 'var(--font-display)', fontSize: '1.75rem', color: 'var(--text-primary)', marginBottom: 4 }}>Orders</h1>
        <p style={{ fontSize: '0.875rem', color: 'var(--text-muted)' }}>{data?.total ?? 0} total orders</p>
      </div>

      {/* Filter tabs */}
      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: '1.25rem' }} role="group" aria-label="Filter by status">
        {['', ...STATUSES].map(s => (
          <button key={s} onClick={() => { setStatusFilter(s); setPage(1); }}
            style={{ padding: '8px 16px', borderRadius: 32, border: '1.5px solid', borderColor: statusFilter === s ? 'var(--color-forest)' : 'var(--border-medium)', background: statusFilter === s ? 'var(--color-forest)' : 'transparent', color: statusFilter === s ? '#fff' : 'var(--text-secondary)', fontWeight: 600, fontSize: '0.8rem', cursor: 'pointer', minHeight: 40, transition: 'all 0.15s', fontFamily: 'var(--font-body)' }}
            aria-pressed={statusFilter === s}>
            {s || 'All'}
          </button>
        ))}
      </div>

      <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border-light)', borderRadius: 20, overflow: 'hidden' }}>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.875rem' }} aria-label="Orders list">
            <thead style={{ background: 'var(--bg-secondary)' }}>
              <tr>
                {['Order ID', 'Customer', 'Items', 'Total', 'Payment', 'Status', 'Date', 'Update Status'].map(h => (
                  <th key={h} style={{ padding: '12px 16px', textAlign: 'left', fontWeight: 700, color: 'var(--text-secondary)', whiteSpace: 'nowrap', fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {isLoading
                ? [...Array(5)].map((_, i) => (
                    <tr key={i} style={{ borderBottom: '1px solid var(--border-light)' }}>
                      {[...Array(8)].map((_, j) => <td key={j} style={{ padding: 16 }}><div style={{ height: 16, background: 'var(--bg-secondary)', borderRadius: 6, width: '70%' }} aria-hidden="true" /></td>)}
                    </tr>
                  ))
                : (data?.orders || []).map(o => {
                    const sc = STATUS_COLORS[o.status] || STATUS_COLORS.Pending;
                    return (
                      <tr key={o.id} style={{ borderBottom: '1px solid var(--border-light)' }}>
                        <td style={{ padding: '14px 16px', fontFamily: 'var(--font-mono)', fontSize: '0.75rem', color: 'var(--text-muted)' }}>#{o.id.slice(0, 8).toUpperCase()}</td>
                        <td style={{ padding: '14px 16px', fontWeight: 600, color: 'var(--text-primary)', whiteSpace: 'nowrap' }}>{o.customerName}</td>
                        <td style={{ padding: '14px 16px', color: 'var(--text-secondary)' }}>{o.itemCount} item{o.itemCount !== 1 ? 's' : ''}</td>
                        <td style={{ padding: '14px 16px', fontWeight: 700, color: 'var(--text-primary)', fontVariantNumeric: 'tabular-nums' }}>Rs. {o.total.toLocaleString()}</td>
                        <td style={{ padding: '14px 16px', color: 'var(--text-muted)', textTransform: 'capitalize' }}>{o.paymentMethod}</td>
                        <td style={{ padding: '14px 16px' }}>
                          <span style={{ padding: '4px 12px', borderRadius: 20, fontSize: '0.72rem', fontWeight: 700, background: sc.bg, color: sc.text, whiteSpace: 'nowrap' }}>{o.status}</span>
                        </td>
                        <td style={{ padding: '14px 16px', color: 'var(--text-muted)', whiteSpace: 'nowrap', fontSize: '0.8rem' }}>{new Date(o.createdAt).toLocaleDateString()}</td>
                        <td style={{ padding: '14px 16px' }}>
                          <select
                            value={o.status}
                            onChange={e => statusMutation.mutate({ id: o.id, status: e.target.value })}
                            aria-label={`Update status for order ${o.id.slice(0, 8)}`}
                            style={{ padding: '6px 10px', borderRadius: 8, border: '1.5px solid var(--border-medium)', background: 'var(--bg-primary)', color: 'var(--text-primary)', fontSize: '0.8rem', cursor: 'pointer', fontFamily: 'var(--font-body)', minHeight: 36 }}>
                            {STATUSES.map(s => <option key={s} value={s}>{s}</option>)}
                          </select>
                        </td>
                      </tr>
                    );
                  })
              }
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {data?.totalPages > 1 && (
          <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: 8, padding: '1rem', borderTop: '1px solid var(--border-light)' }}>
            <button disabled={page <= 1} onClick={() => setPage(p => p - 1)} style={{ padding: '8px 16px', borderRadius: 10, border: '1.5px solid var(--border-medium)', background: 'none', cursor: page <= 1 ? 'not-allowed' : 'pointer', opacity: page <= 1 ? 0.4 : 1, fontFamily: 'var(--font-body)', fontSize: '0.875rem', color: 'var(--text-primary)' }}>← Prev</button>
            <span style={{ fontSize: '0.875rem', color: 'var(--text-muted)' }}>Page {page} of {data.totalPages}</span>
            <button disabled={page >= data.totalPages} onClick={() => setPage(p => p + 1)} style={{ padding: '8px 16px', borderRadius: 10, border: '1.5px solid var(--border-medium)', background: 'none', cursor: page >= data.totalPages ? 'not-allowed' : 'pointer', opacity: page >= data.totalPages ? 0.4 : 1, fontFamily: 'var(--font-body)', fontSize: '0.875rem', color: 'var(--text-primary)' }}>Next →</button>
          </div>
        )}
      </div>
    </div>
  );
}
