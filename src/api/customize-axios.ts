import axios from "axios";
import Cookies from "js-cookie";
import { HubConnectionBuilder, HubConnection } from "@microsoft/signalr";

const instance = axios.create({
  baseURL: "http://118.69.53.27/fmcsapi/api",
});

console.log("API Base URL:", instance.defaults.baseURL);

interface ErrorResponse {
  data?: any;
  status?: number;
  headers?: any;
}

// Helper function to extract useful error messages from API responses
function extractErrorMessage(error: any): string {
  let errorMessage = "An error occurred";

  if (!error.response || !error.response.data) {
    return error.message || errorMessage;
  }

  const responseData = error.response.data;

  // Handle different error response formats
  if (typeof responseData === "string") {
    errorMessage = responseData;
  } else if (responseData.message) {
    errorMessage = responseData.message;
  } else if (responseData.error) {
    errorMessage = responseData.error;
  } else if (responseData.detail) {
    errorMessage = responseData.detail;
  } else if (responseData.errors && Array.isArray(responseData.errors)) {
    errorMessage = responseData.errors
      .map((e: any) => e.message || e.error || e)
      .join(", ");
  } else if (responseData.responseStatus && responseData.responseFailed) {
    errorMessage = responseData.responseFailed;
  }

  return errorMessage;
}

instance.interceptors.request.use(
  (config) => {
    const token = Cookies.get("token");
    console.log(
      "Token being sent in request:",
      token ? token.substring(0, 15) + "..." : "No token"
    );
    console.log("Request URL:", config.url);
    console.log("Request Method:", config.method);
    console.log("Request Headers:", config.headers);

    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    } else {
      console.warn(
        "No token found in cookies. Request may fail if authentication is required."
      );
    }
    console.log(
      `📤 REQUEST: ${config.method?.toUpperCase()} ${config.baseURL}${
        config.url
      }`,
      config.params ? `\nParams: ${JSON.stringify(config.params)}` : "",
      config.data ? `\nData: ${JSON.stringify(config.data)}` : ""
    );
    return config;
  },
  (error) => {
    console.error("📤 REQUEST ERROR:", error);
    return Promise.reject(error);
  }
);

instance.interceptors.response.use(
  (response) => {
    console.log("Response Status:", response.status);
    console.log("Response URL:", response.config.url);
    console.log(
      "Response Data Preview:",
      typeof response.data === "object"
        ? JSON.stringify(response.data).substring(0, 150) + "..."
        : response.data
    );
    console.log(`📥 RESPONSE: ${response.status} ${response.config.url}`);
    return response;
  },
  (error) => {
    const res: ErrorResponse = {};
    console.error("Response Error:", error.message);

    if (error.response) {
      res.data = error.response.data;
      res.status = error.response.status;
      res.headers = error.response.headers;
      console.error("Error Response Status:", error.response.status);
      console.error("Error Response Data:", error.response.data);
      console.error("Response data:", error.response?.data);

      // Create a sanitized error object for all API errors
      // This prevents them from becoming unhandled exceptions in React
      const sanitizedError = {
        ...error,
        isHandled: true,
        // Extract a user-friendly message
        message: extractErrorMessage(error),
      };

      // Return the sanitized error object
      return Promise.reject(sanitizedError);
    } else if (error.request) {
      console.error("Error Request (No Response):", error.request);
    } else {
      console.error("Error Setting Up Request:", error.message);
    }
    console.error("📥 RESPONSE ERROR:", error.message);
    return Promise.reject(error);
  }
);

const rasaInstance = axios.create({
  baseURL: "https://chatbot.truongvu.id.vn",
});

export const setupSignalRConnection = (
  endpoint: string,
  callback: (data: any) => void,
  eventHandlers?: { [key: string]: (data: any) => void }
): HubConnection => {
  const token = Cookies.get("token");
  if (!token) {
    console.warn(
      "No token available for SignalR connection. Returning a dummy connection."
    );
    // Trả về một đối tượng giả với các phương thức cần thiết
    return {
      on: () => {},
      off: () => {},
      start: () => Promise.resolve(),
      stop: () => Promise.resolve(),
      state: {},
      onreconnecting: () => {},
      onreconnected: () => {},
      onclose: () => {},
      invoke: () => Promise.resolve(),
    } as unknown as HubConnection;
  }

  const connection = new HubConnectionBuilder()
    .withUrl(`https://api.truongvu.id.vn${endpoint}`, {
      accessTokenFactory: () => token,
    })
    .withAutomaticReconnect([0, 2000, 5000, 10000])
    .build();

  connection.on("ReceiveUpdate", callback);
  if (eventHandlers) {
    Object.entries(eventHandlers).forEach(([event, handler]) => {
      connection.on(event, handler);
    });
  }

  const startConnection = () => {
    setTimeout(() => {
      connection
        .start()
        .then(() => console.log("SignalR Connected to " + endpoint))
        .catch((err) => {
          console.error("SignalR Connection Error:", err);
          if (err.message.includes("negotiation")) {
            setTimeout(startConnection, 2000);
          }
        });
    }, 500);
  };

  startConnection();

  connection.onreconnecting((err) => console.log("SignalR Reconnecting:", err));
  connection.onreconnected(() =>
    console.log("SignalR Reconnected to " + endpoint)
  );

  return connection;
};

export default instance;
export { rasaInstance };
