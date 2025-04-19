import React, { useState, useEffect, useCallback, useMemo } from "react";
import {
  Table,
  Input,
  Pagination,
  Space,
  Row,
  Col,
  Tag,
  Button,
  Popconfirm,
  Card,
  Typography,
  Badge,
  Tooltip,
  Divider,
  Select,
  InputNumber,
  Dropdown,
  Checkbox,
  Menu,
  message,
} from "antd";
import moment from "moment";
import dayjs from "dayjs";
import {
  getAllHealthInsurances,
  HealthInsuranceResponseDTO,
  setupHealthInsuranceRealTime,
  sendHealthInsuranceUpdateRequest,
  softDeleteHealthInsurances,
} from "@/api/healthinsurance";
import {
  SearchOutlined,
  SendOutlined,
  DeleteOutlined,
  UserOutlined,
  ClockCircleOutlined,
  CalendarOutlined,
  ExclamationCircleOutlined,
  CheckCircleOutlined,
  SyncOutlined,
  ArrowLeftOutlined,
  UndoOutlined,
  AppstoreOutlined,
  SettingOutlined,
  TagOutlined,
  FilterOutlined,
} from "@ant-design/icons";
import { useRouter } from "next/router";
import { HealthInsuranceIcon } from "@/dashboard/sidebar/icons/HealthInsuranceIcon";
import HealthInsuranceFilterModal from "./HealthInsuranceFilterModal";
import { getUsers, UserProfile } from "@/api/user";

const { Title, Text } = Typography;
const { Option } = Select;

const formatDate = (date: string | undefined) => {
  if (!date) return "";
  return moment(date).format("DD/MM/YYYY");
};

const formatDateTime = (datetime: string | undefined) => {
  if (!datetime) return "";
  return moment(datetime).format("DD/MM/YYYY HH:mm:ss");
};

const getStatusColor = (status: string | undefined) => {
  if (!status) return "default";
  switch (status) {
    case "Pending":
      return "warning";
    case "Completed":
      return "success";
    case "Expired":
      return "error";
    default:
      return "default";
  }
};

const getDeadlineStatus = (deadline: string | undefined) => {
  if (!deadline)
    return {
      color: "default",
      icon: <ClockCircleOutlined />,
      text: "No deadline",
    };

  const now = moment();
  const deadlineDate = moment(deadline);
  const daysUntil = deadlineDate.diff(now, "days");

  if (deadlineDate.isBefore(now)) {
    return {
      color: "red",
      icon: <ExclamationCircleOutlined />,
      text: "Expired",
    };
  } else if (daysUntil <= 3) {
    return {
      color: "orange",
      icon: <ClockCircleOutlined />,
      text: `${daysUntil} days left`,
    };
  } else {
    return {
      color: "green",
      icon: <CheckCircleOutlined />,
      text: `${daysUntil} days left`,
    };
  }
};

