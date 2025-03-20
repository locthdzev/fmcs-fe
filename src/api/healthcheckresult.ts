import api from "./customize-axios";
import { exportToExcel } from "./export";
import { toast } from "react-toastify";

// Interfaces
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
  action: string;
  actionDate: string;
  performedBy: StaffInfo;
  previousStatus?: string;
  newStatus?: string;
  rejectionReason?: string;
  changeDetails?: string;
}

// API Functions
export const getAllHealthCheckResults = async (
  page: number = 1,
  pageSize: number = 10,
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
  const response = await api.get(
    "/healthcheckresult-management/healthcheckresults",
    {
      params: {
        page,
        pageSize,
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
  return response.data;
};

export const getHealthCheckResultById = async (id: string) => {
  const response = await api.get(
    `/healthcheckresult-management/healthcheckresults/${id}`
  );
  return response.data;
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

export const getHealthCheckResultsByUserId = async (
  userId: string,
  page: number = 1,
  pageSize: number = 10,
  sortBy: string = "CheckupDate",
  ascending: boolean = false,
  status?: string
) => {
  const response = await api.get(
    `/healthcheckresult-management/healthcheckresults/user/${userId}`,
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
  return response.data;
};

export const getHealthCheckResultsByStaffId = async (
  staffId: string,
  page: number = 1,
  pageSize: number = 10,
  sortBy: string = "CheckupDate",
  ascending: boolean = false,
  status?: string
) => {
  const response = await api.get(
    `/healthcheckresult-management/healthcheckresults/staff/${staffId}`,
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
  return response.data;
};

export const scheduleFollowUp = async (id: string, followUpDate: string) => {
  const response = await api.post(
    `/healthcheckresult-management/healthcheckresults/${id}/schedule-follow-up`,
    null,
    {
      params: { followUpDate },
    }
  );
  return response.data;
};

export const getHealthCheckResultsStatistics = async () => {
  const response = await api.get(
    "/healthcheckresult-management/healthcheckresults/statistics"
  );
  return response.data;
};

export const approveHealthCheckResult = async (id: string) => {
  const response = await api.post(
    `/healthcheckresult-management/healthcheckresults/${id}/approve`
  );
  return response.data;
};

export const cancelCompletelyHealthCheckResult = async (
  id: string,
  reason: string
) => {
  const response = await api.post(
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
  const response = await api.post(
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
  const response = await api.post(
    `/healthcheckresult-management/healthcheckresults/${id}/complete`
  );
  return response.data;
};

export const cancelFollowUp = async (id: string) => {
  const response = await api.post(
    `/healthcheckresult-management/healthcheckresults/${id}/cancel-follow-up`
  );
  return response.data;
};

export const softDeleteHealthCheckResults = async (
  healthCheckResultIds: string[]
) => {
  const response = await api.post(
    "/healthcheckresult-management/healthcheckresults/soft-delete",
    healthCheckResultIds
  );
  return response.data;
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
  const response = await api.post(
    "/healthcheckresult-management/healthcheckresults/restore",
    healthCheckResultIds
  );
  return response.data;
};

export const exportHealthCheckResultsToExcel = async (
  page: number = 1,
  pageSize: number = 10,
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
  const response = await api.get(
    "/healthcheckresult-management/healthcheckresults/export-excel",
    {
      params: {
        page,
        pageSize,
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
    }
  );

  if (response.data && response.data.isSuccess && response.data.data) {
    // Sử dụng URL trả về từ API để mở trang download trực tiếp
    window.open(response.data.data, "_blank");
  } else {
    toast.error(response.data.message || "Không thể xuất file Excel");
  }

  return response.data;
};

export const exportHealthCheckResultToPDF = async (id: string) => {
  const response = await api.get(
    `/healthcheckresult-management/healthcheckresults/${id}/export-pdf`
  );

  if (response.data && response.data.isSuccess && response.data.data) {
    // Sử dụng URL trả về từ API để mở trang download trực tiếp
    window.open(response.data.data, "_blank");
  } else {
    toast.error(response.data.message || "Không thể xuất file PDF");
  }

  return response.data;
};

export const getAllHealthCheckResultHistories = async (
  page: number = 1,
  pageSize: number = 10,
  sortBy: string = "ActionDate",
  ascending: boolean = false
) => {
  const response = await api.get(
    "/healthcheckresult-management/healthcheckresults/histories",
    {
      params: {
        page,
        pageSize,
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
