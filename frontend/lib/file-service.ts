import { supabase } from '@/lib/supabase'
import { Project, ProjectFile } from '@/lib/types'

export class FileService {
  // Upload a file to Supabase Storage
  static async uploadFile(
    file: File,
    projectId: string,
    userId: string
  ): Promise<{ success: boolean; file?: ProjectFile; error?: string }> {
    try {
      const fileExt = file.name.split('.').pop()
      const fileName = `${Date.now()}-${Math.random().toString(36).substring(2)}.${fileExt}`
      const filePath = `${userId}/${projectId}/${fileName}`

      // Upload file to Supabase Storage
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('project-files')
        .upload(filePath, filePath, {
          cacheControl: '3600',
          upsert: false
        })

      if (uploadError) {
        return { success: false, error: uploadError.message }
      }

      // Get public URL for the uploaded file
      const { data: { publicUrl } } = supabase.storage
        .from('project-files')
        .getPublicUrl(filePath)

      // Create file record in database
      const fileRecord = {
        name: file.name,
        type: file.type,
        size: file.size,
        document_type: this.getDocumentType(file.type), // Use snake_case for DB
        page_count: this.getPageCount(file.type), // Use snake_case for DB
        url: publicUrl,
        project_id: projectId, // Include project_id
      }

      const { data: dbFile, error: dbError } = await supabase
        .from('project_files')
        .insert([fileRecord])
        .select()
        .single()

      if (dbError) {
        return { success: false, error: dbError.message }
      }

      return { 
        success: true, 
        file: {
          id: dbFile.id,
          name: dbFile.name,
          type: dbFile.type,
          size: dbFile.size,
          documentType: dbFile.document_type, // Map from DB to interface
          pageCount: dbFile.page_count, // Map from DB to interface
          url: dbFile.url,
          projectId: dbFile.project_id, // Map from DB to interface
          uploadedAt: new Date(dbFile.created_at),
          updatedAt: new Date(dbFile.updated_at),
        }
      }
    } catch (error) {
      return { success: false, error: 'Failed to upload file' }
    }
  }

  // Get files for a project
  static async getProjectFiles(projectId: string): Promise<ProjectFile[]> {
    try {
      const { data, error } = await supabase
        .from('project_files')
        .select('*')
        .eq('project_id', projectId)
        .order('created_at', { ascending: false })

      if (error) {
        throw error
      }

      return data.map(file => ({
        id: file.id,
        name: file.name,
        type: file.type,
        size: file.size,
        documentType: file.document_type, // Map from DB to interface
        pageCount: file.page_count, // Map from DB to interface
        url: file.url,
        projectId: file.project_id, // Map from DB to interface
        uploadedAt: new Date(file.created_at),
        updatedAt: new Date(file.updated_at),
      }))
    } catch (error) {
      console.error('Error fetching project files:', error)
      return []
    }
  }

  // Get all files from all user projects
  static async getAllUserFiles(userId: string): Promise<ProjectFile[]> {
    try {
      // Get the current session token
      const { data: { session } } = await supabase.auth.getSession()
      
      if (!session?.access_token) {
        throw new Error('No active session')
      }

      const response = await fetch('/api/projects/user/files', {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
          'Content-Type': 'application/json',
        },
      })

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }

      const files = await response.json()
      return files
    } catch (error) {
      console.error('Error fetching all user files:', error)
      return []
    }
  }

  // Delete a file
  static async deleteFile(fileId: string, filePath: string): Promise<{ success: boolean; error?: string }> {
    try {
      // Delete from storage
      const { error: storageError } = await supabase.storage
        .from('project-files')
        .remove([filePath])

      if (storageError) {
        return { success: false, error: storageError.message }
      }

      // Delete from database
      const { error: dbError } = await supabase
        .from('project_files')
        .delete()
        .eq('id', fileId)

      if (dbError) {
        return { success: false, error: dbError.message }
      }

      return { success: true }
    } catch (error) {
      return { success: false, error: 'Failed to delete file' }
    }
  }

  // Create a new project
  static async createProject(
    name: string,
    description: string,
    userId: string
  ): Promise<{ success: boolean; project?: Project; error?: string }> {
    try {
      const projectData = {
        name,
        description,
        user_id: userId,
        status: 'active',
        total_size: 0,
        file_count: 0,
      }

      const { data, error } = await supabase
        .from('projects')
        .insert([projectData])
        .select()
        .single()

      if (error) {
        return { success: false, error: error.message }
      }

      const project: Project = {
        id: data.id,
        name: data.name,
        description: data.description,
        createdAt: new Date(data.created_at),
        updatedAt: new Date(data.updated_at),
        files: [],
        totalSize: data.total_size,
        fileCount: data.file_count,
        status: data.status,
      }

      return { success: true, project }
    } catch (error) {
      return { success: false, error: 'Failed to create project' }
    }
  }

  // Get user projects
  static async getUserProjects(userId: string): Promise<Project[]> {
    try {
      const { data, error } = await supabase
        .from('projects')
        .select(`
          *,
          project_files (*)
        `)
        .eq('user_id', userId)
        .order('created_at', { ascending: false })

      if (error) {
        throw error
      }

      return data.map(project => ({
        id: project.id,
        name: project.name,
        description: project.description,
        createdAt: new Date(project.created_at),
        updatedAt: new Date(project.updated_at),
        files: project.project_files?.map(file => ({
          id: file.id,
          name: file.name,
          type: file.type,
          size: file.size,
          documentType: file.document_type, // Map from DB to interface
          pageCount: file.page_count, // Map from DB to interface
          url: file.url,
          projectId: file.project_id, // Map from DB to interface
          uploadedAt: new Date(file.created_at),
          updatedAt: new Date(file.updated_at),
        })) || [],
        totalSize: project.total_size,
        fileCount: project.file_count,
        status: project.status,
      }))
    } catch (error) {
      console.error('Error fetching user projects:', error)
      return []
    }
  }

  // Update project file count and size
  static async updateProjectStats(projectId: string): Promise<void> {
    try {
      const files = await this.getProjectFiles(projectId)
      const totalSize = files.reduce((sum, file) => sum + file.size, 0)
      const fileCount = files.length

      await supabase
        .from('projects')
        .update({
          total_size: totalSize,
          file_count: fileCount,
          updated_at: new Date().toISOString(),
        })
        .eq('id', projectId)
    } catch (error) {
      console.error('Error updating project stats:', error)
    }
  }

  // Helper methods
  private static getDocumentType(mimeType: string): string {
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

  private static getPageCount(mimeType: string): number | undefined {
    // This would typically require parsing the file content
    // For now, return undefined
    return undefined
  }
}
