import { HubConnection, HubConnectionBuilder, HubConnectionState, LogLevel } from "@microsoft/signalr";
import Cookies from "js-cookie";

// Remove hardcoded URL
// const HUB_URL = "http://localhost:5104/appointmentHub";

interface SignalRConfig {
  url?: string;
  reconnectDelays?: number[];
  maxRetries?: number;
}

class SignalRManager {
  private static instance: SignalRManager | null = null;
  private connection: HubConnection | null = null;
  private eventHandlers: { [eventName: string]: ((data: any) => void)[] } = {};
  private subscribedGroups: Set<string> = new Set();
  private eventBuffer: { eventName: string; data: any }[] = [];
  private url: string;
  private reconnectDelays: number[];
  private maxRetries: number;

  private constructor(config: SignalRConfig = {}) {
    this.url = config.url || "/appointmentHub";
    this.reconnectDelays = config.reconnectDelays || [0, 1000, 5000, 10000];
    this.maxRetries = config.maxRetries || 3;
    this.initializeConnection();
    this.startBufferCheck(); // Start periodic buffer flushing
  }

  public static getInstance(config?: SignalRConfig): SignalRManager {
    if (!SignalRManager.instance) {
      SignalRManager.instance = new SignalRManager(config);
    }
    return SignalRManager.instance;
  }

  private initializeConnection() {
    if (typeof window === "undefined") {
      console.log("SignalR setup skipped on server-side");
      return;
    }

    const token = Cookies.get("token");
    if (!token) {
      console.warn("No token available for SignalR connection; initialization deferred.");
      return;
    }

    if (this.connection && this.connection.state !== HubConnectionState.Disconnected) {
      return; // Avoid re-initializing an active connection
    }

    this.connection = new HubConnectionBuilder()
      .withUrl(this.url, { accessTokenFactory: () => Cookies.get("token") || "" })
      .configureLogging(LogLevel.Information)
      .withAutomaticReconnect(this.reconnectDelays)
      .build();

    this.connection.onclose((err) => {
      console.log("SignalR Connection Closed:", err);
      this.flushBuffer();
    });
    this.connection.onreconnecting((err) => console.log("SignalR Reconnecting:", err));
    this.connection.onreconnected(() => {
      console.log("SignalR Reconnected");
      this.resubscribeToGroups();
      this.flushBuffer();
    });

    this.startConnection();
  }

  private async startConnection() {
    if (!this.connection || this.connection.state !== HubConnectionState.Disconnected) {
      return;
    }

    try {
      await this.connection.start();
      console.log(`SignalR: Connected to ${this.url}`);
      await this.resubscribeToGroups();
    } catch (err) {
      console.error("SignalR: Connection failed:", err);
      setTimeout(() => this.startConnection(), 2000);
    }
  }

  public async ensureConnected(): Promise<void> {
    if (!this.connection) {
      this.initializeConnection();
    }
    if (!this.connection) {
      throw new Error("SignalR connection could not be initialized.");
    }
    if (this.connection.state === HubConnectionState.Disconnected) {
      await this.startConnection();
    } else if (this.connection.state === HubConnectionState.Connecting) {
      await new Promise<void>((resolve) => {
        const interval = setInterval(() => {
          if (this.connection?.state === HubConnectionState.Connected) {
            clearInterval(interval);
            resolve();
          }
        }, 100);
      });
    }
  }

  public on(eventName: string, callback: (data: any) => void): () => void {
    if (!this.connection) {
      console.warn("No SignalR connection available for event registration.");
      return () => {}; // Return no-op cleanup if no connection
    }

    if (!this.eventHandlers[eventName]) {
      this.eventHandlers[eventName] = [];
      this.connection.on(eventName, (data: any) => {
        console.log(`SignalR Event [${eventName}]:`, data);
        if (this.connection?.state === HubConnectionState.Connected) {
          this.eventHandlers[eventName].forEach((handler) => handler(data));
        } else {
          this.bufferEvent(eventName, data);
        }
      });
    }
    this.eventHandlers[eventName].push(callback);

    return () => {
      if (this.eventHandlers[eventName]) {
        this.eventHandlers[eventName] = this.eventHandlers[eventName].filter(
          (handler) => handler !== callback
        );
        if (this.eventHandlers[eventName].length === 0) {
          delete this.eventHandlers[eventName];
          this.connection?.off(eventName);
        }
      }
    };
  }

  public off(eventName: string, callback: (data: any) => void) {
    if (!this.eventHandlers[eventName]) return;

    this.eventHandlers[eventName] = this.eventHandlers[eventName].filter(
      (handler) => handler !== callback
    );
    if (this.eventHandlers[eventName].length === 0 && this.connection) {
      delete this.eventHandlers[eventName];
      this.connection.off(eventName);
    }
  }

