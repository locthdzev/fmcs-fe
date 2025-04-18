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
  message,
  Form,
  InputNumber,
} from "antd";
import { toast } from "react-toastify";
import moment from "moment";
import dayjs from "dayjs";
import {
  getAllHealthInsurances,
  HealthInsuranceResponseDTO,
  setupHealthInsuranceRealTime,
  exportHealthInsurances,
  softDeleteHealthInsurances,
  restoreHealthInsurance,
  verifyHealthInsurance,
  createInitialHealthInsurances,
  getHealthInsuranceConfig,
} from "@/api/healthinsurance";
import CreateModal from "./CreateModal";
import EditModal from "./EditModal";
import ConfigModal from "./ConfigModal";
import HealthInsuranceFilterModal from "./HealthInsuranceFilterModal";
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
  ArrowLeftOutlined,
  UndoOutlined,
  FileExcelOutlined,
  AppstoreOutlined,
  TagOutlined,
} from "@ant-design/icons";
import { getUsers, UserProfile } from "@/api/user";
import { useRouter } from "next/router";
import { HealthInsuranceIcon } from "@/dashboard/sidebar/icons/HealthInsuranceIcon";

const { Option } = Select;
const { RangePicker } = DatePicker;
const { Text, Title } = Typography;

const formatDate = (date: string | undefined) => {
  if (!date) return "";
  return moment(date).format("DD/MM/YYYY");
};

const formatDateTime = (datetime: string | undefined) => {
  if (!datetime) return "";
  return moment(datetime).format("DD/MM/YYYY HH:mm:ss");
};

const DEFAULT_VISIBLE_COLUMNS = [
  "policyholder",
  "healthInsuranceNumber",
  "fullName",
  "validPeriod",
  "status",
  "verificationStatus",
  "deadline",
  "actions",
];

const getStatusColor = (status: string | undefined) => {
  switch (status) {
    case "Completed":
      return "success";
    case "Pending":
      return "processing";
    case "Submitted":
      return "warning";
    case "Expired":
      return "error";
    case "DeadlineExpired":
      return "orange";
    case "SoftDeleted":
      return "default";
    case "NotApplicable":
      return "default";
    default:
      return "default";
  }
};

const getVerificationStatusColor = (status: string | undefined) => {
  switch (status) {
    case "Verified":
      return "success";
    case "Rejected":
      return "error";
    case "Pending":
      return "warning";
    default:
      return "default";
  }
};

