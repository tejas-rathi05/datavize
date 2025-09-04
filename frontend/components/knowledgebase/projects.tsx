"use client";

import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import CreateProjectDialog from "./dialogs/create-project";
import CreateKnowledgeBaseDialog from "./dialogs/create-knowledge-base";
import ProjectsList from "./projects-list";
import FileManager from "./file-manager";
import { Project, ProjectFile } from "@/lib/types";
import { useAuthContext } from "@/components/providers/auth-provider";
import { useProjects } from "@/hooks/use-projects";

const Projects: React.FC = () => {
  const { user } = useAuthContext();
  const { projects, loading, error, createProject: createProjectAPI, refreshProjects } = useProjects();
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);
  const [viewMode, setViewMode] = useState<"projects" | "files">("projects");

  const handleViewFiles = (projectId: string) => {
    const project = projects.find(p => p.id === projectId);
    if (project) {
      setSelectedProject(project);
      setViewMode("files");
    }
  };

  const handleBackToProjects = () => {
    setSelectedProject(null);
    setViewMode("projects");
  };

  const handleEditProject = (project: Project) => {
    // TODO: Implement edit project functionality
    console.log("Edit project:", project);
  };

  const handleDeleteProject = async (projectId: string) => {
    try {
      // TODO: Implement delete project functionality with API
      console.log("Delete project:", projectId);
      // For now, just refresh the projects list
      if (refreshProjects) {
        await refreshProjects();
      }
    } catch (error) {
      console.error("Failed to delete project:", error);
    }
  };

  const handleUploadFiles = (files: File[]) => {
    // TODO: Implement file upload functionality
    console.log("Upload files:", files);
  };

  const handleDeleteFile = (fileId: string) => {
    if (selectedProject && selectedProject.files) {
      // TODO: Implement file deletion functionality
      const updatedProject = {
        ...selectedProject,
        files: selectedProject.files.filter(f => f.id !== fileId),
        fileCount: selectedProject.fileCount - 1,
        totalSize: BigInt(selectedProject.files
          .filter(f => f.id !== fileId)
          .reduce((acc, f) => acc + Number(f.size), 0))
      };
      
      setSelectedProject(updatedProject);
      // Note: setProjects is not available in this component
      console.log("Delete file:", fileId);
    }
  };

  const handleViewFile = (file: ProjectFile) => {
    // TODO: Implement file viewing functionality
    console.log("View file:", file);
  };

  const handleCreateProject = async (projectData: any) => {
    if (!user) {
      console.error("User not authenticated");
      return;
    }
    
    try {
      const newProject = await createProjectAPI({
        name: projectData.projectName,
        description: projectData.description || "",
        files: projectData.files || []
      });
      
      console.log("Project created:", newProject);
      
      // Refresh the projects list
      if (refreshProjects) {
        await refreshProjects();
      }
    } catch (error) {
      console.error("Failed to create project:", error);
    }
  };

  if (viewMode === "files" && selectedProject) {
    return (
      <FileManager
        project={selectedProject}
        onBack={handleBackToProjects}
        onUploadFiles={handleUploadFiles}
        onDeleteFile={handleDeleteFile}
        onViewFile={handleViewFile}
      />
    );
  }

  // Show loading state
  if (loading) {
    return (
      <div className="space-y-8">
        {/* Action Buttons skeleton */}
        <div className="flex gap-8">
          <div className="h-12 w-32 bg-muted rounded-lg animate-pulse" />
          <div className="h-12 w-40 bg-muted rounded-lg animate-pulse" />
        </div>

        {/* Projects List skeleton */}
        <div className="space-y-4">
          <div className="h-8 w-48 bg-muted rounded animate-pulse" />
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <div key={i} className="h-48 bg-muted rounded-lg animate-pulse" />
            ))}
          </div>
        </div>
      </div>
    );
  }

  // Show error state
  if (error) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <p className="text-red-600 mb-4">Error loading projects: {error}</p>
          <Button onClick={() => refreshProjects?.()}>Retry</Button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Action Buttons */}
      <div className="flex gap-8">
        <CreateProjectDialog 
          createProject={async (data) => {
            if (!user) {
              throw new Error("User not authenticated");
            }
            
            const newProject = await createProjectAPI({
              name: data.projectName,
              description: data.description || "",
              files: []
            });
            
            return { id: newProject.id, name: newProject.name };
          }}
          onProjectCreated={handleCreateProject}
        />
        <CreateKnowledgeBaseDialog />
      </div>

      {/* Projects List */}
      <ProjectsList
        projects={projects || []}
        onViewFiles={handleViewFiles}
        onEditProject={handleEditProject}
        onDeleteProject={handleDeleteProject}
      />
    </div>
  );
};

export default Projects;
