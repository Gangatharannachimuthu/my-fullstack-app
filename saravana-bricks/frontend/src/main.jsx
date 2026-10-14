import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';
import { AuthProvider, RequireAuth } from './auth';
import { BusinessProvider } from './business';
import Layout from './components/Layout';
import LoginPage from './pages/LoginPage';
import Dashboard from './pages/Dashboard';
import Purchases from './pages/Purchases';
import PurchaseForm from './pages/PurchaseForm';
import Production from './pages/Production';
import ProductionForm from './pages/ProductionForm';
import Orders from './pages/Orders';
import OrderForm from './pages/OrderForm';
import OrderDetail from './pages/OrderDetail';
import InvoicePage from './pages/InvoicePage';
import AdminProfile from './pages/AdminProfile';
import Employees from './pages/Employees';
import './styles.css';

function Protected() {
  return (
    <RequireAuth>
      <BusinessProvider>
        <Layout />
      </BusinessProvider>
    </RequireAuth>
  );
}

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          <Route path="/login" element={<LoginPage />} />
          <Route element={<Protected />}>
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/raw-materials" element={<Purchases />} />
            <Route path="/raw-materials/new" element={<PurchaseForm />} />
            <Route path="/raw-materials/:id/edit" element={<PurchaseForm />} />
            <Route path="/manufacturing" element={<Production />} />
            <Route path="/manufacturing/new" element={<ProductionForm />} />
            <Route path="/manufacturing/:id/edit" element={<ProductionForm />} />
            <Route path="/orders" element={<Orders />} />
            <Route path="/orders/new" element={<OrderForm />} />
            <Route path="/orders/:id" element={<OrderDetail />} />
            <Route path="/orders/:id/edit" element={<OrderForm />} />
            <Route path="/orders/:id/invoice" element={<InvoicePage />} />
            <Route path="/employees" element={<Employees />} />
            <Route path="/admin-profile" element={<AdminProfile />} />
          </Route>
          <Route path="*" element={<Navigate to="/dashboard" replace />} />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  </React.StrictMode>,
);
