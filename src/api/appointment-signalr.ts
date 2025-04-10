import Cookies from "js-cookie";
import jwtDecode from "jwt-decode";
import SignalRManager from "./signalr-manager";

// DTO Interfaces
export interface TimeSlotDTO {
  timeSlot: string;
  isAvailable: boolean;
  isLocked: boolean;
  lockedByCurrentUser: boolean;
}

export interface AvailableOfficersResponseDTO {
  staffId: string;
  fullName: string;
  email: string;
  phone: string;
  imageURL: string;
  gender: string;
  status: string;
}

// Event Data Types
interface SignalREventData {
  ReceiveSlotLocked: { staffId: string; date: string; timeSlot: string; appointmentId: string; lockedUntil: string };
  ReceiveAppointmentConfirmed: { staffId: string; date: string; timeSlot: string; appointmentId: string };
  ReceiveSlotReleased: { staffId: string; date: string; timeSlot: string; appointmentId: string; userId: string };
  ReceivePreviousSlotReleased: { staffId: string; date: string; timeSlot: string; appointmentId: string; userId: string };
  ReceiveSlotCountUpdate: number;
  ReceiveAvailableSlotsUpdate: { staffId: string; date: string; slots: TimeSlotDTO[] };
  ReceivePersonalSlotsUpdate: { staffId: string; date: string; slots: TimeSlotDTO[] };
  ReceiveHealthcareStaffUpdate: AvailableOfficersResponseDTO[] | null;
}

// SignalR Setup for Student Appointment Updates
export const setupStudentAppointmentRealTime = (
  userId: string,
  onUpdate: (data: { appointmentId: string; status: string; eventType: string }) => void,
  onError?: (error: Error) => void
): (() => void) => {
  const signalRManager = SignalRManager.getInstance();

  const handleUpdate = (data: { appointmentId: string; status: string }, eventType: string) => {
    console.log(`Student: ${eventType}`, data);
    onUpdate({ appointmentId: data.appointmentId, status: data.status, eventType });
  };

  signalRManager.on("ReceiveSlotLocked", (data: { appointmentId: string; status: string }) =>
    handleUpdate(data, "SlotLocked")
  );
  signalRManager.on("ReceiveAppointmentConfirmed", (data: { appointmentId: string; status: string }) =>
    handleUpdate(data, "Confirmed")
  );
  signalRManager.on("ReceiveSlotReleased", (data: { appointmentId: string; status: string }) =>
    handleUpdate(data, "Released")
  );

  signalRManager.subscribeToGroup(`User_${userId}`).catch((err) => onError?.(err as Error));

  return () => {
    signalRManager.off("ReceiveSlotLocked", (data: any) => handleUpdate(data, "SlotLocked"));
    signalRManager.off("ReceiveAppointmentConfirmed", (data: any) => handleUpdate(data, "Confirmed"));
    signalRManager.off("ReceiveSlotReleased", (data: any) => handleUpdate(data, "Released"));
    signalRManager.unsubscribeFromGroup(`User_${userId}`).catch((err) => onError?.(err as Error));
  };
};

