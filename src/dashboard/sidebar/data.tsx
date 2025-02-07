import { DocIcon } from "./icons/DocIcon";
import { HomeIcon } from "./icons/HomeIcon";
import { StatusIcon } from "./icons/StatusIcon";
import { CreditIcon } from "./icons/CreditIcon";
import { ArchiveIcon } from "./icons/ArchiveIcon";
import { SettingsIcon } from "./icons/SettingsIcon";
import { UsersIcon } from "./icons/UsersIcon";
import { DrugIcon } from "./icons/DrugIcon";
import { DrugGroupIcon } from "./icons/DrugGroupIcon";
import { DrugOrderIcon } from "./icons/DrugOrderIcon";
import { DrugSupplierIcon } from "./icons/DrugSupplier";

export const data = [
  {
    groupTitle: "Main",
    items: [
      { title: "Home", icon: <HomeIcon />, link: "/home" },
      { title: "Status", icon: <StatusIcon />, link: "/admin/status" },
    ],
  },
  {
    groupTitle: "Management",
    items: [
      { title: "Users", icon: <UsersIcon />, link: "/user/management" },
      {
        title: "Drugs",
        icon: <DrugIcon />,
        // link: "/admin/settings",
        submenu: [
          {
            title: "DrugGruops",
            icon: <DrugGroupIcon />,
            link: "/drug/drug-group",
          },
          {
            title: "DrugOrders",
            icon: <DrugOrderIcon />,
            link: "/admin/settings/general",
          },
          {
            title: "DrugSuppliers",
            icon: <DrugSupplierIcon />,
            link: "/admin/settings/general",
          },
        ],
      },
      { title: "Archives", icon: <ArchiveIcon />, link: "/admin/archives" },
      { title: "Credits", icon: <CreditIcon />, link: "/admin/credits" },
    ],
  },
  {
    groupTitle: "Others",
    items: [
      {
        title: "Settings",
        icon: <SettingsIcon />,
        // link: "/admin/settings",
        submenu: [
          {
            title: "General",
            icon: <SettingsIcon />,
            link: "/admin/settings/general",
          },
          { title: "Security", link: "/admin/settings/security" },
        ],
      },
      {
        title: "Documentation",
        icon: <DocIcon />,
        link: "/admin/documentation",
      },
    ],
  },
];
