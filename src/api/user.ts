import api from "./customize-axios";

export interface UserProfile {
  id: string;
  fullName: string;
  userName?: string;
  email: string;
  gender: string;
  dob: string;
  address: string;
  phone: string;
  createdAt: string;
  status?: string;
  roles: string[];
  imageURL?: string;
}

export interface UserCreateRequest {
  fullName: string;
  userName?: string;
  email: string;
  password?: string;
  gender: string;
  dob: string;
  address: string;
  phone: string;
  createdAt: string;
  status?: string;
}

export interface UserResponseDTO {
  id: string;
  fullName: string;
  userName: string;
  email: string;
  gender: string;
  dob: string;
  address: string;
  phone: string;
  status: string;
  createdAt: string;
  updatedAt: string;
  roles: string[];
  imageURL?: string;
}

export interface UpdateAccountsStatusRequest {
  userId: string[];
  status: string;
}

export interface PaginatedUserResponse {
  totalPages: number;
  totalCount: number;
  pageSize: number;
  currentPage: number;
  data: UserResponseDTO[];
}

export interface UserApiResponse {
  isSuccess: boolean;
  code: number;
  message?: string;
  responseFailed?: any;
  data: UserResponseDTO[];
  totalRecords: number;
  page: number;
  pageSize: number;
}

export interface UserExportConfigDTO {
  exportAllPages: boolean;
  includeFullName: boolean;
  includeUserName: boolean;
  includeEmail: boolean;
  includePhone: boolean;
  includeGender: boolean;
  includeDob: boolean;
  includeAddress: boolean;
  includeRole: boolean;
  includeStatus: boolean;
  includeCreatedAt: boolean;
  includeUpdatedAt: boolean;
}

export interface UserStatisticsDTO {
  totalUsers: number;
  activeUsers: number;
  inactiveUsers: number;
  usersByRole: Record<string, number>;
  usersWithMultipleRoles: number;
  usersByGender: Record<string, number>;
  usersByMonthCreated: Record<string, number>;
  newUsersThisWeek: number;
  newUsersThisMonth: number;
  newUsersThisYear: number;
  usersInDateRange: number;
  startDate: string | null;
  endDate: string | null;
}

export interface ApiResponse<T> {
  isSuccess: boolean;
  code: number;
  message?: string;
  data: T;
}

export const getAllUsers = async (
  page: number = 1,
  pageSize: number = 10,
  fullNameSearch?: string,
  userNameSearch?: string,
  emailSearch?: string,
  phoneSearch?: string,
  roleFilter?: string,
  genderFilter?: string,
  dobStartDate?: Date,
  dobEndDate?: Date,
  createdStartDate?: Date,
  createdEndDate?: Date,
  updatedStartDate?: Date,
  updatedEndDate?: Date,
  status?: string,
  sortBy: string = "CreatedAt",
  ascending: boolean = false
) => {
  try {
    const params = new URLSearchParams();
    params.append("page", page.toString());
    params.append("pageSize", pageSize.toString());

    if (fullNameSearch) params.append("fullNameSearch", fullNameSearch);
    if (userNameSearch) params.append("userNameSearch", userNameSearch);
    if (emailSearch) params.append("emailSearch", emailSearch);
    if (phoneSearch) params.append("phoneSearch", phoneSearch);
    if (roleFilter) params.append("roleFilter", roleFilter);
    if (genderFilter) params.append("genderFilter", genderFilter);
    if (dobStartDate) params.append("dobStartDate", dobStartDate.toISOString());
    if (dobEndDate) params.append("dobEndDate", dobEndDate.toISOString());
    if (createdStartDate)
      params.append("createdStartDate", createdStartDate.toISOString());
    if (createdEndDate)
      params.append("createdEndDate", createdEndDate.toISOString());
    if (updatedStartDate)
      params.append("updatedStartDate", updatedStartDate.toISOString());
    if (updatedEndDate)
      params.append("updatedEndDate", updatedEndDate.toISOString());
    if (status) params.append("status", status);
    params.append("sortBy", sortBy);
    params.append("ascending", ascending.toString());

    const response = await api.get<UserApiResponse>(
      `/user-management/users?${params.toString()}`
    );

    return response.data;
  } catch (error) {
    throw error;
  }
};

export const getUsers = async () => {
  try {
    const response = await api.get("/user-management/users");
    return response.data.data;
  } catch (error) {
    throw error;
  }
};

