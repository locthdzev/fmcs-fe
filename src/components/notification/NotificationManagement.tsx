import React, { useState, useEffect, useCallback, useMemo } from "react";
import {
  Form,
  Button,
  Typography,
  Select,
  message,
  Card,
  Tooltip,
  Dropdown,
  Checkbox,
  Modal,
  Row,
  Col,
  Divider,
  Table,
  DatePicker,
  Input,
  Space,
  Tag,
  Menu,
} from "antd";
import {
  PlusOutlined,
  UndoOutlined,
  FileExcelOutlined,
  BellOutlined,
  ArrowLeftOutlined,
  FilterOutlined,
  SearchOutlined,
  SettingOutlined,
  AppstoreOutlined,
  TagOutlined,
  MoreOutlined,
  DeleteOutlined,
  CopyOutlined,
  ReloadOutlined,
  EyeOutlined,
  NotificationOutlined,
} from "@ant-design/icons";
import type { MenuProps } from "antd";
import { useRouter } from "next/router";
import dayjs from "dayjs";

import NotificationFilterModal from "./NotificationFilterModal";
import ExportConfigModal from "./ExportConfigModal";
import CreateNotificationModal, { CopyNotificationModal } from "./CreateNotificationModal";
import NotificationTable from "./NotificationTable";

import {
  getAllNotifications,
  deleteNotifications,
  updateNotificationStatus,
  createNotification,
  reupNotification,
  copyNotification,
  NotificationResponseDTO,
  setupNotificationRealTime,
  getAllRoles,
  RoleResponseDTO,
  getNotificationDetailForAdmin,
} from "@/api/notification";
import { exportNotificationsToExcel } from "./export-to-excel";

const { Option } = Select;
const { Text, Title } = Typography;
const { RangePicker } = DatePicker;
const { Search } = Input;

