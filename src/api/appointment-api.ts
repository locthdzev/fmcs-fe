import api, { setupSignalRConnection } from "./customize-axios";
import axios from "axios";
import https from "https";
import Cookies from "js-cookie";
import { HubConnectionBuilder, HubConnection, HubConnectionState } from "@microsoft/signalr";
import jwtDecode from "jwt-decode";

const API_BASE_URL = "http://localhost:5104/api/appointment-management";

// Response DTOs from AppointmentService
export interface ResultDTO<T = any> {
  isSuccess: boolean;
  code: number;
  data: T | null;
  message?: string;
  responseFailed?: string;
}

export interface AppointmentStatisticsDTO {
  totalHealthcareOfficers: number;
  studentsCurrentlyReceivingCare: number;
  appointmentsScheduledToday: number;
}

export interface PagedResultDTO<T> {
  isSuccess: boolean;
  code: number;
  data: T[];
  totalRecords: number;
  page: number;
  pageSize: number;
  message?: string;
  responseFailed?: string;
}

// DTO Interfaces (from provided C# DTOs)
export interface AppointmentCreateRequestDTO {
  userId: string;
  staffId: string;
  appointmentDate: string; // ISO string (e.g., "2025-03-15T10:00:00Z")
  reason: string;
  sendEmailToUser?: boolean;
  sendNotificationToUser?: boolean;
  sendEmailToStaff?: boolean;
  sendNotificationToStaff?: boolean;
  sessionId: string;
}

export interface TimeSlotDTO {
  timeSlot: string;
  isAvailable: boolean;
  isLocked: boolean;
  lockedByCurrentUser: boolean;
}

export interface AppointmentUpdateRequestDTO {
  id: string;
  userId: string;
  staffId: string;
  appointmentDate: string; // ISO string
  reason: string;
  status: string;
  sendEmailToUser?: boolean;
  sendNotificationToUser?: boolean;
  sendEmailToStaff?: boolean;
  sendNotificationToStaff?: boolean;
}

export interface UnavailableTimeSlotDTO {
  startTime: string; // ISO string
  endTime: string; // ISO string
  reason: string;
}

export interface AppointmentResponseDTO {
  id: string;
  userId: string;
  studentName: string;
  staffId: string;
  staffName: string;
  appointmentDate: string; // ISO string
  lockedUntil: string; // ISO string
  endTime: string; // ISO string
  reason: string;
  status: string;
  createdAt: string; // ISO string
  createdBy: UserInfo;
  updatedAt?: string; // ISO string, optional
  updatedBy?: UserInfo | null;
  reminderSent: boolean;
  missedReminderSent: boolean;
  sessionId: string;
}

// Define the structure for the error response when a 409 conflict occurs
export interface AppointmentConflictResponseDTO {
  existingAppointmentId: string; // Ensure lowercase matches the API response
  appointmentDate?: string; // Optional, as it might not always be present
}

export interface CancelLockRequestDTO {
  appointmentId: string;
}

export interface AppointmentAvailabilityCheckRequestDTO {
  appointmentDate: string; // ISO string
}

export interface UnavailableTimeSlotsRequestDTO {
  staffId: string;
  startDate?: string; // ISO string, optional
  endDate?: string; // ISO string, optional
}

export interface AvailableOfficersResponseDTO {
  staffId: string;
  fullName: string;
  email: string;
  phone: string;
  imageURL: string;
  gender: string;
  status: string;
}

export interface UserInfo {
  id: string;
  userName: string;
  role: string;
}

export interface AvailableTimeSlotsResponseDTO {
  availableSlots: TimeSlotDTO[];
  userSelectedSlot: string | null;
  lockedAppointmentId?: string;
  lockedUntil?: string;
}

