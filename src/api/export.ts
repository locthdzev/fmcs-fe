import api from "./customize-axios";

export const exportToExcel = async (endpoint: string, filename: string) => {
  const response = await api.get(endpoint, { responseType: "blob" });
  const url = window.URL.createObjectURL(new Blob([response.data]));
  const link = document.createElement("a");
  link.href = url;
  link.setAttribute("download", filename);
  document.body.appendChild(link);
  link.click();
  link.remove();
};
