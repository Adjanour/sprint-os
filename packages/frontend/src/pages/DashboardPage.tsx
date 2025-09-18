import { useQuery } from '@tanstack/react-query'
import { Link } from 'react-router-dom'
import { Plus, TrendingUp, Clock, CheckCircle } from 'lucide-react'
import axios from 'axios'

interface Sprint {
  id: number
  title: string
  startDate: string
  endDate: string
  goal: string
  state: 'planned' | 'active' | 'closed'
  stats: {
    total: number
    completed: number
    inProgress: number
    backlog: number
  }
}

interface OverviewMetrics {
  activeSprints: number
  totalItems: number
  completedThisWeek: number
  totalRepos: number
}

const DashboardPage = () => {
  const { data: sprints = [], isLoading: sprintsLoading } = useQuery<Sprint[]>({
    queryKey: ['sprints'],
    queryFn: async () => {
      const response = await axios.get('/sprints')
      return response.data
    }
  })

  const { data: metrics, isLoading: metricsLoading } = useQuery<OverviewMetrics>({
    queryKey: ['analytics-overview'],
    queryFn: async () => {
      const response = await axios.get('/analytics/overview')
      return response.data.overview
    }
  })

  const activeSprints = sprints.filter(sprint => sprint.state === 'active')
  const plannedSprints = sprints.filter(sprint => sprint.state === 'planned')

  if (sprintsLoading || metricsLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold text-foreground">Dashboard</h1>
        <Link
          to="/sprints"
          className="flex items-center space-x-2 bg-primary text-primary-foreground px-4 py-2 rounded-md hover:bg-primary/90 transition-colors"
        >
          <Plus className="h-4 w-4" />
          <span>New Sprint</span>
        </Link>
      </div>

      {/* Metrics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-card p-6 rounded-lg border border-border">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-muted-foreground">Active Sprints</p>
              <p className="text-2xl font-bold text-foreground">{metrics?.activeSprints || 0}</p>
            </div>
            <TrendingUp className="h-8 w-8 text-primary" />
          </div>
        </div>

        <div className="bg-card p-6 rounded-lg border border-border">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-muted-foreground">Total Items</p>
              <p className="text-2xl font-bold text-foreground">{metrics?.totalItems || 0}</p>
            </div>
            <CheckCircle className="h-8 w-8 text-green-500" />
          </div>
        </div>

        <div className="bg-card p-6 rounded-lg border border-border">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-muted-foreground">Completed This Week</p>
              <p className="text-2xl font-bold text-foreground">{metrics?.completedThisWeek || 0}</p>
            </div>
            <Clock className="h-8 w-8 text-blue-500" />
          </div>
        </div>

        <div className="bg-card p-6 rounded-lg border border-border">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-muted-foreground">Connected Repos</p>
              <p className="text-2xl font-bold text-foreground">{metrics?.totalRepos || 0}</p>
            </div>
            <TrendingUp className="h-8 w-8 text-purple-500" />
          </div>
        </div>
      </div>

      {/* Active Sprints */}
      {activeSprints.length > 0 && (
        <div className="bg-card p-6 rounded-lg border border-border">
          <h2 className="text-xl font-semibold text-foreground mb-4">Active Sprints</h2>
          <div className="space-y-4">
            {activeSprints.map((sprint) => (
              <Link
                key={sprint.id}
                to={`/sprints/${sprint.id}`}
                className="block p-4 border border-border rounded-lg hover:bg-accent transition-colors"
              >
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="font-medium text-foreground">{sprint.title}</h3>
                    <p className="text-sm text-muted-foreground">{sprint.goal}</p>
                  </div>
                  <div className="text-right">
                    <div className="text-sm font-medium text-foreground">
                      {sprint.stats.completed}/{sprint.stats.total} completed
                    </div>
                    <div className="w-32 bg-secondary rounded-full h-2 mt-1">
                      <div
                        className="bg-primary h-2 rounded-full"
                        style={{
                          width: `${sprint.stats.total > 0 ? (sprint.stats.completed / sprint.stats.total) * 100 : 0}%`
                        }}
                      />
                    </div>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </div>
      )}

      {/* Planned Sprints */}
      {plannedSprints.length > 0 && (
        <div className="bg-card p-6 rounded-lg border border-border">
          <h2 className="text-xl font-semibold text-foreground mb-4">Planned Sprints</h2>
          <div className="space-y-4">
            {plannedSprints.map((sprint) => (
              <Link
                key={sprint.id}
                to={`/sprints/${sprint.id}`}
                className="block p-4 border border-border rounded-lg hover:bg-accent transition-colors"
              >
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="font-medium text-foreground">{sprint.title}</h3>
                    <p className="text-sm text-muted-foreground">{sprint.goal}</p>
                    <p className="text-xs text-muted-foreground">
                      {new Date(sprint.startDate).toLocaleDateString()} - {new Date(sprint.endDate).toLocaleDateString()}
                    </p>
                  </div>
                  <div className="text-right">
                    <div className="text-sm font-medium text-muted-foreground">
                      {sprint.stats.total} items planned
                    </div>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </div>
      )}

      {/* Quick Actions */}
      <div className="bg-card p-6 rounded-lg border border-border">
        <h2 className="text-xl font-semibold text-foreground mb-4">Quick Actions</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Link
            to="/sprints"
            className="p-4 border border-border rounded-lg hover:bg-accent transition-colors text-center"
          >
            <Plus className="h-8 w-8 text-primary mx-auto mb-2" />
            <p className="font-medium text-foreground">Create Sprint</p>
            <p className="text-sm text-muted-foreground">Plan your next sprint</p>
          </Link>
          
          <Link
            to="/analytics"
            className="p-4 border border-border rounded-lg hover:bg-accent transition-colors text-center"
          >
            <TrendingUp className="h-8 w-8 text-primary mx-auto mb-2" />
            <p className="font-medium text-foreground">View Analytics</p>
            <p className="text-sm text-muted-foreground">Track your progress</p>
          </Link>
          
          <Link
            to="/settings"
            className="p-4 border border-border rounded-lg hover:bg-accent transition-colors text-center"
          >
            <CheckCircle className="h-8 w-8 text-primary mx-auto mb-2" />
            <p className="font-medium text-foreground">Settings</p>
            <p className="text-sm text-muted-foreground">Configure your workspace</p>
          </Link>
        </div>
      </div>
    </div>
  )
}

export default DashboardPage