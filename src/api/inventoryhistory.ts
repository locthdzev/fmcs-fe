import api, { setupSignalRConnection } from "./customize-axios";

export interface InventoryHistoryResponseDTO {
  id: string;
  inventoryRecordId: string;
  changeDate: string;
  changeType: string;
  previousQuantity: number;
  newQuantity: number;
  previousPrice: number;
  newPrice: number;
  remarks?: string;
  userId: string;
  userName: string;
  user?: {
    id: string;
    userName: string;
    fullName: string;
    email: string;
  };
  status?: string;
  batchCode: string;
  drug: { id: string; drugCode: string; name: string };
}

export interface GroupedInventoryHistoriesDTO {
  totalInventoryRecords: number;
  items: InventoryHistoryGroup[];
}

export interface InventoryHistoryGroup {
  inventoryRecord: InventoryRecordInfo;
  histories: InventoryHistoryResponseDTO[];
}

export interface InventoryRecordInfo {
  id: string;
  batchCode: string;
  drug: { id: string; drugCode: string; name: string };
  quantityInStock: number;
  reorderLevel: number;
  status?: string;
}

export const getAllInventoryHistories = async (
  page: number = 1,
  pageSize: number = 10,
  search?: string
) => {
  const response = await api.get(
    "/inventoryhistory-management/inventoryhistories",
    {
      params: { page, pageSize, search },
    }
  );
  return response.data;
};

export const getInventoryHistoryById = async (id: string) => {
  const response = await api.get(
    `/inventoryhistory-management/inventoryhistories/${id}`
  );
  return response.data.data;
};

export const getInventoryHistoriesByInventoryRecordId = async (
  inventoryRecordId: string
) => {
  const response = await api.get(
    `/inventoryhistory-management/inventoryhistories/by-record/${inventoryRecordId}`
  );
  return response.data.data;
};

export const getGroupedInventoryHistories = async (
  page: number = 1,
  pageSize: number = 10,
  changeType?: string,
  startChangeDate?: string,
  endChangeDate?: string,
  userSearch?: string,
  sortBy: string = "ChangeDate",
  ascending: boolean = false,
  batchCodeSearch?: string,
  drugNameSearch?: string
) => {
  try {
    const response = await api.get(
      "/inventoryhistory-management/inventoryhistories/grouped",
      {
        params: {
          page,
          pageSize,
          changeType,
          startChangeDate,
          endChangeDate,
          userSearch,
          sortBy,
          ascending: false,
          batchCodeSearch,
          drugNameSearch,
        },
      }
    );
    const data = response.data;
    if (data.isSuccess !== undefined && data.success === undefined) {
      data.success = data.isSuccess;
    }
    return data;
  } catch (error) {
    console.error("Error fetching grouped inventory histories:", error);
    throw error;
  }
};

export const getInventoryHistoriesByDateRange = async (
  startDate: string,
  endDate: string
) => {
  const response = await api.get(
    "/inventoryhistory-management/inventoryhistories/by-date-range",
    {
      params: { startDate, endDate },
    }
  );
  return response.data.data;
};

export const getInventoryHistoriesByChangeType = async (changeType: string) => {
  const response = await api.get(
    `/inventoryhistory-management/inventoryhistories/by-change-type/${changeType}`
  );
  return response.data.data;
};

export const getInventoryHistoriesByUserId = async (userId: string) => {
  const response = await api.get(
    `/inventoryhistory-management/inventoryhistories/by-user/${userId}`
  );
  return response.data.data;
};

export const setupInventoryHistoryRealTime = (
  callback: (data: InventoryHistoryResponseDTO) => void
) => {
  return setupSignalRConnection("/inventoryHistoryHub", callback);
};
