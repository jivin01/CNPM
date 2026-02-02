import React from 'react'
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider } from './contexts/AuthContext'
import ThemeProvider from './components/ui/theme-provider'
import Login from './pages/Login'
import Register from './pages/Register'
import PatientDashboard from './pages/PatientDashboard'
import DoctorDashboard from './pages/DoctorDashboard'
import UploadImage from './pages/UploadImage'
import ClinicDashboard from './pages/ClinicDashboard'
import ClinicRegistration from './pages/ClinicRegistration'
import './App.css'

function App() {
  return (
    <ThemeProvider defaultTheme="light" storageKey="aura-ui-theme">
      <AuthProvider>
        <Router>
          <div className="min-h-screen bg-gradient-to-br from-blue-50 to-teal-50">
            <Routes>
              <Route path="/login" element={<Login />} />
              <Route path="/register" element={<Register />} />
              <Route path="/patient/dashboard" element={<PatientDashboard />} />
              <Route path="/patient/upload" element={<UploadImage />} />
              <Route path="/doctor/dashboard" element={<DoctorDashboard />} />
              <Route path="/clinic/dashboard" element={<ClinicDashboard />} />
              <Route path="/clinic/register" element={<ClinicRegistration />} />
              <Route path="/" element={<Navigate to="/login" replace />} />
            </Routes>
          </div>
        </Router>
      </AuthProvider>
    </ThemeProvider>
  )
}

export default App
