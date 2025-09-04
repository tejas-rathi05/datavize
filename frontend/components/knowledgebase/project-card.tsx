"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  FolderOpen,
  FileText,
  Calendar,
  HardDrive,
  MoreVertical,
  Eye,
  Loader,
  Trash2,
  Edit,
  CircleCheck,
  CircleAlert,
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Project } from "@/lib/types";
import { cn } from "@/lib/utils";

interface ProjectCardProps {
  project: Project;
  onViewFiles: (projectId: string) => void;
  onEdit?: (project: Project) => void;
  onDelete?: (projectId: string) => void;
}

const ProjectCard: React.FC<ProjectCardProps> = ({
  project,
  onViewFiles,
  onEdit,
  onDelete,
}) => {
  const router = useRouter();
  
  const handleViewProject = () => {
    router.push(`/agents/knowledge/${project.id}`);
  };
  
  const formatBytes = (bytes: number) => {
    if (bytes === 0) return "0 Bytes";
    const k = 1024;
    const sizes = ["Bytes", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
  };

  const formatDate = (date: Date) => {
    return new Intl.DateTimeFormat("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    }).format(date);
  };

  const getStatusColor = (status: Project["status"]) => {
    switch (status) {
      case "active":
        return "bg-green-100 text-green-800 border-green-200";
      case "processing":
        return "bg-yellow-100 text-yellow-800 border-yellow-200";
      case "error":
        return "bg-red-100 text-red-800 border-red-200";
      default:
        return "bg-gray-100 text-gray-800 border-gray-200";
    }
  };

  const getStatusIcon = (status: Project["status"]) => {
    switch (status) {
      case "active":
        return <CircleCheck className="h-4 w-4 text-green-600" />;
      case "processing":
        return <Loader className="h-4 w-4 text-yellow-600" />;
      case "error":
        return <CircleAlert className="h-4 w-4 text-red-600" />;
      default:
        return "";
    }
  };

  return (
    <Card 
    className="hover:shadow-md transition-shadow duration-200 p-0 h-full w-full"
    onClick={handleViewProject}
    >
      <CardContent className="p-5 cursor-pointer bg-muted rounded-xl h-full w-full">
        <div className="flex items-center justify-between">
          <div className="flex items-center justify-between gap-5">
            <div className="bg-background p-5 rounded-xl">
              <FolderOpen className="h-10 w-10 text-primary" />
            </div>
            <div className="flex flex-col items-center gap-5">
              <div>
                <CardTitle className="flex gap-2 items-center text-xl font-semibold">
                  {project.name}
                  {getStatusIcon(project.status)}
                </CardTitle>
                {project.description && (
                  <p className="text-sm text-muted-foreground mt-1">
                    {project.description}
                  </p>
                )}
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <span>{project.fileCount} Items</span>
                </div>
              </div>
            </div>
          </div>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button 
                variant="ghost" 
                size="sm" 
                className="h-8 w-8 p-0"
                onClick={(e) => e.stopPropagation()}
              >
                <MoreVertical className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem
                onClick={(e) => {
                  e.stopPropagation();
                  handleViewProject();
                }}
              >
                <Eye className="mr-2 h-4 w-4" />
                View Project
              </DropdownMenuItem>
              {onEdit && (
                <DropdownMenuItem
                  onClick={(e) => {
                    e.stopPropagation();
                    onEdit(project);
                  }}
                >
                  <Edit className="mr-2 h-4 w-4" />
                  Edit Project
                </DropdownMenuItem>
              )}
              {onDelete && (
                <DropdownMenuItem
                  onClick={(e) => {
                    e.stopPropagation();
                    onDelete(project.id);
                  }}
                  className="text-red-600"
                >
                  <Trash2 className="mr-2 h-4 w-4" />
                  Delete Project
                </DropdownMenuItem>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        {/* 
        <Button
          onClick={() => onViewFiles(project.id)}
          className="w-full"
          size="sm"
        >
          <Eye className="mr-2 h-4 w-4" />
          View Files
        </Button> */}
      </CardContent>
    </Card>
  );
};

export default ProjectCard;
