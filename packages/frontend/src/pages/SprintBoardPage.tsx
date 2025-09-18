import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { Link } from 'react-router-dom'
import { Plus, Calendar, Target } from 'lucide-react'
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

const SprintBoardPage = () => {
  const [filter, setFilter] = useState<'all' | 'planned' | 'active' | 'closed'>('all')

  const { data: sprints = [], isLoading } = useQuery<Sprint[]>({
    queryKey: ['sprints'],
    queryFn: async () => {
      const response = await axios.get('/sprints')
      return response.data
    }
  })

  const filteredSprints = sprints.filter(sprint => 
    filter === 'all' || sprint.state === filter
  )

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Sprints</h1>
          <p className="text-muted-foreground">Manage your sprint planning and execution</p>
        </div>
        <Link
          to="/sprints/new"
          className="flex items-center space-x-2 bg-primary text-primary-foreground px-4 py-2 rounded-md hover:bg-primary/90 transition-colors"
        >
          <Plus className="h-4 w-4" />
          <span>New Sprint</span>
        </Link>
      </div>

      {/* Filter Tabs */}
      <div className="flex space-x-1 bg-muted p-1 rounded-lg w-fit">
        {[
          { key: 'all', label: 'All Sprints' },
          { key: 'planned', label: 'Planned' },
          { key: 'active', label: 'Active' },
          { key: 'closed', label: 'Closed' }
        ].map(({ key, label }) => (
          <button
            key={key}
            onClick={() => setFilter(key as any)}
            className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
              filter === key
                ? 'bg-background text-foreground shadow-sm'
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      {/* Sprints Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredSprints.map((sprint) => (
          <Link
            key={sprint.id}
            to={`/sprints/${sprint.id}`}
            className="block bg-card border border-border rounded-lg p-6 hover:shadow-md transition-shadow"
          >
            <div className="space-y-4">
              {/* Sprint Header */}
              <div className="flex items-start justify-between">
                <div className="space-y-1">
                  <h3 className="font-semibold text-foreground">{sprint.title}</h3>
                  <div className="flex items-center space-x-2 text-sm text-muted-foreground">
                    <Calendar className="h-4 w-4" />
                    <span>
                      {new Date(sprint.startDate).toLocaleDateString()} - {new Date(sprint.endDate).toLocaleDateString()}
                    </span>
                  </div>
                </div>
                <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                  sprint.state === 'active' 
                    ? 'bg-green-100 text-green-800' 
                    : sprint.state === 'planned'
                    ? 'bg-blue-100 text-blue-800'
                    : 'bg-gray-100 text-gray-800'
                }`}>
                  {sprint.state}
                </span>
              </div>

              {/* Sprint Goal */}
              {sprint.goal && (
                <div className="flex items-start space-x-2">
                  <Target className="h-4 w-4 text-muted-foreground mt-0.5" />
                  <p className="text-sm text-muted-foreground">{sprint.goal}</p>
                </div>
              )}

              {/* Progress */}
              <div className="space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Progress</span>
                  <span className="font-medium text-foreground">
                    {sprint.stats.completed}/{sprint.stats.total}
                  </span>
                </div>
                <div className="w-full bg-secondary rounded-full h-2">
                  <div
                    className="bg-primary h-2 rounded-full transition-all"
                    style={{
                      width: `${sprint.stats.total > 0 ? (sprint.stats.completed / sprint.stats.total) * 100 : 0}%`
                    }}
                  />
                </div>
              </div>

              {/* Stats */}
              <div className="grid grid-cols-3 gap-4 text-center">
                <div>
                  <div className="text-lg font-semibold text-foreground">{sprint.stats.completed}</div>
                  <div className="text-xs text-muted-foreground">Done</div>
                </div>
                <div>
                  <div className="text-lg font-semibold text-foreground">{sprint.stats.inProgress}</div>
                  <div className="text-xs text-muted-foreground">In Progress</div>
                </div>
                <div>
                  <div className="text-lg font-semibold text-foreground">{sprint.stats.backlog}</div>
                  <div className="text-xs text-muted-foreground">Backlog</div>
                </div>
              </div>
            </div>
          </Link>
        ))}
      </div>

      {/* Empty State */}
      {filteredSprints.length === 0 && (
        <div className="text-center py-12">
          <div className="mx-auto h-12 w-12 text-muted-foreground">
            <Calendar className="h-12 w-12" />
          </div>
          <h3 className="mt-2 text-sm font-medium text-foreground">No sprints found</h3>
          <p className="mt-1 text-sm text-muted-foreground">
            {filter === 'all' 
              ? 'Get started by creating your first sprint.'
              : `No ${filter} sprints found.`
            }
          </p>
          {filter === 'all' && (
            <div className="mt-6">
              <Link
                to="/sprints/new"
                className="inline-flex items-center space-x-2 bg-primary text-primary-foreground px-4 py-2 rounded-md hover:bg-primary/90 transition-colors"
              >
                <Plus className="h-4 w-4" />
                <span>New Sprint</span>
              </Link>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

export default SprintBoardPage