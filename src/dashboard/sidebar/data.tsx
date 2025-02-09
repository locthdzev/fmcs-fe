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
import { CanteenIcon } from "./icons/CanteenIcon";
import { CanteenItemIcon } from "./icons/CanteenItemIcon";
import { CanteenInspection } from "./icons/CanteenInspection";
import { CanteenOrder } from "./icons/CanteenOrder";
import { HealthInsuranceIcon } from "./icons/HealthInsuranceIcon";
import { PeriodicHealthCheckupsIcon } from "./icons/PeriodicHealthCheckupsIcon";

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
            title: "Drugs",
            icon: <DrugIcon />,
            link: "/drug/management",
          },
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
            link: "/drug/drug-supplier",
          },
        ],
      },
      {
        title: "Canteens",
        icon: <CanteenIcon />,
        // link: "/admin/settings",
        submenu: [
          {
            title: "CanteenItems",
            icon: <CanteenItemIcon />,
            link: "/drug/drug-group",
          },
          {
            title: "CanteenInspections",
            icon: <CanteenInspection />,
            link: "/admin/settings/general",
          },
          {
            title: "CanteenOrders",
            icon: <CanteenOrder />,
            link: "/drug/drug-supplier",
          },
        ],
      },
      { title: "HealthInsurance", icon: <HealthInsuranceIcon />, link: "/admin/archives" },
      { title: "PeriodicHealthCheckups", icon: <PeriodicHealthCheckupsIcon />, link: "/admin/credits" },
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
