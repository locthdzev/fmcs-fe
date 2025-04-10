import React, { useState, useEffect, useCallback, useMemo, useRef } from "react";
import { CalendarOutlined } from "@ant-design/icons";
import { GetServerSideProps } from "next";
import { v4 as uuidv4 } from "uuid";
import jwtDecode from "jwt-decode";
import {
  getAppointment,
  AppointmentCreateRequestDTO,
  scheduleAppointment,
  getAvailableTimeSlots,
  getAvailableSlotCount,
  validateAppointmentRequest,
  confirmAppointment,
  cancelLockedAppointment,
  AvailableOfficersResponseDTO,
  getHealthcareStaffById,
  setupAppointmentRealTime,
  TimeSlotDTO,
  AppointmentResponseDTO,
  AppointmentConflictResponseDTO,
  setupScheduleAppointmentLockedRealtime,
  setupCancelAppointmentRealtime,
  setupConfirmAppointmentRealtime,
  setupCancelPreviousLockedAppointmentRealtime,
  cancelPreviousLockedAppointment,
  cancelPresentLockedAppointment,
  setupCancelPresentLockedAppointmentRealtime,
} from "@/api/appointment-api";
import { Button, Spin, Typography, Row, Col } from "antd";
import { toast } from "react-toastify";
import moment from "moment-timezone";
import Cookies from "js-cookie";
import { HubConnection, HubConnectionState } from "@microsoft/signalr";

const { Title, Text } = Typography;

const allTimeSlots = [
  "08:00 - 08:30", "08:30 - 09:00", "09:00 - 09:30", "09:30 - 10:00",
  "10:00 - 10:30", "10:30 - 11:00", "11:00 - 11:30", "11:30 - 12:00",
  "13:30 - 14:00", "14:00 - 14:30", "14:30 - 15:00", "15:00 - 15:30",
  "15:30 - 16:00", "16:00 - 16:30", "16:30 - 17:00", "17:00 - 17:30",
];

interface ScheduleAppointmentProps {
  staff: AvailableOfficersResponseDTO;
  token: string | undefined;
}

interface TimeSlot {
  timeSlot: string;
  isAvailable: boolean;
  isLocked: boolean;
  lockedByCurrentUser: boolean;
  isConfirmed?: boolean;
}

