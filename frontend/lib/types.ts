// Database entity types (matching Prisma schema but browser-safe)
export interface User {
  id: string
  email: string
  fullName?: string | null
  avatarUrl?: string | null
  createdAt: Date
  updatedAt: Date
}

export interface Project {
  id: string
  name: string
  description?: string | null
  status: ProjectStatus
  totalSize: bigint
  fileCount: number
  createdAt: Date
  updatedAt: Date
  userId: string
  user?: User
  files?: ProjectFile[]
  workflows?: Workflow[]
}

export interface ProjectFile {
  id: string
  filename: string
  originalName: string
  filePath: string
  fileSize: bigint
  mimeType?: string | null
  metadata?: any
  createdAt: Date
  updatedAt: Date
  projectId: string
  userId: string
  project?: Project
  user?: User
  
  // Backward compatibility - old field names
  name?: string
  type?: string
  size?: bigint
  documentType?: string
  pageCount?: number | null
  url?: string | null
  projectName?: string
}

export interface Workflow {
  id: string
  name: string
  description?: string | null
  status: WorkflowStatus
  config?: any
  createdAt: Date
  updatedAt: Date
  projectId: string
  project?: Project
}

export interface ChatSession {
  id: string
  title?: string | null
  messages: any[]
  createdAt: Date
  updatedAt: Date
  userId: string
  user?: User
}

export type ProjectStatus = 'ACTIVE' | 'PROCESSING' | 'ERROR'
export type WorkflowStatus = 'DRAFT' | 'ACTIVE' | 'PAUSED' | 'ARCHIVED'

// Legacy type aliases for backward compatibility
export type LegacyProject = Project
export type LegacyProjectFile = ProjectFile

// Chat-related types (not in Prisma schema yet)
export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: Date;
  thinkingSteps?: ThinkingStep[];
  isStreaming?: boolean;
}

export interface ThinkingStep {
  id: string;
  type: 'analysis' | 'research' | 'reasoning' | 'planning' | 'execution';
  title: string;
  description: string;
  status: 'pending' | 'active' | 'completed' | 'error';
  details?: string;
  timestamp: Date;
}

export interface Agent {
  id: string;
  name: string;
  description: string;
  avatar?: string;
  capabilities: string[];
  systemPrompt: string;
  model: string;
  temperature: number;
  maxTokens: number;
}

// File type utilities
export type FileType = 
  | 'PDF' 
  | 'Word (.docx)' 
  | 'Excel' 
  | 'PowerPoint' 
  | 'Text' 
  | 'CSV' 
  | 'Email' 
  | 'JPEG' 
  | 'PNG' 
  | 'TIFF' 
  | 'RTF' 
  | 'Zip';

export interface FileTypeInfo {
  type: FileType;
  icon: string;
  color: string;
  extensions: string[];
}

// Utility functions for converting between Prisma and legacy types
export const convertPrismaProject = (prismaProject: any) => ({
  id: prismaProject.id,
  name: prismaProject.name,
  description: prismaProject.description,
  createdAt: prismaProject.createdAt,
  updatedAt: prismaProject.updatedAt,
  files: prismaProject.files || [],
  totalSize: Number(prismaProject.totalSize),
  fileCount: prismaProject.fileCount,
  status: prismaProject.status,
});

export const convertPrismaProjectFile = (prismaFile: any) => ({
  id: prismaFile.id,
  name: prismaFile.name,
  type: prismaFile.type,
  size: Number(prismaFile.size),
  uploadedAt: prismaFile.createdAt,
  updatedAt: prismaFile.updatedAt,
  documentType: prismaFile.documentType,
  pageCount: prismaFile.pageCount,
  url: prismaFile.url,
  projectId: prismaFile.projectId,
});
