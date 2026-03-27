import { Link } from 'react-router-dom';
import styles from './Footer.module.css';

export default function Footer() {
  return (
    <footer className={styles.footer} role="contentinfo">
      <div className={styles.inner}>
        <div className={styles.brand}>
          <Link to="/" className={styles.logo} aria-label="Veggio Home">
            <span aria-hidden="true">🌿</span>
            <span>veggio</span>
          </Link>
          <p>Fresh vegetables, delivered to your door. From local farms to your kitchen.</p>
        </div>

        <nav className={styles.links} aria-label="Footer navigation">
          <div className={styles.col}>
            <h3>Shop</h3>
            <Link to="/shop">All Vegetables</Link>
            <Link to="/shop?category=leafy">Leafy Greens</Link>
            <Link to="/shop?category=root">Root Vegetables</Link>
            <Link to="/shop?category=fresh">Fresh Picks</Link>
          </div>
          <div className={styles.col}>
            <h3>Account</h3>
            <Link to="/orders">My Orders</Link>
            <Link to="/profile">Profile</Link>
          </div>
          <div className={styles.col}>
            <h3>Support</h3>
            <Link to="/faq">FAQ</Link>
            <a href="mailto:hello@veggio.io">Contact Us</a>
          </div>
        </nav>
      </div>

      <div className={styles.bottom}>
        <p>© {new Date().getFullYear()} Veggio. All rights reserved.</p>
        <div className={styles.legal}>
          <Link to="/privacy">Privacy Policy</Link>
          <Link to="/terms">Terms of Service</Link>
        </div>
      </div>
    </footer>
  );
}
