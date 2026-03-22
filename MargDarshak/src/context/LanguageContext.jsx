import { createContext, useContext, useState } from 'react'
import { t } from '../utils/translation'

const LanguageContext = createContext(null)

export function LanguageProvider({ children }) {
  const [selectedLanguage, setSelectedLanguage] = useState('en')

  const setLanguage = (lang) => setSelectedLanguage(lang)

  // Synchronous translation using static lookup
  const translate = (key) => t(key, selectedLanguage)

  return (
    <LanguageContext.Provider value={{ selectedLanguage, setLanguage, translate, t: (key) => t(key, selectedLanguage) }}>
      {children}
    </LanguageContext.Provider>
  )
}

export const useLanguage = () => useContext(LanguageContext)
