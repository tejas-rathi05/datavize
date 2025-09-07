// Script to check and create Supabase storage buckets
// Run with: node scripts/check-supabase-buckets.js

const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

async function checkBuckets() {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  );

  try {
    console.log('🔍 Checking available buckets...');
    
    // List all buckets
    const { data: buckets, error: listError } = await supabase.storage.listBuckets();
    
    if (listError) {
      console.error('❌ Error listing buckets:', listError);
      return;
    }

    console.log('📦 Available buckets:');
    buckets.forEach(bucket => {
      console.log(`  - ${bucket.name} (public: ${bucket.public})`);
    });

    // Check if project-files bucket exists
    const projectFilesBucket = buckets.find(bucket => bucket.name === 'project-files');
    
    if (!projectFilesBucket) {
      console.log('\n⚠️  project-files bucket not found!');
      console.log('🔧 Creating project-files bucket...');
      
      const { data: createData, error: createError } = await supabase.storage.createBucket('project-files', {
        public: true,
        allowedMimeTypes: null,
        fileSizeLimit: null
      });

      if (createError) {
        console.error('❌ Error creating bucket:', createError);
      } else {
        console.log('✅ project-files bucket created successfully!');
        console.log('📋 Bucket details:', createData);
      }
    } else {
      console.log('\n✅ project-files bucket found!');
      console.log('📋 Bucket details:', projectFilesBucket);
    }

  } catch (error) {
    console.error('❌ Unexpected error:', error);
  }
}

checkBuckets();
