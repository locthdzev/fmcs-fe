import api from "./customize-axios";

interface SendOtpRequest {
  emailOrUserName: string;
}

interface VerifyOtpRequest {
  emailOrUserName: string;
  OTPCode: string;
}

interface OtpResponse {
  isSuccess: boolean;
  code: number;
  message?: string;
  responseFailed?: string;
}

export const sendOtp = async (
  emailOrUserName: string
): Promise<OtpResponse> => {
  try {
    const response = await api.post<OtpResponse>("/otp-management/send", {
      emailOrUserName,
    });
    return response.data;
  } catch (error) {
    const err = error as any;
    throw new Error(
      err.response?.data?.message || "An error occurred while sending OTP"
    );
  }
};

export const verifyOtp = async (
  credentials: VerifyOtpRequest
): Promise<OtpResponse> => {
  try {
    const response = await api.post<OtpResponse>("/otp-management/verify", {
      emailOrUserName: credentials.emailOrUserName,
      OTPCode: credentials.OTPCode,
    });
    return response.data;
  } catch (error) {
    const err = error as any;
    throw new Error(
      err.response?.data?.message || "An error occurred while verifying OTP"
    );
  }
};
