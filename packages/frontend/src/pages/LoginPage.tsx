import { useEffect } from 'react'
import { useAuth } from '../contexts/AuthContext'
import { Github } from 'lucide-react'

const LoginPage = () => {
  const { login } = useAuth()

  useEffect(() => {
    // Check if we have a code in the URL (GitHub OAuth callback)
    const urlParams = new URLSearchParams(window.location.search)
    const code = urlParams.get('code')
    
    if (code) {
      login(code).catch(console.error)
    }
  }, [login])

  const handleGitHubLogin = () => {
    const clientId = process.env.VITE_GITHUB_CLIENT_ID
    if (!clientId) {
      window.alert("GitHub Client ID is not configured. Please contact support.")
      return
    }
    const redirectUri = `${window.location.origin}/login`
    
    const githubAuthUrl = `https://github.com/login/oauth/authorize?client_id=${clientId}&redirect_uri=${redirectUri}&scope=user:email,read:org`
    
    window.location.href = githubAuthUrl
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <div className="max-w-md w-full space-y-8 p-8">
        <div className="text-center">
          <div className="flex justify-center">
            <Github className="h-12 w-12 text-primary" />
          </div>
          <h2 className="mt-6 text-3xl font-bold text-foreground">
            Welcome to SprintOS
          </h2>
          <p className="mt-2 text-sm text-muted-foreground">
            Engineering Operations OS for GitHub
          </p>
        </div>
        
        <div className="space-y-4">
          <button
            onClick={handleGitHubLogin}
            className="group relative w-full flex justify-center py-3 px-4 border border-border rounded-md bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary transition-colors"
          >
            <span className="absolute left-0 inset-y-0 flex items-center pl-3">
              <Github className="h-5 w-5" />
            </span>
            Sign in with GitHub
          </button>
        </div>
        
        <div className="text-center">
          <p className="text-xs text-muted-foreground">
            By signing in, you agree to connect your GitHub account to SprintOS
          </p>
        </div>
      </div>
    </div>
  )
}

export default LoginPage