import { Hono } from 'hono';
import { zValidator } from '@hono/zod-validator';
import { z } from 'zod';
import { authMiddleware, requireAuth, requireOrg } from '../middleware/auth';
import { db, threads, projectItems, sprints } from '../db';
import { eq, and, desc } from 'drizzle-orm';

const threadRoutes = new Hono();

// Apply auth middleware to all routes
threadRoutes.use('*', authMiddleware, requireAuth, requireOrg);

// Get threads with optional filters
threadRoutes.get('/', async (c) => {
  const user = c.get('user');
  const orgId = user.orgId;
  
  const sprintId = c.req.query('sprint_id');
  const itemId = c.req.query('item_id');
  
  try {
    let query = db
      .select()
      .from(threads)
      .orderBy(desc(threads.createdAt));
    
    // Apply filters and verify org access
    if (sprintId) {
      const sprint = await db
        .select()
        .from(sprints)
        .where(and(eq(sprints.id, parseInt(sprintId)), eq(sprints.orgId, orgId)))
        .limit(1);
      
      if (sprint.length === 0) {
        return c.json({ error: 'Sprint not found' }, 404);
      }
      
      query = query.where(eq(threads.sprintId, parseInt(sprintId)));
    }
    
    if (itemId) {
      const item = await db
        .select()
        .from(projectItems)
        .leftJoin(repos, eq(projectItems.repoId, repos.id))
        .where(and(eq(projectItems.id, parseInt(itemId)), eq(repos.orgId, orgId)))
        .limit(1);
      
      if (item.length === 0) {
        return c.json({ error: 'Project item not found' }, 404);
      }
      
      query = query.where(eq(threads.itemId, parseInt(itemId)));
    }
    
    const threadsList = await query;
    
    return c.json(threadsList);
    
  } catch (error) {
    console.error('Error fetching threads:', error);
    return c.json({ error: 'Failed to fetch threads' }, 500);
  }
});

// Get a specific thread
threadRoutes.get('/:id', async (c) => {
  const user = c.get('user');
  const orgId = user.orgId;
  const threadId = parseInt(c.req.param('id'));
  
  try {
    const thread = await db
      .select()
      .from(threads)
      .where(eq(threads.id, threadId))
      .limit(1);
    
    if (thread.length === 0) {
      return c.json({ error: 'Thread not found' }, 404);
    }
    
    // Verify access to the thread
    if (thread[0].sprintId) {
      const sprint = await db
        .select()
        .from(sprints)
        .where(and(eq(sprints.id, thread[0].sprintId), eq(sprints.orgId, orgId)))
        .limit(1);
      
      if (sprint.length === 0) {
        return c.json({ error: 'Thread not found' }, 404);
      }
    }
    
    if (thread[0].itemId) {
      const item = await db
        .select()
        .from(projectItems)
        .leftJoin(repos, eq(projectItems.repoId, repos.id))
        .where(and(eq(projectItems.id, thread[0].itemId), eq(repos.orgId, orgId)))
        .limit(1);
      
      if (item.length === 0) {
        return c.json({ error: 'Thread not found' }, 404);
      }
    }
    
    return c.json(thread[0]);
    
  } catch (error) {
    console.error('Error fetching thread:', error);
    return c.json({ error: 'Failed to fetch thread' }, 500);
  }
});

// Create a new thread
threadRoutes.post('/', zValidator('json', z.object({
  sprintId: z.number().optional(),
  itemId: z.number().optional(),
  messages: z.array(z.object({
    id: z.string(),
    author: z.string(),
    content: z.string(),
    timestamp: z.string()
  })).default([])
})), async (c) => {
  const user = c.get('user');
  const orgId = user.orgId;
  const { sprintId, itemId, messages } = c.req.valid('json');
  
  try {
    // Verify sprint or item belongs to the user's org if provided
    if (sprintId) {
      const sprint = await db
        .select()
        .from(sprints)
        .where(and(eq(sprints.id, sprintId), eq(sprints.orgId, orgId)))
        .limit(1);
      
      if (sprint.length === 0) {
        return c.json({ error: 'Sprint not found' }, 404);
      }
    }
    
    if (itemId) {
      const item = await db
        .select()
        .from(projectItems)
        .leftJoin(repos, eq(projectItems.repoId, repos.id))
        .where(and(eq(projectItems.id, itemId), eq(repos.orgId, orgId)))
        .limit(1);
      
      if (item.length === 0) {
        return c.json({ error: 'Project item not found' }, 404);
      }
    }
    
    const newThread = await db
      .insert(threads)
      .values({
        sprintId,
        itemId,
        messages
      })
      .returning();
    
    return c.json(newThread[0], 201);
    
  } catch (error) {
    console.error('Error creating thread:', error);
    return c.json({ error: 'Failed to create thread' }, 500);
  }
});

