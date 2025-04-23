import api, { setupSignalRConnection } from "./customize-axios";

export interface BatchNumberResponseDTO {
  id: string;
  drug: { id: string; drugCode: string; name: string };
  supplier: { id: string; supplierName: string };
  batchCode: string;
  manufacturingDate?: string;
  expiryDate?: string;
  quantityReceived: number;
  createdAt: string;
  createdBy?: { id?: string; userName?: string; role?: string };
  updatedAt?: string;
  updatedBy?: { id?: string; userName?: string; role?: string };
  status?: string;
}

export interface BatchNumberUpdateRequestDTO {
  manufacturingDate?: string;
  expiryDate?: string;
  status?: string;
}

export interface MergeBatchNumbersRequestDTO {
  batchNumberIds: string[];
}

export interface PrescriptionDTO {
  id: string;
  prescriptionCode: string;
  patientName?: string;
  patientId?: string;
  staffName?: string;
  staffId?: string;
  staffEmail?: string;
  staffUserName?: string;
  totalQuantityUsed?: number;
  quantity?: number;
  doctorName?: string;
  drugName?: string;
  dosage?: string;
  createdAt?: string;
  updatedAt?: string;
  updatedBy?: string;
  status?: string;
  prescriptionDate?: string;
  healthCheckResultCode?: string;
  relevantDrugDetails?: Array<{
    drugId: string;
    drugName: string;
    drugCode: string;
    quantity: number;
    dosage: string;
    instructions: string;
  }>;
}

export const getAllBatchNumbers = async (
  page: number = 1,
  pageSize: number = 10,
  search?: string,
  sortBy: string = "CreatedAt",
  ascending: boolean = false,
  drugName?: string,
  supplierName?: string,
  status?: string,
  manufacturingDateStart?: string,
  manufacturingDateEnd?: string,
  expiryDateStart?: string,
  expiryDateEnd?: string
) => {
  const response = await api.get("/batchnumber-management/batchnumbers", {
    params: {
      page,
      pageSize,
      search,
      sortBy,
      ascending,
      drugName,
      supplierName,
      status,
      manufacturingDateStart,
      manufacturingDateEnd,
      expiryDateStart,
      expiryDateEnd,
    },
  });
  return response.data;
};

export const getBatchNumberById = async (id: string) => {
  const response = await api.get(`/batchnumber-management/batchnumbers/${id}`);
  return response.data.data;
};

export const updateBatchNumber = async (
  id: string,
  data: BatchNumberUpdateRequestDTO
) => {
  const response = await api.put(
    `/batchnumber-management/batchnumbers/${id}`,
    data
  );
  return response.data;
};

export const mergeBatchNumbers = async (data: MergeBatchNumbersRequestDTO) => {
  const response = await api.post(
    "/batchnumber-management/batchnumbers/merge",
    data
  );
  return response.data;
};

export const getBatchNumbersByDrugId = async (drugId: string) => {
  const response = await api.get(
    `/batchnumber-management/batchnumbers/by-drug/${drugId}`
  );
  return response.data.data;
};

export const getBatchNumbersByStatus = async (status: string) => {
  const response = await api.get(
    `/batchnumber-management/batchnumbers/by-status/${status}`
  );
  return response.data.data;
};

export const setupBatchNumberRealTime = (
  callback: (data: BatchNumberResponseDTO) => void
) => {
  return setupSignalRConnection("/batchNumberHub", callback);
};

export const updateBatchNumberStatus = async (
  id: string,
  newStatus: string
) => {
  const response = await api.put(
    `/batchnumber-management/batchnumbers/${id}/status`,
    {},
    { params: { newStatus } }
  );
  return response.data;
};

export const getMergeableBatchGroups = async () => {
  const response = await api.get(
    "/batchnumber-management/batchnumbers/mergeable-groups"
  );
  return response.data.data;
};

export const getAllBatchNumbersWithoutPagination = async () => {
  const response = await api.get("/batchnumber-management/batchnumbers", {
    params: {
      page: 1,
      pageSize: 1000, // Using a large value to get all or most batch numbers
      count: true
    },
  });
  return response.data;
};

export const getPrescriptionsByBatchNumberId = async (id: string) => {
  const response = await api.get(`/batchnumber-management/batchnumbers/${id}/prescriptions`);
  return response.data;
};
