import { useState, useEffect, useCallback } from 'react';
import { Project } from '@/lib/types';
import { useSession } from '@/hooks/use-auth-store';

export interface CreateProjectData {
  name: string;
  description?: string;
  files?: File[];
}

export const useProjects = () => {
  const session = useSession();
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const getAuthHeaders = () => {
    const token = session?.access_token;
    if (!token) {
      throw new Error('No access token available');
    }
    return {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`,
    };
  };

  const fetchProjects = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      
      if (!session?.access_token) {
        setError('Not authenticated');
        setLoading(false);
        return;
      }
      
      const response = await fetch('/api/projects', {
        headers: getAuthHeaders(),
      });
      
      if (!response.ok) {
        if (response.status === 401) {
          setError('Not authenticated');
        } else {
          const errorData = await response.json().catch(() => ({}));
          throw new Error(errorData.error || 'Failed to fetch projects');
        }
        return;
      }
      
      const fetchedProjects = await response.json();
      setProjects(fetchedProjects);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch projects');
      console.error('Error fetching projects:', err);
    } finally {
      setLoading(false);
    }
  }, [session?.access_token]);

  const createProject = useCallback(async (projectData: CreateProjectData) => {
    try {
      setError(null);
      
      const response = await fetch('/api/projects', {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify({
          name: projectData.name,
          description: projectData.description,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to create project');
      }

      const newProject = await response.json();
      setProjects(prev => [newProject, ...prev]);
      return newProject;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create project');
      throw err;
    }
  }, [session?.access_token]);

  const updateProject = useCallback(async (id: string, projectData: Partial<Pick<Project, 'name' | 'description' | 'status'>>) => {
    try {
      setError(null);
      
      const response = await fetch(`/api/projects/${id}`, {
        method: 'PUT',
        headers: getAuthHeaders(),
        body: JSON.stringify(projectData),
      });

      if (!response.ok) {
        throw new Error('Failed to update project');
      }

      const updatedProject = await response.json();
      setProjects(prev => 
        prev.map(project => 
          project.id === id ? updatedProject : project
        )
      );
      return updatedProject;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update project');
      throw err;
    }
  }, [session?.access_token]);

  const deleteProject = useCallback(async (id: string) => {
    try {
      setError(null);
      
      const response = await fetch(`/api/projects/${id}`, {
        method: 'DELETE',
        headers: getAuthHeaders(),
      });

      if (!response.ok) {
        throw new Error('Failed to delete project');
      }

      setProjects(prev => prev.filter(project => project.id !== id));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete project');
      throw err;
    }
  }, [session?.access_token]);

  const refreshProjects = useCallback(() => {
    fetchProjects();
  }, [fetchProjects]);

  useEffect(() => {
    fetchProjects();
  }, [fetchProjects]);

  return {
    projects,
    loading,
    error,
    createProject,
    updateProject,
    deleteProject,
    refreshProjects,
    fetchProjects
  };
};