// API Functions
export const getAllAppointments = async (
  page: number = 1,
  pageSize: number = 10,
  search?: string,
  sortBy: string = "AppointmentDate",
  ascending: boolean = true,
  userId?: string,
  staffId?: string,
  status?: string,
  startDate?: string,
  endDate?: string
): Promise<PagedResultDTO<AppointmentResponseDTO>> => {
  const response = await api.get("/appointment-management/appointments", {
    params: { page, pageSize, search, sortBy, ascending, userId, staffId, status, startDate, endDate },
  });
  if (!response.data.isSuccess) {
    throw new Error(response.data.message || `Failed to fetch appointments (Code: ${response.data.code})`);
  }
  return response.data;
};

export const getAppointmentsByUserId = async (
  userId: string,
  page: number = 1,
  pageSize: number = 10,
  sortBy: string = "AppointmentDate",
  ascending: boolean = true
): Promise<PagedResultDTO<AppointmentResponseDTO>> => {
  try {
    const response = await api.get(`/appointment-management/appointments/user/${userId}`, {
      params: { page, pageSize, sortBy, ascending },
    });

    if (!response.data.isSuccess) {
      throw new Error(
        response.data.message || `Failed to fetch appointments for user (Code: ${response.data.code})`
      );
    }

    return response.data;
  } catch (error: any) {
    throw new Error(error.message || `Failed to fetch appointments for user (Code: error)`);
  }
};

export const cancelLockedAppointment = async (
  userId: string,
  token?: string
): Promise<ResultDTO<null>> => {
  try {
    const response = await axios.post(
      `${API_BASE_URL}/appointments/cancel-lock`,
      { userId },
      {
        headers: { Authorization: `Bearer ${token}` },
        httpsAgent: new https.Agent({ rejectUnauthorized: false }),
      }
    );
    return response.data;
  } catch (error: any) {
    if (error.response) {
      const errorData = error.response.data;
      return {
        isSuccess: false,
        code: error.response.status,
        data: null,
        message: errorData.message || "Failed to cancel locked appointment",
        responseFailed: errorData.responseFailed || undefined,
      };
    }
    throw new Error(
      error.response?.data?.message || `Failed to cancel locked appointment: ${error.message}`
    );
  }
};

export const getAppointment = async (
  id: string,
  token?: string
): Promise<ResultDTO<AppointmentResponseDTO>> => {
  try {
    const response = await axios.get(`${API_BASE_URL}/appointments/${id}`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
      httpsAgent: new https.Agent({
        rejectUnauthorized: false, // Disable certificate verification (only for dev)
      }),
    });

    if (!response.data.isSuccess) {
      throw new Error(response.data.message || `Failed to fetch appointment (Code: ${response.data.code})`);
    }

    return response.data;
  } catch (error: any) {
    if (error.response) {
      const errorData = error.response.data;
      return {
        isSuccess: false,
        code: error.response.status,
        data: null,
        message: errorData.message || "Failed to fetch appointment",
        responseFailed: errorData.responseFailed || undefined,
      };
    }
    throw new Error(error.response?.data?.message || `Failed to fetch appointment: ${error.message}`);
  }
};

export const getAppointmentStatistics = async (token: string): Promise<ResultDTO<AppointmentStatisticsDTO>> => {
  try {
    const response = await axios.get(`${API_BASE_URL}/statistics`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
      httpsAgent: new https.Agent({
        rejectUnauthorized: false, // Disable certificate verification (only for dev)
      }),
    });

    if (!response.data.isSuccess) {
      throw new Error(response.data.message || `Failed to fetch statistics (Code: ${response.data.code})`);
    }

    return response.data;
  } catch (error: any) {
    throw new Error(error.response?.data?.message || `Failed to fetch appointment statistics: ${error.message}`);
  }
};

