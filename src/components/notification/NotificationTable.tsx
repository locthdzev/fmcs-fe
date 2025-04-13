import React from "react";
import {
  Table,
  Space,
  Button,
  Tooltip,
  Tag,
  Dropdown,
  Card,
  Typography,
  Menu,
  Popconfirm,
} from "antd";
import {
  EyeOutlined,
  DeleteOutlined,
  UndoOutlined,
  ReloadOutlined,
  CopyOutlined,
  MoreOutlined,
} from "@ant-design/icons";
import dayjs from "dayjs";
import { NotificationResponseDTO } from "@/api/notification";

const { Text } = Typography;

interface NotificationTableProps {
  loading: boolean;
  notifications: NotificationResponseDTO[];
  totalItems: number;
  currentPage: number;
  pageSize: number;
  handlePageChange: (page: number, pageSize?: number) => void;
  selectedNotifications: string[];
  setSelectedNotifications: (keys: string[]) => void;
  handleDelete: (id: string) => void;
  handleToggleStatus: (id: string, status: string) => void;
  handleReup: (id: string) => void;
  handleViewDetail: (id: string) => void;
  handleCopy: (notification: NotificationResponseDTO) => void;
  columnVisibility: Record<string, boolean>;
  handleBulkDelete?: (ids: string[]) => void;
}

const NotificationTable: React.FC<NotificationTableProps> = ({
  loading,
  notifications,
  totalItems,
  currentPage,
  pageSize,
  handlePageChange,
  selectedNotifications,
  setSelectedNotifications,
  handleDelete,
  handleToggleStatus,
  handleReup,
  handleViewDetail,
  handleCopy,
  columnVisibility,
  handleBulkDelete,
}) => {
  // Table columns definition
  const columns = [
    {
      title: "Title",
      dataIndex: "title",
      key: "title",
      render: (text: string) => <span className="text-blue-500">{text}</span>,
      width: 200,
      ellipsis: true,
      hidden: !columnVisibility.title,
    },
    {
      title: "Recipient Type",
      dataIndex: "recipientType",
      key: "recipientType",
      render: (text: string) => (
        <Tag color={text === "System" ? "blue" : "green"}>{text}</Tag>
      ),
      width: 120,
      hidden: !columnVisibility.recipientType,
    },
    {
      title: "Send Email",
      dataIndex: "sendEmail",
      key: "sendEmail",
      render: (value: boolean) => (value ? "Yes" : "No"),
      width: 100,
      hidden: !columnVisibility.sendEmail,
    },
    {
      title: "Status",
      dataIndex: "status",
      key: "status",
      render: (text: string) => (
        <Tag color={text === "Active" ? "green" : "red"}>{text}</Tag>
      ),
      width: 100,
      hidden: !columnVisibility.status,
    },
    {
      title: "Created At",
      dataIndex: "createdAt",
      key: "createdAt",
      render: (text: string) => dayjs(text).format("DD/MM/YYYY HH:mm"),
      width: 150,
      hidden: !columnVisibility.createdAt,
    },
    {
      title: "Created By",
      dataIndex: "createdBy",
      key: "createdBy",
      render: (createdBy: { userName?: string }) => createdBy?.userName || "-",
      width: 150,
      hidden: !columnVisibility.createdBy,
    },
    {
      title: "Actions",
      key: "actions",
      render: (_: any, record: NotificationResponseDTO) => (
        <Space size="middle">
          <Tooltip title="View details">
            <Button
              icon={<EyeOutlined />}
              onClick={() => handleViewDetail(record.id)}
              size="small"
            />
          </Tooltip>
          <Tooltip
            title={record.status === "Active" ? "Deactivate" : "Activate"}
          >
            <Button
              icon={
                record.status === "Active" ? (
                  <DeleteOutlined />
                ) : (
                  <UndoOutlined />
                )
              }
              onClick={() => handleToggleStatus(record.id, record.status || "")}
              size="small"
            />
          </Tooltip>
          {record.status !== "Active" && (
            <Tooltip title="Reup notification">
              <Button
                icon={<ReloadOutlined />}
                onClick={() => handleReup(record.id)}
                size="small"
              />
            </Tooltip>
          )}
          <Dropdown
            overlay={
              <Menu>
                <Menu.Item
                  key="delete"
                  icon={<DeleteOutlined />}
                  onClick={() => handleDelete(record.id)}
                >
                  Delete
                </Menu.Item>
                <Menu.Item
                  key="copy"
                  icon={<CopyOutlined />}
                  onClick={() => handleCopy(record)}
                >
                  Copy
                </Menu.Item>
              </Menu>
            }
          >
            <Button icon={<MoreOutlined />} size="small" />
          </Dropdown>
        </Space>
      ),
      width: 180,
      hidden: !columnVisibility.actions,
    },
  ].filter((column) => !column.hidden);

  return (
    <Card className="shadow-md">
      <div className="mb-4">
        {selectedNotifications.length > 0 && handleBulkDelete && (
          <Popconfirm
            title="Are you sure you want to delete the selected notifications?"
            onConfirm={() => handleBulkDelete(selectedNotifications)}
            okText="Yes"
            cancelText="No"
          >
            <Button danger className="mr-2">
              Delete Selected ({selectedNotifications.length})
            </Button>
          </Popconfirm>
        )}
        <Text type="secondary">
          {totalItems} {totalItems === 1 ? "notification" : "notifications"}{" "}
          found
        </Text>
      </div>

      <Table
        dataSource={notifications}
        columns={columns}
        rowKey="id"
        pagination={{
          current: currentPage,
          pageSize,
          total: totalItems,
          onChange: handlePageChange,
          showSizeChanger: true,
        }}
        loading={loading}
        rowSelection={{
          selectedRowKeys: selectedNotifications,
          onChange: (selectedRowKeys) => {
            setSelectedNotifications(selectedRowKeys as string[]);
          },
        }}
        scroll={{ x: 1000 }}
      />
    </Card>
  );
};

export default NotificationTable;
