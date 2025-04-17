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
  Input as AntInput,
  Form,
  message,
  InputNumber,
  Modal,
} from "antd";
import { toast } from "react-toastify";
import moment from "moment";
import {
  getAllHealthCheckResults,
  HealthCheckResultsResponseDTO,
  approveHealthCheckResult,
  cancelCompletelyHealthCheckResult,
  cancelForAdjustmentHealthCheckResult,
} from "@/api/healthcheckresult";
import {
  SearchOutlined,
  CheckCircleOutlined,
  EyeOutlined,
  CloseCircleOutlined,
  FilterOutlined,
  ArrowLeftOutlined,
  CloseSquareOutlined,
  UndoOutlined,
  SettingOutlined,
  AppstoreOutlined,
  TagOutlined,
  FileExcelOutlined,
} from "@ant-design/icons";
import { useRouter } from "next/router";

const { Option } = Select;
const { RangePicker } = DatePicker;
const { Title, Text } = Typography;
const { TextArea } = AntInput;

// Filter Modal Component
interface HealthCheckFilterModalProps {
  visible: boolean;
  onCancel: () => void;
  onApply: (filters: any) => void;
  onReset: () => void;
  filters: {
    userSearch: string;
    staffSearch: string;
    checkupDateRange: [moment.Moment | null, moment.Moment | null];
    followUpRequired: boolean | undefined;
    followUpDateRange: [moment.Moment | null, moment.Moment | null];
    sortBy: string;
    ascending: boolean;
  };
}

