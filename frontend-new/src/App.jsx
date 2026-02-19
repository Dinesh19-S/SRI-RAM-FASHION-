import { BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { motion, AnimatePresence } from 'framer-motion';
import MainLayout from './components/layout/MainLayout';
import HomePage from './pages/HomePage';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import DashboardPage from './pages/DashboardPage';
import BillingPage from './pages/BillingPage';
import InventoryPage from './pages/InventoryPage';
import SettingsPage from './pages/SettingsPage';
import PurchaseEntryPage from './pages/PurchaseEntryPage';

import SalesEntryPage from './pages/SalesEntryPage';

import PurchaseReportsPage from './pages/PurchaseReportsPage';
import SalesReportsPage from './pages/SalesReportsPage';
import StockReportsPage from './pages/StockReportsPage';
import AuditorPurchasePage from './pages/AuditorPurchasePage';
import AuditorSalesPage from './pages/AuditorSalesPage';
import CustomerEntryPage from './pages/CustomerEntryPage';
import ItemsPage from './pages/ItemsPage';
import SupplierEntryPage from './pages/SupplierEntryPage';

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

// Page transition variants
const pageVariants = {
  initial: {
    opacity: 0,
    x: 100,
    scale: 0.95,
  },
  in: {
    opacity: 1,
    x: 0,
    scale: 1,
  },
  out: {
    opacity: 0,
    x: -100,
    scale: 0.95,
  }
};

const pageTransition = {
  type: 'tween',
  ease: [0.4, 0, 0.2, 1],
  duration: 0.7
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
    <AnimatePresence mode="wait">
      <Routes location={location} key={location.pathname}>
        {/* Public Home Page - Shows first */}
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
          <Route index element={<DashboardPage />} />
          <Route path="purchase/entry" element={<PurchaseEntryPage />} />

          <Route path="sales/entry" element={<SalesEntryPage />} />

          <Route path="billing" element={<BillingPage />} />
          <Route path="inventory" element={<InventoryPage />} />
          <Route path="reports/purchase" element={<PurchaseReportsPage />} />
          <Route path="reports/sales" element={<SalesReportsPage />} />
          <Route path="reports/stock" element={<StockReportsPage />} />
          <Route path="auditor/purchase" element={<AuditorPurchasePage />} />
          <Route path="auditor/sales" element={<AuditorSalesPage />} />
          <Route path="master/customers" element={<CustomerEntryPage />} />
          <Route path="master/items" element={<ItemsPage />} />
          <Route path="master/suppliers" element={<SupplierEntryPage />} />
          <Route path="settings" element={<SettingsPage />} />
        </Route>

        {/* Catch all */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </AnimatePresence>
  );
};

function App() {
  return (
    <BrowserRouter>
      <div className="min-h-screen bg-gray-50">
        <AnimatedRoutes />
      </div>
    </BrowserRouter>
  );
}

export default App;
