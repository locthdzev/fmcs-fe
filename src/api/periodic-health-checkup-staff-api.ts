import axios from "axios";
import Cookies from "js-cookie";
import https from "https";

// Base URL for Periodic Health Checkup Staff API
const API_BASE_URL = "http://localhost:5104/api/periodic-health-checkups-details-staff-management";

// Reusing existing ResultDTO and PagedResultDTO
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

// DTO Interfaces for Periodic Health Checkups Staff (mapped from C# DTOs)
export interface PeriodicHealthCheckupsDetailsStaffRequestDTO {
  periodicHealthCheckUpId: string;
  hospitalName: string;
  reportIssuanceDate: string; // ISO string (e.g., "2025-03-30")
  hospitalReportUrl?: string;
  completeBloodCount?: string;
  completeUrinalysis?: string;
  bloodGlucose?: number;
  hbA1c?: number;
  uricAcid?: number;
  triglycerides?: number;
  cholesterol?: number;
  hdl?: number;
  ldl?: number;
  sgot?: number;
  sgpt?: number;
  ggt?: number;
  urea?: number;
  creatinine?: number;
  hbsAg?: boolean;
  hbsAb?: boolean;
  hcvab?: boolean;
  antiHavigM?: boolean;
  hiv?: boolean;
  serumIron?: number;
  thyroidT3?: number;
  thyroidFt4?: number;
  thyroidTsh?: number;
  bloodType?: string;
  rhType?: string;
  totalCalcium?: number;
  liverAfp?: number;
  prostatePsa?: number;
  colonCea?: number;
  stomachCa724?: number;
  pancreasCa199?: number;
  breastCa153?: number;
  ovariesCa125?: number;
  lungCyfra211?: number;
  ferritin?: number;
  toxocaraCanis?: boolean;
  rf?: number;
  electrolytesNa?: number;
  electrolytesK?: number;
  electrolytesCl?: number;
  generalExam?: string;
  eyeExam?: string;
  dentalExam?: string;
  entexam?: string;
  gynecologicalExam?: string;
  vaginalWetMount?: string;
  cervicalCancerPap?: string;
  abdominalUltrasound?: string;
  thyroidUltrasound?: string;
  breastUltrasound?: string;
  ecg?: string;
  chestXray?: string;
  lumbarSpineXray?: string;
  cervicalSpineXray?: string;
  refractiveError?: string;
  dopplerHeart?: string;
  carotidDoppler?: string;
  transvaginalUltrasound?: string;
  boneDensityTscore?: number;
  echinococcus?: boolean;
  conclusion?: string;
  recommendations?: string;
  status?: string;
  createdBy?: string;
  dermatologyExam?: string;
}

export interface PeriodicHealthCheckupsDetailsStaffResponseDTO {
  id: string;
  periodicHealthCheckUpId: string;
  hospitalName: string;
  reportIssuanceDate: string; // ISO string
  hospitalReportUrl?: string;
  completeBloodCount?: string;
  completeUrinalysis?: string;
  bloodGlucose?: number;
  hbA1c?: number;
  uricAcid?: number;
  triglycerides?: number;
  cholesterol?: number;
  hdl?: number;
  ldl?: number;
  sgot?: number;
  sgpt?: number;
  ggt?: number;
  urea?: number;
  creatinine?: number;
  hbsAg?: boolean;
  hbsAb?: boolean;
  hcvab?: boolean;
  antiHavigM?: boolean;
  hiv?: boolean;
  serumIron?: number;
  thyroidT3?: number;
  thyroidFt4?: number;
  thyroidTsh?: number;
  bloodType?: string;
  rhType?: string;
  totalCalcium?: number;
  liverAfp?: number;
  prostatePsa?: number;
  colonCea?: number;
  stomachCa724?: number;
  pancreasCa199?: number;
  breastCa153?: number;
  ovariesCa125?: number;
  lungCyfra211?: number;
  ferritin?: number;
  toxocaraCanis?: boolean;
  rf?: number;
  electrolytesNa?: number;
  electrolytesK?: number;
  electrolytesCl?: number;
  generalExam?: string;
  eyeExam?: string;
  dentalExam?: string;
  entexam?: string;
  gynecologicalExam?: string;
  vaginalWetMount?: string;
  cervicalCancerPap?: string;
  abdominalUltrasound?: string;
  thyroidUltrasound?: string;
  breastUltrasound?: string;
  ecg?: string;
  chestXray?: string;
  lumbarSpineXray?: string;
  cervicalSpineXray?: string;
  refractiveError?: string;
  dopplerHeart?: string;
  carotidDoppler?: string;
  transvaginalUltrasound?: string;
  boneDensityTscore?: number;
  echinococcus?: boolean;
  conclusion?: string;
  recommendations?: string;
  createdAt: string; // ISO string
  createdBy: string;
  updatedAt?: string; // ISO string
  updatedBy?: string;
  status: string;
  dermatologyExam?: string;
}

