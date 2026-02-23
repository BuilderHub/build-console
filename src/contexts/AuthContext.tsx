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
const USER_KEY = 'user'

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

    // Use session-stored user from fresh login/register (avoids getMe race)
    const sessionUser = sessionStorage.getItem(USER_KEY)
    if (sessionUser) {
      try {
        const u = JSON.parse(sessionUser)
        setUser(u)
        sessionStorage.removeItem(USER_KEY)
      } catch {
        sessionStorage.removeItem(USER_KEY)
      }
      setIsLoading(false)
      return
    }

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
        sessionStorage.setItem(USER_KEY, JSON.stringify(res.user))
        window.location.href = '/dashboard'
      } catch (e) {
        setError(e instanceof Error ? e.message : 'Login failed')
        throw e
      }
    },
    []
  )

  const register = useCallback(
    async (email: string, password: string, name: string) => {
      setError(null)
      try {
        const res = await apiRegister(email, password, name)
        localStorage.setItem(ACCESS_KEY, res.accessToken)
        localStorage.setItem(REFRESH_KEY, res.refreshToken)
        sessionStorage.setItem(USER_KEY, JSON.stringify(res.user))
        window.location.href = '/dashboard'
      } catch (e) {
        setError(e instanceof Error ? e.message : 'Registration failed')
        throw e
      }
    },
    []
  )

  const logout = useCallback(() => {
    localStorage.removeItem(ACCESS_KEY)
    localStorage.removeItem(REFRESH_KEY)
    sessionStorage.removeItem(USER_KEY)
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
