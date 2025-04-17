import api from "./customize-axios";
import { exportToExcel } from "./export";
import { toast } from "react-toastify";

export interface UserInfo {
  id: string;
  userName: string;
  fullName: string;
  email: string;
  gender?: string;
  dob?: string;
  address?: string;
  phone?: string;
}

export interface StaffInfo {
  id: string;
  userName: string;
  fullName: string;
  email: string;
}

export interface HealthCheckResultsDetailDTO {
  id: string;
  healthCheckResultId: string;
  resultSummary: string;
  diagnosis: string;
  recommendations: string;
  status: string;
}

export interface HealthCheckResultsDetailRequestDTO {
  resultSummary: string;
  diagnosis: string;
  recommendations: string;
}

export interface HealthCheckResultsDetailCreateRequestDTO {
  resultSummary: string;
  diagnosis: string;
  recommendations: string;
}

export interface PrescriptionInfo {
  id: string;
  prescriptionDate: string;
  status: string;
  totalMedicines: number;
}

export interface TreatmentPlanInfo {
  id: string;
  treatmentDescription: string;
  startDate: string;
  endDate: string;
  status: string;
  daysRemaining: number;
}

export interface HealthCheckResultsResponseDTO {
  id: string;
  healthCheckResultCode: string;
  userId: string;
  user: {
    id: string;
    fullName: string;
    email: string;
  };
  staffId: string;
  staff: {
    id: string;
    fullName: string;
    email: string;
  };
  checkupDate: string;
  healthCheckupTemplateId: string;
  status: string;
  followUpRequired: boolean;
  followUpDate?: string;
  approvedDate?: string;
  approvedBy?: string;
  rejectionReason?: string;
  cancellationReason?: string;
  cancelledDate?: string;
  cancelledBy?: string;
  softDeletedBy?: string;
  softDeletedDate?: string;
  createdAt: string;
  updatedAt: string;
  diagnosis?: string;
  treatmentPlan?: string;
  notes?: string;
}

export interface HealthCheckResultsIdResponseDTO {
  id: string;
  healthCheckResultCode: string;
  userId: string;
  user: UserInfo;
  checkupDate: string;
  staffId: string;
  staff: StaffInfo;
  followUpRequired?: boolean;
  followUpDate?: string;
  createdAt: string;
  updatedAt?: string;
  updatedBy?: string;
  updatedByUser?: StaffInfo;
  status: string;
  healthCheckResultDetails: HealthCheckResultsDetailDTO[];
  prescriptions: PrescriptionInfo[];
  treatmentPlans: TreatmentPlanInfo[];
}

export interface HealthCheckResultsCreateRequestDTO {
  userId: string;
  checkupDate: string;
  followUpRequired?: boolean;
  followUpDate?: string;
  healthCheckResultDetails: HealthCheckResultsDetailCreateRequestDTO[];
}

export interface HealthCheckResultsUpdateWithIdRequestDTO {
  followUpRequired?: boolean;
  followUpDate?: string;
  healthCheckResultDetails: HealthCheckResultsDetailRequestDTO[];
}

export interface HealthCheckResultsStatisticsDTO {
  totalResults: number;
  statusDistribution: {
    waitingForApproval: number;
    followUpRequired: number;
    noFollowUpRequired: number;
    completed: number;
    cancelledCompletely: number;
    cancelledForAdjustment: number;
    softDeleted: number;
  };
  followUpStatistics: {
    totalFollowUps: number;
    upcomingFollowUps: number;
    overdueFollowUps: number;
    followUpsToday: number;
  };
  monthlyDistribution: {
    year: number;
    month: number;
    count: number;
  }[];
}

export interface HealthCheckResultHistoryResponseDTO {
  id: string;
  healthCheckResultId: string;
  healthCheckResultCode: string;
  action: string;
  actionDate: string;
  performedBy: StaffInfo;
  previousStatus?: string;
  newStatus?: string;
  rejectionReason?: string;
  changeDetails?: string;
}

