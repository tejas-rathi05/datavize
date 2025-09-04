"use client";

import React from "react";
import { ContentLayout } from "@/components/sidebar/content-layout";
import ProjectsOverview from "@/components/knowledgebase/projects-overview";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

const KnowledgePage = () => {
  return (
    <ContentLayout 
      maxWidth="full" 
      title=""
      showContextToggle={false}
      contextType="knowledge"
      className="pt-16"
    >
      <div className="p-6">
        <div className="mb-8">
          <h1 className="text-5xl font-extrabold mb-2">Knowledge Base</h1>
          <p className="text-muted-foreground">
            Store and analyze your documents with secure cloud storage
          </p>
        </div>

        <Tabs defaultValue="projects">
          <TabsList size="xl">
            <TabsTrigger value="projects">Projects</TabsTrigger>
            <TabsTrigger value="organization database">
              Organization Database
            </TabsTrigger>
          </TabsList>
          <TabsContent value="projects">
            <Card className="w-full h-[65vh]">
              <CardContent className="w-full h-full">
                <ProjectsOverview />
              </CardContent>
            </Card>
          </TabsContent>
          <TabsContent value="organization database">
            <Card>
              <CardHeader>
                <CardTitle>organization database</CardTitle>
                <CardDescription>
                  Change your organization database here. After saving,
                  you&apos;ll be logged out.
                </CardDescription>
              </CardHeader>
              <CardContent className="grid gap-6">
                <div className="grid gap-3">
                  <Label htmlFor="tabs-demo-current">
                    Current organization database
                  </Label>
                  <Input id="tabs-demo-current" type="organization database" />
                </div>
                <div className="grid gap-3">
                  <Label htmlFor="tabs-demo-new">
                    New organization database
                  </Label>
                  <Input id="tabs-demo-new" type="organization database" />
                </div>
              </CardContent>
              
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </ContentLayout>
  );
};

export default KnowledgePage;
