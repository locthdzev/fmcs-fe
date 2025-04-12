import Link from "next/link";
import { UserContext } from "@/context/UserContext";
import router from "next/router";
import { FaChevronDown, FaCog, FaSignOutAlt } from "react-icons/fa";
import { useContext, useState, useRef, useEffect } from "react";
import { ProfileIcon } from "./icons/ProfileIcon";
import { SettingsProfileIcon } from "./icons/SettingsProfileIcon";

const style = {
  dropdownOpen:
    "absolute right-0 mt-2 bg-white rounded-lg p-2 z-50 w-[180px] shadow-lg",
  dropdownItem:
    "flex items-center text-sm py-2 px-4 hover:bg-gray-100 rounded-lg transition-colors duration-200 text-gray-800 hover:text-black",
  dropdownIcon: "mr-3 text-lg",
};

const DropdownUser = () => {
  const userContext = useContext(UserContext);
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement | null>(null);

  const handleToggleDropdown = () => {
    setIsOpen((prev) => !prev);
  };

  const handleClickOutside = (event: MouseEvent) => {
    if (
      dropdownRef.current &&
      !dropdownRef.current.contains(event.target as Node)
    ) {
      setIsOpen(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    } else {
      document.removeEventListener("mousedown", handleClickOutside);
    }
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isOpen]);

  const handleLogout = () => {
    if (userContext) {
      userContext.logout();
      router.replace("/");
    }
  };

  const getHighestRole = (roles: string[]) => {
    const roleOrder = ["Admin", "Manager", "Healthcare Staff", "Canteen Staff", "User"];
    for (const role of roleOrder) {
      if (roles.includes(role)) {
        return role;
      }
    }
    return "";
  };

  const getRoleColor = (role: string) => {
    switch (role) {
      case "Admin":
        return "text-red-600";
      case "Manager":
        return "text-blue-600";
      case "Healthcare Staff":
        return "text-green-600";
      case "Canteen Staff":
        return "text-amber-600";
      case "User":
        return "text-purple-600";
      default:
        return "text-gray-600";
    }
  };

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={handleToggleDropdown}
        className="flex items-center gap-4 hover:opacity-90 transition-all duration-300"
      >
        <span className="text-right lg:block">
          <span className="block text-base font-medium text-black">
            {userContext?.user.userName || "Guest"}
          </span>
          <span className="block text-xs text-gray-600">
            {userContext?.user.email}
          </span>
          {userContext?.user.role && getHighestRole(userContext.user.role) && getHighestRole(userContext.user.role) !== "User" && (
            <span className={`block text-xs ${getRoleColor(getHighestRole(userContext.user.role))} font-semibold`}>
              {getHighestRole(userContext.user.role)}
            </span>
          )}
        </span>
        <div className="relative block overflow-hidden rounded-full ring-2 ring-gray-200 hover:ring-primary transition-all duration-300">
          <img
            alt="User Avatar"
            src="/images/locdzev.jpg"
            className="h-10 w-10 rounded-full object-cover transition-transform duration-300 hover:scale-110"
          />
        </div>
        <FaChevronDown
          className={`hidden fill-current text-black sm:block transition-transform duration-300 ${
            isOpen ? "rotate-180" : ""
          }`}
          size={12}
        />
      </button>

      {isOpen && (
        <div className={style.dropdownOpen}>
          <ul className="flex flex-col">
            <li>
              <Link href="/my-profile" className={style.dropdownItem}>
                <ProfileIcon />
                <span className="ml-3">My Profile</span>
              </Link>
            </li>
            <li>
              <Link href="/settings" className={style.dropdownItem}>
                <SettingsProfileIcon />
                <span className="ml-3">Settings</span>
              </Link>
            </li>
          </ul>
          <hr className="my-2" />
          <div className="flex justify-center">
            <button
              onClick={handleLogout}
              className="flex items-center justify-center text-sm text-red-600 py-2 px-4 hover:bg-red-50 rounded-lg transition-all duration-200"
            >
              <FaSignOutAlt className="mr-3 text-lg text-red-500" />
              Log Out
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default DropdownUser;
