import { Hono } from 'hono';
import { zValidator } from '@hono/zod-validator';
import { z } from 'zod';
import { authMiddleware, requireAuth, requireOrg } from '../middleware/auth';
import { db, projectItems, repos, sprints, milestones } from '../db';
import { eq, and, desc, inArray } from 'drizzle-orm';

const projectItemRoutes = new Hono();

// Apply auth middleware to all routes
projectItemRoutes.use('*', authMiddleware, requireAuth, requireOrg);

// Get project items with optional filters
projectItemRoutes.get('/', async (c) => {
  const user = c.get('user');
  const orgId = user.orgId;
  
  const sprintId = c.req.query('sprint_id');
  const status = c.req.query('status');
  const repoId = c.req.query('repo_id');
  
  try {
    let query = db
      .select({
        id: projectItems.id,
        repoId: projectItems.repoId,
        sprintId: projectItems.sprintId,
        milestoneId: projectItems.milestoneId,
        externalType: projectItems.externalType,
        externalId: projectItems.externalId,
        title: projectItems.title,
        body: projectItems.body,
        labels: projectItems.labels,
        assignees: projectItems.assignees,
        status: projectItems.status,
        priority: projectItems.priority,
        estimate: projectItems.estimate,
        createdAt: projectItems.createdAt,
        updatedAt: projectItems.updatedAt,
        repoName: repos.name,
        repoFullName: repos.fullName,
        sprintTitle: sprints.title,
        milestoneTitle: milestones.title
      })
      .from(projectItems)
      .leftJoin(repos, eq(projectItems.repoId, repos.id))
      .leftJoin(sprints, eq(projectItems.sprintId, sprints.id))
      .leftJoin(milestones, eq(projectItems.milestoneId, milestones.id))
      .where(eq(repos.orgId, orgId))
      .orderBy(desc(projectItems.createdAt));
    
    // Apply filters
    if (sprintId) {
      query = query.where(and(
        eq(repos.orgId, orgId),
        eq(projectItems.sprintId, parseInt(sprintId))
      ));
    }
    
    if (status) {
      query = query.where(and(
        eq(repos.orgId, orgId),
        eq(projectItems.status, status)
      ));
    }
    
    if (repoId) {
      query = query.where(and(
        eq(repos.orgId, orgId),
        eq(projectItems.repoId, parseInt(repoId))
      ));
    }
    
    const items = await query;
    
    return c.json(items);
    
  } catch (error) {
    console.error('Error fetching project items:', error);
    return c.json({ error: 'Failed to fetch project items' }, 500);
  }
});

// Get a specific project item
projectItemRoutes.get('/:id', async (c) => {
  const user = c.get('user');
  const orgId = user.orgId;
  const itemId = parseInt(c.req.param('id'));
  
  try {
    const item = await db
      .select({
        id: projectItems.id,
        repoId: projectItems.repoId,
        sprintId: projectItems.sprintId,
        milestoneId: projectItems.milestoneId,
        externalType: projectItems.externalType,
        externalId: projectItems.externalId,
        title: projectItems.title,
        body: projectItems.body,
        labels: projectItems.labels,
        assignees: projectItems.assignees,
        status: projectItems.status,
        priority: projectItems.priority,
        estimate: projectItems.estimate,
        createdAt: projectItems.createdAt,
        updatedAt: projectItems.updatedAt,
        repoName: repos.name,
        repoFullName: repos.fullName,
        sprintTitle: sprints.title,
        milestoneTitle: milestones.title
      })
      .from(projectItems)
      .leftJoin(repos, eq(projectItems.repoId, repos.id))
      .leftJoin(sprints, eq(projectItems.sprintId, sprints.id))
      .leftJoin(milestones, eq(projectItems.milestoneId, milestones.id))
      .where(and(eq(projectItems.id, itemId), eq(repos.orgId, orgId)))
      .limit(1);
    
    if (item.length === 0) {
      return c.json({ error: 'Project item not found' }, 404);
    }
    
    return c.json(item[0]);
    
  } catch (error) {
    console.error('Error fetching project item:', error);
    return c.json({ error: 'Failed to fetch project item' }, 500);
  }
});

