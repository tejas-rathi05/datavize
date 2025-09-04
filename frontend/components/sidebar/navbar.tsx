import { UserNav } from "@/components/sidebar/user-nav";
import { SheetMenu } from "@/components/sidebar/sheet-menu";
import { ModeToggle } from "@/components/mode-toggle";
import { ContextSidebarToggle } from "@/components/sidebar/context-sidebar-toggle";

interface NavbarProps {
  title: string;
  showContextToggle?: boolean;
  contextType?: string;
}

export function Navbar({ title, showContextToggle = false, contextType = "chat" }: NavbarProps) {
  return (
    <header className="w-full bg-background h-16 border-b">
      <div className="flex px-3 md:px-4 items-center">
        <div className="flex items-center space-x-4 lg:space-x-0">
          <SheetMenu />
          <h1 className="font-bold">{title}</h1>
          {showContextToggle && (
            <ContextSidebarToggle 
              contextType={contextType} 
              isOpen={false}
              className="ml-2"
            />
          )}
        </div>
        <div className="flex flex-1 items-center justify-end">
          <ModeToggle />
          <UserNav />
        </div>
      </div>
    </header>
  );
}
