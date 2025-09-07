import {
  Tag,
  Users,
  Settings,
  Bookmark,
  SquarePen,
  LayoutGrid,
  LucideIcon,
  Database,
  AudioWaveform,
  MessageCircle,
  MessageSquareText,
  Zap,
  LayoutDashboard,
  MessageSquare
} from "lucide-react";

type Submenu = {
  href: string;
  label: string;
  active?: boolean;
};

type Menu = {
  href: string;
  label: string;
  active?: boolean;
  icon: any;
  submenus?: Submenu[];
};

type Group = {
  groupLabel: string;
  menus: Menu[];
};

export function getMenuList(pathname: string): Group[] {
  return [
    {
      groupLabel: "",
      menus: [
        {
          href: "/dashboard",
          label: "Dashboard",
          icon: LayoutDashboard,
          submenus: []
        },
        {
          href: "/chat",
          label: "Chat",
          icon: MessageSquare,
        },
        {
          href: "/agents/knowledge",
          label: "Knowledge Base",
          icon: Database
        }
      ]
    },
  ];
}
