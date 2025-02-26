import api from "./customize-axios";

export interface DrugSupplierResponse {
  id: string;
  supplierName: string;
  contactNumber?: string;
  email?: string;
  address?: string;
  createdAt: string;
  updatedAt?: string;
  status?: string;
}

export interface DrugSupplierCreateRequest {
  supplierName: string;
  contactNumber?: string;
  email?: string;
  address?: string;
  createdAt: string;
  status?: string;
}

export interface DrugSupplierUpdateRequest {
  supplierName: string;
  contactNumber?: string;
  email?: string;
  address?: string;
  createdAt: string;
  updatedAt?: string;
  status?: string;
}

export const getDrugSuppliers = async () => {
  try {
    const response = await api.get("/drugsupplier-management/drugsuppliers");
    return response.data.data;
  } catch (error) {
    throw error;
  }
};

export const getDrugSupplierById = async (id: string) => {
  try {
    const response = await api.get(
      `/drugsupplier-management/drugsuppliers/${id}`
    );
    return response.data.data;
  } catch (error) {
    throw error;
  }
};

export const createDrugSupplier = async (
  drugSupplierData: DrugSupplierCreateRequest
) => {
  try {
    const formData = new FormData();
    Object.entries(drugSupplierData).forEach(([key, value]) => {
      if (value !== undefined) {
        formData.append(key, value);
      }
    });
    const response = await api.post(
      "/drugsupplier-management/drugsuppliers",
      formData
    );
    return response.data;
  } catch (error) {
    throw error;
  }
};

export const updateDrugSupplier = async (
  id: string,
  drugSupplierData: DrugSupplierUpdateRequest
) => {
  try {
    const formData = new FormData();
    Object.entries(drugSupplierData).forEach(([key, value]) => {
      if (value !== undefined) {
        formData.append(key, value);
      }
    });
    const response = await api.put(
      `/drugsupplier-management/drugsuppliers/${id}`,
      formData
    );
    return response.data;
  } catch (error) {
    throw error;
  }
};

export const activateDrugSuppliers = async (supplierIds: string[]) => {
  try {
    const response = await api.put(
      "/drugsupplier-management/drugsuppliers/activate",
      supplierIds
    );
    return response.data;
  } catch (error) {
    throw error;
  }
};

export const deactivateDrugSuppliers = async (supplierIds: string[]) => {
  try {
    const response = await api.put(
      "/drugsupplier-management/drugsuppliers/deactivate",
      supplierIds
    );
    return response.data;
  } catch (error) {
    throw error;
  }
};
