import React, { useState, useEffect } from "react";
import {
  Card,
  Typography,
  Tag,
  Button,
  Space,
  Spin,
  Row,
  Col,
  message,
  Divider,
  List,
  Avatar,
  Tooltip,
} from "antd";
import dayjs from "dayjs";
import {
  NotificationResponseDTO,
  getNotificationDetailForAdmin,
  updateNotificationStatus,
  deleteNotifications,
} from "@/api/notification";
import {
  ArrowLeftOutlined,
  BellOutlined,
  FileOutlined,
  DeleteOutlined,
  EyeOutlined,
  UserOutlined,
  TeamOutlined,
  MailOutlined,
  ClockCircleOutlined,
  NotificationOutlined,
} from "@ant-design/icons";
import { useRouter } from "next/router";

const { Title, Text, Paragraph } = Typography;

interface NotificationDetailProps {
  id: string;
}

export const NotificationDetail: React.FC<NotificationDetailProps> = ({
  id,
}) => {
  const router = useRouter();
  const [messageApi, contextHolder] = message.useMessage();
  const [loading, setLoading] = useState<boolean>(true);
  const [notification, setNotification] =
    useState<NotificationResponseDTO | null>(null);
  const [deleting, setDeleting] = useState<boolean>(false);

  useEffect(() => {
    fetchNotificationDetail();
  }, [id]);

  const fetchNotificationDetail = async () => {
    try {
      setLoading(true);
      const data = await getNotificationDetailForAdmin(id);
      setNotification(data);
    } catch (error) {
      console.error("Error fetching notification detail:", error);
      messageApi.error("Failed to load notification details");
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    try {
      setDeleting(true);
      const response = await deleteNotifications([id]);
      if (response.isSuccess) {
        messageApi.success("Notification deleted successfully");
        router.push("/notification");
      } else {
        messageApi.error(response.message || "Failed to delete notification");
      }
    } catch (error) {
      console.error("Error deleting notification:", error);
      messageApi.error("Failed to delete notification");
    } finally {
      setDeleting(false);
    }
  };

  const handleToggleStatus = async () => {
    if (!notification) return;

    try {
      const newStatus =
        notification.status === "Active" ? "Inactive" : "Active";
      const response = await updateNotificationStatus(id, newStatus);
      if (response.isSuccess) {
        messageApi.success("Status updated successfully");
        fetchNotificationDetail();
      } else {
        messageApi.error(response.message || "Failed to update status");
      }
    } catch (error) {
      console.error("Error updating status:", error);
      messageApi.error("Failed to update status");
    }
  };

  const formatDateTime = (datetime: string | undefined) => {
    if (!datetime) return "";
    return dayjs(datetime).format("DD/MM/YYYY HH:mm:ss");
  };

  const getStatusColor = (status: string | undefined) => {
    switch (status) {
      case "Active":
        return "success";
      case "Inactive":
        return "default";
      default:
        return "default";
    }
  };

  const renderRecipientType = (type: string | undefined) => {
    switch (type) {
      case "System":
        return (
          <Tag icon={<TeamOutlined />} color="blue">
            System
          </Tag>
        );
      case "Role":
        return (
          <Tag icon={<UserOutlined />} color="purple">
            Role
          </Tag>
        );
      default:
        return <Tag color="default">{type}</Tag>;
    }
  };

  const renderSendEmail = (sendEmail: boolean | undefined) => {
    return sendEmail ? (
      <Tag icon={<MailOutlined />} color="green">
        Yes
      </Tag>
    ) : (
      <Tag color="default">No</Tag>
    );
  };

  const renderActionButtons = () => {
    return (
      <Space>
        {notification?.status === "Active" ? (
          <Button danger onClick={handleToggleStatus}>
            Deactivate
          </Button>
        ) : (
          <Button type="primary" onClick={handleToggleStatus}>
            Activate
          </Button>
        )}
        <Button
          danger
          icon={<DeleteOutlined />}
          onClick={handleDelete}
          loading={deleting}
        >
          Delete
        </Button>
      </Space>
    );
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-screen">
        <Spin size="large" />
      </div>
    );
  }

  if (!notification) {
    return (
      <div className="p-4">
        <Button
          icon={<ArrowLeftOutlined />}
          onClick={() => router.push("/notification")}
          style={{ marginRight: "8px" }}
        >
          Back
        </Button>
        <Card>
          <div className="text-center p-8">
            <Title level={4}>Notification not found</Title>
          </div>
        </Card>
      </div>
    );
  }

  return (
    <div className="p-4">
      {contextHolder}

      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Button
            icon={<ArrowLeftOutlined />}
            onClick={() => router.push("/notification")}
            style={{ marginRight: "8px" }}
          >
            Back
          </Button>
          <NotificationOutlined style={{ fontSize: "24px" }} />
          <h3 className="text-xl font-bold">Notification Details</h3>
        </div>
        <div>{renderActionButtons()}</div>
      </div>

      <div className="grid grid-cols-1 gap-6 mb-8">
        <Card
          title={
            <span style={{ fontWeight: "bold" }}>Notification Information</span>
          }
        >
          <div className="space-y-4">
            <Title level={3}>{notification.title}</Title>

            <div className="flex items-center gap-2 mb-4">
              <Tag color={getStatusColor(notification.status)}>
                {notification.status}
              </Tag>
              {renderRecipientType(notification.recipientType)}
              {renderSendEmail(notification.sendEmail)}
              <Tag icon={<ClockCircleOutlined />} color="cyan">
                {formatDateTime(notification.createdAt)}
              </Tag>
            </div>

            <Divider />

            <div>
              <Text strong>Created By:</Text>
              <Text className="ml-2">
                {notification.createdBy?.userName || "Unknown"}
              </Text>
            </div>

            {notification.recipientType === "Role" && notification.roleId && (
              <div>
                <Text strong>Role:</Text>
                <Text className="ml-2">{notification.roleId}</Text>
              </div>
            )}

            <Divider />

            <div>
              <Text strong>Content:</Text>
              <Paragraph className="mt-2 whitespace-pre-line">
                {notification.content}
              </Paragraph>
            </div>

            {notification.attachment && (
              <div className="mt-4">
                <Text strong>Attachment:</Text>
                <div className="mt-2">
                  <a
                    href={notification.attachment}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    <Button icon={<FileOutlined />}>Download Attachment</Button>
                  </a>
                </div>
              </div>
            )}
          </div>
        </Card>

        {notification.recipientIds && notification.recipientIds.length > 0 && (
          <Card
            title={
              <span style={{ fontWeight: "bold" }}>
                Recipients ({notification.recipientIds.length})
              </span>
            }
          >
            <List
              dataSource={notification.recipientIds}
              renderItem={(userId) => (
                <List.Item>
                  <List.Item.Meta
                    avatar={<Avatar icon={<UserOutlined />} />}
                    title={userId}
                  />
                </List.Item>
              )}
              pagination={{
                pageSize: 10,
                showSizeChanger: false,
              }}
            />
          </Card>
        )}
      </div>
    </div>
  );
};

export default NotificationDetail;
