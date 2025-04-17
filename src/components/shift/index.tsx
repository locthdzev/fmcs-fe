import React, { useState, useEffect, useCallback } from "react";
import {
  Button,
  Table,
  Switch,
  Input,
  Select,
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
  Modal,
} from "antd";
import {
  Chip,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
  CardHeader,
  CardBody,
} from "@heroui/react";
import {
  getShifts,
  activateShifts,
  deactivateShifts,
  deleteShift,
  ShiftResponse,
} from "@/api/shift";
import {
  PlusOutlined,
  SearchOutlined,
  SettingOutlined,
  ExportOutlined,
  FormOutlined,
  DeleteOutlined,
  FilterOutlined,
  ArrowLeftOutlined,
  UndoOutlined,
  FileExcelOutlined,
  AppstoreOutlined,
  ClockCircleOutlined,
  ReloadOutlined,
  SortAscendingOutlined,
  SortDescendingOutlined,
  WarningOutlined,
} from "@ant-design/icons";
import { toast } from "react-toastify";
import EditShiftModal from "./EditShiftModal";
import CreateShiftModal from "./CreateShiftModal";

const { Column } = Table;
const { Option } = Select;
const { Text, Title } = Typography;

export function ShiftManagement() {
  const [shifts, setShifts] = useState<ShiftResponse[]>([]);
  const [loading, setLoading] = useState(false);
  const [statusLoading, setStatusLoading] = useState<{
    [key: string]: boolean;
  }>({});
  const [isEditModalVisible, setIsEditModalVisible] = useState(false);
  const [isCreateModalVisible, setIsCreateModalVisible] = useState(false);
  const [currentShift, setCurrentShift] = useState<ShiftResponse | null>(null);
  const [isConfirmDeleteModalOpen, setIsConfirmDeleteModalOpen] =
    useState(false);
  const [shiftToDelete, setShiftToDelete] = useState<string | null>(null);

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [total, setTotal] = useState(0);

  // Filters
  const [searchText, setSearchText] = useState("");
  const [statusFilter, setStatusFilter] = useState<string | undefined>();
  const [sortBy, setSortBy] = useState("shiftName");
  const [ascending, setAscending] = useState(true);
  const [selectedRowKeys, setSelectedRowKeys] = useState<React.Key[]>([]);
  const [messageApi, contextHolder] = message.useMessage();
  const [dropdownOpen, setDropdownOpen] = useState(false);

  // Column visibility state
  const [columnVisibility, setColumnVisibility] = useState<
    Record<string, boolean>
  >({
    shiftName: true,
    startTime: true,
    endTime: true,
    totalTime: true,
    status: true,
    toggle: true,
    actions: true,
  });

  const fetchShifts = useCallback(async () => {
    try {
      setLoading(true);
      const data = await getShifts();
      setShifts(data);
      setTotal(data.length);
    } catch (error) {
      messageApi.error("Failed to fetch shifts.");
    } finally {
      setLoading(false);
    }
  }, [messageApi]);

  useEffect(() => {
    fetchShifts();
  }, [fetchShifts]);

  const filteredShifts = React.useMemo(() => {
    if (!shifts) return [];

    let filtered = [...shifts];

    // Apply search text filter
    if (searchText) {
      const normalizedSearch = searchText.toLowerCase();
      filtered = filtered.filter((shift) =>
        shift.shiftName.toLowerCase().includes(normalizedSearch)
      );
    }

    // Apply status filter
    if (statusFilter) {
      filtered = filtered.filter((shift) => shift.status === statusFilter);
    }

    // Apply sorting
    filtered.sort((a, b) => {
      let comparison = 0;
      if (sortBy === "shiftName") {
        comparison = a.shiftName.localeCompare(b.shiftName);
      } else if (sortBy === "startTime") {
        comparison = a.startTime.localeCompare(b.startTime);
      } else if (sortBy === "endTime") {
        comparison = a.endTime.localeCompare(b.endTime);
      }
      return ascending ? comparison : -comparison;
    });

    return filtered;
  }, [shifts, searchText, statusFilter, sortBy, ascending]);

  // Get paginated data
  const paginatedShifts = React.useMemo(() => {
    const startIndex = (currentPage - 1) * pageSize;
    const endIndex = startIndex + pageSize;
    return filteredShifts.slice(startIndex, endIndex);
  }, [filteredShifts, currentPage, pageSize]);

  const handleShowCreateModal = () => {
    setIsCreateModalVisible(true);
  };

  const handleShowEditModal = (shift: ShiftResponse) => {
    setCurrentShift(shift);
    setIsEditModalVisible(true);
  };

  const handleShowDeleteConfirm = (shiftId: string) => {
    setShiftToDelete(shiftId);
    setIsConfirmDeleteModalOpen(true);
  };

  const handleDeleteShift = async () => {
    if (!shiftToDelete) return;
    try {
      const response = await deleteShift(shiftToDelete);
      if (response.isSuccess) {
        messageApi.success(response.message || "Shift deleted successfully!");
        fetchShifts();
      } else {
        messageApi.error(response.message || "Failed to delete shift");
      }
    } catch (error) {
      messageApi.error("Failed to delete shift");
    } finally {
      setIsConfirmDeleteModalOpen(false);
      setShiftToDelete(null);
    }
  };

  const handleToggleStatus = async (shiftId: string, isActive: boolean) => {
    try {
      setStatusLoading((prev) => ({ ...prev, [shiftId]: true }));

      const response = isActive
        ? await activateShifts([shiftId])
        : await deactivateShifts([shiftId]);

      if (response.isSuccess) {
        messageApi.success(response.message || "Shift status updated!");
      } else {
        messageApi.error(response.message || "Failed to update shift status");
      }

      setShifts((prevShifts) =>
        prevShifts.map((shift) =>
          shift.id === shiftId
            ? { ...shift, status: isActive ? "Active" : "Inactive" }
            : shift
        )
      );
    } catch (error) {
      messageApi.error("Failed to toggle shift status");
    } finally {
      setStatusLoading((prev) => ({ ...prev, [shiftId]: false }));
    }
  };

  const calculateTotalHours = (startTime: string, endTime: string) => {
    const start = new Date(`2000/01/01 ${startTime.slice(0, 5)}`);
    const end = new Date(`2000/01/01 ${endTime.slice(0, 5)}`);
    if (end < start) {
      end.setDate(end.getDate() + 1);
    }
    const diff = end.getTime() - start.getTime();
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
    return `${hours}h ${minutes}m`;
  };

  const handleBulkDelete = async () => {
    try {
      for (const key of selectedRowKeys) {
        await deleteShift(key.toString());
      }
      messageApi.success("Selected shifts deleted successfully!");
      setSelectedRowKeys([]);
      fetchShifts();
    } catch (error) {
      messageApi.error("Failed to delete selected shifts");
    }
  };

  const handleReset = () => {
    setSearchText("");
    setStatusFilter(undefined);
    setSortBy("shiftName");
    setAscending(true);
    setCurrentPage(1);
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

  // Define visible columns
  const ALL_COLUMNS = [
    {
      key: "shiftName",
      title: (
        <span style={{ textTransform: "uppercase", fontWeight: "bold" }}>
          SHIFT NAME
        </span>
      ),
      dataIndex: "shiftName",
      visible: columnVisibility.shiftName,
    },
    {
      key: "startTime",
      title: (
        <span style={{ textTransform: "uppercase", fontWeight: "bold" }}>
          START TIME
        </span>
      ),
      dataIndex: "startTime",
      render: (startTime: string) => startTime.slice(0, 5),
      visible: columnVisibility.startTime,
    },
    {
      key: "endTime",
      title: (
        <span style={{ textTransform: "uppercase", fontWeight: "bold" }}>
          END TIME
        </span>
      ),
      dataIndex: "endTime",
      render: (endTime: string) => endTime.slice(0, 5),
      visible: columnVisibility.endTime,
    },
    {
      key: "totalTime",
      title: (
        <span style={{ textTransform: "uppercase", fontWeight: "bold" }}>
          TOTAL TIME
        </span>
      ),
      render: (_: any, record: ShiftResponse) =>
        calculateTotalHours(record.startTime, record.endTime),
      visible: columnVisibility.totalTime,
    },
    {
      key: "status",
      title: (
        <span style={{ textTransform: "uppercase", fontWeight: "bold" }}>
          STATUS
        </span>
      ),
      dataIndex: "status",
      render: (status: string) => (
        <Tag color={status === "Active" ? "success" : "error"}>{status}</Tag>
      ),
      visible: columnVisibility.status,
    },
    {
      key: "toggle",
      title: (
        <span style={{ textTransform: "uppercase", fontWeight: "bold" }}>
          TOGGLE
        </span>
      ),
      render: (_: any, record: ShiftResponse) => (
        <Switch
          checked={record.status === "Active"}
          loading={statusLoading[record.id]}
          onChange={(checked) => handleToggleStatus(record.id, checked)}
        />
      ),
      visible: columnVisibility.toggle,
    },
    {
      key: "actions",
      title: (
        <span style={{ textTransform: "uppercase", fontWeight: "bold" }}>
          ACTIONS
        </span>
      ),
      render: (_: any, record: ShiftResponse) => (
        <Space>
          <Tooltip title="Edit">
            <Button
              type="text"
              icon={<FormOutlined />}
              onClick={() => handleShowEditModal(record)}
            />
          </Tooltip>
          <Tooltip title="Delete">
            <Button
              type="text"
              icon={<DeleteOutlined />}
              onClick={() => handleShowDeleteConfirm(record.id)}
              className="text-red-600"
            />
          </Tooltip>
        </Space>
      ),
      visible: columnVisibility.actions,
    },
  ];

  const columns = ALL_COLUMNS.filter((col) => col.visible);

  return (
    <div className="p-6">
      {contextHolder}

      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Button
            icon={<ArrowLeftOutlined />}
            onClick={() => window.history.back()}
            style={{ marginRight: "8px" }}
          >
            Back
          </Button>
          <ClockCircleOutlined />
          <h3 className="text-xl font-bold">Shift Management</h3>
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
            {/* Search Filter */}
            <Input
              placeholder="Search by shift name"
              prefix={<SearchOutlined />}
              value={searchText}
              onChange={(e) => setSearchText(e.target.value)}
              style={{ width: 250 }}
              allowClear
            />

            {/* Status Filter */}
            <div>
              <Select
                placeholder="Status"
                allowClear
                style={{ width: "150px" }}
                value={statusFilter}
                onChange={(value) => setStatusFilter(value)}
                disabled={loading}
              >
                <Option value="Active">
                  <Badge status="success" text="Active" />
                </Option>
                <Option value="Inactive">
                  <Badge status="error" text="Inactive" />
                </Option>
              </Select>
            </div>

            {/* Reset Button */}
            <Tooltip title="Reset Filters">
              <Button
                icon={<UndoOutlined />}
                onClick={handleReset}
                disabled={
                  !(
                    searchText ||
                    statusFilter ||
                    sortBy !== "shiftName" ||
                    !ascending
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
                    key: "shiftName",
                    label: (
                      <div onClick={handleMenuClick}>
                        <Checkbox
                          checked={columnVisibility.shiftName}
                          onChange={() =>
                            handleColumnVisibilityChange("shiftName")
                          }
                        >
                          Shift Name
                        </Checkbox>
                      </div>
                    ),
                  },
                  {
                    key: "startTime",
                    label: (
                      <div onClick={handleMenuClick}>
                        <Checkbox
                          checked={columnVisibility.startTime}
                          onChange={() =>
                            handleColumnVisibilityChange("startTime")
                          }
                        >
                          Start Time
                        </Checkbox>
                      </div>
                    ),
                  },
                  {
                    key: "endTime",
                    label: (
                      <div onClick={handleMenuClick}>
                        <Checkbox
                          checked={columnVisibility.endTime}
                          onChange={() =>
                            handleColumnVisibilityChange("endTime")
                          }
                        >
                          End Time
                        </Checkbox>
                      </div>
                    ),
                  },
                  {
                    key: "totalTime",
                    label: (
                      <div onClick={handleMenuClick}>
                        <Checkbox
                          checked={columnVisibility.totalTime}
                          onChange={() =>
                            handleColumnVisibilityChange("totalTime")
                          }
                        >
                          Total Time
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
                    key: "toggle",
                    label: (
                      <div onClick={handleMenuClick}>
                        <Checkbox
                          checked={columnVisibility.toggle}
                          onChange={() =>
                            handleColumnVisibilityChange("toggle")
                          }
                        >
                          Toggle
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

            {/* Create Button */}
            <Button
              type="primary"
              icon={<PlusOutlined />}
              onClick={handleShowCreateModal}
              disabled={loading}
            >
              Create
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
              <Text>{selectedRowKeys.length} items selected</Text>
              <Popconfirm
                title="Are you sure to delete the selected shifts?"
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

      {/* Table */}
      <Card className="shadow-sm">
        <Table
          bordered
          dataSource={paginatedShifts}
          columns={columns}
          rowKey="id"
          pagination={false}
          loading={loading}
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
              <Text type="secondary">Total {filteredShifts.length} items</Text>
              <Space align="center" size="large">
                <Pagination
                  current={currentPage}
                  pageSize={pageSize}
                  total={filteredShifts.length}
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
                    max={Math.ceil(filteredShifts.length / pageSize)}
                    value={currentPage}
                    onChange={(value) => {
                      if (
                        value &&
                        Number(value) > 0 &&
                        Number(value) <=
                          Math.ceil(filteredShifts.length / pageSize)
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

      {/* Create Modal */}
      <CreateShiftModal
        visible={isCreateModalVisible}
        onClose={() => setIsCreateModalVisible(false)}
        onSuccess={fetchShifts}
      />

      {/* Edit Modal */}
      {currentShift && (
        <EditShiftModal
          visible={isEditModalVisible}
          shift={currentShift}
          onClose={() => setIsEditModalVisible(false)}
          onSuccess={fetchShifts}
        />
      )}

      {/* Delete Confirmation */}
      <Modal
        title="Confirm Delete"
        open={isConfirmDeleteModalOpen}
        onCancel={() => setIsConfirmDeleteModalOpen(false)}
        footer={[
          <Button
            key="cancel"
            onClick={() => setIsConfirmDeleteModalOpen(false)}
          >
            Cancel
          </Button>,
          <Button key="delete" type="primary" onClick={handleDeleteShift}>
            Delete
          </Button>,
        ]}
      >
        <p>Are you sure you want to delete this shift?</p>
      </Modal>
    </div>
  );
}
