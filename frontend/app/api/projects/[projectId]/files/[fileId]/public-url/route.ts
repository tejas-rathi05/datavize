import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { PrismaClient } from '@prisma/client'

// GET /api/projects/[projectId]/files/[fileId]/public-url - Get public URL for file
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ projectId: string; fileId: string }> }
) {
  try {
    const { projectId, fileId } = await params
    console.log('Public URL request for:', { projectId, fileId })
    
    // Get the authorization header
    const authHeader = request.headers.get('authorization')
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      console.error('Missing authorization header')
      return NextResponse.json({ error: 'Missing authorization header' }, { status: 401 })
    }
    
    const token = authHeader.substring(7)
    
    // Create a Supabase client for authentication
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        global: {
          headers: {
            Authorization: `Bearer ${token}`
          }
        },
        auth: {
          autoRefreshToken: false,
          persistSession: false
        }
      }
    )
    
    // Verify the token and get user
    const { data: { user }, error: authError } = await supabase.auth.getUser(token)
    
    if (authError || !user) {
      console.error('Auth error:', authError)
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Check if user exists in database
    const prisma = new PrismaClient()
    try {
      let dbUser = await prisma.user.findUnique({
        where: { id: user.id }
      })
      
      if (!dbUser) {
        await prisma.$disconnect()
        return NextResponse.json({ error: 'User not found' }, { status: 404 })
      }
    } catch (dbError) {
      console.error('Database user check failed:', dbError)
      await prisma.$disconnect()
      return NextResponse.json(
        { error: 'Database user check failed' },
        { status: 500 }
      )
    }

    // Get the file record
    const file = await prisma.projectFile.findFirst({
      where: {
        id: fileId,
        projectId: projectId,
        userId: user.id
      }
    })

    if (!file) {
      console.error('File not found:', { fileId, projectId, userId: user.id })
      await prisma.$disconnect()
      return NextResponse.json(
        { error: 'File not found or access denied' },
        { status: 404 }
      )
    }

    console.log('Found file:', { id: file.id, filePath: file.filePath })
    await prisma.$disconnect()

    // First, let's check what buckets are available
    const { data: buckets, error: bucketsError } = await supabase.storage.listBuckets()
    console.log('Available buckets:', buckets)
    if (bucketsError) {
      console.error('Error listing buckets:', bucketsError)
    }

    // Check if project-files bucket exists
    const projectFilesBucket = buckets?.find(bucket => bucket.name === 'project-files')
    console.log('project-files bucket found:', projectFilesBucket)

    let bucketName = 'project-files'

    // If bucket doesn't exist, try to create it
    if (!projectFilesBucket) {
      console.log('project-files bucket not found, attempting to create it...')
      const { data: createData, error: createError } = await supabase.storage.createBucket('project-files', {
        public: true,
        allowedMimeTypes: null,
        fileSizeLimit: null
      })
      
      if (createError) {
        console.error('Error creating bucket:', createError)
        
        // Try alternative bucket names
        const alternativeBuckets = ['files', 'uploads', 'storage', 'public']
        let foundBucket = null
        
        for (const altBucket of alternativeBuckets) {
          const altBucketExists = buckets?.find(bucket => bucket.name === altBucket)
          if (altBucketExists) {
            console.log(`Using alternative bucket: ${altBucket}`)
            bucketName = altBucket
            foundBucket = altBucketExists
            break
          }
        }
        
        if (!foundBucket) {
          return NextResponse.json(
            { error: 'No suitable bucket found and could not create project-files bucket', details: createError.message },
            { status: 500 }
          )
        }
      } else {
        console.log('Bucket created successfully:', createData)
      }
    }

    // Generate public URL using Supabase client
    const { data: { publicUrl }, error: urlError } = supabase.storage
      .from(bucketName)
      .getPublicUrl(file.filePath)

    if (urlError) {
      console.error('Error generating public URL:', urlError)
      return NextResponse.json(
        { error: 'Failed to generate public URL', details: urlError.message },
        { status: 500 }
      )
    }

    console.log('Generated public URL:', publicUrl)
    
    // Test if the URL is accessible (optional check)
    try {
      const testResponse = await fetch(publicUrl, { method: 'HEAD' });
      console.log('Public URL accessibility test:', testResponse.status, testResponse.statusText);
    } catch (testError) {
      console.log('Public URL accessibility test failed:', testError);
    }

    return NextResponse.json({
      publicUrl: publicUrl,
      filePath: file.filePath,
      mimeType: file.mimeType,
      bucketName: bucketName
    })

  } catch (error) {
    console.error('Error generating public URL:', error)
    return NextResponse.json(
      { error: 'Failed to generate public URL', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}