export const createUser = async (userCreateData: UserCreateRequest) => {
  try {
    const response = await api.post("/user-management/users", userCreateData);
    return response.data;
  } catch (error: any) {
    return {
      isSuccess: false,
      code: error.response?.status || 400,
      message: error.response?.data?.message || "Failed to create user",
      responseError: error.message,
    };
  }
};

export const getUserProfile = async (): Promise<UserProfile> => {
  try {
    const response = await api.get<{ isSuccess: boolean; data: UserProfile }>(
      "/user-management/users/me"
    );
    if (response.data.isSuccess && response.data.data) {
      return response.data.data;
    }
    throw new Error("Failed to fetch user profile.");
  } catch (error) {
    throw error;
  }
};

export const updateUser = async (
  userId: string,
  userUpdateData: Partial<UserProfile>
) => {
  try {
    const response = await api.put(
      `/user-management/users?userId=${userId}`,
      userUpdateData
    );
    return response.data;
  } catch (error) {
    throw error;
  }
};

export const assignRoleToUser = async (userId: string, roleId: string) => {
  try {
    const response = await api.post(
      `/user-management/users/assign-role?userId=${userId}&roleId=${roleId}`
    );
    return response.data;
  } catch (error) {
    throw error;
  }
};

export const unassignRoleFromUser = async (userId: string, roleId: string) => {
  try {
    const response = await api.post(
      `/user-management/users/unassign-role?userId=${userId}&roleId=${roleId}`
    );
    return response.data;
  } catch (error) {
    throw error;
  }
};

export const getAllRoles = async () => {
  try {
    const response = await api.get("/role-management/roles");
    return response.data.data;
  } catch (error) {
    throw error;
  }
};

export const getAllStaff = async (): Promise<UserProfile[]> => {
  try {
    const response = await api.get<{
      isSuccess: boolean;
      data: UserProfile[];
      code: number;
      message?: string;
    }>("/user-management/users/staff");
    if (response.data.isSuccess && response.data.data) {
      return response.data.data;
    }
    throw new Error(response.data.message || "Failed to fetch staff users.");
  } catch (error) {
    throw error;
  }
};

export const activateUsers = async (userIds: string[]) => {
  try {
    const response = await api.put("/user-management/users/activate", userIds);
    return response.data;
  } catch (error) {
    throw error;
  }
};

export const deactivateUsers = async (userIds: string[]) => {
  try {
    const response = await api.put(
      "/user-management/users/deactivate",
      userIds
    );
    return response.data;
  } catch (error) {
    throw error;
  }
};

export const exportUserTemplate = async () => {
  try {
    const response = await api.get("/user-management/users/export-template");
    return response.data;
  } catch (error) {
    throw error;
  }
};

export const importUsers = async (
  file: File,
  config?: {
    skipDuplicates?: boolean;
    stopOnError?: boolean;
    defaultPassword?: string;
    useDefaultPassword?: boolean;
  }
) => {
  try {
    const formData = new FormData();
    formData.append("file", file);

    if (config) {
      if (config.skipDuplicates !== undefined) {
        formData.append("skipDuplicates", config.skipDuplicates.toString());
      }
      if (config.stopOnError !== undefined) {
        formData.append("stopOnError", config.stopOnError.toString());
      }
      if (config.useDefaultPassword !== undefined) {
        formData.append(
          "useDefaultPassword",
          config.useDefaultPassword.toString()
        );

        if (config.useDefaultPassword === true && config.defaultPassword) {
          formData.append("defaultPassword", config.defaultPassword);
        }
      }
    }

    const response = await api.post("/user-management/users/import", formData, {
      headers: {
        "Content-Type": "multipart/form-data",
      },
    });

    return response.data;
  } catch (error) {
    throw error;
  }
};