export interface HealthCheckResultHistoryExportConfigDTO {
  exportAllPages: boolean;
  includeAction: boolean;
  includeActionDate: boolean;
  includePerformedBy: boolean;
  includePreviousStatus: boolean;
  includeNewStatus: boolean;
  includeRejectionReason: boolean;
  includeChangeDetails: boolean;
  groupByHealthCheckResultCode: boolean;
}

export interface HealthCheckResultExportConfigDTO {
  exportAllPages: boolean;
  includeCode: boolean;
  includeUser: boolean;
  includeStaff: boolean;
  includeCheckupDate: boolean;
  includeFollowUp: boolean;
  includeStatus: boolean;
  includeCreatedAt: boolean;
  includeUpdatedAt: boolean;
  includeDetails: boolean;
}

// API Functions
export const getAllHealthCheckResults = async (
  page: number = 1,
  pageSize: number = 10,
  codeSearch?: string,
  userSearch?: string,
  staffSearch?: string,
  sortBy: string = "CheckupDate",
  ascending: boolean = false,
  status?: string,
  checkupStartDate?: string,
  checkupEndDate?: string,
  followUpRequired?: boolean,
  followUpStartDate?: string,
  followUpEndDate?: string,
  followUpStatus?: string
) => {
  try {
    const response = await api.get(
      "/healthcheckresult-management/healthcheckresults",
      {
        params: {
          page,
          pageSize,
          codeSearch,
          userSearch,
          staffSearch,
          sortBy,
          ascending,
          status,
          checkupStartDate,
          checkupEndDate,
          followUpRequired,
          followUpStartDate,
          followUpEndDate,
          followUpStatus,
        },
      }
    );
    const data = response.data;
    // Map isSuccess to success
    if (data.isSuccess !== undefined && data.success === undefined) {
      data.success = data.isSuccess;
    }
    return data;
  } catch (error) {
    console.error("Error fetching health check results:", error);
    throw error;
  }
};

export const getHealthCheckResultById = async (id: string) => {
  try {
    const response = await api.get(
      `/healthcheckresult-management/healthcheckresults/${id}`
    );
    const data = response.data;
    // Map isSuccess to success
    if (data.isSuccess !== undefined && data.success === undefined) {
      data.success = data.isSuccess;
    }
    return data;
  } catch (error) {
    console.error("Error fetching health check result:", error);
    throw error;
  }
};

export const createHealthCheckResult = async (
  data: HealthCheckResultsCreateRequestDTO
) => {
  const response = await api.post(
    "/healthcheckresult-management/healthcheckresults",
    data
  );
  return response.data;
};

export const updateHealthCheckResult = async (
  id: string,
  data: HealthCheckResultsUpdateWithIdRequestDTO
) => {
  const response = await api.put(
    `/healthcheckresult-management/healthcheckresults/${id}`,
    data
  );
  return response.data;
};

export const scheduleFollowUp = async (id: string, followUpDate: string) => {
  const response = await api.put(
    `/healthcheckresult-management/healthcheckresults/${id}/schedule-follow-up`,
    null,
    {
      params: { followUpDate },
    }
  );
  return response.data;
};

export const getHealthCheckResultsStatistics = async () => {
  try {
    const response = await api.get(
      "/healthcheckresult-management/healthcheckresults/statistics"
    );
    const data = response.data;
    // Map isSuccess to success
    if (data.isSuccess !== undefined && data.success === undefined) {
      data.success = data.isSuccess;
    }
    return data;
  } catch (error) {
    console.error("Error fetching statistics:", error);
    return {
      isSuccess: false,
      success: false,
      message: "Failed to load statistics",
      data: {
        totalResults: 0,
        statusDistribution: {
          waitingForApproval: 0,
          followUpRequired: 0,
          noFollowUpRequired: 0,
          completed: 0,
          cancelledCompletely: 0,
          cancelledForAdjustment: 0,
          softDeleted: 0
        },
        followUpStatistics: {
          totalFollowUps: 0,
          upcomingFollowUps: 0,
          overdueFollowUps: 0,
          followUpsToday: 0
        },
        monthlyDistribution: []
      }
    };
  }
};

