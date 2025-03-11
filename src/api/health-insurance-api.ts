import api, { setupSignalRConnection } from "./customize-axios";

export interface HealthInsuranceResponseDTO {
  id: string;
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
  imageUrl?: string;
  createdAt: string;
  createdBy?: { id?: string; userName?: string; role?: string };
  updatedAt?: string;
  updatedBy?: { id?: string; userName?: string; role?: string };
  status?: string;
  verificationStatus?: string;
  deadline?: string;
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
  hasInsurance: boolean;
}

export interface HealthInsuranceUpdateRequestDTO {
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
  hasInsurance: boolean;
  updateMethod: "Manual" | "FromImage";
}

export interface HealthInsuranceRenewRequestDTO {
  validFrom: string;
  validTo: string;
  issueDate?: string;
}

export interface HealthInsuranceConfigDTO {
  reminderInterval: number;
  deadlineDays: number;
  warningThresholdDays: number[];
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
  Object.entries(data).forEach(([key, value]) =>
    formData.append(key, value as string)
  );
  if (imageFile) formData.append("imageFile", imageFile);
  const response = await api.post(
    "/health-insurance-management/insurances/create-manual",
    formData,
    { headers: { "Content-Type": "multipart/form-data" } }
  );
  return response.data;
};

export const updateHealthInsurance = async (
  id: string,
  data: HealthInsuranceUpdateRequestDTO,
  imageFile?: File
) => {
  const formData = new FormData();
  Object.entries(data).forEach(([key, value]) =>
    formData.append(key, value as string)
  );
  if (imageFile) formData.append("imageFile", imageFile);
  const response = await api.put(
    `/health-insurance-management/insurances/${id}`,
    formData,
    { headers: { "Content-Type": "multipart/form-data" } }
  );
  return response.data;
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

export const deleteHealthInsurance = async (id: string) => {
  const response = await api.delete(
    `/health-insurance-management/insurances/${id}`
  );
  return response.data;
};

export const renewHealthInsurance = async (
  id: string,
  data: HealthInsuranceRenewRequestDTO,
  imageFile?: File
) => {
  const formData = new FormData();
  Object.entries(data).forEach(([key, value]) =>
    formData.append(key, value as string)
  );
  if (imageFile) formData.append("imageFile", imageFile);
  const response = await api.put(
    `/health-insurance-management/insurances/${id}/renew`,
    formData,
    { headers: { "Content-Type": "multipart/form-data" } }
  );
  return response.data;
};

export const verifyHealthInsurance = async (
  id: string,
  verificationStatus: string
) => {
  const response = await api.put(
    `/health-insurance-management/insurances/${id}/verify`,
    {},
    { params: { verificationStatus } }
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

export const getHealthInsuranceHistory = async (id: string) => {
  const response = await api.get(
    `/health-insurance-management/insurances/${id}/history`
  );
  return response.data.data;
};

export const setupHealthInsuranceRealTime = (
  callback: (data: HealthInsuranceResponseDTO) => void
) => {
  return setupSignalRConnection("/healthInsuranceHub", callback);
};

export const exportHealthInsurancesToExcel = async (status?: string) => {
  const response = await api.get(
    "/health-insurance-management/insurances/export",
    {
      params: { status },
      responseType: "blob",
    }
  );
  const url = window.URL.createObjectURL(new Blob([response.data]));
  const link = document.createElement("a");
  link.href = url;
  link.setAttribute("download", "health_insurances.xlsx");
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};