// Updated: Fixed URL to match new backend route
// Add more specific error handling
export const scheduleAppointment = async (
  request: AppointmentCreateRequestDTO,
  token?: string
): Promise<ResultDTO<AppointmentResponseDTO | AppointmentConflictResponseDTO>> => {
  try {
    const response = await axios.post(`${API_BASE_URL}/appointments/schedule`, request, {
      headers: { Authorization: `Bearer ${token}` },
      httpsAgent: new https.Agent({ rejectUnauthorized: false }),
    });

    return response.data;
  } catch (error: any) {
    if (error.response) {
      const errorData = error.response.data;
      console.log("Error response data:", errorData); // Debug log
      return {
        isSuccess: false,
        code: error.response.status,
        data: errorData.data || { existingAppointmentId: errorData.existingAppointmentId }, // Try to extract conflict data
        message: errorData.message || "Failed to schedule appointment",
        responseFailed: errorData.responseFailed || undefined,
      };
    }
    throw new Error(
      error.response?.data?.message || `Failed to schedule appointment: ${error.message}`
    );
  }
};

export const scheduleAppointmentForHealthcareStaff = async (
  data: AppointmentCreateRequestDTO
): Promise<ResultDTO<AppointmentResponseDTO>> => {
  const response = await api.post("/appointment-management/appointments/staff-schedule", data);
  if (!response.data.isSuccess) {
    throw new Error(response.data.message || `Failed to schedule appointment for staff (Code: ${response.data.code})`);
  }
  return response.data;
};

export const confirmAppointment = async (id: string, token?: string): Promise<ResultDTO<AppointmentResponseDTO>> => {
  const response = await axios.put(`${API_BASE_URL}/appointments/${id}/confirm`, {}, {
      headers: { Authorization: `Bearer ${token}` }
  });
  if (!response.data.isSuccess) {
      throw new Error(response.data.message || `Failed to confirm appointment (Code: ${response.data.code})`);
  }
  return response.data;
};

// New: Added function for validating appointment requests
export const validateAppointmentRequest = async (
  request: AppointmentCreateRequestDTO,
  token?: string
): Promise<ResultDTO<any>> => {
  try {
    const response = await axios.post(`${API_BASE_URL}/appointments/validate-appointment`, request, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
      httpsAgent: new https.Agent({
        rejectUnauthorized: false,
      }),
    });
    return response.data;
  } catch (error: any) {
    throw new Error(error.response?.data?.message || "Failed to validate appointment request");
  }
};

export interface ResultDTO<T> {
  isSuccess: boolean;
  code: number;
  data: T | null;
  message?: string;
  responseFailed?: string;
}

// New: Added function for fetching available time slots
export const getAvailableTimeSlots = async (
  staffId: string,
  date: string, // ISO string (e.g., "2025-03-15")
  token?: string
): Promise<ResultDTO<AvailableTimeSlotsResponseDTO>> => {
  try {
    const response = await axios.get(`${API_BASE_URL}/appointments/available-time-slots/${staffId}/${date}`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
      httpsAgent: new https.Agent({
        rejectUnauthorized: false,
      }),
      params: {
        userId: token ? jwtDecode<{ sub?: string; id?: string; userid?: string }>(token)?.sub || null : null, // Optional: pass userId from token
      },
    });
    return response.data;
  } catch (error: any) {
    throw new Error(error.response?.data?.message || "Failed to fetch available time slots");
  }
};

// New: Added function for fetching available slot count
export const getAvailableSlotCount = async (
  staffId: string,
  date: string, // ISO string (e.g., "2025-03-15")
  token?: string
): Promise<ResultDTO<number>> => {
  try {
    const response = await axios.get(`${API_BASE_URL}/appointments/available-slot-count/${staffId}/${date}`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
      httpsAgent: new https.Agent({
        rejectUnauthorized: false, // Make sure this is required for your environment (disable in production)
      }),
    });

    // Return the response data
    return response.data;
  } catch (error: any) {
    // Check if error is related to the response from the server
    if (error.response) {
      // Server responded with a status code that falls out of range of 2xx
      console.error('Error response:', error.response); // Log the full error response for debugging
      throw new Error(error.response?.data?.message || `Error: ${error.response?.statusText || 'Unknown error'}`);
    } else if (error.request) {
      // No response was received
      console.error('Error request:', error.request); // Log the request object for debugging
      throw new Error('No response received from the server.');
    } else {
      // Some other error occurred (e.g., setting up the request)
      console.error('Error:', error.message); // Log the error message for debugging
      throw new Error(`Failed to fetch available slot count: ${error.message}`);
    }
  }
};


