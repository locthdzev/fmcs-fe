import api from "./customize-axios";

export const getUsers = async () => {
  try {
    const response = await api.get("/user-management/users");
    return response.data.data;
  } catch (error) {
    throw error;
  }
};

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

export interface UpdateAccountsStatusRequest {
  userId: string[];
  status: string;
}

export const createUser = async (userCreateData: UserCreateRequest) => {
  try {
    const response = await api.post("/user-management/users", userCreateData);
    return response.data;
  } catch (error) {
    throw error;
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
