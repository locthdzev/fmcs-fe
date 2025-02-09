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
    const response = await api.get("/drugsupplier/getall");
    return response.data.data;
  } catch (error) {
    throw error;
  }
};

export const getDrugSupplierById = async (id: string) => {
  try {
    const response = await api.get(`/drugsupplier/${id}`);
    return response.data.data;
  } catch (error) {
    throw error;
  }
};

export const createDrugSupplier = async (
  drugSupplierData: DrugSupplierCreateRequest
) => {
  try {
    const response = await api.post("/drugsupplier", drugSupplierData);
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
    const response = await api.put(`/drugsupplier/${id}`, drugSupplierData);
    return response.data;
  } catch (error) {
    throw error;
  }
};

export const deleteDrugSupplier = async (id: string) => {
  try {
    const response = await api.delete(`/drugsupplier/${id}`);
    return response.data;
  } catch (error) {
    throw error;
  }
};

export const searchDrugSuppliers = async (
  supplierName?: string,
  contactNumber?: string,
  email?: string,
  status?: string
) => {
  try {
    const params = new URLSearchParams();
    if (supplierName) params.append("supplierName", supplierName);
    if (contactNumber) params.append("contactNumber", contactNumber);
    if (email) params.append("email", email);
    if (status) params.append("status", status);

    const response = await api.get(`/drugsupplier/search?${params.toString()}`);
    return response.data.data;
  } catch (error) {
    throw error;
  }
};
