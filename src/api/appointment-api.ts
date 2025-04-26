import api, { setupSignalRConnection } from "./customize-axios";
import axios from "axios";
import https from "https";
import Cookies from "js-cookie";
import { HubConnectionBuilder, HubConnection, HubConnectionState } from "@microsoft/signalr";
import jwtDecode from "jwt-decode";
import { Typography } from "antd";

// Remove hardcoded base URL
// const API_BASE_URL = "http://localhost:5104/api/appointment-management";

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

export interface DetailedAppointmentStatisticsDTO {
  totalHealthcareOfficers: number;
  studentsCurrentlyReceivingCare: number;
  appointmentsScheduledToday: number;
  totalAppointments: number;
  appointmentsByStatus: Record<string, number>;
  statusPercentages: Record<string, number>;
  dailyStatistics: {
    date: string;
    totalAppointments: number;
    completed: number;
    cancelled: number;
    missed: number;
    scheduled: number;
  }[];
  staffPerformance: {
    staffId: string;
    staffName: string;
    totalAppointments: number;
    completedAppointments: number;
    missedAppointments: number;
    cancelledAppointments: number;
    completionRate: number;
  }[];
  reasonCategories: Record<string, number>;
  missedAppointments: number;
  completedAppointments: number;
  completionRate: number;
  averageAppointmentsPerDay: number;
  mostPopularDay: number;
  peakAppointmentTime: string;
}

export interface AppointmentStatisticsRequestDTO {
  startDate?: string;
  endDate?: string;
  staffId?: string;
  statusFilter?: string[];
  groupBy?: string;
  includeDailyStats?: boolean;
  includeStaffPerformance?: boolean;
  includeReasonCategories?: boolean;
  trendDays?: number;
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
  email?: string;
  appointmentDate: string; // ISO string (e.g., "2025-03-15T10:00:00Z")
  reason: string;
  sendEmailToUser?: boolean;
  sendNotificationToUser?: boolean;
  sendEmailToStaff?: boolean;
  sendNotificationToStaff?: boolean;
  sessionId: string;
}

