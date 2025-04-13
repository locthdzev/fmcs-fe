import React, { useState, useEffect } from "react";
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
  Select,
  Row,
  InputNumber,
  Pagination,
  Checkbox,
  Spin,
  message,
  TableProps,
} from "antd";
import {
  EyeOutlined,
  DeleteOutlined,
  ReloadOutlined,
  CopyOutlined,
  MoreOutlined,
  StopOutlined,
  CheckCircleOutlined,
  MailOutlined,
  CloseCircleOutlined,
  TeamOutlined,
  UserOutlined
} from "@ant-design/icons";
import dayjs from "dayjs";
import { NotificationResponseDTO } from "@/api/notification";
import { useRouter } from "next/router";

const { Text } = Typography;
const { Option } = Select;

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
  handleCopy,
  columnVisibility,
  handleBulkDelete,
}) => {
  const [messageApi, contextHolder] = message.useMessage();
  const [selectedOption, setSelectedOption] = useState<string | null>(null);
  const [isLoadingAllItems, setIsLoadingAllItems] = useState<boolean>(false);
  const router = useRouter();

  // Helper function to get consistent color for recipient types
  const getRecipientTypeColor = (type: string) => {
    switch (type) {
      case "System":
        return "blue";
      case "Role":
        return "orange";
      case "User":
        return "green";
      case "Admin":
        return "red";
      case "Manager":
        return "orange";
      case "Healthcare Staff":
        return "blue";
      case "Canteen Staff":
        return "purple";
      default:
        return "green"; // Default color for other recipient types
    }
  };

  const renderRecipientType = (type: string) => {
    switch (type) {
      case "System":
        return (
          <Tag icon={<TeamOutlined />} color={getRecipientTypeColor(type)}>
            Notify the system
          </Tag>
        );
      case "Role":
        return (
          <Tag icon={<TeamOutlined />} color={getRecipientTypeColor(type)}>
            Role
          </Tag>
        );
      case "User":
        return (
          <Tag icon={<TeamOutlined />} color={getRecipientTypeColor(type)}>
            Notify the user
          </Tag>
        );
      case "Admin":
        return (
          <Tag icon={<TeamOutlined />} color={getRecipientTypeColor(type)}>
            Notify the admin
          </Tag>
        );
      case "Manager":
        return (
          <Tag icon={<TeamOutlined />} color={getRecipientTypeColor(type)}>
            Notify the manager
          </Tag>
        );
      case "Healthcare Staff":
        return (
          <Tag icon={<TeamOutlined />} color={getRecipientTypeColor(type)}>
            Notify the healthcare staff
          </Tag>
        );
      case "Canteen Staff":
        return (
          <Tag icon={<TeamOutlined />} color={getRecipientTypeColor(type)}>
            Notify the canteen staff
          </Tag>
        );
      default:
        return (
          <Tag icon={<TeamOutlined />} color={getRecipientTypeColor(type)}>
            {type}
          </Tag>
        );
    }
  };

  const renderStatusTag = (status: string) => {
    switch (status) {
      case "Active":
        return (
          <Tag icon={<CheckCircleOutlined />} color="green">
            {status}
          </Tag>
        );
      case "Inactive":
        return (
          <Tag icon={<StopOutlined />} color="red">
            {status}
          </Tag>
        );
      default:
        return (
          <Tag color="default">
            {status}
          </Tag>
        );
    }
  };

  const columns = [
    {
      title: (
        <span style={{ textTransform: "uppercase", fontWeight: "bold" }}>
          TITLE
        </span>
      ),
      dataIndex: "title",
      key: "title",
      render: (text: string, record: NotificationResponseDTO) => (
        <a 
          className="text-blue-500 hover:underline cursor-pointer"
          onClick={() => router.push(`/notification/${record.id}`)}
        >
          {text}
        </a>
      ),
      width: 200,
      ellipsis: true,
      hidden: !columnVisibility.title,
    },
    {
      title: (
        <span
          style={{
            textTransform: "uppercase",
            fontWeight: "bold",
            textAlign: "center",
            display: "block",
          }}
        >
          RECIPIENT TYPE
        </span>
      ),
      dataIndex: "recipientType",
      key: "recipientType",
      render: (text: string) => (
        <div style={{ textAlign: "center" }}>
          {renderRecipientType(text)}
        </div>
      ),
      width: 180,
      hidden: !columnVisibility.recipientType,
    },
    {
      title: (
        <span
          style={{
            textTransform: "uppercase",
            fontWeight: "bold",
            textAlign: "center",
            display: "block",
          }}
        >
          SEND EMAIL
        </span>
      ),
      dataIndex: "sendEmail",
      key: "sendEmail",
      render: (value: boolean) => (
        <div style={{ textAlign: "center" }}>
          {value ? (
            <Tag icon={<MailOutlined />} color="blue">
              Send emails
            </Tag>
          ) : (
            <Tag icon={<CloseCircleOutlined />} color="default">
              Don't send emails
            </Tag>
          )}
        </div>
      ),
      width: 130,
      hidden: !columnVisibility.sendEmail,
    },
    {
      title: (
        <span
          style={{
            textTransform: "uppercase",
            fontWeight: "bold",
            textAlign: "center",
            display: "block",
          }}
        >
          STATUS
        </span>
      ),
      dataIndex: "status",
      key: "status",
      render: (text: string) => (
        <div style={{ textAlign: "center" }}>
          {renderStatusTag(text)}
        </div>
      ),
      width: 100,
      hidden: !columnVisibility.status,
    },
    {
      title: (
        <span
          style={{
            textTransform: "uppercase",
            fontWeight: "bold",
            textAlign: "center",
            display: "block",
          }}
        >
          CREATED AT
        </span>
      ),
      dataIndex: "createdAt",
      key: "createdAt",
      render: (text: string) => (
        <div style={{ textAlign: "center" }}>
          {dayjs(text).format("DD/MM/YYYY HH:mm:ss")}
        </div>
      ),
      width: 150,
      hidden: !columnVisibility.createdAt,
    },
    {
      title: (
        <span style={{ textTransform: "uppercase", fontWeight: "bold" }}>
          CREATED BY
        </span>
      ),
      dataIndex: "createdBy",
      key: "createdBy",
      render: (createdBy: { userName?: string }) => createdBy?.userName || "-",
      width: 150,
      hidden: !columnVisibility.createdBy,
    },
    {
      title: (
        <span
          style={{
            textTransform: "uppercase",
            fontWeight: "bold",
            textAlign: "center",
            display: "block",
          }}
        >
          ACTIONS
        </span>
      ),
      key: "actions",
      render: (_: any, record: NotificationResponseDTO) => (
        <div style={{ textAlign: "center" }}>
          <Dropdown
            overlay={
              <Menu>
                <Menu.Item
                  key="view"
                  icon={<EyeOutlined />}
                  onClick={() => router.push(`/notification/${record.id}`)}
                >
                  View
                </Menu.Item>
                {record.status !== "Active" && (
                  <Menu.Item
                    key="reup"
                    icon={<ReloadOutlined />}
                    onClick={() => handleReup(record.id)}
                  >
                    Reup
                  </Menu.Item>
                )}
                <Menu.Item
                  key="copy"
                  icon={<CopyOutlined />}
                  onClick={() => handleCopy(record)}
                >
                  Copy
                </Menu.Item>
                <Menu.Item
                  key="toggle"
                  icon={
                    record.status === "Active" ? (
                      <StopOutlined />
                    ) : (
                      <CheckCircleOutlined />
                    )
                  }
                  onClick={() =>
                    handleToggleStatus(record.id, record.status || "")
                  }
                  style={{
                    color: record.status === "Active" ? "#ff4d4f" : "#52c41a",
                  }}
                >
                  {record.status === "Active" ? "Deactivate" : "Activate"}
                </Menu.Item>
                <Menu.Divider />
                <Menu.Item
                  key="delete"
                  icon={<DeleteOutlined />}
                  onClick={() => handleDelete(record.id)}
                  danger
                >
                  Delete
                </Menu.Item>
              </Menu>
            }
            placement="bottomCenter"
          >
            <Button icon={<MoreOutlined />} size="small" />
          </Dropdown>
        </div>
      ),
      width: 80,
      hidden: !columnVisibility.actions,
    },
  ].filter((column) => !column.hidden);

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

  return (
    <>
      {contextHolder}
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          marginBottom: "16px",
          alignItems: "center",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
          {selectedNotifications.length > 0 && (
            <>
              <Text type="secondary">
                {selectedNotifications.length}{" "}
                {selectedNotifications.length === 1 ? "item" : "items"} selected
              </Text>
              {handleBulkDelete && (
                <Popconfirm
                  title="Are you sure you want to delete the selected notifications?"
                  onConfirm={() => handleBulkDelete(selectedNotifications)}
                  okText="Yes"
                  cancelText="No"
                >
                  <Button
                    type="primary"
                    danger
                    disabled={!selectedNotifications.length}
                    icon={<DeleteOutlined />}
                  >
                    Delete
                  </Button>
                </Popconfirm>
              )}
            </>
          )}
        </div>{" "}
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
            onChange={(value) => handlePageChange(1, value)}
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
            dataSource={notifications}
            columns={columns}
            rowKey="id"
            pagination={false}
            loading={loading}
            rowSelection={{
              selectedRowKeys: selectedNotifications,
              onChange: (selectedRowKeys) => {
                setSelectedNotifications(selectedRowKeys as string[]);
              },
            }}
            scroll={{ x: "max-content" }}
            size="middle"
            bordered
            sticky={{ offsetHeader: 0 }}
            rowClassName={(record) =>
              selectedNotifications.includes(record.id)
                ? "ant-table-row-selected"
                : ""
            }
          />
        </div>

        <Card className="mt-4 shadow-sm">
          <Row justify="center" align="middle">
            <Space size="large" align="center">
              <Text type="secondary">Total {totalItems} items</Text>
              <Space align="center" size="large">
                <Pagination
                  current={currentPage}
                  pageSize={pageSize}
                  total={totalItems}
                  onChange={(page) => handlePageChange(page, pageSize)}
                  showSizeChanger={false}
                  showTotal={() => ""}
                />
                <Space align="center">
                  <Text type="secondary">Go to page:</Text>
                  <InputNumber
                    min={1}
                    max={Math.ceil(totalItems / pageSize)}
                    value={currentPage}
                    onChange={(value) => {
                      if (
                        value &&
                        Number(value) > 0 &&
                        Number(value) <= Math.ceil(totalItems / pageSize)
                      ) {
                        handlePageChange(Number(value), pageSize);
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

export default NotificationTable;
