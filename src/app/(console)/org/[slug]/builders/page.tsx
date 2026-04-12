'use client'

import { useState, useEffect, useCallback } from 'react'
import { Header } from '@/components/Header'
import { Button } from '@/components/Button'
import { Card } from '@/components/Card'
import { StatusBadge } from '@/components/StatusBadge'
import { EmptyState } from '@/components/EmptyState'
import { Modal } from '@/components/Modal'
import { FormField, SelectField, CheckboxField } from '@/components/FormField'
import { useOrg } from '@/contexts/OrgContext'
import { listBuilders, createBuilder, deleteBuilder, wakeBuilder } from '@/lib/builders-api'
import { pluralize } from '@/lib/pluralize'
import { BUILDER_SIZES, REGIONS } from '@/types'
import type { Builder, BuilderSize, Region } from '@/types'

/** All builders are sleepy (scale-to-zero); no mode selection. */
const BUILDERS_MODE = 'sleepy' as const
import { 
  Plus, 
  MoreVertical, 
  Settings, 
  Trash2, 
  Play,
  Pause,
  Box,
  Cpu,
  HardDrive,
  MapPin,
  Clock
} from 'lucide-react'
import { formatDistanceToNow } from 'date-fns'
import clsx from 'clsx'

export default function OrgBuildersPage() {
  const { org } = useOrg()
  const [builders, setBuilders] = useState<Builder[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false)
  const [isEditModalOpen, setIsEditModalOpen] = useState(false)
  const [selectedBuilder, setSelectedBuilder] = useState<Builder | null>(null)
  const [builderToDelete, setBuilderToDelete] = useState<Builder | null>(null)
  const [activeDropdown, setActiveDropdown] = useState<string | null>(null)

  const [formData, setFormData] = useState({
    name: '',
    size: 'medium' as BuilderSize,
    region: 'us-east' as Region, // kept for types/edit; not shown in UI or sent on create (region disabled for now)
    maxCacheSize: 25,
    platforms: ['linux/amd64'],
  })

  const loadBuilders = useCallback(async () => {
    if (!org?.id) return
    setLoading(true)
    setError(null)
    try {
      const list = await listBuilders(org.id)
      setBuilders(list)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to load builders')
    } finally {
      setLoading(false)
    }
  }, [org?.id])

  useEffect(() => {
    loadBuilders()
  }, [loadBuilders])

  const handleCreateBuilder = async () => {
    if (!org?.id) return
    setSubmitting(true)
    setError(null)
    try {
      const created = await createBuilder(org.id, {
        name: formData.name,
        spec: {
          template_ref: `builder-${formData.size}`,
          mode: BUILDERS_MODE,
          replicas: 1,
          idle_timeout_seconds: 300,
          labels: {
            size: formData.size,
            // region: formData.region, // disabled for now; restore when region selection is needed
            maxCacheSize: String(formData.maxCacheSize),
            platform: formData.platforms.join(','),
          },
        },
      })
      setBuilders((prev) => [...prev, created])
      setIsCreateModalOpen(false)
      resetForm()
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to create builder')
    } finally {
      setSubmitting(false)
    }
  }

  const handleDeleteBuilder = async () => {
    if (!org?.id || !builderToDelete) return
    setError(null)
    try {
      await deleteBuilder(org.id, builderToDelete.name)
      setBuilders((prev) => prev.filter((b) => b.name !== builderToDelete.name))
      setBuilderToDelete(null)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to delete builder')
    }
  }

  const handleWakeBuilder = async (builder: Builder) => {
    if (!org?.id) return
    setActiveDropdown(null)
    try {
      const updated = await wakeBuilder(org.id, builder.name)
      setBuilders((prev) => prev.map((b) => (b.id === builder.id ? updated : b)))
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to wake builder')
    }
  }

  const resetForm = () => {
    setFormData({
      name: '',
      size: 'medium',
      region: 'us-east', // not shown in UI; restore when region is re-enabled
      maxCacheSize: 25,
      platforms: ['linux/amd64'],
    })
  }

  const openEditModal = (builder: Builder) => {
    setSelectedBuilder(builder)
    setFormData({
      name: builder.name,
      size: builder.size,
      region: builder.region,
      maxCacheSize: builder.maxCacheSize,
      platforms: builder.platform,
    })
    setIsEditModalOpen(true)
    setActiveDropdown(null)
  }

  if (!org) return null

  if (loading) {
    return (
      <div className="flex h-full items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary-500 border-t-transparent" />
      </div>
    )
  }

  return (
    <div className="flex flex-col h-full">
      <Header 
        title="Builders" 
        subtitle={`${builders.length} active ${pluralize(builders.length, 'builder', 'builders')}`}
        action={
          <Button onClick={() => setIsCreateModalOpen(true)}>
            <Plus className="h-4 w-4" />
            Create Builder
          </Button>
        }
      />
      
      <div className="flex-1 p-8">
        {error && (
          <p className="mb-4 rounded-lg border border-red-800 bg-red-950/50 px-3 py-2 text-sm text-red-400">
            {error}
          </p>
        )}
        {builders.length === 0 ? (
          <Card>
            <EmptyState
              icon={Box}
              title="No builders yet"
              description="Create your first builder to start building container images"
              action={{
                label: 'Create Builder',
                onClick: () => setIsCreateModalOpen(true),
              }}
            />
          </Card>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {builders.map((builder) => (
              <Card key={builder.id} className="relative">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex-1">
                    <h3 className="text-lg font-semibold text-white mb-1">
                      {builder.name}
                    </h3>
                    <StatusBadge status={builder.status} />
                  </div>
                  
                  <div className="relative">
                    <button
                      onClick={() => setActiveDropdown(activeDropdown === builder.id ? null : builder.id)}
                      className="rounded-lg p-2 text-slate-400 hover:bg-slate-800 hover:text-slate-200 transition-colors"
                    >
                      <MoreVertical className="h-4 w-4" />
                    </button>
                    
                    {activeDropdown === builder.id && (
                      <div className="absolute right-0 mt-2 w-48 rounded-lg border border-slate-800 bg-slate-900 shadow-xl z-10 py-1">
                        <button
                          onClick={() => openEditModal(builder)}
                          className="flex w-full items-center gap-2 px-4 py-2 text-sm text-slate-300 hover:bg-slate-800"
                        >
                          <Settings className="h-4 w-4" />
                          Edit Builder
                        </button>
                        <button
                          className="flex w-full items-center gap-2 px-4 py-2 text-sm text-slate-300 hover:bg-slate-800"
                        >
                          {builder.status === 'offline' ? (
                            <>
                              <Play className="h-4 w-4" />
                              Start Builder
                            </>
                          ) : (
                            <>
                              <Pause className="h-4 w-4" />
                              Stop Builder
                            </>
                          )}
                        </button>
                        <div className="my-1 h-px bg-slate-800" />
                        <button
                          onClick={() => {
                            setBuilderToDelete(builder)
                            setActiveDropdown(null)
                          }}
                          className="flex w-full items-center gap-2 px-4 py-2 text-sm text-red-400 hover:bg-slate-800"
                        >
                          <Trash2 className="h-4 w-4" />
                          Delete Builder
                        </button>
                      </div>
                    )}
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4 mb-4">
                  <div className="flex items-center gap-2 text-sm">
                    <Cpu className="h-4 w-4 text-slate-500" />
                    <span className="text-slate-400">
                      {BUILDER_SIZES[builder.size].cpu} vCPU
                    </span>
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    <HardDrive className="h-4 w-4 text-slate-500" />
                    <span className="text-slate-400">
                      {BUILDER_SIZES[builder.size].memory} GB RAM
                    </span>
                  </div>
                  {/* Region disabled for now; restore when needed
                  <div className="flex items-center gap-2 text-sm">
                    <MapPin className="h-4 w-4 text-slate-500" />
                    <span className="text-slate-400">
                      {REGIONS[builder.region]}
                    </span>
                  </div>
                  */}
                  <div className="flex items-center gap-2 text-sm">
                    <Clock className="h-4 w-4 text-slate-500" />
                    <span className="text-slate-400">
                      {builder.buildCount} builds
                    </span>
                  </div>
                </div>

                <div className="space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-slate-400">Cache Usage</span>
                    <span className="text-slate-300">
                      {builder.cacheSize.toFixed(1)} / {builder.maxCacheSize} GB
                    </span>
                  </div>
                  <div className="h-2 overflow-hidden rounded-full bg-slate-800">
                    <div
                      className={clsx(
                        'h-full rounded-full transition-all',
                        (builder.cacheSize / builder.maxCacheSize) > 0.8
                          ? 'bg-yellow-500'
                          : 'bg-primary-500'
                      )}
                      style={{ width: `${(builder.cacheSize / builder.maxCacheSize) * 100}%` }}
                    />
                  </div>
                </div>

                {builder.lastUsed && (
                  <p className="text-xs text-slate-500 mt-4">
                    Last used {formatDistanceToNow(builder.lastUsed, { addSuffix: true })}
                  </p>
                )}
              </Card>
            ))}
          </div>
        )}
      </div>

      {/* Create Modal */}
      <Modal
        isOpen={isCreateModalOpen}
        onClose={() => {
          setIsCreateModalOpen(false)
          resetForm()
        }}
        title="Create New Builder"
        subtitle="Configure your new BuildKit builder"
      >
        <form onSubmit={(e) => { e.preventDefault(); handleCreateBuilder(); }} className="space-y-6">
          {error && (
            <p className="rounded-lg border border-red-800 bg-red-950/50 px-3 py-2 text-sm text-red-400">
              {error}
            </p>
          )}
          <FormField
            label="Builder Name"
            name="name"
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            placeholder="production-builder"
            required
            hint="Choose a descriptive name for your builder"
          />

          <div className="grid grid-cols-2 gap-4">
            <SelectField
              label="Size"
              name="size"
              value={formData.size}
              onChange={(e) => setFormData({ ...formData, size: e.target.value as BuilderSize })}
              options={Object.keys(BUILDER_SIZES).map(size => ({
                value: size,
                label: `${size.charAt(0).toUpperCase() + size.slice(1)} - ${BUILDER_SIZES[size as BuilderSize].cpu} vCPU, ${BUILDER_SIZES[size as BuilderSize].memory} GB RAM`
              }))}
              required
            />

            {/* Region disabled for now; restore when needed
            <SelectField
              label="Region"
              name="region"
              value={formData.region}
              onChange={(e) => setFormData({ ...formData, region: e.target.value as Region })}
              options={Object.entries(REGIONS).map(([value, label]) => ({ value, label }))}
              required
            />
            */}
          </div>

          <FormField
            label="Max Cache Size (GB)"
            name="maxCacheSize"
            type="number"
            value={formData.maxCacheSize}
            onChange={(e) => setFormData({ ...formData, maxCacheSize: parseInt(e.target.value) })}
            required
            hint="Maximum cache storage for this builder"
          />

          <div>
            <label className="block text-sm font-medium text-slate-200 mb-3">
              Platforms
            </label>
            <div className="space-y-2">
              <CheckboxField
                label="linux/amd64"
                name="amd64"
                checked={formData.platforms.includes('linux/amd64')}
                onChange={(e) => {
                  if (e.target.checked) {
                    setFormData({ ...formData, platforms: [...formData.platforms, 'linux/amd64'] })
                  } else {
                    setFormData({ ...formData, platforms: formData.platforms.filter(p => p !== 'linux/amd64') })
                  }
                }}
              />
              <CheckboxField
                label="linux/arm64"
                name="arm64"
                checked={formData.platforms.includes('linux/arm64')}
                onChange={(e) => {
                  if (e.target.checked) {
                    setFormData({ ...formData, platforms: [...formData.platforms, 'linux/arm64'] })
                  } else {
                    setFormData({ ...formData, platforms: formData.platforms.filter(p => p !== 'linux/arm64') })
                  }
                }}
              />
            </div>
          </div>

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
              Create Builder
            </Button>
          </div>
        </form>
      </Modal>

      {/* Edit Modal - name only; size/spec updates not supported (StatefulSet spec is immutable) */}
      <Modal
        isOpen={isEditModalOpen}
        onClose={() => {
          setIsEditModalOpen(false)
          setSelectedBuilder(null)
          resetForm()
        }}
        title="Builder details"
        subtitle={selectedBuilder ? selectedBuilder.name : ''}
      >
        <div className="space-y-6">
          <FormField
            label="Builder Name"
            name="name"
            value={formData.name}
            readOnly
            hint="Name cannot be changed. Size and cache cannot be updated after creation."
          />
          <div className="flex justify-end pt-2">
            <Button
              type="button"
              onClick={() => {
                setIsEditModalOpen(false)
                setSelectedBuilder(null)
                resetForm()
              }}
            >
              Close
            </Button>
          </div>
        </div>
      </Modal>

      {/* Delete confirmation */}
      <Modal
        isOpen={builderToDelete !== null}
        onClose={() => setBuilderToDelete(null)}
        title="Delete builder"
        subtitle={builderToDelete ? `Delete ${builderToDelete.name}?` : ''}
      >
        <div className="space-y-6">
          <p className="text-sm text-slate-300">
            This action cannot be undone. The builder and its cache will be removed.
          </p>
          <div className="flex gap-3 pt-2">
            <Button
              type="button"
              variant="secondary"
              onClick={() => setBuilderToDelete(null)}
              className="flex-1"
            >
              Cancel
            </Button>
            <Button
              type="button"
              variant="danger"
              onClick={handleDeleteBuilder}
              className="flex-1"
            >
              Delete
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  )
}
