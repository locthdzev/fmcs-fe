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
import api from "@/api/customize-axios";
import { getTruckById } from "@/api/truck";
import { getDrugById } from "@/api/drug";
import { getDrugGroupById } from "@/api/druggroup";
import { getDrugOrderById } from "@/api/drugorder";

export function TopBar() {
  const { openSidebar } = useDashboardContext();
  const router = useRouter();
  const pathSegments = router.asPath.split("/").filter(Boolean);
  
  // State for dynamic breadcrumb titles
  const [treatmentPlanCode, setTreatmentPlanCode] = useState<string | null>(null);
  const [supplierName, setSupplierName] = useState<string | null>(null);
  const [canteenItemName, setCanteenItemName] = useState<string | null>(null);
  const [truckLicensePlate, setTruckLicensePlate] = useState<string | null>(null);
  const [drugName, setDrugName] = useState<string | null>(null);
  const [drugGroupName, setDrugGroupName] = useState<string | null>(null);
  const [drugOrderCode, setDrugOrderCode] = useState<string | null>(null);
  const [loadingCode, setLoadingCode] = useState(false);
  const [loadingSupplierName, setLoadingSupplierName] = useState(false);
  const [loadingCanteenItemName, setLoadingCanteenItemName] = useState(false);
  const [loadingTruckLicensePlate, setLoadingTruckLicensePlate] = useState(false);
  const [loadingDrugName, setLoadingDrugName] = useState(false);
  const [loadingDrugGroupName, setLoadingDrugGroupName] = useState(false);
  const [loadingDrugOrderCode, setLoadingDrugOrderCode] = useState(false);
  
  // Refs to track previously fetched IDs
  const prevTreatmentPlanId = useRef<string | null>(null);
  const prevSupplierId = useRef<string | null>(null);
  const prevCanteenItemId = useRef<string | null>(null);
  const prevTruckId = useRef<string | null>(null);
  const prevDrugId = useRef<string | null>(null);
  const prevDrugGroupId = useRef<string | null>(null);
  const prevDrugOrderId = useRef<string | null>(null);

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
          prevCanteenItemId.current = null;
          prevTruckId.current = null;
          prevDrugId.current = null;
          prevDrugGroupId.current = null;
          prevDrugOrderId.current = null;
          setSupplierName(null);
          setCanteenItemName(null);
          setTruckLicensePlate(null);
          setDrugName(null);
          setDrugGroupName(null);
          setDrugOrderCode(null);

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
          prevCanteenItemId.current = null;
          setTreatmentPlanCode(null);
          setCanteenItemName(null);

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
      // Fetch Canteen Item Name
      else if (
        pathSegments.length > 1 &&
        pathSegments[0] === "canteen-item" &&
        currentId !== prevCanteenItemId.current &&
        pathSegments.length === 2 // Chỉ áp dụng cho trang chi tiết, không phải trang chỉnh sửa
      ) {
        try {
          setLoadingCanteenItemName(true);
          setCanteenItemName(null);
          prevCanteenItemId.current = currentId;
          prevTreatmentPlanId.current = null;
          prevSupplierId.current = null;
          setTreatmentPlanCode(null);
          setSupplierName(null);

          const response = await api.get(`/canteen-items-management/canteen-items/${currentId}`);
          
          if (response && response.data && response.data.data && response.data.data.itemName) { 
            setCanteenItemName(response.data.data.itemName);
          } else {
             console.error("Failed to fetch canteen item name or invalid response structure");
             setCanteenItemName(currentId);
          }
        } catch (error) {
          console.error("Error fetching canteen item name:", error);
          setCanteenItemName(currentId);
        } finally {
          setLoadingCanteenItemName(false);
        }
      }
      // Fetch Truck License Plate
      else if (
        pathSegments.length > 1 &&
        pathSegments[0] === "truck" &&
        currentId !== prevTruckId.current &&
        pathSegments.length === 2 // Chỉ áp dụng cho trang chi tiết, không phải trang chỉnh sửa
      ) {
        try {
          setLoadingTruckLicensePlate(true);
          setTruckLicensePlate(null);
          prevTruckId.current = currentId;
          prevCanteenItemId.current = null;
          prevTreatmentPlanId.current = null;
          prevSupplierId.current = null;
          setTreatmentPlanCode(null);
          setSupplierName(null);
          setCanteenItemName(null);

          const response = await getTruckById(currentId);
          
          if (response && response.licensePlate) { 
            setTruckLicensePlate(response.licensePlate);
          } else {
             console.error("Failed to fetch truck license plate or invalid response structure");
             setTruckLicensePlate(currentId);
          }
        } catch (error) {
          console.error("Error fetching truck license plate:", error);
          setTruckLicensePlate(currentId);
        } finally {
          setLoadingTruckLicensePlate(false);
        }
      }
      // Fetch Drug Name
      else if (
        pathSegments.length > 1 &&
        pathSegments[0] === "drug" &&
        currentId !== prevDrugId.current &&
        pathSegments.length === 2 // Only for detail page, not edit page
      ) {
        try {
          setLoadingDrugName(true);
          setDrugName(null);
          prevDrugId.current = currentId;
          prevCanteenItemId.current = null;
          prevTreatmentPlanId.current = null;
          prevSupplierId.current = null;
          prevTruckId.current = null;
          setTreatmentPlanCode(null);
          setSupplierName(null);
          setCanteenItemName(null);
          setTruckLicensePlate(null);

          const response = await getDrugById(currentId);
          
          if (response && response.name) { 
            setDrugName(response.name);
          } else {
             console.error("Failed to fetch drug name or invalid response structure");
             setDrugName(currentId);
          }
        } catch (error) {
          console.error("Error fetching drug name:", error);
          setDrugName(currentId);
        } finally {
          setLoadingDrugName(false);
        }
      }
      // Fetch Drug Group Name
      else if (
        pathSegments.length > 1 &&
        pathSegments[0] === "drug-group" &&
        currentId !== prevDrugGroupId.current
      ) {
        try {
          setLoadingDrugGroupName(true);
          setDrugGroupName(null);
          prevDrugGroupId.current = currentId;
          prevDrugId.current = null;
          prevCanteenItemId.current = null;
          prevTreatmentPlanId.current = null;
          prevSupplierId.current = null;
          prevTruckId.current = null;
          setTreatmentPlanCode(null);
          setSupplierName(null);
          setCanteenItemName(null);
          setTruckLicensePlate(null);
          setDrugName(null);

          const response = await getDrugGroupById(currentId);
          
          if (response && response.groupName) { 
            setDrugGroupName(response.groupName);
          } else {
             console.error("Failed to fetch drug group name or invalid response structure");
             setDrugGroupName(currentId);
          }
        } catch (error) {
          console.error("Error fetching drug group name:", error);
          setDrugGroupName(currentId);
        } finally {
          setLoadingDrugGroupName(false);
        }
      }
      // Fetch Drug Order Code
      else if (
        pathSegments.length > 0 &&
        pathSegments[0] === "drug-order" &&
        pathSegments[1] === "details" &&
        currentId !== prevDrugOrderId.current
      ) {
        try {
          setLoadingDrugOrderCode(true);
          setDrugOrderCode(null);
          prevDrugOrderId.current = currentId;
          prevDrugGroupId.current = null;
          prevDrugId.current = null;
          prevCanteenItemId.current = null;
          prevTreatmentPlanId.current = null;
          prevSupplierId.current = null;
          prevTruckId.current = null;
          setDrugGroupName(null);
          setTreatmentPlanCode(null);
          setSupplierName(null);
          setCanteenItemName(null);
          setTruckLicensePlate(null);
          setDrugName(null);

          const response = await getDrugOrderById(currentId);
          
          if (response && response.drugOrderCode) { 
            setDrugOrderCode(response.drugOrderCode);
          } else {
             console.error("Failed to fetch drug order code or invalid response structure");
             setDrugOrderCode(currentId);
          }
        } catch (error) {
          console.error("Error fetching drug order code:", error);
          setDrugOrderCode(currentId);
        } finally {
          setLoadingDrugOrderCode(false);
        }
      }
       // Reset refs if route changes away from detail pages
       else if (pathSegments[0] !== 'treatment-plan' && pathSegments[0] !== 'drug-supplier' && pathSegments[0] !== 'canteen-item' && pathSegments[0] !== 'truck' && pathSegments[0] !== 'drug' && pathSegments[0] !== 'drug-group' && pathSegments[0] !== 'drug-order') {
           prevTreatmentPlanId.current = null;
           prevSupplierId.current = null;
           prevCanteenItemId.current = null;
           prevTruckId.current = null;
           prevDrugId.current = null;
           prevDrugGroupId.current = null;
           prevDrugOrderId.current = null;
           setTreatmentPlanCode(null);
           setSupplierName(null);
           setCanteenItemName(null);
           setTruckLicensePlate(null);
           setDrugName(null);
           setDrugGroupName(null);
           setDrugOrderCode(null);
       }
    };

    if (router.isReady && router.query.id) {
      fetchDataForBreadcrumb();
    } else { 
        // Reset state if we navigate away or ID is not present
         prevTreatmentPlanId.current = null;
         prevSupplierId.current = null;
         prevCanteenItemId.current = null;
         prevTruckId.current = null;
         prevDrugId.current = null;
         prevDrugGroupId.current = null;
         prevDrugOrderId.current = null;
         setTreatmentPlanCode(null);
         setSupplierName(null);
         setCanteenItemName(null);
         setTruckLicensePlate(null);
         setDrugName(null);
         setDrugGroupName(null);
         setDrugOrderCode(null);
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
      
    const isCanteenItemIdSegment = 
      pathSegments[0] === "canteen-item" && 
      index === 1 && 
      router.query.id === segment;
      
    const isTruckIdSegment = 
      pathSegments[0] === "truck" && 
      index === 1 && 
      router.query.id === segment;
      
    const isDrugIdSegment = 
      pathSegments[0] === "drug" && 
      index === 1 && 
      router.query.id === segment;

    const isDrugGroupIdSegment = 
      pathSegments[0] === "drug-group" && 
      index === 1 && 
      router.query.id === segment;

    const isDrugOrderDetailsSegment =
      pathSegments[0] === "drug-order" &&
      pathSegments[1] === "details" &&
      segment === "details";

    let titleContent: React.ReactNode;

    if (isTreatmentPlanIdSegment) {
      if (loadingCode) titleContent = <Spin size="small" />;
      else titleContent = treatmentPlanCode || segment;
    } else if (isDrugSupplierIdSegment) {
      if (loadingSupplierName) titleContent = <Spin size="small" />;
      else titleContent = supplierName || segment;
    } else if (isCanteenItemIdSegment) {
      if (loadingCanteenItemName) titleContent = <Spin size="small" />;
      else titleContent = canteenItemName || segment;
    } else if (isTruckIdSegment) {
      if (loadingTruckLicensePlate) titleContent = <Spin size="small" />;
      else titleContent = truckLicensePlate || segment;
    } else if (isDrugIdSegment) {
      if (loadingDrugName) titleContent = <Spin size="small" />;
      else titleContent = drugName || segment;
    } else if (isDrugGroupIdSegment) {
      if (loadingDrugGroupName) titleContent = <Spin size="small" />;
      else titleContent = drugGroupName || segment;
    } else if (isDrugOrderDetailsSegment && router.query.id) {
      if (loadingDrugOrderCode) titleContent = <Spin size="small" />;
      else titleContent = drugOrderCode || "Details";
    } else {
      titleContent = segment.charAt(0).toUpperCase() + segment.slice(1);
    }
    
    const isLast = index === pathSegments.length - 1;

    // Special handling for drug-order details page to avoid showing the URL query parameters
    if (pathSegments[0] === "drug-order" && 
        segment.startsWith("details") && 
        segment.includes("?id=")) {
      // Skip this segment as we'll handle it differently
      return;
    }

    // If this is a drug-order details page and we're at the last segment
    if (pathSegments[0] === "drug-order" && 
        pathSegments[1] === "details" && 
        index === 1) {
      // Override with drug order code breadcrumb item
      breadcrumbItems.push({
        title: (
          <span className="font-bold text-gray-500">
            {loadingDrugOrderCode ? <Spin size="small" /> : (drugOrderCode || "Details")}
          </span>
        ),
        // No href for the last item
      });
      return;
    }

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
