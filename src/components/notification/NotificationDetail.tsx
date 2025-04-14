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
  Input,
} from "antd";
import dayjs from "dayjs";
import {
  NotificationResponseDTO,
  getNotificationDetailForAdmin,
  updateNotificationStatus,
  deleteNotifications,
  getNotificationRecipients,
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
  SearchOutlined,
  SortAscendingOutlined,
  SortDescendingOutlined,
} from "@ant-design/icons";
import { useRouter } from "next/router";

const { Title, Text, Paragraph } = Typography;
const { Search } = Input;

interface NotificationDetailProps {
  id: string;
}

// Define user info interface
interface UserInfo {
  id: string;
  fullName: string;
  email: string;
  userName?: string;
  avatar?: string;
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
  const [recipients, setRecipients] = useState<UserInfo[]>([]);
  const [filteredRecipients, setFilteredRecipients] = useState<UserInfo[]>([]);
  const [loadingRecipients, setLoadingRecipients] = useState<boolean>(false);
  const [recipientPageSize, setRecipientPageSize] = useState<number>(5);
  const [searchText, setSearchText] = useState<string>("");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("asc");

  useEffect(() => {
    fetchNotificationDetail();
  }, [id]);

  useEffect(() => {
    if (notification?.recipientIds?.length) {
      fetchRecipientDetails(notification.recipientIds);
    }
  }, [notification]);

  useEffect(() => {
    calculateRecipientPageSize();
  }, [notification]);

  useEffect(() => {
    // Force an immediate sort when component mounts or recipients changes
    if (recipients.length > 0) {
      // Sắp xếp mặc định là A-Z khi danh sách được tải
      setSortOrder("asc");
      filterAndSortRecipients();
    }
  }, [recipients]);

  useEffect(() => {
    if (recipients.length > 0) {
      filterAndSortRecipients();
    }
  }, [searchText, sortOrder]);

  const calculateRecipientPageSize = () => {
    const contentHeight =
      document.querySelector(".notification-preview")?.clientHeight || 0;
    const availableHeight = contentHeight - 100; // Subtract header and padding
    const itemHeight = 60; // Approximate height of each list item
    const calculatedPageSize = Math.max(
      3,
      Math.floor(availableHeight / itemHeight)
    );
    setRecipientPageSize(calculatedPageSize);
  };

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

