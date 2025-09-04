"use client";

import { Footer } from "@/components/sidebar/footer";
import { Sidebar } from "@/components/sidebar/sidebar";
import { ContextSidebar } from "@/components/sidebar/context-sidebar";
import { useSidebar } from "@/hooks/use-sidebar";
import { useContextSidebar } from "@/hooks/use-context-sidebar";
import { useEffect } from "react";

export default function SidebarLayout({
  children
}: {
  children: React.ReactNode;
}) {
  const sidebar = useSidebar();
  const contextSidebar = useContextSidebar();
  
  // Update CSS variables for sidebar positioning
  useEffect(() => {
    const sidebarWidth = sidebar.getOpenState() ? "288px" : "90px";
    const contextSidebarWidth = contextSidebar.isOpen ? "400px" : "0px";
    
    document.documentElement.style.setProperty("--sidebar-width", sidebarWidth);
    document.documentElement.style.setProperty("--context-sidebar-width", contextSidebarWidth);
  }, [sidebar, contextSidebar]);

  const { getOpenState, settings } = sidebar;
  const { isOpen: isContextOpen } = contextSidebar;

  // Calculate main content margin
  const getMainMargin = () => {
    if (settings.disabled) return "0px";
    
    const sidebarMargin = getOpenState() ? "288px" : "90px";
    const contextMargin = isContextOpen ? "400px" : "0px";
    
    return `calc(${sidebarMargin} + ${contextMargin})`;
  };

  return (
    <>
      <Sidebar />
      <ContextSidebar />
      <main
        className="min-h-[calc(100vh_-_56px)] bg-zinc-50 dark:bg-zinc-900 transition-[margin-left] ease-in-out duration-300"
        style={{
          marginLeft: getMainMargin()
        }}
      >
        {children}
      </main>
      <footer
        className="transition-[margin-left] ease-in-out duration-300"
        style={{
          marginLeft: getMainMargin()
        }}
      >
        <Footer />
      </footer>
    </>
  );
}
