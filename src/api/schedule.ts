import api from "./customize-axios";

export interface ScheduleResponse {
  id: string;
  staffId: string;
  shiftId: string;
  workDate: string;
  note?: string;
  status?: string;
  createdAt: string;
  updatedAt?: string;
}

export interface ScheduleTodayResponse {
  id: string;
  staffId: string;
  shiftId: string;
  workDate: string;
  note?: string;
  status?: string;
  createdAt: string;
  updatedAt?: string;
  staffName?: string;
  shiftName?: string;
  shiftStartTime?: string;
  shiftEndTime?: string;
}

export interface StaffScheduleResponse {
  id: string;
  shiftId: string;
  workDate: string;
  note?: string;
  status?: string;
  createdAt: string;
  updatedAt?: string;
  shiftName?: string;
  startTime?: string;
  endTime?: string;
  dayOfWeek?: string;
}

export interface ScheduleCreateRequest {
  staffId: string;
  shiftId: string;
  workDate: string;
  note?: string;
  isRecurring: boolean;
  recurringDays?: string[];
  recurringEndDate?: string;
}

export interface ScheduleCreateMultipleRequest {
  staffId: string;
  shiftIds: string[];
  workDate: string;
  note?: string;
  isRecurring: boolean;
  recurringDays?: string[];
  recurringEndDate?: string;
}

export interface ScheduleCreateMultipleForShiftRequest {
  shiftId: string;
  staffIds: string[];
  workDate: string;
  note?: string;
  isRecurring: boolean;
  recurringDays?: string[];
  recurringEndDate?: string;
}

export interface ScheduleUpdateRequest {
  id: string;
  staffId: string;
  shiftId: string;
  workDate: string;
  note?: string;
  status?: string;
}

export const getSchedulesByDateRange = async (
  startDate: string,
  endDate: string
) => {
  try {
    const response = await api.get("/schedule-management/schedules", {
      params: {
        startDate,
        endDate,
      },
    });
    return response.data.data;
  } catch (error) {
    throw error;
  }
};

export const getStaffSchedulesForToday = async () => {
  try {
    const response = await api.get(
      "/schedule-management/schedules/staff/today"
    );
    return response.data;
  } catch (error) {
    throw error;
  }
};

export const getCurrentUserSchedules = async (
  startDate: string,
  endDate: string
) => {
  try {
    const response = await api.get("/schedule-management/schedules/me", {
      params: {
        startDate,
        endDate,
      },
    });
    return response.data;
  } catch (error) {
    throw error;
  }
};

export const getStaffSchedulesByDateRange = async (
  staffId: string,
  startDate: string,
  endDate: string
) => {
  try {
    const response = await api.get(`/schedule-management/schedules/staff/${staffId}`, {
      params: {
        startDate,
        endDate,
      },
    });
    return response.data;
  } catch (error) {
    throw error;
  }
};

export const createSchedule = async (scheduleData: ScheduleCreateRequest) => {
  try {
    const response = await api.post(
      "/schedule-management/schedules",
      scheduleData
    );
    return response.data;
  } catch (error) {
    throw error;
  }
};

export const createMultipleSchedulesForStaff = async (
  scheduleData: ScheduleCreateMultipleRequest
) => {
  try {
    const response = await api.post(
      "/schedule-management/schedules/multiple-for-staff",
      scheduleData
    );
    return response.data;
  } catch (error) {
    throw error;
  }
};

export const createMultipleSchedulesForShift = async (
  scheduleData: ScheduleCreateMultipleForShiftRequest
) => {
  try {
    const response = await api.post(
      "/schedule-management/schedules/multiple-for-shift",
      scheduleData
    );
    return response.data;
  } catch (error) {
    throw error;
  }
};

export const updateSchedule = async (scheduleData: ScheduleUpdateRequest) => {
  try {
    const response = await api.put(
      "/schedule-management/schedules",
      scheduleData
    );
    return response.data;
  } catch (error) {
    throw error;
  }
};

export const deleteSchedule = async (id: string) => {
  try {
    const response = await api.delete(`/schedule-management/schedules/${id}`);
    return response.data;
  } catch (error) {
    throw error;
  }
};
