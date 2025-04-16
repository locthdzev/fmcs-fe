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
  Empty,
  Form,
  InputNumber,
  message,
} from "antd";
import { toast } from "react-toastify";
import moment from "moment";
import dayjs from "dayjs";
import {
  getAllHealthCheckResults,
  HealthCheckResultsResponseDTO,
  cancelFollowUp,
  completeHealthCheckResult,
} from "@/api/healthcheckresult";
import { 
  SearchOutlined, 
  CheckCircleOutlined,
  EyeOutlined,
  CloseCircleOutlined,
  FilterOutlined,
  ArrowLeftOutlined,
  CalendarOutlined,
  SettingOutlined,
  UndoOutlined,
  FileExcelOutlined,
  AppstoreOutlined,
  TagOutlined,
  PlusOutlined,
} from "@ant-design/icons";
import { useRouter } from 'next/router';
import { getUsers, UserProfile } from "@/api/user";
import FollowUpFilterModal from "./FollowUpFilterModal";
import PageContainer from "../shared/PageContainer";
import ToolbarCard from "../shared/ToolbarCard";
import PaginationFooter from "../shared/PaginationFooter";

const { Option } = Select;
const { RangePicker } = DatePicker;
const { Text, Title } = Typography;

const formatDate = (date: string | undefined) => {
  if (!date) return '';
  return moment(date).format('DD/MM/YYYY');
};

const formatDateTime = (datetime: string | undefined) => {
  if (!datetime) return '';
  return moment(datetime).format('DD/MM/YYYY HH:mm:ss');
};

const DEFAULT_VISIBLE_COLUMNS = [
  "healthCheckResultCode",
  "patient",
  "checkupDate",
  "followUpDate",
  "medicalStaff",
  "actions",
];

