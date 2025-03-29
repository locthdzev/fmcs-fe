import React from "react";
import { useDashboardContext } from "../Provider";
import {
  IoSearch,
  IoShareSocialOutline,
  IoAddCircleOutline,
} from "react-icons/io5";
import { NotificationDropdown } from "./DropdownNotification";
import DropdownUser from "./DropdownUser";
import { Breadcrumb } from "antd";
import { useRouter } from "next/router";

export function TopBar() {
  const { openSidebar } = useDashboardContext();
  const router = useRouter();
  const pathSegments = router.pathname.split('/').filter(Boolean);

  const breadcrumbItems = pathSegments.map((segment, index) => {
    const path = '/' + pathSegments.slice(0, index + 1).join('/');
    const title = segment.charAt(0).toUpperCase() + segment.slice(1);
    return {
      title,
      href: path
    };
  });

  return (
    <header className="relative z-10 h-20 items-center bg-gray-100 shadow-lg shadow-gray-200">
      <div className="relative z-10 mx-auto flex h-full flex-col justify-center px-3 text-white">
        <div className="relative flex w-full items-center pl-1 sm:ml-0 sm:pr-2">
          <div className="group relative flex h-full w-12 items-center">
            <button
              type="button"
              aria-expanded="false"
              aria-label="Toggle sidenav"
              onClick={openSidebar}
              className="text-4xl text-black hover:text-gray-600 hover:scale-110 transition-all duration-200 focus:outline-none active:scale-95"
            >
              ≡
            </button>
          </div>
          <div className="container relative left-0 flex w-3/4">
            <div className="group relative ml-8 flex w-full items-center">
              <Breadcrumb
                items={breadcrumbItems}
                className="text-black"
                separator=">"
              />
            </div>
          </div>
          <div className="relative ml-5 flex w-full items-center justify-end p-1 sm:right-auto sm:mr-0">
            <a href="#" className="block pr-5">
              <IoShareSocialOutline className="h-6 w-6 text-black" />
            </a>
            <a href="#" className="block pr-5">
              <IoAddCircleOutline className="h-6 w-6 text-black" />
            </a>
            <NotificationDropdown />
            <DropdownUser />
          </div>
        </div>
      </div>
    </header>
  );
}
