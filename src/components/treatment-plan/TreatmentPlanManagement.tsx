import React, { useState, useEffect, useCallback } from "react";
import {
  Form,
  Button,
  Typography,
  Select,
  message,
  Card,
  Tooltip,
  Dropdown,
  Checkbox,
  Modal as AntdModal,
} from "antd";
import {
  PlusOutlined,
  UndoOutlined,
  FileExcelOutlined,
  MedicineBoxOutlined,
  ArrowLeftOutlined,
  FilterOutlined,
  SearchOutlined,
  SettingOutlined,
  AppstoreOutlined,
  TagOutlined,
} from "@ant-design/icons";
import { useRouter } from "next/router";

import TreatmentPlanTable from "./TreatmentPlanTable";
import CreateModal from "./CreateModal";
import ExportConfigModal from "./ExportConfigModal";
import TreatmentPlanFilterModal from "./TreatmentPlanFilterModal";

import {
  getAllTreatmentPlans,
  softDeleteTreatmentPlans,
  restoreSoftDeletedTreatmentPlans,
  cancelTreatmentPlan,
  TreatmentPlanResponseDTO,
  TreatmentPlanExportConfigDTO,
  UserInfo,
  getTreatmentPlanIdsByStatus,
} from "@/api/treatment-plan";
import dayjs from "dayjs";
import * as DrugApi from "@/api/drug";
import * as UserApi from "@/api/user";
import * as HealthCheckResultApi from "@/api/healthcheckresult";

const { Option } = Select;
const { Text, Title } = Typography;

