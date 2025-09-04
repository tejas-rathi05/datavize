"use client";

import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Project, ProjectFile } from "@/lib/types";
import { useAuthContext } from "@/components/providers/auth-provider";
import { supabase } from "@/lib/supabase";
import { 
  File, 
  Search, 
  Download, 
  Eye, 
  Calendar,
  Folder,
  Loader2,
  X,
  ChevronRight,
  ChevronDown,
  Send,
  FolderOpen,
  FileText,
  Image,
  Archive,
  FileSpreadsheet,
  Presentation,
  Mail,
  Code
} from "lucide-react";
import { formatBytes } from "@/lib/utils";

interface KnowledgeBaseDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onFilesSelected?: (files: ProjectFile[]) => void;
}

interface ProjectWithFiles extends Project {
  files: ProjectFile[];
  expanded?: boolean;
}

export function KnowledgeBaseDialog({ open, onOpenChange, onFilesSelected }: KnowledgeBaseDialogProps) {
  const [projects, setProjects] = useState<ProjectWithFiles[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedFileType, setSelectedFileType] = useState<string>("all");
  const [selectedFiles, setSelectedFiles] = useState<ProjectFile[]>([]);
  const [activeTab, setActiveTab] = useState("projects");
  const { user } = useAuthContext();

  // Load projects and files when dialog opens
  useEffect(() => {
    if (open && user) {
      loadProjectsAndFiles();
    }
  }, [open, user]);

  const loadProjectsAndFiles = async () => {
    if (!user) return;
    
    setLoading(true);
    try {
      console.log('Loading projects for user:', user.id);
      
      // Get the current session token
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.access_token) {
        throw new Error('No active session');
      }
      
      // Load all projects using the API route
      const projectsResponse = await fetch('/api/projects', {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
          'Content-Type': 'application/json',
        },
      });
      
      if (!projectsResponse.ok) {
        throw new Error(`Failed to fetch projects: ${projectsResponse.status}`);
      }
      
      const allProjects = await projectsResponse.json();
      console.log('Loaded projects:', allProjects);
      console.log('Projects response status:', projectsResponse.status);
      console.log('Projects response headers:', Object.fromEntries(projectsResponse.headers.entries()));
      
      if (!Array.isArray(allProjects)) {
        console.error('Projects response is not an array:', typeof allProjects, allProjects);
        return;
      }
      
      if (allProjects.length === 0) {
        console.log('No projects found for user');
        setProjects([]);
        return;
      }
      
      // Load files for each project using the API route
      const projectsWithFiles = await Promise.all(
        allProjects.map(async (project) => {
          try {
            console.log(`Loading files for project: ${project.name} (${project.id})`);
            const filesResponse = await fetch(`/api/projects/${project.id}/files`, {
              method: 'GET',
              headers: {
                'Authorization': `Bearer ${session.access_token}`,
                'Content-Type': 'application/json',
              },
            });
            
            if (!filesResponse.ok) {
              throw new Error(`Failed to fetch files for project ${project.id}: ${filesResponse.status}`);
            }
            
            const files = await filesResponse.json();
            console.log(`Found ${files.length} files for project ${project.name}`);
            console.log(`Files response status for ${project.name}:`, filesResponse.status);
            console.log(`Files for ${project.name}:`, files);
            return {
              ...project,
              files: files.map(file => ({
                ...file,
                projectName: project.name
              })),
              expanded: false
            };
          } catch (error) {
            console.error(`Error loading files for project ${project.id}:`, error);
            return {
              ...project,
              files: [],
              expanded: false
            };
          }
        })
      );
      
      console.log('Loaded projects with files:', projectsWithFiles);
      setProjects(projectsWithFiles);
    } catch (error) {
      console.error('Error loading projects and files:', error);
    } finally {
      setLoading(false);
    }
  };

  const toggleProjectExpansion = (projectId: string) => {
    setProjects(prev => prev.map(project => 
      project.id === projectId 
        ? { ...project, expanded: !project.expanded }
        : project
    ));
  };

  const toggleFileSelection = (file: ProjectFile) => {
    setSelectedFiles(prev => {
      const isSelected = prev.some(f => f.id === file.id);
      if (isSelected) {
        return prev.filter(f => f.id !== file.id);
      } else {
        return [...prev, file];
      }
    });
  };

  const selectAllFilesInProject = (project: ProjectWithFiles) => {
    const projectFiles = project.files.filter(file => {
      const matchesType = selectedFileType === "all" || file.documentType === selectedFileType;
      const matchesSearch = !searchQuery || 
        file.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        file.projectName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        file.documentType?.toLowerCase().includes(searchQuery.toLowerCase());
      return matchesType && matchesSearch;
    });
    
    setSelectedFiles(prev => {
      const existingIds = new Set(prev.map(f => f.id));
      const newFiles = projectFiles.filter(f => !existingIds.has(f.id));
      return [...prev, ...newFiles];
    });
  };

  const clearSelection = () => {
    setSelectedFiles([]);
  };

  const sendSelectedFiles = () => {
    if (onFilesSelected && selectedFiles.length > 0) {
      onFilesSelected(selectedFiles);
      onOpenChange(false);
    }
  };

  const filteredProjects = projects.map(project => ({
    ...project,
    files: project.files.filter(file => {
      const matchesSearch = !searchQuery || 
        file.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        file.projectName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        file.documentType?.toLowerCase().includes(searchQuery.toLowerCase());
      
      const matchesType = selectedFileType === "all" || file.documentType === selectedFileType;
      
      return matchesSearch && matchesType;
    })
  })).filter(project => project.files.length > 0);

  const uniqueFileTypes = Array.from(new Set(
    projects.flatMap(project => project.files.map(file => file.documentType)).filter(Boolean)
  ));

  const getFileIcon = (fileType: string) => {
    if (fileType?.includes('pdf')) return <FileText className="h-4 w-4 text-red-500" />;
    if (fileType?.includes('word')) return <FileText className="h-4 w-4 text-blue-500" />;
    if (fileType?.includes('excel')) return <FileSpreadsheet className="h-4 w-4 text-green-500" />;
    if (fileType?.includes('powerpoint')) return <Presentation className="h-4 w-4 text-orange-500" />;
    if (fileType?.includes('image')) return <Image className="h-4 w-4 text-purple-500" />;
    if (fileType?.includes('zip') || fileType?.includes('archive')) return <Archive className="h-4 w-4 text-yellow-500" />;
    if (fileType?.includes('email')) return <Mail className="h-4 w-4 text-indigo-500" />;
    if (fileType?.includes('code') || fileType?.includes('text')) return <Code className="h-4 w-4 text-gray-500" />;
    return <File className="h-4 w-4 text-gray-500" />;
  };

  const handleViewFile = (file: ProjectFile) => {
    if (file.url) {
      window.open(file.url, '_blank');
    }
  };

  const handleDownloadFile = (file: ProjectFile) => {
    if (file.url) {
      const link = document.createElement('a');
      link.href = file.url;
      link.download = file.name || 'download';
      link.click();
    }
  };

  return (
                   <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent 
          className="max-w-[95vw] w-[1400px] max-h-[95vh] flex flex-col" 
          style={{ 
            width: '1400px !important', 
            maxWidth: '95vw !important',
            minWidth: '1400px'
          }}
        >
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Folder className="h-5 w-5" />
            Knowledge Base File Manager
          </DialogTitle>
          <DialogDescription>
            Browse projects, select files, and send them to your chat
          </DialogDescription>
        </DialogHeader>

                 <div className="flex-1 flex flex-col gap-6 min-h-0">
           {/* Search and Filter Controls */}
           <div className="flex gap-6 items-center p-2">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search files, projects, or types..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
            
            <select
              value={selectedFileType}
              onChange={(e) => setSelectedFileType(e.target.value)}
              className="border rounded-md px-3 py-2 text-sm"
            >
              <option value="all">All Types</option>
              {uniqueFileTypes.map(type => (
                <option key={type} value={type}>{type}</option>
              ))}
            </select>

            <Button
              variant="outline"
              size="sm"
              onClick={clearSelection}
              disabled={selectedFiles.length === 0}
            >
              Clear Selection
            </Button>
          </div>

                     {/* Tabs */}
           <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1 min-h-0">
             <TabsList className="grid w-full grid-cols-2">
               <TabsTrigger value="projects">Project View</TabsTrigger>
               <TabsTrigger value="files">All Files</TabsTrigger>
             </TabsList>
 
             <TabsContent value="projects" className="flex-1 mt-4 min-h-0">
               {/* Project-based File View */}
               <div className="flex-1 min-h-0 h-[60vh]">
                {loading ? (
                  <div className="flex items-center justify-center h-32">
                    <Loader2 className="h-6 w-6 animate-spin" />
                    <span className="ml-2">Loading projects and files...</span>
                  </div>
                ) : filteredProjects.length === 0 ? (
                  <div className="flex flex-col items-center justify-center h-32 text-muted-foreground">
                    <Folder className="h-8 w-8 mb-2" />
                    <p>No projects or files found</p>
                    <p className="text-sm">
                      {searchQuery || selectedFileType !== "all" 
                        ? "Try adjusting your search or filters" 
                        : "Create some projects and upload files to get started"}
                    </p>
                  </div>
                ) : (
                                                        <ScrollArea className="h-full max-h-[55vh]">
                     <div className="space-y-6 p-2">
                       {filteredProjects.map((project) => (
                        <div key={project.id} className="border rounded-lg">
                          {/* Project Header */}
                                                     <div 
                             className="flex items-center justify-between p-6 bg-muted/30 cursor-pointer hover:bg-muted/50 transition-colors"
                             onClick={() => toggleProjectExpansion(project.id)}
                           >
                            <div className="flex items-center gap-3">
                              {project.expanded ? (
                                <ChevronDown className="h-4 w-4" />
                              ) : (
                                <ChevronRight className="h-4 w-4" />
                              )}
                              <FolderOpen className="h-5 w-5 text-blue-500" />
                              <div>
                                <h3 className="font-medium">{project.name}</h3>
                                <p className="text-sm text-muted-foreground">
                                  {project.files.length} files • {formatBytes(Number(project.totalSize || 0))}
                                </p>
                              </div>
                            </div>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={(e) => {
                                e.stopPropagation();
                                selectAllFilesInProject(project);
                              }}
                            >
                              Select All
                            </Button>
                          </div>

                                                     {/* Project Files */}
                           {project.expanded && (
                             <div className="p-6 space-y-3">
                               {project.files.map((file) => (
                                                                 <div
                                   key={file.id}
                                   className={`flex items-center justify-between p-4 border rounded-lg hover:bg-muted/30 transition-colors ${
                                     selectedFiles.some(f => f.id === file.id) ? 'bg-primary/10 border-primary' : ''
                                   }`}
                                 >
                                  <div className="flex items-center gap-3 flex-1 min-w-0">
                                    <input
                                      type="checkbox"
                                      checked={selectedFiles.some(f => f.id === file.id)}
                                      onChange={() => toggleFileSelection(file)}
                                      className="h-4 w-4"
                                    />
                                    {getFileIcon(file.type || '')}
                                    <div className="flex-1 min-w-0">
                                      <div className="flex items-center gap-2 mb-1">
                                        <p className="font-medium truncate">{file.name}</p>
                                        <Badge variant="secondary" className="text-xs">
                                          {file.documentType}
                                        </Badge>
                                      </div>
                                      <div className="flex items-center gap-4 text-sm text-muted-foreground">
                                        <span>{formatBytes(Number(file.size || 0))}</span>
                                        <span className="flex items-center gap-1">
                                          <Calendar className="h-3 w-3" />
                                          {file.uploadedAt ? new Date(file.uploadedAt).toLocaleDateString() : 'Unknown date'}
                                        </span>
                                      </div>
                                    </div>
                                  </div>
                                  
                                  <div className="flex items-center gap-2">
                                    {file.url && (
                                      <>
                                        <Button
                                          variant="ghost"
                                          size="sm"
                                          onClick={() => handleViewFile(file)}
                                          title="View file"
                                        >
                                          <Eye className="h-4 w-4" />
                                        </Button>
                                        <Button
                                          variant="ghost"
                                          size="sm"
                                          onClick={() => handleDownloadFile(file)}
                                          title="Download file"
                                        >
                                          <Download className="h-4 w-4" />
                                        </Button>
                                      </>
                                    )}
                                  </div>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  </ScrollArea>
                )}
              </div>
            </TabsContent>

                         <TabsContent value="files" className="flex-1 mt-4 min-h-0">
               {/* Flat File List View */}
               <div className="flex-1 min-h-0 h-[60vh]">
                {loading ? (
                  <div className="flex items-center justify-center h-32">
                    <Loader2 className="h-6 w-6 animate-spin" />
                    <span className="ml-2">Loading files...</span>
                  </div>
                ) : filteredProjects.flatMap(p => p.files).length === 0 ? (
                  <div className="flex flex-col items-center justify-center h-32 text-muted-foreground">
                    <File className="h-8 w-8 mb-2" />
                    <p>No files found</p>
                    <p className="text-sm">
                      {searchQuery || selectedFileType !== "all" 
                        ? "Try adjusting your search or filters" 
                        : "Upload some files to your knowledge base projects"}
                    </p>
                  </div>
                ) : (
                                                        <ScrollArea className="h-full max-h-[55vh]">
                     <div className="space-y-3 p-2">
                       {filteredProjects.flatMap(project =>  
                        project.files.map(file => (
                                                     <div
                             key={file.id}
                             className={`flex items-center justify-between p-5 border rounded-lg hover:bg-muted/50 transition-colors ${
                               selectedFiles.some(f => f.id === file.id) ? 'bg-primary/10 border-primary' : ''
                             }`}
                           >
                            <div className="flex items-center gap-3 flex-1 min-w-0">
                              <input
                                type="checkbox"
                                checked={selectedFiles.some(f => f.id === file.id)}
                                onChange={() => toggleFileSelection(file)}
                                className="h-4 w-4"
                              />
                              {getFileIcon(file.type || '')}
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2 mb-1">
                                  <p className="font-medium truncate">{file.name}</p>
                                  <Badge variant="secondary" className="text-xs">
                                    {file.documentType}
                                  </Badge>
                                </div>
                                <div className="flex items-center gap-4 text-sm text-muted-foreground">
                                  <span className="flex items-center gap-1">
                                    <Folder className="h-3 w-3" />
                                    {file.projectName}
                                  </span>
                                  <span>{formatBytes(Number(file.size || 0))}</span>
                                  <span className="flex items-center gap-1">
                                    <Calendar className="h-3 w-3" />
                                    {file.uploadedAt ? new Date(file.uploadedAt).toLocaleDateString() : 'Unknown date'}
                                  </span>
                                </div>
                              </div>
                            </div>
                            
                            <div className="flex items-center gap-2">
                              {file.url && (
                                <>
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => handleViewFile(file)}
                                    title="View file"
                                  >
                                    <Eye className="h-4 w-4" />
                                  </Button>
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => handleDownloadFile(file)}
                                    title="Download file"
                                  >
                                    <Download className="h-4 w-4" />
                                  </Button>
                                </>
                              )}
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                  </ScrollArea>
                )}
              </div>
            </TabsContent>
          </Tabs>

                     {/* Footer with Selection Summary and Actions */}
           <div className="flex items-center justify-between pt-6 border-t">
            <div className="flex items-center gap-4">
              <div className="text-sm text-muted-foreground">
                {selectedFiles.length} of {filteredProjects.flatMap(p => p.files).length} files selected
              </div>
              {selectedFiles.length > 0 && (
                <div className="text-sm">
                  <span className="font-medium">Selected:</span>
                  <span className="ml-2 text-muted-foreground">
                    {selectedFiles.map(f => f.name).join(', ')}
                  </span>
                </div>
              )}
            </div>
            <div className="flex items-center gap-2">
              <Button variant="outline" onClick={() => onOpenChange(false)}>
                Cancel
              </Button>
              <Button 
                onClick={sendSelectedFiles}
                disabled={selectedFiles.length === 0}
                className="flex items-center gap-2"
              >
                <Send className="h-4 w-4" />
                Send to Chat ({selectedFiles.length})
              </Button>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
