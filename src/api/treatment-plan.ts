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

export interface CreatedByInfo {
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

// TreatmentPlan related interfaces
export interface TreatmentPlanResponseDTO {
  id: string;
  treatmentPlanCode: string;
  healthCheckResult?: HealthCheckResultInfo;
  drug?: DrugInfo;
  treatmentDescription: string;
  instructions: string;
  startDate: string;
  endDate: string;
  createdAt: string;
  updatedAt?: string;
  createdBy?: CreatedByInfo;
  updatedBy?: UpdatedByInfo;
  status?: string;
}

export interface TreatmentPlanCreateRequestDTO {
  healthCheckResultId: string;
  drugId: string;
  treatmentDescription: string;
  instructions: string;
  startDate: string;
  endDate: string;
}

export interface TreatmentPlanUpdateRequestDTO {
  treatmentDescription?: string;
  instructions?: string;
  startDate?: string;
  endDate?: string;
}

export interface TreatmentPlanStatisticsDTO {
  totalTreatmentPlans: number;
  totalActiveTreatmentPlans: number;
  totalCompletedTreatmentPlans: number;
  totalCancelledTreatmentPlans: number;
  treatmentPlansByStatus: Record<string, number>;
  treatmentPlansByMonth: Record<string, number>;
  treatmentPlansByDrug: Record<string, number>;
  treatmentPlansByUser: Record<string, number>;
}

export interface TreatmentPlanHistoryResponseDTO {
  id: string;
  treatmentPlan?: TreatmentPlanInfo;
  action: string;
  actionDate: string;
  performedBy?: PerformedByInfo;
  previousStatus?: string;
  newStatus?: string;
  changeDetails?: string;
}

export interface TreatmentPlanInfo {
  id: string;
  treatmentPlanCode: string;
  healthCheckResult?: HealthCheckResultInfo;
}

export interface TreatmentPlanExportConfigDTO {
  exportAllPages: boolean;
  includePatient: boolean;
  includeHealthCheckCode: boolean;
  includeDrug: boolean;
  includeTreatmentDescription: boolean;
  includeInstructions: boolean;
  includeStartDate: boolean;
  includeEndDate: boolean;
  includeCreatedAt: boolean;
  includeCreatedBy: boolean;
  includeUpdatedAt: boolean;
  includeUpdatedBy: boolean;
  includeStatus: boolean;
}

export interface TreatmentPlanHistoryExportConfigDTO {
  exportAllPages: boolean;
  includeTreatmentPlanCode: boolean;
  includeHealthCheckCode: boolean;
  includePatient: boolean;
  includeAction: boolean;
  includeActionDate: boolean;
  includePerformedBy: boolean;
  includePreviousStatus: boolean;
  includeNewStatus: boolean;
  includeChangeDetails: boolean;
}

// API Functions
export const getAllTreatmentPlans = async (
  page: number = 1,
  pageSize: number = 10,
  treatmentPlanCodeSearch?: string,
  healthCheckResultCodeSearch?: string,
  userSearch?: string,
  drugSearch?: string,
  updatedBySearch?: string,
  sortBy: string = "StartDate",
  ascending: boolean = false,
  status?: string,
  startDate?: string,
  endDate?: string,
  createdStartDate?: string,
  createdEndDate?: string,
  updatedStartDate?: string,
  updatedEndDate?: string
) => {
  try {
    const response = await api.get("/treatment-plan-management/treatment-plans", {
      params: {
        page,
        pageSize,
        treatmentPlanCodeSearch,
        healthCheckResultCodeSearch,
        userSearch,
        drugSearch,
        updatedBySearch,
        sortBy,
        ascending,
        status,
        startDate,
        endDate,
        createdStartDate,
        createdEndDate,
        updatedStartDate,
        updatedEndDate,
      },
    });
    const data = response.data;
    if (data.isSuccess !== undefined && data.success === undefined) {
      data.success = data.isSuccess;
    }
    return data;
  } catch (error) {
    console.error("Error fetching treatment plans:", error);
    throw error;
  }
};

export const getTreatmentPlanById = async (id: string) => {
  try {
    const response = await api.get(`/treatment-plan-management/treatment-plans/${id}`);
    const data = response.data;
    if (data.isSuccess !== undefined && data.success === undefined) {
      data.success = data.isSuccess;
    }
    return data;
  } catch (error) {
    console.error("Error fetching treatment plan:", error);
    throw error;
  }
};

export const createTreatmentPlan = async (data: TreatmentPlanCreateRequestDTO) => {
  try {
    const response = await api.post("/treatment-plan-management/treatment-plans", data);
    const responseData = response.data;
    if (responseData.isSuccess !== undefined && responseData.success === undefined) {
      responseData.success = responseData.isSuccess;
    }
    return responseData;
  } catch (error) {
    console.error("Error creating treatment plan:", error);
    throw error;
  }
};

export const updateTreatmentPlan = async (
  id: string,
  data: TreatmentPlanUpdateRequestDTO
) => {
  try {
    const response = await api.put(`/treatment-plan-management/treatment-plans/${id}`, data);
    const responseData = response.data;
    if (responseData.isSuccess !== undefined && responseData.success === undefined) {
      responseData.success = responseData.isSuccess;
    }
    return responseData;
  } catch (error) {
    console.error("Error updating treatment plan:", error);
    throw error;
  }
};

export const cancelTreatmentPlan = async (id: string, reason: string) => {
  try {
    const response = await api.put(
      `/treatment-plan-management/treatment-plans/${id}/cancel`,
      JSON.stringify(reason),
      {
        headers: {
          'Content-Type': 'application/json'
        }
      }
    );
    const data = response.data;
    if (data.isSuccess !== undefined && data.success === undefined) {
      data.success = data.isSuccess;
    }
    return data;
  } catch (error) {
    console.error("Error cancelling treatment plan:", error);
    throw error;
  }
};

export const softDeleteTreatmentPlans = async (treatmentPlanIds: string[]) => {
  try {
    const response = await api.put("/treatment-plan-management/treatment-plans/soft-delete", treatmentPlanIds);
    const data = response.data;
    if (data.isSuccess !== undefined && data.success === undefined) {
      data.success = data.isSuccess;
    }
    return data;
  } catch (error) {
    console.error("Error soft deleting treatment plans:", error);
    throw error;
  }
};

export const restoreSoftDeletedTreatmentPlans = async (treatmentPlanIds: string[]) => {
  try {
    const response = await api.put("/treatment-plan-management/treatment-plans/restore", treatmentPlanIds);
    const data = response.data;
    if (data.isSuccess !== undefined && data.success === undefined) {
      data.success = data.isSuccess;
    }
    return data;
  } catch (error) {
    console.error("Error restoring treatment plans:", error);
    throw error;
  }
};

export const getTreatmentPlanStatistics = async (startDate?: Date, endDate?: Date) => {
  try {
    let url = "/treatment-plan-management/treatment-plans/statistics";
    
    // Add query parameters if dates are provided
    if (startDate || endDate) {
      const params = new URLSearchParams();
      if (startDate) {
        params.append('startDate', startDate.toISOString());
      }
      if (endDate) {
        params.append('endDate', endDate.toISOString());
      }
      url += `?${params.toString()}`;
    }
    
    const response = await api.get(url);
    const data = response.data;
    if (data.isSuccess !== undefined && data.success === undefined) {
      data.success = data.isSuccess;
    }
    return data;
  } catch (error) {
    console.error("Error fetching treatment plan statistics:", error);
    throw error;
  }
};

export const getAllTreatmentPlanHistories = async (
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
  treatmentPlanCode?: string,
  healthCheckResultCode?: string
) => {
  try {
    const response = await api.get("/treatment-plan-management/treatment-plan-histories", {
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
        treatmentPlanCode,
        healthCheckResultCode,
      },
    });
    const data = response.data;
    if (data.isSuccess !== undefined && data.success === undefined) {
      data.success = data.isSuccess;
    }
    return data;
  } catch (error) {
    console.error("Error fetching treatment plan histories:", error);
    throw error;
  }
};