export function HealthInsuranceManagement() {
  const router = useRouter();
  const [insurances, setInsurances] = useState<HealthInsuranceResponseDTO[]>(
    []
  );
  const [loading, setLoading] = useState(false);
  const [isCreateModalVisible, setIsCreateModalVisible] = useState(false);
  const [isEditModalVisible, setIsEditModalVisible] = useState(false);
  const [selectedInsurance, setSelectedInsurance] =
    useState<HealthInsuranceResponseDTO | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [total, setTotal] = useState(0);
  const [searchText, setSearchText] = useState("");
  const [statusFilter, setStatusFilter] = useState<string | undefined>();
  const [userFilter, setUserFilter] = useState<string | undefined>();
  const [userOptions, setUserOptions] = useState<
    { id: string; fullName: string; email: string }[]
  >([]);
  const [sortBy, setSortBy] = useState("CreatedAt");
  const [ascending, setAscending] = useState(false);
  const [selectedRowKeys, setSelectedRowKeys] = useState<React.Key[]>([]);
  const [isConfigModalVisible, setIsConfigModalVisible] = useState(false);
  const [filterModalVisible, setFilterModalVisible] = useState(false);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [searchForm] = Form.useForm();
  const [messageApi, contextHolder] = message.useMessage();

  // Convert visibleColumns to match the treatment plan style
  const [columnVisibility, setColumnVisibility] = useState<
    Record<string, boolean>
  >({
    policyholder: true,
    healthInsuranceNumber: true,
    fullName: true,
    validPeriod: true,
    status: true,
    verificationStatus: true,
    deadline: true,
    actions: true,
  });

  // Add state for insurance number options
  const [insuranceNumberOptions, setInsuranceNumberOptions] = useState<
    string[]
  >([]);

  const [filterState, setFilterState] = useState({
    userFilter: "",
    statusFilter: "",
    validDateRange: [null, null] as [dayjs.Dayjs | null, dayjs.Dayjs | null],
    createdDateRange: [null, null] as [dayjs.Dayjs | null, dayjs.Dayjs | null],
    updatedDateRange: [null, null] as [dayjs.Dayjs | null, dayjs.Dayjs | null],
    ascending: false,
  });

  const fetchUsers = useCallback(async () => {
    try {
      const users = await getUsers();
      const userRoleUsers = users
        .filter((user: UserProfile) => user.roles.includes("User"))
        .map((user: UserProfile) => ({
          id: user.id,
          fullName: user.fullName,
          email: user.email,
        }));
      setUserOptions(userRoleUsers);
    } catch (error) {
      messageApi.error("Unable to load users");
    }
  }, [messageApi]);

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  const fetchInsurances = useCallback(async () => {
    setLoading(true);
    try {
      // Fetch all insurances based on status filter
      const result = await getAllHealthInsurances(
        currentPage,
        pageSize,
        searchText,
        sortBy,
        ascending,
        statusFilter,
        userFilter
      );

      setInsurances(result.data);
      setTotal(result.totalRecords);

      // Extract unique insurance numbers for the dropdown
      if (result.data && result.data.length > 0) {
        const uniqueNumbers = Array.from(
          new Set(
            result.data
              .filter(
                (insurance: HealthInsuranceResponseDTO) =>
                  insurance.healthInsuranceNumber
              )
              .map(
                (insurance: HealthInsuranceResponseDTO) =>
                  insurance.healthInsuranceNumber
              )
          )
        );
        setInsuranceNumberOptions(uniqueNumbers as string[]);
      }
    } catch (error) {
      messageApi.error("Unable to load health insurances.");
    } finally {
      setLoading(false);
    }
  }, [
    currentPage,
    pageSize,
    searchText,
    sortBy,
    ascending,
    statusFilter,
    userFilter,
    messageApi,
  ]);

  // Fetch all insurance numbers for dropdown
  const fetchAllInsuranceNumbers = useCallback(async () => {
    try {
      // Fetch with larger page size to get more numbers
      const result = await getAllHealthInsurances(
        1,
        1000, // Large page size to get as many as possible
        "",
        "CreatedAt",
        false,
        undefined,
        undefined
      );

      if (result.data && result.data.length > 0) {
        const uniqueNumbers = Array.from(
          new Set(
            result.data
              .filter(
                (insurance: HealthInsuranceResponseDTO) =>
                  insurance.healthInsuranceNumber
              )
              .map(
                (insurance: HealthInsuranceResponseDTO) =>
                  insurance.healthInsuranceNumber
              )
          )
        );
        setInsuranceNumberOptions(uniqueNumbers as string[]);
      }
    } catch (error) {
      console.error("Unable to load all insurance numbers", error);
    }
  }, []);

  useEffect(() => {
    fetchInsurances();
    // Fetch all insurance numbers once on component mount
    fetchAllInsuranceNumbers();

    const connection = setupHealthInsuranceRealTime(() => {
      fetchInsurances();
    });
    return () => {
      connection.stop();
    };
  }, [fetchInsurances, fetchAllInsuranceNumbers]);

  const handleSoftDelete = async (id: string) => {
    try {
      const response = await softDeleteHealthInsurances([id]);
      if (response.isSuccess) {
        messageApi.success("Insurance soft deleted!");
        fetchInsurances();
      } else {
        messageApi.error(response.message);
      }
    } catch (error) {
      messageApi.error("Unable to soft delete insurance.");
    }
  };

  const handleRestore = async (id: string) => {
    try {
      const response = await restoreHealthInsurance(id);
      if (response.isSuccess) {
        messageApi.success("Insurance restored!");
        fetchInsurances();
      } else {
        messageApi.error(response.message);
      }
    } catch (error) {
      messageApi.error("Unable to restore insurance.");
    }
  };

  const handleVerify = async (id: string, status: string) => {
    try {
      const response = await verifyHealthInsurance(id, status);
      if (response.isSuccess) {
        messageApi.success(`Insurance ${status.toLowerCase()}!`);
        fetchInsurances();
      } else {
        messageApi.error(response.message);
      }
    } catch (error) {
      messageApi.error("Unable to verify insurance.");
    }
  };

  const handleCreateInitial = async () => {
    try {
      const response = await createInitialHealthInsurances();
      if (response.isSuccess) {
        messageApi.success("Initial insurances created successfully!");
        fetchInsurances();
      } else {
        messageApi.error(response.message);
      }
    } catch (error) {
      messageApi.error("Unable to create initial insurances.");
    }
  };

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

  const ALL_COLUMNS = [
    {
      key: "policyholder",
      title: (
        <span style={{ textTransform: "uppercase", fontWeight: "bold" }}>
          POLICYHOLDER
        </span>
      ),
      render: (record: HealthInsuranceResponseDTO) => (
        <div className="flex flex-col">
          <Typography.Text strong>{record.user.fullName}</Typography.Text>
          <Typography.Text type="secondary" className="text-sm">
            {record.user.email}
          </Typography.Text>
        </div>
      ),
      visible: columnVisibility.policyholder,
    },
    {
      key: "healthInsuranceNumber",
      title: (
        <span style={{ textTransform: "uppercase", fontWeight: "bold" }}>
          INSURANCE NUMBER
        </span>
      ),
      render: (record: HealthInsuranceResponseDTO) => (
        <Tooltip title="Click to view details">
          <Typography.Link
            onClick={() => router.push(`/health-insurance/${record.id}`)}
          >
            {record.healthInsuranceNumber}
          </Typography.Link>
        </Tooltip>
      ),
      visible: columnVisibility.healthInsuranceNumber,
    },
    {
      key: "fullName",
      title: (
        <span style={{ textTransform: "uppercase", fontWeight: "bold" }}>
          FULL NAME
        </span>
      ),
      dataIndex: "fullName",
      visible: columnVisibility.fullName,
    },
    {
      key: "validPeriod",
      title: (
        <span style={{ textTransform: "uppercase", fontWeight: "bold" }}>
          VALID PERIOD
        </span>
      ),
      render: (record: HealthInsuranceResponseDTO) => (
        <Space direction="vertical" size="small">
          <Typography.Text>
            From: {formatDate(record.validFrom)}
          </Typography.Text>
          <Typography.Text>To: {formatDate(record.validTo)}</Typography.Text>
        </Space>
      ),
      visible: columnVisibility.validPeriod,
    },
    {
      key: "status",
      title: (
        <span style={{ textTransform: "uppercase", fontWeight: "bold" }}>
          STATUS
        </span>
      ),
      render: (record: HealthInsuranceResponseDTO) => (
        <Tag color={getStatusColor(record.status)}>{record.status}</Tag>
      ),
      visible: columnVisibility.status,
    },
    {
      key: "verificationStatus",
      title: (
        <span style={{ textTransform: "uppercase", fontWeight: "bold" }}>
          VERIFICATION
        </span>
      ),
      render: (record: HealthInsuranceResponseDTO) => (
        <Badge
          status={getVerificationStatusColor(record.verificationStatus) as any}
          text={record.verificationStatus}
        />
      ),
      visible: columnVisibility.verificationStatus,
    },
    {
      key: "deadline",
      title: (
        <span style={{ textTransform: "uppercase", fontWeight: "bold" }}>
          DEADLINE
        </span>
      ),
      render: (record: HealthInsuranceResponseDTO) => (
        <Typography.Text
          type={
            moment(record.deadline).isBefore(moment()) ? "danger" : "success"
          }
        >
          {formatDate(record.deadline) || "No deadline"}
        </Typography.Text>
      ),
      visible: columnVisibility.deadline,
    },
    {
      key: "actions",
      title: (
        <span style={{ textTransform: "uppercase", fontWeight: "bold" }}>
          ACTIONS
        </span>
      ),
      render: (record: HealthInsuranceResponseDTO) => (
        <Space>
          <Tooltip title="View Details">
            <Button
              type="text"
              icon={<EyeOutlined />}
              onClick={() => router.push(`/health-insurance/${record.id}`)}
            />
          </Tooltip>
          <Tooltip title="Edit">
            <Button
              type="text"
              icon={<FormOutlined />}
              onClick={() => {
                setSelectedInsurance(record);
                setIsEditModalVisible(true);
              }}
            />
          </Tooltip>
          {record.status === "Submitted" && (
            <>
              <Tooltip title="Verify">
                <Button
                  type="text"
                  icon={<CheckCircleOutlined />}
                  className="text-green-600"
                  onClick={() => handleVerify(record.id, "Verified")}
                />
              </Tooltip>
              <Tooltip title="Reject">
                <Button
                  type="text"
                  icon={<CloseCircleOutlined />}
                  className="text-red-600"
                  onClick={() => handleVerify(record.id, "Rejected")}
                />
              </Tooltip>
            </>
          )}
        </Space>
      ),
      visible: columnVisibility.actions,
    },
  ];

  const columns = ALL_COLUMNS.filter((col) => col.visible);

  const filteredInsurances = React.useMemo(() => {
    if (!searchText) return insurances;

    const normalizedSearch = searchText
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "");

    return insurances.filter((insurance) => {
      const normalizedNumber = (insurance.healthInsuranceNumber || "")
        .toLowerCase()
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "");

      return normalizedNumber.includes(normalizedSearch);
    });
  }, [insurances, searchText]);

  const handleBulkDelete = async () => {
    try {
      const response = await softDeleteHealthInsurances(
        selectedRowKeys as string[]
      );
      if (response.isSuccess) {
        messageApi.success("Selected insurances deleted successfully!");
        setSelectedRowKeys([]);
        fetchInsurances();
      } else {
        messageApi.error(response.message);
      }
    } catch (error) {
      messageApi.error("Unable to delete selected insurances.");
    }
  };

  const handleOpenFilterModal = () => {
    setFilterModalVisible(true);
  };

  const handleApplyFilters = (filters: any) => {
    setFilterState(filters);
    setUserFilter(filters.userFilter);
    setStatusFilter(filters.statusFilter);
    setAscending(filters.ascending);
    setCurrentPage(1);
    setFilterModalVisible(false);
  };

  const handleResetFilters = () => {
    const resetFilters = {
      userFilter: "",
      statusFilter: "",
      validDateRange: [null, null] as [dayjs.Dayjs | null, dayjs.Dayjs | null],
      createdDateRange: [null, null] as [
        dayjs.Dayjs | null,
        dayjs.Dayjs | null
      ],
      updatedDateRange: [null, null] as [
        dayjs.Dayjs | null,
        dayjs.Dayjs | null
      ],
      ascending: false,
    };

    setFilterState(resetFilters);
    setUserFilter(undefined);
    setStatusFilter(undefined);
    setAscending(false);
    setCurrentPage(1);
    setFilterModalVisible(false);

    // Refresh data
    fetchInsurances();
  };

  // Modified reset function to reset all filters
  const handleReset = () => {
    setSearchText("");
    setStatusFilter(undefined);
    setUserFilter(undefined);
    setSortBy("CreatedAt");
    setAscending(false);
    setCurrentPage(1);

    // Reset the filter state as well
    setFilterState({
      userFilter: "",
      statusFilter: "",
      validDateRange: [null, null],
      createdDateRange: [null, null],
      updatedDateRange: [null, null],
      ascending: false,
    });
  };

  // Handle dropdown visibility
  const handleDropdownVisibleChange = (visible: boolean) => {
    setDropdownOpen(visible);
  };

  // Prevent dropdown from closing when clicking checkboxes
  const handleMenuClick = (e: React.MouseEvent) => {
    e.stopPropagation();
  };

  // Handle back navigation
  const handleBack = () => {
    router.back();
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
          <HealthInsuranceIcon />
          <h3 className="text-xl font-bold">Health Insurance Management</h3>
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
            {/* User Filter */}
            <Select
              showSearch
              allowClear
              style={{ width: 250 }}
              placeholder="Search by policyholder"
              optionFilterProp="label"
              value={userFilter}
              filterOption={(input, option) => {
                if (!option?.label) return false;
                return (
                  option.label.toLowerCase().indexOf(input.toLowerCase()) >= 0
                );
              }}
              onChange={(value) => setUserFilter(value)}
              options={userOptions.map((user) => ({
                value: user.id,
                label: `${user.fullName} (${user.email})`,
              }))}
            />

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
                style={{ width: "150px" }}
                value={statusFilter}
                onChange={(value) => setStatusFilter(value)}
                disabled={loading}
              >
                <Option value="Pending">
                  <Badge status="processing" text="Pending" />
                </Option>
                <Option value="Submitted">
                  <Badge status="warning" text="Submitted" />
                </Option>
                <Option value="Completed">
                  <Badge status="success" text="Completed" />
                </Option>
                <Option value="Expired">
                  <Badge status="error" text="Expired" />
                </Option>
                <Option value="DeadlineExpired">
                  <Badge
                    status="error"
                    text={
                      <span style={{ color: "#ff7a45" }}>Deadline Expired</span>
                    }
                  />
                </Option>
                <Option value="SoftDeleted">
                  <Badge status="default" text="Soft Deleted" />
                </Option>
                <Option value="NotApplicable">
                  <Badge status="default" text="Not Applicable" />
                </Option>
              </Select>
            </div>

            {/* Advanced Filters */}
            <Tooltip title="Advanced Filters">
              <Button
                icon={
                  <FilterOutlined
                    style={{
                      color:
                        filterState.validDateRange[0] ||
                        filterState.validDateRange[1] ||
                        filterState.createdDateRange[0] ||
                        filterState.createdDateRange[1] ||
                        filterState.updatedDateRange[0] ||
                        filterState.updatedDateRange[1]
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

            {/* Reset Button */}
            <Tooltip title="Reset All Filters">
              <Button
                icon={<UndoOutlined />}
                onClick={handleReset}
                disabled={
                  !(
                    searchText ||
                    statusFilter ||
                    userFilter ||
                    filterState.validDateRange[0] ||
                    filterState.validDateRange[1] ||
                    filterState.createdDateRange[0] ||
                    filterState.createdDateRange[1] ||
                    filterState.updatedDateRange[0] ||
                    filterState.updatedDateRange[1]
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
                    key: "policyholder",
                    label: (
                      <div onClick={handleMenuClick}>
                        <Checkbox
                          checked={columnVisibility.policyholder}
                          onChange={() =>
                            handleColumnVisibilityChange("policyholder")
                          }
                        >
                          Policyholder
                        </Checkbox>
                      </div>
                    ),
                  },
                  {
                    key: "healthInsuranceNumber",
                    label: (
                      <div onClick={handleMenuClick}>
                        <Checkbox
                          checked={columnVisibility.healthInsuranceNumber}
                          onChange={() =>
                            handleColumnVisibilityChange(
                              "healthInsuranceNumber"
                            )
                          }
                        >
                          Insurance Number
                        </Checkbox>
                      </div>
                    ),
                  },
                  {
                    key: "fullName",
                    label: (
                      <div onClick={handleMenuClick}>
                        <Checkbox
                          checked={columnVisibility.fullName}
                          onChange={() =>
                            handleColumnVisibilityChange("fullName")
                          }
                        >
                          Full Name
                        </Checkbox>
                      </div>
                    ),
                  },
                  {
                    key: "validPeriod",
                    label: (
                      <div onClick={handleMenuClick}>
                        <Checkbox
                          checked={columnVisibility.validPeriod}
                          onChange={() =>
                            handleColumnVisibilityChange("validPeriod")
                          }
                        >
                          Valid Period
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
                    key: "verificationStatus",
                    label: (
                      <div onClick={handleMenuClick}>
                        <Checkbox
                          checked={columnVisibility.verificationStatus}
                          onChange={() =>
                            handleColumnVisibilityChange("verificationStatus")
                          }
                        >
                          Verification Status
                        </Checkbox>
                      </div>
                    ),
                  },
                  {
                    key: "deadline",
                    label: (
                      <div onClick={handleMenuClick}>
                        <Checkbox
                          checked={columnVisibility.deadline}
                          onChange={() =>
                            handleColumnVisibilityChange("deadline")
                          }
                        >
                          Deadline
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

            {/* Create Button with Dropdown */}
            <Dropdown
              overlay={
                <Menu>
                  <Menu.Item
                    key="manual"
                    onClick={() => setIsCreateModalVisible(true)}
                  >
                    <PlusOutlined /> Create Manual
                  </Menu.Item>
                  <Menu.Item key="initial" onClick={handleCreateInitial}>
                    <PlusOutlined /> Create Initial
                  </Menu.Item>
                </Menu>
              }
              placement="bottomLeft"
            >
              <Button type="primary" icon={<PlusOutlined />} disabled={loading}>
                Create
              </Button>
            </Dropdown>

            {/* Settings Button */}
            <Button
              icon={<SettingOutlined />}
              onClick={() => setIsConfigModalVisible(true)}
            >
              Settings
            </Button>
          </div>

          <div>
            {/* Export Button */}
            <Button
              type="primary"
              icon={<FileExcelOutlined />}
              onClick={exportHealthInsurances}
              disabled={loading}
            >
              Export to Excel
            </Button>
          </div>
        </div>
      </Card>

      {/* Selection Actions và Rows per page */}
      <div className="flex justify-between items-center mb-4">
        {/* Selection Actions */}
        <div>
          {selectedRowKeys.length > 0 && (
            <Space>
              <Text>{selectedRowKeys.length} Items selected</Text>
              <Popconfirm
                title="Are you sure to delete the selected insurances?"
                onConfirm={handleBulkDelete}
              >
                <Button danger icon={<DeleteOutlined />}>
                  Delete
                </Button>
              </Popconfirm>
            </Space>
          )}
        </div>

        {/* Rows per page */}
        <div>
          <Text type="secondary">
            Rows per page:
            <Select
              value={pageSize}
              onChange={(value) => {
                setPageSize(value);
                setCurrentPage(1);
              }}
              style={{ marginLeft: 8, width: 70 }}
            >
              <Option value={5}>5</Option>
              <Option value={10}>10</Option>
              <Option value={15}>15</Option>
              <Option value={20}>20</Option>
            </Select>
          </Text>
        </div>
      </div>

      {/* Data Table */}
      <Card className="shadow-sm">
        <Table
          bordered
          columns={columns}
          dataSource={filteredInsurances}
          loading={loading}
          pagination={false}
          rowKey="id"
          rowSelection={{
            selectedRowKeys,
            onChange: (keys) => setSelectedRowKeys(keys),
          }}
          className="border rounded-lg"
        />

        {/* Bottom Pagination */}
        <Card className="mt-4 shadow-sm">
          <Row justify="center" align="middle">
            <Space size="large" align="center">
              <Text type="secondary">Total {total} items</Text>
              <Space align="center" size="large">
                <Pagination
                  current={currentPage}
                  pageSize={pageSize}
                  total={total}
                  onChange={(page) => {
                    setCurrentPage(page);
                  }}
                  showSizeChanger={false}
                  showTotal={() => ""}
                />
                <Space align="center">
                  <Text type="secondary">Go to page:</Text>
                  <InputNumber
                    min={1}
                    max={Math.ceil(total / pageSize)}
                    value={currentPage}
                    onChange={(value) => {
                      if (
                        value &&
                        Number(value) > 0 &&
                        Number(value) <= Math.ceil(total / pageSize)
                      ) {
                        setCurrentPage(Number(value));
                      }
                    }}
                    style={{ width: "60px" }}
                  />
                </Space>
              </Space>
            </Space>
          </Row>
        </Card>
      </Card>

      {/* Modals */}
      <CreateModal
        visible={isCreateModalVisible}
        onClose={() => setIsCreateModalVisible(false)}
        onSuccess={fetchInsurances}
      />
      <EditModal
        visible={isEditModalVisible}
        insurance={selectedInsurance}
        onClose={() => {
          setIsEditModalVisible(false);
          setSelectedInsurance(null);
        }}
        onSuccess={fetchInsurances}
      />
      <ConfigModal
        visible={isConfigModalVisible}
        onClose={() => setIsConfigModalVisible(false)}
      />
      <HealthInsuranceFilterModal
        visible={filterModalVisible}
        onCancel={() => setFilterModalVisible(false)}
        onApply={handleApplyFilters}
        onReset={handleResetFilters}
        filters={filterState}
        userOptions={userOptions}
      />
    </div>
  );
}
