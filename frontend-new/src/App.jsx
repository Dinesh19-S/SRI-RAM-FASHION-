import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import MainLayout from './components/layout/MainLayout';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import DashboardPage from './pages/DashboardPage';
import BillingPage from './pages/BillingPage';
import InventoryPage from './pages/InventoryPage';
import ReportsPage from './pages/ReportsPage';
import SettingsPage from './pages/SettingsPage';
import PurchaseEntryPage from './pages/PurchaseEntryPage';
import PurchasePaymentsPage from './pages/PurchasePaymentsPage';
import SalesEntryPage from './pages/SalesEntryPage';
import SalesPaymentsPage from './pages/SalesPaymentsPage';
import PurchaseReportsPage from './pages/PurchaseReportsPage';
import SalesReportsPage from './pages/SalesReportsPage';
import StockReportsPage from './pages/StockReportsPage';
import AuditorPurchasePage from './pages/AuditorPurchasePage';
import AuditorSalesPage from './pages/AuditorSalesPage';
import CustomerEntryPage from './pages/CustomerEntryPage';
import ItemsPage from './pages/ItemsPage';
import HSNPage from './pages/HSNPage';
import SupplierEntryPage from './pages/SupplierEntryPage';

// Protected Route wrapper
const ProtectedRoute = ({ children }) => {
  const { isAuthenticated } = useSelector((state) => state.auth);
  return isAuthenticated ? children : <Navigate to="/login" replace />;
};

// Public Route wrapper (redirect to dashboard if authenticated)
const PublicRoute = ({ children }) => {
  const { isAuthenticated } = useSelector((state) => state.auth);
  return isAuthenticated ? <Navigate to="/" replace /> : children;
};

function App() {
  return (
    <BrowserRouter>
      <div className="min-h-screen bg-gray-50">
        <Routes>
          {/* Public Routes */}
          <Route
            path="/login"
            element={
              <PublicRoute>
                <LoginPage />
              </PublicRoute>
            }
          />
          <Route
            path="/register"
            element={
              <PublicRoute>
                <RegisterPage />
              </PublicRoute>
            }
          />

          {/* Protected Routes */}
          <Route
            path="/"
            element={
              <ProtectedRoute>
                <MainLayout />
              </ProtectedRoute>
            }
          >
            <Route index element={<DashboardPage />} />
            <Route path="purchase/entry" element={<PurchaseEntryPage />} />
            <Route path="purchase/payments" element={<PurchasePaymentsPage />} />
            <Route path="sales/entry" element={<SalesEntryPage />} />
            <Route path="sales/payments" element={<SalesPaymentsPage />} />
            <Route path="billing" element={<BillingPage />} />
            <Route path="inventory" element={<InventoryPage />} />
            <Route path="reports/purchase" element={<PurchaseReportsPage />} />
            <Route path="reports/sales" element={<SalesReportsPage />} />
            <Route path="reports/stock" element={<StockReportsPage />} />
            <Route path="auditor/purchase" element={<AuditorPurchasePage />} />
            <Route path="auditor/sales" element={<AuditorSalesPage />} />
            <Route path="master/customers" element={<CustomerEntryPage />} />
            <Route path="master/items" element={<ItemsPage />} />
            <Route path="master/hsn" element={<HSNPage />} />
            <Route path="master/suppliers" element={<SupplierEntryPage />} />
            <Route path="settings" element={<SettingsPage />} />
          </Route>

          {/* Catch all */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </div>
    </BrowserRouter>
  );
}

export default App;
