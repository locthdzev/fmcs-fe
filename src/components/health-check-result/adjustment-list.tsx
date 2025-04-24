import React, { useState, useEffect, useCallback } from "react";
import {
  Button,
  Table,
  Input,
  Select,
  DatePicker,
  Pagination,
  Popconfirm,
  Space,
  Row,
  Col,
  Card,
  Typography,
  Badge,
  Tag,
  Tooltip,
  Empty,
  Dropdown,
  Menu,
  Checkbox,
  Modal,
  Form,
  InputNumber,
} from "antd";
import { toast } from "react-toastify";
import moment from "moment";
import {
  getAllHealthCheckResults,
  HealthCheckResultsResponseDTO,
} from "@/api/healthcheckresult";
import {
  SearchOutlined,
  FormOutlined,
  EyeOutlined,
  ArrowLeftOutlined,
  InfoCircleOutlined,
  SettingOutlined,
  FilterOutlined,
  UndoOutlined,
  FileExcelOutlined,
  AppstoreOutlined,
  MoreOutlined,
} from "@ant-design/icons";
import { useRouter } from "next/router";
import EditModal from "./EditModal";
import { getUsers } from "@/api/user";

const { Option } = Select;
const { RangePicker } = DatePicker;
const { Title, Text, Paragraph } = Typography;

const formatDate = (date: string | undefined) => {
  if (!date) return "";
  return moment(date).format("DD/MM/YYYY");
};

const formatDateTime = (datetime: string | undefined) => {
  if (!datetime) return "";
  return moment(datetime).format("DD/MM/YYYY HH:mm:ss");
};

