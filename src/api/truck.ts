import api from "./customize-axios";

export interface TruckResponse {
  id: string;
  licensePlate: string;
  driverName?: string;
  driverContact?: string;
  truckImage?: string;
  description?: string;
  createdAt: string;
  updatedAt?: string;
  status?: string;
}

export interface TruckCreateRequest {
  licensePlate: string;
  driverName?: string;
  driverContact?: string;
  truckImage?: string;
  description?: string;
  createdAt: string;
  status?: string;
}

export interface TruckUpdateRequest {
  licensePlate: string;
  driverName?: string;
  driverContact?: string;
  truckImage?: string;
  description?: string;
  updatedAt?: string;
  status?: string;
}

export const getTrucks = async () => {
  try {
    const response = await api.get("/truck-management/trucks");
    return response.data.data;
  } catch (error) {
    throw error;
  }
};

export const getTruckById = async (id: string) => {
  try {
    const response = await api.get(`/truck-management/trucks/${id}`);
    return response.data.data;
  } catch (error) {
    throw error;
  }
};

export const createTruck = async (truckData: FormData) => {
  try {
    const response = await api.post("/truck-management/trucks", truckData);
    return response.data;
  } catch (error) {
    throw error;
  }
};

export const updateTruck = async (id: string, truckData: FormData) => {
  try {
    const response = await api.put(`/truck-management/trucks/${id}`, truckData);
    return response.data;
  } catch (error) {
    throw error;
  }
};

export const deleteTruck = async (id: string) => {
  try {
    const response = await api.delete(`/truck-management/trucks/${id}`);
    return response.data;
  } catch (error) {
    throw error;
  }
};