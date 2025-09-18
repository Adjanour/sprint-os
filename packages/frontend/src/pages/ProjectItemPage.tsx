import { useParams } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { ArrowLeft, ExternalLink, MessageCircle, FileText, Clock } from 'lucide-react'
import { Link } from 'react-router-dom'
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
  sprintTitle?: string
  milestoneTitle?: string
  createdAt: string
  updatedAt: string
}

const ProjectItemPage = () => {
  const { id } = useParams<{ id: string }>()
  
  const { data: item, isLoading } = useQuery<ProjectItem>({
    queryKey: ['project-item', id],
    queryFn: async () => {
      const response = await axios.get(`/project-items/${id}`)
      return response.data
    }
  })

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    )
  }

  if (!item) {
    return (
      <div className="text-center py-12">
        <h3 className="text-lg font-medium text-foreground">Item not found</h3>
        <p className="text-muted-foreground">The item you're looking for doesn't exist.</p>
      </div>
    )
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center space-x-4">
        <Link
          to="/sprints"
          className="flex items-center space-x-2 text-muted-foreground hover:text-foreground transition-colors"
        >
          <ArrowLeft className="h-4 w-4" />
          <span>Back to Sprints</span>
        </Link>
      </div>

      {/* Item Header */}
      <div className="bg-card border border-border rounded-lg p-6">
        <div className="flex items-start justify-between mb-4">
          <div className="space-y-2">
            <div className="flex items-center space-x-3">
              <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                item.externalType === 'pr' 
                  ? 'bg-purple-100 text-purple-800'
                  : 'bg-blue-100 text-blue-800'
              }`}>
                {item.externalType.toUpperCase()}
              </span>
              <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                item.status === 'done' 
                  ? 'bg-green-100 text-green-800'
                  : item.status === 'in_progress'
                  ? 'bg-yellow-100 text-yellow-800'
                  : item.status === 'in_review'
                  ? 'bg-blue-100 text-blue-800'
                  : 'bg-gray-100 text-gray-800'
              }`}>
                {item.status.replace('_', ' ')}
              </span>
            </div>
            <h1 className="text-2xl font-bold text-foreground">{item.title}</h1>
            <p className="text-muted-foreground">{item.repoFullName}</p>
          </div>
          
          <a
            href={`https://github.com/${item.repoFullName}/${item.externalType === 'pr' ? 'pull' : 'issues'}/${item.externalId}`}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center space-x-2 text-primary hover:text-primary/80 transition-colors"
          >
            <ExternalLink className="h-4 w-4" />
            <span>View on GitHub</span>
          </a>
        </div>

        {/* Metadata */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
          <div>
            <span className="text-muted-foreground">Created:</span>
            <span className="ml-2 text-foreground">{new Date(item.createdAt).toLocaleDateString()}</span>
          </div>
          <div>
            <span className="text-muted-foreground">Updated:</span>
            <span className="ml-2 text-foreground">{new Date(item.updatedAt).toLocaleDateString()}</span>
          </div>
          {item.estimate && (
            <div>
              <span className="text-muted-foreground">Estimate:</span>
              <span className="ml-2 text-foreground">{item.estimate} points</span>
            </div>
          )}
        </div>

        {/* Labels */}
        {item.labels.length > 0 && (
          <div className="mt-4">
            <div className="flex flex-wrap gap-2">
              {item.labels.map((label) => (
                <span
                  key={label}
                  className="px-2 py-1 bg-secondary text-secondary-foreground rounded text-sm"
                >
                  {label}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Assignees */}
        {item.assignees.length > 0 && (
          <div className="mt-4">
            <span className="text-sm text-muted-foreground">Assigned to:</span>
            <div className="flex items-center space-x-2 mt-1">
              {item.assignees.map((assignee) => (
                <div
                  key={assignee}
                  className="flex items-center space-x-2 px-3 py-1 bg-accent rounded-full"
                >
                  <div className="w-6 h-6 bg-primary rounded-full flex items-center justify-center text-primary-foreground text-xs font-medium">
                    {assignee.charAt(0).toUpperCase()}
                  </div>
                  <span className="text-sm text-foreground">@{assignee}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Sprint and Milestone */}
        <div className="mt-4 flex items-center space-x-4 text-sm">
          {item.sprintTitle && (
            <div>
              <span className="text-muted-foreground">Sprint:</span>
              <span className="ml-2 text-foreground">{item.sprintTitle}</span>
            </div>
          )}
          {item.milestoneTitle && (
            <div>
              <span className="text-muted-foreground">Milestone:</span>
              <span className="ml-2 text-foreground">{item.milestoneTitle}</span>
            </div>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Description */}
          <div className="bg-card border border-border rounded-lg p-6">
            <h2 className="text-lg font-semibold text-foreground mb-4">Description</h2>
            <div className="prose prose-sm max-w-none">
              {item.body ? (
                <div className="whitespace-pre-wrap text-foreground">{item.body}</div>
              ) : (
                <p className="text-muted-foreground italic">No description provided.</p>
              )}
            </div>
          </div>

          {/* Comments/Threads */}
          <div className="bg-card border border-border rounded-lg p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-foreground">Discussions</h2>
              <button className="flex items-center space-x-2 text-primary hover:text-primary/80 transition-colors">
                <MessageCircle className="h-4 w-4" />
                <span>Start Discussion</span>
              </button>
            </div>
            <div className="text-center py-8">
              <MessageCircle className="h-12 w-12 text-muted-foreground mx-auto mb-2" />
              <p className="text-muted-foreground">No discussions yet</p>
            </div>
          </div>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Actions */}
          <div className="bg-card border border-border rounded-lg p-6">
            <h3 className="font-semibold text-foreground mb-4">Actions</h3>
            <div className="space-y-2">
              <button className="w-full text-left px-3 py-2 text-sm text-foreground hover:bg-accent rounded-md transition-colors">
                Edit Status
              </button>
              <button className="w-full text-left px-3 py-2 text-sm text-foreground hover:bg-accent rounded-md transition-colors">
                Assign to Sprint
              </button>
              <button className="w-full text-left px-3 py-2 text-sm text-foreground hover:bg-accent rounded-md transition-colors">
                Add Labels
              </button>
              <button className="w-full text-left px-3 py-2 text-sm text-foreground hover:bg-accent rounded-md transition-colors">
                Add Estimate
              </button>
            </div>
          </div>

          {/* Activity */}
          <div className="bg-card border border-border rounded-lg p-6">
            <h3 className="font-semibold text-foreground mb-4">Activity</h3>
            <div className="space-y-3">
              <div className="flex items-start space-x-3">
                <div className="w-2 h-2 bg-primary rounded-full mt-2"></div>
                <div className="flex-1">
                  <p className="text-sm text-foreground">Item created</p>
                  <p className="text-xs text-muted-foreground">
                    {new Date(item.createdAt).toLocaleString()}
                  </p>
                </div>
              </div>
              <div className="flex items-start space-x-3">
                <div className="w-2 h-2 bg-secondary rounded-full mt-2"></div>
                <div className="flex-1">
                  <p className="text-sm text-foreground">Last updated</p>
                  <p className="text-xs text-muted-foreground">
                    {new Date(item.updatedAt).toLocaleString()}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Related Docs */}
          <div className="bg-card border border-border rounded-lg p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold text-foreground">Related Docs</h3>
              <button className="flex items-center space-x-1 text-primary hover:text-primary/80 transition-colors">
                <FileText className="h-4 w-4" />
                <span className="text-sm">Add Doc</span>
              </button>
            </div>
            <div className="text-center py-4">
              <FileText className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
              <p className="text-sm text-muted-foreground">No related documents</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default ProjectItemPage