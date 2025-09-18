import { Hono } from 'hono';
import { zValidator } from '@hono/zod-validator';
import { z } from 'zod';
import { authMiddleware, requireAuth, requireOrg } from '../middleware/auth';
import { db, docs, sprints, projectItems } from '../db';
import { eq, and, desc } from 'drizzle-orm';

const docRoutes = new Hono();

// Apply auth middleware to all routes
docRoutes.use('*', authMiddleware, requireAuth, requireOrg);

// Get docs with optional filters
docRoutes.get('/', async (c) => {
  const user = c.get('user');
  const orgId = user.orgId;
  
  const sprintId = c.req.query('sprint_id');
  const itemId = c.req.query('item_id');
  
  try {
    let query = db
      .select()
      .from(docs)
      .where(eq(docs.orgId, orgId))
      .orderBy(desc(docs.createdAt));
    
    // Apply filters
    if (sprintId) {
      query = query.where(and(
        eq(docs.orgId, orgId),
        eq(docs.sprintId, parseInt(sprintId))
      ));
    }
    
    if (itemId) {
      query = query.where(and(
        eq(docs.orgId, orgId),
        eq(docs.itemId, parseInt(itemId))
      ));
    }
    
    const docsList = await query;
    
    return c.json(docsList);
    
  } catch (error) {
    console.error('Error fetching docs:', error);
    return c.json({ error: 'Failed to fetch docs' }, 500);
  }
});

// Get a specific doc
docRoutes.get('/:id', async (c) => {
  const user = c.get('user');
  const orgId = user.orgId;
  const docId = parseInt(c.req.param('id'));
  
  try {
    const doc = await db
      .select()
      .from(docs)
      .where(and(eq(docs.id, docId), eq(docs.orgId, orgId)))
      .limit(1);
    
    if (doc.length === 0) {
      return c.json({ error: 'Document not found' }, 404);
    }
    
    return c.json(doc[0]);
    
  } catch (error) {
    console.error('Error fetching doc:', error);
    return c.json({ error: 'Failed to fetch doc' }, 500);
  }
});

// Create a new doc
docRoutes.post('/', zValidator('json', z.object({
  title: z.string().min(1),
  bodyMarkdown: z.string(),
  sprintId: z.number().optional(),
  itemId: z.number().optional(),
  author: z.string().optional()
})), async (c) => {
  const user = c.get('user');
  const orgId = user.orgId;
  const { title, bodyMarkdown, sprintId, itemId, author } = c.req.valid('json');
  
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
    
    const newDoc = await db
      .insert(docs)
      .values({
        orgId,
        title,
        bodyMarkdown,
        sprintId,
        itemId,
        author: author || user.githubUsername,
        version: 1
      })
      .returning();
    
    return c.json(newDoc[0], 201);
    
  } catch (error) {
    console.error('Error creating doc:', error);
    return c.json({ error: 'Failed to create doc' }, 500);
  }
});

// Update a doc
docRoutes.patch('/:id', zValidator('json', z.object({
  title: z.string().min(1).optional(),
  bodyMarkdown: z.string().optional()
})), async (c) => {
  const user = c.get('user');
  const orgId = user.orgId;
  const docId = parseInt(c.req.param('id'));
  const updates = c.req.valid('json');
  
  try {
    // Get current version
    const currentDoc = await db
      .select()
      .from(docs)
      .where(and(eq(docs.id, docId), eq(docs.orgId, orgId)))
      .limit(1);
    
    if (currentDoc.length === 0) {
      return c.json({ error: 'Document not found' }, 404);
    }
    
    const updatedDoc = await db
      .update(docs)
      .set({
        ...updates,
        version: currentDoc[0].version + 1,
        updatedAt: new Date()
      })
      .where(and(eq(docs.id, docId), eq(docs.orgId, orgId)))
      .returning();
    
    return c.json(updatedDoc[0]);
    
  } catch (error) {
    console.error('Error updating doc:', error);
    return c.json({ error: 'Failed to update doc' }, 500);
  }
});

// Delete a doc
docRoutes.delete('/:id', async (c) => {
  const user = c.get('user');
  const orgId = user.orgId;
  const docId = parseInt(c.req.param('id'));
  
  try {
    const deletedDoc = await db
      .delete(docs)
      .where(and(eq(docs.id, docId), eq(docs.orgId, orgId)))
      .returning();
    
    if (deletedDoc.length === 0) {
      return c.json({ error: 'Document not found' }, 404);
    }
    
    return c.json({ message: 'Document deleted successfully' });
    
  } catch (error) {
    console.error('Error deleting doc:', error);
    return c.json({ error: 'Failed to delete doc' }, 500);
  }
});

export default docRoutes;