// API Functions
export const getAllStaffHealthCheckups = async (
  page: number = 1,
  pageSize: number = 10,
  search?: string,
  sortBy: string = "CreatedAt",
  ascending: boolean = true,
  token?: string
): Promise<PagedResultDTO<PeriodicHealthCheckupsDetailsStaffResponseDTO>> => {
  try {
    const response = await axios.get(`${API_BASE_URL}/details-staff`, {
      headers: { Authorization: `Bearer ${token || Cookies.get("token")}` },
      httpsAgent: new https.Agent({ rejectUnauthorized: false }),
      params: { page, pageSize, search, sortBy, ascending },
    });
    console.log('Staff Health Checkups Raw Response:', response.data);
    console.log('ENT Exam in first record:', response.data.data[0]?.entexam);
    if (!response.data.isSuccess) {
      throw new Error(response.data.message || "Failed to fetch staff health checkups");
    }
    return response.data;
  } catch (error: any) {
    console.error("Error in getAllStaffHealthCheckups:", error.response?.data || error.message);
    return {
      isSuccess: false,
      code: error.response?.status || 500,
      data: [],
      totalRecords: 0,
      page,
      pageSize,
      message: error.response?.data?.message || error.message || "Failed to fetch staff health checkups",
      responseFailed: error.response?.data?.responseFailed || "Unknown error",
    };
  }
};

export const getStaffHealthCheckupById = async (
  id: string,
  token?: string
): Promise<ResultDTO<PeriodicHealthCheckupsDetailsStaffResponseDTO>> => {
  try {
    const response = await axios.get(`${API_BASE_URL}/details-staff/${id}`, {
      headers: { Authorization: `Bearer ${token || Cookies.get("token")}` },
      httpsAgent: new https.Agent({ rejectUnauthorized: false }),
    });
    console.log('Staff Health Checkup by ID Raw Response:', response.data);
    console.log('ENT Exam:', response.data.data?.entexam);
    if (!response.data.isSuccess) {
      throw new Error(response.data.message || "Failed to fetch staff health checkup");
    }
    return response.data;
  } catch (error: any) {
    console.error("Error in getStaffHealthCheckupById:", error.response?.data || error.message);
    if (error.response) {
      const errorData = error.response.data;
      return {
        isSuccess: false,
        code: error.response.status,
        data: null,
        message: errorData.message || "Failed to fetch staff health checkup",
        responseFailed: errorData.responseFailed || undefined,
      };
    }
    throw new Error(error.response?.data?.message || `Failed to fetch staff health checkup: ${error.message}`);
  }
};

export const getStaffHealthCheckupsByPeriodicId = async (
  periodicHealthCheckUpId: string,
  token?: string
): Promise<ResultDTO<PeriodicHealthCheckupsDetailsStaffResponseDTO[]>> => {
  try {
    const response = await axios.get(
      `${API_BASE_URL}/details-staff/by-periodic-health-checkup/${periodicHealthCheckUpId}`,
      {
        headers: { Authorization: `Bearer ${token || Cookies.get("token")}` },
        httpsAgent: new https.Agent({ rejectUnauthorized: false }),
      }
    );
    if (!response.data.isSuccess) {
      throw new Error(response.data.message || "Failed to fetch staff health checkups by periodic ID");
    }
    return response.data;
  } catch (error: any) {
    console.error("Error in getStaffHealthCheckupsByPeriodicId:", error.response?.data || error.message);
    if (error.response) {
      const errorData = error.response.data;
      return {
        isSuccess: false,
        code: error.response.status,
        data: null,
        message: errorData.message || "Failed to fetch staff health checkups by periodic ID",
        responseFailed: errorData.responseFailed || undefined,
      };
    }
    throw new Error(
      error.response?.data?.message || `Failed to fetch staff health checkups by periodic ID: ${error.message}`
    );
  }
};

export const createStaffHealthCheckup = async (
  request: PeriodicHealthCheckupsDetailsStaffRequestDTO,
  token?: string,
  signal?: AbortSignal
): Promise<ResultDTO<PeriodicHealthCheckupsDetailsStaffResponseDTO>> => {
  try {
    const response = await axios.post(`${API_BASE_URL}/details-staff`, request, {
      headers: { Authorization: `Bearer ${token || Cookies.get("token")}` },
      httpsAgent: new https.Agent({ rejectUnauthorized: false }),
      signal, // Add signal for cancellation
    });
    if (!response.data.isSuccess) {
      throw new Error(response.data.message || "Failed to create staff health checkup");
    }
    return response.data;
  } catch (error: any) {
    if (error.name === "AbortError") {
      return {
        isSuccess: false,
        code: 0,
        data: null,
        message: "Request was cancelled",
      };
    }
    console.error("Error in createStaffHealthCheckup:", error.response?.data || error.message);
    if (error.response) {
      const errorData = error.response.data;
      return {
        isSuccess: false,
        code: error.response.status,
        data: null,
        message: errorData.message || "Failed to create staff health checkup",
        responseFailed: errorData.responseFailed || undefined,
      };
    }
    throw new Error(error.response?.data?.message || `Failed to create staff health checkup: ${error.message}`);
  }
};

