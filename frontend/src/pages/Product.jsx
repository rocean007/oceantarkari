import { useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { vegetableApi } from '../lib/api';
import { useCart } from '../context/CartContext';
import { useToast } from '../context/ToastContext';
import { ProductSkeleton } from '../components/skeleton/PageSkeleton';
import VeggieCard from '../components/shop/VeggieCard';

const MinusIcon = () => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" aria-hidden="true"><line x1="5" y1="12" x2="19" y2="12"/></svg>;
const PlusIcon  = () => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" aria-hidden="true"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>;

export default function Product() {
  const { id } = useParams();
  const [qty, setQty] = useState(1);
  const { addItem } = useCart();
  const toast = useToast();

  const { data: veg, isLoading, isError } = useQuery({
    queryKey: ['vegetable', id],
    queryFn: () => vegetableApi.get(id).then(r => r.data),
  });

  const { data: related } = useQuery({
    queryKey: ['vegetables', 'related', veg?.category],
    queryFn:  () => vegetableApi.list({ category: veg?.category, limit: 4 }).then(r => r.data.filter(v => v.id !== id)),
    enabled: !!veg?.category,
  });

  if (isLoading) return <div style={{ maxWidth: 1200, margin: '0 auto', padding: '2rem 1rem' }}><ProductSkeleton /></div>;
  if (isError)   return <div style={{ textAlign: 'center', padding: '4rem' }}><p>Failed to load product. <Link to="/shop">Back to shop</Link></p></div>;
  if (!veg)      return null;

  const handleAdd = () => {
    addItem({ ...veg, quantity: qty });
    toast.success(`${qty}× ${veg.name} added to cart`);
    window.dispatchEvent(new CustomEvent('vg:open-cart'));
  };

  const s = (css) => css;

  return (
    <div style={{ maxWidth: 1200, margin: '0 auto', padding: '2rem 1rem 4rem' }}>
      {/* Breadcrumb */}
      <nav aria-label="Breadcrumb" style={{ display: 'flex', gap: 8, alignItems: 'center', fontSize: '0.875rem', color: 'var(--text-muted)', marginBottom: '1.5rem', flexWrap: 'wrap' }}>
        <Link to="/" style={{ color: 'var(--text-muted)', textDecoration: 'none' }}>Home</Link>
        <span aria-hidden="true">/</span>
        <Link to="/shop" style={{ color: 'var(--text-muted)', textDecoration: 'none' }}>Shop</Link>
        <span aria-hidden="true">/</span>
        <span style={{ color: 'var(--text-primary)', fontWeight: 500 }}>{veg.name}</span>
      </nav>

      {/* Main grid */}
      <div className="product-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 340px), 1fr))', gap: '3rem', alignItems: 'start' }}>
        {/* Image */}
        <div style={{ borderRadius: 28, overflow: 'hidden', background: 'linear-gradient(135deg, var(--bg-secondary), var(--color-mint))', aspectRatio: '1', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          {veg.imageUrl
            ? <img src={veg.imageUrl} alt={veg.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
            : <span style={{ fontSize: '8rem', lineHeight: 1, filter: 'drop-shadow(0 8px 20px rgba(0,0,0,0.12))' }} aria-hidden="true">🌿</span>
          }
        </div>

        {/* Info */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          <div>
            <span style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--color-sage)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>{veg.category}</span>
            {veg.isOrganic && <span style={{ marginLeft: 8, fontSize: '0.75rem', background: 'var(--color-forest)', color: 'var(--color-mint)', padding: '2px 10px', borderRadius: 20, fontWeight: 600 }}>Organic</span>}
          </div>

          <h1 style={{ fontFamily: 'var(--font-display)', fontSize: 'clamp(1.75rem, 4vw, 2.5rem)', fontWeight: 700, color: 'var(--text-primary)', lineHeight: 1.2 }}>{veg.name}</h1>

          {veg.description && <p style={{ fontSize: '1rem', color: 'var(--text-secondary)', lineHeight: 1.8 }}>{veg.description}</p>}

          <div style={{ display: 'flex', alignItems: 'baseline', gap: 10 }}>
            <span style={{ fontSize: '2rem', fontWeight: 800, color: 'var(--text-primary)', fontVariantNumeric: 'tabular-nums' }}>Rs. {veg.price.toLocaleString()}</span>
            <span style={{ fontSize: '0.875rem', color: 'var(--text-muted)' }}>/ {veg.unit}</span>
            {veg.originalPrice > veg.price && <span style={{ fontSize: '1rem', color: 'var(--text-muted)', textDecoration: 'line-through' }}>Rs. {veg.originalPrice.toLocaleString()}</span>}
          </div>

          {veg.stock > 0
            ? <p style={{ fontSize: '0.875rem', color: veg.stock < 10 ? 'var(--color-amber)' : 'var(--color-sage)', fontWeight: 500 }}>{veg.stock < 10 ? `Only ${veg.stock} left!` : `In stock (${veg.stock} ${veg.unit})`}</p>
            : <p style={{ fontSize: '0.875rem', color: 'var(--color-red-soft)', fontWeight: 600 }}>Out of stock</p>
          }

          {/* Qty + Add to cart */}
          {veg.stock > 0 && (
            <div style={{ display: 'flex', gap: 12, alignItems: 'center', flexWrap: 'wrap' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, background: 'var(--bg-secondary)', borderRadius: 40, padding: 4 }}>
                <button onClick={() => setQty(q => Math.max(1, q - 1))} style={{ width: 40, height: 40, borderRadius: '50%', border: 'none', background: 'var(--bg-card)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-primary)', transition: 'background 0.15s' }} aria-label="Decrease quantity"><MinusIcon /></button>
                <span style={{ fontWeight: 700, minWidth: 32, textAlign: 'center', fontSize: '1.05rem' }} aria-label={`Quantity: ${qty}`}>{qty}</span>
                <button onClick={() => setQty(q => Math.min(veg.stock, q + 1))} style={{ width: 40, height: 40, borderRadius: '50%', border: 'none', background: 'var(--bg-card)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-primary)', transition: 'background 0.15s' }} aria-label="Increase quantity"><PlusIcon /></button>
              </div>
              <button onClick={handleAdd} style={{ flex: 1, minWidth: 160, height: 52, background: 'var(--color-forest)', color: '#fff', border: 'none', borderRadius: 32, fontSize: '1rem', fontWeight: 700, cursor: 'pointer', fontFamily: 'var(--font-body)', transition: 'background 0.15s' }}>
                Add to Cart — Rs. {(veg.price * qty).toLocaleString()}
              </button>
            </div>
          )}

          {/* Details */}
          {veg.nutritionInfo && (
            <div style={{ background: 'var(--bg-secondary)', borderRadius: 16, padding: '1.25rem' }}>
              <h3 style={{ fontFamily: 'var(--font-display)', fontSize: '1rem', marginBottom: '0.75rem', color: 'var(--text-primary)' }}>Nutrition Info</h3>
              <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', lineHeight: 1.7 }}>{veg.nutritionInfo}</p>
            </div>
          )}
        </div>
      </div>

      {/* Related */}
      {related?.length > 0 && (
        <section style={{ marginTop: '4rem' }} aria-labelledby="related-heading">
          <h2 id="related-heading" style={{ fontFamily: 'var(--font-display)', fontSize: '1.75rem', color: 'var(--text-primary)', marginBottom: '1.5rem' }}>More from {veg.category}</h2>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '1rem' }} role="list">
            {related.slice(0, 4).map(v => <div role="listitem" key={v.id}><VeggieCard veggie={v} /></div>)}
          </div>
        </section>
      )}
    </div>
  );
}
