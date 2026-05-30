'use client'

import { useState, useEffect, useCallback } from 'react'
import { Header } from '@/components/Header'
import { Button } from '@/components/Button'
import { Card } from '@/components/Card'
import { EmptyState } from '@/components/EmptyState'
import { Modal } from '@/components/Modal'
import { FormField, SelectField } from '@/components/FormField'
import { useOrg } from '@/contexts/OrgContext'
import {
  listTemplates,
  createTemplate,
  updateTemplate,
  deleteTemplate,
} from '@/lib/templates-api'
import { pluralize } from '@/lib/pluralize'
import type { BuilderTemplate, CacheType } from '@/types'
import { COMMON_BUILDKIT_IMAGES, DEFAULT_CACHE_SIZES } from '@/types'

import {
  Plus,
  MoreVertical,
  Trash2,
  Edit2,
  Layers,
  Image as ImageIcon,
  HardDrive,
} from 'lucide-react'
import clsx from 'clsx'

const CACHE_TYPE_OPTIONS: { value: CacheType; label: string }[] = [
  { value: 'pvc', label: 'Persistent Volume (PVC)' },
  { value: 'none', label: 'No cache (ephemeral)' },
  { value: 's3', label: 'S3 / Object storage' },
]

const ARCH_OPTIONS = [
  { value: '', label: 'Any (multi-arch)' },
  { value: 'amd64', label: 'amd64' },
  { value: 'arm64', label: 'arm64' },
]

