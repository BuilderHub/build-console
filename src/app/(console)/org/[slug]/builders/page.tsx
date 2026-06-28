'use client'

import { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { Header } from '@/components/Header'
import { Button } from '@/components/Button'
import { Card } from '@/components/Card'
import { StatusBadge } from '@/components/StatusBadge'
import { EmptyState } from '@/components/EmptyState'
import { Modal } from '@/components/Modal'
import { FormField, SelectField, CheckboxField } from '@/components/FormField'
import { useOrg } from '@/contexts/OrgContext'
import { listBuilders, createBuilder, deleteBuilder, wakeBuilder, generateBuilderCredentials, type BuilderCredentials } from '@/lib/builders-api'
import { createZip } from '@/lib/zip'
import { listTemplates, createTemplate } from '@/lib/templates-api'
import { pluralize } from '@/lib/pluralize'
import { BUILDER_SIZES, REGIONS } from '@/types'
import type { Builder, BuilderSize, Region, BuilderTemplate } from '@/types'

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
  Clock,
  Globe,
  Download,
  KeyRound,
  Copy
} from 'lucide-react'
import { formatDistanceToNow } from 'date-fns'
import clsx from 'clsx'

function downloadBlob(filename: string, blob: Blob) {
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  URL.revokeObjectURL(url)
}

function buildxCommand(builderName: string, creds: BuilderCredentials): string {
  return [
    `docker buildx create --name builderhub-${builderName} \\`,
    `  --driver remote \\`,
    `  --driver-opt cacert="$PWD/ca.pem" \\`,
    `  --driver-opt cert="$PWD/client-cert.pem" \\`,
    `  --driver-opt key="$PWD/client-key.pem" \\`,
    `  --driver-opt servername="${creds.serverName}" \\`,
    `  ${creds.endpoint}`,
  ].join('\n')
}