export interface AppointmentCreateRequestForstaffDTO {
  userId?: string|null;
  staffId: string;
  email?: string;
  appointmentDate: string; // ISO string (e.g., "2025-03-15T10:00:00Z")
  reason: string;
  sendEmailToUser?: boolean;
  sendNotificationToUser?: boolean;
  sendEmailToStaff?: boolean;
  sendNotificationToStaff?: boolean;
  sessionId?: string | null;
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

export interface CancelPreviousLockRequestDTO {
  sessionId: string; // Matches backend: Guid in C#, string in TS
}

export interface AppointmentResponseDTO {
  id: string;
  userId: string;
  studentName: string;
  studentGender: string;
  studentDob: string;
  studentEmail: string;
  studentPhone: string;
  staffId: string;
  staffName: string;
  staffEmail: string;
  staffPhone: string;
  imageURL?: string;
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
  ascending: boolean = false
): Promise<PagedResultDTO<AppointmentResponseDTO>> => {
  try {
    console.log(`Fetching appointments for user ${userId} with params:`, {
      page,
      pageSize,
      sortBy,
      ascending,
    });
    const response = await api.get(`/appointment-management/appointments/user/${userId}`, {
      params: { page, pageSize, sortBy, ascending },
    });
    console.log("API response:", response.data);
    if (!response.data.isSuccess) {
      throw new Error(response.data.message || "Failed to fetch appointments from server");
    }
    return response.data;
  } catch (error: any) {
    console.error("Error in getAppointmentsByUserId:", {
      message: error.message,
      response: error.response ? {
        status: error.response.status,
        data: error.response.data,
      } : "No response",
      request: error.request ? error.request : "No request",
    });
    // Return a consistent PagedResultDTO structure
    return {
      isSuccess: false,
      code: error.response?.status || 500,
      data: [],
      totalRecords: 0,
      page,
      pageSize,
      message: error.response?.data?.message || error.message || "Failed to fetch appointments",
      responseFailed: error.response?.data?.responseFailed || "Unknown error",
    };
  }
};

export const cancelLockedAppointment = async (
  userId: string,
  token?: string
): Promise<ResultDTO<null>> => {
  try {
    console.log(`Canceling lock for userId: ${userId}`); // Log the request
    const response = await axios.post(
      `/appointment-management/appointments/cancel-lock`,
      { userId },
      {
        headers: { Authorization: `Bearer ${token}` },
        httpsAgent: new https.Agent({ rejectUnauthorized: false }),
      }
    );
    return response.data;
    console.log("CancelLockedAppointment response:", response.data); // Log server response
  } catch (error: any) {
    console.error("Failed to cancel lock:", error.response?.data || error.message);
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


export const cancelPreviousLockedAppointment = async (
  request: CancelPreviousLockRequestDTO,
  token?: string
): Promise<ResultDTO<AppointmentResponseDTO>> => {
  try {
    console.log(`Canceling previous lock for sessionId: ${request.sessionId}`);
    const response = await axios.post(
      `/appointment-management/appointments/cancel-previous-lock`,
      request,
      {
        headers: { Authorization: `Bearer ${token}` },
        httpsAgent: new https.Agent({ rejectUnauthorized: false }),
      }
    );
    console.log("CancelPreviousLockedAppointment response:", response.data);
    return response.data;
  } catch (error: any) {
    console.error("Failed to cancel previous lock:", error.response?.data || error.message);
    if (error.response) {
      const errorData = error.response.data;
      return {
        isSuccess: false,
        code: error.response.status,
        data: null,
        message: errorData.message || "Failed to cancel previous locked appointment",
        responseFailed: errorData.responseFailed || undefined,
      };
    }
    throw new Error(
      error.response?.data?.message || `Failed to cancel previous locked appointment: ${error.message}`
    );
  }
};


export const cancelPresentLockedAppointment = async (
  token?: string
): Promise<ResultDTO<AppointmentResponseDTO>> => {
  try {
    console.log("Canceling present locked appointment");
    const response = await axios.post(
      `/appointment-management/appointments/cancel-present-lock`,
      {}, // Empty body since UserId comes from token
      {
        headers: { Authorization: `Bearer ${token}` },
        httpsAgent: new https.Agent({ rejectUnauthorized: false }),
      }
    );
    console.log("CancelPresentLockedAppointment response:", response.data);
    return response.data;
  } catch (error: any) {
    console.error("Failed to cancel present lock:", error.response?.data || error.message);
    if (error.response) {
      const errorData = error.response.data;
      return {
        isSuccess: false,
        code: error.response.status,
        data: null,
        message: errorData.message || "Failed to cancel present locked appointment",
        responseFailed: errorData.responseFailed || undefined,
      };
    }
    throw new Error(
      error.response?.data?.message || `Failed to cancel present locked appointment: ${error.message}`
    );
  }
};

// Add this after getHealthcareStaffById and before SignalR setups
export const getOverlappingAppointments = async (
  userId: string,
  startDateTime: string, 
  endDateTime: string, 
  token?: string
): Promise<ResultDTO<AppointmentResponseDTO[]>> => {
  try {
    const response = await axios.get(`/appointment-management/appointments/overlapping`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
      httpsAgent: new https.Agent({
        rejectUnauthorized: false, // Disable certificate verification (dev only)
      }),
      params: {
        userId,
        startDateTime,
        endDateTime,
      },
    });

    if (!response.data.isSuccess) {
      throw new Error(
        response.data.message || `Failed to fetch overlapping appointments (Code: ${response.data.code})`
      );
    }

    return response.data;
  } catch (error: any) {
    console.error("Failed to fetch overlapping appointments:", error.response?.data || error.message);
    if (error.response) {
      const errorData = error.response.data;
      return {
        isSuccess: false,
        code: error.response.status,
        data: null,
        message: errorData.message || "Failed to fetch overlapping appointments",
        responseFailed: errorData.responseFailed || undefined,
      };
    }
    throw new Error(
      error.response?.data?.message || `Failed to fetch overlapping appointments: ${error.message}`
    );
  }
};

export const getAppointment = async (
  id: string,
  token?: string
): Promise<ResultDTO<AppointmentResponseDTO>> => {
  try {
    const response = await axios.get(`/appointment-management/appointments/${id}`, {
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
    const response = await axios.get(`/appointment-management/statistics`, {
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

// New function to get filtered appointment statistics
export const getFilteredAppointmentStatistics = async (
  params: AppointmentStatisticsRequestDTO,
  token?: string
): Promise<ResultDTO<DetailedAppointmentStatisticsDTO>> => {
  try {
    const authToken = token || Cookies.get("token");
    if (!authToken) {
      throw new Error("Authentication token is missing.");
    }

    const response = await axios.get(`/appointment-management/statistics/filtered`, {
      headers: {
        Authorization: `Bearer ${authToken}`,
      },
      httpsAgent: new https.Agent({
        rejectUnauthorized: false, // Disable certificate verification (only for dev)
      }),
      params: {
        startDate: params.startDate,
        endDate: params.endDate,
        staffId: params.staffId,
        statusFilter: params.statusFilter,
        groupBy: params.groupBy,
        includeDailyStats: params.includeDailyStats,
        includeStaffPerformance: params.includeStaffPerformance,
        includeReasonCategories: params.includeReasonCategories,
        trendDays: params.trendDays,
      },
    });

    if (!response.data.isSuccess) {
      throw new Error(response.data.message || `Failed to fetch filtered statistics (Code: ${response.data.code})`);
    }

    return response.data;
  } catch (error: any) {
    console.error("Failed to fetch filtered appointment statistics:", error.response?.data || error.message);
    if (error.response) {
      const errorData = error.response.data;
      return {
        isSuccess: false,
        code: error.response.status,
        data: null,
        message: errorData.message || "Failed to fetch filtered appointment statistics",
        responseFailed: errorData.responseFailed || undefined,
      };
    }
    throw new Error(
      error.response?.data?.message || `Failed to fetch filtered appointment statistics: ${error.message}`
    );
  }
};

// New function to export appointment statistics
export const exportAppointmentStatistics = async (
  params: AppointmentStatisticsRequestDTO,
  token?: string
): Promise<Blob> => {
  try {
    const authToken = token || Cookies.get("token");
    if (!authToken) {
      throw new Error("Authentication token is missing.");
    }

    const response = await axios.get(`/appointment-management/statistics/export`, {
      headers: {
        Authorization: `Bearer ${authToken}`,
      },
      responseType: "blob",
      httpsAgent: new https.Agent({
        rejectUnauthorized: false, // Disable certificate verification (only for dev)
      }),
      params: {
        startDate: params.startDate,
        endDate: params.endDate,
        staffId: params.staffId,
        statusFilter: params.statusFilter,
      },
    });

    // Create a download link
    const url = window.URL.createObjectURL(new Blob([response.data]));
    const link = document.createElement("a");
    link.href = url;
    link.setAttribute("download", "appointment_statistics.xlsx");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    return response.data;
  } catch (error: any) {
    console.error("Failed to export appointment statistics:", error.response?.data || error.message);
    throw new Error(
      error.response?.data?.message || `Failed to export appointment statistics: ${error.message}`
    );
  }
};

// Updated: Fixed URL to match new backend route
// Add more specific error handling
export const scheduleAppointment = async (
  request: AppointmentCreateRequestDTO,
  token?: string
): Promise<ResultDTO<AppointmentResponseDTO | AppointmentConflictResponseDTO>> => {
  try {
    const response = await axios.post(`/appointment-management/appointments/schedule`, request, {
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
  request: AppointmentCreateRequestForstaffDTO,
  token?: string
): Promise<ResultDTO<AppointmentResponseDTO | AppointmentConflictResponseDTO>> => {
  const authToken = token || Cookies.get("token");
  if (!authToken) {
    throw new Error("Authentication token is missing.");
  }

  try {
    const response = await axios.post(`/appointment-management/appointments/staff-schedule`, request, {
      headers: { Authorization: `Bearer ${authToken}` },
      httpsAgent: new https.Agent({ rejectUnauthorized: false }),
    });

    return response.data;
  } catch (error: any) {
    if (error.response) {
      const errorData = error.response.data;
      console.log("Error response data:", errorData); // Debug log
      if (error.response.status === 409) {
        // Handle conflict case explicitly
        return {
          isSuccess: false,
          code: 409,
          data: errorData.data || { existingAppointmentId: errorData.existingAppointmentId },
          message: errorData.message || "Failed to schedule appointment due to a conflict",
          responseFailed: errorData.responseFailed || undefined,
        };
      }
      return {
        isSuccess: false,
        code: error.response.status,
        data: null,
        message: errorData.message || "Failed to schedule appointment",
        responseFailed: errorData.responseFailed || undefined,
      };
    }
    throw new Error(
      error.response?.data?.message || `Failed to schedule appointment for staff: ${error.message}`
    );
  }
};

// Update appointment by healthcare staff (e.g., confirm or modify)
export const updateAppointmentByStaff = async (
  id: string,
  token: string,
  data: AppointmentUpdateRequestDTO
): Promise<ResultDTO<AppointmentResponseDTO>> => {
  try {
    const response = await axios.put(
      `/appointment-management/appointments/${id}/staff-update`,
      data,
      {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        httpsAgent: new https.Agent({ rejectUnauthorized: false }), // For dev only
      }
    );

    // If the response indicates success, return it directly
    if (response.data.isSuccess) {
      return response.data;
    }

    // If not successful but still a valid response, return the error details
    return {
      isSuccess: false,
      code: response.status,
      data: null,
      message: response.data.message || "Failed to update appointment",
      responseFailed: response.data.responseFailed || undefined,
    };
  } catch (error: any) {
    // Handle Axios errors (e.g., 400, 401, 500)
    if (error.response) {
      const errorData = error.response.data;
      return {
        isSuccess: false,
        code: error.response.status,
        data: null,
        message: errorData.message || `Failed to update appointment (Status: ${error.response.status})`,
        responseFailed: errorData.responseFailed || undefined,
      };
    }

    // Handle network errors or other unexpected issues
    return {
      isSuccess: false,
      code: 0, // No HTTP status code available
      data: null,
      message: error.message || "An unexpected error occurred while updating the appointment",
      responseFailed: "Network or client-side error",
    };
  }
};

export const confirmAppointment = async (
  id: string,
  token?: string,
  reason?: string
): Promise<ResultDTO<AppointmentResponseDTO>> => {
  const response = await axios.put(
    `/appointment-management/appointments/${id}/confirm`,
    { reason }, // Include reason in the request body
    {
      headers: { Authorization: `Bearer ${token}` }
    }
  );
  if (!response.data.isSuccess) {
    throw new Error(response.data.message || `Failed to confirm appointment (Code: ${response.data.code})`);
  }
  return response.data;
};

// New: Added function for validating appointment requests
export const validateAppointmentRequest = async (
  request: AppointmentCreateRequestDTO,
  token?: string
): Promise<ResultDTO<AppointmentConflictResponseDTO>> => {
  try {
    const response = await axios.post(`/appointment-management/appointments/validate-appointment`, request, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
      httpsAgent: new https.Agent({
        rejectUnauthorized: false,
      }),
    });
    return response.data; // Return data directly if successful
  } catch (error: any) {
    if (error.response) {
      if (error.response.status === 409) {
        return {
          isSuccess: false,
          code: 409,
          message: error.response.data.message || "Conflict occurred, please check your appointment.",
          data: error.response.data.data || { existingAppointmentId: error.response.data.existingAppointmentId }, // Extract inner data
        };
      } else {
        return {
          isSuccess: false,
          code: error.response.status,
          message: error.response.data.message || "Unknown error occurred.",
          data: null,
        };
      }
    } else if (error.request) {
      return {
        isSuccess: false,
        code: 500,
        message: "No response received from the server.",
        data: null,
      };
    } else {
      return {
        isSuccess: false,
        code: 500,
        message: `Error: ${error.message}`,
        data: null,
      };
    }
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
    const response = await axios.get(`/appointment-management/appointments/available-time-slots/${staffId}/${date}`, {
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
    const response = await axios.get(`/appointment-management/appointments/available-slot-count/${staffId}/${date}`, {
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
  request: AppointmentUpdateRequestDTO,
  token?: string
): Promise<ResultDTO<AppointmentResponseDTO>> => {
  const authToken = token || Cookies.get("token");
  if (!authToken) {
    throw new Error("Authentication token is missing.");
  }

  try {
    const response = await axios.put(
      `/appointment-management/appointments/${request.id}/staff-update`,
      request,
      {
        headers: {
          Authorization: `Bearer ${authToken}`,
          "Content-Type": "application/json",
        },
        httpsAgent: new https.Agent({ rejectUnauthorized: false }), // For dev environment
      }
    );

    if (!response.data.isSuccess) {
      throw new Error(response.data.message || `Failed to update appointment (Code: ${response.data.code})`);
    }
    return response.data;
  } catch (error: any) {
    console.error("Failed to update appointment by staff:", error.response?.data || error.message);
    if (error.response) {
      const errorData = error.response.data;
      return {
        isSuccess: false,
        code: error.response.status,
        data: null,
        message: errorData.message || "Failed to update appointment",
        responseFailed: errorData.responseFailed || undefined,
      };
    }
    throw new Error(
      error.response?.data?.message || `Failed to update appointment by staff: ${error.message}`
    );
  }
};

export const cancelAppointment = async (id: string, token?: string): Promise<ResultDTO<AppointmentResponseDTO>> => {
  try {
    console.log(`Canceling appointment with ID: ${id}`);
    const response = await axios.put(
      `/appointment-management/appointments/${id}/cancel`,
      {}, // No body required since the ID is in the URL
      {
        headers: { Authorization: `Bearer ${token}` },
        httpsAgent: new https.Agent({ rejectUnauthorized: false }),
      }
    );
    console.log("CancelAppointment response:", response.data);
    return response.data;
  } catch (error: any) {
    console.error("Failed to cancel appointment:", error.response?.data || error.message);
    if (error.response) {
      const errorData = error.response.data;
      return {
        isSuccess: false,
        code: error.response.status,
        data: null,
        message: errorData.message || "Failed to cancel appointment",
        responseFailed: errorData.responseFailed || undefined,
      };
    }
    throw new Error(
      error.response?.data?.message || `Failed to cancel appointment: ${error.message}`
    );
  }
};


export const getAppointmentsByStaffId = async (
  staffId: string,
  page: number = 1,
  pageSize: number = 10,
  sortBy: string = "CreatedAt",
  ascending: boolean = false,
  token?: string
): Promise<PagedResultDTO<AppointmentResponseDTO>> => {
  try {
    console.log(`Fetching appointments for staff ${staffId} with params:`, {
      page,
      pageSize,
      sortBy,
      ascending,
    });
    const response = await axios.get(`/appointment-management/appointments/staff/${staffId}`, {
      headers: {
        Authorization: `Bearer ${token || Cookies.get("token")}`,
      },
      httpsAgent: new https.Agent({ rejectUnauthorized: false }),
      params: { page, pageSize, sortBy, ascending },
    });
    console.log("API response:", response.data);
    if (!response.data.isSuccess) {
      throw new Error(response.data.message || "Failed to fetch appointments from server");
    }
    return response.data;
  } catch (error: any) {
    console.error("Error in getAppointmentsByStaffId:", {
      message: error.message,
      response: error.response ? {
        status: error.response.status,
        data: error.response.data,
      } : "No response",
      request: error.request ? error.request : "No request",
    });
    // Return a consistent PagedResultDTO structure
    return {
      isSuccess: false,
      code: error.response?.status || 500,
      data: [],
      totalRecords: 0,
      page,
      pageSize,
      message: error.response?.data?.message || error.message || "Failed to fetch appointments",
      responseFailed: error.response?.data?.responseFailed || "Unknown error",
    };
  }
};

export const cancelAppointmentForStaff = async (
  id: string,
  token?: string // Optional token parameter, falls back to Cookies if not provided
): Promise<ResultDTO<AppointmentResponseDTO>> => {
  const authToken = token || Cookies.get("token"); // Use provided token or fetch from Cookies
  if (!authToken) {
    throw new Error("Authentication token is missing.");
  }

  try {
    const response = await axios.put(
      `/appointment-management/appointments/${id}/staff-cancel`,
      {}, // No body required for this PUT request
      {
        headers: {
          Authorization: `Bearer ${authToken}`,
        },
        httpsAgent: new https.Agent({ rejectUnauthorized: false }), // Keep this for dev environment
      }
    );

    if (!response.data.isSuccess) {
      throw new Error(response.data.message || `Failed to cancel appointment for staff (Code: ${response.data.code})`);
    }
    return response.data;
  } catch (error: any) {
    console.error("Failed to cancel appointment for staff:", error.response?.data || error.message);
    if (error.response) {
      const errorData = error.response.data;
      return {
        isSuccess: false,
        code: error.response.status,
        data: null,
        message: errorData.message || "Failed to cancel appointment for staff",
        responseFailed: errorData.responseFailed || undefined,
      };
    }
    throw new Error(
      error.response?.data?.message || `Failed to cancel appointment for staff: ${error.message}`
    );
  }
};

export const confirmAbsence = async (appointmentId: string): Promise<ResultDTO<AppointmentResponseDTO>> => {
  try {
    console.log(`Confirming absence for appointment ID: ${appointmentId}`);
    const response = await api.put(`/appointment-management/appointments/${appointmentId}/absence`);
    console.log("ConfirmAbsence response:", response.data);
    return response.data;
  } catch (error: any) {
    console.error("Failed to confirm absence:", error.response?.data || error.message);
    if (error.response) {
      const errorData = error.response.data;
      return {
        isSuccess: false,
        code: error.response.status,
        data: null,
        message: errorData.message || "Failed to confirm absence",
        responseFailed: errorData.responseFailed || undefined,
      };
    }
    throw new Error(
      error.response?.data?.message || `Failed to confirm absence: ${error.message}`
    );
  }
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
  email: string,
  token?: string // Optional token parameter, falls back to Cookies if not provided
): Promise<ResultDTO<any>> => {
  const authToken = token || Cookies.get("token"); // Use provided token or fetch from Cookies
  if (!authToken) {
    throw new Error("Authentication token is missing.");
  }

  try {
    const response = await axios.put(
      `/appointment-management/appointments/users/${email}/reset-user-appointmentstatus`,
      {}, // No body required for this PUT request
      {
        headers: {
          Authorization: `Bearer ${authToken}`,
        },
        httpsAgent: new https.Agent({ rejectUnauthorized: false }), // Keep this for dev environment
      }
    );

    if (!response.data.isSuccess) {
      throw new Error(response.data.message || `Failed to reset user appointment status (Code: ${response.data.code})`);
    }
    return response.data;
  } catch (error: any) {
    console.error("Failed to reset user appointment status:", error.response?.data || error.message);
    if (error.response) {
      const errorData = error.response.data;
      return {
        isSuccess: false,
        code: error.response.status,
        data: null,
        message: errorData.message || "Failed to reset user appointment status",
        responseFailed: errorData.responseFailed || undefined,
      };
    }
    throw new Error(
      error.response?.data?.message || `Failed to reset user appointment status: ${error.message}`
    );
  }
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
    const response = await axios.post(`/appointment-management/appointments/unavailable-timeslots`, request, {
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
    const response = await axios.get(`/appointment-management/healthcare-staff`, {
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
    const response = await axios.get(`/appointment-management/healthcare-staff/${staffId}`, {
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
export const setupStudentAppointmentRealTime = (
  userId: string,
  onUpdate: (data: { appointmentId: string; status: string; eventType: string }) => void,
  onError?: (error: Error) => void
): HubConnection => {
  const token = Cookies.get("token");
  if (!token) {
    console.warn("No token available for SignalR connection");
    throw new Error("Authentication required for real-time updates");
  }

  // Use setupSignalRConnection from customize-axios
  const connection = setupSignalRConnection(
    "/appointmentHub",
    (data) => {
      console.log("Appointment update received:", data);
      onUpdate(data);
    }
  );

  return connection;
};


export const setupAppointmentRealTime = (
callback: (data: { appointmentId: string; status: string }) => void,
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
          if (role === "Healthcare Staff" || role === "Admin") {
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

    setTimeout(startConnection, 2000);
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
    setTimeout(startConnection, 2000);
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
    .withUrl("/appointmentHub", {
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


export const setupConfirmAppointmentRealtime = (
  staffId: string,
  onAppointmentConfirmed: (data: { staffId: string; date: string; timeSlot: string; appointmentId: string }) => void,
  onError?: (error: Error) => void
): HubConnection => {
  if (typeof window === "undefined") {
    console.log("SignalR setup skipped on server-side");
    return { stop: () => Promise.resolve() } as HubConnection;
  }

  const token = Cookies.get("token");
  if (!token) {
    console.error("No token available for SignalR connection.");
    throw new Error("Authentication token is missing.");
  }

  const connection = new HubConnectionBuilder()
    .withUrl("/appointmentHub", {
      accessTokenFactory: () => token,
    })
    .withAutomaticReconnect([0, 1000, 5000, 10000])
    .build();

  // Handle appointment confirmed event
  connection.on("ReceiveAppointmentConfirmed", (data: { staffId: string; date: string; timeSlot: string; appointmentId: string }) => {
    console.log("SignalR: Appointment confirmed received", data);
    if (data.staffId === staffId) {
      onAppointmentConfirmed(data);
    }
  });

  const startConnection = async () => {
    if (connection.state === HubConnectionState.Disconnected) {
      try {
        await connection.start();
        console.log(`SignalR: Connected to /appointmentHub for confirmation (Staff_${staffId})`);
        await connection.invoke("SubscribeToStaffUpdates", staffId);
        console.log(`SignalR: Subscribed to Staff_${staffId} for appointment confirmation updates`);
      } catch (err) {
        console.error("SignalR: Connection failed for confirmation:", err);
        onError?.(err as Error);
        setTimeout(startConnection, 2000); // Retry after 2 seconds
      }
    }
  };

  startConnection();

  connection.onreconnecting((err) => console.log("SignalR Reconnecting (Confirm):", err));
  connection.onreconnected(() => {
    console.log("SignalR Reconnected (Confirm)");
    connection.invoke("SubscribeToStaffUpdates", staffId).catch((err) =>
      console.error("SignalR: Resubscription failed:", err)
    );
  });
  connection.onclose((err) => console.log("SignalR Connection Closed (Confirm):", err));

  return connection;
};


export const setupScheduleAppointmentLockedRealtime = (
  staffId: string,
  onSlotLocked: (data: { staffId: string; date: string; timeSlot: string; appointmentId: string; lockedUntil: string }) => void,
  onError?: (error: Error) => void
): HubConnection => {
  if (typeof window === "undefined") {
    console.log("SignalR setup skipped on server-side");
    return { stop: () => Promise.resolve() } as HubConnection;
  }

  const token = Cookies.get("token");
  if (!token) {
    console.error("No token available for SignalR connection.");
    throw new Error("Authentication token is missing.");
  }

  const connection = new HubConnectionBuilder()
    .withUrl("/appointmentHub", {
      accessTokenFactory: () => token,
      
    })
    .withAutomaticReconnect([0, 1000, 5000, 10000])
    .build();

  // Handle slot locked event
  connection.on("ReceiveSlotLocked", (data: { staffId: string; date: string; timeSlot: string; appointmentId: string; lockedUntil: string }) => {
    console.log("SignalR: Slot locked received", data);
    if (data.staffId === staffId) {
      onSlotLocked(data);
    }
  });

  const startConnection = async () => {
    if (connection.state === HubConnectionState.Disconnected) {
      try {
        await connection.start();
        console.log(`SignalR: Connected to /appointmentHub for scheduling (Staff_${staffId})`);
        await connection.invoke("SubscribeToStaffUpdates", staffId);
        console.log(`SignalR: Subscribed to Staff_${staffId} for slot locking updates`);
      } catch (err) {
        console.error("SignalR: Connection failed for scheduling:", err);
        onError?.(err as Error);
        setTimeout(startConnection, 2000); // Retry after 2 seconds
      }
    }
  };

  startConnection();

  connection.onreconnecting((err) => console.log("SignalR Reconnecting (Schedule):", err));
  connection.onreconnected(() => {
    console.log("SignalR Reconnected (Schedule)");
    connection.invoke("SubscribeToStaffUpdates", staffId).catch((err) =>
      console.error("SignalR: Resubscription failed:", err)
    );
  });
  connection.onclose((err) => console.log("SignalR Connection Closed (Schedule):", err));

  return connection;
};

export const setupCancelAppointmentRealtime = (
staffId: string,
onSlotReleased: (data: { staffId: string; date: string; timeSlot: string; appointmentId: string; userId: string }) => void,
onError?: (error: Error) => void
): HubConnection => {
  if (typeof window === "undefined") {
    console.log("SignalR setup skipped on server-side");
    return { stop: () => Promise.resolve() } as HubConnection;
  }

  const token = Cookies.get("token");
  if (!token) {
    console.error("No token available for SignalR connection.");
    throw new Error("Authentication token is missing.");
  }

  const connection = new HubConnectionBuilder()
    .withUrl("/appointmentHub", {
      accessTokenFactory: () => token,
    })
    .withAutomaticReconnect([0, 1000, 5000, 10000])
    .build();

  // Handle slot released event
  connection.on("ReceiveSlotReleased", (data: { staffId: string; date: string; timeSlot: string; appointmentId: string; userId: string }) => {
    console.log("SignalR: Slot released received", data);
    if (data.staffId === staffId) {
      onSlotReleased(data);
    }
  });

  const startConnection = async () => {
    if (connection.state === HubConnectionState.Disconnected) {
      try {
        await connection.start();
        console.log(`SignalR: Connected to /appointmentHub for cancellation (Staff_${staffId})`);
        await connection.invoke("SubscribeToStaffUpdates", staffId);
        console.log(`SignalR: Subscribed to Staff_${staffId} for slot release updates`);
      } catch (err) {
        console.error("SignalR: Connection failed for cancellation:", err);
        onError?.(err as Error);
        setTimeout(startConnection, 2000); // Retry after 2 seconds
      }
    }
  };

  startConnection();

  connection.onreconnecting((err) => console.log("SignalR Reconnecting (Cancel):", err));
  connection.onreconnected(() => {
    console.log("SignalR Reconnected (Cancel)");
    connection.invoke("SubscribeToStaffUpdates", staffId).catch((err) =>
      console.error("SignalR: Resubscription failed:", err)
    );
  });
  connection.onclose((err) => console.log("SignalR Connection Closed (Cancel):", err));

  return connection;
};

  
//    CancelPreviousLockedAppointmentRealtime

export const setupCancelPreviousLockedAppointmentRealtime = (
  staffId: string,
  onPreviousSlotReleased: (data: { staffId: string; date: string; timeSlot: string; appointmentId: string; userId: string }) => void,
  onError?: (error: Error) => void
): HubConnection => {
  if (typeof window === "undefined") {
    console.log("SignalR setup skipped on server-side");
    return { stop: () => Promise.resolve() } as HubConnection;
  }

  const token = Cookies.get("token");
  if (!token) {
    console.error("No token available for SignalR connection.");
    throw new Error("Authentication token is missing.");
  }

  const connection = new HubConnectionBuilder()
    .withUrl("/appointmentHub", {
      accessTokenFactory: () => token,
    })
    .withAutomaticReconnect([0, 1000, 5000, 10000])
    .build();

  // Handle previous slot released event
  connection.on("ReceivePreviousSlotReleased", (data: { staffId: string; date: string; timeSlot: string; appointmentId: string; userId: string }) => {
    console.log("SignalR: Previous slot released received", data);
    if (data.staffId === staffId) {
      onPreviousSlotReleased(data);
    }
  });

  const startConnection = async () => {
    if (connection.state === HubConnectionState.Disconnected) {
      try {
        await connection.start();
        console.log(`SignalR: Connected to /appointmentHub for previous lock cancellation (Staff_${staffId})`);
        await connection.invoke("SubscribeToStaffUpdates", staffId);
        console.log(`SignalR: Subscribed to Staff_${staffId} for previous slot release updates`);
      } catch (err) {
        console.error("SignalR: Connection failed for previous lock cancellation:", err);
        onError?.(err as Error);
        setTimeout(startConnection, 2000); // Retry after 2 seconds
      }
    }
  };

  startConnection();

  connection.onreconnecting((err) => console.log("SignalR Reconnecting (Previous Lock Cancel):", err));
  connection.onreconnected(() => {
    console.log("SignalR Reconnected (Previous Lock Cancel)");
    connection.invoke("SubscribeToStaffUpdates", staffId).catch((err) =>
      console.error("SignalR: Resubscription failed:", err)
    );
  });
  connection.onclose((err) => console.log("SignalR Connection Closed (Previous Lock Cancel):", err));

  return connection;
};


//    CancelPreviousLockedAppointmentRealtime

export const setupCancelPresentLockedAppointmentRealtime = (
  staffId: string,
  onPresentSlotReleased: (data: { staffId: string; date: string; timeSlot: string; appointmentId: string; userId: string }) => void,
  onError?: (error: Error) => void
): HubConnection => {
  if (typeof window === "undefined") {
    console.log("SignalR setup skipped on server-side");
    return { stop: () => Promise.resolve() } as HubConnection;
  }

  const token = Cookies.get("token");
  if (!token) {
    console.error("No token available for SignalR connection.");
    throw new Error("Authentication token is missing.");
  }

  const connection = new HubConnectionBuilder()
    .withUrl("/appointmentHub", {
      accessTokenFactory: () => token,
    })
    .withAutomaticReconnect([0, 1000, 5000, 10000])
    .build();

  // Handle present slot released event
  connection.on("ReceiveSlotReleased", (data: { staffId: string; date: string; timeSlot: string; appointmentId: string; userId: string }) => {
    console.log("SignalR: Present slot released received", data);
    if (data.staffId === staffId) {
      onPresentSlotReleased(data);
    }
  });

  const startConnection = async () => {
    if (connection.state === HubConnectionState.Disconnected) {
      try {
        await connection.start();
        console.log(`SignalR: Connected to /appointmentHub for present lock cancellation (Staff_${staffId})`);
        await connection.invoke("SubscribeToStaffUpdates", staffId);
        console.log(`SignalR: Subscribed to Staff_${staffId} for present slot release updates`);
      } catch (err) {
        console.error("SignalR: Connection failed for present lock cancellation:", err);
        onError?.(err as Error);
        setTimeout(startConnection, 2000); // Retry after 2 seconds
      }
    }
  };

  startConnection();

  connection.onreconnecting((err) => console.log("SignalR Reconnecting (Present Lock Cancel):", err));
  connection.onreconnected(() => {
    console.log("SignalR Reconnected (Present Lock Cancel)");
    connection.invoke("SubscribeToStaffUpdates", staffId).catch((err) =>
      console.error("SignalR: Resubscription failed:", err)
    );
  });
  connection.onclose((err) => console.log("SignalR Connection Closed (Present Lock Cancel):", err));

  return connection;
};
