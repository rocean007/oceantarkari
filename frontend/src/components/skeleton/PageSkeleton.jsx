import styles from './Skeleton.module.css';

// Generic skeleton block
export function Skeleton({ width, height, borderRadius, className = '' }) {
  return (
    <span
      className={`skeleton ${styles.base} ${className}`}
      style={{ width, height, borderRadius }}
      aria-hidden="true"
    />
  );
}

// Full page skeleton
export default function PageSkeleton() {
  return (
    <div className={styles.page} aria-busy="true" aria-label="Loading page content">
      {/* Nav placeholder */}
      <div className={styles.navSkeleton}>
        <Skeleton width={100} height={28} borderRadius={8} />
        <div className={styles.navActions}>
          <Skeleton width={60} height={20} borderRadius={20} />
          <Skeleton width={60} height={20} borderRadius={20} />
          <Skeleton width={40} height={40} borderRadius="50%" />
        </div>
      </div>

      {/* Hero skeleton */}
      <div className={styles.heroSkeleton}>
        <Skeleton width="55%" height={48} borderRadius={8} className={styles.mb3} />
        <Skeleton width="40%" height={48} borderRadius={8} className={styles.mb5} />
        <Skeleton width="70%" height={20} borderRadius={6} className={styles.mb2} />
        <Skeleton width="55%" height={20} borderRadius={6} className={styles.mb6} />
        <div className={styles.heroBtns}>
          <Skeleton width={140} height={52} borderRadius={32} />
          <Skeleton width={120} height={52} borderRadius={32} />
        </div>
      </div>

      {/* Cards grid skeleton */}
      <div className={styles.gridSkeleton}>
        {Array.from({ length: 8 }).map((_, i) => (
          <VeggieCardSkeleton key={i} />
        ))}
      </div>
    </div>
  );
}

export function VeggieCardSkeleton() {
  return (
    <div className={styles.card} aria-hidden="true">
      <Skeleton width="100%" height={0} className={styles.cardImg} />
      <div className={styles.cardBody}>
        <Skeleton width="40%" height={12} borderRadius={6} />
        <Skeleton width="70%" height={20} borderRadius={6} />
        <Skeleton width="55%" height={14} borderRadius={6} />
        <div className={styles.cardFooter}>
          <Skeleton width={80} height={24} borderRadius={8} />
          <Skeleton width={80} height={40} borderRadius={32} />
        </div>
      </div>
    </div>
  );
}

export function ProductSkeleton() {
  return (
    <div className={styles.productSkeleton} aria-busy="true" aria-label="Loading product">
      <Skeleton width="100%" height={0} className={styles.productImg} />
      <div className={styles.productInfo}>
        <Skeleton width="30%" height={14} borderRadius={6} className={styles.mb2} />
        <Skeleton width="80%" height={36} borderRadius={8} className={styles.mb3} />
        <Skeleton width="60%" height={18} borderRadius={6} className={styles.mb2} />
        <Skeleton width="100%" height={14} borderRadius={6} className={styles.mb1} />
        <Skeleton width="90%" height={14} borderRadius={6} className={styles.mb1} />
        <Skeleton width="75%" height={14} borderRadius={6} className={styles.mb5} />
        <Skeleton width={160} height={52} borderRadius={32} />
      </div>
    </div>
  );
}

export function OrderSkeleton() {
  return (
    <div className={styles.orderSkeleton} aria-hidden="true">
      {Array.from({ length: 3 }).map((_, i) => (
        <div key={i} className={styles.orderItem}>
          <div className={styles.orderLeft}>
            <Skeleton width={48} height={48} borderRadius={12} />
            <div className={styles.orderText}>
              <Skeleton width={140} height={16} borderRadius={6} className={styles.mb1} />
              <Skeleton width={80} height={12} borderRadius={6} />
            </div>
          </div>
          <Skeleton width={80} height={28} borderRadius={20} />
        </div>
      ))}
    </div>
  );
}
