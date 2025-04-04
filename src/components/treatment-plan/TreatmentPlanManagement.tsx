import React, { useState, useEffect } from "react";
import {
  Form,
  Button,
  Space,
  Typography,
  Select,
  message,
  Card,
  Tooltip,
  Input,
  Pagination,
  InputNumber,
  Dropdown,
  Checkbox,
} from "antd";
import {
  PlusOutlined,
  DeleteOutlined,
  UndoOutlined,
  FileExcelOutlined,
  MedicineBoxOutlined,
  ArrowLeftOutlined,
  FilterOutlined,
  SearchOutlined,
  ToolOutlined,
  SettingOutlined,
  AppstoreOutlined,
  TagOutlined,
  CheckSquareOutlined,
  FlagOutlined,
} from "@ant-design/icons";
import { toast } from "react-toastify";
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
} from "@/api/treatment-plan";
import dayjs from "dayjs";

const { Option } = Select;
const { Text, Title } = Typography;

export function TreatmentPlanManagement() {
  const router = useRouter();
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

  // Fetch treatment plans from API
  const fetchTreatmentPlans = async () => {
    setLoading(true);
    try {
      const startDate = dateRange?.[0]?.format("YYYY-MM-DD");
      const endDate = dateRange?.[1]?.format("YYYY-MM-DD");
      const createdStartDate = createdDateRange?.[0]?.format("YYYY-MM-DD");
      const createdEndDate = createdDateRange?.[1]?.format("YYYY-MM-DD");
      const updatedStartDate = updatedDateRange?.[0]?.format("YYYY-MM-DD");
      const updatedEndDate = updatedDateRange?.[1]?.format("YYYY-MM-DD");

      const response = await getAllTreatmentPlans(
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
        startDate,
        endDate,
        createdStartDate,
        createdEndDate,
        updatedStartDate,
        updatedEndDate
      );

      if (response.success || response.isSuccess) {
        let treatmentPlanData: TreatmentPlanResponseDTO[] = [];

        if (Array.isArray(response.data)) {
          treatmentPlanData = response.data;
          setTreatmentPlans(response.data);
          setTotalItems(response.totalRecords || 0);
        } else if (response.data && Array.isArray(response.data.items)) {
          treatmentPlanData = response.data.items;
          setTreatmentPlans(response.data.items);
          setTotalItems(
            response.data.totalItems || response.data.totalCount || 0
          );
        } else {
          console.error("Unexpected data structure:", response.data);
          setTreatmentPlans([]);
          setTotalItems(0);
          toast.error("Unexpected data structure received");
        }

        // Extract unique data for dropdowns
        extractDataFromTreatmentPlans(treatmentPlanData);
      } else {
        toast.error(response.message || "Failed to fetch treatment plans");
      }
    } catch (error) {
      console.error("Error fetching treatment plans:", error);
      toast.error("Failed to fetch treatment plans");
    } finally {
      setLoading(false);
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
        toast.success("Treatment plan soft deleted successfully");
        fetchTreatmentPlans();
      } else {
        toast.error(response.message || "Failed to soft delete treatment plan");
      }
    } catch (error) {
      console.error("Error soft deleting treatment plan:", error);
      toast.error("Failed to soft delete treatment plan");
    }
  };

  // Handle restore
  const handleRestore = async (id: string) => {
    try {
      const response = await restoreSoftDeletedTreatmentPlans([id]);
      if (response.success) {
        toast.success("Treatment plan restored successfully");
        fetchTreatmentPlans();
      } else {
        toast.error(response.message || "Failed to restore treatment plan");
      }
    } catch (error) {
      console.error("Error restoring treatment plan:", error);
      toast.error("Failed to restore treatment plan");
    }
  };

  // Handle cancel
  const handleCancel = async (id: string, reason: string) => {
    try {
      const response = await cancelTreatmentPlan(id, reason);
      if (response.success) {
        toast.success("Treatment plan cancelled successfully");
        fetchTreatmentPlans();
      } else {
        toast.error(response.message || "Failed to cancel treatment plan");
      }
    } catch (error) {
      console.error("Error cancelling treatment plan:", error);
      toast.error("Failed to cancel treatment plan");
    }
  };

  // Handle bulk delete
  const handleBulkDelete = async () => {
    if (selectedTreatmentPlans.length === 0) {
      toast.warning("Please select treatment plans to delete");
      return;
    }

    try {
      const response = await softDeleteTreatmentPlans(selectedTreatmentPlans);
      if (response.success) {
        toast.success("Selected treatment plans soft deleted successfully");
        setSelectedTreatmentPlans([]);
        fetchTreatmentPlans();
      } else {
        toast.error(
          response.message || "Failed to soft delete treatment plans"
        );
      }
    } catch (error) {
      console.error("Error soft deleting treatment plans:", error);
      toast.error("Failed to soft delete treatment plans");
    }
  };

  // Handle bulk restore
  const handleBulkRestore = async () => {
    if (selectedTreatmentPlans.length === 0) {
      toast.warning("Please select treatment plans to restore");
      return;
    }

    try {
      const response = await restoreSoftDeletedTreatmentPlans(
        selectedTreatmentPlans
      );
      if (response.success) {
        toast.success("Selected treatment plans restored successfully");
        setSelectedTreatmentPlans([]);
        fetchTreatmentPlans();
      } else {
        toast.error(response.message || "Failed to restore treatment plans");
      }
    } catch (error) {
      console.error("Error restoring treatment plans:", error);
      toast.error("Failed to restore treatment plans");
    }
  };

  // Filter modal functions
  const openFilterModal = () => {
    setFilterState({
      healthCheckResultCode: healthCheckResultCodeSearch,
      userSearch: userSearch,
      drugSearch: drugSearch,
      updatedBySearch: updatedBySearch,
      dateRange: dateRange as [dayjs.Dayjs | null, dayjs.Dayjs | null],
      createdDateRange: createdDateRange as [
        dayjs.Dayjs | null,
        dayjs.Dayjs | null
      ],
      updatedDateRange: updatedDateRange as [
        dayjs.Dayjs | null,
        dayjs.Dayjs | null
      ],
      sortBy: sortBy,
      ascending: ascending,
    });
    setFilterModalVisible(true);
  };

  const handleApplyFilters = (filters: any) => {
    setHealthCheckResultCodeSearch(filters.healthCheckResultCode || "");
    setUserSearch(filters.userSearch || "");
    setDrugSearch(filters.drugSearch || "");
    setUpdatedBySearch(filters.updatedBySearch || "");
    setDateRange(filters.dateRange || [null, null]);
    setCreatedDateRange(filters.createdDateRange || [null, null]);
    setUpdatedDateRange(filters.updatedDateRange || [null, null]);
    setSortBy(filters.sortBy || "CreatedAt");
    setAscending(filters.ascending || false);
    setCurrentPage(1);
    setFilterModalVisible(false);
  };

  const handleResetFilters = () => {
    handleReset();
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

  return (
    <div className="history-container" style={{ padding: "20px" }}>
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
              style={{ width: "300px" }}
              allowClear
              filterOption={(input, option) =>
                (option?.label?.toString().toLowerCase() || "").includes(
                  input.toLowerCase()
                )
              }
              options={treatmentPlanCodes.map((code) => ({
                value: code,
                label: code,
              }))}
              prefix={<SearchOutlined />}
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
                onClick={openFilterModal}
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

        {/* Bulk Actions - Only show when items are selected */}
        {selectedTreatmentPlans.length > 0 && (
          <div className="mt-2">
            <Space>
              <Button
                danger
                icon={<DeleteOutlined />}
                onClick={handleBulkDelete}
                disabled={loading}
              >
                Bulk Delete
              </Button>
              <Button
                icon={<UndoOutlined />}
                onClick={handleBulkRestore}
                disabled={loading}
              >
                Bulk Restore
              </Button>
              <span className="ml-2 text-gray-500">
                {selectedTreatmentPlans.length} items selected
              </span>
            </Space>
          </div>
        )}
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