// Add message to thread
threadRoutes.post('/:id/messages', zValidator('json', z.object({
  author: z.string(),
  content: z.string()
})), async (c) => {
  const user = c.get('user');
  const orgId = user.orgId;
  const threadId = parseInt(c.req.param('id'));
  const { author, content } = c.req.valid('json');
  
  try {
    // Get current thread
    const currentThread = await db
      .select()
      .from(threads)
      .where(eq(threads.id, threadId))
      .limit(1);
    
    if (currentThread.length === 0) {
      return c.json({ error: 'Thread not found' }, 404);
    }
    
    // Verify access to the thread
    if (currentThread[0].sprintId) {
      const sprint = await db
        .select()
        .from(sprints)
        .where(and(eq(sprints.id, currentThread[0].sprintId), eq(sprints.orgId, orgId)))
        .limit(1);
      
      if (sprint.length === 0) {
        return c.json({ error: 'Thread not found' }, 404);
      }
    }
    
    if (currentThread[0].itemId) {
      const item = await db
        .select()
        .from(projectItems)
        .leftJoin(repos, eq(projectItems.repoId, repos.id))
        .where(and(eq(projectItems.id, currentThread[0].itemId), eq(repos.orgId, orgId)))
        .limit(1);
      
      if (item.length === 0) {
        return c.json({ error: 'Thread not found' }, 404);
      }
    }
    
    // Add new message
    const messages = currentThread[0].messages as any[] || [];
    const newMessage = {
      id: `msg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      author,
      content,
      timestamp: new Date().toISOString()
    };
    
    const updatedThread = await db
      .update(threads)
      .set({
        messages: [...messages, newMessage],
        updatedAt: new Date()
      })
      .where(eq(threads.id, threadId))
      .returning();
    
    return c.json(updatedThread[0]);
    
  } catch (error) {
    console.error('Error adding message to thread:', error);
    return c.json({ error: 'Failed to add message' }, 500);
  }
});

// Delete a thread
threadRoutes.delete('/:id', async (c) => {
  const user = c.get('user');
  const orgId = user.orgId;
  const threadId = parseInt(c.req.param('id'));
  
  try {
    // Verify access to the thread before deletion
    const thread = await db
      .select()
      .from(threads)
      .where(eq(threads.id, threadId))
      .limit(1);
    
    if (thread.length === 0) {
      return c.json({ error: 'Thread not found' }, 404);
    }
    
    // Verify access
    if (thread[0].sprintId) {
      const sprint = await db
        .select()
        .from(sprints)
        .where(and(eq(sprints.id, thread[0].sprintId), eq(sprints.orgId, orgId)))
        .limit(1);
      
      if (sprint.length === 0) {
        return c.json({ error: 'Thread not found' }, 404);
      }
    }
    
    if (thread[0].itemId) {
      const item = await db
        .select()
        .from(projectItems)
        .leftJoin(repos, eq(projectItems.repoId, repos.id))
        .where(and(eq(projectItems.id, thread[0].itemId), eq(repos.orgId, orgId)))
        .limit(1);
      
      if (item.length === 0) {
        return c.json({ error: 'Thread not found' }, 404);
      }
    }
    
    const deletedThread = await db
      .delete(threads)
      .where(eq(threads.id, threadId))
      .returning();
    
    return c.json({ message: 'Thread deleted successfully' });
    
  } catch (error) {
    console.error('Error deleting thread:', error);
    return c.json({ error: 'Failed to delete thread' }, 500);
  }
});

export default threadRoutes;