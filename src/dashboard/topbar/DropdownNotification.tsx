import React, { useState, useEffect, useCallback, useMemo } from "react";
import { IoNotificationsOutline } from "react-icons/io5";
import {
  Badge,
  Drawer,
  Button,
  List,
  Typography,
  Space,
  message,
  Empty,
  Avatar,
  Spin,
} from "antd";
import {
  CheckOutlined,
  MailOutlined,
} from "@ant-design/icons";
import {
  getNotificationsByUserId,
  getNotificationDetailForUser,
  markAllNotificationsAsRead,
  NotificationResponseDTO,
  setupNotificationRealTime,
  getUnreadNotificationCount,
} from "@/api/notification";
import dayjs from "dayjs";
import relativeTime from "dayjs/plugin/relativeTime";
import "dayjs/locale/en";
import { NotificationDetailModal } from "@/components/notification";

dayjs.extend(relativeTime);
dayjs.locale("en");

const { Text, Title, Paragraph } = Typography;

interface NotificationDropdownProps {
  maxItems?: number;
  initialBatchSize?: number;
}

interface GroupedNotifications {
  new: NotificationResponseDTO[];
  today: NotificationResponseDTO[];
  older: {
    [key: string]: NotificationResponseDTO[];
  };
}

export const NotificationDropdown: React.FC<NotificationDropdownProps> = ({
  maxItems = 10,
  initialBatchSize = 20,
}) => {
  const [notifications, setNotifications] = useState<NotificationResponseDTO[]>(
    []
  );
  const [unreadCount, setUnreadCount] = useState(0);
  const [selectedNotification, setSelectedNotification] =
    useState<NotificationResponseDTO | null>(null);
  const [drawerVisible, setDrawerVisible] = useState(false);
  const [loading, setLoading] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);

  const formatDate = (dateString: string) => {
    if (!dateString) return "";
    const date = dayjs(dateString);
    const now = dayjs();
    const diffMinutes = now.diff(date, "minute");

    // Display relative time format
    if (diffMinutes < 60) {
      // Less than 1 hour: show minutes
      return diffMinutes <= 1 ? 'Just now' : `${diffMinutes} minutes ago`;
    } else if (diffMinutes < 1440) {
      // Less than 24 hours: show hours
      const diffHours = Math.floor(diffMinutes / 60);
      return diffHours === 1 ? '1 hour ago' : `${diffHours} hours ago`;
    } else if (diffMinutes < 10080) {
      // Less than 1 week: show days
      const diffDays = Math.floor(diffMinutes / 1440);
      return diffDays === 1 ? '1 day ago' : `${diffDays} days ago`;
    } else {
      // Older: show date and time
      return date.format("DD/MM/YYYY HH:mm");
    }
  };

  const fetchNotifications = async (page = 1, pageSize = initialBatchSize) => {
    try {
      setLoading(true);
      const result = await getNotificationsByUserId(page, pageSize);

      // Backend đã lọc notifications theo status="Active"
      if (page === 1) {
        setNotifications(result.data);
      } else {
        setNotifications((prev) => [...prev, ...result.data]);
      }

      // Nếu không có dữ liệu hoặc dữ liệu ít hơn pageSize, không còn thêm dữ liệu
      setHasMore(result.data.length >= pageSize);
      setCurrentPage(page);

      // Cập nhật số lượng thông báo chưa đọc từ API
      const unreadCountResult = await getUnreadNotificationCount();
      setUnreadCount(unreadCountResult);
    } catch (error) {
      console.error("Error fetching notifications:", error);
      message.error("Không thể tải thông báo");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const initialize = async () => {
      await fetchNotifications(1);

      const connection = setupNotificationRealTime((data: any) => {
        console.log(
          "SignalR notification data received in DropdownNotification:",
          data
        );

        if (Array.isArray(data)) {
          console.log("Processing notification deletion:", data);
          setNotifications((prev) => prev.filter((n) => !data.includes(n.id)));
        } else if (data && typeof data === "object") {
          console.log(
            "Processing notification update or new notification:",
            data
          );

          // Xử lý cập nhật unreadCount
          if (data.unreadCount !== undefined) {
            console.log("Updating unread count to:", data.unreadCount);
            setUnreadCount(data.unreadCount);
          }

          // Xử lý notification status updates
          if (data.id && data.title) {
            console.log("Adding/updating notification:", data.id);
            setNotifications((prev) => {
              const exists = prev.find((n) => n.id === data.id);
              if (exists) {
                console.log("Updating existing notification:", data.id);
                return prev.map((n) =>
                  n.id === data.id ? { ...n, ...data } : n
                );
              } else {
                console.log("Adding new notification:", data.id);
                return [data, ...prev.filter((n) => n.id !== data.id)].slice(
                  0,
                  maxItems
                );
              }
            });

            // Refresh notifications when new notification comes in
            fetchNotifications();
          }
        } else if (data === "AllNotificationsRead") {
          console.log("Marking all notifications as read");
          setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
          setUnreadCount(0);
        }
      });

      return () => {
        console.log("Stopping SignalR connection");
        connection.stop();
      };
    };

    initialize();
  }, [maxItems]);

  useEffect(() => {
    // Reset page when drawer is opened
    if (drawerVisible) {
      if (notifications.length === 0) {
        fetchNotifications(1);
      }
    }
  }, [drawerVisible]);

  const handleNotificationClick = async (id: string) => {
    try {
      // Hiển thị trạng thái loading từ đầu
      setLoading(true);

      // Lấy chi tiết thông báo
      const notification = await getNotificationDetailForUser(id);

      // Cập nhật thông báo đã đọc trong danh sách
      setNotifications((prev) =>
        prev.map((n) => (n.id === id ? { ...n, isRead: true } : n))
      );

      // Hiển thị chi tiết thông báo có đầy đủ nội dung
      setSelectedNotification(notification);

      // Cập nhật số lượng thông báo chưa đọc
      const newCount = await getUnreadNotificationCount();
      setUnreadCount(newCount);
    } catch (error) {
      message.error("Could not load notification details");
      console.error("Error loading notification details:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleMarkAllAsRead = async () => {
    await markAllNotificationsAsRead();
    setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
    setUnreadCount(0);
  };

  const loadMoreNotifications = () => {
    const nextPage = currentPage + 1;
    console.log(`Loading more notifications, page ${nextPage}`);
    fetchNotifications(nextPage);
  };

  // Nhóm thông báo theo thời gian
  const groupedNotifications = useMemo(() => {
    const now = dayjs();
    const threeHoursAgo = now.subtract(3, "hour");
    const startOfToday = now.startOf("day");

    const grouped: GroupedNotifications = {
      new: [],
      today: [],
      older: {},
    };

    notifications.forEach((notification) => {
      const notificationDate = dayjs(notification.createdAt);

      // Thông báo trong 3 giờ qua
      if (notificationDate.isAfter(threeHoursAgo)) {
        grouped.new.push(notification);
      }
      // Thông báo trong ngày nhưng hơn 3 giờ
      else if (notificationDate.isAfter(startOfToday)) {
        grouped.today.push(notification);
      }
      // Thông báo cũ hơn, nhóm theo ngày
      else {
        const dateKey = notificationDate.format("YYYY-MM-DD");
        if (!grouped.older[dateKey]) {
          grouped.older[dateKey] = [];
        }
        grouped.older[dateKey].push(notification);
      }
    });

    return grouped;
  }, [notifications]);

  // Hiển thị thông tin về số lượng thông báo
  const renderNotificationInfo = () => {
    if (notifications.length > 0) {
      return (
        <div className="flex justify-between mb-3 items-center">
          <Text type="secondary">
            {notifications.length}{" "}
            {notifications.length === 1 ? "notification" : "notifications"}
          </Text>
          <Button
            type="text"
            onClick={handleMarkAllAsRead}
            icon={<CheckOutlined />}
            size="small"
          >
            Mark all as read
          </Button>
        </div>
      );
    }
    return null;
  };

  // Render một nhóm thông báo
  const renderNotificationGroup = (
    notifications: NotificationResponseDTO[],
    title: string
  ) => {
    if (notifications.length === 0) return null;

    return (
      <div className="mb-4">
        <div className="mb-2">
          <Text strong className="text-gray-600">
            {title}
          </Text>
        </div>
        <List
          dataSource={notifications}
          renderItem={(n) => (
            <List.Item
              className={`cursor-pointer rounded-md transition-all duration-200 mb-2 ${
                !n.isRead ? "bg-blue-50 hover:bg-blue-100" : "hover:bg-gray-50"
              }`}
              onClick={() => handleNotificationClick(n.id)}
              style={{
                padding: "12px",
                border: "1px solid #f0f0f0",
                marginBottom: "8px",
                borderRadius: "8px",
              }}
            >
              <List.Item.Meta
                avatar={
                  <Avatar
                    icon={<MailOutlined />}
                    style={{
                      backgroundColor: !n.isRead ? "#1890ff" : "#d9d9d9",
                      color: "white",
                    }}
                  />
                }
                title={
                  <div className="flex justify-between items-start">
                    <Text
                      style={{
                        fontSize: "14px",
                        maxWidth: "220px",
                        whiteSpace: "nowrap",
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                        fontWeight: 500,
                      }}
                      title={n.title}
                    >
                      {n.title}
                    </Text>
                    <Text
                      type="secondary"
                      style={{
                        fontSize: "12px",
                        marginLeft: "8px",
                        whiteSpace: "nowrap",
                        flexShrink: 0,
                      }}
                    >
                      {formatDate(n.createdAt)}
                    </Text>
                  </div>
                }
                description={
                  <Space
                    direction="vertical"
                    style={{ width: "100%" }}
                    size={2}
                  >
                    {n.content ? (
                      <div 
                        className="notification-preview"
                        style={{
                          fontSize: "13px",
                          lineHeight: "1.5",
                          color: !n.isRead ? "#4a4a4a" : "#8c8c8c",
                          maxHeight: "40px",
                          overflow: "hidden",
                          position: "relative",
                        }}
                      >
                        {/* Hiển thị nội dung đã lọc bỏ các tag HTML để tạo preview ngắn gọn */}
                        <Text
                          style={{
                            fontSize: "13px",
                            lineHeight: "1.5",
                          }}
                          ellipsis={{ tooltip: "Click to view full content" }}
                        >
                          {/* Loại bỏ tất cả các thẻ HTML để hiển thị text thuần túy trong preview */}
                          {n.content.replace(/<[^>]*>/g, ' ').trim()}
                        </Text>
                        {/* Hiệu ứng gradient mờ dần ở cuối */}
                        <div 
                          style={{
                            position: "absolute",
                            bottom: 0,
                            left: 0,
                            right: 0,
                            height: "20px",
                            background: "linear-gradient(to bottom, rgba(255,255,255,0), rgba(255,255,255,1))",
                          }}
                        />
                      </div>
                    ) : (
                      <span style={{ fontStyle: "italic", opacity: 0.7 }}>
                        Click to view details
                      </span>
                    )}
                  </Space>
                }
              />
            </List.Item>
          )}
        />
      </div>
    );
  };

  // Đóng modal chi tiết thông báo
  const handleCloseModal = () => {
    setSelectedNotification(null);
  };

  return (
    <div className="relative">
      <Badge
        count={unreadCount}
        size="small"
        offset={[0, 0]}
        className="flex items-center"
      >
        <IoNotificationsOutline
          className="h-6 w-6 text-black cursor-pointer"
          onClick={() => setDrawerVisible(true)}
        />
      </Badge>

      <Drawer
        title={null}
        placement="right"
        onClose={() => setDrawerVisible(false)}
        open={drawerVisible}
        width={400}
        headerStyle={{ padding: 0, margin: 0, border: "none" }}
        bodyStyle={{ padding: 0, overflowY: "auto" }}
        closable={false}
      >
        <div className="bg-gray-100 border-b p-4 flex justify-center items-center">
          <Title level={5} style={{ margin: 0 }} className="flex items-center">
            <IoNotificationsOutline className="mr-2" />
            Notifications
          </Title>
        </div>
        <div className="p-4">
          {renderNotificationInfo()}

          {notifications.length === 0 ? (
            <Empty
              description={
                loading
                  ? "Loading notifications..."
                  : "No notifications available"
              }
              image={Empty.PRESENTED_IMAGE_SIMPLE}
              className="my-8"
            />
          ) : (
            <div>
              {/* Thông báo trong 3 giờ gần đây */}
              {renderNotificationGroup(groupedNotifications.new, "New")}

              {/* Thông báo trong ngày nhưng quá 3 giờ */}
              {renderNotificationGroup(groupedNotifications.today, "Today")}

              {/* Thông báo cũ hơn theo ngày */}
              {Object.keys(groupedNotifications.older).length > 0 && (
                <>
                  {Object.entries(groupedNotifications.older).map(
                    ([dateKey, dateNotifications]) => (
                      <React.Fragment key={dateKey}>
                        {renderNotificationGroup(
                          dateNotifications,
                          dayjs(dateKey).format("DD/MM/YYYY")
                        )}
                      </React.Fragment>
                    )
                  )}
                </>
              )}
            </div>
          )}

          {hasMore && (
            <div className="text-center my-4">
              <Button
                onClick={loadMoreNotifications}
                loading={loading && currentPage > 1}
                type="default"
                size="middle"
              >
                Load more
              </Button>
            </div>
          )}
        </div>
      </Drawer>

      {/* Sử dụng component NotificationDetailModal */}
      <NotificationDetailModal
        notification={selectedNotification}
        visible={!!selectedNotification}
        loading={loading}
        onClose={handleCloseModal}
      />
    </div>
  );
};
