import { createContext, useContext, useState } from 'react'

const AssessmentContext = createContext(null)

export function AssessmentProvider({ children }) {
  const [assessment, setAssessment] = useState({
    patientType: '',
    patientAge: '',
    patientGender: '',
    patientName: '',
    village: '',
    block: '',
    district: '',
    state: '',
    userLat: null,   // real GPS latitude
    userLng: null,   // real GPS longitude
    rawSymptomText: '',
    detectedSymptoms: [],
    followUpAnswers: {},
    triageResult: null,
    assessmentId: null,
  })

  const update = (fields) => setAssessment(prev => ({ ...prev, ...fields }))
  const reset = () => setAssessment({
    patientType: '', patientAge: '', patientGender: '', patientName: '',
    village: '', block: '', district: '', state: '',
    userLat: null, userLng: null,
    rawSymptomText: '',
    detectedSymptoms: [], followUpAnswers: {}, triageResult: null, assessmentId: null,
  })

  return (
    <AssessmentContext.Provider value={{ assessment, update, reset }}>
      {children}
    </AssessmentContext.Provider>
  )
}

export const useAssessment = () => useContext(AssessmentContext)
