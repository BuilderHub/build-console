'use client'

import { useCallback, useEffect, useState } from 'react'
import { Header } from '@/components/Header'
import { Button } from '@/components/Button'
import { Card } from '@/components/Card'
import { Modal } from '@/components/Modal'
import { FormField, SelectField } from '@/components/FormField'
import { EmptyState } from '@/components/EmptyState'
import { useAuth } from '@/contexts/AuthContext'
import {
  createUserApiKey,
  listUserApiKeys,
  revokeUserApiKey,
  type UserApiKey,
} from '@/lib/api-keys-api'
import { Key, Plus, Copy, Trash2, CheckCircle, AlertCircle, AlertTriangle } from 'lucide-react'
import { format } from 'date-fns'
import clsx from 'clsx'

const SCOPE_OPTIONS: { value: string; label: string; description: string }[] = [
  {
    value: 'organizations:read',
    label: 'Organizations (read)',
    description: 'List organizations and members',
  },
  {
    value: 'organizations:write',
    label: 'Organizations (write)',
    description: 'Create, update, and delete organizations',
  },
  {
    value: 'builders:read',
    label: 'Builders (read)',
    description: 'List and view builders',
  },
  {
    value: 'builders:write',
    label: 'Builders (write)',
    description: 'Create, update, delete, and wake builders',
  },
  {
    value: 'templates:read',
    label: 'Templates (read)',
    description: 'List and view builder templates',
  },
  {
    value: 'templates:write',
    label: 'Templates (write)',
    description: 'Create, update, and delete builder templates',
  },
]

const EXPIRY_OPTIONS = [
  { value: '30', label: '30 days' },
  { value: '90', label: '90 days' },
  { value: '180', label: '180 days' },
  { value: '365', label: '1 year (default)' },
  { value: '-1', label: 'Never' },
]

/** Days from now until expiry; negative if already expired. */
function daysUntilExpiry(expiresAtUnixSec: number): number {
  if (!expiresAtUnixSec) return Number.POSITIVE_INFINITY
  const ms = expiresAtUnixSec * 1000 - Date.now()
  return ms / (24 * 60 * 60 * 1000)
}

function expiryBadgeStatus(expiresAtUnixSec: number): 'expired' | 'soon' | 'ok' {
  const d = daysUntilExpiry(expiresAtUnixSec)
  if (!Number.isFinite(d)) return 'ok'
  if (d <= 0) return 'expired'
  if (d <= 7) return 'soon'
  return 'ok'
}

