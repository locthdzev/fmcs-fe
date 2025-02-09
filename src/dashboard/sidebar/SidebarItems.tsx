import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { data } from "./data";
import { useRouter } from "next/router";
import { IoIosArrowDown } from "react-icons/io";
import { useDashboardContext } from "../Provider";

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

export function SidebarItems() {
  const { pathname } = useRouter();
  const { sidebarOpen } = useDashboardContext();
  const [openSubmenu, setOpenSubmenu] = useState<string | null>(null);
  const [submenuPosition, setSubmenuPosition] = useState({ top: 0, left: 0 });

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

  return (
    <ul className="md:pl-3">
      {data.map((group) => (
        <li key={group.groupTitle}>
          <h3
            className={`px-4 py-2 text-xs font-semibold text-gray-600 uppercase ${
              sidebarOpen ? style.open : style.close
            }`}
          >
            {group.groupTitle}
          </h3>
          {group.items.map((item) => (
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
                  {item.submenu.map((subItem) => (
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
      ))}
    </ul>
  );
}
