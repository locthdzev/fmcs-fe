import api from "./customize-axios";

export const getDrugs = async () => {
  try {
    const response = await api.get("/druggroup-management/druggroups");
    return response.data;
  } catch (error) {
    throw error;
  }
};