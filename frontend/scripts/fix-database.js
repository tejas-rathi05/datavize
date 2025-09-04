const { PrismaClient } = require('@prisma/client');

async function fixDatabase() {
  const prisma = new PrismaClient();
  
  try {
    console.log('Connecting to database...');
    await prisma.$connect();
    
    console.log('Checking database tables...');
    
    // Check if foreign key constraints exist
    const constraints = await prisma.$queryRaw`
      SELECT 
        tc.constraint_name, 
        tc.table_name, 
        kcu.column_name, 
        ccu.table_name AS foreign_table_name,
        ccu.column_name AS foreign_column_name 
      FROM 
        information_schema.table_constraints AS tc 
        JOIN information_schema.key_column_usage AS kcu
          ON tc.constraint_name = kcu.constraint_name
          AND tc.table_schema = kcu.table_schema
        JOIN information_schema.constraint_column_usage AS ccu
          ON ccu.constraint_name = tc.constraint_name
          AND ccu.table_schema = tc.table_schema
      WHERE tc.constraint_type = 'FOREIGN KEY' 
        AND tc.table_name IN ('projects', 'project_files', 'workflows', 'chat_sessions');
    `;
    
    console.log('Existing foreign key constraints:', constraints);
    
    if (constraints.length === 0) {
      console.log('No foreign key constraints found. Adding them...');
      
      // Add foreign key constraints
      await prisma.$executeRaw`ALTER TABLE "projects" ADD CONSTRAINT "projects_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;`;
      await prisma.$executeRaw`ALTER TABLE "project_files" ADD CONSTRAINT "project_files_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "projects"("id") ON DELETE CASCADE ON UPDATE CASCADE;`;
      await prisma.$executeRaw`ALTER TABLE "workflows" ADD CONSTRAINT "workflows_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "projects"("id") ON DELETE CASCADE ON UPDATE CASCADE;`;
      await prisma.$executeRaw`ALTER TABLE "chat_sessions" ADD CONSTRAINT "chat_sessions_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;`;
      
      console.log('Foreign key constraints added successfully!');
    } else {
      console.log('Foreign key constraints already exist.');
    }
    
    // Test creating a user and project
    console.log('Testing user and project creation...');
    
    const testUser = await prisma.user.upsert({
      where: { id: 'test-user-123' },
      update: {},
      create: {
        id: 'test-user-123',
        email: 'test@example.com',
        fullName: 'Test User'
      }
    });
    
    console.log('Test user created:', testUser.id);
    
    const testProject = await prisma.project.create({
      data: {
        name: 'Test Project',
        description: 'Test project for database validation',
        userId: testUser.id
      },
      include: {
        user: true
      }
    });
    
    console.log('Test project created:', testProject.id);
    console.log('Test project user:', testProject.user?.id);
    
    // Clean up test data
    await prisma.project.delete({ where: { id: testProject.id } });
    await prisma.user.delete({ where: { id: testUser.id } });
    
    console.log('Test data cleaned up successfully!');
    console.log('Database is working correctly!');
    
  } catch (error) {
    console.error('Error fixing database:', error);
  } finally {
    await prisma.$disconnect();
  }
}

fixDatabase();
