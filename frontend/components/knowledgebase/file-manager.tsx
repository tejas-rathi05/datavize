"use client";

import React, { useState, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Search,
  Filter,
  MoreVertical,
  Download,
  Eye,
  Trash2,
  FileText,
  FileImage,
  FileSpreadsheet,
  Presentation,
  FileArchive,
  Mail,
  File,
  FolderPlus,
  Upload
} from "lucide-react";
import { Project, ProjectFile, FileType } from "@/lib/types";
import { cn } from "@/lib/utils";

interface FileManagerProps {
  project: Project;
  onBack: () => void;
  onUploadFiles?: (files: File[]) => void;
  onDeleteFile?: (fileId: string) => void;
  onViewFile?: (file: ProjectFile) => void;
}

const FileManager: React.FC<FileManagerProps> = ({
  project,
  onBack,
  onUploadFiles,
  onDeleteFile,
  onViewFile,
}) => {
  const [searchQuery, setSearchQuery] = useState("");
  const [fileTypeFilter, setFileTypeFilter] = useState<string>("all");
  const [sortBy, setSortBy] = useState<"name" | "date" | "size" | "type">("date");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc");

  const getFileIcon = (fileType: string) => {
    const type = fileType.toLowerCase();
    if (type.includes('pdf')) return <FileText className="h-4 w-4 text-red-500" />;
    if (type.includes('word') || type.includes('doc')) return <FileText className="h-4 w-4 text-blue-500" />;
    if (type.includes('excel') || type.includes('xls')) return <FileSpreadsheet className="h-4 w-4 text-green-500" />;
    if (type.includes('powerpoint') || type.includes('ppt')) return <Presentation className="h-4 w-4 text-orange-500" />;
    if (type.includes('image') || type.includes('jpg') || type.includes('png') || type.includes('jpeg')) return <FileImage className="h-4 w-4 text-purple-500" />;
    if (type.includes('zip') || type.includes('rar')) return <FileArchive className="h-4 w-4 text-gray-500" />;
    if (type.includes('email') || type.includes('eml')) return <Mail className="h-4 w-4 text-blue-400" />;
    return <File className="h-4 w-4 text-gray-400" />;
  };

  const getFileTypeColor = (fileType: string) => {
    const type = fileType.toLowerCase();
    if (type.includes('pdf')) return 'bg-red-100 text-red-800 border-red-200';
    if (type.includes('word') || type.includes('doc')) return 'bg-blue-100 text-blue-800 border-blue-200';
    if (type.includes('excel') || type.includes('xls')) return 'bg-green-100 text-green-800 border-green-200';
    if (type.includes('powerpoint') || type.includes('ppt')) return 'bg-orange-100 text-orange-800 border-orange-200';
    if (type.includes('image')) return 'bg-purple-100 text-purple-800 border-purple-200';
    if (type.includes('zip') || type.includes('rar')) return 'bg-gray-100 text-gray-800 border-gray-200';
    if (type.includes('email')) return 'bg-blue-100 text-blue-800 border-blue-200';
    return 'bg-gray-100 text-gray-800 border-gray-200';
  };

  const formatBytes = (bytes: number) => {
    if (bytes === 0) return "0 Bytes";
    const k = 1024;
    const sizes = ["Bytes", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
  };

  const formatDate = (date: Date) => {
    return new Intl.DateTimeFormat('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    }).format(date);
  };

  const filteredAndSortedFiles = useMemo(() => {
    const filtered = project.files.filter(file => {
      const matchesSearch = file.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                           file.documentType.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesType = fileTypeFilter === "all" || file.documentType === fileTypeFilter;
      return matchesSearch && matchesType;
    });

    filtered.sort((a, b) => {
      let aValue: string | number | Date, bValue: string | number | Date;
      
      switch (sortBy) {
        case "name":
          aValue = a.name.toLowerCase();
          bValue = b.name.toLowerCase();
          break;
        case "date":
          aValue = a.updatedAt;
          bValue = b.updatedAt;
          break;
        case "size":
          aValue = a.size;
          bValue = b.size;
          break;
        case "type":
          aValue = a.documentType.toLowerCase();
          bValue = b.documentType.toLowerCase();
          break;
        default:
          aValue = a.updatedAt;
          bValue = b.updatedAt;
      }

      if (sortOrder === "asc") {
        return aValue > bValue ? 1 : -1;
      } else {
        return aValue < bValue ? 1 : -1;
      }
    });

    return filtered;
  }, [project.files, searchQuery, fileTypeFilter, sortBy, sortOrder]);

  const handleSort = (column: "name" | "date" | "size" | "type") => {
    if (sortBy === column) {
      setSortOrder(sortOrder === "asc" ? "desc" : "asc");
    } else {
      setSortBy(column);
      setSortOrder("asc");
    }
  };

  const getSortIcon = (column: "name" | "date" | "size" | "type") => {
    if (sortBy !== column) return null;
    return sortOrder === "asc" ? "↑" : "↓";
  };

  const uniqueFileTypes = useMemo(() => {
    const types = [...new Set(project.files.map(file => file.documentType))];
    return types.sort();
  }, [project.files]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" onClick={onBack} className="p-2">
            ← Back
          </Button>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Project files</h1>
            <p className="text-gray-600">{project.name}</p>
          </div>
        </div>
        
        <div className="flex gap-2">
          {onUploadFiles && (
            <Button variant="outline" size="sm">
              <FolderPlus className="mr-2 h-4 w-4" />
              Create folder
            </Button>
          )}
          {onUploadFiles && (
            <Button variant="outline" size="sm">
              <Upload className="mr-2 h-4 w-4" />
              Upload files
            </Button>
          )}
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <FileText className="h-5 w-5 text-blue-500" />
              <div>
                <p className="text-sm text-gray-600">Total Files</p>
                <p className="text-2xl font-bold">{project.fileCount}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <FileText className="h-5 w-5 text-green-500" />
              <div>
                <p className="text-sm text-gray-600">Storage Used</p>
                <p className="text-2xl font-bold">{formatBytes(project.totalSize)}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <FileText className="h-5 w-5 text-purple-500" />
              <div>
                <p className="text-sm text-gray-600">File Types</p>
                <p className="text-2xl font-bold">{uniqueFileTypes.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <FileText className="h-5 w-5 text-orange-500" />
              <div>
                <p className="text-sm text-gray-600">Last Updated</p>
                <p className="text-2xl font-bold">{formatDate(project.updatedAt)}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Search and Filters */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Search files..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
            
            <Select value={fileTypeFilter} onValueChange={setFileTypeFilter}>
              <SelectTrigger className="w-full sm:w-48">
                <SelectValue placeholder="Filter by type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All types</SelectItem>
                {uniqueFileTypes.map(type => (
                  <SelectItem key={type} value={type}>{type}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Files Table */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span>Files ({filteredAndSortedFiles.length})</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead 
                    className="cursor-pointer hover:bg-gray-50"
                    onClick={() => handleSort("name")}
                  >
                    <div className="flex items-center gap-2">
                      Name {getSortIcon("name")}
                    </div>
                  </TableHead>
                  <TableHead 
                    className="cursor-pointer hover:bg-gray-50"
                    onClick={() => handleSort("type")}
                  >
                    <div className="flex items-center gap-2">
                      Document type {getSortIcon("type")}
                    </div>
                  </TableHead>
                  <TableHead 
                    className="cursor-pointer hover:bg-gray-50"
                    onClick={() => handleSort("date")}
                  >
                    <div className="flex items-center gap-2">
                      Updated {getSortIcon("date")}
                    </div>
                  </TableHead>
                  <TableHead 
                    className="cursor-pointer hover:bg-gray-50"
                    onClick={() => handleSort("size")}
                  >
                    <div className="flex items-center gap-2">
                      File type {getSortIcon("size")}
                    </div>
                  </TableHead>
                  <TableHead>Size</TableHead>
                  <TableHead className="w-20">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredAndSortedFiles.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-8 text-gray-500">
                      No files found
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredAndSortedFiles.map((file) => (
                    <TableRow key={file.id} className="hover:bg-gray-50">
                      <TableCell>
                        <div className="flex items-center gap-3">
                          {getFileIcon(file.documentType)}
                          <div>
                            <p className="font-medium text-gray-900">{file.name}</p>
                            {file.pageCount && (
                              <p className="text-sm text-gray-500">
                                {file.pageCount} pages
                              </p>
                            )}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge 
                          variant="outline" 
                          className={cn("text-xs", getFileTypeColor(file.documentType))}
                        >
                          {file.documentType}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-gray-600">
                        {formatDate(file.updatedAt)}
                      </TableCell>
                      <TableCell className="text-gray-600">
                        {file.type.toUpperCase()}
                      </TableCell>
                      <TableCell className="text-gray-600">
                        {formatBytes(file.size)}
                      </TableCell>
                      <TableCell>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                              <MoreVertical className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            {onViewFile && (
                              <DropdownMenuItem onClick={() => onViewFile(file)}>
                                <Eye className="mr-2 h-4 w-4" />
                                View
                              </DropdownMenuItem>
                            )}
                            <DropdownMenuItem>
                              <Download className="mr-2 h-4 w-4" />
                              Download
                            </DropdownMenuItem>
                            {onDeleteFile && (
                              <DropdownMenuItem 
                                onClick={() => onDeleteFile(file.id)}
                                className="text-red-600"
                              >
                                <Trash2 className="mr-2 h-4 w-4" />
                                Delete
                              </DropdownMenuItem>
                            )}
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default FileManager;