  public async invoke(methodName: string, ...args: any[]): Promise<any> {
    await this.ensureConnected();
    if (!this.connection) {
      throw new Error("SignalR connection not available");
    }
    return this.connection.invoke(methodName, ...args);
  }

  public async subscribeToGroup(groupName: string): Promise<() => Promise<void>> {
    if (!this.connection || this.subscribedGroups.has(groupName)) {
      return async () => {}; // Return no-op cleanup if already subscribed or no connection
    }

    await this.ensureConnected();
    await this.subscribeWithRetry(groupName);

    return async () => {
      await this.unsubscribeFromGroup(groupName);
    };
  }

  private async subscribeWithRetry(groupName: string): Promise<void> {
    for (let attempt = 1; attempt <= this.maxRetries; attempt++) {
      try {
        if (!this.connection || this.connection.state !== HubConnectionState.Connected) {
          throw new Error("Connection not ready");
        }
        if (groupName.startsWith("Staff_")) {
          const staffId = groupName.replace("Staff_", "");
          await this.connection.invoke("SubscribeToStaffUpdates", staffId);
          console.log(`SignalR: Subscribed to ${groupName}`);
        } else if (groupName.startsWith("User_")) {
          const userId = groupName.replace("User_", "");
          await this.connection.invoke("SubscribeToUserUpdates", userId);
          console.log(`SignalR: Subscribed to ${groupName}`);
        }
        this.subscribedGroups.add(groupName);
        return;
      } catch (err) {
        console.error(`SignalR: Attempt ${attempt} failed to subscribe to ${groupName}:`, err);
        if (attempt === this.maxRetries) throw err;
        await new Promise(resolve => setTimeout(resolve, this.reconnectDelays[attempt - 1] || 1000));
      }
    }
  }

  public async unsubscribeFromGroup(groupName: string): Promise<void> {
    if (!this.connection || !this.subscribedGroups.has(groupName)) return;

    try {
      if (this.connection.state === HubConnectionState.Connected) {
        if (groupName.startsWith("Staff_")) {
          const staffId = groupName.replace("Staff_", "");
          await this.connection.invoke("UnsubscribeFromStaffUpdates", staffId);
          console.log(`SignalR: Unsubscribed from ${groupName}`);
        }
        this.subscribedGroups.delete(groupName);
      }
    } catch (err) {
      console.error(`SignalR: Failed to unsubscribe from ${groupName}:`, err);
      throw err;
    }
  }

  private async resubscribeToGroups() {
    if (!this.connection || this.connection.state !== HubConnectionState.Connected) return;

    for (const groupName of this.subscribedGroups) {
      await this.subscribeWithRetry(groupName);
    }
  }

  private bufferEvent(eventName: string, data: any) {
    this.eventBuffer.push({ eventName, data });
    console.log(`SignalR: Buffered event [${eventName}]`, data);
  }

  private async flushBuffer() {
    if (!this.connection || this.connection.state !== HubConnectionState.Connected) return;

    while (this.eventBuffer.length > 0) {
      const { eventName, data } = this.eventBuffer.shift()!;
      if (this.eventHandlers[eventName]) {
        this.eventHandlers[eventName].forEach(handler => handler(data));
      }
    }
  }

  private startBufferCheck() {
    setInterval(() => {
      if (this.connection?.state === HubConnectionState.Connected) {
        this.flushBuffer();
      }
    }, 5000); // Check every 5 seconds
  }

  public onStateChange(callback: (state: HubConnectionState) => void) {
    if (!this.connection) return;

    const handler = () => callback(this.connection!.state);
    this.connection.onclose(handler);
    this.connection.onreconnecting(handler);
    this.connection.onreconnected(handler);
    callback(this.connection.state);

    return () => {
      this.connection?.off("close", handler);
      this.connection?.off("reconnecting", handler);
      this.connection?.off("reconnected", handler);
    };
  }

  public async stop() {
    if (this.connection && this.connection.state !== HubConnectionState.Disconnected) {
      await this.connection.stop();
      console.log("SignalR: Disconnected");
      this.subscribedGroups.clear();
    }
  }

  public async dispose(): Promise<void> {
    await this.stop();
    this.eventHandlers = {};
    this.subscribedGroups.clear();
    this.eventBuffer = [];
    SignalRManager.instance = null;
  }

  public isConnected(): boolean {
    return this.connection?.state === HubConnectionState.Connected;
  }
}

export default SignalRManager;