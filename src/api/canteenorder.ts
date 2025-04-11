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
      "/canteenorder-management/canteenorders/appprove",
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
    const response = await api.post(
      "/canteenorder-management/export-to-excel",
      config,
      { 
        responseType: 'blob',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
        }
      }
    );
    
    // Check if the response is a blob
    const contentType = response.headers['content-type'];
    
    // If the response is not a blob or is an error message in JSON format
    if (contentType && contentType.includes('application/json')) {
      // Convert blob to text to read the error
      const reader = new FileReader();
      const errorTextPromise = new Promise<string>((resolve, reject) => {
        reader.onload = () => resolve(reader.result as string);
        reader.onerror = reject;
      });
      reader.readAsText(response.data);
      
      const errorText = await errorTextPromise;
      const errorData = JSON.parse(errorText);
      console.error("Export error:", errorData);
      throw new Error(errorData.message || "Failed to export to Excel");
    }
    
    // If we got here, we have a valid Excel file blob
    // Create a URL for the blob
    const url = window.URL.createObjectURL(new Blob([response.data]));
    
    // Create a link element
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `CanteenOrders_${new Date().toISOString().slice(0,19).replace(/:/g, '')}.xlsx`);
    
    // Append the link to body
    document.body.appendChild(link);
    
    // Trigger the download
    link.click();
    
    // Clean up
    window.URL.revokeObjectURL(url);
    document.body.removeChild(link);
    
    return true;
  } catch (error) {
    console.error("Error exporting canteen orders to Excel:", error);
    throw error;
  }
};