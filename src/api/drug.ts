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
  drugGroupId: string;
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
  drugGroupId: string;
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

export interface DrugFilterParams {
  // Tham số phân trang
  page?: number;
  pageSize?: number;
  
  // Tham số tìm kiếm chính
  drugCode?: string;
  drugCodeSearch?: string;
  drugName?: string;
  nameSearch?: string;
  manufacturer?: string;
  manufacturerSearch?: string;
  descriptionSearch?: string;
  
  // Tham số lọc nâng cao
  drugGroupId?: string;
  
  // Price range
  priceRange?: [number | null, number | null];
  minPrice?: number;
  maxPrice?: number;
  
  // Date ranges
  dateRange?: [string | null, string | null];
  createdDateRange?: [string | null, string | null];
  updatedDateRange?: [string | null, string | null];
  
  // Date params cụ thể
  createdStartDate?: string | null;
  createdEndDate?: string | null;
  updatedStartDate?: string | null;
  updatedEndDate?: string | null;
  
  // Sorting
  sortBy?: string;
  ascending?: boolean;
  
  // Status filter
  status?: string;
}

export interface DrugExportConfigDTO {
  includeDrugCode: boolean;
  includeName: boolean;
  includeUnit: boolean;
  includePrice: boolean;
  includeDescription: boolean;
  includeManufacturer: boolean;
  includeDrugGroup: boolean;
  includeCreatedAt: boolean;
  includeUpdatedAt: boolean;
  includeStatus: boolean;
  fileName?: string;
}

export interface DrugWithInventoryInfoDTO {
  id: string;
  drugCode: string;
  name: string;
  unit: string;
  batchCode: string;
  batchId: string;
  batchStatus: string;
  quantityInStock: number;
}

