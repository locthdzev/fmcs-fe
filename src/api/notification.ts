import api, { setupSignalRConnection } from "./customize-axios";

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
  recipientType: "All" | "Role";
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
  recipientType: "All" | "Role";
  roleId?: string;
}

export const getAllNotifications = async (
  page: number = 1,
  pageSize: number = 10,
  search?: string,
  status?: string
) => {
  const response = await api.get("/notification-management/notifications", {
    params: { page, pageSize, search, status },
  });
  return response.data;
};

export const getUserNotifications = async (
  page: number = 1,
  pageSize: number = 10
) => {
  const response = await api.get(
    "/notification-management/user-notifications",
    {
      params: { page, pageSize },
    }
  );
  return response.data;
};

export const getNotificationById = async (id: string) => {
  const response = await api.get(
    `/notification-management/notifications/${id}`
  );
  return response.data.data;
};

export const createNotification = async (data: FormData) => {
  const response = await api.post(
    "/notification-management/notifications",
    data
  );
  return response.data;
};

export const deleteNotifications = async (notificationIds: string[]) => {
  const response = await api.delete("/notification-management/notifications", {
    data: notificationIds,
  });
  return response.data;
};

export const updateNotificationStatus = async (id: string, status: string) => {
  const response = await api.put(
    `/notification-management/notifications/${id}/status`,
    { status }
  );
  return response.data;
};

export const reupNotification = async (id: string, sendEmail: boolean) => {
  const response = await api.post(
    `/notification-management/notifications/${id}/reup`,
    { sendEmail }
  );
  return response.data;
};

export const copyNotification = async (id: string, data: FormData) => {
  const response = await api.post(
    `/notification-management/notifications/${id}/copy`,
    data
  );
  return response.data;
};

export const markAllNotificationsAsRead = async () => {
  const response = await api.post(
    "/notification-management/notifications/mark-all-as-read"
  );
  return response.data;
};

export const setupNotificationRealTime = (
  callback: (data: NotificationResponseDTO | string[]) => void
) => {
  return setupSignalRConnection("/notificationHub", callback);
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
