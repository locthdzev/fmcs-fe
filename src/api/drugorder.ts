import api from "./customize-axios";

export interface DrugInfo {
  id: string;
  drugCode: string;
  name: string;
  unit: string;
  price: number;
  createdAt: string;
  updatedAt?: string;
  status?: string;
  imageUrl?: string;
}

export interface DrugOrderDetailDTO {
  id: string;
  drug: DrugInfo;
  quantity: number;
  pricePerUnit: number;
  createdAt: string;
  createdBy: {
    id: string;
    userName: string;
    role: string;
  };
  updatedAt?: string;
  updatedBy?: {
    id: string;
    userName: string;
    role: string;
  };
  isActive?: boolean;
  status?: string;
}

export interface DrugOrderResponse {
  id: string;
  drugOrderCode: string;
  supplier: {
    id: string;
    supplierName: string;
  };
  orderDate: string;
  totalQuantity: number;
  totalPrice: number;
  createdAt: string;
  createdBy: {
    id: string;
    userName: string;
    role: string;
  };
  updatedAt?: string;
  updatedBy?: {
    id: string;
    userName: string;
    role: string;
  };
  status?: string;
}

export interface DrugOrderIdResponse extends DrugOrderResponse {
  drugOrderDetails: DrugOrderDetailDTO[];
}

export interface DrugOrderDetailRequest {
  drugId: string;
  quantity: number;
}

export interface DrugOrderCreateRequest {
  supplierId: string;
  drugOrderDetails: DrugOrderDetailRequest[];
}

export interface DrugOrderUpdateRequest {
  drugOrderCode: string;
  supplierId?: string;
  drugOrderDetails: DrugOrderDetailRequest[];
}

export interface CompleteDrugOrderDetailsRequest {
  drugOrderDetailIds: string[];
}

export interface RejectDrugOrderDetailsRequest {
  drugOrderDetailIds: string[];
}

export interface PagedResultDTO<T> {
  isSuccess: boolean;
  code: number;
  data: T[];
  totalRecords: number;
  page: number;
  pageSize: number;
  message?: string;
  responseFailed?: string;
}

export interface DrugOrderQueryParams {
  page?: number;
  pageSize?: number;
  drugOrderCodeSearch?: string;
  supplierId?: string;
  minTotalPrice?: number;
  maxTotalPrice?: number;
  sortBy?: string;
  ascending?: boolean;
  status?: string;
  orderStartDate?: string;
  orderEndDate?: string;
  createdStartDate?: string;
  createdEndDate?: string;
  updatedStartDate?: string;
  updatedEndDate?: string;
}

export interface DrugOrderExportConfigDTO {
  exportAllPages: boolean;
  includeDrugOrderCode: boolean;
  includeSupplier: boolean;
  includeOrderDate: boolean;
  includeTotalQuantity: boolean;
  includeTotalPrice: boolean;
  includeCreatedBy: boolean;
  includeCreatedAt: boolean;
  includeUpdatedAt: boolean;
  includeStatus: boolean;
}

export const getDrugOrders = async (params?: DrugOrderQueryParams) => {
  try {
    const response = await api.get("/drugorder-management/drugorders", { params });
    return response.data as PagedResultDTO<DrugOrderResponse>;
  } catch (error) {
    throw error;
  }
};

export const getDrugOrderById = async (id: string) => {
  try {
    const response = await api.get(`/drugorder-management/drugorders/${id}`);
    return response.data.data as DrugOrderIdResponse;
  } catch (error) {
    throw error;
  }
};

export const createDrugOrder = async (
  drugOrderData: DrugOrderCreateRequest
) => {
  try {
    const response = await api.post(
      "/drugorder-management/drugorders",
      drugOrderData
    );
    return response.data;
  } catch (error) {
    throw error;
  }
};

export const updateDrugOrder = async (
  id: string,
  drugOrderData: DrugOrderUpdateRequest
) => {
  try {
    const response = await api.put(
      `/drugorder-management/drugorders/${id}`,
      drugOrderData
    );
    return response.data;
  } catch (error) {
    throw error;
  }
};

