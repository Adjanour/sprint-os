# SprintOS Setup Guide

This guide will help you set up SprintOS for local development and production deployment.

## Prerequisites

- Node.js 18+ and npm
- Docker and Docker Compose
- GitHub account with organization/repository access
- PostgreSQL (for local development without Docker)

## Quick Start with Docker

1. **Clone and setup environment**
   ```bash
   git clone <repository-url>
   cd sprintos
   cp .env.example .env
   ```

2. **Configure environment variables**
   Edit `.env` file with your GitHub App credentials:
   ```env
   GITHUB_APP_ID=your_github_app_id
   GITHUB_APP_PRIVATE_KEY_PATH=./github-app-key.pem
   GITHUB_WEBHOOK_SECRET=your_webhook_secret
   GITHUB_CLIENT_ID=your_github_oauth_client_id
   GITHUB_CLIENT_SECRET=your_github_oauth_client_secret
   JWT_SECRET=your_jwt_secret_key
   ```

3. **Start services**
   ```bash
   npm run docker:up
   ```

4. **Run database migrations**
   ```bash
   npm run db:migrate
   ```

5. **Seed sample data (optional)**
   ```bash
   npm run db:seed
   ```

6. **Access the application**
   - Frontend: http://localhost:5173
   - Backend API: http://localhost:3001
   - API Documentation: http://localhost:3001/docs

## Manual Setup

### Backend Setup

1. **Install dependencies**
   ```bash
   cd packages/backend
   npm install
   ```

2. **Configure environment**
   Copy `.env.example` to `.env` and update with your credentials.

3. **Start database**
   ```bash
   # Using Docker
   docker run -d --name sprintos-postgres \
     -e POSTGRES_DB=sprintos \
     -e POSTGRES_USER=sprintos \
     -e POSTGRES_PASSWORD=sprintos \
     -p 5432:5432 postgres:15-alpine

   # Or using local PostgreSQL
   createdb sprintos
   ```

4. **Run migrations**
   ```bash
   npm run db:migrate
   ```

5. **Start the backend**
   ```bash
   npm run dev
   ```

### Frontend Setup

1. **Install dependencies**
   ```bash
   cd packages/frontend
   npm install
   ```

2. **Configure environment**
   Create `.env.local`:
   ```env
   VITE_GITHUB_CLIENT_ID=your_github_oauth_client_id
   VITE_API_URL=http://localhost:3001
   ```

3. **Start the frontend**
   ```bash
   npm run dev
   ```

## GitHub App Setup

### 1. Create a GitHub App

1. Go to GitHub Settings > Developer settings > GitHub Apps
2. Click "New GitHub App"
3. Fill in the required fields:
   - **App name**: SprintOS
   - **Homepage URL**: Your SprintOS instance URL
   - **Webhook URL**: `https://your-domain.com/api/github/webhook`
   - **Webhook secret**: Generate a secure secret

### 2. Configure Permissions

**Repository permissions:**
- Contents: Read
- Issues: Read
- Pull requests: Read
- Metadata: Read

**Account permissions:**
- Members: Read

**Subscribe to events:**
- Issues
- Pull requests
- Milestones
- Repository
- Check runs
- Deployment status

### 3. Generate Private Key

1. In your GitHub App settings, scroll down to "Private keys"
2. Click "Generate a private key"
3. Save the downloaded `.pem` file as `github-app-key.pem` in the project root

### 4. Install the App

1. Go to your GitHub App settings
2. Click "Install App"
3. Select the organization or repositories you want to connect
4. Note the Installation ID for configuration

## Database Schema

SprintOS uses PostgreSQL with the following main tables:

- `orgs` - GitHub organizations
- `repos` - Connected repositories
- `sprints` - Sprint definitions
- `project_items` - Issues and PRs
- `milestones` - Repository milestones
- `docs` - Sprint and item documentation
- `threads` - Discussion threads
- `events` - Event log for analytics

## API Endpoints

### Authentication
- `POST /api/auth/github/callback` - GitHub OAuth callback
- `GET /api/auth/me` - Get current user
- `GET /api/auth/orgs` - Get user organizations

### Sprints
- `GET /api/sprints` - List sprints
- `POST /api/sprints` - Create sprint
- `GET /api/sprints/:id` - Get sprint details
- `PATCH /api/sprints/:id` - Update sprint
- `POST /api/sprints/:id/start` - Start sprint
- `POST /api/sprints/:id/close` - Close sprint

### Project Items
- `GET /api/project-items` - List items
- `GET /api/project-items/:id` - Get item details
- `PATCH /api/project-items/:id` - Update item
- `POST /api/project-items/assign-to-sprint` - Assign items to sprint

### Analytics
- `GET /api/analytics/sprint/:id` - Sprint metrics
- `GET /api/analytics/flow` - Flow metrics
- `GET /api/analytics/dora` - DORA metrics
- `GET /api/analytics/overview` - Overview metrics

## Development

### Running Tests
```bash
# Backend tests
cd packages/backend
npm test

# Frontend tests
cd packages/frontend
npm test
```

### Database Management
```bash
# Generate migration
cd packages/backend
npm run db:generate

# Run migrations
npm run db:migrate

# Open database studio
npm run db:studio
```

### Building for Production
```bash
# Build backend
cd packages/backend
npm run build

# Build frontend
cd packages/frontend
npm run build
```

## Production Deployment

### Docker Compose Production

1. **Update docker-compose.yml**
   ```yaml
   services:
     backend:
       build:
         context: ./packages/backend
         dockerfile: Dockerfile.prod
       environment:
         NODE_ENV: production
         # ... other production env vars
   ```

2. **Build production images**
   ```bash
   docker-compose -f docker-compose.prod.yml build
   ```

3. **Deploy**
   ```bash
   docker-compose -f docker-compose.prod.yml up -d
   ```

### Environment Variables for Production

```env
NODE_ENV=production
DATABASE_URL=postgresql://user:pass@host:port/db
REDIS_URL=redis://host:port
MEILISEARCH_URL=https://meilisearch.example.com
MEILISEARCH_KEY=production_key
S3_ENDPOINT=https://s3.example.com
S3_ACCESS_KEY=access_key
S3_SECRET_KEY=secret_key
JWT_SECRET=very_secure_jwt_secret
GITHUB_APP_ID=123456
GITHUB_APP_PRIVATE_KEY_PATH=/app/github-app-key.pem
GITHUB_WEBHOOK_SECRET=webhook_secret
GITHUB_CLIENT_ID=oauth_client_id
GITHUB_CLIENT_SECRET=oauth_client_secret
FRONTEND_URL=https://sprintos.example.com
```

## Troubleshooting

### Common Issues

1. **Database connection errors**
   - Ensure PostgreSQL is running
   - Check DATABASE_URL format
   - Verify database exists

2. **GitHub authentication issues**
   - Verify GitHub App credentials
   - Check OAuth callback URL
   - Ensure private key file exists

3. **Webhook delivery failures**
   - Verify webhook URL is accessible
   - Check webhook secret matches
   - Review GitHub App permissions

### Logs

```bash
# View backend logs
docker-compose logs -f backend

# View frontend logs
docker-compose logs -f frontend

# View database logs
docker-compose logs -f postgres
```

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests
5. Submit a pull request

## License

MIT License - see LICENSE file for details.