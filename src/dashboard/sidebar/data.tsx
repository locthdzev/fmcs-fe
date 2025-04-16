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
import { AppointmentIcon } from "./icons/AppointmentIcon";
import { HealthIcon } from "./icons/HealthIcon";
import { SurveyManagementIcon } from "./icons/SurveyManagementIcon";
import { SurveyForUserIcon } from "./icons/SurveyForUserIcon";
import { SurveyIcon } from "./icons/SurveyIcon";
import { CalendarOutlined } from "@ant-design/icons";

export const data = [
  {
    groupTitle: "Main",
    items: [
      { title: "Home", icon: <HomeIcon />, link: "/home" },
      { 
        title: "My Schedule", 
        icon: <CalendarOutlined />, 
        link: "/my-schedule" 
      },
      {
        title: "Statitics",
        icon: <StatusIcon />,
        submenu: [
          {
            title: "Users",
            icon: <StatusIcon />,
            link: "/statitics/user-statitics",
          },
          {
            title: "Treatment Plans",
            icon: <StatusIcon />,
            link: "/statitics/treatment-plan-statitics",
          },
        ],
      },
      {
        title: "My Insurance",
        icon: <HealthIcon />,
        link: "/my-health-insurance",
      },
    ],
  },
  {
    groupTitle: "Management",
    items: [
      { title: "Users", icon: <UsersIcon />, link: "/user" },
      {
        title: "Drugs",
        icon: <DrugIcon />,
        // link: "/admin/settings",
        submenu: [
          {
            title: "Drugs",
            icon: <DrugIcon />,
            link: "/drug",
          },
          {
            title: "DrugGroups",
            icon: <DrugGroupIcon />,
            link: "/drug-group",
          },
          {
            title: "DrugOrders",
            icon: <DrugOrderIcon />,
            link: "/drug-order",
          },
          {
            title: "DrugSuppliers",
            icon: <DrugSupplierIcon />,
            link: "/drug-supplier",
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
            link: "/canteen-item",
          },
          {
            title: "CanteenInspections",
            icon: <CanteenInspection />,
            link: "/admin/settings/general",
          },
          {
            title: "CanteenOrders",
            icon: <CanteenOrder />,
            link: "/canteen-order",
          },
          {
            title: "Trucks",
            icon: <TrucksIcon />,
            link: "/truck",
          },
        ],
      },

      {
        title: "Manage Appointments",
        icon: <AppointmentIcon />,
        submenu: [
          {
            title: "Appointments",
            icon: <AppointmentIcon />,
            link: "/appointment/management",
          },
          {
            title: "Schedule Appointment",
            icon: <AppointmentIcon />,
            link: "/appointment",
          },
          {
            title: "Healthcare Officer Appointment Management",
            icon: <AppointmentIcon />,
            link: "/appointment/manageforstaff",
          },
        ],
      },

      {
        title: "Manage Periodic health checkup",
        icon: <PeriodicHealthCheckupsIcon />,
        submenu: [
          {
            title: "Periodic Health Checkups",
            icon: <PeriodicHealthCheckupsIcon />,
            link: "/periodic-health-checkup/periodichealthcheckups",
          },
          {
            title: "Healthcare Officer Checkups Management",
            icon: <PeriodicHealthCheckupsIcon />,
            link: "/periodic-health-checkup/management",
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
            link: "/schedule",
          },
          {
            title: "Shifts",
            icon: <ShiftIcon />,
            link: "/shift",
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
            link: "/batch-number",
          },
          {
            title: "Inventory Records",
            icon: <InventoryRecordIcon />,
            link: "/inventory-record",
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
        title: "Surveys",
        icon: <SurveyIcon />,
        submenu: [
          {
            title: "Survey Management",
            icon: <SurveyManagementIcon />,
            link: "/survey/management",
          },
          {
            title: "Survey For User",
            icon: <SurveyForUserIcon />,
            link: "/survey/surveyUser",
          },
        ],
      },
      {
        title: "HealthInsurances",
        icon: <HealthInsuranceIcon />,
        submenu: [
          {
            title: "List",
            icon: <HealthInsuranceIcon />,
            link: "/health-insurance",
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
        title: "Health Check Results",
        icon: <PeriodicHealthCheckupsIcon />,
        submenu: [
          {
            title: "Management",
            icon: <PeriodicHealthCheckupsIcon />,
            link: "/health-check-result",
          },
          {
            title: "Waiting for Approval",
            icon: <PeriodicHealthCheckupsIcon />,
            link: "/health-check-result/pending",
          },
          {
            title: "Follow-up Required",
            icon: <PeriodicHealthCheckupsIcon />,
            link: "/health-check-result/follow-up",
          },
          {
            title: "No Follow-up Required",
            icon: <PeriodicHealthCheckupsIcon />,
            link: "/health-check-result/no-follow-up",
          },
          {
            title: "Cancelled for Adjustment",
            icon: <PeriodicHealthCheckupsIcon />,
            link: "/health-check-result/adjustment",
          },
          {
            title: "Soft Deleted",
            icon: <PeriodicHealthCheckupsIcon />,
            link: "/health-check-result/soft-deleted",
          },
          {
            title: "History",
            icon: <PeriodicHealthCheckupsIcon />,
            link: "/health-check-result/history",
          },
        ],
      },
      {
        title: "Prescriptions",
        icon: <DrugIcon />,
        submenu: [
          {
            title: "Management",
            icon: <DrugIcon />,
            link: "/prescription",
          },
          {
            title: "History",
            icon: <ArchiveIcon />,
            link: "/prescription/history",
          },
        ],
      },
      {
        title: "Treatment Plans",
        icon: <HealthIcon />,
        submenu: [
          {
            title: "Management",
            icon: <HealthIcon />,
            link: "/treatment-plan",
          },
          {
            title: "History",
            icon: <ArchiveIcon />,
            link: "/treatment-plan/history",
          },
        ],
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
