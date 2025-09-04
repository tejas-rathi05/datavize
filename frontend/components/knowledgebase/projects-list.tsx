"use client";

import React from "react";
import { Project } from "@/lib/types";
import ProjectCard from "./project-card";

interface ProjectsListProps {
  projects: Project[];
  onViewFiles: (projectId: string) => void;
  onEditProject?: (project: Project) => void;
  onDeleteProject?: (projectId: string) => void;
}

const ProjectsList: React.FC<ProjectsListProps> = ({
  projects,
  onViewFiles,
  onEditProject,
  onDeleteProject,
}) => {
  if (projects.length === 0) {
    return (
      <div className="text-center py-12">
        <div className="mx-auto w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center mb-4">
          <svg
            className="w-12 h-12 text-gray-400"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
            />
          </svg>
        </div>
        <h3 className="text-lg font-medium text-gray-900 mb-2">No projects yet</h3>
        <p className="text-gray-500 mb-6">
          Get started by creating your first project and uploading some files.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-gray-900">Your Projects</h2>
        <div className="text-sm text-gray-500">
          {projects.length} project{projects.length !== 1 ? 's' : ''}
        </div>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
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

export default ProjectsList;
