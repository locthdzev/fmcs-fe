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
} from "@/api/appointment-api";
import { Button, Spin, Typography, Row, Col } from "antd";
import { toast } from "react-toastify";
import moment from "moment-timezone";
import Cookies from "js-cookie";
import { HubConnection, HubConnectionState } from "@microsoft/signalr";


const { Title, Text } = Typography;

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
  const confirmConnectionRef = useRef<HubConnection | null>(null); // For confirmation updates
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
          return slotFromApi || {
            timeSlot,
            isAvailable: false,
            isLocked: false,
            lockedByCurrentUser: false,
          };
        });
        setAvailableSlots(newSlots);

        const userSelected = newSlots.find((s) => s.lockedByCurrentUser);
        if (userSelected) {
          setSelectedTimeSlot(userSelected.timeSlot);
          setAppointmentId(response.data?.lockedAppointmentId || null);
          setLockedUntil(response.data?.lockedUntil ? moment(response.data.lockedUntil) : null);
          setIsConfirmed(false); // Reset confirmation state
          setIsConfirming(false);
        } else if (
          selectedTimeSlot &&
          !newSlots.some((s) => s.timeSlot === selectedTimeSlot && (s.isAvailable || s.lockedByCurrentUser))
        ) {
          toast.warn(`Time slot ${selectedTimeSlot} is no longer available.`);
          setSelectedTimeSlot(null);
          setAppointmentId(null);
          setLockedUntil(null);
        }
      } catch (error: any) {
        toast.error("Failed to load slots: " + (error.message || "Unknown error"));
      } finally {
        setFetchingSlots(false);
      }
    },
    [staff.staffId, token, userId, selectedTimeSlot, schedulingInProgress]
  );


  // Initialize BroadcastChannel
  useEffect(() => {
    if (typeof window !== "undefined") {
      broadcastChannelRef.current = new BroadcastChannel("appointment_channel");
      broadcastChannelRef.current.onmessage = (event) => {
        const { type, appointmentId: broadcastedId, lockedUntil, timeSlot, selectedDate: broadcastedDate } = event.data;
        if (type === "LOCK_SLOT" && broadcastedDate === selectedDate) {
          setAppointmentId(broadcastedId);
          setLockedUntil(lockedUntil ? moment(lockedUntil) : null);
          setSelectedTimeSlot(timeSlot);
          setIsConfirmed(false);
          setIsConfirming(false);
          // Fetch slots to ensure consistency with server state
          if (selectedDate) fetchAvailableSlots(selectedDate);
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
            toast.success("Appointment confirmed in another tab!");
          }
        }
      };
    }
    return () => {
      broadcastChannelRef.current?.close();
    };
  }, [appointmentId, selectedDate, fetchAvailableSlots]); // Ensure fetchAvailableSlots is included

  // Modified useCountdown to stop when confirmed
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
          if (userId && token) {
            cancelLockedAppointment(userId, token)
              .then(() => {
                if (selectedDate) {
                  return fetchAvailableSlots(selectedDate);
                }
                return;
              })
              .catch((error) => {
                console.error("Cancel locked appointment failed:", error);
                toast.error("Failed to free expired slot.");
              });
          }
          toast.error("Appointment lock expired.");
        } else {
          setTimeLeft(Math.ceil(diff / 1000));
        }
      }, 1000);
      return () => clearInterval(interval);
    }, [lockedUntil, isConfirmed, isConfirming, fetchAvailableSlots, userId, token, selectedDate]);
  
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
          const newSlots: TimeSlot[] = allTimeSlots.map((timeSlot) => {
            const slotFromApi = data.slots.availableSlots.find((s) => s.timeSlot === timeSlot);
            return slotFromApi || {
              timeSlot,
              isAvailable: false,
              isLocked: false,
              lockedByCurrentUser: false,
            };
          });
          setAvailableSlots(newSlots);

          const userSelected = newSlots.find((s) => s.lockedByCurrentUser);
          if (userSelected) {
            setSelectedTimeSlot(userSelected.timeSlot);
            setAppointmentId(data.slots.lockedAppointmentId || null);
            setLockedUntil(data.slots.lockedUntil ? moment(data.slots.lockedUntil) : null);
          } else if (
            selectedTimeSlot &&
            !newSlots.some((s) => s.timeSlot === selectedTimeSlot && (s.isAvailable || s.lockedByCurrentUser))
          ) {
            toast.warn(`Time slot ${selectedTimeSlot} is no longer available.`);
            setSelectedTimeSlot(null);
            setAppointmentId(null);
            setLockedUntil(null);
          }
        }
      },
      ReceivePersonalSlotsUpdate: (data: SlotUpdatePayload) => {
        if (data.staffId === staff.staffId && data.date === selectedDate && !schedulingInProgress) {
          const newSlots: TimeSlot[] = allTimeSlots.map((timeSlot) => {
            const slotFromApi = data.slots.availableSlots.find((s) => s.timeSlot === timeSlot);
            return slotFromApi || {
              timeSlot,
              isAvailable: false,
              isLocked: false,
              lockedByCurrentUser: false,
            };
          });
          setAvailableSlots(newSlots);

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
        await connection.stop();
      }
      connectionRef.current = null;
    }

    connection = setupAppointmentRealTime(
      (data) => console.log("SignalR: Generic update:", data),
      eventHandlers
    );
    connectionRef.current = connection;

    if (connection.state === HubConnectionState.Connected) {
      await connection.invoke("SubscribeToStaffUpdates", staff.staffId);
    } else {
      connection.on("connected", () => {
        connection.invoke("SubscribeToStaffUpdates", staff.staffId);
      });
    }
  }, [staff.staffId, token, eventHandlers]);

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
        if (!userId) {
          toast.error("User authentication is missing. Cannot cancel the appointment.");
          return;
        }
        try {
          await cancelLockedAppointment(userId, token);
          setAppointmentId(null);
          setLockedUntil(null);
          setSelectedTimeSlot(null);
          console.log(`Canceled lock for time slot ${timeSlot}.`);
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

      const validationResponse = await validateAppointmentRequest(request, token);
      if (!validationResponse.isSuccess) {
        toast.error(`Validation failed: ${validationResponse.message || "Invalid request"}`);
        return;
      }

      const scheduleResponse = await scheduleAppointment(request, token);
      console.log("Schedule response:", scheduleResponse);

      if (scheduleResponse.isSuccess && scheduleResponse.data) {
        const appointmentData = scheduleResponse.data as AppointmentResponseDTO;
        setAppointmentId(appointmentData.id);
        setLockedUntil(moment(appointmentData.lockedUntil));
        // Broadcast the locked slot to other tabs
          broadcastChannelRef.current?.postMessage({
            type: "LOCK_SLOT",
            appointmentId: appointmentData.id,
            lockedUntil: appointmentData.lockedUntil,
            timeSlot,
            selectedDate,
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
            const retryValidation = await validateAppointmentRequest(request, token);
            if (!retryValidation.isSuccess) {
              toast.error(`Validation failed on retry: ${retryValidation.message || "Invalid request"}`);
              setSelectedTimeSlot(null);
              return;
            }

            await cancelLockedAppointment(userId, token);
            const scheduleRetry = await scheduleAppointment(request, token);
            if (scheduleRetry.isSuccess && scheduleRetry.data) {
              const retryData = scheduleRetry.data as AppointmentResponseDTO;
              setAppointmentId(retryData.id);
              setLockedUntil(moment(retryData.lockedUntil));
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
      if (selectedDate) await fetchAvailableSlots(selectedDate);
    }
  };

  const [shouldRedirect, setShouldRedirect] = useState(false);
  

const handleConfirmAppointment = async () => {
  if (!appointmentId || !lockedUntil || !token) {
    toast.error("No appointment to confirm or missing token.");
    return;
  }
  if (moment().isAfter(lockedUntil)) {
    toast.error("Appointment lock has expired. Please try again.");
    setAppointmentId(null);
    setLockedUntil(null);
    setSelectedTimeSlot(null);
    return;
  }

  // Broadcast that confirmation is starting
  broadcastChannelRef.current?.postMessage({
    type: "START_CONFIRMATION",
    appointmentId,
  });

  setLoading(true);
  setIsConfirming(true);
  try {
    const response = await confirmAppointment(appointmentId, token);
    if (response.isSuccess) {
      // Broadcast confirmation to other tabs
      broadcastChannelRef.current?.postMessage({
        type: "CONFIRM_APPOINTMENT",
        appointmentId,
      });

      setIsConfirmed(true);
      toast.success("Appointment confirmed successfully!");

      if (selectedDate) {
        const slotsResponse = await getAvailableTimeSlots(staff.staffId, selectedDate, token);
        const slotData = slotsResponse.data?.availableSlots || [];
        const newSlots: TimeSlot[] = allTimeSlots.map((timeSlot) => {
          const slotFromApi = slotData.find((s: TimeSlotDTO) => s.timeSlot === timeSlot);
          return slotFromApi || {
            timeSlot,
            isAvailable: false,
            isLocked: false,
            lockedByCurrentUser: false,
          };
        });
        setAvailableSlots(newSlots);
        setSelectedTimeSlot(null);
        setAppointmentId(null);
        setLockedUntil(null);
      }

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
    }, 500); // Delay redirect to allow SignalR update
    return () => clearTimeout(timer);
  }
}, [shouldRedirect]);

  const renderTimeSlotButton = (slot: TimeSlot, index: string) => {
    const { timeSlot, isAvailable, isLocked, lockedByCurrentUser } = slot;
    const isSelected = selectedTimeSlot === timeSlot;
    const isHovered = hoveredIndex === index;

    const isDisabled = !isAvailable && !(lockedByCurrentUser && isSelected);
    const isLockedByCurrentUserInOtherTab = lockedByCurrentUser && appointmentId && timeSlot !== selectedTimeSlot;

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
            backgroundColor: lockedByCurrentUser
              ? "#c3e6cb"
              : isDisabled
              ? "#f5f5f5"
              : isHovered
              ? "#d4edda"
              : "#ffffff",
            color: lockedByCurrentUser
              ? "#000000"
              : isDisabled
              ? "#999999"
              : isHovered
              ? "#155724"
              : "#000000",
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
          ) : isLocked && !lockedByCurrentUser ? (
            <>
              <span>{timeSlot}</span>
              <span style={{ fontSize: "10px", lineHeight: "10px", color: "#999999" }}>Taken</span>
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