export const approveHealthCheckResult = async (id: string) => {
  const response = await api.put(
    `/healthcheckresult-management/healthcheckresults/${id}/approve`
  );
  return response.data;
};

export const cancelCompletelyHealthCheckResult = async (
  id: string,
  reason: string
) => {
  const response = await api.put(
    `/healthcheckresult-management/healthcheckresults/${id}/cancel-completely`,
    JSON.stringify(reason),
    {
      headers: {
        "Content-Type": "application/json",
      },
    }
  );
  return response.data;
};

export const cancelForAdjustmentHealthCheckResult = async (
  id: string,
  reason: string
) => {
  const response = await api.put(
    `/healthcheckresult-management/healthcheckresults/${id}/cancel-for-adjustment`,
    JSON.stringify(reason),
    {
      headers: {
        "Content-Type": "application/json",
      },
    }
  );
  return response.data;
};

export const completeHealthCheckResult = async (id: string) => {
  const response = await api.put(
    `/healthcheckresult-management/healthcheckresults/${id}/complete`
  );
  return response.data;
};

export const cancelFollowUp = async (id: string) => {
  const response = await api.put(
    `/healthcheckresult-management/healthcheckresults/${id}/cancel-follow-up`
  );
  return response.data;
};

export const softDeleteHealthCheckResults = async (
  healthCheckResultIds: string[]
) => {
  try {
    const response = await api.put(
      "/healthcheckresult-management/healthcheckresults/soft-delete",
      healthCheckResultIds
    );
    const data = response.data;
    // Map isSuccess to success
    if (data.isSuccess !== undefined && data.success === undefined) {
      data.success = data.isSuccess;
    }
    return data;
  } catch (error) {
    console.error("Error soft deleting health check results:", error);
    throw error;
  }
};

export const getSoftDeletedHealthCheckResults = async (
  page: number = 1,
  pageSize: number = 10,
  userSearch?: string,
  staffSearch?: string,
  sortBy: string = "CheckupDate",
  ascending: boolean = false
) => {
  const response = await api.get(
    "/healthcheckresult-management/healthcheckresults/soft-deleted",
    {
      params: {
        page,
        pageSize,
        userSearch,
        staffSearch,
        sortBy,
        ascending,
      },
    }
  );
  return response.data;
};

export const restoreSoftDeletedHealthCheckResults = async (
  healthCheckResultIds: string[]
) => {
  try {
    const response = await api.put(
      "/healthcheckresult-management/healthcheckresults/restore",
      healthCheckResultIds
    );
    const data = response.data;
    // Map isSuccess to success
    if (data.isSuccess !== undefined && data.success === undefined) {
      data.success = data.isSuccess;
    }
    return data;
  } catch (error) {
    console.error("Error restoring health check results:", error);
    throw error;
  }
};

