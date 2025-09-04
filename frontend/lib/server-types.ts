// Server-side types that can safely import from Prisma
export type { 
  User, 
  Project, 
  ProjectFile, 
  Workflow, 
  ChatSession,
  ProjectStatus,
  WorkflowStatus
} from '@prisma/client'

// Re-export for convenience in server code
export type { User as PrismaUser } from '@prisma/client'
export type { Project as PrismaProject } from '@prisma/client'
export type { ProjectFile as PrismaProjectFile } from '@prisma/client'
export type { Workflow as PrismaWorkflow } from '@prisma/client'
export type { ChatSession as PrismaChatSession } from '@prisma/client'
