import React, { useState } from "react";
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
} from "antd";
import {
  EditOutlined,
  DeleteOutlined,
  EyeOutlined,
  CheckCircleOutlined,
  StopOutlined,
  DownOutlined,
} from "@ant-design/icons";
import dayjs from "dayjs";
import { UserResponseDTO } from "@/api/user";

const { Text } = Typography;
const { Option } = Select;

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
}

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
}) => {
  const [messageApi, contextHolder] = message.useMessage();

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

  // Function to render the custom select all dropdown
  const renderSelectAll = () => {
    const isSelectAll =
      selectedUsers.length > 0 && selectedUsers.length === users.length;
    const isIndeterminate =
      selectedUsers.length > 0 && selectedUsers.length < users.length;

    // Simplified select all toggle
    const handleSelectAllToggle = () => {
      // If anything is selected, clear the selection
      if (selectedUsers.length > 0) {
        onUserSelect([]);
      } else {
        // Otherwise, select all users
        onUserSelect(users.map((user) => user.id));
      }
    };

    return (
      <>
        <Checkbox
          checked={isSelectAll}
          indeterminate={isIndeterminate}
          onChange={handleSelectAllToggle}
        />
      </>
    );
  };

  // Define table columns
  const columns = [
    {
      title: (
        <span style={{ textTransform: "uppercase", fontWeight: "bold" }}>
          FULL NAME
        </span>
      ),
      dataIndex: "fullName",
      key: "fullName",
      ellipsis: true,
      render: (text: string, record: UserResponseDTO) => (
        <Button type="link" onClick={() => onViewDetails(record)}>
          {text}
        </Button>
      ),
      hidden: !columnVisibility.fullName,
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
      hidden: !columnVisibility.userName,
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
      hidden: !columnVisibility.email,
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
      hidden: !columnVisibility.phone,
    },
    {
      title: (
        <span style={{ textTransform: "uppercase", fontWeight: "bold" }}>
          GENDER
        </span>
      ),
      dataIndex: "gender",
      key: "gender",
      hidden: !columnVisibility.gender,
    },
    {
      title: (
        <span style={{ textTransform: "uppercase", fontWeight: "bold" }}>
          DATE OF BIRTH
        </span>
      ),
      dataIndex: "dob",
      key: "dob",
      render: (date: string) => formatDate(date).split(" ")[0],
      hidden: !columnVisibility.dob,
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
      hidden: !columnVisibility.address,
    },
    {
      title: (
        <span style={{ textTransform: "uppercase", fontWeight: "bold" }}>
          ROLES
        </span>
      ),
      dataIndex: "roles",
      key: "roles",
      render: (roles: string[]) => (
        <Space size={[0, 4]} wrap>
          {roles && roles.length > 0 ? (
            roles.map((role) => {
              let color = "default";
              switch (role) {
                case "Admin":
                  color = "red";
                  break;
                case "Manager":
                  color = "orange";
                  break;
                case "Staff":
                case "Healthcare Staff":
                  color = "blue";
                  break;
                case "User":
                  color = "green";
                  break;
                case "Student":
                  color = "purple";
                  break;
              }
              return (
                <Tag color={color} key={role}>
                  {role}
                </Tag>
              );
            })
          ) : (
            <Tag>No roles</Tag>
          )}
        </Space>
      ),
      hidden: !columnVisibility.roles,
    },
    {
      title: (
        <span style={{ textTransform: "uppercase", fontWeight: "bold" }}>
          STATUS
        </span>
      ),
      dataIndex: "status",
      key: "status",
      align: "center" as const,
      render: (status: string) => (
        <div style={{ display: "flex", justifyContent: "center" }}>
          {renderStatusTag(status)}
        </div>
      ),
      hidden: !columnVisibility.status,
    },
    {
      title: (
        <span style={{ textTransform: "uppercase", fontWeight: "bold" }}>
          CREATED AT
        </span>
      ),
      dataIndex: "createdAt",
      key: "createdAt",
      render: (date: string) => formatDate(date),
      hidden: !columnVisibility.createdAt,
    },
    {
      title: (
        <span style={{ textTransform: "uppercase", fontWeight: "bold" }}>
          UPDATED AT
        </span>
      ),
      dataIndex: "updatedAt",
      key: "updatedAt",
      render: (date: string) => (date ? formatDate(date) : "N/A"),
      hidden: !columnVisibility.updatedAt,
    },
    {
      title: (
        <span style={{ textTransform: "uppercase", fontWeight: "bold" }}>
          ACTIONS
        </span>
      ),
      key: "actions",
      render: (text: string, record: UserResponseDTO) => (
        <Space size="middle">
          <Tooltip title="Edit">
            <Button
              type="primary"
              icon={<EditOutlined />}
              onClick={() => onEdit?.(record)}
            />
          </Tooltip>
          {record.status === "Active" ? (
            <Popconfirm
              title="Are you sure you want to deactivate this user?"
              onConfirm={() => onDeactivate(record.id)}
              okText="Yes"
              cancelText="No"
            >
              <Tooltip title="Deactivate">
                <Button danger icon={<StopOutlined />} />
              </Tooltip>
            </Popconfirm>
          ) : (
            <Popconfirm
              title="Are you sure you want to activate this user?"
              onConfirm={() => onActivate(record.id)}
              okText="Yes"
              cancelText="No"
            >
              <Tooltip title="Activate">
                <Button type="primary" icon={<CheckCircleOutlined />} />
              </Tooltip>
            </Popconfirm>
          )}
        </Space>
      ),
      hidden: !columnVisibility.actions,
    },
  ];

  // Filter columns based on visibility settings
  const visibleColumns = columns.filter((column) => {
    return columnVisibility[column.key as keyof typeof columnVisibility];
  });

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

  const rowSelection: TableProps<UserResponseDTO>["rowSelection"] = {
    selectedRowKeys: selectedUsers,
    onChange: (selectedRowKeys: React.Key[]) => {
      onUserSelect(selectedRowKeys);
    },
    fixed: true,
    columnTitle: renderSelectAll(),
  };

  return (
    <>
      {contextHolder}
      {/* Row that shows selected items count (left) and rows per page (right) */}
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
          {selectedUsers.length > 0 && (
            <>
              <Text type="secondary">
                {selectedUsers.length} items selected
              </Text>
            </>
          )}
        </div>

        {/* Rows per page - right side */}
        <div
          style={{
            display: "flex",
            gap: "8px",
            alignItems: "center",
          }}
        >
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

        {/* Enhanced pagination with "Go to page" input */}
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
