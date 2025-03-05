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
  getUserNotifications,
  getNotificationById,
  markAllNotificationsAsRead,
  NotificationResponseDTO,
  setupNotificationRealTime,
} from "@/api/notification";

interface NotificationDropdownProps {
  maxItems?: number;
}

export const NotificationDropdown: React.FC<NotificationDropdownProps> = ({
  maxItems = 5,
}) => {
  const [notifications, setNotifications] = useState<NotificationResponseDTO[]>(
    []
  );
  const [unreadCount, setUnreadCount] = useState(0);
  const [selectedNotification, setSelectedNotification] =
    useState<NotificationResponseDTO | null>(null);

  const fetchNotifications = async () => {
    try {
      const result = await getUserNotifications(1, maxItems);
      setNotifications(result.data);
      setUnreadCount(
        result.data.filter((n: NotificationResponseDTO) => !n.isRead).length
      );
    } catch (error) {
      console.error("Failed to fetch user notifications:", error);
    }
  };

  useEffect(() => {
    fetchNotifications();

    const connection = setupNotificationRealTime(
      (data: NotificationResponseDTO | string[]) => {
        if (Array.isArray(data)) {
          setNotifications((prev) => prev.filter((n) => !data.includes(n.id)));
          setUnreadCount((prev) => Math.max(0, prev - data.length));
        } else {
          setNotifications((prev) => {
            const updated = [
              data,
              ...prev.filter((n) => n.id !== data.id),
            ].slice(0, maxItems);
            setUnreadCount(data.unreadCount);
            return updated;
          });
        }
      }
    );

    return () => {
      connection.stop();
    };
  }, [maxItems]);

  const handleNotificationClick = async (id: string) => {
    try {
      const notification = await getNotificationById(id);
      setSelectedNotification(notification);
      setUnreadCount(notification.unreadCount);
      setNotifications((prev) =>
        prev.map((n) => (n.id === id ? { ...n, isRead: true } : n))
      );
    } catch (error) {
      console.error("Failed to fetch notification details:", error);
    }
  };

  const handleMarkAllAsRead = async () => {
    try {
      const response = await markAllNotificationsAsRead();
      if (response.isSuccess) {
        setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
        setUnreadCount(0);
      }
    } catch (error) {
      console.error("Failed to mark all as read:", error);
    }
  };

  return (
    <div className="relative">
      <Dropdown>
        <DropdownTrigger>
          <Badge
            content={unreadCount}
            color="danger"
            size="sm"
            placement="top-right"
          >
            <IoNotificationsOutline className="h-6 w-6 text-black cursor-pointer" />
          </Badge>
        </DropdownTrigger>
        <DropdownMenu className="max-h-60 overflow-y-auto">
          {notifications.length === 0 ? (
            <DropdownItem key="no-notifications">
              No notifications available
            </DropdownItem>
          ) : (
            <>
              <DropdownItem
                key="mark-all"
                onClick={handleMarkAllAsRead}
                className="text-blue-500 font-semibold"
              >
                Mark all as read
              </DropdownItem>
              {notifications.map((n) => (
                <DropdownItem
                  key={n.id}
                  onClick={() => handleNotificationClick(n.id)}
                  className={n.isRead ? "text-gray-500" : "font-bold"}
                >
                  <div>
                    {n.title}
                    <br />
                    <small>{new Date(n.createdAt).toLocaleDateString()}</small>
                  </div>
                </DropdownItem>
              ))}
            </>
          )}
        </DropdownMenu>
      </Dropdown>

      <Modal
        title={selectedNotification?.title}
        open={!!selectedNotification}
        onCancel={() => setSelectedNotification(null)}
        footer={null}
      >
        <p>{selectedNotification?.content}</p>
        {selectedNotification?.attachment &&
          (selectedNotification.attachment.includes(".jpg") ||
          selectedNotification.attachment.includes(".png") ? (
            <img
              src={selectedNotification.attachment}
              alt="Attachment"
              style={{ maxWidth: "100%" }}
            />
          ) : (
            <a href={selectedNotification.attachment} download>
              {selectedNotification.attachment.split("/").pop()}
            </a>
          ))}
      </Modal>
    </div>
  );
};