export function TreatmentPlanManagement() {
  const router = useRouter();
  const [messageApi, contextHolder] = message.useMessage();
  const [loading, setLoading] = useState(false);
  const [treatmentPlans, setTreatmentPlans] = useState<
    TreatmentPlanResponseDTO[]
  >([]);
  const [totalItems, setTotalItems] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [createModalVisible, setCreateModalVisible] = useState(false);
  const [exportConfigModalVisible, setExportConfigModalVisible] =
    useState(false);
  const [filterModalVisible, setFilterModalVisible] = useState(false);
  const [selectedTreatmentPlans, setSelectedTreatmentPlans] = useState<
    string[]
  >([]);
  const [searchForm] = Form.useForm();

  // Column visibility state
  const [columnVisibility, setColumnVisibility] = useState<
    Record<string, boolean>
  >({
    treatmentPlanCode: true,
    healthCheckResult: false,
    drug: true,
    treatmentDescription: false,
    instructions: false,
    startDate: true,
    endDate: true,
    status: true,
    createdAt: true,
    createdBy: true,
    updatedAt: false,
    updatedBy: false,
    actions: true,
  });

  // Dropdown open state
  const [dropdownOpen, setDropdownOpen] = useState(false);

  // Search filters
  const [treatmentPlanCodeSearch, setTreatmentPlanCodeSearch] =
    useState<string>("");
  const [healthCheckResultCodeSearch, setHealthCheckResultCodeSearch] =
    useState<string>("");
  const [userSearch, setUserSearch] = useState<string>("");
  const [drugSearch, setDrugSearch] = useState<string>("");
  const [updatedBySearch, setUpdatedBySearch] = useState<string>("");
  const [statusFilter, setStatusFilter] = useState<string>("");
  const [dateRange, setDateRange] = useState<
    [dayjs.Dayjs | null, dayjs.Dayjs | null]
  >([null, null]);
  const [createdDateRange, setCreatedDateRange] = useState<
    [dayjs.Dayjs | null, dayjs.Dayjs | null]
  >([null, null]);
  const [updatedDateRange, setUpdatedDateRange] = useState<
    [dayjs.Dayjs | null, dayjs.Dayjs | null]
  >([null, null]);
  const [sortBy, setSortBy] = useState<string>("CreatedAt");
  const [ascending, setAscending] = useState<boolean>(false);

  // Options for dropdowns
  const [userOptions, setUserOptions] = useState<UserInfo[]>([]);
  const [drugOptions, setDrugOptions] = useState<any[]>([]);
  const [treatmentPlanCodes, setTreatmentPlanCodes] = useState<string[]>([]);
  const [healthCheckCodes, setHealthCheckCodes] = useState<string[]>([]);
  const [updatedByOptions, setUpdatedByOptions] = useState<UserInfo[]>([]);

  // Export config
  const [exportConfig, setExportConfig] =
    useState<TreatmentPlanExportConfigDTO>({
      exportAllPages: false,
      includePatient: true,
      includeHealthCheckCode: true,
      includeDrug: true,
      includeTreatmentDescription: true,
      includeInstructions: true,
      includeStartDate: true,
      includeEndDate: true,
      includeCreatedAt: true,
      includeCreatedBy: true,
      includeUpdatedAt: true,
      includeUpdatedBy: true,
      includeStatus: true,
    });

  // Filter state for the modal
  const [filterState, setFilterState] = useState({
    healthCheckResultCode: "",
    userSearch: "",
    drugSearch: "",
    updatedBySearch: "",
    dateRange: [null, null] as [dayjs.Dayjs | null, dayjs.Dayjs | null],
    createdDateRange: [null, null] as [dayjs.Dayjs | null, dayjs.Dayjs | null],
    updatedDateRange: [null, null] as [dayjs.Dayjs | null, dayjs.Dayjs | null],
    sortBy: "CreatedAt",
    ascending: false,
  });

  // Fetch data when filters change
  useEffect(() => {
    fetchTreatmentPlans();
  }, [
    currentPage,
    pageSize,
    treatmentPlanCodeSearch,
    healthCheckResultCodeSearch,
    userSearch,
    drugSearch,
    updatedBySearch,
    statusFilter,
    dateRange,
    createdDateRange,
    updatedDateRange,
    sortBy,
    ascending,
  ]);

  // Fetch filter options when component mounts
  useEffect(() => {
    fetchFilterOptions();
    // Also perform an initial fetch of dropdown options
    fetchDropdownOptions();
  }, []);

  // Update form values when filters change
  useEffect(() => {
    searchForm.setFieldsValue({
      treatmentPlanCode: treatmentPlanCodeSearch,
      healthCheckResultCode: healthCheckResultCodeSearch,
      userSearch: userSearch,
      drugSearch: drugSearch,
      updatedBySearch: updatedBySearch,
      status: statusFilter,
      dateRange: dateRange,
      createdDateRange: createdDateRange,
      updatedDateRange: updatedDateRange,
      sortBy: sortBy,
      ascending: ascending,
    });
  }, [
    treatmentPlanCodeSearch,
    healthCheckResultCodeSearch,
    userSearch,
    drugSearch,
    updatedBySearch,
    statusFilter,
    dateRange,
    createdDateRange,
    updatedDateRange,
    sortBy,
    ascending,
  ]);

  // Fetch treatment plans with filtering
  const fetchTreatmentPlans = async () => {
    try {
      setLoading(true);

      // Format date ranges for API parameters
      const dateRanges = formatDateRangesForAPI();

      // Prepare API parameters
      const apiParams = {
        page: currentPage,
        pageSize,
        treatmentPlanCodeSearch: treatmentPlanCodeSearch || undefined,
        healthCheckResultCodeSearch: healthCheckResultCodeSearch || undefined,
        userSearch: userSearch || undefined,
        drugSearch: drugSearch || undefined,
        updatedBySearch: updatedBySearch || undefined,
        sortBy: "CreatedAt",
        ascending,
        status: statusFilter || undefined,
        ...dateRanges,
      };

      console.log("API Request Parameters:", apiParams);

      // Call API with parameters
      const response = await getAllTreatmentPlans(
        apiParams.page,
        apiParams.pageSize,
        apiParams.treatmentPlanCodeSearch,
        apiParams.healthCheckResultCodeSearch,
        apiParams.userSearch,
        apiParams.drugSearch,
        apiParams.updatedBySearch,
        apiParams.sortBy,
        apiParams.ascending,
        apiParams.status,
        apiParams.startDate,
        apiParams.endDate,
        apiParams.createdStartDate,
        apiParams.createdEndDate,
        apiParams.updatedStartDate,
        apiParams.updatedEndDate
      );

      console.log("API Response:", response);

      // Check if no data returned
      if (
        !response.data ||
        (Array.isArray(response.data) && response.data.length === 0)
      ) {
        console.log("No data returned with these filters");

        // Provide more specific logging for date filters
        if (dateRanges.startDate || dateRanges.endDate) {
          console.log(
            "Note: Treatment date filter is active. Your data is from 2025 but you might be filtering with 2024 dates."
          );
          console.log(
            "Consider using 'All Time' in date range filter to see all data across years."
          );
        }
      }

      // Extract total count from response
      const totalCount = extractTotalCountFromResponse(response);
      setTotalItems(totalCount);

      // Extract treatment plans from response
      const extractedTreatmentPlans =
        extractTreatmentPlansFromResponse(response);
      setTreatmentPlans(extractedTreatmentPlans);
    } catch (error) {
      console.error("Error fetching treatment plans:", error);
      message.error("Failed to fetch treatment plans");
    } finally {
      setLoading(false);
    }
  };

  // Helper function to format date ranges
  const formatDateRangesForAPI = () => {
    // Format treatment date range
    const startDateFormatted =
      dateRange && dateRange[0] ? dateRange[0].format("YYYY-MM-DD") : undefined;

    const endDateFormatted =
      dateRange && dateRange[1] ? dateRange[1].format("YYYY-MM-DD") : undefined;

    // Format created date range
    const createdStartDateFormatted =
      createdDateRange && createdDateRange[0]
        ? createdDateRange[0].format("YYYY-MM-DD")
        : undefined;

    const createdEndDateFormatted =
      createdDateRange && createdDateRange[1]
        ? createdDateRange[1].format("YYYY-MM-DD")
        : undefined;

    // Format updated date range
    const updatedStartDateFormatted =
      updatedDateRange && updatedDateRange[0]
        ? updatedDateRange[0].format("YYYY-MM-DD")
        : undefined;

    const updatedEndDateFormatted =
      updatedDateRange && updatedDateRange[1]
        ? updatedDateRange[1].format("YYYY-MM-DD")
        : undefined;

    console.log("Formatted date ranges:", {
      dateRange: [startDateFormatted, endDateFormatted],
      createdDateRange: [createdStartDateFormatted, createdEndDateFormatted],
      updatedDateRange: [updatedStartDateFormatted, updatedEndDateFormatted],
    });

    return {
      startDate: startDateFormatted,
      endDate: endDateFormatted,
      createdStartDate: createdStartDateFormatted,
      createdEndDate: createdEndDateFormatted,
      updatedStartDate: updatedStartDateFormatted,
      updatedEndDate: updatedEndDateFormatted,
    };
  };

  // Helper function to extract total count from response
  const extractTotalCountFromResponse = (response: any): number => {
    if (response.totalItems !== undefined) {
      return response.totalItems;
    }
    if (response.totalRecords !== undefined) {
      return response.totalRecords;
    }
    if (response.data?.totalItems !== undefined) {
      return response.data.totalItems;
    }
    if (response.data?.totalCount !== undefined) {
      return response.data.totalCount;
    }
    return 0;
  };

  // Helper function to extract treatment plans from response
  const extractTreatmentPlansFromResponse = (
    response: any
  ): TreatmentPlanResponseDTO[] => {
    if (Array.isArray(response.data)) {
      return response.data;
    }
    if (response.data?.items && Array.isArray(response.data.items)) {
      return response.data.items;
    }
    if (Array.isArray(response)) {
      return response;
    }
    if (response.items && Array.isArray(response.items)) {
      return response.items;
    }

    console.warn(
      "Unexpected response structure for treatment plans:",
      response
    );
    return [];
  };

  // Fetch dropdown options independently from the current filters
  const fetchDropdownOptions = async () => {
    try {
      console.log("Fetching all treatment plans for dropdown options...");
      // Call API without filters to get all possible options
      const response = await getAllTreatmentPlans(
        1,
        1000, // Tăng pageSize lên 1000 để lấy tất cả records
        undefined,
        undefined,
        undefined,
        undefined,
        undefined,
        "CreatedAt",
        false, // Mới nhất trước
        undefined,
        undefined,
        undefined,
        undefined,
        undefined,
        undefined,
        undefined
      );

      if (response.success) {
        let allData = [];

        // Get data from response
        if (Array.isArray(response.data)) {
          allData = response.data;
        } else if (response.data?.items && Array.isArray(response.data.items)) {
          allData = response.data.items;
        } else {
          allData = [];
          console.warn(
            "Unexpected data structure in dropdown options response:",
            response
          );
        }

        console.log(`Fetched ${allData.length} treatment plans for dropdown options`);

        // Extract dropdown options - sắp xếp theo ngày tạo mới nhất trước
        allData.sort((a: TreatmentPlanResponseDTO, b: TreatmentPlanResponseDTO) => {
          return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
        });
        
        // Extract dropdown options
        extractDataFromTreatmentPlans(allData);
      } else {
        console.error("Failed to fetch dropdown options:", response);
      }
    } catch (error) {
      console.error("Error fetching dropdown options:", error);
    }
  };

  // Extract unique data from treatment plans for dropdowns
  const extractDataFromTreatmentPlans = (
    treatmentPlans: TreatmentPlanResponseDTO[]
  ) => {
    if (!treatmentPlans.length) return;

    // Extract unique values
    const uniquePatients = new Map();
    const uniqueDrugs = new Map();
    const uniqueTreatmentPlanCodes = new Set<string>();
    const uniqueHealthCheckCodes = new Set<string>();
    const uniqueUpdatedBy = new Map();

    treatmentPlans.forEach((plan) => {
      // Extract treatment plan code
      if (plan.treatmentPlanCode) {
        uniqueTreatmentPlanCodes.add(plan.treatmentPlanCode);
      }

      // Extract health check code
      if (plan.healthCheckResult?.healthCheckResultCode) {
        uniqueHealthCheckCodes.add(
          plan.healthCheckResult.healthCheckResultCode
        );
      }

      // Extract patient info
      if (plan.healthCheckResult?.user) {
        const user = plan.healthCheckResult.user;
        if (!uniquePatients.has(user.id)) {
          uniquePatients.set(user.id, {
            id: user.id,
            fullName: user.fullName,
            userName: user.userName,
            email: user.email,
            gender: user.gender,
            dob: user.dob,
            address: user.address,
            phone: user.phone,
          });
        }
      }

      // Extract drug info
      if (plan.drug) {
        const drug = plan.drug;
        if (!uniqueDrugs.has(drug.id)) {
          uniqueDrugs.set(drug.id, {
            id: drug.id,
            name: drug.name,
            drugCode: drug.drugCode,
          });
        }
      }

      // Extract updated by info
      if (plan.updatedBy) {
        const updatedBy = plan.updatedBy;
        if (!uniqueUpdatedBy.has(updatedBy.id)) {
          uniqueUpdatedBy.set(updatedBy.id, {
            id: updatedBy.id,
            fullName: updatedBy.fullName,
            userName: updatedBy.userName,
            email: updatedBy.email,
          });
        }
      }
    });

    // Update state with unique data
    setUserOptions(Array.from(uniquePatients.values()));
    setDrugOptions(Array.from(uniqueDrugs.values()));
    setTreatmentPlanCodes(Array.from(uniqueTreatmentPlanCodes));
    setHealthCheckCodes(Array.from(uniqueHealthCheckCodes));
    setUpdatedByOptions(Array.from(uniqueUpdatedBy.values()));
  };

  // Handle form field changes
  const handleFormFieldChange = (field: string, value: any) => {
    switch (field) {
      case "treatmentPlanCode":
        setTreatmentPlanCodeSearch(value);
        break;
      case "healthCheckResultCode":
        setHealthCheckResultCodeSearch(value);
        break;
      case "userSearch":
        setUserSearch(value);
        break;
      case "drugSearch":
        setDrugSearch(value);
        break;
      case "updatedBySearch":
        setUpdatedBySearch(value);
        break;
      case "status":
        setStatusFilter(value);
        break;
      case "dateRange":
        setDateRange(value);
        break;
      case "createdDateRange":
        setCreatedDateRange(value);
        break;
      case "updatedDateRange":
        setUpdatedDateRange(value);
        break;
      case "sortBy":
        setSortBy(value);
        break;
      case "ascending":
        setAscending(value);
        break;
      default:
        break;
    }
    setCurrentPage(1); // Reset to first page when filters change
  };

  // Reset filters
  const handleReset = () => {
    setTreatmentPlanCodeSearch("");
    setHealthCheckResultCodeSearch("");
    setUserSearch("");
    setDrugSearch("");
    setUpdatedBySearch("");
    setStatusFilter("");
    setDateRange([null, null]);
    setCreatedDateRange([null, null]);
    setUpdatedDateRange([null, null]);
    setSortBy("CreatedAt");
    setAscending(false);
    setCurrentPage(1);
  };

  // Pagination
  const handlePageChange = (page: number, newPageSize?: number) => {
    setCurrentPage(page);
    if (newPageSize) setPageSize(newPageSize);
  };

  // Handle create success
  const handleCreateSuccess = () => {
    setCreateModalVisible(false);
    fetchTreatmentPlans();
  };

  // Handle column visibility
  const handleColumnVisibilityChange = (key: string) => {
    setColumnVisibility((prev) => ({
      ...prev,
      [key]: !prev[key],
    }));
  };

  // Toggle all columns visibility
  const toggleAllColumns = (checked: boolean) => {
    const newVisibility = { ...columnVisibility };
    Object.keys(newVisibility).forEach((key) => {
      newVisibility[key] = checked;
    });
    setColumnVisibility(newVisibility);
  };

  // Check if all columns are visible
  const areAllColumnsVisible = () => {
    return Object.values(columnVisibility).every((value) => value === true);
  };

  // Handle soft delete
  const handleSoftDelete = async (id: string) => {
    try {
      const response = await softDeleteTreatmentPlans([id]);
      if (response.success) {
        messageApi.success("Treatment plan soft deleted successfully", 5);
        fetchTreatmentPlans();
      } else {
        messageApi.error(
          response.message || "Failed to soft delete treatment plan",
          5
        );
      }
    } catch (error) {
      console.error("Error soft deleting treatment plan:", error);
      messageApi.error("Failed to soft delete treatment plan", 5);
    }
  };

  // Handle cancel
  const handleCancel = async (id: string, reason: string) => {
    try {
      // Validate reason
      if (!reason || reason.trim() === "") {
        messageApi.error("Cancellation reason is required", 5);
        return Promise.reject("Cancellation reason is required");
      }

      const response = await cancelTreatmentPlan(id, reason);
      if (response.success || response.isSuccess) {
        messageApi.success("Treatment plan cancelled successfully", 5);
        fetchTreatmentPlans();
        return Promise.resolve(response);
      } else {
        messageApi.error(
          response.message || "Failed to cancel treatment plan",
          5
        );
        return Promise.reject(
          response.message || "Failed to cancel treatment plan"
        );
      }
    } catch (error) {
      console.error("Error cancelling treatment plan:", error);
      messageApi.error("Failed to cancel treatment plan", 5);
      return Promise.reject("Failed to cancel treatment plan");
    }
  };

  // Handle restore
  const handleRestore = async (id: string) => {
    try {
      const response = await restoreSoftDeletedTreatmentPlans([id]);
      if (response.success) {
        messageApi.success("Treatment plan restored successfully", 5);
        fetchTreatmentPlans();
      } else {
        messageApi.error(
          response.message || "Failed to restore treatment plan",
          5
        );
      }
    } catch (error) {
      console.error("Error restoring treatment plan:", error);
      messageApi.error("Failed to restore treatment plan", 5);
    }
  };

  // Handle bulk delete
  const handleBulkDelete = async (ids: string[]) => {
    if (ids.length === 0) {
      messageApi.warning("Please select treatment plans to delete", 5);
      return;
    }

    try {
      const response = await softDeleteTreatmentPlans(ids);
      if (response.success) {
        messageApi.success(
          "Selected treatment plans soft deleted successfully",
          5
        );
        setSelectedTreatmentPlans([]);
        fetchTreatmentPlans();
      } else {
        messageApi.error(
          response.message || "Failed to soft delete treatment plans",
          5
        );
      }
    } catch (error) {
      console.error("Error soft deleting treatment plans:", error);
      messageApi.error("Failed to soft delete treatment plans", 5);
    }
  };

  // Handle bulk restore
  const handleBulkRestore = async (ids: string[]) => {
    if (ids.length === 0) {
      messageApi.warning("Please select treatment plans to restore", 5);
      return;
    }

    try {
      const response = await restoreSoftDeletedTreatmentPlans(ids);
      if (response.success) {
        messageApi.success("Selected treatment plans restored successfully", 5);
        setSelectedTreatmentPlans([]);
        fetchTreatmentPlans();
      } else {
        messageApi.error(
          response.message || "Failed to restore treatment plans",
          5
        );
      }
    } catch (error) {
      console.error("Error restoring treatment plans:", error);
      messageApi.error("Failed to restore treatment plans", 5);
    }
  };

  // Filter modal functions
  const handleOpenFilterModal = () => {
    console.log("Opening filter modal with current filters:", {
      healthCheckResultCode: healthCheckResultCodeSearch,
      drugSearch,
      updatedBySearch,
      dateRange,
      createdDateRange,
      updatedDateRange,
      ascending,
    });

    // Thiết lập giá trị state ban đầu với tên key đúng
    setFilterState({
      healthCheckResultCode: healthCheckResultCodeSearch,
      userSearch,
      drugSearch,
      updatedBySearch,
      dateRange,
      createdDateRange,
      updatedDateRange,
      sortBy: "CreatedAt",
      ascending,
    });

    setFilterModalVisible(true);
  };

  const handleApplyFilters = (filters: any) => {
    console.log("Applying filters:", filters);

    // Áp dụng các bộ lọc từ modal - đảm bảo tên biến khớp với tham số API
    setHealthCheckResultCodeSearch(filters.healthCheckResultCodeSearch);
    setDrugSearch(filters.drugSearch);
    setUpdatedBySearch(filters.updatedBySearch);

    // Kiểm tra và xử lý null/undefined cho các date range
    if (filters.dateRange) {
      // Đảm bảo dateRange là mảng có 2 phần tử
      if (Array.isArray(filters.dateRange) && filters.dateRange.length === 2) {
        setDateRange(filters.dateRange);
      } else {
        // Nếu không phải mảng 2 phần tử, set giá trị mặc định [null, null]
        setDateRange([null, null]);
      }
    } else {
      setDateRange([null, null]);
    }

    if (filters.createdDateRange) {
      if (
        Array.isArray(filters.createdDateRange) &&
        filters.createdDateRange.length === 2
      ) {
        setCreatedDateRange(filters.createdDateRange);
      } else {
        setCreatedDateRange([null, null]);
      }
    } else {
      setCreatedDateRange([null, null]);
    }

    if (filters.updatedDateRange) {
      if (
        Array.isArray(filters.updatedDateRange) &&
        filters.updatedDateRange.length === 2
      ) {
        setUpdatedDateRange(filters.updatedDateRange);
      } else {
        setUpdatedDateRange([null, null]);
      }
    } else {
      setUpdatedDateRange([null, null]);
    }

    setAscending(filters.ascending);

    // Đóng modal
    setFilterModalVisible(false);

    // Reset về trang đầu tiên
    setCurrentPage(1);
  };

  const handleResetFilters = () => {
    setHealthCheckResultCodeSearch("");
    setUserSearch("");
    setDrugSearch("");
    setUpdatedBySearch("");
    setStatusFilter("");
    setDateRange([null, null]);
    setCreatedDateRange([null, null]);
    setUpdatedDateRange([null, null]);
    setSortBy("CreatedAt");
    setAscending(false);
    setCurrentPage(1);
    setFilterModalVisible(false);
  };

  // Export config
  const handleOpenExportConfig = () => {
    setExportConfigModalVisible(true);
  };

  const closeExportConfigModal = () => {
    setExportConfigModalVisible(false);
  };

  const handleExportConfigChange = (changedValues: any) => {
    setExportConfig((prev) => ({
      ...prev,
      ...changedValues,
    }));
  };

  // Navigation
  const handleBack = () => {
    router.back();
  };

  // Custom pagination with go to page
  const itemRender = (
    page: number,
    type: "page" | "prev" | "next" | "jump-prev" | "jump-next",
    originalElement: React.ReactNode
  ) => {
    if (type === "prev") {
      return (
        <Button size="small" disabled={currentPage === 1}>
          Previous
        </Button>
      );
    }
    if (type === "next") {
      return (
        <Button
          size="small"
          disabled={currentPage === Math.ceil(totalItems / pageSize)}
        >
          Next
        </Button>
      );
    }
    return originalElement;
  };

  // Thêm chức năng kiểm tra xem các filter đã được áp dụng chưa
  const isFiltersApplied = () => {
    return (
      healthCheckResultCodeSearch !== "" ||
      userSearch !== "" ||
      drugSearch !== "" ||
      updatedBySearch !== "" ||
      dateRange[0] !== null ||
      dateRange[1] !== null ||
      createdDateRange[0] !== null ||
      createdDateRange[1] !== null ||
      updatedDateRange[0] !== null ||
      updatedDateRange[1] !== null ||
      sortBy !== "CreatedAt" ||
      ascending !== false
    );
  };

  // Handle dropdown visibility
  const handleDropdownVisibleChange = (visible: boolean) => {
    setDropdownOpen(visible);
  };

  // Prevent dropdown from closing when clicking checkboxes
  const handleMenuClick = (e: React.MouseEvent) => {
    e.stopPropagation();
  };

  // Function to get all treatment plan IDs by status - for select all functionality
  const getAllTreatmentPlanIdsByStatus = async (statuses: string[]) => {
    try {
      return await getTreatmentPlanIdsByStatus(statuses);
    } catch (error) {
      console.error("Error getting all treatment plan IDs by status:", error);
      return [];
    }
  };

  // Hàm này được gọi khi component mount để tải các tùy chọn filter
  const fetchFilterOptions = async () => {
    try {
      // Fetch drug options
      const drugsResponse = await DrugApi.getDrugs();
      console.log("Fetched drug options:", drugsResponse);
      if (drugsResponse && Array.isArray(drugsResponse)) {
        setDrugOptions(drugsResponse);
      }

      // Fetch user options (for updatedBy filter)
      const usersResponse = await UserApi.getUsers();
      console.log("Fetched user options:", usersResponse);
      if (usersResponse && Array.isArray(usersResponse)) {
        setUpdatedByOptions(usersResponse);
      }

      // Fetch health check codes
      const healthChecksResponse =
        await HealthCheckResultApi.getAllHealthCheckResults();
      console.log("Fetched health check options:", healthChecksResponse);
      if (healthChecksResponse && Array.isArray(healthChecksResponse)) {
        const codes = healthChecksResponse.map(
          (item: any) => item.healthCheckResultCode
        );
        setHealthCheckCodes(codes);
      }
    } catch (error) {
      console.error("Error fetching filter options:", error);
    }
  };

  return (
    <div className="history-container" style={{ padding: "20px" }}>
      {contextHolder}
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Button
            icon={<ArrowLeftOutlined />}
            onClick={handleBack}
            style={{ marginRight: "8px" }}
          >
            Back
          </Button>
          <MedicineBoxOutlined style={{ fontSize: "24px" }} />
          <h3 className="text-xl font-bold">Treatment Plan Management</h3>
        </div>
      </div>

      {/* Search and Filters Toolbar */}
      <Card
        className="shadow mb-4"
        bodyStyle={{ padding: "16px" }}
        title={
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "8px",
              padding: "16px",
            }}
          >
            <AppstoreOutlined />
            <span>Toolbar</span>
          </div>
        }
      >
        <div className="mb-3 flex items-center justify-between">
          <div className="flex items-center gap-4">
            {/* Treatment Plan Code Search */}
            <Select
              showSearch
              placeholder="Search Treatment Plan Code"
              value={treatmentPlanCodeSearch || undefined}
              onChange={(value) => {
                setTreatmentPlanCodeSearch(value || "");
                setCurrentPage(1);
                setLoading(true);
              }}
              style={{ width: "320px" }}
              allowClear
              filterOption={(input, option) =>
                (option?.value?.toString().toLowerCase() || "").includes(
                  input.toLowerCase()
                )
              }
              options={treatmentPlanCodes.map((code) => ({
                value: code,
                label: code,
              }))}
              dropdownStyle={{ minWidth: "320px" }}
            />

            {/* Advanced Filters */}
            <Tooltip title="Advanced Filters">
              <Button
                icon={
                  <FilterOutlined
                    style={{
                      color:
                        healthCheckResultCodeSearch ||
                        userSearch ||
                        drugSearch ||
                        updatedBySearch ||
                        (dateRange && (dateRange[0] || dateRange[1])) ||
                        (createdDateRange &&
                          (createdDateRange[0] || createdDateRange[1])) ||
                        (updatedDateRange &&
                          (updatedDateRange[0] || updatedDateRange[1]))
                          ? "#1890ff"
                          : undefined,
                    }}
                  />
                }
                onClick={handleOpenFilterModal}
              >
                Filters
              </Button>
            </Tooltip>

            {/* Status */}
            <div>
              <Select
                placeholder={
                  <div style={{ display: "flex", alignItems: "center" }}>
                    <TagOutlined style={{ marginRight: 8 }} />
                    <span>Status</span>
                  </div>
                }
                allowClear
                style={{ width: "120px" }}
                value={statusFilter || undefined}
                onChange={(value) => {
                  setStatusFilter(value || "");
                  setCurrentPage(1);
                  setLoading(true);
                }}
                disabled={loading}
              >
                <Option value="InProgress">In Progress</Option>
                <Option value="Completed">Completed</Option>
                <Option value="Cancelled">Cancelled</Option>
                <Option value="SoftDeleted">Soft Deleted</Option>
              </Select>
            </div>

            {/* Reset Button */}
            <Tooltip title="Reset All Filters">
              <Button
                icon={<UndoOutlined />}
                onClick={handleReset}
                disabled={
                  !(
                    treatmentPlanCodeSearch ||
                    healthCheckResultCodeSearch ||
                    userSearch ||
                    drugSearch ||
                    updatedBySearch ||
                    statusFilter ||
                    dateRange[0] ||
                    dateRange[1] ||
                    createdDateRange[0] ||
                    createdDateRange[1] ||
                    updatedDateRange[0] ||
                    updatedDateRange[1]
                  )
                }
              >
                Reset
              </Button>
            </Tooltip>

            {/* Column Settings */}
            <Dropdown
              menu={{
                items: [
                  {
                    key: "selectAll",
                    label: (
                      <div onClick={handleMenuClick}>
                        <Checkbox
                          checked={areAllColumnsVisible()}
                          onChange={(e) => toggleAllColumns(e.target.checked)}
                        >
                          <strong>Show All Columns</strong>
                        </Checkbox>
                      </div>
                    ),
                  },
                  {
                    key: "divider",
                    type: "divider",
                  },
                  {
                    key: "treatmentPlanCode",
                    label: (
                      <div onClick={handleMenuClick}>
                        <Checkbox
                          checked={columnVisibility.treatmentPlanCode}
                          onChange={() =>
                            handleColumnVisibilityChange("treatmentPlanCode")
                          }
                        >
                          Treatment Plan Code
                        </Checkbox>
                      </div>
                    ),
                  },
                  {
                    key: "healthCheckResult",
                    label: (
                      <div onClick={handleMenuClick}>
                        <Checkbox
                          checked={columnVisibility.healthCheckResult}
                          onChange={() =>
                            handleColumnVisibilityChange("healthCheckResult")
                          }
                        >
                          Health Check Result
                        </Checkbox>
                      </div>
                    ),
                  },
                  {
                    key: "drug",
                    label: (
                      <div onClick={handleMenuClick}>
                        <Checkbox
                          checked={columnVisibility.drug}
                          onChange={() => handleColumnVisibilityChange("drug")}
                        >
                          Drug
                        </Checkbox>
                      </div>
                    ),
                  },
                  {
                    key: "treatmentDescription",
                    label: (
                      <div onClick={handleMenuClick}>
                        <Checkbox
                          checked={columnVisibility.treatmentDescription}
                          onChange={() =>
                            handleColumnVisibilityChange("treatmentDescription")
                          }
                        >
                          Treatment Description
                        </Checkbox>
                      </div>
                    ),
                  },
                  {
                    key: "instructions",
                    label: (
                      <div onClick={handleMenuClick}>
                        <Checkbox
                          checked={columnVisibility.instructions}
                          onChange={() =>
                            handleColumnVisibilityChange("instructions")
                          }
                        >
                          Instructions
                        </Checkbox>
                      </div>
                    ),
                  },
                  {
                    key: "startDate",
                    label: (
                      <div onClick={handleMenuClick}>
                        <Checkbox
                          checked={columnVisibility.startDate}
                          onChange={() =>
                            handleColumnVisibilityChange("startDate")
                          }
                        >
                          Start Date
                        </Checkbox>
                      </div>
                    ),
                  },
                  {
                    key: "endDate",
                    label: (
                      <div onClick={handleMenuClick}>
                        <Checkbox
                          checked={columnVisibility.endDate}
                          onChange={() =>
                            handleColumnVisibilityChange("endDate")
                          }
                        >
                          End Date
                        </Checkbox>
                      </div>
                    ),
                  },
                  {
                    key: "status",
                    label: (
                      <div onClick={handleMenuClick}>
                        <Checkbox
                          checked={columnVisibility.status}
                          onChange={() =>
                            handleColumnVisibilityChange("status")
                          }
                        >
                          Status
                        </Checkbox>
                      </div>
                    ),
                  },
                  {
                    key: "createdAt",
                    label: (
                      <div onClick={handleMenuClick}>
                        <Checkbox
                          checked={columnVisibility.createdAt}
                          onChange={() =>
                            handleColumnVisibilityChange("createdAt")
                          }
                        >
                          Created At
                        </Checkbox>
                      </div>
                    ),
                  },
                  {
                    key: "createdBy",
                    label: (
                      <div onClick={handleMenuClick}>
                        <Checkbox
                          checked={columnVisibility.createdBy}
                          onChange={() =>
                            handleColumnVisibilityChange("createdBy")
                          }
                        >
                          Created By
                        </Checkbox>
                      </div>
                    ),
                  },
                  {
                    key: "updatedAt",
                    label: (
                      <div onClick={handleMenuClick}>
                        <Checkbox
                          checked={columnVisibility.updatedAt}
                          onChange={() =>
                            handleColumnVisibilityChange("updatedAt")
                          }
                        >
                          Updated At
                        </Checkbox>
                      </div>
                    ),
                  },
                  {
                    key: "updatedBy",
                    label: (
                      <div onClick={handleMenuClick}>
                        <Checkbox
                          checked={columnVisibility.updatedBy}
                          onChange={() =>
                            handleColumnVisibilityChange("updatedBy")
                          }
                        >
                          Updated By
                        </Checkbox>
                      </div>
                    ),
                  },
                  {
                    key: "actions",
                    label: (
                      <div onClick={handleMenuClick}>
                        <Checkbox
                          checked={columnVisibility.actions}
                          onChange={() =>
                            handleColumnVisibilityChange("actions")
                          }
                        >
                          Actions
                        </Checkbox>
                      </div>
                    ),
                  },
                ],
                onClick: (e) => {
                  // Prevent dropdown from closing
                  e.domEvent.stopPropagation();
                },
              }}
              trigger={["hover", "click"]}
              placement="bottomRight"
              arrow
              open={dropdownOpen}
              onOpenChange={handleDropdownVisibleChange}
              mouseEnterDelay={0.1}
              mouseLeaveDelay={0.3}
            >
              <Tooltip title="Column Settings">
                <Button icon={<SettingOutlined />}>Columns</Button>
              </Tooltip>
            </Dropdown>

            {/* Create Button */}
            <Button
              type="primary"
              icon={<PlusOutlined />}
              onClick={() => setCreateModalVisible(true)}
              disabled={loading}
            >
              Create
            </Button>
          </div>

          <div>
            <Button
              type="primary"
              icon={<FileExcelOutlined />}
              onClick={handleOpenExportConfig}
              disabled={loading}
            >
              Export to Excel
            </Button>
          </div>
        </div>
      </Card>

      {/* Data Table */}
      <TreatmentPlanTable
        loading={loading}
        treatmentPlans={treatmentPlans}
        totalItems={totalItems}
        currentPage={currentPage}
        pageSize={pageSize}
        handlePageChange={handlePageChange}
        selectedRowKeys={selectedTreatmentPlans}
        setSelectedRowKeys={setSelectedTreatmentPlans}
        handleSoftDelete={handleSoftDelete}
        handleRestore={handleRestore}
        handleCancel={handleCancel}
        columnVisibility={columnVisibility}
        handleBulkDelete={handleBulkDelete}
        handleBulkRestore={handleBulkRestore}
        getAllTreatmentPlanIdsByStatus={getAllTreatmentPlanIdsByStatus}
      />

      {/* Modals */}
      <CreateModal
        visible={createModalVisible}
        onClose={() => setCreateModalVisible(false)}
        onSuccess={handleCreateSuccess}
        userOptions={userOptions}
        drugOptions={drugOptions}
      />

      <ExportConfigModal
        visible={exportConfigModalVisible}
        onClose={closeExportConfigModal}
        config={exportConfig}
        onChange={handleExportConfigChange}
        filters={{
          currentPage,
          pageSize,
          treatmentPlanCodeSearch,
          healthCheckResultCodeSearch,
          userSearch,
          drugSearch,
          updatedBySearch,
          sortBy,
          ascending,
          statusFilter,
          dateRange,
          createdDateRange,
          updatedDateRange,
        }}
        treatmentPlanCodes={treatmentPlanCodes}
        healthCheckCodes={healthCheckCodes}
        drugOptions={drugOptions}
        updatedByOptions={updatedByOptions}
      />

      <TreatmentPlanFilterModal
        visible={filterModalVisible}
        onCancel={() => setFilterModalVisible(false)}
        onApply={handleApplyFilters}
        onReset={handleResetFilters}
        filters={filterState}
        treatmentPlanCodes={treatmentPlanCodes}
        healthCheckCodes={healthCheckCodes}
        userOptions={userOptions}
        drugOptions={drugOptions}
        updatedByOptions={updatedByOptions}
      />
    </div>
  );
}

export default TreatmentPlanManagement;
