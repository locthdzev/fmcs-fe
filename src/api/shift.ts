import api from "./customize-axios";

export interface ShiftResponse {
  id: string;
  shiftName: string;
  startTime: string;
  endTime: string;
  createdAt: string;
  updatedAt?: string;
  status: string;
}

export interface ShiftCreateRequest {
  shiftName: string;
  startTime: string;
  endTime: string;
}

export interface ShiftUpdateRequest {
  shiftName: string;
  startTime: string;
  endTime: string;
}

export const getShifts = async () => {
  try {
    const response = await api.get("/shift-management/shifts");
    return response.data.data;
  } catch (error) {
    throw error;
  }
};

export const getShiftById = async (id: string) => {
  try {
    const response = await api.get(`/shift-management/shifts/${id}`);
    return response.data.data;
  } catch (error) {
    throw error;
  }
};

export const createShift = async (shiftData: ShiftCreateRequest) => {
  try {
    const response = await api.post("/shift-management/shifts", shiftData);
    return response.data;
  } catch (error) {
    throw error;
  }
};

export const updateShift = async (
  id: string,
  shiftData: ShiftUpdateRequest
) => {
  try {
    const response = await api.put(`/shift-management/shifts/${id}`, shiftData);
    return response.data;
  } catch (error) {
    throw error;
  }
};

export const deleteShift = async (id: string) => {
  try {
    const response = await api.delete(`/shift-management/shifts/${id}`);
    return response.data;
  } catch (error) {
    throw error;
  }
};

export const activateShifts = async (shiftIds: string[]) => {
  try {
    const response = await api.put(
      "/shift-management/shifts/activate",
      shiftIds
    );
    return response.data;
  } catch (error) {
    throw error;
  }
};

export const deactivateShifts = async (shiftIds: string[]) => {
  try {
    const response = await api.put(
      "/shift-management/shifts/deactivate",
      shiftIds
    );
    return response.data;
  } catch (error) {
    throw error;
  }
};
