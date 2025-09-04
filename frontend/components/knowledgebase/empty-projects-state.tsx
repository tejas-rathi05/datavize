"use client";

import React from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { FolderOpen, Upload, Database } from "lucide-react";

interface EmptyProjectsStateProps {
  onCreateProject: () => void;
}

const EmptyProjectsState: React.FC<EmptyProjectsStateProps> = ({ onCreateProject }) => {
  return (
    <Card className="border-dashed border-2 border-muted-foreground/25">
      <CardContent className="pt-12 pb-12">
        <div className="text-center">
          <div className="mx-auto w-20 h-20 bg-muted rounded-full flex items-center justify-center mb-6">
            <FolderOpen className="w-10 h-10 text-muted-foreground" />
          </div>
          
          <h3 className="text-xl font-semibold text-gray-900 mb-3">
            No projects yet
          </h3>
          
          <p className="text-gray-500 mb-8 max-w-md mx-auto">
            Get started by creating your first project to organize and manage your documents. 
            You can upload various file types and organize them into logical collections.
          </p>
          
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Button onClick={onCreateProject} size="lg">
              <Upload className="w-5 h-5 mr-2" />
              Create Your First Project
            </Button>
            
            <Button variant="outline" size="lg">
              <Database className="w-5 h-5 mr-2" />
              Learn More
            </Button>
          </div>
          
          <div className="mt-8 text-sm text-muted-foreground">
            <p className="mb-2">Supported file types:</p>
            <div className="flex flex-wrap justify-center gap-2">
              {['PDF', 'Word', 'Excel', 'PowerPoint', 'Text', 'CSV', 'Images', 'ZIP'].map((type) => (
                <span 
                  key={type}
                  className="px-2 py-1 bg-muted rounded text-xs"
                >
                  {type}
                </span>
              ))}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default EmptyProjectsState;
