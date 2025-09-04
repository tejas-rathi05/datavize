import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { PrismaClient } from '@prisma/client'

// Helper function to serialize BigInt values for JSON response
function serializeProjectFile(file: any) {
  return {
    ...file,
    size: file.size ? Number(file.size) : 0,
    fileSize: file.fileSize ? Number(file.fileSize) : 0,
    // Map Prisma fields to the expected interface
    name: file.originalName || file.filename,
    type: file.mimeType || 'unknown',
    documentType: file.metadata?.documentType || 'Unknown',
    pageCount: file.metadata?.pageCount || null,
    url: file.metadata?.originalUrl || file.filePath,
    uploadedAt: file.createdAt ? new Date(file.createdAt).toISOString() : null,
    updatedAt: file.updatedAt ? new Date(file.updatedAt).toISOString() : null,
    projectName: file.project?.name || 'Unknown Project'
  }
}

// GET /api/projects/user/files - Get all files from all user projects
export async function GET(request: NextRequest) {
  try {
    // Create a Supabase client for server-side operations
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false
        }
      }
    )
    
    // Get the authorization header
    const authHeader = request.headers.get('authorization')
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Missing authorization header' }, { status: 401 })
    }
    
    const token = authHeader.substring(7)
    
    // Verify the token and get user
    const { data: { user }, error: authError } = await supabase.auth.getUser(token)
    
    if (authError || !user) {
      console.error('Auth error:', authError)
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    console.log('Authenticated user for files:', { id: user.id, email: user.email })

    // Get all files from all user projects using Prisma
    const prisma = new PrismaClient()
    
    try {
      const files = await prisma.projectFile.findMany({
        where: {
          userId: user.id
        },
        include: {
          project: {
            select: {
              id: true,
              name: true
            }
          }
        },
        orderBy: {
          createdAt: 'desc'
        }
      })

      console.log(`Found ${files.length} files for user ${user.id}`)

      // Serialize BigInt values for JSON response
      const serializedFiles = files.map(serializeProjectFile)
      
      await prisma.$disconnect()
      return NextResponse.json(serializedFiles)
    } catch (dbError) {
      console.error('Database error:', dbError)
      await prisma.$disconnect()
      return NextResponse.json(
        { error: 'Failed to fetch files from database' },
        { status: 500 }
      )
    }
  } catch (error) {
    console.error('Error fetching user files:', error)
    return NextResponse.json(
      { error: 'Failed to fetch files' },
      { status: 500 }
    )
  }
}