export const HealthCheckResultFollowUpList: React.FC = () => {
  const router = useRouter();
  const [healthCheckResults, setHealthCheckResults] = useState<HealthCheckResultsResponseDTO[]>([]);
  const [loading, setLoading] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [total, setTotal] = useState(0);
  const [userSearch, setUserSearch] = useState("");
  const [staffSearch, setStaffSearch] = useState("");
  const [checkupDateRange, setCheckupDateRange] = useState<[dayjs.Dayjs | null, dayjs.Dayjs | null]>([null, null]);
  const [followUpDateRange, setFollowUpDateRange] = useState<[dayjs.Dayjs | null, dayjs.Dayjs | null]>([null, null]);
  const [sortBy, setSortBy] = useState("CheckupDate");
  const [ascending] = useState(false);
  const [followUpStatus, setFollowUpStatus] = useState<string | undefined>();
  const [codeSearch, setCodeSearch] = useState("");
  const [userOptions, setUserOptions] = useState<{ id: string; fullName: string; email: string }[]>([]);
  const [staffOptions, setStaffOptions] = useState<{ id: string; fullName: string; email: string }[]>([]);
  const [selectedRowKeys, setSelectedRowKeys] = useState<React.Key[]>([]);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [messageApi, contextHolder] = message.useMessage();
  const [filterModalVisible, setFilterModalVisible] = useState(false);

  // Column visibility state
  const [columnVisibility, setColumnVisibility] = useState<Record<string, boolean>>({
    healthCheckResultCode: true,
    patient: true,
    checkupDate: true,
    followUpDate: true,
    medicalStaff: true,
    actions: true,
  });

  // Fetch users for dropdown options
  const fetchUsers = useCallback(async () => {
    try {
      const users = await getUsers();
      const patientUsers = users
        .filter((user: UserProfile) => user.roles.includes("User"))
        .map((user: UserProfile) => ({
          id: user.id,
          fullName: user.fullName,
          email: user.email,
        }));
      setUserOptions(patientUsers);

      const staffUsers = users
        .filter((user: UserProfile) => user.roles.includes("Staff"))
        .map((user: UserProfile) => ({
          id: user.id,
          fullName: user.fullName,
          email: user.email,
        }));
      setStaffOptions(staffUsers);
    } catch (error) {
      messageApi.error("Unable to load users");
    }
  }, [messageApi]);

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  const fetchHealthCheckResults = useCallback(async () => {
    setLoading(true);
    try {
      const checkupStartDate = checkupDateRange[0] ? checkupDateRange[0].format('YYYY-MM-DD') : undefined;
      const checkupEndDate = checkupDateRange[1] ? checkupDateRange[1].format('YYYY-MM-DD') : undefined;
      const followUpStartDate = followUpDateRange[0] ? followUpDateRange[0].format('YYYY-MM-DD') : undefined;
      const followUpEndDate = followUpDateRange[1] ? followUpDateRange[1].format('YYYY-MM-DD') : undefined;

      console.log("Fetching results with sortBy:", sortBy, "ascending:", ascending);

      // Always use descending order
      const ascendingParam = false;
      console.log("Using ascendingParam:", ascendingParam);

      const response = await getAllHealthCheckResults(
        currentPage,
        pageSize,
        codeSearch || undefined,
        userSearch || undefined,
        staffSearch || undefined,
        sortBy,
        ascendingParam,
        "FollowUpRequired",
        checkupStartDate,
        checkupEndDate,
        true,
        followUpStartDate,
        followUpEndDate,
        followUpStatus === "overdue" ? "overdue" : 
          followUpStatus === "today" ? "today" : 
          followUpStatus === "upcoming" ? "upcoming" : undefined
      );

      if (response.isSuccess) {
        setHealthCheckResults(response.data);
        setTotal(response.totalRecords);
      } else {
        messageApi.error(response.message || "Không thể tải danh sách kết quả khám cần tái khám");
      }
    } catch (error) {
      messageApi.error("Không thể tải danh sách kết quả khám cần tái khám");
    } finally {
      setLoading(false);
    }
  }, [
    currentPage,
    pageSize,
    userSearch,
    staffSearch,
    sortBy,
    ascending,
    checkupDateRange,
    followUpDateRange,
    followUpStatus,
    codeSearch,
    messageApi
  ]);

  useEffect(() => {
    fetchHealthCheckResults();
  }, [fetchHealthCheckResults]);
  
  const handleCancelFollowUp = async (id: string) => {
    try {
      const response = await cancelFollowUp(id);
      if (response.isSuccess) {
        messageApi.success("Follow-up canceled successfully!");
        fetchHealthCheckResults();
      } else {
        messageApi.error(response.message || "Unable to cancel follow-up");
      }
    } catch (error) {
      messageApi.error("Unable to cancel follow-up");
    }
  };
  
  const handleComplete = async (id: string) => {
    try {
      const response = await completeHealthCheckResult(id);
      if (response.isSuccess) {
        messageApi.success("Health check result completed successfully!");
        fetchHealthCheckResults();
      } else {
        messageApi.error(response.message || "Unable to complete health check result");
      }
    } catch (error) {
      messageApi.error("Unable to complete health check result");
    }
  };

  const handleBulkCancel = async () => {
    try {
      // Implement bulk cancel functionality
      messageApi.success("Selected follow-ups canceled successfully!");
      setSelectedRowKeys([]);
      fetchHealthCheckResults();
    } catch (error) {
      messageApi.error("Unable to cancel selected follow-ups");
    }
  };

  // Column visibility functions
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

  // Handle dropdown visibility
  const handleDropdownVisibleChange = (visible: boolean) => {
    setDropdownOpen(visible);
  };

  // Prevent dropdown from closing when clicking checkboxes
  const handleMenuClick = (e: React.MouseEvent) => {
    e.stopPropagation();
  };

  // Reset all filters
  const handleReset = () => {
    console.log("Resetting all filters");
    setCodeSearch("");
    setUserSearch("");
    setStaffSearch("");
    setCheckupDateRange([null, null]);
    setFollowUpDateRange([null, null]);
    setFollowUpStatus(undefined);
    setSortBy("CheckupDate");
    setCurrentPage(1);
    
    // Re-fetch results with reset filters after state updates
    setTimeout(() => {
      fetchHealthCheckResults();
    }, 0);
  };

  // Handle filter modal
  const handleOpenFilterModal = () => {
    setFilterModalVisible(true);
  };

  const handleApplyFilters = (filters: any) => {
    console.log("Applying filters:", filters);
    console.log("Setting ascending to:", filters.ascending);
    setCheckupDateRange(filters.checkupDateRange);
    setFollowUpDateRange(filters.followUpDateRange);
    setSortBy(filters.sortBy);
    setCurrentPage(1);
    setFilterModalVisible(false);
    
    // Re-fetch results with new filters after state updates
    setTimeout(() => {
      fetchHealthCheckResults();
    }, 0);
  };

  // Check if any filters are applied
  const isFilterApplied = () => {
    return (
      checkupDateRange[0] ||
      checkupDateRange[1] ||
      followUpDateRange[0] ||
      followUpDateRange[1] ||
      sortBy !== "CheckupDate"
    );
  };

  // Kiểm tra xem ngày tái khám đã qua chưa
  const isFollowUpOverdue = (followUpDate: string | undefined) => {
    if (!followUpDate) return false;
    const today = moment().startOf('day');
    const followUp = moment(followUpDate).startOf('day');
    return followUp.isBefore(today);
  };

  // Kiểm tra xem ngày tái khám là hôm nay không
  const isFollowUpToday = (followUpDate: string | undefined) => {
    if (!followUpDate) return false;
    const today = moment().startOf('day');
    const followUp = moment(followUpDate).startOf('day');
    return followUp.isSame(today);
  };

  const getFollowUpStatusTag = (followUpDate: string | undefined) => {
    if (!followUpDate) return <Tag color="default">Not Scheduled</Tag>;
    
    if (isFollowUpOverdue(followUpDate)) {
      return <Tag color="error">Overdue</Tag>;
    } else if (isFollowUpToday(followUpDate)) {
      return <Tag color="success">Today</Tag>;
    } else {
      return <Tag color="processing">Upcoming</Tag>;
    }
  };

  const ALL_COLUMNS = [
    {
      key: "healthCheckResultCode",
      title: (
        <span style={{ textTransform: "uppercase", fontWeight: "bold" }}>
          RESULT CODE
        </span>
      ),
      dataIndex: "healthCheckResultCode",
      render: (code: string) => <Text copyable>{code}</Text>,
      visible: columnVisibility.healthCheckResultCode,
    },
    {
      key: "patient",
      title: (
        <span style={{ textTransform: "uppercase", fontWeight: "bold" }}>
          PATIENT
        </span>
      ),
      dataIndex: "user",
      render: (user: any) => (
        <div className="flex flex-col">
          <Typography.Text strong>{user?.fullName}</Typography.Text>
          <Typography.Text type="secondary" className="text-sm">
            {user?.email}
          </Typography.Text>
        </div>
      ),
      visible: columnVisibility.patient,
    },
    {
      key: "checkupDate",
      title: (
        <span style={{ textTransform: "uppercase", fontWeight: "bold" }}>
          CHECKUP DATE
        </span>
      ),
      dataIndex: "checkupDate",
      render: (checkupDate: string) => formatDate(checkupDate),
      visible: columnVisibility.checkupDate,
    },
    {
      key: "followUpDate",
      title: (
        <span style={{ textTransform: "uppercase", fontWeight: "bold" }}>
          FOLLOW-UP DATE
        </span>
      ),
      dataIndex: "followUpDate",
      render: (followUpDate: string, record: HealthCheckResultsResponseDTO) => (
        <Space>
          {formatDate(followUpDate)}
          {getFollowUpStatusTag(followUpDate)}
        </Space>
      ),
      visible: columnVisibility.followUpDate,
    },
    {
      key: "medicalStaff",
      title: (
        <span style={{ textTransform: "uppercase", fontWeight: "bold" }}>
          MEDICAL STAFF
        </span>
      ),
      dataIndex: "staff",
      render: (staff: any) => (
        <div className="flex flex-col">
          <Typography.Text strong>{staff?.fullName}</Typography.Text>
          <Typography.Text type="secondary" className="text-sm">
            {staff?.email}
          </Typography.Text>
        </div>
      ),
      visible: columnVisibility.medicalStaff,
    },
    {
      key: "actions",
      title: (
        <span style={{ textTransform: "uppercase", fontWeight: "bold" }}>
          ACTIONS
        </span>
      ),
      render: (record: HealthCheckResultsResponseDTO) => (
        <Space>
          <Tooltip title="View Details">
            <Button
              type="text"
              icon={<EyeOutlined />}
              onClick={() => router.push(`/health-check-result/${record.id}`)}
            />
          </Tooltip>
          
          <Tooltip title="Complete">
            <Button
              type="text"
              icon={<CheckCircleOutlined />}
              onClick={() => handleComplete(record.id)}
              className="text-green-600"
            />
          </Tooltip>
          
          <Tooltip title="Cancel Follow-up">
            <Popconfirm
              title="Are you sure you want to cancel this follow-up?"
              onConfirm={() => handleCancelFollowUp(record.id)}
              okText="Confirm"
              cancelText="Cancel"
            >
              <Button
                type="text"
                icon={<CloseCircleOutlined />}
                className="text-red-600"
              />
            </Popconfirm>
          </Tooltip>
        </Space>
      ),
      visible: columnVisibility.actions,
    },
  ];

  const columns = ALL_COLUMNS.filter((col) => col.visible);

  const handleExport = () => {
    // Implement export functionality
    messageApi.success("Exporting follow-up results...");
    // Call the API function when implemented
    // exportFollowUpResults();
  };

  // Handle back navigation
  const handleBack = () => {
    router.push('/health-check-result/management');
  };

  return (
    <PageContainer
      title="Follow-up Required Results"
      icon={<CalendarOutlined />}
      onBack={handleBack}
    >
      {contextHolder}

      {/* Search and Filters Toolbar */}
      <ToolbarCard
        leftContent={
          <>
            {/* Code Search */}
            <Input
              placeholder="Search by result code"
              value={codeSearch}
              onChange={(e) => setCodeSearch(e.target.value)}
              prefix={<SearchOutlined />}
              style={{ width: 200 }}
              allowClear
            />

            {/* Follow-up Status */}
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
                value={followUpStatus}
                onChange={(value) => setFollowUpStatus(value)}
                disabled={loading}
              >
                <Option value="overdue">
                  <Badge status="error" text="Overdue" />
                </Option>
                <Option value="today">
                  <Badge status="success" text="Today" />
                </Option>
                <Option value="upcoming">
                  <Badge status="processing" text="Upcoming" />
                </Option>
              </Select>
            </div>

            {/* Filter Button */}
            <Tooltip title="Advanced Filters">
              <Button
                icon={
                  <FilterOutlined
                    style={{
                      color: isFilterApplied() ? "#1890ff" : undefined,
                    }}
                  />
                }
                onClick={handleOpenFilterModal}
              >
                Filters
                {isFilterApplied() && (
                  <Badge 
                    count="•" 
                    style={{ 
                      backgroundColor: "#1890ff", 
                      boxShadow: "none",
                      marginLeft: "4px"
                    }} 
                  />
                )}
              </Button>
            </Tooltip>

            {/* Reset Button */}
            <Tooltip title="Reset All Filters">
              <Button
                icon={<UndoOutlined />}
                onClick={handleReset}
                disabled={!(
                  codeSearch || 
                  followUpStatus || 
                  checkupDateRange[0] || 
                  checkupDateRange[1] || 
                  followUpDateRange[0] || 
                  followUpDateRange[1]
                )}
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
                    key: "healthCheckResultCode",
                    label: (
                      <div onClick={handleMenuClick}>
                        <Checkbox
                          checked={columnVisibility.healthCheckResultCode}
                          onChange={() =>
                            handleColumnVisibilityChange("healthCheckResultCode")
                          }
                        >
                          Result Code
                        </Checkbox>
                      </div>
                    ),
                  },
                  {
                    key: "patient",
                    label: (
                      <div onClick={handleMenuClick}>
                        <Checkbox
                          checked={columnVisibility.patient}
                          onChange={() =>
                            handleColumnVisibilityChange("patient")
                          }
                        >
                          Patient
                        </Checkbox>
                      </div>
                    ),
                  },
                  {
                    key: "checkupDate",
                    label: (
                      <div onClick={handleMenuClick}>
                        <Checkbox
                          checked={columnVisibility.checkupDate}
                          onChange={() =>
                            handleColumnVisibilityChange("checkupDate")
                          }
                        >
                          Checkup Date
                        </Checkbox>
                      </div>
                    ),
                  },
                  {
                    key: "followUpDate",
                    label: (
                      <div onClick={handleMenuClick}>
                        <Checkbox
                          checked={columnVisibility.followUpDate}
                          onChange={() =>
                            handleColumnVisibilityChange("followUpDate")
                          }
                        >
                          Follow-up Date
                        </Checkbox>
                      </div>
                    ),
                  },
                  {
                    key: "medicalStaff",
                    label: (
                      <div onClick={handleMenuClick}>
                        <Checkbox
                          checked={columnVisibility.medicalStaff}
                          onChange={() =>
                            handleColumnVisibilityChange("medicalStaff")
                          }
                        >
                          Medical Staff
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
          </>
        }
        rightContent={
          <Button
            type="primary"
            icon={<FileExcelOutlined />}
            onClick={handleExport}
            disabled={loading}
          >
            Export to Excel
          </Button>
        }
      />

      {/* Selection Actions và Rows per page */}
      <div className="flex justify-between items-center mb-4">
        {/* Selection Actions */}
        <div>
          {selectedRowKeys.length > 0 && (
            <Space>
              <Text>{selectedRowKeys.length} items selected</Text>
              <Popconfirm
                title="Are you sure to cancel the selected follow-ups?"
                onConfirm={handleBulkCancel}
              >
                <Button danger icon={<CloseCircleOutlined />}>
                  Cancel Selected
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
          dataSource={healthCheckResults}
          loading={loading}
          pagination={false}
          rowKey="id"
          rowSelection={{
            selectedRowKeys,
            onChange: (keys) => setSelectedRowKeys(keys),
          }}
          locale={{
            emptyText: <Empty description="No follow-up required results found" />,
          }}
          className="border rounded-lg"
        />

        {/* Using the reusable PaginationFooter component */}
        <PaginationFooter
          current={currentPage}
          pageSize={pageSize}
          total={total}
          onChange={(page) => setCurrentPage(page)}
          showGoToPage={true}
          showTotal={true}
        />
      </Card>

      {/* Filter Modal */}
      <FollowUpFilterModal
        visible={filterModalVisible}
        onCancel={() => setFilterModalVisible(false)}
        onApply={handleApplyFilters}
        onReset={handleReset}
        filters={{
          followUpStatus,
          checkupDateRange,
          followUpDateRange,
          sortBy,
          ascending,
        }}
      />
    </PageContainer>
  );
}; 