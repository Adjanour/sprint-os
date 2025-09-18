import { NavLink } from 'react-router-dom'
import { 
  LayoutDashboard, 
  Kanban, 
  BarChart3, 
  Settings, 
  Github,
  FileText
} from 'lucide-react'

const Sidebar = () => {
  const navigation = [
    { name: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
    { name: 'Sprints', href: '/sprints', icon: Kanban },
    { name: 'Analytics', href: '/analytics', icon: BarChart3 },
    { name: 'Settings', href: '/settings', icon: Settings },
  ]

  return (
    <div className="w-64 bg-card border-r border-border h-screen">
      <div className="p-6">
        <div className="flex items-center space-x-2">
          <Github className="h-8 w-8 text-primary" />
          <span className="text-xl font-bold">SprintOS</span>
        </div>
      </div>
      
      <nav className="px-4 space-y-2">
        {navigation.map((item) => {
          const Icon = item.icon
          return (
            <NavLink
              key={item.name}
              to={item.href}
              className={({ isActive }) =>
                `flex items-center space-x-3 px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                  isActive
                    ? 'bg-primary text-primary-foreground'
                    : 'text-muted-foreground hover:text-foreground hover:bg-accent'
                }`
              }
            >
              <Icon className="h-4 w-4" />
              <span>{item.name}</span>
            </NavLink>
          )
        })}
      </nav>

      <div className="absolute bottom-0 w-64 p-4 border-t border-border">
        <div className="flex items-center space-x-3 text-sm text-muted-foreground">
          <FileText className="h-4 w-4" />
          <span>v0.1.0</span>
        </div>
      </div>
    </div>
  )
}

export default Sidebar