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
}

export interface CanteenOrderCreateRequest {
  licensePlate: string;
  orderDate: string;
  createdAt: string;
  status?: string;
}

export interface CanteenOrderUpdateRequest {
  licensePlate: string;
  orderDate: string;
  updatedAt?: string;
  status?: string;
}

export const getCanteenOrders = async () => {
  try {
    const response = await api.get("/canteenorder-management/canteenorders");
    return response.data.data;
  } catch (error) {
    throw error;
  }
};

export const getCanteenOrderById = async (id: string) => {
  try {
    const response = await api.get(`/canteenorder-management/canteenorders/${id}`);
    return response.data.data;
  } catch (error) {
    throw error;
  }
};

export const getOrdersByTruckId = async (truckId: string) => {
  try {
    const response = await api.get(`/canteenorder-management/canteenorders/truck/${truckId}`);
    return response.data.data;
  } catch (error) {
    throw error;
  }
};

export const getOrdersByDate = async (orderDate: string) => {
  try {
    const response = await api.get(`/canteenorder-management/canteenorders/ByDate`, {
      params: { orderDate }
    });
    return response.data.data;
  } catch (error) {
    throw error;
  }
};

export const createCanteenOrder = async (orderData: FormData) => {
  try {
    const response = await api.post("/canteenorder-management/canteenorders", orderData);
    return response.data;
  } catch (error) {
    throw error;
  }
};

export const updateCanteenOrder = async (id: string, orderData: FormData) => {
  try {
    const response = await api.put(`/canteenorder-management/canteenorders/${id}`, orderData);
    return response.data;
  } catch (error) {
    throw error;
  }
};

export const deleteCanteenOrder = async (id: string) => {
  try {
    const response = await api.delete(`/canteenorder-management/canteenorders/${id}`);
    return response.data;
  } catch (error) {
    throw error;
  }
};

export const cancelCanteenOrder = async (id: string) => {
  try {
    const response = await api.put(`/canteenorder-management/canteenorders/Cancel/${id}`);
    return response.data;
  } catch (error) {
    throw error;
  }
};

export const activateCanteenOrders = async (orderIds: string[]) => {
  try {
    const response = await api.put("/canteenorder-management/canteenorders/activate", orderIds);
    return response.data;
  } catch (error) {
    throw error;
  }
};

export const deactivateCanteenOrders = async (orderIds: string[]) => {
  try {
    const response = await api.put("/canteenorder-management/canteenorders/deactivate", orderIds);
    return response.data;
  } catch (error) {
    throw error;
  }
};
