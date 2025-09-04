"use client";

import React, { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { ContentLayout } from "@/components/sidebar/content-layout";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Separator } from "@/components/ui/separator";
import { LoadingSpinner } from "@/components/ui/loading-spinner";
import { ErrorDisplay } from "@/components/ui/error-display";
import {
  ArrowLeft,
  FolderOpen,
  FileText,
  Calendar,
  HardDrive,
  MoreVertical,
  Upload,
  Download,
  Trash2,
  Edit,
  Settings,
  Users,
  Activity,
  BarChart3,
  Clock,
  Tag,
  Eye,
  Search,
  Filter,
  SortAsc,
  FileImage,
  FileVideo,
  FileAudio,
  FileCode,
  FileSpreadsheet,
  Presentation,
  FileArchive,
  FileText as FilePdf,
  FileText as FileWord,
  FileText as FileExcel,
  Presentation as FilePowerpoint,
  FileText as FileCsv,
  FileArchive as FileZip,
  Mail,
  Image,
  Video,
  Music,
  Code,
  Database,
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Project, ProjectFile } from "@/lib/types";
import { useProjects } from "@/hooks/use-projects";
import { useAuthContext } from "@/components/providers/auth-provider";
import { useToast } from "@/components/ui/toast";
import { cn } from "@/lib/utils";

