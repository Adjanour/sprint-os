import { Hono } from 'hono';
import { zValidator } from '@hono/zod-validator';
import { z } from 'zod';
import { authMiddleware, requireAuth, requireOrg } from '../middleware/auth';
import { db, orgs, repos, projectItems, milestones, events } from '../db';
import { eq, and } from 'drizzle-orm';
import { Octokit } from '@octokit/rest';
import { createAppAuth } from '@octokit/auth-app';

const githubRoutes = new Hono();

// Apply auth middleware to all routes
githubRoutes.use('*', authMiddleware, requireAuth, requireOrg);

// GitHub App installation callback
githubRoutes.post('/install', zValidator('json', z.object({
  installationId: z.string(),
  accountId: z.string(),
  accountType: z.enum(['User', 'Organization'])
})), async (c) => {
  const user = c.get('user');
  const orgId = user.orgId;
  const { installationId, accountId, accountType } = c.req.valid('json');
  
  try {
    // Create GitHub App auth
    const auth = createAppAuth({
      appId: process.env.GITHUB_APP_ID!,
      privateKey: process.env.GITHUB_APP_PRIVATE_KEY!,
      installationId: installationId
    });
    
    const octokit = new Octokit({ auth });
    
    // Get installation info
    const { data: installation } = await octokit.rest.apps.getInstallation({
      installation_id: parseInt(installationId)
    });
    
    // Get accessible repositories
    const { data: accessibleRepos } = await octokit.rest.apps.listReposAccessibleToInstallation();
    
    // Store organization info
    const org = await db
      .insert(orgs)
      .values({
        githubOrgId: parseInt(accountId),
        name: installation.account?.login || 'Unknown'
      })
      .returning();
    
    // Store repository info
    const repoInserts = accessibleRepos.repositories.map(repo => ({
      orgId: org[0].id,
      githubRepoId: repo.id,
      name: repo.name,
      fullName: repo.full_name
    }));
    
    if (repoInserts.length > 0) {
      await db.insert(repos).values(repoInserts);
    }
    
    // Start initial sync
    await syncRepositories(octokit, org[0].id);
    
    return c.json({
      message: 'GitHub App installed successfully',
      org: org[0],
      reposCount: accessibleRepos.repositories.length
    });
    
  } catch (error) {
    console.error('Error installing GitHub App:', error);
    return c.json({ error: 'Failed to install GitHub App' }, 500);
  }
});

// Sync repositories (issues, PRs, milestones)
githubRoutes.post('/sync', async (c) => {
  const user = c.get('user');
  const orgId = user.orgId;
  
  try {
    // Get organization
    const org = await db
      .select()
      .from(orgs)
      .where(eq(orgs.id, orgId))
      .limit(1);
    
    if (org.length === 0) {
      return c.json({ error: 'Organization not found' }, 404);
    }
    
    // Get repositories for this org
    const orgRepos = await db
      .select()
      .from(repos)
      .where(eq(repos.orgId, orgId));
    
    // Create GitHub App auth (this would need the installation ID stored)
    // For now, we'll use a simplified approach
    const octokit = new Octokit({
      auth: `token ${c.req.header('authorization')?.replace('Bearer ', '')}`
    });
    
    let totalSynced = 0;
    
    for (const repo of orgRepos) {
      const synced = await syncRepository(octokit, repo);
      totalSynced += synced;
    }
    
    return c.json({
      message: 'Sync completed successfully',
      reposProcessed: orgRepos.length,
      itemsSynced: totalSynced
    });
    
  } catch (error) {
    console.error('Error syncing repositories:', error);
    return c.json({ error: 'Failed to sync repositories' }, 500);
  }
});

// Webhook handler for GitHub events
githubRoutes.post('/webhook', async (c) => {
  const signature = c.req.header('x-hub-signature-256');
  const body = await c.req.text();
  
  // Verify webhook signature
  const crypto = require('crypto');
  const expectedSignature = crypto
    .createHmac('sha256', process.env.GITHUB_WEBHOOK_SECRET!)
    .update(body)
    .digest('hex');
  
  if (`sha256=${expectedSignature}` !== signature) {
    return c.json({ error: 'Invalid signature' }, 401);
  }
  
  const eventType = c.req.header('x-github-event');
  const event = JSON.parse(body);
  
  try {
    await handleWebhookEvent(eventType, event);
    return c.json({ message: 'Webhook processed successfully' });
  } catch (error) {
    console.error('Error processing webhook:', error);
    return c.json({ error: 'Failed to process webhook' }, 500);
  }
});

// Helper function to sync repositories
async function syncRepositories(octokit: Octokit, orgId: number) {
  const repos = await db.select().from(repos).where(eq(repos.orgId, orgId));
  
  let totalSynced = 0;
  for (const repo of repos) {
    const synced = await syncRepository(octokit, repo);
    totalSynced += synced;
  }
  
  return totalSynced;
}

