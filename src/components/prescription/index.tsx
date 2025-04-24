import React, { useState, useEffect, useCallback, useRef } from "react";
import {
  Button,
  Table,
  Input,
  Select,
  DatePicker,
  Pagination,
  Popconfirm,
  Dropdown,
  Menu,
  Checkbox,
  Space,
  Row,
  Col,
  Card,
  Typography,
  Badge,
  Tag,
  Tooltip,
  Statistic,
  Divider,
  Empty,
  Spin,
  Modal,
  Form,
  Alert,
  message,
} from "antd";
import moment from "moment";
import {
  getAllPrescriptions,
  PrescriptionResponseDTO,
  softDeletePrescriptions,
  restoreSoftDeletedPrescriptions,
  cancelPrescription,
  updatePrescription,
} from "@/api/prescription";
import { getUsers, UserProfile } from "@/api/user";
import { getDrugs, DrugResponse } from "@/api/drug";
import { useRouter } from "next/router";
import CreateModal from "./CreateModal";
import ExportConfigModal from "./ExportConfigModal";
import ConfirmCancelPrescriptionModal from "./ConfirmCancelPrescriptionModal";
import PageContainer from "../shared/PageContainer";
import PaginationFooter from "../shared/PaginationFooter";
import TableControls, {
  createDeleteBulkAction,
  createRestoreBulkAction,
} from "../shared/TableControls";
import ToolbarCard from "../shared/ToolbarCard";
import {
  DownOutlined,
  SearchOutlined,
  SettingOutlined,
  PlusOutlined,
  ExportOutlined,
  EyeOutlined,
  FormOutlined,
  CheckCircleOutlined,
  CloseCircleOutlined,
  DeleteOutlined,
  FilterOutlined,
  LineChartOutlined,
  CalendarOutlined,
  FieldTimeOutlined,
  CheckSquareOutlined,
  CloseSquareOutlined,
  PieChartOutlined,
  BarChartOutlined,
  UndoOutlined,
  MedicineBoxOutlined,
  MoreOutlined,
  TagOutlined,
  AppstoreOutlined,
  FileExcelOutlined,
  ArrowLeftOutlined,
} from "@ant-design/icons";
import { ColumnType } from "antd/es/table";
import PrescriptionFilterModal from "./PrescriptionFilterModal";

const { Option } = Select;
const { RangePicker } = DatePicker;
const { Title, Text } = Typography;

// Define status constants
const PRESCRIPTION_STATUS = {
  DISPENSED: "Dispensed",
  UPDATED: "Updated",
  USED: "Used",
  UPDATED_AND_USED: "UpdatedAndUsed",
  INACTIVE: "Inactive",
  CANCELLED: "Cancelled",
  SOFT_DELETED: "SoftDeleted",
};

// Helper functions
const formatDate = (date: string | undefined) => {
  if (!date) return "";
  return moment(date).format("DD/MM/YYYY");
};

const formatDateTime = (datetime: string | undefined) => {
  if (!datetime) return "";
  return moment(datetime).format("DD/MM/YYYY HH:mm:ss");
};

const DEFAULT_VISIBLE_COLUMNS = [
  "prescriptionCode",
  "healthCheckResultCode",
  "user",
  "prescriptionDate",
  "staff",
  "createdAt",
  "updatedAt",
  "updatedBy",
  "status",
  "actions",
];

const DEFAULT_EXPORT_CONFIG = {
  exportAllPages: true,
  includePatient: true,
  includeHealthCheckCode: true,
  includePrescriptionCode: true,
  includePrescriptionDate: true,
  includeHealthcareStaff: true,
  includeMedications: true,
  includeStatus: true,
  includeCreatedAt: true,
  includeUpdatedAt: true,
  includeUpdatedBy: true,
};

const getStatusColor = (status: string | undefined) => {
  switch (status) {
    case PRESCRIPTION_STATUS.DISPENSED:
      return "processing";
    case PRESCRIPTION_STATUS.UPDATED:
      return "warning";
    case PRESCRIPTION_STATUS.USED:
      return "success";
    case PRESCRIPTION_STATUS.UPDATED_AND_USED:
      return "success";
    case PRESCRIPTION_STATUS.INACTIVE:
      return "default";
    case PRESCRIPTION_STATUS.CANCELLED:
      return "error";
    case PRESCRIPTION_STATUS.SOFT_DELETED:
      return "default";
    default:
      return "default";
  }
};

