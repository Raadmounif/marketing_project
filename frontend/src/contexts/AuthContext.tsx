import React, { createContext, useContext, useState, useCallback, useEffect } from 'react'
import type { User } from '../types'
import { authApi } from '../api'

interface AuthContextType {
  user: User | null
  token: string | null
  isLoading: boolean
  login: (email: string, password: string) => Promise<void>
  register: (data: object) => Promise<void>
  logout: () => Promise<void>
  updateUser: (user: User) => void
}

const AuthContext = createContext<AuthContextType | null>(null)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(() => {
    const stored = localStorage.getItem('auth_user')
    return stored ? JSON.parse(stored) : null
  })
  const [token, setToken] = useState<string | null>(() =>
    localStorage.getItem('auth_token')
  )
  const [isLoading, setIsLoading] = useState(false)

  useEffect(() => {
    if (token && !user) {
      authApi.me().then((res) => {
        setUser(res.data)
        localStorage.setItem('auth_user', JSON.stringify(res.data))
      }).catch(() => {
        localStorage.removeItem('auth_token')
        localStorage.removeItem('auth_user')
        setToken(null)
      })
    }
  }, [])

  const login = useCallback(async (email: string, password: string) => {
    setIsLoading(true)
    try {
      const res = await authApi.login({ email, password })
      const { user: u, token: t } = res.data
      setUser(u)
      setToken(t)
      localStorage.setItem('auth_token', t)
      localStorage.setItem('auth_user', JSON.stringify(u))
    } finally {
      setIsLoading(false)
    }
  }, [])

  const register = useCallback(async (data: object) => {
    setIsLoading(true)
    try {
      const res = await authApi.register(data)
      const { user: u, token: t } = res.data
      setUser(u)
      setToken(t)
      localStorage.setItem('auth_token', t)
      localStorage.setItem('auth_user', JSON.stringify(u))
    } finally {
      setIsLoading(false)
    }
  }, [])

  const logout = useCallback(async () => {
    try {
      await authApi.logout()
    } catch {}
    setUser(null)
    setToken(null)
    localStorage.removeItem('auth_token')
    localStorage.removeItem('auth_user')
  }, [])

  const updateUser = useCallback((updatedUser: User) => {
    setUser(updatedUser)
    localStorage.setItem('auth_user', JSON.stringify(updatedUser))
  }, [])

  return (
    <AuthContext.Provider value={{ user, token, isLoading, login, register, logout, updateUser }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used inside AuthProvider')
  return ctx
}
