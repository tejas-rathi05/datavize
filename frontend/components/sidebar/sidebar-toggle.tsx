import { ChevronLeft, ChevronsRight } from "lucide-react";

import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

interface SidebarToggleProps {
  isOpen: boolean | undefined;
  setIsOpen?: () => void;
}

export function SidebarToggle({ isOpen, setIsOpen }: SidebarToggleProps) {
  return (
    <Button
      onClick={() => setIsOpen?.()}
      className="w-full justify-start items-center h-10 mt-5"
      variant="outline"
    >
      <span className={cn(isOpen === false ? "transition-all transform rotate-360 ease-in" : "mr-4 transition-all transform rotate-180 ease-in")}>
        <ChevronsRight size={18} />
      </span>
      <p
        className={cn(
          "whitespace-nowrap",
          isOpen === false ? "opacity-0 hidden" : "opacity-100"
        )}
      >
        Collapse Sidebar
      </p>
      {/* <ChevronLeft
          className={cn(
            "h-4 w-4 transition-transform ease-in-out duration-700",
            isOpen === false ? "rotate-180" : "rotate-0"
          )}
        /> */}
    </Button>
  );
}