export const updateAppointmentByUser = async (
  id: string,
  data: AppointmentUpdateRequestDTO
): Promise<ResultDTO<AppointmentResponseDTO>> => {
  const response = await api.put(`/appointment-management/appointments/${id}/user-update`, data);
  if (!response.data.isSuccess) {
    throw new Error(response.data.message || `Failed to update appointment (Code: ${response.data.code})`);
  }
  return response.data;
};

export const updateAppointmentByHealthcareStaff = async (
  id: string,
  data: AppointmentUpdateRequestDTO
): Promise<ResultDTO<AppointmentResponseDTO>> => {
  const response = await api.put(`/appointment-management/appointments/${id}/staff-update`, data);
  if (!response.data.isSuccess) {
    throw new Error(response.data.message || `Failed to update appointment by staff (Code: ${response.data.code})`);
  }
  return response.data;
};

export const cancelAppointment = async (id: string): Promise<ResultDTO<AppointmentResponseDTO>> => {
  const response = await api.put(`/appointment-management/appointments/${id}/cancel`);
  if (!response.data.isSuccess) {
    throw new Error(response.data.message || `Failed to cancel appointment (Code: ${response.data.code})`);
  }
  return response.data;
};

export const cancelAppointmentForStaff = async (
  id: string
): Promise<ResultDTO<AppointmentResponseDTO>> => {
  const response = await api.put(`/appointment-management/appointments/${id}/staff-cancel`);
  if (!response.data.isSuccess) {
    throw new Error(response.data.message || `Failed to cancel appointment for staff (Code: ${response.data.code})`);
  }
  return response.data;
};

export const confirmAttendance = async (id: string): Promise<ResultDTO<AppointmentResponseDTO>> => {
  const response = await api.put(`/appointment-management/appointments/${id}/attendance`);
  if (!response.data.isSuccess) {
    throw new Error(response.data.message || `Failed to confirm attendance (Code: ${response.data.code})`);
  }
  return response.data;
};

export const confirmCompletion = async (id: string): Promise<ResultDTO<AppointmentResponseDTO>> => {
  const response = await api.put(`/appointment-management/appointments/${id}/completion`);
  if (!response.data.isSuccess) {
    throw new Error(response.data.message || `Failed to confirm completion (Code: ${response.data.code})`);
  }
  return response.data;
};

export const updateUserAppointmentStatusToNormal = async (
  userId: string
): Promise<ResultDTO<any>> => {
  const response = await api.put(`/appointment-management/appointments/users/${userId}/reset-user-appointmentstatus`);
  if (!response.data.isSuccess) {
    throw new Error(response.data.message || `Failed to reset user appointment status (Code: ${response.data.code})`);
  }
  return response.data;
};

export const getAvailableStaff = async (
  data: AppointmentAvailabilityCheckRequestDTO
): Promise<ResultDTO<AvailableOfficersResponseDTO[]>> => {
  const response = await api.post("/appointment-management/appointments/available-staff", data);
  if (!response.data.isSuccess) {
    throw new Error(response.data.message || `Failed to fetch available staff (Code: ${response.data.code})`);
  }
  return response.data;
};

// Updated: Fixed URL to match new backend route
export const getUnavailableTimeSlots = async (request: UnavailableTimeSlotsRequestDTO, token?: string): Promise<ResultDTO<UnavailableTimeSlotDTO[]>> => {
  try {
    const response = await axios.post(`${API_BASE_URL}/appointments/unavailable-timeslots`, request, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
      httpsAgent: new https.Agent({
        rejectUnauthorized: false,
      }),
    });
    return response.data;
  } catch (error: any) {
    throw new Error(error.response?.data?.message || "Failed to fetch unavailable time slots");
  }
};

