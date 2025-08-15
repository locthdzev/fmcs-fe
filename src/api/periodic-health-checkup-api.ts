import axios from "axios";
import Cookies from "js-cookie";
import https from "https";
import { PeriodicHealthCheckupsDetailsStudentResponseDTO } from "./periodic-health-checkup-student-api";
import { PeriodicHealthCheckupsDetailsStaffResponseDTO } from "./periodic-health-checkup-staff-api";

// Base URL for Periodic Health Checkup API
const API_BASE_URL =
  "https://api.truongvu.id.vn/api/periodic-health-checkups-management";

// Reusing existing ResultDTO
export interface ResultDTO<T = any> {
  isSuccess: boolean;
  code: number;
  data: T | null;
  message?: string;
  responseFailed?: string;
}

// DTO Interfaces for Periodic Health Checkups
export interface PeriodicHealthCheckupRequestDTO {
  userID: string;
  checkupDate: string; // ISO string (e.g., "2025-03-30")
  staffID: string;
  classification?: string;
  year: number;
  status?: string;
  createdBy?: string;
}

export interface UserResponseDTO {
  id: string;
  fullName: string;
  userName: string;
  email: string;
  roles: string[];
  gender: string;
  dob: string; // ISO string
  address: string;
  phone: string;
  createdAt: string; // ISO string
  updatedAt: string; // ISO string
  status: string;
  imageURL: string;
}

export interface healthcarestaffResponseDTO {
  id: string;
  fullName: string;
  email: string;
  gender: string;
  phone: string;
  status?: string;
  imageURL?: string;
}

export interface PeriodicHealthCheckupResponseDTO {
  id: string;
  userID: string;
  checkupDate: string; // ISO string
  staffID: string;
  classification?: string;
  year: number;
  status: string;
  createdAt: string; // ISO string
  updatedAt?: string; // ISO string
}

export interface PeriodicHealthCheckupDetailedResponseDTO {
  id: string;
  userID: string;
  checkupDate: string; // ISO string
  staffID: string;
  classification?: string;
  year: number;
  status: string;
  createdAt: string; // ISO string
  updatedAt?: string; // ISO string
  createdBy?: string;
  user: UserResponseDTO;
  staff: healthcarestaffResponseDTO;
  ferritin?: number; // Correct field
}

export interface PeriodicHealthCheckupFilterRequestDTO {
  userID?: string;
  staffID?: string;
  year?: number;
}

interface HealthCheckupResponse {
  checkup: PeriodicHealthCheckupDetailedResponseDTO;
  details:
    | PeriodicHealthCheckupsDetailsStudentResponseDTO
    | PeriodicHealthCheckupsDetailsStaffResponseDTO
    | null;
}

// API Functions
export const getAllHealthCheckups = async (
  token?: string
): Promise<ResultDTO<PeriodicHealthCheckupResponseDTO[]>> => {
  try {
    const response = await axios.get(`${API_BASE_URL}/periodichealthcheckups`, {
      headers: { Authorization: `Bearer ${token || Cookies.get("token")}` },
      httpsAgent: new https.Agent({ rejectUnauthorized: false }),
    });
    if (!response.data.isSuccess) {
      throw new Error(
        response.data.message || "Failed to fetch health checkups"
      );
    }
    return response.data;
  } catch (error: any) {
    console.error(
      "Error in getAllHealthCheckups:",
      error.response?.data || error.message
    );
    if (error.response) {
      const errorData = error.response.data;
      return {
        isSuccess: false,
        code: error.response.status,
        data: null,
        message: errorData.message || "Failed to fetch health checkups",
        responseFailed: errorData.responseFailed || undefined,
      };
    }
    throw new Error(
      error.response?.data?.message ||
        `Failed to fetch health checkups: ${error.message}`
    );
  }
};

export const getHealthCheckupById = async (
  id: string,
  token?: string
): Promise<ResultDTO<PeriodicHealthCheckupResponseDTO>> => {
  try {
    const response = await axios.get(
      `${API_BASE_URL}/periodichealthcheckups/${id}`,
      {
        headers: { Authorization: `Bearer ${token || Cookies.get("token")}` },
        httpsAgent: new https.Agent({ rejectUnauthorized: false }),
      }
    );
    if (!response.data.isSuccess) {
      throw new Error(
        response.data.message || "Failed to fetch health checkup"
      );
    }
    return response.data;
  } catch (error: any) {
    console.error(
      "Error in getHealthCheckupById:",
      error.response?.data || error.message
    );
    if (error.response) {
      const errorData = error.response.data;
      return {
        isSuccess: false,
        code: error.response.status,
        data: null,
        message: errorData.message || "Failed to fetch health checkup",
        responseFailed: errorData.responseFailed || undefined,
      };
    }
    throw new Error(
      error.response?.data?.message ||
        `Failed to fetch health checkup: ${error.message}`
    );
  }
};

