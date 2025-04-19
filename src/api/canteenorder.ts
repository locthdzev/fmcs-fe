import api from "./customize-axios";

export interface CanteenOrderResponse {
  id: string;
  orderDate: string;
  createdAt: string;
  updatedAt?: string;
  status?: string;
  truckId: string;
  truck: {
    licensePlate: string;
    driverName: string;
  };
  createdBy: {
    id: string;
    userName: string;
    role: string;
  };
  updatedBy: {
    id: string;
    userName: string;
    role: string;
  };
  canteenOrderDetails: {
    itemId: string;
    quantity: number;
    itemName?: string;
    unitPrice?: number;
    imageUrl?: string;
    item?: {
      itemName: string;
      unitPrice: number;
      imageUrl?: string;
    };
  }[];
}

export interface CanteenOrderCreateRequest {
  licensePlate: string;
  orderDate: string;
  createdAt: string;
  status?: string;
  canteenOrderDetails: OrderDetail[];
}

interface OrderDetail {
  itemId: string;
  quantity: number;
}

export interface CanteenOrderUpdateRequest {
  licensePlate: string;
  orderDate: string;
  updatedAt?: string;
  status?: string;
}

export const getCanteenOrders = async () => {
  try {
    const response = await api.get("/canteenorder-management/canteenorders", {
      params: { timestamp: new Date().getTime() }
    });
    return response.data.data;
  } catch (error) {
    throw error;
  }
};

export const getCanteenOrderById = async (id: string) => {
  try {
    const response = await api.get(
      `/canteenorder-management/canteenorders/${id}`
    );
    return response.data.data;
  } catch (error) {
    throw error;
  }
};

export const getOrdersByTruckId = async (truckId: string) => {
  try {
    const response = await api.get(
      `/canteenorder-management/canteenorders/truck/${truckId}`
    );
    return response.data.data;
  } catch (error) {
    throw error;
  }
};
export const createCanteenOrder = async (orderData: CanteenOrderCreateRequest) => {
  try {
    const response = await api.post("/canteenorder-management/canteenorders", orderData);
    return response.data;
  } catch (error) {
    throw error;
  }
};

export const updateCanteenOrder = async (id: string, orderData: FormData) => {
  try {
    const response = await api.put(
      `/canteenorder-management/canteenorders/${id}`,
      orderData
    );
    return response.data;
  } catch (error) {
    throw error;
  }
};

export const deleteCanteenOrder = async (id: string) => {
  try {
    const response = await api.delete(
`/canteenorder-management/canteenorders/${id}`
    );
    return response.data;
  } catch (error) {
    throw error;
  }
};
export const approveCanteenOrders = async (orderIds: string[]) => {
  try {
    const response = await api.put(
      "/canteenorder-management/canteenorders/approve",
      orderIds
    );
    return response.data;
  } catch (error) {
    throw error;
  }
};

export const rejectCanteenOrders = async (orderIds: string[]) => {
  try {
    const response = await api.put(
      "/canteenorder-management/canteenorders/reject",
      orderIds
    );
    return response.data;
  } catch (error) {
    throw error;
  }
};

export const completeCanteenOrders = async (orderIds: string[]) => {
  try {
    const response = await api.put(
      "/canteenorder-management/canteenorders/complete",
      orderIds
    );
    return response.data;
  } catch (error) {
    throw error;
  }
};

export interface CanteenOrderExportConfig {
  includeId: boolean;
  includeTruckInfo: boolean;
  includeOrderDate: boolean;
  includeCreatedInfo: boolean;
  includeUpdatedInfo: boolean;
  includeStatus: boolean;
  includeOrderDetails: boolean;
}