export const autoResetAppointmentStatus = async (): Promise<ResultDTO<any>> => {
  const response = await api.post("/appointment-management/appointments/reset-status");
  if (!response.data.isSuccess) {
    throw new Error(response.data.message || `Failed to reset appointment status (Code: ${response.data.code})`);
  }
  return response.data;
};

export const sendAppointmentReminders = async (): Promise<ResultDTO<any>> => {
  const response = await api.post("/appointment-management/appointments/send-reminders");
  if (!response.data.isSuccess) {
    throw new Error(response.data.message || `Failed to send reminders (Code: ${response.data.code})`);
  }
  return response.data;
};

export const checkMissedAppointments = async (): Promise<ResultDTO<any>> => {
  const response = await api.post("/appointment-management/appointments/check-missed");
  if (!response.data.isSuccess) {
    throw new Error(response.data.message || `Failed to check missed appointments (Code: ${response.data.code})`);
  }
  return response.data;
};

export const cleanupExpiredLockedAppointments = async (): Promise<ResultDTO<any>> => {
  const response = await api.post("/appointment-management/appointments/cleanup-expired");
  if (!response.data.isSuccess) {
    throw new Error(response.data.message || `Failed to cleanup expired appointments (Code: ${response.data.code})`);
  }
  return response.data;
};

export const exportAppointmentsToExcel = async (
  page: number = 1,
  pageSize: number = 10,
  search?: string,
  sortBy: string = "AppointmentDate",
  ascending: boolean = true,
  userId?: string,
  staffId?: string,
  status?: string,
  startDate?: string,
  endDate?: string
): Promise<void> => {
  const response = await api.get("/appointment-management/appointments/export", {
    params: { page, pageSize, search, sortBy, ascending, userId, staffId, status, startDate, endDate },
    responseType: "blob",
  });
  const url = window.URL.createObjectURL(new Blob([response.data]));
  const link = document.createElement("a");
  link.href = url;
  link.setAttribute("download", "appointments.xlsx");
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};

export const getAllHealthcareStaff = async (): Promise<ResultDTO<AvailableOfficersResponseDTO[]>> => {
  const token = typeof window !== "undefined" ? Cookies.get("token") : null;
  try {
    const response = await axios.get(`${API_BASE_URL}/healthcare-staff`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
      httpsAgent: new https.Agent({
        rejectUnauthorized: false,
      }),
    });
    return response.data;
  } catch (error: any) {
    throw new Error(error.response?.data?.message || "Failed to fetch healthcare staff");
  }
};

export const getHealthcareStaffById = async (
  staffId: string,
  token?: string
): Promise<ResultDTO<AvailableOfficersResponseDTO>> => {
  try {
    const response = await axios.get(`${API_BASE_URL}/healthcare-staff/${staffId}`, {
      headers: { Authorization: `Bearer ${token}` },
      httpsAgent: new https.Agent({ rejectUnauthorized: false }),
    });
    // Ensure response.data.data is mapped correctly if nested
    const staffData = response.data.data || response.data; // Adjust based on actual response
    return {
      ...response.data,
      data: {
        staffId: staffData.id, // Map id to staffId
        fullName: staffData.fullName,
        email: staffData.email,
        phone: staffData.phone,
        imageURL: staffData.imageURL,
        gender: staffData.gender,
        status: staffData.status,
      },
    };
  } catch (error: any) {
    console.error("getHealthcareStaffById error:", error.response?.data || error.message);
    throw new Error(error.response?.data?.message || "Failed to fetch healthcare staff");
  }
};

