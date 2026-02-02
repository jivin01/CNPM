import React, { createContext, useContext, useState, useEffect } from 'react'
import axios from 'axios'

interface User {
  id: string
  email: string
  role: 'patient' | 'doctor' | 'admin'
}

interface AuthContextType {
  user: User | null
  login: (email: string, password: string) => Promise<void>
  register: (email: string, password: string, role: string, fullName?: string) => Promise<void>
  logout: () => void
  isLoading: boolean
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export const useAuth = () => {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const token = localStorage.getItem('token')
    if (token) {
      axios.defaults.headers.common['Authorization'] = `Bearer ${token}`
      // Verify token and get user info
      axios.get('/api/v1/auth/me')
        .then(response => {
          setUser(response.data)
        })
        .catch(() => {
          localStorage.removeItem('token')
          delete axios.defaults.headers.common['Authorization']
        })
        .finally(() => {
          setIsLoading(false)
        })
    } else {
      setIsLoading(false)
    }
  }, [])

  const login = async (email: string, password: string) => {
    try {
      // OAuth2PasswordRequestForm expects form data, not JSON
      const formData = new FormData()
      formData.append('username', email)
      formData.append('password', password)
      
      const response = await axios.post('/api/v1/auth/login', formData, {
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        }
      })
      
      const { access_token } = response.data
      localStorage.setItem('token', access_token)
      axios.defaults.headers.common['Authorization'] = `Bearer ${access_token}`
      
      // Get user info
      const userResponse = await axios.get('/api/v1/auth/me')
      setUser(userResponse.data)
    } catch (error) {
      throw error
    }
  }

  const register = async (email: string, password: string, role: string, fullName?: string) => {
    try {
      await axios.post('/api/v1/auth/register', {
        email,
        password,
        role,
        full_name: fullName
      })
      
      // Auto login after registration
      await login(email, password)
    } catch (error) {
      throw error
    }
  }

  const logout = () => {
    localStorage.removeItem('token')
    delete axios.defaults.headers.common['Authorization']
    setUser(null)
  }

  return (
    <AuthContext.Provider value={{ user, login, register, logout, isLoading }}>
      {children}
    </AuthContext.Provider>
  )
}
