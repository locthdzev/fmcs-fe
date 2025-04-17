import api from "./customize-axios";

// Interfaces for Drug Statistics
export interface DrugGroupDetails {
  id: string;
  groupName: string;
}

export interface DrugResponseDTO {
  id: string;
  drugGroup: DrugGroupDetails;
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

export interface DrugGroupResponseDTO {
  id: string;
  groupName: string;
  description?: string;
  createdAt: string;
  updatedAt?: string;
  status?: string;
}

export interface DrugGroupExtendedDTO extends DrugGroupResponseDTO {
  drugCount: number;
}

export interface StatisticsRequestDTO {
  startDate?: string;
  endDate?: string;
}

// Combined statistics for all drug entities
export interface StatisticsOfAllDrugsDTO {
  // General statistics
  generatedAt: string;
  
  // Drug Statistics
  totalDrugs: number;
  drugsStatusDistribution: Record<string, number>;
  drugsByDrugGroup: Record<string, number>;
  priceDistribution: Record<string, number>;
  drugsByManufacturer: Record<string, number>;
  drugsMonthlyCreation: Record<string, number>;
  topPricedDrugs: DrugResponseDTO[];
  
  // Drug Group Statistics
  totalDrugGroups: number;
  drugGroupStatusDistribution: Record<string, number>;
  topDrugGroups: DrugGroupExtendedDTO[];
  
  // Drug Order Statistics
  totalDrugOrders: number;
  totalOrderValue: number;
  drugOrderStatusDistribution: Record<string, number>;
  drugOrdersMonthlyDistribution: Record<string, number>;
  monthlyOrderValue: Record<string, number>;
  ordersBySupplier: Record<string, number>;
  ordersByDrugCount: Record<string, number>;
  
  // Supplier Statistics
  totalSuppliers: number;
  supplierStatusDistribution: Record<string, number>;
  suppliersByOrderCount: Record<string, number>;
  suppliersByOrderValue: Record<string, number>;
  
  // Batch Number Statistics
  totalBatchNumbers: number;
  batchStatusDistribution: Record<string, number>;
  totalExpiredBatches: number;
  totalNearExpiryBatches: number;
  totalInventoryValue: number;
  batchesByMonth: Record<string, number>;
  batchesBySupplier: Record<string, number>;
  batchesByDrug: Record<string, number>;
}

export interface DrugStatisticsDTO {
  totalDrugs: number;
  drugsStatusDistribution: Record<string, number>;
  drugsByDrugGroup: Record<string, number>;
  priceDistribution: Record<string, number>;
  drugsByManufacturer: Record<string, number>;
  drugsMonthlyCreation: Record<string, number>;
  topPricedDrugs: DrugResponseDTO[];
}

export interface DrugGroupStatisticsDTO {
  totalDrugGroups: number;
  drugGroupStatusDistribution: Record<string, number>;
  topDrugGroups: DrugGroupExtendedDTO[];
}

export interface DrugOrderStatisticsDTO {
  totalDrugOrders: number;
  totalOrderValue: number;
  drugOrderStatusDistribution: Record<string, number>;
  drugOrdersMonthlyDistribution: Record<string, number>;
  monthlyOrderValue: Record<string, number>;
  ordersBySupplier: Record<string, number>;
  ordersByDrugCount: Record<string, number>;
}

export interface DrugSupplierStatisticsDTO {
  totalSuppliers: number;
  supplierStatusDistribution: Record<string, number>;
  suppliersByOrderCount: Record<string, number>;
  suppliersByOrderValue: Record<string, number>;
}

export interface BatchNumberStatisticsDTO {
  totalBatchNumbers: number;
  batchStatusDistribution: Record<string, number>;
  totalExpiredBatches: number;
  totalNearExpiryBatches: number;
  totalInventoryValue: number;
  batchesByMonth: Record<string, number>;
  batchesBySupplier: Record<string, number>;
  batchesByDrug: Record<string, number>;
}

export interface ResultDTO<T> {
  isSuccess: boolean;
  code: number;
  data: T;
  responseFailed?: string;
  message?: string;
}

// API functions for fetching drug statistics
export const getAllDrugsStatistics = async (params?: StatisticsRequestDTO): Promise<ResultDTO<StatisticsOfAllDrugsDTO>> => {
  try {
    const response = await api.get("/drug-statistics/all", { params });
    return response.data;
  } catch (error) {
    throw error;
  }
};

export const getDrugStatistics = async (params?: StatisticsRequestDTO): Promise<ResultDTO<DrugStatisticsDTO>> => {
  try {
    const response = await api.get("/drug-statistics/drugs", { params });
    return response.data;
  } catch (error) {
    throw error;
  }
};

export const getDrugGroupStatistics = async (params?: StatisticsRequestDTO): Promise<ResultDTO<DrugGroupStatisticsDTO>> => {
  try {
    const response = await api.get("/drug-statistics/drug-groups", { params });
    return response.data;
  } catch (error) {
    throw error;
  }
};

export const getDrugOrderStatistics = async (params?: StatisticsRequestDTO): Promise<ResultDTO<DrugOrderStatisticsDTO>> => {
  try {
    const response = await api.get("/drug-statistics/drug-orders", { params });
    return response.data;
  } catch (error) {
    throw error;
  }
};

export const getDrugSupplierStatistics = async (params?: StatisticsRequestDTO): Promise<ResultDTO<DrugSupplierStatisticsDTO>> => {
  try {
    const response = await api.get("/drug-statistics/drug-suppliers", { params });
    return response.data;
  } catch (error) {
    throw error;
  }
};

export const getBatchNumberStatistics = async (params?: StatisticsRequestDTO): Promise<ResultDTO<BatchNumberStatisticsDTO>> => {
  try {
    const response = await api.get("/drug-statistics/batch-numbers", { params });
    return response.data;
  } catch (error) {
    throw error;
  }
};
