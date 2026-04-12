'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Boxes } from 'lucide-react'
import { Button } from '@/components/Button'
import { FormField } from '@/components/FormField'
import { useAuth } from '@/contexts/AuthContext'

export default function SignupPage() {
  const { register, error, clearError, isAuthenticated, isLoading } = useAuth()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [name, setName] = useState('')
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    clearError()
    setLoading(true)
    try {
      await register(email.trim(), password, name.trim())
    } catch {
      // error set in context
    } finally {
      setLoading(false)
    }
  }

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-950">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary-500 border-t-transparent" />
      </div>
    )
  }

  if (isAuthenticated) {
    window.location.href = '/dashboard'
    return null
  }

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-slate-950 px-4">
      <div className="w-full max-w-md">
        <div className="mb-8 flex items-center justify-center gap-2">
          <Boxes className="h-10 w-10 text-primary-500" />
          <span className="text-2xl font-bold text-gradient">BuilderHub</span>
        </div>
        <div className="rounded-xl border border-slate-800 bg-slate-900/50 p-8 shadow-xl">
          <h1 className="mb-6 text-xl font-semibold text-slate-100">Create account</h1>
          <form onSubmit={handleSubmit} className="space-y-4">
            <FormField
              label="Name"
              name="name"
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              placeholder="Your name"
            />
            <FormField
              label="Email"
              name="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              placeholder="you@example.com"
            />
            <FormField
              label="Password"
              name="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              hint="At least 8 characters"
            />
            {error && (
              <p className="rounded-lg border border-red-800 bg-red-950/50 px-3 py-2 text-sm text-red-400">
                {error}
              </p>
            )}
            <Button type="submit" loading={loading} className="w-full">
              Create account
            </Button>
          </form>
          <p className="mt-6 text-center text-sm text-slate-400">
            Already have an account?{' '}
            <Link href="/login" className="text-primary-400 hover:text-primary-300">
              Sign in
            </Link>
          </p>
        </div>
      </div>
    </div>
  )
}
