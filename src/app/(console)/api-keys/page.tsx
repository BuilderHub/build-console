'use client'

import { useState } from 'react'
import { Header } from '@/components/Header'
import { Button } from '@/components/Button'
import { Card } from '@/components/Card'
import { Modal } from '@/components/Modal'
import { FormField } from '@/components/FormField'
import { EmptyState } from '@/components/EmptyState'
import { Key, Plus, Copy, Trash2, Eye, EyeOff, CheckCircle } from 'lucide-react'
import { format } from 'date-fns'

interface ApiKey {
  id: string
  name: string
  key: string
  createdAt: Date
  lastUsed?: Date
}

export default function ApiKeysPage() {
  const [apiKeys, setApiKeys] = useState<ApiKey[]>([
    {
      id: 'key-1',
      name: 'Production CI/CD',
      key: 'bh_prod_a8f7sd9f8a7sdf98a7sdf',
      createdAt: new Date('2024-01-20'),
      lastUsed: new Date('2024-02-15T10:30:00'),
    },
    {
      id: 'key-2',
      name: 'Staging Environment',
      key: 'bh_stag_sd98f7sd98f7sdf98sd7f',
      createdAt: new Date('2024-02-01'),
      lastUsed: new Date('2024-02-14T16:45:00'),
    },
  ])

  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false)
  const [newKeyName, setNewKeyName] = useState('')
  const [visibleKeys, setVisibleKeys] = useState<Set<string>>(new Set())
  const [copiedKey, setCopiedKey] = useState<string | null>(null)

  const handleCreateKey = () => {
    const newKey: ApiKey = {
      id: `key-${Date.now()}`,
      name: newKeyName,
      key: `bh_${Date.now()}_${Math.random().toString(36).substring(2, 15)}`,
      createdAt: new Date(),
    }

    setApiKeys([...apiKeys, newKey])
    setIsCreateModalOpen(false)
    setNewKeyName('')
  }

  const handleDeleteKey = (id: string) => {
    setApiKeys(apiKeys.filter(k => k.id !== id))
  }

  const toggleKeyVisibility = (id: string) => {
    const newVisible = new Set(visibleKeys)
    if (newVisible.has(id)) {
      newVisible.delete(id)
    } else {
      newVisible.add(id)
    }
    setVisibleKeys(newVisible)
  }

  const copyToClipboard = (key: string, id: string) => {
    navigator.clipboard.writeText(key)
    setCopiedKey(id)
    setTimeout(() => setCopiedKey(null), 2000)
  }

  const maskKey = (key: string) => {
    const prefix = key.substring(0, 8)
    return `${prefix}${'•'.repeat(24)}`
  }

  return (
    <div className="flex flex-col h-full">
      <Header 
        title="API Keys" 
        subtitle="Manage your BuilderHub API keys"
        action={
          <Button onClick={() => setIsCreateModalOpen(true)}>
            <Plus className="h-4 w-4" />
            Create API Key
          </Button>
        }
      />
      
      <div className="flex-1 p-8">
        {apiKeys.length === 0 ? (
          <Card>
            <EmptyState
              icon={Key}
              title="No API keys yet"
              description="Create an API key to authenticate your applications and CI/CD pipelines"
              action={{
                label: 'Create API Key',
                onClick: () => setIsCreateModalOpen(true),
              }}
            />
          </Card>
        ) : (
          <Card>
            <div className="space-y-4">
              {apiKeys.map((apiKey) => (
                <div
                  key={apiKey.id}
                  className="flex items-center justify-between p-4 rounded-lg bg-slate-800/50 border border-slate-700"
                >
                  <div className="flex items-center gap-4 flex-1 min-w-0">
                    <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary-950/50 border border-primary-800">
                      <Key className="h-5 w-5 text-primary-400" />
                    </div>
                    
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-white">{apiKey.name}</p>
                      <p className="text-xs text-slate-400 font-mono mt-1">
                        {visibleKeys.has(apiKey.id) ? apiKey.key : maskKey(apiKey.key)}
                      </p>
                      <p className="text-xs text-slate-500 mt-2">
                        Created {format(apiKey.createdAt, 'MMM d, yyyy')}
                        {apiKey.lastUsed && ` • Last used ${format(apiKey.lastUsed, 'MMM d, yyyy')}`}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => toggleKeyVisibility(apiKey.id)}
                      className="rounded-lg p-2 text-slate-400 hover:bg-slate-700 hover:text-slate-200 transition-colors"
                      title={visibleKeys.has(apiKey.id) ? 'Hide key' : 'Show key'}
                    >
                      {visibleKeys.has(apiKey.id) ? (
                        <EyeOff className="h-4 w-4" />
                      ) : (
                        <Eye className="h-4 w-4" />
                      )}
                    </button>
                    
                    <button
                      onClick={() => copyToClipboard(apiKey.key, apiKey.id)}
                      className="rounded-lg p-2 text-slate-400 hover:bg-slate-700 hover:text-slate-200 transition-colors"
                      title="Copy to clipboard"
                    >
                      {copiedKey === apiKey.id ? (
                        <CheckCircle className="h-4 w-4 text-emerald-400" />
                      ) : (
                        <Copy className="h-4 w-4" />
                      )}
                    </button>
                    
                    <button
                      onClick={() => handleDeleteKey(apiKey.id)}
                      className="rounded-lg p-2 text-slate-400 hover:bg-slate-700 hover:text-red-400 transition-colors"
                      title="Delete key"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>

            <div className="mt-6 p-4 rounded-lg bg-yellow-950/20 border border-yellow-800/30">
              <p className="text-sm text-yellow-400">
                <strong>Warning:</strong> API keys provide full access to your builders. Keep them secure and never commit them to version control.
              </p>
            </div>
          </Card>
        )}
      </div>

      {/* Create Modal */}
      <Modal
        isOpen={isCreateModalOpen}
        onClose={() => {
          setIsCreateModalOpen(false)
          setNewKeyName('')
        }}
        title="Create API Key"
        subtitle="Generate a new API key for authentication"
        size="sm"
      >
        <form onSubmit={(e) => { e.preventDefault(); handleCreateKey(); }} className="space-y-6">
          <FormField
            label="Key Name"
            name="name"
            value={newKeyName}
            onChange={(e) => setNewKeyName(e.target.value)}
            placeholder="Production CI/CD"
            required
            hint="Choose a descriptive name to identify this key"
          />

          <div className="p-4 rounded-lg bg-slate-800/50 border border-slate-700">
            <p className="text-sm text-slate-400">
              The API key will be generated and displayed only once. Make sure to copy it to a secure location.
            </p>
          </div>

          <div className="flex gap-3 pt-4">
            <Button
              type="button"
              variant="secondary"
              onClick={() => {
                setIsCreateModalOpen(false)
                setNewKeyName('')
              }}
              className="flex-1"
            >
              Cancel
            </Button>
            <Button type="submit" className="flex-1">
              Create Key
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  )
}
