"use client";

import Link from "next/link";
import { Ellipsis, LogOut } from "lucide-react";
import { usePathname, useRouter } from "next/navigation";

import { cn } from "@/lib/utils";
import { getMenuList } from "@/lib/menu-list";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { CollapseMenuButton } from "@/components/sidebar/collapse-menu-button";
import { ContextSidebarToggle } from "@/components/sidebar/context-sidebar-toggle";
import {
  Tooltip,
  TooltipTrigger,
  TooltipContent,
  TooltipProvider,
} from "@/components/ui/tooltip";
import { useContextSidebar } from "@/hooks/use-context-sidebar";
import { useStore } from "@/hooks/use-store";
import { SidebarToggle } from "./sidebar-toggle";
import { useSidebar } from "@/hooks/use-sidebar";

interface MenuProps {
  isMenuOpen: boolean | undefined;
}

export function Menu({ isMenuOpen }: MenuProps) {
  const sidebar = useStore(useSidebar, (x) => x);
  const contextSidebar = useStore(useContextSidebar, (x) => x);
  const pathname = usePathname();
  const router = useRouter();

  if (!sidebar) return null;
  if (!contextSidebar) return null;

  const { isOpen, toggleOpen, getOpenState, setIsHover, settings } = sidebar;

  const menuList = getMenuList(pathname);
  const {
    openContext,
    isOpen: isContextOpen,
    contextType: currentContextType,
  } = contextSidebar;

  return (
    <ScrollArea className="[&>div>div[style]]:!block">
      <nav className="mt-8 h-full w-full">
        <ul className="flex flex-col min-h-[calc(100vh-48px-36px-16px-32px)] lg:min-h-[calc(100vh-32px-40px-32px)] items-start space-y-1 px-2">
          {menuList.map(({ groupLabel, menus }, index) => (
            <li className={cn("w-full", groupLabel ? "pt-5" : "")} key={index}>
              {(isOpen && groupLabel) || isOpen === undefined ? (
                <p className="text-base font-medium text-muted-foreground px-4 pb-2 max-w-[248px] truncate">
                  {groupLabel}
                </p>
              ) : !isOpen && isOpen !== undefined && groupLabel ? (
                <TooltipProvider>
                  <Tooltip delayDuration={100}>
                    <TooltipTrigger className="w-full">
                      <div className="w-full flex justify-center items-center">
                        <Ellipsis className="h-5 w-5" />
                      </div>
                    </TooltipTrigger>
                    <TooltipContent side="right">
                      <p>{groupLabel}</p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              ) : (
                <p className="pb-2"></p>
              )}
              {menus.map(
                ({ href, label, icon: Icon, active, submenus }, index) =>
                  !submenus || submenus.length === 0 ? (
                    <div className="w-full text-background" key={index}>
                      <TooltipProvider disableHoverableContent>
                        <Tooltip delayDuration={100}>
                          <TooltipTrigger asChild>
                            <Button
                              variant={
                                (active === undefined &&
                                  pathname.startsWith(href)) ||
                                active
                                  ? "secondary"
                                  : "ghost"
                              }
                              className={cn(
                                "w-full text-base justify-start h-10 mb-1 group",
                                ((active === undefined && pathname.startsWith(href)) || active) && "text-primary"
                              )}
                              asChild
                            >
                              <Link
                                href={href}
                                onClick={(e) => {
                                  // Open context sidebar for specific menu items
                                  const contextTypes = [
                                    "categories",
                                    "tags",
                                    "users",
                                    "account",
                                  ];
                                  const contextType = href.replace("/", "");
                                  if (contextTypes.includes(contextType)) {
                                    e.preventDefault();
                                    openContext(contextType);
                                    // Navigate after a short delay to allow context sidebar to open
                                    setTimeout(() => {
                                      router.push(href);
                                    }, 100);
                                  }
                                  // For knowledge page, let normal navigation handle it
                                  // The page component will handle opening the context sidebar
                                }}
                              >
                                <span
                                  className={cn(isOpen === false ? "" : "mr-4")}
                                >
                                  <Icon size={30} />
                                </span>
                                <p
                                  className={cn(
                                    "max-w-[200px] truncate",
                                    isOpen === false
                                      ? "-translate-x-96 opacity-0"
                                      : "translate-x-0 opacity-100"
                                  )}
                                >
                                  {label}
                                </p>
                                {/* Context sidebar toggle for specific menu items */}
                                {isOpen &&
                                  [
                                    "posts",
                                    "categories",
                                    "tags",
                                    "users",
                                    "account",
                                  ].includes(href.replace("/", "")) && (
                                    <div className="ml-auto opacity-0 group-hover:opacity-100 transition-opacity">
                                      <ContextSidebarToggle
                                        contextType={href.replace("/", "")}
                                        isOpen={isOpen}
                                      />
                                    </div>
                                  )}
                              </Link>
                            </Button>
                          </TooltipTrigger>
                          {isOpen === false && (
                            <TooltipContent side="right">
                              {label}
                            </TooltipContent>
                          )}
                        </Tooltip>
                      </TooltipProvider>
                    </div>
                  ) : (
                    <div className="w-full" key={index}>
                      <CollapseMenuButton
                        icon={Icon}
                        label={label}
                        active={
                          active === undefined
                            ? pathname.startsWith(href)
                            : active
                        }
                        submenus={submenus}
                        isOpen={isOpen}
                      />
                    </div>
                  )
              )}
            </li>
          ))}
          <li className="w-full grow flex items-end">
            <div className="w-full grow flex flex-col items-end">
              <TooltipProvider disableHoverableContent>
                <Tooltip delayDuration={100}>
                  <TooltipTrigger asChild>
                    <SidebarToggle isOpen={isOpen} setIsOpen={toggleOpen} />
                  </TooltipTrigger>
                  {isOpen === false && (
                    <TooltipContent side="right">Toggle Sidebar</TooltipContent>
                  )}
                </Tooltip>
              </TooltipProvider>
              <TooltipProvider disableHoverableContent>
                <Tooltip delayDuration={100}>
                  <TooltipTrigger asChild>
                    <Button
                      onClick={() => {}}
                      variant="outline"
                      className="w-full justify-start items-center h-10 mt-5"
                    >
                      <span className={cn(isOpen === false ? "" : "mr-4")}>
                        <LogOut size={18} />
                      </span>
                      <p
                        className={cn(
                          "whitespace-nowrap",
                          isOpen === false ? "opacity-0 hidden" : "opacity-100"
                        )}
                      >
                        Sign out
                      </p>
                    </Button>
                  </TooltipTrigger>
                  {isOpen === false && (
                    <TooltipContent side="right">Sign out</TooltipContent>
                  )}
                </Tooltip>
              </TooltipProvider>
            </div>
          </li>
        </ul>
      </nav>
    </ScrollArea>
  );
}