// SignalR Setup for Appointments
export const setupAppointmentRealTime = (
  callback: (data: AppointmentResponseDTO) => void,
  eventHandlers: { [key: string]: (data: any) => void } = {}
) => {
  if (typeof window === "undefined") {
    console.log("SignalR setup skipped on server-side");
    return { stop: () => Promise.resolve() } as HubConnection;
  }

  const connection = setupSignalRConnection("/appointmentHub", callback, eventHandlers);

  // Keep slot-related handlers
  connection.on("ReceiveSlotCountUpdate", (data: number) => {
    console.log("SignalR: Slot count updated", data);
    eventHandlers["ReceiveSlotCountUpdate"]?.(data);
  });

  connection.on("ReceiveAvailableSlotsUpdate", (data: { staffId: string; date: string; slots: TimeSlotDTO[] }) => {
    console.log("SignalR: Available slots updated", data);
    eventHandlers["ReceiveAvailableSlotsUpdate"]?.(data);
  });

  connection.on("ReceivePersonalSlotsUpdate", (data: { staffId: string; date: string; slots: TimeSlotDTO[] }) => {
    console.log("SignalR: Personal slots updated", data);
    eventHandlers["ReceivePersonalSlotsUpdate"]?.(data);
  });

  const token = Cookies.get("token");
  if (token) {
    const decodedToken = jwtDecode<{ sub?: string; id?: string; userid?: string; role?: string }>(token);
    const userId = decodedToken.sub || decodedToken.id || decodedToken.userid;
    const role = decodedToken.role;

    const startConnection = async () => {
      if (connection.state === HubConnectionState.Disconnected) {
        try {
          await connection.start();
          console.log("SignalR: Connected to /appointmentHub");
          if (role === "HealthcareStaff" || role === "ADMIN") {
            const staffId = userId;
            await connection.invoke("SubscribeToStaffUpdates", staffId);
            console.log(`SignalR: Subscribed to Staff_${staffId} group`);
          }
        } catch (err) {
          console.error("SignalR: Connection failed:", err);
          setTimeout(startConnection, 2000);
        }
      }
    };

    setTimeout(startConnection, 500);
  } else {
    console.warn("No token found; skipping SignalR group subscription");
    const startConnection = async () => {
      if (connection.state === HubConnectionState.Disconnected) {
        try {
          await connection.start();
          console.log("SignalR: Connected to /appointmentHub (no group subscription)");
        } catch (err) {
          console.error("SignalR: Connection failed:", err);
          setTimeout(startConnection, 2000);
        }
      }
    };
    setTimeout(startConnection, 500);
  }

  connection.onreconnecting((err) => console.log("SignalR Reconnecting:", err));
  connection.onreconnected(() => console.log("SignalR Reconnected to /appointmentHub"));
  connection.onclose((err) => console.log("SignalR Connection Closed:", err));

  return connection;
};

// SignalR Setup for Healthcare Staff Updates
export const setupHealthcareStaffRealTime = (onUpdate: (staff: AvailableOfficersResponseDTO[]) => void) => {
  if (typeof window === "undefined") return () => {};

  const token = Cookies.get("token");
  if (!token) {
    console.error("No token available for SignalR connection.");
    throw new Error("Authentication token is missing.");
  }

  const connection = new HubConnectionBuilder()
    .withUrl("http://localhost:5104/appointmentHub", {
      accessTokenFactory: () => token,
    })
    .withAutomaticReconnect([0, 2000, 5000, 10000])
    .build();

  connection.on("ReceiveHealthcareStaffUpdate", (staffData: AvailableOfficersResponseDTO[] | null) => {
    console.log("SignalR: Received healthcare staff update", staffData);
    if (staffData && Array.isArray(staffData) && staffData.length > 0) {
      onUpdate(staffData); // Only update if data is valid and non-empty
    } else {
      console.warn("SignalR: Received empty or invalid staff update, ignoring", staffData);
    }
  });

  const startConnection = () => {
    setTimeout(() => {
      connection
        .start()
        .then(() => console.log("SignalR Connected to /appointmentHub"))
        .catch((err) => {
          console.error("SignalR Connection Error:", err);
          setTimeout(startConnection, 2000);
        });
    }, 500);
  };

  startConnection();

  connection.onreconnecting((error?: Error) => console.log("SignalR Reconnecting:", error));
  connection.onreconnected(() => console.log("SignalR Reconnected to /appointmentHub"));
  connection.onclose((error?: Error) => console.log("SignalR Connection Closed:", error));

  return () => connection.stop().then(() => console.log("SignalR Disconnected"));
};