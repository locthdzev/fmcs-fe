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
  status?: string;
  batchCode: string;
  drug: { id: string; drugCode: string; name: string };
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
