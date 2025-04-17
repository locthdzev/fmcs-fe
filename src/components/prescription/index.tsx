import React, { useState, useEffect, useCallback } from "react";
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
} from "antd";
import { toast } from "react-toastify";
import moment from "moment";
import { Pie, Bar } from "react-chartjs-2";
import {
  Chart as ChartJS,
  ArcElement,
  Tooltip as ChartTooltip,
  Legend,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title as ChartTitle,
} from "chart.js";
import {
  getAllPrescriptions,
  getPrescriptionStatistics,
  PrescriptionResponseDTO,
  PrescriptionStatisticsDTO,
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
} from "@ant-design/icons";

const { Option } = Select;
const { RangePicker } = DatePicker;
const { Title, Text } = Typography;

// Register ChartJS components
ChartJS.register(
  ArcElement,
  ChartTooltip,
  Legend,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ChartTitle
);

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
  const [statistics, setStatistics] =
    useState<PrescriptionStatisticsDTO | null>(null);
  const [loading, setLoading] = useState(false);
  const [statsLoading, setStatsLoading] = useState(false);
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

  // Fetch data
  const fetchPrescriptions = useCallback(async () => {
    setLoading(true);
    try {
      const prescriptionStartDate =
        prescriptionDateRange[0]?.format("YYYY-MM-DD");
      const prescriptionEndDate =
        prescriptionDateRange[1]?.format("YYYY-MM-DD");
      const createdStartDate = createdDateRange[0]?.format("YYYY-MM-DD");
      const createdEndDate = createdDateRange[1]?.format("YYYY-MM-DD");
      const updatedStartDate = updatedDateRange[0]?.format("YYYY-MM-DD");
      const updatedEndDate = updatedDateRange[1]?.format("YYYY-MM-DD");

      const response = await getAllPrescriptions(
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
        prescriptionStartDate,
        prescriptionEndDate,
        createdStartDate,
        createdEndDate,
        updatedStartDate,
        updatedEndDate
      );

      console.log("API Response:", response); // Debug

      if (response.success) {
        console.log("Setting prescriptions:", response.data); // Debug
        setPrescriptions(response.data.items || response.data);
        setTotal(response.data.totalCount || response.data.length || 0);
      } else {
        toast.error("Failed to fetch prescriptions");
      }
    } catch (error) {
      console.error("Error fetching prescriptions:", error);
      toast.error("Failed to fetch prescriptions");
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

  const fetchStatistics = useCallback(async () => {
    setStatsLoading(true);
    try {
      const response = await getPrescriptionStatistics();
      if (response.success) {
        setStatistics(response.data);
      } else {
        toast.error("Failed to fetch statistics");
      }
    } catch (error) {
      console.error("Error fetching statistics:", error);
      toast.error("Failed to fetch statistics");
    } finally {
      setStatsLoading(false);
    }
  }, []);

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
      toast.error("Failed to fetch users");
    }
  }, []);

  const fetchDrugs = useCallback(async () => {
    try {
      const drugs = await getDrugs();
      setDrugOptions(drugs);
    } catch (error) {
      console.error("Error fetching drugs:", error);
      toast.error("Failed to fetch drugs");
    }
  }, []);

  useEffect(() => {
    fetchPrescriptions();
    fetchUsers();
    fetchDrugs();
    fetchStatistics();
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
    setCurrentPage(1);
    fetchPrescriptions();
  };

  // Event handlers
  const handlePageChange = (page: number, pageSize?: number) => {
    setCurrentPage(page);
    if (pageSize) setPageSize(pageSize);
  };

  const handleCreateSuccess = () => {
    fetchPrescriptions();
    fetchStatistics();
  };

  const handleColumnVisibilityChange = (key: string) => {
    const newVisibleColumns = visibleColumns.includes(key)
      ? visibleColumns.filter((k) => k !== key)
      : [...visibleColumns, key];
    setVisibleColumns(newVisibleColumns);
  };

  const handleSoftDelete = async (id: string) => {
    try {
      const response = await softDeletePrescriptions([id]);
      if (response.success) {
        toast.success("Prescription soft deleted successfully");
        fetchPrescriptions();
        fetchStatistics();
      } else {
        toast.error("Failed to soft delete prescription");
      }
    } catch (error) {
      console.error("Error soft deleting prescription:", error);
      toast.error("Failed to soft delete prescription");
    }
  };

  const handleRestore = async (id: string) => {
    try {
      const response = await restoreSoftDeletedPrescriptions([id]);
      if (response.success) {
        toast.success("Prescription restored successfully");
        fetchPrescriptions();
        fetchStatistics();
      } else {
        toast.error("Failed to restore prescription");
      }
    } catch (error) {
      console.error("Error restoring prescription:", error);
      toast.error("Failed to restore prescription");
    }
  };

  const handleCancel = async (id: string, reason: string) => {
    try {
      const response = await cancelPrescription(id, reason);
      if (response.success) {
        toast.success("Prescription cancelled successfully");
        fetchPrescriptions();
        fetchStatistics();
      } else {
        toast.error("Failed to cancel prescription");
      }
    } catch (error) {
      console.error("Error cancelling prescription:", error);
      toast.error("Failed to cancel prescription");
    }
  };

  const handleBulkDelete = async () => {
    try {
      const response = await softDeletePrescriptions(
        selectedRowKeys as string[]
      );
      if (response.success) {
        toast.success("Selected prescriptions soft deleted successfully");
        setSelectedRowKeys([]);
        fetchPrescriptions();
        fetchStatistics();
      } else {
        toast.error("Failed to soft delete selected prescriptions");
      }
    } catch (error) {
      console.error("Error soft deleting prescriptions:", error);
      toast.error("Failed to soft delete selected prescriptions");
    }
  };

  const handleBulkRestore = async () => {
    try {
      const response = await restoreSoftDeletedPrescriptions(
        selectedRowKeys as string[]
      );
      if (response.success) {
        toast.success("Selected prescriptions restored successfully");
        setSelectedRowKeys([]);
        fetchPrescriptions();
        fetchStatistics();
      } else {
        toast.error("Failed to restore selected prescriptions");
      }
    } catch (error) {
      console.error("Error restoring prescriptions:", error);
      toast.error("Failed to restore selected prescriptions");
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

  const renderActionButtons = (record: PrescriptionResponseDTO) => {
    return (
      <Space size="small">
        <Button
          type="text"
          icon={<EyeOutlined />}
          onClick={() => router.push(`/prescription/${record.id}`)}
          title="View Details"
        />

        {canEditPrescription(record.status) && (
          <Button
            type="text"
            icon={<FormOutlined />}
            onClick={() => router.push(`/prescription/${record.id}?edit=true`)}
            title="Edit Prescription"
          />
        )}

        {canCancelPrescription(record.status) && (
          <Popconfirm
            title="Cancel Prescription"
            description={
              <div>
                <p>Are you sure you want to cancel this prescription?</p>
                <Input.TextArea
                  placeholder="Reason for cancellation"
                  id={`cancel-reason-${record.id}`}
                  rows={3}
                />
              </div>
            }
            okText="Yes"
            cancelText="No"
            onConfirm={() => {
              const reasonElement = document.getElementById(
                `cancel-reason-${record.id}`
              ) as HTMLTextAreaElement;
              if (reasonElement && reasonElement.value) {
                handleCancel(record.id, reasonElement.value);
              } else {
                toast.error("Please provide a reason for cancellation");
              }
            }}
          >
            <Button
              type="text"
              danger
              icon={<CloseCircleOutlined />}
              title="Cancel Prescription"
            />
          </Popconfirm>
        )}

        {canSoftDeletePrescription(record.status) && (
          <Popconfirm
            title="Soft Delete Prescription"
            description="Are you sure you want to soft delete this prescription?"
            okText="Yes"
            cancelText="No"
            onConfirm={() => handleSoftDelete(record.id)}
          >
            <Button
              type="text"
              danger
              icon={<DeleteOutlined />}
              title="Soft Delete"
            />
          </Popconfirm>
        )}

        {canRestorePrescription(record.status) && (
          <Popconfirm
            title="Restore Prescription"
            description="Are you sure you want to restore this prescription?"
            okText="Yes"
            cancelText="No"
            onConfirm={() => handleRestore(record.id)}
          >
            <Button type="text" icon={<UndoOutlined />} title="Restore" />
          </Popconfirm>
        )}
      </Space>
    );
  };

  // Column definitions for the table
  const columns = [
    {
      title: "Prescription Code",
      dataIndex: "prescriptionCode",
      key: "prescriptionCode",
      render: (text: string, record: PrescriptionResponseDTO) => (
        <Button
          type="link"
          onClick={() => router.push(`/prescription/${record.id}`)}
        >
          {text}
        </Button>
      ),
      visible: visibleColumns.includes("prescriptionCode"),
    },
    {
      title: "Health Check Code",
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
          >
            {text}
          </Button>
        ) : (
          "N/A"
        ),
      visible: visibleColumns.includes("healthCheckResultCode"),
    },
    {
      title: "Medicine User",
      dataIndex: ["healthCheckResult", "user"],
      key: "user",
      render: (_: any, record: PrescriptionResponseDTO) =>
        renderMedicineUser(record.healthCheckResult),
      visible: visibleColumns.includes("user"),
    },
    {
      title: "Prescription Date",
      dataIndex: "prescriptionDate",
      key: "prescriptionDate",
      render: (text: string) => formatDate(text),
      visible: visibleColumns.includes("prescriptionDate"),
    },
    {
      title: "Healthcare Staff",
      dataIndex: "staff",
      key: "staff",
      render: (staff: any) => renderStaff(staff),
      visible: visibleColumns.includes("staff"),
    },
    {
      title: "Created At",
      dataIndex: "createdAt",
      key: "createdAt",
      render: (text: string) => formatDateTime(text),
      visible: visibleColumns.includes("createdAt"),
    },
    {
      title: "Updated At",
      dataIndex: "updatedAt",
      key: "updatedAt",
      render: (text: string) => formatDateTime(text),
      visible: visibleColumns.includes("updatedAt"),
    },
    {
      title: "Updated By",
      dataIndex: "updatedBy",
      key: "updatedBy",
      render: (updatedBy: any) => (updatedBy ? renderStaff(updatedBy) : "N/A"),
      visible: visibleColumns.includes("updatedBy"),
    },
    {
      title: "Status",
      dataIndex: "status",
      key: "status",
      render: (status: string) => renderStatusTag(status),
      visible: visibleColumns.includes("status"),
    },
    {
      title: "Actions",
      key: "actions",
      render: (_: any, record: PrescriptionResponseDTO) =>
        renderActionButtons(record),
      visible: visibleColumns.includes("actions"),
    },
  ].filter((column) => column.visible);

  // Render content for statistics and charts
  const renderStatistics = () => {
    if (statsLoading) {
      return (
        <div className="text-center p-8">
          <Spin size="large" />
        </div>
      );
    }

    if (!statistics) {
      return <Empty description="No statistics available" />;
    }

    return (
      <div>
        <Row gutter={[16, 16]}>
          <Col xs={24} sm={12} md={6}>
            <Card>
              <Statistic
                title="Total Prescriptions"
                value={statistics.totalPrescriptions}
                prefix={<MedicineBoxOutlined />}
              />
            </Card>
          </Col>
          <Col xs={24} sm={12} md={6}>
            <Card>
              <Statistic
                title="Total Drugs Prescribed"
                value={statistics.totalDrugsPrescribed}
                prefix={<MedicineBoxOutlined />}
              />
            </Card>
          </Col>
          <Col xs={24} sm={12} md={6}>
            <Card>
              <Statistic
                title="Avg. Drugs Per Prescription"
                value={statistics.averageDrugsPerPrescription}
                precision={2}
                prefix={<FieldTimeOutlined />}
              />
            </Card>
          </Col>
          <Col xs={24} sm={12} md={6}>
            <Card>
              <Statistic
                title="Prescriptions Requiring Follow-up"
                value={statistics.totalPrescriptionsRequiringFollowUp}
                prefix={<CalendarOutlined />}
              />
            </Card>
          </Col>
        </Row>

        <Divider />

        <Row gutter={[16, 16]}>
          <Col xs={24} md={12}>
            <Card title="Prescriptions by Status">
              <div style={{ height: 300 }}>
                {statistics.prescriptionsByStatus &&
                Object.keys(statistics.prescriptionsByStatus).length > 0 ? (
                  <Pie
                    data={{
                      labels: Object.keys(statistics.prescriptionsByStatus),
                      datasets: [
                        {
                          data: Object.values(statistics.prescriptionsByStatus),
                          backgroundColor: [
                            "#36A2EB",
                            "#FFCE56",
                            "#4BC0C0",
                            "#FF6384",
                            "#9966FF",
                            "#FF9F40",
                            "#C9CBCF",
                          ],
                        },
                      ],
                    }}
                    options={{
                      responsive: true,
                      maintainAspectRatio: false,
                    }}
                  />
                ) : (
                  <Empty description="No data available" />
                )}
              </div>
            </Card>
          </Col>
          <Col xs={24} md={12}>
            <Card title="Prescriptions by Month">
              <div style={{ height: 300 }}>
                {statistics.prescriptionsByMonth &&
                Object.keys(statistics.prescriptionsByMonth).length > 0 ? (
                  <Bar
                    data={{
                      labels: Object.keys(statistics.prescriptionsByMonth),
                      datasets: [
                        {
                          label: "Prescriptions",
                          data: Object.values(statistics.prescriptionsByMonth),
                          backgroundColor: "#36A2EB",
                        },
                      ],
                    }}
                    options={{
                      responsive: true,
                      maintainAspectRatio: false,
                    }}
                  />
                ) : (
                  <Empty description="No data available" />
                )}
              </div>
            </Card>
          </Col>
        </Row>
      </div>
    );
  };

  // Main render
  return (
    <div className="p-4">
      <Title level={2}>Prescription Management</Title>

      {/* Statistics Section */}
      <div className="mb-8">
        <Title level={4}>Statistics</Title>
        {renderStatistics()}
      </div>

      <Divider />

      {/* Toolbar Section */}
      <div className="flex flex-wrap justify-between mb-4">
        <div className="flex flex-wrap gap-2 mb-4">
          <Button
            type="primary"
            icon={<PlusOutlined />}
            onClick={() => setIsCreateModalVisible(true)}
          >
            Create New Prescription
          </Button>

          {selectedRowKeys.length > 0 && (
            <>
              <Popconfirm
                title="Soft Delete Selected Prescriptions"
                description={`Are you sure you want to soft delete ${selectedRowKeys.length} selected prescriptions?`}
                okText="Yes"
                cancelText="No"
                onConfirm={handleBulkDelete}
              >
                <Button danger icon={<DeleteOutlined />}>
                  Soft Delete Selected ({selectedRowKeys.length})
                </Button>
              </Popconfirm>

              <Popconfirm
                title="Restore Selected Prescriptions"
                description={`Are you sure you want to restore ${selectedRowKeys.length} selected prescriptions?`}
                okText="Yes"
                cancelText="No"
                onConfirm={handleBulkRestore}
              >
                <Button icon={<UndoOutlined />}>
                  Restore Selected ({selectedRowKeys.length})
                </Button>
              </Popconfirm>
            </>
          )}

          <Button icon={<ExportOutlined />} onClick={handleOpenExportConfig}>
            Export to Excel
          </Button>

          <Dropdown
            overlay={
              <Menu>
                {[
                  { key: "prescriptionCode", label: "Prescription Code" },
                  { key: "healthCheckResultCode", label: "Health Check Code" },
                  { key: "user", label: "Medicine User" },
                  { key: "prescriptionDate", label: "Prescription Date" },
                  { key: "staff", label: "Healthcare Staff" },
                  { key: "createdAt", label: "Created At" },
                  { key: "updatedAt", label: "Updated At" },
                  { key: "updatedBy", label: "Updated By" },
                  { key: "status", label: "Status" },
                  { key: "actions", label: "Actions" },
                ].map((item) => (
                  <Menu.Item key={item.key}>
                    <Checkbox
                      checked={visibleColumns.includes(item.key)}
                      onChange={() => handleColumnVisibilityChange(item.key)}
                    >
                      {item.label}
                    </Checkbox>
                  </Menu.Item>
                ))}
              </Menu>
            }
            trigger={["click"]}
          >
            <Button icon={<SettingOutlined />}>
              Column Settings <DownOutlined />
            </Button>
          </Dropdown>
        </div>
      </div>

      {/* Filters Section */}
      <div className="mb-6 bg-gray-50 p-4 rounded">
        <Title level={5}>Search & Filters</Title>
        <Row gutter={[16, 16]}>
          <Col xs={24} sm={12} md={8} lg={6}>
            <Input
              placeholder="Search by Prescription Code"
              value={prescriptionCodeSearch}
              onChange={(e) => setPrescriptionCodeSearch(e.target.value)}
              prefix={<SearchOutlined />}
              allowClear
            />
          </Col>

          <Col xs={24} sm={12} md={8} lg={6}>
            <Input
              placeholder="Search by Health Check Code"
              value={healthCheckResultCodeSearch}
              onChange={(e) => setHealthCheckResultCodeSearch(e.target.value)}
              prefix={<SearchOutlined />}
              allowClear
            />
          </Col>

          <Col xs={24} sm={12} md={8} lg={6}>
            <Select
              showSearch
              placeholder="Search by Medicine User"
              optionFilterProp="children"
              value={userSearch || undefined}
              onChange={(value) => setUserSearch(value)}
              style={{ width: "100%" }}
              allowClear
              options={userOptions.map((user) => ({
                value: user.id,
                label: `${user.fullName} (${user.email})`,
              }))}
            />
          </Col>

          <Col xs={24} sm={12} md={8} lg={6}>
            <Select
              showSearch
              placeholder="Search by Healthcare Staff"
              optionFilterProp="children"
              value={staffSearch || undefined}
              onChange={(value) => setStaffSearch(value)}
              style={{ width: "100%" }}
              allowClear
              options={staffOptions.map((staff) => ({
                value: staff.id,
                label: `${staff.fullName} (${staff.email})`,
              }))}
            />
          </Col>

          <Col xs={24} sm={12} md={8} lg={6}>
            <Select
              showSearch
              placeholder="Search by Drug"
              optionFilterProp="children"
              value={drugSearch || undefined}
              onChange={(value) => setDrugSearch(value)}
              style={{ width: "100%" }}
              allowClear
              options={drugOptions.map((drug) => ({
                value: drug.id,
                label: `${drug.name} (${drug.drugCode})`,
              }))}
            />
          </Col>

          <Col xs={24} sm={12} md={8} lg={6}>
            <Select
              showSearch
              placeholder="Search by Updated By"
              optionFilterProp="children"
              value={updatedBySearch || undefined}
              onChange={(value) => setUpdatedBySearch(value)}
              style={{ width: "100%" }}
              allowClear
              options={staffOptions.map((staff) => ({
                value: staff.id,
                label: `${staff.fullName} (${staff.email})`,
              }))}
            />
          </Col>

          <Col xs={24} sm={12} md={8} lg={6}>
            <Select
              placeholder="Filter by Status"
              value={statusFilter}
              onChange={(value) => setStatusFilter(value)}
              style={{ width: "100%" }}
              allowClear
            >
              {Object.values(PRESCRIPTION_STATUS).map((status) => (
                <Option key={status} value={status}>
                  {status}
                </Option>
              ))}
            </Select>
          </Col>

          <Col xs={24} sm={12} md={8} lg={6}>
            <RangePicker
              placeholder={["Prescription Start Date", "Prescription End Date"]}
              value={prescriptionDateRange as any}
              onChange={(dates) =>
                setPrescriptionDateRange(
                  dates as [moment.Moment | null, moment.Moment | null]
                )
              }
              style={{ width: "100%" }}
            />
          </Col>

          <Col xs={24} sm={12} md={8} lg={6}>
            <RangePicker
              placeholder={["Created Start Date", "Created End Date"]}
              value={createdDateRange as any}
              onChange={(dates) =>
                setCreatedDateRange(
                  dates as [moment.Moment | null, moment.Moment | null]
                )
              }
              showTime
              style={{ width: "100%" }}
            />
          </Col>

          <Col xs={24} sm={12} md={8} lg={6}>
            <RangePicker
              placeholder={["Updated Start Date", "Updated End Date"]}
              value={updatedDateRange as any}
              onChange={(dates) =>
                setUpdatedDateRange(
                  dates as [moment.Moment | null, moment.Moment | null]
                )
              }
              showTime
              style={{ width: "100%" }}
            />
          </Col>

          <Col xs={24} sm={12} md={8} lg={6}>
            <Space>
              <Button
                type="primary"
                onClick={handleSearch}
                icon={<SearchOutlined />}
              >
                Search
              </Button>
              <Button onClick={handleReset}>Reset</Button>
            </Space>
          </Col>
        </Row>
      </div>

      {/* Table Section */}
      <div className="mb-4">
        <Table
          columns={columns}
          dataSource={prescriptions}
          rowKey="id"
          loading={loading}
          pagination={false}
          rowSelection={{
            selectedRowKeys,
            onChange: (keys) => setSelectedRowKeys(keys),
          }}
        />

        <div className="mt-4 flex justify-end">
          <Pagination
            current={currentPage}
            pageSize={pageSize}
            total={total}
            showSizeChanger
            onChange={handlePageChange}
            onShowSizeChange={handlePageChange}
            showTotal={(total) => `Total ${total} items`}
          />
        </div>
      </div>

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
    </div>
  );
}

export { PrescriptionDetail } from "./prescription-detail";
export { PrescriptionHistoryList } from "./prescription-history-list";