export const getDrugs = async (filterParams?: DrugFilterParams) => {
  try {
    console.log("Original filter params:", filterParams);
    
    // Tạo object tham số mới để map với API backend
    const apiParams: any = {
      page: filterParams?.page || 1,
      pageSize: filterParams?.pageSize || 10
    };
    
    // Map tên các trường tìm kiếm đúng với backend
    if (filterParams?.drugCode) {
      apiParams.drugCodeSearch = filterParams.drugCode;
    }
    
    if (filterParams?.drugName) {
      apiParams.nameSearch = filterParams.drugName;
    }
    
    if (filterParams?.manufacturer) {
      apiParams.manufacturerSearch = filterParams.manufacturer;
    }
    
    if (filterParams?.drugGroupId) {
      apiParams.drugGroupId = filterParams.drugGroupId;
    }
    
    // Xử lý price range
    if (filterParams?.priceRange) {
      const [min, max] = filterParams.priceRange;
      if (min !== null) apiParams.minPrice = min;
      if (max !== null) apiParams.maxPrice = max;
    }
    
    // Xử lý các khoảng ngày
    if (filterParams?.createdDateRange) {
      const [start, end] = filterParams.createdDateRange;
      if (start) apiParams.createdStartDate = start;
      if (end) apiParams.createdEndDate = end;
    }
    
    if (filterParams?.updatedDateRange) {
      const [start, end] = filterParams.updatedDateRange;
      if (start) apiParams.updatedStartDate = start;
      if (end) apiParams.updatedEndDate = end;
    }
    
    // Thêm các tham số sắp xếp
    if (filterParams?.sortBy) {
      apiParams.sortBy = filterParams.sortBy;
      apiParams.ascending = filterParams.ascending !== undefined ? filterParams.ascending : true;
    }
    
    // Thêm status filter
    if (filterParams?.status) {
      apiParams.status = filterParams.status;
    }
    
    console.log("API params:", apiParams);
    
    // Xây dựng URL với query params
    let url = "/drug-management/drugs";
    let isFirstParam = true;
    
    // Sử dụng URLSearchParams để xây dựng query string chính xác
    const searchParams = new URLSearchParams();
    
    for (const [key, value] of Object.entries(apiParams)) {
      // Bỏ qua các giá trị undefined, null hoặc chuỗi rỗng
      if (value === undefined || value === null || value === '') continue;
      
      // Thêm tham số vào URLSearchParams
      if (typeof value === 'boolean' || typeof value === 'number' || typeof value === 'bigint') {
        searchParams.append(key, value.toString());
      } else {
        searchParams.append(key, value as string);
      }
    }
    
    // Tạo URL cuối cùng
    const queryString = searchParams.toString();
    if (queryString) {
      url += '?' + queryString;
    }
    
    console.log("Final API URL:", url);
    
    const response = await api.get(url);
    return response.data.data;
  } catch (error) {
    console.error("Error fetching drugs:", error);
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

export const getDrugsByDrugGroupId = async (drugGroupId: string) => {
  try {
    const response = await api.get(`/drug-management/drugs/by-group/${drugGroupId}`);
    return response.data.data;
  } catch (error) {
    throw error;
  }
};

export const createDrug = async (data: FormData) => {
  // Log the form data entries for debugging
  console.log("FormData to be sent:");
  for (let pair of data.entries()) {
    const value = pair[1];
    console.log(`${pair[0]}: ${value instanceof File ? 
      `File (${(value as File).name}, ${(value as File).type}, ${(value as File).size} bytes)` : 
      value}`);
  }
  
  try {
    const response = await api.post("/drug-management/drugs", data, {
      headers: {
        "Content-Type": "multipart/form-data",
      },
    });
    return response.data;
  } catch (error) {
    // The error is already sanitized by the axios interceptor
    console.error("Error in createDrug API:", error);
    
    // Just rethrow the already sanitized error
    throw error;
  }
};

export const updateDrug = async (id: string, drugData: FormData) => {
  try {
    console.log("API updateDrug called with id:", id);
    
    // Log thông tin về FormData
    for (let pair of drugData.entries()) {
      const value = pair[1];
      console.log(`${pair[0]}: ${value instanceof File ? 
        `File (${value.name}, ${value.type}, ${value.size} bytes)` : 
        value}`);
    }
    
    // Kiểm tra xem FormData có chứa file không
    const hasImageFile = Array.from(drugData.entries()).some(
      entry => entry[0] === 'imageFile' && entry[1] instanceof File
    );
    
    console.log("FormData contains image file:", hasImageFile);
    
    const response = await api.put(`/drug-management/drugs/${id}`, drugData, {
      headers: {
        'Content-Type': 'multipart/form-data'
      }
    });
    
    console.log("updateDrug response:", response.data);
    return response.data;
  } catch (error) {
    console.error("Error in updateDrug:", error);
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

export const exportDrugsToExcel = async (
  config: DrugExportConfigDTO,
  exportAllPages: boolean = true,
  page: number = 1,
  pageSize: number = 10,
  drugCodeSearch?: string,
  nameSearch?: string,
  manufacturerSearch?: string,
  descriptionSearch?: string,
  drugGroupId?: string,
  minPrice?: number,
  maxPrice?: number,
  sortBy: string = "Name",
  ascending: boolean = true,
  status?: string,
  createdStartDate?: string,
  createdEndDate?: string,
  updatedStartDate?: string,
  updatedEndDate?: string
) => {
  try {
    // For "Export All", we ignore all filters except sorting
    if (exportAllPages) {
      drugCodeSearch = undefined;
      nameSearch = undefined;
      manufacturerSearch = undefined;
      descriptionSearch = undefined;
      drugGroupId = undefined;
      minPrice = undefined;
      maxPrice = undefined;
      status = undefined;
      createdStartDate = undefined;
      createdEndDate = undefined;
      updatedStartDate = undefined;
      updatedEndDate = undefined;
    }

    console.log("Export config:", config);
    console.log("Export params:", {
      exportAllPages,
      page,
      pageSize,
      drugCodeSearch,
      nameSearch,
      manufacturerSearch,
      descriptionSearch,
      drugGroupId,
      minPrice,
      maxPrice,
      sortBy,
      ascending,
      status,
      createdStartDate,
      createdEndDate,
      updatedStartDate,
      updatedEndDate
    });
    
    // Set an extremely large pageSize to ensure all records are returned
    const exportPageSize = 1000000; // One million should cover any reasonable number of records
    
    // Use a simplified approach with direct body parameters
    const exportRequest = {
      ...config,
      exportOptions: {
        page: 1,
        pageSize: exportPageSize,
        drugCodeSearch,
        nameSearch,
        manufacturerSearch,
        descriptionSearch,
        drugGroupId,
        minPrice,
        maxPrice,
        sortBy: sortBy || "CreatedAt", // Default to CreatedAt for consistency
        ascending,
        status: status ? status.replace(/,/g, ",") : undefined,
        createdStartDate,
        createdEndDate,
        updatedStartDate,
        updatedEndDate,
        exportAllPages: true
      }
    };
      
    console.log("Export request:", JSON.stringify(exportRequest, null, 2));
    
    const response = await api.post("/drug-management/drugs/export-excel", exportRequest);
    console.log("Export response:", response.data);
    return response.data;
  } catch (error) {
    console.error("Export error:", error);
    
    // Try direct axios as fallback
    try {
      const axios = require('axios');
      const token = document.cookie.split('; ').find(row => row.startsWith('token='))?.split('=')[1];
      
      const exportRequest = {
        ...config,
        exportOptions: {
          page: 1,
          pageSize: 1000000,
          sortBy: sortBy || "CreatedAt",
          ascending,
          exportAllPages: true
        }
      };
      
      const fullUrl = `http://localhost:5104/api/drug-management/drugs/export-excel`;
      console.log("Trying direct URL:", fullUrl);
      
      const directResponse = await axios.post(fullUrl, exportRequest, {
        headers: {
          'Content-Type': 'application/json',
          'Authorization': token ? `Bearer ${token}` : undefined
        }
      });
      
      console.log("Export response (direct axios):", directResponse.data);
      return directResponse.data;
    } catch (directError) {
      console.error("Export failed with direct axios:", directError);
      throw directError;
    }
  }
};

export const getAvailableDrugsForPrescription = async () => {
  try {
    const response = await api.get("/drug-management/drugs/available-for-prescription");
    return response.data;
  } catch (error) {
    console.error("Error fetching available drugs for prescription:", error);
    throw error;
  }
};