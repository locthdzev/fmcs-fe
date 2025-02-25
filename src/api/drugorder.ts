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
