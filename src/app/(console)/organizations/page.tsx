'use client'

import { useState, useEffect, useCallback } from 'react'
import { Header } from '@/components/Header'
import { Button } from '@/components/Button'
import { Card } from '@/components/Card'
import { Modal } from '@/components/Modal'
import { FormField } from '@/components/FormField'
import {
  listOrganizations,
  createOrganization,
  updateOrganization,
} from '@/lib/organizations-api'
import { pluralize } from '@/lib/pluralize'
import type { Organization } from '@/types'
import Link from 'next/link'
import { Plus, Settings, Users, Box, Crown } from 'lucide-react'
import { formatDistanceToNow, isValid } from 'date-fns'

export default function OrganizationsPage() {
  const [organizations, setOrganizations] = useState<Organization[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false)
  const [isSettingsModalOpen, setIsSettingsModalOpen] = useState(false)
  const [selectedOrg, setSelectedOrg] = useState<Organization | null>(null)
  const [submitting, setSubmitting] = useState(false)

  const [formData, setFormData] = useState({
    name: '',
    slug: '',
  })

  const loadOrgs = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const list = await listOrganizations()
      setOrganizations(list)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to load organizations')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    loadOrgs()
  }, [loadOrgs])

  const handleCreateOrganization = async () => {
    setSubmitting(true)
    setError(null)
    try {
      const newOrg = await createOrganization({
        name: formData.name,
        slug: formData.slug,
      })
      setOrganizations((prev) => [...prev, newOrg])
      setIsCreateModalOpen(false)
      resetForm()
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to create organization')
    } finally {
      setSubmitting(false)
    }
  }

  const handleUpdateOrganization = async () => {
    if (!selectedOrg) return
    setSubmitting(true)
    setError(null)
    try {
      const updated = await updateOrganization(selectedOrg.id, {
        name: formData.name || undefined,
        slug: formData.slug || undefined,
      })
      setOrganizations((prev) =>
        prev.map((org) => (org.id === selectedOrg.id ? updated : org))
      )
      setIsSettingsModalOpen(false)
      setSelectedOrg(null)
      resetForm()
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to update organization')
    } finally {
      setSubmitting(false)
    }
  }

  const resetForm = () => {
    setFormData({
      name: '',
      slug: '',
    })
  }

  const openSettingsModal = (org: Organization) => {
    setError(null)
    setSelectedOrg(org)
    setFormData({
      name: org.name,
      slug: org.slug,
    })
    setIsSettingsModalOpen(true)
  }

  const openCreateModal = () => {
    setError(null)
    setIsCreateModalOpen(true)
  }

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-950">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary-500 border-t-transparent" />
      </div>
    )
  }

  return (
    <div className="flex flex-col h-full">
      <Header
        title="Organizations"
        subtitle={`${organizations.length} ${pluralize(organizations.length, 'organization', 'organizations')}`}
        action={
          <Button onClick={openCreateModal}>
            <Plus className="h-4 w-4" />
            Create Organization
          </Button>
        }
      />

      <div className="flex-1 p-8 space-y-6">
        {error && (
          <p className="rounded-lg border border-red-800 bg-red-950/50 px-3 py-2 text-sm text-red-400">
            {error}
          </p>
        )}
        {organizations.length === 0 && !error ? (
          <Card>
            <div className="py-12 text-center">
              <Crown className="mx-auto h-12 w-12 text-slate-500" />
              <p className="mt-4 text-slate-400">No organizations yet</p>
              <p className="mt-1 text-sm text-slate-500">Create one to get started</p>
              <Button onClick={openCreateModal} className="mt-6">
                <Plus className="h-4 w-4" />
                Create Organization
              </Button>
            </div>
          </Card>
        ) : null}
        {organizations.map((org) => (
          <Card key={org.id}>
            <div className="flex items-start justify-between mb-6">
              <div className="flex items-start gap-4">
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary-950/50 border border-primary-800">
                  <Crown className="h-6 w-6 text-primary-400" />
                </div>
                <div>
                  <h3 className="text-xl font-semibold text-white mb-1">
                    {org.name}
                  </h3>
                  <p className="text-sm text-slate-400">@{org.slug}</p>
                </div>
              </div>
              
              <div className="flex items-center gap-3">
                <Link href={`/org/${org.slug}/builders`}>
                  <Button size="sm">
                    <Box className="h-4 w-4" />
                    Open
                  </Button>
                </Link>
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={() => openSettingsModal(org)}
                >
                  <Settings className="h-4 w-4" />
                  Settings
                </Button>
              </div>
            </div>

            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 mb-6">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-slate-800 border border-slate-700">
                  <Box className="h-5 w-5 text-slate-400" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-white">{org.builderCount}</p>
                  <p className="text-xs text-slate-400">
                    {pluralize(org.builderCount, 'Builder', 'Builders')}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-slate-800 border border-slate-700">
                  <Users className="h-5 w-5 text-slate-400" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-white">{org.memberCount}</p>
                  <p className="text-xs text-slate-400">
                    {pluralize(org.memberCount, 'Team member', 'Team members')}
                  </p>
                </div>
              </div>
            </div>

            <p className="text-xs text-slate-500 mt-6">
              {isValid(org.createdAt) ? (
                <>Created {formatDistanceToNow(org.createdAt, { addSuffix: true })}</>
              ) : (
                <>Created date unavailable</>
              )}
            </p>
          </Card>
        ))}
      </div>

      {/* Create Modal */}
      <Modal
        isOpen={isCreateModalOpen}
        onClose={() => {
          setIsCreateModalOpen(false)
          resetForm()
        }}
        title="Create New Organization"
        subtitle="Set up a new organization for your team"
      >
        <form onSubmit={(e) => { e.preventDefault(); handleCreateOrganization(); }} className="space-y-6">
          {error && (
            <p className="rounded-lg border border-red-800 bg-red-950/50 px-3 py-2 text-sm text-red-400">
              {error}
            </p>
          )}
          <FormField
            label="Organization Name"
            name="name"
            value={formData.name}
            onChange={(e) => {
              const name = e.target.value
              const slug = name.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '')
              setFormData({ ...formData, name, slug })
            }}
            placeholder="Acme Corp"
            required
            hint="The display name for your organization"
          />

          <FormField
            label="Organization Slug"
            name="slug"
            value={formData.slug}
            onChange={(e) => setFormData({ ...formData, slug: e.target.value })}
            placeholder="acme-corp"
            required
            hint="Used in URLs and API calls"
          />

          <div className="flex gap-3 pt-4">
            <Button
              type="button"
              variant="secondary"
              onClick={() => {
                setIsCreateModalOpen(false)
                resetForm()
              }}
              className="flex-1"
            >
              Cancel
            </Button>
            <Button type="submit" className="flex-1" loading={submitting}>
              Create Organization
            </Button>
          </div>
        </form>
      </Modal>

      {/* Settings Modal */}
      <Modal
        isOpen={isSettingsModalOpen}
        onClose={() => {
          setIsSettingsModalOpen(false)
          setSelectedOrg(null)
          resetForm()
        }}
        title="Organization Settings"
        subtitle={`Update settings for ${selectedOrg?.name}`}
      >
        <form onSubmit={(e) => { e.preventDefault(); handleUpdateOrganization(); }} className="space-y-6">
          {error && (
            <p className="rounded-lg border border-red-800 bg-red-950/50 px-3 py-2 text-sm text-red-400">
              {error}
            </p>
          )}
          <FormField
            label="Organization Name"
            name="name"
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            required
          />

          <FormField
            label="Organization Slug"
            name="slug"
            value={formData.slug}
            onChange={(e) => setFormData({ ...formData, slug: e.target.value })}
            required
          />

          <div className="flex gap-3 pt-4">
            <Button
              type="button"
              variant="secondary"
              onClick={() => {
                setIsSettingsModalOpen(false)
                setSelectedOrg(null)
                resetForm()
              }}
              className="flex-1"
            >
              Cancel
            </Button>
            <Button type="submit" className="flex-1" loading={submitting}>
              Save Changes
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  )
}
