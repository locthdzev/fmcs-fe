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
  Spin,
  InputNumber,
  Form,
  Modal,
} from "antd";
import { toast } from "react-toastify";
import moment from "moment";
import {
  getAllHealthCheckResults,
  HealthCheckResultsResponseDTO,
  completeHealthCheckResult,
  cancelCompletelyHealthCheckResult
} from "@/api/healthcheckresult";
import { 
  SearchOutlined, 
  SettingOutlined,
  EyeOutlined,
  CheckCircleOutlined,
  CloseCircleOutlined,
  ArrowLeftOutlined,
  FilterOutlined,
  UndoOutlined,
  AppstoreOutlined,
} from "@ant-design/icons";
import { useRouter } from 'next/router';

const { Option } = Select;
const { RangePicker } = DatePicker;
const { Title, Text } = Typography;

const formatDate = (date: string | undefined) => {
  if (!date) return '';
  return moment(date).format('DD/MM/YYYY');
};

const formatDateTime = (datetime: string | undefined) => {
  if (!datetime) return '';
  return moment(datetime).format('DD/MM/YYYY HH:mm:ss');
};

const getStatusColor = (status: string | undefined) => {
  switch (status) {
    case 'Completed':
      return 'success';
    case 'Approved':
      return 'processing';
    case 'Pending':
      return 'warning';
    case 'Cancelled':
      return 'error';
    case 'CancelledForAdjustment':
      return 'orange';
    case 'SoftDeleted':
      return 'default';
    case 'NoFollowUpRequired':
      return 'green';
    default:
      return 'default';
  }
};

// Filter Modal Component
const FilterModal: React.FC<{
  visible: boolean;
  onCancel: () => void;
  onApply: (filters: any) => void;
  onReset: () => void;
  filters: {
    userSearch: string;
    staffSearch: string;
    checkupDateRange: [moment.Moment | null, moment.Moment | null];
    sortBy: string;
    ascending: boolean;
  };
}> = ({
  visible,
  onCancel,
  onApply,
  onReset,
  filters,
}) => {
  const [localFilters, setLocalFilters] = useState(filters);

  // Reset localFilters when modal is opened with new filters
  useEffect(() => {
    if (visible) {
      setLocalFilters(filters);
    }
  }, [visible, filters]);

  // Process and apply filters
  const handleApply = () => {
    onApply(localFilters);
  };

  // Common styles for filter items
  const filterItemStyle = { marginBottom: "16px" };
  const filterLabelStyle = { marginBottom: "8px", color: "#666666" };

  // Function to update filter state
  const updateFilter = (field: string, value: any) => {
    setLocalFilters((prev) => ({ ...prev, [field]: value }));
  };

  return (
    <Modal
      title="Advanced Filters"
      open={visible}
      onCancel={onCancel}
      width={700}
      footer={[
        <Button key="reset" onClick={onReset} icon={<UndoOutlined />}>
          Reset
        </Button>,
        <Button
          key="apply"
          type="primary"
          onClick={handleApply}
          icon={<FilterOutlined />}
        >
          Apply
        </Button>,
      ]}
    >
      <Space direction="vertical" style={{ width: "100%" }}>
        <Row gutter={16}>
          {/* Patient Search */}
          <Col span={12}>
            <div className="filter-item" style={filterItemStyle}>
              <div className="filter-label" style={filterLabelStyle}>
                Search by patient
              </div>
              <Input
                placeholder="Enter patient name"
                allowClear
                value={localFilters.userSearch}
                onChange={(e) => updateFilter("userSearch", e.target.value)}
                prefix={<SearchOutlined />}
              />
            </div>
          </Col>
          
          {/* Staff Search */}
          <Col span={12}>
            <div className="filter-item" style={filterItemStyle}>
              <div className="filter-label" style={filterLabelStyle}>
                Search by doctor/nurse
              </div>
              <Input
                placeholder="Enter doctor/nurse name"
                allowClear
                value={localFilters.staffSearch}
                onChange={(e) => updateFilter("staffSearch", e.target.value)}
                prefix={<SearchOutlined />}
              />
            </div>
          </Col>
        </Row>

        <Row gutter={16}>
          {/* Checkup Date Range */}
          <Col span={12}>
            <div className="filter-item" style={filterItemStyle}>
              <div className="filter-label" style={filterLabelStyle}>
                Checkup date range
              </div>
              <RangePicker
                style={{ width: "100%" }}
                placeholder={["From date", "To date"]}
                format="DD/MM/YYYY"
                allowClear
                value={localFilters.checkupDateRange as any}
                onChange={(dates) =>
                  updateFilter("checkupDateRange", dates)
                }
              />
            </div>
          </Col>
        </Row>
        
        <Row gutter={16}>
          {/* Sort By */}
          <Col span={12}>
            <div className="filter-item" style={filterItemStyle}>
              <div className="filter-label" style={filterLabelStyle}>
                Sort by
              </div>
              <Select
                placeholder="Sort by"
                value={localFilters.sortBy}
                onChange={(value) => updateFilter("sortBy", value)}
                style={{ width: "100%" }}
              >
                <Option value="ApprovedDate">Approval date</Option>
                <Option value="CheckupDate">Checkup date</Option>
                <Option value="CreatedAt">Created date</Option>
              </Select>
            </div>
          </Col>
          
          {/* Order */}
          <Col span={12}>
            <div className="filter-item" style={filterItemStyle}>
              <div className="filter-label" style={filterLabelStyle}>
                Order
              </div>
              <Select
                placeholder="Order"
                value={localFilters.ascending ? "asc" : "desc"}
                onChange={(value) => updateFilter("ascending", value === "asc")}
                style={{ width: "100%" }}
              >
                <Option value="asc">Ascending</Option>
                <Option value="desc">Descending</Option>
              </Select>
            </div>
          </Col>
        </Row>
      </Space>
    </Modal>
  );
};

