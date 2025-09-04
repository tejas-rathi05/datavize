import { NextRequest, NextResponse } from 'next/server'
import { ProjectService } from '@/lib/project-service'
import { createClient } from '@supabase/supabase-js'

// Helper function to serialize BigInt values for JSON response
function serializeProject(project: any) {
  return {
    ...project,
    totalSize: project.totalSize ? Number(project.totalSize) : 0,
    // Convert any other BigInt fields that might exist
    ...(project.files && {
      files: project.files.map((file: any) => ({
        ...file,
        size: file.size ? Number(file.size) : 0,
        fileSize: file.fileSize ? Number(file.fileSize) : 0
      }))
    })
  }
}

// GET /api/projects - Get all projects for the authenticated user
export async function GET(request: NextRequest) {
  try {
    // Create a Supabase client for server-side operations
    console.log(process.env.NEXT_PUBLIC_SUPABASE_URL)
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

    console.log('Authenticated user:', { id: user.id, email: user.email })

    // Check if user exists in database, if not create them
    try {
      const { PrismaClient } = await import('@prisma/client')
      const prisma = new PrismaClient()
      
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
      
      await prisma.$disconnect()
    } catch (dbError) {
      console.error('Database user check/creation failed:', dbError)
      return NextResponse.json(
        { error: 'Database user setup failed' },
        { status: 500 }
      )
    }

    const projects = await ProjectService.getUserProjects(user.id)
    // Serialize BigInt values for JSON response
    const serializedProjects = projects.map(serializeProject)
    return NextResponse.json(serializedProjects)
  } catch (error) {
    console.error('Error fetching projects:', error)
    return NextResponse.json(
      { error: 'Failed to fetch projects' },
      { status: 500 }
    )
  }
}

// POST /api/projects - Create a new project
export async function POST(request: NextRequest) {
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

    console.log('Authenticated user:', { id: user.id, email: user.email })

    // Check if user exists in database, if not create them
    try {
      const { PrismaClient } = await import('@prisma/client')
      const prisma = new PrismaClient()
      
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
      
      await prisma.$disconnect()
    } catch (dbError) {
      console.error('Database user check/creation failed:', dbError)
      return NextResponse.json(
        { error: 'Database user setup failed' },
        { status: 500 }
      )
    }

    const body = await request.json()
    const { name, description } = body

    if (!name) {
      return NextResponse.json(
        { error: 'Project name is required' },
        { status: 400 }
      )
    }

    console.log('Creating project with data:', { name, description, userId: user.id })

    const project = await ProjectService.createProject({
      name,
      description,
      userId: user.id
    })

    console.log('Project created successfully:', project.id)

    // Serialize BigInt values for JSON response
    const serializedProject = serializeProject(project)
    return NextResponse.json(serializedProject, { status: 201 })
  } catch (error) {
    console.error('Error creating project:', error)
    return NextResponse.json(
      { error: 'Failed to create project', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}
