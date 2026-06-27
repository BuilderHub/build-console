'use client'

import { useState, useEffect } from 'react'
import { Header } from '@/components/Header'
import { Button } from '@/components/Button'
import { Card, CardHeader } from '@/components/Card'
import { FormField } from '@/components/FormField'
import { useAuth } from '@/contexts/AuthContext'
import { updatePassword } from '@/lib/auth-api'
import { Save } from 'lucide-react'

export default function SettingsPage() {
  const { user, isLoading, updateProfile, error: authError, clearError } = useAuth()
  const [name, setName] = useState('')
  const [saving, setSaving] = useState(false)
  const [profileMessage, setProfileMessage] = useState<string | null>(null)
  const [profileError, setProfileError] = useState<string | null>(null)
  const [currentPassword, setCurrentPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [changing, setChanging] = useState(false)
  const [passwordMessage, setPasswordMessage] = useState<string | null>(null)
  const [passwordError, setPasswordError] = useState<string | null>(null)

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

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault()
    setPasswordMessage(null)
    setPasswordError(null)
    if (!currentPassword) {
      setPasswordError('Current password is required')
      return
    }
    if (!newPassword) {
      setPasswordError('New password is required')
      return
    }
    if (newPassword.length < 8) {
      setPasswordError('New password must be at least 8 characters')
      return
    }
    if (newPassword !== confirmPassword) {
      setPasswordError('New passwords do not match')
      return
    }
    if (newPassword === currentPassword) {
      setPasswordError('New password must be different from current password')
      return
    }
    setChanging(true)
    try {
      await updatePassword(currentPassword, newPassword)
      setCurrentPassword('')
      setNewPassword('')
      setConfirmPassword('')
      setPasswordMessage('Password updated')
    } catch (err) {
      setPasswordError(err instanceof Error ? err.message : 'Failed to update password')
    } finally {
      setChanging(false)
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

        <Card className="mt-8">
          <CardHeader title="Password" subtitle="Change your account password" />
          <form onSubmit={handleChangePassword} className="space-y-6">
            <FormField
              label="Current Password"
              name="currentPassword"
              type="password"
              value={currentPassword}
              onChange={(e) => {
                setCurrentPassword(e.target.value)
                setPasswordMessage(null)
                setPasswordError(null)
              }}
              required
            />

            <FormField
              label="New Password"
              name="newPassword"
              type="password"
              value={newPassword}
              onChange={(e) => {
                setNewPassword(e.target.value)
                setPasswordMessage(null)
                setPasswordError(null)
              }}
              hint="At least 8 characters"
              required
            />

            <FormField
              label="Confirm New Password"
              name="confirmPassword"
              type="password"
              value={confirmPassword}
              onChange={(e) => {
                setConfirmPassword(e.target.value)
                setPasswordMessage(null)
                setPasswordError(null)
              }}
              required
            />

            {passwordError && (
              <p className="rounded-lg border border-red-800 bg-red-950/50 px-3 py-2 text-sm text-red-400">
                {passwordError}
              </p>
            )}
            {passwordMessage && (
              <p className="rounded-lg border border-emerald-800 bg-emerald-950/50 px-3 py-2 text-sm text-emerald-400">
                {passwordMessage}
              </p>
            )}

            <Button type="submit" loading={changing}>
              <Save className="h-4 w-4" />
              Update Password
            </Button>
          </form>
        </Card>
      </div>
    </div>
  )
}
