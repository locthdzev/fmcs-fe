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
  CloseCircleOutlined,
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
      console.log("Notification data:", data);
      console.log("Attachment URL:", data.attachment);
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
        return "green";
      case "Inactive":
        return "red";
      default:
        return "default";
    }
  };

  const renderRecipientType = (type: string | undefined) => {
    switch (type) {
      case "System":
        return (
          <Tag icon={<TeamOutlined />} color="blue">
            Notify the system
          </Tag>
        );
      case "Role":
        return (
          <Tag icon={<TeamOutlined />} color="orange">
            Role
          </Tag>
        );
      case "User":
        return (
          <Tag icon={<TeamOutlined />} color="green">
            Notify the user
          </Tag>
        );
      case "Admin":
        return (
          <Tag icon={<TeamOutlined />} color="red">
            Notify the admin
          </Tag>
        );
      case "Manager":
        return (
          <Tag icon={<TeamOutlined />} color="orange">
            Notify the manager
          </Tag>
        );
      case "Healthcare Staff":
        return (
          <Tag icon={<TeamOutlined />} color="blue">
            Notify the healthcare staff
          </Tag>
        );
      case "Canteen Staff":
        return (
          <Tag icon={<TeamOutlined />} color="purple">
            Notify the canteen staff
          </Tag>
        );
      default:
        return (
          <Tag color="green" icon={<UserOutlined />}>
            {type}
          </Tag>
        );
    }
  };

  const renderSendEmail = (sendEmail: boolean | undefined) => {
    return sendEmail ? (
      <Tag icon={<MailOutlined />} color="blue">
        Send emails
      </Tag>
    ) : (
      <Tag icon={<CloseCircleOutlined />} color="default">
        Don't send emails
      </Tag>
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

      <style jsx global>{`
        .rich-text-content {
          font-size: 1rem;
          line-height: 1.5;
        }
        .rich-text-content h1 {
          font-size: 1.5rem;
          font-weight: bold;
          margin-bottom: 0.5rem;
        }
        .rich-text-content h2 {
          font-size: 1.25rem;
          font-weight: bold;
          margin-bottom: 0.5rem;
        }
        .rich-text-content h3 {
          font-size: 1.1rem;
          font-weight: bold;
          margin-bottom: 0.5rem;
        }
        .rich-text-content ul {
          list-style-type: disc;
          padding-left: 1.5rem;
          margin-bottom: 0.5rem;
        }
        .rich-text-content ol {
          list-style-type: decimal;
          padding-left: 1.5rem;
          margin-bottom: 0.5rem;
        }
        .rich-text-content p {
          margin-bottom: 0.5rem;
        }
        .rich-text-content [data-text-align="center"] {
          text-align: center;
        }
        .rich-text-content [data-text-align="right"] {
          text-align: right;
        }
        .rich-text-content a {
          color: #1890ff;
          text-decoration: underline;
        }
        .rich-text-content mark {
          background-color: #ffeb3b;
        }
      `}</style>

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

      <div className="grid grid-cols-12 gap-6 mb-8">
        <div className="col-span-12">
          <Card className="h-full">
            <div className="mb-4 pb-4 border-b">
              <div className="flex items-center justify-between mb-2">
                <Space size="middle">
                  <span className="flex items-center gap-1">
                    <UserOutlined />
                    {notification.createdBy?.userName || "Unknown"}
                  </span>
                  <span className="flex items-center gap-1">
                    <ClockCircleOutlined />
                    {formatDateTime(notification.createdAt)}
                  </span>
                  {renderRecipientType(notification.recipientType)}
                  {renderSendEmail(notification.sendEmail)}
                </Space>
                <div className="flex items-center gap-2">
                  <Tag color={getStatusColor(notification.status)}>
                    {notification.status}
                  </Tag>
                </div>
              </div>

              {notification.attachment &&
                !notification.attachment.match(
                  /\.(jpg|jpeg|png|gif|webp)$/i
                ) && (
                  <div className="mt-2">
                    <Text strong>Attachment: </Text>
                    <a
                      href={notification.attachment}
                      target="_blank"
                      rel="noopener noreferrer"
                      download
                    >
                      <Button icon={<FileOutlined />} size="small">
                        Download
                      </Button>
                    </a>
                  </div>
                )}
            </div>

            <div className="notification-preview">
              <Title level={3} style={{ marginTop: 0 }}>
                {notification.title}
              </Title>

              <div
                className="rich-text-content my-4"
                dangerouslySetInnerHTML={{ __html: notification.content || "" }}
              />

              {notification.attachment &&
                notification.attachment.match(
                  /\.(jpg|jpeg|png|gif|webp)$/i
                ) && (
                  <div className="mt-4">
                    <img
                      src={notification.attachment}
                      alt="Attachment"
                      className="max-w-full h-auto max-h-96 rounded-md border border-gray-200"
                      onError={(e) => {
                        console.error("Image load error:", e);
                        e.currentTarget.style.display = "none";
                        const parent = e.currentTarget.parentElement;
                        if (parent) {
                          const errorMsg = document.createElement("p");
                          errorMsg.textContent = "Không thể hiển thị hình ảnh.";
                          errorMsg.className = "text-red-500 text-sm";
                          parent.insertBefore(errorMsg, e.currentTarget);
                        }
                      }}
                    />
                  </div>
                )}
            </div>
          </Card>
        </div>

        {notification.recipientIds && notification.recipientIds.length > 0 && (
          <div className="col-span-12">
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
          </div>
        )}
      </div>
    </div>
  );
};

export default NotificationDetail;
