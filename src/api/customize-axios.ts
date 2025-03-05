import axios from "axios";
import Cookies from "js-cookie";
import { HubConnectionBuilder, HubConnection } from "@microsoft/signalr";

const instance = axios.create({
  baseURL: "http://localhost:5104/api",
});

interface ErrorResponse {
  data?: any;
  status?: number;
  headers?: any;
}

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
  (error) => Promise.reject(error)
);

instance.interceptors.response.use(
  (response) => response,
  (error) => {
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
    console.error("No token available for SignalR connection.");
    throw new Error("Authentication token is missing.");
  }

  const connection = new HubConnectionBuilder()
    .withUrl(`http://localhost:5104${endpoint}`, {
      accessTokenFactory: () => token,
    })
    .withAutomaticReconnect([0, 2000, 5000, 10000]) // Retry sau 0s, 2s, 5s, 10s
    .build();

  // Register default event handler
  connection.on("ReceiveUpdate", callback);

  // Register additional event handlers if provided
  if (eventHandlers) {
    Object.entries(eventHandlers).forEach(([event, handler]) => {
      connection.on(event, handler);
    });
  }

  // Delay nhỏ để đảm bảo backend sẵn sàng
  const startConnection = () => {
    setTimeout(() => {
      connection
        .start()
        .then(() => console.log("SignalR Connected to " + endpoint))
        .catch((err) => {
          console.error("SignalR Connection Error:", err);
          // Retry nếu lỗi
          if (err.message.includes("negotiation")) {
            setTimeout(startConnection, 2000); // Retry sau 2s
          }
        });
    }, 500); // Delay 500ms
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
