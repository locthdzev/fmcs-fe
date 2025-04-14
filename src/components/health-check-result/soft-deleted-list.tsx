import React, { useState, useEffect, useCallback } from "react";
import {
  Table,
  Card,
  Button,
  Space,
  Typography,
  Pagination,
  Input,
  Select,
  Row,
  Col,
  Tag,
  Popconfirm,
  Tooltip,
  Badge,
  Empty,
  InputNumber,
  Dropdown,
  Menu,
  Checkbox,
  Form,
  Divider,
  Modal,
  DatePicker,
} from "antd";
import { toast } from "react-toastify";
import {
  getSoftDeletedHealthCheckResults,
  restoreSoftDeletedHealthCheckResults,
  HealthCheckResultsResponseDTO,
} from "@/api/healthcheckresult";
import {
  SearchOutlined,
  UndoOutlined,
  CheckCircleOutlined,
  ArrowLeftOutlined,
  SettingOutlined,
  FilterOutlined,
  AppstoreOutlined,
  ReloadOutlined,
  DeleteOutlined,
  EyeOutlined,
} from "@ant-design/icons";
import { useRouter } from "next/router";
import moment from "moment";
import { HealthInsuranceIcon } from "@/dashboard/sidebar/icons/HealthInsuranceIcon";

const { Title, Text } = Typography;
const { Option } = Select;

// Filter Modal Component
interface FilterModalProps {
  visible: boolean;
  onCancel: () => void;
  onApply: (filters: any) => void;
  onReset: () => void;
  filters: {
    userSearch: string;
    staffSearch: string;
    sortBy: string;
    ascending: boolean;
    checkupDateRange: [moment.Moment | null, moment.Moment | null];
  };
}

const FilterModal: React.FC<FilterModalProps> = ({
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
      title="Bộ lọc nâng cao"
      open={visible}
      onCancel={onCancel}
      width={600}
      footer={[
        <Button key="reset" onClick={onReset} icon={<ReloadOutlined />}>
          Đặt lại
        </Button>,
        <Button
          key="apply"
          type="primary"
          onClick={handleApply}
          icon={<FilterOutlined />}
        >
          Áp dụng
        </Button>,
      ]}
    >
      <Space direction="vertical" style={{ width: "100%" }}>
        <Row gutter={16}>
          {/* User Search */}
          <Col span={24}>
            <div className="filter-item" style={filterItemStyle}>
              <div className="filter-label" style={filterLabelStyle}>
                Bệnh nhân
              </div>
              <Input
                placeholder="Tìm theo bệnh nhân"
                value={localFilters.userSearch}
                onChange={(e) => updateFilter("userSearch", e.target.value)}
                prefix={<SearchOutlined />}
                allowClear
                style={{ width: "100%" }}
              />
            </div>
          </Col>

          {/* Staff Search */}
          <Col span={24}>
            <div className="filter-item" style={filterItemStyle}>
              <div className="filter-label" style={filterLabelStyle}>
                Bác sĩ / Y tá
              </div>
              <Input
                placeholder="Tìm theo bác sĩ/y tá"
                value={localFilters.staffSearch}
                onChange={(e) => updateFilter("staffSearch", e.target.value)}
                prefix={<SearchOutlined />}
                allowClear
                style={{ width: "100%" }}
              />
            </div>
          </Col>

          {/* Checkup Date Range */}
          <Col span={24}>
            <div className="filter-item" style={filterItemStyle}>
              <div className="filter-label" style={filterLabelStyle}>
                Khoảng thời gian khám
              </div>
              <DatePicker.RangePicker
                style={{ width: "100%" }}
                placeholder={["Từ ngày", "Đến ngày"]}
                format="DD/MM/YYYY"
                allowClear
                value={localFilters.checkupDateRange as any}
                onChange={(dates) => updateFilter("checkupDateRange", dates)}
              />
            </div>
          </Col>
        </Row>

        <Row gutter={16}>
          {/* Sort By */}
          <Col span={12}>
            <div className="filter-item" style={filterItemStyle}>
              <div className="filter-label" style={filterLabelStyle}>
                Sắp xếp theo
              </div>
              <Select
                placeholder="Sắp xếp theo"
                value={localFilters.sortBy}
                onChange={(value) => updateFilter("sortBy", value)}
                style={{ width: "100%" }}
              >
                <Option value="CheckupDate">Ngày khám</Option>
                <Option value="CreatedAt">Ngày tạo</Option>
                <Option value="UpdatedAt">Ngày cập nhật</Option>
              </Select>
            </div>
          </Col>

          {/* Order */}
          <Col span={12}>
            <div className="filter-item" style={filterItemStyle}>
              <div className="filter-label" style={filterLabelStyle}>
                Thứ tự
              </div>
              <Select
                placeholder="Thứ tự"
                value={localFilters.ascending ? "asc" : "desc"}
                onChange={(value) => updateFilter("ascending", value === "asc")}
                style={{ width: "100%" }}
              >
                <Option value="asc">Tăng dần</Option>
                <Option value="desc">Giảm dần</Option>
              </Select>
            </div>
          </Col>
        </Row>
      </Space>
    </Modal>
  );
};

