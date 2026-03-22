import axios from 'axios'

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:8000',
  timeout: 15000,
  headers: { 'Content-Type': 'application/json' },
})

api.interceptors.request.use(config => {
  const token = localStorage.getItem('token')
  if (token) config.headers.Authorization = `Bearer ${token}`
  return config
})

api.interceptors.response.use(
  res => res,
  err => {
    // Only force logout on 401 from auth endpoints, not from every API call
    if (err.response?.status === 401 && err.config?.url?.includes('/auth/')) {
      localStorage.removeItem('token')
      localStorage.removeItem('user')
      window.location.href = '/login'
    }
    return Promise.reject(err)
  }
)

// Auth
export const loginUser = (data) => api.post('/auth/login', data)
export const getMe = () => api.get('/auth/me')

// Triage
export const extractSymptoms = (data) => api.post('/triage/extract-symptoms', data)
export const runAssessment = (data) => api.post('/triage/assess', data)

// Facilities
export const getNearestFacility = (params) => api.get('/facilities/nearest', { params })

// Feedback
export const submitFeedback = (id, data) => api.post(`/feedback/${id}`, data)
export const getPendingFollowUp = (userId) => api.get(`/feedback/pending/${userId}`)

// Patients (ASHA)
export const getPatientsByAsha = (ashaId) => api.get(`/patients/${ashaId}`)
export const getFollowUpsDue = (ashaId) => api.get(`/patients/followup-due/${ashaId}`)

// Admin — district is read from JWT on the backend, no need to pass it
export const getAdminSummary = () => api.get('/admin/summary')
export const getHeatmapData = (district, period) => api.get('/admin/heatmap', { params: { period } })
export const getPHCLoad = () => api.get('/admin/phc-load')
export const getAshaActivity = () => api.get('/admin/asha-activity')
export const getOutbreakAlerts = () => api.get('/admin/outbreaks')
export const updateOutbreakAlert = (id, data) => api.patch(`/admin/outbreaks/${id}`, data)
export const getReportData = (district, range) => {
  const [from_date, to_date] = (range || ':').split(':')
  return api.get('/admin/reports', { params: { from_date, to_date } })
}

export default api
