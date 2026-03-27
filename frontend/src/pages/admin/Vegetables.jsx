import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { vegetableApi } from '../../lib/api';
import { useToast } from '../../context/ToastContext';

const EMPTY_FORM = { name: '', category: 'Leafy', price: '', unit: 'kg', stock: '', description: '', isOrganic: false, imageUrl: '', nutritionInfo: '' };

export default function AdminVegetables() {
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing]   = useState(null);
  const [form, setForm]         = useState(EMPTY_FORM);
  const [search, setSearch]     = useState('');
  const [deleteConfirm, setDeleteConfirm] = useState(null);
  const toast = useToast();
  const qc = useQueryClient();

  const { data: vegs, isLoading } = useQuery({
    queryKey: ['admin-vegetables'],
    queryFn: () => vegetableApi.list({ limit: 100 }).then(r => r.data),
  });

  const saveMutation = useMutation({
    mutationFn: editing
      ? (data) => vegetableApi.update(editing.id, data)
      : (data)  => vegetableApi.create(data),
    onSuccess: () => {
      qc.invalidateQueries(['admin-vegetables']);
      qc.invalidateQueries(['vegetables']);
      toast.success(editing ? 'Vegetable updated!' : 'Vegetable added!');
      setShowForm(false);
      setEditing(null);
      setForm(EMPTY_FORM);
    },
    onError: (err) => toast.error(err?.response?.data?.message || 'Save failed'),
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => vegetableApi.delete(id),
    onSuccess: () => {
      qc.invalidateQueries(['admin-vegetables']);
      qc.invalidateQueries(['vegetables']);
      toast.success('Vegetable removed');
      setDeleteConfirm(null);
    },
    onError: () => toast.error('Delete failed'),
  });

  const openEdit = (v) => { setForm({ ...v, price: v.price.toString(), stock: v.stock.toString() }); setEditing(v); setShowForm(true); };
  const openNew  = () => { setForm(EMPTY_FORM); setEditing(null); setShowForm(true); };

  const handleSubmit = (e) => {
    e.preventDefault();
    const payload = { ...form, price: parseFloat(form.price), stock: parseInt(form.stock, 10) };
    saveMutation.mutate(payload);
  };

  const filtered = (vegs || []).filter(v => v.name.toLowerCase().includes(search.toLowerCase()));

  const inputStyle = { width: '100%', height: 44, padding: '0 14px', borderRadius: 10, border: '1.5px solid var(--border-medium)', fontFamily: 'var(--font-body)', fontSize: '0.9rem', background: 'var(--bg-primary)', color: 'var(--text-primary)', outline: 'none' };
  const labelStyle = { display: 'block', fontWeight: 600, marginBottom: 5, fontSize: '0.8rem', color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.05em' };

  return (
    <div>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', flexWrap: 'wrap', gap: 12 }}>
        <div>
          <h1 style={{ fontFamily: 'var(--font-display)', fontSize: '1.75rem', color: 'var(--text-primary)', marginBottom: 2 }}>Vegetables</h1>
          <p style={{ fontSize: '0.875rem', color: 'var(--text-muted)' }}>{vegs?.length ?? 0} items total</p>
        </div>
        <button onClick={openNew} style={{ padding: '12px 24px', background: 'var(--color-forest)', color: '#fff', border: 'none', borderRadius: 32, fontWeight: 600, fontSize: '0.9rem', cursor: 'pointer', fontFamily: 'var(--font-body)', minHeight: 44 }}>
          + Add Vegetable
        </button>
      </div>

      {/* Search */}
      <div style={{ position: 'relative', marginBottom: '1.25rem', maxWidth: 380 }}>
        <span style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)', pointerEvents: 'none' }} aria-hidden="true">🔍</span>
        <input type="search" placeholder="Search vegetables…" value={search} onChange={e => setSearch(e.target.value)} style={{ ...inputStyle, paddingLeft: 40 }} />
      </div>

      {/* Table */}
      <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border-light)', borderRadius: 20, overflow: 'hidden' }}>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.875rem' }} aria-label="Vegetables list">
            <thead style={{ background: 'var(--bg-secondary)' }}>
              <tr>
                {['Name', 'Category', 'Price', 'Unit', 'Stock', 'Organic', 'Actions'].map(h => (
                  <th key={h} style={{ padding: '12px 16px', textAlign: 'left', fontWeight: 700, color: 'var(--text-secondary)', whiteSpace: 'nowrap', fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {isLoading
                ? [...Array(6)].map((_, i) => (
                    <tr key={i} style={{ borderBottom: '1px solid var(--border-light)' }}>
                      {[...Array(7)].map((_, j) => <td key={j} style={{ padding: 16 }}><div style={{ height: 16, background: 'var(--bg-secondary)', borderRadius: 6, width: j === 6 ? 80 : '70%' }} aria-hidden="true" /></td>)}
                    </tr>
                  ))
                : filtered.map(v => (
                    <tr key={v.id} style={{ borderBottom: '1px solid var(--border-light)', transition: 'background 0.12s' }} onMouseEnter={e => e.currentTarget.style.background = 'var(--bg-secondary)'} onMouseLeave={e => e.currentTarget.style.background = ''}>
                      <td style={{ padding: '14px 16px', fontWeight: 600, color: 'var(--text-primary)' }}>{v.name}</td>
                      <td style={{ padding: '14px 16px', color: 'var(--text-secondary)' }}>{v.category}</td>
                      <td style={{ padding: '14px 16px', fontVariantNumeric: 'tabular-nums' }}>Rs. {v.price.toLocaleString()}</td>
                      <td style={{ padding: '14px 16px', color: 'var(--text-muted)' }}>{v.unit}</td>
                      <td style={{ padding: '14px 16px' }}>
                        <span style={{ color: v.stock < 10 ? 'var(--color-amber)' : 'var(--color-sage)', fontWeight: 600 }}>{v.stock}</span>
                      </td>
                      <td style={{ padding: '14px 16px' }}>{v.isOrganic ? '✅' : '—'}</td>
                      <td style={{ padding: '14px 16px' }}>
                        <div style={{ display: 'flex', gap: 8 }}>
                          <button onClick={() => openEdit(v)} style={{ padding: '6px 14px', background: 'rgba(74,124,89,0.1)', color: 'var(--color-sage)', border: 'none', borderRadius: 8, cursor: 'pointer', fontWeight: 600, fontSize: '0.8rem', minHeight: 36 }}>Edit</button>
                          <button onClick={() => setDeleteConfirm(v)} style={{ padding: '6px 14px', background: 'rgba(217,92,74,0.1)', color: 'var(--color-red-soft)', border: 'none', borderRadius: 8, cursor: 'pointer', fontWeight: 600, fontSize: '0.8rem', minHeight: 36 }}>Delete</button>
                        </div>
                      </td>
                    </tr>
                  ))
              }
            </tbody>
          </table>
        </div>
      </div>

      {/* Add/Edit Modal */}
      {showForm && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(4px)', zIndex: 200, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem' }}
             onClick={(e) => { if (e.target === e.currentTarget) { setShowForm(false); setEditing(null); } }}>
          <div style={{ background: 'var(--bg-card)', borderRadius: 24, padding: '2rem', width: '100%', maxWidth: 560, maxHeight: '90dvh', overflowY: 'auto', boxShadow: 'var(--shadow-xl)' }}
               role="dialog" aria-modal="true" aria-label={editing ? 'Edit vegetable' : 'Add vegetable'}>
            <h2 style={{ fontFamily: 'var(--font-display)', fontSize: '1.5rem', color: 'var(--text-primary)', marginBottom: '1.5rem' }}>
              {editing ? `Edit: ${editing.name}` : 'Add New Vegetable'}
            </h2>

            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.1rem' }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div>
                  <label style={labelStyle}>Name *</label>
                  <input required value={form.name} onChange={e => setForm(f => ({...f, name: e.target.value}))} placeholder="e.g. Broccoli" style={inputStyle} />
                </div>
                <div>
                  <label style={labelStyle}>Category *</label>
                  <select value={form.category} onChange={e => setForm(f => ({...f, category: e.target.value}))} style={{ ...inputStyle }}>
                    {['Leafy', 'Root', 'Fresh', 'Herbs', 'Exotic', 'Organic'].map(c => <option key={c} value={c}>{c}</option>)}
                  </select>
                </div>
                <div>
                  <label style={labelStyle}>Price (Rs.) *</label>
                  <input required type="number" min="0" step="0.01" value={form.price} onChange={e => setForm(f => ({...f, price: e.target.value}))} placeholder="60" style={inputStyle} />
                </div>
                <div>
                  <label style={labelStyle}>Unit *</label>
                  <select value={form.unit} onChange={e => setForm(f => ({...f, unit: e.target.value}))} style={inputStyle}>
                    {['kg', 'g', 'bunch', 'piece', 'pack', 'dozen'].map(u => <option key={u} value={u}>{u}</option>)}
                  </select>
                </div>
                <div>
                  <label style={labelStyle}>Stock *</label>
                  <input required type="number" min="0" value={form.stock} onChange={e => setForm(f => ({...f, stock: e.target.value}))} placeholder="100" style={inputStyle} />
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12, paddingTop: 20 }}>
                  <input type="checkbox" id="organic-check" checked={form.isOrganic} onChange={e => setForm(f => ({...f, isOrganic: e.target.checked}))} style={{ width: 18, height: 18, accentColor: 'var(--color-forest)' }} />
                  <label htmlFor="organic-check" style={{ fontWeight: 600, fontSize: '0.875rem', color: 'var(--text-secondary)', cursor: 'pointer' }}>Certified Organic</label>
                </div>
              </div>

              <div>
                <label style={labelStyle}>Image URL</label>
                <input type="url" value={form.imageUrl} onChange={e => setForm(f => ({...f, imageUrl: e.target.value}))} placeholder="https://…" style={inputStyle} />
              </div>

              <div>
                <label style={labelStyle}>Description</label>
                <textarea value={form.description} onChange={e => setForm(f => ({...f, description: e.target.value}))} rows={3} placeholder="Describe this vegetable…" style={{ ...inputStyle, height: 'auto', padding: '10px 14px', resize: 'vertical' }} />
              </div>

              <div>
                <label style={labelStyle}>Nutrition Info</label>
                <textarea value={form.nutritionInfo} onChange={e => setForm(f => ({...f, nutritionInfo: e.target.value}))} rows={2} placeholder="Calories, vitamins, minerals…" style={{ ...inputStyle, height: 'auto', padding: '10px 14px', resize: 'vertical' }} />
              </div>

              <div style={{ display: 'flex', gap: 12, marginTop: 8 }}>
                <button type="submit" disabled={saveMutation.isLoading} style={{ flex: 1, height: 48, background: 'var(--color-forest)', color: '#fff', border: 'none', borderRadius: 12, fontWeight: 700, cursor: 'pointer', fontFamily: 'var(--font-body)', fontSize: '0.95rem', opacity: saveMutation.isLoading ? 0.7 : 1 }}>
                  {saveMutation.isLoading ? 'Saving…' : editing ? 'Save Changes' : 'Add Vegetable'}
                </button>
                <button type="button" onClick={() => { setShowForm(false); setEditing(null); }} style={{ height: 48, padding: '0 24px', border: '1.5px solid var(--border-medium)', borderRadius: 12, background: 'none', color: 'var(--text-secondary)', cursor: 'pointer', fontFamily: 'var(--font-body)', fontWeight: 600 }}>
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete confirm */}
      {deleteConfirm && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(4px)', zIndex: 201, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem' }}>
          <div style={{ background: 'var(--bg-card)', borderRadius: 20, padding: '2rem', maxWidth: 400, width: '100%', boxShadow: 'var(--shadow-xl)' }} role="alertdialog" aria-modal="true">
            <h3 style={{ fontFamily: 'var(--font-display)', fontSize: '1.2rem', color: 'var(--text-primary)', marginBottom: '0.75rem' }}>Delete "{deleteConfirm.name}"?</h3>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', marginBottom: '1.5rem' }}>This action cannot be undone. The vegetable will be removed from the store.</p>
            <div style={{ display: 'flex', gap: 12 }}>
              <button onClick={() => deleteMutation.mutate(deleteConfirm.id)} disabled={deleteMutation.isLoading} style={{ flex: 1, height: 44, background: 'var(--color-red-soft)', color: '#fff', border: 'none', borderRadius: 12, fontWeight: 700, cursor: 'pointer', fontFamily: 'var(--font-body)' }}>
                {deleteMutation.isLoading ? 'Deleting…' : 'Delete'}
              </button>
              <button onClick={() => setDeleteConfirm(null)} style={{ flex: 1, height: 44, border: '1.5px solid var(--border-medium)', borderRadius: 12, background: 'none', cursor: 'pointer', fontFamily: 'var(--font-body)', fontWeight: 600 }}>Cancel</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
