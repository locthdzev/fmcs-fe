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
} from "@ant-design/icons";
import type { MenuProps } from "antd";
import { useRouter } from "next/router";
import dayjs from "dayjs";
import * as XLSX from "xlsx";
import { saveAs } from "file-saver";

import NotificationFilterModal from "./NotificationFilterModal";
import ExportConfigModal from "./ExportConfigModal";
import NotificationDetailModal from "./NotificationDetailModal";
import CreateNotificationModal from "./CreateNotificationModal";
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

const { Option } = Select;
const { Text, Title } = Typography;
const { RangePicker } = DatePicker;
const { Search } = Input;

export function NotificationManagement() {
  const router = useRouter();
  const [messageApi, contextHolder] = message.useMessage();
  const [loading, setLoading] = useState(false);
  const [notifications, setNotifications] = useState<NotificationResponseDTO[]>(
    []
  );
  const [totalItems, setTotalItems] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [createModalVisible, setCreateModalVisible] = useState(false);
  const [exportConfigModalVisible, setExportConfigModalVisible] =
    useState(false);
  const [filterModalVisible, setFilterModalVisible] = useState(false);
  const [detailModalVisible, setDetailModalVisible] = useState(false);
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

      // Extract data and total count
      const data = response.data || [];
      const totalCount = response.totalCount || 0;

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

      // Set data and count
      setNotifications(filteredData);
      setTotalItems(filteredData.length);
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

  // Open notification detail
  const handleViewDetail = async (id: string) => {
    try {
      const detail = await getNotificationDetailForAdmin(id);
      setSelectedNotification(detail);
      setDetailModalVisible(true);
    } catch (error) {
      messageApi.error("Failed to load notification details");
      console.error("Error loading notification details:", error);
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
  const handleExport = () => {
    const dataToExport = exportConfig.exportAllPages
      ? notifications
      : notifications.slice(
          (currentPage - 1) * pageSize,
          currentPage * pageSize
        );

    const exportData = dataToExport.map((notification) => {
      const row: any = {};

      if (exportConfig.includeTitle) row["Title"] = notification.title;
      if (exportConfig.includeRecipientType)
        row["Recipient Type"] = notification.recipientType;
      if (exportConfig.includeStatus) row["Status"] = notification.status;
      if (exportConfig.includeSendEmail)
        row["Send Email"] = notification.sendEmail ? "Yes" : "No";
      if (exportConfig.includeCreatedAt)
        row["Created At"] = notification.createdAt;
      if (exportConfig.includeCreatedBy)
        row["Created By"] = notification.createdBy?.userName;

      return row;
    });

    const worksheet = XLSX.utils.json_to_sheet(exportData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Notifications");

    const excelBuffer = XLSX.write(workbook, {
      bookType: "xlsx",
      type: "array",
    });

    const dataBlob = new Blob([excelBuffer], {
      type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    });

    saveAs(dataBlob, "notifications_" + dayjs().format("YYYY-MM-DD") + ".xlsx");
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

  // Table UI section
  return (
    <>
      {contextHolder}
      <div className="p-6">
        <div className="flex justify-between items-center mb-6">
          <div className="flex items-center">
            <Button
              icon={<ArrowLeftOutlined />}
              onClick={() => router.back()}
              className="mr-4"
            >
              Back
            </Button>
            <Title level={4} className="m-0">
              Notification Management
            </Title>
          </div>
          <div className="flex gap-2">
            <Button
              type="primary"
              icon={<PlusOutlined />}
              onClick={() => {
                setSelectedNotification(null);
                setCreateModalVisible(true);
              }}
            >
              Create Notification
            </Button>
          </div>
        </div>

        <Card className="mb-6">
          <Form
            form={searchForm}
            layout="vertical"
            className="flex flex-wrap gap-4"
          >
            <Form.Item
              label="Search"
              name="searchText"
              className="mb-0 min-w-[200px] flex-1"
            >
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

            <Form.Item
              label="Status"
              name="status"
              className="mb-0 min-w-[150px]"
            >
              <Select
                placeholder="Select status"
                value={statusFilter}
                onChange={(value) => handleFormFieldChange("status", value)}
                allowClear
              >
                <Option value="Active">Active</Option>
                <Option value="Inactive">Inactive</Option>
              </Select>
            </Form.Item>

            <div className="flex gap-2 items-end">
              <Button
                icon={<FilterOutlined />}
                onClick={handleOpenFilterModal}
                className={isFiltersApplied() ? "bg-blue-50" : ""}
              >
                More Filters
                {isFiltersApplied() && (
                  <span className="ml-1 bg-blue-500 text-white rounded-full px-1.5 py-0.5 text-xs">
                    !
                  </span>
                )}
              </Button>

              <Tooltip title="Reset filters">
                <Button icon={<UndoOutlined />} onClick={handleReset} />
              </Tooltip>

              <Dropdown
                overlay={columnMenu}
                trigger={["click"]}
                open={dropdownOpen}
                onOpenChange={handleDropdownVisibleChange}
              >
                <Button icon={<AppstoreOutlined />}>Columns</Button>
              </Dropdown>

              <Button
                icon={<FileExcelOutlined />}
                onClick={handleOpenExportConfig}
              >
                Export
              </Button>
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
          handleViewDetail={handleViewDetail}
          handleCopy={(notification) => {
            setSelectedNotification(notification);
            setCreateModalVisible(true);
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

        <NotificationDetailModal
          visible={detailModalVisible}
          onClose={() => setDetailModalVisible(false)}
          notification={selectedNotification}
        />

        <CreateNotificationModal
          visible={createModalVisible}
          onClose={() => setCreateModalVisible(false)}
          onSuccess={handleCreateSuccess}
          roles={roles}
          notification={selectedNotification}
        />
      </div>
    </>
  );
}

export default NotificationManagement;
