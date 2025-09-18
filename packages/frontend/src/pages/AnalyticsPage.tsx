import { useQuery } from '@tanstack/react-query'
import { TrendingUp, Clock, CheckCircle, AlertCircle } from 'lucide-react'
import axios from 'axios'

interface SprintMetrics {
  sprint: {
    id: number
    title: string
    startDate: string
    endDate: string
    goal: string
    state: string
  }
  metrics: {
    total: number
    completed: number
    inProgress: number
    backlog: number
    completionRate: number
    velocity: number
    cycleTime: number
  }
  items: Array<{
    id: number
    title: string
    status: string
    estimate: number
    priority: number
  }>
}

interface FlowMetrics {
  period: {
    days: number
    startDate: string
    endDate: string
  }
  metrics: {
    wip: number
    avgCycleTime: number
    cycleTimeDistribution: {
      min: number
      max: number
      median: number
    }
  }
  events: any[]
}

interface DORAMetrics {
  period: {
    days: number
    startDate: string
    endDate: string
  }
  doraMetrics: {
    deploymentFrequency: number
    leadTimeForChanges: number
    changeFailureRate: number
    meanTimeToRecovery: number
  }
  rawData: {
    totalDeployments: number
    totalFailures: number
    deployments: any[]
  }
}

const AnalyticsPage = () => {
  const { data: overviewMetrics } = useQuery({
    queryKey: ['analytics-overview'],
    queryFn: async () => {
      const response = await axios.get('/analytics/overview')
      return response.data
    }
  })

  const { data: flowMetrics } = useQuery<FlowMetrics>({
    queryKey: ['analytics-flow'],
    queryFn: async () => {
      const response = await axios.get('/analytics/flow')
      return response.data
    }
  })

  const { data: doraMetrics } = useQuery<DORAMetrics>({
    queryKey: ['analytics-dora'],
    queryFn: async () => {
      const response = await axios.get('/analytics/dora')
      return response.data
    }
  })

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-foreground">Analytics</h1>
        <p className="text-muted-foreground">Track your team's performance and flow metrics</p>
      </div>

      {/* Overview Metrics */}
      {overviewMetrics && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="bg-card p-6 rounded-lg border border-border">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Active Sprints</p>
                <p className="text-2xl font-bold text-foreground">{overviewMetrics.overview.activeSprints}</p>
              </div>
              <TrendingUp className="h-8 w-8 text-primary" />
            </div>
          </div>

          <div className="bg-card p-6 rounded-lg border border-border">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Total Items</p>
                <p className="text-2xl font-bold text-foreground">{overviewMetrics.overview.totalItems}</p>
              </div>
              <CheckCircle className="h-8 w-8 text-green-500" />
            </div>
          </div>

          <div className="bg-card p-6 rounded-lg border border-border">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Completed This Week</p>
                <p className="text-2xl font-bold text-foreground">{overviewMetrics.overview.completedThisWeek}</p>
              </div>
              <Clock className="h-8 w-8 text-blue-500" />
            </div>
          </div>

          <div className="bg-card p-6 rounded-lg border border-border">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Connected Repos</p>
                <p className="text-2xl font-bold text-foreground">{overviewMetrics.overview.totalRepos}</p>
              </div>
              <AlertCircle className="h-8 w-8 text-purple-500" />
            </div>
          </div>
        </div>
      )}

      {/* Flow Metrics */}
      {flowMetrics && (
        <div className="bg-card p-6 rounded-lg border border-border">
          <h2 className="text-xl font-semibold text-foreground mb-4">Flow Metrics</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div>
              <h3 className="text-sm font-medium text-muted-foreground mb-2">Work in Progress</h3>
              <p className="text-2xl font-bold text-foreground">{flowMetrics.metrics.wip}</p>
              <p className="text-xs text-muted-foreground">items currently in progress</p>
            </div>
            
            <div>
              <h3 className="text-sm font-medium text-muted-foreground mb-2">Average Cycle Time</h3>
              <p className="text-2xl font-bold text-foreground">{flowMetrics.metrics.avgCycleTime}</p>
              <p className="text-xs text-muted-foreground">days from start to completion</p>
            </div>
            
            <div>
              <h3 className="text-sm font-medium text-muted-foreground mb-2">Cycle Time Range</h3>
              <p className="text-2xl font-bold text-foreground">
                {flowMetrics.metrics.cycleTimeDistribution.min} - {flowMetrics.metrics.cycleTimeDistribution.max}
              </p>
              <p className="text-xs text-muted-foreground">days (min - max)</p>
            </div>
          </div>
          
          <div className="mt-4 text-sm text-muted-foreground">
            Period: {new Date(flowMetrics.period.startDate).toLocaleDateString()} - {new Date(flowMetrics.period.endDate).toLocaleDateString()}
          </div>
        </div>
      )}

      {/* DORA Metrics */}
      {doraMetrics && (
        <div className="bg-card p-6 rounded-lg border border-border">
          <h2 className="text-xl font-semibold text-foreground mb-4">DORA Metrics</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <div>
              <h3 className="text-sm font-medium text-muted-foreground mb-2">Deployment Frequency</h3>
              <p className="text-2xl font-bold text-foreground">{doraMetrics.doraMetrics.deploymentFrequency}</p>
              <p className="text-xs text-muted-foreground">deployments per week</p>
            </div>
            
            <div>
              <h3 className="text-sm font-medium text-muted-foreground mb-2">Lead Time for Changes</h3>
              <p className="text-2xl font-bold text-foreground">{doraMetrics.doraMetrics.leadTimeForChanges}</p>
              <p className="text-xs text-muted-foreground">hours from commit to deploy</p>
            </div>
            
            <div>
              <h3 className="text-sm font-medium text-muted-foreground mb-2">Change Failure Rate</h3>
              <p className="text-2xl font-bold text-foreground">{doraMetrics.doraMetrics.changeFailureRate}%</p>
              <p className="text-xs text-muted-foreground">of deployments fail</p>
            </div>
            
            <div>
              <h3 className="text-sm font-medium text-muted-foreground mb-2">Mean Time to Recovery</h3>
              <p className="text-2xl font-bold text-foreground">{doraMetrics.doraMetrics.meanTimeToRecovery}</p>
              <p className="text-xs text-muted-foreground">hours to recover</p>
            </div>
          </div>
          
          <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="text-sm">
              <span className="text-muted-foreground">Total Deployments:</span>
              <span className="ml-2 text-foreground">{doraMetrics.rawData.totalDeployments}</span>
            </div>
            <div className="text-sm">
              <span className="text-muted-foreground">Failed Deployments:</span>
              <span className="ml-2 text-foreground">{doraMetrics.rawData.totalFailures}</span>
            </div>
          </div>
          
          <div className="mt-2 text-sm text-muted-foreground">
            Period: {new Date(doraMetrics.period.startDate).toLocaleDateString()} - {new Date(doraMetrics.period.endDate).toLocaleDateString()}
          </div>
        </div>
      )}

      {/* Sprint Performance */}
      <div className="bg-card p-6 rounded-lg border border-border">
        <h2 className="text-xl font-semibold text-foreground mb-4">Sprint Performance</h2>
        <div className="text-center py-8">
          <TrendingUp className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
          <p className="text-muted-foreground">Sprint performance charts coming soon</p>
          <p className="text-sm text-muted-foreground mt-2">
            Track velocity, burndown charts, and sprint completion rates
          </p>
        </div>
      </div>

      {/* Team Productivity */}
      <div className="bg-card p-6 rounded-lg border border-border">
        <h2 className="text-xl font-semibold text-foreground mb-4">Team Productivity</h2>
        <div className="text-center py-8">
          <CheckCircle className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
          <p className="text-muted-foreground">Team productivity insights coming soon</p>
          <p className="text-sm text-muted-foreground mt-2">
            Individual and team contribution metrics
          </p>
        </div>
      </div>
    </div>
  )
}

export default AnalyticsPage