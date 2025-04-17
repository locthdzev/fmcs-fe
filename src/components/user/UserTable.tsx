import React, { useState, useEffect } from "react";
import {
  Table,
  Button,
  Space,
  Tag,
  Tooltip,
  Popconfirm,
  Typography,
  Checkbox,
  Card,
  Row,
  Pagination,
  InputNumber,
  Spin,
  Select,
  Dropdown,
  message,
  TableProps,
  Menu,
  Form,
} from "antd";
import type { ColumnsType } from "antd/es/table";
import {
  FormOutlined,
  EyeOutlined,
  CheckCircleOutlined,
  StopOutlined,
  DownOutlined,
  MoreOutlined,
} from "@ant-design/icons";
import dayjs from "dayjs";
import { UserResponseDTO } from "@/api/user";

const { Text } = Typography;
const { Option } = Select;

// ======== TYPES & INTERFACES ========
interface UserTableProps {
  users: UserResponseDTO[];
  loading: boolean;
  totalItems: number;
  currentPage: number;
  pageSize: number;
  onPageChange: (page: number, pageSize?: number) => void;
  onUserSelect: (selectedRowKeys: React.Key[]) => void;
  selectedUsers: string[];
  columnVisibility: Record<string, boolean>;
  onActivate: (id: string) => void;
  onDeactivate: (id: string) => void;
  onViewDetails: (user: UserResponseDTO) => void;
  onEdit?: (user: UserResponseDTO) => void;
  getAllUserIdsByStatus?: (statuses: string[]) => Promise<string[]>;
}