// General Appointment Real-Time Setup
export const setupAppointmentRealTime = (
  callback: (data: { appointmentId: string; status: string }) => void,
  eventHandlers: { [key: string]: (data: any) => void } = {}
): (() => void) => {
  const signalRManager = SignalRManager.getInstance();

  signalRManager.on("ReceiveSlotCountUpdate", (data: number) => {
    console.log("SignalR: Slot count updated", data);
    eventHandlers["ReceiveSlotCountUpdate"]?.(data);
  });

  signalRManager.on("ReceiveAvailableSlotsUpdate", (data: SignalREventData["ReceiveAvailableSlotsUpdate"]) => {
    console.log("SignalR: Available slots updated", data);
    eventHandlers["ReceiveAvailableSlotsUpdate"]?.(data);
  });

  signalRManager.on("ReceivePersonalSlotsUpdate", (data: SignalREventData["ReceivePersonalSlotsUpdate"]) => {
    console.log("SignalR: Personal slots updated", data);
    eventHandlers["ReceivePersonalSlotsUpdate"]?.(data);
  });

  const token = Cookies.get("token");
  if (token) {
    const decodedToken = jwtDecode<{ sub?: string; id?: string; userid?: string; role?: string }>(token);
    const userId = decodedToken.sub || decodedToken.id || decodedToken.userid;
    const role = decodedToken.role;

    if (userId && (role === "HealthcareStaff" || role === "ADMIN")) {
      signalRManager.subscribeToGroup(`Staff_${userId}`).catch((err) => console.error("Subscription failed:", err));
    }
  }

  return () => {
    signalRManager.off("ReceiveSlotCountUpdate", eventHandlers["ReceiveSlotCountUpdate"] as any);
    signalRManager.off("ReceiveAvailableSlotsUpdate", eventHandlers["ReceiveAvailableSlotsUpdate"] as any);
    signalRManager.off("ReceivePersonalSlotsUpdate", eventHandlers["ReceivePersonalSlotsUpdate"] as any);
    if (token) {
      const decodedToken = jwtDecode<{ sub?: string; id?: string; userid?: string; role?: string }>(token);
      const userId = decodedToken.sub || decodedToken.id || decodedToken.userid;
      const role = decodedToken.role;
      if (userId && (role === "HealthcareStaff" || role === "ADMIN")) {
        signalRManager.unsubscribeFromGroup(`Staff_${userId}`).catch((err) => console.error("Unsubscription failed:", err));
      }
    }
  };
};

// Healthcare Staff Real-Time Updates
export const setupHealthcareStaffRealTime = (
  onUpdate: (staff: AvailableOfficersResponseDTO[]) => void
): (() => void) => {
  const signalRManager = SignalRManager.getInstance();

  signalRManager.on("ReceiveHealthcareStaffUpdate", (staffData: AvailableOfficersResponseDTO[] | null) => {
    console.log("SignalR: Received healthcare staff update", staffData);
    if (staffData && Array.isArray(staffData) && staffData.length > 0) {
      onUpdate(staffData);
    } else {
      console.warn("SignalR: Received empty or invalid staff update, ignoring", staffData);
    }
  });

  return () => signalRManager.off("ReceiveHealthcareStaffUpdate", onUpdate as any);
};

// Confirm Appointment Real-Time Updates
export const setupConfirmAppointmentRealtime = (
  staffId: string,
  onAppointmentConfirmed: (data: SignalREventData["ReceiveAppointmentConfirmed"]) => void,
  onError?: (error: Error) => void
): (() => void) => {
  const signalRManager = SignalRManager.getInstance();

  signalRManager.on("ReceiveAppointmentConfirmed", (data: SignalREventData["ReceiveAppointmentConfirmed"]) => {
    console.log("SignalR: Appointment confirmed received", data);
    if (data.staffId === staffId) {
      onAppointmentConfirmed(data);
    }
  });

  signalRManager.subscribeToGroup(`Staff_${staffId}`).catch((err) => onError?.(err as Error));

  return () => {
    signalRManager.off("ReceiveAppointmentConfirmed", onAppointmentConfirmed as any);
    signalRManager.unsubscribeFromGroup(`Staff_${staffId}`).catch((err) => onError?.(err as Error));
  };
};

// Schedule Appointment Locked Real-Time Updates
export const setupScheduleAppointmentLockedRealtime = (
  staffId: string,
  onSlotLocked: (data: SignalREventData["ReceiveSlotLocked"]) => void,
  onError?: (error: Error) => void
): (() => void) => {
  const signalRManager = SignalRManager.getInstance();

  signalRManager.on("ReceiveSlotLocked", (data: SignalREventData["ReceiveSlotLocked"]) => {
    console.log("SignalR: Slot locked received", data);
    if (data.staffId === staffId) {
      onSlotLocked(data);
    }
  });

  signalRManager.subscribeToGroup(`Staff_${staffId}`).catch((err) => onError?.(err as Error));

  return () => {
    signalRManager.off("ReceiveSlotLocked", onSlotLocked as any);
    signalRManager.unsubscribeFromGroup(`Staff_${staffId}`).catch((err) => onError?.(err as Error));
  };
};

