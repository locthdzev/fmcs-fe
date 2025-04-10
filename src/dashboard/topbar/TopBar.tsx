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
import { getDrugSupplierById } from "@/api/drugsupplier";

export function TopBar() {
  const { openSidebar } = useDashboardContext();
  const router = useRouter();
  const pathSegments = router.asPath.split("/").filter(Boolean);
  
  // State for dynamic breadcrumb titles
  const [treatmentPlanCode, setTreatmentPlanCode] = useState<string | null>(null);
  const [supplierName, setSupplierName] = useState<string | null>(null);
  const [loadingCode, setLoadingCode] = useState(false);
  const [loadingSupplierName, setLoadingSupplierName] = useState(false);
  
  // Refs to track previously fetched IDs
  const prevTreatmentPlanId = useRef<string | null>(null);
  const prevSupplierId = useRef<string | null>(null);

  // Fetch dynamic data based on route
  useEffect(() => {
    const fetchDataForBreadcrumb = async () => {
      const currentId = router.query.id as string;
      if (!currentId) return;

      // Fetch Treatment Plan Code
      if (
        pathSegments.length > 1 &&
        pathSegments[0] === "treatment-plan" &&
        currentId !== prevTreatmentPlanId.current
      ) {
        try {
          setLoadingCode(true);
          setTreatmentPlanCode(null);
          prevTreatmentPlanId.current = currentId;
          prevSupplierId.current = null;
          setSupplierName(null);

          const response = await getTreatmentPlanById(currentId);
          if (response.success && response.data) {
            setTreatmentPlanCode(response.data.treatmentPlanCode);
          } else {
             console.error("Failed to fetch treatment plan code:", response.message);
             setTreatmentPlanCode(currentId);
          }
        } catch (error) {
          console.error("Error fetching treatment plan code:", error);
          setTreatmentPlanCode(currentId);
        } finally {
          setLoadingCode(false);
        }
      } 
      // Fetch Drug Supplier Name
      else if (
        pathSegments.length > 1 &&
        pathSegments[0] === "drug-supplier" &&
        currentId !== prevSupplierId.current
      ) {
        try {
          setLoadingSupplierName(true);
          setSupplierName(null);
          prevSupplierId.current = currentId;
          prevTreatmentPlanId.current = null;
          setTreatmentPlanCode(null);

          const response = await getDrugSupplierById(currentId);
          
          if (response && response.supplierName) { 
            setSupplierName(response.supplierName);
          } else {
             console.error("Failed to fetch supplier name or invalid response structure");
             setSupplierName(currentId);
          }
        } catch (error) {
          console.error("Error fetching supplier name:", error);
          setSupplierName(currentId);
        } finally {
          setLoadingSupplierName(false);
        }
      }
       // Reset refs if route changes away from detail pages
       else if (pathSegments[0] !== 'treatment-plan' && pathSegments[0] !== 'drug-supplier') {
           prevTreatmentPlanId.current = null;
           prevSupplierId.current = null;
           setTreatmentPlanCode(null);
           setSupplierName(null);
       }
    };

    if (router.isReady && router.query.id) {
      fetchDataForBreadcrumb();
    } else { 
        // Reset state if we navigate away or ID is not present
         prevTreatmentPlanId.current = null;
         prevSupplierId.current = null;
         setTreatmentPlanCode(null);
         setSupplierName(null);
    }
  }, [router.isReady, router.query.id, pathSegments]); 

  // Generate breadcrumb items
  const breadcrumbItems = [];

  // Add Home item
  if (
    pathSegments.length === 0 ||
    (pathSegments.length > 0 && pathSegments[0] !== "home")
  ) {
    breadcrumbItems.push({
      title: "Home",
      href: "/home",
    });
  }

  // Add remaining path segments
  pathSegments.forEach((segment, index) => {
    if (index === 0 && segment === "home" && breadcrumbItems.length > 0) {
      return;
    }
    const path = "/" + pathSegments.slice(0, index + 1).join("/");

    const isTreatmentPlanIdSegment = 
      pathSegments[0] === "treatment-plan" && 
      index === 1 && 
      router.query.id === segment;
      
    const isDrugSupplierIdSegment = 
      pathSegments[0] === "drug-supplier" && 
      index === 1 && 
      router.query.id === segment;

    let titleContent: React.ReactNode;

    if (isTreatmentPlanIdSegment) {
      if (loadingCode) titleContent = <Spin size="small" />;
      else titleContent = treatmentPlanCode || segment;
    } else if (isDrugSupplierIdSegment) {
      if (loadingSupplierName) titleContent = <Spin size="small" />;
      else titleContent = supplierName || segment;
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
