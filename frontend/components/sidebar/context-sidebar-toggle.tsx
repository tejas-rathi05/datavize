"use client";
import { useContextSidebar } from "@/hooks/use-context-sidebar";
import { useStore } from "@/hooks/use-store";
import { Button } from "@/components/ui/button";
import { ChevronRight, PanelRight } from "lucide-react";
import { cn } from "@/lib/utils";

interface ContextSidebarToggleProps {
  contextType: string;
  isOpen: boolean | undefined;
  className?: string;
}

export function ContextSidebarToggle({ 
  contextType, 
  isOpen = true, 
  className 
}: ContextSidebarToggleProps) {
  const contextSidebar = useStore(useContextSidebar, (x) => x);
  if (!contextSidebar) return null;
  
  const { openContext, isOpen: isContextOpen, contextType: currentContextType } = contextSidebar;
  
  const isActive = isContextOpen && currentContextType === contextType;

  const handleClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    openContext(contextType);
  };

  return (
    <Button
      variant="ghost"
      size="lg"
      onClick={handleClick}
      className={cn(
        "h-6 w-6 p-2 hover:bg-muted mx-3 my-5",
        isActive && "bg-muted",
        className
      )}
    >
      <PanelRight className="h-4 w-4" />
    </Button>
  );
}
