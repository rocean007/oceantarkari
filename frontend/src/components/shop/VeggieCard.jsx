import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useCart } from '../../context/CartContext';
import { useToast } from '../../context/ToastContext';
import styles from './VeggieCard.module.css';

const CartPlusIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d="M6 2L3 6v14a2 2 0 002 2h14a2 2 0 002-2V6l-3-4z"/>
    <line x1="3" y1="6" x2="21" y2="6"/>
    <path d="M16 10a4 4 0 01-8 0"/>
    <line x1="12" y1="15" x2="12" y2="21"/>
    <line x1="9" y1="18" x2="15" y2="18"/>
  </svg>
);

const CheckIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <polyline points="20 6 9 17 4 12"/>
  </svg>
);

// Veggie emoji map for visual flair
const VEGGIE_EMOJI = {
  tomato: '🍅', carrot: '🥕', broccoli: '🥦', spinach: '🥬',
  cucumber: '🥒', onion: '🧅', potato: '🥔', pepper: '🫑',
  lettuce: '🥗', cabbage: '🥬', default: '🌿',
};

function getEmoji(name = '') {
  const lower = name.toLowerCase();
  return Object.entries(VEGGIE_EMOJI).find(([k]) => lower.includes(k))?.[1] || VEGGIE_EMOJI.default;
}

export default function VeggieCard({ veggie, variant = 'default' }) {
  const [added, setAdded] = useState(false);
  const [quantity, setQuantity] = useState(1);
  const { addItem, items } = useCart();
  const toast = useToast();
  const inCart = items.some(i => i.id === veggie.id);

  const handleAdd = (e) => {
    e.preventDefault(); // prevent nav when card is a link
    addItem({ ...veggie, quantity });
    setAdded(true);
    toast.success(`${veggie.name} added to cart`);
    setTimeout(() => setAdded(false), 2000);
  };

  const needsAuth = () => window.dispatchEvent(new CustomEvent('vg:open-auth'));

  return (
    <article
      className={`${styles.card} ${variant === 'featured' ? styles.featured : ''}`}
      aria-label={`${veggie.name}, Rs. ${veggie.price} per ${veggie.unit}`}
    >
      {/* Image / Emoji visual */}
      <Link to={`/shop/${veggie.id}`} className={styles.imageLink} tabIndex={-1} aria-hidden="true">
        <div className={styles.imageWrap}>
          {veggie.imageUrl ? (
            <img
              src={veggie.imageUrl}
              alt={veggie.name}
              className={styles.image}
              loading="lazy"
              width="280"
              height="280"
            />
          ) : (
            <div className={styles.emojiPlaceholder} aria-hidden="true">
              <span>{getEmoji(veggie.name)}</span>
            </div>
          )}
          {veggie.isOrganic && (
            <span className={styles.organicBadge} aria-label="Certified organic">Organic</span>
          )}
          {veggie.discount > 0 && (
            <span className={styles.discountBadge} aria-label={`${veggie.discount}% off`}>
              -{veggie.discount}%
            </span>
          )}
        </div>
      </Link>

      {/* Info */}
      <div className={styles.body}>
        <div className={styles.meta}>
          <span className={styles.category}>{veggie.category}</span>
          {veggie.stock < 10 && veggie.stock > 0 && (
            <span className={styles.lowStock}>Only {veggie.stock} left</span>
          )}
          {veggie.stock === 0 && (
            <span className={styles.outOfStock}>Out of stock</span>
          )}
        </div>

        <Link to={`/shop/${veggie.id}`} className={styles.nameLink}>
          <h3 className={styles.name}>{veggie.name}</h3>
        </Link>

        {variant === 'featured' && veggie.description && (
          <p className={styles.desc}>{veggie.description.slice(0, 80)}{veggie.description.length > 80 ? '…' : ''}</p>
        )}

        <div className={styles.footer}>
          <div className={styles.pricing}>
            <span className={styles.price}>
              Rs. {veggie.price.toLocaleString()}
            </span>
            <span className={styles.unit}>/ {veggie.unit}</span>
            {veggie.originalPrice && veggie.originalPrice > veggie.price && (
              <span className={styles.originalPrice}>Rs. {veggie.originalPrice.toLocaleString()}</span>
            )}
          </div>

          {veggie.stock > 0 ? (
            <button
              className={`${styles.addBtn} ${added ? styles.added : ''} ${inCart ? styles.inCart : ''}`}
              onClick={handleAdd}
              aria-label={added ? `${veggie.name} added` : `Add ${veggie.name} to cart`}
              aria-live="polite"
            >
              {added ? <CheckIcon /> : <CartPlusIcon />}
              <span>{added ? 'Added!' : inCart ? 'Add more' : 'Add'}</span>
            </button>
          ) : (
            <button className={styles.addBtn} disabled aria-label="Out of stock">
              <span>Sold out</span>
            </button>
          )}
        </div>
      </div>
    </article>
  );
}
