import { Outlet, NavLink, Navigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import styles from './AdminLayout.module.css';

const navItems = [
  { to: '/admin',            label: 'Dashboard',  icon: '📊', end: true },
  { to: '/admin/vegetables', label: 'Vegetables',  icon: '🥦' },
  { to: '/admin/orders',     label: 'Orders',      icon: '📦' },
  { to: '/admin/users',      label: 'Users',       icon: '👥' },
];

export default function AdminLayout() {
  const { isAuthenticated, user } = useAuth();

  if (!isAuthenticated || user?.role !== 'Admin') {
    return <Navigate to="/" replace />;
  }

  return (
    <div className={styles.layout}>
      <aside className={styles.sidebar} aria-label="Admin navigation">
        <div className={styles.logo}>
          <span aria-hidden="true">🌿</span>
          <div>
            <span className={styles.logoName}>veggio</span>
            <span className={styles.logoTag}>Admin</span>
          </div>
        </div>

        <nav className={styles.nav} role="navigation">
          {navItems.map(item => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.end}
              className={({ isActive }) => isActive ? `${styles.navLink} ${styles.navActive}` : styles.navLink}
            >
              <span aria-hidden="true">{item.icon}</span>
              <span>{item.label}</span>
            </NavLink>
          ))}
        </nav>

        <div className={styles.sidebarFooter}>
          <div className={styles.adminInfo}>
            <div className={styles.adminAvatar}>{user?.name?.[0]?.toUpperCase()}</div>
            <div>
              <p className={styles.adminName}>{user?.name}</p>
              <p className={styles.adminRole}>Administrator</p>
            </div>
          </div>
        </div>
      </aside>

      <main className={styles.main} id="admin-main">
        <Outlet />
      </main>
    </div>
  );
}
