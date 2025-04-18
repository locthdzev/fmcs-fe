import { useEffect, useRef, useState, useContext } from "react";
import Link from "next/link";
import { data } from "./data";
import { useRouter } from "next/router";
import { IoIosArrowDown } from "react-icons/io";
import { useDashboardContext } from "../Provider";
import { UserContext } from "@/context/UserContext";

const style = {
  title: "mx-4 text-sm whitespace-pre",
  active: "bg-gray-700 rounded-full",
  link: "flex items-center justify-start my-1 p-3 w-full hover:text-white",
  close:
    "lg:duration-700 lg:ease-out lg:invisible lg:opacity-0 lg:transition-all lg:h-0 lg:overflow-hidden",
  open: "lg:duration-500 lg:ease-in lg:h-auto lg:opacity-100 lg:transition-all lg:w-auto",
  submenuOpen: "pl-12 mt-2 space-y-2",
  submenuClose: "fixed bg-white rounded-lg p-2 z-50 min-w-[200px] shadow-lg",
  submenuLink:
    "flex items-center text-sm py-2 px-4 hover:bg-gray-100 rounded-lg transition-colors duration-200 text-gray-800 hover:text-black",
  submenuIcon: "mr-3 text-lg",
};

// Danh sách route được phép cho từng vai trò
const roleRoutes = {
  Admin: [
    "/home",
    "/statistics/user",
    "/statistics/treatment-plan",
    "/statistics/drug",
    "/statistics/survey",
    "/user",
    "/drug",
    "/drug-group",
    "/drug-order",
    "/drug-supplier",
    "/batch-number",
    "/inventory-record",
    "/inventory-record/history",
    "/appointment",
    "/survey",
    "/health-check-result",
    "/health-check-result/pending",
    "/health-check-result/follow-up",
    "/health-check-result/no-follow-up",
    "/health-check-result/adjustment",
    "/health-check-result/soft-deleted",
    "/health-check-result/history",
    "/prescription",
    "/prescription/history",
    "/treatment-plan",
    "/treatment-plan/history",
    "/periodic-health-checkup",
    "/health-insurance",
    "/health-insurance/initial",
    "/health-insurance/expired-update",
    "/health-insurance/soft-deleted",
    "/health-insurance/verification",
    "/health-insurance/no-insurance",
    "/health-insurance/update-requests",
    "/health-insurance/history",
    "/shift",
    "/schedule",
    "/notification",
    "/canteen-item",
    "/canteen-order",
    "/delivery-truck",
    "/schedule-appointment",
    "/my-appointment",
    "/my-health-check",
    "/my-health-insurance",
    "/settings",
    "/documentation",
  ],
  Manager: [
    "/home",
    "/statistics/user",
    "/statistics/treatment-plan",
    "/statistics/drug",
    "/statistics/survey",
    "/user",
    "/drug",
    "/drug-group",
    "/drug-order",
    "/drug-supplier",
    "/batch-number",
    "/inventory-record",
    "/inventory-record/history",
    "/appointment",
    "/survey",
    "/health-check-result",
    "/health-check-result/pending",
    "/health-check-result/follow-up",
    "/health-check-result/no-follow-up",
    "/health-check-result/adjustment",
    "/health-check-result/soft-deleted",
    "/health-check-result/history",
    "/prescription",
    "/prescription/history",
    "/treatment-plan",
    "/treatment-plan/history",
    "/periodic-health-checkup",
    "/health-insurance",
    "/health-insurance/initial",
    "/health-insurance/expired-update",
    "/health-insurance/soft-deleted",
    "/health-insurance/verification",
    "/health-insurance/no-insurance",
    "/health-insurance/update-requests",
    "/health-insurance/history",
    "/shift",
    "/schedule",
    "/notification",
    "/canteen-item",
    "/canteen-order",
    "/delivery-truck",
    "/schedule-appointment",
    "/my-appointment",
    "/my-health-check",
    "/my-health-insurance",
    "/settings",
    "/documentation",
  ],
  "Healthcare Staff": [
    "/home",
    "/statistics/treatment-plan",
    "/statistics/drug",
    "/drug",
    "/drug-group",
    "/drug-order",
    "/drug-supplier",
    "/batch-number",
    "/inventory-record",
    "/inventory-record/history",
    "/health-check-result",
    "/health-check-result/pending",
    "/health-check-result/follow-up",
    "/health-check-result/no-follow-up",
    "/health-check-result/adjustment",
    "/health-check-result/soft-deleted",
    "/health-check-result/history",
    "/prescription",
    "/prescription/history",
    "/treatment-plan",
    "/treatment-plan/history",
    "/periodic-health-checkup",
    "/health-insurance",
    "/health-insurance/initial",
    "/health-insurance/expired-update",
    "/health-insurance/soft-deleted",
    "/health-insurance/verification",
    "/health-insurance/no-insurance",
    "/health-insurance/update-requests",
    "/health-insurance/history",
    "/notification",
    "/canteen-item",
    "/canteen-order",
    "/delivery-truck",
    "/schedule-appointment",
    "/my-assigned-appointment",
    "/my-appointment",
    "/my-assigned-survey",
    "/my-health-check",
    "/my-periodic-checkup",
    "/my-health-insurance",
    "/my-schedule",
    "/settings",
    "/documentation",
  ],
  "Canteen Staff": [
    "/home",
    "/canteen-item",
    "/canteen-order",
    "/delivery-truck",
    "/settings",
    "/documentation",
  ],
  User: [
    "/home",
    "/schedule-appointment",
    "/my-appointment",
    "/my-submitted-survey",
    "/my-health-check",
    "/my-periodic-checkup",
    "/my-health-insurance",
    "/settings",
    "/documentation",
  ],
};

