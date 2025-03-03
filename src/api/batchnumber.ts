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
  updatedAt?: string;
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

export const getAllBatchNumbers = async (
  page: number = 1,
  pageSize: number = 10,
  search?: string
) => {
  const response = await api.get("/batchnumber-management/batchnumbers", {
    params: { page, pageSize, search },
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
    {
      params: { newStatus },
    }
  );
  return response.data;
};

export const getMergeableBatchGroups = async () => {
  const response = await api.get(
    "/batchnumber-management/batchnumbers/mergeable-groups"
  );
  return response.data.data;
};
