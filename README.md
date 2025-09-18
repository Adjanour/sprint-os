# SprintOS

Engineering Operations OS - A unified system for GitHub repos, issues, PRs, milestones, and sprints.

## Overview

SprintOS is an open-source, self-hostable Engineering Operations OS that connects GitHub repos, issues, PRs, milestones, and sprints into a unified system. It eliminates tool fragmentation by providing principle-driven workflows (Agile, Lean, DevOps) with lightweight docs, contextual discussions, and automatic flow metrics.

## Features

- **GitHub Integration**: Seamless connection to GitHub repos, issues, and PRs
- **Sprint Management**: Org-level sprint planning and tracking
- **Kanban Board**: Visual project management with drag-and-drop
- **Documentation**: Lightweight markdown docs tied to sprints and items
- **Contextual Discussions**: Threads tied to sprints and project items
- **Analytics**: Flow metrics and DORA metrics from GitHub events
- **Retrospectives**: Sprint retrospective boards
- **Self-hostable**: Docker Compose deployment

## Architecture

- **Backend**: Node.js + TypeScript + Hono
- **Frontend**: React + Vite + TypeScript + Tailwind CSS
- **Database**: PostgreSQL with JSONB support
- **Cache/Queue**: Redis with BullMQ
- **Search**: Meilisearch
- **Infrastructure**: Docker Compose

## Quick Start

1. Clone the repository
2. Install dependencies: `npm install`
3. Set up environment variables (see `.env.example`)
4. Start with Docker: `npm run docker:up`
5. Run database migrations: `npm run db:migrate`
6. Start development: `npm run dev`

## Development

The project is organized as a monorepo with the following structure:

- `packages/backend/` - Node.js backend API
- `packages/frontend/` - React frontend application
- `docker-compose.yml` - Local development environment

## License

MIT