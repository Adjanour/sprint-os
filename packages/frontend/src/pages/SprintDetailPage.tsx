import { useParams } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { Play, Square, MoreHorizontal, Plus } from 'lucide-react'
import axios from 'axios'

interface ProjectItem {
  id: number
  title: string
  body: string
  labels: string[]
  assignees: string[]
  status: 'backlog' | 'in_progress' | 'in_review' | 'done'
  priority: number
  estimate: number
  externalType: 'issue' | 'pr'
  externalId: number
  repoName: string
  repoFullName: string
}

interface Sprint {
  id: number
  title: string
  startDate: string
  endDate: string
  goal: string
  state: 'planned' | 'active' | 'closed'
  items: ProjectItem[]
}

const SprintDetailPage = () => {
  const { id } = useParams<{ id: string }>()
  
  const { data: sprint, isLoading } = useQuery<Sprint>({
    queryKey: ['sprint', id],
    queryFn: async () => {
      const response = await axios.get(`/sprints/${id}`)
      return response.data
    }
  })

  const columns = [
    { id: 'backlog', title: 'Backlog', items: sprint?.items.filter(item => item.status === 'backlog') || [] },
    { id: 'in_progress', title: 'In Progress', items: sprint?.items.filter(item => item.status === 'in_progress') || [] },
    { id: 'in_review', title: 'In Review', items: sprint?.items.filter(item => item.status === 'in_review') || [] },
    { id: 'done', title: 'Done', items: sprint?.items.filter(item => item.status === 'done') || [] }
  ]

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    )
  }

  if (!sprint) {
    return (
      <div className="text-center py-12">
        <h3 className="text-lg font-medium text-foreground">Sprint not found</h3>
        <p className="text-muted-foreground">The sprint you're looking for doesn't exist.</p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Sprint Header */}
      <div className="bg-card border border-border rounded-lg p-6">
        <div className="flex items-start justify-between">
          <div className="space-y-2">
            <div className="flex items-center space-x-3">
              <h1 className="text-2xl font-bold text-foreground">{sprint.title}</h1>
              <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                sprint.state === 'active' 
                  ? 'bg-green-100 text-green-800' 
                  : sprint.state === 'planned'
                  ? 'bg-blue-100 text-blue-800'
                  : 'bg-gray-100 text-gray-800'
              }`}>
                {sprint.state}
              </span>
            </div>
            <p className="text-muted-foreground">
              {new Date(sprint.startDate).toLocaleDateString()} - {new Date(sprint.endDate).toLocaleDateString()}
            </p>
            {sprint.goal && (
              <p className="text-foreground">{sprint.goal}</p>
            )}
          </div>
          
          <div className="flex items-center space-x-2">
            {sprint.state === 'planned' && (
              <button className="flex items-center space-x-2 bg-primary text-primary-foreground px-4 py-2 rounded-md hover:bg-primary/90 transition-colors">
                <Play className="h-4 w-4" />
                <span>Start Sprint</span>
              </button>
            )}
            {sprint.state === 'active' && (
              <button className="flex items-center space-x-2 bg-destructive text-destructive-foreground px-4 py-2 rounded-md hover:bg-destructive/90 transition-colors">
                <Square className="h-4 w-4" />
                <span>Close Sprint</span>
              </button>
            )}
            <button className="p-2 text-muted-foreground hover:text-foreground transition-colors">
              <MoreHorizontal className="h-4 w-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Sprint Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {columns.map((column) => (
          <div key={column.id} className="bg-card border border-border rounded-lg p-4">
            <div className="flex items-center justify-between mb-2">
              <h3 className="font-medium text-foreground">{column.title}</h3>
              <span className="text-sm text-muted-foreground">{column.items.length}</span>
            </div>
            <div className="text-2xl font-bold text-foreground">{column.items.length}</div>
          </div>
        ))}
      </div>

      {/* Kanban Board */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {columns.map((column) => (
          <div key={column.id} className="bg-card border border-border rounded-lg p-4">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-medium text-foreground">{column.title}</h3>
              <span className="text-sm text-muted-foreground">{column.items.length}</span>
            </div>
            
            <div className="space-y-3">
              {column.items.map((item) => (
                <div
                  key={item.id}
                  className="bg-background border border-border rounded-lg p-3 hover:shadow-sm transition-shadow cursor-pointer"
                >
                  <div className="space-y-2">
                    <div className="flex items-start justify-between">
                      <h4 className="font-medium text-foreground text-sm">{item.title}</h4>
                      <span className={`px-2 py-1 rounded text-xs font-medium ${
                        item.externalType === 'pr' 
                          ? 'bg-purple-100 text-purple-800'
                          : 'bg-blue-100 text-blue-800'
                      }`}>
                        {item.externalType.toUpperCase()}
                      </span>
                    </div>
                    
                    {item.labels.length > 0 && (
                      <div className="flex flex-wrap gap-1">
                        {item.labels.slice(0, 2).map((label) => (
                          <span
                            key={label}
                            className="px-2 py-1 bg-secondary text-secondary-foreground rounded text-xs"
                          >
                            {label}
                          </span>
                        ))}
                        {item.labels.length > 2 && (
                          <span className="text-xs text-muted-foreground">
                            +{item.labels.length - 2}
                          </span>
                        )}
                      </div>
                    )}
                    
                    <div className="flex items-center justify-between text-xs text-muted-foreground">
                      <span>{item.repoName}</span>
                      {item.estimate && (
                        <span>{item.estimate} pts</span>
                      )}
                    </div>
                    
                    {item.assignees.length > 0 && (
                      <div className="flex items-center space-x-1">
                        <div className="flex -space-x-1">
                          {item.assignees.slice(0, 3).map((assignee) => (
                            <div
                              key={assignee}
                              className="w-6 h-6 bg-primary rounded-full flex items-center justify-center text-primary-foreground text-xs font-medium"
                            >
                              {assignee.charAt(0).toUpperCase()}
                            </div>
                          ))}
                        </div>
                        {item.assignees.length > 3 && (
                          <span className="text-xs text-muted-foreground">
                            +{item.assignees.length - 3}
                          </span>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              ))}
              
              <button className="w-full p-3 border-2 border-dashed border-border rounded-lg text-muted-foreground hover:text-foreground hover:border-primary transition-colors flex items-center justify-center space-x-2">
                <Plus className="h-4 w-4" />
                <span className="text-sm">Add item</span>
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

export default SprintDetailPage