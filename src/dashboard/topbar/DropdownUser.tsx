import Link from "next/link";
import { UserContext } from "@/context/UserContext";
import router from "next/router";
import {
  FaChevronDown,
  FaUser,
  FaAddressBook,
  FaCog,
  FaSignOutAlt,
} from "react-icons/fa";
import { useDashboardContext } from "../Provider";
import { useContext } from "react";

const DropdownUser = () => {
  const { dropdownOpen, toggleDropdown, closeDropdown } = useDashboardContext();
  const userContext = useContext(UserContext);

  const handleLogout = () => {
    if (userContext) {
      userContext.logout();
      router.replace("/");
    }
  };

  const getHighestRole = (roles: string[]) => {
    const roleOrder = ["Admin", "Manager", "Staff"];
    for (const role of roleOrder) {
      if (roles.includes(role)) {
        return role;
      }
    }
    return "";
  };

  return (
    <div className="relative">
      <button
        onClick={toggleDropdown}
        className="flex items-center gap-4 hover:opacity-90 transition-all duration-300"
      >
        <span className="text-right lg:block">
          <span className="block text-base font-medium text-black dark:text-black">
            {userContext?.user.userName || "Guest"}
          </span>
          {userContext?.user.role && getHighestRole(userContext.user.role) && (
            <span className="block text-xs text-red-600 font-semibold">
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
          className={`hidden fill-current text-black sm:block transition-transform duration-300 ease-in-out ${
            dropdownOpen ? "rotate-180" : ""
          }`}
          size={12}
        />
      </button>
      {dropdownOpen && (
        <div
          className="absolute right-0 mt-4 flex w-40 flex-col rounded-xl border border-gray-100 bg-white shadow-2xl transform opacity-0 scale-95 animate-dropdown dark:border-gray-700 dark:bg-boxdark overflow-hidden"
          onMouseLeave={closeDropdown}
          style={{
            animation: "dropdownFade 0.2s ease forwards",
          }}
        >
          <ul className="flex flex-col gap-1 border-b border-gray-100 p-3 dark:border-gray-700">
            <li>
              <Link
                href="/profile"
                className="flex items-center gap-3 text-sm font-medium !text-black hover:text-blue-500 hover:bg-blue-50/50 dark:text-gray-200 dark:hover:bg-blue-800/30 rounded-lg px-3 py-2.5 transition-all duration-300 w-full"
              >
                <FaUser
                  className="text-black group-hover:text-blue-500"
                  size={16}
                />
                My Profile
              </Link>
            </li>{" "}
            <li>
              <Link
                href="#"
                className="flex items-center gap-3 text-sm font-medium !text-black hover:text-blue-500 hover:bg-blue-50/50 dark:text-gray-200 dark:hover:bg-blue-800/30 rounded-lg px-3 py-2.5 transition-all duration-300 w-full"
              >
                <FaAddressBook
                  className="text-black group-hover:text-blue-500"
                  size={16}
                />
                My Contacts
              </Link>
            </li>
            <li>
              <Link
                href="/settings"
                className="flex items-center gap-3 text-sm font-medium !text-black hover:text-blue-500 hover:bg-blue-50/50 dark:text-gray-200 dark:hover:bg-blue-800/30 rounded-lg px-3 py-2.5 transition-all duration-300 w-full"
              >
                <FaCog
                  className="text-black group-hover:text-blue-500"
                  size={16}
                />
                Settings
              </Link>
            </li>
          </ul>{" "}
          <button
            onClick={handleLogout}
            className="flex items-center justify-center gap-3 px-6 py-4 text-sm font-medium text-red-600 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-900/20 transition-all duration-300 w-full"
          >
            <FaSignOutAlt className="text-red-500" size={16} />
            Log Out
          </button>
        </div>
      )}
      <style jsx>{`
        @keyframes dropdownFade {
          from {
            opacity: 0;
            transform: scale(0.95) translateY(-10px);
          }
          to {
            opacity: 1;
            transform: scale(1) translateY(0);
          }
        }
      `}</style>
    </div>
  );
};

export default DropdownUser;
