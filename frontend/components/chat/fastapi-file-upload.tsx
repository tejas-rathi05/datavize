"use client";

import React, { useState, useRef, useCallback } from 'react';
import { X, Upload, File, FileText, Image, FileCode, FileArchive, Loader2, CheckCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { useChatStore } from '@/hooks/use-chat-store';

interface FastAPIFileUploadProps {
  className?: string;
  onUploadComplete?: (sessionId: string) => void;
  onUploadError?: (error: string) => void;
}

const getFileIcon = (fileType: string) => {
  if (fileType.startsWith('image/')) return Image;
  if (fileType.includes('text/') || fileType.includes('json') || fileType.includes('xml') || fileType.includes('csv')) return FileText;
  if (fileType.includes('code') || fileType.includes('javascript') || fileType.includes('typescript') || fileType.includes('python')) return FileCode;
  if (fileType.includes('zip') || fileType.includes('rar') || fileType.includes('tar')) return FileArchive;
  return File;
};

const formatFileSize = (bytes: number) => {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
};

export function FastAPIFileUpload({ 
  className,
  onUploadComplete,
  onUploadError
}: FastAPIFileUploadProps) {
  const [files, setFiles] = useState<File[]>([]);
  const [isDragOver, setIsDragOver] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadStatus, setUploadStatus] = useState<'idle' | 'uploading' | 'success' | 'error'>('idle');
  const [uploadedSessionId, setUploadedSessionId] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { uploadFiles, currentSessionId } = useChatStore();

  const maxFiles = 10;
  const maxFileSize = 50; // 50MB per file

  const validateFile = (file: File): string | null => {
    if (files.length >= maxFiles) {
      return `Maximum ${maxFiles} files allowed`;
    }
    
    if (file.size > maxFileSize * 1024 * 1024) {
      return `File size must be less than ${maxFileSize}MB`;
    }
    
    return null;
  };

  const addFiles = useCallback((newFiles: FileList | File[]) => {
    const fileArray = Array.from(newFiles);
    const validFiles: File[] = [];
    const errors: string[] = [];

    fileArray.forEach(file => {
      const error = validateFile(file);
      if (error) {
        errors.push(`${file.name}: ${error}`);
      } else {
        validFiles.push(file);
      }
    });

    if (errors.length > 0) {
      onUploadError?.(`Some files could not be added:\n${errors.join('\n')}`);
    }

    if (validFiles.length > 0) {
      const updatedFiles = [...files, ...validFiles].slice(0, maxFiles);
      setFiles(updatedFiles);
    }
  }, [files, maxFiles, onUploadError]);

  const removeFile = useCallback((index: number) => {
    const updatedFiles = files.filter((_, i) => i !== index);
    setFiles(updatedFiles);
  }, [files]);

  const handleUpload = async () => {
    if (files.length === 0) return;

    setIsUploading(true);
    setUploadStatus('uploading');

    try {
      const sessionId = await uploadFiles(files);
      
      if (sessionId) {
        setUploadedSessionId(sessionId);
        setUploadStatus('success');
        onUploadComplete?.(sessionId);
        
        // Clear files after successful upload
        setTimeout(() => {
          setFiles([]);
          setUploadStatus('idle');
        }, 2000);
      } else {
        throw new Error('Failed to upload files - no session ID returned');
      }
    } catch (error) {
      console.error('Upload error:', error);
      setUploadStatus('error');
      const errorMessage = error instanceof Error ? error.message : 'Upload failed';
      onUploadError?.(errorMessage);
      
      // Reset error status after a delay
      setTimeout(() => {
        setUploadStatus('idle');
      }, 3000);
    } finally {
      setIsUploading(false);
    }
  };

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    
    if (e.dataTransfer.files) {
      addFiles(e.dataTransfer.files);
    }
  }, [addFiles]);

  const handleFileSelect = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      addFiles(e.target.files);
    }
  }, [addFiles]);

  const openFileDialog = useCallback(() => {
    fileInputRef.current?.click();
  }, []);

  return (
    <div className={cn("space-y-3", className)}>
      {/* File Input */}
      <input
        ref={fileInputRef}
        type="file"
        multiple
        onChange={handleFileSelect}
        className="hidden"
      />

      {/* Upload Status */}
      {currentSessionId && (
        <div className="flex items-center gap-2 p-2 bg-green-50 dark:bg-green-950/20 rounded-lg">
          <CheckCircle className="h-4 w-4 text-green-600" />
          <span className="text-sm text-green-700 dark:text-green-300">
            Documents uploaded successfully! Session ID: {currentSessionId.slice(0, 8)}...
          </span>
        </div>
      )}

      {/* Drag & Drop Area */}
      <div
        className={cn(
          "border-2 border-dashed rounded-lg p-6 text-center transition-colors cursor-pointer",
          isDragOver 
            ? "border-primary bg-primary/5" 
            : "border-muted-foreground/25 hover:border-primary/50 hover:bg-muted/50",
          uploadStatus === 'success' && "border-green-500 bg-green-50 dark:bg-green-950/20",
          uploadStatus === 'error' && "border-red-500 bg-red-50 dark:bg-red-950/20"
        )}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={openFileDialog}
      >
        <Upload className="mx-auto h-8 w-8 text-muted-foreground mb-2" />
        <p className="text-sm text-muted-foreground mb-1">
          {uploadStatus === 'success' 
            ? 'Files uploaded successfully!' 
            : uploadStatus === 'error'
            ? 'Upload failed. Try again.'
            : 'Drag and drop documents here, or click to select'
          }
        </p>
        <p className="text-xs text-muted-foreground">
          Max {maxFiles} files, {maxFileSize}MB each
        </p>
      </div>

      {/* Selected Files */}
      {files.length > 0 && (
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <p className="text-sm font-medium text-muted-foreground">
              Selected Files ({files.length}/{maxFiles})
            </p>
            <Button
              onClick={handleUpload}
              disabled={isUploading || files.length === 0}
              size="sm"
              className="h-8"
            >
              {isUploading ? (
                <>
                  <Loader2 className="h-3 w-3 animate-spin mr-2" />
                  Uploading...
                </>
              ) : (
                'Upload to Backend'
              )}
            </Button>
          </div>
          {files.map((file, index) => {
            const Icon = getFileIcon(file.type);
            return (
              <div
                key={index}
                className="flex items-center gap-3 p-3 bg-muted/50 rounded-lg"
              >
                <Icon className="h-5 w-5 text-muted-foreground flex-shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">{file.name}</p>
                  <p className="text-xs text-muted-foreground">
                    {formatFileSize(file.size)} • {file.type}
                  </p>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={(e) => {
                    e.stopPropagation();
                    removeFile(index);
                  }}
                  className="h-6 w-6 p-0 hover:bg-destructive hover:text-destructive-foreground"
                >
                  <X className="h-3 w-3" />
                </Button>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