export const exportUsersToExcelWithConfig = async (
  config: UserExportConfigDTO,
  page: number = 1,
  pageSize: number = 10,
  fullNameSearch?: string,
  userNameSearch?: string,
  emailSearch?: string,
  phoneSearch?: string,
  roleFilter?: string,
  genderFilter?: string,
  dobStartDate?: Date,
  dobEndDate?: Date,
  createdStartDate?: Date,
  createdEndDate?: Date,
  updatedStartDate?: Date,
  updatedEndDate?: Date,
  status?: string,
  sortBy: string = "CreatedAt",
  ascending: boolean = false
) => {
  try {
    const params = new URLSearchParams();
    params.append("page", page.toString());
    params.append("pageSize", pageSize.toString());
    
    if (fullNameSearch) params.append("fullNameSearch", fullNameSearch);
    if (userNameSearch) params.append("userNameSearch", userNameSearch);
    if (emailSearch) params.append("emailSearch", emailSearch);
    if (phoneSearch) params.append("phoneSearch", phoneSearch);
    if (roleFilter) params.append("roleFilter", roleFilter);
    if (genderFilter) params.append("genderFilter", genderFilter);
    if (dobStartDate) params.append("dobStartDate", dobStartDate.toISOString());
    if (dobEndDate) params.append("dobEndDate", dobEndDate.toISOString());
    if (createdStartDate) params.append("createdStartDate", createdStartDate.toISOString());
    if (createdEndDate) params.append("createdEndDate", createdEndDate.toISOString());
    if (updatedStartDate) params.append("updatedStartDate", updatedStartDate.toISOString());
    if (updatedEndDate) params.append("updatedEndDate", updatedEndDate.toISOString());
    if (status) params.append("status", status);
    params.append("sortBy", sortBy);
    params.append("ascending", ascending.toString());

    console.log('Exporting users with config:', config);
    console.log('Query params:', params.toString());
    console.log('Export all pages:', config.exportAllPages);

    const response = await api.post(
      `/user-management/users/export-excel-config?${params.toString()}`,
      config
    );
    
    return response.data;
  } catch (error) {
    throw error;
  }
};

export const getUserStatistics = async (
  startDate?: Date,
  endDate?: Date
): Promise<ApiResponse<UserStatisticsDTO>> => {
  try {
    // Format dates for API request
    const startDateStr = startDate ? startDate.toISOString() : undefined;
    const endDateStr = endDate ? endDate.toISOString() : undefined;

    console.log("Sending API request with params:", { startDate: startDateStr, endDate: endDateStr });
    
    // Build query parameters
    const params = new URLSearchParams();
    if (startDateStr) params.append("startDate", startDateStr);
    if (endDateStr) params.append("endDate", endDateStr);
    
    const query = params.toString() ? `?${params.toString()}` : "";
    
    const response = await api.get<ApiResponse<UserStatisticsDTO>>(
      `/user-management/users/statistics${query}`
    );
    
    console.log("API response for statistics:", response.data);
    
    return response.data;
  } catch (error) {
    console.error("Error fetching user statistics:", error);
    throw error;
  }
};

export const getUserById = async (userId: string): Promise<UserResponseDTO> => {
  try {
    const response = await api.get(`/user-management/users/${userId}`);
    return response.data.data;
  } catch (error) {
    throw error;
  }
};

export const getActiveUsersWithoutInsurance = async () => {
  try {
    const response = await api.get("/user-management/users/active-without-insurance");
    return {
      isSuccess: response.data.isSuccess,
      code: response.data.code,
      message: response.data.message,
      data: response.data.data || [],
    };
  } catch (error: any) {
    console.error("Error fetching active users without insurance:", error);
    return {
      isSuccess: false,
      code: error.response?.status || 500,
      message: error.response?.data?.message || "Failed to fetch users without insurance",
      data: [],
    };
  }
};

export const updateProfileImage = async (imageFile: File) => {
  try {
    const formData = new FormData();
    formData.append('imageFile', imageFile);
    
    console.log('Sending profile image update request with file:', imageFile.name, imageFile.size);
    
    const response = await api.put('/user-management/users/update-profile-image', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    
    console.log('Profile image update response:', response.data);
    
    // Kiểm tra response có cấu trúc đúng không
    if (!response.data) {
      throw new Error('Empty response received from server');
    }
    
    return response.data;
  } catch (error: any) {
    console.error('Error updating profile image:', error);
    console.error('Error response:', error.response?.data);
    throw error;
  }
};

export const updateUserImage = async (userId: string, imageFile: File) => {
  try {
    const formData = new FormData();
    formData.append('imageFile', imageFile);
    
    console.log(`Sending user image update request with file: ${imageFile.name}, size: ${imageFile.size}, for user: ${userId}`);
    
    const response = await api.put(`/user-management/users/${userId}/update-image`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    
    console.log('User image update response:', response.data);
    
    // Kiểm tra response có cấu trúc đúng không
    if (!response.data) {
      throw new Error('Empty response received from server');
    }
    
    return response.data;
  } catch (error: any) {
    console.error(`Error updating image for user ${userId}:`, error);
    console.error('Error response:', error.response?.data);
    throw error;
  }
};
