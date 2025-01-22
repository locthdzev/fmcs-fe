import api from "./customize-axios";

export const getUsers = async () => {
  try {
    const response = await api.get("/user-management/users");
    return response.data;
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