const ViewProjectPage = () => {
  const params = useParams();
  const router = useRouter();
  const projectId = params.projectId as string;
  
  const { projects, loading, error, deleteProject, refreshProjects } = useProjects();
  const { user, session } = useAuthContext();
  const { addToast } = useToast();
  const [project, setProject] = useState<Project | null>(null);
  const [selectedTab, setSelectedTab] = useState("files");
  const [searchQuery, setSearchQuery] = useState("");
  const [sortBy, setSortBy] = useState<"name" | "date" | "size" | "type">("name");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("asc");
  const [showUploadDialog, setShowUploadDialog] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);

  useEffect(() => {
    if (projects && projectId) {
      const foundProject = projects.find(p => p.id === projectId);
      setProject(foundProject || null);
    }
  }, [projects, projectId]);

  const handleBackToProjects = () => {
    router.push("/agents/knowledge");
  };

  const handleDeleteProject = async () => {
    if (project && confirm("Are you sure you want to delete this project? This action cannot be undone.")) {
      try {
        await deleteProject(project.id);
        router.push("/agents/knowledge");
      } catch (error) {
        console.error("Failed to delete project:", error);
      }
    }
  };

  const handleEditProject = () => {
    // TODO: Implement edit project functionality
    console.log("Edit project:", project);
  };

  const handleFileUpload = async (files: FileList) => {
    if (!project || !user) return;
    
    setUploading(true);
    setUploadProgress(0);
    
    try {
      const fileArray = Array.from(files);
      
      for (let i = 0; i < fileArray.length; i++) {
        const file = fileArray[i];
        
        // Update progress
        setUploadProgress((i / fileArray.length) * 100);
        
        // Create form data
        const formData = new FormData();
        formData.append('file', file);
        
        // Get auth token from the session
        if (!user || !user.id) {
          throw new Error('User not authenticated');
        }
        
        if (!session?.access_token) {
          throw new Error('No access token found. Please sign in again.');
        }
        
        // Use the proper JWT token from the session
        const response = await fetch(`/api/projects/${project.id}/files`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${session.access_token}`,
          },
          body: formData,
        });
        
        if (!response.ok) {
          throw new Error(`Upload failed: ${response.statusText}`);
        }
        
        const result = await response.json();
        
        if (result.success) {
          console.log('File uploaded successfully:', result.file.name);
          
          // Update the local project state immediately with the new file
          if (project) {
            const newFile = {
              ...result.file,
              size: result.file.size, // Keep as number for consistency
            };
            
            setProject(prevProject => {
              if (!prevProject) return prevProject;
              return {
                ...prevProject,
                files: [...(prevProject.files || []), newFile],
                fileCount: (prevProject.fileCount || 0) + 1,
                totalSize: BigInt(Number(prevProject.totalSize || 0) + (result.file.size || 0)),
              };
            });
          }
        }
      }
      
      // Refresh the project data by refetching from the API
      try {
        const projectResponse = await fetch(`/api/projects/${project.id}`);
        if (projectResponse.ok) {
          const updatedProjectData = await projectResponse.json();
          setProject(updatedProjectData);
          console.log('Project data refreshed after file upload');
        }
      } catch (refreshError) {
        console.error('Failed to refresh project data:', refreshError);
        // Fallback: try to refresh from projects list
        if (projects) {
          const updatedProject = projects.find(p => p.id === project.id);
          if (updatedProject) {
            setProject(updatedProject);
          }
        }
      }
      
      // Also refresh the projects list to update the parent component
      if (refreshProjects) {
        try {
          await refreshProjects();
          console.log('Projects list refreshed after file upload');
        } catch (refreshError) {
          console.error('Failed to refresh projects list:', refreshError);
        }
      }
      
      // Show success message
      addToast({
        title: "Files Uploaded",
        description: `Successfully uploaded ${fileArray.length} file(s)!`,
        type: "success",
        duration: 5000
      });
      
      setShowUploadDialog(false);
    } catch (error) {
      console.error('Error uploading files:', error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      addToast({
        title: "Upload Failed",
        description: `Failed to upload files: ${errorMessage}`,
        type: "error",
        duration: 8000
      });
    } finally {
      setUploading(false);
      setUploadProgress(0);
    }
  };

  const filteredAndSortedFiles = project?.files
    ?.filter(file => {
      const fileName = file.originalName || file.name || '';
      const documentType = file.metadata?.documentType || file.documentType || '';
      return fileName.toLowerCase().includes(searchQuery.toLowerCase()) ||
             documentType.toLowerCase().includes(searchQuery.toLowerCase());
    })
    .sort((a, b) => {
      let comparison = 0;
      switch (sortBy) {
        case "name":
          const aName = a.originalName || a.name || '';
          const bName = b.originalName || b.name || '';
          comparison = aName.localeCompare(bName);
          break;
        case "date":
          comparison = new Date(a.updatedAt).getTime() - new Date(b.updatedAt).getTime();
          break;
        case "size":
          const aSize = Number(a.fileSize || a.size || 0);
          const bSize = Number(b.fileSize || b.size || 0);
          comparison = aSize - bSize;
          break;
        case "type":
          const aType = a.metadata?.documentType || a.documentType || '';
          const bType = b.metadata?.documentType || b.documentType || '';
          comparison = aType.localeCompare(bType);
          break;
      }
      return sortOrder === "asc" ? comparison : -comparison;
    }) || [];

  const formatBytes = (bytes: number) => {
    if (bytes === 0) return "0 Bytes";
    const k = 1024;
    const sizes = ["Bytes", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
  };

  const formatDate = (date: Date | string | null | undefined) => {
    // Handle null, undefined, or invalid dates
    if (!date) {
      return "N/A";
    }
    
    // Convert string to Date if needed
    const dateObj = typeof date === 'string' ? new Date(date) : date;
    
    // Check if the date is valid
    if (isNaN(dateObj.getTime())) {
      return "Invalid Date";
    }
    
    return new Intl.DateTimeFormat("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    }).format(dateObj);
  };

  const getStatusColor = (status: Project["status"]) => {
    switch (status) {
      case "ACTIVE":
        return "bg-green-100 text-green-800 border-green-200";
      case "PROCESSING":
        return "bg-yellow-100 text-yellow-800 border-yellow-200";
      case "ERROR":
        return "bg-red-100 text-red-800 border-red-200";
      default:
        return "bg-gray-100 text-gray-800 border-gray-200";
    }
  };

  const getStatusIcon = (status: Project["status"]) => {
    switch (status) {
      case "ACTIVE":
        return <div className="w-2 h-2 bg-green-500 rounded-full" />;
      case "PROCESSING":
        return <div className="w-2 h-2 bg-yellow-500 rounded-full animate-pulse" />;
      case "ERROR":
        return <div className="w-2 h-2 bg-red-500 rounded-full" />;
      default:
        return <div className="w-2 h-2 bg-gray-500 rounded-full" />;
    }
  };

  const getFileIcon = (documentType: string) => {
    const type = documentType.toLowerCase();
    
    // PDF files
    if (type.includes('pdf')) {
      return <FilePdf className="h-5 w-5 text-red-600" />;
    }
    
    // Word documents
    if (type.includes('word') || type.includes('doc') || type.includes('docx') || type.includes('rtf')) {
      return <FileWord className="h-5 w-5 text-blue-600" />;
    }
    
    // Excel/Spreadsheet files
    if (type.includes('excel') || type.includes('xls') || type.includes('xlsx') || type.includes('csv')) {
      return <FileExcel className="h-5 w-5 text-green-600" />;
    }
    
    // PowerPoint/Presentation files
    if (type.includes('powerpoint') || type.includes('ppt') || type.includes('pptx')) {
      return <FilePowerpoint className="h-5 w-5 text-orange-600" />;
    }
    
    // Image files
    if (type.includes('jpeg') || type.includes('jpg') || type.includes('png') || type.includes('gif') || type.includes('bmp') || type.includes('tiff') || type.includes('svg')) {
      return <Image className="h-5 w-5 text-purple-600" />;
    }
    
    // Video files
    if (type.includes('mp4') || type.includes('avi') || type.includes('mov') || type.includes('wmv') || type.includes('flv') || type.includes('webm')) {
      return <Video className="h-5 w-5 text-red-500" />;
    }
    
    // Audio files
    if (type.includes('mp3') || type.includes('wav') || type.includes('flac') || type.includes('aac') || type.includes('ogg')) {
      return <Music className="h-5 w-5 text-blue-500" />;
    }
    
    // Code files
    if (type.includes('js') || type.includes('ts') || type.includes('jsx') || type.includes('tsx') || type.includes('html') || type.includes('css') || type.includes('py') || type.includes('java') || type.includes('cpp') || type.includes('c')) {
      return <Code className="h-5 w-5 text-gray-600" />;
    }
    
    // Archive files
    if (type.includes('zip') || type.includes('rar') || type.includes('7z') || type.includes('tar') || type.includes('gz')) {
      return <FileZip className="h-5 w-5 text-yellow-600" />;
    }
    
    // Database files
    if (type.includes('sql') || type.includes('db') || type.includes('sqlite') || type.includes('mdb')) {
      return <Database className="h-5 w-5 text-indigo-600" />;
    }
    
    // Email files
    if (type.includes('email') || type.includes('eml') || type.includes('msg')) {
      return <Mail className="h-5 w-5 text-blue-500" />;
    }
    
    // Default file icon
    return <FileText className="h-5 w-5 text-gray-500" />;
  };

  if (loading) {
    return (
      <ContentLayout 
        title="Knowledge Base"
        showContextToggle={true}
        contextType="knowledge"
      >
        <div className="flex items-center justify-center py-20">
          <div className="text-center">
            <LoadingSpinner size={48} className="mx-auto mb-4 text-primary" />
            <p className="text-gray-600">Loading project details...</p>
          </div>
        </div>
      </ContentLayout>
    );
  }

  if (error || !project) {
    return (
      <ContentLayout 
        title="Project Not Found"
        showContextToggle={true}
        contextType="knowledge"
      >
        <div className="py-6">
          <ErrorDisplay 
            error={error || "Project not found"} 
            onRetry={handleBackToProjects}
          />
        </div>
      </ContentLayout>
    );
  }

  return (
    <ContentLayout 
      title={`Knowledge Base`}
      showContextToggle={true}
      contextType="knowledge"
      className="pt-16"
    >
      <div className="p-6 space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex h-full items-center gap-4">
            <Button
              variant="ghost"
              size="lg"
              onClick={handleBackToProjects}
              className="p-2 h-full"
            >
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <div>
              <h1 className="text-3xl font-bold">{project.name}</h1>
              <p className="text-muted-foreground">
                {project.description || "No description provided"}
              </p>
            </div>
          </div>
          
          <div className="flex items-center gap-3">            
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="default" size="lg">
                  <MoreVertical className="h-4 w-4 mr-2" />
                  Actions
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={handleEditProject}>
                  <Edit className="mr-2 h-4 w-4" />
                  Edit Project
                </DropdownMenuItem>
                <DropdownMenuItem>
                  <Upload className="mr-2 h-4 w-4" />
                  Upload Files
                </DropdownMenuItem>
                <DropdownMenuItem>
                  <Download className="mr-2 h-4 w-4" />
                  Export Project
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  onClick={handleDeleteProject}
                  className="text-red-600"
                >
                  <Trash2 className="mr-2 h-4 w-4" />
                  Delete Project
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>

        {/* Project Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="bg-blue-100 p-4 rounded-lg">
                  <FileText className="h-6 w-6 text-blue-600" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Total Files</p>
                  <p className="text-2xl font-bold">{project.fileCount}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="bg-green-100 p-4 rounded-lg">
                  <HardDrive className="h-6 w-6 text-green-600" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Total Size</p>
                  <p className="text-2xl font-bold">{formatBytes(Number(project.totalSize))}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="bg-purple-100 p-4 rounded-lg">
                  <Calendar className="h-6 w-6 text-purple-600" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Created</p>
                  <p className="text-2xl font-bold">{formatDate(project.createdAt)}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="bg-orange-100 p-4 rounded-lg">
                  <Clock className="h-6 w-6 text-orange-600" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Updated</p>
                  <p className="text-2xl font-bold">{formatDate(project.updatedAt)}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Main Content Tabs */}
        <Tabs value={selectedTab} onValueChange={setSelectedTab} >
          <TabsList className="grid w-full grid-cols-4" size="xl">
            <TabsTrigger value="files">Files ({project.fileCount})</TabsTrigger>
            <TabsTrigger value="analytics">Analytics</TabsTrigger>
            <TabsTrigger value="settings">Settings</TabsTrigger>
            <TabsTrigger value="overview">Overview</TabsTrigger>
          </TabsList>

          <TabsContent value="files" className="space-y-6">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle>Project Files</CardTitle>
                    <CardDescription>
                      Manage and organize your project files
                    </CardDescription>
                  </div>
                  <Button size="sm" onClick={() => setShowUploadDialog(true)}>
                    <Upload className="h-4 w-4 mr-2" />
                    Upload Files
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                {/* Search and Filter Bar */}
                <div className="flex items-center gap-4 mb-6">
                  <div className="relative flex-1 max-w-md">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <input
                      type="text"
                      placeholder="Search files..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="w-full pl-10 pr-4 py-2 border border-input rounded-md focus:outline-none focus:ring-2 focus:ring-ring"
                    />
                  </div>
                  
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="outline" size="sm">
                        <Filter className="h-4 w-4 mr-2" />
                        Sort by: {sortBy}
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent>
                      <DropdownMenuItem onClick={() => setSortBy("name")}>
                        Name
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => setSortBy("date")}>
                        Date
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => setSortBy("size")}>
                        Size
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => setSortBy("type")}>
                        Type
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                  
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setSortOrder(sortOrder === "asc" ? "desc" : "asc")}
                  >
                    <SortAsc className={`h-4 w-4 ${sortOrder === "desc" ? "rotate-180" : ""}`} />
                  </Button>
                </div>

                {/* Files List */}
                {filteredAndSortedFiles.length === 0 ? (
                  <div className="text-center py-12">
                    <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                    <p className="text-muted-foreground">
                      {searchQuery ? "No files match your search" : "No files uploaded yet"}
                    </p>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {filteredAndSortedFiles.map((file) => (
                      <div
                        key={file.id}
                        className="flex items-center justify-between p-4 border border-border rounded-lg hover:bg-muted/50 transition-colors"
                      >
                                                 <div className="flex items-center gap-4">
                           <div className="bg-primary/10 p-2 rounded-lg">
                             {getFileIcon(file.metadata?.documentType || file.documentType || 'Unknown')}
                           </div>
                          <div>
                            <p className="font-medium">{file.originalName || file.name || 'Unknown'}</p>
                            <div className="flex items-center gap-4 text-sm text-muted-foreground">
                              <span>{file.metadata?.documentType || file.documentType || 'Unknown'}</span>
                              <span>{formatBytes(Number(file.fileSize || file.size || 0))}</span>
                              <span>{file.metadata?.pageCount || file.pageCount ? `${file.metadata?.pageCount || file.pageCount} pages` : ""}</span>
                            </div>
                          </div>
                        </div>
                        
                        <div className="flex items-center gap-2">
                          <span className="text-sm text-muted-foreground">
                            {formatDate(file.updatedAt)}
                          </span>
                          <Button variant="ghost" size="sm">
                            <Eye className="h-4 w-4" />
                          </Button>
                          <Button variant="ghost" size="sm">
                            <Download className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="analytics" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Project Analytics</CardTitle>
                <CardDescription>
                  Insights and statistics about your project
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-center py-12">
                  <BarChart3 className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <p className="text-muted-foreground">
                    Analytics features coming soon
                  </p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="settings" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Project Settings</CardTitle>
                <CardDescription>
                  Configure project preferences and permissions
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-center py-12">
                  <Settings className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <p className="text-muted-foreground">
                    Settings features coming soon
                  </p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="overview" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Project Overview</CardTitle>
                <CardDescription>
                  General information about this project
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <h4 className="font-medium mb-2">Project Details</h4>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Name:</span>
                        <span>{project.name}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Description:</span>
                        <span>{project.description || "No description"}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Status:</span>
                        <Badge variant="outline" className={getStatusColor(project.status)}>
                          {project.status}
                        </Badge>
                      </div>
                    </div>
                  </div>
                  
                  <div>
                    <h4 className="font-medium mb-2">File Statistics</h4>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Total Files:</span>
                        <span>{project.fileCount}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Total Size:</span>
                        <span>{formatBytes(Number(project.totalSize))}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Created:</span>
                        <span>{formatDate(project.createdAt)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Last Updated:</span>
                        <span>{formatDate(project.updatedAt)}</span>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
                 </Tabs>
       </div>

       {/* File Upload Dialog */}
       {showUploadDialog && (
         <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
           <div className="bg-white dark:bg-gray-800 rounded-lg p-6 w-full max-w-md mx-4">
             <h3 className="text-lg font-semibold mb-4">Upload Files</h3>
             
             <div className="space-y-4">
               <div>
                 <label htmlFor="file-upload" className="block text-sm font-medium mb-2">
                   Select Files
                 </label>
                 <input
                   id="file-upload"
                   type="file"
                   multiple
                   onChange={(e) => {
                     if (e.target.files && e.target.files.length > 0) {
                       handleFileUpload(e.target.files);
                     }
                   }}
                   className="w-full border border-gray-300 rounded-md p-2"
                   disabled={uploading}
                 />
               </div>
               
               {uploading && (
                 <div>
                   <div className="flex justify-between text-sm text-gray-600 mb-2">
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
               
               <div className="flex justify-end gap-2">
                 <Button
                   variant="outline"
                   onClick={() => setShowUploadDialog(false)}
                   disabled={uploading}
                 >
                   Cancel
                 </Button>
               </div>
             </div>
           </div>
         </div>
       )}
     </ContentLayout>
   );
 };

export default ViewProjectPage;
