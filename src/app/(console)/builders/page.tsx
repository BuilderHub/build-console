'use client'

import { useState } from 'react'
import { Header } from '@/components/Header'
import { Button } from '@/components/Button'
import { Card } from '@/components/Card'
import { StatusBadge } from '@/components/StatusBadge'
import { EmptyState } from '@/components/EmptyState'
import { Modal } from '@/components/Modal'
import { FormField, SelectField, CheckboxField } from '@/components/FormField'
import { mockBuilders } from '@/lib/mock-data'
import { BUILDER_SIZES, REGIONS } from '@/types'
import type { Builder, BuilderSize, Region } from '@/types'
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

export default function BuildersPage() {
  const [builders, setBuilders] = useState<Builder[]>(mockBuilders)
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false)
  const [isEditModalOpen, setIsEditModalOpen] = useState(false)
  const [selectedBuilder, setSelectedBuilder] = useState<Builder | null>(null)
  const [activeDropdown, setActiveDropdown] = useState<string | null>(null)

  const [formData, setFormData] = useState({
    name: '',
    size: 'medium' as BuilderSize,
    region: 'us-east' as Region,
    maxCacheSize: 25,
    platforms: ['linux/amd64'],
  })

  const handleCreateBuilder = () => {
    const newBuilder: Builder = {
      id: `builder-${Date.now()}`,
      name: formData.name,
      organizationId: 'org-1',
      size: formData.size,
      region: formData.region,
      status: 'idle',
      cacheSize: 0,
      maxCacheSize: formData.maxCacheSize,
      platform: formData.platforms,
      createdAt: new Date(),
      buildCount: 0,
      totalMinutes: 0,
    }

    setBuilders([...builders, newBuilder])
    setIsCreateModalOpen(false)
    resetForm()
  }

  const handleUpdateBuilder = () => {
    if (!selectedBuilder) return

    setBuilders(builders.map(b => 
      b.id === selectedBuilder.id 
        ? { ...b, ...formData }
        : b
    ))
    setIsEditModalOpen(false)
    setSelectedBuilder(null)
    resetForm()
  }

  const handleDeleteBuilder = (id: string) => {
    setBuilders(builders.filter(b => b.id !== id))
    setActiveDropdown(null)
  }

  const resetForm = () => {
    setFormData({
      name: '',
      size: 'medium',
      region: 'us-east',
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

  const sizeConfig = BUILDER_SIZES[formData.size]

  return (
    <div className="flex flex-col h-full">
      <Header 
        title="Builders" 
        subtitle={`${builders.length} active builders`}
        action={
          <Button onClick={() => setIsCreateModalOpen(true)}>
            <Plus className="h-4 w-4" />
            Create Builder
          </Button>
        }
      />
      
      <div className="flex-1 p-8">
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
                          onClick={() => handleDeleteBuilder(builder.id)}
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
                  <div className="flex items-center gap-2 text-sm">
                    <MapPin className="h-4 w-4 text-slate-500" />
                    <span className="text-slate-400">
                      {REGIONS[builder.region]}
                    </span>
                  </div>
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

            <SelectField
              label="Region"
              name="region"
              value={formData.region}
              onChange={(e) => setFormData({ ...formData, region: e.target.value as Region })}
              options={Object.entries(REGIONS).map(([value, label]) => ({ value, label }))}
              required
            />
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

          <div className="rounded-lg bg-slate-800/50 border border-slate-700 p-4">
            <div className="flex items-center justify-between text-sm mb-2">
              <span className="text-slate-400">Estimated Cost</span>
              <span className="text-white font-semibold">
                ${sizeConfig.price.toFixed(2)}/min
              </span>
            </div>
            <p className="text-xs text-slate-500">
              Based on {sizeConfig.cpu} vCPU and {sizeConfig.memory} GB RAM
            </p>
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
            <Button type="submit" className="flex-1">
              Create Builder
            </Button>
          </div>
        </form>
      </Modal>

      {/* Edit Modal */}
      <Modal
        isOpen={isEditModalOpen}
        onClose={() => {
          setIsEditModalOpen(false)
          setSelectedBuilder(null)
          resetForm()
        }}
        title="Edit Builder"
        subtitle={`Update configuration for ${selectedBuilder?.name}`}
      >
        <form onSubmit={(e) => { e.preventDefault(); handleUpdateBuilder(); }} className="space-y-6">
          <FormField
            label="Builder Name"
            name="name"
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            required
          />

          <div className="grid grid-cols-2 gap-4">
            <SelectField
              label="Size"
              name="size"
              value={formData.size}
              onChange={(e) => setFormData({ ...formData, size: e.target.value as BuilderSize })}
              options={Object.keys(BUILDER_SIZES).map(size => ({
                value: size,
                label: `${size.charAt(0).toUpperCase() + size.slice(1)} - ${BUILDER_SIZES[size as BuilderSize].cpu} vCPU`
              }))}
              required
            />

            <SelectField
              label="Region"
              name="region"
              value={formData.region}
              onChange={(e) => setFormData({ ...formData, region: e.target.value as Region })}
              options={Object.entries(REGIONS).map(([value, label]) => ({ value, label }))}
              required
            />
          </div>

          <FormField
            label="Max Cache Size (GB)"
            name="maxCacheSize"
            type="number"
            value={formData.maxCacheSize}
            onChange={(e) => setFormData({ ...formData, maxCacheSize: parseInt(e.target.value) })}
            required
          />

          <div className="flex gap-3 pt-4">
            <Button
              type="button"
              variant="secondary"
              onClick={() => {
                setIsEditModalOpen(false)
                setSelectedBuilder(null)
                resetForm()
              }}
              className="flex-1"
            >
              Cancel
            </Button>
            <Button type="submit" className="flex-1">
              Save Changes
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  )
}
