import api from "./customize-axios";
import { exportToExcel } from "./export";
import { toast } from "react-toastify";

// Common interfaces
export interface UserInfo {
  id: string;
  fullName: string;
  userName?: string;
  email: string;
  gender?: string;
  dob?: string;
  address?: string;
  phone?: string;
}

export interface StaffInfo {
  id: string;
  fullName: string;
  userName?: string;
  email: string;
}

export interface UpdatedByInfo {
  id: string;
  fullName: string;
  userName?: string;
  email: string;
}

export interface PerformedByInfo {
  id: string;
  fullName: string;
  userName?: string;
  email: string;
}

export interface HealthCheckResultInfo {
  id: string;
  healthCheckResultCode: string;
  user?: UserInfo;
  checkupDate: string;
}

export interface DrugInfo {
  id: string;
  drugCode: string;
  name: string;
}

// Prescription related interfaces
export interface PrescriptionDetailResponseDTO {
  id: string;
  drug?: DrugInfo;
  dosage: string;
  quantity: number;
  instructions: string;
}

export interface PrescriptionResponseDTO {
  id: string;
  prescriptionCode: string;
  healthCheckResult?: HealthCheckResultInfo;
  prescriptionDate: string;
  staff?: StaffInfo;
  createdAt: string;
  updatedAt?: string;
  updatedBy?: UpdatedByInfo;
  status?: string;
  prescriptionDetails: PrescriptionDetailResponseDTO[];
}

export interface PrescriptionInfo {
  id: string;
  prescriptionCode: string;
  healthCheckResult?: HealthCheckResultInfo;
  prescriptionDate: string;
}

export interface PrescriptionDetailsCreateRequestDTO {
  drugId: string;
  dosage: string;
  quantity: number;
  instructions: string;
}

export interface PrescriptionsCreateRequestDTO {
  healthCheckResultId: string;
  prescriptionDate: string;
  prescriptionDetails: PrescriptionDetailsCreateRequestDTO[];
}

export interface PrescriptionDetailUpdateRequestDTO {
  id: string;
  dosage: string;
  quantity: number;
  instructions: string;
}

export interface PrescriptionUpdateRequestDTO {
  prescriptionDetails: PrescriptionDetailUpdateRequestDTO[];
}

export interface PrescriptionStatisticsDTO {
  totalPrescriptions: number;
  totalDrugsPrescribed: number;
  averageDrugsPerPrescription: number;
  totalQuantityPrescribed: number;
  averageQuantityPerPrescription: number;
  prescriptionsByStatus: Record<string, number>;
  prescriptionsByMonth: Record<string, number>;
  prescriptionsByStaff: Record<string, number>;
  prescriptionsByUser: Record<string, number>;
  totalPrescriptionsRequiringFollowUp: number;
  prescriptionsByHealthCheckResultStatus: Record<string, number>;
}

export interface PrescriptionHistoryResponseDTO {
  id: string;
  prescription?: PrescriptionInfo;
  action: string;
  actionDate: string;
  performedBy?: PerformedByInfo;
  previousStatus?: string;
  newStatus?: string;
  changeDetails?: string;
}

export interface PrescriptionExportConfigDTO {
  exportAllPages: boolean;
  includePatient: boolean;
  includeHealthCheckCode: boolean;
  includePrescriptionCode: boolean;
  includePrescriptionDate: boolean;
  includeHealthcareStaff: boolean;
  includeMedications: boolean;
  includeStatus: boolean;
  includeCreatedAt: boolean;
  includeUpdatedAt: boolean;
  includeUpdatedBy: boolean;
}

export interface PrescriptionHistoryExportConfigDTO {
  exportAllPages: boolean;
  includePrescriptionCode: boolean;
  includeHealthCheckCode: boolean;
  includeActionDate: boolean;
  includePerformedBy: boolean;
  includePreviousStatus: boolean;
  includeNewStatus: boolean;
  includeChangeDetails: boolean;
}

// API Functions
export const getAllPrescriptions = async (
  page: number = 1,
  pageSize: number = 10,
  prescriptionCodeSearch?: string,
  healthCheckResultCodeSearch?: string,
  userSearch?: string,
  staffSearch?: string,
  drugSearch?: string,
  updatedBySearch?: string,
  sortBy: string = "PrescriptionDate",
  ascending: boolean = false,
  status?: string,
  prescriptionStartDate?: string,
  prescriptionEndDate?: string,
  createdStartDate?: string,
  createdEndDate?: string,
  updatedStartDate?: string,
  updatedEndDate?: string
) => {
  try {
    const response = await api.get("/prescription-management/prescriptions", {
      params: {
        page,
        pageSize,
        prescriptionCodeSearch,
        healthCheckResultCodeSearch,
        userSearch,
        staffSearch,
        drugSearch,
        updatedBySearch,
        sortBy,
        ascending,
        status,
        prescriptionStartDate,
        prescriptionEndDate,
        createdStartDate,
        createdEndDate,
        updatedStartDate,
        updatedEndDate,
      },
    });
    const data = response.data;
    // Map isSuccess to success if needed
    if (data.isSuccess !== undefined && data.success === undefined) {
      data.success = data.isSuccess;
    }
    return data;
  } catch (error) {
    console.error("Error fetching prescriptions:", error);
    throw error;
  }
};

