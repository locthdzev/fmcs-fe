import api from "./customize-axios";

export interface DrugResponse {
  id: string;
  drugGroup: {
    id: string;
    groupName: string;
  };
  drugCode: string;
  name: string;
  unit: string;
  price: number;
  description?: string;
  manufacturer?: string;
  createdAt: string;
  updatedAt?: string;
  status?: string;
  imageUrl?: string;
}

export interface DrugCreateRequest {
  drugGroupId?: string;
  drugCode: string;
  name: string;
  unit: string;
  price: number;
  description?: string;
  manufacturer?: string;
  createdAt: string;
  status?: string;
  imageUrl?: string;
}

export interface DrugUpdateRequest {
  drugGroupId?: string;
  drugCode: string;
  name: string;
  unit: string;
  price: number;
  description?: string;
  manufacturer?: string;
  createdAt: string;
  updatedAt?: string;
  status?: string;
  imageUrl?: string;
}

export const getDrugs = async () => {
  try {
    const response = await api.get("/drug-management/drugs");
    return response.data.data;
  } catch (error) {
    throw error;
  }
};

export const getDrugById = async (id: string) => {
  try {
    const response = await api.get(`/drug-management/drugs/${id}`);
    return response.data.data;
  } catch (error) {
    throw error;
  }
};

export const createDrug = async (drugData: FormData) => {
  try {
    const response = await api.post("/drug-management/drugs", drugData);
    return response.data;
  } catch (error) {
    throw error;
  }
};

export const updateDrug = async (id: string, drugData: FormData) => {
  try {
    const response = await api.put(`/drug-management/drugs/${id}`, drugData);
    return response.data;
  } catch (error) {
    throw error;
  }
};

export const deleteDrug = async (id: string) => {
  try {
    const response = await api.delete(`/drug-management/drugs/${id}`);
    return response.data;
  } catch (error) {
    throw error;
  }
};

export const activateDrugs = async (drugIds: string[]) => {
  try {
    const response = await api.put("/drug-management/drugs/activate", drugIds);
    return response.data;
  } catch (error) {
    throw error;
  }
};

export const deactivateDrugs = async (drugIds: string[]) => {
  try {
    const response = await api.put(
      "/drug-management/drugs/deactivate",
      drugIds
    );
    return response.data;
  } catch (error) {
    throw error;
  }
};
