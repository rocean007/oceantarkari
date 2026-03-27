// ── Cart Page ──────────────────────────────────────────────
import { Link } from 'react-router-dom';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';
import styles from './Cart.module.css';

const MinusIcon = () => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" aria-hidden="true"><line x1="5" y1="12" x2="19" y2="12"/></svg>;
const PlusIcon  = () => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" aria-hidden="true"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>;
const TrashIcon = () => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14H6L5 6"/><path d="M10 11v6"/><path d="M14 11v6"/></svg>;

export default function Cart() {
  const { items, total, updateQty, removeItem } = useCart();
  const { isAuthenticated } = useAuth();

  if (items.length === 0) {
    return (
      <div className={styles.empty}>
        <span aria-hidden="true" className={styles.emptyIcon}>🛒</span>
        <h2>Your cart is empty</h2>
        <p>Add some fresh vegetables to get started.</p>
        <Link to="/shop" className={styles.shopBtn}>Browse Vegetables</Link>
      </div>
    );
  }

  return (
    <div className={styles.page}>
      <div className={styles.inner}>
        <h1 className={styles.title}>Your Cart</h1>

        <div className={styles.layout}>
          <div className={styles.items} role="list">
            {items.map(item => (
              <div key={item.id} className={styles.item} role="listitem">
                <div className={styles.itemImg}>
                  {item.imageUrl
                    ? <img src={item.imageUrl} alt={item.name} width={80} height={80} />
                    : <span className={styles.itemEmoji} aria-hidden="true">🌿</span>
                  }
                </div>
                <div className={styles.itemInfo}>
                  <h3 className={styles.itemName}>{item.name}</h3>
                  <p className={styles.itemUnit}>Per {item.unit}</p>
                  <div className={styles.qtyRow}>
                    <button className={styles.qtyBtn} onClick={() => updateQty(item.id, item.quantity - 1)} aria-label={`Decrease ${item.name}`}><MinusIcon /></button>
                    <span className={styles.qty} aria-label={`Quantity ${item.quantity}`}>{item.quantity}</span>
                    <button className={styles.qtyBtn} onClick={() => updateQty(item.id, item.quantity + 1)} aria-label={`Increase ${item.name}`}><PlusIcon /></button>
                  </div>
                </div>
                <div className={styles.itemRight}>
                  <span className={styles.itemTotal}>Rs. {(item.price * item.quantity).toLocaleString()}</span>
                  <button className={styles.removeBtn} onClick={() => removeItem(item.id)} aria-label={`Remove ${item.name}`}><TrashIcon /></button>
                </div>
              </div>
            ))}
          </div>

          <div className={styles.summary}>
            <h2 className={styles.summaryTitle}>Order Summary</h2>
            <div className={styles.summaryRows}>
              <div className={styles.summaryRow}><span>Subtotal</span><span>Rs. {total.toLocaleString()}</span></div>
              <div className={styles.summaryRow}><span>Delivery</span><span>{total >= 500 ? 'Free' : 'Rs. 50'}</span></div>
              <div className={`${styles.summaryRow} ${styles.summaryTotal}`}>
                <span>Total</span>
                <span>Rs. {(total >= 500 ? total : total + 50).toLocaleString()}</span>
              </div>
            </div>
            {total < 500 && <p className={styles.freeNote}>Add Rs. {500 - total} more for free delivery!</p>}
            {isAuthenticated
              ? <Link to="/checkout" className={styles.checkoutBtn}>Proceed to Checkout</Link>
              : <button className={styles.checkoutBtn} onClick={() => window.dispatchEvent(new CustomEvent('vg:open-auth'))}>Sign in to Checkout</button>
            }
            <Link to="/shop" className={styles.continueLink}>← Continue Shopping</Link>
          </div>
        </div>
      </div>
    </div>
  );
}
