import api from "./customize-axios";

export const getUsers = async () => {
  try {
    const response = await api.get("/user-management/users");
    return response.data.data; // Adjusted to return the user profiles from the response
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
      return response.data.data; // Chỉ trả về trường `data`
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

export const updateAccountsStatus = async (updateStatusData: UpdateAccountsStatusRequest) => {
  try {
    const response = await api.put("/user-management/users/status", updateStatusData);
    return response.data;
  } catch (error) {
    throw error;
  }
};