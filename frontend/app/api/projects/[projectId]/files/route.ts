import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { PrismaClient } from '@prisma/client'

// GET /api/projects/[projectId]/files - Get all files for a project
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ projectId: string }> }
) {
  try {
    const { projectId } = await params
    
    // Get the authorization header
    const authHeader = request.headers.get('authorization')
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Missing authorization header' }, { status: 401 })
    }
    
    const token = authHeader.substring(7)
    
    // Create a Supabase client for authentication
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
    
    // Verify the token and get user
    const { data: { user }, error: authError } = await supabase.auth.getUser(token)
    
    if (authError || !user) {
      console.error('Auth error:', authError)
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    console.log('Authenticated user for files:', { id: user.id, email: user.email })

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

    // Verify the project exists and belongs to the user
    const project = await prisma.project.findFirst({
      where: {
        id: projectId,
        userId: user.id
      }
    })

    if (!project) {
      await prisma.$disconnect()
      return NextResponse.json(
        { error: 'Project not found or access denied' },
        { status: 404 }
      )
    }

    // Get all files for the project
    const files = await prisma.projectFile.findMany({
      where: {
        projectId: projectId,
        userId: user.id
      },
      orderBy: {
        createdAt: 'desc'
      }
    })

    await prisma.$disconnect()

    console.log(`Found ${files.length} files for project ${projectId}`)

    // Serialize and return files with backward compatibility
    const serializedFiles = files.map(file => ({
      // New schema fields
      id: file.id,
      filename: file.filename,
      originalName: file.originalName,
      filePath: file.filePath,
      fileSize: Number(file.fileSize),
      mimeType: file.mimeType,
      metadata: file.metadata,
      projectId: file.projectId,
      userId: file.userId,
      createdAt: file.createdAt,
      updatedAt: file.updatedAt,
      
      // Backward compatibility - old field names
      name: file.originalName,
      type: file.mimeType,
      size: Number(file.fileSize),
      documentType: file.metadata?.documentType || 'Unknown',
      pageCount: file.metadata?.pageCount,
      url: file.metadata?.originalUrl,
      uploadedAt: file.createdAt,
    }))

    return NextResponse.json(serializedFiles)

  } catch (error) {
    console.error('Error fetching project files:', error)
    return NextResponse.json(
      { error: 'Failed to fetch project files', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}

// POST /api/projects/[projectId]/files - Upload a file to a project
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ projectId: string }> }
) {
  try {
    const { projectId } = await params
    
    // Get the authorization header
    const authHeader = request.headers.get('authorization')
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Missing authorization header' }, { status: 401 })
    }
    
    const token = authHeader.substring(7)
    
    // Create a Supabase client with the user's token for authenticated storage operations
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        global: {
          headers: {
            Authorization: `Bearer ${token}`
          }
        }
      }
    )
    
    // Verify the token and get user
    const { data: { user }, error: authError } = await supabase.auth.getUser(token)
    
    if (authError || !user) {
      console.error('Auth error:', authError)
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    console.log('Authenticated user:', { id: user.id, email: user.email })

    // Check if user exists in database, if not create them
    const prisma = new PrismaClient()
    try {
      let dbUser = await prisma.user.findUnique({
        where: { id: user.id }
      })
      
      if (!dbUser) {
        console.log('User not found in database, creating...')
        dbUser = await prisma.user.create({
          data: {
            id: user.id,
            email: user.email || '',
            fullName: user.user_metadata?.full_name || null,
          }
        })
        console.log('User created in database:', dbUser.id)
      } else {
        console.log('User found in database:', dbUser.id)
      }
    } catch (dbError) {
      console.error('Database user check/creation failed:', dbError)
      await prisma.$disconnect()
      return NextResponse.json(
        { error: 'Database user setup failed' },
        { status: 500 }
      )
    }

    // Verify the project exists and belongs to the user
    const project = await prisma.project.findFirst({
      where: {
        id: projectId,
        userId: user.id
      }
    })

    if (!project) {
      await prisma.$disconnect()
      return NextResponse.json(
        { error: 'Project not found or access denied' },
        { status: 404 }
      )
    }

    // Parse the form data to get the file
    const formData = await request.formData()
    const file = formData.get('file') as File
    
    if (!file) {
      await prisma.$disconnect()
      return NextResponse.json(
        { error: 'No file provided' },
        { status: 400 }
      )
    }

    console.log('Uploading file:', { name: file.name, size: file.size, type: file.type })

    // Generate unique filename
    const fileExt = file.name.split('.').pop()
    const fileName = `${Date.now()}-${Math.random().toString(36).substring(2)}.${fileExt}`
    const filePath = `${user.id}/${projectId}/${fileName}`

    // Upload file to Supabase Storage
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from('project-files')
      .upload(filePath, file, {
        cacheControl: '3600',
        upsert: false
      })

    if (uploadError) {
      console.error('Supabase upload error:', uploadError)
      await prisma.$disconnect()
      return NextResponse.json(
        { error: 'File upload failed: ' + uploadError.message },
        { status: 500 }
      )
    }

    // Get public URL for the uploaded file
    const { data: { publicUrl } } = supabase.storage
      .from('project-files')
      .getPublicUrl(filePath)

    // Create file record in database using Prisma
    const fileRecord = await prisma.projectFile.create({
      data: {
        filename: fileName,
        originalName: file.name,
        filePath: filePath,
        fileSize: BigInt(file.size),
        mimeType: file.type,
        metadata: {
          documentType: getDocumentType(file.type),
          pageCount: getPageCount(file.type),
          originalUrl: publicUrl,
        },
        projectId: projectId,
        userId: user.id,
      }
    })

    // Update project stats
    await prisma.project.update({
      where: { id: projectId },
      data: {
        fileCount: { increment: 1 },
        totalSize: { increment: BigInt(file.size) },
      }
    })

    await prisma.$disconnect()

    console.log('File uploaded successfully:', fileRecord.id)

    // Return the file data with backward compatibility
    return NextResponse.json({
      success: true,
      file: {
        // New schema fields
        id: fileRecord.id,
        filename: fileRecord.filename,
        originalName: fileRecord.originalName,
        filePath: fileRecord.filePath,
        fileSize: Number(fileRecord.fileSize),
        mimeType: fileRecord.mimeType,
        metadata: fileRecord.metadata,
        projectId: fileRecord.projectId,
        userId: fileRecord.userId,
        createdAt: fileRecord.createdAt,
        updatedAt: fileRecord.updatedAt,
        
        // Backward compatibility - old field names
        name: fileRecord.originalName,
        type: fileRecord.mimeType,
        size: Number(fileRecord.fileSize),
        documentType: fileRecord.metadata?.documentType || 'Unknown',
        pageCount: fileRecord.metadata?.pageCount,
        url: fileRecord.metadata?.originalUrl,
      }
    }, { status: 201 })

  } catch (error) {
    console.error('Error uploading file:', error)
    return NextResponse.json(
      { error: 'Failed to upload file', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}

// Helper function to determine document type
function getDocumentType(mimeType: string): string {
  if (mimeType.includes('pdf')) return 'PDF'
  if (mimeType.includes('word') || mimeType.includes('docx')) return 'Word (.docx)'
  if (mimeType.includes('excel') || mimeType.includes('spreadsheet')) return 'Excel'
  if (mimeType.includes('powerpoint') || mimeType.includes('presentation')) return 'PowerPoint'
  if (mimeType.includes('text')) return 'Text'
  if (mimeType.includes('csv')) return 'CSV'
  if (mimeType.includes('email') || mimeType.includes('message')) return 'Email'
  if (mimeType.includes('jpeg') || mimeType.includes('jpg')) return 'JPEG'
  if (mimeType.includes('png')) return 'PNG'
  if (mimeType.includes('tiff')) return 'TIFF'
  if (mimeType.includes('rtf')) return 'RTF'
  if (mimeType.includes('zip') || mimeType.includes('compressed')) return 'Zip'
  return 'Other'
}

// Helper function to get page count (placeholder for now)
function getPageCount(mimeType: string): number | undefined {
  // This would typically require parsing the file content
  // For now, return undefined
  return undefined
}
