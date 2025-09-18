import { Hono } from 'hono';
import { zValidator } from '@hono/zod-validator';
import { z } from 'zod';
import { Octokit } from '@octokit/rest';
import jwt from 'jsonwebtoken';
import { authMiddleware, requireAuth, JWTPayload } from '../middleware/auth';
import { db, orgs } from '../db';
import { eq } from 'drizzle-orm';

const auth = new Hono();

// GitHub OAuth callback
auth.post('/github/callback', zValidator('json', z.object({
  code: z.string(),
  state: z.string().optional()
})), async (c) => {
  const { code } = c.req.valid('json');
  
  try {
    // Exchange code for access token
    const tokenResponse = await fetch('https://github.com/login/oauth/access_token', {
      method: 'POST',
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        client_id: process.env.GITHUB_CLIENT_ID,
        client_secret: process.env.GITHUB_CLIENT_SECRET,
        code
      })
    });
    
    const tokenData = await tokenResponse.json();
    
    if (!tokenData.access_token) {
      return c.json({ error: 'Failed to get access token' }, 400);
    }
    
    // Get user info from GitHub
    const octokit = new Octokit({
      auth: tokenData.access_token
    });
    
    const { data: user } = await octokit.rest.users.getAuthenticated();
    
    // Create JWT token
    const jwtPayload: JWTPayload = {
      userId: user.id.toString(),
      githubUserId: user.id.toString(),
      githubUsername: user.login,
      orgId: undefined // Will be set when user selects an org
    };
    
    const token = jwt.sign(jwtPayload, process.env.JWT_SECRET || 'your-secret-key', {
      expiresIn: '7d'
    });
    
    return c.json({
      token,
      user: {
        id: user.id,
        username: user.login,
        name: user.name,
        email: user.email,
        avatar: user.avatar_url
      }
    });
    
  } catch (error) {
    console.error('GitHub OAuth error:', error);
    return c.json({ error: 'Authentication failed' }, 500);
  }
});

// Get current user
auth.get('/me', authMiddleware, requireAuth, async (c) => {
  const user = c.get('user') as JWTPayload;
  
  return c.json({
    id: user.userId,
    githubUserId: user.githubUserId,
    githubUsername: user.githubUsername,
    orgId: user.orgId
  });
});

// Get user's organizations
auth.get('/orgs', authMiddleware, requireAuth, async (c) => {
  const user = c.get('user') as JWTPayload;
  
  try {
    const octokit = new Octokit({
      auth: `token ${c.req.header('authorization')?.replace('Bearer ', '')}`
    });
    
    const { data: orgs } = await octokit.rest.orgs.listForAuthenticatedUser();
    
    // Get SprintOS orgs for this user
    const sprintOsOrgs = await db.select().from(orgs);
    
    return c.json({
      githubOrgs: orgs,
      sprintOsOrgs
    });
    
  } catch (error) {
    console.error('Error fetching orgs:', error);
    return c.json({ error: 'Failed to fetch organizations' }, 500);
  }
});

// Select organization
auth.post('/org/select', authMiddleware, requireAuth, zValidator('json', z.object({
  orgId: z.number()
})), async (c) => {
  const user = c.get('user') as JWTPayload;
  const { orgId } = c.req.valid('json');
  
  // Verify user has access to this org
  const org = await db.select().from(orgs).where(eq(orgs.id, orgId)).limit(1);
  
  if (org.length === 0) {
    return c.json({ error: 'Organization not found' }, 404);
  }
  
  // Update user's selected org
  const updatedPayload: JWTPayload = {
    ...user,
    orgId
  };
  
  const token = jwt.sign(updatedPayload, process.env.JWT_SECRET || 'your-secret-key', {
    expiresIn: '7d'
  });
  
  return c.json({ token });
});

export default auth;