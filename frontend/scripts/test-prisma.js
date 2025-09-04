#!/usr/bin/env node

/**
 * Test Prisma Setup
 * This script tests if Prisma is properly configured
 */

const { PrismaClient } = require('@prisma/client');

async function testPrisma() {
  console.log('🧪 Testing Prisma setup...\n');

  try {
    // Test if Prisma client can be instantiated
    console.log('1. Testing Prisma client instantiation...');
    const prisma = new PrismaClient();
    console.log('✅ Prisma client created successfully\n');

    // Test database connection
    console.log('2. Testing database connection...');
    await prisma.$connect();
    console.log('✅ Database connection successful\n');

    // Test if we can query the database
    console.log('3. Testing database query...');
    const userCount = await prisma.user.count();
    console.log(`✅ Database query successful. Users count: ${userCount}\n`);

    // Clean up
    await prisma.$disconnect();
    console.log('🎉 All Prisma tests passed!');
    console.log('\nNext steps:');
    console.log('1. Create your .env.local file with DATABASE_URL');
    console.log('2. Run: npm run db:push');
    console.log('3. Run: npm run db:seed');
    console.log('4. Start your dev server: npm run dev');

  } catch (error) {
    console.error('❌ Prisma test failed:', error.message);
    
    if (error.message.includes('DATABASE_URL')) {
      console.log('\n💡 Solution: Create .env.local with your DATABASE_URL');
      console.log('Example:');
      console.log('DATABASE_URL="postgresql://postgres:[PASSWORD]@db.[PROJECT-REF].supabase.co:5432/postgres"');
    } else if (error.message.includes('connect')) {
      console.log('\n💡 Solution: Check your DATABASE_URL and ensure your Supabase project is active');
    } else {
      console.log('\n💡 Solution: Run "npm run db:generate" to generate the Prisma client');
    }
    
    process.exit(1);
  }
}

testPrisma();
