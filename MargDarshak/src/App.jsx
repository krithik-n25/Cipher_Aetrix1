import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider } from './context/AuthContext'
import { LanguageProvider } from './context/LanguageContext'
import { AssessmentProvider } from './context/AssessmentContext'
import { ToastProvider } from './components/Toast'
import ProtectedRoute from './components/ProtectedRoute'

// Pages
import Login from './pages/Login'
import LanguageSelect from './pages/user/LanguageSelect'
import PatientInfo from './pages/user/PatientInfo'
import SymptomInput from './pages/user/SymptomInput'
import TriageResult from './pages/user/TriageResult'
import FeedbackLoop from './pages/user/FeedbackLoop'

import AshaDashboard from './pages/asha/AshaDashboard'
import AssessPatient from './pages/asha/AssessPatient'
import PatientList from './pages/asha/PatientList'
import FollowUp from './pages/asha/FollowUp'
import MonthlyReport from './pages/asha/MonthlyReport'

import AdminDashboard from './pages/admin/AdminDashboard'
import SymptomHeatmap from './pages/admin/SymptomHeatmap'
import PHCMonitor from './pages/admin/PHCMonitor'
import AshaTracker from './pages/admin/AshaTracker'
import OutbreakAlerts from './pages/admin/OutbreakAlerts'
import Reports from './pages/admin/Reports'

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <LanguageProvider>
          <AssessmentProvider>
            <ToastProvider>
              <Routes>
                <Route path="/" element={<Navigate to="/login" replace />} />
                <Route path="/login" element={<Login />} />

                {/* User flow */}
                <Route path="/user/language"     element={<LanguageSelect />} />
                <Route path="/user/patient-info" element={<PatientInfo />} />
                <Route path="/user/symptoms"     element={<SymptomInput />} />
                <Route path="/user/result"       element={<TriageResult />} />
                <Route path="/user/feedback"     element={<FeedbackLoop />} />

                {/* ASHA flow */}
                <Route path="/asha/dashboard" element={<ProtectedRoute allowedRoles={['asha']}><AshaDashboard /></ProtectedRoute>} />
                <Route path="/asha/assess"    element={<ProtectedRoute allowedRoles={['asha']}><AssessPatient /></ProtectedRoute>} />
                <Route path="/asha/patients"  element={<ProtectedRoute allowedRoles={['asha']}><PatientList /></ProtectedRoute>} />
                <Route path="/asha/follow-up/:id" element={<ProtectedRoute allowedRoles={['asha']}><FollowUp /></ProtectedRoute>} />
                <Route path="/asha/report"    element={<ProtectedRoute allowedRoles={['asha']}><MonthlyReport /></ProtectedRoute>} />

                {/* Admin flow */}
                <Route path="/admin/dashboard"    element={<ProtectedRoute allowedRoles={['admin']}><AdminDashboard /></ProtectedRoute>} />
                <Route path="/admin/heatmap"      element={<ProtectedRoute allowedRoles={['admin']}><SymptomHeatmap /></ProtectedRoute>} />
                <Route path="/admin/phc"          element={<ProtectedRoute allowedRoles={['admin']}><PHCMonitor /></ProtectedRoute>} />
                <Route path="/admin/asha-tracker" element={<ProtectedRoute allowedRoles={['admin']}><AshaTracker /></ProtectedRoute>} />
                <Route path="/admin/outbreaks"    element={<ProtectedRoute allowedRoles={['admin']}><OutbreakAlerts /></ProtectedRoute>} />
                <Route path="/admin/reports"      element={<ProtectedRoute allowedRoles={['admin']}><Reports /></ProtectedRoute>} />

                <Route path="*" element={<Navigate to="/login" replace />} />
              </Routes>
            </ToastProvider>
          </AssessmentProvider>
        </LanguageProvider>
      </AuthProvider>
    </BrowserRouter>
  )
}