export default function ApiKeysPage() {
  const { user, isLoading } = useAuth()
  const [keys, setKeys] = useState<UserApiKey[]>([])
  const [listLoading, setListLoading] = useState(true)
  const [listError, setListError] = useState<string | null>(null)

  const [createOpen, setCreateOpen] = useState(false)
  const [newName, setNewName] = useState('')
  const [expiresInDays, setExpiresInDays] = useState('365')
  const [selectedScopes, setSelectedScopes] = useState<Set<string>>(new Set())
  const [creating, setCreating] = useState(false)
  const [createError, setCreateError] = useState<string | null>(null)

  const [createdToken, setCreatedToken] = useState<string | null>(null)
  /** After create: unix seconds when key expires, or 0 = never (`null` = not on success step). */
  const [createdExpiryUnix, setCreatedExpiryUnix] = useState<number | null>(null)
  const [copied, setCopied] = useState(false)

  const [keyToRevoke, setKeyToRevoke] = useState<UserApiKey | null>(null)
  const [revoking, setRevoking] = useState(false)
  const [revokeError, setRevokeError] = useState<string | null>(null)

  const loadKeys = useCallback(async () => {
    setListError(null)
    setListLoading(true)
    try {
      const list = await listUserApiKeys()
      setKeys(list)
    } catch (e) {
      setListError(e instanceof Error ? e.message : 'Failed to load API keys')
    } finally {
      setListLoading(false)
    }
  }, [])

  useEffect(() => {
    if (user) {
      void loadKeys()
    }
  }, [user, loadKeys])

  const toggleScope = (value: string) => {
    setSelectedScopes((prev) => {
      const next = new Set(prev)
      if (next.has(value)) {
        next.delete(value)
      } else {
        next.add(value)
      }
      return next
    })
  }

  const resetCreateForm = () => {
    setNewName('')
    setExpiresInDays('365')
    setSelectedScopes(new Set())
    setCreateError(null)
    setCreatedToken(null)
    setCreatedExpiryUnix(null)
    setCopied(false)
  }

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault()
    setCreateError(null)
    const name = newName.trim()
    if (!name) {
      setCreateError('Name is required')
      return
    }
    const scopes = Array.from(selectedScopes)
    if (scopes.length === 0) {
      setCreateError('Select at least one scope')
      return
    }
    setCreating(true)
    try {
      let expiryDays: number
      if (expiresInDays === '-1') {
        expiryDays = -1
      } else {
        const n = Number.parseInt(expiresInDays, 10)
        expiryDays = Number.isFinite(n) && n >= 1 && n <= 3650 ? n : 365
      }
      const { token, key } = await createUserApiKey(name, scopes, expiryDays)
      setCreatedToken(token)
      setCreatedExpiryUnix(key.expiresAt)
      await loadKeys()
    } catch (err) {
      setCreateError(err instanceof Error ? err.message : 'Failed to create API key')
    } finally {
      setCreating(false)
    }
  }

  const closeRevokeModal = () => {
    setKeyToRevoke(null)
    setRevokeError(null)
  }

  const confirmRevoke = async () => {
    if (!keyToRevoke) return
    setRevoking(true)
    setRevokeError(null)
    try {
      await revokeUserApiKey(keyToRevoke.id)
      setKeys((prev) => prev.filter((k) => k.id !== keyToRevoke.id))
      closeRevokeModal()
    } catch (e) {
      setRevokeError(e instanceof Error ? e.message : 'Failed to revoke')
    } finally {
      setRevoking(false)
    }
  }

  const copyToken = (t: string) => {
    void navigator.clipboard.writeText(t)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  if (isLoading || !user) {
    return (
      <div className="flex min-h-[40vh] items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary-500 border-t-transparent" />
      </div>
    )
  }

  return (
    <div className="flex h-full flex-col">
      <Header
        title="API keys"
        subtitle="Account-wide keys for automation and CI (scoped access)"
        action={
          <Button
            onClick={() => {
              resetCreateForm()
              setCreateOpen(true)
            }}
          >
            <Plus className="h-4 w-4" />
            Create API key
          </Button>
        }
      />

      <div className="flex-1 p-8">
        {listLoading ? (
          <div className="flex min-h-[20vh] items-center justify-center">
            <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary-500 border-t-transparent" />
          </div>
        ) : listError ? (
          <p className="rounded-lg border border-red-800 bg-red-950/50 px-3 py-2 text-sm text-red-400">{listError}</p>
        ) : keys.length === 0 ? (
          <Card>
            <EmptyState
              icon={Key}
              title="No API keys yet"
              description="Create a key with the scopes your automation needs. Keys are tied to your account, not a single organization."
              action={{
                label: 'Create API key',
                onClick: () => {
                  resetCreateForm()
                  setCreateOpen(true)
                },
              }}
            />
          </Card>
        ) : (
          <Card>
            <div className="space-y-4">
              {keys.map((k) => {
                const exp = expiryBadgeStatus(k.expiresAt)
                return (
                <div
                  key={k.id}
                  className={clsx(
                    'flex items-start justify-between gap-4 rounded-lg border p-4 bg-slate-800/50',
                    exp === 'expired' && 'border-red-900/60 bg-red-950/20',
                    exp === 'soon' && 'border-amber-900/50 bg-amber-950/15',
                    exp === 'ok' && 'border-slate-700'
                  )}
                >
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="text-sm font-semibold text-white">{k.name}</p>
                      {exp === 'expired' && (
                        <span className="inline-flex items-center gap-1 rounded border border-red-900/60 bg-red-950/40 px-1.5 py-0.5 text-xs font-medium text-red-300">
                          <AlertCircle className="h-3.5 w-3.5 shrink-0" aria-hidden />
                          Expired
                        </span>
                      )}
                      {exp === 'soon' && (
                        <span className="inline-flex items-center gap-1 rounded border border-amber-900/60 bg-amber-950/40 px-1.5 py-0.5 text-xs font-medium text-amber-200">
                          <AlertTriangle className="h-3.5 w-3.5 shrink-0" aria-hidden />
                          Expiring soon
                        </span>
                      )}
                    </div>
                    <p className="mt-1 font-mono text-xs text-slate-400">{k.keyPrefix}…</p>
                    <p className="mt-2 text-xs text-slate-500">
                      Scopes:{' '}
                      <span className="text-slate-400">{k.scopes.length ? k.scopes.join(', ') : '—'}</span>
                    </p>
                    <p className="mt-1 text-xs text-slate-500">
                      Created {k.createdAt ? format(new Date(k.createdAt * 1000), 'MMM d, yyyy') : '—'}
                      {k.lastUsedAt
                        ? ` · Last used ${format(new Date(k.lastUsedAt * 1000), 'MMM d, yyyy')}`
                        : ' · Never used'}
                    </p>
                    {k.expiresAt > 0 ? (
                      <p
                        className={clsx(
                          'mt-1 text-xs',
                          exp === 'expired' && 'text-red-400',
                          exp === 'soon' && 'text-amber-300/90',
                          exp === 'ok' && 'text-slate-500'
                        )}
                      >
                        {exp === 'expired' ? 'Expired ' : 'Expires '}
                        {format(new Date(k.expiresAt * 1000), 'MMM d, yyyy')}
                      </p>
                    ) : (
                      <p className="mt-1 text-xs text-slate-500">Never expires</p>
                    )}
                  </div>
                  <button
                    type="button"
                    onClick={() => setKeyToRevoke(k)}
                    className="shrink-0 rounded-lg p-2 text-slate-400 transition-colors hover:bg-slate-700 hover:text-red-400"
                    title="Revoke key"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
                )
              })}
            </div>
            <div className="mt-6 rounded-lg border border-amber-800/30 bg-amber-950/20 p-4">
              <p className="text-sm text-amber-200/90">
                Store keys securely. Anyone with a key can call the API within the scopes you grant.
              </p>
            </div>
          </Card>
        )}
      </div>

      <Modal
        isOpen={createOpen}
        onClose={() => {
          setCreateOpen(false)
          resetCreateForm()
        }}
        title={createdToken ? 'API key created' : 'Create API key'}
        subtitle={
          createdToken
            ? 'Copy this secret now. You will not be able to see it again.'
            : 'Choose a name and the scopes this key should have.'
        }
        size="md"
      >
        {createdToken ? (
          <div className="space-y-4">
            <div className="rounded-lg border border-slate-700 bg-slate-900/80 p-3">
              <p className="break-all font-mono text-sm text-slate-200">{createdToken}</p>
            </div>
            {createdExpiryUnix !== null ? (
              createdExpiryUnix > 0 ? (
                <p className="text-center text-sm text-slate-400">
                  Expires on {format(new Date(createdExpiryUnix * 1000), 'MMM d, yyyy')}
                </p>
              ) : (
                <p className="text-center text-sm text-slate-400">Never expires</p>
              )
            ) : null}
            <Button type="button" onClick={() => copyToken(createdToken)} className="w-full">
              {copied ? (
                <>
                  <CheckCircle className="h-4 w-4 text-emerald-400" />
                  Copied
                </>
              ) : (
                <>
                  <Copy className="h-4 w-4" />
                  Copy to clipboard
                </>
              )}
            </Button>
            <Button
              type="button"
              variant="secondary"
              className="w-full"
              onClick={() => {
                setCreateOpen(false)
                resetCreateForm()
              }}
            >
              Done
            </Button>
          </div>
        ) : (
          <form onSubmit={handleCreate} className="space-y-6">
            <FormField
              label="Key name"
              name="name"
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              placeholder="CI — production"
              required
              hint="Helps you remember where this key is used"
            />

            <SelectField
              label="Expires after"
              name="expires_in_days"
              value={expiresInDays}
              onChange={(e) => setExpiresInDays(e.target.value)}
              options={EXPIRY_OPTIONS}
              hint="The key stops accepting API requests after this date."
            />

            <fieldset className="space-y-3">
              <legend className="text-sm font-medium text-slate-300">Scopes</legend>
              <div className="space-y-2">
                {SCOPE_OPTIONS.map((opt) => (
                  <label
                    key={opt.value}
                    className="flex cursor-pointer gap-3 rounded-lg border border-slate-700/80 bg-slate-800/40 p-3 hover:bg-slate-800/70"
                  >
                    <input
                      type="checkbox"
                      className="mt-1 h-4 w-4 rounded border-slate-600 text-primary-600 focus:ring-primary-500"
                      checked={selectedScopes.has(opt.value)}
                      onChange={() => toggleScope(opt.value)}
                    />
                    <span>
                      <span className="block text-sm font-medium text-slate-200">{opt.label}</span>
                      <span className="block text-xs text-slate-500">{opt.description}</span>
                    </span>
                  </label>
                ))}
              </div>
            </fieldset>

            {createError && (
              <p className="rounded-lg border border-red-800 bg-red-950/50 px-3 py-2 text-sm text-red-400">
                {createError}
              </p>
            )}

            <div className="flex gap-3 pt-2">
              <Button
                type="button"
                variant="secondary"
                className="flex-1"
                onClick={() => {
                  setCreateOpen(false)
                  resetCreateForm()
                }}
              >
                Cancel
              </Button>
              <Button type="submit" className="flex-1" loading={creating}>
                Create
              </Button>
            </div>
          </form>
        )}
      </Modal>

      <Modal
        isOpen={keyToRevoke !== null}
        onClose={closeRevokeModal}
        title="Revoke API key"
        subtitle={keyToRevoke ? `Revoke “${keyToRevoke.name}”?` : ''}
        size="sm"
      >
        <div className="space-y-6">
          <p className="text-sm text-slate-300">
            This cannot be undone. Any automation using this key will stop working.
          </p>
          {revokeError && (
            <p className="rounded-lg border border-red-800 bg-red-950/50 px-3 py-2 text-sm text-red-400">
              {revokeError}
            </p>
          )}
          <div className="flex gap-3 pt-2">
            <Button type="button" variant="secondary" className="flex-1" onClick={closeRevokeModal}>
              Cancel
            </Button>
            <Button
              type="button"
              variant="danger"
              className="flex-1"
              loading={revoking}
              onClick={() => void confirmRevoke()}
            >
              Revoke
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  )
}