const HealthCheckFilterModal: React.FC<HealthCheckFilterModalProps> = ({
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
      width={800}
      footer={[
        <Button key="reset" onClick={onReset} icon={<UndoOutlined />}>
          Reset
        </Button>,
        <Button
          key="apply"
          type="primary"
          onClick={handleApply}
          icon={<CheckCircleOutlined />}
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
                Patient
              </div>
              <Input
                placeholder="Search by patient"
                value={localFilters.userSearch}
                onChange={(e) => updateFilter("userSearch", e.target.value)}
                prefix={<SearchOutlined />}
                style={{ width: "100%" }}
                allowClear
              />
            </div>
          </Col>

          {/* Staff Search */}
          <Col span={12}>
            <div className="filter-item" style={filterItemStyle}>
              <div className="filter-label" style={filterLabelStyle}>
                Medical Staff
              </div>
              <Input
                placeholder="Search by medical staff"
                value={localFilters.staffSearch}
                onChange={(e) => updateFilter("staffSearch", e.target.value)}
                prefix={<SearchOutlined />}
                style={{ width: "100%" }}
                allowClear
              />
            </div>
          </Col>
        </Row>

        <Row gutter={16}>
          {/* Checkup Date Range */}
          <Col span={12}>
            <div className="filter-item" style={filterItemStyle}>
              <div className="filter-label" style={filterLabelStyle}>
                Checkup Date Range
              </div>
              <RangePicker
                style={{ width: "100%" }}
                placeholder={["From checkup date", "To checkup date"]}
                format="DD/MM/YYYY"
                allowClear
                value={localFilters.checkupDateRange as any}
                onChange={(dates) => updateFilter("checkupDateRange", dates)}
              />
            </div>
          </Col>

          {/* Follow-up Date Range */}
          <Col span={12}>
            <div className="filter-item" style={filterItemStyle}>
              <div className="filter-label" style={filterLabelStyle}>
                Follow-up Date Range
              </div>
              <RangePicker
                style={{ width: "100%" }}
                placeholder={["From follow-up date", "To follow-up date"]}
                format="DD/MM/YYYY"
                allowClear
                value={localFilters.followUpDateRange as any}
                onChange={(dates) => updateFilter("followUpDateRange", dates)}
              />
            </div>
          </Col>
        </Row>

        <Row gutter={16}>
          {/* Follow-up Required */}
          <Col span={12}>
            <div className="filter-item" style={filterItemStyle}>
              <div className="filter-label" style={filterLabelStyle}>
                Follow-up Required
              </div>
              <Select
                placeholder="Select follow-up status"
                style={{ width: "100%" }}
                value={
                  localFilters.followUpRequired === undefined
                    ? undefined
                    : localFilters.followUpRequired
                    ? "yes"
                    : "no"
                }
                onChange={(value) =>
                  updateFilter(
                    "followUpRequired",
                    value === undefined ? undefined : value === "yes"
                  )
                }
                allowClear
              >
                <Option value="yes">Yes</Option>
                <Option value="no">No</Option>
              </Select>
            </div>
          </Col>

          {/* Sort By */}
          <Col span={12}>
            <div className="filter-item" style={filterItemStyle}>
              <div className="filter-label" style={filterLabelStyle}>
                Sort By
              </div>
              <Select
                placeholder="Sort by"
                value={localFilters.sortBy}
                onChange={(value) => updateFilter("sortBy", value)}
                style={{ width: "100%" }}
              >
                <Option value="CheckupDate">Checkup Date</Option>
                <Option value="CreatedAt">Created Date</Option>
              </Select>
            </div>
          </Col>
        </Row>

        <Row gutter={16}>
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

const formatDate = (date: string | undefined) => {
  if (!date) return "";
  return moment(date).format("DD/MM/YYYY");
};

const formatDateTime = (datetime: string | undefined) => {
  if (!datetime) return "";
  return moment(datetime).format("DD/MM/YYYY HH:mm:ss");
};

export const HealthCheckResultWaitingForApprovalList: React.FC = () => {
  const router = useRouter();
  const [healthCheckResults, setHealthCheckResults] = useState<
    HealthCheckResultsResponseDTO[]
  >([]);
  const [loading, setLoading] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [total, setTotal] = useState(0);
  const [userSearch, setUserSearch] = useState("");
  const [staffSearch, setStaffSearch] = useState("");
  const [checkupDateRange, setCheckupDateRange] = useState<
    [moment.Moment | null, moment.Moment | null]
  >([null, null]);
  const [followUpRequired, setFollowUpRequired] = useState<
    boolean | undefined
  >();
  const [followUpDateRange, setFollowUpDateRange] = useState<
    [moment.Moment | null, moment.Moment | null]
  >([null, null]);
  const [sortBy, setSortBy] = useState("CheckupDate");
  const [ascending, setAscending] = useState(false);
  const [codeSearch, setCodeSearch] = useState("");
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [selectedRowKeys, setSelectedRowKeys] = useState<React.Key[]>([]);
  const [messageApi, contextHolder] = message.useMessage();
  const [filterModalVisible, setFilterModalVisible] = useState(false);

  // Column visibility state
  const [columnVisibility, setColumnVisibility] = useState<
    Record<string, boolean>
  >({
    healthCheckResultCode: true,
    patient: true,
    checkupDate: true,
    medicalStaff: true,
    followUp: true,
    actions: true,
  });

  const fetchHealthCheckResults = useCallback(async () => {
    setLoading(true);
    try {
      const checkupStartDate = checkupDateRange[0]
        ? checkupDateRange[0].format("YYYY-MM-DD")
        : undefined;
      const checkupEndDate = checkupDateRange[1]
        ? checkupDateRange[1].format("YYYY-MM-DD")
        : undefined;
      const followUpStartDate = followUpDateRange[0]
        ? followUpDateRange[0].format("YYYY-MM-DD")
        : undefined;
      const followUpEndDate = followUpDateRange[1]
        ? followUpDateRange[1].format("YYYY-MM-DD")
        : undefined;

      const response = await getAllHealthCheckResults(
        currentPage,
        pageSize,
        codeSearch || undefined,
        userSearch || undefined,
        staffSearch || undefined,
        sortBy,
        ascending,
        "Waiting for Approval",
        checkupStartDate,
        checkupEndDate,
        followUpRequired,
        followUpStartDate,
        followUpEndDate
      );

      if (response.isSuccess) {
        setHealthCheckResults(response.data);
        setTotal(response.totalRecords);
      } else {
        messageApi.error(
          response.message ||
            "Failed to load health check results waiting for approval"
        );
      }
    } catch (error) {
      messageApi.error(
        "Failed to load health check results waiting for approval"
      );
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
    followUpRequired,
    followUpDateRange,
    codeSearch,
    messageApi,
  ]);

  useEffect(() => {
    fetchHealthCheckResults();
  }, [fetchHealthCheckResults]);

  const handleApprove = async (id: string) => {
    try {
      const response = await approveHealthCheckResult(id);
      if (response.isSuccess) {
        messageApi.success("Health check result has been approved!");
        fetchHealthCheckResults();
      } else {
        messageApi.error(
          response.message || "Failed to approve health check result"
        );
      }
    } catch (error) {
      messageApi.error("Failed to approve health check result");
    }
  };

  const handleCancel = async (id: string, reason: string) => {
    try {
      const response = await cancelCompletelyHealthCheckResult(id, reason);
      if (response.isSuccess) {
        messageApi.success("Health check result has been cancelled!");
        fetchHealthCheckResults();
      } else {
        messageApi.error(
          response.message || "Failed to cancel health check result"
        );
      }
    } catch (error) {
      messageApi.error("Failed to cancel health check result");
    }
  };

  const handleCancelForAdjustment = async (id: string, reason: string) => {
    try {
      const response = await cancelForAdjustmentHealthCheckResult(id, reason);
      if (response.isSuccess) {
        messageApi.success(
          "Health check result has been cancelled for adjustment!"
        );
        fetchHealthCheckResults();
      } else {
        messageApi.error(
          response.message ||
            "Failed to cancel health check result for adjustment"
        );
      }
    } catch (error) {
      messageApi.error("Failed to cancel health check result for adjustment");
    }
  };

  // Handle column visibility change
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

  // Handle opening the filter modal
  const handleOpenFilterModal = () => {
    setFilterModalVisible(true);
  };

  // Handle applying filters from the modal
  const handleApplyFilters = (filters: any) => {
    setUserSearch(filters.userSearch);
    setStaffSearch(filters.staffSearch);
    setCheckupDateRange(filters.checkupDateRange);
    setFollowUpRequired(filters.followUpRequired);
    setFollowUpDateRange(filters.followUpDateRange);
    setSortBy(filters.sortBy);
    setAscending(filters.ascending);
    setFilterModalVisible(false);
    setCurrentPage(1); // Reset to first page after applying filters
  };

  // Handle resetting all filters
  const handleResetFilters = () => {
    setUserSearch("");
    setStaffSearch("");
    setCheckupDateRange([null, null]);
    setFollowUpRequired(undefined);
    setFollowUpDateRange([null, null]);
    setSortBy("CheckupDate");
    setAscending(false);
    setFilterModalVisible(false);
    setCurrentPage(1); // Reset to first page after clearing filters
  };

  // Handle general reset (for the Reset button in toolbar)
  const handleReset = () => {
    setCodeSearch("");
    setUserSearch("");
    setStaffSearch("");
    setCheckupDateRange([null, null]);
    setFollowUpRequired(undefined);
    setFollowUpDateRange([null, null]);
    setSortBy("CheckupDate");
    setAscending(false);
    setCurrentPage(1);
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
      sorter: true,
      visible: columnVisibility.checkupDate,
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
      key: "followUp",
      title: (
        <span style={{ textTransform: "uppercase", fontWeight: "bold" }}>
          FOLLOW-UP
        </span>
      ),
      dataIndex: "followUpRequired",
      render: (
        followUpRequired: boolean,
        record: HealthCheckResultsResponseDTO
      ) => (
        <Space direction="vertical" size={0}>
          {followUpRequired ? (
            <>
              <Badge status="processing" text="Follow-up Required" />
              <Text>
                {record.followUpDate
                  ? formatDate(record.followUpDate)
                  : "Not scheduled yet"}
              </Text>
            </>
          ) : (
            <Badge status="default" text="No Follow-up Required" />
          )}
        </Space>
      ),
      visible: columnVisibility.followUp,
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

          <Tooltip title="Approve">
            <Button
              type="text"
              icon={<CheckCircleOutlined />}
              onClick={() => handleApprove(record.id)}
              className="text-green-600"
            />
          </Tooltip>

          <Tooltip title="Cancel">
            <Popconfirm
              title="Enter reason for cancellation"
              description={
                <TextArea
                  placeholder="Reason for cancellation"
                  onChange={(e) => {
                    (e.target as any).reason = e.target.value;
                  }}
                  rows={3}
                />
              }
              onConfirm={(e) => {
                const target = e?.target as any;
                const reason = target?.reason || "No reason provided";
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

          <Tooltip title="Cancel for Adjustment">
            <Popconfirm
              title="Enter reason for adjustment"
              description={
                <TextArea
                  placeholder="Reason for adjustment"
                  onChange={(e) => {
                    (e.target as any).reason = e.target.value;
                  }}
                  rows={3}
                />
              }
              onConfirm={(e) => {
                const target = e?.target as any;
                const reason = target?.reason || "No reason provided";
                handleCancelForAdjustment(record.id, reason);
              }}
              okText="Confirm"
              cancelText="Cancel"
            >
              <Button
                type="text"
                icon={<CloseSquareOutlined />}
                className="text-yellow-600"
              />
            </Popconfirm>
          </Tooltip>
        </Space>
      ),
      visible: columnVisibility.actions,
    },
  ];

  // Filter columns by visibility
  const columns = ALL_COLUMNS.filter((col) => col.visible);

  return (
    <div className="history-container" style={{ padding: "20px" }}>
      {contextHolder}

      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Button
            icon={<ArrowLeftOutlined />}
            onClick={() => router.push("/health-check-result/management")}
            style={{ marginRight: "8px" }}
          >
            Back
          </Button>
          <h3 className="text-xl font-bold">
            Health Check Results Waiting for Approval
          </h3>
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
            {/* Code Search */}
            <Input
              placeholder="Search by result code"
              value={codeSearch}
              onChange={(e) => setCodeSearch(e.target.value)}
              prefix={<SearchOutlined />}
              style={{ width: 200 }}
              allowClear
            />

            {/* Advanced Filters Button */}
            <Tooltip title="Advanced Filters">
              <Button
                icon={
                  <FilterOutlined
                    style={{
                      color:
                        userSearch ||
                        staffSearch ||
                        checkupDateRange[0] ||
                        checkupDateRange[1] ||
                        followUpDateRange[0] ||
                        followUpDateRange[1] ||
                        followUpRequired !== undefined ||
                        sortBy !== "CheckupDate" ||
                        ascending !== false
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
                    codeSearch ||
                    userSearch ||
                    staffSearch ||
                    checkupDateRange[0] ||
                    checkupDateRange[1] ||
                    followUpRequired !== undefined ||
                    followUpDateRange[0] ||
                    followUpDateRange[1] ||
                    sortBy !== "CheckupDate" ||
                    ascending !== false
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
                    key: "healthCheckResultCode",
                    label: (
                      <div onClick={handleMenuClick}>
                        <Checkbox
                          checked={columnVisibility.healthCheckResultCode}
                          onChange={() =>
                            handleColumnVisibilityChange(
                              "healthCheckResultCode"
                            )
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
                    key: "followUp",
                    label: (
                      <div onClick={handleMenuClick}>
                        <Checkbox
                          checked={columnVisibility.followUp}
                          onChange={() =>
                            handleColumnVisibilityChange("followUp")
                          }
                        >
                          Follow-up
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
          </div>

          <div>
            {/* Export Button */}
            <Button
              type="primary"
              icon={<FileExcelOutlined />}
              onClick={() => {
                // You would implement export functionality here
                messageApi.info("Export feature would be implemented here");
              }}
              disabled={loading}
            >
              Export to Excel
            </Button>
          </div>
        </div>
      </Card>

      {/* Selection Actions and Rows per page */}
      <div className="flex justify-between items-center mb-4">
        {/* Selection Actions */}
        <div>
          {selectedRowKeys.length > 0 && (
            <Space>
              <Text>{selectedRowKeys.length} Items selected</Text>
              <Button
                type="primary"
                icon={<CheckCircleOutlined />}
                onClick={() => {
                  // This is a placeholder - you would need to implement a bulk approve API
                  // For now, we'll approve them one by one
                  let successCount = 0;
                  for (const id of selectedRowKeys) {
                    handleApprove(id as string);
                    successCount++;
                  }

                  if (successCount > 0) {
                    messageApi.success(
                      `${successCount} health check results have been approved!`
                    );
                    setSelectedRowKeys([]);
                    fetchHealthCheckResults();
                  }
                }}
              >
                Approve Selected
              </Button>
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
          className="border rounded-lg"
          locale={{
            emptyText: (
              <Empty description="No health check results waiting for approval" />
            ),
          }}
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

      {/* Filter Modal */}
      <HealthCheckFilterModal
        visible={filterModalVisible}
        onCancel={() => setFilterModalVisible(false)}
        onApply={handleApplyFilters}
        onReset={handleResetFilters}
        filters={{
          userSearch,
          staffSearch,
          checkupDateRange,
          followUpRequired,
          followUpDateRange,
          sortBy,
          ascending,
        }}
      />
    </div>
  );
};