// Filter Modal Component
const HealthCheckFilterModal: React.FC<{
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
}> = ({ visible, onCancel, onApply, onReset, filters }) => {
  const [localFilters, setLocalFilters] = useState(filters);

  // Reset localFilters when modal is opened with new filters
  useEffect(() => {
    if (visible) {
      setLocalFilters(filters);
    }
  }, [visible, filters]);

  // Apply filters
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
      title={
        <Title level={4} style={{ margin: 0 }}>
          Advanced Filters
        </Title>
      }
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
                Person Examined
              </div>
              <Input
                placeholder="Search by patient"
                value={localFilters.userSearch}
                onChange={(e) => updateFilter("userSearch", e.target.value)}
               
                allowClear
                style={{ width: "100%" }}
              />
            </div>
          </Col>

          {/* Medical Staff Search */}
          <Col span={12}>
            <div className="filter-item" style={filterItemStyle}>
              <div className="filter-label" style={filterLabelStyle}>
                Medical Staff
              </div>
              <Input
                placeholder="Search by medical staff"
                value={localFilters.staffSearch}
                onChange={(e) => updateFilter("staffSearch", e.target.value)}
               
                allowClear
                style={{ width: "100%" }}
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
                allowClear
                value={localFilters.checkupDateRange as any}
                onChange={(dates) => updateFilter("checkupDateRange", dates)}
              />
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
                <Option value="CancelledDate">Cancelled Date</Option>
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

export const HealthCheckResultAdjustmentList: React.FC = () => {
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
  const [sortBy, setSortBy] = useState("CancelledDate");
  const [ascending, setAscending] = useState(false);
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [currentResult, setCurrentResult] =
    useState<HealthCheckResultsResponseDTO | null>(null);
  const [userOptions, setUserOptions] = useState<
    { id: string; fullName: string; email: string }[]
  >([]);
  const [staffOptions, setStaffOptions] = useState<
    { id: string; fullName: string; email: string }[]
  >([]);
  const [codeSearch, setCodeSearch] = useState("");
  const [healthCheckCodes, setHealthCheckCodes] = useState<string[]>([]);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [filterModalVisible, setFilterModalVisible] = useState(false);

  // Add column visibility state
  const [columnVisibility, setColumnVisibility] = useState<
    Record<string, boolean>
  >({
    code: true,
    patient: true,
    checkupDate: true,
    staff: true,
    cancelledDate: true,
    reason: true,
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

      const response = await getAllHealthCheckResults(
        currentPage,
        pageSize,
        codeSearch || undefined,
        userSearch || undefined,
        staffSearch || undefined,
        sortBy,
        ascending,
        "CancelledForAdjustment", // Match the actual backend value
        checkupStartDate,
        checkupEndDate
      );

      if (response.success) {
        setHealthCheckResults(response.data);
        setTotal(response.totalRecords);
      } else {
        toast.error(
          response.message ||
            "Failed to load health check results cancelled for adjustment"
        );
      }
    } catch (error) {
      toast.error(
        "Failed to load health check results cancelled for adjustment"
      );
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

  const fetchHealthCheckCodes = useCallback(async () => {
    try {
      const response = await getAllHealthCheckResults(
        1,
        1000, // Lấy số lượng lớn để có thể lấy hết mã
        undefined,
        undefined,
        undefined,
        "CancelledDate",
        false,
        "CancelledForAdjustment",
        undefined,
        undefined
      );

      if (response.success) {
        // Lấy danh sách mã không trùng lặp
        const uniqueCodes = Array.from(
          new Set(
            response.data.map(
              (result: HealthCheckResultsResponseDTO) => result.healthCheckResultCode
            )
          )
        );
        setHealthCheckCodes(uniqueCodes as string[]);
      }
    } catch (error) {
      console.error("Error fetching health check codes:", error);
    }
  }, []);

  useEffect(() => {
    fetchHealthCheckResults();
    fetchHealthCheckCodes(); // Gọi hàm lấy mã khi component mount
  }, [fetchHealthCheckResults, fetchHealthCheckCodes]);

  useEffect(() => {
    const fetchUsers = async () => {
      try {
        // Lấy danh sách người dùng
        const users = await getUsers();

        // Lọc ra người dùng thông thường (không phải staff)
        const normalUsers = users.filter(
          (user: any) =>
            user.roles &&
            !user.roles.some(
              (role: string) => role === "Healthcare Staff" || role === "Admin"
            )
        );
        setUserOptions(
          normalUsers.map((user: any) => ({
            id: user.id,
            fullName: user.fullName,
            email: user.email,
          }))
        );

        // Lấy danh sách staff y tế
        const medicalStaff = users.filter(
          (user: any) =>
            user.roles &&
            user.roles.some((role: string) => role === "Healthcare Staff")
        );
        setStaffOptions(
          medicalStaff.map((staff: any) => ({
            id: staff.id,
            fullName: staff.fullName,
            email: staff.email,
          }))
        );
      } catch (error) {
        console.error("Failed to fetch users:", error);
        toast.error("Không thể tải danh sách người dùng");
      }
    };

    fetchUsers();
  }, []);

  const handleEdit = (record: HealthCheckResultsResponseDTO) => {
    setCurrentResult(record);
    setIsModalVisible(true);
  };

  const handleCloseModal = () => {
    setIsModalVisible(false);
    setCurrentResult(null);
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

  const handleResetFilters = () => {
    setUserSearch("");
    setStaffSearch("");
    setCheckupDateRange([null, null]);
    setSortBy("CancelledDate");
    setAscending(false);
    setFilterModalVisible(false);
    setCurrentPage(1);
  };

  // Column visibility functions
  const handleColumnVisibilityChange = (key: string) => {
    setColumnVisibility((prev) => ({
      ...prev,
      [key]: !prev[key],
    }));
  };

  const toggleAllColumns = (checked: boolean) => {
    const newVisibility = { ...columnVisibility };
    Object.keys(newVisibility).forEach((key) => {
      newVisibility[key] = checked;
    });
    setColumnVisibility(newVisibility);
  };

  const areAllColumnsVisible = () => {
    return Object.values(columnVisibility).every((value) => value === true);
  };

  const handleDropdownVisibleChange = (visible: boolean) => {
    setDropdownOpen(visible);
  };

  const handleMenuClick = (e: React.MouseEvent) => {
    e.stopPropagation();
  };

  // Reset all filters
  const handleReset = () => {
    setCodeSearch("");
    setUserSearch("");
    setStaffSearch("");
    setCheckupDateRange([null, null]);
    setSortBy("CancelledDate");
    setAscending(false);
    setCurrentPage(1);
  };

  const ALL_COLUMNS = [
    {
      key: "code",
      title: (
        <span style={{ textTransform: "uppercase", fontWeight: "bold" }}>
          HEALTH CHECK RESULT CODE
        </span>
      ),
      render: (record: HealthCheckResultsResponseDTO) => (
        <Typography.Link onClick={() => router.push(`/health-check-result/${record.id}`)}>
          {record.healthCheckResultCode}
        </Typography.Link>
      ),
      visible: columnVisibility.code,
    },
    {
      key: "patient",
      title: (
        <span style={{ textTransform: "uppercase", fontWeight: "bold" }}>
          PERSON EXAMINED
        </span>
      ),
      render: (record: HealthCheckResultsResponseDTO) => (
        <div>
          <Text strong>{record.user?.fullName}</Text>
          <div>
            <Text type="secondary" className="text-sm">
              {record.user?.email}
            </Text>
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
      render: (record: HealthCheckResultsResponseDTO) =>
        formatDate(record.checkupDate),
      visible: columnVisibility.checkupDate,
    },
    {
      key: "staff",
      title: (
        <span style={{ textTransform: "uppercase", fontWeight: "bold" }}>
          MEDICAL STAFF
        </span>
      ),
      render: (record: HealthCheckResultsResponseDTO) => (
        <div>
          <Text>{record.staff?.fullName}</Text>
          <div>
            <Text type="secondary" className="text-sm">
              {record.staff?.email}
            </Text>
          </div>
        </div>
      ),
      visible: columnVisibility.staff,
    },
    {
      key: "cancelledDate",
      title: (
        <span style={{ textTransform: "uppercase", fontWeight: "bold" }}>
          CANCELLED DATE
        </span>
      ),
      render: (record: HealthCheckResultsResponseDTO) =>
        formatDateTime(record.cancelledDate),
      visible: columnVisibility.cancelledDate,
    },
    {
      key: "reason",
      title: (
        <span style={{ textTransform: "uppercase", fontWeight: "bold" }}>
          CANCELLATION REASON
        </span>
      ),
      render: (record: HealthCheckResultsResponseDTO) => (
        <Tooltip title={record.cancellationReason}>
          <Paragraph ellipsis={{ rows: 2 }}>
            {record.cancellationReason || "No reason provided"}
          </Paragraph>
        </Tooltip>
      ),
      visible: columnVisibility.reason,
    },
    {
      key: "actions",
      title: (
        <span style={{ textTransform: "uppercase", fontWeight: "bold" }}>
          ACTIONS
        </span>
      ),
      render: (record: HealthCheckResultsResponseDTO) => (
        <div style={{ textAlign: "center" }}>
          <Dropdown
            overlay={
              <Menu>
                <Menu.Item
                  key="view"
                  icon={<EyeOutlined />}
                  onClick={() => router.push(`/health-check-result/${record.id}`)}
                >
                  View Details
                </Menu.Item>
                
                <Menu.Item
                  key="edit"
                  icon={<FormOutlined style={{ color: "blue" }} />}
                  onClick={() => handleEdit(record)}
                >
                  <span style={{ color: "blue" }}>Edit</span>
                </Menu.Item>
              </Menu>
            }
            placement="bottomCenter"
          >
            <Button icon={<MoreOutlined />} size="small" />
          </Dropdown>
        </div>
      ),
      visible: columnVisibility.actions,
    },
  ];

  const columns = ALL_COLUMNS.filter((col) => col.visible);

  // Check if any filter is applied
  const isFilterApplied =
    userSearch ||
    staffSearch ||
    checkupDateRange[0] ||
    checkupDateRange[1] ||
    sortBy !== "CancelledDate" ||
    ascending !== false;

  return (
    <div className="p-6">
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
            Health Check Results Cancelled for Adjustment
          </h3>
        </div>
      </div>

      {/* Toolbar */}
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
          <div className="flex flex-wrap items-center gap-4">
            {/* Thay thế Input bằng Select */}
            <Select
              placeholder="Search by result code"
             
              value={codeSearch || undefined}
              onChange={(value) => setCodeSearch(value)}
              allowClear
              showSearch
              style={{ width: 250 }}
              optionFilterProp="children"
              filterOption={(input, option) =>
                (option?.label ?? '').toLowerCase().includes(input.toLowerCase())
              }
              options={healthCheckCodes.map(code => ({
                value: code,
                label: code
              }))}
            />

            {/* Filter Button */}
            <Tooltip title="Advanced filters">
              <Button
                icon={
                  <FilterOutlined
                    style={{
                      color: isFilterApplied ? "#1890ff" : undefined,
                    }}
                  />
                }
                onClick={handleOpenFilterModal}
              >
                Filter
                {isFilterApplied && (
                  <Badge
                    count="!"
                    size="small"
                    offset={[5, -5]}
                    style={{ backgroundColor: "#1890ff" }}
                  />
                )}
              </Button>
            </Tooltip>

            {/* Reset Button */}
            <Tooltip title="Reset all filters">
              <Button
                icon={<UndoOutlined />}
                onClick={handleReset}
                disabled={!(codeSearch || isFilterApplied)}
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
                    key: "staff",
                    label: (
                      <div onClick={handleMenuClick}>
                        <Checkbox
                          checked={columnVisibility.staff}
                          onChange={() => handleColumnVisibilityChange("staff")}
                        >
                          Medical Staff
                        </Checkbox>
                      </div>
                    ),
                  },
                  {
                    key: "cancelledDate",
                    label: (
                      <div onClick={handleMenuClick}>
                        <Checkbox
                          checked={columnVisibility.cancelledDate}
                          onChange={() =>
                            handleColumnVisibilityChange("cancelledDate")
                          }
                        >
                          Cancelled Date
                        </Checkbox>
                      </div>
                    ),
                  },
                  {
                    key: "reason",
                    label: (
                      <div onClick={handleMenuClick}>
                        <Checkbox
                          checked={columnVisibility.reason}
                          onChange={() =>
                            handleColumnVisibilityChange("reason")
                          }
                        >
                          Cancellation Reason
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
              <Tooltip title="Column settings">
                <Button icon={<SettingOutlined />}>Columns</Button>
              </Tooltip>
            </Dropdown>
          </div>
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

      
      </Card>

      {/* Results Table */}
      <Card className="shadow-sm">
        <Table
          columns={columns}
          dataSource={healthCheckResults}
          loading={loading}
          pagination={false}
          rowKey="id"
          locale={{
            emptyText: (
              <Empty description="No health check results cancelled for adjustment found" />
            ),
          }}
          className="border rounded-lg"
        />
      </Card>

      {/* Pagination */}
      <Card className="mt-4 shadow-sm">
        <Row justify="center" align="middle">
          <Space size="large" align="center">
            <Typography.Text type="secondary">
              Total: {total} health check results
            </Typography.Text>
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

      {/* Edit Modal */}
      <EditModal
        visible={isModalVisible}
        onClose={handleCloseModal}
        onSuccess={fetchHealthCheckResults}
        healthCheckResult={currentResult}
        userOptions={userOptions}
        staffOptions={staffOptions}
      />

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
          sortBy,
          ascending,
        }}
      />
    </div>
  );
};
