import axios from "axios";
import Cookies from "js-cookie"; // Import thư viện js-cookie

const instance = axios.create({
  baseURL: "https://api-fmcs.duckdns.org/api", // Cập nhật base URL của API
});

interface ErrorResponse {
  data?: any;
  status?: number;
  headers?: any;
}

// Add a request interceptor to include the token in headers
instance.interceptors.request.use(
  (config) => {
    const token = Cookies.get("token");
    console.log("Token being sent in request:", token);
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    } else {
      console.warn("No token found in cookies.");
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Add a response interceptor for handling errors
instance.interceptors.response.use(
  function (response) {
    return response;
  },
  function (error) {
    const res: ErrorResponse = {};
    if (error.response) {
      res.data = error.response.data;
      res.status = error.response.status;
      res.headers = error.response.headers;
    } else if (error.request) {
      console.log(error.request);
    } else {
      console.log("Error", error.message);
    }
    return res;
  }
);

export default instance;
