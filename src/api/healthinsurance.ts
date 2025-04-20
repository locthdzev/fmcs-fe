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

export interface UpdateRequestParams {
  page?: number;
  pageSize?: number;
  search?: string;
  sortBy?: string;
  ascending?: boolean;
  status?: string;
  requestedAtFrom?: string;
  requestedAtTo?: string;
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
  try {
    const response = await api.get("/health-insurance-management/insurances", {
      params: { page, pageSize, search, sortBy, ascending, status, userId },
    });

    // Ensure we're returning the complete response object that has isSuccess, data, totalItems, etc.
    return {
      isSuccess: response.data.isSuccess,
      code: response.data.code,
      message: response.data.message,
      responseFailed: response.data.responseFailed,
      data: response.data.data || [],
      totalItems: response.data.totalRecords || 0,
      page: response.data.page || 1,
      pageSize: response.data.pageSize || pageSize,
    };
  } catch (error) {
    console.error("Error fetching health insurances:", error);
    return {
      isSuccess: false,
      code: 500,
      message: "Failed to fetch health insurance data",
      responseFailed: error instanceof Error ? error.message : "Unknown error",
      data: [],
      totalItems: 0,
      page: 1,
      pageSize: pageSize,
    };
  }
};

export const getHealthInsuranceById = async (id: string) => {
  try {
    console.log("API call to get health insurance by ID:", id);
    const response = await api.get(
      `/health-insurance-management/insurances/${id}`
    );
    console.log("API response for health insurance by ID:", response.data);
    return response.data;
  } catch (error: any) {
    console.error("Error in getHealthInsuranceById:", error);
    return {
      isSuccess: false,
      code: error.response?.status || 500,
      message:
        error.response?.data?.message ||
        "Failed to fetch health insurance details",
      responseFailed: error.message,
      data: null,
    };
  }
};