export const filterHealthCheckups = async (
  filter: PeriodicHealthCheckupFilterRequestDTO,
  token?: string
): Promise<ResultDTO<PeriodicHealthCheckupResponseDTO[]>> => {
  try {
    const response = await axios.post(
      `${API_BASE_URL}/periodichealthcheckups/filter`,
      filter,
      {
        headers: { Authorization: `Bearer ${token || Cookies.get("token")}` },
        httpsAgent: new https.Agent({ rejectUnauthorized: false }),
      }
    );
    if (!response.data.isSuccess) {
      throw new Error(
        response.data.message || "Failed to filter health checkups"
      );
    }
    return response.data;
  } catch (error: any) {
    console.error(
      "Error in filterHealthCheckups:",
      error.response?.data || error.message
    );
    if (error.response) {
      const errorData = error.response.data;
      return {
        isSuccess: false,
        code: error.response.status,
        data: null,
        message: errorData.message || "Failed to filter health checkups",
        responseFailed: errorData.responseFailed || undefined,
      };
    }
    throw new Error(
      error.response?.data?.message ||
        `Failed to filter health checkups: ${error.message}`
    );
  }
};

export const createPeriodicHealthCheckup = async (
  request: PeriodicHealthCheckupRequestDTO,
  token?: string,
  signal?: AbortSignal
): Promise<ResultDTO<PeriodicHealthCheckupResponseDTO>> => {
  try {
    const response = await axios.post(
      `${API_BASE_URL}/periodichealthcheckups`,
      request,
      {
        headers: { Authorization: `Bearer ${token || Cookies.get("token")}` },
        httpsAgent: new https.Agent({ rejectUnauthorized: false }),
        signal, // Add cancellation support
      }
    );
    if (!response.data.isSuccess) {
      throw new Error(
        response.data.message || "Failed to create health checkup"
      );
    }
    return response.data;
  } catch (error: any) {
    if (axios.isCancel(error)) {
      throw new Error("Request cancelled");
    }
    console.error(
      "Error in createPeriodicHealthCheckup:",
      error.response?.data || error.message
    );
    if (error.response) {
      const errorData = error.response.data;
      return {
        isSuccess: false,
        code: error.response.status,
        data: null,
        message: errorData.message || "Failed to create health checkup",
        responseFailed: errorData.responseFailed || undefined,
      };
    }
    throw new Error(
      error.response?.data?.message ||
        `Failed to create health checkup: ${error.message}`
    );
  }
};

export const updateHealthCheckup = async (
  id: string,
  request: PeriodicHealthCheckupRequestDTO,
  token?: string
): Promise<ResultDTO<PeriodicHealthCheckupResponseDTO>> => {
  try {
    const response = await axios.put(
      `${API_BASE_URL}/periodichealthcheckups/${id}`,
      request,
      {
        headers: { Authorization: `Bearer ${token || Cookies.get("token")}` },
        httpsAgent: new https.Agent({ rejectUnauthorized: false }),
      }
    );
    if (!response.data.isSuccess) {
      throw new Error(
        response.data.message || "Failed to update health checkup"
      );
    }
    return response.data;
  } catch (error: any) {
    console.error(
      "Error in updateHealthCheckup:",
      error.response?.data || error.message
    );
    if (error.response) {
      const errorData = error.response.data;
      return {
        isSuccess: false,
        code: error.response.status,
        data: null,
        message: errorData.message || "Failed to update health checkup",
        responseFailed: errorData.responseFailed || undefined,
      };
    }
    throw new Error(
      error.response?.data?.message ||
        `Failed to update health checkup: ${error.message}`
    );
  }
};

