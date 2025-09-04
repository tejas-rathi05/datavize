import { Navbar } from "@/components/sidebar/navbar";
import { cn } from "@/lib/utils";
import { ContextSidebarToggle } from "./context-sidebar-toggle";

interface ContentLayoutProps {
  title: string;
  children: React.ReactNode;
  maxWidth?:
    | "sm"
    | "md"
    | "lg"
    | "xl"
    | "2xl"
    | "3xl"
    | "4xl"
    | "5xl"
    | "6xl"
    | "7xl"
    | "full"
    | "none";
  showContextToggle?: boolean;
  contextType?: string;
  className?: string;
}

export function ContentLayout({
  title,
  children,
  maxWidth = "full",
  showContextToggle = false,
  contextType = "chat",
  className = "",
}: ContentLayoutProps) {
  const maxWidthClasses = {
    sm: "max-w-sm",
    md: "max-w-md",
    lg: "max-w-lg",
    xl: "max-w-xl",
    "2xl": "max-w-2xl",
    "3xl": "max-w-3xl",
    "4xl": "max-w-4xl",
    "5xl": "max-w-5xl",
    "6xl": "max-w-6xl",
    "7xl": "max-w-7xl",
    full: "max-w-full",
    none: "",
  };

  return (
    <div className="relative">
      {/* Navbar positioned absolutely above all content */}
      <div className="absolute w-full top-0 left-0 right-0 z-10">
        <Navbar 
          title={title} 
          showContextToggle={showContextToggle}
          contextType={contextType}
        />
      </div>
    
      {/* Content positioned below navbar with top padding */}
      <div
        className={cn(
          `${maxWidthClasses[maxWidth]} h-full`,
          className
        )}
      >
        {children}
      </div>
    </div>
  );
}