export const SoftDeletedHealthCheckResults: React.FC = () => {
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
  const [codeSearch, setCodeSearch] = useState("");
  const [sortBy, setSortBy] = useState("CheckupDate");
  const [ascending, setAscending] = useState(false);
  const [selectedRowKeys, setSelectedRowKeys] = useState<React.Key[]>([]);
  const [filterModalVisible, setFilterModalVisible] = useState(false);
  const [checkupDateRange, setCheckupDateRange] = useState<
    [moment.Moment | null, moment.Moment | null]
  >([null, null]);

  // Add column visibility state similar to health check result index
  const [columnVisibility, setColumnVisibility] = useState<
    Record<string, boolean>
  >({
    code: true,
    patient: true,
    checkupDate: true,
    staff: true,
    actions: true,
  });
  const [dropdownOpen, setDropdownOpen] = useState(false);

  const fetchSoftDeletedHealthCheckResults = useCallback(async () => {
    setLoading(true);
    try {
      // Convert date range to string format if provided
      const checkupStartDate = checkupDateRange[0]
        ? checkupDateRange[0].format("YYYY-MM-DD")
        : undefined;
      const checkupEndDate = checkupDateRange[1]
        ? checkupDateRange[1].format("YYYY-MM-DD")
        : undefined;

      const response = await getSoftDeletedHealthCheckResults(
        currentPage,
        pageSize,
        userSearch || undefined,
        staffSearch || undefined,
        sortBy,
        ascending
      );

      if (response.isSuccess) {
        let filteredResults = [...response.data];

        // If we have codeSearch, filter results manually
        if (codeSearch) {
          filteredResults = filteredResults.filter(
            (result: HealthCheckResultsResponseDTO) =>
              result.healthCheckResultCode
                .toLowerCase()
                .includes(codeSearch.toLowerCase())
          );
        }

        // If date range is provided, filter results manually
        if (checkupStartDate || checkupEndDate) {
          filteredResults = filteredResults.filter(
            (result: HealthCheckResultsResponseDTO) => {
              const checkupDate = moment(result.checkupDate);

              // Check start date condition if provided
              const afterStartDate = checkupStartDate
                ? checkupDate.isSameOrAfter(moment(checkupStartDate))
                : true;

              // Check end date condition if provided
              const beforeEndDate = checkupEndDate
                ? checkupDate.isSameOrBefore(moment(checkupEndDate))
                : true;

              return afterStartDate && beforeEndDate;
            }
          );
        }

        setHealthCheckResults(filteredResults);

        // If any client-side filtering is applied, update total count
        if (codeSearch || checkupStartDate || checkupEndDate) {
          setTotal(filteredResults.length);
        } else {
          setTotal(response.totalRecords);
        }
      } else {
        toast.error(
          response.message || "Không thể tải danh sách kết quả khám đã xóa"
        );
      }
    } catch (error) {
      toast.error("Không thể tải danh sách kết quả khám đã xóa");
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
    codeSearch,
    checkupDateRange,
  ]);

  useEffect(() => {
    fetchSoftDeletedHealthCheckResults();
  }, [fetchSoftDeletedHealthCheckResults]);

  const handleRestore = async (ids: string[]) => {
    try {
      const response = await restoreSoftDeletedHealthCheckResults(ids);
      if (response.isSuccess) {
        toast.success("Khôi phục kết quả khám thành công!");
        setSelectedRowKeys([]);
        fetchSoftDeletedHealthCheckResults();
      } else {
        toast.error(response.message || "Không thể khôi phục kết quả khám");
      }
    } catch (error) {
      toast.error("Không thể khôi phục kết quả khám");
    }
  };

  const formatDate = (date: string | undefined) => {
    if (!date) return "";
    return moment(date).format("DD/MM/YYYY");
  };

  // Column visibility handlers
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

  // Filter modal handlers
  const handleOpenFilterModal = () => {
    setFilterModalVisible(true);
  };

  const handleApplyFilters = (filters: any) => {
    setUserSearch(filters.userSearch);
    setStaffSearch(filters.staffSearch);
    setSortBy(filters.sortBy);
    setAscending(filters.ascending);
    setCheckupDateRange(filters.checkupDateRange);
    setFilterModalVisible(false);
    setCurrentPage(1);
  };

  // Handle reset filters
  const handleResetFilters = () => {
    setUserSearch("");
    setStaffSearch("");
    setSortBy("CheckupDate");
    setAscending(false);
    setCheckupDateRange([null, null]);
    setFilterModalVisible(false);
    setCurrentPage(1);
  };

  // Handle reset all filters (including code search)
  const handleReset = () => {
    setCodeSearch("");
    setUserSearch("");
    setStaffSearch("");
    setSortBy("CheckupDate");
    setAscending(false);
    setCheckupDateRange([null, null]);
    setCurrentPage(1);
  };

  // All columns definition with visibility control
  const ALL_COLUMNS = [
    {
      key: "code",
      title: (
        <span style={{ textTransform: "uppercase", fontWeight: "bold" }}>
          MÃ KẾT QUẢ KHÁM
        </span>
      ),
      dataIndex: "healthCheckResultCode",
      render: (code: string) => <Text copyable>{code}</Text>,
      visible: columnVisibility.code,
    },
    {
      key: "patient",
      title: (
        <span style={{ textTransform: "uppercase", fontWeight: "bold" }}>
          BỆNH NHÂN
        </span>
      ),
      render: (record: HealthCheckResultsResponseDTO) => (
        <div className="flex flex-col">
          <Text strong>{record.user.fullName}</Text>
          <Text type="secondary" className="text-sm">
            {record.user.email}
          </Text>
        </div>
      ),
      visible: columnVisibility.patient,
    },
    {
      key: "checkupDate",
      title: (
        <span style={{ textTransform: "uppercase", fontWeight: "bold" }}>
          NGÀY KHÁM
        </span>
      ),
      render: (record: HealthCheckResultsResponseDTO) => (
        <Tooltip title="Nhấn để xem chi tiết">
          <Typography.Link
            onClick={() => router.push(`/health-check-result/${record.id}`)}
          >
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
          BÁC SĨ / Y TÁ
        </span>
      ),
      render: (record: HealthCheckResultsResponseDTO) => (
        <div className="flex flex-col">
          <Text>{record.staff.fullName}</Text>
          <Text type="secondary" className="text-sm">
            {record.staff.email}
          </Text>
        </div>
      ),
      visible: columnVisibility.staff,
    },
    {
      key: "actions",
      title: (
        <span style={{ textTransform: "uppercase", fontWeight: "bold" }}>
          THAO TÁC
        </span>
      ),
      render: (record: HealthCheckResultsResponseDTO) => (
        <Space>
          <Tooltip title="Xem chi tiết">
            <Button
              type="text"
              icon={<EyeOutlined />}
              onClick={() => router.push(`/health-check-result/${record.id}`)}
            />
          </Tooltip>
          <Tooltip title="Khôi phục">
            <Button
              type="text"
              icon={<UndoOutlined />}
              className="text-green-600"
              onClick={() => handleRestore([record.id])}
            />
          </Tooltip>
        </Space>
      ),
      visible: columnVisibility.actions,
    },
  ];

  // Only show visible columns
  const columns = ALL_COLUMNS.filter((col) => col.visible);

  // Check if any filter is applied
  const isFilterApplied =
    userSearch ||
    staffSearch ||
    sortBy !== "CheckupDate" ||
    ascending !== false ||
    checkupDateRange[0] ||
    checkupDateRange[1];

  return (
    <div className="p-6">
      {/* Header with Icon */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Button
            icon={<ArrowLeftOutlined />}
            onClick={() => router.push("/health-check-result/management")}
            style={{ marginRight: "8px" }}
          >
            Quay lại
          </Button>
          <HealthInsuranceIcon />
          <h3 className="text-xl font-bold">Kết quả khám đã xóa tạm thời</h3>
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
        <div className="mb-3 flex items-center justify-between">
          <div className="flex flex-wrap items-center gap-4">
            {/* Code Filter */}
            <Input
              placeholder="Tìm theo mã kết quả khám"
              value={codeSearch}
              onChange={(e) => setCodeSearch(e.target.value)}
              prefix={<SearchOutlined />}
              style={{ width: 200 }}
              allowClear
            />

            {/* Filter Button */}
            <Tooltip title="Bộ lọc nâng cao">
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
                Bộ lọc
                {isFilterApplied && (
                  <Badge
                    count="!"
                    size="small"
                    offset={[2, -2]}
                    style={{ backgroundColor: "#1890ff" }}
                  />
                )}
              </Button>
            </Tooltip>

            {/* Reset Button */}
            <Tooltip title="Đặt lại tất cả bộ lọc">
              <Button
                icon={<ReloadOutlined />}
                onClick={handleReset}
                disabled={!(codeSearch || isFilterApplied)}
              >
                Đặt lại
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
                          <strong>Hiện tất cả cột</strong>
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
                          Mã kết quả khám
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
                          Bệnh nhân
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
                          Ngày khám
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
                          Bác sĩ / Y tá
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
                          Thao tác
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
              <Tooltip title="Cài đặt cột">
                <Button icon={<SettingOutlined />}>Cột</Button>
              </Tooltip>
            </Dropdown>
          </div>
        </div>

        {/* Applied Filter Tags */}
        {isFilterApplied && (
          <div className="mt-2">
            <Space wrap>
              <Text type="secondary">Bộ lọc đã áp dụng:</Text>
              {userSearch && (
                <Tag closable onClose={() => setUserSearch("")}>
                  Bệnh nhân: {userSearch}
                </Tag>
              )}
              {staffSearch && (
                <Tag closable onClose={() => setStaffSearch("")}>
                  Bác sĩ/Y tá: {staffSearch}
                </Tag>
              )}
              {sortBy !== "CheckupDate" && (
                <Tag closable onClose={() => setSortBy("CheckupDate")}>
                  Sắp xếp theo:{" "}
                  {sortBy === "CreatedAt" ? "Ngày tạo" : "Ngày cập nhật"}
                </Tag>
              )}
              {ascending !== false && (
                <Tag closable onClose={() => setAscending(false)}>
                  Thứ tự: Tăng dần
                </Tag>
              )}
              {checkupDateRange[0] && (
                <Tag closable onClose={() => setCheckupDateRange([null, null])}>
                  Ngày khám:{" "}
                  {formatDate(checkupDateRange[0].format("YYYY-MM-DD"))}
                  {checkupDateRange[1] &&
                    ` đến ${formatDate(
                      checkupDateRange[1].format("YYYY-MM-DD")
                    )}`}
                </Tag>
              )}
            </Space>
          </div>
        )}
      </Card>

      {/* Rows Per Page Control */}
      <div className="flex justify-end mb-4">
        <Space align="center">
          <Text type="secondary">Dòng mỗi trang:</Text>
          <Select
            value={pageSize}
            onChange={(value) => {
              setPageSize(value);
              setCurrentPage(1);
            }}
            style={{ width: 70 }}
          >
            <Option value={5}>5</Option>
            <Option value={10}>10</Option>
            <Option value={15}>15</Option>
            <Option value={20}>20</Option>
          </Select>
        </Space>
      </div>

      {/* Bulk Action Bar */}
      <div className="flex justify-between items-center mb-4">
        <div>
          {selectedRowKeys.length > 0 && (
            <Space>
              <Typography.Text>
                {selectedRowKeys.length} mục đã chọn
              </Typography.Text>
              <Popconfirm
                title="Bạn có chắc chắn muốn khôi phục các kết quả khám đã chọn?"
                onConfirm={() => handleRestore(selectedRowKeys as string[])}
                okText="Xác nhận"
                cancelText="Hủy"
              >
                <Button type="primary" icon={<UndoOutlined />}>
                  Khôi phục
                </Button>
              </Popconfirm>
            </Space>
          )}
        </div>
      </div>

      {/* Table Card */}
      <Card className="shadow-sm">
        <Table
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
            emptyText: <Empty description="Không có kết quả khám đã xóa" />,
          }}
          className="border rounded-lg"
        />
      </Card>

      {/* Pagination Card */}
      <Card className="mt-4 shadow-sm">
        <Row justify="center" align="middle">
          <Space size="large" align="center">
            <Typography.Text type="secondary">
              Tổng cộng {total} kết quả khám đã xóa
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
                <Typography.Text type="secondary">
                  Đi đến trang:
                </Typography.Text>
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

      {/* Filter Modal */}
      <FilterModal
        visible={filterModalVisible}
        onCancel={() => setFilterModalVisible(false)}
        onApply={handleApplyFilters}
        onReset={handleResetFilters}
        filters={{
          userSearch,
          staffSearch,
          sortBy,
          ascending,
          checkupDateRange,
        }}
      />
    </div>
  );
};
