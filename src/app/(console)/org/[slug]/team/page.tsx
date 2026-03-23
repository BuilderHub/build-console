'use client'

import { useState, useEffect, useCallback } from 'react'
import { Header } from '@/components/Header'
import { Button } from '@/components/Button'
import { Card } from '@/components/Card'
import { useOrg } from '@/contexts/OrgContext'
import { listOrganizationMembers } from '@/lib/organizations-api'
import type { Member } from '@/types'
import { UserPlus, Shield, Mail } from 'lucide-react'
import { formatDistanceToNow } from 'date-fns'

export default function OrgTeamPage() {
  const { org } = useOrg()
  const [members, setMembers] = useState<Member[]>([])
  const [membersLoading, setMembersLoading] = useState(true)
  const [membersError, setMembersError] = useState<string | null>(null)

  const loadMembers = useCallback(async () => {
    if (!org?.id) {
      setMembersLoading(false)
      return
    }
    setMembersLoading(true)
    setMembersError(null)
    try {
      setMembers(await listOrganizationMembers(org.id))
    } catch (e) {
      setMembersError(e instanceof Error ? e.message : 'Failed to load team')
      setMembers([])
    } finally {
      setMembersLoading(false)
    }
  }, [org?.id])

  useEffect(() => {
    loadMembers()
  }, [loadMembers])

  const organization = org
    ? { ...org, members }
    : { name: '', members: [] as Member[] }

  const memberInitials = (m: Member) => {
    const parts = m.name.trim().split(/\s+/).filter(Boolean)
    if (parts.length >= 2) return `${parts[0][0]}${parts[parts.length - 1][0]}`.toUpperCase()
    if (parts.length === 1 && parts[0].length > 0) return parts[0].slice(0, 2).toUpperCase()
    const e = m.email.trim()
    return e.length > 0 ? e[0].toUpperCase() : '?'
  }

  const getRoleBadgeColor = (role: string) => {
    switch (role) {
      case 'owner':
        return 'text-purple-400 bg-purple-950 border-purple-800'
      case 'admin':
        return 'text-primary-400 bg-primary-950 border-primary-800'
      default:
        return 'text-slate-400 bg-slate-900 border-slate-700'
    }
  }

  if (!org) return null

  return (
    <div className="flex flex-col h-full">
      <Header
        title="Team"
        subtitle={
          membersLoading
            ? `Loading members…`
            : `${organization.members.length} member${organization.members.length === 1 ? '' : 's'} in ${organization.name}`
        }
        action={
          <Button
            type="button"
            disabled
            title="Email invitations are not available yet."
            className="opacity-60 cursor-not-allowed"
          >
            <UserPlus className="h-4 w-4" />
            Invite Member
          </Button>
        }
      />

      <div className="flex-1 p-8">
        <Card>
          {membersError ? (
            <p className="p-4 text-sm text-red-400">{membersError}</p>
          ) : membersLoading ? (
            <p className="p-4 text-sm text-slate-400">Loading team…</p>
          ) : organization.members.length === 0 ? (
            <p className="p-4 text-sm text-slate-400">No members found.</p>
          ) : (
            <div className="divide-y divide-slate-800 px-4">
              {organization.members.map((member) => (
                <div
                  key={member.id}
                  className="flex items-center justify-between py-4 first:pt-0 last:pb-0"
                >
                  <div className="flex items-center gap-4">
                    <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary-950 border border-primary-800 text-base font-semibold text-primary-400">
                      {memberInitials(member)}
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-white">{member.name}</p>
                      <p className="text-sm text-slate-400 flex items-center gap-2 mt-0.5">
                        <Mail className="h-3.5 w-3.5" />
                        {member.email}
                      </p>
                      <p className="text-xs text-slate-500 mt-1">
                        Joined {formatDistanceToNow(member.joinedAt, { addSuffix: true })}
                      </p>
                    </div>
                  </div>

                  <span
                    className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-medium ${getRoleBadgeColor(member.role)}`}
                  >
                    <Shield className="h-3 w-3" />
                    {member.role.charAt(0).toUpperCase() + member.role.slice(1)}
                  </span>
                </div>
              ))}
            </div>
          )}
        </Card>
      </div>
    </div>
  )
}
