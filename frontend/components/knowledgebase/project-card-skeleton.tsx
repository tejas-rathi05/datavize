import React from "react";
import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent } from "@/components/ui/card";

const ProjectCardSkeleton: React.FC = () => {
  return (
    <Card className="p-0 h-full w-full">
      <CardContent className="p-5 bg-muted rounded-xl h-full w-full">
        <div className="flex items-center justify-between">
          <div className="flex items-center justify-between gap-5">
            <div className="bg-background p-5 rounded-xl">
              <Skeleton className="h-10 w-10 rounded" />
            </div>
            <div className="flex flex-col items-center gap-5">
              <div>
                <Skeleton className="h-6 w-32 mb-2" />
                <Skeleton className="h-4 w-48 mb-2" />
                <Skeleton className="h-4 w-20" />
              </div>
            </div>
          </div>
          
          <Skeleton className="h-8 w-8 rounded" />
        </div>
      </CardContent>
    </Card>
  );
};

export default ProjectCardSkeleton;
