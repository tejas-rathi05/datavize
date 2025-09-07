import {
  DatabaseIcon,
  MenuSquareIcon,
  Message02Icon
} from "@hugeicons/core-free-icons";

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
          icon: MenuSquareIcon,
          submenus: []
        },
        {
          href: "/chat",
          label: "Chat",
          icon: Message02Icon,
        },
        {
          href: "/agents/knowledge",
          label: "Knowledge Base",
          icon: DatabaseIcon
        }
      ]
    },
  ];
}