export const getHealthCheckupByCheckupIdUserIdStaffId = async (
  checkupId: string,
  userId: string,
  staffId: string,
  token?: string
): Promise<ResultDTO<PeriodicHealthCheckupResponseDTO>> => {
  try {
    const response = await axios.get(
      `${API_BASE_URL}/periodichealthcheckups/${checkupId}/user/${userId}/staff/${staffId}`,
      {
        headers: { Authorization: `Bearer ${token || Cookies.get("token")}` },
        httpsAgent: new https.Agent({ rejectUnauthorized: false }),
      }
    );
    if (!response.data.isSuccess) {
      throw new Error(
        response.data.message || "Failed to fetch health checkup"
      );
    }
    return response.data;
  } catch (error: any) {
    console.error(
      "Error in getHealthCheckupByCheckupIdUserIdStaffId:",
      error.response?.data || error.message
    );
    if (error.response) {
      const errorData = error.response.data;
      return {
        isSuccess: false,
        code: error.response.status,
        data: null,
        message: errorData.message || "Failed to fetch health checkup",
        responseFailed: errorData.responseFailed || undefined,
      };
    }
    throw new Error(
      error.response?.data?.message ||
        `Failed to fetch health checkup: ${error.message}`
    );
  }
};

export const getHealthCheckupByCheckupId = async (
  checkupId: string,
  token?: string
): Promise<ResultDTO<PeriodicHealthCheckupDetailedResponseDTO>> => {
  try {
    const response = await axios.get(
      `${API_BASE_URL}/periodichealthcheckups/by-checkup/${checkupId}`,
      {
        headers: { Authorization: `Bearer ${token || Cookies.get("token")}` },
        httpsAgent: new https.Agent({ rejectUnauthorized: false }),
      }
    );
    if (!response.data.isSuccess) {
      throw new Error(
        response.data.message || "Failed to fetch health checkup by checkup ID"
      );
    }
    return response.data;
  } catch (error: any) {
    console.error(
      "Error in getHealthCheckupByCheckupId:",
      error.response?.data || error.message
    );
    if (error.response) {
      const errorData = error.response.data;
      return {
        isSuccess: false,
        code: error.response.status,
        data: null,
        message:
          errorData.message || "Failed to fetch health checkup by checkup ID",
        responseFailed: errorData.responseFailed || undefined,
      };
    }
    throw new Error(
      error.response?.data?.message ||
        `Failed to fetch health checkup by checkup ID: ${error.message}`
    );
  }
};

export const getHealthCheckupsByUserId = async (
  userId: string,
  token?: string
): Promise<ResultDTO<HealthCheckupResponse[]>> => {
  try {
    const response = await axios.get(
      `${API_BASE_URL}/periodichealthcheckups/by-user/${userId}`,
      {
        headers: { Authorization: `Bearer ${token || Cookies.get("token")}` },
        httpsAgent: new https.Agent({ rejectUnauthorized: false }),
      }
    );
    if (!response.data.isSuccess) {
      throw new Error(
        response.data.message || "Failed to fetch health checkups by user ID"
      );
    }
    return response.data;
  } catch (error: any) {
    console.error(
      "Error in getHealthCheckupsByUserId:",
      error.response?.data || error.message
    );
    if (error.response) {
      const errorData = error.response.data;
      return {
        isSuccess: false,
        code: error.response.status,
        data: null,
        message:
          errorData.message || "Failed to fetch health checkups by user ID",
        responseFailed: errorData.responseFailed || undefined,
      };
    }
    throw new Error(
      error.response?.data?.message ||
        `Failed to fetch health checkups by user ID: ${error.message}`
    );
  }
};

export const deleteHealthCheckup = async (
  id: string,
  token?: string
): Promise<ResultDTO<null>> => {
  try {
    const response = await axios.delete(
      `${API_BASE_URL}/periodichealthcheckups/${id}`,
      {
        headers: { Authorization: `Bearer ${token || Cookies.get("token")}` },
        httpsAgent: new https.Agent({ rejectUnauthorized: false }),
      }
    );
    if (!response.data.isSuccess) {
      throw new Error(
        response.data.message || "Failed to delete health checkup"
      );
    }
    return response.data;
  } catch (error: any) {
    console.error(
      "Error in deleteHealthCheckup:",
      error.response?.data || error.message
    );
    if (error.response) {
      const errorData = error.response.data;
      return {
        isSuccess: false,
        code: error.response.status,
        data: null,
        message: errorData.message || "Failed to delete health checkup",
        responseFailed: errorData.responseFailed || undefined,
      };
    }
    throw new Error(
      error.response?.data?.message ||
        `Failed to delete health checkup: ${error.message}`
    );
  }
};
