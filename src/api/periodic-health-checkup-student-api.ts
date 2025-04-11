  import axios from "axios";
  import Cookies from "js-cookie";
  import https from "https";

  // Base URL for Periodic Health Checkup API
  const API_BASE_URL = "http://localhost:5104/api/periodic-health-checkups-details-student-management";

  // Reusing existing ResultDTO and PagedResultDTO from appointment API
  export interface ResultDTO<T = any> {
    isSuccess: boolean;
    code: number;
    data: T | null;
    message?: string;
    responseFailed?: string;
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

  export interface UserResponseDTO {
    userId: string;
    email?: string; // Optional, add other fields as needed
  }

  // DTO Interfaces for Periodic Health Checkups (mapped from C# DTOs)
  export interface PeriodicHealthCheckupsDetailsStudentRequestDTO {
    periodicHealthCheckUpId: string;
    heightCm: number;
    weightKg: number;
    bmi?: number;
    pulseRate?: number;
    bloodPressure: string;
    internalMedicineStatus?: string; // Changed from internalMedicine
    surgeryStatus?: string;          // Changed from surgery
    dermatologyStatus?: string;      // Changed from dermatology
    eyeRightScore?: number;          // Changed from eyeRight
    eyeLeftScore?: number;           // Changed from eyeLeft
    eyePathology?: string;           // Changed from eyeCondition
    entstatus?: string;              // Changed from earNoseThroat
    dentalOralStatus?: string;       // Changed from vascularDisorder
    classification?: number;
    conclusion?: string;
    recommendations?: string;
    nextCheckupDate?: string;
    status: string;
    createdBy: string;
    mssv: string;
  }

  export interface PeriodicHealthCheckupsDetailsStudentResponseDTO {
    id: string;
    periodicHealthCheckUpId: string;
    heightCm?: number;
    weightKg?: number;
    bmi?: number;
    pulseRate?: number;
    bloodPressure?: string;
    internalMedicineStatus?: string;
    surgeryStatus?: string;
    dermatologyStatus?: string;
    eyeRightScore?: number;
    eyeLeftScore?: number;
    eyePathology?: string;
    entstatus?: string;
    dentalOralStatus?: string;
    conclusion?: string;
    recommendations?: string;
    createdAt: string;
    updatedAt?: string;
    nextCheckupDate?: string; // ISO string
    status: string;
    createdBy: string;
    mssv: string;
  }

  // API Functions
  export const getAllHealthCheckups = async (
    page: number = 1,
    pageSize: number = 10,
    search?: string,
    sortBy: string = "CreatedAt",
    ascending: boolean = true,
    token?: string
  ): Promise<PagedResultDTO<PeriodicHealthCheckupsDetailsStudentResponseDTO>> => {
    try {
      const response = await axios.get(`${API_BASE_URL}/details-student`, {
        headers: { Authorization: `Bearer ${token || Cookies.get("token")}` },
        httpsAgent: new https.Agent({ rejectUnauthorized: false }),
        params: { page, pageSize, search, sortBy, ascending },
      });
      if (!response.data.isSuccess) {
        throw new Error(response.data.message || "Failed to fetch health checkups");
      }
      return response.data;
    } catch (error: any) {
      console.error("Error in getAllHealthCheckups:", error.response?.data || error.message);
      return {
        isSuccess: false,
        code: error.response?.status || 500,
        data: [],
        totalRecords: 0,
        page,
        pageSize,
        message: error.response?.data?.message || error.message || "Failed to fetch health checkups",
        responseFailed: error.response?.data?.responseFailed || "Unknown error",
      };
    }
  };

  export const getHealthCheckupById = async (
    id: string,
    token?: string
  ): Promise<ResultDTO<PeriodicHealthCheckupsDetailsStudentResponseDTO>> => {
    try {
      const response = await axios.get(`${API_BASE_URL}/details-student/${id}`, {
        headers: { Authorization: `Bearer ${token || Cookies.get("token")}` },
        httpsAgent: new https.Agent({ rejectUnauthorized: false }),
      });
      if (!response.data.isSuccess) {
        throw new Error(response.data.message || "Failed to fetch health checkup");
      }
      return response.data;
    } catch (error: any) {
      console.error("Error in getHealthCheckupById:", error.response?.data || error.message);
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
      throw new Error(error.response?.data?.message || `Failed to fetch health checkup: ${error.message}`);
    }
  };

  export const getHealthCheckupsByPeriodicId = async (
    periodicHealthCheckUpId: string,
    token?: string
  ): Promise<ResultDTO<PeriodicHealthCheckupsDetailsStudentResponseDTO[]>> => {
    try {
      const response = await axios.get(
        `${API_BASE_URL}/details-student/by-periodic-health-checkup/${periodicHealthCheckUpId}`,
        {
          headers: { Authorization: `Bearer ${token || Cookies.get("token")}` },
          httpsAgent: new https.Agent({ rejectUnauthorized: false }),
        }
      );
      if (!response.data.isSuccess) {
        throw new Error(response.data.message || "Failed to fetch health checkups by periodic ID");
      }
      return response.data;
    } catch (error: any) {
      console.error("Error in getHealthCheckupsByPeriodicId:", error.response?.data || error.message);
      if (error.response) {
        const errorData = error.response.data;
        return {
          isSuccess: false,
          code: error.response.status,
          data: null,
          message: errorData.message || "Failed to fetch health checkups by periodic ID",
          responseFailed: errorData.responseFailed || undefined,
        };
      }
      throw new Error(
        error.response?.data?.message || `Failed to fetch health checkups by periodic ID: ${error.message}`
      );
    }
  };

  

  export const createStudentHealthCheckup = async (
    request: PeriodicHealthCheckupsDetailsStudentRequestDTO,
    token?: string,
    signal?: AbortSignal
  ): Promise<ResultDTO<PeriodicHealthCheckupsDetailsStudentResponseDTO>> => {
    try {
      const response = await axios.post(`${API_BASE_URL}/details-student`, request, {
        headers: { Authorization: `Bearer ${token || Cookies.get("token")}` },
        httpsAgent: new https.Agent({ rejectUnauthorized: false }),
        signal, // Add cancellation support
      });
      if (!response.data.isSuccess) {
        throw new Error(response.data.message || "Failed to create health checkup");
      }
      return response.data;
    } catch (error: any) {
      if (axios.isCancel(error)) {
        throw new Error("Request cancelled");
      }
      console.error("Error in createHealthCheckup:", error.response?.data || error.message);
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
      throw new Error(error.response?.data?.message || `Failed to create health checkup: ${error.message}`);
    }
  };

  export const updateHealthCheckup = async (
    id: string,
    request: PeriodicHealthCheckupsDetailsStudentRequestDTO,
    token?: string
  ): Promise<ResultDTO<PeriodicHealthCheckupsDetailsStudentResponseDTO>> => {
    try {
      const response = await axios.put(`${API_BASE_URL}/details-student/${id}`, request, {
        headers: { Authorization: `Bearer ${token || Cookies.get("token")}` },
        httpsAgent: new https.Agent({ rejectUnauthorized: false }),
      });
      if (!response.data.isSuccess) {
        throw new Error(response.data.message || "Failed to update health checkup");
      }
      return response.data;
    } catch (error: any) {
      console.error("Error in updateHealthCheckup:", error.response?.data || error.message);
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
      throw new Error(error.response?.data?.message || `Failed to update health checkup: ${error.message}`);
    }
  };

  export const deleteHealthCheckup = async (
    id: string,
    token?: string
  ): Promise<ResultDTO<null>> => {
    try {
      const response = await axios.delete(`${API_BASE_URL}/details-student/${id}`, {
        headers: { Authorization: `Bearer ${token || Cookies.get("token")}` },
        httpsAgent: new https.Agent({ rejectUnauthorized: false }),
      });
      if (!response.data.isSuccess) {
        throw new Error(response.data.message || "Failed to delete health checkup");
      }
      return response.data;
    } catch (error: any) {
      console.error("Error in deleteHealthCheckup:", error.response?.data || error.message);
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
      throw new Error(error.response?.data?.message || `Failed to delete health checkup: ${error.message}`);
    }
  };

  export const getUpcomingHealthCheckups = async (
    daysAhead: number = 30,
    token?: string
  ): Promise<ResultDTO<PeriodicHealthCheckupsDetailsStudentResponseDTO[]>> => {
    try {
      const response = await axios.get(`${API_BASE_URL}/details-student/upcoming`, {
        headers: { Authorization: `Bearer ${token || Cookies.get("token")}` },
        httpsAgent: new https.Agent({ rejectUnauthorized: false }),
        params: { daysAhead },
      });
      if (!response.data.isSuccess) {
        throw new Error(response.data.message || "Failed to fetch upcoming health checkups");
      }
      return response.data;
    } catch (error: any) {
      console.error("Error in getUpcomingHealthCheckups:", error.response?.data || error.message);
      if (error.response) {
        const errorData = error.response.data;
        return {
          isSuccess: false,
          code: error.response.status,
          data: null,
          message: errorData.message || "Failed to fetch upcoming health checkups",
          responseFailed: errorData.responseFailed || undefined,
        };
      }
      throw new Error(
        error.response?.data?.message || `Failed to fetch upcoming health checkups: ${error.message}`
      );
    }
  };

  // Optional: Export to Excel (similar to appointments)
  export const exportHealthCheckupsToExcel = async (
    page: number = 1,
    pageSize: number = 10,
    search?: string,
    sortBy: string = "CreatedAt",
    ascending: boolean = true,
    token?: string
  ): Promise<void> => {
    try {
      const response = await axios.get(`${API_BASE_URL}/details-student/export`, {
        headers: { Authorization: `Bearer ${token || Cookies.get("token")}` },
        httpsAgent: new https.Agent({ rejectUnauthorized: false }),
        params: { page, pageSize, search, sortBy, ascending },
        responseType: "blob",
      });
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement("a");
      link.href = url;
      link.setAttribute("download", "student_health_checkups.xlsx");
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (error: any) {
      console.error("Error in exportHealthCheckupsToExcel:", error.response?.data || error.message);
      throw new Error(error.response?.data?.message || "Failed to export health checkups to Excel");
    }
  };

  export const getStudentHealthCheckupsByMssv = async (
    mssv: string,
    token?: string
  ): Promise<ResultDTO<UserResponseDTO>> => {
    try {
      const response = await axios.get(`${API_BASE_URL}/details-student/by-mssv/${mssv}`, {
        headers: { Authorization: `Bearer ${token || Cookies.get("token")}` },
        httpsAgent: new https.Agent({ rejectUnauthorized: false }),
      });
      console.log("API Response:", response.data); // Debug log
      if (!response.data.isSuccess) {
        throw new Error(response.data.message || "Failed to fetch student by MSSV");
      }
      return response.data;
    } catch (error: any) {
      console.error("Error in getStudentHealthCheckupsByMssv:", error.response?.data || error.message);
      if (error.response) {
        const errorData = error.response.data;
        return {
          isSuccess: false,
          code: error.response.status,
          data: null,
          message: errorData.message || "Failed to fetch student by MSSV",
          responseFailed: errorData.responseFailed || undefined,
        };
      }
      throw new Error(
        error.response?.data?.message || `Failed to fetch student by MSSV: ${error.message}`
      );
    }
  };