// ======== MAIN COMPONENT ========
const UserTable: React.FC<UserTableProps> = ({
  users,
  loading,
  totalItems,
  currentPage,
  pageSize,
  onPageChange,
  onUserSelect,
  selectedUsers,
  columnVisibility,
  onActivate,
  onDeactivate,
  onViewDetails,
  onEdit,
  getAllUserIdsByStatus,
}) => {
  const [messageApi, contextHolder] = message.useMessage();

  // ======== STATE MANAGEMENT ========
  // Selection states
  const [selectedOption, setSelectedOption] = useState<string | null>(null);
  const [isLoadingAllItems, setIsLoadingAllItems] = useState<boolean>(false);
  const [selectedItemTypes, setSelectedItemTypes] = useState<{
    hasActive: boolean;
    hasInactive: boolean;
  }>({
    hasActive: false,
    hasInactive: false,
  });

  // ======== EFFECTS ========
  // Update selected item types when selectedUsers changes
  useEffect(() => {
    if (selectedUsers.length === 0) {
      setSelectedItemTypes({
        hasActive: false,
        hasInactive: false,
      });
      return;
    }

    // For dropdown selections, determine status directly from the selection option
    if (selectedOption) {
      if (selectedOption === "all-active" || selectedOption === "page-active") {
        setSelectedItemTypes({
          hasActive: true,
          hasInactive: false,
        });
        return;
      }
      if (
        selectedOption === "all-inactive" ||
        selectedOption === "page-inactive"
      ) {
        setSelectedItemTypes({
          hasActive: false,
          hasInactive: true,
        });
        return;
      }
    }

    // For "select all" checkbox or individual selections
    const visibleSelectedUsers = users.filter((user) =>
      selectedUsers.includes(user.id)
    );

    const hasActiveInCurrentPage = visibleSelectedUsers.some(
      (user) => user.status === "Active"
    );

    const hasInactiveInCurrentPage = visibleSelectedUsers.some(
      (user) => user.status === "Inactive"
    );

    // For select all or selection that includes users from other pages
    if (visibleSelectedUsers.length < selectedUsers.length) {
      // Show both buttons when select all is used (assuming mixed statuses)
      setSelectedItemTypes({
        hasActive: true,
        hasInactive: true,
      });
    } else {
      // For selections only on current page, use actual statuses
      setSelectedItemTypes({
        hasActive: hasActiveInCurrentPage,
        hasInactive: hasInactiveInCurrentPage,
      });
    }
  }, [selectedUsers, users, selectedOption]);

  // ======== UTILITY FUNCTIONS ========
  // Format date strings for display
  const formatDate = (dateStr: string | null | undefined) => {
    if (!dateStr) return "-";
    return dayjs(dateStr).format("DD/MM/YYYY HH:mm:ss");
  };

  // Get status tag color
  const getStatusColor = (status: string) => {
    switch (status.toUpperCase()) {
      case "ACTIVE":
        return "success";
      case "INACTIVE":
        return "error";
      default:
        return "default";
    }
  };

  // Render status tag
  const renderStatusTag = (status: string) => {
    const color = getStatusColor(status);
    const icon =
      status.toUpperCase() === "ACTIVE" ? (
        <CheckCircleOutlined />
      ) : (
        <StopOutlined />
      );

    return (
      <Tag color={color} icon={icon}>
        {status}
      </Tag>
    );
  };

  // Helper to render role with proper formatting
  const renderRole = (role: string) => {
    switch (role) {
      case "Admin":
        return "Admin";
      case "Manager":
        return "Manager";
      case "Healthcare Staff":
        return "HealthcareStaff";
      case "Canteen Staff":
        return "CanteenStaff";
      case "User":
        return "User";
      default:
        return role;
    }
  };

  // ======== SELECTION HANDLERS ========
  // Get all user IDs with specific statuses
  const getItemIdsByStatus = async (
    statuses: string[],
    currentPageOnly: boolean = false
  ) => {
    if (currentPageOnly) {
      // If only current page, filter from current page data
      const filteredUsers = users.filter((user) =>
        statuses.includes(user.status || "")
      );
      return filteredUsers.map((user) => user.id);
    } else {
      // For all pages, use the API if available
      if (getAllUserIdsByStatus) {
        try {
          setIsLoadingAllItems(true);
          const allIds = await getAllUserIdsByStatus(statuses);
          setIsLoadingAllItems(false);
          return allIds;
        } catch (error) {
          console.error("Error fetching all items by status:", error);
          setIsLoadingAllItems(false);

          // Fallback to current page if API fails
          const filteredUsers = users.filter((user) =>
            statuses.includes(user.status || "")
          );
          return filteredUsers.map((user) => user.id);
        }
      } else {
        // Fallback if API is not provided
        console.warn(
          "getAllUserIdsByStatus not provided, falling back to current page"
        );
        const filteredUsers = users.filter((user) =>
          statuses.includes(user.status || "")
        );
        return filteredUsers.map((user) => user.id);
      }
    }
  };

  // Clear selection helper
  const clearAllSelections = () => {
    onUserSelect([]);
    setSelectedOption(null);
  };

  // Select all toggle handler
  const handleSelectAllToggle = async (e: any) => {
    if (e.target.checked) {
      // When checked, select all users from all pages
      try {
        setIsLoadingAllItems(true);
        // Get all user IDs (both Active and Inactive) from all pages
        let allIds: string[] = [];
        if (getAllUserIdsByStatus) {
          allIds = await getAllUserIdsByStatus(["Active", "Inactive"]);
        } else {
          allIds = users.map((user) => user.id);
        }

        // Clear dropdown selection
        setSelectedOption(null);

        // Select all users
        onUserSelect(allIds);

        // Check if we have any inactive users
        const hasInactiveUsers = users.some(
          (user) => user.status === "Inactive"
        );
        // Check if we have any active users
        const hasActiveUsers = users.some((user) => user.status === "Active");

        // Show buttons based on actual user statuses
        setSelectedItemTypes({
          hasActive: hasActiveUsers,
          hasInactive: hasInactiveUsers,
        });

        setIsLoadingAllItems(false);
      } catch (error) {
        console.error("Error selecting all users:", error);
        messageApi.error("Failed to select all users");
        setIsLoadingAllItems(false);
      }
    } else {
      // If unchecked, clear all selections
      clearAllSelections();
    }
  };

  // Handle select by status from dropdown
  const handleSelectByStatus = async (key: string) => {
    // Check if this option is already selected
    if (selectedOption === key) {
      // If it is, deselect it and clear selections
      clearAllSelections();
    } else {
      // Otherwise, select it and apply the selection
      setSelectedOption(key);

      switch (key) {
        case "all-active":
          // Select all Active users from all pages
          const activeIds = await getItemIdsByStatus(["Active"], false);
          onUserSelect(activeIds);
          setSelectedItemTypes({
            hasActive: true,
            hasInactive: false,
          });
          break;
        case "all-inactive":
          // Select all Inactive users from all pages
          const inactiveIds = await getItemIdsByStatus(["Inactive"], false);
          onUserSelect(inactiveIds);
          setSelectedItemTypes({
            hasActive: false,
            hasInactive: true,
          });
          break;
        case "page-active":
          // Select Active users on current page
          const pageActiveIds = await getItemIdsByStatus(["Active"], true);
          onUserSelect(pageActiveIds);
          setSelectedItemTypes({
            hasActive: true,
            hasInactive: false,
          });
          break;
        case "page-inactive":
          // Select Inactive users on current page
          const pageInactiveIds = await getItemIdsByStatus(["Inactive"], true);
          onUserSelect(pageInactiveIds);
          setSelectedItemTypes({
            hasActive: false,
            hasInactive: true,
          });
          break;
      }
    }
  };

  // ======== UI COMPONENTS ========
  // Render Select All checkbox with dropdown
  const renderSelectAll = () => {
    // Count users by status to determine which options to show
    const activeCount = users.filter((user) => user.status === "Active").length;
    const inactiveCount = users.filter(
      (user) => user.status === "Inactive"
    ).length;

    const isSelectAll =
      selectedUsers.length > 0 && selectedUsers.length === users.length;
    const isIndeterminate =
      selectedUsers.length > 0 && selectedUsers.length < users.length;

    // Create dropdown menu items
    const items = [];

    // Only add "select active on this page" if we have active users
    if (activeCount > 0) {
      items.push({
        key: "page-active",
        label: <div>Select all Active users on this page</div>,
      });
    }

    // Only add "select all active" if there are active users
    if (activeCount > 0 || (getAllUserIdsByStatus && totalItems > 0)) {
      items.push({
        key: "all-active",
        label: (
          <div>
            {isLoadingAllItems && selectedOption === "all-active" ? (
              <div
                style={{ display: "flex", alignItems: "center", gap: "8px" }}
              >
                <Spin size="small" />
                <span>Loading all Active users...</span>
              </div>
            ) : (
              <span>Select all Active users (all pages)</span>
            )}
          </div>
        ),
      });
    }

    // Only add "select inactive on this page" if we have inactive users
    if (inactiveCount > 0) {
      items.push({
        key: "page-inactive",
        label: <div>Select all Inactive users on this page</div>,
      });
    }

    // Only add "select all inactive" if there are inactive users
    if (inactiveCount > 0) {
      items.push({
        key: "all-inactive",
        label: (
          <div>
            {isLoadingAllItems && selectedOption === "all-inactive" ? (
              <div
                style={{ display: "flex", alignItems: "center", gap: "8px" }}
              >
                <Spin size="small" />
                <span>Loading all Inactive users...</span>
              </div>
            ) : (
              <span>Select all Inactive users (all pages)</span>
            )}
          </div>
        ),
      });
    }

    return (
      <>
        <Checkbox
          checked={isSelectAll}
          indeterminate={isIndeterminate}
          onChange={handleSelectAllToggle}
          disabled={false}
        />
        <Dropdown
          menu={{
            items,
            onClick: ({ key }) => handleSelectByStatus(key),
            selectable: false,
          }}
          placement="bottomLeft"
          trigger={["click"]}
          open={items.length > 0 ? undefined : false}
        >
          <Button
            type="text"
            size="small"
            className="select-all-dropdown"
            style={{
              marginLeft: 0,
              padding: "0 4px",
              position: "absolute",
              top: "50%",
              transform: "translateY(-50%)",
              left: "22px",
            }}
          >
            <DownOutlined />
          </Button>
        </Dropdown>
      </>
    );
  };

  // Render action buttons based on selection
  const renderActionButtons = () => {
    if (selectedUsers.length === 0) return null;

    // Use the tracked state to determine which buttons to show
    const { hasActive, hasInactive } = selectedItemTypes;

    return (
      <>
        <Text type="secondary">{selectedUsers.length} items selected</Text>

        {/* Show Activate button only if there are inactive users in selection */}
        {hasInactive && (
          <Tooltip title="Activate selected inactive users">
            <Popconfirm
              title={
                <div style={{ padding: "0 10px" }}>Activate selected users</div>
              }
              description={
                <p style={{ padding: "10px 40px 10px 18px" }}>
                  Are you sure you want to activate selected inactive users?
                </p>
              }
              onConfirm={async () => {
                try {
                  const inactiveUserIds = selectedUsers;

                  if (inactiveUserIds.length > 0) {
                    await Promise.all(
                      inactiveUserIds.map((id) => onActivate(id))
                    );
                    messageApi.success("Users activated successfully");
                    clearAllSelections();
                  } else {
                    messageApi.info("No inactive users selected to activate");
                  }
                } catch (error) {
                  console.error("Error activating users:", error);
                  messageApi.error("Failed to activate some users");
                }
              }}
              onCancel={() => {}}
              okText="Activate"
              cancelText="Cancel"
              placement="rightBottom"
            >
              <Button
                icon={<CheckCircleOutlined />}
                style={{ color: "#52c41a" }}
              >
                Activate
              </Button>
            </Popconfirm>
          </Tooltip>
        )}

        {/* Show Deactivate button only if there are active users in selection */}
        {hasActive && (
          <Tooltip title="Deactivate selected active users">
            <Popconfirm
              title={
                <div style={{ padding: "0 10px" }}>
                  Deactivate selected users
                </div>
              }
              description={
                <p style={{ padding: "10px 40px 10px 18px" }}>
                  Are you sure you want to deactivate selected active users?
                </p>
              }
              onConfirm={async () => {
                try {
                  const activeUserIds = selectedUsers;

                  if (activeUserIds.length > 0) {
                    await Promise.all(
                      activeUserIds.map((id) => onDeactivate(id))
                    );
                    messageApi.success("Users deactivated successfully");
                    clearAllSelections();
                  } else {
                    messageApi.info("No active users selected to deactivate");
                  }
                } catch (error) {
                  console.error("Error deactivating users:", error);
                  messageApi.error("Failed to deactivate some users");
                }
              }}
              onCancel={() => {}}
              okText="Deactivate"
              cancelText="Cancel"
              placement="rightBottom"
            >
              <Button danger icon={<StopOutlined />}>
                Deactivate
              </Button>
            </Popconfirm>
          </Tooltip>
        )}
      </>
    );
  };

  // ======== TABLE CONFIGURATION ========
  // Define table columns
  const columns: ColumnsType<UserResponseDTO> = [
    {
      title: (
        <span style={{ textTransform: "uppercase", fontWeight: "bold" }}>
          FULL NAME
        </span>
      ),
      dataIndex: "fullName",
      key: "fullName",
      ellipsis: true,
      fixed: "left" as const,
      width: 180,
      render: (text: string, record: UserResponseDTO) => (
        <Button
          type="link"
          onClick={() => onViewDetails(record)}
          style={{
            padding: "0",
            margin: "0",
            height: "auto",
            textAlign: "left",
          }}
        >
          {text}
        </Button>
      ),
    },
    {
      title: (
        <span style={{ textTransform: "uppercase", fontWeight: "bold" }}>
          USERNAME
        </span>
      ),
      dataIndex: "userName",
      key: "userName",
      ellipsis: true,
      width: 150,
    },
    {
      title: (
        <span style={{ textTransform: "uppercase", fontWeight: "bold" }}>
          EMAIL
        </span>
      ),
      dataIndex: "email",
      key: "email",
      ellipsis: true,
      width: 250,
    },
    {
      title: (
        <span style={{ textTransform: "uppercase", fontWeight: "bold" }}>
          PHONE
        </span>
      ),
      dataIndex: "phone",
      key: "phone",
      ellipsis: true,
      width: 100,
      align: "center" as const,
    },
    {
      title: (
        <span style={{ textTransform: "uppercase", fontWeight: "bold" }}>
          GENDER
        </span>
      ),
      dataIndex: "gender",
      key: "gender",
      width: 90,
      align: "center" as const,
    },
    {
      title: (
        <span style={{ textTransform: "uppercase", fontWeight: "bold" }}>
          DOB
        </span>
      ),
      dataIndex: "dob",
      key: "dob",
      width: 120,
      render: (date: string) => formatDate(date).split(" ")[0],
    },
    {
      title: (
        <span style={{ textTransform: "uppercase", fontWeight: "bold" }}>
          ADDRESS
        </span>
      ),
      dataIndex: "address",
      key: "address",
      ellipsis: true,
      width: 200,
    },
    {
      title: (
        <span style={{ textTransform: "uppercase", fontWeight: "bold" }}>
          ROLES
        </span>
      ),
      dataIndex: "roles",
      key: "roles",
      width: 100,
      align: "center" as const,
      render: (roles: string[]) => {
        // If user has no roles
        if (!roles || roles.length === 0) {
          return <Tag>No roles</Tag>;
        }

        // Priority order for roles
        const priority: Record<string, number> = {
          Admin: 1,
          Manager: 2,
          "Healthcare Staff": 3,
          "Canteen Staff": 4,
          User: 5,
        };

        // Sort roles by priority
        const sortedRoles = [...roles].sort((a, b) => {
          return (priority[a] || 999) - (priority[b] || 999);
        });

        // Get primary role and count of other roles
        const primaryRole = sortedRoles[0];
        const otherRolesCount = sortedRoles.length - 1;

        // Select color for role tag
        let color = "default";
        switch (primaryRole) {
          case "Admin":
            color = "red";
            break;
          case "Manager":
            color = "orange";
            break;
          case "Healthcare Staff":
            color = "blue";
            break;
          case "Canteen Staff":
            color = "purple";
            break;
          case "User":
            color = "green";
            break;
        }

        // Display primary role with count of additional roles
        return (
          <div style={{ display: "flex", justifyContent: "center" }}>
            <Tooltip
              title={
                otherRolesCount > 0
                  ? `+ ${sortedRoles.slice(1).map(renderRole).join(", ")}`
                  : undefined
              }
              placement="topLeft"
            >
              <Tag color={color}>
                {renderRole(primaryRole)}
                {otherRolesCount > 0 ? ` +${otherRolesCount}` : ""}
              </Tag>
            </Tooltip>
          </div>
        );
      },
    },
    {
      title: (
        <span style={{ textTransform: "uppercase", fontWeight: "bold" }}>
          STATUS
        </span>
      ),
      dataIndex: "status",
      key: "status",
      width: 120,
      align: "center" as const,
      render: (status: string) => (
        <div style={{ display: "flex", justifyContent: "center" }}>
          {renderStatusTag(status)}
        </div>
      ),
    },
    {
      title: (
        <span style={{ textTransform: "uppercase", fontWeight: "bold" }}>
          CREATED AT
        </span>
      ),
      dataIndex: "createdAt",
      key: "createdAt",
      width: 180,
      render: (date: string) => formatDate(date),
    },
    {
      title: (
        <span style={{ textTransform: "uppercase", fontWeight: "bold" }}>
          UPDATED AT
        </span>
      ),
      dataIndex: "updatedAt",
      key: "updatedAt",
      width: 180,
      render: (date: string) => (date ? formatDate(date) : "N/A"),
    },
    {
      title: (
        <span
          style={{
            textTransform: "uppercase",
            fontWeight: "bold",
            display: "flex",
            justifyContent: "center",
          }}
        >
          ACTIONS
        </span>
      ),
      key: "actions",
      fixed: "right" as const,
      width: 120,
      render: (text: string, record: UserResponseDTO) => (
        <div style={{ textAlign: "center" }}>
          <Dropdown
            overlay={
              <Menu>
                <Menu.Item
                  key="edit"
                  icon={<FormOutlined />}
                  onClick={() => onEdit?.(record)}
                >
                  Edit
                </Menu.Item>
                {record.status === "Active" ? (
                  <Menu.Item
                    key="deactivate"
                    icon={<StopOutlined />}
                    onClick={() => onDeactivate(record.id)}
                    danger
                  >
                    Deactivate
                  </Menu.Item>
                ) : (
                  <Menu.Item
                    key="activate"
                    icon={<CheckCircleOutlined />}
                    onClick={() => onActivate(record.id)}
                    style={{ color: "#52c41a" }}
                  >
                    Activate
                  </Menu.Item>
                )}
              </Menu>
            }
            placement="bottomCenter"
          >
            <Button icon={<MoreOutlined />} size="small" />
          </Dropdown>
        </div>
      ),
      align: "center" as const,
    },
  ];

  // Filter columns based on visibility settings
  const visibleColumns = columns.filter((column) => {
    const key = column.key as string;
    return key in columnVisibility ? columnVisibility[key] : true;
  });

  // Configure row selection
  const rowSelection: TableProps<UserResponseDTO>["rowSelection"] = {
    selectedRowKeys: selectedUsers,
    onChange: (selectedRowKeys: React.Key[]) => {
      // Reset selectedOption if selection count changes or all are deselected
      if (
        selectedRowKeys.length === 0 ||
        selectedRowKeys.length !== selectedUsers.length
      ) {
        setSelectedOption(null);
      }
      onUserSelect(selectedRowKeys);
    },
    fixed: true,
    getCheckboxProps: () => ({
      disabled: false,
    }),
    columnTitle: renderSelectAll(),
  };

  // ======== RENDER LOADING STATE ========
  if (loading) {
    return (
      <Card className="shadow-sm">
        <div
          style={{ display: "flex", justifyContent: "center", padding: "40px" }}
        >
          <Spin tip="Loading..." />
        </div>
      </Card>
    );
  }

  // ======== MAIN RENDER ========
  return (
    <>
      {contextHolder}
      {/* Control bar: selected items count (left) and rows per page (right) */}
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          marginBottom: "16px",
          alignItems: "center",
        }}
      >
        {/* Selected items count and bulk actions - left side */}
        <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
          {renderActionButtons()}
        </div>

        {/* Rows per page - right side */}
        <div style={{ display: "flex", gap: "8px", alignItems: "center" }}>
          <Text type="secondary">Rows per page:</Text>
          <Select
            value={pageSize}
            onChange={(value) => onPageChange(1, value)}
            style={{ width: "80px" }}
          >
            <Option value={5}>5</Option>
            <Option value={10}>10</Option>
            <Option value={15}>15</Option>
            <Option value={20}>20</Option>
          </Select>
        </div>
      </div>

      {/* Main data table */}
      <Card className="shadow-sm" bodyStyle={{ padding: "16px" }}>
        <div style={{ overflowX: "auto" }}>
          <Table
            rowSelection={rowSelection}
            columns={visibleColumns}
            dataSource={users}
            rowKey="id"
            loading={loading}
            pagination={false}
            scroll={{ x: "max-content" }}
            size="middle"
            bordered
            sticky={{ offsetHeader: 0 }}
            rowClassName={(record) =>
              selectedUsers.includes(record.id) ? "ant-table-row-selected" : ""
            }
          />
        </div>

        {/* Pagination with "Go to page" input */}
        <Card className="mt-4 shadow-sm">
          <Row justify="center" align="middle">
            <Space size="large" align="center">
              <Text type="secondary">Total {totalItems} items</Text>
              <Space align="center" size="large">
                <Pagination
                  current={currentPage}
                  pageSize={pageSize}
                  total={totalItems}
                  onChange={(page) => onPageChange(page, pageSize)}
                  showSizeChanger={false}
                  showTotal={() => ""}
                />
                <Space align="center">
                  <Text type="secondary">Go to page:</Text>
                  <InputNumber
                    min={1}
                    max={Math.ceil(totalItems / pageSize) || 1}
                    value={currentPage}
                    onChange={(value) => {
                      if (
                        value &&
                        Number(value) > 0 &&
                        Number(value) <= Math.ceil(totalItems / pageSize)
                      ) {
                        onPageChange(Number(value), pageSize);
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
    </>
  );
};

export default UserTable;