export const exportHealthCheckResultsToExcelWithConfig = async (
  config: HealthCheckResultExportConfigDTO,
  page: number = 1,
  pageSize: number = 10,
  codeSearch?: string,
  userSearch?: string,
  staffSearch?: string,
  sortBy: string = "CheckupDate",
  ascending: boolean = false,
  status?: string,
  checkupStartDate?: string,
  checkupEndDate?: string,
  followUpRequired?: boolean,
  followUpStartDate?: string,
  followUpEndDate?: string
) => {
  try {
    const response = await api.post(
      "/healthcheckresult-management/healthcheckresults/export-excel-config",
      config,
      {
        params: {
          page,
          pageSize,
          codeSearch,
          userSearch,
          staffSearch,
          sortBy,
          ascending,
          status,
          checkupStartDate,
          checkupEndDate,
          followUpRequired,
          followUpStartDate,
          followUpEndDate,
        },
        headers: {
          'Content-Type': 'application/json'
        }
      }
    );

    if (response.data && response.data.isSuccess && response.data.data) {
      window.open(response.data.data, "_blank");
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

export const exportHealthCheckResultToPDF = async (id: string) => {
  const response = await api.get(
    `/healthcheckresult-management/healthcheckresults/${id}/export-pdf`
  );

  if (response.data && response.data.isSuccess && response.data.data) {
    window.open(response.data.data, "_blank");
  } else {
    toast.error(response.data.message || "Cannot export Excel file");
  }

  return response.data;
};

export const getAllHealthCheckResultHistories = async (
  page: number = 1,
  pageSize: number = 10,
  healthCheckResultCode?: string,
  action?: string,
  actionStartDate?: string,
  actionEndDate?: string,
  performedBySearch?: string,
  previousStatus?: string,
  newStatus?: string,
  rejectionReason?: string,
  sortBy: string = "ActionDate",
  ascending: boolean = false
) => {
  const response = await api.get(
    "/healthcheckresult-management/healthcheckresults/histories",
    {
      params: {
        page,
        pageSize,
        healthCheckResultCode,
        action,
        actionStartDate,
        actionEndDate,
        performedBySearch,
        previousStatus,
        newStatus,
        rejectionReason,
        sortBy,
        ascending,
      },
    }
  );
  return response.data;
};

export const getHealthCheckResultHistoriesByResultId = async (id: string) => {
  const response = await api.get(
    `/healthcheckresult-management/healthcheckresults/${id}/histories`
  );
  return response.data;
};

export const exportAllHealthCheckResultHistoriesToExcelWithConfig = async (
  config: HealthCheckResultHistoryExportConfigDTO,
  page: number = 1,
  pageSize: number = 10,
  healthCheckResultCode?: string,
  action?: string,
  actionStartDate?: string,
  actionEndDate?: string,
  performedBySearch?: string,
  previousStatus?: string,
  newStatus?: string,
  rejectionReason?: string,
  sortBy: string = "ActionDate",
  ascending: boolean = false
) => {
  try {
    const response = await api.post(
      "/healthcheckresult-management/healthcheckresults/histories/export-excel-config",
      config,
      {
        params: {
          page,
          pageSize,
          healthCheckResultCode,
          action,
          actionStartDate,
          actionEndDate,
          performedBySearch,
          previousStatus,
          newStatus,
          rejectionReason,
          sortBy,
          ascending,
        },
        headers: {
          'Content-Type': 'application/json'
        }
      }
    );

    if (response.data && response.data.isSuccess && response.data.data) {
      window.open(response.data.data, "_blank");
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

export const exportHealthCheckResultHistoriesByResultIdToExcel = async (id: string) => {
  const response = await api.get(
    `/healthcheckresult-management/healthcheckresults/${id}/histories/export-excel`
  );

  if (response.data && response.data.isSuccess && response.data.data) {
    window.open(response.data.data, "_blank");
  } else {
    toast.error(response.data.message || "Cannot export Excel file");
  }

  return response.data;
};

/**
 * Get health check results for the currently logged-in user
 */
export const getCurrentUserHealthCheckResults = async (
  page: number = 1,
  pageSize: number = 10,
  sortBy: string = "CheckupDate",
  ascending: boolean = false,
  status?: string
) => {
  try {
    // Get the user ID from the JWT token through the context
    // Instead of passing userId directly, we'll rely on the backend to identify the user from the token
    const response = await api.get(
      "/healthcheckresult-management/healthcheckresults/current-user",
      {
        params: {
          page,
          pageSize,
          sortBy,
          ascending,
          status,
        },
      }
    );
    const data = response.data;
    // Map isSuccess to success for consistency
    if (data.isSuccess !== undefined && data.success === undefined) {
      data.success = data.isSuccess;
    }
    return data;
  } catch (error) {
    console.error("Error fetching current user health check results:", error);
    throw error;
  }
};
