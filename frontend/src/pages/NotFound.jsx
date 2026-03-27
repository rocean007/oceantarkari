// NotFound.jsx
import { Link } from 'react-router-dom';
export default function NotFound() {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '80dvh', gap: 20, textAlign: 'center', padding: '2rem' }}>
      <span style={{ fontSize: '5rem', lineHeight: 1 }} aria-hidden="true">🥦</span>
      <h1 style={{ fontFamily: 'var(--font-display)', fontSize: 'clamp(2rem, 6vw, 3rem)', color: 'var(--text-primary)' }}>Page Not Found</h1>
      <p style={{ fontSize: '1.1rem', color: 'var(--text-muted)', maxWidth: 400 }}>Looks like this vegetable has been picked already. Let's find you something fresh.</p>
      <Link to="/" style={{ padding: '14px 32px', background: 'var(--color-forest)', color: '#fff', borderRadius: 32, fontWeight: 600, textDecoration: 'none', fontSize: '1rem' }}>Back to Home</Link>
    </div>
  );
}
