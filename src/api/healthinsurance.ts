import api, { setupSignalRConnection } from "./customize-axios";
import { exportToExcel } from "./export";

export interface HealthInsuranceResponseDTO {
  id: string;
  user: { id: string; fullName: string; userName: string; email: string };
  healthInsuranceNumber?: string;
  fullName?: string;
  dateOfBirth?: string;
  gender?: string;
  address?: string;
  healthcareProviderName?: string;
  healthcareProviderCode?: string;
  validFrom?: string;
  validTo?: string;
  issueDate?: string;
  imageUrl?: string;
  createdAt: string;
  createdBy?: { id: string; userName: string; email: string };
  updatedAt?: string;
  updatedBy?: { id: string; userName: string; email: string };
  status?: string;
  verificationStatus?: string;
  deadline?: string;
}

export interface HealthInsuranceUpdateRequestDTO {
  hasInsurance: boolean;
  healthInsuranceNumber?: string;
  fullName?: string;
  dateOfBirth?: string;
  gender?: string;
  address?: string;
  healthcareProviderName?: string;
  healthcareProviderCode?: string;
  validFrom?: string;
  validTo?: string;
  issueDate?: string;
}

export interface HealthInsuranceCreateManualDTO {
  userId: string;
  healthInsuranceNumber?: string;
  fullName?: string;
  dateOfBirth?: string;
  gender?: string;
  address?: string;
  healthcareProviderName?: string;
  healthcareProviderCode?: string;
  validFrom?: string;
  validTo?: string;
  issueDate?: string;
}

export interface HealthInsuranceConfigDTO {
  reminderIntervalDays: number;
  deadlineDays: number;
  warningThresholdDays: number[];
}

export interface UpdateRequestDTO {
  id: string;
  healthInsuranceId: string;
  requestedBy: { id: string; userName: string; email: string };
  requestedAt: string;
  status: string;
  reviewedBy?: { id: string; userName: string; email: string };
  reviewedAt?: string;
  rejectionReason?: string;
  hasInsurance: boolean;
  healthInsuranceNumber?: string;
  fullName?: string;
  dateOfBirth?: string;
  gender?: string;
  address?: string;
  healthcareProviderName?: string;
  healthcareProviderCode?: string;
  validFrom?: string;
  validTo?: string;
  issueDate?: string;
  imageUrl?: string;
}

export interface HistoryDTO {
  id: string;
  healthInsuranceId: string;
  updatedBy: { id: string; userName: string; email: string };
  updatedAt: string;
  previousStatus: string;
  newStatus: string;
  previousVerificationStatus: string;
  newVerificationStatus: string;
  changeDetails: string;
}

export const getAllHealthInsurances = async (
  page: number = 1,
  pageSize: number = 10,
  search?: string,
  sortBy: string = "CreatedAt",
  ascending: boolean = false,
  status?: string,
  userId?: string
) => {
  const response = await api.get("/health-insurance-management/insurances", {
    params: { page, pageSize, search, sortBy, ascending, status, userId },
  });
  return response.data;
};

export const getHealthInsuranceById = async (id: string) => {
  const response = await api.get(
    `/health-insurance-management/insurances/${id}`
  );
  return response.data.data;
};

export const createHealthInsuranceManual = async (
  data: HealthInsuranceCreateManualDTO,
  imageFile?: File
) => {
  const formData = new FormData();
  Object.entries(data).forEach(
    ([key, value]) => value && formData.append(key, value)
  );
  if (imageFile) formData.append("imageFile", imageFile);
  const response = await api.post(
    "/health-insurance-management/insurances/create-manual",
    formData,
    {
      headers: { "Content-Type": "multipart/form-data" },
    }
  );
  return response.data;
};

export const updateHealthInsurance = async (
  id: string,
  data: HealthInsuranceUpdateRequestDTO,
  imageFile?: File
) => {
  const formData = new FormData();
  Object.entries(data).forEach(
    ([key, value]) => value && formData.append(key, value.toString())
  );
  if (imageFile) formData.append("imageFile", imageFile);
  const response = await api.put(
    `/health-insurance-management/insurances/${id}`,
    formData,
    {
      headers: { "Content-Type": "multipart/form-data" },
    }
  );
  return response.data;
};

