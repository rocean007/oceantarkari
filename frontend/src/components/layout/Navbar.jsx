import { useState, useEffect, useRef } from 'react';
import { NavLink, Link, useLocation } from 'react-router-dom';
import { useCart } from '../../context/CartContext';
import { useAuth } from '../../context/AuthContext';
import styles from './Navbar.module.css';

// Inline SVG icons (no emoji, accessible)
const CartIcon = () => (
  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d="M6 2L3 6v14a2 2 0 002 2h14a2 2 0 002-2V6l-3-4z"/>
    <line x1="3" y1="6" x2="21" y2="6"/>
    <path d="M16 10a4 4 0 01-8 0"/>
  </svg>
);

const UserIcon = () => (
  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2"/>
    <circle cx="12" cy="7" r="4"/>
  </svg>
);

const MenuIcon = ({ open }) => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" aria-hidden="true">
    {open
      ? <><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></>
      : <><line x1="3" y1="6" x2="21" y2="6"/><line x1="3" y1="12" x2="21" y2="12"/><line x1="3" y1="18" x2="21" y2="18"/></>
    }
  </svg>
);

export default function Navbar() {
  const [scrolled, setScrolled]   = useState(false);
  const [menuOpen, setMenuOpen]   = useState(false);
  const [cartAnimate, setCartAni] = useState(false);
  const { itemCount }             = useCart();
  const { isAuthenticated, user, logout } = useAuth();
  const prevCount = useRef(itemCount);
  const location = useLocation();

  // Scroll detection for glass effect
  useEffect(() => {
    const handler = () => setScrolled(window.scrollY > 20);
    window.addEventListener('scroll', handler, { passive: true });
    return () => window.removeEventListener('scroll', handler);
  }, []);

  // Animate cart badge on count change
  useEffect(() => {
    if (itemCount > prevCount.current) {
      setCartAni(true);
      setTimeout(() => setCartAni(false), 400);
    }
    prevCount.current = itemCount;
  }, [itemCount]);

  // Close mobile menu on route change
  useEffect(() => { setMenuOpen(false); }, [location]);

  const openAuth = () => window.dispatchEvent(new CustomEvent('vg:open-auth'));
  const openCart = () => window.dispatchEvent(new CustomEvent('vg:open-cart'));

  return (
    <>
      {/* Skip navigation — accessibility */}
      <a href="#main-content" className={styles.skipLink}>Skip to content</a>

      <header className={`${styles.navbar} ${scrolled ? styles.scrolled : ''}`} role="banner">
        <div className={styles.inner}>
          {/* Logo */}
          <Link to="/" className={styles.logo} aria-label="Veggio — Home">
            <span className={styles.logoLeaf} aria-hidden="true">🌿</span>
            <span className={styles.logoText}>veggio</span>
          </Link>

          {/* Desktop nav */}
          <nav className={styles.desktopNav} aria-label="Primary navigation">
            <NavLink to="/"     className={({ isActive }) => isActive ? styles.navLinkActive : styles.navLink}>Home</NavLink>
            <NavLink to="/shop" className={({ isActive }) => isActive ? styles.navLinkActive : styles.navLink}>Shop</NavLink>
          </nav>

          {/* Actions */}
          <div className={styles.actions}>
            {/* Cart */}
            <button
              className={`${styles.iconBtn} ${cartAnimate ? styles.cartPop : ''}`}
              onClick={openCart}
              aria-label={`Cart, ${itemCount} item${itemCount !== 1 ? 's' : ''}`}
            >
              <CartIcon />
              {itemCount > 0 && (
                <span className={styles.badge} aria-hidden="true">{itemCount > 99 ? '99+' : itemCount}</span>
              )}
            </button>

            {/* User */}
            {isAuthenticated ? (
              <div className={styles.userMenu}>
                <button className={styles.avatarBtn} aria-label="Account menu">
                  <span className={styles.avatar}>{user?.name?.[0]?.toUpperCase() || 'U'}</span>
                </button>
                <div className={styles.dropdown}>
                  <Link to="/orders">My Orders</Link>
                  <Link to="/profile">Profile</Link>
                  {user?.role === 'Admin' && <Link to="/admin">Admin Panel</Link>}
                  <button onClick={logout}>Sign Out</button>
                </div>
              </div>
            ) : (
              <button className={styles.signInBtn} onClick={openAuth}>
                <UserIcon />
                <span>Sign In</span>
              </button>
            )}

            {/* Hamburger */}
            <button
              className={styles.menuToggle}
              onClick={() => setMenuOpen(o => !o)}
              aria-label={menuOpen ? 'Close menu' : 'Open menu'}
              aria-expanded={menuOpen}
              aria-controls="mobile-nav"
            >
              <MenuIcon open={menuOpen} />
            </button>
          </div>
        </div>

        {/* Mobile nav */}
        <nav
          id="mobile-nav"
          className={`${styles.mobileNav} ${menuOpen ? styles.mobileOpen : ''}`}
          aria-label="Mobile navigation"
          aria-hidden={!menuOpen}
        >
          <NavLink to="/"     className={styles.mobileLink}>Home</NavLink>
          <NavLink to="/shop" className={styles.mobileLink}>Shop</NavLink>
          {isAuthenticated && (
            <>
              <NavLink to="/orders"  className={styles.mobileLink}>My Orders</NavLink>
              <NavLink to="/profile" className={styles.mobileLink}>Profile</NavLink>
              {user?.role === 'Admin' && <NavLink to="/admin" className={styles.mobileLink}>Admin</NavLink>}
              <button className={styles.mobileLinkBtn} onClick={logout}>Sign Out</button>
            </>
          )}
          {!isAuthenticated && (
            <button className={styles.mobileLinkBtn} onClick={openAuth}>Sign In / Register</button>
          )}
        </nav>
      </header>
    </>
  );
}
