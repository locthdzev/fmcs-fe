import api from "./customize-axios";
import axios from "axios";
import https from "https";
import Cookies from "js-cookie";
import jwtDecode from "jwt-decode";

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
  email?: string;
  appointmentDate: string;
  reason: string;
  sendEmailToUser?: boolean;
  sendNotificationToUser?: boolean;
  sendEmailToStaff?: boolean;
  sendNotificationToStaff?: boolean;
  sessionId: string;
}

export interface AppointmentCreateRequestForstaffDTO {
  userId?: string | null;
  staffId: string;
  email?: string;
  appointmentDate: string;
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
  appointmentDate: string;
  reason: string;
  status: string;
  sendEmailToUser?: boolean;
  sendNotificationToUser?: boolean;
  sendEmailToStaff?: boolean;
  sendNotificationToStaff?: boolean;
}

export interface UnavailableTimeSlotDTO {
  startTime: string;
  endTime: string;
  reason: string;
}

export interface CancelPreviousLockRequestDTO {
  sessionId: string;
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
  appointmentDate: string;
  lockedUntil: string;
  endTime: string;
  reason: string;
  status: string;
  createdAt: string;
  createdBy: UserInfo;
  updatedAt?: string;
  updatedBy?: UserInfo | null;
  reminderSent: boolean;
  missedReminderSent: boolean;
  sessionId: string;
}

export interface AppointmentConflictResponseDTO {
  existingAppointmentId: string;
  appointmentDate?: string;
}

export interface CancelLockRequestDTO {
  appointmentId: string;
}

export interface AppointmentAvailabilityCheckRequestDTO {
  appointmentDate: string;
}

export interface UnavailableTimeSlotsRequestDTO {
  staffId: string;
  startDate?: string;
  endDate?: string;
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

export interface CancelExpiredLockRequestDTO {
  appointmentId: string;
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
    console.log(`Canceling lock for userId: ${userId}`);
    const authToken = token || Cookies.get("token");
    const response = await api.post(
      `/appointment-management/appointments/cancel-lock`,
      { userId }
    );
    return response.data;
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
      {},
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
        rejectUnauthorized: false,
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
        rejectUnauthorized: false,
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
        rejectUnauthorized: false,
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
      console.log("Error response data:", errorData);
      return {
        isSuccess: false,
        code: error.response.status,
        data: errorData.data || { existingAppointmentId: errorData.existingAppointmentId },
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
      console.log("Error response data:", errorData);
      if (error.response.status === 409) {
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
        httpsAgent: new https.Agent({ rejectUnauthorized: false }),
      }
    );

    if (response.data.isSuccess) {
      return response.data;
    }

    return {
      isSuccess: false,
      code: response.status,
      data: null,
      message: response.data.message || "Failed to update appointment",
      responseFailed: response.data.responseFailed || undefined,
    };
  } catch (error: any) {
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

    return {
      isSuccess: false,
      code: 0,
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
    { reason },
    {
      headers: { Authorization: `Bearer ${token}` }
    }
  );
  if (!response.data.isSuccess) {
    throw new Error(response.data.message || `Failed to confirm appointment (Code: ${response.data.code})`);
  }
  return response.data;
};

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
    return response.data;
  } catch (error: any) {
    if (error.response) {
      if (error.response.status === 409) {
        return {
          isSuccess: false,
          code: 409,
          message: error.response.data.message || "Conflict occurred, please check your appointment.",
          data: error.response.data.data || { existingAppointmentId: error.response.data.existingAppointmentId },
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

export const getAvailableTimeSlots = async (
  staffId: string,
  date: string,
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
        userId: token ? jwtDecode<{ sub?: string; id?: string; userid?: string }>(token)?.sub || null : null,
      },
    });
    return response.data;
  } catch (error: any) {
    throw new Error(error.response?.data?.message || "Failed to fetch available time slots");
  }
};

