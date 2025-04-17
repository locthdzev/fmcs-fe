import api from "./customize-axios";

export interface UserInfo {
  id: string;
  fullName: string;
  userName?: string;
  email: string;
  imageURL?: string;
}

export interface StaffInfo {
  id: string;
  fullName: string;
  userName?: string;
  email: string;
  imageURL?: string;
}

export interface AppointmentInfo {
  id: string;
  appointmentDate: string;
  reason?: string;
  status?: string;
}

export interface SurveyResponse {
  id: string;
  user: UserInfo;
  staff: StaffInfo;
  appointment?: AppointmentInfo;
  surveyDate: string;
  rating: number;
  feedback?: string;
  createdAt: string;
  updatedAt?: string;
  status?: string;
}

export interface SurveyCreateRequest {
  userId: string;
  staffId: string;
  appointmentId?: string;
  surveyDate: string;
  rating: number;
  feedback?: string;
}

export interface SurveyUpdateRequest {
  rating: number;
  feedback?: string;
  status?: string;
  sendEmailToStaff?: boolean;
}

export interface SurveyExportConfig {
  exportAllPages: boolean;
  includeUser: boolean;
  includeStaff: boolean;
  includeAppointment: boolean;
  includeSurveyDate: boolean;
  includeRating: boolean;
  includeFeedback: boolean;
  includeStatus: boolean;
  includeCreatedAt: boolean;
  includeUpdatedAt: boolean;
}

export interface GetSurveysParams {
  page?: number;
  pageSize?: number;
  userSearch?: string;
  staffSearch?: string;
  ratingFilter?: number;
  sortBy?: string;
  ascending?: boolean;
  status?: string;
  surveyStartDate?: string;
  surveyEndDate?: string;
  createdStartDate?: string;
  createdEndDate?: string;
}

export interface ResultDTO<T> {
  isSuccess: boolean;
  code: number;
  data: T;
  message: string;
  responseFailed?: any;
}

export const getSurveys = async (params?: GetSurveysParams) => {
  try {
    const response = await api.get("/survey-management/surveys", { params });
    return response.data;
  } catch (error) {
    throw error;
  }
};

export const getSurveyById = async (id: string) => {
  try {
    if (!id) {
      console.error("Survey ID is required but was empty");
      throw new Error("Survey ID is required");
    }
    
    // Kiểm tra xem id có phải là GUID hợp lệ không
    const guidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    if (!guidRegex.test(id)) {
      console.error("Invalid survey ID format:", id);
      throw new Error("Invalid survey ID format");
    }
    
    // Chuyển ID về lowercase để đảm bảo tính nhất quán
    const normalizedId = id.toLowerCase();
    
    console.log("Fetching survey with normalized ID:", normalizedId);
    console.log("Request URL:", `/survey-management/surveys/${normalizedId}`);
    
    const response = await api.get(`/survey-management/surveys/${normalizedId}`);
    
    console.log("API Response:", response);
    
    if (!response.data) {
      console.error("API response missing data field");
      throw new Error("Invalid API response format");
    }
    
    if (!response.data.isSuccess) {
      console.error("API returned error:", response.data.message, "Code:", response.data.code);
      throw new Error(response.data.message || `Failed to fetch survey (Code: ${response.data.code})`);
    }
    
    console.log("Survey data successfully retrieved:", response.data.data);
    return response.data;
  } catch (error: any) {
    console.error("Error fetching survey:", error);
    if (error.response?.status === 404) {
      throw new Error("Survey not found");
    }
    if (error.response?.status === 400) {
      throw new Error(error.response.data.message || "Invalid survey ID");
    }
    if (error.response?.status === 401) {
      throw new Error("Unauthorized. Please log in again.");
    }
    throw new Error(error.response?.data?.message || error.message || "Failed to fetch survey");
  }
};

export const createSurvey = async (surveyData: SurveyCreateRequest) => {
  try {
    const response = await api.post("/survey-management/surveys", surveyData);
    return response.data;
  } catch (error) {
    throw error;
  }
};

