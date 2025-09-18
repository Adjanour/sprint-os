import { Hono } from 'hono';
import { zValidator } from '@hono/zod-validator';
import { z } from 'zod';
import { authMiddleware, requireAuth, requireOrg } from '../middleware/auth';
import { db, events, projectItems, sprints, repos } from '../db';
import { eq, and, desc, gte, lte, count } from 'drizzle-orm';

const analyticsRoutes = new Hono();

// Apply auth middleware to all routes
analyticsRoutes.use('*', authMiddleware, requireAuth, requireOrg);

// Get sprint analytics
analyticsRoutes.get('/sprint/:id', async (c) => {
  const user = c.get('user');
  const orgId = user.orgId;
  const sprintId = parseInt(c.req.param('id'));
  
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
    
    // Get sprint items
    const items = await db
      .select()
      .from(projectItems)
      .where(eq(projectItems.sprintId, sprintId));
    
    // Calculate basic metrics
    const total = items.length;
    const completed = items.filter(item => item.status === 'done').length;
    const inProgress = items.filter(item => 
      item.status === 'in_progress' || item.status === 'in_review'
    ).length;
    const backlog = total - completed - inProgress;
    
    // Calculate velocity (story points completed)
    const completedItems = items.filter(item => item.status === 'done');
    const velocity = completedItems.reduce((sum, item) => sum + (item.estimate || 0), 0);
    
    // Get events for this sprint
    const sprintEvents = await db
      .select()
      .from(events)
      .where(eq(events.itemId, items[0]?.id || 0)); // This needs to be improved
    
    // Calculate cycle time (simplified)
    const cycleTimeEvents = sprintEvents.filter(event => 
      event.type === 'item_created' || event.type === 'item_completed'
    );
    
    return c.json({
      sprint: sprint[0],
      metrics: {
        total,
        completed,
        inProgress,
        backlog,
        completionRate: total > 0 ? (completed / total) * 100 : 0,
        velocity,
        cycleTime: cycleTimeEvents.length // Simplified
      },
      items: items.map(item => ({
        id: item.id,
        title: item.title,
        status: item.status,
        estimate: item.estimate,
        priority: item.priority
      }))
    });
    
  } catch (error) {
    console.error('Error fetching sprint analytics:', error);
    return c.json({ error: 'Failed to fetch sprint analytics' }, 500);
  }
});

// Get flow metrics for the organization
analyticsRoutes.get('/flow', async (c) => {
  const user = c.get('user');
  const orgId = user.orgId;
  
  const days = parseInt(c.req.query('days') || '30');
  const startDate = new Date();
  startDate.setDate(startDate.getDate() - days);
  
  try {
    // Get all events in the time range
    const flowEvents = await db
      .select()
      .from(events)
      .where(and(
        eq(events.orgId, orgId),
        gte(events.occurredAt, startDate)
      ))
      .orderBy(desc(events.occurredAt));
    
    // Calculate WIP (Work in Progress)
    const wipEvents = flowEvents.filter(event => 
      event.type === 'item_in_progress' || event.type === 'item_completed'
    );
    
    // Calculate cycle time distribution
    const cycleTimeData = flowEvents
      .filter(event => event.type === 'item_completed')
      .map(event => {
        const createdEvent = flowEvents.find(e => 
          e.itemId === event.itemId && e.type === 'item_created'
        );
        if (createdEvent) {
          const cycleTime = new Date(event.occurredAt).getTime() - 
                           new Date(createdEvent.occurredAt).getTime();
          return Math.round(cycleTime / (1000 * 60 * 60 * 24)); // days
        }
        return null;
      })
      .filter(time => time !== null);
    
    // Calculate average cycle time
    const avgCycleTime = cycleTimeData.length > 0 
      ? cycleTimeData.reduce((sum, time) => sum + time!, 0) / cycleTimeData.length 
      : 0;
    
    return c.json({
      period: {
        days,
        startDate: startDate.toISOString(),
        endDate: new Date().toISOString()
      },
      metrics: {
        wip: wipEvents.length,
        avgCycleTime: Math.round(avgCycleTime * 10) / 10,
        cycleTimeDistribution: {
          min: cycleTimeData.length > 0 ? Math.min(...cycleTimeData) : 0,
          max: cycleTimeData.length > 0 ? Math.max(...cycleTimeData) : 0,
          median: cycleTimeData.length > 0 ? cycleTimeData.sort()[Math.floor(cycleTimeData.length / 2)] : 0
        }
      },
      events: flowEvents.slice(0, 100) // Last 100 events
    });
    
  } catch (error) {
    console.error('Error fetching flow metrics:', error);
    return c.json({ error: 'Failed to fetch flow metrics' }, 500);
  }
});

