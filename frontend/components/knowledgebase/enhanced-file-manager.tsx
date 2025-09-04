'use client'

import { useState, useEffect, useCallback } from 'react'
import { useDropzone } from 'react-dropzone'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Badge } from '@/components/ui/badge'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Upload, Folder, File, Trash2, Download, Eye, Plus, X } from 'lucide-react'
import { FileService } from '@/lib/file-service'
import { Project, ProjectFile } from '@/lib/types'
import { useAuthContext } from '@/components/providers/auth-provider'
import { formatBytes } from '@/lib/utils'

interface EnhancedFileManagerProps {
  projectId?: string
  onFileUpload?: (file: ProjectFile) => void
  onFileDelete?: (fileId: string) => void
}

export function EnhancedFileManager({ 
  projectId, 
  onFileUpload, 
  onFileDelete 
}: EnhancedFileManagerProps) {
  const [files, setFiles] = useState<ProjectFile[]>([])
  const [projects, setProjects] = useState<Project[]>([])
  const [selectedProject, setSelectedProject] = useState<Project | null>(null)
  const [isCreatingProject, setIsCreatingProject] = useState(false)
  const [newProjectName, setNewProjectName] = useState('')
  const [newProjectDescription, setNewProjectDescription] = useState('')
  const [uploading, setUploading] = useState(false)
  const [uploadProgress, setUploadProgress] = useState(0)
  const { user } = useAuthContext()

  // Load projects and files on component mount
  useEffect(() => {
    if (user) {
      loadProjects()
    }
  }, [user])

  // Load files when project changes
  useEffect(() => {
    if (selectedProject) {
      loadFiles()
    }
  }, [selectedProject])

  const loadProjects = async () => {
    if (!user) return
    
    try {
      const projects = await FileService.getUserProjects(user.id)
      setProjects(projects)
      
      // If projectId is provided, select that project
      if (projectId) {
        const project = projects.find(p => p.id === projectId)
        if (project) {
          setSelectedProject(project)
        }
      } else if (projects.length > 0) {
        setSelectedProject(projects[0])
      }
    } catch (error) {
      console.error('Error loading projects:', error)
    }
  }

  const loadFiles = async () => {
    if (!selectedProject) return
    
    try {
      const projectFiles = await FileService.getProjectFiles(selectedProject.id)
      setFiles(projectFiles)
    } catch (error) {
      console.error('Error loading files:', error)
    }
  }

  const createProject = async () => {
    if (!user || !newProjectName.trim()) return
    
    try {
      const result = await FileService.createProject(
        newProjectName.trim(),
        newProjectDescription.trim(),
        user.id
      )
      
      if (result.success && result.project) {
        setProjects(prev => [result.project!, ...prev])
        setSelectedProject(result.project)
        setIsCreatingProject(false)
        setNewProjectName('')
        setNewProjectDescription('')
      }
    } catch (error) {
      console.error('Error creating project:', error)
    }
  }

  const onDrop = useCallback(async (acceptedFiles: File[]) => {
    if (!selectedProject || !user) return
    
    setUploading(true)
    setUploadProgress(0)
    
    try {
      for (let i = 0; i < acceptedFiles.length; i++) {
        const file = acceptedFiles[i]
        
        // Simulate upload progress
        setUploadProgress((i / acceptedFiles.length) * 100)
        
        const result = await FileService.uploadFile(file, selectedProject.id, user.id)
        
        if (result.success && result.file) {
          setFiles(prev => [result.file!, ...prev])
          onFileUpload?.(result.file)
          
          // Update project stats
          await FileService.updateProjectStats(selectedProject.id)
          loadProjects() // Refresh project list to update stats
        }
      }
    } catch (error) {
      console.error('Error uploading files:', error)
    } finally {
      setUploading(false)
      setUploadProgress(0)
    }
  }, [selectedProject, user, onFileUpload])

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'application/pdf': ['.pdf'],
      'application/msword': ['.doc'],
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document': ['.docx'],
      'application/vnd.ms-excel': ['.xls'],
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': ['.xlsx'],
      'application/vnd.ms-powerpoint': ['.ppt'],
      'application/vnd.openxmlformats-officedocument.presentationml.presentation': ['.pptx'],
      'text/plain': ['.txt'],
      'text/csv': ['.csv'],
      'image/jpeg': ['.jpg', '.jpeg'],
      'image/png': ['.png'],
      'image/tiff': ['.tiff'],
      'application/rtf': ['.rtf'],
      'application/zip': ['.zip'],
    },
    multiple: true,
  })

  const deleteFile = async (fileId: string, fileName: string) => {
    if (!selectedProject) return
    
    try {
      const filePath = `${user?.id}/${selectedProject.id}/${fileName}`
      const result = await FileService.deleteFile(fileId, filePath)
      
      if (result.success) {
        setFiles(prev => prev.filter(f => f.id !== fileId))
        onFileDelete?.(fileId)
        
        // Update project stats
        await FileService.updateProjectStats(selectedProject.id)
        loadProjects() // Refresh project list to update stats
      }
    } catch (error) {
      console.error('Error deleting file:', error)
    }
  }

  const getFileIcon = (fileType: string) => {
    if (fileType.includes('pdf')) return <File className="h-8 w-8 text-red-500" />
    if (fileType.includes('word')) return <File className="h-8 w-8 text-blue-500" />
    if (fileType.includes('excel')) return <File className="h-8 w-8 text-green-500" />
    if (fileType.includes('powerpoint')) return <File className="h-8 w-8 text-orange-500" />
    if (fileType.includes('image')) return <File className="h-8 w-8 text-purple-500" />
    return <File className="h-8 w-8 text-gray-500" />
  }

  if (!user) {
    return (
      <div className="text-center py-8">
        <p className="text-gray-500">Please sign in to access the file manager.</p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Project Selection */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <Label htmlFor="project-select">Project:</Label>
          <select
            id="project-select"
            value={selectedProject?.id || ''}
            onChange={(e) => {
              const project = projects.find(p => p.id === e.target.value)
              setSelectedProject(project || null)
            }}
            className="border rounded-md px-3 py-2"
          >
            {projects.map(project => (
              <option key={project.id} value={project.id}>
                {project.name} ({project.fileCount} files, {formatBytes(project.totalSize)})
              </option>
            ))}
          </select>
        </div>
        
        <Dialog open={isCreatingProject} onOpenChange={setIsCreatingProject}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              New Project
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Create New Project</DialogTitle>
              <DialogDescription>
                Create a new project to organize your files.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label htmlFor="project-name">Project Name</Label>
                <Input
                  id="project-name"
                  value={newProjectName}
                  onChange={(e) => setNewProjectName(e.target.value)}
                  placeholder="Enter project name"
                />
              </div>
              <div>
                <Label htmlFor="project-description">Description</Label>
                <Input
                  id="project-description"
                  value={newProjectDescription}
                  onChange={(e) => setNewProjectDescription(e.target.value)}
                  placeholder="Enter project description"
                />
              </div>
              <div className="flex justify-end space-x-2">
                <Button variant="outline" onClick={() => setIsCreatingProject(false)}>
                  Cancel
                </Button>
                <Button onClick={createProject} disabled={!newProjectName.trim()}>
                  Create Project
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* File Upload Area */}
      {selectedProject && (
        <Card>
          <CardHeader>
            <CardTitle>Upload Files</CardTitle>
            <CardDescription>
              Drag and drop files here or click to select files
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div
              {...getRootProps()}
              className={`border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors ${
                isDragActive
                  ? 'border-blue-500 bg-blue-50 dark:bg-blue-950'
                  : 'border-gray-300 hover:border-gray-400'
              }`}
            >
              <input {...getInputProps()} />
              <Upload className="h-12 w-12 mx-auto text-gray-400 mb-4" />
              {isDragActive ? (
                <p className="text-blue-600">Drop the files here...</p>
              ) : (
                <div>
                  <p className="text-gray-600 mb-2">
                    Drag & drop files here, or click to select files
                  </p>
                  <p className="text-sm text-gray-500">
                    Supports PDF, Word, Excel, PowerPoint, images, and more
                  </p>
                </div>
              )}
            </div>
            
            {uploading && (
              <div className="mt-4">
                <div className="flex items-center justify-between text-sm text-gray-600 mb-2">
                  <span>Uploading...</span>
                  <span>{Math.round(uploadProgress)}%</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div
                    className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                    style={{ width: `${uploadProgress}%` }}
                  />
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Files List */}
      {selectedProject && (
        <Card>
          <CardHeader>
            <CardTitle>Files ({files.length})</CardTitle>
            <CardDescription>
              Files in {selectedProject.name}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {files.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                <Folder className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                <p>No files uploaded yet.</p>
                <p className="text-sm">Upload some files to get started.</p>
              </div>
            ) : (
              <ScrollArea className="h-96">
                <div className="space-y-2">
                  {files.map((file) => (
                    <div
                      key={file.id}
                      className="flex items-center justify-between p-3 border rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800"
                    >
                      <div className="flex items-center space-x-3">
                        {getFileIcon(file.type)}
                        <div>
                          <p className="font-medium">{file.name}</p>
                          <div className="flex items-center space-x-2 text-sm text-gray-500">
                            <Badge variant="secondary">{file.documentType}</Badge>
                            <span>{formatBytes(file.size)}</span>
                            <span>•</span>
                            <span>{file.uploadedAt ? new Date(file.uploadedAt).toLocaleDateString() : 'Unknown date'}</span>
                          </div>
                        </div>
                      </div>
                      
                      <div className="flex items-center space-x-2">
                        {file.url && (
                          <>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => window.open(file.url, '_blank')}
                            >
                              <Eye className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => {
                                const link = document.createElement('a')
                                link.href = file.url!
                                link.download = file.name
                                link.click()
                              }}
                            >
                              <Download className="h-4 w-4" />
                            </Button>
                          </>
                        )}
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => deleteFile(file.id, file.name)}
                          className="text-red-600 hover:text-red-700 hover:bg-red-50"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </ScrollArea>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  )
}