export const approveDrugOrders = async (drugOrderIds: string[]) => {
  try {
    const response = await api.put(
      "/drugorder-management/drugorders/approve",
      drugOrderIds
    );
    return response.data;
  } catch (error) {
    throw error;
  }
};

export const rejectDrugOrders = async (drugOrderIds: string[]) => {
  try {
    const response = await api.put(
      "/drugorder-management/drugorders/reject",
      drugOrderIds
    );
    return response.data;
  } catch (error) {
    throw error;
  }
};

export const completeDrugOrders = async (drugOrderIds: string[]) => {
  try {
    const response = await api.put(
      "/drugorder-management/drugorders/complete",
      drugOrderIds
    );
    return response.data;
  } catch (error) {
    throw error;
  }
};

export const completeDrugOrderDetails = async (
  completeData: CompleteDrugOrderDetailsRequest
) => {
  try {
    const response = await api.put(
      "/drugorder-management/drugorders/completedetails",
      completeData
    );
    return response.data;
  } catch (error) {
    throw error;
  }
};

export const rejectDrugOrderDetails = async (
  rejectData: RejectDrugOrderDetailsRequest
) => {
  try {
    const response = await api.put(
      "/drugorder-management/drugorders/rejectdetails",
      rejectData
    );
    return response.data;
  } catch (error) {
    throw error;
  }
};