export const createHealthInsuranceManual = async (
  data: HealthInsuranceCreateManualDTO,
  imageFile?: File
) => {
  if (!imageFile) {
    return {
      isSuccess: false,
      code: 400,
      message: "Image file is required for manual creation.",
    };
  }

  const formData = new FormData();

  // Đảm bảo tất cả các trường đều được gửi với định dạng chính xác
  formData.append("UserId", data.userId);
  formData.append("HealthInsuranceNumber", data.healthInsuranceNumber || "");
  formData.append("FullName", data.fullName || "");
  formData.append("Gender", data.gender || "");
  formData.append("Address", data.address || "");
  formData.append("HealthcareProviderName", data.healthcareProviderName || "");
  formData.append("HealthcareProviderCode", data.healthcareProviderCode || "");

  // Xử lý các trường ngày tháng
  if (data.dateOfBirth)
    formData.append("DateOfBirth", data.dateOfBirth.toString());
  if (data.validFrom) formData.append("ValidFrom", data.validFrom.toString());
  if (data.validTo) formData.append("ValidTo", data.validTo.toString());
  if (data.issueDate) formData.append("IssueDate", data.issueDate.toString());

  formData.append("imageFile", imageFile);

  // Debug: Log tất cả các trường trong FormData
  console.log("createHealthInsuranceManual - FormData being sent:");
  for (const pair of formData.entries()) {
    console.log(`${pair[0]}: ${pair[1]}`);
  }

  try {
    const response = await api.post(
      "/health-insurance-management/insurances/create-manual",
      formData,
      {
        headers: { "Content-Type": "multipart/form-data" },
      }
    );
    return response.data;
  } catch (error: any) {
    console.error("Error in createHealthInsuranceManual:", error);
    return {
      isSuccess: false,
      code: error.response?.status || 500,
      message:
        error.response?.data?.message || "Failed to create health insurance",
      responseFailed: error.message,
    };
  }
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
  if (data.dateOfBirth)
    formData.append("DateOfBirth", data.dateOfBirth.toString());
  if (data.validFrom) formData.append("ValidFrom", data.validFrom.toString());
  if (data.validTo) formData.append("ValidTo", data.validTo.toString());
  if (data.issueDate) formData.append("IssueDate", data.issueDate.toString());

  if (imageFile) {
    formData.append("imageFile", imageFile);
    console.log("updateHealthInsurance - Added image file to FormData");
  }

  // Debug: Log all form data entries
  for (const pair of formData.entries()) {
    console.log(
      `updateHealthInsurance - FormData contains: ${pair[0]}: ${pair[1]}`
    );
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
  
  // Add all fields to FormData, ensuring string conversion is handled properly
  formData.append("HasInsurance", data.hasInsurance ? "true" : "false");
  formData.append("HealthInsuranceNumber", data.healthInsuranceNumber || "");
  formData.append("FullName", data.fullName || "");
  formData.append("Gender", data.gender || "");
  formData.append("Address", data.address || "");
  formData.append("HealthcareProviderName", data.healthcareProviderName || "");
  formData.append("HealthcareProviderCode", data.healthcareProviderCode || "");
  
  // Handle date fields carefully - must convert to string
  if (data.dateOfBirth) formData.append("DateOfBirth", data.dateOfBirth.toString());
  if (data.validFrom) formData.append("ValidFrom", data.validFrom.toString());
  if (data.validTo) formData.append("ValidTo", data.validTo.toString());
  if (data.issueDate) formData.append("IssueDate", data.issueDate.toString());
  
  // Always add the image file if it exists - this is critical for detecting image-only changes
  if (imageFile) {
    formData.append("imageFile", imageFile);
    console.log("updateHealthInsuranceByAdmin - Added image file to FormData");
  }
  
  // Debug: Log all form data entries
  console.log("updateHealthInsuranceByAdmin - FormData entries:");
  for (const pair of formData.entries()) {
    console.log(`${pair[0]}: ${pair[1]}`);
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
  if (data.dateOfBirth)
    formData.append("DateOfBirth", data.dateOfBirth.toString());
  if (data.validFrom) formData.append("ValidFrom", data.validFrom.toString());
  if (data.validTo) formData.append("ValidTo", data.validTo.toString());
  if (data.issueDate) formData.append("IssueDate", data.issueDate.toString());

  if (imageFile) {
    formData.append("imageFile", imageFile);
    console.log("requestHealthInsuranceUpdate - Added image file to FormData");
  }

  // Debug: Log all form data entries
  for (const pair of formData.entries()) {
    console.log(
      `requestHealthInsuranceUpdate - FormData contains: ${pair[0]}: ${pair[1]}`
    );
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
  verificationStatus: string,
  rejectionReason?: string
) => {
  const response = await api.put(
    `/health-insurance-management/insurances/${id}/verify`,
    null,
    {
      params: { verificationStatus, rejectionReason },
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
  params: UpdateRequestParams | number,
  pageSize: number = 10,
  search?: string,
  sortBy: string = "RequestedAt",
  ascending: boolean = false,
  status?: string
) => {
  try {
    let requestParams: UpdateRequestParams;

    if (typeof params === "number") {
      requestParams = {
        page: params,
        pageSize,
        search,
        sortBy,
        ascending,
        status,
      };
    } else {
      requestParams = params;
    }

    const response = await api.get(
      "/health-insurance-management/insurances/update-requests",
      {
        params: requestParams,
      }
    );

    return {
      isSuccess: response.data.isSuccess,
      code: response.data.code,
      message: response.data.message,
      responseFailed: response.data.responseFailed,
      data: response.data.data || [],
      totalItems: response.data.totalRecords || 0,
      page: response.data.page || 1,
      pageSize: requestParams.pageSize || pageSize,
    };
  } catch (error) {
    console.error("Error fetching update requests:", error);
    return {
      isSuccess: false,
      code: 500,
      message: "Failed to fetch update requests",
      responseFailed: error instanceof Error ? error.message : "Unknown error",
      data: [],
      totalItems: 0,
      page: 1,
      pageSize: pageSize,
    };
  }
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

export const getVerifiedInsurances = async (
  page: number = 1,
  pageSize: number = 10,
  search?: string,
  sortBy: string = "CreatedAt",
  ascending: boolean = false,
  userId?: string
) => {
  try {
    const response = await api.get("/health-insurance-management/insurances", {
      params: {
        page,
        pageSize,
        search,
        sortBy,
        ascending,
        status: "Completed",
        userId,
      },
    });

    return {
      isSuccess: response.data.isSuccess,
      code: response.data.code,
      message: response.data.message,
      responseFailed: response.data.responseFailed,
      data: response.data.data || [],
      totalItems: response.data.totalRecords || 0,
      page: response.data.page || 1,
      pageSize: response.data.pageSize || pageSize,
    };
  } catch (error) {
    console.error("Error fetching verified insurances:", error);
    return {
      isSuccess: false,
      code: 500,
      message: "Failed to fetch verified insurance data",
      responseFailed: error instanceof Error ? error.message : "Unknown error",
      data: [],
      totalItems: 0,
      page: 1,
      pageSize: pageSize,
    };
  }
};

export const getInitialInsurances = async (
  page: number = 1,
  pageSize: number = 10,
  search?: string,
  sortBy: string = "CreatedAt",
  ascending: boolean = false,
  userId?: string
) => {
  try {
    // Lấy tất cả dữ liệu với pageSize lớn để đảm bảo lọc client-side chính xác
    const totalResponse = await api.get(
      "/health-insurance-management/insurances",
      {
        params: {
          page: 1,
          pageSize: 1000, // Lấy với số lượng lớn để đếm tổng
          search,
          sortBy,
          ascending,
          status: "Pending",
          userId,
        },
      }
    );

    // Để lấy tổng số bản ghi thực tế sau khi lọc
    let totalItems = 0;
    let filteredData: HealthInsuranceResponseDTO[] = [];

    if (totalResponse.data.isSuccess) {
      // Lọc client-side để lấy tổng số bản ghi thực tế
      const allData = totalResponse.data.data || [];
      filteredData = allData.filter(
        (insurance: HealthInsuranceResponseDTO) =>
          insurance.verificationStatus === "Unverified"
      );
      totalItems = filteredData.length;

      // Thực hiện phân trang client-side
      const startIndex = (page - 1) * pageSize;
      const endIndex = startIndex + pageSize;
      const pagedData = filteredData.slice(startIndex, endIndex);

      return {
        isSuccess: true,
        code: totalResponse.data.code,
        message: totalResponse.data.message,
        responseFailed: totalResponse.data.responseFailed,
        data: pagedData,
        totalItems: totalItems,
        page: page,
        pageSize: pageSize,
      };
    } else {
      return {
        isSuccess: totalResponse.data.isSuccess,
        code: totalResponse.data.code,
        message: totalResponse.data.message,
        responseFailed: totalResponse.data.responseFailed,
        data: [],
        totalItems: 0,
        page: page,
        pageSize: pageSize,
      };
    }
  } catch (error) {
    console.error("Error fetching initial insurances:", error);
    return {
      isSuccess: false,
      code: 500,
      message: "Failed to fetch initial insurance data",
      responseFailed: error instanceof Error ? error.message : "Unknown error",
      data: [],
      totalItems: 0,
      page: 1,
      pageSize: pageSize,
    };
  }
};

export const getExpiredUpdateInsurances = async (
  page: number = 1,
  pageSize: number = 10,
  search?: string,
  sortBy: string = "CreatedAt",
  ascending: boolean = false,
  userId?: string
) => {
  try {
    const response = await api.get("/health-insurance-management/insurances", {
      params: {
        page,
        pageSize,
        search,
        sortBy,
        ascending,
        status: "DeadlineExpired",
        userId,
      },
    });

    return {
      isSuccess: response.data.isSuccess,
      code: response.data.code,
      message: response.data.message,
      responseFailed: response.data.responseFailed,
      data: response.data.data || [],
      totalItems: response.data.totalRecords || 0,
      page: response.data.page || 1,
      pageSize: response.data.pageSize || pageSize,
    };
  } catch (error) {
    console.error("Error fetching expired update insurances:", error);
    return {
      isSuccess: false,
      code: 500,
      message: "Failed to fetch expired update insurance data",
      responseFailed: error instanceof Error ? error.message : "Unknown error",
      data: [],
      totalItems: 0,
      page: 1,
      pageSize: pageSize,
    };
  }
};

export const getExpiredInsurances = async (
  page: number = 1,
  pageSize: number = 10,
  search?: string,
  sortBy: string = "CreatedAt",
  ascending: boolean = false,
  userId?: string
) => {
  try {
    const response = await api.get("/health-insurance-management/insurances", {
      params: {
        page,
        pageSize,
        search,
        sortBy,
        ascending,
        status: "Expired",
        userId,
      },
    });

    return {
      isSuccess: response.data.isSuccess,
      code: response.data.code,
      message: response.data.message,
      responseFailed: response.data.responseFailed,
      data: response.data.data || [],
      totalItems: response.data.totalRecords || 0,
      page: response.data.page || 1,
      pageSize: response.data.pageSize || pageSize,
    };
  } catch (error) {
    console.error("Error fetching expired insurances:", error);
    return {
      isSuccess: false,
      code: 500,
      message: "Failed to fetch expired insurance data",
      responseFailed: error instanceof Error ? error.message : "Unknown error",
      data: [],
      totalItems: 0,
      page: 1,
      pageSize: pageSize,
    };
  }
};

export const getUninsuredRecords = async (
  page: number = 1,
  pageSize: number = 10,
  search?: string,
  sortBy: string = "CreatedAt",
  ascending: boolean = false,
  userId?: string
) => {
  try {
    const response = await api.get("/health-insurance-management/insurances", {
      params: {
        page,
        pageSize,
        search,
        sortBy,
        ascending,
        status: "NotApplicable",
        userId,
      },
    });

    return {
      isSuccess: response.data.isSuccess,
      code: response.data.code,
      message: response.data.message,
      responseFailed: response.data.responseFailed,
      data: response.data.data || [],
      totalItems: response.data.totalRecords || 0,
      page: response.data.page || 1,
      pageSize: response.data.pageSize || pageSize,
    };
  } catch (error) {
    console.error("Error fetching uninsured records:", error);
    return {
      isSuccess: false,
      code: 500,
      message: "Failed to fetch uninsured records",
      responseFailed: error instanceof Error ? error.message : "Unknown error",
      data: [],
      totalItems: 0,
      page: 1,
      pageSize: pageSize,
    };
  }
};

export const getSoftDeletedInsurances = async (
  page: number = 1,
  pageSize: number = 10,
  search?: string,
  sortBy: string = "CreatedAt",
  ascending: boolean = false,
  userId?: string
) => {
  try {
    const response = await api.get("/health-insurance-management/insurances", {
      params: {
        page,
        pageSize,
        search,
        sortBy,
        ascending,
        status: "SoftDeleted",
        userId,
      },
    });

    return {
      isSuccess: response.data.isSuccess,
      code: response.data.code,
      message: response.data.message,
      responseFailed: response.data.responseFailed,
      data: response.data.data || [],
      totalItems: response.data.totalRecords || 0,
      page: response.data.page || 1,
      pageSize: response.data.pageSize || pageSize,
    };
  } catch (error) {
    console.error("Error fetching soft deleted insurances:", error);
    return {
      isSuccess: false,
      code: 500,
      message: "Failed to fetch soft deleted insurance data",
      responseFailed: error instanceof Error ? error.message : "Unknown error",
      data: [],
      totalItems: 0,
      page: 1,
      pageSize: pageSize,
    };
  }
};

export const getVerificationRequests = async (
  page = 1,
  pageSize = 10,
  search?: string,
  sortBy = "CreatedAt",
  ascending = false
) => {
  try {
    // Chúng ta sẽ dùng chung endpoint với update requests, nhưng lọc theo status Submitted và verificationStatus Unverified
    const response = await api.get(`/health-insurance-management/insurances`, {
      params: {
        page,
        pageSize,
        search,
        sortBy,
        ascending,
        status: "Submitted",
      },
    });

    if (response.data.isSuccess) {
      // Đảm bảo chỉ lấy các bảo hiểm có verificationStatus=Unverified
      const filteredInsurances = response.data.data.filter(
        (insurance: HealthInsuranceResponseDTO) => 
        insurance.verificationStatus === "Unverified"
      );

      return {
        ...response.data,
        data: filteredInsurances,
        totalItems: filteredInsurances.length,
      };
    }
    return response.data;
  } catch (error) {
    console.error("Error fetching verification requests:", error);
    return {
      isSuccess: false,
      message: "Failed to fetch verification requests",
      data: [],
      totalItems: 0,
    };
  }
};

export const getRejectedInsurances = async (
  page: number = 1,
  pageSize: number = 10,
  search?: string,
  sortBy: string = "CreatedAt",
  ascending: boolean = false,
  userId?: string
) => {
  try {
    const response = await api.get("/health-insurance-management/insurances", {
      params: {
        page,
        pageSize,
        search,
        sortBy,
        ascending,
        status: "Rejected",
        userId,
      },
    });

    return {
      isSuccess: response.data.isSuccess,
      code: response.data.code,
      message: response.data.message,
      responseFailed: response.data.responseFailed,
      data: response.data.data || [],
      totalItems: response.data.totalRecords || 0,
      page: response.data.page || 1,
      pageSize: response.data.pageSize || pageSize,
    };
  } catch (error) {
    console.error("Error fetching rejected insurances:", error);
    return {
      isSuccess: false,
      code: 500,
      message: "Failed to fetch rejected insurance data",
      responseFailed: error instanceof Error ? error.message : "Unknown error",
      data: [],
      totalItems: 0,
      page: 1,
      pageSize: pageSize,
    };
  }
};
