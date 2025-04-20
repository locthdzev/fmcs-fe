import React, { useState, useEffect, useCallback, useRef } from "react";
import { CalendarOutlined } from "@ant-design/icons";
import { GetServerSideProps } from "next";
import { debounce } from "lodash";
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
  AvailableOfficersResponseDTO,
  getHealthcareStaffById,
  TimeSlotDTO,
  AppointmentResponseDTO,
  AppointmentConflictResponseDTO,
  cancelPreviousLockedAppointment,
  cancelPresentLockedAppointment,
  cancelExpiredLockedAppointment,
} from "@/api/appointment-api-fix-signalr";
import { Button, Spin, Typography, Row, Col, Input } from "antd";
import {
  setupScheduleAppointmentLockedRealtime,
  setupCancelAppointmentRealtime,
  setupConfirmAppointmentRealtime,
  setupCancelPreviousLockedAppointmentRealtime,
  setupCancelPresentLockedAppointmentRealtime,
  setupCancelExpiredLockedAppointmentRealtime,
} from "@/api/appointment-signalr";
import { toast } from "react-toastify";
import moment from "moment-timezone";
import Cookies from "js-cookie";
import ConflictModal from "@/components/appointment/ConflictModal";
import SignalRManager from "@/api/signalr-manager";

const { Title, Text } = Typography;
const { TextArea } = Input;

