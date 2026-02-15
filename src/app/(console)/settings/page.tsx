'use client'

import { useState } from 'react'
import { Header } from '@/components/Header'
import { Button } from '@/components/Button'
import { Card, CardHeader } from '@/components/Card'
import { FormField, CheckboxField } from '@/components/FormField'
import { mockOrganizations } from '@/lib/mock-data'
import { Save, AlertCircle } from 'lucide-react'

export default function SettingsPage() {
  const [organization] = useState(mockOrganizations[0])
  const [profile, setProfile] = useState({
    name: 'John Doe',
    email: 'john@acme.com',
  })

  const [preferences, setPreferences] = useState({
    emailNotifications: true,
    buildFailureAlerts: true,
    weeklyReports: false,
    autoScaleBuilders: true,
  })

  const handleSaveProfile = (e: React.FormEvent) => {
    e.preventDefault()
    // Save profile logic
  }

  const handleSavePreferences = (e: React.FormEvent) => {
    e.preventDefault()
    // Save preferences logic
  }

  return (
    <div className="flex flex-col h-full">
      <Header 
        title="Settings" 
        subtitle="Manage your account and preferences"
      />
      
      <div className="flex-1 p-8 space-y-6">
        {/* Profile Settings */}
        <Card>
          <CardHeader 
            title="Profile" 
            subtitle="Update your personal information"
          />
          <form onSubmit={handleSaveProfile} className="space-y-6">
            <FormField
              label="Full Name"
              name="name"
              value={profile.name}
              onChange={(e) => setProfile({ ...profile, name: e.target.value })}
              required
            />

            <FormField
              label="Email Address"
              name="email"
              type="email"
              value={profile.email}
              onChange={(e) => setProfile({ ...profile, email: e.target.value })}
              required
            />

            <Button type="submit">
              <Save className="h-4 w-4" />
              Save Changes
            </Button>
          </form>
        </Card>

        {/* Notification Preferences */}
        <Card>
          <CardHeader 
            title="Notifications" 
            subtitle="Configure how you receive updates"
          />
          <form onSubmit={handleSavePreferences} className="space-y-6">
            <div className="space-y-4">
              <CheckboxField
                label="Email Notifications"
                name="emailNotifications"
                checked={preferences.emailNotifications}
                onChange={(e) => setPreferences({ ...preferences, emailNotifications: e.target.checked })}
                hint="Receive email notifications for important events"
              />

              <CheckboxField
                label="Build Failure Alerts"
                name="buildFailureAlerts"
                checked={preferences.buildFailureAlerts}
                onChange={(e) => setPreferences({ ...preferences, buildFailureAlerts: e.target.checked })}
                hint="Get notified immediately when a build fails"
              />

              <CheckboxField
                label="Weekly Reports"
                name="weeklyReports"
                checked={preferences.weeklyReports}
                onChange={(e) => setPreferences({ ...preferences, weeklyReports: e.target.checked })}
                hint="Receive a weekly summary of your build activity"
              />
            </div>

            <Button type="submit">
              <Save className="h-4 w-4" />
              Save Preferences
            </Button>
          </form>
        </Card>

        {/* Builder Preferences */}
        <Card>
          <CardHeader 
            title="Builder Configuration" 
            subtitle="Default settings for new builders"
          />
          <form onSubmit={handleSavePreferences} className="space-y-6">
            <CheckboxField
              label="Auto-scale Builders"
              name="autoScaleBuilders"
              checked={preferences.autoScaleBuilders}
              onChange={(e) => setPreferences({ ...preferences, autoScaleBuilders: e.target.checked })}
              hint="Automatically adjust builder capacity based on demand"
            />

            <Button type="submit">
              <Save className="h-4 w-4" />
              Save Configuration
            </Button>
          </form>
        </Card>

        {/* Danger Zone */}
        <Card>
          <CardHeader 
            title="Danger Zone" 
            subtitle="Irreversible actions"
          />
          <div className="space-y-4">
            <div className="flex items-start gap-3 p-4 rounded-lg bg-red-950/20 border border-red-800/30">
              <AlertCircle className="h-5 w-5 text-red-400 flex-shrink-0 mt-0.5" />
              <div className="flex-1">
                <p className="text-sm font-semibold text-red-400 mb-1">
                  Delete Organization
                </p>
                <p className="text-sm text-slate-400 mb-3">
                  Permanently delete {organization.name} and all associated data. This action cannot be undone.
                </p>
                <Button variant="danger" size="sm">
                  Delete Organization
                </Button>
              </div>
            </div>
          </div>
        </Card>
      </div>
    </div>
  )
}
