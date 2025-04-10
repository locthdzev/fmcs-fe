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
    // Xây dựng query params
    const params = new URLSearchParams();
    
    // Chỉ gửi tham số phân trang nếu không xuất toàn bộ dữ liệu
    if (!exportAllPages) {
      params.append("page", page.toString());
      params.append("pageSize", pageSize.toString());
    } else {
      // Nếu xuất tất cả, đặt pageSize lớn để lấy tất cả dữ liệu
      params.append("page", "1");
      params.append("pageSize", "1000000"); // Một số lớn để lấy tất cả dữ liệu
    }
    
    if (drugCodeSearch) params.append("drugCodeSearch", drugCodeSearch);
    if (nameSearch) params.append("nameSearch", nameSearch);
    if (manufacturerSearch) params.append("manufacturerSearch", manufacturerSearch);
    if (descriptionSearch) params.append("descriptionSearch", descriptionSearch);
    if (drugGroupId) params.append("drugGroupId", drugGroupId);
    if (minPrice !== undefined && minPrice !== null) params.append("minPrice", minPrice.toString());
    if (maxPrice !== undefined && maxPrice !== null) params.append("maxPrice", maxPrice.toString());
    
    // Đảm bảo sortBy không phải là null hoặc undefined
    if (sortBy) params.append("sortBy", sortBy);
    // Đảm bảo ascending tồn tại
    params.append("ascending", ascending !== undefined ? ascending.toString() : "true");
    
    if (status) params.append("status", status);
    if (createdStartDate) params.append("createdStartDate", createdStartDate);
    if (createdEndDate) params.append("createdEndDate", createdEndDate);
    if (updatedStartDate) params.append("updatedStartDate", updatedStartDate);
    if (updatedEndDate) params.append("updatedEndDate", updatedEndDate);
    
    // Thêm tham số exportAllPages vào query params để backend biết có cần xuất tất cả hay không
    params.append("exportAllPages", exportAllPages.toString());
    
    // Sử dụng phương thức POST với config là body và các tham số khác là query
    const response = await api.post(`/drug-management/drugs/export-excel?${params.toString()}`, config);
    return response.data;
  } catch (error) {
    console.error("Error exporting drugs to Excel:", error);
    throw error;
  }
};