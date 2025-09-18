import { pgTable, serial, text, timestamp, integer, bigint, jsonb, date, boolean, pgEnum } from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';

// Enums
export const sprintStateEnum = pgEnum('sprint_state', ['planned', 'active', 'closed']);
export const milestoneStateEnum = pgEnum('milestone_state', ['open', 'closed']);
export const externalTypeEnum = pgEnum('external_type', ['issue', 'pr']);
export const itemStatusEnum = pgEnum('item_status', ['backlog', 'in_progress', 'in_review', 'done']);

// Tables
export const orgs = pgTable('orgs', {
  id: serial('id').primaryKey(),
  githubOrgId: bigint('github_org_id', { mode: 'number' }).unique().notNull(),
  name: text('name').notNull(),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow()
});

export const repos = pgTable('repos', {
  id: serial('id').primaryKey(),
  orgId: integer('org_id').references(() => orgs.id, { onDelete: 'cascade' }).notNull(),
  githubRepoId: bigint('github_repo_id', { mode: 'number' }).notNull(),
  name: text('name').notNull(),
  fullName: text('full_name').notNull(),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow()
});

export const sprints = pgTable('sprints', {
  id: serial('id').primaryKey(),
  orgId: integer('org_id').references(() => orgs.id, { onDelete: 'cascade' }).notNull(),
  title: text('title').notNull(),
  startDate: date('start_date').notNull(),
  endDate: date('end_date').notNull(),
  goal: text('goal'),
  state: sprintStateEnum('state').default('planned'),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow()
});

export const milestones = pgTable('milestones', {
  id: serial('id').primaryKey(),
  repoId: integer('repo_id').references(() => repos.id, { onDelete: 'cascade' }).notNull(),
  githubMilestoneId: bigint('github_milestone_id', { mode: 'number' }),
  title: text('title').notNull(),
  description: text('description'),
  dueDate: date('due_date'),
  state: milestoneStateEnum('state').default('open'),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow()
});

export const projectItems = pgTable('project_items', {
  id: serial('id').primaryKey(),
  repoId: integer('repo_id').references(() => repos.id, { onDelete: 'cascade' }).notNull(),
  sprintId: integer('sprint_id').references(() => sprints.id),
  milestoneId: integer('milestone_id').references(() => milestones.id),
  externalType: externalTypeEnum('external_type').notNull(),
  externalId: bigint('external_id', { mode: 'number' }).notNull(), // GitHub issue/PR ID
  title: text('title').notNull(),
  body: text('body'),
  labels: jsonb('labels').default('[]'),
  assignees: jsonb('assignees').default('[]'),
  status: itemStatusEnum('status').default('backlog'),
  priority: integer('priority').default(0),
  estimate: integer('estimate'),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow()
});

export const docs = pgTable('docs', {
  id: serial('id').primaryKey(),
  orgId: integer('org_id').references(() => orgs.id, { onDelete: 'cascade' }).notNull(),
  sprintId: integer('sprint_id').references(() => sprints.id),
  itemId: integer('item_id').references(() => projectItems.id),
  title: text('title').notNull(),
  bodyMarkdown: text('body_markdown').notNull(),
  version: integer('version').default(1),
  author: text('author'),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow()
});

export const threads = pgTable('threads', {
  id: serial('id').primaryKey(),
  itemId: integer('item_id').references(() => projectItems.id, { onDelete: 'cascade' }),
  sprintId: integer('sprint_id').references(() => sprints.id),
  messages: jsonb('messages').default('[]'),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow()
});

export const events = pgTable('events', {
  id: serial('id').primaryKey(),
  orgId: integer('org_id').references(() => orgs.id, { onDelete: 'cascade' }).notNull(),
  itemId: integer('item_id').references(() => projectItems.id),
  type: text('type').notNull(),
  payload: jsonb('payload').notNull(),
  occurredAt: timestamp('occurred_at').notNull()
});

// Relations
export const orgsRelations = relations(orgs, ({ many }) => ({
  repos: many(repos),
  sprints: many(sprints),
  docs: many(docs),
  events: many(events)
}));

export const reposRelations = relations(repos, ({ one, many }) => ({
  org: one(orgs, {
    fields: [repos.orgId],
    references: [orgs.id]
  }),
  milestones: many(milestones),
  projectItems: many(projectItems)
}));

export const sprintsRelations = relations(sprints, ({ one, many }) => ({
  org: one(orgs, {
    fields: [sprints.orgId],
    references: [orgs.id]
  }),
  projectItems: many(projectItems),
  docs: many(docs),
  threads: many(threads)
}));

export const milestonesRelations = relations(milestones, ({ one, many }) => ({
  repo: one(repos, {
    fields: [milestones.repoId],
    references: [repos.id]
  }),
  projectItems: many(projectItems)
}));

export const projectItemsRelations = relations(projectItems, ({ one, many }) => ({
  repo: one(repos, {
    fields: [projectItems.repoId],
    references: [repos.id]
  }),
  sprint: one(sprints, {
    fields: [projectItems.sprintId],
    references: [sprints.id]
  }),
  milestone: one(milestones, {
    fields: [projectItems.milestoneId],
    references: [milestones.id]
  }),
  docs: many(docs),
  threads: many(threads),
  events: many(events)
}));

export const docsRelations = relations(docs, ({ one }) => ({
  org: one(orgs, {
    fields: [docs.orgId],
    references: [orgs.id]
  }),
  sprint: one(sprints, {
    fields: [docs.sprintId],
    references: [sprints.id]
  }),
  item: one(projectItems, {
    fields: [docs.itemId],
    references: [projectItems.id]
  })
}));

export const threadsRelations = relations(threads, ({ one }) => ({
  item: one(projectItems, {
    fields: [threads.itemId],
    references: [projectItems.id]
  }),
  sprint: one(sprints, {
    fields: [threads.sprintId],
    references: [sprints.id]
  })
}));

export const eventsRelations = relations(events, ({ one }) => ({
  org: one(orgs, {
    fields: [events.orgId],
    references: [orgs.id]
  }),
  item: one(projectItems, {
    fields: [events.itemId],
    references: [projectItems.id]
  })
}));