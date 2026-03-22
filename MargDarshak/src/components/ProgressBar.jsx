export default function ProgressBar({ currentStep, totalSteps }) {
  return (
    <div style={{ textAlign: 'center', marginBottom: 24 }}>
      <div className="progress-bar-wrap">
        {Array.from({ length: totalSteps }).map((_, i) => (
          <div key={i} className={`progress-segment${i < currentStep ? ' active' : ''}`} />
        ))}
      </div>
      <span style={{ fontSize: 11, color: 'var(--gray)', fontWeight: 500 }}>
        Step {currentStep} of {totalSteps}
      </span>
    </div>
  )
}
