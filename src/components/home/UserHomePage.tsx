import React, { useContext, useEffect, useState } from "react";
import { UserContext } from "@/context/UserContext";
import {
  Card,
  Typography,
  Button,
  Row,
  Col,
  Divider,
  Spin,
  Alert,
  message as antMessage,
  Tag,
  Space,
  Tooltip,
  Image,
} from "antd";
import {
  MedicineBoxOutlined,
  CalendarOutlined,
  ShoppingCartOutlined,
  CheckCircleOutlined,
  FileTextOutlined,
  BellOutlined,
  FileOutlined,
  MailOutlined,
  TeamOutlined,
  SolutionOutlined,
  DashboardOutlined,
  ClockCircleOutlined,
  UserOutlined,
  NotificationOutlined,
  DownloadOutlined,
} from "@ant-design/icons";
import Link from "next/link";
import { useRouter } from "next/router";
import {
  getLatestUserNotification,
  NotificationResponseDTO,
} from "@/api/notification";
import dayjs from "dayjs";

const { Title, Text, Paragraph } = Typography;

const UserHomePage: React.FC = () => {
  const userContext = useContext(UserContext);
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [notification, setNotification] =
    useState<NotificationResponseDTO | null>(null);

  // Fetch notifications
  useEffect(() => {
    fetchLatestNotification();
  }, []);

  const fetchLatestNotification = async () => {
    try {
      setLoading(true);
      const result = await getLatestUserNotification();

      if (result.isSuccess && result.data) {
        setNotification(result.data);
      }
    } catch (error) {
      console.error("Error fetching notification:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleQuickAccessClick = (path: string) => {
    router.push(path);
  };

  const formatDate = (dateString: string) => {
    return dayjs(dateString).format("DD/MM/YYYY HH:mm:ss");
  };

  const quickAccessItems = [
    {
      title: "Health Checkups",
      icon: <MedicineBoxOutlined style={{ fontSize: "24px" }} />,
      path: "/health-checkups",
      description: "View your health checkup history and results",
    },
    {
      title: "Appointments",
      icon: <CalendarOutlined style={{ fontSize: "24px" }} />,
      path: "/appointments",
      description: "Book and manage your appointments",
    },
    {
      title: "Canteen Orders",
      icon: <ShoppingCartOutlined style={{ fontSize: "24px" }} />,
      path: "/canteen-orders",
      description: "Order food from the canteen",
    },
    {
      title: "Treatment Plans",
      icon: <SolutionOutlined style={{ fontSize: "24px" }} />,
      path: "/treatment-plans",
      description: "View your treatment plans",
    },
    {
      title: "Health Records",
      icon: <FileTextOutlined style={{ fontSize: "24px" }} />,
      path: "/health-records",
      description: "Access your health records",
    },
    {
      title: "Notifications",
      icon: <BellOutlined style={{ fontSize: "24px" }} />,
      path: "/notification",
      description: "View all notifications",
    },
  ];

  return (
    <div style={{ padding: "20px" }}>
      <Card
        className="welcome-card"
        style={{ marginBottom: "20px", borderRadius: "8px" }}
      >
        <Title level={2}>
          Welcome, {userContext?.user?.userName || "User"}!
          <CheckCircleOutlined
            style={{ color: "#52c41a", marginLeft: "10px" }}
          />
        </Title>
        <Text>
          You can book appointments, order from the canteen, and access your
          health information here.
        </Text>
      </Card>

      <Row gutter={[24, 24]}>
        <Col xs={24} lg={16}>
          <Card
            title={
              <Title level={4}>
                <NotificationOutlined /> Latest Notification
              </Title>
            }
            style={{ borderRadius: "8px", height: "100%" }}
          >
            <div style={{ minHeight: "300px" }}>
              {loading ? (
                <div
                  style={{
                    display: "flex",
                    justifyContent: "center",
                    alignItems: "center",
                    height: "100%",
                  }}
                >
                  <Spin size="large" />
                </div>
              ) : notification ? (
                <div className="notification-detail">
                  {/* Notification Metadata */}
                  <Row gutter={16} style={{ marginBottom: "20px" }}>
                    <Col span={24}>
                      <Space size={16} wrap>
                        <div>
                          <ClockCircleOutlined />{" "}
                          <Text>{formatDate(notification.createdAt)}</Text>
                        </div>

                        {notification.createdBy && (
                          <div>
                            <UserOutlined />{" "}
                            <Text>
                              {notification.createdBy.userName || "Unknown"}
                            </Text>
                          </div>
                        )}
                      </Space>
                    </Col>
                  </Row>

                  {/* Notification Header */}
                  <Title level={3} style={{ marginTop: 0 }}>
                    {notification.title}
                  </Title>

                  {/* Notification Content */}
                  <div
                    className="rich-text-content my-4"
                    dangerouslySetInnerHTML={{
                      __html: notification.content || "",
                    }}
                  />

                  {/* Attachment Section */}
                  {notification.attachment && (
                    <div className="mt-6">
                      {notification.attachment.match(
                        /\.(jpg|jpeg|png|gif|webp)$/i
                      ) ? (
                        <Image
                          src={notification.attachment}
                          alt="Attachment"
                          style={{ maxHeight: "500px", objectFit: "contain" }}
                          onError={(e) => {
                            console.error("Image load error:", e);
                            const target = e.target as HTMLImageElement;
                            target.style.display = "none";
                            const parent = target.parentElement;
                            if (parent) {
                              const errorMsg = document.createElement("p");
                              errorMsg.textContent = "Unable to display image.";
                              errorMsg.className = "text-red-500 text-sm";
                              parent.insertBefore(errorMsg, target);
                            }
                          }}
                        />
                      ) : (
                        <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
                          <div className="flex items-center">
                            <FileOutlined className="text-blue-500 mr-2 text-lg" />
                            <Text strong style={{ fontSize: "15px" }}>
                              {(() => {
                                try {
                                  const url = notification.attachment;

                                  let filename = url.split("/").pop() || "";

                                  filename = filename.split("?")[0];
                                  filename = filename.replace(
                                    /^[a-f0-9]{8}(-[a-f0-9]{4}){3}-[a-f0-9]{12}_/g,
                                    ""
                                  );
                                  filename = filename.replace(
                                    /^[a-f0-9]{32}_[a-f0-9]{32}_/g,
                                    ""
                                  );

                                  if (filename.startsWith("notifications/")) {
                                    filename = filename.substring(
                                      "notifications/".length
                                    );
                                  }

                                  if (
                                    filename.length === 0 ||
                                    !filename.includes(".")
                                  ) {
                                    const urlObj = new URL(
                                      url.startsWith("http")
                                        ? url
                                        : `http://example.com${
                                            url.startsWith("/") ? "" : "/"
                                          }${url}`
                                    );
                                    const prefixParam =
                                      urlObj.searchParams.get("prefix");

                                    if (prefixParam) {
                                      let prefixFilename =
                                        prefixParam.split("/").pop() || "";
                                      prefixFilename = prefixFilename.replace(
                                        /^[a-f0-9]{32}_[a-f0-9]{32}_/g,
                                        ""
                                      );

                                      if (prefixFilename.includes(".")) {
                                        return decodeURIComponent(
                                          prefixFilename
                                        );
                                      }
                                    }
                                  }

                                  return filename
                                    ? decodeURIComponent(filename)
                                    : "Attachment";
                                } catch (error) {
                                  console.error(
                                    "Error extracting filename:",
                                    error
                                  );
                                  return "Attachment";
                                }
                              })()}
                            </Text>
                            <div className="flex-grow"></div>
                            <Button
                              type="primary"
                              icon={<DownloadOutlined />}
                              href={notification.attachment}
                              target="_blank"
                              rel="noopener noreferrer"
                              download
                              size="middle"
                            >
                              Download
                            </Button>
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              ) : (
                <div
                  style={{
                    display: "flex",
                    justifyContent: "center",
                    alignItems: "center",
                    height: "100%",
                  }}
                >
                  <Text type="secondary">No notifications available</Text>
                </div>
              )}
            </div>
          </Card>
        </Col>

        <Col xs={24} lg={8}>
          <Card
            title={
              <Title level={4}>
                <DashboardOutlined /> Quick Access
              </Title>
            }
            style={{ borderRadius: "8px" }}
          >
            <div
              style={{ display: "flex", flexDirection: "column", gap: "12px" }}
            >
              {quickAccessItems.map((item, index) => (
                <Button
                  key={index}
                  type="default"
                  size="large"
                  icon={item.icon}
                  onClick={() => handleQuickAccessClick(item.path)}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "flex-start",
                    height: "auto",
                    padding: "12px 16px",
                    borderRadius: "6px",
                    boxShadow: "0 2px 0 rgba(0,0,0,0.02)",
                  }}
                >
                  <div style={{ textAlign: "left", marginLeft: "10px" }}>
                    <div style={{ fontWeight: "bold" }}>{item.title}</div>
                    <div
                      style={{ fontSize: "12px", color: "rgba(0, 0, 0, 0.45)" }}
                    >
                      {item.description}
                    </div>
                  </div>
                </Button>
              ))}
            </div>
          </Card>
        </Col>
      </Row>

      <Row style={{ marginTop: "24px" }}>
        <Col span={24}>
          <Card
            title={
              <Title level={4}>
                <CalendarOutlined /> Your Health Status
              </Title>
            }
            style={{ borderRadius: "8px" }}
          >
            <Row gutter={16}>
              <Col span={8}>
                <Card style={{ textAlign: "center", borderRadius: "6px" }}>
                  <Title level={2} style={{ margin: 0, color: "#1890ff" }}>
                    2
                  </Title>
                  <Text>Upcoming Appointments</Text>
                </Card>
              </Col>
              <Col span={8}>
                <Card style={{ textAlign: "center", borderRadius: "6px" }}>
                  <Title level={2} style={{ margin: 0, color: "#52c41a" }}>
                    Good
                  </Title>
                  <Text>Health Status</Text>
                </Card>
              </Col>
              <Col span={8}>
                <Card style={{ textAlign: "center", borderRadius: "6px" }}>
                  <Title level={2} style={{ margin: 0, color: "#fa8c16" }}>
                    3
                  </Title>
                  <Text>Active Prescriptions</Text>
                </Card>
              </Col>
            </Row>
          </Card>
        </Col>
      </Row>
    </div>
  );
};

export default UserHomePage;
