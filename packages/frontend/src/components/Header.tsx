import { useAuth } from '../contexts/AuthContext'
import { LogOut, User, Github } from 'lucide-react'

const Header = () => {
  const { user, logout } = useAuth()

  return (
    <header className="bg-card border-b border-border px-6 py-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <h1 className="text-2xl font-semibold text-foreground">
            Engineering Operations
          </h1>
        </div>
        
        <div className="flex items-center space-x-4">
          {user && (
            <div className="flex items-center space-x-2 text-sm text-muted-foreground">
              <Github className="h-4 w-4" />
              <span>@{user.githubUsername}</span>
            </div>
          )}
          
          <div className="flex items-center space-x-2">
            <button
              onClick={logout}
              className="flex items-center space-x-2 px-3 py-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
            >
              <LogOut className="h-4 w-4" />
              <span>Logout</span>
            </button>
          </div>
        </div>
      </div>
    </header>
  )
}

export default Header