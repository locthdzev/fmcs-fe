import api from "./customize-axios";

export interface DrugGroupResponse {
  id: string;
  groupName: string;
  description?: string;
  createdAt: string;
  updatedAt?: string;
  status?: string;
}

export interface DrugGroupCreateRequest {
  groupName: string;
  description?: string;
  createdAt: string;
  status?: string;
}

export interface DrugGroupUpdateRequest {
  groupName: string;
  description?: string;
  createdAt: string;
  updatedAt?: string;
  status?: string;
}

export const getDrugGroups = async () => {
  try {
    const response = await api.get("/druggroup-management/druggroups");
    return response.data.data;
  } catch (error) {
    throw error;
  }
};

export const getDrugGroupById = async (id: string) => {
  try {
    const response = await api.get(`/druggroup-management/druggroups/${id}`);
    return response.data.data;
  } catch (error) {
    throw error;
  }
};

export const createDrugGroup = async (
  drugGroupData: DrugGroupCreateRequest
) => {
  try {
    const formData = new FormData();
    Object.entries(drugGroupData).forEach(([key, value]) => {
      if (value !== undefined) {
        formData.append(key, value);
      }
    });
    const response = await api.post(
      "/druggroup-management/druggroups",
      formData
    );
    return response.data;
  } catch (error) {
    throw error;
  }
};

export const updateDrugGroup = async (
  id: string,
  drugGroupData: DrugGroupUpdateRequest
) => {
  try {
    const formData = new FormData();
    Object.entries(drugGroupData).forEach(([key, value]) => {
      if (value !== undefined) {
        formData.append(key, value);
      }
    });
    const response = await api.put(
      `/druggroup-management/druggroups/${id}`,
      formData
    );
    return response.data;
  } catch (error) {
    throw error;
  }
};

export const activateDrugGroups = async (drugGroupIds: string[]) => {
  try {
    const response = await api.put(
      "/druggroup-management/druggroups/activate",
      drugGroupIds
    );
    return response.data;
  } catch (error) {
    throw error;
  }
};

export const deactivateDrugGroups = async (drugGroupIds: string[]) => {
  try {
    const response = await api.put(
      "/druggroup-management/druggroups/deactivate",
      drugGroupIds
    );
    return response.data;
  } catch (error) {
    throw error;
  }
};
