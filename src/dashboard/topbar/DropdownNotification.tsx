import React, { useState, useEffect } from "react";
import {
  Dropdown,
  DropdownTrigger,
  DropdownMenu,
  DropdownItem,
  Badge,
} from "@heroui/react";
import { IoNotificationsOutline } from "react-icons/io5";
import { Modal } from "antd";
import {
  getNotificationsByUserId,
  getNotificationDetailForUser,
  markAllNotificationsAsRead,
  NotificationResponseDTO,
  setupNotificationRealTime,
  getUnreadNotificationCount,
} from "@/api/notification";

interface NotificationDropdownProps {
  maxItems?: number;
}

export const NotificationDropdown: React.FC<NotificationDropdownProps> = ({
  maxItems = 10,
}) => {
  const [notifications, setNotifications] = useState<NotificationResponseDTO[]>(
    []
  );
  const [unreadCount, setUnreadCount] = useState(0);
  const [selectedNotification, setSelectedNotification] =
    useState<NotificationResponseDTO | null>(null);

  const formatBadgeCount = (count: number) =>
    count > 99 ? "99+" : count.toString();

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return "";
    const now = new Date();
    const diffInHours = Math.abs(now.getTime() - date.getTime()) / 36e5;
    if (diffInHours < 24)
      return date.toLocaleTimeString([], {
        hour: "2-digit",
        minute: "2-digit",
      });
    if (diffInHours < 48) return "Yesterday";
    return date.toLocaleDateString([], {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  const fetchNotifications = async () => {
    const result = await getNotificationsByUserId(1, maxItems);
    setNotifications(result.data);
    const count = await getUnreadNotificationCount();
    setUnreadCount(count);
  };

  useEffect(() => {
    const initialize = async () => {
      await fetchNotifications();

      const connection = setupNotificationRealTime((data: any) => {
        if (Array.isArray(data)) {
          setNotifications((prev) => prev.filter((n) => !data.includes(n.id)));
          fetchNotifications();
        } else if (data && "unreadCount" in data) {
          setNotifications((prev) =>
            [data, ...prev.filter((n) => n.id !== data.id)].slice(0, maxItems)
          );
          setUnreadCount(data.unreadCount);
        } else if (data === "AllNotificationsRead") {
          setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
          setUnreadCount(0);
        }
      });

      return () => connection.stop();
    };

    initialize();
  }, [maxItems]);

  const handleNotificationClick = async (id: string) => {
    const notification = await getNotificationDetailForUser(id);
    setSelectedNotification(notification);
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, isRead: true } : n))
    );
    const newCount = await getUnreadNotificationCount();
    setUnreadCount(newCount);
  };

  const handleMarkAllAsRead = async () => {
    await markAllNotificationsAsRead();
    setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
    setUnreadCount(0);
  };

  return (
    <div className="relative">
      <Dropdown>
        <DropdownTrigger>
          <Badge
            content={formatBadgeCount(unreadCount)}
            color="danger"
            size="sm"
            placement="top-right"
            isInvisible={unreadCount === 0}
          >
            <IoNotificationsOutline className="h-6 w-6 text-black cursor-pointer" />
          </Badge>
        </DropdownTrigger>
        <DropdownMenu
          className="w-96 max-h-[500px] overflow-y-auto"
          aria-label="Notifications"
        >
          <DropdownItem key="header" className="sticky top-0 bg-white z-10">
            <span className="flex justify-between items-center p-4 border-b w-full">
              <span className="text-lg font-semibold">Notifications</span>
              {notifications.length > 0 && (
                <button
                  onClick={handleMarkAllAsRead}
                  className="text-blue-500 hover:text-blue-700 text-sm font-medium"
                >
                  Mark all as read
                </button>
              )}
            </span>
          </DropdownItem>
          <>
            {notifications.length === 0 ? (
              <DropdownItem
                key="empty"
                className="text-center text-gray-500 p-4"
              >
                No notifications available
              </DropdownItem>
            ) : (
              notifications.map((n) => (
                <DropdownItem
                  key={n.id}
                  onClick={() => handleNotificationClick(n.id)}
                  className={`border-b hover:bg-gray-50 ${
                    !n.isRead ? "bg-blue-50" : ""
                  }`}
                >
                  <span className="block p-4 w-full">
                    <span className="flex justify-between items-start mb-1">
                      <span
                        className={`text-sm ${
                          !n.isRead ? "font-semibold" : ""
                        }`}
                      >
                        {n.title}
                      </span>
                      <span className="text-xs text-gray-500 ml-2 whitespace-nowrap">
                        {formatDate(n.createdAt)}
                      </span>
                    </span>
                  </span>
                </DropdownItem>
              ))
            )}
          </>
        </DropdownMenu>
      </Dropdown>

      <Modal
        title={selectedNotification?.title}
        open={!!selectedNotification}
        onCancel={() => setSelectedNotification(null)}
        footer={null}
        width={600}
      >
        <div className="flex flex-col h-[400px]">
          <div className="flex-shrink-0">
            <h2 className="text-xl font-bold">{selectedNotification?.title}</h2>
          </div>
          <div className="flex-1 overflow-y-auto mt-4">
            <p>{selectedNotification?.content || "No content"}</p>
            {selectedNotification?.attachment &&
              (selectedNotification.attachment.match(
                /\.(jpg|jpeg|png|gif)$/i
              ) ? (
                <img
                  src={selectedNotification.attachment}
                  alt="Attachment"
                  className="max-w-full mt-4"
                />
              ) : (
                <a
                  href={selectedNotification.attachment}
                  download
                  className="text-blue-500 mt-4 block"
                >
                  Download Attachment
                </a>
              ))}
          </div>
        </div>
      </Modal>
    </div>
  );
};
