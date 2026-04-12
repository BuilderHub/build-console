'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Header } from '@/components/Header'
import { Button } from '@/components/Button'
import { Card, CardHeader } from '@/components/Card'
import { FormField } from '@/components/FormField'
import { Modal } from '@/components/Modal'
import { useOrg } from '@/contexts/OrgContext'
import { useAuth } from '@/contexts/AuthContext'
import { deleteOrganization } from '@/lib/organizations-api'
import { Save, AlertCircle } from 'lucide-react'

export default function OrgSettingsPage() {
  const router = useRouter()
  const { org } = useOrg()
  const { user, isLoading: authLoading, updateProfile, error: authError, clearError } = useAuth()
  const [name, setName] = useState('')
  const [savingProfile, setSavingProfile] = useState(false)
  const [profileMessage, setProfileMessage] = useState<string | null>(null)
  const [profileError, setProfileError] = useState<string | null>(null)

  const [deleteModalOpen, setDeleteModalOpen] = useState(false)
  const [deleteConfirmName, setDeleteConfirmName] = useState('')
  const [deleteError, setDeleteError] = useState<string | null>(null)
  const [deleting, setDeleting] = useState(false)

  useEffect(() => {
    if (user) {
      setName(user.name)
    }
  }, [user])

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault()
    setProfileMessage(null)
    setProfileError(null)
    clearError()
    const trimmed = name.trim()
    if (!trimmed) {
      setProfileError('Name is required')
      return
    }
    setSavingProfile(true)
    try {
      await updateProfile(trimmed)
      setProfileMessage('Profile saved')
    } catch {
      // auth context holds API error
    } finally {
      setSavingProfile(false)
    }
  }

  const openDeleteModal = () => {
    setDeleteConfirmName('')
    setDeleteError(null)
    setDeleteModalOpen(true)
  }

  const closeDeleteModal = () => {
    setDeleteModalOpen(false)
    setDeleteConfirmName('')
    setDeleteError(null)
  }

  const handleDeleteOrganization = async () => {
    if (!org) return
    if (deleteConfirmName.trim() !== org.name.trim()) {
      setDeleteError('Type the organization name exactly to confirm.')
      return
    }
    setDeleting(true)
    setDeleteError(null)
    try {
      await deleteOrganization(org.id)
      closeDeleteModal()
      router.push('/organizations')
    } catch (e) {
      setDeleteError(e instanceof Error ? e.message : 'Failed to delete organization')
    } finally {
      setDeleting(false)
    }
  }

  if (!org) return null

  if (authLoading || !user) {
    return (
      <div className="flex min-h-[40vh] items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary-500 border-t-transparent" />
      </div>
    )
  }

  const canDelete = deleteConfirmName.trim() === org.name.trim()

  return (
    <div className="flex flex-col h-full">
      <Header title="Settings" subtitle={`Organization settings for ${org.name}`} />
      <div className="flex-1 p-8 space-y-6">
        <Card>
          <CardHeader title="Profile" subtitle="Your account (same as global account settings)" />
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
            <Button type="submit" loading={savingProfile}>
              <Save className="h-4 w-4" />
              Save Changes
            </Button>
          </form>
        </Card>
        <Card>
          <CardHeader title="Danger Zone" subtitle="Irreversible actions" />
          <div className="space-y-4">
            <div className="flex items-start gap-3 p-4 rounded-lg bg-red-950/20 border border-red-800/30">
              <AlertCircle className="h-5 w-5 text-red-400 flex-shrink-0 mt-0.5" />
              <div className="flex-1">
                <p className="text-sm font-semibold text-red-400 mb-1">Delete Organization</p>
                <p className="text-sm text-slate-400 mb-3">
                  Permanently delete {org.name}, all builders in its cluster namespace, and organization data. This cannot be undone. Only the organization owner can perform this action.
                </p>
                <Button variant="danger" size="sm" type="button" onClick={openDeleteModal}>
                  Delete Organization
                </Button>
              </div>
            </div>
          </div>
        </Card>
      </div>

      <Modal
        isOpen={deleteModalOpen}
        onClose={closeDeleteModal}
        title="Delete organization?"
        subtitle="This is permanent"
        size="sm"
      >
        <div className="space-y-4">
          <p className="text-sm text-slate-300">
            All builders, cache data in this organization&apos;s namespace, and membership will be removed. You will return to the organization list.
          </p>
          <p className="text-sm text-slate-400">
            Type <span className="font-medium text-white">{org.name}</span> to confirm.
          </p>
          <FormField
            label="Organization name"
            name="deleteConfirm"
            value={deleteConfirmName}
            onChange={(e) => {
              setDeleteConfirmName(e.target.value)
              setDeleteError(null)
            }}
            placeholder={org.name}
          />
          {deleteError && (
            <p className="text-sm text-red-400">{deleteError}</p>
          )}
          <div className="flex gap-3 pt-2">
            <Button type="button" variant="secondary" className="flex-1" onClick={closeDeleteModal}>
              Cancel
            </Button>
            <Button
              type="button"
              variant="danger"
              className="flex-1"
              loading={deleting}
              disabled={!canDelete}
              onClick={handleDeleteOrganization}
            >
              Delete forever
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  )
}
