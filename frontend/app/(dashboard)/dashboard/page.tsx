"use client";
import Link from "next/link";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { useSidebar } from "@/hooks/use-sidebar";
import { useContextSidebar } from "@/hooks/use-context-sidebar";
import { useStore } from "@/hooks/use-store";
import {
  ChevronRight,
  Folder,
  File,
  Upload,
  User,
  Plus,
  Download,
  Search,
  List,
  Users,
  Database,
} from "lucide-react";
import { ContentLayout } from "@/components/sidebar/content-layout";
import { useEffect, useState } from "react";
import { Project } from "@/lib/types";
import { formatBytes } from "@/lib/utils";
import { useAuthContext } from "@/components/providers/auth-provider";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

// Mock data structure for master projects with sub-projects
interface MasterProject {
  id: string;
  name: string;
  description?: string;
  subProjects: SubProject[];
  createdAt: string;
  updatedAt: string;
}

interface SubProject {
  id: string;
  name: string;
  type: string;
  description?: string;
  fileCount: number;
  totalSize: number;
}

export default function DashboardPage() {
  const sidebar = useStore(useSidebar, (x) => x);
  const contextSidebar = useStore(useContextSidebar, (x) => x);
  const { user, session } = useAuthContext();
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [filterType, setFilterType] = useState("all");
  const [sortBy, setSortBy] = useState("recently-updated");
  const [viewMode, setViewMode] = useState<"list" | "grid">("grid");

  // Mock master projects data
  const [masterProjects] = useState<MasterProject[]>([
    {
      id: "1",
      name: "Fintech AI",
      description: "AI-powered project management system",
      createdAt: "2024-01-15",
      updatedAt: "2024-01-20",
      subProjects: [
        {
          id: "1-1",
          name: "FinVize",
          type: "Database",
          description: "Core AI engine",
          fileCount: 45,
          totalSize: 1024 * 1024 * 50, // 50MB
        },
      ],
    },
    {
      id: "2",
      name: "InsureVize",
      description: "Intelligent Insurance Agent",
      createdAt: "2024-01-10",
      updatedAt: "2024-01-18",
      subProjects: [
        {
          id: "2-1",
          name: "VizeLearn",
          type: "Module",
          description: "Advanced learning module",
          fileCount: 32,
          totalSize: 1024 * 1024 * 25, // 25MB
        },
      ],
    },
    {
      id: "3",
      name: "HealthVize",
      description: "Healthcare AI Assistant",
      createdAt: "2024-01-10",
      updatedAt: "2024-01-18",
      subProjects: [
        {
          id: "3-1",
          name: "VizePipe",
          type: "Module",
          description: "Advanced learning module",
          fileCount: 32,
          totalSize: 1024 * 1024 * 25, // 25MB
        },
      ],
    },
  ]);

  useEffect(() => {
    const loadProjects = async () => {
      if (user && session?.access_token) {
        try {
          const response = await fetch("/api/projects/user", {
            headers: {
              Authorization: `Bearer ${session.access_token}`,
            },
          });

          if (response.ok) {
            const userProjects = await response.json();
            setProjects(userProjects);
          } else {
            console.error("Failed to fetch projects");
          }
        } catch (error) {
          console.error("Error loading projects:", error);
        } finally {
          setLoading(false);
        }
      } else if (!user) {
        setLoading(false);
      }
    };

    loadProjects();
  }, [user, session]);

  if (!sidebar) return null;
  if (!contextSidebar) return null;

  const { settings, setSettings } = sidebar;
  const { openContext } = contextSidebar;

  const totalFiles = projects.reduce(
    (sum, project) => sum + project.fileCount,
    0
  );
  const totalSize = projects.reduce(
    (sum, project) => sum + Number(project.totalSize),
    0
  );

  return (
    <ContentLayout
      title=""
      showContextToggle={false}
      contextType=""
      className="h-full min-h-screen pt-24 px-10"
    >
      <div className="grid gap-6 mt-6 w-full max-w-7xl mx-auto">
        {/* Your Projects Section */}
        <div className="space-y-6">
          {/* Header and Controls */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <h2 className="text-4xl font-bold">Your Projects</h2>

            <div className="flex flex-col sm:flex-row gap-3">
              {/* Filter and Sort Controls */}
              <div className="flex gap-2">
                <Select value={filterType} onValueChange={setFilterType}>
                  <SelectTrigger className="w-[120px]">
                    <SelectValue placeholder="Filter" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Filter: All</SelectItem>
                    <SelectItem value="ai">AI Projects</SelectItem>
                    <SelectItem value="web">Web Projects</SelectItem>
                    <SelectItem value="mobile">Mobile Projects</SelectItem>
                  </SelectContent>
                </Select>

                <Select value={sortBy} onValueChange={setSortBy}>
                  <SelectTrigger className="w-[180px]">
                    <SelectValue placeholder="Sort" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="recently-updated">
                      Sort: Recently Updated
                    </SelectItem>
                    <SelectItem value="name">Sort: Name</SelectItem>
                    <SelectItem value="created">Sort: Created</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* View Mode Toggle */}
              <div className="flex gap-1">
                <Button
                  variant={viewMode === "list" ? "default" : "outline"}
                  size="sm"
                  onClick={() => setViewMode("list")}
                  className="h-8 w-8 p-0"
                >
                  <List className="h-4 w-4" />
                </Button>
                <Button
                  variant={viewMode === "grid" ? "default" : "outline"}
                  size="sm"
                  onClick={() => setViewMode("grid")}
                  className="h-8 w-8 p-0"
                >
                  <Users className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </div>

          {/* Search Bar */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search Projects"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <Card className="cursor-pointer transition-colors border-2 border-dashed border-primary hover:bg-primary/20">
              <CardContent className="p-6 flex flex-col items-center justify-center text-center min-h-[200px]">
                <Plus className="w-12 h-12 text-primary mb-4" />
                <h3 className="font-medium text-lg text-primary">
                  Create New Project
                </h3>
              </CardContent>
            </Card>

            {/* Import Project Card */}
            <Card className="cursor-pointer transition-colors border-2 border-dashed border-primary hover:bg-primary/20">
              <CardContent className="p-6 flex flex-col items-center justify-center text-center min-h-[200px] relative">
                <Download className="w-12 h-12 text-primary mb-4" />
                <h3 className="font-medium text-lg text-primary">
                  Import Project
                </h3>
                <span className="absolute top-0 right-4 bg-primary text-white text-xs px-2 py-1 rounded">
                  Beta
                </span>
              </CardContent>
            </Card>
          </div>

          {/* Projects Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {/* Create New Project Card */}

            {/* Master Project Cards */}
            {masterProjects.map((masterProject) => (
              <Card
                key={masterProject.id}
                className="hover:shadow-md transition-shadow"
              >
                <CardHeader className="pb-3">
                  <CardTitle className="text-lg">
                    {masterProject.name}
                  </CardTitle>
                  {masterProject.description && (
                    <CardDescription className="text-sm">
                      {masterProject.description}
                    </CardDescription>
                  )}
                </CardHeader>
                <CardContent className="space-y-3">
                  {masterProject.subProjects.map((subProject) => (
                    <p key={subProject.id} className="text-sm truncate">{subProject.name}</p>
                  ))}
                </CardContent>
              </Card>
            ))}
          </div>
        </div>

        {/* Quick Actions */}
        {/* <Card>
          <CardHeader>
            <CardTitle>Quick Actions</CardTitle>
            <CardDescription>Get started with common tasks</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Link href="/agents/knowledge">
                <Card className="cursor-pointer hover:bg-muted/50 transition-colors">
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <h3 className="font-medium">Upload Files</h3>
                        <p className="text-sm text-muted-foreground">
                          Add documents to your knowledge base
                        </p>
                      </div>
                      <ChevronRight className="w-4 h-4 text-muted-foreground" />
                    </div>
                  </CardContent>
                </Card>
              </Link>

              <Link href="/agents/new">
                <Card className="cursor-pointer hover:bg-muted/50 transition-colors">
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <h3 className="font-medium">Create Agent</h3>
                        <p className="text-sm text-muted-foreground">
                          Build a new AI agent
                        </p>
                      </div>
                      <ChevronRight className="w-4 h-4 text-muted-foreground" />
                    </div>
                  </CardContent>
                </Card>
              </Link>
            </div>
          </CardContent>
        </Card> */}

        {/* Sidebar Settings */}
        {/* <Card>
          <CardHeader>
            <CardTitle>Sidebar Settings</CardTitle>
            <CardDescription>
              Configure the main sidebar behavior
            </CardDescription>
          </CardHeader>
          <CardContent>
            <TooltipProvider>
              <div className="flex gap-6">
                <Tooltip>
                  <TooltipTrigger asChild>
                    <div className="flex items-center space-x-2">
                      <Switch
                        id="is-hover-open"
                        onCheckedChange={(x) => setSettings({ isHoverOpen: x })}
                        checked={settings.isHoverOpen}
                      />
                      <Label htmlFor="is-hover-open">Hover Open</Label>
                    </div>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>
                      When hovering on the sidebar in mini state, it will open
                    </p>
                  </TooltipContent>
                </Tooltip>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <div className="flex items-center space-x-2">
                      <Switch
                        id="disable-sidebar"
                        onCheckedChange={(x) => setSettings({ disabled: x })}
                        checked={settings.disabled}
                      />
                      <Label htmlFor="disable-sidebar">Disable Sidebar</Label>
                    </div>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>Hide sidebar</p>
                  </TooltipContent>
                </Tooltip>
              </div>
            </TooltipProvider>
          </CardContent>
        </Card> */}
      </div>
    </ContentLayout>
  );
}
