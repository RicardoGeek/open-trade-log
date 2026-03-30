import { Routes, Route } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import { ProtectedRoute } from './components/ProtectedRoute';

// Pages
import { Home } from './pages/Home';
import { Auth } from './pages/Auth';
import { ThankYou } from './pages/ThankYou';
import { DashboardLayout } from './layouts/DashboardLayout';
import { TradeList } from './pages/Dashboard/TradeList';
import { TradeForm } from './pages/Dashboard/TradeForm';
import { TradeDetails } from './pages/Dashboard/TradeDetails';
import { Settings } from './pages/Dashboard/Settings';

export function App() {
  return (
    <AuthProvider>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/auth" element={<Auth />} />
        <Route path="/thank-you" element={<ThankYou />} />
        
        {/* Protected Dashboard Routes */}
        <Route path="/dashboard" element={<ProtectedRoute />}>
          <Route element={<DashboardLayout />}>
            <Route index element={<TradeList />} />
            <Route path="trades/new" element={<TradeForm />} />
            <Route path="trades/:id" element={<TradeDetails />} />
            <Route path="trades/:id/edit" element={<TradeForm />} />
            <Route path="settings" element={<Settings />} />
          </Route>
        </Route>
      </Routes>
    </AuthProvider>
  );
}