export const updateSurvey = async (id: string, surveyData: SurveyUpdateRequest) => {
  try {
    console.log(`Updating survey with ID: ${id}`);
    console.log('Request payload:', JSON.stringify(surveyData));
    
    // Đảm bảo rating là số
    if (surveyData.rating !== undefined) {
      const numRating = Number(surveyData.rating);
      if (isNaN(numRating)) {
        throw new Error("Rating must be a number");
      }
      surveyData.rating = numRating;
    }
    
    // Đảm bảo ID được chuẩn hóa 
    const normalizedId = id.toLowerCase();
    
    // Đảm bảo request đúng định dạng
    const cleanData = {
      rating: surveyData.rating,
      feedback: surveyData.feedback || "",
      status: surveyData.status || "Completed"
    };
    
    console.log('Clean request payload:', JSON.stringify(cleanData));
    
    const response = await api.put(`/survey-management/surveys/${normalizedId}`, cleanData);
    console.log('Update survey response:', response.data);
    return response.data;
  } catch (error: any) {
    console.error('Error updating survey:', error);
    
    if (error.response) {
      console.error('Error status:', error.response.status);
      console.error('Error data:', error.response.data);
      
      if (error.response.status === 400) {
        const message = error.response.data?.message || 
                       error.response.data?.title || 
                       'Invalid request format';
        throw new Error(`Bad request: ${message}`);
      }
    }
    
    throw error;
  }
};

export const getAppointmentBySurveyId = async (surveyId: string) => {
  try {
    const response = await api.get(`/survey-management/surveys/${surveyId}/appointment`);
    return response.data;
  } catch (error) {
    throw error;
  }
};

export const getSurveysByStaffId = async (
  staffId: string, 
  params?: {
    page?: number;
    pageSize?: number;
    sortBy?: string;
    ascending?: boolean;
    ratingFilter?: number;
    startDate?: string;
    endDate?: string;
  }
) => {
  try {
    const response = await api.get(`/survey-management/surveys/by-staff/${staffId}`, { params });
    return response.data;
  } catch (error) {
    throw error;
  }
};

export const getSurveysByUserId = async (
  userId: string, 
  params?: {
    page?: number;
    pageSize?: number;
    sortBy?: string;
    ascending?: boolean;
    ratingFilter?: number;
    startDate?: string;
    endDate?: string;
  }
) => {
  try {
    console.log(`Fetching surveys for user ${userId} with params:`, params);
    const response = await api.get(`/survey-management/surveys/by-user/${userId}`, { params });
    console.log('Raw API response for user surveys:', response);
    console.log('Response data structure:', JSON.stringify(response.data));
    return response.data;
  } catch (error) {
    console.error('Error in getSurveysByUserId:', error);
    throw error;
  }
};

export const exportSurveysToExcel = async (
  config: SurveyExportConfig,
  params?: GetSurveysParams
) => {
  try {
    const response = await api.post("/survey-management/surveys/export-excel-config", config, { params });
    return response.data;
  } catch (error) {
    throw error;
  }
};

export const createSurveyForFinishedAppointment = async (
  appointmentId: string
): Promise<ResultDTO<SurveyResponse>> => {
  try {
    const response = await api.post("/survey-management/surveys/create-from-appointment", {
      appointmentId,
    });
    if (!response.data.isSuccess) {
      throw new Error(response.data.message || `Failed to create survey (Code: ${response.data.code})`);
    }
    return response.data;
  } catch (error: any) {
    console.error("Error creating survey from appointment:", error);
    throw new Error(error.response?.data?.message || error.message || "Failed to create survey from appointment");
  }
};

export interface GetAppointmentsWithoutSurveysParams {
  page?: number;
  pageSize?: number;
  userSearch?: string;
  staffSearch?: string;
  sortBy?: string;
  ascending?: boolean;
  startDate?: string;
  endDate?: string;
}

export const getAppointmentsWithoutSurveys = async (params?: GetAppointmentsWithoutSurveysParams) => {
  try {
    const response = await api.get("/survey-management/appointments/without-surveys", { params });
    return response.data;
  } catch (error) {
    throw error;
  }
};

export const testSurveyApiConnection = async (): Promise<{isConnected: boolean, message: string}> => {
  try {
    console.log("Testing API connection...");
    const response = await api.get("/survey-management/surveys", {
      params: {
        page: 1,
        pageSize: 1
      }
    });
    
    if (response && response.data) {
      console.log("API connection successful");
      return {
        isConnected: true,
        message: "API connection successful"
      };
    } else {
      console.error("API connection failed - invalid response format");
      return {
        isConnected: false,
        message: "API connection failed - invalid response format"
      };
    }
  } catch (error: any) {
    console.error("API connection test failed:", error);
    return {
      isConnected: false,
      message: `API connection failed: ${error.message || "Unknown error"}`
    };
  }
};