export const exportDrugOrdersToExcel = async (
  config: DrugOrderExportConfigDTO,
  params?: DrugOrderQueryParams
) => {
  try {
    const queryParams = {
      page: params?.page || 1,
      pageSize: params?.pageSize || 10,
      drugOrderCodeSearch: params?.drugOrderCodeSearch,
      supplierId: params?.supplierId,
      minTotalPrice: params?.minTotalPrice,
      maxTotalPrice: params?.maxTotalPrice,
      sortBy: params?.sortBy || "OrderDate",
      ascending: params?.ascending !== undefined ? params?.ascending : false,
      status: params?.status,
      orderStartDate: params?.orderStartDate,
      orderEndDate: params?.orderEndDate,
      createdStartDate: params?.createdStartDate,
      createdEndDate: params?.createdEndDate,
      updatedStartDate: params?.updatedStartDate,
      updatedEndDate: params?.updatedEndDate
    };

    console.log("=== EXPORT REQUEST ===");
    console.log("URL:", "/drugorder-management/drugorders/export-excel");
    console.log("Config:", JSON.stringify(config, null, 2));
    console.log("Params:", JSON.stringify(queryParams, null, 2));

    // Thử cả 2 cách: JSON và blob
    try {
      // Cách 1: Yêu cầu JSON
      console.log("Đang thử với Content-Type: application/json...");
      const jsonResponse = await api.post(
        "/drugorder-management/drugorders/export-excel",
        config,
        {
          params: queryParams,
          headers: {
            'Content-Type': 'application/json',
            'Accept': 'application/json'
          }
        }
      );

      console.log("=== RESPONSE JSON ===");
      console.log("Status:", jsonResponse.status);
      console.log("Headers:", jsonResponse.headers);
      console.log("Response Type:", typeof jsonResponse.data);
      
      if (typeof jsonResponse.data === 'object') {
        console.log("JSON Keys:", Object.keys(jsonResponse.data));
        for (const key in jsonResponse.data) {
          console.log(`${key}:`, jsonResponse.data[key]);
          // Nếu là object lồng nhau
          if (typeof jsonResponse.data[key] === 'object' && jsonResponse.data[key] !== null) {
            console.log(`${key} nested keys:`, Object.keys(jsonResponse.data[key]));
          }
        }
      } else {
        console.log("Raw data:", jsonResponse.data);
      }

      // Nếu nhận được URL Minio trong phản hồi
      if (typeof jsonResponse.data === 'string' && 
          (jsonResponse.data.includes('minio') || jsonResponse.data.includes('download'))) {
        console.log("Tìm thấy URL trong phản hồi trực tiếp:", jsonResponse.data);
        return {
          isSuccess: true,
          success: true,
          data: jsonResponse.data
        };
      }

      // Kiểm tra trong các thuộc tính của phản hồi
      if (jsonResponse.data && typeof jsonResponse.data === 'object') {
        // Kiểm tra data.data
        if (jsonResponse.data.data && typeof jsonResponse.data.data === 'string') {
          console.log("Tìm thấy URL trong data.data:", jsonResponse.data.data);
          return {
            isSuccess: true,
            success: true,
            data: jsonResponse.data.data
          };
        }

        // Kiểm tra tất cả các thuộc tính
        for (const key in jsonResponse.data) {
          if (typeof jsonResponse.data[key] === 'string' && 
             (jsonResponse.data[key].includes('minio') || 
              jsonResponse.data[key].includes('download') || 
              jsonResponse.data[key].includes('http'))) {
            console.log(`Tìm thấy URL trong ${key}:`, jsonResponse.data[key]);
            return {
              isSuccess: true,
              success: true,
              data: jsonResponse.data[key]
            };
          }
        }

        // Kiểm tra thuộc tính lồng nhau
        for (const key in jsonResponse.data) {
          if (jsonResponse.data[key] && typeof jsonResponse.data[key] === 'object') {
            for (const nestedKey in jsonResponse.data[key]) {
              if (typeof jsonResponse.data[key][nestedKey] === 'string' && 
                 (jsonResponse.data[key][nestedKey].includes('minio') || 
                  jsonResponse.data[key][nestedKey].includes('download') || 
                  jsonResponse.data[key][nestedKey].includes('http'))) {
                console.log(`Tìm thấy URL trong ${key}.${nestedKey}:`, jsonResponse.data[key][nestedKey]);
                return {
                  isSuccess: true,
                  success: true,
                  data: jsonResponse.data[key][nestedKey]
                };
              }
            }
          }
        }

        // Nếu nhận được thông báo thành công nhưng không có URL
        if (jsonResponse.data.isSuccess || jsonResponse.data.success) {
          console.log("Nhận được phản hồi thành công nhưng không tìm thấy URL");
          
          // Thử cách thứ 2 - nhận blob trực tiếp
          throw new Error("Không tìm thấy URL trong phản hồi JSON");
        }
      }
      
      // Trả về dữ liệu JSON nếu không tìm thấy URL
      return jsonResponse.data;
    } catch (jsonError) {
      console.log("Lỗi khi xử lý phản hồi JSON:", jsonError);
      console.log("Đang thử với responseType: blob...");
      
      // Cách 2: Nhận blob trực tiếp
      const blobResponse = await api.post(
        "/drugorder-management/drugorders/export-excel",
        config,
        {
          params: queryParams,
          responseType: 'blob'
        }
      );

      console.log("=== RESPONSE BLOB ===");
      console.log("Status:", blobResponse.status);
      console.log("Headers:", blobResponse.headers);
      if (blobResponse.data) {
        console.log("Blob Type:", blobResponse.data.type);
        console.log("Blob Size:", blobResponse.data.size);
      }

      // Kiểm tra header Content-Disposition
      const contentDisposition = blobResponse.headers['content-disposition'];
      console.log("Content-Disposition:", contentDisposition);

      // Tạo URL từ blob
      const blob = new Blob([blobResponse.data], {
        type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
      });
      const url = window.URL.createObjectURL(blob);
      console.log("Đã tạo URL blob:", url);

      return {
        isSuccess: true,
        success: true,
        data: url,
        isLocalBlob: true // Đánh dấu đây là URL blob cục bộ
      };
    }
  } catch (error: any) {
    console.error("Lỗi xuất Excel:", error);
    return {
      success: false,
      isSuccess: false,
      message: error.response?.data?.message || "Không thể xuất file Excel"
    };
  }
};