// Component definition
export function PrescriptionManagement() {
  const router = useRouter();
  const [prescriptions, setPrescriptions] = useState<PrescriptionResponseDTO[]>(
    []
  );
  const [loading, setLoading] = useState(false);
  const [isCreateModalVisible, setIsCreateModalVisible] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [total, setTotal] = useState(0);
  const [prescriptionCodeSearch, setPrescriptionCodeSearch] = useState("");
  const [healthCheckResultCodeSearch, setHealthCheckResultCodeSearch] =
    useState("");
  const [userSearch, setUserSearch] = useState("");
  const [staffSearch, setStaffSearch] = useState("");
  const [drugSearch, setDrugSearch] = useState("");
  const [updatedBySearch, setUpdatedBySearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<string | undefined>(
    undefined
  );
  const [sortBy, setSortBy] = useState("PrescriptionDate");
  const [ascending, setAscending] = useState(false);
  const [visibleColumns, setVisibleColumns] = useState<string[]>(
    DEFAULT_VISIBLE_COLUMNS
  );
  const [selectedRowKeys, setSelectedRowKeys] = useState<React.Key[]>([]);
  const [prescriptionDateRange, setPrescriptionDateRange] = useState<
    [moment.Moment | null, moment.Moment | null]
  >([null, null]);
  const [createdDateRange, setCreatedDateRange] = useState<
    [moment.Moment | null, moment.Moment | null]
  >([null, null]);
  const [updatedDateRange, setUpdatedDateRange] = useState<
    [moment.Moment | null, moment.Moment | null]
  >([null, null]);
  const [userOptions, setUserOptions] = useState<
    { id: string; fullName: string; email: string }[]
  >([]);
  const [staffOptions, setStaffOptions] = useState<
    { id: string; fullName: string; email: string }[]
  >([]);
  const [drugOptions, setDrugOptions] = useState<DrugResponse[]>([]);
  const [showExportConfigModal, setShowExportConfigModal] = useState(false);
  const [exportLoading, setExportLoading] = useState(false);
  const [exportConfig, setExportConfig] = useState(DEFAULT_EXPORT_CONFIG);
  const [form] = Form.useForm();

  // States for tracking bulk actions
  const [deletingItems, setDeletingItems] = useState(false);
  const [restoringItems, setRestoringItems] = useState(false);

  // State to track what type of items are selected
  const [selectedItemTypes, setSelectedItemTypes] = useState({
    hasDeletable: false,
    hasRestorable: false,
  });

  // Add these states to the component
  const [filterModalVisible, setFilterModalVisible] = useState(false);
  const [filterState, setFilterState] = useState({
    healthCheckResultCodeSearch: healthCheckResultCodeSearch,
    userSearch: userSearch,
    staffSearch: staffSearch,
    drugSearch: drugSearch,
    updatedBySearch: updatedBySearch,
    prescriptionDateRange: prescriptionDateRange,
    createdDateRange: createdDateRange,
    updatedDateRange: updatedDateRange,
    sortBy: sortBy,
    ascending: ascending,
  });

  // Extract unique health check codes for the filter dropdown
  const healthCheckCodes = React.useMemo(() => {
    const codes = prescriptions
      .map((p) => p.healthCheckResult?.healthCheckResultCode)
      .filter((code): code is string => Boolean(code)); // Type guard to ensure non-null, non-undefined values
    return [...new Set(codes)];
  }, [prescriptions]);

  // Extract unique prescription codes for the filter dropdown
  const prescriptionCodes = React.useMemo(() => {
    const codes = prescriptions
      .map((p) => p.prescriptionCode)
      .filter((code): code is string => Boolean(code)); // Type guard to ensure non-null, non-undefined values
    return [...new Set(codes)];
  }, [prescriptions]);

  // Update selected item types when selectedRowKeys changes
  useEffect(() => {
    if (selectedRowKeys.length === 0) {
      setSelectedItemTypes({
        hasDeletable: false,
        hasRestorable: false,
      });
      return;
    }

    const selectedItems = prescriptions.filter((item) =>
      selectedRowKeys.includes(item.id)
    );

    const hasDeletable = selectedItems.some(
      (item) =>
        item.status === PRESCRIPTION_STATUS.USED ||
        item.status === PRESCRIPTION_STATUS.UPDATED_AND_USED
    );

    const hasRestorable = selectedItems.some(
      (item) => item.status === PRESCRIPTION_STATUS.SOFT_DELETED
    );

    setSelectedItemTypes({
      hasDeletable,
      hasRestorable,
    });
  }, [selectedRowKeys, prescriptions]);

  // Fetch data
  const fetchPrescriptions = useCallback(async () => {
    setLoading(true);
    try {
      // Lấy các giá trị hiện tại của state thay vì dựa vào closure
      const currentFilters = {
        prescriptionCodeSearch,
        healthCheckResultCodeSearch,
        userSearch,
        staffSearch,
        drugSearch,
        updatedBySearch,
        sortBy,
        ascending,
        statusFilter,
        prescriptionDateRange,
        createdDateRange,
        updatedDateRange
      };

      console.log("Fetching with filters:", currentFilters);

      const prescriptionStartDate =
        currentFilters.prescriptionDateRange[0]?.format("YYYY-MM-DD");
      const prescriptionEndDate =
        currentFilters.prescriptionDateRange[1]?.format("YYYY-MM-DD");
      const createdStartDate = currentFilters.createdDateRange[0]?.format("YYYY-MM-DD");
      const createdEndDate = currentFilters.createdDateRange[1]?.format("YYYY-MM-DD");
      const updatedStartDate = currentFilters.updatedDateRange[0]?.format("YYYY-MM-DD");
      const updatedEndDate = currentFilters.updatedDateRange[1]?.format("YYYY-MM-DD");

      const response = await getAllPrescriptions(
        currentPage,
        pageSize,
        currentFilters.prescriptionCodeSearch,
        currentFilters.healthCheckResultCodeSearch,
        currentFilters.userSearch,
        currentFilters.staffSearch,
        currentFilters.drugSearch,
        currentFilters.updatedBySearch,
        currentFilters.sortBy,
        currentFilters.ascending,
        currentFilters.statusFilter,
        prescriptionStartDate,
        prescriptionEndDate,
        createdStartDate,
        createdEndDate,
        updatedStartDate,
        updatedEndDate
      );

      console.log("API Response:", response);

      if (response.success) {
        console.log("Setting prescriptions:", response.data);
        setPrescriptions(response.data.items || response.data);
        setTotal(response.data.totalCount || response.data.length || 0);
      } else {
        message.error("Failed to fetch prescriptions");
      }
    } catch (error) {
      console.error("Error fetching prescriptions:", error);
      message.error("Failed to fetch prescriptions");
    } finally {
      setLoading(false);
    }
  }, [
    currentPage,
    pageSize,
    prescriptionCodeSearch,
    healthCheckResultCodeSearch,
    userSearch,
    staffSearch,
    drugSearch,
    updatedBySearch,
    sortBy,
    ascending,
    statusFilter,
    prescriptionDateRange,
    createdDateRange,
    updatedDateRange,
  ]);

  const fetchUsers = useCallback(async () => {
    try {
      const users = await getUsers();
      setUserOptions(
        users
          .filter((user: UserProfile) => user.roles.includes("User"))
          .map((user: UserProfile) => ({
            id: user.id,
            fullName: user.fullName,
            email: user.email,
          }))
      );

      setStaffOptions(
        users
          .filter((user: UserProfile) =>
            user.roles.includes("Healthcare Staff")
          )
          .map((user: UserProfile) => ({
            id: user.id,
            fullName: user.fullName,
            email: user.email,
          }))
      );
    } catch (error) {
      console.error("Error fetching users:", error);
      message.error("Failed to fetch users");
    }
  }, []);

  const fetchDrugs = useCallback(async () => {
    try {
      const drugs = await getDrugs();
      setDrugOptions(drugs);
    } catch (error) {
      console.error("Error fetching drugs:", error);
      message.error("Failed to fetch drugs");
    }
  }, []);

  useEffect(() => {
    fetchPrescriptions();
    fetchUsers();
    fetchDrugs();
  }, []);

  useEffect(() => {
    fetchPrescriptions();
  }, [currentPage, pageSize, sortBy, ascending, statusFilter]);

  // Display functions
  const handleSearch = () => {
    setCurrentPage(1);
    fetchPrescriptions();
  };

  const handleReset = () => {
    console.log("Executing reset all filters");
    
    // Tạo các giá trị filter mặc định
    const emptyFilters = {
      healthCheckResultCodeSearch: "",
      prescriptionCodeSearch: "",
      userSearch: "",
      staffSearch: "",
      drugSearch: "",
      updatedBySearch: "",
      prescriptionDateRange: [null, null] as [moment.Moment | null, moment.Moment | null],
      createdDateRange: [null, null] as [moment.Moment | null, moment.Moment | null],
      updatedDateRange: [null, null] as [moment.Moment | null, moment.Moment | null],
      sortBy: "PrescriptionDate",
      ascending: false,
    };
    
    // Cập nhật state filterState
    setFilterState(emptyFilters);
    
    // Reset tất cả các trạng thái filter
    setPrescriptionCodeSearch("");
    setHealthCheckResultCodeSearch("");
    setUserSearch("");
    setStaffSearch("");
    setDrugSearch("");
    setUpdatedBySearch("");
    setStatusFilter(undefined);
    setPrescriptionDateRange([null, null]);
    setCreatedDateRange([null, null]);
    setUpdatedDateRange([null, null]);
    setSortBy("PrescriptionDate");
    setAscending(false);
    
    // Reset về trang đầu tiên
    setCurrentPage(1);
    
    // Tải dữ liệu mới
    const fetchData = async () => {
      try {
        setLoading(true);
        console.log("Fetching data after reset");
        
        const response = await getAllPrescriptions(
          1, // Reset về trang đầu
          pageSize,
          "", // prescriptionCodeSearch
          "", // healthCheckResultCodeSearch
          "", // userSearch
          "", // staffSearch
          "", // drugSearch
          "", // updatedBySearch
          "PrescriptionDate", // Sắp xếp mặc định
          false, // Không sắp xếp tăng dần
          undefined, // Không lọc theo trạng thái
          undefined, // prescriptionStartDate
          undefined, // prescriptionEndDate
          undefined, // createdStartDate
          undefined, // createdEndDate
          undefined, // updatedStartDate
          undefined  // updatedEndDate
        );
        
        if (response.success) {
          console.log("Reset successful, setting new data");
          setPrescriptions(response.data.items || response.data);
          setTotal(response.data.totalCount || response.data.length || 0);
        } else {
          message.error("Failed to reset filters");
        }
      } catch (error) {
        console.error("Error resetting filters:", error);
        message.error("Error resetting filters");
      } finally {
        setLoading(false);
      }
    };
    
    fetchData();
  };

  // Event handlers
  const handlePageChange = (page: number, newPageSize?: number) => {
    setCurrentPage(page);
    if (newPageSize) setPageSize(newPageSize);
  };

  const handleCreateSuccess = () => {
    fetchPrescriptions();
  };

  const handleColumnVisibilityChange = (key: string) => {
    // Không cho phép ẩn cả hai cột prescriptionCode và actions
    if (key === "prescriptionCode" && visibleColumns.length === 2 && visibleColumns.includes("actions")) {
      return; // Không cho phép ẩn cột prescriptionCode khi chỉ còn 2 cột
    }
    if (key === "actions" && visibleColumns.length === 2 && visibleColumns.includes("prescriptionCode")) {
      return; // Không cho phép ẩn cột actions khi chỉ còn 2 cột
    }
    
    const newVisibleColumns = visibleColumns.includes(key)
      ? visibleColumns.filter((k) => k !== key)
      : [...visibleColumns, key];
    
    // Đảm bảo ít nhất một cột luôn hiển thị
    if (newVisibleColumns.length === 0) {
      return;
    }
    
    setVisibleColumns(newVisibleColumns);
  };

  const handleSoftDelete = async (id: string) => {
    try {
      const response = await softDeletePrescriptions([id]);
      if (response.success) {
        message.success("Prescription soft deleted successfully");
        fetchPrescriptions();
      } else {
        message.error("Failed to soft delete prescription");
      }
    } catch (error) {
      console.error("Error soft deleting prescription:", error);
      message.error("Failed to soft delete prescription");
    }
  };

  const handleRestore = async (id: string) => {
    try {
      const response = await restoreSoftDeletedPrescriptions([id]);
      if (response.success) {
        message.success("Prescription restored successfully");
        fetchPrescriptions();
      } else {
        message.error("Failed to restore prescription");
      }
    } catch (error) {
      console.error("Error restoring prescription:", error);
      message.error("Failed to restore prescription");
    }
  };

  const handleCancel = async (id: string, reason: string) => {
    try {
      setLoading(true);
      const response = await cancelPrescription(id, reason);
      if (response.success) {
        message.success("Prescription cancelled successfully");
        fetchPrescriptions();
      } else {
        message.error(response.message || "Failed to cancel prescription");
      }
    } catch (error) {
      console.error("Error cancelling prescription:", error);
      message.error("Failed to cancel prescription");
    } finally {
      setLoading(false);
    }
  };

  const handleBulkDelete = async (ids: string[]) => {
    try {
      setDeletingItems(true);
      const response = await softDeletePrescriptions(ids);
      if (response.success) {
        message.success("Selected prescriptions soft deleted successfully");
        setSelectedRowKeys([]);
        fetchPrescriptions();
      } else {
        message.error("Failed to soft delete selected prescriptions");
      }
    } catch (error) {
      console.error("Error soft deleting prescriptions:", error);
      message.error("Failed to soft delete selected prescriptions");
    } finally {
      setDeletingItems(false);
    }
  };

  const handleBulkRestore = async (ids: string[]) => {
    try {
      setRestoringItems(true);
      const response = await restoreSoftDeletedPrescriptions(ids);
      if (response.success) {
        message.success("Selected prescriptions restored successfully");
        setSelectedRowKeys([]);
        fetchPrescriptions();
      } else {
        message.error("Failed to restore selected prescriptions");
      }
    } catch (error) {
      console.error("Error restoring prescriptions:", error);
      message.error("Failed to restore selected prescriptions");
    } finally {
      setRestoringItems(false);
    }
  };

  const handleOpenExportConfig = () => {
    setShowExportConfigModal(true);
  };

  const closeExportConfigModal = () => {
    setShowExportConfigModal(false);
  };

  const handleExportConfigChange = (changedValues: any) => {
    setExportConfig({ ...exportConfig, ...changedValues });
  };

  // Helper functions
  const canEditPrescription = (status: string | undefined) => {
    return status === PRESCRIPTION_STATUS.DISPENSED;
  };

  const canCancelPrescription = (status: string | undefined) => {
    return status === PRESCRIPTION_STATUS.DISPENSED;
  };

  const canSoftDeletePrescription = (status: string | undefined) => {
    return (
      status === PRESCRIPTION_STATUS.USED ||
      status === PRESCRIPTION_STATUS.UPDATED_AND_USED
    );
  };

  const canRestorePrescription = (status: string | undefined) => {
    return status === PRESCRIPTION_STATUS.SOFT_DELETED;
  };

  // Render functions for tables and charts
  const renderStatusTag = (status: string | undefined) => {
    if (!status) return null;
    return <Tag color={getStatusColor(status)}>{status}</Tag>;
  };

  const renderMedicineUser = (healthCheckResult: any) => {
    if (!healthCheckResult || !healthCheckResult.user) return "N/A";
    const user = healthCheckResult.user;
    return (
      <div>
        <div>
          <strong>{user.fullName}</strong>
        </div>
        <div>{user.email}</div>
      </div>
    );
  };

  const renderStaff = (staff: any) => {
    if (!staff) return "N/A";
    return (
      <div>
        <div>
          <strong>{staff.fullName}</strong>
        </div>
        <div>{staff.email}</div>
      </div>
    );
  };

  const [cancelModalVisible, setCancelModalVisible] = useState(false);
  const [selectedPrescription, setSelectedPrescription] = useState<string | null>(null);

  const showCancelModal = (record: PrescriptionResponseDTO) => {
    setSelectedPrescription(record.id);
    setCancelModalVisible(true);
  };

  const hideCancelModal = () => {
    setSelectedPrescription(null);
    setCancelModalVisible(false);
  };

  const renderActionButtons = (record: PrescriptionResponseDTO) => {
    return (
      <div style={{ textAlign: "center" }}>
        <Dropdown
          overlay={
            <Menu>
              <Menu.Item
                key="view"
                icon={<EyeOutlined />}
                onClick={() => router.push(`/prescription/${record.id}`)}
              >
                View Details
              </Menu.Item>

        {canEditPrescription(record.status) && (
                <Menu.Item
                  key="edit"
                  icon={<FormOutlined />}
                  onClick={() =>
                    router.push(`/prescription/${record.id}?edit=true`)
                  }
                >
                  Edit Prescription
                </Menu.Item>
        )}

        {canCancelPrescription(record.status) && (
                <Menu.Item
                  key="cancel"
                  icon={<CloseCircleOutlined />}
                  danger
                  onClick={() => showCancelModal(record)}
                >
                  Cancel Prescription
                </Menu.Item>
        )}

        {canSoftDeletePrescription(record.status) && (
                <Menu.Item key="delete" icon={<DeleteOutlined />} danger>
          <Popconfirm
            title="Soft Delete Prescription"
            description="Are you sure you want to soft delete this prescription?"
                    onConfirm={() => handleSoftDelete(record.id)}
            okText="Yes"
            cancelText="No"
                    placement="topLeft"
                  >
                    <div style={{ width: "100%" }}>Soft Delete</div>
          </Popconfirm>
                </Menu.Item>
        )}

        {canRestorePrescription(record.status) && (
                <Menu.Item key="restore" icon={<UndoOutlined />}>
          <Popconfirm
            title="Restore Prescription"
            description="Are you sure you want to restore this prescription?"
                    onConfirm={() => handleRestore(record.id)}
            okText="Yes"
            cancelText="No"
                    placement="topLeft"
          >
                    <div style={{ width: "100%" }}>Restore</div>
          </Popconfirm>
                </Menu.Item>
              )}
            </Menu>
          }
          placement="bottomCenter"
        >
          <Button icon={<MoreOutlined />} size="small" />
        </Dropdown>
      </div>
    );
  };

  // Column definitions for the table
  const columns: ColumnType<PrescriptionResponseDTO>[] = [
    {
      title: (
        <span style={{ textTransform: "uppercase", fontWeight: "bold" }}>
          PRESCRIPTION CODE
        </span>
      ),
      dataIndex: "prescriptionCode",
      key: "prescriptionCode",
      fixed: "left" as const,
      width: 180,
      render: (text: string, record: PrescriptionResponseDTO) => (
        <Button
          type="link"
          onClick={() => router.push(`/prescription/${record.id}`)}
          style={{ padding: 0 }}
        >
          {text}
        </Button>
      ),
    },
    {
      title: (
        <span style={{ textTransform: "uppercase", fontWeight: "bold" }}>
          HEALTH CHECK CODE
        </span>
      ),
      dataIndex: ["healthCheckResult", "healthCheckResultCode"],
      key: "healthCheckResultCode",
      render: (text: string, record: PrescriptionResponseDTO) =>
        record.healthCheckResult ? (
          <Button
            type="link"
            onClick={() =>
              router.push(
                `/health-check-result/${record.healthCheckResult?.id}`
              )
            }
            style={{ padding: 0 }}
          >
            {text}
          </Button>
        ) : (
          "N/A"
        ),
    },
    {
      title: (
        <span style={{ textTransform: "uppercase", fontWeight: "bold" }}>
          MEDICINE USER
        </span>
      ),
      dataIndex: ["healthCheckResult", "user"],
      key: "user",
      render: (_: any, record: PrescriptionResponseDTO) =>
        renderMedicineUser(record.healthCheckResult),
    },
    {
      title: (
        <span style={{ textTransform: "uppercase", fontWeight: "bold" }}>
          PRESCRIPTION DATE
        </span>
      ),
      dataIndex: "prescriptionDate",
      key: "prescriptionDate",
      render: (text: string) => formatDate(text),
    },
    {
      title: (
        <span style={{ textTransform: "uppercase", fontWeight: "bold" }}>
          HEALTHCARE STAFF
        </span>
      ),
      dataIndex: "staff",
      key: "staff",
      render: (staff: any) => renderStaff(staff),
    },
    {
      title: (
        <span style={{ textTransform: "uppercase", fontWeight: "bold" }}>
          CREATED AT
        </span>
      ),
      dataIndex: "createdAt",
      key: "createdAt",
      render: (text: string) => formatDateTime(text),
    },
    {
      title: (
        <span style={{ textTransform: "uppercase", fontWeight: "bold" }}>
          UPDATED AT
        </span>
      ),
      dataIndex: "updatedAt",
      key: "updatedAt",
      render: (text: string) => formatDateTime(text),
    },
    {
      title: (
        <span style={{ textTransform: "uppercase", fontWeight: "bold" }}>
          UPDATED BY
        </span>
      ),
      dataIndex: "updatedBy",
      key: "updatedBy",
      render: (updatedBy: any) => (updatedBy ? renderStaff(updatedBy) : "N/A"),
    },
    {
      title: (
        <span style={{ textTransform: "uppercase", fontWeight: "bold" }}>
          STATUS
        </span>
      ),
      dataIndex: "status",
      key: "status",
      align: "center" as const,
      render: (status: string) => (
        <div style={{ display: "flex", justifyContent: "center" }}>
          {renderStatusTag(status)}
        </div>
      ),
    },
    {
      title: (
        <span style={{ textTransform: "uppercase", fontWeight: "bold" }}>
          ACTIONS
        </span>
      ),
      key: "actions",
      fixed: "right" as const,
      width: 100,
      align: "center" as const,
      render: (_: any, record: PrescriptionResponseDTO) =>
        renderActionButtons(record),
    },
  ].filter((column) => visibleColumns.includes(column.key as string));

  // Add these functions for filter modal
  const handleOpenFilterModal = () => {
    setFilterModalVisible(true);
  };

  const handleApplyFilters = (filters: any) => {
    console.log("Received filters in parent:", filters);
    
    // Cập nhật tất cả các state
    setHealthCheckResultCodeSearch(filters.healthCheckResultCodeSearch || "");
    setUserSearch(filters.userSearch || "");
    setStaffSearch(filters.staffSearch || "");
    setDrugSearch(filters.drugSearch || "");
    setUpdatedBySearch(filters.updatedBySearch || "");
    
    // Đảm bảo các giá trị ngày tháng được chuyển đúng định dạng
    setPrescriptionDateRange(filters.prescriptionDateRange || [null, null]);
    setCreatedDateRange(filters.createdDateRange || [null, null]);
    setUpdatedDateRange(filters.updatedDateRange || [null, null]);
    
    // Cập nhật sorting
    setSortBy(filters.sortBy || "PrescriptionDate");
    setAscending(filters.ascending);
    
    // Đóng modal và đặt lại trang
    setFilterModalVisible(false);
    setCurrentPage(1);
    
    // Cập nhật state filterState
    setFilterState(filters);
    
    // Gọi API để lấy dữ liệu mới
    const fetchData = async () => {
      try {
        console.log("Fetching with applied filters:", filters);
        
        const prescriptionStartDate = filters.prescriptionDateRange[0]?.format("YYYY-MM-DD");
        const prescriptionEndDate = filters.prescriptionDateRange[1]?.format("YYYY-MM-DD");
        const createdStartDate = filters.createdDateRange[0]?.format("YYYY-MM-DD");
        const createdEndDate = filters.createdDateRange[1]?.format("YYYY-MM-DD");
        const updatedStartDate = filters.updatedDateRange[0]?.format("YYYY-MM-DD");
        const updatedEndDate = filters.updatedDateRange[1]?.format("YYYY-MM-DD");
        
        setLoading(true);
        const response = await getAllPrescriptions(
          1, // currentPage = 1 vì chúng ta reset về trang đầu
          pageSize,
          filters.prescriptionCodeSearch || "",
          filters.healthCheckResultCodeSearch || "",
          filters.userSearch || "",
          filters.staffSearch || "",
          filters.drugSearch || "",
          filters.updatedBySearch || "",
          filters.sortBy || "PrescriptionDate",
          filters.ascending,
          statusFilter, // Giữ nguyên statusFilter hiện tại
          prescriptionStartDate,
          prescriptionEndDate,
          createdStartDate,
          createdEndDate,
          updatedStartDate,
          updatedEndDate
        );
        
        console.log("Filter apply response:", response);
        
        if (response.success) {
          setPrescriptions(response.data.items || response.data);
          setTotal(response.data.totalCount || response.data.length || 0);
        } else {
          message.error("Failed to fetch prescriptions with filters");
        }
      } catch (error) {
        console.error("Error applying filters:", error);
        message.error("Error applying filters");
      } finally {
        setLoading(false);
      }
    };
    
    fetchData();
  };

  const handleResetFilters = () => {
    const emptyFilters = {
      healthCheckResultCodeSearch: "",
      userSearch: "",
      staffSearch: "",
      drugSearch: "",
      updatedBySearch: "",
      prescriptionDateRange: [null, null] as [moment.Moment | null, moment.Moment | null],
      createdDateRange: [null, null] as [moment.Moment | null, moment.Moment | null],
      updatedDateRange: [null, null] as [moment.Moment | null, moment.Moment | null],
      sortBy: "PrescriptionDate",
      ascending: false,
    };
    
    setFilterState(emptyFilters);
    
    // Reset individual filter state variables
    setHealthCheckResultCodeSearch("");
    setUserSearch("");
    setStaffSearch("");
    setDrugSearch("");
    setUpdatedBySearch("");
    setPrescriptionDateRange([null, null]);
    setCreatedDateRange([null, null]);
    setUpdatedDateRange([null, null]);
    setSortBy("PrescriptionDate");
    setAscending(false);
    
    // Close modal and fetch data
    setFilterModalVisible(false);
    fetchPrescriptions();
  };

  // Cập nhật filterState khi các giá trị filter thay đổi
  useEffect(() => {
    setFilterState({
      healthCheckResultCodeSearch: healthCheckResultCodeSearch,
      userSearch: userSearch,
      staffSearch: staffSearch,
      drugSearch: drugSearch,
      updatedBySearch: updatedBySearch,
      prescriptionDateRange: prescriptionDateRange,
      createdDateRange: createdDateRange,
      updatedDateRange: updatedDateRange,
      sortBy: sortBy,
      ascending: ascending,
    });
  }, [
    healthCheckResultCodeSearch,
    userSearch,
    staffSearch,
    drugSearch,
    updatedBySearch,
    prescriptionDateRange,
    createdDateRange,
    updatedDateRange,
    sortBy,
    ascending,
  ]);

  // Define available columns for customization
  const availableColumns = [
    { key: "prescriptionCode", label: "Prescription Code" },
    { key: "healthCheckResultCode", label: "Health Check Code" },
    { key: "user", label: "Medicine User" },
    { key: "prescriptionDate", label: "Prescription Date" },
    { key: "staff", label: "Healthcare Staff" },
    { key: "createdAt", label: "Created At" },
    { key: "updatedAt", label: "Updated At" },
    { key: "updatedBy", label: "Updated By" },
    { key: "status", label: "Status" },
    { key: "actions", label: "Actions" }
  ];

  // Column Settings menu
  const renderColumnSettingsMenu = () => (
    <Menu>
      {availableColumns.map(column => (
        <Menu.Item key={column.key}>
          <Checkbox
            checked={visibleColumns.includes(column.key)}
            onChange={() => handleColumnVisibilityChange(column.key)}
          >
            {column.label}
          </Checkbox>
        </Menu.Item>
      ))}
    </Menu>
  );

  // Main render
  return (
    <PageContainer
      title="Prescription Management"
      onBack={() => router.back()}
      icon={
        <MedicineBoxOutlined style={{ fontSize: "24px", marginRight: "8px" }} />
      }
      rightContent={<Space></Space>}
    >
      {/* Search Filters */}
      <ToolbarCard
        leftContent={
          <>
            {/* Prescription Code Search */}
            <Select
              showSearch
              placeholder="Search Prescription Code"
              value={prescriptionCodeSearch || undefined}
              onChange={(value) => {
                setPrescriptionCodeSearch(value || "");
                setCurrentPage(1);
              }}
              style={{ width: "320px" }}
              allowClear
              filterOption={(input, option) =>
                (option?.value?.toString().toLowerCase() || "").includes(
                  input.toLowerCase()
                )
              }
              options={prescriptions
                .map((p) => p.prescriptionCode)
                .filter(Boolean)
                .map((code) => ({
                  value: code,
                  label: code,
                }))}
              dropdownStyle={{ minWidth: "320px" }}
            />

            {/* Health Check Result Code */}
            {/* <Select
              showSearch
              placeholder="Health Check Code"
              value={healthCheckResultCodeSearch || undefined}
              onChange={(value) => {
                setHealthCheckResultCodeSearch(value || "");
                setCurrentPage(1);
              }}
              style={{ width: "220px" }}
              allowClear
              filterOption={(input, option) =>
                (option?.value?.toString().toLowerCase() || "").includes(
                  input.toLowerCase()
                )
              }
              options={prescriptions
                .map((p) => p.healthCheckResult?.healthCheckResultCode)
                .filter(Boolean)
                .map((code) => ({
                  value: code,
                  label: code,
              }))}
            /> */}
            <Button
              icon={<FilterOutlined />}
              onClick={handleOpenFilterModal}
              style={{
                color: 
                  healthCheckResultCodeSearch ||
                  userSearch ||
                  staffSearch ||
                  drugSearch ||
                  updatedBySearch ||
                  (prescriptionDateRange && (prescriptionDateRange[0] || prescriptionDateRange[1])) ||
                  (createdDateRange && (createdDateRange[0] || createdDateRange[1])) ||
                  (updatedDateRange && (updatedDateRange[0] || updatedDateRange[1])) ||
                  (sortBy && sortBy !== "PrescriptionDate") ||
                  ascending
                    ? "#1890ff"
                    : undefined,
              }}
            >
              Filters
            </Button>
            {/* Status filter */}
            <div>
            <Select
                placeholder={
                  <div style={{ display: "flex", alignItems: "center" }}>
                    <TagOutlined style={{ marginRight: 8 }} />
                    <span>Status</span>
                  </div>
                }
              allowClear
                style={{ width: "150px" }}
                value={statusFilter || undefined}
                onChange={(value) => {
                  setStatusFilter(value);
                  setCurrentPage(1);
                }}
                disabled={loading}
            >
              {Object.values(PRESCRIPTION_STATUS).map((status) => (
                <Option key={status} value={status}>
                  {status}
                </Option>
              ))}
            </Select>
            </div>

            {/* Reset Button */}
            <Tooltip title="Reset all filters">
              <Button
                icon={<UndoOutlined />}
                onClick={handleReset}
                danger={
                  prescriptionCodeSearch ||
                  healthCheckResultCodeSearch ||
                  userSearch ||
                  staffSearch ||
                  drugSearch ||
                  updatedBySearch ||
                  statusFilter ||
                  (prescriptionDateRange && (prescriptionDateRange[0] || prescriptionDateRange[1])) ||
                  (createdDateRange && (createdDateRange[0] || createdDateRange[1])) ||
                  (updatedDateRange && (updatedDateRange[0] || updatedDateRange[1]))
                    ? true
                    : false
                }
                disabled={
                  !(
                    prescriptionCodeSearch ||
                    healthCheckResultCodeSearch ||
                    userSearch ||
                    staffSearch ||
                    drugSearch ||
                    updatedBySearch ||
                    statusFilter ||
                    prescriptionDateRange[0] ||
                    prescriptionDateRange[1] ||
                    createdDateRange[0] ||
                    createdDateRange[1] ||
                    updatedDateRange[0] ||
                    updatedDateRange[1]
                  )
                }
              ></Button>
            </Tooltip>
            <Button
              type="primary"
              icon={<PlusOutlined />}
              onClick={() => setIsCreateModalVisible(true)}
            >
              Create
            </Button>
            <Dropdown
              overlay={renderColumnSettingsMenu()}
              trigger={["click"]}
              placement="bottomRight"
            >
              <Button icon={<SettingOutlined />}>
                Columns 
              </Button>
            </Dropdown>
          </>
        }
        rightContent={
              <Button
                type="primary"
            icon={<FileExcelOutlined />}
            onClick={handleOpenExportConfig}
              >
            Export to Excel
              </Button>
        }
      />

      {/* Table Controls for bulk actions */}
      <TableControls
        selectedRowKeys={selectedRowKeys}
        pageSize={pageSize}
        onPageSizeChange={(newSize) => handlePageChange(1, newSize)}
        bulkActions={[
          createDeleteBulkAction(
            selectedRowKeys.length,
            deletingItems,
            () => handleBulkDelete(selectedRowKeys as string[]),
            selectedItemTypes.hasDeletable
          ),
          createRestoreBulkAction(
            selectedRowKeys.length,
            restoringItems,
            () => handleBulkRestore(selectedRowKeys as string[]),
            selectedItemTypes.hasRestorable
          ),
        ]}
        maxRowsPerPage={100}
        pageSizeOptions={[5, 10, 15, 20, 50, 100]}
      />

      {/* Table */}
      <Card className="shadow-sm" bodyStyle={{ padding: "16px" }}>
        <div style={{ overflowX: "auto" }}>
        <Table
          columns={columns}
          dataSource={prescriptions}
          rowKey="id"
          loading={loading}
          pagination={false}
          rowSelection={{
            selectedRowKeys,
            onChange: (keys) => setSelectedRowKeys(keys),
              getCheckboxProps: (record: PrescriptionResponseDTO) => ({
                disabled: !(
                  canSoftDeletePrescription(record.status) ||
                  canRestorePrescription(record.status)
                ),
                title: !(
                  canSoftDeletePrescription(record.status) ||
                  canRestorePrescription(record.status)
                )
                  ? "Only prescriptions with status 'Used', 'UpdatedAndUsed', or 'SoftDeleted' can be selected"
                  : "",
              }),
            }}
            scroll={{ x: "max-content" }}
            bordered
          />
        </div>

        <PaginationFooter
            current={currentPage}
            pageSize={pageSize}
            total={total}
            onChange={handlePageChange}
          showGoToPage={true}
          showTotal={true}
          />
      </Card>

      {/* Modals */}
      <CreateModal
        visible={isCreateModalVisible}
        onClose={() => setIsCreateModalVisible(false)}
        onSuccess={handleCreateSuccess}
        userOptions={userOptions}
        drugOptions={drugOptions}
      />

      <ExportConfigModal
        visible={showExportConfigModal}
        onClose={closeExportConfigModal}
        config={exportConfig}
        onChange={handleExportConfigChange}
        filters={{
          currentPage,
          pageSize,
          prescriptionCodeSearch,
          healthCheckResultCodeSearch,
          userSearch,
          staffSearch,
          drugSearch,
          updatedBySearch,
          sortBy,
          ascending,
          statusFilter,
          prescriptionDateRange,
          createdDateRange,
          updatedDateRange,
        }}
      />

      <ConfirmCancelPrescriptionModal
        visible={cancelModalVisible}
        prescriptionId={selectedPrescription || ""}
        onCancel={hideCancelModal}
        onConfirm={handleCancel}
      />

      {/* Filter Modal */}
      <PrescriptionFilterModal 
        visible={filterModalVisible}
        onCancel={() => setFilterModalVisible(false)}
        onApply={handleApplyFilters}
        onReset={handleResetFilters}
        filters={filterState}
        prescriptionCodes={prescriptionCodes}
        healthCheckCodes={healthCheckCodes}
        userOptions={userOptions}
        staffOptions={staffOptions}
        drugOptions={drugOptions}
        updatedByOptions={staffOptions}
      />
    </PageContainer>
  );
}

export { PrescriptionDetail } from "./prescription-detail";
export { PrescriptionHistoryList } from "./prescription-history-list";
