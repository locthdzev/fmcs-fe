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
  maxItems = 10,
}) => {
  const [notifications, setNotifications] = useState<NotificationResponseDTO[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [selectedNotification, setSelectedNotification] = useState<NotificationResponseDTO | null>(null);
  const [showViewMore, setShowViewMore] = useState(false);

  const formatBadgeCount = (count: number) => {
    return count > 99 ? '99+' : count.toString();
  };

  const formatDate = (dateString: string) => {
    try {
      const date = new Date(dateString);
      if (isNaN(date.getTime())) return '';
      
      const now = new Date();
      const diffInHours = Math.abs(now.getTime() - date.getTime()) / 36e5;
      
      if (diffInHours < 24) {
        return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
      } else if (diffInHours < 48) {
        return 'Yesterday';
      } else {
        return date.toLocaleDateString([], { 
          year: 'numeric',
          month: 'short',
          day: 'numeric'
        });
      }
    } catch {
      return '';
    }
  };

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

    const handleNotificationUpdate = (data: NotificationResponseDTO) => {
      setNotifications((prev) => {
        const existingNotification = prev.find((n) => n.id === data.id);
        const updatedNotification = existingNotification 
          ? {
              ...existingNotification,
              ...data,
              createdAt: data.createdAt || existingNotification.createdAt,
              createdBy: data.createdBy || existingNotification.createdBy,
              status: data.status || existingNotification.status,
              title: data.title || existingNotification.title,
              recipientType: data.recipientType || existingNotification.recipientType,
            }
          : data;

        const updated = [updatedNotification, ...prev.filter((n) => n.id !== data.id)].slice(0, maxItems);
        
        // Update unread count based on the server-provided count
        if (typeof data.unreadCount === 'number') {
          setUnreadCount(data.unreadCount);
        } else {
          // Fallback to counting unread notifications locally
          const newUnreadCount = updated.filter(n => !n.isRead).length;
          setUnreadCount(newUnreadCount);
        }
        
        return updated;
      });
    };

    const handleNotificationDelete = (deletedIds: string[]) => {
      setNotifications((prev) => {
        const updatedNotifications = prev.filter((n) => !deletedIds.includes(n.id));
        // Update unread count after deletion
        const newUnreadCount = updatedNotifications.filter(n => !n.isRead).length;
        setUnreadCount(newUnreadCount);
        return updatedNotifications;
      });
    };

    const handleAllNotificationsRead = () => {
      setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
      setUnreadCount(0);
    };

    const eventHandlers = {
      ReceiveNotificationUpdate: handleNotificationUpdate,
      NewNotification: handleNotificationUpdate,
      ReceiveNotificationDelete: handleNotificationDelete,
      NotificationStatusUpdated: handleNotificationUpdate,
      NotificationReupped: handleNotificationUpdate,
      NotificationCopied: handleNotificationUpdate,
      AllNotificationsRead: handleAllNotificationsRead
    };

    const connection = setupNotificationRealTime((data: NotificationResponseDTO | string[]) => {
      if (Array.isArray(data)) {
        handleNotificationDelete(data);
      } else {
        handleNotificationUpdate(data);
      }
    });

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
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    handleMarkAllAsRead();
                  }}
                  className="text-blue-500 hover:text-blue-700 text-sm font-medium"
                >
                  Mark all as read
                </button>
              )}
            </span>
          </DropdownItem>
          
          {notifications.length === 0 ? (
            <DropdownItem key="empty" className="text-center text-gray-500 p-4">
              No notifications available
            </DropdownItem>
          ) : (
            <>
              {notifications.map((n) => (
                <DropdownItem
                  key={n.id}
                  onClick={() => handleNotificationClick(n.id)}
                  className={`border-b hover:bg-gray-50 ${!n.isRead ? 'bg-blue-50' : ''}`}
                >
                  <span className="block p-4 w-full">
                    <span className="flex justify-between items-start mb-1">
                      <span className={`text-sm ${!n.isRead ? 'font-semibold' : ''}`}>
                        {n.title}
                      </span>
                      <span className="text-xs text-gray-500 ml-2 whitespace-nowrap">
                        {formatDate(n.createdAt)}
                      </span>
                    </span>
                    {n.content && (
                      <span className="block text-xs text-gray-600 line-clamp-2">
                        {n.content}
                      </span>
                    )}
                  </span>
                </DropdownItem>
              ))}
              {showViewMore && (
                <DropdownItem key="view-more" className="sticky bottom-0 bg-white z-10 border-t">
                  <span className="block text-center p-3">
                    <button
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        // Implement view more logic
                      }}
                      className="text-blue-500 hover:text-blue-700 text-sm font-medium"
                    >
                      View More
                    </button>
                  </span>
                </DropdownItem>
              )}
            </>
          )}
        </DropdownMenu>
      </Dropdown>

      <Modal
        title={selectedNotification?.title}
        open={!!selectedNotification}
        onCancel={() => setSelectedNotification(null)}
        footer={null}
        width={600}
      >
        <div className="space-y-4">
          <div className="flex justify-between items-center text-sm text-gray-500">
            <span>{selectedNotification?.createdBy?.userName || 'System'}</span>
            <span>{formatDate(selectedNotification?.createdAt || '')}</span>
          </div>
          <div className="text-base whitespace-pre-wrap">
            {selectedNotification?.content}
          </div>
          {selectedNotification?.attachment && (
            <div className="mt-4">
              {selectedNotification.attachment.match(/\.(jpg|jpeg|png|gif)$/i) ? (
                <img
                  src={selectedNotification.attachment}
                  alt="Attachment"
                  className="max-w-full rounded-lg"
                />
              ) : (
                <a
                  href={selectedNotification.attachment}
                  download
                  className="text-blue-500 hover:text-blue-700 flex items-center"
                >
                  <span className="mr-2">📎</span>
                  {selectedNotification.attachment.split("/").pop()}
                </a>
              )}
            </div>
          )}
        </div>
      </Modal>
    </div>
  );
};
