import api, { setupSignalRConnection } from "./customize-axios";

export interface InventoryRecordResponseDTO {
  id: string;
  drug: { 
    id: string; 
    drugCode: string; 
    name: string;
  };
  batchCode: string;
  quantityInStock: number;
  reorderLevel: number;
  lastUpdated: string | null;
  createdAt: string;
  status: string;
}

export interface InventoryRecordUpdateRequestDTO {
  reorderLevel: number;
}

export const getAllInventoryRecords = async (
  page: number = 1,
  pageSize: number = 10,
  search?: string
) => {
  const response = await api.get(
    "/inventoryrecord-management/inventoryrecords",
    {
      params: { page, pageSize, search },
    }
  );
  return response.data;
};

export const getInventoryRecordById = async (id: string) => {
  try {
    const response = await api.get(
      `/inventoryrecord-management/inventoryrecords/${id}`
    );
    
    // The API returns a wrapper object with isSuccess, data, etc.
    return response.data;
  } catch (error) {
    console.error(`Error fetching inventory record with ID ${id}:`, error);
    throw error;
  }
};

export const updateInventoryRecord = async (
  id: string,
  data: InventoryRecordUpdateRequestDTO
) => {
  const response = await api.put(
    `/inventoryrecord-management/inventoryrecords/${id}`,
    data
  );
  return response.data;
};

export const getInventoryRecordsByDrugId = async (drugId: string) => {
  const response = await api.get(
    `/inventoryrecord-management/inventoryrecords/by-drug/${drugId}`
  );
  return response.data.data;
};

export const getInventoryRecordsByBatchId = async (batchId: string) => {
  const response = await api.get(
    `/inventoryrecord-management/inventoryrecords/by-batch/${batchId}`
  );
  return response.data.data;
};

export const getInventoryRecordsBelowReorderLevel = async () => {
  const response = await api.get(
    "/inventoryrecord-management/inventoryrecords/below-reorder-level"
  );
  return response.data.data;
};

export const getInventoryRecordsByStatus = async (status: string) => {
  const response = await api.get(
    `/inventoryrecord-management/inventoryrecords/by-status/${status}`
  );
  return response.data.data;
};

export const setupInventoryRecordRealTime = (
  callback: (data: InventoryRecordResponseDTO) => void
) => {
  return setupSignalRConnection("/inventoryRecordHub", callback);
};

export interface DrugStatisticsDTO {
  drugId: string;
  drugName: string;
  drugCode: string;
  totalQuantity: number;
}

export interface InventoryStatisticsDTO {
  totalActiveInventoryRecords: number;
  totalDrugsInStock: number;
  totalQuantityInStock: number;
  lowStockItems: number;
  periodStart?: string;
  periodEnd?: string;
  inventoryStatusDistribution: Record<string, number>;
  topDrugsByQuantity: DrugStatisticsDTO[];
}

export const getInventoryStatistics = async (startDate?: Date, endDate?: Date) => {
  try {
    const params: any = {};
    
    if (startDate) {
      params.startDate = startDate.toISOString();
    }
    
    if (endDate) {
      params.endDate = endDate.toISOString();
    }
    
    const response = await api.get("/inventoryrecord-management/statistics", { params });
    
    if (response.data && (response.data.isSuccess || response.data.IsSuccess)) {
      return {
        success: true,
        data: response.data.data || response.data.Data,
        message: response.data.message || response.data.Message
      };
    } else {
      return {
        success: false,
        message: response.data.message || response.data.Message || "Failed to fetch inventory statistics",
        data: null
      };
    }
  } catch (error: any) {
    console.error("Error fetching inventory statistics:", error);
    return {
      success: false,
      message: error.response?.data?.message || error.message || "An unexpected error occurred",
      data: null
    };
  }
};