export function SidebarItems() {
  const { pathname } = useRouter();
  const { sidebarOpen } = useDashboardContext();
  const [openSubmenu, setOpenSubmenu] = useState<string | null>(null);
  const [submenuPosition, setSubmenuPosition] = useState({ top: 0, left: 0 });
  const userContext = useContext(UserContext);

  // Get user roles, đảm bảo luôn là mảng
  const userRoles = Array.isArray(userContext?.user?.role)
    ? userContext.user.role
    : typeof userContext?.user?.role === "string"
    ? [userContext.user.role]
    : [];
  console.log("User roles in sidebar:", userRoles);

  // Nếu chưa đăng nhập hoặc không có vai trò, không render sidebar
  if (!userContext?.user?.auth || userRoles.length === 0) {
    console.log("User not authenticated or no roles, skipping sidebar render");
    return null;
  }

  const dropdownRef = useRef<HTMLDivElement | null>(null);

  const handleMouseEnter = (title: string, event: React.MouseEvent) => {
    if (!sidebarOpen) {
      const rect = event.currentTarget.getBoundingClientRect();
      setSubmenuPosition({ top: rect.top, left: rect.right });
    }
    setOpenSubmenu(title);
  };

  const handleMouseLeave = () => {
    setOpenSubmenu(null);
  };

  // Hàm kiểm tra xem route có được phép hiển thị cho vai trò hiện tại không
  const isRouteAllowed = (link: string) => {
    return userRoles.some((role) =>
      roleRoutes[role as keyof typeof roleRoutes]?.includes(link)
    );
  };

  // Hàm lọc submenu để chỉ hiển thị các mục được phép
  const filterSubmenu = (submenu: any[]) => {
    return submenu.filter((subItem) => isRouteAllowed(subItem.link));
  };

  // Hàm lọc items dựa trên vai trò
  const filterItemsByRole = (groupTitle: string, item: any) => {
    // Nếu item có submenu, kiểm tra xem có subitem nào được phép không
    if (item.submenu) {
      const allowedSubmenu = filterSubmenu(item.submenu);
      return allowedSubmenu.length > 0;
    }

    // Nếu item không có submenu, kiểm tra trực tiếp link
    return isRouteAllowed(item.link);
  };

  return (
    <ul className="md:pl-3">
      {data.map((group) => {
        // Filter items based on role
        const filteredItems = group.items.filter((item) =>
          filterItemsByRole(group.groupTitle, item)
        );

        // Skip rendering this group if it has no visible items
        if (filteredItems.length === 0) {
          return null;
        }

        return (
          <li key={group.groupTitle}>
            <h3
              className={`px-4 py-2 text-xs font-semibold text-gray-600 uppercase ${
                sidebarOpen ? style.open : style.close
              }`}
            >
              {group.groupTitle}
            </h3>
            {filteredItems.map((item) => (
              <div
                key={item.title}
                ref={openSubmenu === item.title ? dropdownRef : null}
                onMouseEnter={(e) => handleMouseEnter(item.title, e)}
                onMouseLeave={handleMouseLeave}
              >
                {item.submenu ? (
                  <div className={style.link} style={{ cursor: "pointer" }}>
                    <div className="p-2">
                      <span>{item.icon}</span>
                    </div>
                    <span
                      className={`${style.title} ${
                        sidebarOpen ? style.open : style.close
                      }`}
                    >
                      {item.title}
                    </span>
                    <IoIosArrowDown
                      className={`ml-auto transform transition-transform duration-200 ${
                        openSubmenu === item.title ? "rotate-180" : ""
                      }`}
                    />
                  </div>
                ) : (
                  <Link href={item.link}>
                    <span className={style.link}>
                      <div
                        className={`p-2 ${
                          item.link === pathname ? style.active : ""
                        }`}
                      >
                        <span>{item.icon}</span>
                      </div>
                      <span
                        className={`${style.title} ${
                          sidebarOpen ? style.open : style.close
                        }`}
                      >
                        {item.title}
                      </span>
                    </span>
                  </Link>
                )}
                {item.submenu && openSubmenu === item.title && (
                  <ul
                    className={`${
                      sidebarOpen ? style.submenuOpen : style.submenuClose
                    }`}
                    style={
                      !sidebarOpen
                        ? {
                            top: `${submenuPosition.top}px`,
                            left: `${submenuPosition.left}px`,
                          }
                        : {}
                    }
                  >
                    {filterSubmenu(item.submenu).map((subItem) => (
                      <li key={subItem.title}>
                        <Link href={subItem.link}>
                          <span
                            className={`${style.submenuLink} ${
                              subItem.link === pathname
                                ? "bg-gray-100 text-black"
                                : ""
                            }`}
                          >
                            {subItem.icon && (
                              <span className={style.submenuIcon}>
                                {subItem.icon}
                              </span>
                            )}
                            <span>{subItem.title}</span>
                          </span>
                        </Link>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            ))}
          </li>
        );
      })}
    </ul>
  );
}
