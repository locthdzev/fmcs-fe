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

export interface DrugGroupExportConfig {
  exportAllPages: boolean;
  includeGroupName: boolean;
  includeDescription: boolean;
  includeCreatedAt: boolean;
  includeUpdatedAt: boolean;
  includeStatus: boolean;
}

export interface DrugGroupsFilter {
  page?: number;
  pageSize?: number;
  groupNameSearch?: string;
  descriptionSearch?: string;
  sortBy?: string;
  ascending?: boolean;
  status?: string;
  createdStartDate?: Date | null;
  createdEndDate?: Date | null;
  updatedStartDate?: Date | null;
  updatedEndDate?: Date | null;
  count?: boolean;
}

export const getDrugGroups = async (filters?: DrugGroupsFilter) => {
  try {
    const params = new URLSearchParams();
    
    if (filters) {
      if (filters.page) params.append('page', filters.page.toString());
      if (filters.pageSize) params.append('pageSize', filters.pageSize.toString());
      if (filters.groupNameSearch) params.append('groupNameSearch', filters.groupNameSearch);
      if (filters.descriptionSearch) params.append('descriptionSearch', filters.descriptionSearch);
      if (filters.sortBy) params.append('sortBy', filters.sortBy);
      if (filters.ascending !== undefined) params.append('ascending', filters.ascending.toString());
      if (filters.status) params.append('status', filters.status);
      if (filters.createdStartDate) params.append('createdStartDate', filters.createdStartDate.toISOString());
      if (filters.createdEndDate) params.append('createdEndDate', filters.createdEndDate.toISOString());
      if (filters.updatedStartDate) params.append('updatedStartDate', filters.updatedStartDate.toISOString());
      if (filters.updatedEndDate) params.append('updatedEndDate', filters.updatedEndDate.toISOString());
      params.append('count', 'true');
      
      if (filters.count && !filters.page && !filters.pageSize) {
        params.append('pageSize', '1000');
        params.append('page', '1');
      }
    } else {
      params.append('count', 'true');
      params.append('pageSize', '1000');
      params.append('page', '1');
    }
    
    const url = `/druggroup-management/druggroups${params.toString() ? `?${params.toString()}` : ''}`;
    console.log("Calling API URL:", url);
    const response = await api.get(url);
    console.log("API Response:", response);
    return response.data;
  } catch (error) {
    console.error("API Error:", error);
    throw error;
  }
};

export const getDrugGroupById = async (id: string) => {
  try {
    console.log("API Call - Getting drug group by ID:", id);
    const response = await api.get(`/druggroup-management/druggroups/${id}`);
    console.log("API Response for drug group by ID:", response);
    
    // Xử lý response để đảm bảo luôn trả về đúng định dạng
    if (response && response.data) {
      // Nếu dữ liệu nằm trong response.data.data
      if (response.data.data) {
        console.log("Returning response.data.data:", response.data.data);
        return response.data.data;
      }
      // Hoặc nếu dữ liệu chính là response.data
      console.log("Returning response.data:", response.data);
      return response.data;
    }
    
    // Trường hợp không tìm thấy dữ liệu, trả về null
    console.log("No data found in response");
    return null;
  } catch (error) {
    console.error("Error in getDrugGroupById:", error);
    throw error;
  }
};

export const createDrugGroup = async (drugGroupData: DrugGroupCreateRequest) => {
  try {
    const response = await api.post("/druggroup-management/druggroups", drugGroupData);
    return response.data;
  } catch (error) {
    throw error;
  }
};

export const updateDrugGroup = async (id: string, drugGroupData: DrugGroupUpdateRequest) => {
  try {
    const response = await api.put(`/druggroup-management/druggroups/${id}`, drugGroupData);
    return response.data;
  } catch (error) {
    throw error;
  }
};

export const activateDrugGroups = async (drugGroupIds: string[]) => {
  try {
    const response = await api.put("/druggroup-management/druggroups/activate", drugGroupIds);
    return response.data;
  } catch (error) {
    throw error;
  }
};

export const deactivateDrugGroups = async (drugGroupIds: string[]) => {
  try {
    const response = await api.put("/druggroup-management/druggroups/deactivate", drugGroupIds);
    return response.data;
  } catch (error) {
    throw error;
  }
};

export const exportDrugGroupsToExcel = async (
  config: DrugGroupExportConfig,
  filters?: DrugGroupsFilter
) => {
  try {
    const params = new URLSearchParams();
    
    if (filters) {
      if (filters.page) params.append('page', filters.page.toString());
      if (filters.pageSize) params.append('pageSize', filters.pageSize.toString());
      if (filters.groupNameSearch) params.append('groupNameSearch', filters.groupNameSearch);
      if (filters.descriptionSearch) params.append('descriptionSearch', filters.descriptionSearch);
      if (filters.sortBy) params.append('sortBy', filters.sortBy);
      if (filters.ascending !== undefined) params.append('ascending', filters.ascending.toString());
      if (filters.status) params.append('status', filters.status);
      if (filters.createdStartDate) params.append('createdStartDate', filters.createdStartDate.toISOString());
      if (filters.createdEndDate) params.append('createdEndDate', filters.createdEndDate.toISOString());
      if (filters.updatedStartDate) params.append('updatedStartDate', filters.updatedStartDate.toISOString());
      if (filters.updatedEndDate) params.append('updatedEndDate', filters.updatedEndDate.toISOString());
    }
    
    const url = `/druggroup-management/druggroups/export-excel${params.toString() ? `?${params.toString()}` : ''}`;
    console.log("Calling Export API URL:", url);
    
    const response = await api.post(url, config);
    console.log("Export API Response:", response);
    
    return response.data;
  } catch (error) {
    console.error("Export API Error:", error);
    throw error;
  }
};