export const getPrescriptionById = async (id: string) => {
  try {
    const response = await api.get(`/prescription-management/prescriptions/${id}`);
    const data = response.data;
    // Map isSuccess to success if needed
    if (data.isSuccess !== undefined && data.success === undefined) {
      data.success = data.isSuccess;
    }
    return data;
  } catch (error) {
    console.error("Error fetching prescription:", error);
    throw error;
  }
};

export const createPrescription = async (
  data: PrescriptionsCreateRequestDTO
) => {
  try {
    const response = await api.post("/prescription-management/prescriptions", data);
    const responseData = response.data;
    // Map isSuccess to success if needed
    if (responseData.isSuccess !== undefined && responseData.success === undefined) {
      responseData.success = responseData.isSuccess;
    }
    return responseData;
  } catch (error) {
    console.error("Error creating prescription:", error);
    throw error;
  }
};

export const updatePrescription = async (
  id: string,
  data: PrescriptionUpdateRequestDTO
) => {
  try {
    const response = await api.put(`/prescription-management/prescriptions/${id}`, data);
    const responseData = response.data;
    // Map isSuccess to success if needed
    if (responseData.isSuccess !== undefined && responseData.success === undefined) {
      responseData.success = responseData.isSuccess;
    }
    return responseData;
  } catch (error) {
    console.error("Error updating prescription:", error);
    throw error;
  }
};

export const cancelPrescription = async (id: string, reason: string) => {
  try {
    const response = await api.put(`/prescription-management/prescriptions/${id}/cancel`, JSON.stringify(reason), {
      headers: {
        'Content-Type': 'application/json'
      }
    });
    const data = response.data;
    // Map isSuccess to success if needed
    if (data.isSuccess !== undefined && data.success === undefined) {
      data.success = data.isSuccess;
    }
    return data;
  } catch (error) {
    console.error("Error cancelling prescription:", error);
    throw error;
  }
};

export const softDeletePrescriptions = async (prescriptionIds: string[]) => {
  try {
    const response = await api.put("/prescription-management/prescriptions/soft-delete", prescriptionIds);
    const data = response.data;
    // Map isSuccess to success if needed
    if (data.isSuccess !== undefined && data.success === undefined) {
      data.success = data.isSuccess;
    }
    return data;
  } catch (error) {
    console.error("Error soft deleting prescriptions:", error);
    throw error;
  }
};

export const restoreSoftDeletedPrescriptions = async (
  prescriptionIds: string[]
) => {
  try {
    const response = await api.put("/prescription-management/prescriptions/restore", prescriptionIds);
    const data = response.data;
    // Map isSuccess to success if needed
    if (data.isSuccess !== undefined && data.success === undefined) {
      data.success = data.isSuccess;
    }
    return data;
  } catch (error) {
    console.error("Error restoring prescriptions:", error);
    throw error;
  }
};

export const getPrescriptionStatistics = async () => {
  try {
    const response = await api.get("/prescription-management/prescriptions/statistics");
    const data = response.data;
    // Map isSuccess to success if needed
    if (data.isSuccess !== undefined && data.success === undefined) {
      data.success = data.isSuccess;
    }
    return data;
  } catch (error) {
    console.error("Error fetching prescription statistics:", error);
    throw error;
  }
};

export const getAllPrescriptionHistories = async (
  page: number = 1,
  pageSize: number = 10,
  action?: string,
  startActionDate?: string,
  endActionDate?: string,
  performedBySearch?: string,
  previousStatus?: string,
  newStatus?: string,
  sortBy: string = "ActionDate",
  ascending: boolean = false,
  prescriptionCode?: string,
  healthCheckResultCode?: string
) => {
  try {
    const response = await api.get("/prescription-management/prescription-histories", {
      params: {
        page,
        pageSize,
        action,
        startActionDate,
        endActionDate,
        performedBySearch,
        previousStatus,
        newStatus,
        sortBy,
        ascending,
        prescriptionCode,
        healthCheckResultCode,
      },
    });
    const data = response.data;
    // Map isSuccess to success if needed
    if (data.isSuccess !== undefined && data.success === undefined) {
      data.success = data.isSuccess;
    }
    return data;
  } catch (error) {
    console.error("Error fetching prescription histories:", error);
    throw error;
  }
};

export const getPrescriptionHistoryById = async (id: string) => {
  try {
    const response = await api.get(`/prescription-management/prescription-histories/${id}`);
    const data = response.data;
    // Map isSuccess to success if needed
    if (data.isSuccess !== undefined && data.success === undefined) {
      data.success = data.isSuccess;
    }
    return data;
  } catch (error) {
    console.error("Error fetching prescription history:", error);
    throw error;
  }
};

