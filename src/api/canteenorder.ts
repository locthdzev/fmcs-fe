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
  canteenOrderDetails: {
    itemId: string;
    quantity: number;
    canteenItem?: {
      itemName: string;
      unitPrice: string;
    };
    itemName?: string;
    unitPrice?: string;
    item?: {
      itemName: string;
      unitPrice: string;
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