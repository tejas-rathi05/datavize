import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export async function GET(request: NextRequest) {
  try {
    // Get the authorization header
    const authHeader = request.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Missing or invalid authorization header' }, { status: 401 });
    }

    const token = authHeader.substring(7);

    // Verify the JWT token and get user
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    if (authError || !user) {
      return NextResponse.json({ error: 'Invalid or expired token' }, { status: 401 });
    }

    // Import Prisma dynamically to avoid bundling issues
    const { PrismaClient } = await import('@prisma/client');
    const prisma = new PrismaClient();

    try {
      // Get user from database or create if doesn't exist
      let dbUser = await prisma.user.findUnique({
        where: { id: user.id },
      });

      if (!dbUser) {
        dbUser = await prisma.user.create({
          data: {
            id: user.id,
            email: user.email!,
            fullName: user.user_metadata?.full_name || null,
            avatarUrl: user.user_metadata?.avatar_url || null,
          },
        });
      }

      // Get all projects for the user
      const projects = await prisma.project.findMany({
        where: { userId: dbUser.id },
        include: {
          _count: {
            select: {
              files: true,
              workflows: true,
            },
          },
          files: {
            take: 5, // Get first 5 files for preview
            orderBy: { createdAt: 'desc' },
          },
        },
        orderBy: { createdAt: 'desc' },
      });

      // Transform the data to match the expected format with backward compatibility
      const transformedProjects = projects.map(project => ({
        ...project,
        fileCount: project._count.files,
        totalSize: project.totalSize.toString(), // Convert BigInt to string for JSON
        
        // Transform files to include backward compatibility
        files: project.files.map(file => ({
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
        })),
      }));

      return NextResponse.json(transformedProjects);
    } finally {
      await prisma.$disconnect();
    }
  } catch (error) {
    console.error('Error fetching user projects:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
