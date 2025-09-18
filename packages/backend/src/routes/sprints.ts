import { Hono } from 'hono';
import { zValidator } from '@hono/zod-validator';
import { z } from 'zod';
import { authMiddleware, requireAuth, requireOrg } from '../middleware/auth';
import { db, sprints, projectItems, docs, threads } from '../db';
import { eq, and, desc } from 'drizzle-orm';

const sprintRoutes = new Hono();

// Apply auth middleware to all routes
sprintRoutes.use('*', authMiddleware, requireAuth, requireOrg);

// Get all sprints for the organization
sprintRoutes.get('/', async (c) => {
  const user = c.get('user');
  const orgId = user.orgId;
  
  try {
    const allSprints = await db
      .select()
      .from(sprints)
      .where(eq(sprints.orgId, orgId))
      .orderBy(desc(sprints.createdAt));
    
    // Get sprint statistics
    const sprintsWithStats = await Promise.all(
      allSprints.map(async (sprint) => {
        const items = await db
          .select()
          .from(projectItems)
          .where(eq(projectItems.sprintId, sprint.id));
        
        const completed = items.filter(item => item.status === 'done').length;
        const inProgress = items.filter(item => 
          item.status === 'in_progress' || item.status === 'in_review'
        ).length;
        
        return {
          ...sprint,
          stats: {
            total: items.length,
            completed,
            inProgress,
            backlog: items.length - completed - inProgress
          }
        };
      })
    );
    
    return c.json(sprintsWithStats);
    
  } catch (error) {
    console.error('Error fetching sprints:', error);
    return c.json({ error: 'Failed to fetch sprints' }, 500);
  }
});

// Get a specific sprint
sprintRoutes.get('/:id', async (c) => {
  const user = c.get('user');
  const orgId = user.orgId;
  const sprintId = parseInt(c.req.param('id'));
  
  try {
    const sprint = await db
      .select()
      .from(sprints)
      .where(and(eq(sprints.id, sprintId), eq(sprints.orgId, orgId)))
      .limit(1);
    
    if (sprint.length === 0) {
      return c.json({ error: 'Sprint not found' }, 404);
    }
    
    // Get sprint items
    const items = await db
      .select()
      .from(projectItems)
      .where(eq(projectItems.sprintId, sprintId));
    
    // Get sprint docs
    const sprintDocs = await db
      .select()
      .from(docs)
      .where(eq(docs.sprintId, sprintId));
    
    return c.json({
      ...sprint[0],
      items,
      docs: sprintDocs
    });
    
  } catch (error) {
    console.error('Error fetching sprint:', error);
    return c.json({ error: 'Failed to fetch sprint' }, 500);
  }
});

// Create a new sprint
sprintRoutes.post('/', zValidator('json', z.object({
  title: z.string().min(1),
  startDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  endDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  goal: z.string().optional()
})), async (c) => {
  const user = c.get('user');
  const orgId = user.orgId;
  const { title, startDate, endDate, goal } = c.req.valid('json');
  
  try {
    const newSprint = await db
      .insert(sprints)
      .values({
        orgId,
        title,
        startDate,
        endDate,
        goal,
        state: 'planned'
      })
      .returning();
    
    return c.json(newSprint[0], 201);
    
  } catch (error) {
    console.error('Error creating sprint:', error);
    return c.json({ error: 'Failed to create sprint' }, 500);
  }
});

// Update a sprint
sprintRoutes.patch('/:id', zValidator('json', z.object({
  title: z.string().min(1).optional(),
  startDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
  endDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
  goal: z.string().optional(),
  state: z.enum(['planned', 'active', 'closed']).optional()
})), async (c) => {
  const user = c.get('user');
  const orgId = user.orgId;
  const sprintId = parseInt(c.req.param('id'));
  const updates = c.req.valid('json');
  
  try {
    const updatedSprint = await db
      .update(sprints)
      .set({
        ...updates,
        updatedAt: new Date()
      })
      .where(and(eq(sprints.id, sprintId), eq(sprints.orgId, orgId)))
      .returning();
    
    if (updatedSprint.length === 0) {
      return c.json({ error: 'Sprint not found' }, 404);
    }
    
    return c.json(updatedSprint[0]);
    
  } catch (error) {
    console.error('Error updating sprint:', error);
    return c.json({ error: 'Failed to update sprint' }, 500);
  }
});

// Delete a sprint
sprintRoutes.delete('/:id', async (c) => {
  const user = c.get('user');
  const orgId = user.orgId;
  const sprintId = parseInt(c.req.param('id'));
  
  try {
    const deletedSprint = await db
      .delete(sprints)
      .where(and(eq(sprints.id, sprintId), eq(sprints.orgId, orgId)))
      .returning();
    
    if (deletedSprint.length === 0) {
      return c.json({ error: 'Sprint not found' }, 404);
    }
    
    return c.json({ message: 'Sprint deleted successfully' });
    
  } catch (error) {
    console.error('Error deleting sprint:', error);
    return c.json({ error: 'Failed to delete sprint' }, 500);
  }
});

// Start a sprint (change state to active)
sprintRoutes.post('/:id/start', async (c) => {
  const user = c.get('user');
  const orgId = user.orgId;
  const sprintId = parseInt(c.req.param('id'));
  
  try {
    const updatedSprint = await db
      .update(sprints)
      .set({
        state: 'active',
        updatedAt: new Date()
      })
      .where(and(eq(sprints.id, sprintId), eq(sprints.orgId, orgId)))
      .returning();
    
    if (updatedSprint.length === 0) {
      return c.json({ error: 'Sprint not found' }, 404);
    }
    
    return c.json(updatedSprint[0]);
    
  } catch (error) {
    console.error('Error starting sprint:', error);
    return c.json({ error: 'Failed to start sprint' }, 500);
  }
});

// Close a sprint (change state to closed)
sprintRoutes.post('/:id/close', async (c) => {
  const user = c.get('user');
  const orgId = user.orgId;
  const sprintId = parseInt(c.req.param('id'));
  
  try {
    const updatedSprint = await db
      .update(sprints)
      .set({
        state: 'closed',
        updatedAt: new Date()
      })
      .where(and(eq(sprints.id, sprintId), eq(sprints.orgId, orgId)))
      .returning();
    
    if (updatedSprint.length === 0) {
      return c.json({ error: 'Sprint not found' }, 404);
    }
    
    return c.json(updatedSprint[0]);
    
  } catch (error) {
    console.error('Error closing sprint:', error);
    return c.json({ error: 'Failed to close sprint' }, 500);
  }
});

export default sprintRoutes;