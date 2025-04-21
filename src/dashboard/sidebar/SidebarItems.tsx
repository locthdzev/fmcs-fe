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
    "/statistics/prescription",
    "/statistics/canteenorder",
    "/statistics/inventoryrecord",
    "/statistics/health-check-result",
    "/statistics/healthinsurance",
    "/statistics/appointment",
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
    "/statistics/prescription",
    "/statistics/canteenorder",
    "/statistics/inventoryrecord",
    "/statistics/health-check-result",
    "/statistics/healthinsurance",
    "/statistics/appointment",
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
    "/statistics/prescription",
    "/statistics/inventoryrecord",
    "/statistics/health-check-result",
    "/statistics/healthinsurance",
    "/statistics/appointment",
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
    "/statistics/canteenorder",
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
  const [openSubmenus, setOpenSubmenus] = useState<Set<string>>(new Set());
  const [hoveredSubmenu, setHoveredSubmenu] = useState<string | null>(null);
  const [submenuPosition, setSubmenuPosition] = useState({ top: 0, left: 0 });
  const userContext = useContext(UserContext);
  const submenuRefs = useRef<{ [key: string]: HTMLElement | null }>({});

  // Get user roles, đảm bảo luôn là mảng
  const userRoles = Array.isArray(userContext?.user?.role)
    ? userContext.user.role
    : typeof userContext?.user?.role === "string"
    ? [userContext.user.role]
    : [];
  console.log("User roles in sidebar:", userRoles);

  // Effect to close submenu when sidebar is closed
  useEffect(() => {
    if (!sidebarOpen) {
      setOpenSubmenus(new Set());
      setHoveredSubmenu(null);
    }
  }, [sidebarOpen]);

  // Nếu chưa đăng nhập hoặc không có vai trò, không render sidebar
  if (!userContext?.user?.auth || userRoles.length === 0) {
    console.log("User not authenticated or no roles, skipping sidebar render");
    return null;
  }

  // Effect to handle outside clicks
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      // Kiểm tra xem click có nằm ngoài tất cả các submenus đang mở không
      let clickedOutside = true;

      for (const title of Array.from(openSubmenus)) {
        if (
          submenuRefs.current[title] &&
          submenuRefs.current[title]?.contains(event.target as Node)
        ) {
          clickedOutside = false;
          break;
        }
      }

      // Nếu click nằm ngoài tất cả các submenus
      if (clickedOutside && (openSubmenus.size > 0 || hoveredSubmenu)) {
        // Kiểm tra xem click đó có nằm trên một menu item không (để không đóng khi click vào menu item khác)
        const isClickOnMenuItem = (event.target as Element).closest(
          "[data-menu-item]"
        );

        if (!isClickOnMenuItem) {
          setOpenSubmenus(new Set());
          setHoveredSubmenu(null);
        }
      }
    }

    // Add event listener
    document.addEventListener("mousedown", handleClickOutside);

    // Clean up
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [openSubmenus, hoveredSubmenu]);

  const handleMenuInteraction = (title: string, event: React.MouseEvent) => {
    if (!sidebarOpen) {
      // When sidebar is collapsed, still use hover behavior
      const rect = event.currentTarget.getBoundingClientRect();
      setSubmenuPosition({ top: rect.top, left: rect.right });
      setHoveredSubmenu(title);
    }
  };

  const handleMouseLeave = () => {
    if (!sidebarOpen) {
      // Only close on mouse leave when sidebar is collapsed
      setHoveredSubmenu(null);
    }
  };

  const handleMenuClick = (title: string, event: React.MouseEvent) => {
    if (sidebarOpen) {
      // When sidebar is expanded, toggle this submenu in the Set
      setOpenSubmenus((prev) => {
        const newSet = new Set(prev);
        if (newSet.has(title)) {
          newSet.delete(title);
        } else {
          newSet.add(title);
        }
        return newSet;
      });
    } else {
      // When sidebar is collapsed
      const rect = event.currentTarget.getBoundingClientRect();
      setSubmenuPosition({ top: rect.top, left: rect.right });
      setHoveredSubmenu((prev) => (prev === title ? null : title));
    }
    // Ngăn chặn sự kiện lan truyền để không kích hoạt handleClickOutside
    event.stopPropagation();
  };

  // Hàm để lưu ref cho mỗi submenu
  const setSubmenuRef = (title: string, element: HTMLElement | null) => {
    if (element) {
      submenuRefs.current[title] = element;
    }
  };

  // Check if a submenu should be shown - either it's open in expanded mode or hovered in collapsed mode
  const isSubmenuVisible = (title: string) => {
    return sidebarOpen ? openSubmenus.has(title) : hoveredSubmenu === title;
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
                data-menu-item={item.title}
                onMouseEnter={(e) => handleMenuInteraction(item.title, e)}
                onMouseLeave={handleMouseLeave}
              >
                {item.submenu ? (
                  <div
                    className={style.link}
                    style={{ cursor: "pointer" }}
                    onClick={(e) => handleMenuClick(item.title, e)}
                    data-menu-item={item.title}
                  >
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
                        isSubmenuVisible(item.title) ? "rotate-180" : ""
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
                {item.submenu && isSubmenuVisible(item.title) && (
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
                    ref={(el) => {
                      if (el) submenuRefs.current[item.title] = el;
                    }}
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