export const HealthCheckResultNoFollowUpList: React.FC = () => {
  const router = useRouter();
  const [healthCheckResults, setHealthCheckResults] = useState<HealthCheckResultsResponseDTO[]>([]);
  const [loading, setLoading] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [total, setTotal] = useState(0);
  const [userSearch, setUserSearch] = useState("");
  const [staffSearch, setStaffSearch] = useState("");
  const [checkupDateRange, setCheckupDateRange] = useState<[moment.Moment | null, moment.Moment | null]>([null, null]);
  const [sortBy, setSortBy] = useState("CheckupDate");
  const [ascending, setAscending] = useState(false);
  const [codeSearch, setCodeSearch] = useState("");
  
  // Filter modal state
  const [filterModalVisible, setFilterModalVisible] = useState(false);
  
  // Add new state for column visibility
  const [columnVisibility, setColumnVisibility] = useState<Record<string, boolean>>({
    code: true,
    patient: true,
    checkupDate: true,
    staff: true,
    approvedDate: true,
    status: true,
    actions: true,
  });
  const [dropdownOpen, setDropdownOpen] = useState(false);

  const fetchHealthCheckResults = useCallback(async () => {
    setLoading(true);
    try {
      const checkupStartDate = checkupDateRange[0] ? checkupDateRange[0].format('YYYY-MM-DD') : undefined;
      const checkupEndDate = checkupDateRange[1] ? checkupDateRange[1].format('YYYY-MM-DD') : undefined;

      const response = await getAllHealthCheckResults(
        currentPage,
        pageSize,
        codeSearch || undefined,
        userSearch || undefined,
        staffSearch || undefined,
        sortBy,
        ascending,
        "NoFollowUpRequired", // Match the actual backend value
        checkupStartDate,
        checkupEndDate,
        false // followUpRequired = false
      );

      if (response.success) {
        setHealthCheckResults(response.data);
        setTotal(response.totalRecords);
      } else {
        toast.error(response.message || "Failed to load health check results with no follow-up required");
      }
    } catch (error) {
      toast.error("Failed to load health check results with no follow-up required");
    } finally {
      setLoading(false);
    }
  }, [
    currentPage,
    pageSize,
    codeSearch,
    userSearch,
    staffSearch,
    sortBy,
    ascending,
    checkupDateRange,
  ]);

  useEffect(() => {
    fetchHealthCheckResults();
  }, [fetchHealthCheckResults]);
  
  const handleComplete = async (id: string) => {
    try {
      const response = await completeHealthCheckResult(id);
      if (response.isSuccess) {
        toast.success("Health check result has been completed!");
        fetchHealthCheckResults();
      } else {
        toast.error(response.message || "Failed to complete health check result");
      }
    } catch (error) {
      toast.error("Failed to complete health check result");
    }
  };
  
  const handleCancel = async (id: string, reason: string = "Cancelled by user") => {
    try {
      const response = await cancelCompletelyHealthCheckResult(id, reason);
      if (response.isSuccess) {
        toast.success("Health check result has been cancelled!");
        fetchHealthCheckResults();
      } else {
        toast.error(response.message || "Failed to cancel health check result");
      }
    } catch (error) {
      toast.error("Failed to cancel health check result");
    }
  };

  // New column visibility functions
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

  // Filter modal handlers
  const handleOpenFilterModal = () => {
    setFilterModalVisible(true);
  };

  const handleApplyFilters = (filters: any) => {
    setUserSearch(filters.userSearch);
    setStaffSearch(filters.staffSearch);
    setCheckupDateRange(filters.checkupDateRange);
    setSortBy(filters.sortBy);
    setAscending(filters.ascending);
    setFilterModalVisible(false);
    setCurrentPage(1);
  };

  // Reset function to reset all filters
  const handleReset = () => {
    setCodeSearch("");
    setUserSearch("");
    setStaffSearch("");
    setCheckupDateRange([null, null]);
    setSortBy("CheckupDate");
    setAscending(false);
    setCurrentPage(1);
    setFilterModalVisible(false);
  };

  // Handle back navigation
  const handleBack = () => {
    router.push('/health-check-result/management');
  };

  // Update columns definition to use columnVisibility
  const ALL_COLUMNS = [
    {
      key: "code",
      title: (
        <span style={{ textTransform: "uppercase", fontWeight: "bold" }}>
          RESULT CODE
        </span>
      ),
      render: (record: HealthCheckResultsResponseDTO) => (
        <Text copyable>{record.healthCheckResultCode}</Text>
      ),
      visible: columnVisibility.code,
    },
    {
      key: "patient",
      title: (
        <span style={{ textTransform: "uppercase", fontWeight: "bold" }}>
          PATIENT
        </span>
      ),
      render: (record: HealthCheckResultsResponseDTO) => (
        <div>
          <Text strong>{record.user?.fullName}</Text>
          <div>
            <Text type="secondary" className="text-sm">{record.user?.email}</Text>
          </div>
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
      render: (record: HealthCheckResultsResponseDTO) => (
        <Tooltip title="Click to view details">
          <Typography.Link onClick={() => router.push(`/health-check-result/${record.id}`)}>
            {formatDate(record.checkupDate)}
          </Typography.Link>
        </Tooltip>
      ),
      visible: columnVisibility.checkupDate,
    },
    { 
      key: "staff", 
      title: (
        <span style={{ textTransform: "uppercase", fontWeight: "bold" }}>
          DOCTOR / NURSE
        </span>
      ), 
      render: (record: HealthCheckResultsResponseDTO) => (
        <div>
          <Text>{record.staff?.fullName}</Text>
          <div>
            <Text type="secondary" className="text-sm">{record.staff?.email}</Text>
          </div>
        </div>
      ),
      visible: columnVisibility.staff,
    },
    { 
      key: "approvedDate", 
      title: (
        <span style={{ textTransform: "uppercase", fontWeight: "bold" }}>
          APPROVAL DATE
        </span>
      ), 
      render: (record: HealthCheckResultsResponseDTO) => (
        <span>{formatDateTime(record.approvedDate)}</span>
      ),
      visible: columnVisibility.approvedDate,
    },
    { 
      key: "status", 
      title: (
        <span style={{ textTransform: "uppercase", fontWeight: "bold" }}>
          STATUS
        </span>
      ), 
      render: (record: HealthCheckResultsResponseDTO) => (
        <Tag color={getStatusColor("NoFollowUpRequired")}>
          No Follow-up Required
        </Tag>
      ),
      visible: columnVisibility.status,
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
          <Tooltip title="View details">
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
          
          <Tooltip title="Cancel">
            <Popconfirm
              title="Enter cancellation reason"
              description={
                <Input.TextArea 
                  placeholder="Cancellation reason"
                  onChange={(e) => {
                    (e.target as any).reason = e.target.value;
                  }}
                  rows={3}
                />
              }
              onConfirm={(e) => {
                const target = e?.target as any;
                const reason = target?.reason || "Cancelled by user";
                handleCancel(record.id, reason);
              }}
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

  const columns = ALL_COLUMNS.filter(col => col.visible);

  // Function to determine if any filters are active
  const hasActiveFilters = () => {
    return userSearch || staffSearch || checkupDateRange[0] || checkupDateRange[1] || 
           sortBy !== "CheckupDate" || ascending !== false;
  };

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Button
            icon={<ArrowLeftOutlined />}
            onClick={handleBack}
            style={{ marginRight: "8px" }}
          >
            Back
          </Button>
          <h3 className="text-xl font-bold">Health Check Results - No Follow-up Required</h3>
        </div>
      </div>

      {/* Toolbar Card */}
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
        <div className="mb-3 flex items-center justify-between flex-wrap">
          <div className="flex flex-wrap items-center gap-4 mb-3">
            {/* Code Search - Keep this outside of filter modal */}
            <Input
              placeholder="Search by result code"
              value={codeSearch}
              onChange={(e) => setCodeSearch(e.target.value)}
              prefix={<SearchOutlined />}
              style={{ width: 200 }}
              allowClear
            />

            {/* Column Settings - Moved to the left */}
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
                          <strong>Show all columns</strong>
                        </Checkbox>
                      </div>
                    ),
                  },
                  {
                    key: "divider",
                    type: "divider",
                  },
                  {
                    key: "code",
                    label: (
                      <div onClick={handleMenuClick}>
                        <Checkbox
                          checked={columnVisibility.code}
                          onChange={() => handleColumnVisibilityChange("code")}
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
                          onChange={() => handleColumnVisibilityChange("patient")}
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
                          onChange={() => handleColumnVisibilityChange("checkupDate")}
                        >
                          Checkup Date
                        </Checkbox>
                      </div>
                    ),
                  },
                  {
                    key: "staff",
                    label: (
                      <div onClick={handleMenuClick}>
                        <Checkbox
                          checked={columnVisibility.staff}
                          onChange={() => handleColumnVisibilityChange("staff")}
                        >
                          Doctor / Nurse
                        </Checkbox>
                      </div>
                    ),
                  },
                  {
                    key: "approvedDate",
                    label: (
                      <div onClick={handleMenuClick}>
                        <Checkbox
                          checked={columnVisibility.approvedDate}
                          onChange={() => handleColumnVisibilityChange("approvedDate")}
                        >
                          Approval Date
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
                          onChange={() => handleColumnVisibilityChange("status")}
                        >
                          Status
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
                          onChange={() => handleColumnVisibilityChange("actions")}
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
              <Tooltip title="Column settings">
                <Button icon={<SettingOutlined />}>Columns</Button>
              </Tooltip>
            </Dropdown>

            {/* Filter Button */}
            <Tooltip title="Advanced Filters">
              <Button
                icon={<FilterOutlined 
                  style={{
                    color: hasActiveFilters() ? "#1890ff" : undefined,
                  }}
                />}
                onClick={handleOpenFilterModal}
              >
                Filters
              </Button>
            </Tooltip>

            {/* Reset Button - Always visible now */}
            <Tooltip title="Reset filters">
              <Button
                icon={<UndoOutlined />}
                onClick={handleReset}
                disabled={!hasActiveFilters()}
              >
                Reset
              </Button>
            </Tooltip>
          </div>

          <div className="flex flex-wrap items-center gap-4">
            {/* Empty div for spacing - Column settings moved to the left */}
          </div>
        </div>
      </Card>

      {/* Page Size Selection */}
      <div className="flex justify-between items-center mb-4">
        <div></div>
        <div>
          <Typography.Text type="secondary">
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
          </Typography.Text>
        </div>
      </div>

      {/* Results Table */}
      <Card className="shadow-sm">
        <Table
          bordered
          columns={columns}
          dataSource={healthCheckResults}
          loading={loading}
          pagination={false}
          rowKey="id"
          locale={{
            emptyText: <Empty description="No health check results without follow-up required found" />,
          }}
          className="border rounded-lg"
        />
        
        {/* Pagination */}
        <Card className="mt-4 shadow-sm">
          <Row justify="center" align="middle">
            <Space size="large" align="center">
              <Typography.Text type="secondary">Total {total} health check results without follow-up required</Typography.Text>
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
                  <Typography.Text type="secondary">Go to page:</Typography.Text>
                  <InputNumber
                    min={1}
                    max={Math.ceil(total / pageSize)}
                    value={currentPage}
                    onChange={(value: number | null) => {
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

      {/* Filter Modal */}
      <FilterModal
        visible={filterModalVisible}
        onCancel={() => setFilterModalVisible(false)}
        onApply={handleApplyFilters}
        onReset={handleReset}
        filters={{
          userSearch,
          staffSearch,
          checkupDateRange,
          sortBy,
          ascending
        }}
      />
    </div>
  );
}; 