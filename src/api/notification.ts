import api, { setupSignalRConnection } from "./customize-axios";
import Cookies from "js-cookie";

export interface NotificationResponseDTO {
  id: string;
  title: string;
  content?: string;
  attachment?: string;
  createdAt: string;
  createdBy?: { id?: string; userName?: string };
  status?: string;
  isRead: boolean;
  unreadCount: number;
  recipientType: string;
  roleId?: string;
  recipientIds: string[];
  sendEmail: boolean;
}

export interface NotificationCreateRequestDTO {
  title: string;
  content?: string;
  sendEmail: boolean;
  recipientType: "System" | "Role";
  roleId?: string;
}

export interface NotificationUpdateStatusRequestDTO {
  status: string;
}

export interface NotificationReupRequestDTO {
  sendEmail: boolean;
}

export interface NotificationCopyRequestDTO {
  title: string;
  content?: string;
  sendEmail: boolean;
  recipientType: "System" | "Role";
  roleId?: string;
}

export const getAllNotifications = async (page: number = 1, pageSize: number = 10, search?: string, status?: string) => {
  const response = await api.get("/notification-management/notifications", { params: { page, pageSize, search, status } });
  return response.data;
};

export const getNotificationsByUserId = async (page: number = 1, pageSize: number = 10) => {
  const response = await api.get(`/notification-management/user-notifications`, {
    params: {
      page,
      pageSize
    }
  });
  return response.data;
};

export const getNotificationDetailForAdmin = async (id: string) => {
  const response = await api.get(`/notification-management/notifications/${id}/admin`);
  return response.data.data;
};

export const getNotificationDetailForUser = async (id: string) => {
  const response = await api.get(`/notification-management/notifications/${id}/user`);
  return response.data.data;
};

export const getUnreadNotificationCount = async () => {
  const response = await api.get("/notification-management/unread-count");
  return response.data.data;
};

export const createNotification = async (data: FormData) => {
  const response = await api.post("/notification-management/notifications", data);
  return response.data;
};

export const deleteNotifications = async (notificationIds: string[]) => {
  const response = await api.delete("/notification-management/notifications", { data: notificationIds });
  return response.data;
};

export const updateNotificationStatus = async (id: string, status: string) => {
  const response = await api.put(`/notification-management/notifications/${id}/status`, { status });
  return response.data;
};

export const reupNotification = async (id: string, sendEmail: boolean) => {
  const response = await api.post(`/notification-management/notifications/${id}/reup`, { sendEmail });
  return response.data;
};

export const copyNotification = async (id: string, data: FormData) => {
  const response = await api.post(`/notification-management/notifications/${id}/copy`, data);
  return response.data;
};

export const markAllNotificationsAsRead = async () => {
  const response = await api.post("/notification-management/notifications/mark-all-as-read");
  return response.data;
};

export const setupNotificationRealTime = (callback: (data: any) => void) => {
  const eventHandlers = {
    NewNotification: (data: any) => {
      console.log("NewNotification event received:", data);
      callback(data);
    },
    ReceiveNotificationUpdate: (data: any) => {
      console.log("ReceiveNotificationUpdate event received:", data);
      callback(data);
    },
    ReceiveNotificationDelete: (data: any) => {
      console.log("ReceiveNotificationDelete event received:", data);
      callback(data);
    },
    NotificationStatusUpdated: (data: any) => {
      console.log("NotificationStatusUpdated event received:", data);
      callback(data);
    },
    NotificationReupped: (data: any) => {
      console.log("NotificationReupped event received:", data);
      callback(data);
    },
    NotificationCopied: (data: any) => {
      console.log("NotificationCopied event received:", data);
      callback(data);
    },
    NotificationBadgeUpdate: async () => {
      console.log("NotificationBadgeUpdate event received");
      try {
        const unreadCount = await getUnreadNotificationCount();
        console.log("Updated unread count:", unreadCount);
        callback({ unreadCount });
      } catch (error) {
        console.error("Error fetching unread count:", error);
      }
    },
    AllNotificationsRead: (data: any) => {
      console.log("AllNotificationsRead event received");
      callback("AllNotificationsRead");
    }
  };
  return setupSignalRConnection("/notificationHub", callback, eventHandlers);
};

export interface RoleResponseDTO {
  id: string;
  roleName: string;
  description?: string;
  status?: string;
}

export const getAllRoles = async () => {
  const response = await api.get("/role-management/roles");
  return response.data.data as RoleResponseDTO[];
};