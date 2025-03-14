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
import { TrucksIcon } from "./icons/TruckIcon";
import { ScheduleIcon } from "./icons/ScheduleIcon";
import { ShiftIcon } from "./icons/ShiftIcon";
import { BatchNumberIcon } from "./icons/BatchNumberIcon";
import { InventoryRecordIcon } from "./icons/InventoryRecordIcon";
import { InventoryHistoryIcon } from "./icons/InventoryHistoryIcon";
import { InventoriesIcon } from "./icons/InventoriesIcon";
import { NotificationIcon } from "./icons/NotificationIcon";

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
            title: "DrugGroups",
            icon: <DrugGroupIcon />,
            link: "/drug-group/management",
          },
          {
            title: "DrugOrders",
            icon: <DrugOrderIcon />,
            link: "/drug-order/management",
          },
          {
            title: "DrugSuppliers",
            icon: <DrugSupplierIcon />,
            link: "/drug-supplier/management",
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
            link: "/canteen/canteen-item",
          },
          {
            title: "CanteenInspections",
            icon: <CanteenInspection />,
            link: "/admin/settings/general",
          },
          {
            title: "CanteenOrders",
            icon: <CanteenOrder />,
            link: "/canteen-order/management",
          },
          {
            title: "Trucks",
            icon: <TrucksIcon />,
            link: "/truck/management",
          },
        ],
      },
      {
        title: "Schedules",
        icon: <ScheduleIcon />,
        // link: "/admin/settings",
        submenu: [
          {
            title: "Schedules",
            icon: <ScheduleIcon />,
            link: "/schedule/management",
          },
          {
            title: "Shifts",
            icon: <ShiftIcon />,
            link: "/shift/management",
          },
        ],
      },
      {
        title: "Inventories",
        icon: <InventoriesIcon />,
        submenu: [
          {
            title: "Batch Numbers",
            icon: <BatchNumberIcon />,
            link: "/batch-number/management",
          },
          {
            title: "Inventory Records",
            icon: <InventoryRecordIcon />,
            link: "/inventory-record/management",
          },
          {
            title: "Inventory History",
            icon: <InventoryHistoryIcon />,
            link: "/inventory-history",
          },
        ],
      },
      {
        title: "Notifications",
        icon: <NotificationIcon />,
        link: "/notification/management",
      },
      {
        title: "HealthInsurances",
        icon: <HealthInsuranceIcon />,
        submenu: [
          {
            title: "List",
            icon: <HealthInsuranceIcon />,
            link: "/health-insurance/management",
          },
          {
            title: "Initial",
            icon: <HealthInsuranceIcon />,
            link: "/health-insurance/initial",
          },
          {
            title: "Expired Update",
            icon: <HealthInsuranceIcon />,
            link: "/health-insurance/expired-update",
          },
          {
            title: "Soft Deleted",
            icon: <HealthInsuranceIcon />,
            link: "/health-insurance/soft-deleted",
          },
          {
            title: "Verification",
            icon: <HealthInsuranceIcon />,
            link: "/health-insurance/verification",
          },
          {
            title: "No Insurance",
            icon: <HealthInsuranceIcon />,
            link: "/health-insurance/no-insurance",
          },
          {
            title: "Update Requests",
            icon: <HealthInsuranceIcon />,
            link: "/health-insurance/update-requests",
          },
          {
            title: "History",
            icon: <HealthInsuranceIcon />,
            link: "/health-insurance/history",
          },
        ],
      },
      {
        title: "PeriodicHealthCheckups",
        icon: <PeriodicHealthCheckupsIcon />,
        link: "/admin/credits",
      },
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