  const fetchRecipientDetails = async (recipientIds: string[]) => {
    try {
      setLoadingRecipients(true);

      // Sử dụng API mới để lấy thông tin của tất cả recipients trong một lần gọi
      const recipientsData = await getNotificationRecipients(id);

      setRecipients(recipientsData || []);
      console.log("Recipients loaded:", recipientsData?.length || 0);
    } catch (error) {
      console.error("Error fetching recipient details:", error);
      messageApi.error("Failed to load recipient details");
    } finally {
      setLoadingRecipients(false);
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
      case "SYSTEM":
        return (
          <Tag icon={<TeamOutlined />} color="blue">
            Notify the system
          </Tag>
        );
      case "ROLE":
        return (
          <Tag icon={<TeamOutlined />} color="orange">
            {notification?.roleName
              ? `Notify the ${notification.roleName.toLowerCase()}`
              : "Role-Based"}
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

  // Hàm để chuẩn hóa chuỗi (loại bỏ dấu tiếng Việt và chuyển về chữ thường)
  const normalizeString = (str: string): string => {
    if (!str) return "";

    // Chuyển về chữ thường
    str = str.toLowerCase();

    // Loại bỏ dấu tiếng Việt
    str = str.normalize("NFD").replace(/[\u0300-\u036f]/g, "");

    return str;
  };

  const filterAndSortRecipients = () => {
    let result = [...recipients];

    // Filter by search text
    if (searchText) {
      const searchNormalized = normalizeString(searchText);
      result = result.filter((user) => {
        const fullNameNormalized = normalizeString(user.fullName);
        const emailNormalized = normalizeString(user.email);

        return (
          fullNameNormalized.includes(searchNormalized) ||
          emailNormalized.includes(searchNormalized)
        );
      });
    }

    // Định nghĩa collator để sắp xếp đúng theo ngôn ngữ, không phân biệt hoa thường
    const collator = new Intl.Collator(["vi", "en"], {
      sensitivity: "base", // Không phân biệt hoa/thường
      ignorePunctuation: true, // Bỏ qua dấu câu
    });

    // Sort by fullName
    result.sort((a, b) => {
      // Thứ tự sắp xếp (tăng dần hoặc giảm dần)
      const direction = sortOrder === "asc" ? 1 : -1;

      // Sử dụng Intl.Collator để so sánh chuỗi theo bảng chữ cái đúng
      return direction * collator.compare(a.fullName, b.fullName);
    });

    // Nếu 2 người có tên giống nhau, sắp xếp theo email
    result = result.reduce((acc, current) => {
      const existingIndex = acc.findIndex(
        (item) => collator.compare(item.fullName, current.fullName) === 0
      );

      if (existingIndex >= 0) {
        // Sắp xếp theo email nếu tên giống nhau
        const sorted = [...acc];
        const position =
          sortOrder === "asc"
            ? sorted.findIndex(
                (item) =>
                  collator.compare(item.fullName, current.fullName) === 0 &&
                  collator.compare(item.email, current.email) > 0
              )
            : sorted.findIndex(
                (item) =>
                  collator.compare(item.fullName, current.fullName) === 0 &&
                  collator.compare(item.email, current.email) < 0
              );

        if (position >= 0) {
          sorted.splice(position, 0, current);
        } else {
          sorted.push(current);
        }
        return sorted;
      }

      return [...acc, current];
    }, [] as UserInfo[]);

    console.log(
      "Sorted recipients:",
      result.map((r) => r.fullName)
    );
    setFilteredRecipients(result);
  };

  const toggleSortOrder = () => {
    setSortOrder(sortOrder === "asc" ? "desc" : "asc");
  };

  const handleSearch = (value: string) => {
    setSearchText(value);
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

      <Card className="mb-8">
        <div className="flex">
          <div className="flex-grow pr-6" style={{ width: "70%" }}>
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
          </div>

          <div className="border-l pl-6" style={{ width: "30%" }}>
            <div className="recipients-section">
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  marginBottom: "12px",
                }}
              >
                <Title level={5} style={{ margin: 0 }}>
                  Recipients ({notification.recipientIds?.length || 0})
                </Title>
              </div>

              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  marginBottom: "12px",
                  gap: "8px",
                }}
              >
                <Search
                  placeholder="Search by name or email"
                  allowClear
                  onChange={(e) => handleSearch(e.target.value)}
                  style={{ flex: 1 }}
                  size="middle"
                />
                <Tooltip title={sortOrder === "asc" ? "Sort A-Z" : "Sort Z-A"}>
                  <Button
                    type="default"
                    icon={
                      sortOrder === "asc" ? (
                        <SortAscendingOutlined />
                      ) : (
                        <SortDescendingOutlined />
                      )
                    }
                    onClick={toggleSortOrder}
                    size="middle"
                  />
                </Tooltip>
              </div>

              {loadingRecipients ? (
                <div className="flex justify-center items-center py-4">
                  <Spin size="small" tip="Loading recipients..." />
                </div>
              ) : filteredRecipients.length > 0 ? (
                <List
                  dataSource={filteredRecipients}
                  renderItem={(user, index) => (
                    <List.Item
                      style={{
                        padding: "0",
                        height: "70px",
                        display: "flex",
                        alignItems: "center",
                      }}
                    >
                      <div
                        style={{
                          display: "flex",
                          alignItems: "center",
                          width: "100%",
                        }}
                      >
                        <div
                          style={{
                            width: "40px",
                            display: "flex",
                            justifyContent: "center",
                            marginRight: "8px",
                          }}
                        >
                          {index + 1}.
                        </div>
                        <div
                          style={{
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            width: "50px",
                            marginRight: "12px",
                          }}
                        >
                          <Avatar icon={<UserOutlined />} size={40} />
                        </div>
                        <div
                          style={{
                            display: "flex",
                            flexDirection: "column",
                            justifyContent: "center",
                          }}
                        >
                          <div style={{ fontWeight: 500, lineHeight: "1.5" }}>
                            {user.fullName}
                          </div>
                          <Text type="secondary" style={{ lineHeight: "1.5" }}>
                            {user.email}
                          </Text>
                        </div>
                      </div>
                    </List.Item>
                  )}
                  pagination={{
                    pageSize: recipientPageSize,
                    showSizeChanger: false,
                    size: "small",
                    style: { display: "flex", justifyContent: "center" },
                  }}
                />
              ) : (
                <div className="text-center p-4">
                  <Text type="secondary">
                    {searchText
                      ? "No matching recipients found"
                      : "No recipients found"}
                  </Text>
                </div>
              )}
            </div>
          </div>
        </div>
      </Card>
    </div>
  );
};

export default NotificationDetail;
