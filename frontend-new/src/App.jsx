import { lazy, Suspense } from 'react';
import { BrowserRouter, HashRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { motion, AnimatePresence } from 'framer-motion';
import MainLayout from './components/layout/MainLayout';

// Lazy-loaded pages for code splitting
const HomePage = lazy(() => import('./pages/HomePage'));
const LoginPage = lazy(() => import('./pages/LoginPage'));
const RegisterPage = lazy(() => import('./pages/RegisterPage'));
const DashboardPage = lazy(() => import('./pages/DashboardPage'));
const BillingPage = lazy(() => import('./pages/BillingPage'));
const InventoryPage = lazy(() => import('./pages/InventoryPage'));
const SettingsPage = lazy(() => import('./pages/SettingsPage'));
const PurchaseEntryPage = lazy(() => import('./pages/PurchaseEntryPage'));
const SalesReportsPage = lazy(() => import('./pages/SalesReportsPage'));
const StockReportsPage = lazy(() => import('./pages/StockReportsPage'));
const CustomerEntryPage = lazy(() => import('./pages/CustomerEntryPage'));
const ItemsPage = lazy(() => import('./pages/ItemsPage'));
const SupplierEntryPage = lazy(() => import('./pages/SupplierEntryPage'));

// Loading fallback
const PageLoader = () => (
  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', minHeight: '200px' }}>
    <div style={{ width: '32px', height: '32px', border: '3px solid #e2e8f0', borderTopColor: '#1e40af', borderRadius: '50%', animation: 'spin 0.6s linear infinite' }} />
    <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
  </div>
);

// Protected Route wrapper
const ProtectedRoute = ({ children }) => {
  const { isAuthenticated } = useSelector((state) => state.auth);
  return isAuthenticated ? children : <Navigate to="/login" replace />;
};

// Public Route wrapper (redirect to dashboard if authenticated)
const PublicRoute = ({ children }) => {
  const { isAuthenticated } = useSelector((state) => state.auth);
  return isAuthenticated ? <Navigate to="/dashboard" replace /> : children;
};

// Simplified page transition — opacity only, fast
const pageVariants = {
  initial: { opacity: 0 },
  in: { opacity: 1 },
  out: { opacity: 0 },
};

const pageTransition = {
  type: 'tween',
  ease: 'easeOut',
  duration: 0.25,
};

// Animated Page Wrapper
const AnimatedPage = ({ children }) => (
  <motion.div
    initial="initial"
    animate="in"
    exit="out"
    variants={pageVariants}
    transition={pageTransition}
    style={{ width: '100%', height: '100%' }}
  >
    {children}
  </motion.div>
);

// Animated Routes Component
const AnimatedRoutes = () => {
  const location = useLocation();

  return (
    <Suspense fallback={<PageLoader />}>
      <AnimatePresence>
        <Routes location={location} key={location.pathname}>
          {/* Public Home Page - Always accessible */}
          <Route
            path="/"
            element={
              <AnimatedPage>
                <HomePage />
              </AnimatedPage>
            }
          />

          {/* Public Auth Routes */}
          <Route
            path="/login"
            element={
              <PublicRoute>
                <AnimatedPage>
                  <LoginPage />
                </AnimatedPage>
              </PublicRoute>
            }
          />
          <Route
            path="/register"
            element={
              <PublicRoute>
                <AnimatedPage>
                  <RegisterPage />
                </AnimatedPage>
              </PublicRoute>
            }
          />

          {/* Protected Routes */}
          <Route
            path="/dashboard"
            element={
              <ProtectedRoute>
                <MainLayout />
              </ProtectedRoute>
            }
          >
            <Route index element={<Suspense fallback={<PageLoader />}><DashboardPage /></Suspense>} />
            <Route path="purchase/entry" element={<Suspense fallback={<PageLoader />}><PurchaseEntryPage /></Suspense>} />
            <Route path="billing" element={<Suspense fallback={<PageLoader />}><BillingPage /></Suspense>} />
            <Route path="inventory" element={<Suspense fallback={<PageLoader />}><InventoryPage /></Suspense>} />
            <Route path="reports/sales" element={<Suspense fallback={<PageLoader />}><SalesReportsPage /></Suspense>} />
            <Route path="reports/stock" element={<Suspense fallback={<PageLoader />}><StockReportsPage /></Suspense>} />
            <Route path="master/customers" element={<Suspense fallback={<PageLoader />}><CustomerEntryPage /></Suspense>} />
            <Route path="master/items" element={<Suspense fallback={<PageLoader />}><ItemsPage /></Suspense>} />
            <Route path="master/suppliers" element={<Suspense fallback={<PageLoader />}><SupplierEntryPage /></Suspense>} />
            <Route path="settings" element={<Suspense fallback={<PageLoader />}><SettingsPage /></Suspense>} />
          </Route>

          {/* Catch all */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </AnimatePresence>
    </Suspense>
  );
};

function App() {
  const RouterComponent = (window?.electronAPI?.isElectron || window.location.protocol === 'file:')
    ? HashRouter
    : BrowserRouter;

  return (
    <RouterComponent>
      <div className="min-h-screen app-shell">
        <AnimatedRoutes />
      </div>
    </RouterComponent>
  );
}

export default App;
