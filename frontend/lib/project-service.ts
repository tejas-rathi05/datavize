import { prisma } from './prisma'
import { Project, ProjectFile, Workflow } from './server-types'

export interface CreateProjectData {
  name: string
  description?: string
  userId: string
}

export interface CreateFileData {
  name: string
  type: string
  size: number
  documentType: string
  pageCount?: number
  url?: string
  projectId: string
  userId: string
}

export interface CreateWorkflowData {
  name: string
  description?: string
  config?: any
  projectId: string
}

export class ProjectService {
  // Create a new project
  static async createProject(data: CreateProjectData): Promise<Project> {
    try {
      // First verify the user exists
      const userExists = await this.userExists(data.userId)
      if (!userExists) {
        throw new Error(`User with ID ${data.userId} does not exist in the database. Please ensure the user is properly authenticated and exists.`)
      }

      console.log('Creating project with data:', data)

      // Create the project with user data included in a single query
      const project = await prisma.project.create({
        data: {
          name: data.name,
          description: data.description,
          userId: data.userId,
        },
        include: {
          user: {
            select: {
              id: true,
              email: true,
              fullName: true,
            },
          },
        },
      })

      if (!project.user) {
        throw new Error('User data is null for created project - this indicates a database relationship issue')
      }

      console.log('Project created successfully with user data')
      return project
    } catch (error) {
      console.error('Create project error:', error)
      
      // Handle specific Prisma errors
      if (error instanceof Error) {
        if (error.message.includes('Foreign key constraint failed')) {
          throw new Error('User not found in database. Please ensure you are properly authenticated.')
        }
        if (error.message.includes('Unique constraint failed')) {
          throw new Error('Project with this name already exists')
        }
        if (error.message.includes('does not exist')) {
          throw new Error(error.message)
        }
      }
      
      throw error
    }
  }

  // Get all projects for a user
  static async getUserProjects(userId: string): Promise<Project[]> {
    try {
      const projects = await prisma.project.findMany({
        where: { userId },
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
      })

      return projects
    } catch (error) {
      console.error('Get user projects error:', error)
      throw error
    }
  }

  // Get a single project with all details
  static async getProject(projectId: string, userId: string): Promise<Project | null> {
    try {
      const project = await prisma.project.findFirst({
        where: {
          id: projectId,
          userId, // Ensure user can only access their own projects
        },
        include: {
          user: {
            select: {
              id: true,
              email: true,
              fullName: true,
            },
          },
          files: {
            orderBy: { createdAt: 'desc' },
          },
          workflows: {
            orderBy: { createdAt: 'desc' },
          },
        },
      })

      return project
    } catch (error) {
      console.error('Get project error:', error)
      throw error
    }
  }

  // Update a project
  static async updateProject(
    projectId: string,
    userId: string,
    updates: Partial<Pick<Project, 'name' | 'description' | 'status'>>
  ): Promise<Project> {
    try {
      const project = await prisma.project.updateMany({
        where: {
          id: projectId,
          userId, // Ensure user can only update their own projects
        },
        data: updates,
      })

      if (project.count === 0) {
        throw new Error('Project not found or access denied')
      }

      // Return the updated project
      const updatedProject = await prisma.project.findUnique({
        where: { id: projectId },
      })

      if (!updatedProject) {
        throw new Error('Failed to retrieve updated project')
      }

      return updatedProject
    } catch (error) {
      console.error('Update project error:', error)
      throw error
    }
  }

  // Delete a project
  static async deleteProject(projectId: string, userId: string): Promise<boolean> {
    try {
      const result = await prisma.project.deleteMany({
        where: {
          id: projectId,
          userId, // Ensure user can only delete their own projects
        },
      })

      return result.count > 0
    } catch (error) {
      console.error('Delete project error:', error)
      throw error
    }
  }

  // Add a file to a project
  static async addFile(data: CreateFileData): Promise<ProjectFile> {
    try {
      const file = await prisma.projectFile.create({
        data: {
          filename: data.name,
          originalName: data.name,
          filePath: data.url || '',
          fileSize: BigInt(data.size),
          mimeType: data.type,
          metadata: {
            documentType: data.documentType,
            pageCount: data.pageCount,
            originalUrl: data.url,
          },
          projectId: data.projectId,
          userId: data.userId,
        },
      })

      // Update project file count and total size
      await prisma.project.update({
        where: { id: data.projectId },
        data: {
          fileCount: {
            increment: 1,
          },
          totalSize: {
            increment: BigInt(data.size),
          },
        },
      })

      return file
    } catch (error) {
      console.error('Add file error:', error)
      throw error
    }
  }

  // Remove a file from a project
  static async removeFile(fileId: string, projectId: string, userId: string): Promise<boolean> {
    try {
      // First, get the file to know its size
      const file = await prisma.projectFile.findFirst({
        where: {
          id: fileId,
          project: {
            id: projectId,
            userId, // Ensure user can only remove files from their own projects
          },
        },
      })

      if (!file) {
        throw new Error('File not found or access denied')
      }

      // Delete the file
      await prisma.projectFile.delete({
        where: { id: fileId },
      })

      // Update project file count and total size
      await prisma.project.update({
        where: { id: projectId },
        data: {
          fileCount: {
            decrement: 1,
          },
          totalSize: {
            decrement: file.fileSize,
          },
        },
      })

      return true
    } catch (error) {
      console.error('Remove file error:', error)
      throw error
    }
  }

  // Create a workflow
  static async createWorkflow(data: CreateWorkflowData): Promise<Workflow> {
    try {
      const workflow = await prisma.workflow.create({
        data: {
          name: data.name,
          description: data.description,
          config: data.config,
          projectId: data.projectId,
        },
      })

      return workflow
    } catch (error) {
      console.error('Create workflow error:', error)
      throw error
    }
  }

  // Get project statistics
  static async getProjectStats(userId: string) {
    try {
      const stats = await prisma.project.aggregate({
        where: { userId },
        _count: {
          id: true,
        },
        _sum: {
          totalSize: true,
          fileCount: true,
        },
      })

      return {
        totalProjects: stats._count.id,
        totalFiles: stats._sum.fileCount || 0,
        totalSize: stats._sum.totalSize || BigInt(0),
      }
    } catch (error) {
      console.error('Get project stats error:', error)
      throw error
    }
  }

  // Helper to check if a user exists
  private static async userExists(userId: string): Promise<boolean> {
    const user = await prisma.user.findUnique({
      where: { id: userId },
    })
    return !!user
  }
}
