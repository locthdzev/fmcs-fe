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

export interface TruckExportConfigDTO {
  // Basic truck information
  includeLicensePlate: boolean;
  includeDriverName: boolean;
  includeDriverContact: boolean;
  includeDescription: boolean;
  
  // Image information
  includeTruckImage: boolean;
  
  // Time information
  includeCreatedAt: boolean;
  includeUpdatedAt: boolean;
  
  // Status information
  includeStatus: boolean;
  
  // Export file name option
  fileName?: string;
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

export const activateTrucks = async (truckIds: string[]) => {
  try {
    const response = await api.put(
      "/truck-management/trucks/activate",
      truckIds
    );
    return response.data;
  } catch (error) {
    throw error;
  }
};

export const deactivateTrucks = async (truckIds: string[]) => {
  try {
    const response = await api.put(
      "/truck-management/trucks/deactivate",
      truckIds
    );
    return response.data;
  } catch (error) {
    throw error;
  }
};

export const exportTrucksToExcel = async (
  config: TruckExportConfigDTO,
  queryParams?: {
    exportAllPages?: boolean;
    page?: number;
    pageSize?: number;
    licensePlateSearch?: string;
    driverNameSearch?: string;
    driverContactSearch?: string;
    descriptionSearch?: string;
    sortBy?: string;
    ascending?: boolean;
    status?: string;
    createdStartDate?: Date | string;
    createdEndDate?: Date | string;
    updatedStartDate?: Date | string;
    updatedEndDate?: Date | string;
  }
) => {
  try {
    let url = "/truck-management/trucks/export-excel";
    
    if (queryParams) {
      const params = new URLSearchParams();
      
      if (queryParams.exportAllPages) {
        params.append("page", "1");
        params.append("pageSize", "1000000");
        params.append("exportAllPages", "true");
      } else {
        if (queryParams.page) params.append("page", queryParams.page.toString());
        if (queryParams.pageSize) params.append("pageSize", queryParams.pageSize.toString());
        params.append("exportAllPages", "false");
      }
      
      if (queryParams.licensePlateSearch) params.append("licensePlateSearch", queryParams.licensePlateSearch);
      if (queryParams.driverNameSearch) params.append("driverNameSearch", queryParams.driverNameSearch);
      if (queryParams.driverContactSearch) params.append("driverContactSearch", queryParams.driverContactSearch);
      if (queryParams.descriptionSearch) params.append("descriptionSearch", queryParams.descriptionSearch);
      if (queryParams.sortBy) params.append("sortBy", queryParams.sortBy);
      if (queryParams.ascending !== undefined) params.append("ascending", queryParams.ascending.toString());
      if (queryParams.status) params.append("status", queryParams.status);
      
      if (queryParams.createdStartDate) {
        const date = typeof queryParams.createdStartDate === 'string' 
          ? queryParams.createdStartDate 
          : queryParams.createdStartDate.toISOString();
        params.append("createdStartDate", date);
      }
      
      if (queryParams.createdEndDate) {
        const date = typeof queryParams.createdEndDate === 'string'
          ? queryParams.createdEndDate
          : queryParams.createdEndDate.toISOString();
        params.append("createdEndDate", date);
      }
      
      if (queryParams.updatedStartDate) {
        const date = typeof queryParams.updatedStartDate === 'string'
          ? queryParams.updatedStartDate
          : queryParams.updatedStartDate.toISOString();
        params.append("updatedStartDate", date);
      }
      
      if (queryParams.updatedEndDate) {
        const date = typeof queryParams.updatedEndDate === 'string'
          ? queryParams.updatedEndDate
          : queryParams.updatedEndDate.toISOString();
        params.append("updatedEndDate", date);
      }
      
      url += `?${params.toString()}`;
    }
    
    const response = await api.post(url, config);
    return response.data;
  } catch (error) {
    throw error;
  }
};
