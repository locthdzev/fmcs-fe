import api from "./customize-axios";

interface LoginRequest {
  username: string;
  password: string;
}

interface GoogleLoginRequest {
  idToken: string;
}

interface ResetPasswordRequest {
  emailOrUsername: string;
  password: string;
}

interface ChangePasswordRequest {
  oldPassword: string;
  newPassword: string;
}

interface ChangePasswordRequestDTO {
  oldPassword: string;
  newPassword: string;
}

interface LoginResponse {
  isSuccess: boolean;
  code: number;
  data?: {
    user: {
      id: string;
      fullName: string;
      userName: string;
      email: string;
      gender: string;
      dob: string;
      address: string;
      phone: string;
      createdAt: string;
      status: string;
    };
    token: string;
  };
  responseFailed?: string;
  message?: string;
}

interface GoogleLoginResponse {
  isSuccess: boolean;
  code: number;
  data?: {
    user: {
      id: string;
      fullName: string;
      userName: string;
      email: string;
      gender: string;
      dob: string;
      address: string;
      phone: string;
      createdAt: string;
      status: string;
    };
    token: string;
  };
  responseFailed?: string;
  message?: string;
}

interface ResetPasswordResponse {
  isSuccess: boolean;
  code: number;
  message?: string;
  responseFailed?: string;
}

interface ChangePasswordResponse {
  isSuccess: boolean; // Corrected from 'success' to 'isSuccess'
  code: number;
  message?: string;
  responseFailed?: string;
}

export const login = async (
  credentials: LoginRequest
): Promise<LoginResponse> => {
  try {
    const response = await api.post<LoginResponse>("/auth/login", credentials);
    return response.data;
  } catch (error) {
    const err = error as any;
    throw new Error(
      err.response?.data?.message || "An error occurred with the API"
    );
  }
};

export const loginWithGoogle = async (
  idToken: GoogleLoginRequest
): Promise<GoogleLoginResponse> => {
  try {
    const response = await api.post<GoogleLoginResponse>("/auth/login-google", {
      idToken,
    });
    return response.data;
  } catch (error) {
    const err = error as any;
    throw new Error(
      err.response?.data?.message || "An error occurred with the API"
    );
  }
};

export const resetPassword = async (
  resetRequest: ResetPasswordRequest
): Promise<ResetPasswordResponse> => {
  try {
    const response = await api.post<ResetPasswordResponse>(
      "/auth/reset-password",
      resetRequest
    );
    return response.data;
  } catch (error) {
    const err = error as any;
    throw new Error(
      err.response?.data?.message || "An error occurred with the API"
    );
  }
};

export const changePassword = async (
  changeRequest: ChangePasswordRequest
): Promise<ChangePasswordResponse> => {
  try {
    const response = await api.post<ChangePasswordResponse>(
      "/auth/change-password",
      changeRequest
    );
    return response.data;
  } catch (error) {
    const err = error as any;
    throw new Error(
      err.response?.data?.message || "An error occurred with the API"
    );
  }
};

export const logout = (): void => {
  localStorage.removeItem("token");
};

export const changePasswordDTO = async (
  changeRequest: ChangePasswordRequestDTO
): Promise<ChangePasswordResponse> => {
  try {
    const response = await api.post<ChangePasswordResponse>(
      "/auth/change-password",
      changeRequest
    );
    return response.data;
  } catch (error) {
    const err = error as any;
    throw new Error(
      err.response?.data?.message || "An error occurred with the API"
    );
  }
};