const allTimeSlots = [
  "08:00 - 08:30",
  "08:30 - 09:00",
  "09:00 - 09:30",
  "09:30 - 10:00",
  "10:00 - 10:30",
  "10:30 - 11:00",
  "11:00 - 11:30",
  "11:30 - 12:00",
  "13:30 - 14:00",
  "14:00 - 14:30",
  "14:30 - 15:00",
  "15:00 - 15:30",
  "15:30 - 16:00",
  "16:00 - 16:30",
  "16:30 - 17:00",
  "17:00 - 17:30",
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

interface JwtPayload {
  userid?: string;
  sub?: string;
  id?: string;
  [key: string]: any;
}

const ScheduleAppointment: React.FC<ScheduleAppointmentProps> = ({
  staff,
  token,
}) => {
  const [schedulingInProgress, setSchedulingInProgress] = useState(false);
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [selectedTimeSlot, setSelectedTimeSlot] = useState<string | null>(null);
  const [availableSlots, setAvailableSlots] = useState<TimeSlot[]>([]);
  const [slotCounts, setSlotCounts] = useState<{
    [key: string]: number | null;
  }>({});
  const [loading, setLoading] = useState(false);
  const [fetchingSlots, setFetchingSlots] = useState(false);
  const [fetchingSlotCounts, setFetchingSlotCounts] = useState(false);
  const [appointmentId, setAppointmentId] = useState<string | null>(null);
  const [lockedUntil, setLockedUntil] = useState<moment.Moment | null>(null);
  const [hoveredIndex, setHoveredIndex] = useState<string | null>(null);
  const [sessionId] = useState<string>(uuidv4());
  const [userId, setUserId] = useState<string | null>(null);
  const [isConfirming, setIsConfirming] = useState(false);
  const [isConfirmed, setIsConfirmed] = useState(false);
  const [appointmentReason, setAppointmentReason] = useState<string>("");
  const [shouldRedirect, setShouldRedirect] = useState(false);
  const broadcastChannelRef = useRef<BroadcastChannel | null>(null);

  const [isConflictModalVisible, setIsConflictModalVisible] = useState(false);
  const [conflictAppointment, setConflictAppointment] =
    useState<AppointmentResponseDTO | null>(null);
  const [conflictLoading, setConflictLoading] = useState(false);
  const [intendedTimeSlot, setIntendedTimeSlot] = useState<string | null>(null);

  // Define refs at the top level
  const selectedDateRef = useRef(selectedDate);
  const schedulingInProgressRef = useRef(schedulingInProgress);
  const selectedTimeSlotRef = useRef(selectedTimeSlot);
  const appointmentIdRef = useRef(appointmentId);
  // Fetch available slots
  const fetchAvailableSlots = useCallback(
    debounce(async (date: string) => {
      if (!token || !userId || schedulingInProgress) return;
      setFetchingSlots(true);
      try {
        const response = await getAvailableTimeSlots(
          staff.staffId,
          date,
          token
        );
        const slotData = response.data?.availableSlots || [];
        updateSlotsFromResponse(slotData);

        const userLockedSlot = slotData.find(
          (slot) => slot.lockedByCurrentUser
        );
        if (userLockedSlot) {
          setSelectedTimeSlot(userLockedSlot.timeSlot);
          setAppointmentId(response.data?.lockedAppointmentId || null);
          setLockedUntil(
            response.data?.lockedUntil
              ? moment(response.data.lockedUntil)
              : null
          );
          setIsConfirmed(false);
          setIsConfirming(false);
        } else if (
          selectedTimeSlot &&
          !slotData.some(
            (s) =>
              s.timeSlot === selectedTimeSlot &&
              (s.isAvailable || s.lockedByCurrentUser)
          )
        ) {
          resetSelectionState();
        }
      } catch (error) {
        console.error("Failed to fetch slots:", error);
        toast.error("Failed to load available time slots");
      } finally {
        setFetchingSlots(false);
      }
    }, 50),
    [staff.staffId, token, userId, schedulingInProgress, selectedTimeSlot]
  );

  // Fetch slot counts
  const fetchAvailableSlotCount = useCallback(
    async (date: string) => {
      if (!token) return;
      setFetchingSlotCounts(true);
      try {
        const response = await getAvailableSlotCount(
          staff.staffId,
          date,
          token
        );
        setSlotCounts((prev) => ({ ...prev, [date]: response.data }));
      } catch (error) {
        console.error("Slot count fetch error:", error);
      } finally {
        setFetchingSlotCounts(false);
      }
    },
    [staff.staffId, token]
  );

  // Slot management helpers
  const updateSlotsFromResponse = (slotData: TimeSlotDTO[]) => {
    const newSlots = allTimeSlots.map((timeSlot) => {
      const slotFromApi = slotData.find((s) => s.timeSlot === timeSlot);
      return (
        slotFromApi || {
          timeSlot,
          isAvailable: false,
          isLocked: false,
          lockedByCurrentUser: false,
          isConfirmed: false,
        }
      );
    });
    setAvailableSlots(newSlots);
  };

  // Memoize functions to prevent re-renders
  const updateSlotState = useCallback(
    (timeSlot: string, updates: Partial<TimeSlot>) => {
      setAvailableSlots((prev) => {
        const currentSlots =
          Array.isArray(prev) && prev.length > 0
            ? prev
            : allTimeSlots.map((ts) => ({
                timeSlot: ts,
                isAvailable: true,
                isLocked: false,
                lockedByCurrentUser: false,
              }));
        const newSlots = currentSlots.map((slot) =>
          slot.timeSlot === timeSlot ? { ...slot, ...updates } : slot
        );
        console.log(`Updated Slots for ${timeSlot}:`, newSlots);
        return newSlots;
      });
    },
    []
  );

  const resetSelectionState = () => {
    setSelectedTimeSlot(null);
    setAppointmentId(null);
    setLockedUntil(null);
    setIsConfirmed(false);
    setIsConfirming(false);
  };

  // Token decoding
  useEffect(() => {
    if (!token) {
      toast.error("Authentication token is missing");
      return;
    }
    try {
      const decodedToken = jwtDecode<JwtPayload>(token);
      const extractedUserId =
        decodedToken.userid || decodedToken.sub || decodedToken.id;
      if (!extractedUserId) throw new Error("No user ID found in token");
      setUserId(extractedUserId);
    } catch (error) {
      console.error("Token decoding failed:", error);
      toast.error("Failed to authenticate: Invalid token");
      setUserId(null);
    }
  }, [token]);

  // Update refs when state changes
  useEffect(() => {
    selectedDateRef.current = selectedDate;
    schedulingInProgressRef.current = schedulingInProgress;
    selectedTimeSlotRef.current = selectedTimeSlot;
    appointmentIdRef.current = appointmentId;
    console.log("Refs updated:", {
      selectedDate: selectedDateRef.current,
      schedulingInProgress: schedulingInProgressRef.current,
      selectedTimeSlot: selectedTimeSlotRef.current,
      appointmentId: appointmentIdRef.current,
    });
  }, [selectedDate, schedulingInProgress, selectedTimeSlot, appointmentId]);

  // BroadcastChannel setup
  useEffect(() => {
    if (!userId || typeof window === "undefined") return;

    const channelName = `appointment_channel_${userId}`;
    broadcastChannelRef.current = new BroadcastChannel(channelName);
    console.log(`BroadcastChannel initialized for ${channelName}`);

    broadcastChannelRef.current.onmessage = (event) => {
      const {
        type,
        appointmentId: broadcastedId,
        lockedUntil,
        timeSlot,
        selectedDate: broadcastedDate,
        staffId,
        canceledTimeSlot,
        reason,
      } = event.data;
      console.log(
        `BroadcastChannel message received - User: ${userId}`,
        event.data
      );

      if (
        type === "LOCK_SLOT" &&
        broadcastedDate === selectedDateRef.current &&
        staffId === staff.staffId
      ) {
        updateSlotState(timeSlot, {
          isAvailable: false,
          isLocked: true,
          lockedByCurrentUser: true,
        });
        setAppointmentId(broadcastedId);
        setLockedUntil(lockedUntil ? moment(lockedUntil) : null);
        setSelectedTimeSlot(timeSlot);
        setIsConfirmed(false);
        setIsConfirming(false);
        // toast.info(`Slot ${timeSlot} locked in another tab`);
      } else if (
        type === "SLOT_LOCKED_BY_OTHER" &&
        broadcastedDate === selectedDateRef.current &&
        staffId === staff.staffId
      ) {
        updateSlotState(timeSlot, {
          isAvailable: false,
          isLocked: true,
          lockedByCurrentUser: false,
        });
        // toast.info(`Slot ${timeSlot} is now taken`);
      } else if (
        type === "CANCEL_SLOT" &&
        broadcastedDate === selectedDateRef.current
      ) {
        updateSlotState(canceledTimeSlot, {
          isAvailable: true,
          isLocked: false,
          lockedByCurrentUser: false,
        });
        if (canceledTimeSlot === selectedTimeSlotRef.current) {
          resetSelectionState();
          if (reason === "user-initiated") {
            // toast.info(`Your locked appointment (${canceledTimeSlot}) was canceled from another tab`);
          } else if (reason === "expiration") {
            // toast.info(`Your locked appointment (${canceledTimeSlot}) has expired`);
          }
        }
      } else if (
        type === "CONFIRM_APPOINTMENT" &&
        broadcastedId === appointmentIdRef.current &&
        staffId === staff.staffId
      ) {
        updateSlotState(timeSlot, {
          isAvailable: false,
          isLocked: true,
          lockedByCurrentUser: false,
          isConfirmed: true,
        });
        resetSelectionState();
        setIsConfirmed(true);
        setLoading(false);
        setIsConfirming(false);
        toast.success("Appointment confirmed in another tab!");
      } else if (
        type === "CONFIRM_START" &&
        broadcastedId === appointmentIdRef.current &&
        staffId === staff.staffId
      ) {
        setLoading(true);
        setIsConfirming(true);
        toast.info("Confirmation started in another tab");
      } else if (
        type === "CONFIRM_END" &&
        broadcastedId === appointmentIdRef.current &&
        staffId === staff.staffId
      ) {
        setLoading(false);
        setIsConfirming(false);
      }
    };

    return () => {
      console.log(`Closing BroadcastChannel for ${channelName}`);
      broadcastChannelRef.current?.close();
    };
  }, [userId, staff.staffId]);

  // SignalR Connection Setup
  useEffect(() => {
    if (!token || !userId) return;

    console.log(
      `SignalR setup initiated with User: ${userId}, Staff: ${
        staff.staffId
      }, Token: ${token.substring(0, 10)}...`
    );
    const signalRManager = SignalRManager.getInstance();
    const group = `Staff_${staff.staffId}`;

    let unsubscribeGroup: () => Promise<void> = async () => {};
    signalRManager
      .subscribeToGroup(group)
      .then((cleanup) => {
        unsubscribeGroup = cleanup;
      })
      .catch((err) => console.error("Failed to subscribe to group:", err));

    const cleanupScheduleLocked = signalRManager.on(
      "ReceiveSlotLocked",
      (data) => {
        console.log(`SignalR ScheduleLocked Received - User: ${userId}`, data);
        if (
          selectedDateRef.current === data.date &&
          !schedulingInProgressRef.current
        ) {
          updateSlotState(data.timeSlot, {
            isAvailable: false,
            isLocked: true,
            lockedByCurrentUser: false,
          });
          broadcastChannelRef.current?.postMessage({
            type: "SLOT_LOCKED_BY_OTHER",
            timeSlot: data.timeSlot,
            selectedDate: data.date,
            staffId: staff.staffId,
          });
          console.log(
            `Broadcast sent for SLOT_LOCKED_BY_OTHER: ${data.timeSlot}`
          );
        }
      }
    );

    const cleanupCancelExpiredLocked = signalRManager.on(
      "CancelExpiredLockedAppointment",
      (data) => {
        console.log(
          `SignalR CancelExpiredLocked Received - User: ${userId}`,
          data
        );
        // Always update slot state if date matches, regardless of current selection
        if (selectedDateRef.current === data.date) {
          updateSlotState(data.timeSlot, {
            isAvailable: true,
            isLocked: false,
            lockedByCurrentUser: false,
          });
          broadcastChannelRef.current?.postMessage({
            type: "CANCEL_SLOT",
            canceledTimeSlot: data.timeSlot,
            selectedDate: data.date,
            staffId: staff.staffId,
            reason: "expiration",
          });
          console.log(
            `Broadcast Sent (Expired) - User: ${userId}, Slot: ${data.timeSlot}, Date: ${data.date}`
          );
          // Only reset selection if this user owns the slot
          if (
            data.timeSlot === selectedTimeSlotRef.current &&
            data.appointmentId === appointmentIdRef.current
          ) {
            resetSelectionState();
            if (!hasHandledExpirationRef.current) {
              // toast.error("Your locked appointment has expired");
            }
          }
          // fetchAvailableSlots(data.date);
        } else {
          // Update slot availability even if date doesn't match current selection
          updateSlotState(data.timeSlot, {
            isAvailable: true,
            isLocked: false,
            lockedByCurrentUser: false,
          });
          console.log(
            `Slot ${data.timeSlot} released for date ${data.date}, no fetch triggered (date mismatch)`
          );
        }
      }
    );

    //   // New listener for ReceiveSlotReleased
    // const cleanupCancelPresentLocked = signalRManager.on("ReceiveSlotReleased", (data) => {
    //   console.log(`SignalR ReceiveSlotReleased Received - User: ${userId}`, data);
    //   const { Date: date, TimeSlot: timeSlot, AppointmentId: appointmentId, UserId: signalRUserId } = data;

    //   if (selectedDateRef.current === date) {
    //     updateSlotState(timeSlot, { isAvailable: true, isLocked: false, lockedByCurrentUser: false });
    //     broadcastChannelRef.current?.postMessage({
    //       type: "CANCEL_SLOT",
    //       canceledTimeSlot: timeSlot,
    //       selectedDate: date,
    //       staffId: staff.staffId,
    //       reason: "user-initiated",
    //     });
    //     console.log(`Broadcast Sent (User-Initiated) - User: ${userId}, Slot: ${timeSlot}, Date: ${date}`);

    //     // Reset selection if this was the current user's slot
    //     if (timeSlot === selectedTimeSlotRef.current && appointmentId === appointmentIdRef.current) {
    //       resetSelectionState();
    //       toast.info("Your previous appointment lock was canceled");
    //     } else if (signalRUserId !== userId) {
    //       toast.info(`Slot ${timeSlot} is now available`);
    //     }
    //   }
    // });

    const cleanupConfirmAppointment = signalRManager.on(
      "ReceiveAppointmentConfirmed",
      (data) => {
        console.log("SignalR: Received ReceiveAppointmentConfirmed", { data });
        if (selectedDateRef.current === data.date) {
          console.log("SignalR: Updating slot to confirmed state", {
            timeSlot: data.timeSlot,
            appointmentId: data.appointmentId,
          });
          updateSlotState(data.timeSlot, {
            isAvailable: false,
            isLocked: true,
            lockedByCurrentUser: false,
            isConfirmed: true,
          });
          if (data.timeSlot === selectedTimeSlotRef.current) {
            resetSelectionState();
            setIsConfirmed(true);
          }
          // toast.success("Appointment confirmed via real-time update!");
        }
      }
    );

    const cleanupStateChange = signalRManager.onStateChange((state) => {
      console.log(`SignalR Connection State: ${state}`);
    });

    return () => {
      console.log(
        `Cleaning up SignalR for User: ${userId}, Staff: ${staff.staffId}`
      );
      cleanupScheduleLocked();
      cleanupCancelExpiredLocked();
      // cleanupStateChange();
      unsubscribeGroup();
    };
  }, [staff.staffId, token, userId]);
  // [staff.staffId, token, userId, selectedDate, schedulingInProgress, selectedTimeSlot, appointmentId]);

  // Initial data fetching
  useEffect(() => {
    const dates = [];
    let daysAdded = 0;
    let currentDay = moment();

    while (daysAdded < 32) {
      if (currentDay.day() !== 0) {
        // Exclude Sundays
        dates.push(currentDay.clone());
        daysAdded++;
      }
      currentDay.add(1, "day");
    }

    dates.forEach((date) => fetchAvailableSlotCount(date.format("YYYY-MM-DD")));
  }, [fetchAvailableSlotCount]);

  // Fetch slots for selected date
  useEffect(() => {
    if (selectedDate && !schedulingInProgress) {
      fetchAvailableSlots(selectedDate);
    }
  }, [selectedDate, fetchAvailableSlots, schedulingInProgress]);

  // Countdown timer
  const hasHandledExpirationRef = useRef(false);

  // Fix useCountdown
  const useCountdown = (
    lockedUntil: moment.Moment | null,
    appointmentId: string | null,
    selectedTimeSlot: string | null
  ) => {
    const [timeLeft, setTimeLeft] = useState<number | null>(null);

    useEffect(() => {
      if (
        !lockedUntil ||
        !appointmentId ||
        !selectedTimeSlot ||
        isConfirmed ||
        isConfirming
      ) {
        setTimeLeft(null);
        return;
      }

      hasHandledExpirationRef.current = false;
      const diff = moment(lockedUntil).diff(moment());
      if (diff <= 0) {
        setTimeLeft(null);
        handleLockExpiration();
        return;
      }

      setTimeLeft(Math.ceil(diff / 1000));
      const interval = setInterval(() => {
        const diff = moment(lockedUntil).diff(moment());
        console.log("Countdown tick", {
          diff,
          timeLeft,
          hasHandledExpiration: hasHandledExpirationRef.current,
        });
        if (diff <= 0 && !hasHandledExpirationRef.current) {
          console.log("Triggering expiration");
          setTimeLeft(null);
          handleLockExpiration();
        } else if (diff > 0) {
          setTimeLeft(Math.ceil(diff / 1000));
        }
      }, 1000);

      return () => clearInterval(interval);
    }, [
      lockedUntil,
      appointmentId,
      selectedTimeSlot,
      isConfirmed,
      isConfirming,
    ]);

    return timeLeft;
  };

  const timeLeft = useCountdown(lockedUntil, appointmentId, selectedTimeSlot);

  const handleLockExpiration = useCallback(
    debounce(
      async () => {
        console.log("handleLockExpiration called", {
          token,
          selectedTimeSlot,
          selectedDate,
          appointmentId,
          hasHandledExpiration: hasHandledExpirationRef.current,
        });
        if (
          !token ||
          !selectedTimeSlot ||
          !selectedDate ||
          !appointmentId ||
          hasHandledExpirationRef.current
        )
          return;

        setLoading(true);
        try {
          const response = await cancelExpiredLockedAppointment(
            appointmentId,
            token
          );
          if (response.isSuccess) {
            updateSlotState(selectedTimeSlot, {
              isAvailable: true,
              isLocked: false,
              lockedByCurrentUser: false,
            });
            broadcastChannelRef.current?.postMessage({
              type: "CANCEL_SLOT",
              canceledTimeSlot: selectedTimeSlot,
              selectedDate,
              staffId: staff.staffId,
              reason: "expiration",
            });
            resetSelectionState();
            // toast.error("Appointment lock expired");
            // await fetchAvailableSlots(selectedDate);
            hasHandledExpirationRef.current = true; // Set after successful cancellation
          } else {
            console.error("Failed to cancel expired lock:", response.message);
            toast.error(
              `Failed to release expired slot: ${
                response.message || "Unknown error"
              }`
            );
          }
        } catch (error) {
          console.error("Lock expiration error:", error);
          toast.error("Failed to free expired slot");
        } finally {
          setLoading(false);
        }
      },
      1000,
      { leading: true, trailing: false }
    ),
    [
      token,
      selectedTimeSlot,
      selectedDate,
      appointmentId,
      staff.staffId,
      fetchAvailableSlots,
    ]
  );

  const handleDateChange = (index: number) => {
    const dates = [];
    let daysAdded = 0;
    let currentDay = moment();

    while (daysAdded < 32) {
      if (currentDay.day() !== 0) {
        dates.push(currentDay.clone());
        daysAdded++;
      }
      currentDay.add(1, "day");
    }

    const date = dates[index].format("YYYY-MM-DD");
    if (date === selectedDate) {
      fetchAvailableSlots(date);
    } else {
      setSelectedDate(date);
      resetSelectionState();
    }
  };

  const handleTimeSlotSelect = async (timeSlot: string) => {
    if (!token || !userId) return;

    if (timeSlot === selectedTimeSlot && appointmentId) {
      await cancelCurrentLock(timeSlot);
      return;
    }

    setIntendedTimeSlot(timeSlot); // Set the intended time slot
    setSelectedTimeSlot(timeSlot); // Still set selectedTimeSlot for local UI
    await handleScheduleAppointment(timeSlot);
  };

  const cancelCurrentLock = async (timeSlot: string) => {
    if (!appointmentId) {
      console.error("No appointment ID available to cancel");
      toast.error("Cannot cancel lock: No appointment selected");
      return;
    }

    try {
      const response = await cancelExpiredLockedAppointment(
        appointmentId,
        token!
      );
      if (response.isSuccess) {
        resetSelectionState();
        updateSlotState(timeSlot, {
          isAvailable: true,
          isLocked: false,
          lockedByCurrentUser: false,
        });
        broadcastChannelRef.current?.postMessage({
          type: "CANCEL_SLOT",
          canceledTimeSlot: timeSlot,
          selectedDate,
          staffId: staff.staffId,
          reason: "user-initiated",
        });
        // toast.info("Appointment lock canceled");
      }
    } catch (error) {
      console.error("Cancel lock failed:", error);
      toast.error("Failed to cancel appointment lock");
    }
  };

  const handleScheduleAppointment = async (timeSlot: string) => {
    if (!selectedDate || !token || !userId) {
      toast.error("Missing required information for scheduling");
      return;
    }

    setLoading(true);
    setSchedulingInProgress(true);
    setSelectedTimeSlot(timeSlot);
    setIsConfirmed(false); // Reset confirmation state
    setIsConfirming(false); // Reset confirming state
    try {
      const appointmentDate = moment
        .tz(
          `${selectedDate} ${timeSlot.split(" - ")[0]}`,
          "YYYY-MM-DD HH:mm",
          "Asia/Ho_Chi_Minh"
        )
        .format("YYYY-MM-DDTHH:mm:ssZ");

      const request: AppointmentCreateRequestDTO = {
        userId,
        staffId: staff.staffId,
        appointmentDate,
        reason: appointmentReason,
        sendEmailToUser: true,
        sendNotificationToUser: true,
        sendEmailToStaff: true,
        sendNotificationToStaff: true,
        sessionId,
      };

      const validationResponse = await validateAppointmentRequest(
        request,
        token
      );
      if (!validationResponse.isSuccess) {
        if (
          validationResponse.code === 409 &&
          validationResponse.message?.includes(
            "You already have a locked appointment"
          )
        ) {
          const conflictData =
            validationResponse.data as AppointmentConflictResponseDTO;
          const existingAppointmentId = conflictData?.existingAppointmentId;

          if (existingAppointmentId) {
            const existingAppointmentResponse = await getAppointment(
              existingAppointmentId,
              token
            );
            const existingAppointment =
              existingAppointmentResponse.data as AppointmentResponseDTO;

            let currentStaffName =
              existingAppointment.staffName || "Unknown Staff";
            if (!existingAppointment.staffName && existingAppointment.staffId) {
              const staffResponse = await getHealthcareStaffById(
                existingAppointment.staffId,
                token
              );
              currentStaffName =
                staffResponse.data?.fullName || "Unknown Staff";
            }

            setConflictAppointment(existingAppointment);
            setIsConflictModalVisible(true);
            return;
          }
        }
        toast.error(
          `Validation failed: ${
            validationResponse.message || "Invalid request"
          }`
        );
        setSelectedTimeSlot(null);
        setIntendedTimeSlot(null);
        return;
      }

      const cancelResponse = await cancelPreviousLockedAppointment(
        { sessionId },
        token
      );
      if (!cancelResponse.isSuccess) {
        toast.error(
          `Failed to release previous lock: ${
            cancelResponse.message || "Unknown error"
          }`
        );
        setSelectedTimeSlot(null);
        return;
      }

      const scheduleResponse = await scheduleAppointment(request, token);
      if (scheduleResponse.isSuccess && scheduleResponse.data) {
        const appointmentData = scheduleResponse.data as AppointmentResponseDTO;
        setAppointmentId(appointmentData.id);
        setLockedUntil(moment(appointmentData.lockedUntil));
        updateSlotState(timeSlot, {
          isAvailable: false,
          isLocked: true,
          lockedByCurrentUser: true,
        });
        setSelectedTimeSlot(timeSlot); // Ensure this is set
        broadcastChannelRef.current?.postMessage({
          type: "LOCK_SLOT",
          appointmentId: appointmentData.id,
          lockedUntil: appointmentData.lockedUntil,
          timeSlot,
          selectedDate,
          staffId: staff.staffId,
        });
        // toast.info(`Appointment locked until ${moment(appointmentData.lockedUntil).format("HH:mm")}`);
        setIntendedTimeSlot(null);
      } else if (
        scheduleResponse.code === 409 &&
        scheduleResponse.message?.includes(
          "You already have a locked appointment"
        )
      ) {
        const conflictData =
          scheduleResponse.data as AppointmentConflictResponseDTO;
        const existingAppointmentId = conflictData?.existingAppointmentId;

        if (existingAppointmentId) {
          const existingAppointmentResponse = await getAppointment(
            existingAppointmentId,
            token
          );
          const existingAppointment =
            existingAppointmentResponse.data as AppointmentResponseDTO;

          // Show ConflictModal instead of window.confirm
          setConflictAppointment(existingAppointment);
          setIsConflictModalVisible(true);

          // Wait for modal interaction (handled in Step 3)
          return; // Exit here; modal handlers will continue the flow
        } else {
          toast.error("Scheduling conflict detected");
          setSelectedTimeSlot(null);
        }
      } else {
        toast.error(
          `Scheduling failed: ${scheduleResponse.message || "Unknown error"}`
        );
        setSelectedTimeSlot(null);
      }
    } catch (error) {
      console.error("Scheduling error:", error);
      toast.error("Failed to schedule appointment");
      setSelectedTimeSlot(null);
    } finally {
      setLoading(false);
      setSchedulingInProgress(false);
    }
  };

  // handleConflictConfirm
  const handleConflictConfirm = async () => {
    if (!token || !selectedDate || !intendedTimeSlot || !conflictAppointment)
      return;
    if (!selectedDate || !token || !userId) {
      toast.error("Missing required information for scheduling");
      return;
    }

    setConflictLoading(true);
    try {
      // Cancel the existing locked appointment
      console.log("Attempting to cancel present locked appointment", {
        appointmentId: conflictAppointment.id,
      });
      const cancelResponse = await cancelExpiredLockedAppointment(
        conflictAppointment.id,
        token
      );
      console.log("Cancel response received", {
        isSuccess: cancelResponse.isSuccess,
        message: cancelResponse.message,
      });
      if (cancelResponse.isSuccess) {
        const canceledStartMoment = moment.tz(
          conflictAppointment.appointmentDate,
          "Asia/Ho_Chi_Minh"
        );
        const canceledEndMoment = moment.tz(
          conflictAppointment.endTime ||
            canceledStartMoment.clone().add(30, "minutes"),
          "Asia/Ho_Chi_Minh"
        );
        const canceledTimeSlot = `${canceledStartMoment.format(
          "HH:mm"
        )} - ${canceledEndMoment.format("HH:mm")}`;
        const canceledDate = canceledStartMoment.format("YYYY-MM-DD");

        // Update local state to release the old slot
        updateSlotState(canceledTimeSlot, {
          isAvailable: true,
          isLocked: false,
          lockedByCurrentUser: false,
        });

        // Broadcast the cancellation to other tabs and users
        console.log("Broadcasting cancellation", {
          type: "CANCEL_SLOT",
          canceledTimeSlot,
          canceledDate,
          staffId: conflictAppointment.staffId,
        });
        broadcastChannelRef.current?.postMessage({
          type: "CANCEL_SLOT",
          canceledTimeSlot,
          selectedDate: canceledDate,
          staffId: conflictAppointment.staffId,
          reason: "user-initiated",
        });

        // Schedule the new appointment
        const appointmentDate = moment
          .tz(
            `${selectedDate} ${intendedTimeSlot.split(" - ")[0]}`,
            "YYYY-MM-DD HH:mm",
            "Asia/Ho_Chi_Minh"
          )
          .format("YYYY-MM-DDTHH:mm:ssZ");

        const request: AppointmentCreateRequestDTO = {
          userId,
          staffId: staff.staffId,
          appointmentDate,
          reason: appointmentReason,
          sendEmailToUser: true,
          sendNotificationToUser: true,
          sendEmailToStaff: true,
          sendNotificationToStaff: true,
          sessionId,
        };

        const scheduleRetry = await scheduleAppointment(request, token);
        if (scheduleRetry.isSuccess && scheduleRetry.data) {
          const retryData = scheduleRetry.data as AppointmentResponseDTO;
          setAppointmentId(retryData.id);
          setLockedUntil(moment(retryData.lockedUntil));
          updateSlotState(intendedTimeSlot, {
            isAvailable: false,
            isLocked: true,
            lockedByCurrentUser: true,
          });
          broadcastChannelRef.current?.postMessage({
            type: "LOCK_SLOT",
            appointmentId: retryData.id,
            lockedUntil: retryData.lockedUntil,
            timeSlot: intendedTimeSlot,
            selectedDate,
            staffId: staff.staffId,
          });
          // toast.info(`New appointment locked until ${moment(retryData.lockedUntil).format("HH:mm")}`);
          setIntendedTimeSlot(null); // Clear after success
          // Reset selection state after successful switch
          setSelectedTimeSlot(intendedTimeSlot);
        } else {
          toast.error(
            `Retry failed: ${scheduleRetry.message || "Unknown error"}`
          );
          setSelectedTimeSlot(null);
          setIntendedTimeSlot(null);
          await fetchAvailableSlots(selectedDate);
        }
      } else {
        toast.error("Failed to cancel previous lock");
        setSelectedTimeSlot(null);
        setIntendedTimeSlot(null);
      }
    } catch (error) {
      console.error("Conflict resolution error:", error);
      toast.error("Failed to resolve appointment conflict");
      setSelectedTimeSlot(null);
      setIntendedTimeSlot(null);
    } finally {
      setConflictLoading(false);
      setIsConflictModalVisible(false);
      setConflictAppointment(null);
    }
  };

  const handleConflictCancel = () => {
    // toast.info("Keeping existing appointment lock");
    setSelectedTimeSlot(null);
    setIsConflictModalVisible(false);
    setConflictAppointment(null);
  };

  // handleConfirmAppointment

  const handleConfirmAppointment = async () => {
    if (!appointmentId || !lockedUntil || !token || !appointmentReason.trim()) {
      toast.error("Missing required information or Reason for appointment");
      return;
    }

    // Broadcast that confirmation is starting
    broadcastChannelRef.current?.postMessage({
      type: "CONFIRM_START",
      appointmentId,
      timeSlot: selectedTimeSlot,
      selectedDate,
      staffId: staff.staffId,
    });

    setLoading(true);
    setIsConfirming(true);
    try {
      const response = await confirmAppointment(
        appointmentId,
        token,
        appointmentReason.trim()
      );
      if (response.isSuccess) {
        console.log("Updating slot to confirmed state", {
          timeSlot: selectedTimeSlot,
        });
        // Update the slot state to confirmed
        updateSlotState(selectedTimeSlot!, {
          isAvailable: false,
          isLocked: true,
          lockedByCurrentUser: false,
          isConfirmed: true,
        });
        broadcastChannelRef.current?.postMessage({
          type: "CONFIRM_APPOINTMENT",
          appointmentId,
          timeSlot: selectedTimeSlot,
          selectedDate,
          staffId: staff.staffId,
        });
        resetSelectionState();
        setIsConfirmed(true);
        toast.success("Appointment confirmed successfully!");
        setShouldRedirect(true);
      } else {
        toast.error("Failed to confirm appointment");
        resetSelectionState();
      }
    } catch (error) {
      console.error("Confirmation error:", error);
      toast.error("Failed to confirm appointment");
      resetSelectionState();
    } finally {
      // Broadcast that confirmation has ended
      broadcastChannelRef.current?.postMessage({
        type: "CONFIRM_END",
        appointmentId,
        timeSlot: selectedTimeSlot,
        selectedDate,
        staffId: staff.staffId,
      });
      setLoading(false);
      setIsConfirming(false);
    }
  };

  useEffect(() => {
    if (shouldRedirect) {
      const timer = setTimeout(() => {
        window.location.href = "/my-appointment";
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [shouldRedirect]);

  const renderTimeSlotButton = useCallback(
    (slot: TimeSlot, index: string) => {
      const {
        timeSlot,
        isAvailable,
        isLocked,
        lockedByCurrentUser,
        isConfirmed = false,
      } = slot;
      const isSelected = selectedTimeSlot === timeSlot;
      const isHovered = hoveredIndex === index;
      const isDisabled = !isAvailable && !(lockedByCurrentUser && isSelected);

      const buttonStyle = {
        width: "100%",
        height: "48px", // Larger height for better usability
        borderRadius: "12px", // Consistent with date buttons
        backgroundColor:
          isLocked && !lockedByCurrentUser && !isConfirmed
            ? "#ffbb33" // Warm yellow for locked by others
            : lockedByCurrentUser
            ? "#b7eb8f" // Soft green for current user
            : isConfirmed
            ? "#f0f0f0" // Light gray for confirmed
            : isDisabled
            ? "#f0f0f0" // Light gray for unavailable
            : isSelected
            ? "#e6f4ea" // Matching selected date color
            : isHovered
            ? "#f5f5f5" // Light gray hover
            : "#ffffff", // White default
        border: isSelected
          ? "2px solid #52c41a" // Green border for selected
          : isLocked && !lockedByCurrentUser && !isConfirmed
          ? "2px solidrgb(248, 152, 50)" // Darker orange border for locked by others
          : "1px solid #d9d9d9", // Default gray border
        boxShadow:
          isHovered && !isDisabled ? "0 4px 8px rgba(0, 0, 0, 0.1)" : "none",
        color: "#333", // High-contrast text
        fontSize: "14px", // Larger text
        fontWeight: "500",
        cursor: isDisabled ? "not-allowed" : "pointer",
        transition: "all 0.3s ease",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
      };

      return (
        <Col key={timeSlot} xs={8} sm={6} md={4} lg={3}>
          <Button
            type={isSelected ? "primary" : "default"}
            disabled={loading || isDisabled}
            onClick={() => !isDisabled && handleTimeSlotSelect(timeSlot)}
            onMouseEnter={() => !isDisabled && setHoveredIndex(index)}
            onMouseLeave={() => setHoveredIndex(null)}
            style={buttonStyle}
          >
            {loading && isSelected ? <Spin size="small" /> : timeSlot}
          </Button>
        </Col>
      );
    },
    [selectedTimeSlot, loading, hoveredIndex]
  );

  if (!token || !userId) return null;

  return (
    <div style={{ padding: "24px", width: "100%" }}>
      <div className="flex flex-wrap w-full">
        <div className="w-full rounded-3xl bg-white p-6 shadow-xl lg:w-8/12">
          <Row
            gutter={[24, 24]}
            style={{ marginBottom: "32px", width: "100%", margin: 0 }}
          >
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
                  style={{
                    width: "100%",
                    height: "100%",
                    objectFit: "cover",
                    borderRadius: "4px",
                  }}
                  onError={(e) =>
                    (e.currentTarget.src = "/default-doctor-image.png")
                  }
                />
              </div>
            </Col>
            <Col xs={24} sm={12} md={16} lg={18} xl={{ span: 19, flex: "1" }}>
              <div
                className="bg-gray-100 shadow-md p-4 rounded-lg border border-gray-200 w-full box-border"
                style={{
                  height: "280px",
                  display: "flex",
                  flexDirection: "column",
                  justifyContent: "space-between",
                }}
              >
                <div>
                  <div className="flex items-center gap-2">
                    <h2 className="text-2xl md:text-3xl font-bold text-gray-900 m-0">
                      {staff.fullName}
                    </h2>
                    <img
                      src="/verified_icon.svg"
                      alt="Verified Badge"
                      className="w-6 h-6"
                      onError={(e) => (e.currentTarget.style.display = "none")}
                    />
                  </div>
                  <p className="text-gray-600 text-sm mt-2">
                    University Healthcare Officer
                  </p>
                  <p className="text-gray-700 text-sm mt-2">
                    <span className="font-semibold">Role:</span>{" "}
                    {staff.fullName} provides health support services to
                    students and staff, specializing in wellness checks, health
                    advice, and university-specific health programs.
                  </p>
                  <hr className="border-t border-gray-300 my-2" />
                  <p className="text-gray-800 text-sm mb-1">
                    <span className="font-semibold">Email:</span> {staff.email}
                  </p>
                  <p className="text-gray-800 text-sm mb-1">
                    <span className="font-semibold">Phone:</span> {staff.phone}
                  </p>
                  <p className="text-gray-800 text-sm mb-1">
                    <span className="font-semibold">Gender:</span>{" "}
                    {staff.gender || "N/A"}
                  </p>
                </div>
                <div>
                  <p className="text-gray-600 text-sm">
                    Free for university members
                  </p>
                </div>
              </div>
            </Col>
          </Row>

          <Title level={3}>
            <CalendarOutlined /> Schedule Your Appointment
          </Title>

          <Row gutter={[12, 12]} style={{ marginBottom: "20px" }}>
            {(() => {
              const dates = [];
              let daysAdded = 0;
              let currentDay = moment();

              while (daysAdded < 32) {
                if (currentDay.day() !== 0) {
                  dates.push(currentDay.clone());
                  daysAdded++;
                }
                currentDay.add(1, "day");
              }

              return dates.map((date, index) => {
                const dateStr = date.format("YYYY-MM-DD");
                const isSelected = selectedDate === dateStr;
                const slotCount = slotCounts[dateStr] || 0;
                const isFullyBooked = slotCount === 0;
                const isHovered = hoveredIndex === index.toString();

                return (
                  <Col key={dateStr} xs={8} sm={6} md={4} lg={3}>
                    <Button
                      type={isSelected ? "primary" : "default"}
                      onClick={() => handleDateChange(index)}
                      onMouseEnter={() => setHoveredIndex(index.toString())}
                      onMouseLeave={() => setHoveredIndex(null)}
                      style={{
                        width: "100%",
                        height: "80px", // Larger height for better touch/click area
                        borderRadius: "12px", // Softer corners
                        backgroundColor: isSelected
                          ? "#e6f4ea" // Soft green for selected
                          : isHovered
                          ? "#f5f5f5" // Light gray for hover
                          : "#ffffff", // White default
                        border: isSelected
                          ? "2px solid #28c41a" // Green border for selected
                          : "1px solid #d9d9d9", // Subtle default border
                        boxShadow: isHovered
                          ? "0 4px 8px rgba(0, 0, 0, 0.1)"
                          : "none", // Shadow on hover
                        display: "flex",
                        flexDirection: "column",
                        justifyContent: "center",
                        alignItems: "center",
                        padding: "10px",
                        transition: "all 0.3s ease",
                      }}
                    >
                      <span
                        style={{
                          fontSize: "14px",
                          fontWeight: "600",
                          color: "#333",
                        }}
                      >
                        {date.format("ddd, DD-MM")}
                      </span>
                      {fetchingSlotCounts ? (
                        <Spin size="small" style={{ marginTop: "4px" }} />
                      ) : !isFullyBooked ? (
                        <span
                          style={{
                            fontSize: "12px",
                            color: "#28c41a",
                            marginTop: "4px",
                          }}
                        >
                          {slotCount} slots
                        </span>
                      ) : (
                        <span
                          style={{
                            fontSize: "12px",
                            color: "#f5222d",
                            marginTop: "4px",
                          }}
                        >
                          Fully Booked
                        </span>
                      )}
                    </Button>
                  </Col>
                );
              });
            })()}
          </Row>

          {selectedDate && (
            <>
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  marginBottom: "16px",
                }}
              >
                <span style={{ marginRight: "8px" }}>🌞 Morning</span>
                <div style={{ flex: 1, borderBottom: "2px solid #d9d9d9" }} />
              </div>
              <Row gutter={[8, 8]}>
                {fetchingSlots ? (
                  <Col span={24}>
                    <div style={{ textAlign: "center", padding: "20px" }}>
                      <Spin tip="Loading slots..." />
                    </div>
                  </Col>
                ) : (
                  availableSlots
                    .filter((slot) => slot.timeSlot < "12:00")
                    .map((slot, index) =>
                      renderTimeSlotButton(slot, `morning-${index}`)
                    )
                )}
              </Row>

              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  marginBottom: "16px",
                }}
              >
                <span style={{ marginRight: "8px" }}>🌅 Afternoon</span>
                <div style={{ flex: 1, borderBottom: "2px solid #d9d9d9" }} />
              </div>
              <Row gutter={[8, 8]}>
                {fetchingSlots ? (
                  <Col span={24}>
                    <div style={{ textAlign: "center", padding: "20px" }}>
                      <Spin tip="Loading slots..." />
                    </div>
                  </Col>
                ) : (
                  availableSlots
                    .filter((slot) => slot.timeSlot >= "13:00")
                    .map((slot, index) =>
                      renderTimeSlotButton(slot, `afternoon-${index}`)
                    )
                )}
              </Row>

              <div style={{ marginBottom: "16px" }}>
                <Text>Reason for Appointment:</Text>
                <TextArea
                  value={appointmentReason}
                  onChange={(e) => setAppointmentReason(e.target.value)}
                  placeholder="Enter the reason for your appointment"
                  rows={3}
                  style={{ marginTop: "8px" }}
                />
              </div>

              {appointmentId && lockedUntil && !isConfirmed && (
                <div style={{ marginTop: "16px", textAlign: "center" }}>
                  <Text>
                    Confirm within{" "}
                    {timeLeft !== null
                      ? `${Math.floor(timeLeft / 60)}:${(timeLeft % 60)
                          .toString()
                          .padStart(2, "0")}`
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
          )}
        </div>

        <div className="mt-8 w-full lg:mt-0 lg:w-4/12 lg:pl-4">
          <div className="rounded-3xl bg-white px-6 pt-6 shadow-lg">
            <div className="flex pb-6 text-2xl font-bold text-gray-800">
              {/* <p>Health Notifications</p> */}
            </div>
            {/* Add your notifications here */}
          </div>
        </div>
      </div>
      <ConflictModal
        open={isConflictModalVisible}
        existingAppointment={conflictAppointment}
        currentStaffName={conflictAppointment?.staffName || "Unknown Staff"}
        newStaffName={staff.fullName}
        newDate={selectedDate}
        newTimeSlot={intendedTimeSlot}
        loading={conflictLoading}
        onConfirm={handleConflictConfirm}
        onCancel={handleConflictCancel}
      />
    </div>
  );
};

export const getServerSideProps: GetServerSideProps = async (context) => {
  const { params, req } = context;
  const token = req.cookies.token || undefined;

  if (!token) {
    return { redirect: { destination: "/", permanent: false } };
  }

  try {
    const staffId = params?.staffId as string;
    if (!staffId) throw new Error("Staff ID not provided");
    const response = await getHealthcareStaffById(staffId, token);
    return { props: { staff: response.data, token } };
  } catch (error) {
    console.error("Server-side props error:", error);
    return { notFound: true };
  }
};

export default ScheduleAppointment;
