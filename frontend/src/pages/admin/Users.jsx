import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { adminApi } from '../../lib/api';

export default function AdminUsers() {
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);

  const { data, isLoading } = useQuery({
    queryKey: ['admin-users', search, page],
    queryFn: () => adminApi.users({ search: search || undefined, page, pageSize: 20 }).then(r => r.data),
    keepPreviousData: true,
  });

  return (
    <div>
      <div style={{ marginBottom: '1.5rem' }}>
        <h1 style={{ fontFamily: 'var(--font-display)', fontSize: '1.75rem', color: 'var(--text-primary)', marginBottom: 4 }}>Users</h1>
        <p style={{ fontSize: '0.875rem', color: 'var(--text-muted)' }}>{data?.total ?? 0} registered users</p>
      </div>

      <div style={{ position: 'relative', marginBottom: '1.25rem', maxWidth: 380 }}>
        <span style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)', pointerEvents: 'none' }} aria-hidden="true">🔍</span>
        <input type="search" placeholder="Search by name or email…" value={search} onChange={e => { setSearch(e.target.value); setPage(1); }}
          style={{ width: '100%', height: 44, paddingLeft: 40, paddingRight: 14, borderRadius: 10, border: '1.5px solid var(--border-medium)', fontFamily: 'var(--font-body)', fontSize: '0.9rem', background: 'var(--bg-primary)', color: 'var(--text-primary)', outline: 'none' }} />
      </div>

      <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border-light)', borderRadius: 20, overflow: 'hidden' }}>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.875rem' }} aria-label="Users list">
            <thead style={{ background: 'var(--bg-secondary)' }}>
              <tr>
                {['User', 'Email', 'Phone', 'Role', 'Orders', 'Joined'].map(h => (
                  <th key={h} style={{ padding: '12px 16px', textAlign: 'left', fontWeight: 700, color: 'var(--text-secondary)', whiteSpace: 'nowrap', fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {isLoading
                ? [...Array(5)].map((_, i) => (
                    <tr key={i} style={{ borderBottom: '1px solid var(--border-light)' }}>
                      {[...Array(6)].map((_, j) => <td key={j} style={{ padding: 16 }}><div style={{ height: 16, background: 'var(--bg-secondary)', borderRadius: 6, width: '70%' }} aria-hidden="true" /></td>)}
                    </tr>
                  ))
                : (data?.users || []).map(u => (
                    <tr key={u.id} style={{ borderBottom: '1px solid var(--border-light)' }}>
                      <td style={{ padding: '14px 16px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                          <div style={{ width: 36, height: 36, borderRadius: '50%', background: 'var(--color-mint)', color: 'var(--color-forest)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: '0.875rem', flexShrink: 0 }}>
                            {u.name?.[0]?.toUpperCase() || 'U'}
                          </div>
                          <span style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{u.name}</span>
                        </div>
                      </td>
                      <td style={{ padding: '14px 16px', color: 'var(--text-secondary)' }}>{u.email}</td>
                      <td style={{ padding: '14px 16px', color: 'var(--text-muted)' }}>{u.phone || '—'}</td>
                      <td style={{ padding: '14px 16px' }}>
                        <span style={{ padding: '3px 10px', borderRadius: 20, fontSize: '0.72rem', fontWeight: 700, background: u.role === 'Admin' ? 'rgba(26,60,42,0.1)' : 'var(--bg-secondary)', color: u.role === 'Admin' ? 'var(--color-forest)' : 'var(--text-muted)' }}>
                          {u.role}
                        </span>
                      </td>
                      <td style={{ padding: '14px 16px', color: 'var(--text-secondary)', fontVariantNumeric: 'tabular-nums' }}>{u.orderCount}</td>
                      <td style={{ padding: '14px 16px', color: 'var(--text-muted)', fontSize: '0.8rem', whiteSpace: 'nowrap' }}>{new Date(u.createdAt).toLocaleDateString()}</td>
                    </tr>
                  ))
              }
            </tbody>
          </table>
        </div>

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
