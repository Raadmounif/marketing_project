import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider } from './contexts/AuthContext'
import { LangProvider } from './contexts/LangContext'
import ProtectedRoute from './components/ProtectedRoute'
import Navbar from './components/Navbar'
import Footer from './components/Footer'

import Landing from './pages/Landing'
import Login from './pages/Login'
import Register from './pages/Register'
import Profile from './pages/Profile'
import Orders from './pages/Orders'
import Favorites from './pages/Favorites'
import StaffDashboard from './pages/staff/Dashboard'
import ManageOffers from './pages/staff/ManageOffers'
import ManageProducts from './pages/staff/ManageProducts'
import BoardEditor from './pages/staff/BoardEditor'
import HowItWorksEditor from './pages/staff/HowItWorksEditor'
import StaffNotifications from './pages/staff/Notifications'
import OrderHistory from './pages/staff/OrderHistory'
import StatisticsPage from './pages/Statistics'
import AdminSettings from './pages/admin/Settings'
import ManageUsers from './pages/admin/ManageUsers'

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <LangProvider>
          <div className="min-h-screen flex flex-col bg-tobacco-950">
            <Navbar />
            <main className="flex-1">
              <Routes>
                {/* Public */}
                <Route path="/" element={<Landing />} />
                <Route path="/login" element={<Login />} />
                <Route path="/register" element={<Register />} />

                {/* Customer */}
                <Route path="/profile" element={
                  <ProtectedRoute><Profile /></ProtectedRoute>
                } />
                <Route path="/orders" element={
                  <ProtectedRoute><Orders /></ProtectedRoute>
                } />
                <Route path="/favorites" element={
                  <ProtectedRoute><Favorites /></ProtectedRoute>
                } />

                {/* Staff + Admin */}
                <Route path="/staff" element={
                  <ProtectedRoute roles={['staff', 'admin']}><StaffDashboard /></ProtectedRoute>
                } />
                <Route path="/staff/offers" element={
                  <ProtectedRoute roles={['staff', 'admin']}><ManageOffers /></ProtectedRoute>
                } />
                <Route path="/staff/offers/:offerId/products" element={
                  <ProtectedRoute roles={['staff', 'admin']}><ManageProducts /></ProtectedRoute>
                } />
                <Route path="/staff/board" element={
                  <ProtectedRoute roles={['staff', 'admin']}><BoardEditor /></ProtectedRoute>
                } />
                <Route path="/staff/how-it-works" element={
                  <ProtectedRoute roles={['staff', 'admin']}><HowItWorksEditor /></ProtectedRoute>
                } />
                <Route path="/staff/notifications" element={
                  <ProtectedRoute roles={['staff', 'admin']}><StaffNotifications /></ProtectedRoute>
                } />
                <Route path="/staff/order-history" element={
                  <ProtectedRoute roles={['staff', 'admin']}><OrderHistory /></ProtectedRoute>
                } />
                <Route path="/staff/statistics" element={
                  <ProtectedRoute roles={['staff', 'admin']}><StatisticsPage /></ProtectedRoute>
                } />

                {/* Admin only */}
                <Route path="/admin/settings" element={
                  <ProtectedRoute roles={['admin']}><AdminSettings /></ProtectedRoute>
                } />

                {/* Staff + Admin: user management */}
                <Route path="/admin/users" element={
                  <ProtectedRoute roles={['staff', 'admin']}><ManageUsers /></ProtectedRoute>
                } />

                <Route path="*" element={<Navigate to="/" replace />} />
              </Routes>
            </main>
            <Footer />
          </div>
        </LangProvider>
      </AuthProvider>
    </BrowserRouter>
  )
}