export default function OrgBuildersPage() {
  const { org } = useOrg()
  const router = useRouter()
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
    mode: 'sleepy' as 'sleepy' | 'persistent',
    expose: false,
  })

  const [availableTemplates, setAvailableTemplates] = useState<BuilderTemplate[]>([])
  const [selectedTemplateRef, setSelectedTemplateRef] = useState<string>('')

  const [credsModalOpen, setCredsModalOpen] = useState(false)
  const [credsBuilder, setCredsBuilder] = useState<Builder | null>(null)
  const [creds, setCreds] = useState<BuilderCredentials | null>(null)
  const [credsLoading, setCredsLoading] = useState(false)
  const [credsError, setCredsError] = useState<string | null>(null)

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

  const loadAvailableTemplates = useCallback(async () => {
    if (!org?.id) return
    try {
      const list = await listTemplates(org.id)
      setAvailableTemplates(list)
    } catch (e) {
      // Non-fatal - user can still use size presets which map to standard templates
      console.warn('Could not load custom templates for builder creation', e)
    }
  }, [org?.id])

  useEffect(() => {
    loadBuilders()
    loadAvailableTemplates()
  }, [loadBuilders, loadAvailableTemplates])

  const handleCreateBuilder = async () => {
    if (!org?.id) return
    if (!selectedTemplateRef) {
      setError('Please select a template')
      return
    }
    setSubmitting(true)
    setError(null)
    try {
      const labels: Record<string, string> = {}

      // Pull the actual CPU/memory from the selected template so the builder
      // cards show the correct values instead of always falling back to size presets.
      if (selectedTemplateRef) {
        const tpl = availableTemplates.find(t => t.name === selectedTemplateRef)
        if (tpl?.resources) {
          const cpu = tpl.resources.requests?.cpu || tpl.resources.limits?.cpu
          const mem = tpl.resources.requests?.memory || tpl.resources.limits?.memory
          if (cpu) labels.cpu = cpu
          if (mem) labels.memory = mem
        }
      }

      const spec: any = {
        template_ref: selectedTemplateRef,
        mode: formData.mode,
        replicas: 1,
        expose: formData.expose,
        ...(Object.keys(labels).length > 0 ? { labels } : {}),
      }

      // Only send idle timeout for sleepy mode. Persistent should stay running.
      if (formData.mode === 'sleepy') {
        spec.idle_timeout_seconds = 300
      }

      const created = await createBuilder(org.id, {
        name: formData.name,
        spec,
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

  const handleOpenCredentials = (builder: Builder) => {
    setActiveDropdown(null)
    setCredsBuilder(builder)
    setCreds(null)
    setCredsError(null)
    setCredsModalOpen(true)
  }

  const handleMintCredentials = async () => {
    if (!org?.id || !credsBuilder) return
    setCreds(null)
    setCredsError(null)
    setCredsLoading(true)
    try {
      const c = await generateBuilderCredentials(org.id, credsBuilder.name)
      setCreds(c)
    } catch (e) {
      setCredsError(e instanceof Error ? e.message : 'Failed to generate credentials')
    } finally {
      setCredsLoading(false)
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
    // Optimistic update: mark as building while the operator scales it up
    setBuilders((prev) =>
      prev.map((b) =>
        b.id === builder.id ? { ...b, status: 'building' as const } : b
      )
    )
    try {
      await wakeBuilder(org.id, builder.name)
      // Re-fetch the full list. The wake endpoint patches the annotation;
      // the actual scale-up and status (phase/endpoint) is done asynchronously
      // by the operator, so a fresh list gives the most accurate current state.
      await loadBuilders()
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to wake builder')
      // On error, reload to get correct state
      await loadBuilders()
    }
  }

  const resetForm = () => {
    setFormData({
      name: '',
      mode: 'sleepy',
      expose: false,
    })
    const customTemplates = availableTemplates.filter(t => !Object.keys(BUILDER_SIZES).some(size => t.name === `builder-${size}`))
    setSelectedTemplateRef(customTemplates.length > 0 ? customTemplates[0].name : '')
  }

  const openEditModal = (builder: Builder) => {
    setSelectedBuilder(builder)
    setFormData({
      name: builder.name,
      mode: 'sleepy', // not editable in this view; shown for reference
      expose: builder.expose ?? false,
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

  // Resolve the best CPU/memory values to display for a builder.
  // Priority: 1. Snapshot on the builder (labels at creation time)
  //           2. Resolve from the referenced template (live from template definition)
  //           3. Fall back to the size preset
  const getBuilderResources = (b: Builder) => {
    if (b.cpu && b.memory) {
      return { cpu: b.cpu, memory: b.memory }
    }
    if (b.templateRef) {
      const tpl = availableTemplates.find(t => t.name === b.templateRef)
      if (tpl?.resources) {
        const cpu = tpl.resources.requests?.cpu || tpl.resources.limits?.cpu
        const mem = tpl.resources.requests?.memory || tpl.resources.limits?.memory
        if (cpu && mem) {
          return { cpu, memory: mem }
        }
      }
    }
    return {
      cpu: BUILDER_SIZES[b.size].cpu,
      memory: BUILDER_SIZES[b.size].memory,
    }
  }

  return (
    <div className="flex flex-col h-full">
      <Header 
        title="Builders" 
        subtitle={`${builders.length} active ${pluralize(builders.length, 'builder', 'builders')}`}
        action={
          <Button onClick={() => { resetForm(); setIsCreateModalOpen(true) }}>
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
                onClick: () => { resetForm(); setIsCreateModalOpen(true) },
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
                    {builder.mode && (
                      <span className="ml-2 align-middle text-[10px] rounded bg-slate-800 px-1.5 py-0.5 text-slate-400">{builder.mode}</span>
                    )}
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
                        {builder.mode === 'sleepy' && builder.status === 'offline' && (
                          <button
                            onClick={() => handleWakeBuilder(builder)}
                            className="flex w-full items-center gap-2 px-4 py-2 text-sm text-slate-300 hover:bg-slate-800"
                          >
                            <Play className="h-4 w-4" />
                            Wake Builder
                          </button>
                        )}
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
                  {(() => {
                    const res = getBuilderResources(builder)
                    return (
                      <>
                        <div className="flex items-center gap-2 text-sm">
                          <Cpu className="h-4 w-4 text-slate-500" />
                          <span className="text-slate-400">{res.cpu}</span>
                        </div>
                        <div className="flex items-center gap-2 text-sm">
                          <HardDrive className="h-4 w-4 text-slate-500" />
                          <span className="text-slate-400">{res.memory}</span>
                        </div>
                      </>
                    )
                  })()}
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

                {builder.expose && (
                  <div className="mt-4 rounded-lg border border-slate-800 bg-slate-950 px-3 py-2">
                    <div className="flex items-center gap-2 text-xs font-medium text-slate-300">
                      <Globe className="h-3.5 w-3.5 text-slate-500" />
                      Public endpoint
                    </div>
                    {builder.externalEndpoint ? (
                      <code className="mt-1 block break-all text-xs text-primary-400">
                        {builder.externalEndpoint}
                      </code>
                    ) : (
                      <p className="mt-1 text-xs text-slate-500">Provisioning DNS and ingress…</p>
                    )}
                    <button
                      type="button"
                      onClick={() => handleOpenCredentials(builder)}
                      className="mt-2 inline-flex items-center gap-1.5 rounded-md border border-slate-700 bg-slate-900 px-2.5 py-1 text-xs font-medium text-slate-200 hover:border-primary-600 hover:text-primary-300"
                    >
                      <KeyRound className="h-3.5 w-3.5" />
                      Get buildx credentials
                    </button>
                  </div>
                )}

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



          {availableTemplates.length === 0 ? (
            <div className="rounded-lg border border-slate-700 bg-slate-950 p-4 text-center space-y-3">
              <p className="text-sm text-slate-300">No templates yet.</p>
              <p className="text-xs text-slate-500">
                Templates define the BuildKit image, cache, resources and other settings.
                You must create at least one template before you can create builders.
              </p>
              <Button
                type="button"
                variant="secondary"
                onClick={() => {
                  setIsCreateModalOpen(false)
                  resetForm()
                  if (org?.slug) {
                    router.push(`/org/${org.slug}/templates`)
                  }
                }}
              >
                Create your first template
              </Button>
            </div>
          ) : (
            <>
              <SelectField
                label="Template"
                name="template"
                value={selectedTemplateRef}
                onChange={(e) => setSelectedTemplateRef(e.target.value)}
                options={[
                  { value: '', label: '— Select a template —' },
                  ...availableTemplates
                    .filter(t => !Object.keys(BUILDER_SIZES).some(size => t.name === `builder-${size}`))
                    .map(t => ({
                      value: t.name,
                      label: t.name
                    }))
                ]}
                required
                hint="Builders created from a template inherit its image, cache, resources, and scheduling settings."
              />

              <SelectField
                label="Mode"
                name="mode"
                value={formData.mode}
                onChange={(e) => setFormData({ ...formData, mode: e.target.value as 'sleepy' | 'persistent' })}
                options={[
                  { value: 'sleepy', label: 'Sleepy — scale to zero when idle (recommended)' },
                  { value: 'persistent', label: 'Persistent — always running' },
                ]}
                hint="Sleepy scales to zero after idle. Persistent keeps the builder running."
              />

              <CheckboxField
                label="Expose to the internet"
                name="expose"
                checked={formData.expose}
                onChange={(e) => setFormData({ ...formData, expose: e.target.checked })}
                hint="Publishes the builder through the ingress controller at <builder>-<arch>.<org>.<domain>. A public DNS record is created automatically."
              />
            </>
          )}

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

      {/* buildx credentials */}
      <Modal
        isOpen={credsModalOpen}
        onClose={() => {
          setCredsModalOpen(false)
          setCreds(null)
          setCredsBuilder(null)
          setCredsError(null)
        }}
        title="Connect with buildx"
        subtitle={credsBuilder ? credsBuilder.name : ''}
      >
        <div className="space-y-5">
          {credsLoading && (
            <p className="text-sm text-slate-400">Minting client certificate…</p>
          )}
          {credsError && (
            <p className="rounded-lg border border-red-800 bg-red-950/50 px-3 py-2 text-sm text-red-400">
              {credsError}
            </p>
          )}
          {!creds && !credsLoading && (
            <div>
              <p className="text-sm text-slate-300">
                Generate a new mutual-TLS client certificate to connect to this builder with buildx.
              </p>
              <p className="mt-1 text-xs text-slate-500">
                Each click issues a fresh 90-day certificate that is shown only once — download the files
                before closing. Previously downloaded certificates keep working until they expire.
              </p>
              <Button type="button" className="mt-3" onClick={handleMintCredentials}>
                <KeyRound className="mr-1.5 h-3.5 w-3.5" />
                {credsError ? 'Generate new credentials' : 'Generate credentials'}
              </Button>
            </div>
          )}
          {creds && !credsLoading && (
            <>
              <div>
                <p className="text-sm font-medium text-slate-200">1. Download your mutual-TLS credentials</p>
                <p className="mt-1 text-xs text-slate-500">
                  Keep these private. The client certificate expires{' '}
                  {creds.expiresAt ? formatDistanceToNow(new Date(creds.expiresAt * 1000), { addSuffix: true }) : 'in 90 days'}.
                </p>
                <div className="mt-2">
                  <Button
                    type="button"
                    variant="secondary"
                    onClick={() =>
                      downloadBlob(
                        `builderhub-${credsBuilder?.name ?? 'builder'}-mtls.zip`,
                        createZip([
                          { name: 'ca.pem', content: creds.caPem },
                          { name: 'client-cert.pem', content: creds.clientCertPem },
                          { name: 'client-key.pem', content: creds.clientKeyPem },
                        ])
                      )
                    }
                  >
                    <Download className="mr-1.5 h-3.5 w-3.5" /> Download credentials (.zip)
                  </Button>
                </div>
              </div>

              <div>
                <p className="text-sm font-medium text-slate-200">2. Create the remote builder</p>
                <p className="mt-1 text-xs text-slate-500">
                  Unzip the archive, then run this from the folder containing the three files.
                </p>
                <div className="mt-2 rounded-lg border border-slate-800 bg-slate-950 p-3">
                  <pre className="overflow-x-auto whitespace-pre text-xs text-primary-300">{buildxCommand(credsBuilder?.name ?? 'builder', creds)}</pre>
                </div>
                <button
                  type="button"
                  onClick={() => navigator.clipboard?.writeText(buildxCommand(credsBuilder?.name ?? 'builder', creds))}
                  className="mt-2 inline-flex items-center gap-1.5 text-xs text-slate-400 hover:text-primary-300"
                >
                  <Copy className="h-3.5 w-3.5" /> Copy command
                </button>
              </div>

              <div>
                <p className="text-sm font-medium text-slate-200">3. Build</p>
                <div className="mt-2 rounded-lg border border-slate-800 bg-slate-950 p-3">
                  <pre className="overflow-x-auto whitespace-pre text-xs text-primary-300">{`docker buildx build --builder builderhub-${credsBuilder?.name ?? 'builder'} -t myimage --push .`}</pre>
                </div>
              </div>
            </>
          )}
          <div className="flex justify-end pt-1">
            <Button
              type="button"
              onClick={() => {
                setCredsModalOpen(false)
                setCreds(null)
                setCredsBuilder(null)
                setCredsError(null)
              }}
            >
              Close
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  )
}
