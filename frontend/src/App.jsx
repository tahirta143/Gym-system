import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import ProtectedRoute from './components/ProtectedRoute';
import Sidebar from './components/Sidebar';
import Navbar from './components/Navbar';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import Members from './pages/Members';
import Plans from './pages/Plans';
import Attendance from './pages/Attendance';
import Fees from './pages/Fees';
import Trainers from './pages/Trainers';
import PTPackages from './pages/PTPackages';
import Expenses from './pages/Expenses';
import Payroll from './pages/Payroll';
import Reports from './pages/Reports';
import AccessControl from './pages/AccessControl';
import WorkoutPlans from './pages/WorkoutPlans';
import DietPlans from './pages/DietPlans';
import Settings from './pages/Settings';
import ImportData from './pages/ImportData';
import Payments from './pages/Payments';
import AccessDenied from './pages/AccessDenied';

// Authenticated layout shell wrapping children
const AppLayout = ({ children }) => {
  return (
    <div className="flex h-screen overflow-hidden bg-[var(--bg-app)] text-[var(--text-primary)] font-sans transition-all duration-200">
      <Sidebar />
      <div className="flex-1 flex flex-col overflow-hidden">
        <Navbar />
        <main className="flex-1 overflow-y-auto p-8">
          {children}
        </main>
      </div>
    </div>
  );
};

function App() {
  return (
    <Router>
      <Routes>
        {/* Auth entry point */}
        <Route path="/login" element={<Login />} />
        
        {/* Protected Dashboard shell */}
        <Route path="/" element={
          <ProtectedRoute>
            <AppLayout>
              <Dashboard />
            </AppLayout>
          </ProtectedRoute>
        } />
        
        <Route path="/members" element={
          <ProtectedRoute>
            <AppLayout>
              <Members />
            </AppLayout>
          </ProtectedRoute>
        } />
        
        <Route path="/plans" element={
          <ProtectedRoute allowedRoles={['super_admin', 'manager']}>
            <AppLayout>
              <Plans />
            </AppLayout>
          </ProtectedRoute>
        } />
        
        <Route path="/attendance" element={
          <ProtectedRoute>
            <AppLayout>
              <Attendance />
            </AppLayout>
          </ProtectedRoute>
        } />
        
        <Route path="/fees" element={
          <ProtectedRoute allowedRoles={['super_admin', 'manager', 'accountant']}>
            <AppLayout>
              <Fees />
            </AppLayout>
          </ProtectedRoute>
        } />
        
        <Route path="/trainers" element={
          <ProtectedRoute allowedRoles={['super_admin', 'manager']}>
            <AppLayout>
              <Trainers />
            </AppLayout>
          </ProtectedRoute>
        } />
        
        <Route path="/pt-packages" element={
          <ProtectedRoute allowedRoles={['super_admin', 'manager', 'trainer']}>
            <AppLayout>
              <PTPackages />
            </AppLayout>
          </ProtectedRoute>
        } />
        
        <Route path="/expenses" element={
          <ProtectedRoute allowedRoles={['super_admin', 'accountant']}>
            <AppLayout>
              <Expenses />
            </AppLayout>
          </ProtectedRoute>
        } />
        
        <Route path="/payroll" element={
          <ProtectedRoute allowedRoles={['super_admin', 'accountant', 'trainer']}>
            <AppLayout>
              <Payroll />
            </AppLayout>
          </ProtectedRoute>
        } />

        <Route path="/reports" element={
          <ProtectedRoute allowedRoles={['super_admin', 'accountant']}>
            <AppLayout>
              <Reports />
            </AppLayout>
          </ProtectedRoute>
        } />

        <Route path="/access-control" element={
          <ProtectedRoute allowedRoles={['super_admin']}>
            <AppLayout>
              <AccessControl />
            </AppLayout>
          </ProtectedRoute>
        } />

        <Route path="/workouts" element={
          <ProtectedRoute allowedRoles={['super_admin', 'manager', 'trainer']}>
            <AppLayout>
              <WorkoutPlans />
            </AppLayout>
          </ProtectedRoute>
        } />

        <Route path="/diets" element={
          <ProtectedRoute allowedRoles={['super_admin', 'manager', 'trainer']}>
            <AppLayout>
              <DietPlans />
            </AppLayout>
          </ProtectedRoute>
        } />

        <Route path="/settings" element={
          <ProtectedRoute allowedRoles={['super_admin', 'manager']}>
            <AppLayout>
              <Settings />
            </AppLayout>
          </ProtectedRoute>
        } />

        <Route path="/import-data" element={
          <ProtectedRoute allowedRoles={['super_admin', 'manager']}>
            <AppLayout>
              <ImportData />
            </AppLayout>
          </ProtectedRoute>
        } />

        <Route path="/payments" element={
          <ProtectedRoute allowedRoles={['super_admin', 'manager', 'accountant']}>
            <AppLayout>
              <Payments />
            </AppLayout>
          </ProtectedRoute>
        } />

        <Route path="/access-denied" element={<AccessDenied />} />
        
        {/* Catch-all redirects */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Router>
  );
}

export default App;
