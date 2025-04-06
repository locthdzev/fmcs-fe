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

export interface DrugSupplierExportConfigDTO {
  // Thông tin cơ bản của nhà cung cấp
  includeSupplierName?: boolean;
  includeContactNumber?: boolean;
  includeEmail?: boolean;
  includeAddress?: boolean;
  
  // Thông tin thời gian
  includeCreatedAt?: boolean;
  includeUpdatedAt?: boolean;
  
  // Thông tin trạng thái
  includeStatus?: boolean;
  
  // Tùy chọn tên tệp xuất
  fileName?: string;
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

export const exportDrugSuppliersToExcel = async (
  config: DrugSupplierExportConfigDTO,
  page: number = 1,
  pageSize: number = 10,
  supplierNameSearch?: string,
  contactNumberSearch?: string,
  emailSearch?: string,
  addressSearch?: string,
  sortBy: string = "SupplierName",
  ascending: boolean = true,
  status?: string,
  createdStartDate?: Date,
  createdEndDate?: Date,
  updatedStartDate?: Date,
  updatedEndDate?: Date
) => {
  try {
    const params = new URLSearchParams();
    params.append("page", page.toString());
    params.append("pageSize", pageSize.toString());
    params.append("sortBy", sortBy);
    params.append("ascending", ascending.toString());
    
    if (supplierNameSearch) params.append("supplierNameSearch", supplierNameSearch);
    if (contactNumberSearch) params.append("contactNumberSearch", contactNumberSearch);
    if (emailSearch) params.append("emailSearch", emailSearch);
    if (addressSearch) params.append("addressSearch", addressSearch);
    if (status) params.append("status", status);
    if (createdStartDate) params.append("createdStartDate", createdStartDate.toISOString());
    if (createdEndDate) params.append("createdEndDate", createdEndDate.toISOString());
    if (updatedStartDate) params.append("updatedStartDate", updatedStartDate.toISOString());
    if (updatedEndDate) params.append("updatedEndDate", updatedEndDate.toISOString());

    const response = await api.post(
      `/drugsupplier-management/drugsuppliers/export-excel?${params.toString()}`,
      config
    );
    return response.data;
  } catch (error) {
    throw error;
  }
};

export const exportDrugSuppliersToExcelWithConfig = async (
  config: DrugSupplierExportConfigDTO,
  page?: number,
  pageSize?: number,
  supplierNameSearch?: string,
  statusFilter?: string[],
  createdStartDate?: string,
  createdEndDate?: string,
  updatedStartDate?: string,
  updatedEndDate?: string,
  ascending?: boolean
): Promise<{ success: boolean; data?: string; message?: string }> => {
  try {
    const params = new URLSearchParams();
    
    if (page) params.append("page", page.toString());
    if (pageSize) params.append("pageSize", pageSize.toString());
    if (supplierNameSearch) params.append("supplierNameSearch", supplierNameSearch);
    if (statusFilter && statusFilter.length > 0) params.append("status", statusFilter.join(','));
    if (createdStartDate) params.append("createdStartDate", createdStartDate);
    if (createdEndDate) params.append("createdEndDate", createdEndDate);
    if (updatedStartDate) params.append("updatedStartDate", updatedStartDate);
    if (updatedEndDate) params.append("updatedEndDate", updatedEndDate);
    if (ascending !== undefined) params.append("ascending", ascending.toString());

    // Thêm sortBy vì API endpoint yêu cầu
    params.append("sortBy", "SupplierName");

    // Sử dụng POST thay vì GET để phù hợp với API endpoint
    const response = await api.post(
      `/drugsupplier-management/drugsuppliers/export-excel?${params.toString()}`,
      config
    );
    
    // Xử lý đúng cấu trúc response từ server
    if (response.data.isSuccess) {
      return { 
        success: true, 
        data: response.data.data.fileUrl,
        message: response.data.message
      };
    } else {
      return {
        success: false,
        message: response.data.message || "Export failed"
      };
    }
  } catch (error) {
    console.error("Export error:", error);
    return { 
      success: false, 
      message: error instanceof Error ? error.message : "Failed to export data" 
    };
  }
};