export const getPrescriptionHistoriesByPrescriptionId = async (
  prescriptionId: string
) => {
  try {
    const response = await api.get(`/prescription-management/prescriptions/${prescriptionId}/histories`);
    const data = response.data;
    // Map isSuccess to success if needed
    if (data.isSuccess !== undefined && data.success === undefined) {
      data.success = data.isSuccess;
    }
    return data;
  } catch (error) {
    console.error("Error fetching prescription histories:", error);
    throw error;
  }
};

export const exportPrescriptionToPDF = async (id: string) => {
  try {
    const response = await api.get(
      `/prescription-management/prescriptions/${id}/export-pdf`
    );

    if (response.data && response.data.isSuccess && response.data.data) {
      window.open(response.data.data, "_blank");
      toast.success("Prescription exported to PDF successfully");
    } else {
      toast.error(response.data.message || "Cannot export PDF file");
    }

    return response.data;
  } catch (error) {
    console.error("Error exporting prescription to PDF:", error);
    toast.error("Failed to export prescription to PDF");
    throw error;
  }
};

export const exportPrescriptionsToExcelWithConfig = async (
  config: PrescriptionExportConfigDTO,
  page: number = 1,
  pageSize: number = 10,
  prescriptionCodeSearch?: string,
  healthCheckResultCodeSearch?: string,
  userSearch?: string,
  staffSearch?: string,
  drugSearch?: string,
  updatedBySearch?: string,
  sortBy: string = "PrescriptionDate",
  ascending: boolean = false,
  status?: string,
  prescriptionStartDate?: string,
  prescriptionEndDate?: string,
  createdStartDate?: string,
  createdEndDate?: string,
  updatedStartDate?: string,
  updatedEndDate?: string
) => {
  try {
    const response = await api.post(
      "/prescription-management/prescriptions/export-excel-config",
      config,
      {
        params: {
          page,
          pageSize,
          prescriptionCodeSearch,
          healthCheckResultCodeSearch,
          userSearch,
          staffSearch,
          drugSearch,
          updatedBySearch,
          sortBy,
          ascending,
          status,
          prescriptionStartDate,
          prescriptionEndDate,
          createdStartDate,
          createdEndDate,
          updatedStartDate,
          updatedEndDate,
        },
        headers: {
          'Content-Type': 'application/json'
        }
      }
    );

    if (response.data && response.data.isSuccess && response.data.data) {
      window.open(response.data.data, "_blank");
      toast.success("Prescriptions exported to Excel successfully");
    } else {
      toast.error(response.data.message || "Cannot export Excel file");
    }

    return response.data;
  } catch (error: any) {
    console.error("Export error:", error);
    toast.error(error.response?.data?.message || "Cannot export Excel file");
    throw error;
  }
};

export const exportPrescriptionHistoriesToExcelWithConfig = async (
  config: PrescriptionHistoryExportConfigDTO,
  page: number = 1,
  pageSize: number = 10,
  action?: string,
  startActionDate?: string,
  endActionDate?: string,
  performedBySearch?: string,
  previousStatus?: string,
  newStatus?: string,
  sortBy: string = "ActionDate",
  ascending: boolean = false,
  prescriptionCode?: string,
  healthCheckResultCode?: string
) => {
  try {
    const response = await api.post(
      "/prescription-management/prescription-histories/export-excel-config",
      config,
      {
        params: {
          page,
          pageSize,
          action,
          startActionDate,
          endActionDate,
          performedBySearch,
          previousStatus,
          newStatus,
          sortBy,
          ascending,
          prescriptionCode,
          healthCheckResultCode,
        },
        headers: {
          'Content-Type': 'application/json'
        }
      }
    );

    if (response.data && response.data.isSuccess && response.data.data) {
      window.open(response.data.data, "_blank");
      toast.success("Prescription histories exported to Excel successfully");
    } else {
      toast.error(response.data.message || "Cannot export Excel file");
    }

    return response.data;
  } catch (error: any) {
    console.error("Export error:", error);
    toast.error(error.response?.data?.message || "Cannot export Excel file");
    throw error;
  }
};

export const getDrugsByHealthCheckResultId = async (healthCheckResultId: string) => {
  try {
    const response = await api.get(`/prescription-management/prescriptions/health-check-result/${healthCheckResultId}/drugs`);
    const data = response.data;
    // Map isSuccess to success if needed
    if (data.isSuccess !== undefined && data.success === undefined) {
      data.success = data.isSuccess;
    }
    return data;
  } catch (error) {
    console.error("Error fetching drugs from prescriptions:", error);
    return {
      success: false,
      isSuccess: false,
      message: "Failed to fetch drugs from prescriptions",
      data: []
    };
  }
};
