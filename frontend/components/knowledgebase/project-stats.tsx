"use client";

import React from "react";
import { Project } from "@/lib/types";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { 
  FolderOpen, 
  FileText, 
  HardDrive, 
  TrendingUp 
} from "lucide-react";
import { ArrowUp04Icon, File01Icon, Folder01Icon, HardDriveIcon } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";

interface ProjectStatsProps {
  projects: Project[];
}

const ProjectStats: React.FC<ProjectStatsProps> = ({ projects }) => {
  const totalProjects = projects.length;
  const totalFiles = projects.reduce((acc, project) => acc + project.fileCount, 0);
  const totalSize = projects.reduce((acc, project) => acc + project.totalSize, 0);
  const activeProjects = projects.filter(p => p.status === 'active').length;

  const formatBytes = (bytes: number) => {
    if (bytes === 0) return "0 Bytes";
    const k = 1024;
    const sizes = ["Bytes", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
  };

  const stats = [
    {
      title: "Total Projects",
      value: totalProjects,
      icon: Folder01Icon,
      description: "Active and archived projects",
      color: "text-blue-600"
    },
    {
      title: "Total Files",
      value: totalFiles.toLocaleString(),
      icon: File01Icon,
      description: "Documents across all projects",
      color: "text-green-600"
    },
    {
      title: "Storage Used",
      value: formatBytes(totalSize),
      icon: HardDriveIcon,
      description: "Total space occupied",
      color: "text-purple-600"
    },
    {
      title: "Active Projects",
      value: activeProjects,
      icon: ArrowUp04Icon,
      description: "Currently active projects",
      color: "text-orange-600"
    }
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
      {stats.map((stat, index) => (
        <Card key={index} className="hover:shadow-md transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between space-y-0">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              {stat.title}
            </CardTitle>
            <HugeiconsIcon icon={stat.icon} size={20} className={stat.color} />
            {/* <stat.icon className={`h-4 w-4 ${stat.color}`} /> */}
          </CardHeader>
          <CardContent>
            <div className="text-4xl font-bold">{stat.value}</div>
            <p className="text-xs text-muted-foreground mt-1">
              {stat.description}
            </p>
          </CardContent>
        </Card>
      ))}
    </div>
  );
};

export default ProjectStats;