const ScheduleAppointment: React.FC<ScheduleAppointmentProps> = ({ staff, token }) => {
  console.log("Staff prop received:", staff);
  console.log("Token received:", token ? "Present" : "Missing");

  const [schedulingInProgress, setSchedulingInProgress] = useState(false);
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [selectedTimeSlot, setSelectedTimeSlot] = useState<string | null>(null);
  const [availableSlots, setAvailableSlots] = useState<TimeSlot[]>([]);
  const [slotCounts, setSlotCounts] = useState<{ [key: string]: number | null }>({});
  const [loading, setLoading] = useState(false);
  const [fetchingSlots, setFetchingSlots] = useState(false);
  const [fetchingSlotCounts, setFetchingSlotCounts] = useState(false);
  const [appointmentId, setAppointmentId] = useState<string | null>(null);
  const [lockedUntil, setLockedUntil] = useState<moment.Moment | null>(null);
  const [hoveredIndex, setHoveredIndex] = useState<string | null>(null);
  const [sessionId] = useState<string>(uuidv4());
  const connectionRef = useRef<HubConnection | null>(null);
  const [userId, setUserId] = useState<string | null>(null);
  const [isConfirming, setIsConfirming] = useState(false);
  const confirmConnectionRef = useRef<HubConnection | null>(null); // Unused but kept for original structure
  const broadcastChannelRef = useRef<BroadcastChannel | null>(null);
  const [isConfirmed, setIsConfirmed] = useState(false);

  interface JwtPayload {
    userid?: string;
    sub?: string;
    id?: string;
    [key: string]: any;
  }

  interface SlotUpdatePayload {
    staffId: string;
    date: string;
    slots: {
      availableSlots: TimeSlotDTO[];
      userSelectedSlot?: string | null;
      lockedAppointmentId?: string | null;
      lockedUntil?: string | null;
    };
  }

  interface AppointmentUpdatePayload {
    appointmentId: string;
    userId: string;
    staffId: string;
    appointmentDate: string;
    status: string;
    message: string;
  }

  // Decode token and set userId
  useEffect(() => {
    if (token) {
      try {
        const decodedToken = jwtDecode<JwtPayload>(token);
        const userIdFromToken = decodedToken.userid || decodedToken.sub || decodedToken.id || null;
        setUserId(userIdFromToken);
      } catch (error) {
        console.error("Failed to decode token:", error);
        toast.error("Invalid authentication token.");
      }
    }
  }, [token]);

  const fetchAvailableSlots = useCallback(
    async (date: string) => {
      if (!token || !userId || schedulingInProgress) return;
      setFetchingSlots(true);
      try {
        const response = await getAvailableTimeSlots(staff.staffId, date, token);
        const slotData = response.data?.availableSlots || [];
        const newSlots: TimeSlot[] = allTimeSlots.map((timeSlot) => {
          const slotFromApi = slotData.find((s: TimeSlotDTO) => s.timeSlot === timeSlot);
          const result = slotFromApi || {
            timeSlot,
            isAvailable: false,
            isLocked: false,
            lockedByCurrentUser: false,
            isConfirmed: false,
          };
          console.log(`Slot ${timeSlot}:`, result); // Log each slot’s state
          return result;
        });
        setAvailableSlots(newSlots);
        console.log("New availableSlots set:", newSlots);
  
        const userSelected = newSlots.find((s) => s.lockedByCurrentUser);
        if (userSelected) {
          setSelectedTimeSlot(userSelected.timeSlot);
          setAppointmentId(response.data?.lockedAppointmentId || null);
          setLockedUntil(response.data?.lockedUntil ? moment(response.data.lockedUntil) : null);
          setIsConfirmed(false);
          setIsConfirming(false);
        } else if (
          selectedTimeSlot &&
          !newSlots.some((s) => s.timeSlot === selectedTimeSlot && (s.isAvailable || s.lockedByCurrentUser))
        ) {
          setSelectedTimeSlot(null);
          setAppointmentId(null);
          setLockedUntil(null);
        }
      } catch (error: any) {
        console.error("Failed to fetch slots:", error);
        toast.error("Failed to load slots: " + (error.message || "Unknown error"));
      } finally {
        setFetchingSlots(false);
      }
    },
    [staff.staffId, token, userId, selectedTimeSlot, schedulingInProgress]
  );

  // Initialize BroadcastChannel with local updates and slot release
  useEffect(() => {
    if (typeof window !== "undefined") {
      broadcastChannelRef.current = new BroadcastChannel("appointment_channel");
      broadcastChannelRef.current.onmessage = (event) => {
        const { type, appointmentId: broadcastedId, lockedUntil, timeSlot, selectedDate: broadcastedDate, staffId: broadcastedStaffId, canceledTimeSlot, reason } = event.data;
        if (broadcastedStaffId !== staff.staffId) return;

        if (type === "LOCK_SLOT" && broadcastedDate === selectedDate) {
          setAvailableSlots((prev) =>
            prev.map((slot) =>
              slot.timeSlot === timeSlot
                ? { ...slot, isAvailable: false, isLocked: true, lockedByCurrentUser: true }
                : slot
            )
          );
          setAppointmentId(broadcastedId);
          setLockedUntil(lockedUntil ? moment(lockedUntil) : null);
          setSelectedTimeSlot(timeSlot);
          setIsConfirmed(false);
          setIsConfirming(false);
        } else if (type === "CANCEL_SLOT" && broadcastedDate === selectedDate) {
          setAvailableSlots((prev) =>
            prev.map((slot) =>
              slot.timeSlot === canceledTimeSlot
                ? { ...slot, isAvailable: true, isLocked: false, lockedByCurrentUser: false }
                : slot
            )
          );
          if (canceledTimeSlot === selectedTimeSlot) {
            setSelectedTimeSlot(null);
            setAppointmentId(null);
            setLockedUntil(null);
            if (reason === "user-initiated") {
              toast.info("Your locked appointment was canceled.");
            }
          }
        } else if (broadcastedId === appointmentId) {
          if (type === "START_CONFIRMATION") {
            setIsConfirming(true);
            setLoading(true);
          } else if (type === "CONFIRM_APPOINTMENT") {
            setIsConfirmed(true);
            setLockedUntil(null);
            setAppointmentId(null);
            setSelectedTimeSlot(null);
            setIsConfirming(false);
            setLoading(false);
            setAvailableSlots((prev) =>
              prev.map((slot) =>
                slot.timeSlot === timeSlot
                  ? { ...slot, isAvailable: false, isLocked: true, lockedByCurrentUser: false, isConfirmed: true }
                  : slot
              )
            );
            toast.success("Appointment confirmed in another tab!");
          }
        }
      };
    }
    return () => {
      broadcastChannelRef.current?.close();
    };
  }, [appointmentId, selectedDate, staff.staffId]);

  const useCountdown = (lockedUntil: moment.Moment | null, isConfirmed: boolean) => {
    const [timeLeft, setTimeLeft] = useState<number | null>(null);
  
    useEffect(() => {
      if (!lockedUntil || isConfirmed || isConfirming) {
        setTimeLeft(null);
        return;
      }
      const interval = setInterval(() => {
        const diff = moment(lockedUntil).diff(moment());
        if (diff <= 0) {
          setTimeLeft(null);
          setAppointmentId(null);
          setSelectedTimeSlot(null);
          setLockedUntil(null);
          if (token) { // Check for token instead of userId since sessionId is used
            cancelPresentLockedAppointment(token)
              .then((response) => {
                if (response.isSuccess) {
                  if (selectedDate) {
                    setAvailableSlots((prev) =>
                      prev.map((slot) =>
                        slot.lockedByCurrentUser
                          ? { ...slot, isAvailable: true, isLocked: false, lockedByCurrentUser: false }
                          : slot
                      )
                    );
                    broadcastChannelRef.current?.postMessage({
                      type: "CANCEL_SLOT",
                      canceledTimeSlot: selectedTimeSlot,
                      selectedDate,
                      staffId: staff.staffId,
                      reason: "expiration"
                    });
                    // return fetchAvailableSlots(selectedDate);
                    toast.error("Appointment lock expired.");
                  }
                  
                } else {
                  console.error("Failed to cancel previous locked appointment:", response.message);
                  toast.error("Failed to free expired slot.");
                }
              })
              .catch((error) => {
                console.error("Cancel previous locked appointment failed:", error);
                toast.error("Failed to free expired slot.");
              });
          }
          
        } else {
          setTimeLeft(Math.ceil(diff / 1000));
        }
      }, 1000);
      return () => clearInterval(interval);
    }, [lockedUntil, isConfirmed, isConfirming, token, selectedDate, selectedTimeSlot, sessionId]);
  
    return timeLeft;
  };
  
  const timeLeft = useCountdown(lockedUntil, isConfirmed);

  const fetchAvailableSlotCount = useCallback(
    async (date: string) => {
      if (!token) return;
      setFetchingSlotCounts(true);
      try {
        const response = await getAvailableSlotCount(staff.staffId, date, token);
        setSlotCounts((prev) => ({ ...prev, [date]: response.data }));
      } catch (error: any) {
        console.error("Fetch slot count error:", error);
      } finally {
        setFetchingSlotCounts(false);
      }
    },
    [staff.staffId, token]
  );

  const eventHandlers = useMemo(
    () => ({
      ReceiveAvailableSlotsUpdate: (data: SlotUpdatePayload) => {
        if (data.staffId === staff.staffId && data.date === selectedDate && !schedulingInProgress) {
          setAvailableSlots((prev) => {
            const newSlots = allTimeSlots.map((timeSlot) => {
              const slotFromApi = data.slots.availableSlots.find((s) => s.timeSlot === timeSlot);
              return slotFromApi || {
                timeSlot,
                isAvailable: false,
                isLocked: false,
                lockedByCurrentUser: false,
              };
            });
            const userSelected = newSlots.find((s) => s.lockedByCurrentUser);
            if (userSelected) {
              setSelectedTimeSlot(userSelected.timeSlot);
              setAppointmentId(data.slots.lockedAppointmentId || null);
              setLockedUntil(data.slots.lockedUntil ? moment(data.slots.lockedUntil) : null);
              setIsConfirmed(false);
              setIsConfirming(false);
            } else if (
              selectedTimeSlot &&
              !newSlots.some((s) => s.timeSlot === selectedTimeSlot && (s.isAvailable || s.lockedByCurrentUser))
            ) {
              console.log(`Slot ${selectedTimeSlot} no longer available after update.`);
              setSelectedTimeSlot(null);
              setAppointmentId(null);
              setLockedUntil(null);
              setIsConfirmed(false);
              setIsConfirming(false);
            }
            return newSlots;
          });
        }
      },
      ReceivePersonalSlotsUpdate: (data: SlotUpdatePayload) => {
        if (data.staffId === staff.staffId && data.date === selectedDate && !schedulingInProgress) {
          setAvailableSlots((prev) => {
            const newSlots = allTimeSlots.map((timeSlot) => {
              const slotFromApi = data.slots.availableSlots.find((s) => s.timeSlot === timeSlot);
              return slotFromApi || {
                timeSlot,
                isAvailable: false,
                isLocked: false,
                lockedByCurrentUser: false,
              };
            });
            const userSelected = newSlots.find((s) => s.lockedByCurrentUser);
            if (userSelected) {
              setSelectedTimeSlot(userSelected.timeSlot);
              setAppointmentId(data.slots.lockedAppointmentId || null);
              setLockedUntil(data.slots.lockedUntil ? moment(data.slots.lockedUntil) : null);
            } else {
              setSelectedTimeSlot(null);
              setAppointmentId(null);
              setLockedUntil(null);
            }
            return newSlots;
          });
        }
      },
      ReceivePersonalSlotCountUpdate: (data: { staffId: string; date: string; count: number }) => {
        if (data.staffId === staff.staffId && !schedulingInProgress) {
          setSlotCounts((prev) => ({ ...prev, [data.date]: data.count }));
        }
      },
    }),
    [staff.staffId, selectedDate, selectedTimeSlot, schedulingInProgress, userId]
  );

  const initializeConnection = useCallback(async () => {
    if (!token) {
      console.log("SignalR: Skipping initialization - no token");
      return;
    }

    let connection = connectionRef.current;

    if (connection) {
      if (connection.state !== HubConnectionState.Disconnected) {
        try {
          console.log(`Stopping existing connection (state: ${connection.state})...`);
          await connection.stop();
          console.log("Existing connection stopped.");
        } catch (err) {
          console.error("SignalR: Failed to stop existing connection:", err);
        }
      }
      connectionRef.current = null;
    }

    connection = setupAppointmentRealTime(
      (data) => console.log("SignalR: Generic update:", data),
      eventHandlers
    );
    connectionRef.current = connection;

    await new Promise((resolve) => setTimeout(resolve, 3000));

    try {
      if (connection.state === HubConnectionState.Disconnected) {
        console.log(`Starting SignalR connection for staffId: ${staff.staffId}`);
        await connection.start();
        await connection.invoke("SubscribeToStaffUpdates", staff.staffId);
        console.log(`Subscribed to staff updates for staffId: ${staff.staffId}`);
      } else {
        console.warn(`Cannot start connection. Current state: ${connection.state}`);
      }
    } catch (err) {
      console.error("SignalR: Connection start failed:", err);
    }

    connection.on("connected", () => {
      console.log("SignalR: Connection established.");
      connection.invoke("SubscribeToStaffUpdates", staff.staffId).catch((err) =>
        console.error("SignalR: Subscription failed on connect:", err)
      );
    });
  }, [staff.staffId, token, eventHandlers]);

  useEffect(() => {
    initializeConnection().catch((err) => console.error("SignalR: Setup failed:", err));

    return () => {
      const connection = connectionRef.current;
      if (connection && connection.state !== HubConnectionState.Disconnected) {
        console.log("Cleaning up SignalR connection...");
        connection
          .stop()
          .then(() => console.log("SignalR connection stopped during cleanup."))
          .catch((err) => console.error("SignalR: Disconnect error during cleanup:", err));
      }
    };
  }, [initializeConnection]);

  useEffect(() => {
    const dates = Array.from({ length: 32 }, (_, i) =>
      moment().add(i, "days").format("YYYY-MM-DD")
    ).filter((date) => !moment(date).isAfter(moment().add(31, "days")));
    dates.forEach(fetchAvailableSlotCount);
  }, [fetchAvailableSlotCount]);

  useEffect(() => {
    initializeConnection().catch((err: unknown) => console.error("SignalR: Setup failed:", err));
    return () => {
      const connection = connectionRef.current;
      if (connection && connection.state !== HubConnectionState.Disconnected) {
        connection.stop().catch((err: unknown) => console.error("SignalR: Disconnect error:", err));
      }
    };
  }, [initializeConnection]);

  useEffect(() => {
    if (selectedDate && !schedulingInProgress) {
      fetchAvailableSlots(selectedDate);
    }
  }, [selectedDate, fetchAvailableSlots, schedulingInProgress]);

  const handleDateChange = (index: number) => {
    const date = moment().add(index, "days").format("YYYY-MM-DD");
    if (date !== selectedDate) {
      setSelectedDate(date);
      setSelectedTimeSlot(null);
      setAppointmentId(null);
      setLockedUntil(null);
      setIsConfirmed(false);
      setIsConfirming(false);
    }
  };

  useEffect(() => {
    console.log("User ID:", userId);
    const connection = connectionRef.current;
    if (connection?.state === HubConnectionState.Connected) {
      console.log("Subscribed to Staff_", staff.staffId);
      connection.invoke("SubscribeToStaffUpdates", staff.staffId);
    }
  }, [userId, staff.staffId]);

  const handleTimeSlotSelect = async (timeSlot: string) => {
    if (timeSlot === selectedTimeSlot) {
      if (appointmentId) {
        if (!token) {
          toast.error("Authentication token is missing. Cannot cancel the appointment.");
          return;
        }
        try {
          const cancelResponse = await cancelPresentLockedAppointment(token);
          if (cancelResponse.isSuccess) {
            setSelectedTimeSlot(null);
            setAppointmentId(null);
            setLockedUntil(null);
            setIsConfirmed(false);
            setIsConfirming(false);
            setAvailableSlots((prev) =>
              prev.map((s) =>
                s.timeSlot === timeSlot
                  ? { ...s, isAvailable: true, isLocked: false, lockedByCurrentUser: false }
                  : s
              )
            );
            toast.info("Your locked appointment was canceled.");
            broadcastChannelRef.current?.postMessage({
              type: "CANCEL_SLOT",
              canceledTimeSlot: timeSlot,
              selectedDate,
              staffId: staff.staffId,
              reason: "user-initiated",
            });
            console.log(`Canceled lock for time slot ${timeSlot}.`);
          } else {
            console.error("Failed to cancel previous locked appointment:", cancelResponse.message);
            toast.error(`Failed to cancel the appointment lock: ${cancelResponse.message || "Unknown error"}`);
            return;
          }
        } catch (error: any) {
          console.error("Failed to cancel lock:", error);
          toast.error("Failed to cancel the appointment lock.");
          return;
        }
      } else {
        setSelectedTimeSlot(null);
      }
      console.log(`Time slot ${timeSlot} unselected.`);
      return;
    }
  
    setSelectedTimeSlot(timeSlot);
    await handleScheduleAppointment(timeSlot);
  };


  // handleScheduleAppointment
  const handleScheduleAppointment = async (timeSlot: string) => {
    if (!selectedDate || !timeSlot || !token || !userId) {
      toast.error("Please select a date and time slot, or authentication/user info is missing.");
      return;
    }

    setLoading(true);
    setSchedulingInProgress(true);
    try {
      const [startTime] = timeSlot.split(" - ");
      const vietnamMoment = moment.tz(`${selectedDate} ${startTime}`, "YYYY-MM-DD HH:mm", "Asia/Ho_Chi_Minh");
      const appointmentDate = vietnamMoment.format("YYYY-MM-DDTHH:mm:ssZ");

      const request: AppointmentCreateRequestDTO = {
        userId,
        staffId: staff.staffId,
        appointmentDate,
        reason: "Health consultation",
        sendEmailToUser: true,
        sendNotificationToUser: true,
        sendEmailToStaff: true,
        sendNotificationToStaff: true,
        sessionId,
      };
      

      // Step 1: Validate the appointment request
    const validationResponse = await validateAppointmentRequest(request, token);
    if (!validationResponse.isSuccess) {
      if (validationResponse.code === 409 && validationResponse.message?.includes("You already have a locked appointment")) {
        // Locked conflict case
        const conflictData = validationResponse.data as AppointmentConflictResponseDTO;
        const existingAppointmentId = conflictData?.existingAppointmentId;

        if (existingAppointmentId) {
         
          const existingAppointmentResponse = await getAppointment(existingAppointmentId, token);
          const existingAppointment = existingAppointmentResponse.data as AppointmentResponseDTO;
          const canceledStartMoment = moment.tz(existingAppointment.appointmentDate, "Asia/Ho_Chi_Minh");
          const canceledEndMoment = moment.tz(existingAppointment.endTime || canceledStartMoment.clone().add(30, "minutes"), "Asia/Ho_Chi_Minh");
          const canceledTimeSlot = `${canceledStartMoment.format("HH:mm")} - ${canceledEndMoment.format("HH:mm")}`;
          const canceledDate = canceledStartMoment.format("YYYY-MM-DD");
          const existingStaffId = existingAppointment.staffId;


          const confirmCancel = window.confirm(validationResponse.message);
          
          
          if (confirmCancel) {
            // Check availability of the new time slot before canceling the existing lock
            
            const slotResponse = await getAvailableTimeSlots(staff.staffId, selectedDate, token);
            const availableSlots = slotResponse.data?.availableSlots || [];
            const isSlotAvailable = availableSlots.some(
              (slot: TimeSlotDTO) => slot.timeSlot === timeSlot && slot.isAvailable && !slot.isLocked
            );

            if (!isSlotAvailable) {
              toast.error(`The selected time slot ${timeSlot} is no longer available.`);
              setSelectedTimeSlot(null);
              await fetchAvailableSlots(selectedDate); // Refresh slots
              return;
            }
          const cancelResponse = await cancelPresentLockedAppointment(token);
          if (cancelResponse.isSuccess) {
            setSelectedTimeSlot(null);
            setAppointmentId(null);
            setLockedUntil(null);
            setIsConfirmed(false);  
            setIsConfirming(false);
            setAvailableSlots((prev) =>
              prev.map((s) =>
                s.timeSlot === timeSlot
                  ? { ...s, isAvailable: true, isLocked: false, lockedByCurrentUser: false }
                  : s
              )
            );
            broadcastChannelRef.current?.postMessage({
              type: "CANCEL_SLOT",
              canceledTimeSlot,
              canceledDate,
              staffId: existingStaffId,
            });
            console.log(`Canceled lock for time slot ${timeSlot}.`);
            console.log(`Canceled lock for existingStaffId ${existingStaffId}.`);
          }
            const scheduleRetry = await scheduleAppointment(request, token);
            if (scheduleRetry.isSuccess && scheduleRetry.data) {
              const retryData = scheduleRetry.data as AppointmentResponseDTO;
              setAppointmentId(retryData.id);
              setLockedUntil(moment(retryData.lockedUntil));
              setAvailableSlots((prev) =>
                prev.map((s) =>
                  s.timeSlot === timeSlot
                    ? { ...s, isAvailable: false, isLocked: true, lockedByCurrentUser: true }
                    : s
                )
              );
              broadcastChannelRef.current?.postMessage({
                type: "LOCK_SLOT",
                appointmentId: retryData.id,
                lockedUntil: retryData.lockedUntil,
                timeSlot,
                selectedDate,
                staffId: staff.staffId,
              });
              toast.info(`New appointment locked until ${moment(retryData.lockedUntil).format("HH:mm")}.`);
            } else {
              toast.error(`Retry failed: ${scheduleRetry.message || "Unknown error"}`);
              setSelectedTimeSlot(null);
            }
          } else {
            toast.info("Keeping the existing locked appointment.");
            setSelectedTimeSlot(null);
          }
        } else {
          toast.error(`Locked conflict detected, but no existing appointment ID provided: ${validationResponse.message}`);
          setSelectedTimeSlot(null);
        }
      } else if (validationResponse.code === 400 && validationResponse.message?.includes("You already have a scheduled appointment")) {
        // Scheduled conflict case
        toast.error(validationResponse.message);
        setSelectedTimeSlot(null);
      } else {
        // Other validation failures (e.g., daily limit, staff conflict)
        toast.error(`Validation failed: ${validationResponse.message || "Invalid request"}`);
        setSelectedTimeSlot(null);
      }
      return;
    }

      // Step 2: Check and cancel any previous locked appointment
    const cancelResponse = await cancelPreviousLockedAppointment({ sessionId }, token);
    if (cancelResponse.isSuccess) {
      if (cancelResponse.data) {
        // Previous lock was canceled successfully
        const canceledAppointment = cancelResponse.data as AppointmentResponseDTO;
        const canceledStartMoment = moment.tz(canceledAppointment.appointmentDate, "Asia/Ho_Chi_Minh");
        const canceledEndMoment = moment.tz(canceledAppointment.endTime || canceledStartMoment.clone().add(30, "minutes"), "Asia/Ho_Chi_Minh");
        const canceledTimeSlot = `${canceledStartMoment.format("HH:mm")} - ${canceledEndMoment.format("HH:mm")}`;
        const canceledDate = canceledStartMoment.format("YYYY-MM-DD");

        // Update local state to reflect the released slot
        setAvailableSlots((prev) =>
          prev.map((s) =>
            s.timeSlot === canceledTimeSlot && canceledDate === selectedDate
              ? { ...s, isAvailable: true, isLocked: false, lockedByCurrentUser: false }
              : s
          )
        );

        // Broadcast cancellation to other tabs
        broadcastChannelRef.current?.postMessage({
          type: "CANCEL_SLOT",
          canceledTimeSlot,
          selectedDate: canceledDate,
          staffId: staff.staffId,
        });
      } else {
        console.log("No previous locked appointment found to cancel.");
      }
    } else {
      toast.error(`Failed to release previous lock: ${cancelResponse.message || "Unknown error"}`);
      setSelectedTimeSlot(null);
      return;
    }
// Step 3: Schedule the new appointment
      const scheduleResponse = await scheduleAppointment(request, token);
      console.log("Schedule response:", scheduleResponse);

      if (scheduleResponse.isSuccess && scheduleResponse.data) {
        const appointmentData = scheduleResponse.data as AppointmentResponseDTO;
        setAppointmentId(appointmentData.id);
        setLockedUntil(moment(appointmentData.lockedUntil));
        setAvailableSlots((prev) =>
          prev.map((s) =>
            s.timeSlot === timeSlot
              ? { ...s, isAvailable: false, isLocked: true, lockedByCurrentUser: true }
              : s
          )
        );
        broadcastChannelRef.current?.postMessage({
          type: "LOCK_SLOT",
          appointmentId: appointmentData.id,
          lockedUntil: appointmentData.lockedUntil,
          timeSlot,
          selectedDate,
          staffId: staff.staffId,
        });
        toast.info(`Appointment locked until ${moment(appointmentData.lockedUntil).format("HH:mm")}.`);
      } else if (!scheduleResponse.isSuccess && scheduleResponse.code === 409) {
        console.log("Conflict detected, data:", scheduleResponse.data);
        if (
          scheduleResponse.message &&
          scheduleResponse.message.includes("You already have a locked appointment") &&
          (scheduleResponse.data as AppointmentConflictResponseDTO)?.existingAppointmentId
        ) {
          const conflictData = scheduleResponse.data as AppointmentConflictResponseDTO;
          const existingAppointmentId = conflictData.existingAppointmentId;
          let existingSlotRange: string;
          let existingDate: string;

          if (conflictData.appointmentDate && moment(conflictData.appointmentDate).isValid()) {
            const existingStartMoment = moment.tz(conflictData.appointmentDate, "Asia/Ho_Chi_Minh");
            const existingEndMoment = existingStartMoment.clone().add(30, "minutes");
            existingSlotRange = `${existingStartMoment.format("HH:mm")} - ${existingEndMoment.format("HH:mm")}`;
            existingDate = existingStartMoment.format("YYYY-MM-DD");
          } else {
            console.warn("appointmentDate missing or invalid, fetching appointment details...");
            const appointmentDetails = await getAppointment(existingAppointmentId, token);
            console.log("Appointment details:", appointmentDetails);
            if (appointmentDetails.isSuccess && appointmentDetails.data) {
              const existingStartMoment = moment.tz(appointmentDetails.data.appointmentDate, "Asia/Ho_Chi_Minh");
              const existingEndMoment = moment.tz(
                appointmentDetails.data.endTime || existingStartMoment.clone().add(30, "minutes"),
                "Asia/Ho_Chi_Minh"
              );
              existingSlotRange = `${existingStartMoment.format("HH:mm")} - ${existingEndMoment.format("HH:mm")}`;
              existingDate = existingStartMoment.format("YYYY-MM-DD");
            } else {
              existingSlotRange = timeSlot;
              existingDate = selectedDate!;
              toast.warn("Could not retrieve exact time slot for the existing appointment.");
            }
          }

          const confirmCancel = window.confirm(
            `You already have a locked appointment (ID: ${existingAppointmentId}) on ${existingDate} from ${existingSlotRange} from another tab. Each user can only hold one slot at a time. Do you want to cancel the previous slot and proceed with this one?`
          );

          if (confirmCancel) {
            const validationResponse = await validateAppointmentRequest(request, token);
            if (!validationResponse.isSuccess) {
              toast.error(`Validation failed on retry: ${validationResponse.message || "Invalid request"}`);
              setSelectedTimeSlot(null);
              return;
            }

          const cancelResponse = await cancelPresentLockedAppointment(token);
          if (cancelResponse.isSuccess) {
            setSelectedTimeSlot(null);
            setAppointmentId(null);
            setLockedUntil(null);
            setIsConfirmed(false);
            setIsConfirming(false);
            setAvailableSlots((prev) =>
              prev.map((s) =>
                s.timeSlot === timeSlot
                  ? { ...s, isAvailable: true, isLocked: false, lockedByCurrentUser: false }
                  : s
              )
            );
            broadcastChannelRef.current?.postMessage({
              type: "CANCEL_SLOT",
              canceledTimeSlot: timeSlot,
              selectedDate,
              staffId: staff.staffId,
            });
            console.log(`Canceled lock for time slot ${timeSlot}.`);
          }
            const scheduleRetry = await scheduleAppointment(request, token);
            if (scheduleRetry.isSuccess && scheduleRetry.data) {
              const retryData = scheduleRetry.data as AppointmentResponseDTO;
              setAppointmentId(retryData.id);
              setLockedUntil(moment(retryData.lockedUntil));
              setAvailableSlots((prev) =>
                prev.map((s) =>
                  s.timeSlot === timeSlot
                    ? { ...s, isAvailable: false, isLocked: true, lockedByCurrentUser: true }
                    : s
                )
              );
              broadcastChannelRef.current?.postMessage({
                type: "LOCK_SLOT",
                appointmentId: retryData.id,
                lockedUntil: retryData.lockedUntil,
                timeSlot,
                selectedDate,
                staffId: staff.staffId,
              });
              toast.info(`New appointment locked until ${moment(retryData.lockedUntil).format("HH:mm")}.`);
            } else {
              toast.error(`Retry failed: ${scheduleRetry.message || "Unknown error"}`);
              setSelectedTimeSlot(null);
            }
          } else {
            toast.info("Keeping existing appointment lock in other tab.");
            setSelectedTimeSlot(null);
            return;
          }
        } else {
          await fetchAvailableSlots(selectedDate!);
          toast.error(`Scheduling failed: ${scheduleResponse.message || "Slot conflict detected"}`);
          setSelectedTimeSlot(null);
        }
      } else {
        toast.error(`Scheduling failed: ${scheduleResponse.message || "Unknown error"}`);
        setSelectedTimeSlot(null);
      }
    } catch (error: any) {
      console.error("Error scheduling appointment:", error);
      toast.error("Failed to schedule appointment: " + (error.message || "Unknown error"));
      setSelectedTimeSlot(null);
    } finally {
      setLoading(false);
      setSchedulingInProgress(false);
    }
  };

  const [shouldRedirect, setShouldRedirect] = useState(false);

  const setupRealtimeConnections = useCallback(() => {
    const slotLockedConnection = setupScheduleAppointmentLockedRealtime(
      staff.staffId,
      (data) => {
        console.log("Slot locked:", data);
        if (!schedulingInProgress && selectedDate === data.date) {
          setAvailableSlots((prevSlots) =>
            prevSlots.map((slot) =>
              slot.timeSlot === data.timeSlot
                ? { ...slot, isAvailable: false, isLocked: true, lockedByCurrentUser: false, isConfirmed: false }
                : slot
            )
          );
        }
      },
      (error) => console.error("Slot locked connection error:", error)
    );
  
    const slotReleasedConnection = setupCancelAppointmentRealtime(
      staff.staffId,
      (data) => {
        console.log("Slot released:", data);
        if (!schedulingInProgress) {
          setAvailableSlots((prevSlots) => {
            const normalizedTimeSlot = data.timeSlot.trim();
            const updatedSlots = prevSlots.map((slot) =>
              slot.timeSlot === normalizedTimeSlot
                ? { ...slot, isAvailable: true, isLocked: false, lockedByCurrentUser: false, isConfirmed: false }
                : slot
            );
            console.log("Updated availableSlots after release:", updatedSlots);
            return updatedSlots;
          });
          if (selectedDate === data.date) {
            // setTimeout(() => fetchAvailableSlots(data.date), 3000);
          }
        }
      },
      (error) => console.error("Slot released connection error:", error)
    );
  
    const slotConfirmedConnection = setupConfirmAppointmentRealtime(
      staff.staffId,
      (data) => {
        console.log("Slot confirmed:", data);
        if (!schedulingInProgress && selectedDate === data.date) {
          setAvailableSlots((prevSlots) =>
            prevSlots.map((slot) =>
              slot.timeSlot === data.timeSlot
                ? { ...slot, isAvailable: false, isLocked: true, lockedByCurrentUser: false, isConfirmed: true }
                : slot
            )
          );
          toast.info(`Appointment confirmed for ${data.timeSlot} by another user.`);
        }
      },
      (error) => console.error("Slot confirmed connection error:", error)
    );
  
    const previousSlotReleasedConnection = setupCancelPreviousLockedAppointmentRealtime(
      staff.staffId,
      (data) => {
        console.log("Previous slot released:", data);
        if (!schedulingInProgress && selectedDate === data.date) {
          setAvailableSlots((prevSlots) => {
            const updatedSlots = prevSlots.map((slot) =>
              slot.timeSlot === data.timeSlot
                ? { ...slot, isAvailable: true, isLocked: false, lockedByCurrentUser: false, isConfirmed: false }
                : slot
            );
            console.log("Updated availableSlots after previous slot released:", updatedSlots);
            return updatedSlots;
          });
          
        }
      },
      (error) => console.error("Previous slot released connection error:", error)
    );


    // Add setupCancelPresentLockedAppointmentRealtime
  const presentSlotReleasedConnection = setupCancelPresentLockedAppointmentRealtime(
    staff.staffId,
    (data) => {
      console.log("Present slot released:", data);
      if (!schedulingInProgress && selectedDate === data.date) {
        setAvailableSlots((prevSlots) => {
          const updatedSlots = prevSlots.map((slot) =>
            slot.timeSlot === data.timeSlot
              ? { ...slot, isAvailable: true, isLocked: false, lockedByCurrentUser: false, isConfirmed: false }
              : slot
          );
          console.log("Updated availableSlots after present slot released:", updatedSlots);
          return updatedSlots;
        });
        // If the canceled slot was the user's selected one, clear the selection
        if (data.timeSlot === selectedTimeSlot && data.appointmentId === appointmentId) {
          setSelectedTimeSlot(null);
          setAppointmentId(null);
          setLockedUntil(null);
          // toast.info("Your locked appointment was canceled.");
        }
        // setTimeout(() => fetchAvailableSlots(data.date), 3000); // Refresh slots after a delay
      }
    },
    (error) => console.error("Present slot released connection error:", error)
  );
  
    return () => {
      slotLockedConnection.stop().then(() => console.log("Slot locked SignalR stopped"));
      slotReleasedConnection.stop().then(() => console.log("Slot released SignalR stopped"));
      slotConfirmedConnection.stop().then(() => console.log("Slot confirmed SignalR stopped"));
      previousSlotReleasedConnection.stop().then(() => console.log("Previous slot released SignalR stopped"));
    };
  // }, [staff.staffId, selectedDate, schedulingInProgress, fetchAvailableSlots]);
}, [staff.staffId, selectedDate, schedulingInProgress, fetchAvailableSlots]);

  useEffect(() => {
    const cleanup = setupRealtimeConnections();
    return cleanup;
  }, [setupRealtimeConnections]);

  const handleConfirmAppointment = async () => {
    if (!appointmentId || !lockedUntil || !token) {
      toast.error("No appointment to confirm or missing token.");
      return;
    }
    // if (moment().isAfter(lockedUntil)) {
    //   toast.error("Appointment lock has expired. Please try again.");
    //   // setLoading(true);
    //   // try {
    //   //   const cancelResponse = await cancelPresentLockedAppointment(token);
    //   //   if (cancelResponse.isSuccess) {
    //   //     setAvailableSlots((prev) =>
    //   //       prev.map((s) =>
    //   //         s.timeSlot === selectedTimeSlot
    //   //           ? { ...s, isAvailable: true, isLocked: false, lockedByCurrentUser: false }
    //   //           : s
    //   //       )
    //   //     );
    //   //     broadcastChannelRef.current?.postMessage({
    //   //       type: "CANCEL_SLOT",
    //   //       canceledTimeSlot: selectedTimeSlot,
    //   //       selectedDate,
    //   //       staffId: staff.staffId,
    //   //     });
    //   //     console.log(`Canceled expired lock for ${selectedTimeSlot}`);
    //   //   } else {
    //   //     toast.error(`Failed to cancel expired lock: ${cancelResponse.message || "Unknown error"}`);
    //   //   }
    //   // } catch (error: any) {
    //   //   console.error("Failed to cancel expired lock:", error);
    //   //   toast.error("Failed to cancel expired lock.");
    //   // } finally {
    //   //   setAppointmentId(null);
    //   //   setLockedUntil(null);
    //   //   setSelectedTimeSlot(null);
    //   //   setLoading(false);
    //   // }
    //   return;
    // }

    broadcastChannelRef.current?.postMessage({
      type: "START_CONFIRMATION",
      appointmentId,
      staffId: staff.staffId,
    });

    setLoading(true);
    setIsConfirming(true);
    try {
      const response = await confirmAppointment(appointmentId, token);
      if (response.isSuccess) {
        broadcastChannelRef.current?.postMessage({
          type: "CONFIRM_APPOINTMENT",
          appointmentId,
          staffId: staff.staffId,
        });

        setIsConfirmed(true);
        setAvailableSlots((prev) =>
          prev.map((s) =>
            s.timeSlot === selectedTimeSlot
              ? { ...s, isAvailable: false, isLocked: true, lockedByCurrentUser: false, isConfirmed: true }
              : s
          )
        );
        toast.success("Appointment confirmed successfully!");

        setSelectedTimeSlot(null);
        setAppointmentId(null);
        setLockedUntil(null);
        setIsConfirming(false);

        setShouldRedirect(true);
      } else {
        toast.error(`Failed to confirm: ${response.message || "Unknown error"}`);
        setAppointmentId(null);
        setLockedUntil(null);
        setSelectedTimeSlot(null);
      }
    } catch (error: any) {
      toast.error("Failed to confirm: " + (error.message || "Unknown error"));
      setAppointmentId(null);
      setLockedUntil(null);
      setSelectedTimeSlot(null);
    } finally {
      setLoading(false);
      setIsConfirming(false);
    }
  };

  useEffect(() => {
    if (shouldRedirect) {
      const timer = setTimeout(() => {
        window.location.href = "/appointment";
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [shouldRedirect]);

  const renderTimeSlotButton = (slot: TimeSlot, index: string) => {
    const { timeSlot, isAvailable, isLocked, lockedByCurrentUser, isConfirmed = false } = slot;
    const isSelected = selectedTimeSlot === timeSlot;
    const isHovered = hoveredIndex === index;
    const isDisabled = !isAvailable && !(lockedByCurrentUser && isSelected);
    const isLockedByCurrentUserInOtherTab = lockedByCurrentUser && appointmentId && timeSlot !== selectedTimeSlot;
  
    console.log(`Rendering ${timeSlot}: isAvailable=${isAvailable}, isLocked=${isLocked}, lockedByCurrentUser=${lockedByCurrentUser}, isConfirmed=${isConfirmed}`);
  
    let backgroundColor = "#ffffff";
    if (isLocked && !lockedByCurrentUser && !isConfirmed) {
      backgroundColor = "#FFA500"; // Taken
    } else if (isLocked && !lockedByCurrentUser && isConfirmed) {
      backgroundColor = "#d3d3d3"; // Confirmed
    } else if (lockedByCurrentUser) {
      backgroundColor = "#90ee90"; // Locked by user
    }else if (isDisabled) {
      backgroundColor = "#d3d3d3"; // Disabled
    }
    
  
    let textColor = "#000000";
    if (isLocked && !lockedByCurrentUser && !isConfirmed) {
      textColor = "#333333";
    } else if (isLocked && !lockedByCurrentUser && isConfirmed) {
      textColor = "#666666";
    } else if (lockedByCurrentUser) {
      textColor = "#155724";
    } else if (isDisabled) {
      textColor = "#666666";
    } else if (isHovered) {
      textColor = "#155724";
    }
  
    return (
      <Col key={timeSlot} xs={8} sm={6} md={4} lg={3}>
        <Button
          type={isSelected ? "primary" : "default"}
          disabled={loading || isDisabled}
          onClick={() => !isDisabled && handleTimeSlotSelect(timeSlot)}
          onMouseEnter={() => !isDisabled && setHoveredIndex(index)}
          onMouseLeave={() => setHoveredIndex(null)}
          style={{
            width: "100%",
            height: "40px",
            borderRadius: "20px",
            backgroundColor: isSelected
              ? "#1890ff"
              : isDisabled
              ? backgroundColor
              : isHovered
              ? "#d4edda"
              : backgroundColor,
            color: isSelected ? "#ffffff" : textColor,
            borderColor: isSelected ? "#1890ff" : isHovered ? "#c3e6cb" : "#d9d9d9",
            borderWidth: isSelected ? "2px" : "1px",
            borderStyle: "solid",
            cursor: isDisabled ? "not-allowed" : "pointer",
            transition: "all 0.3s ease",
            display: "flex",
            flexDirection: "column",
            justifyContent: "center",
            alignItems: "center",
            padding: "4px",
          }}
        >
          {loading && isSelected ? (
            <Spin size="small" />
          ) : isLockedByCurrentUserInOtherTab ? (
            <>
              <span>{timeSlot}</span>
              <span style={{ fontSize: "10px", lineHeight: "10px", color: "#155724" }}>(Locked by you)</span>
            </>
          ) : isLocked && !lockedByCurrentUser && isConfirmed ? (   // Confirmed
            <>
              <span>{timeSlot}</span>
              <div style={{ fontSize: "10px", lineHeight: "10px", color: "#666666" }}></div>      
            </>
          ) : isLocked && !lockedByCurrentUser ? (   // Taken
            <>
              <span>{timeSlot}</span>   
              <div style={{ fontSize: "10px", lineHeight: "10px", color: "#cc6600" }}></div>
            </>
          ) : (
            <span>{timeSlot}</span>
          )}
        </Button>
      </Col>
    );
  };

  if (!token) return null;

  return (
    <div style={{ padding: "24px", width: "100%" }}>
      <div className="flex flex-wrap w-full">
        <div className="w-full rounded-3xl bg-white p-6 shadow-xl lg:w-8/12">
          <Row gutter={[24, 24]} style={{ marginBottom: "32px", width: "100%", margin: 0 }}>
            <Col xs={24} sm={12} md={8} lg={6} xl={5}>
              <div
                style={{
                  background: "#fff",
                  boxShadow: "0 2px 8px rgba(0, 0, 0, 0.1)",
                  padding: "0",
                  borderRadius: "8px",
                  border: "1px solid #e8e8e8",
                  width: "100%",
                  height: "280px",
                  overflow: "hidden",
                }}
              >
                <img
                  src={staff.imageURL || "/default-doctor-image.png"}
                  alt={staff.fullName}
                  style={{ width: "100%", height: "100%", objectFit: "cover", borderRadius: "4px" }}
                  onError={(e) => (e.currentTarget.src = "/default-doctor-image.png")}
                />
              </div>
            </Col>
            <Col xs={24} sm={12} md={16} lg={18} xl={{ span: 19, flex: "1" }}>
              <div
                className="bg-gray-100 shadow-md p-4 rounded-lg border border-gray-200 w-full box-border"
                style={{ height: "280px", display: "flex", flexDirection: "column", justifyContent: "space-between" }}
              >
                <div>
                  <div className="flex items-center gap-2">
                    <h2 className="text-2xl md:text-3xl font-bold text-gray-900 m-0">{staff.fullName}</h2>
                    <img
                      src="/verified_icon.svg"
                      alt="Verified Badge"
                      className="w-6 h-6"
                      onError={(e) => (e.currentTarget.style.display = "none")}
                    />
                  </div>
                  <p className="text-gray-600 text-sm mt-2">University Healthcare Officer</p>
                  <p className="text-gray-700 text-sm mt-2">
                    <span className="font-semibold">Role:</span> {staff.fullName} provides health support services to
                    students and staff, specializing in wellness checks, health advice, and university-specific health
                    programs.
                  </p>
                  <hr className="border-t border-gray-300 my-2" />
                  <p className="text-gray-800 text-sm mb-1">
                    <span className="font-semibold">Email:</span> {staff.email}
                  </p>
                  <p className="text-gray-800 text-sm mb-1">
                    <span className="font-semibold">Phone:</span> {staff.phone}
                  </p>
                  <p className="text-gray-800 text-sm mb-1">
                    <span className="font-semibold">Gender:</span> {staff.gender || "N/A"}
                  </p>
                </div>
                <div>
                  <p className="text-gray-600 text-sm">Free for university members</p>
                </div>
              </div>
            </Col>
          </Row>

          <div>
            <Title level={3} style={{ display: "flex", alignItems: "center", gap: "8px" }}>
              <CalendarOutlined style={{ fontSize: "24px", color: "black" }} />
              <span style={{ color: "black", fontWeight: "bold" }}>Schedule Your Appointment</span>
            </Title>

            <Row gutter={[8, 8]} style={{ marginBottom: "16px", width: "100%" }}>
              {Array.from({ length: 32 }).map((_, index) => {
                const date = moment().add(index, "days");
                if (date.isAfter(moment().add(31, "days"))) return null;
                const dateStr = date.format("YYYY-MM-DD");
                const isSelected = selectedDate === dateStr;
                const slotCount = slotCounts[dateStr] || 0;
                const isFullyBooked = slotCount === 0;
                const isHovered = hoveredIndex === index.toString();

                return (
                  <Col key={index} xs={8} sm={6} md={4} lg={3}>
                    <Button
                      type={isSelected ? "primary" : "default"}
                      onClick={() => handleDateChange(index)}
                      onMouseEnter={() => setHoveredIndex(index.toString())}
                      onMouseLeave={() => setHoveredIndex(null)}
                      style={{
                        width: "100%",
                        height: "70px",
                        padding: "7px",
                        textAlign: "center",
                        whiteSpace: "normal",
                        borderRadius: "8px",
                        display: "flex",
                        flexDirection: "column",
                        justifyContent: "center",
                        alignItems: "center",
                        backgroundColor: isSelected ? "#c3e6cb" : isHovered ? "#d4edda" : undefined,
                        color: isSelected ? "#000" : undefined,
                        borderColor: isSelected ? "#1890ff" : isHovered ? "#c3e6cb" : "#d9d9d9",
                        borderWidth: isSelected ? "2px" : "1px",
                        borderStyle: "solid",
                        transition: "all 0.3s ease",
                      }}
                    >
                      <span style={{ fontSize: "12px", fontWeight: "bold" }}>{date.format("ddd, DD-MM")}</span>
                      {fetchingSlotCounts ? (
                        <Spin size="small" />
                      ) : !isFullyBooked ? (
                        <span style={{ color: "#28a745", fontSize: "12px" }}>{slotCount} slots</span>
                      ) : (
                        <span style={{ color: "red", fontSize: "12px" }}>Fully Booked</span>
                      )}
                    </Button>
                  </Col>
                );
              })}
            </Row>

            {selectedDate ? (
              <>
                <div style={{ display: "flex", alignItems: "center", marginBottom: "16px" }}>
                  <span style={{ marginRight: "8px" }}>🌞 Morning</span>
                  <div style={{ flex: 1, borderBottom: "2px solid #d9d9d9" }} />
                </div>
                <Row gutter={[8, 8]} style={{ marginBottom: "16px", width: "100%" }}>
                  {fetchingSlots ? (
                    <Col span={24}>
                      <Spin tip="Loading slots..." />
                    </Col>
                  ) : (
                    availableSlots
                      .filter((slot) => slot.timeSlot < "12:00")
                      .map((slot, index) => renderTimeSlotButton(slot, `morning-${index}`))
                  )}
                </Row>

                <div style={{ display: "flex", alignItems: "center", marginBottom: "16px" }}>
                  <span style={{ marginRight: "8px" }}>🌅 Afternoon</span>
                  <div style={{ flex: 1, borderBottom: "2px solid #d9d9d9" }} />
                </div>
                <Row gutter={[8, 8]} style={{ marginBottom: "16px", width: "100%" }}>
                  {fetchingSlots ? (
                    <Col span={24}>
                      <Spin tip="Loading slots..." />
                    </Col>
                  ) : (
                    availableSlots
                      .filter((slot) => slot.timeSlot >= "13:00")
                      .map((slot, index) => renderTimeSlotButton(slot, `afternoon-${index}`))
                  )}
                </Row>

                {appointmentId && lockedUntil && !isConfirmed && (
                  <div style={{ marginTop: "16px", textAlign: "center" }}>
                    <Text>
                      Appointment locked. Confirm within{" "}
                      {timeLeft !== null
                        ? `${Math.floor(timeLeft / 60)}:${(timeLeft % 60).toString().padStart(2, "0")}`
                        : "expired"}
                    </Text>
                    <br />
                    <Button
                      type="primary"
                      onClick={handleConfirmAppointment}
                      disabled={loading || isConfirming || timeLeft === null}
                      style={{ marginTop: "8px", borderRadius: "8px" }}
                    >
                      {loading || isConfirming ? <Spin /> : "Confirm Appointment"}
                    </Button>
                  </div>
                )}
              </>
            ) : (
              <Text style={{ display: "block", marginBottom: "16px" }}>
                Please select a date to view available time slots.
              </Text>
            )}
          </div>
        </div>

        <div className="mt-8 w-full lg:mt-0 lg:w-4/12 lg:pl-4">
          <div className="rounded-3xl bg-white px-6 pt-6 shadow-lg">
            <div className="flex pb-6 text-2xl font-bold text-gray-800">
              <p>Health Notifications</p>
            </div>
            <div>
              {[
                {
                  id: 1,
                  title: "Nurse Sarah",
                  date: "Dec, 12",
                  message: "New health screening schedule has been posted for this month. Please check and confirm. 🏥",
                  image:
                    "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?ixid=MXwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHw%3D&ixlib=rb-1.2.1&auto=format&fit=crop&w=2550&q=80",
                },
                {
                  id: 2,
                  title: "Canteen Manager",
                  date: "Dec, 12",
                  message: "Weekly food safety inspection completed. All standards met successfully.",
                  image:
                    "https://images.unsplash.com/photo-1600486913747-55e5470d6f40?ixid=MXwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHw%3D&ixlib=rb-1.2.1&auto=format&fit=crop&w=2550&q=80",
                },
                {
                  id: 3,
                  title: "Dr. Johnson",
                  date: "Dec, 12",
                  message: "Reminder: Vaccination campaign starts next week. Please prepare necessary arrangements.",
                  image:
                    "https://images.unsplash.com/photo-1543965170-4c01a586684e?ixid=MXwxMjA3fDB8MHxzZWFyY2h8NDZ8fG1hbnxlbnwwfDB8MHw%3D&ixlib=rb-1.2.1&auto=format&fit=crop&w=900&q=60",
                },
                {
                  id: 4,
                  title: "Nutritionist Lisa",
                  date: "Dec, 12",
                  message: "New healthy menu options added for next month. Student feedback has been positive.",
                  image:
                    "https://images.unsplash.com/photo-1533993192821-2cce3a8267d1?ixid=MXwxMjA3fDB8MHxzZWFyY2h8MTl8fHdvbWFuJTIwbW9kZXJufGVufDB8fDB8&ixlib=rb-1.2.1&auto=format&fit=crop&w=900&q=60",
                },
              ].map((notification) => (
                <div
                  key={notification.id}
                  className="flex w-full border-t border-gray-200 p-4 hover:bg-gray-100 2xl:items-start"
                >
                  <img
                    src={notification.image}
                    alt="profile image"
                    className="h-10 w-10 rounded-full object-cover"
                  />
                  <div className="w-full pl-4">
                    <div className="flex w-full items-center justify-between">
                      <div className="font-medium text-gray-800">{notification.title}</div>
                    </div>
                    <p className="my-2 text-sm text-gray-600">{notification.message}</p>
                    <p className="text-right text-sm text-gray-500">{notification.date}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export const getServerSideProps: GetServerSideProps = async (context) => {
  const { params, req } = context;
  const token = req.cookies.token || undefined;

  if (!token) {
    return {
      redirect: {
        destination: "/",
        permanent: false,
      },
    };
  }

  try {
    const staffId = params?.staffId as string;
    if (!staffId) throw new Error("Staff ID not provided");
    const response = await getHealthcareStaffById(staffId, token);
    const staff = response.data;

    if (!staff) return { notFound: true };

    return {
      props: {
        staff,
        token,
      },
    };
  } catch (error: any) {
    if (error.response?.status === 401) {
      return {
        redirect: {
          destination: "/",
          permanent: false,
        },
      };
    }
    return { notFound: true };
  }
};

export default ScheduleAppointment;