// Helper function to sync a single repository
async function syncRepository(octokit: Octokit, repo: any) {
  let synced = 0;
  
  try {
    // Sync milestones
    const { data: milestones } = await octokit.rest.issues.listMilestones({
      owner: repo.fullName.split('/')[0],
      repo: repo.fullName.split('/')[1],
      state: 'all'
    });
    
    for (const milestone of milestones) {
      await db
        .insert(milestones)
        .values({
          repoId: repo.id,
          githubMilestoneId: milestone.id,
          title: milestone.title,
          description: milestone.description,
          dueDate: milestone.due_on ? new Date(milestone.due_on) : null,
          state: milestone.state === 'open' ? 'open' : 'closed'
        })
        .onConflictDoNothing();
      synced++;
    }
    
    // Sync issues
    const { data: issues } = await octokit.rest.issues.listForRepo({
      owner: repo.fullName.split('/')[0],
      repo: repo.fullName.split('/')[1],
      state: 'all'
    });
    
    for (const issue of issues) {
      await db
        .insert(projectItems)
        .values({
          repoId: repo.id,
          externalType: 'issue',
          externalId: issue.id,
          title: issue.title,
          body: issue.body,
          labels: issue.labels?.map((label: any) => label.name) || [],
          assignees: issue.assignees?.map((assignee: any) => assignee.login) || [],
          status: issue.state === 'closed' ? 'done' : 'backlog',
          createdAt: new Date(issue.created_at),
          updatedAt: new Date(issue.updated_at)
        })
        .onConflictDoNothing();
      synced++;
    }
    
    // Sync pull requests
    const { data: pullRequests } = await octokit.rest.pulls.list({
      owner: repo.fullName.split('/')[0],
      repo: repo.fullName.split('/')[1],
      state: 'all'
    });
    
    for (const pr of pullRequests) {
      await db
        .insert(projectItems)
        .values({
          repoId: repo.id,
          externalType: 'pr',
          externalId: pr.id,
          title: pr.title,
          body: pr.body,
          labels: pr.labels?.map((label: any) => label.name) || [],
          assignees: pr.assignees?.map((assignee: any) => assignee.login) || [],
          status: pr.state === 'closed' ? 'done' : 'backlog',
          createdAt: new Date(pr.created_at),
          updatedAt: new Date(pr.updated_at)
        })
        .onConflictDoNothing();
      synced++;
    }
    
  } catch (error) {
    console.error(`Error syncing repository ${repo.fullName}:`, error);
  }
  
  return synced;
}

// Helper function to handle webhook events
async function handleWebhookEvent(eventType: string, event: any) {
  switch (eventType) {
    case 'issues':
      await handleIssueEvent(event);
      break;
    case 'pull_request':
      await handlePullRequestEvent(event);
      break;
    case 'milestone':
      await handleMilestoneEvent(event);
      break;
    case 'repository':
      await handleRepositoryEvent(event);
      break;
    default:
      console.log(`Unhandled webhook event type: ${eventType}`);
  }
}

async function handleIssueEvent(event: any) {
  const action = event.action;
  const issue = event.issue;
  const repository = event.repository;
  
  // Find the repository in our database
  const repo = await db
    .select()
    .from(repos)
    .where(eq(repos.githubRepoId, repository.id))
    .limit(1);
  
  if (repo.length === 0) return;
  
  const eventData = {
    orgId: repo[0].orgId,
    itemId: null, // Would need to find or create
    type: `issue_${action}`,
    payload: {
      issueId: issue.id,
      title: issue.title,
      state: issue.state,
      labels: issue.labels?.map((label: any) => label.name) || [],
      assignees: issue.assignees?.map((assignee: any) => assignee.login) || []
    },
    occurredAt: new Date()
  };
  
  await db.insert(events).values(eventData);
}

async function handlePullRequestEvent(event: any) {
  const action = event.action;
  const pullRequest = event.pull_request;
  const repository = event.repository;
  
  // Find the repository in our database
  const repo = await db
    .select()
    .from(repos)
    .where(eq(repos.githubRepoId, repository.id))
    .limit(1);
  
  if (repo.length === 0) return;
  
  const eventData = {
    orgId: repo[0].orgId,
    itemId: null, // Would need to find or create
    type: `pr_${action}`,
    payload: {
      prId: pullRequest.id,
      title: pullRequest.title,
      state: pullRequest.state,
      merged: pullRequest.merged,
      labels: pullRequest.labels?.map((label: any) => label.name) || [],
      assignees: pullRequest.assignees?.map((assignee: any) => assignee.login) || []
    },
    occurredAt: new Date()
  };
  
  await db.insert(events).values(eventData);
}

async function handleMilestoneEvent(event: any) {
  const action = event.action;
  const milestone = event.milestone;
  const repository = event.repository;
  
  // Find the repository in our database
  const repo = await db
    .select()
    .from(repos)
    .where(eq(repos.githubRepoId, repository.id))
    .limit(1);
  
  if (repo.length === 0) return;
  
  const eventData = {
    orgId: repo[0].orgId,
    itemId: null,
    type: `milestone_${action}`,
    payload: {
      milestoneId: milestone.id,
      title: milestone.title,
      state: milestone.state
    },
    occurredAt: new Date()
  };
  
  await db.insert(events).values(eventData);
}

async function handleRepositoryEvent(event: any) {
  const action = event.action;
  const repository = event.repository;
  
  // This would handle repository creation/deletion
  console.log(`Repository ${action}: ${repository.full_name}`);
}

export default githubRoutes;