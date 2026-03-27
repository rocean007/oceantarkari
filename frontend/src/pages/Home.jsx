import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { vegetableApi } from '../lib/api';
import VeggieCard from '../components/shop/VeggieCard';
import { VeggieCardSkeleton } from '../components/skeleton/PageSkeleton';
import styles from './Home.module.css';

const CATEGORIES = [
  { slug: 'leafy',  label: 'Leafy Greens', emoji: '🥬', color: '#d4edda' },
  { slug: 'root',   label: 'Root Veggies', emoji: '🥕', color: '#fff3cd' },
  { slug: 'fresh',  label: 'Fresh Picks',  emoji: '🍅', color: '#f8d7da' },
  { slug: 'herbs',  label: 'Herbs',        emoji: '🌿', color: '#d4edda' },
  { slug: 'exotic', label: 'Exotic',       emoji: '🫑', color: '#cce5ff' },
  { slug: 'organic',label: 'Organic',      emoji: '✅', color: '#e2d9f3' },
];

export default function Home() {
  const { data: featured, isLoading } = useQuery({
    queryKey: ['vegetables', 'featured'],
    queryFn: () => vegetableApi.list({ featured: true, limit: 8 }).then(r => r.data),
  });

  return (
    <div className={styles.page}>
      {/* Hero */}
      <section className={styles.hero} aria-label="Hero banner">
        <div className={styles.heroContent}>
          <span className={styles.heroPill}>🌱 Farm-fresh, daily delivery</span>
          <h1 className={styles.heroTitle}>
            Fresh Vegetables,
            <span className={styles.heroAccent}> Right at Your Door</span>
          </h1>
          <p className={styles.heroSub}>
            Order seasonal, locally sourced vegetables every morning. 
            100% organic options available.
          </p>
          <div className={styles.heroCtas}>
            <Link to="/shop" className={styles.ctaPrimary}>
              Shop Now
              <span aria-hidden="true">→</span>
            </Link>
            <Link to="/shop?category=organic" className={styles.ctaSecondary}>
              Explore Organic
            </Link>
          </div>
          <div className={styles.heroStats} aria-label="Key statistics">
            <div className={styles.stat}><strong>50+</strong><span>Vegetables</span></div>
            <div className={styles.statDivider} aria-hidden="true" />
            <div className={styles.stat}><strong>100%</strong><span>Fresh daily</span></div>
            <div className={styles.statDivider} aria-hidden="true" />
            <div className={styles.stat}><strong>Free</strong><span>Delivery over Rs.500</span></div>
          </div>
        </div>
        <div className={styles.heroVisual} aria-hidden="true">
          <div className={styles.heroBubble}>
            <span className={styles.heroBubbleEmoji}>🥦</span>
          </div>
          <div className={`${styles.floatChip} ${styles.chip1}`}>🥕 Carrots — Rs. 60</div>
          <div className={`${styles.floatChip} ${styles.chip2}`}>🍅 Tomatoes — Rs. 80</div>
          <div className={`${styles.floatChip} ${styles.chip3}`}>🥬 Spinach — Rs. 40</div>
        </div>
      </section>

      {/* Bento categories */}
      <section className={styles.section} aria-labelledby="cat-heading">
        <h2 id="cat-heading" className={styles.sectionTitle}>Browse by Category</h2>
        <div className={styles.bentoGrid} role="list">
          {CATEGORIES.map(cat => (
            <Link
              to={`/shop?category=${cat.slug}`}
              key={cat.slug}
              className={styles.bentoCard}
              style={{ '--cat-bg': cat.color }}
              role="listitem"
              aria-label={`Browse ${cat.label}`}
            >
              <span className={styles.bentoEmoji}>{cat.emoji}</span>
              <span className={styles.bentoLabel}>{cat.label}</span>
            </Link>
          ))}
        </div>
      </section>

      {/* Featured vegetables */}
      <section className={styles.section} aria-labelledby="feat-heading">
        <div className={styles.sectionHeader}>
          <h2 id="feat-heading" className={styles.sectionTitle}>Today's Fresh Picks</h2>
          <Link to="/shop" className={styles.viewAll}>View all →</Link>
        </div>

        <div className={styles.veggieGrid} role="list">
          {isLoading
            ? Array.from({ length: 8 }).map((_, i) => (
                <div role="listitem" key={i}><VeggieCardSkeleton /></div>
              ))
            : (featured || []).map(v => (
                <div role="listitem" key={v.id}><VeggieCard veggie={v} /></div>
              ))
          }
        </div>
      </section>

      {/* Trust bar */}
      <section className={styles.trustBar} aria-label="Why choose Veggio">
        <div className={styles.trustItem}>
          <span className={styles.trustIcon} aria-hidden="true">🌿</span>
          <div>
            <strong>Farm Fresh</strong>
            <p>Sourced directly from local farms every morning</p>
          </div>
        </div>
        <div className={styles.trustItem}>
          <span className={styles.trustIcon} aria-hidden="true">🚚</span>
          <div>
            <strong>Fast Delivery</strong>
            <p>Same-day delivery within Kathmandu Valley</p>
          </div>
        </div>
        <div className={styles.trustItem}>
          <span className={styles.trustIcon} aria-hidden="true">💚</span>
          <div>
            <strong>100% Fresh</strong>
            <p>Full refund if you're not satisfied</p>
          </div>
        </div>
        <div className={styles.trustItem}>
          <span className={styles.trustIcon} aria-hidden="true">🔒</span>
          <div>
            <strong>Secure Payments</strong>
            <p>SSL encrypted checkout, always</p>
          </div>
        </div>
      </section>
    </div>
  );
}
