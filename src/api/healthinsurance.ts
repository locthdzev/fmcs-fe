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
  const response = await api.get(`/health-insurance-management/insurances/${id}`);
  return response.data;
};

export const createHealthInsuranceManual = async (
  data: HealthInsuranceCreateManualDTO,
  imageFile?: File
) => {
  const formData = new FormData();
  Object.entries(data).forEach(
    ([key, value]) => {
      if (value !== undefined && value !== null) {
        const pascalCaseKey = key.charAt(0).toUpperCase() + key.slice(1);
        formData.append(pascalCaseKey, value.toString());
      }
    }
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
  console.log("updateHealthInsurance - Data being processed:", data);
  
  // Thêm tất cả các trường vào FormData, đảm bảo xử lý chuỗi chính xác
  formData.append("HasInsurance", data.hasInsurance ? "true" : "false");
  formData.append("HealthInsuranceNumber", data.healthInsuranceNumber || "");
  formData.append("FullName", data.fullName || "");
  formData.append("Gender", data.gender || "");
  formData.append("Address", data.address || "");
  formData.append("HealthcareProviderName", data.healthcareProviderName || "");
  formData.append("HealthcareProviderCode", data.healthcareProviderCode || "");
  
  // Xử lý các trường ngày tháng đặc biệt - PHẢI chuyển sang chuỗi
  if (data.dateOfBirth) formData.append("DateOfBirth", data.dateOfBirth.toString());
  if (data.validFrom) formData.append("ValidFrom", data.validFrom.toString());
  if (data.validTo) formData.append("ValidTo", data.validTo.toString());
  if (data.issueDate) formData.append("IssueDate", data.issueDate.toString());
  
  if (imageFile) {
    formData.append("imageFile", imageFile);
    console.log("updateHealthInsurance - Added image file to FormData");
  }
  
  // Debug: Log all form data entries
  for (const pair of formData.entries()) {
    console.log(`updateHealthInsurance - FormData contains: ${pair[0]}: ${pair[1]}`);
  }
  
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
  console.log("updateHealthInsuranceByAdmin - Data being processed:", data);
  
  // Thêm tất cả các trường vào FormData, đảm bảo xử lý chuỗi chính xác
  formData.append("HasInsurance", data.hasInsurance ? "true" : "false");
  formData.append("HealthInsuranceNumber", data.healthInsuranceNumber || "");
  formData.append("FullName", data.fullName || "");
  formData.append("Gender", data.gender || "");
  formData.append("Address", data.address || "");
  formData.append("HealthcareProviderName", data.healthcareProviderName || "");
  formData.append("HealthcareProviderCode", data.healthcareProviderCode || "");
  
  // Xử lý các trường ngày tháng đặc biệt - PHẢI chuyển sang chuỗi
  if (data.dateOfBirth) formData.append("DateOfBirth", data.dateOfBirth.toString());
  if (data.validFrom) formData.append("ValidFrom", data.validFrom.toString());
  if (data.validTo) formData.append("ValidTo", data.validTo.toString());
  if (data.issueDate) formData.append("IssueDate", data.issueDate.toString());
  
  if (imageFile) {
    formData.append("imageFile", imageFile);
    console.log("updateHealthInsuranceByAdmin - Added image file to FormData");
  }
  
  // Debug: Log all form data entries
  for (const pair of formData.entries()) {
    console.log(`updateHealthInsuranceByAdmin - FormData contains: ${pair[0]}: ${pair[1]}`);
  }
  
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
  console.log("requestHealthInsuranceUpdate - Data being processed:", data);
  
  // Thêm tất cả các trường vào FormData, đảm bảo xử lý chuỗi chính xác
  formData.append("HasInsurance", data.hasInsurance ? "true" : "false");
  formData.append("HealthInsuranceNumber", data.healthInsuranceNumber || "");
  formData.append("FullName", data.fullName || "");
  formData.append("Gender", data.gender || "");
  formData.append("Address", data.address || "");
  formData.append("HealthcareProviderName", data.healthcareProviderName || "");
  formData.append("HealthcareProviderCode", data.healthcareProviderCode || "");
  
  // Xử lý các trường ngày tháng đặc biệt - PHẢI chuyển sang chuỗi
  if (data.dateOfBirth) formData.append("DateOfBirth", data.dateOfBirth.toString());
  if (data.validFrom) formData.append("ValidFrom", data.validFrom.toString());
  if (data.validTo) formData.append("ValidTo", data.validTo.toString());
  if (data.issueDate) formData.append("IssueDate", data.issueDate.toString());
  
  if (imageFile) {
    formData.append("imageFile", imageFile);
    console.log("requestHealthInsuranceUpdate - Added image file to FormData");
  }
  
  // Debug: Log all form data entries
  for (const pair of formData.entries()) {
    console.log(`requestHealthInsuranceUpdate - FormData contains: ${pair[0]}: ${pair[1]}`);
  }
  
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
  return response.data;
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

export const getCurrentUserHealthInsurance = async () => {
  const response = await api.get(
    "/health-insurance-management/insurances/current"
  );
  return response.data;
};

export const getCurrentUserPendingUpdateRequests = async () => {
  const response = await api.get(
    "/health-insurance-management/insurances/update-requests/current",
    {
      params: { status: "Pending" },
    }
  );
  return response.data;
};