export function NotificationManagement() {
  const router = useRouter();
  const [messageApi, contextHolder] = message.useMessage();
  const [loading, setLoading] = useState(false);
  const [copyLoading, setCopyLoading] = useState(false);
  const [notifications, setNotifications] = useState<NotificationResponseDTO[]>(
    []
  );
  const [totalItems, setTotalItems] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [createModalVisible, setCreateModalVisible] = useState(false);
  const [copyModalVisible, setCopyModalVisible] = useState(false);
  const [exportConfigModalVisible, setExportConfigModalVisible] =
    useState(false);
  const [filterModalVisible, setFilterModalVisible] = useState(false);
  const [selectedNotification, setSelectedNotification] =
    useState<NotificationResponseDTO | null>(null);
  const [selectedNotifications, setSelectedNotifications] = useState<string[]>(
    []
  );
  const [searchForm] = Form.useForm();
  const [roles, setRoles] = useState<RoleResponseDTO[]>([]);

  // Column visibility state
  const [columnVisibility, setColumnVisibility] = useState<
    Record<string, boolean>
  >({
    title: true,
    recipientType: true,
    sendEmail: true,
    status: true,
    createdAt: true,
    createdBy: true,
    actions: true,
  });

  // Dropdown open state
  const [dropdownOpen, setDropdownOpen] = useState(false);

  // Search filters
  const [searchText, setSearchText] = useState<string>("");
  const [statusFilter, setStatusFilter] = useState<string>("");
  const [recipientTypeFilter, setRecipientTypeFilter] = useState<string>("");
  const [sendEmailFilter, setSendEmailFilter] = useState<boolean | null>(null);
  const [createdByFilter, setCreatedByFilter] = useState<string>("");
  const [dateRange, setDateRange] = useState<
    [dayjs.Dayjs | null, dayjs.Dayjs | null]
  >([null, null]);
  const [sortBy, setSortBy] = useState<string>("CreatedAt");
  const [ascending, setAscending] = useState<boolean>(false);

  // Export config
  const [exportConfig, setExportConfig] = useState({
    exportAllPages: false,
    includeTitle: true,
    includeContent: false,
    includeRecipientType: true,
    includeStatus: true,
    includeSendEmail: true,
    includeCreatedAt: true,
    includeCreatedBy: true,
  });

  // Filter state for the modal
  const [filterState, setFilterState] = useState({
    recipientTypeFilter: "",
    createdByFilter: "",
    sendEmailFilter: null as boolean | null,
    dateRange: [null, null] as [dayjs.Dayjs | null, dayjs.Dayjs | null],
    sortBy: "CreatedAt",
    ascending: false,
  });

  // Fetch data when filters change
  useEffect(() => {
    fetchNotifications();
  }, [
    currentPage,
    pageSize,
    searchText,
    statusFilter,
    recipientTypeFilter,
    sendEmailFilter,
    createdByFilter,
    dateRange,
    sortBy,
    ascending,
  ]);

  // Fetch roles and setup signalR connection
  useEffect(() => {
    const initialize = async () => {
      await fetchRoles();

      const connection = setupNotificationRealTime(
        (data: NotificationResponseDTO | string[] | any) => {
          console.log("SignalR notification data received:", data);

          if (Array.isArray(data)) {
            // Handle notification deletion
            setNotifications((prev) =>
              prev.filter((n) => !data.includes(n.id))
            );
            setSelectedNotifications((prev) =>
              prev.filter((id) => !data.includes(id))
            );
          } else if (data && typeof data === "object") {
            // Handle notification update or new notification
            if (data.id && data.title) {
              setNotifications((prev) => {
                const exists = prev.find((n) => n.id === data.id);
                if (exists) {
                  return prev.map((n) =>
                    n.id === data.id ? { ...n, ...data } : n
                  );
                } else {
                  fetchNotifications(); // Refresh the list when a new notification is created
                  return prev;
                }
              });
            }
          }
        }
      );

      return () => {
        connection.stop();
      };
    };

    initialize();
  }, []);

  // Update form values when filters change
  useEffect(() => {
    searchForm.setFieldsValue({
      searchText,
      status: statusFilter,
      recipientType: recipientTypeFilter,
      sendEmail: sendEmailFilter,
      createdBy: createdByFilter,
      dateRange,
      sortBy,
      ascending,
    });
  }, [
    searchText,
    statusFilter,
    recipientTypeFilter,
    sendEmailFilter,
    createdByFilter,
    dateRange,
    sortBy,
    ascending,
  ]);

  // Fetch roles
  const fetchRoles = async () => {
    try {
      const roleList = await getAllRoles();
      setRoles(roleList);
    } catch (error) {
      messageApi.error("Failed to load roles");
      console.error("Error loading roles:", error);
    }
  };

  // Format date ranges for API
  const formatDateRangesForAPI = () => {
    const params: any = {};

    if (dateRange && dateRange[0] && dateRange[1]) {
      params.createdStartDate = dateRange[0].format("YYYY-MM-DD");
      params.createdEndDate = dateRange[1].format("YYYY-MM-DD");
    }

    return params;
  };

  // Fetch notifications with filtering
  const fetchNotifications = async () => {
    try {
      setLoading(true);

      // Format date ranges for API parameters
      const dateRanges = formatDateRangesForAPI();

      // Call API with parameters (only using the backend supported params)
      const response = await getAllNotifications(
        currentPage,
        pageSize,
        searchText,
        statusFilter
      );

      console.log("API Response:", response);

      // Extract data and total count
      const data = response.data || [];
      const totalCount = response.totalRecords || 0;

      console.log(`Setting total items to: ${totalCount} from API response`);

      // Client-side filtering for fields not supported by the backend
      let filteredData = [...data];

      // Filter by recipient type
      if (recipientTypeFilter) {
        filteredData = filteredData.filter(
          (notification) => notification.recipientType === recipientTypeFilter
        );
      }

      // Filter by send email
      if (sendEmailFilter !== null) {
        filteredData = filteredData.filter(
          (notification) => notification.sendEmail === sendEmailFilter
        );
      }

      // Filter by created by
      if (createdByFilter) {
        filteredData = filteredData.filter((notification) =>
          notification.createdBy?.userName
            ?.toLowerCase()
            .includes(createdByFilter.toLowerCase())
        );
      }

      // Filter by date range
      if (dateRange[0] && dateRange[1]) {
        const startDate = dateRange[0].startOf("day");
        const endDate = dateRange[1].endOf("day");

        filteredData = filteredData.filter((notification) => {
          const createdAt = dayjs(notification.createdAt);
          return createdAt.isAfter(startDate) && createdAt.isBefore(endDate);
        });
      }

      // Set data
      setNotifications(filteredData);

      // Set total items from API response total count, not filtered data length
      // This ensures pagination works correctly with the backend
      setTotalItems(totalCount);
    } catch (error) {
      messageApi.error("Failed to fetch notifications");
      console.error("Error fetching notifications:", error);
    } finally {
      setLoading(false);
    }
  };

  // Handle form field changes
  const handleFormFieldChange = (field: string, value: any) => {
    switch (field) {
      case "searchText":
        setSearchText(value);
        break;
      case "status":
        setStatusFilter(value);
        break;
      case "recipientType":
        setRecipientTypeFilter(value);
        break;
      case "sendEmail":
        setSendEmailFilter(value);
        break;
      case "createdBy":
        setCreatedByFilter(value);
        break;
      case "dateRange":
        setDateRange(value);
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
  };

  // Reset filters
  const handleReset = () => {
    setSearchText("");
    setStatusFilter("");
    setRecipientTypeFilter("");
    setSendEmailFilter(null);
    setCreatedByFilter("");
    setDateRange([null, null]);
    setSortBy("CreatedAt");
    setAscending(false);
    // Reset to page 1 when clearing filters
    setCurrentPage(1);
    searchForm.resetFields();
  };

  // Handle page change
  const handlePageChange = (page: number, newPageSize?: number) => {
    setCurrentPage(page);
    if (newPageSize) setPageSize(newPageSize);
  };

  // Handle successful creation
  const handleCreateSuccess = () => {
    setCreateModalVisible(false);
    setCopyModalVisible(false);
    setSelectedNotification(null);
    messageApi.success("Notification created successfully");
    fetchNotifications();
  };

  // Handle column visibility change
  const handleColumnVisibilityChange = (key: string) => {
    setColumnVisibility((prev) => ({
      ...prev,
      [key]: !prev[key],
    }));
  };

  // Toggle all columns
  const toggleAllColumns = (checked: boolean) => {
    const newColumnVisibility = { ...columnVisibility };
    Object.keys(newColumnVisibility).forEach((key) => {
      newColumnVisibility[key] = checked;
    });
    setColumnVisibility(newColumnVisibility);
  };

  // Check if all columns are visible
  const areAllColumnsVisible = () => {
    return Object.values(columnVisibility).every((visible) => visible);
  };

  // Handle notification delete
  const handleDelete = async (id: string) => {
    try {
      const response = await deleteNotifications([id]);
      if (response.isSuccess) {
        messageApi.success("Notification deleted successfully");
        fetchNotifications();
      } else {
        messageApi.error(response.message || "Failed to delete notification");
      }
    } catch (error) {
      messageApi.error("Failed to delete notification");
      console.error("Error deleting notification:", error);
    }
  };

  // Handle bulk delete
  const handleBulkDelete = async (ids: string[]) => {
    try {
      const response = await deleteNotifications(ids);
      if (response.isSuccess) {
        messageApi.success("Notifications deleted successfully");
        setSelectedNotifications([]);
        fetchNotifications();
      } else {
        messageApi.error(response.message || "Failed to delete notifications");
      }
    } catch (error) {
      messageApi.error("Failed to delete notifications");
      console.error("Error deleting notifications:", error);
    }
  };

  // Handle status toggle
  const handleToggleStatus = async (id: string, currentStatus: string) => {
    try {
      const newStatus = currentStatus === "Active" ? "Inactive" : "Active";
      const response = await updateNotificationStatus(id, newStatus);
      if (response.isSuccess) {
        messageApi.success("Status updated successfully");
        fetchNotifications();
      } else {
        messageApi.error(response.message || "Failed to update status");
      }
    } catch (error) {
      messageApi.error("Failed to update status");
      console.error("Error updating status:", error);
    }
  };

  // Handle reup notification
  const handleReup = async (id: string) => {
    try {
      const response = await reupNotification(id, true);
      if (response.isSuccess) {
        messageApi.success("Notification reupped successfully");
        fetchNotifications();
      } else {
        messageApi.error(response.message || "Failed to reup notification");
      }
    } catch (error) {
      messageApi.error("Failed to reup notification");
      console.error("Error reupping notification:", error);
    }
  };

  // Open filter modal
  const handleOpenFilterModal = () => {
    setFilterState({
      recipientTypeFilter,
      createdByFilter,
      sendEmailFilter,
      dateRange,
      sortBy,
      ascending,
    });
    setFilterModalVisible(true);
  };

  // Apply filters from modal
  const handleApplyFilters = (filters: any) => {
    // Reset to page 1 when applying filters
    setCurrentPage(1);
    setRecipientTypeFilter(filters.recipientType || "");
    setSendEmailFilter(filters.sendEmail);
    setCreatedByFilter(filters.createdBy || "");
    setDateRange(filters.dateRange || [null, null]);
    setSortBy(filters.sortBy || "CreatedAt");
    setAscending(filters.ascending || false);
    setFilterModalVisible(false);
  };

  // Reset all filters
  const handleResetFilters = () => {
    setFilterState({
      recipientTypeFilter: "",
      createdByFilter: "",
      sendEmailFilter: null,
      dateRange: [null, null],
      sortBy: "CreatedAt",
      ascending: false,
    });
  };

  // Open export config modal
  const handleOpenExportConfig = () => {
    setExportConfigModalVisible(true);
  };

  // Close export config modal
  const closeExportConfigModal = () => {
    setExportConfigModalVisible(false);
  };

  // Handle export config change
  const handleExportConfigChange = (changedValues: any) => {
    setExportConfig((prev) => ({ ...prev, ...changedValues }));
  };

  // Export to Excel
  const handleExport = async () => {
    try {
      await exportNotificationsToExcel(
        notifications,
        exportConfig,
        currentPage,
        pageSize
      );
    } catch (error) {
      messageApi.error("Failed to export notifications to Excel");
      console.error("Error exporting notifications:", error);
    }
  };

  // Check if filters are applied
  const isFiltersApplied = () => {
    return (
      recipientTypeFilter !== "" ||
      sendEmailFilter !== null ||
      createdByFilter !== "" ||
      (dateRange[0] !== null && dateRange[1] !== null)
    );
  };

  // Handle dropdown visibility change
  const handleDropdownVisibleChange = (visible: boolean) => {
    setDropdownOpen(visible);
  };

  // Column menu for visibility toggle
  const columnMenu = (
    <Menu>
      <Menu.Item key="selectAll">
        <Checkbox
          checked={areAllColumnsVisible()}
          onChange={(e) => toggleAllColumns(e.target.checked)}
        >
          Toggle All
        </Checkbox>
      </Menu.Item>
      <Menu.Divider />
      {Object.keys(columnVisibility).map((key) => (
        <Menu.Item key={key}>
          <Checkbox
            checked={columnVisibility[key]}
            onChange={() => handleColumnVisibilityChange(key)}
          >
            {key.charAt(0).toUpperCase() + key.slice(1)}
          </Checkbox>
        </Menu.Item>
      ))}
    </Menu>
  );

  // Thêm thông báo riêng cho Copy thành công
  const handleCopySuccess = () => {
    setCopyModalVisible(false);
    setSelectedNotification(null);
    messageApi.success("Notification copied successfully");
    fetchNotifications();
  };

  // Table UI section
  return (
    <div className="history-container" style={{ padding: "20px" }}>
      {contextHolder}
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Button
            icon={<ArrowLeftOutlined />}
            onClick={() => router.back()}
            style={{ marginRight: "8px" }}
          >
            Back
          </Button>
          <NotificationOutlined style={{ fontSize: "24px" }} />
          <h3 className="text-xl font-bold">Notification Management</h3>
        </div>
      </div>

      {/* Search and Filters Toolbar */}
      <Card
        className="shadow mb-4"
        bodyStyle={{ padding: "16px" }}
        style={{ borderRadius: "8px", boxShadow: "0 2px 8px rgba(0,0,0,0.1)" }}
      >
        <Row align="middle" gutter={[16, 16]}>
          <Col span={24}>
            <Title level={4} style={{ margin: 0 }}>
              <AppstoreOutlined
                style={{ marginRight: "8px", fontSize: "20px" }}
              />
              Toolbar
            </Title>
          </Col>
        </Row>

        <Divider style={{ margin: "16px 0" }} />

        <Form
          form={searchForm}
          layout="vertical"
          className="flex flex-wrap gap-4"
        >
          <div className="mb-3 flex items-center justify-between w-full">
            <div className="flex items-center gap-4">
              <Form.Item name="searchText" className="mb-0 min-w-[320px]">
                <Search
                  placeholder="Search by title"
                  value={searchText}
                  onChange={(e) =>
                    handleFormFieldChange("searchText", e.target.value)
                  }
                  onSearch={() => fetchNotifications()}
                  allowClear
                />
              </Form.Item>

              <Form.Item name="status" className="mb-0">
                <Select
                  placeholder={
                    <div style={{ display: "flex", alignItems: "center" }}>
                      <TagOutlined style={{ marginRight: 8 }} />
                      <span>Status</span>
                    </div>
                  }
                  value={statusFilter}
                  onChange={(value) => handleFormFieldChange("status", value)}
                  allowClear
                  style={{ width: "120px" }}
                >
                  <Option value="Active">Active</Option>
                  <Option value="Inactive">Inactive</Option>
                </Select>
              </Form.Item>

              <Button
                icon={
                  <FilterOutlined
                    style={{
                      color: isFiltersApplied() ? "#1890ff" : undefined,
                    }}
                  />
                }
                onClick={handleOpenFilterModal}
              >
                Filters
              </Button>

              <Tooltip title="Reset All filters">
                <Button
                  icon={<UndoOutlined />}
                  onClick={handleReset}
                  disabled={!isFiltersApplied()}
                />
              </Tooltip>

              <Dropdown
                overlay={columnMenu}
                trigger={["hover", "click"]}
                open={dropdownOpen}
                onOpenChange={handleDropdownVisibleChange}
                placement="bottomRight"
                arrow
              >
                <Tooltip title="Column Settings">
                  <Button icon={<SettingOutlined />}>Columns</Button>
                </Tooltip>
              </Dropdown>

              <Button
                type="primary"
                icon={<PlusOutlined />}
                onClick={() => {
                  setSelectedNotification(null);
                  setCreateModalVisible(true);
                }}
              >
                Create
              </Button>
            </div>

            <div>
              <Button
                type="primary"
                icon={<FileExcelOutlined />}
                onClick={handleOpenExportConfig}
              >
                Export to Excel
              </Button>
            </div>
          </div>
        </Form>
      </Card>

      <NotificationTable
        loading={loading}
        notifications={notifications}
        totalItems={totalItems}
        currentPage={currentPage}
        pageSize={pageSize}
        handlePageChange={handlePageChange}
        selectedNotifications={selectedNotifications}
        setSelectedNotifications={setSelectedNotifications}
        handleDelete={handleDelete}
        handleToggleStatus={handleToggleStatus}
        handleReup={handleReup}
        handleCopy={(notification) => {
          console.log("Copy button clicked for notification:", notification.id);
          
          // Lấy chi tiết đầy đủ của notification từ API
          setCopyLoading(true);
          getNotificationDetailForAdmin(notification.id)
            .then(detailedNotification => {
              console.log("Fetched detailed notification for copy:", detailedNotification);
              setSelectedNotification(detailedNotification);
              setCopyModalVisible(true);
            })
            .catch(error => {
              console.error("Failed to get notification details:", error);
              message.error("Failed to get notification details for copying");
            })
            .finally(() => {
              setCopyLoading(false);
            });
        }}
        columnVisibility={columnVisibility}
        handleBulkDelete={handleBulkDelete}
      />

      <NotificationFilterModal
        visible={filterModalVisible}
        onClose={() => setFilterModalVisible(false)}
        onApply={handleApplyFilters}
        onReset={handleResetFilters}
        filterState={filterState}
      />

      <ExportConfigModal
        visible={exportConfigModalVisible}
        onClose={closeExportConfigModal}
        exportConfig={exportConfig}
        onChange={handleExportConfigChange}
        onExport={handleExport}
      />

      <CreateNotificationModal
        visible={createModalVisible}
        onClose={() => {
          setCreateModalVisible(false);
        }}
        onSuccess={handleCreateSuccess}
        roles={roles}
        notification={null}
        forceReset={true}
      />

      <CopyNotificationModal
        visible={copyModalVisible}
        onClose={() => {
          setCopyModalVisible(false);
          setSelectedNotification(null);
        }}
        onSuccess={handleCopySuccess}
        roles={roles}
        notification={selectedNotification}
        forceReset={false}
        initialLoading={copyLoading}
      />
    </div>
  );
}

export default NotificationManagement;
