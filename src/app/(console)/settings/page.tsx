'use client'

import { useState, useEffect } from 'react'
import { Header } from '@/components/Header'
import { Button } from '@/components/Button'
import { Card, CardHeader } from '@/components/Card'
import { FormField } from '@/components/FormField'
import { useAuth } from '@/contexts/AuthContext'
import { Save } from 'lucide-react'

export default function SettingsPage() {
  const { user, isLoading, updateProfile, error: authError, clearError } = useAuth()
  const [name, setName] = useState('')
  const [saving, setSaving] = useState(false)
  const [profileMessage, setProfileMessage] = useState<string | null>(null)
  const [profileError, setProfileError] = useState<string | null>(null)

  useEffect(() => {
    if (user) {
      setName(user.name)
    }
  }, [user])

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault()
    setProfileMessage(null)
    setProfileError(null)
    const trimmed = name.trim()
    if (!trimmed) {
      setProfileError('Name is required')
      return
    }
    setSaving(true)
    try {
      await updateProfile(trimmed)
      setProfileMessage('Profile saved')
    } catch {
      // error surfaced via context or below
    } finally {
      setSaving(false)
    }
  }

  if (isLoading || !user) {
    return (
      <div className="flex min-h-[40vh] items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary-500 border-t-transparent" />
      </div>
    )
  }

  return (
    <div className="flex flex-col h-full">
      <Header title="Settings" subtitle="Manage your account" />

      <div className="flex-1 p-8">
        <Card>
          <CardHeader title="Profile" subtitle="Update your personal information" />
          <form onSubmit={handleSaveProfile} className="space-y-6">
            <FormField
              label="Full Name"
              name="name"
              value={name}
              onChange={(e) => {
                setName(e.target.value)
                setProfileMessage(null)
                setProfileError(null)
                clearError()
              }}
              required
            />

            <FormField
              label="Email Address"
              name="email"
              type="email"
              value={user.email}
              readOnly
              hint="Email cannot be changed here"
            />

            {(profileError || authError) && (
              <p className="rounded-lg border border-red-800 bg-red-950/50 px-3 py-2 text-sm text-red-400">
                {profileError ?? authError}
              </p>
            )}
            {profileMessage && (
              <p className="rounded-lg border border-emerald-800 bg-emerald-950/50 px-3 py-2 text-sm text-emerald-400">
                {profileMessage}
              </p>
            )}

            <Button type="submit" loading={saving}>
              <Save className="h-4 w-4" />
              Save Changes
            </Button>
          </form>
        </Card>
      </div>
    </div>
  )
}
