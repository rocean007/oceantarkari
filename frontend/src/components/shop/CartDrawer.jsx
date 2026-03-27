import { useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { useState } from 'react';
import { useCart } from '../../context/CartContext';
import { useAuth } from '../../context/AuthContext';
import styles from './CartDrawer.module.css';

const CloseIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" aria-hidden="true">
    <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
  </svg>
);
const TrashIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14H6L5 6"/><path d="M10 11v6"/><path d="M14 11v6"/><path d="M9 6V4h6v2"/>
  </svg>
);
const MinusIcon = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" aria-hidden="true"><line x1="5" y1="12" x2="19" y2="12"/></svg>
);
const PlusIcon = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" aria-hidden="true">
    <line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>
  </svg>
);

export default function CartDrawer() {
  const [open, setOpen] = useState(false);
  const { items, total, updateQty, removeItem, itemCount } = useCart();
  const { isAuthenticated } = useAuth();
  const drawerRef = useRef(null);
  const firstFocusRef = useRef(null);

  useEffect(() => {
    const openHandler  = () => setOpen(true);
    window.addEventListener('vg:open-cart', openHandler);
    return () => window.removeEventListener('vg:open-cart', openHandler);
  }, []);

  useEffect(() => {
    if (open) {
      document.body.style.overflow = 'hidden';
      setTimeout(() => firstFocusRef.current?.focus(), 80);
    } else {
      document.body.style.overflow = '';
    }
    return () => { document.body.style.overflow = ''; };
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const handler = (e) => { if (e.key === 'Escape') setOpen(false); };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [open]);

  const handleCheckout = () => {
    setOpen(false);
    if (!isAuthenticated) {
      window.dispatchEvent(new CustomEvent('vg:open-auth'));
    }
  };

  return (
    <>
      {/* Backdrop */}
      <div
        className={`${styles.backdrop} ${open ? styles.backdropOpen : ''}`}
        onClick={() => setOpen(false)}
        aria-hidden="true"
      />

      {/* Drawer */}
      <div
        role="dialog"
        aria-label="Shopping cart"
        aria-modal="true"
        className={`${styles.drawer} ${open ? styles.drawerOpen : ''}`}
        ref={drawerRef}
      >
        {/* Header */}
        <div className={styles.header}>
          <div>
            <h2 className={styles.title}>Your Cart</h2>
            <p className={styles.count}>{itemCount} item{itemCount !== 1 ? 's' : ''}</p>
          </div>
          <button
            ref={firstFocusRef}
            className={styles.closeBtn}
            onClick={() => setOpen(false)}
            aria-label="Close cart"
          >
            <CloseIcon />
          </button>
        </div>

        {/* Items */}
        <div className={styles.items} role="list">
          {items.length === 0 ? (
            <div className={styles.empty}>
              <span className={styles.emptyEmoji} aria-hidden="true">🛒</span>
              <p>Your cart is empty</p>
              <button
                className={styles.shopBtn}
                onClick={() => setOpen(false)}
              >
                Browse vegetables
              </button>
            </div>
          ) : (
            items.map(item => (
              <div key={item.id} className={styles.item} role="listitem">
                <div className={styles.itemImg}>
                  {item.imageUrl
                    ? <img src={item.imageUrl} alt={item.name} width={56} height={56} />
                    : <span aria-hidden="true" className={styles.itemEmoji}>🌿</span>
                  }
                </div>

                <div className={styles.itemInfo}>
                  <span className={styles.itemName}>{item.name}</span>
                  <span className={styles.itemPrice}>Rs. {(item.price * item.quantity).toLocaleString()}</span>
                </div>

                <div className={styles.itemControls}>
                  <div className={styles.qtyRow}>
                    <button
                      className={styles.qtyBtn}
                      onClick={() => updateQty(item.id, item.quantity - 1)}
                      aria-label={`Decrease ${item.name} quantity`}
                    >
                      <MinusIcon />
                    </button>
                    <span className={styles.qty} aria-label={`Quantity: ${item.quantity}`}>{item.quantity}</span>
                    <button
                      className={styles.qtyBtn}
                      onClick={() => updateQty(item.id, item.quantity + 1)}
                      aria-label={`Increase ${item.name} quantity`}
                    >
                      <PlusIcon />
                    </button>
                  </div>
                  <button
                    className={styles.removeBtn}
                    onClick={() => removeItem(item.id)}
                    aria-label={`Remove ${item.name} from cart`}
                  >
                    <TrashIcon />
                  </button>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Footer */}
        {items.length > 0 && (
          <div className={styles.footer}>
            <div className={styles.totalRow}>
              <span>Subtotal</span>
              <span className={styles.totalAmount}>Rs. {total.toLocaleString()}</span>
            </div>
            <p className={styles.taxNote}>Delivery & taxes calculated at checkout</p>

            {isAuthenticated ? (
              <Link to="/checkout" className={styles.checkoutBtn} onClick={() => setOpen(false)}>
                Proceed to Checkout
              </Link>
            ) : (
              <button className={styles.checkoutBtn} onClick={handleCheckout}>
                Sign in to Checkout
              </button>
            )}

            <Link to="/cart" className={styles.viewCartLink} onClick={() => setOpen(false)}>
              View full cart
            </Link>
          </div>
        )}
      </div>
    </>
  );
}
