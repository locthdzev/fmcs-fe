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
import { SurveyStatisticsIcon } from "./icons/SurveyStatisticsIcon";
import { StatisticsofalldrugsIcon } from "./icons/Statisticsofalldrugs";
import { SurveyForStaffIcon } from "./icons/SurveyForStaffIcon";
import { PrescriptionStatisticsIcon } from "./icons/PrescriptionStatisticsIcon";
import CanteenOrderStatisticsIcon from "./icons/CanteenOrderStatisticsIcon";
import InventoryRecordStatictisIcon from "./icons/InventoryRecordStatictisIcon";
import HealthInsuranceStatictisIcon from "./icons/HealthInsuranceStatictisIcon";

export const data = [
  {
    groupTitle: "Main",
    items: [
      { title: "Home", icon: <HomeIcon />, link: "/home" },

      {
        title: "Statistics",
        icon: <StatusIcon />,
        submenu: [
          {
            title: "User Statistics",
            icon: <StatusIcon />,
            link: "/statistics/user",
          },
          {
            title: "Treatment Plan Statistics",
            icon: <StatusIcon />,
            link: "/statistics/treatment-plan",
          },
          {
            title: "Drug Statistics",
            icon: <StatisticsofalldrugsIcon />,
            link: "/statistics/drug",
          },
          {
            title: "Survey Statistics",
            icon: <SurveyStatisticsIcon />,
            link: "/statistics/survey",
          },
          {
            title: "Prescription Statistics",
            icon: <PrescriptionStatisticsIcon />,
            link: "/statistics/prescription",
          },
          {
            title: "Canteen Order Statistics",
            icon: <CanteenOrderStatisticsIcon />,
            link: "/statistics/canteenorder",
          },
          {
            title: "Inventory Record Statistics",
            icon: <InventoryRecordStatictisIcon />,
            link: "/statistics/inventoryrecord",
          },
          {
            title: "Health Check Result Statistics",
            icon: <StatusIcon />,
            link: "/statistics/health-check-result",
          },
          {
            title: "Health Insurance Statistics",
            icon: <HealthInsuranceStatictisIcon />,
            link: "/statistics/healthinsurance",
          },
        ],
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
        submenu: [
          { title: "Drug List", icon: <DrugIcon />, link: "/drug" },
          {
            title: "Drug Groups",
            icon: <DrugGroupIcon />,
            link: "/drug-group",
          },
          {
            title: "Drug Orders",
            icon: <DrugOrderIcon />,
            link: "/drug-order",
          },
          {
            title: "Drug Suppliers",
            icon: <DrugSupplierIcon />,
            link: "/drug-supplier",
          },
          {
            title: "Batch Numbers",
            icon: <BatchNumberIcon />,
            link: "/batch-number",
          },
        ],
      },

      {
        title: "Inventories",
        icon: <InventoriesIcon />,
        submenu: [
          {
            title: "Inventory Records",
            icon: <InventoryRecordIcon />,
            link: "/inventory-record",
          },
          {
            title: "Inventory History",
            icon: <InventoryHistoryIcon />,
            link: "/inventory-record/history",
          },
        ],
      },

      {
        title: "Appointments",
        icon: <AppointmentIcon />,
        link: "/appointment",
      },

      {
        title: "Surveys",
        icon: <SurveyManagementIcon />,
        link: "/survey",
      },

      {
        title: "Health Check Results",
        icon: <PeriodicHealthCheckupsIcon />,
        submenu: [
          {
            title: "Manage Results",
            icon: <PeriodicHealthCheckupsIcon />,
            link: "/health-check-result",
          },
          {
            title: "Pending Approval",
            icon: <PeriodicHealthCheckupsIcon />,
            link: "/health-check-result/pending",
          },
          {
            title: "Follow-up Required",
            icon: <PeriodicHealthCheckupsIcon />,
            link: "/health-check-result/follow-up",
          },
          {
            title: "No Follow-up",
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
            title: "Result History",
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
            title: "Manage Prescriptions",
            icon: <DrugIcon />,
            link: "/prescription",
          },
          {
            title: "Prescription History",
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
            title: "Manage Plans",
            icon: <HealthIcon />,
            link: "/treatment-plan",
          },
          {
            title: "Plan History",
            icon: <ArchiveIcon />,
            link: "/treatment-plan/history",
          },
        ],
      },

      {
        title: "Periodic Checkups",
        icon: <PeriodicHealthCheckupsIcon />,
        link: "/periodic-health-checkup",
      },

      {
        title: "Health Insurance",
        icon: <HealthInsuranceIcon />,
        submenu: [
          {
            title: "Manage Insurances",
            icon: <HealthInsuranceIcon />,
            link: "/health-insurance",
          },
          {
            title: "Insurance History",
            icon: <HealthInsuranceIcon />,
            link: "/health-insurance/history",
          },
        ],
      },

      {
        title: "Schedules",
        icon: <ScheduleIcon />,
        submenu: [
          { title: "Shifts", icon: <ShiftIcon />, link: "/shift" },
          {
            title: "Staff Schedules",
            icon: <ScheduleIcon />,
            link: "/schedule",
          },
        ],
      },

      {
        title: "Notifications",
        icon: <NotificationIcon />,
        link: "/notification",
      },

      {
        title: "Canteens",
        icon: <CanteenIcon />,
        submenu: [
          {
            title: "Canteen Items",
            icon: <CanteenItemIcon />,
            link: "/canteen-item",
          },
          {
            title: "Canteen Orders",
            icon: <CanteenOrder />,
            link: "/canteen-order",
          },
          {
            title: "Delivery Trucks",
            icon: <TrucksIcon />,
            link: "/delivery-truck",
          },
        ],
      },
    ],
  },
  {
    groupTitle: "Individuals",
    items: [
      {
        title: "Schedule Appointment",
        icon: <AppointmentIcon />,
        link: "/schedule-appointment",
      },

      {
        title: "My Assigned Appointment",
        icon: <AppointmentIcon />,
        link: "/my-assigned-appointment",
      },

      {
        title: "My Appointment",
        icon: <AppointmentIcon />,
        link: "/my-appointment",
      },

      {
        title: "My Submitted Surveys",
        icon: <SurveyForUserIcon />,
        link: "/my-submitted-survey",
      },

      {
        title: "My Assigned Surveys",
        icon: <SurveyForStaffIcon />,
        link: "/my-assigned-survey",
      },

      {
        title: "My Health Check Results",
        icon: <PeriodicHealthCheckupsIcon />,
        link: "/my-health-check",
      },

      {
        title: "My Periodic Checkups",
        icon: <PeriodicHealthCheckupsIcon />,
        link: "/my-periodic-checkup",
      },

      {
        title: "My Insurance",
        icon: <HealthIcon />,
        link: "/my-health-insurance",
      },

      { title: "My Schedule", icon: <ScheduleIcon />, link: "/my-schedule" },
    ],
  },
  {
    groupTitle: "Others",
    items: [
      { title: "Settings", icon: <SettingsIcon />, link: "/settings" },

      { title: "Documentation", icon: <DocIcon />, link: "/documentation" },
    ],
  },
];
