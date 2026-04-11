'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Header } from '@/components/Header'
import { Button } from '@/components/Button'
import { Card, CardHeader } from '@/components/Card'
import { FormField, CheckboxField } from '@/components/FormField'
import { Modal } from '@/components/Modal'
import { useOrg } from '@/contexts/OrgContext'
import { deleteOrganization } from '@/lib/organizations-api'
import { Save, AlertCircle } from 'lucide-react'

export default function OrgSettingsPage() {
  const router = useRouter()
  const { org } = useOrg()
  const [profile, setProfile] = useState({ name: 'John Doe', email: 'john@acme.com' })
  const [preferences, setPreferences] = useState({
    emailNotifications: true,
    buildFailureAlerts: true,
    weeklyReports: false,
    autoScaleBuilders: true,
  })
  const [deleteModalOpen, setDeleteModalOpen] = useState(false)
  const [deleteConfirmName, setDeleteConfirmName] = useState('')
  const [deleteError, setDeleteError] = useState<string | null>(null)
  const [deleting, setDeleting] = useState(false)

  const handleSaveProfile = (e: React.FormEvent) => {
    e.preventDefault()
  }

  const handleSavePreferences = (e: React.FormEvent) => {
    e.preventDefault()
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

  const canDelete = deleteConfirmName.trim() === org.name.trim()

  return (
    <div className="flex flex-col h-full">
      <Header title="Settings" subtitle={`Organization and preferences for ${org.name}`} />
      <div className="flex-1 p-8 space-y-6">
        <Card>
          <CardHeader title="Profile" subtitle="Update your personal information" />
          <form onSubmit={handleSaveProfile} className="space-y-6">
            <FormField label="Full Name" name="name" value={profile.name} onChange={(e) => setProfile({ ...profile, name: e.target.value })} required />
            <FormField label="Email Address" name="email" type="email" value={profile.email} onChange={(e) => setProfile({ ...profile, email: e.target.value })} required />
            <Button type="submit">
              <Save className="h-4 w-4" />
              Save Changes
            </Button>
          </form>
        </Card>
        <Card>
          <CardHeader title="Notifications" subtitle="Configure how you receive updates" />
          <form onSubmit={handleSavePreferences} className="space-y-6">
            <div className="space-y-4">
              <CheckboxField label="Email Notifications" name="emailNotifications" checked={preferences.emailNotifications} onChange={(e) => setPreferences({ ...preferences, emailNotifications: e.target.checked })} hint="Receive email notifications for important events" />
              <CheckboxField label="Build Failure Alerts" name="buildFailureAlerts" checked={preferences.buildFailureAlerts} onChange={(e) => setPreferences({ ...preferences, buildFailureAlerts: e.target.checked })} hint="Get notified immediately when a build fails" />
              <CheckboxField label="Weekly Reports" name="weeklyReports" checked={preferences.weeklyReports} onChange={(e) => setPreferences({ ...preferences, weeklyReports: e.target.checked })} hint="Receive a weekly summary of your build activity" />
            </div>
            <Button type="submit">
              <Save className="h-4 w-4" />
              Save Preferences
            </Button>
          </form>
        </Card>
        <Card>
          <CardHeader title="Builder Configuration" subtitle="Default settings for new builders" />
          <form onSubmit={handleSavePreferences} className="space-y-6">
            <CheckboxField label="Auto-scale Builders" name="autoScaleBuilders" checked={preferences.autoScaleBuilders} onChange={(e) => setPreferences({ ...preferences, autoScaleBuilders: e.target.checked })} hint="Automatically adjust builder capacity based on demand" />
            <Button type="submit">
              <Save className="h-4 w-4" />
              Save Configuration
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
