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

export const createDrug = async (drugData: FormData) => {
  try {
    console.log("API createDrug called");
    
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
    
    const response = await api.post("/drug-management/drugs", drugData, {
      headers: {
        'Content-Type': 'multipart/form-data'
      }
    });
    
    console.log("createDrug response:", response.data);
    return response.data;
  } catch (error) {
    console.error("Error in createDrug:", error);
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
    
    // Thử trực tiếp theo Swagger, không sử dụng query params
    try {
      const response = await api.post("/drug-management/drugs/export-excel", {
        ...config,
        exportOptions: {
          // Map các tham số query vào body request
          page: exportAllPages ? 1 : page,
          pageSize: exportAllPages ? 1000000 : pageSize,
          drugCodeSearch,
          nameSearch,
          manufacturerSearch,
          descriptionSearch,
          drugGroupId,
          minPrice,
          maxPrice,
          sortBy,
          ascending,
          status: status ? status.replace(/,/g, ",") : undefined, // Đảm bảo status đúng định dạng
          createdStartDate,
          createdEndDate,
          updatedStartDate,
          updatedEndDate,
          exportAllPages
        }
      });
      
      console.log("Export response (body params):", response.data);
      return response.data;
    } catch (error: any) {
      console.error("Export failed with body params:", error.message);
      
      // Nếu cách trên thất bại, thử cách khác: gửi config trong body và params trong query
      // Xây dựng query params
      const params = new URLSearchParams();
      
      params.append("page", exportAllPages ? "1" : page.toString());
      params.append("pageSize", exportAllPages ? "1000000" : pageSize.toString());
      
      if (drugCodeSearch) params.append("drugCodeSearch", drugCodeSearch);
      if (nameSearch) params.append("nameSearch", nameSearch);
      if (manufacturerSearch) params.append("manufacturerSearch", manufacturerSearch);
      if (descriptionSearch) params.append("descriptionSearch", descriptionSearch);
      if (drugGroupId) params.append("drugGroupId", drugGroupId);
      if (minPrice !== undefined && minPrice !== null) params.append("minPrice", minPrice.toString());
      if (maxPrice !== undefined && maxPrice !== null) params.append("maxPrice", maxPrice.toString());
      if (sortBy) params.append("sortBy", sortBy);
      params.append("ascending", ascending !== undefined ? ascending.toString() : "true");
      
      // Xử lý status đặc biệt, đảm bảo nó không bị mã hóa sai
      if (status) {
        // Nếu status là chuỗi với các giá trị phân tách bằng dấu phẩy, không thêm dấu phẩy mới
        const cleanStatus = status.replace(/,/g, ",");
        params.append("status", cleanStatus);
      }
      
      if (createdStartDate) params.append("createdStartDate", createdStartDate);
      if (createdEndDate) params.append("createdEndDate", createdEndDate);
      if (updatedStartDate) params.append("updatedStartDate", updatedStartDate);
      if (updatedEndDate) params.append("updatedEndDate", updatedEndDate);
      params.append("exportAllPages", exportAllPages.toString());
      
      console.log(`Retry with query params: ${params.toString()}`);
      
      try {
        // Phương án 1: đúng theo cấu trúc API tiêu chuẩn
        const response = await api.post(`/drug-management/drugs/export-excel?${params.toString()}`, config);
        console.log("Export response (standard):", response.data);
        return response.data;
      } catch (queryError: any) {
        console.error("Export failed with standard url:", queryError.message);
        
        try {
          // Phương án 2: thử không có tiền tố api vì baseURL có thể đã bao gồm
          const response = await api.post(`drug-management/drugs/export-excel?${params.toString()}`, config);
          console.log("Export response (no leading slash):", response.data);
          return response.data;
        } catch (noSlashError: any) {
          console.error("Export failed with no leading slash:", noSlashError.message);
          
          try {
            // Phương án 3: thử với axios trực tiếp, không qua instance
            const fullUrl = `http://localhost:5104/api/drug-management/drugs/export-excel?${params.toString()}`;
            console.log("Trying direct URL:", fullUrl);
            
            // Import axios trực tiếp
            const axios = require('axios');
            const token = document.cookie.split('; ').find(row => row.startsWith('token='))?.split('=')[1];
            
            const directResponse = await axios.post(fullUrl, config, {
              headers: {
                'Content-Type': 'application/json',
                'Authorization': token ? `Bearer ${token}` : undefined
              }
            });
            
            console.log("Export response (direct axios):", directResponse.data);
            return directResponse.data;
          } catch (directError: any) {
            console.error("Export failed with direct axios:", directError.message);
            throw new Error(`All export methods failed. Last error: ${directError.message}`);
          }
        }
      }
    }
  } catch (error) {
    console.error("Error preparing export request:", error);
    throw error;
  }
};