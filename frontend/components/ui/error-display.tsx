import React from "react";
import { AlertCircle, RefreshCw } from "lucide-react";
import { Button } from "./button";
import { Card, CardContent } from "./card";

interface ErrorDisplayProps {
  error: string;
  onRetry?: () => void;
  className?: string;
}

export const ErrorDisplay: React.FC<ErrorDisplayProps> = ({ 
  error, 
  onRetry, 
  className = "" 
}) => {
  return (
    <Card className={`border-red-200 bg-red-50 ${className}`}>
      <CardContent className="pt-6">
        <div className="flex items-center gap-3">
          <AlertCircle className="h-5 w-5 text-red-600" />
          <div className="flex-1">
            <p className="text-sm text-red-800 font-medium">Error</p>
            <p className="text-sm text-red-700">{error}</p>
          </div>
          {onRetry && (
            <Button
              variant="outline"
              size="sm"
              onClick={onRetry}
              className="border-red-300 text-red-700 hover:bg-red-100"
            >
              <RefreshCw className="h-4 w-4 mr-2" />
              Retry
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
};