// Cancel Appointment Real-Time Updates
export const setupCancelAppointmentRealtime = (
  staffId: string,
  onSlotReleased: (data: SignalREventData["ReceiveSlotReleased"]) => void,
  onError?: (error: Error) => void
): (() => void) => {
  const signalRManager = SignalRManager.getInstance();

  signalRManager.on("ReceiveSlotReleased", (data: SignalREventData["ReceiveSlotReleased"]) => {
    console.log("SignalR: Slot released received", data);
    if (data.staffId === staffId) {
      onSlotReleased(data);
    }
  });

  signalRManager.subscribeToGroup(`Staff_${staffId}`).catch((err) => onError?.(err as Error));

  return () => {
    signalRManager.off("ReceiveSlotReleased", onSlotReleased as any);
    signalRManager.unsubscribeFromGroup(`Staff_${staffId}`).catch((err) => onError?.(err as Error));
  };
};

// Cancel Previous Locked Appointment Real-Time Updates
export const setupCancelPreviousLockedAppointmentRealtime = (
  staffId: string,
  onPreviousSlotReleased: (data: SignalREventData["ReceivePreviousSlotReleased"]) => void,
  onError?: (error: Error) => void
): (() => void) => {
  const signalRManager = SignalRManager.getInstance();

  signalRManager.on("ReceivePreviousSlotReleased", (data: SignalREventData["ReceivePreviousSlotReleased"]) => {
    console.log("SignalR: Previous slot released received", data);
    if (data.staffId === staffId) {
      onPreviousSlotReleased(data);
    }
  });

  signalRManager.subscribeToGroup(`Staff_${staffId}`).catch((err) => onError?.(err as Error));

  return () => {
    signalRManager.off("ReceivePreviousSlotReleased", onPreviousSlotReleased as any);
    signalRManager.unsubscribeFromGroup(`Staff_${staffId}`).catch((err) => onError?.(err as Error));
  };
};

// Cancel Present Locked Appointment Real-Time Updates
export const setupCancelPresentLockedAppointmentRealtime = (
  staffId: string,
  onPresentSlotReleased: (data: SignalREventData["ReceiveSlotReleased"]) => void,
  onError?: (error: Error) => void
): (() => void) => {
  const signalRManager = SignalRManager.getInstance();

  signalRManager.on("ReceiveSlotReleased", (data: SignalREventData["ReceiveSlotReleased"]) => {
    console.log("SignalR: Present slot released received", data);
    if (data.staffId === staffId) {
      onPresentSlotReleased(data);
    }
  });

  signalRManager.subscribeToGroup(`Staff_${staffId}`).catch((err) => onError?.(err as Error));

  return () => {
    signalRManager.off("ReceiveSlotReleased", onPresentSlotReleased as any);
    signalRManager.unsubscribeFromGroup(`Staff_${staffId}`).catch((err) => onError?.(err as Error));
  };
};

// Cancel Expired Locked Appointment Real-Time Updates
export const setupCancelExpiredLockedAppointmentRealtime = (
  staffId: string,
  onSlotReleased: (data: { staffId: string; date: string; timeSlot: string; appointmentId: string; userId: string }) => void,
  onError?: (error: Error) => void
): (() => void) => {
  const signalRManager = SignalRManager.getInstance();

  signalRManager.on("CancelExpiredLockedAppointment", (data: { staffId: string; date: string; timeSlot: string; appointmentId: string; userId: string }) => {
    console.log("SignalR: Expired locked slot cancellation received", data);
    if (data.staffId === staffId) {
      onSlotReleased(data);
    }
  });

  signalRManager.subscribeToGroup(`Staff_${staffId}`).catch((err) => {
    console.error("Failed to subscribe to Staff group:", err);
    onError?.(err as Error);
  });

  return () => {
    signalRManager.off("CancelExpiredLockedAppointment", onSlotReleased as any);
    signalRManager.unsubscribeFromGroup(`Staff_${staffId}`).catch((err) => {
      console.error("Failed to unsubscribe from Staff group:", err);
      onError?.(err as Error);
    });
  };
};