export function InitialInsuranceList() {
  const router = useRouter();
  const [insurances, setInsurances] = useState<HealthInsuranceResponseDTO[]>(
    []
  );
  const [loading, setLoading] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [total, setTotal] = useState(0);
  const [searchText, setSearchText] = useState("");
  const [isSendingRequest, setIsSendingRequest] = useState(false);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [statusFilter, setStatusFilter] = useState<string | undefined>();
  const [userFilter, setUserFilter] = useState<string | undefined>();
  const [searchOptions, setSearchOptions] = useState<
    { id: string; fullName: string; email: string }[]
  >([]);
  const [selectedRowKeys, setSelectedRowKeys] = useState<React.Key[]>([]);
  const [messageApi, contextHolder] = message.useMessage();
  const [filterModalVisible, setFilterModalVisible] = useState(false);

  // Filter state
  const [filterState, setFilterState] = useState({
    userFilter: "",
    statusFilter: "",
    validDateRange: [null, null] as [dayjs.Dayjs | null, dayjs.Dayjs | null],
    createdDateRange: [null, null] as [dayjs.Dayjs | null, dayjs.Dayjs | null],
    updatedDateRange: [null, null] as [dayjs.Dayjs | null, dayjs.Dayjs | null],
    ascending: false,
  });

  // Columns visibility state
  const [columnVisibility, setColumnVisibility] = useState<
    Record<string, boolean>
  >({
    policyholder: true,
    status: true,
    createdDate: true,
    createdBy: true,
    deadline: true,
    actions: true,
  });

  // Thêm state để lưu tổng số bản ghi từ API
  const [apiTotal, setApiTotal] = useState(0);

  const fetchInsurances = useCallback(async () => {
    setLoading(true);
    try {
      const result = await getAllHealthInsurances(
        currentPage,
        pageSize,
        "", // Không dùng searchText ở API để có thể tìm kiếm ở client
        "CreatedAt",
        filterState.ascending,
        statusFilter || "Pending",
        userFilter
      );

      setInsurances(result.data);
      setApiTotal(result.totalRecords); // Lưu tổng số bản ghi từ API

      // Extract unique policyholders với cả tên và email
      if (result.data && result.data.length > 0) {
        const policyholderData = result.data
          .filter((insurance: HealthInsuranceResponseDTO) => insurance.user)
          .map((insurance: HealthInsuranceResponseDTO) => ({
            id: insurance.user.id,
            fullName: insurance.user.fullName || "",
            email: insurance.user.email || "",
          }));

        const uniquePolicyholders = policyholderData.filter(
          (
            policyholder: { id: string; fullName: string; email: string },
            index: number,
            self: { id: string; fullName: string; email: string }[]
          ) =>
            index ===
            self.findIndex(
              (p: { id: string; fullName: string; email: string }) =>
                p.id === policyholder.id
            )
        );

        console.log("Unique policyholders:", uniquePolicyholders.length);
        setSearchOptions(uniquePolicyholders);
      }
    } catch (error) {
      messageApi.error("Unable to load initial insurances.");
    } finally {
      setLoading(false);
    }
  }, [
    currentPage,
    pageSize,
    statusFilter,
    userFilter,
    filterState.ascending,
    messageApi,
  ]);

  // Fetch all users for filter modal
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
      setSearchOptions(userRoleUsers);
    } catch (error) {
      messageApi.error("Unable to load users");
    }
  }, [messageApi]);

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  useEffect(() => {
    fetchInsurances();
    const connection = setupHealthInsuranceRealTime(() => {
      fetchInsurances();
    });
    return () => {
      connection.stop();
    };
  }, [fetchInsurances]);

  const handleSendUpdateRequest = async () => {
    console.log("handleSendUpdateRequest called");
    try {
      setIsSendingRequest(true);
      console.log("Calling sendHealthInsuranceUpdateRequest API");
      const response = await sendHealthInsuranceUpdateRequest();
      console.log("API response:", response);
      if (response.isSuccess) {
        messageApi.success(
          "Update requests sent to all pending users successfully!"
        );
        fetchInsurances();
      } else {
        messageApi.error(response.message || "Failed to send update requests");
      }
    } catch (error) {
      console.error("Error in sendHealthInsuranceUpdateRequest:", error);
      messageApi.error("Unable to send update requests.");
    } finally {
      setIsSendingRequest(false);
    }
  };

  const handleSoftDelete = async (id: string) => {
    try {
      const response = await softDeleteHealthInsurances([id]);
      if (response.isSuccess) {
        messageApi.success("Insurance soft deleted successfully!");
        fetchInsurances();
      } else {
        messageApi.error(response.message || "Failed to soft delete insurance");
      }
    } catch (error) {
      messageApi.error("Unable to soft delete insurance.");
    }
  };

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
        messageApi.error(
          response.message || "Failed to delete selected insurances"
        );
      }
    } catch (error) {
      messageApi.error("Unable to delete selected insurances.");
    }
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

  // Handle column visibility change
  const handleColumnVisibilityChange = (key: string) => {
    setColumnVisibility((prev) => ({
      ...prev,
      [key]: !prev[key],
    }));
  };

  // Handle dropdown visibility
  const handleDropdownVisibleChange = (visible: boolean) => {
    setDropdownOpen(visible);
  };

  // Prevent dropdown from closing when clicking checkboxes
  const handleMenuClick = (e: React.MouseEvent) => {
    e.stopPropagation();
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
      key: "status",
      title: (
        <span style={{ textTransform: "uppercase", fontWeight: "bold" }}>
          STATUS
        </span>
      ),
      width: 150,
      render: (record: HealthInsuranceResponseDTO) => (
        <Tag color={getStatusColor(record.status)}>{record.status}</Tag>
      ),
      visible: columnVisibility.status,
    },
    {
      key: "createdDate",
      title: (
        <span style={{ textTransform: "uppercase", fontWeight: "bold" }}>
          CREATED DATE
        </span>
      ),
      width: 200,
      render: (record: HealthInsuranceResponseDTO) => (
        <Space direction="vertical" size="small">
          <Typography.Text>{formatDate(record.createdAt)}</Typography.Text>
          <Typography.Text type="secondary" className="text-sm">
            {moment(record.createdAt).format("HH:mm:ss")}
          </Typography.Text>
        </Space>
      ),
      visible: columnVisibility.createdDate,
    },
    {
      key: "createdBy",
      title: (
        <span style={{ textTransform: "uppercase", fontWeight: "bold" }}>
          CREATED BY
        </span>
      ),
      width: 200,
      render: (record: HealthInsuranceResponseDTO) =>
        record.createdBy ? (
          <div className="flex flex-col">
            <Typography.Text strong>
              {record.createdBy.userName}
            </Typography.Text>
            <Typography.Text type="secondary" className="text-sm">
              {record.createdBy.email}
            </Typography.Text>
          </div>
        ) : (
          <Tag color="default">System</Tag>
        ),
      visible: columnVisibility.createdBy,
    },
    {
      key: "deadline",
      title: (
        <span style={{ textTransform: "uppercase", fontWeight: "bold" }}>
          DEADLINE
        </span>
      ),
      width: 150,
      render: (record: HealthInsuranceResponseDTO) => {
        const status = getDeadlineStatus(record.deadline);
        return (
          <Typography.Text
            type={
              moment(record.deadline).isBefore(moment()) ? "danger" : "success"
            }
          >
            {formatDate(record.deadline) || "No deadline"}
          </Typography.Text>
        );
      },
      visible: columnVisibility.deadline,
    },
    {
      key: "actions",
      title: (
        <span style={{ textTransform: "uppercase", fontWeight: "bold" }}>
          ACTIONS
        </span>
      ),
      width: 120,
      render: (record: HealthInsuranceResponseDTO) => (
        <Space>
          <Popconfirm
            title="Delete Insurance"
            description="Are you sure you want to delete this insurance?"
            onConfirm={() => handleSoftDelete(record.id)}
            okText="Yes"
            cancelText="No"
            icon={<ExclamationCircleOutlined style={{ color: "#ff4d4f" }} />}
          >
            <Button type="text" danger icon={<DeleteOutlined />}>
              Delete
            </Button>
          </Popconfirm>
        </Space>
      ),
      visible: columnVisibility.actions,
    },
  ];

  const columns = ALL_COLUMNS.filter((col) => col.visible);

  // Handle back navigation
  const handleBack = () => {
    router.back();
  };

  // Handle opening filter modal
  const handleOpenFilterModal = () => {
    setFilterModalVisible(true);
  };

  // Handle applying filters
  const handleApplyFilters = (filters: any) => {
    setFilterState(filters);
    setUserFilter(filters.userFilter);
    setStatusFilter(filters.statusFilter);
    setCurrentPage(1);
    setFilterModalVisible(false);

    // Fetch with new filters
    fetchInsurances();
  };

  // Handle resetting filters
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
    setCurrentPage(1);
    setFilterModalVisible(false);

    // Refresh data
    fetchInsurances();
  };

  // Modified reset function to reset all filters
  const handleReset = () => {
    setSearchText("");
    setFilterState({
      userFilter: "",
      statusFilter: "",
      validDateRange: [null, null],
      createdDateRange: [null, null],
      updatedDateRange: [null, null],
      ascending: false,
    });
    setUserFilter("");
    setCurrentPage(1);
    fetchInsurances();
  };

  // Tính tổng số bản ghi và lọc dữ liệu theo searchText
  const { filteredInsurances, displayTotal } = useMemo(() => {
    console.log("Filtering with searchText:", searchText);
    console.log("Total insurances before filter:", insurances.length);

    // Nếu không có searchText, hiển thị tất cả và dùng apiTotal
    if (!searchText) {
      return {
        filteredInsurances: insurances,
        displayTotal: apiTotal,
      };
    }

    // Nếu có searchText, lọc dữ liệu
    const normalizedSearch = searchText.toLowerCase().trim();

    const filtered = insurances.filter((insurance) => {
      // Kiểm tra bảo đảm insurance.user có tồn tại
      if (!insurance.user) return false;

      const fullName = insurance.user.fullName?.toLowerCase() || "";
      const email = insurance.user.email?.toLowerCase() || "";

      const match =
        fullName.includes(normalizedSearch) || email.includes(normalizedSearch);
      return match;
    });

    console.log("Filtered insurances:", filtered.length);

    // Nếu đang tìm kiếm, hiển thị số lượng kết quả tìm kiếm được
    return {
      filteredInsurances: filtered,
      displayTotal: filtered.length,
    };
  }, [insurances, searchText, apiTotal]);

  // Cập nhật hàm handleSearchChange để dễ debug và tránh lỗi
  const handleSearchChange = (value: string | undefined) => {
    console.log("Search value changed to:", value);
    setSearchText(value || "");
    setUserFilter(value); // Update user filter when searching
    setCurrentPage(1); // Reset về trang đầu tiên khi thay đổi tìm kiếm
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
          <h3 className="text-xl font-bold">Initial Health Insurance</h3>
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
          <div className="flex items-center gap-4">
            {/* Policyholder Search */}
            <Select
              showSearch
              allowClear
              style={{ width: 250 }}
              placeholder="Search by policyholder"
              optionFilterProp="label"
              prefix={<SearchOutlined style={{ color: "blue" }} />}
              onChange={handleSearchChange}
              value={searchText || undefined}
              filterOption={(input, option) => {
                if (!option?.label) return false;
                return (option.label as string)
                  .toLowerCase()
                  .includes(input.toLowerCase());
              }}
              options={searchOptions.map((item) => ({
                value: item.fullName,
                label: `${item.fullName} (${item.email})`,
              }))}
            />

            {/* Status Filter */}
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
                    key: "createdDate",
                    label: (
                      <div onClick={handleMenuClick}>
                        <Checkbox
                          checked={columnVisibility.createdDate}
                          onChange={() =>
                            handleColumnVisibilityChange("createdDate")
                          }
                        >
                          Created Date
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
          </div>

          <div>
            {/* Send All Requests Button */}
            <Popconfirm
              title="Send Update Request"
              description="Are you sure you want to send update requests to all pending users?"
              onConfirm={handleSendUpdateRequest}
              okText="Yes"
              cancelText="No"
              icon={<ExclamationCircleOutlined style={{ color: "#1890ff" }} />}
            >
              <Button
                type="primary"
                icon={<SendOutlined />}
                loading={isSendingRequest}
              >
                Send All Requests
              </Button>
            </Popconfirm>
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
              <Text type="secondary">Total {displayTotal} items</Text>
              <Space align="center" size="large">
                <Pagination
                  current={currentPage}
                  pageSize={pageSize}
                  total={displayTotal}
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
                    max={Math.ceil(displayTotal / pageSize)}
                    value={currentPage}
                    onChange={(value) => {
                      if (
                        value &&
                        Number(value) > 0 &&
                        Number(value) <= Math.ceil(displayTotal / pageSize)
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
      <HealthInsuranceFilterModal
        visible={filterModalVisible}
        onCancel={() => setFilterModalVisible(false)}
        onApply={handleApplyFilters}
        onReset={handleResetFilters}
        filters={filterState}
        userOptions={searchOptions}
      />
    </div>
  );
}
