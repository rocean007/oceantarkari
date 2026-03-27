import { Outlet } from 'react-router-dom';
import { Suspense } from 'react';
import Navbar from './Navbar';
import Footer from './Footer';
import AuthModal from '../auth/AuthModal';
import CartDrawer from '../shop/CartDrawer';
import PageSkeleton from '../skeleton/PageSkeleton';
import styles from './Layout.module.css';

export default function Layout() {
  return (
    <div className={styles.layout}>
      <Navbar />
      <main className={styles.main} id="main-content" tabIndex={-1}>
        <Suspense fallback={<PageSkeleton />}>
          <Outlet />
        </Suspense>
      </main>
      <Footer />
      <AuthModal />
      <CartDrawer />
    </div>
  );
}