export const getTreatmentPlanHistoriesByTreatmentPlanId = async (treatmentPlanId: string) => {
  try {
    const response = await api.get(`/treatment-plan-management/treatment-plans/${treatmentPlanId}/histories`);
    const data = response.data;
    if (data.isSuccess !== undefined && data.success === undefined) {
      data.success = data.isSuccess;
    }
    return data;
  } catch (error) {
    console.error("Error fetching treatment plan histories:", error);
    throw error;
  }
};

export const exportTreatmentPlanToPDF = async (id: string) => {
  try {
    const response = await api.get(`/treatment-plan-management/treatment-plans/${id}/export-pdf`);

    if (response.data && response.data.isSuccess && response.data.data) {
      window.open(response.data.data, "_blank");
      toast.success("Treatment plan exported to PDF successfully");
    } else {
      toast.error(response.data.message || "Cannot export PDF file");
    }

    return response.data;
  } catch (error) {
    console.error("Error exporting treatment plan to PDF:", error);
    toast.error("Failed to export treatment plan to PDF");
    throw error;
  }
};

export const exportTreatmentPlansToExcelWithConfig = async (
  config: TreatmentPlanExportConfigDTO,
  page: number = 1,
  pageSize: number = 10,
  treatmentPlanCodeSearch?: string,
  healthCheckResultCodeSearch?: string,
  userSearch?: string,
  drugSearch?: string,
  updatedBySearch?: string,
  sortBy: string = "StartDate",
  ascending: boolean = false,
  status?: string,
  startDate?: string,
  endDate?: string,
  createdStartDate?: string,
  createdEndDate?: string,
  updatedStartDate?: string,
  updatedEndDate?: string
) => {
  try {
    const response = await api.post(
      "/treatment-plan-management/treatment-plans/export-excel-config",
      config,
      {
        params: {
          page,
          pageSize,
          treatmentPlanCodeSearch,
          healthCheckResultCodeSearch,
          userSearch,
          drugSearch,
          updatedBySearch,
          sortBy,
          ascending,
          status,
          startDate,
          endDate,
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
      toast.success("Treatment plans exported to Excel successfully");
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

export const exportTreatmentPlanHistoriesToExcelWithConfig = async (
  config: TreatmentPlanHistoryExportConfigDTO,
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
  treatmentPlanCode?: string,
  healthCheckResultCode?: string
) => {
  try {
    const response = await api.post(
      "/treatment-plan-management/treatment-plan-histories/export-excel-config",
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
          treatmentPlanCode,
          healthCheckResultCode,
        },
        headers: {
          'Content-Type': 'application/json'
        }
      }
    );

    if (response.data && response.data.isSuccess && response.data.data) {
      window.open(response.data.data, "_blank");
      toast.success("Treatment plan histories exported to Excel successfully");
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