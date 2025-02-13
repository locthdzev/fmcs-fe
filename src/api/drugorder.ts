import api from "./customize-axios";

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
  };
  updatedAt?: string;
  updatedBy?: {
    id: string;
    userName: string;
  };
  status?: string;
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

export const getDrugOrders = async () => {
  try {
    const response = await api.get("/drugorder-management/drugorders");
    return response.data.data;
  } catch (error) {
    throw error;
  }
};

export const getDrugOrderById = async (id: string) => {
  try {
    const response = await api.get(`/drugorder-management/drugorders/${id}`);
    return response.data.data;
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
      "/drugorder-management/drugorders/appprove",
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
