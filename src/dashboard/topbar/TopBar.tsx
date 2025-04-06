import React, { useEffect, useState, useRef } from "react";
import { useDashboardContext } from "../Provider";
import {
  IoSearch,
  IoShareSocialOutline,
  IoAddCircleOutline,
} from "react-icons/io5";
import { NotificationDropdown } from "./DropdownNotification";
import DropdownUser from "./DropdownUser";
import { Breadcrumb, Spin } from "antd";
import { useRouter } from "next/router";
import { getTreatmentPlanById } from "@/api/treatment-plan";

export function TopBar() {
  const { openSidebar } = useDashboardContext();
  const router = useRouter();
  const pathSegments = router.asPath.split("/").filter(Boolean);
  const [treatmentPlanCode, setTreatmentPlanCode] = useState<string | null>(null);
  const [loadingCode, setLoadingCode] = useState(false);
  const prevTreatmentPlanId = useRef<string | null>(null);

  // Check for treatment plan ID and fetch code
  useEffect(() => {
    const fetchTreatmentPlanCode = async () => {
      // Chỉ fetch nếu ID thực sự thay đổi
      if (
        pathSegments.length > 1 &&
        pathSegments[0] === "treatment-plan" && 
        pathSegments[1] && 
        router.query.id &&
        router.query.id !== prevTreatmentPlanId.current
      ) {
        try {
          setLoadingCode(true);
          const currentId = router.query.id as string;
          prevTreatmentPlanId.current = currentId;
          
          const response = await getTreatmentPlanById(currentId);
          if (response.success && response.data) {
            setTreatmentPlanCode(response.data.treatmentPlanCode);
          }
        } catch (error) {
          console.error("Error fetching treatment plan code:", error);
        } finally {
          setLoadingCode(false);
        }
      }
    };

    if (router.isReady) {
      fetchTreatmentPlanCode();
    }
  }, [router.isReady, router.query.id]);

  // Tạo breadcrumb items và xử lý trường hợp trùng lặp
  const breadcrumbItems = [];

  // Thêm Home vào đầu chỉ khi không phải trang home
  if (
    pathSegments.length === 0 ||
    (pathSegments.length > 0 && pathSegments[0] !== "home")
  ) {
    breadcrumbItems.push({
      title: "Home",
      href: "/home",
    });
  }

  // Thêm các phần còn lại của đường dẫn
  pathSegments.forEach((segment, index) => {
    // Bỏ qua nếu là "home" và đã có Home ở đầu breadcrumb
    if (index === 0 && segment === "home" && breadcrumbItems.length > 0) {
      return;
    }

    // Build the path for this segment
    const path = "/" + pathSegments.slice(0, index + 1).join("/");

    // Check if this is a treatment plan ID segment
    const isTreatmentPlanId = 
      pathSegments[0] === "treatment-plan" && 
      index === 1 && 
      router.query.id === segment;

    // Create the title React element
    let titleContent: React.ReactNode;
    if (isTreatmentPlanId && treatmentPlanCode) {
      titleContent = treatmentPlanCode;
    } else if (isTreatmentPlanId && loadingCode) {
      titleContent = <Spin size="small" />;
    } else {
      titleContent = segment.charAt(0).toUpperCase() + segment.slice(1);
    }
    
    const isLast = index === pathSegments.length - 1;

    breadcrumbItems.push({
      title: (
        <span className={isLast ? "font-bold text-gray-500" : ""}>{titleContent}</span>
      ),
      href: path,
    });
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
