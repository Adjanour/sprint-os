import { useState } from 'react'
import { useAuth } from '../contexts/AuthContext'
import { Github, Bell, Shield, Database, Zap } from 'lucide-react'

const SettingsPage = () => {
  const { user } = useAuth()
  const [activeTab, setActiveTab] = useState('profile')

  const tabs = [
    { id: 'profile', label: 'Profile', icon: Github },
    { id: 'notifications', label: 'Notifications', icon: Bell },
    { id: 'integrations', label: 'Integrations', icon: Zap },
    { id: 'security', label: 'Security', icon: Shield },
    { id: 'data', label: 'Data', icon: Database },
  ]

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-foreground">Settings</h1>
        <p className="text-muted-foreground">Manage your SprintOS configuration</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Sidebar */}
        <div className="lg:col-span-1">
          <nav className="space-y-1">
            {tabs.map((tab) => {
              const Icon = tab.icon
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`w-full flex items-center space-x-3 px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                    activeTab === tab.id
                      ? 'bg-primary text-primary-foreground'
                      : 'text-muted-foreground hover:text-foreground hover:bg-accent'
                  }`}
                >
                  <Icon className="h-4 w-4" />
                  <span>{tab.label}</span>
                </button>
              )
            })}
          </nav>
        </div>

        {/* Content */}
        <div className="lg:col-span-3">
          <div className="bg-card border border-border rounded-lg p-6">
            {activeTab === 'profile' && (
              <div className="space-y-6">
                <div>
                  <h2 className="text-xl font-semibold text-foreground mb-4">Profile</h2>
                  <div className="space-y-4">
                    <div className="flex items-center space-x-4">
                      <div className="w-16 h-16 bg-primary rounded-full flex items-center justify-center">
                        <span className="text-2xl font-bold text-primary-foreground">
                          {user?.githubUsername?.charAt(0).toUpperCase()}
                        </span>
                      </div>
                      <div>
                        <h3 className="font-medium text-foreground">@{user?.githubUsername}</h3>
                        <p className="text-sm text-muted-foreground">GitHub User</p>
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-foreground mb-2">
                          GitHub Username
                        </label>
                        <input
                          type="text"
                          value={user?.githubUsername || ''}
                          disabled
                          className="w-full px-3 py-2 bg-muted border border-border rounded-md text-foreground"
                        />
                      </div>
                      
                      <div>
                        <label className="block text-sm font-medium text-foreground mb-2">
                          User ID
                        </label>
                        <input
                          type="text"
                          value={user?.userId || ''}
                          disabled
                          className="w-full px-3 py-2 bg-muted border border-border rounded-md text-foreground"
                        />
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'notifications' && (
              <div className="space-y-6">
                <div>
                  <h2 className="text-xl font-semibold text-foreground mb-4">Notifications</h2>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <h3 className="font-medium text-foreground">Sprint Updates</h3>
                        <p className="text-sm text-muted-foreground">Get notified when sprints start or end</p>
                      </div>
                      <input type="checkbox" className="rounded" defaultChecked />
                    </div>
                    
                    <div className="flex items-center justify-between">
                      <div>
                        <h3 className="font-medium text-foreground">Item Assignments</h3>
                        <p className="text-sm text-muted-foreground">Get notified when items are assigned to you</p>
                      </div>
                      <input type="checkbox" className="rounded" defaultChecked />
                    </div>
                    
                    <div className="flex items-center justify-between">
                      <div>
                        <h3 className="font-medium text-foreground">PR Reviews</h3>
                        <p className="text-sm text-muted-foreground">Get notified when PRs need your review</p>
                      </div>
                      <input type="checkbox" className="rounded" defaultChecked />
                    </div>
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'integrations' && (
              <div className="space-y-6">
                <div>
                  <h2 className="text-xl font-semibold text-foreground mb-4">Integrations</h2>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between p-4 border border-border rounded-lg">
                      <div className="flex items-center space-x-3">
                        <Github className="h-8 w-8 text-foreground" />
                        <div>
                          <h3 className="font-medium text-foreground">GitHub</h3>
                          <p className="text-sm text-muted-foreground">Connected and syncing</p>
                        </div>
                      </div>
                      <button className="px-3 py-1 bg-green-100 text-green-800 rounded-full text-sm font-medium">
                        Connected
                      </button>
                    </div>
                    
                    <div className="flex items-center justify-between p-4 border border-border rounded-lg">
                      <div className="flex items-center space-x-3">
                        <div className="w-8 h-8 bg-blue-500 rounded flex items-center justify-center">
                          <span className="text-white font-bold text-sm">S</span>
                        </div>
                        <div>
                          <h3 className="font-medium text-foreground">Slack</h3>
                          <p className="text-sm text-muted-foreground">Connect to Slack for notifications</p>
                        </div>
                      </div>
                      <button className="px-3 py-1 bg-secondary text-secondary-foreground rounded-full text-sm font-medium">
                        Connect
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'security' && (
              <div className="space-y-6">
                <div>
                  <h2 className="text-xl font-semibold text-foreground mb-4">Security</h2>
                  <div className="space-y-4">
                    <div>
                      <h3 className="font-medium text-foreground mb-2">Access Tokens</h3>
                      <p className="text-sm text-muted-foreground mb-4">
                        Manage your access tokens for API access
                      </p>
                      <button className="px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 transition-colors">
                        Generate New Token
                      </button>
                    </div>
                    
                    <div>
                      <h3 className="font-medium text-foreground mb-2">Sessions</h3>
                      <p className="text-sm text-muted-foreground mb-4">
                        Manage your active sessions
                      </p>
                      <div className="space-y-2">
                        <div className="flex items-center justify-between p-3 border border-border rounded-lg">
                          <div>
                            <p className="font-medium text-foreground">Current Session</p>
                            <p className="text-sm text-muted-foreground">Browser - Chrome on macOS</p>
                          </div>
                          <span className="px-2 py-1 bg-green-100 text-green-800 rounded-full text-xs font-medium">
                            Active
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'data' && (
              <div className="space-y-6">
                <div>
                  <h2 className="text-xl font-semibold text-foreground mb-4">Data Management</h2>
                  <div className="space-y-4">
                    <div>
                      <h3 className="font-medium text-foreground mb-2">Export Data</h3>
                      <p className="text-sm text-muted-foreground mb-4">
                        Download all your SprintOS data in JSON format
                      </p>
                      <button className="px-4 py-2 bg-secondary text-secondary-foreground rounded-md hover:bg-secondary/90 transition-colors">
                        Export All Data
                      </button>
                    </div>
                    
                    <div>
                      <h3 className="font-medium text-foreground mb-2">Delete Account</h3>
                      <p className="text-sm text-muted-foreground mb-4">
                        Permanently delete your SprintOS account and all associated data
                      </p>
                      <button className="px-4 py-2 bg-destructive text-destructive-foreground rounded-md hover:bg-destructive/90 transition-colors">
                        Delete Account
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

export default SettingsPage