export const updateStaffHealthCheckup = async (
  id: string,
  request: PeriodicHealthCheckupsDetailsStaffRequestDTO,
  token?: string
): Promise<ResultDTO<PeriodicHealthCheckupsDetailsStaffResponseDTO>> => {
  try {
    console.log("Calling updateStaffHealthCheckup with ID:", id, "and data:", request);
    const response = await axios.put(`${API_BASE_URL}/details-staff/${id}`, request, {
      headers: { Authorization: `Bearer ${token || Cookies.get("token")}` },
      httpsAgent: new https.Agent({ rejectUnauthorized: false }),
    });
    console.log("Raw API response:", response.data);
    if (!response.data.isSuccess) {
      throw new Error(response.data.message || "Failed to update staff health checkup");
    }
    return response.data;
  } catch (error: any) {
    console.error("Error in updateStaffHealthCheckup:", error.response?.data || error.message);
    if (error.response) {
      const errorData = error.response.data;
      return {
        isSuccess: false,
        code: error.response.status,
        data: null,
        message: errorData.message || "Failed to update staff health checkup",
        responseFailed: errorData.responseFailed || undefined,
      };
    }
    throw error; // Re-throw to ensure it’s caught in handleSubmit
  }
};

export const deleteStaffHealthCheckup = async (
  id: string,
  token?: string
): Promise<ResultDTO<null>> => {
  try {
    const response = await axios.delete(`${API_BASE_URL}/details-staff/${id}`, {
      headers: { Authorization: `Bearer ${token || Cookies.get("token")}` },
      httpsAgent: new https.Agent({ rejectUnauthorized: false }),
    });
    if (!response.data.isSuccess) {
      throw new Error(response.data.message || "Failed to delete staff health checkup");
    }
    return response.data;
  } catch (error: any) {
    console.error("Error in deleteStaffHealthCheckup:", error.response?.data || error.message);
    if (error.response) {
      const errorData = error.response.data;
      return {
        isSuccess: false,
        code: error.response.status,
        data: null,
        message: errorData.message || "Failed to delete staff health checkup",
        responseFailed: errorData.responseFailed || undefined,
      };
    }
    throw new Error(error.response?.data?.message || `Failed to delete staff health checkup: ${error.message}`);
  }
};

export const getStaffHealthCheckupByEmail = async (
  email: string,
  token?: string
): Promise<ResultDTO<UserResponseDTO>> => {
  try {
    const response = await axios.get(
      `${API_BASE_URL}/details-staff/by-email/${encodeURIComponent(email)}`,
      {
        headers: { Authorization: `Bearer ${token || Cookies.get("token")}` },
        httpsAgent: new https.Agent({ rejectUnauthorized: false }),
      }
    );
    
    if (!response.data.isSuccess) {
      throw new Error(response.data.message || "Failed to fetch user by email");
    }
    
    return response.data;
  } catch (error: any) {
    console.error("Error in getStaffHealthCheckupByEmail:", error.response?.data || error.message);
    if (error.response) {
      const errorData = error.response.data;
      return {
        isSuccess: false,
        code: error.response.status,
        data: null,
        message: errorData.message || "Failed to fetch user by email",
        responseFailed: errorData.responseFailed || undefined,
      };
    }
    throw new Error(
      error.response?.data?.message || `Failed to fetch user by email: ${error.message}`
    );
  }
};

// Optional: Export to Excel
export const exportStaffHealthCheckupsToExcel = async (
  page: number = 1,
  pageSize: number = 10,
  search?: string,
  sortBy: string = "CreatedAt",
  ascending: boolean = true,
  token?: string
): Promise<void> => {
  try {
    const response = await axios.get(`${API_BASE_URL}/details-staff/export`, {
      headers: { Authorization: `Bearer ${token || Cookies.get("token")}` },
      httpsAgent: new https.Agent({ rejectUnauthorized: false }),
      params: { page, pageSize, search, sortBy, ascending },
      responseType: "blob",
    });
    const url = window.URL.createObjectURL(new Blob([response.data]));
    const link = document.createElement("a");
    link.href = url;
    link.setAttribute("download", "staff_health_checkups.xlsx");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  } catch (error: any) {
    console.error("Error in exportStaffHealthCheckupsToExcel:", error.response?.data || error.message);
    throw new Error(error.response?.data?.message || "Failed to export staff health checkups to Excel");
  }
};