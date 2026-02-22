'use client'

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react'
import { useRouter } from 'next/navigation'
import type { User } from '@/types/auth'
import { login as apiLogin, register as apiRegister, getMe, refreshToken } from '@/lib/auth-api'

const ACCESS_KEY = 'access_token'
const REFRESH_KEY = 'refresh_token'

interface AuthContextValue {
  user: User | null
  isLoading: boolean
  isAuthenticated: boolean
  login: (email: string, password: string) => Promise<void>
  register: (email: string, password: string, name: string) => Promise<void>
  logout: () => void
  error: string | null
  clearError: () => void
}

const AuthContext = createContext<AuthContextValue | null>(null)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const router = useRouter()

  const clearError = useCallback(() => setError(null), [])

  const loadUser = useCallback(async () => {
    if (typeof window === 'undefined') return
    const access = localStorage.getItem(ACCESS_KEY)
    const refreshVal = localStorage.getItem(REFRESH_KEY)
    if (!access && !refreshVal) {
      setUser(null)
      setIsLoading(false)
      return
    }
    try {
      let token = access
      if (!token && refreshVal) {
        const { accessToken } = await refreshToken(refreshVal)
        token = accessToken
        localStorage.setItem(ACCESS_KEY, accessToken)
      }
      if (token) {
        const u = await getMe(token)
        setUser(u)
      } else {
        setUser(null)
      }
    } catch {
      localStorage.removeItem(ACCESS_KEY)
      localStorage.removeItem(REFRESH_KEY)
      setUser(null)
    } finally {
      setIsLoading(false)
    }
  }, [])

  useEffect(() => {
    loadUser()
  }, [loadUser])

  const login = useCallback(
    async (email: string, password: string) => {
      setError(null)
      try {
        const res = await apiLogin(email, password)
        localStorage.setItem(ACCESS_KEY, res.accessToken)
        localStorage.setItem(REFRESH_KEY, res.refreshToken)
        setUser(res.user)
        router.push('/dashboard')
      } catch (e) {
        setError(e instanceof Error ? e.message : 'Login failed')
        throw e
      }
    },
    [router]
  )

  const register = useCallback(
    async (email: string, password: string, name: string) => {
      setError(null)
      try {
        const res = await apiRegister(email, password, name)
        localStorage.setItem(ACCESS_KEY, res.accessToken)
        localStorage.setItem(REFRESH_KEY, res.refreshToken)
        setUser(res.user)
        router.push('/dashboard')
      } catch (e) {
        setError(e instanceof Error ? e.message : 'Registration failed')
        throw e
      }
    },
    [router]
  )

  const logout = useCallback(() => {
    localStorage.removeItem(ACCESS_KEY)
    localStorage.removeItem(REFRESH_KEY)
    setUser(null)
    router.push('/login')
  }, [router])

  const value = useMemo<AuthContextValue>(
    () => ({
      user,
      isLoading,
      isAuthenticated: !!user,
      login,
      register,
      logout,
      error,
      clearError,
    }),
    [user, isLoading, login, register, logout, error, clearError]
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within AuthProvider')
  return ctx
}
