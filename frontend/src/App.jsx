import { Routes, Route, useLocation } from 'react-router-dom';
import { Suspense, lazy } from 'react';
import { AnimatePresence } from 'framer-motion';
import { AuthProvider } from './context/AuthContext';
import { CartProvider } from './context/CartContext';
import { ToastProvider } from './context/ToastContext';
import Layout from './components/layout/Layout';
import AdminLayout from './components/layout/AdminLayout';
import PageSkeleton from './components/skeleton/PageSkeleton';

// Lazy load pages for code splitting
const Home       = lazy(() => import('./pages/Home'));
const Shop       = lazy(() => import('./pages/Shop'));
const Product    = lazy(() => import('./pages/Product'));
const Cart       = lazy(() => import('./pages/Cart'));
const Checkout   = lazy(() => import('./pages/Checkout'));
const Orders     = lazy(() => import('./pages/Orders'));
const Profile    = lazy(() => import('./pages/Profile'));
const NotFound   = lazy(() => import('./pages/NotFound'));

// Admin pages
const AdminDash    = lazy(() => import('./pages/admin/Dashboard'));
const AdminVegs    = lazy(() => import('./pages/admin/Vegetables'));
const AdminOrders  = lazy(() => import('./pages/admin/Orders'));
const AdminUsers   = lazy(() => import('./pages/admin/Users'));

export default function App() {
  const location = useLocation();

  return (
    <AuthProvider>
      <CartProvider>
        <ToastProvider>
          <AnimatePresence mode="wait">
            <Suspense fallback={<PageSkeleton />}>
              <Routes location={location} key={location.pathname}>
                {/* Public routes */}
                <Route element={<Layout />}>
                  <Route index element={<Home />} />
                  <Route path="/shop" element={<Shop />} />
                  <Route path="/shop/:id" element={<Product />} />
                  <Route path="/cart" element={<Cart />} />
                  <Route path="/checkout" element={<Checkout />} />
                  <Route path="/orders" element={<Orders />} />
                  <Route path="/profile" element={<Profile />} />
                </Route>

                {/* Admin routes */}
                <Route path="/admin" element={<AdminLayout />}>
                  <Route index element={<AdminDash />} />
                  <Route path="vegetables" element={<AdminVegs />} />
                  <Route path="orders" element={<AdminOrders />} />
                  <Route path="users" element={<AdminUsers />} />
                </Route>

                <Route path="*" element={<NotFound />} />
              </Routes>
            </Suspense>
          </AnimatePresence>
        </ToastProvider>
      </CartProvider>
    </AuthProvider>
  );
}
