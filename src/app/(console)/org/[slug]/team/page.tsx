'use client'

import { useState, useEffect } from 'react'
import { Header } from '@/components/Header'
import { Button } from '@/components/Button'
import { Card } from '@/components/Card'
import { Modal } from '@/components/Modal'
import { FormField, SelectField } from '@/components/FormField'
import { useOrg } from '@/contexts/OrgContext'
import type { Member } from '@/types'
import { UserPlus, MoreVertical, Shield, Trash2, Mail } from 'lucide-react'
import { formatDistanceToNow } from 'date-fns'

export default function OrgTeamPage() {
  const { org } = useOrg()
  const [members, setMembers] = useState<Member[]>(org?.members ?? [])

  useEffect(() => {
    if (org?.members != null) setMembers(org.members)
  }, [org?.members])
  const [isInviteModalOpen, setIsInviteModalOpen] = useState(false)
  const [activeDropdown, setActiveDropdown] = useState<string | null>(null)
  const [formData, setFormData] = useState({
    email: '',
    role: 'member' as 'owner' | 'admin' | 'member',
  })

  const organization = org
    ? { ...org, members }
    : { name: '', members: [] as Member[] }

  const handleInviteMember = () => {
    const newMember: Member = {
      id: `user-${Date.now()}`,
      name: formData.email.split('@')[0],
      email: formData.email,
      role: formData.role,
      joinedAt: new Date(),
    }
    setMembers((m) => [...m, newMember])
    setIsInviteModalOpen(false)
    setFormData({ email: '', role: 'member' })
  }

  const handleRemoveMember = (memberId: string) => {
    setMembers((m) => m.filter((x) => x.id !== memberId))
    setActiveDropdown(null)
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
        subtitle={`${organization.members.length} members in ${organization.name}`}
        action={
          <Button onClick={() => setIsInviteModalOpen(true)}>
            <UserPlus className="h-4 w-4" />
            Invite Member
          </Button>
        }
      />

      <div className="flex-1 p-8">
        <Card>
          <div className="divide-y divide-slate-800">
            {organization.members.map((member) => (
              <div
                key={member.id}
                className="flex items-center justify-between py-4 first:pt-0 last:pb-0"
              >
                <div className="flex items-center gap-4">
                  <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary-950 border border-primary-800 text-base font-semibold text-primary-400">
                    {member.name.split(' ').map((n) => n[0]).join('')}
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

                <div className="flex items-center gap-3">
                  <span
                    className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-medium ${getRoleBadgeColor(member.role)}`}
                  >
                    <Shield className="h-3 w-3" />
                    {member.role.charAt(0).toUpperCase() + member.role.slice(1)}
                  </span>

                  {member.role !== 'owner' && (
                    <div className="relative">
                      <button
                        onClick={() =>
                          setActiveDropdown(activeDropdown === member.id ? null : member.id)
                        }
                        className="rounded-lg p-2 text-slate-400 hover:bg-slate-800 hover:text-slate-200 transition-colors"
                      >
                        <MoreVertical className="h-4 w-4" />
                      </button>

                      {activeDropdown === member.id && (
                        <div className="absolute right-0 mt-2 w-48 rounded-lg border border-slate-800 bg-slate-900 shadow-xl z-10 py-1">
                          <button className="flex w-full items-center gap-2 px-4 py-2 text-sm text-slate-300 hover:bg-slate-800">
                            <Shield className="h-4 w-4" />
                            Change Role
                          </button>
                          <div className="my-1 h-px bg-slate-800" />
                          <button
                            onClick={() => handleRemoveMember(member.id)}
                            className="flex w-full items-center gap-2 px-4 py-2 text-sm text-red-400 hover:bg-slate-800"
                          >
                            <Trash2 className="h-4 w-4" />
                            Remove Member
                          </button>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </Card>
      </div>

      <Modal
        isOpen={isInviteModalOpen}
        onClose={() => {
          setIsInviteModalOpen(false)
          setFormData({ email: '', role: 'member' })
        }}
        title="Invite Team Member"
        subtitle="Send an invitation to join your organization"
      >
        <form
          onSubmit={(e) => {
            e.preventDefault()
            handleInviteMember()
          }}
          className="space-y-6"
        >
          <FormField
            label="Email Address"
            name="email"
            type="email"
            value={formData.email}
            onChange={(e) => setFormData({ ...formData, email: e.target.value })}
            placeholder="colleague@example.com"
            required
            hint="They will receive an invitation email"
          />

          <SelectField
            label="Role"
            name="role"
            value={formData.role}
            onChange={(e) =>
              setFormData({ ...formData, role: e.target.value as 'owner' | 'admin' | 'member' })
            }
            options={[
              { value: 'member', label: 'Member - Can use builders' },
              { value: 'admin', label: 'Admin - Can manage builders and settings' },
              { value: 'owner', label: 'Owner - Full access' },
            ]}
            required
          />

          <div className="flex gap-3 pt-4">
            <Button
              type="button"
              variant="secondary"
              onClick={() => {
                setIsInviteModalOpen(false)
                setFormData({ email: '', role: 'member' })
              }}
              className="flex-1"
            >
              Cancel
            </Button>
            <Button type="submit" className="flex-1">
              Send Invitation
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  )
}
