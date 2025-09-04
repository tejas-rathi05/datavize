"use client";

import React, { useState, useCallback } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { useAuthContext } from "@/components/providers/auth-provider";
import { useToast } from "@/components/ui/toast";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";

import { Upload, FileText, Folder, Database, Info } from "lucide-react";
import { cn } from "@/lib/utils";

// Zod schema for form validation
const createProjectSchema = z.object({
  projectName: z
    .string()
    .min(1, "Project name is required")
    .min(3, "Project name must be at least 3 characters")
    .max(50, "Project name must be less than 50 characters"),
  description: z
    .string()
    .max(200, "Description must be less than 200 characters")
    .optional(),
});

type CreateProjectFormData = z.infer<typeof createProjectSchema>;

// Supported file types
const supportedFileTypes = [
  "CSV", "Email", "Excel", "JPEG", "PDF", "PNG", 
  "PowerPoint", "RTF", "Text", "TIFF", "Word (.docx)", "Zip"
];

interface CreateProjectDialogProps {
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  onProjectCreated?: (projectData: { projectName: string; description?: string; files?: File[] }) => void;
  createProject?: (data: { projectName: string; description?: string }) => Promise<{ id: string; name: string }>;
  onFilesUploaded?: (projectId: string, files: File[]) => Promise<void>;
}

