"use client";

import React from "react";
import { Project } from "@/lib/types";
import ProjectCard from "./project-card";
import EmptyProjectsState from "./empty-projects-state";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";

interface ProjectsGridProps {
  projects: Project[];
  onViewFiles: (projectId: string) => void;
  onEditProject?: (project: Project) => void;
  onDeleteProject?: (projectId: string) => void;
  onCreateProject?: () => void;
}

const ProjectsGrid: React.FC<ProjectsGridProps> = ({
  projects,
  onViewFiles,
  onEditProject,
  onDeleteProject,
  onCreateProject,
}) => {
  if (projects.length === 0) {
    return <EmptyProjectsState onCreateProject={onCreateProject || (() => {})} />;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold">
            Your Projects
          </h2>
        </div>
        {onCreateProject && (
          <Button size="lg" onClick={onCreateProject}>
            <Plus className="w-4 h-4 mr-2" />
            New Project
          </Button>
        )}
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-3 2xl:grid-cols-4 gap-6">
        {projects.map((project) => (
          <ProjectCard
            key={project.id}
            project={project}
            onViewFiles={onViewFiles}
            onEdit={onEditProject}
            onDelete={onDeleteProject}
          />
        ))}
      </div>
    </div>
  );
};

const formatTotalSize = (projects: Project[]): string => {
  const totalBytes = projects.reduce((acc, project) => acc + project.totalSize, 0);
  
  if (totalBytes === 0) return "0 Bytes";
  
  const k = 1024;
  const sizes = ["Bytes", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(totalBytes) / Math.log(k));
  
  return parseFloat((totalBytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
};

export default ProjectsGrid;