export const exportCanteenOrdersToExcel = async (config: CanteenOrderExportConfig) => {
  try {
    console.log("Exporting canteen orders with config:", config);
    
    // Đảm bảo Axios xử lý được cả JSON và Blob
    const response = await api.post(
      "/canteenorder-management/export-to-excel",
      config,
      { 
        headers: {
          'Content-Type': 'application/json'
        },
        responseType: 'blob'  // Yêu cầu phản hồi kiểu blob để tải xuống trực tiếp
      }
    );
    
    // In ra thông tin phản hồi để debug
    console.log("Export response type:", response.headers['content-type']);
    
    // Kiểm tra xem phản hồi có phải là blob/file không
    const contentType = response.headers['content-type'];
    const isExcelFile = contentType && (
      contentType.includes('application/vnd.openxmlformats-officedocument.spreadsheetml.sheet') ||
      contentType.includes('application/octet-stream') ||
      contentType.includes('application/binary')
    );
    
    // Nếu phản hồi là file Excel (blob)
    if (isExcelFile && response.data instanceof Blob) {
      console.log("Received Excel file blob, initiating download...");
      
      // Tạo URL và download
      const blob = new Blob([response.data], { type: contentType });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      
      // Lấy tên file từ header Content-Disposition nếu có
      let filename = 'CanteenOrders.xlsx';
      const disposition = response.headers['content-disposition'];
      if (disposition && disposition.includes('filename=')) {
        filename = disposition.split('filename=')[1].replace(/["']/g, '');
      } else {
        filename = `CanteenOrders_${new Date().toISOString().slice(0,10)}.xlsx`;
      }
      
      link.setAttribute('download', filename);
      document.body.appendChild(link);
      link.click();
      
      // Dọn dẹp
      window.URL.revokeObjectURL(url);
      document.body.removeChild(link);
      return true;
    } 
    // Nếu phản hồi là JSON (URL hoặc thông tin lỗi)
    else if (contentType && contentType.includes('application/json')) {
      // Chuyển đổi Blob thành JSON nếu cần
      let data = response.data;
      if (data instanceof Blob) {
        const text = await data.text();
        data = JSON.parse(text);
        console.log("Converted blob to JSON:", data);
      }
      
      // Kiểm tra cấu trúc JSON
      if (data) {
        // Tìm URL trong JSON response
        const fileUrl = data.data?.FileUrl || data.data?.fileUrl || data.FileUrl || data.fileUrl || data.data?.url || data.url ||
                       (data.data ? data.data.toString() : null);
        
        if (fileUrl && typeof fileUrl === 'string') {
          console.log("Found file URL in JSON response:", fileUrl);
          
          // Tạo link download từ URL
          const link = document.createElement('a');
          link.href = fileUrl;
          link.setAttribute('download', `CanteenOrders_${new Date().toISOString().slice(0,10)}.xlsx`);
          document.body.appendChild(link);
          link.click();
          document.body.removeChild(link);
          return true;
        } else {
          console.error("URL not found in JSON response:", data);
          throw new Error("File URL not found in server response");
        }
      }
    } 
    // Trường hợp khác (có thể là lỗi)
    else {
      console.error("Unexpected response format:", contentType, response);
      throw new Error("Server returned unexpected response format");
    }
  } catch (error: any) {
    console.error("Error exporting canteen orders to Excel:", error);
    
    // Log chi tiết lỗi
    if (error.response) {
      console.error("Server response error:", {
        status: error.response.status,
        statusText: error.response.statusText,
        headers: error.response.headers,
        data: error.response.data instanceof Blob 
          ? "Blob data" 
          : error.response.data
      });
      
      // Nếu lỗi được trả về dưới dạng blob, đọc thông tin lỗi
      if (error.response.data instanceof Blob) {
        try {
          const text = await error.response.data.text();
          const jsonError = JSON.parse(text);
          console.error("Error details from blob:", jsonError);
          throw new Error(jsonError.message || "Export failed");
        } catch (e) {
          console.error("Could not parse error blob:", e);
        }
      }
    }
    
    throw new Error(error.message || "Failed to export to Excel");
  }
};