const CreateProjectDialog: React.FC<CreateProjectDialogProps> = ({ 
  open, 
  onOpenChange, 
  onProjectCreated,
  createProject,
  onFilesUploaded
}) => {
  const { user, session } = useAuthContext();
  const { addToast } = useToast();
  const [isOpen, setIsOpen] = useState(false);
  
  // Use controlled state if open/onOpenChange are provided
  const isControlled = open !== undefined && onOpenChange !== undefined;
  const dialogOpen = isControlled ? open : isOpen;
  const setDialogOpen = isControlled ? onOpenChange : setIsOpen;
  const [files, setFiles] = useState<File[]>([]);
  const [isDragOver, setIsDragOver] = useState(false);
  const [storageUsed, setStorageUsed] = useState(0); // in bytes
  const [fileCount, setFileCount] = useState(0);
  
  const maxStorage = 5 * 1024 * 1024 * 1024; // 5 GB
  const maxFiles = 10000;

  const form = useForm<CreateProjectFormData>({
    resolver: zodResolver(createProjectSchema),
    defaultValues: {
      projectName: "",
      description: "",
    },
  });

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [uploadProgress, setUploadProgress] = useState<{ [key: string]: number }>({});
  const [isProcessingFiles, setIsProcessingFiles] = useState(false);
  
  // Debug: Log state changes
  console.log('Dialog state:', { files: files.length, storageUsed, fileCount, isSubmitting });

  const onSubmit = async (data: CreateProjectFormData) => {
    try {
      console.log("=== Form submission started ===");
      console.log("Form data:", data);
      console.log("Files to upload:", files);
      console.log("File count:", files.length);
      console.log("Total size:", formatBytes(storageUsed));
      console.log("Files array content:", files.map(f => ({ name: f.name, size: f.size })));
      
      // Check if user is authenticated
      if (!user || !session?.access_token) {
        throw new Error("You must be logged in to create projects and upload files.");
      }
      
      setIsSubmitting(true);
      
      let projectId: string | undefined;
      
      // Create the project first
      if (createProject) {
        try {
          console.log("Creating project via createProject function...");
          const project = await createProject({
            projectName: data.projectName,
            description: data.description || ""
          });
          projectId = project.id;
          console.log("Project created with ID:", projectId);
        } catch (error) {
          console.error("Failed to create project:", error);
          throw new Error("Failed to create project. Please try again.");
        }
      } else {
        throw new Error("Project creation function not provided. Please contact support.");
      }
      
      // Upload files if project was created and files exist
      if (projectId && files.length > 0) {
        try {
          console.log("Uploading files to project:", projectId);
          
          if (onFilesUploaded) {
            // Use parent component's upload function if provided
            await onFilesUploaded(projectId, files);
          } else if (user && session?.access_token) {
            // Fallback: upload files directly using our API
            console.log("Using fallback file upload API");
            for (const file of files) {
              const formData = new FormData();
              formData.append('file', file);
              
              const response = await fetch(`/api/projects/${projectId}/files`, {
                method: 'POST',
                headers: {
                  'Authorization': `Bearer ${session.access_token}`,
                },
                body: formData,
              });
              
              if (!response.ok) {
                throw new Error(`Failed to upload ${file.name}: ${response.statusText}`);
              }
              
              console.log(`File ${file.name} uploaded successfully`);
            }
          }
          
          console.log("Files uploaded successfully");
        } catch (error) {
          console.error("Failed to upload files:", error);
          // Don't throw here - project was created successfully
          addToast({
            title: "Project Created",
            description: "Project created successfully, but some files failed to upload. You can upload them later.",
            type: "warning",
            duration: 6000
          });
        }
      }
      
             // Note: We don't call onProjectCreated here since we're handling project creation
       // and file upload directly in the dialog. The parent component will get updated
       // through the useProjects hook refresh.
      
             // Reset form and close dialog
       form.reset();
       setFiles([]);
       setStorageUsed(0);
       setFileCount(0);
       setUploadProgress({});
       setDialogOpen(false);
       
       // Close the dialog
       if (onOpenChange) {
         onOpenChange(false);
       }
      
      // Show success message
      const message = files.length > 0 
        ? `Project "${data.projectName}" created successfully with ${files.length} file(s)!`
        : `Project "${data.projectName}" created successfully!`;
      addToast({
        title: "Success!",
        description: message,
        type: "success",
        duration: 5000
      });
      console.log("Project created successfully!", data);
    } catch (error) {
      console.error("Error creating project:", error);
      
      // Show user-friendly error message
      const errorMessage = error instanceof Error ? error.message : 'Failed to create project';
      addToast({
        title: "Error",
        description: `${errorMessage}\n\nPlease check your file sizes and try again.`,
        type: "error",
        duration: 8000
      });
      
      // Don't close dialog on error, let user see the error
    } finally {
      setIsSubmitting(false);
    }
  };

  const getDocumentType = (fileName: string): string => {
    const extension = fileName.split('.').pop()?.toLowerCase();
    switch (extension) {
      case 'pdf': return 'PDF';
      case 'doc':
      case 'docx': return 'Word (.docx)';
      case 'xls':
      case 'xlsx': return 'Excel';
      case 'ppt':
      case 'pptx': return 'PowerPoint';
      case 'txt': return 'Text';
      case 'csv': return 'CSV';
      case 'eml': return 'Email';
      case 'jpg':
      case 'jpeg': return 'JPEG';
      case 'png': return 'PNG';
      case 'tiff': return 'TIFF';
      case 'rtf': return 'RTF';
      case 'zip': return 'Zip';
      default: return 'Other';
    }
  };

  const handleFileUpload = useCallback((uploadedFiles: FileList | File[]) => {
    const newFiles = Array.from(uploadedFiles);
    
    console.log('=== handleFileUpload called ===');
    console.log('Input files:', newFiles.map(f => ({ name: f.name, size: f.size, type: f.type })));
    console.log('Current state - fileCount:', fileCount, 'storageUsed:', storageUsed);
    
    setIsProcessingFiles(true);
    
    // Check file count limit
    if (fileCount + newFiles.length > maxFiles) {
      console.log('File count limit exceeded:', fileCount + newFiles.length, '>', maxFiles);
      addToast({
        title: "File Limit Exceeded",
        description: `Maximum ${maxFiles} files allowed`,
        type: "warning",
        duration: 4000
      });
      setIsProcessingFiles(false);
      return;
    }

    // Check storage limit
    const newFilesSize = newFiles.reduce((acc, file) => acc + file.size, 0);
    console.log('New files total size:', formatBytes(newFilesSize));
    
    if (storageUsed + newFilesSize > maxStorage) {
      console.log('Storage limit exceeded:', formatBytes(storageUsed + newFilesSize), '>', formatBytes(maxStorage));
      addToast({
        title: "Storage Limit Exceeded",
        description: "You've exceeded the maximum storage limit",
        type: "warning",
        duration: 4000
      });
      setIsProcessingFiles(false);
      return;
    }

    console.log('Adding files to state...');
    // Add files to state
    setFiles(prev => {
      const updatedFiles = [...prev, ...newFiles];
      console.log('Files state updated:', updatedFiles.map(f => f.name));
      return updatedFiles;
    });
    
    setFileCount(prev => {
      const newCount = prev + newFiles.length;
      console.log('File count updated:', newCount);
      return newCount;
    });
    
    setStorageUsed(prev => {
      const newStorage = prev + newFilesSize;
      console.log('Storage used updated:', formatBytes(newStorage));
      return newStorage;
    });
    
    // Initialize upload progress for new files
    const newProgress = { ...uploadProgress };
    newFiles.forEach(file => {
      newProgress[file.name] = 0;
    });
    setUploadProgress(newProgress);
    
    console.log('=== handleFileUpload completed successfully ===');
    
    // Simulate processing delay for better UX
    setTimeout(() => {
      setIsProcessingFiles(false);
      console.log('Processing state set to false');
    }, 500);
  }, [fileCount, storageUsed, maxFiles, maxStorage, uploadProgress]);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    
    console.log('Drop event:', e.dataTransfer.files);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      console.log('Files dropped:', Array.from(e.dataTransfer.files).map(f => f.name));
      handleFileUpload(e.dataTransfer.files);
    } else {
      console.log('No files in drop event');
    }
  }, [handleFileUpload]);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
  }, []);

  const handleFileInput = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    console.log('File input change event triggered');
    console.log('Event target:', e.target);
    console.log('Files:', e.target.files);
    console.log('Input attributes:', {
      multiple: e.target.multiple,
      webkitdirectory: (e.target as any).webkitdirectory,
      accept: e.target.accept
    });
    
    if (e.target.files && e.target.files.length > 0) {
      const selectedFiles = Array.from(e.target.files);
      console.log('Files selected:', selectedFiles.map(f => ({ 
        name: f.name, 
        size: f.size, 
        type: f.type,
        webkitRelativePath: (f as any).webkitRelativePath 
      })));
      
      // Check if this is a folder upload
      const isFolderUpload = (e.target as any).webkitdirectory;
      if (isFolderUpload) {
        console.log('Folder upload detected with', selectedFiles.length, 'files');
        // Filter out empty files or directories
        const validFiles = selectedFiles.filter(file => file.size > 0);
        console.log('Valid files after filtering:', validFiles.length);
        if (validFiles.length > 0) {
          handleFileUpload(validFiles);
        } else {
          console.log('No valid files found in folder');
          addToast({
            title: "No Valid Files",
            description: "No valid files found in the selected folder",
            type: "warning",
            duration: 4000
          });
        }
      } else {
        handleFileUpload(selectedFiles);
      }
      
      // Reset the input value so the same file can be selected again
      e.target.value = '';
    } else {
      console.log('No files selected or files array is empty');
    }
  }, [handleFileUpload]);

  const removeFile = useCallback((index: number) => {
    const fileToRemove = files[index];
    console.log('Removing file:', fileToRemove.name, 'at index:', index);
    
    setFiles(prev => {
      const newFiles = prev.filter((_, i) => i !== index);
      console.log('Files after removal:', newFiles.map(f => f.name));
      return newFiles;
    });
    
    setFileCount(prev => prev - 1);
    setStorageUsed(prev => prev - fileToRemove.size);
    
    // Remove from upload progress
    setUploadProgress(prev => {
      const newProgress = { ...prev };
      delete newProgress[fileToRemove.name];
      return newProgress;
    });
  }, [files]);

  const formatBytes = (bytes: number) => {
    if (bytes === 0) return "0 Bytes";
    const k = 1024;
    const sizes = ["Bytes", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
  };

  return (
    <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
      
      <DialogContent className="sm:max-w-[600px] max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Create project</DialogTitle>
          <DialogDescription>
            Create a new project and upload your files to get started.
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            {/* Project Name Field */}
            <FormField
              control={form.control}
              name="projectName"
              render={({ field }: any) => (
                <FormItem>
                  <FormLabel>Project name</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="Choose a name for your project"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Project Description Field */}
            <FormField
              control={form.control}
              name="description"
              render={({ field }: any) => (
                <FormItem>
                  <FormLabel>Description (Optional)</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="Add a description for your project"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* File Upload Section */}
            <div className="space-y-4">
              <FormLabel>Files (Optional)</FormLabel>
              
              {/* Upload Area */}
              <div
                className={cn(
                  "border-2 border-dashed rounded-lg p-8 text-center transition-colors",
                  isDragOver
                    ? "border-primary bg-primary/5"
                    : "border-muted-foreground/25 hover:border-primary/50"
                )}
                onDrop={handleDrop}
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
              >
                <Upload className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
                <div className="flex items-center justify-center gap-2 mb-2">
                  <span className="text-lg font-medium">Drag and drop</span>
                  <Info className="h-4 w-4 text-muted-foreground" />
                </div>
                
                                 <p className="text-sm text-muted-foreground mb-4">
                   Supported file types: {supportedFileTypes.join(", ")}
                 </p>
                 
                 {/* Debug info */}
                 <div className="text-xs text-muted-foreground mb-2">
                   Files: {files.length} | Size: {formatBytes(storageUsed)}
                 </div>
                 
                 {/* Processing indicator */}
                 {isProcessingFiles && (
                   <div className="text-xs text-primary mb-2 flex items-center gap-2 justify-center">
                     <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-primary"></div>
                     Processing files...
                   </div>
                 )}
                 
                 {/* Success message */}
                 {files.length > 0 && !isProcessingFiles && (
                   <div className="text-xs text-green-600 mb-2 text-center">
                     ✓ {files.length} file{files.length !== 1 ? 's' : ''} ready for upload
                   </div>
                 )}
                 
                 {/* Test button for debugging */}
                 <Button
                   type="button"
                   variant="outline"
                   size="sm"
                   onClick={() => {
                     const testFile = new File(['test content'], 'test.txt', { type: 'text/plain' });
                     console.log('Creating test file:', testFile);
                     handleFileUpload([testFile]);
                   }}
                   className="mb-2"
                 >
                   Add Test File
                 </Button>
                 
                 {/* Direct file input for testing */}
                 <div className="mb-2">
                   <input
                     type="file"
                     multiple
                     onChange={handleFileInput}
                     accept=".txt,.pdf,.doc,.docx"
                     className="text-xs"
                   />
                 </div>

                                                   {/* File Upload Buttons */}
                  <div className="flex gap-2 justify-center">
                    <label className="cursor-pointer">
                      <input
                        type="file"
                        multiple
                        className="hidden"
                        onChange={handleFileInput}
                        accept=".csv,.xlsx,.xls,.pdf,.doc,.docx,.txt,.rtf,.ppt,.pptx,.jpg,.jpeg,.png,.tiff,.zip"
                        id="file-upload-input"
                      />
                      <Button 
                        type="button"
                        variant="outline" 
                        size="sm" 
                        className="flex items-center gap-2"
                        onClick={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          const input = document.getElementById('file-upload-input') as HTMLInputElement;
                          if (input) {
                            console.log('Clicking file upload input');
                            input.click();
                          }
                        }}
                        disabled={isProcessingFiles}
                      >
                        <FileText className="h-4 w-4" />
                        {isProcessingFiles ? 'Processing...' : 'Upload Files'}
                      </Button>
                    </label>
                    
                    <label className="cursor-pointer">
                      <input
                        type="file"
                        multiple
                        className="hidden"
                        onChange={handleFileInput}
                        {...({ webkitdirectory: "" } as any)}
                        id="folder-upload-input"
                      />
                      <Button 
                        type="button"
                        variant="outline" 
                        size="sm" 
                        className="flex items-center gap-2"
                        onClick={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          const input = document.getElementById('folder-upload-input') as HTMLInputElement;
                          if (input) {
                            console.log('Clicking folder upload input');
                            input.click();
                          }
                        }}
                        disabled={isProcessingFiles}
                      >
                        <Folder className="h-4 w-4" />
                        {isProcessingFiles ? 'Processing...' : 'Upload Folder'}
                      </Button>
                    </label>
                  </div>
              </div>

                             {/* File List */}
               {files.length > 0 && (
                 <div className="space-y-2">
                   <h4 className="text-sm font-medium">Uploaded Files ({files.length})</h4>
                   <div className="max-h-32 overflow-y-auto space-y-1 border rounded-md p-2 bg-muted/30">
                     {files.map((file, index) => (
                       <div
                         key={index}
                         className="flex items-center justify-between p-2 bg-background rounded text-sm border"
                       >
                         <div className="flex items-center gap-2 min-w-0 flex-1">
                           <FileText className="h-4 w-4 flex-shrink-0" />
                           <span className="truncate font-medium">{file.name}</span>
                           <span className="text-muted-foreground text-xs flex-shrink-0">
                             ({formatBytes(file.size)})
                           </span>
                         </div>
                         <Button
                           variant="ghost"
                           size="sm"
                           onClick={() => removeFile(index)}
                           className="h-6 w-6 p-0 ml-2 flex-shrink-0"
                         >
                           ×
                         </Button>
                       </div>
                     ))}
                   </div>
                 </div>
               )}
            </div>

            {/* Storage and File Count Info */}
            <div className="flex justify-between text-sm text-muted-foreground">
              <div className="flex items-center gap-2">
                <Database className="h-4 w-4" />
                <span>{formatBytes(storageUsed)} of {formatBytes(maxStorage)}</span>
              </div>
              <span>{fileCount} of {maxFiles.toLocaleString()} files</span>
            </div>

            {/* Upload Progress */}
            {isSubmitting && files.length > 0 && (
              <div className="space-y-2">
                <p className="text-sm font-medium">Uploading files...</p>
                {files.map((file, index) => (
                  <div key={index} className="space-y-1">
                    <div className="flex justify-between text-xs text-muted-foreground">
                      <span>{file.name}</span>
                      <span>{uploadProgress[file.name] || 0}%</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div 
                        className="bg-primary h-2 rounded-full transition-all duration-300"
                        style={{ width: `${uploadProgress[file.name] || 0}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            )}

            <DialogFooter>
              <DialogClose asChild>
                <Button variant="outline" type="button">
                  Cancel
                </Button>
              </DialogClose>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? "Creating..." : "Create"}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
};

export default CreateProjectDialog;
