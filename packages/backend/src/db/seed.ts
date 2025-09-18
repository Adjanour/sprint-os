import { db, orgs, repos, sprints, projectItems } from './index';

async function seedDatabase() {
  console.log('Seeding database...');
  
  try {
    // Create a sample organization
    const [sampleOrg] = await db
      .insert(orgs)
      .values({
        githubOrgId: 12345,
        name: 'Sample Organization'
      })
      .returning();
    
    console.log('Created sample organization:', sampleOrg);
    
    // Create a sample repository
    const [sampleRepo] = await db
      .insert(repos)
      .values({
        orgId: sampleOrg.id,
        githubRepoId: 67890,
        name: 'sample-repo',
        fullName: 'sample-org/sample-repo'
      })
      .returning();
    
    console.log('Created sample repository:', sampleRepo);
    
    // Create a sample sprint
    const [sampleSprint] = await db
      .insert(sprints)
      .values({
        orgId: sampleOrg.id,
        title: 'Sprint 1 - MVP Development',
        startDate: '2024-01-01',
        endDate: '2024-01-14',
        goal: 'Build core SprintOS functionality',
        state: 'active'
      })
      .returning();
    
    console.log('Created sample sprint:', sampleSprint);
    
    // Create sample project items
    const sampleItems = [
      {
        repoId: sampleRepo.id,
        sprintId: sampleSprint.id,
        externalType: 'issue' as const,
        externalId: 101,
        title: 'Implement GitHub OAuth integration',
        body: 'Set up GitHub OAuth flow for user authentication',
        labels: ['backend', 'auth'],
        assignees: ['developer1'],
        status: 'in_progress' as const,
        priority: 1,
        estimate: 5
      },
      {
        repoId: sampleRepo.id,
        sprintId: sampleSprint.id,
        externalType: 'issue' as const,
        externalId: 102,
        title: 'Create sprint dashboard',
        body: 'Build the main dashboard for viewing sprint progress',
        labels: ['frontend', 'dashboard'],
        assignees: ['developer2'],
        status: 'backlog' as const,
        priority: 2,
        estimate: 8
      },
      {
        repoId: sampleRepo.id,
        sprintId: sampleSprint.id,
        externalType: 'pr' as const,
        externalId: 103,
        title: 'Add database schema',
        body: 'Create initial database schema for SprintOS',
        labels: ['backend', 'database'],
        assignees: ['developer1'],
        status: 'done' as const,
        priority: 1,
        estimate: 3
      }
    ];
    
    const createdItems = await db
      .insert(projectItems)
      .values(sampleItems)
      .returning();
    
    console.log('Created sample project items:', createdItems.length);
    
    console.log('Database seeding completed successfully!');
    
  } catch (error) {
    console.error('Seeding failed:', error);
    process.exit(1);
  }
}

seedDatabase();