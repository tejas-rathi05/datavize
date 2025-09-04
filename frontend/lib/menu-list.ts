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
  MessageSquareText
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
  icon: LucideIcon;
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
          icon: LayoutGrid,
          submenus: []
        },
        {
          href: "/chat",
          label: "Chat",
          icon: MessageSquareText,
        },
        {
          href: "/agents/knowledge",
          label: "Knowledge Base",
          icon: Database
        },
        {
          href: "/workflows",
          label: "Workflows",
          icon: AudioWaveform
        }
      ]
    },
  ];
}