// Get DORA metrics
analyticsRoutes.get('/dora', async (c) => {
  const user = c.get('user');
  const orgId = user.orgId;
  
  const days = parseInt(c.req.query('days') || '30');
  const startDate = new Date();
  startDate.setDate(startDate.getDate() - days);
  
  try {
    // Get deployment events
    const deploymentEvents = await db
      .select()
      .from(events)
      .where(and(
        eq(events.orgId, orgId),
        gte(events.occurredAt, startDate),
        eq(events.type, 'deployment')
      ))
      .orderBy(desc(events.occurredAt));
    
    // Get lead time events (from commit to deployment)
    const leadTimeEvents = await db
      .select()
      .from(events)
      .where(and(
        eq(events.orgId, orgId),
        gte(events.occurredAt, startDate),
        eq(events.type, 'lead_time')
      ))
      .orderBy(desc(events.occurredAt));
    
    // Calculate deployment frequency
    const deploymentFrequency = deploymentEvents.length / (days / 7); // per week
    
    // Calculate lead time for changes
    const leadTimes = leadTimeEvents.map(event => {
      const payload = event.payload as any;
      return payload?.leadTimeHours || 0;
    });
    
    const avgLeadTime = leadTimes.length > 0 
      ? leadTimes.reduce((sum, time) => sum + time, 0) / leadTimes.length 
      : 0;
    
    // Calculate change failure rate (simplified)
    const failureEvents = await db
      .select({ count: count() })
      .from(events)
      .where(and(
        eq(events.orgId, orgId),
        gte(events.occurredAt, startDate),
        eq(events.type, 'deployment_failed')
      ));
    
    const totalDeployments = deploymentEvents.length;
    const changeFailureRate = totalDeployments > 0 
      ? (failureEvents[0]?.count || 0) / totalDeployments * 100 
      : 0;
    
    return c.json({
      period: {
        days,
        startDate: startDate.toISOString(),
        endDate: new Date().toISOString()
      },
      doraMetrics: {
        deploymentFrequency: Math.round(deploymentFrequency * 10) / 10,
        leadTimeForChanges: Math.round(avgLeadTime * 10) / 10,
        changeFailureRate: Math.round(changeFailureRate * 10) / 10,
        // MTTR would need more complex calculation with incident data
        meanTimeToRecovery: 0
      },
      rawData: {
        totalDeployments,
        totalFailures: failureEvents[0]?.count || 0,
        deployments: deploymentEvents.slice(0, 20) // Last 20 deployments
      }
    });
    
  } catch (error) {
    console.error('Error fetching DORA metrics:', error);
    return c.json({ error: 'Failed to fetch DORA metrics' }, 500);
  }
});

// Get organization overview metrics
analyticsRoutes.get('/overview', async (c) => {
  const user = c.get('user');
  const orgId = user.orgId;
  
  try {
    // Get all active sprints
    const activeSprints = await db
      .select()
      .from(sprints)
      .where(and(eq(sprints.orgId, orgId), eq(sprints.state, 'active')));
    
    // Get total project items
    const totalItems = await db
      .select({ count: count() })
      .from(projectItems)
      .leftJoin(repos, eq(projectItems.repoId, repos.id))
      .where(eq(repos.orgId, orgId));
    
    // Get completed items this week
    const weekAgo = new Date();
    weekAgo.setDate(weekAgo.getDate() - 7);
    
    const completedThisWeek = await db
      .select({ count: count() })
      .from(events)
      .where(and(
        eq(events.orgId, orgId),
        gte(events.occurredAt, weekAgo),
        eq(events.type, 'item_completed')
      ));
    
    // Get total repos
    const totalRepos = await db
      .select({ count: count() })
      .from(repos)
      .where(eq(repos.orgId, orgId));
    
    return c.json({
      overview: {
        activeSprints: activeSprints.length,
        totalItems: totalItems[0]?.count || 0,
        completedThisWeek: completedThisWeek[0]?.count || 0,
        totalRepos: totalRepos[0]?.count || 0
      },
      activeSprints: activeSprints.map(sprint => ({
        id: sprint.id,
        title: sprint.title,
        startDate: sprint.startDate,
        endDate: sprint.endDate,
        goal: sprint.goal
      }))
    });
    
  } catch (error) {
    console.error('Error fetching overview metrics:', error);
    return c.json({ error: 'Failed to fetch overview metrics' }, 500);
  }
});

export default analyticsRoutes;