// Update a project item
projectItemRoutes.patch('/:id', zValidator('json', z.object({
  sprintId: z.number().optional(),
  status: z.enum(['backlog', 'in_progress', 'in_review', 'done']).optional(),
  priority: z.number().optional(),
  estimate: z.number().optional(),
  labels: z.array(z.string()).optional(),
  assignees: z.array(z.string()).optional()
})), async (c) => {
  const user = c.get('user');
  const orgId = user.orgId;
  const itemId = parseInt(c.req.param('id'));
  const updates = c.req.valid('json');
  
  try {
    // Verify the item belongs to the user's org
    const existingItem = await db
      .select()
      .from(projectItems)
      .leftJoin(repos, eq(projectItems.repoId, repos.id))
      .where(and(eq(projectItems.id, itemId), eq(repos.orgId, orgId)))
      .limit(1);
    
    if (existingItem.length === 0) {
      return c.json({ error: 'Project item not found' }, 404);
    }
    
    const updatedItem = await db
      .update(projectItems)
      .set({
        ...updates,
        updatedAt: new Date()
      })
      .where(eq(projectItems.id, itemId))
      .returning();
    
    return c.json(updatedItem[0]);
    
  } catch (error) {
    console.error('Error updating project item:', error);
    return c.json({ error: 'Failed to update project item' }, 500);
  }
});

// Assign items to a sprint
projectItemRoutes.post('/assign-to-sprint', zValidator('json', z.object({
  itemIds: z.array(z.number()),
  sprintId: z.number()
})), async (c) => {
  const user = c.get('user');
  const orgId = user.orgId;
  const { itemIds, sprintId } = c.req.valid('json');
  
  try {
    // Verify sprint belongs to the user's org
    const sprint = await db
      .select()
      .from(sprints)
      .where(and(eq(sprints.id, sprintId), eq(sprints.orgId, orgId)))
      .limit(1);
    
    if (sprint.length === 0) {
      return c.json({ error: 'Sprint not found' }, 404);
    }
    
    // Update items
    const updatedItems = await db
      .update(projectItems)
      .set({
        sprintId,
        updatedAt: new Date()
      })
      .where(inArray(projectItems.id, itemIds))
      .returning();
    
    return c.json({
      message: 'Items assigned to sprint successfully',
      items: updatedItems
    });
    
  } catch (error) {
    console.error('Error assigning items to sprint:', error);
    return c.json({ error: 'Failed to assign items to sprint' }, 500);
  }
});

// Move items between statuses (bulk update)
projectItemRoutes.post('/bulk-update-status', zValidator('json', z.object({
  itemIds: z.array(z.number()),
  status: z.enum(['backlog', 'in_progress', 'in_review', 'done'])
})), async (c) => {
  const user = c.get('user');
  const orgId = user.orgId;
  const { itemIds, status } = c.req.valid('json');
  
  try {
    // Verify items belong to the user's org
    const items = await db
      .select()
      .from(projectItems)
      .leftJoin(repos, eq(projectItems.repoId, repos.id))
      .where(and(inArray(projectItems.id, itemIds), eq(repos.orgId, orgId)));
    
    if (items.length !== itemIds.length) {
      return c.json({ error: 'Some items not found or not accessible' }, 404);
    }
    
    // Update items
    const updatedItems = await db
      .update(projectItems)
      .set({
        status,
        updatedAt: new Date()
      })
      .where(inArray(projectItems.id, itemIds))
      .returning();
    
    return c.json({
      message: 'Items updated successfully',
      items: updatedItems
    });
    
  } catch (error) {
    console.error('Error bulk updating items:', error);
    return c.json({ error: 'Failed to update items' }, 500);
  }
});

export default projectItemRoutes;