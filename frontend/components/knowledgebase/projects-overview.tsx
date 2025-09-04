"use client";

import React, { useState } from "react";
import { useProjects } from "@/hooks/use-projects";
import { Project } from "@/lib/types";
import ProjectsGrid from "./projects-grid";
import ProjectStats from "./project-stats";
import { Skeleton } from "@/components/ui/skeleton";
import { ErrorDisplay } from "@/components/ui/error-display";
import CreateProjectDialog from "./dialogs/create-project";
import { Button } from "@/components/ui/button";
import { RefreshCw, Plus } from "lucide-react";
import ProjectCardSkeleton from "./project-card-skeleton";

const ProjectsOverview: React.FC = () => {
  const {
    projects,
    loading,
    error,
    createProject,
    deleteProject,
    refreshProjects
  } = useProjects();
  
  const [showCreateDialog, setShowCreateDialog] = useState(false);



  const handleViewFiles = (projectId: string) => {
    // Navigate to project files view
    console.log("View files for project:", projectId);
    // TODO: Implement navigation to project files view
  };

  const handleEditProject = (project: Project) => {
    // TODO: Implement edit project functionality
    console.log("Edit project:", project);
  };

  const handleDeleteProject = async (projectId: string) => {
    try {
      await deleteProject(projectId);
    } catch (error) {
      console.error("Failed to delete project:", error);
      // Error is already handled by the hook
    }
  };

  if (loading) {
    return (
      <div className="space-y-6">
        {/* Header skeleton */}
        <div className="flex items-center justify-between">
          <div>
            <Skeleton className="h-9 w-48 mb-2" />
            <Skeleton className="h-5 w-80" />
          </div>
          <div className="flex items-center gap-3">
            <Skeleton className="h-12 w-32" />
            <Skeleton className="h-12 w-32" />
          </div>
        </div>

        {/* Project stats skeleton */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {[1, 2, 3].map((i) => (
            <div key={i} className="space-y-3">
              <Skeleton className="h-4 w-24" />
              <Skeleton className="h-8 w-16" />
            </div>
          ))}
        </div>

        {/* Projects grid skeleton */}
        <div className="space-y-6">
          <Skeleton className="h-9 w-40" />
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-3 2xl:grid-cols-4 gap-6">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <ProjectCardSkeleton key={i} />
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="py-6">
        <ErrorDisplay 
          error={error} 
          onRetry={refreshProjects}
        />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header with refresh button */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Projects</h1>
          <p className="text-muted-foreground mt-1">
            Manage and organize your document projects
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Button
            variant="default"
            size="lg"
            onClick={() => setShowCreateDialog(true)}
          >
            <Plus className="w-4 h-4 mr-2" />
            New Project
          </Button>
          <Button
            variant="outline"
            size="lg"
            onClick={refreshProjects}
            disabled={loading}
          >
            <RefreshCw className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
        </div>
      </div>

      {/* Project Statistics */}
      <ProjectStats projects={projects} />

      {/* Projects Grid */}
      <ProjectsGrid
        projects={projects}
        onViewFiles={handleViewFiles}
        onEditProject={handleEditProject}
        onDeleteProject={handleDeleteProject}
        onCreateProject={() => setShowCreateDialog(true)}
      />

      {/* Create Project Dialog */}
      <CreateProjectDialog
        open={showCreateDialog}
        onOpenChange={setShowCreateDialog}
        createProject={async (data) => {
          const result = await createProject({
            name: data.projectName,
            description: data.description || "",
            files: []
          });
          
          // Refresh projects list after creation
          await refreshProjects();
          
          return { id: result.id, name: result.name };
        }}
      />
    </div>
  );
};

export default ProjectsOverview;
