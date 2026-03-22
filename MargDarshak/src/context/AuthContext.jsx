import { createContext, useContext, useState, useEffect } from 'react'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [token, setToken] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const storedUser = localStorage.getItem('user')
    const storedToken = localStorage.getItem('token')
    if (storedUser) setUser(JSON.parse(storedUser))
    if (storedToken) setToken(storedToken)
    setLoading(false)
  }, [])

  const login = (userData, tok) => {
    setUser(userData)
    setToken(tok)
    localStorage.setItem('user', JSON.stringify(userData))
    localStorage.setItem('token', tok)
  }

  const logout = () => {
    setUser(null)
    setToken(null)
    localStorage.removeItem('user')
    localStorage.removeItem('token')
  }

  const updateLanguage = (lang) => {
    if (user) {
      const updated = { ...user, language: lang }
      setUser(updated)
      localStorage.setItem('user', JSON.stringify(updated))
    }
  }

  return (
    <AuthContext.Provider value={{ user, token, loading, isAuthenticated: !!token, login, logout, updateLanguage }}>
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => useContext(AuthContext)
