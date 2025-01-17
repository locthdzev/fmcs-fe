import api from "./customize-axios";

export const getUsers = async () => {
  try {
    const response = await api.get("/user-management/users");
    return response.data;
  } catch (error) {
    throw error;
  }
};