export default function OrgTemplatesPage() {
  const { org } = useOrg()
  const [templates, setTemplates] = useState<BuilderTemplate[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)

  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false)
  const [isEditModalOpen, setIsEditModalOpen] = useState(false)
  const [selectedTemplate, setSelectedTemplate] = useState<BuilderTemplate | null>(null)
  const [templateToDelete, setTemplateToDelete] = useState<BuilderTemplate | null>(null)
  const [activeDropdown, setActiveDropdown] = useState<string | null>(null)

  const [formData, setFormData] = useState({
    name: '',
    buildkitImage: COMMON_BUILDKIT_IMAGES[0],
    rootless: true,
    arch: '' as '' | 'amd64' | 'arm64',
    cacheType: 'pvc' as CacheType,
    cacheSize: DEFAULT_CACHE_SIZES.medium,
    // resources (optional) - simple cpu/memory that will be applied to BOTH requests and limits
    cpu: '',
    memory: '',
  })

  const loadTemplates = useCallback(async () => {
    if (!org?.id) return
    setLoading(true)
    setError(null)
    try {
      const list = await listTemplates(org.id)
      setTemplates(list)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to load templates')
    } finally {
      setLoading(false)
    }
  }, [org?.id])

  useEffect(() => {
    loadTemplates()
  }, [loadTemplates])

  const resetForm = () => {
    setFormData({
      name: '',
      buildkitImage: COMMON_BUILDKIT_IMAGES[0],
      rootless: true,
      arch: '',
      cacheType: 'pvc',
      cacheSize: DEFAULT_CACHE_SIZES.medium,
      cpu: '',
      memory: '',
    })
  }

  const openCreate = () => {
    resetForm()
    setIsCreateModalOpen(true)
    setActiveDropdown(null)
  }

  const openEdit = (tpl: BuilderTemplate) => {
    setSelectedTemplate(tpl)
    const r = tpl.resources || {}
    // Prefill from requests (preferred) or limits. On save we will force requests == limits.
    setFormData({
      name: tpl.name,
      buildkitImage: tpl.buildkitImage,
      rootless: tpl.rootless,
      arch: tpl.arch,
      cacheType: tpl.cacheType,
      cacheSize: tpl.cacheSize || DEFAULT_CACHE_SIZES.medium,
      cpu: r.requests?.cpu || r.limits?.cpu || '',
      memory: r.requests?.memory || r.limits?.memory || '',
    })
    setIsEditModalOpen(true)
    setActiveDropdown(null)
  }

  const handleCreate = async () => {
    if (!org?.id || !formData.name.trim()) return

    setSubmitting(true)
    setError(null)
    try {
      const spec: any = {
        buildkit_image: formData.buildkitImage,
        rootless: formData.rootless,
        arch: formData.arch || undefined,
        cache_config: {
          type: formData.cacheType,
        },
      }

      if (formData.cacheType === 'pvc') {
        spec.cache_config.pvc = { size: formData.cacheSize }
      } else if (formData.cacheType === 's3') {
        // Minimal S3 for now — in real usage user would fill more fields
        spec.cache_config.s3 = { bucket: 'builder-cache' }
      }

      // Build resources (simple cpu + memory). Apply the same value to BOTH requests and limits.
      const cpu = formData.cpu?.trim()
      const memory = formData.memory?.trim()
      if (cpu || memory) {
        const resources: any = { requests: {}, limits: {} }
        if (cpu) {
          resources.requests.cpu = cpu
          resources.limits.cpu = cpu
        }
        if (memory) {
          resources.requests.memory = memory
          resources.limits.memory = memory
        }
        spec.resources = resources
      }

      const created = await createTemplate(org.id, {
        name: formData.name.trim(),
        spec,
      })

      setTemplates((prev) => [...prev, created])
      setIsCreateModalOpen(false)
      resetForm()
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to create template')
    } finally {
      setSubmitting(false)
    }
  }

  const handleUpdate = async () => {
    if (!org?.id || !selectedTemplate) return

    setSubmitting(true)
    setError(null)
    try {
      const spec: any = {
        buildkit_image: formData.buildkitImage,
        rootless: formData.rootless,
        arch: formData.arch || undefined,
        cache_config: {
          type: formData.cacheType,
        },
      }

      if (formData.cacheType === 'pvc') {
        spec.cache_config.pvc = { size: formData.cacheSize }
      }

      // Build resources (simple cpu + memory). Apply the same value to BOTH requests and limits.
      const cpu = formData.cpu?.trim()
      const memory = formData.memory?.trim()
      if (cpu || memory) {
        const resources: any = { requests: {}, limits: {} }
        if (cpu) {
          resources.requests.cpu = cpu
          resources.limits.cpu = cpu
        }
        if (memory) {
          resources.requests.memory = memory
          resources.limits.memory = memory
        }
        spec.resources = resources
      }

      const updated = await updateTemplate(org.id, selectedTemplate.name, spec)

      setTemplates((prev) =>
        prev.map((t) => (t.name === updated.name ? updated : t))
      )
      setIsEditModalOpen(false)
      setSelectedTemplate(null)
      resetForm()
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to update template')
    } finally {
      setSubmitting(false)
    }
  }

  const handleDelete = async () => {
    if (!org?.id || !templateToDelete) return

    setSubmitting(true)
    try {
      await deleteTemplate(org.id, templateToDelete.name)
      setTemplates((prev) => prev.filter((t) => t.name !== templateToDelete.name))
      setTemplateToDelete(null)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to delete template')
    } finally {
      setSubmitting(false)
    }
  }

  const closeModals = () => {
    setIsCreateModalOpen(false)
    setIsEditModalOpen(false)
    setSelectedTemplate(null)
    setTemplateToDelete(null)
    resetForm()
  }

  return (
    <div className="flex flex-col h-full">
      <Header 
        title="Templates" 
        subtitle={org ? `${templates.length} ${pluralize(templates.length, 'template', 'templates')} in ${org.name}` : ''}
        action={
          <Button onClick={openCreate}>
            <Plus className="h-4 w-4" />
            New Template
          </Button>
        }
      />

      <div className="flex-1 p-8">
        {error && (
          <div className="mb-6 rounded-lg border border-red-900/60 bg-red-950/40 px-4 py-3 text-sm text-red-400">
            {error}
          </div>
        )}

        {loading ? (
          <div className="flex h-64 items-center justify-center">
            <div className="text-slate-400">Loading templates…</div>
          </div>
        ) : templates.length === 0 ? (
          <EmptyState
            icon={Layers}
            title="No templates yet"
            description="Create your first builder template to define cache sizes, images, and scheduling rules for this organization."
            action={{
              label: 'Create your first template',
              onClick: openCreate,
            }}
          />
        ) : (
          <div className="rounded-2xl border border-slate-800 bg-slate-900/60">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-800 bg-slate-950/60 text-left text-xs font-medium uppercase tracking-wider text-slate-400">
                  <th className="px-6 py-4">Name</th>
                  <th className="px-6 py-4">Image</th>
                  <th className="px-6 py-4">Cache</th>
                  <th className="px-6 py-4">Arch</th>
                  <th className="px-6 py-4">Rootless</th>
                  <th className="w-16 px-6 py-4"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800">
                {templates.map((tpl) => (
                  <tr key={tpl.name} className="hover:bg-slate-800/40">
                    <td className="px-6 py-4 font-medium text-white">{tpl.name}</td>
                    <td className="px-6 py-4 font-mono text-xs text-slate-400">{tpl.buildkitImage}</td>
                    <td className="px-6 py-4">
                      <span className="inline-flex items-center gap-1.5 rounded-full bg-slate-800 px-2.5 py-0.5 text-xs">
                        <HardDrive className="h-3 w-3" />
                        {tpl.cacheType}
                        {tpl.cacheSize && ` · ${tpl.cacheSize}`}
                      </span>
                      {tpl.resources && ((tpl.resources.requests && Object.keys(tpl.resources.requests).length > 0) || (tpl.resources.limits && Object.keys(tpl.resources.limits).length > 0)) && (
                        <span className="ml-2 text-[10px] text-emerald-400" title="Custom resources set">⚙︎</span>
                      )}
                    </td>
                    <td className="px-6 py-4 text-slate-400">{tpl.arch || 'any'}</td>
                    <td className="px-6 py-4">
                      <span
                        className={clsx(
                          'inline-block rounded px-2 py-0.5 text-xs',
                          tpl.rootless
                            ? 'bg-emerald-900/40 text-emerald-400'
                            : 'bg-slate-800 text-slate-400'
                        )}
                      >
                        {tpl.rootless ? 'Yes' : 'No'}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="relative inline-block">
                        <button
                          onClick={() =>
                            setActiveDropdown(activeDropdown === tpl.name ? null : tpl.name)
                          }
                          className="rounded p-1.5 text-slate-400 hover:bg-slate-800 hover:text-slate-200"
                        >
                          <MoreVertical className="h-4 w-4" />
                        </button>

                        {activeDropdown === tpl.name && (
                          <div className="absolute right-full mr-2 z-10 bottom-full mb-1 w-40 overflow-hidden rounded-lg border border-slate-700 bg-slate-900 shadow-xl">
                            <button
                              onClick={() => openEdit(tpl)}
                              className="flex w-full items-center gap-2 px-4 py-2.5 text-left text-sm hover:bg-slate-800"
                            >
                              <Edit2 className="h-4 w-4" /> Edit
                            </button>
                            <button
                              onClick={() => {
                                setTemplateToDelete(tpl)
                                setActiveDropdown(null)
                              }}
                              className="flex w-full items-center gap-2 px-4 py-2.5 text-left text-sm text-red-400 hover:bg-red-950/40"
                            >
                              <Trash2 className="h-4 w-4" /> Delete
                            </button>
                          </div>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Create / Edit Modal */}
      <Modal
        isOpen={isCreateModalOpen || isEditModalOpen}
        onClose={closeModals}
        title={isEditModalOpen ? 'Edit Template' : 'Create Template'}
      >
        <div className="space-y-5">
          <FormField
            label="Template name"
            name="name"
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            placeholder="my-custom-builder"
          />

          <FormField
            label="BuildKit image"
            name="buildkitImage"
            value={formData.buildkitImage}
            onChange={(e) => setFormData({ ...formData, buildkitImage: e.target.value })}
          />

          <div className="grid grid-cols-2 gap-4">
            <SelectField
              label="Architecture"
              name="arch"
              value={formData.arch}
              onChange={(e) => setFormData({ ...formData, arch: (e.target.value || '') as any })}
              options={ARCH_OPTIONS}
            />

            <div className="flex items-end pb-1">
              <label className="flex items-center gap-2 text-sm">
                <input
                  type="checkbox"
                  checked={formData.rootless}
                  onChange={(e) => setFormData({ ...formData, rootless: e.target.checked })}
                  className="h-4 w-4 accent-primary-600"
                />
                Rootless mode
              </label>
            </div>
          </div>

          <SelectField
            label="Cache type"
            name="cacheType"
            value={formData.cacheType}
            onChange={(e) => setFormData({ ...formData, cacheType: ((e.target as HTMLSelectElement).value || 'pvc') as CacheType })}
            options={CACHE_TYPE_OPTIONS}
          />

          {formData.cacheType === 'pvc' && (
            <FormField
              label="Cache size"
              name="cacheSize"
              value={formData.cacheSize}
              onChange={(e) => setFormData({ ...formData, cacheSize: e.target.value })}
              placeholder="25Gi"
            />
          )}

          {formData.cacheType === 's3' && (
            <div className="rounded-md bg-slate-950 p-3 text-xs text-slate-400">
              S3 configuration (bucket, credentials secret) can be refined after creation via API or kubectl for now.
            </div>
          )}

          {/* Resources - simple CPU + Memory. These are applied to BOTH requests and limits on save. */}
          <div>
            <label className="block text-sm font-medium text-slate-200 mb-1">Resources (optional)</label>
            <p className="text-xs text-slate-500 mb-3">
              Specify CPU and memory. These values will be set for both requests and limits (guaranteed QoS). Leave blank for BestEffort.
            </p>
            <div className="grid grid-cols-2 gap-4">
              <FormField
                label="CPU"
                name="cpu"
                value={formData.cpu}
                onChange={(e) => setFormData({ ...formData, cpu: e.target.value })}
                placeholder="100m"
                hint="e.g. 100m, 1, 2"
              />
              <FormField
                label="Memory"
                name="memory"
                value={formData.memory}
                onChange={(e) => setFormData({ ...formData, memory: e.target.value })}
                placeholder="256Mi"
                hint="e.g. 256Mi, 1Gi, 2Gi"
              />
            </div>
          </div>
        </div>

        <div className="mt-6 flex justify-end gap-3">
          <Button variant="secondary" onClick={closeModals}>
            Cancel
          </Button>
          <Button
            onClick={isEditModalOpen ? handleUpdate : handleCreate}
            disabled={submitting || !formData.name.trim()}
          >
            {submitting ? 'Saving…' : isEditModalOpen ? 'Save changes' : 'Create template'}
          </Button>
        </div>
      </Modal>

      {/* Delete confirmation */}
      <Modal
        isOpen={!!templateToDelete}
        onClose={() => setTemplateToDelete(null)}
        title="Delete template?"
      >
        <p className="text-sm text-slate-300">
          Are you sure you want to delete <span className="font-semibold text-white">{templateToDelete?.name}</span>?
          Existing builders referencing this template will fail on their next reconcile.
        </p>
        <div className="mt-6 flex justify-end gap-3">
          <Button variant="secondary" onClick={() => setTemplateToDelete(null)}>
            Cancel
          </Button>
          <Button variant="danger" onClick={handleDelete} disabled={submitting}>
            {submitting ? 'Deleting…' : 'Delete template'}
          </Button>
        </div>
      </Modal>
    </div>
  )
}