export const updateHealthInsuranceByAdmin = async (
  id: string,
  data: HealthInsuranceUpdateRequestDTO,
  imageFile?: File
) => {
  const formData = new FormData();
  Object.entries(data).forEach(
    ([key, value]) => value && formData.append(key, value.toString())
  );
  if (imageFile) formData.append("imageFile", imageFile);
  const response = await api.put(
    `/health-insurance-management/insurances/${id}/admin-update`,
    formData,
    {
      headers: { "Content-Type": "multipart/form-data" },
    }
  );
  return response.data;
};

export const requestHealthInsuranceUpdate = async (
  id: string,
  data: HealthInsuranceUpdateRequestDTO,
  imageFile?: File
) => {
  const formData = new FormData();
  Object.entries(data).forEach(
    ([key, value]) => value && formData.append(key, value.toString())
  );
  if (imageFile) formData.append("imageFile", imageFile);
  const response = await api.post(
    `/health-insurance-management/insurances/${id}/request-update`,
    formData,
    {
      headers: { "Content-Type": "multipart/form-data" },
    }
  );
  return response.data;
};

export const reviewUpdateRequest = async (
  requestId: string,
  isApproved: boolean,
  rejectionReason?: string
) => {
  const response = await api.put(
    `/health-insurance-management/insurances/requests/${requestId}/review`,
    null,
    {
      params: { isApproved, rejectionReason },
    }
  );
  return response.data;
};

export const verifyHealthInsurance = async (
  id: string,
  verificationStatus: string
) => {
  const response = await api.put(
    `/health-insurance-management/insurances/${id}/verify`,
    null,
    {
      params: { verificationStatus },
    }
  );
  return response.data;
};

export const softDeleteHealthInsurances = async (insuranceIds: string[]) => {
  const response = await api.put(
    "/health-insurance-management/insurances/soft-delete",
    insuranceIds
  );
  return response.data;
};

export const restoreHealthInsurance = async (id: string) => {
  const response = await api.put(
    `/health-insurance-management/insurances/${id}/restore`
  );
  return response.data;
};

export const resendUpdateRequest = async (id: string) => {
  const response = await api.post(
    `/health-insurance-management/insurances/${id}/resend-update-request`
  );
  return response.data;
};

export const getUpdateRequests = async (
  page: number = 1,
  pageSize: number = 10,
  search?: string,
  sortBy: string = "RequestedAt",
  ascending: boolean = false,
  status?: string
) => {
  const response = await api.get(
    "/health-insurance-management/insurances/update-requests",
    {
      params: { page, pageSize, search, sortBy, ascending, status },
    }
  );
  return response.data;
};

export const getHealthInsuranceHistory = async (id: string) => {
  const response = await api.get(
    `/health-insurance-management/insurances/${id}/history`
  );
  return response.data.data;
};

export const getAllHealthInsuranceHistories = async (
  page: number = 1,
  pageSize: number = 10,
  search?: string,
  sortBy: string = "UpdatedAt",
  ascending: boolean = false
) => {
  const response = await api.get(
    "/health-insurance-management/insurances/all-histories",
    {
      params: { page, pageSize, search, sortBy, ascending },
    }
  );
  return response.data;
};

export const setHealthInsuranceConfig = async (
  data: HealthInsuranceConfigDTO
) => {
  const response = await api.put(
    "/health-insurance-management/insurances/config",
    data
  );
  return response.data;
};

export const getHealthInsuranceConfig = async () => {
  const response = await api.get(
    "/health-insurance-management/insurances/config"
  );
  return response.data.data;
};

export const getUserInsuranceStatus = async (userId: string) => {
  const response = await api.get(
    `/health-insurance-management/users/${userId}/status`
  );
  return response.data.data;
};

export const createInitialHealthInsurances = async () => {
  const response = await api.post(
    "/health-insurance-management/insurances/create-initial"
  );
  return response.data;
};

export const sendHealthInsuranceUpdateRequest = async () => {
  const response = await api.post(
    "/health-insurance-management/insurances/send-update-request"
  );
  return response.data;
};

export const exportHealthInsurances = () =>
  exportToExcel(
    "/health-insurance-management/insurances/export",
    "Health_Insurances.xlsx"
  );

export const setupHealthInsuranceRealTime = (
  callback: (data: HealthInsuranceResponseDTO) => void
) => {
  return setupSignalRConnection("/healthInsuranceHub", callback);
};