export const getAvailableSlotCount = async (
  staffId: string,
  date: string,
  token?: string
): Promise<ResultDTO<number>> => {
  try {
    const response = await axios.get(`/appointment-management/appointments/available-slot-count/${staffId}/${date}`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
      httpsAgent: new https.Agent({
        rejectUnauthorized: false,
      }),
    });
    return response.data;
  } catch (error: any) {
    if (error.response) {
      console.error('Error response:', error.response);
      throw new Error(error.response?.data?.message || `Error: ${error.response?.statusText || 'Unknown error'}`);
    } else if (error.request) {
      console.error('Error request:', error.request);
      throw new Error('No response received from the server.');
    } else {
      console.error('Error:', error.message);
      throw new Error(`Failed to fetch available slot count: ${error.message}`);
    }
  }
};

export const getAvailableSlotCountWithSchedule = async (
  staffId: string,
  date: string,
  token?: string
): Promise<ResultDTO<number>> => {
  try {
    const response = await axios.get(`/appointment-management/appointments/available-slot-count-with-schedule/${staffId}/${date}`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
      httpsAgent: new https.Agent({
        rejectUnauthorized: false,
      }),
    });
    return response.data;
  } catch (error: any) {
    if (error.response) {
      console.error('Error response:', error.response);
      throw new Error(error.response?.data?.message || `Error: ${error.response?.statusText || 'Unknown error'}`);
    } else if (error.request) {
      console.error('Error request:', error.request);
      throw new Error('No response received from the server.');
    } else {
      console.error('Error:', error.message);
      throw new Error(`Failed to fetch available slot count with schedule: ${error.message}`);
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
        httpsAgent: new https.Agent({ rejectUnauthorized: false }),
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
      {},
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
  token?: string
): Promise<ResultDTO<AppointmentResponseDTO>> => {
  const authToken = token || Cookies.get("token");
  if (!authToken) {
    throw new Error("Authentication token is missing.");
  }

  try {
    const response = await axios.put(
      `/appointment-management/appointments/${id}/staff-cancel`,
      {},
      {
        headers: {
          Authorization: `Bearer ${authToken}`,
        },
        httpsAgent: new https.Agent({ rejectUnauthorized: false }),
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
  token?: string
): Promise<ResultDTO<any>> => {
  const authToken = token || Cookies.get("token");
  if (!authToken) {
    throw new Error("Authentication token is missing.");
  }

  try {
    const response = await axios.put(
      `/appointment-management/appointments/users/${email}/reset-user-appointmentstatus`,
      {},
      {
        headers: {
          Authorization: `Bearer ${authToken}`,
        },
        httpsAgent: new https.Agent({ rejectUnauthorized: false }),
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

export const cancelExpiredLockedAppointment = async (
  appointmentId: string,
  token?: string
): Promise<ResultDTO<AppointmentResponseDTO>> => {
  try {
    console.log(`Canceling expired locked appointment for AppointmentId: ${appointmentId}`);
    const request: CancelExpiredLockRequestDTO = { appointmentId };
    const response = await axios.post(
      `/appointment-management/appointments/cancel-expired-locks`,
      request,
      {
        headers: {
          Authorization: `Bearer ${token || Cookies.get("token")}`,
        },
        httpsAgent: new https.Agent({ rejectUnauthorized: false }),
      }
    );

    console.log("CancelExpiredLockedAppointment response:", response.data);
    if (!response.data.isSuccess) {
      throw new Error(
        response.data.message || `Failed to cancel expired locked appointment (Code: ${response.data.code})`
      );
    }

    return response.data;
  } catch (error: any) {
    console.error("Failed to cancel expired locked appointment:", error.response?.data || error.message);
    if (error.response) {
      const errorData = error.response.data;
      return {
        isSuccess: false,
        code: error.response.status,
        data: null,
        message: errorData.message || "Failed to cancel expired locked appointment",
        responseFailed: errorData.responseFailed || undefined,
      };
    }
    throw new Error(
      error.response?.data?.message || `Failed to cancel expired locked appointment: ${error.message}`
    );
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
    const staffData = response.data.data || response.data;
    return {
      ...response.data,
      data: {
        staffId: staffData.id,
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