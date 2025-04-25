import React, { useState, useEffect, useCallback, useRef } from "react";
import {
  CalendarOutlined,
  LeftOutlined,
  RightOutlined,
} from "@ant-design/icons";
import { GetServerSideProps } from "next";
import { debounce } from "lodash";
import { v4 as uuidv4 } from "uuid";
import jwtDecode from "jwt-decode";
import {
  getAppointment,
  AppointmentCreateRequestDTO,
  scheduleAppointment,
  getAvailableTimeSlots,
  getAvailableSlotCountWithSchedule,
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
import {
  Button,
  Spin,
  Typography,
  Row,
  Col,
  Input,
  message,
  Tag,
  Card,
  Space,
  Alert,
} from "antd";
import {
  setupScheduleAppointmentLockedRealtime,
  setupCancelAppointmentRealtime,
  setupConfirmAppointmentRealtime,
  setupCancelPreviousLockedAppointmentRealtime,
  setupCancelPresentLockedAppointmentRealtime,
  setupCancelExpiredLockedAppointmentRealtime,
} from "@/api/appointment-signalr";
import moment from "moment-timezone";
import Cookies from "js-cookie";
import ConflictModal from "@/components/appointment/ConflictModal";
import SignalRManager from "@/api/signalr-manager";
import { getStaffSchedulesByDateRange } from "@/api/schedule";

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

interface StaffWorkSchedule {
  id: string;
  workDate: string;
  shiftName?: string;
  startTime?: string;
  endTime?: string;
  dayOfWeek?: string;
}

// Biến dates toàn cục
const generateDateArray = () => {
  const datesArray = [];
  const today = moment().startOf("day");
  const endDate = moment().add(30, "days").startOf("day");

  // Loop through each day in the range
  let currentDate = today.clone();
  while (currentDate.isSameOrBefore(endDate)) {
    // Skip Sundays
    if (currentDate.day() !== 0) {
      datesArray.push(currentDate.format("YYYY-MM-DD"));
    }
    currentDate.add(1, "days");
  }

  return datesArray;
};

const ScheduleAppointment: React.FC<ScheduleAppointmentProps> = ({
  staff,
  token,
}) => {
  const [messageApi, contextHolder] = message.useMessage();
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
  const [staffWorkSchedules, setStaffWorkSchedules] = useState<
    StaffWorkSchedule[]
  >([]);
  const [workScheduleLoading, setWorkScheduleLoading] = useState(false);
  const [availableWorkDates, setAvailableWorkDates] = useState<Set<string>>(
    new Set()
  );

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

  // Thêm vào phần đầu của component
  const [dates] = useState(generateDateArray());

  // Fetch available slots
  const fetchAvailableSlots = useCallback(
    debounce(async (date: string) => {
      if (!token || !userId || schedulingInProgress) return;
      setFetchingSlots(true);
      try {
        // Sử dụng API getAvailableTimeSlots, đã xem xét lịch làm việc ở backend
        const response = await getAvailableTimeSlots(
          staff.staffId,
          date,
          token
        );
        const slotData = response.data?.availableSlots || [];

        // Áp dụng trực tiếp dữ liệu từ API mà không lọc thêm, vì backend đã lọc theo lịch làm việc
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
        messageApi.error("Failed to load available time slots");
      } finally {
        setFetchingSlots(false);
      }
    }, 50),
    [
      staff.staffId,
      token,
      userId,
      schedulingInProgress,
      selectedTimeSlot,
      messageApi,
    ]
  );

  // Pre-fetch slots for the first available date when component is loaded
  useEffect(() => {
    if (!selectedDate && staffWorkSchedules.length > 0 && !fetchingSlots) {
      // Find the first available work date
      const today = moment().format("YYYY-MM-DD");
      const firstAvailableDate = staffWorkSchedules
        .filter((s) => s.workDate >= today)
        .sort((a, b) => moment(a.workDate).diff(moment(b.workDate)))
        .map((s) => moment(s.workDate).format("YYYY-MM-DD"))[0];

      if (firstAvailableDate) {
        setSelectedDate(firstAvailableDate);
      }
    }
  }, [staffWorkSchedules, selectedDate, fetchingSlots]);

  // Add a function to filter time slots based on staff work schedule
  const filterTimeSlotsByShift = useCallback(
    (date: string, slots: TimeSlotDTO[]): TimeSlotDTO[] => {
      // Find the work schedule for the selected date
      const dateSchedule = staffWorkSchedules.find(
        (schedule) => moment(schedule.workDate).format("YYYY-MM-DD") === date
      );

      // If no schedule found, mark all slots as unavailable
      if (!dateSchedule || !dateSchedule.startTime || !dateSchedule.endTime) {
        return allTimeSlots.map((timeSlot) => ({
          timeSlot,
          isAvailable: false, // Đánh dấu tất cả là không khả dụng khi không có lịch làm việc
          isLocked: false,
          lockedByCurrentUser: false,
        }));
      }

      // Chuyển đổi thời gian thành phút để dễ so sánh
      const convertTimeToMinutes = (timeStr: string) => {
        // Handle formats like "9:00 AM" or "1:00 PM"
        const [timePart, ampm] = timeStr.split(" ");
        let [hours, minutes] = timePart.split(":").map(Number);

        // Convert 12h to 24h format
        if (ampm.toUpperCase() === "PM" && hours < 12) {
          hours += 12;
        } else if (ampm.toUpperCase() === "AM" && hours === 12) {
          hours = 0;
        }

        return hours * 60 + minutes;
      };

      // Parse time slots to minutes for comparison
      const parseTimeToMinutes = (timeStr: string) => {
        const [hours, minutes] = timeStr.split(":").map(Number);
        return hours * 60 + minutes;
      };

      // Calculate shift start and end times in minutes
      const shiftStartMinutes = convertTimeToMinutes(dateSchedule.startTime);
      const shiftEndMinutes = convertTimeToMinutes(dateSchedule.endTime);

      console.log(
        `Staff shift time: ${dateSchedule.startTime} - ${dateSchedule.endTime}`
      );
      console.log(
        `Converted shift time (minutes): ${shiftStartMinutes} - ${shiftEndMinutes}`
      );

      // Đảm bảo tất cả time slots được xử lý, không chỉ những cái từ API
      const availableSlotsMap = new Map(
        slots.map((slot) => [slot.timeSlot, slot])
      );

      // Tạo mảng slot mới dựa trên tất cả các slot có thể
      return allTimeSlots.map((timeSlot) => {
        const [slotStart] = timeSlot.split(" - ");
        const slotEnd = timeSlot.split(" - ")[1];

        const slotStartMinutes = parseTimeToMinutes(slotStart);
        const slotEndMinutes = parseTimeToMinutes(slotEnd);

        // Check if slot is within work schedule
        const isWithinShift =
          slotStartMinutes >= shiftStartMinutes &&
          slotEndMinutes <= shiftEndMinutes;

        // Lấy thông tin từ API nếu có
        const slotFromApi = availableSlotsMap.get(timeSlot);

        if (slotFromApi) {
          return {
            ...slotFromApi,
            isAvailable: slotFromApi.isAvailable && isWithinShift, // Kết hợp trạng thái từ API và ràng buộc ca làm việc
          };
        } else {
          // Tạo slot mới nếu không có trong API
          return {
            timeSlot,
            isAvailable: isWithinShift, // Khả dụng chỉ khi trong ca làm việc
            isLocked: false,
            lockedByCurrentUser: false,
          };
        }
      });
    },
    [staffWorkSchedules, allTimeSlots]
  );

  // Fetch slot counts
  const fetchAvailableSlotCount = useCallback(
    async (date: string) => {
      if (!token) return;
      setFetchingSlotCounts(true);
      try {
        const response = await getAvailableSlotCountWithSchedule(
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
          isAvailable: false, // Mặc định là không khả dụng nếu không tìm thấy trong API
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
      messageApi.error("Authentication token is missing");
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
      messageApi.error("Failed to authenticate: Invalid token");
      setUserId(null);
    }
  }, [token, messageApi]);

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
        // messageApi.info(`Slot ${timeSlot} locked in another tab`);
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
        // messageApi.info(`Slot ${timeSlot} is now taken`);
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
            // messageApi.info(`Your locked appointment (${canceledTimeSlot}) was canceled from another tab`);
          } else if (reason === "expiration") {
            // messageApi.info(`Your locked appointment (${canceledTimeSlot}) has expired`);
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
        messageApi.success("Appointment confirmed in another tab!");
      } else if (
        type === "CONFIRM_START" &&
        broadcastedId === appointmentIdRef.current &&
        staffId === staff.staffId
      ) {
        setLoading(true);
        setIsConfirming(true);
        messageApi.info("Confirmation started in another tab");
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
              // messageApi.error("Your locked appointment has expired");
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
    //       messageApi.info("Your previous appointment lock was canceled");
    //     } else if (signalRUserId !== userId) {
    //       messageApi.info(`Slot ${timeSlot} is now available`);
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
          // messageApi.success("Appointment confirmed via real-time update!");
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

  // Fetch staff work schedules for the next 30 days
  const fetchStaffWorkSchedules = useCallback(async () => {
    if (!token || workScheduleLoading) return;

    setWorkScheduleLoading(true);
    try {
      const startDate = moment().format("YYYY-MM-DD");
      const endDate = moment().add(30, "days").format("YYYY-MM-DD");

      const response = await getStaffSchedulesByDateRange(
        staff.staffId,
        startDate,
        endDate
      );

      if (response.isSuccess && Array.isArray(response.data)) {
        setStaffWorkSchedules(response.data);

        // Extract available work dates
        const workDates = new Set<string>(
          response.data.map((schedule: StaffWorkSchedule) =>
            moment(schedule.workDate).format("YYYY-MM-DD")
          )
        );
        setAvailableWorkDates(workDates);

        // Log the available dates for debugging
        console.log("Available work dates:", Array.from(workDates));
        console.log("Staff work schedules loaded successfully");
      } else {
        console.error(
          "Failed to fetch staff work schedules:",
          response.message
        );
      }
    } catch (error) {
      console.error("Error fetching staff work schedules:", error);
      messageApi.error("Failed to load staff work schedule");
    } finally {
      setWorkScheduleLoading(false);
    }
  }, [staff.staffId, token, messageApi, workScheduleLoading]);

  // Sửa useEffect để tránh vòng lặp vô hạn
  useEffect(() => {
    // Fetch slot counts for all dates in the range - CHỈ GỌI MỘT LẦN
    if (!workScheduleLoading && staffWorkSchedules.length > 0) {
      const availableDates = Array.from(availableWorkDates);
      availableDates.forEach((date) => fetchAvailableSlotCount(date));
    }
  }, [
    fetchAvailableSlotCount,
    staffWorkSchedules,
    availableWorkDates,
    workScheduleLoading,
  ]);

  // Fetch slots for selected date
  useEffect(() => {
    if (selectedDate && !schedulingInProgress) {
      fetchAvailableSlots(selectedDate);
    }
  }, [selectedDate, fetchAvailableSlots, schedulingInProgress]);

  // Countdown timer
  const hasHandledExpirationRef = useRef(false);

  // Modify the timeout notification thresholds
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

        // Immediately set flag to prevent multiple calls
        hasHandledExpirationRef.current = true;

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
          } else {
            console.error("Failed to cancel expired lock:", response.message);
            messageApi.error(
              `Failed to release expired slot: ${
                response.message || "Unknown error"
              }`
            );
            // Reset flag if failed
            hasHandledExpirationRef.current = false;
          }
        } catch (error) {
          console.error("Lock expiration error:", error);
          messageApi.error("Failed to free expired slot");
          // Reset flag if failed
          hasHandledExpirationRef.current = false;
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
      messageApi,
    ]
  );

  // Fix useCountdown to handle 30-second timeout
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
        return () => {}; // Đảm bảo cleanup function trống
      }

      hasHandledExpirationRef.current = false;
      const now = moment();
      const diff = moment(lockedUntil).diff(now);

      if (diff <= 0) {
        setTimeLeft(null);
        handleLockExpiration();
        return () => {}; // Đảm bảo cleanup function trống
      }

      setTimeLeft(Math.ceil(diff / 1000));

      const interval = setInterval(() => {
        const currentDiff = moment(lockedUntil).diff(moment());
        if (currentDiff <= 0 && !hasHandledExpirationRef.current) {
          clearInterval(interval);
          setTimeLeft(null);
          handleLockExpiration();
        } else if (currentDiff > 0) {
          setTimeLeft(Math.ceil(currentDiff / 1000));
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

  // Update selectedDate ref whenever it changes
  useEffect(() => {
    selectedDateRef.current = selectedDate;
  }, [selectedDate]);

  // Thêm useEffect riêng để gọi fetchStaffWorkSchedules một lần duy nhất khi component mount
  useEffect(() => {
    // Fetch staff work schedules một lần duy nhất khi component mount
    if (!staffWorkSchedules.length && !workScheduleLoading) {
      fetchStaffWorkSchedules();
    }
  }, [fetchStaffWorkSchedules, staffWorkSchedules.length, workScheduleLoading]); // Dependencies cần thiết

  // Check if a date is available based on staff work schedule
  const isDateAvailable = (date: string) => {
    return availableWorkDates.has(date);
  };

  // Modified handleDateChange to check for staff availability
  const handleDateChange = (index: number) => {
    const date = dates[index];

    // Only allow selecting dates when staff is scheduled to work
    if (!isDateAvailable(date)) {
      messageApi.warning(
        `${staff.fullName} is not scheduled to work on this day.`
      );
      return;
    }

    setSelectedDate(date);
    setSelectedTimeSlot(null);

    // Reset appointment selection
    if (appointmentId) {
      cancelCurrentLock(selectedTimeSlot as string).catch((err) => {
        console.error("Error cancelling lock:", err);
      });
      setAppointmentId(null);
    }

    // Pre-load slots immediately when user selects a date
    setFetchingSlots(true);
    fetchAvailableSlots(date);
  };

  // Sửa lại hàm handleTimeSlotSelect để dừng loading và fetchingSlots
  const handleTimeSlotSelect = async (timeSlot: string) => {
    if (!token || !userId) return;

    try {
      // Set loading để hiển thị trạng thái đang xử lý
      setLoading(true);

      if (timeSlot === selectedTimeSlot && appointmentId) {
        await cancelCurrentLock(timeSlot);
        setLoading(false);
        return;
      }

      setIntendedTimeSlot(timeSlot);
      setSelectedTimeSlot(timeSlot);

      await handleScheduleAppointment(timeSlot);
    } catch (error) {
      console.error("Error selecting time slot:", error);
      messageApi.error("Could not reserve this time slot. Please try another one.");
    } finally {
      // Đảm bảo tắt tất cả trạng thái loading khi kết thúc
      setLoading(false);
      setFetchingSlots(false);
    }
  };

  const cancelCurrentLock = async (timeSlot: string) => {
    if (!appointmentId) {
      console.error("No appointment ID available to cancel");
      messageApi.error("Cannot cancel lock: No appointment selected");
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
        // messageApi.info("Appointment lock canceled");
      }
    } catch (error) {
      console.error("Cancel lock failed:", error);
      messageApi.error("Failed to cancel appointment lock");
    }
  };

  // Sửa hàm handleScheduleAppointment để đảm bảo reset loading
  const handleScheduleAppointment = async (timeSlot: string) => {
    if (!selectedDate || !token || !userId) {
      messageApi.error("Missing required information for scheduling");
      setLoading(false); // Reset loading nếu có lỗi
      return;
    }

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
        messageApi.error(
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
        messageApi.error(
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
        // messageApi.info(`Appointment locked until ${moment(appointmentData.lockedUntil).format("HH:mm")}`);
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
          messageApi.error("Scheduling conflict detected");
          setSelectedTimeSlot(null);
        }
      } else {
        messageApi.error(
          `Scheduling failed: ${scheduleResponse.message || "Unknown error"}`
        );
        setSelectedTimeSlot(null);
      }
    } catch (error) {
      console.error("Scheduling error:", error);
      messageApi.error("Failed to schedule appointment");
      setSelectedTimeSlot(null);
    } finally {
      setLoading(false);
      setFetchingSlots(false);
      setSchedulingInProgress(false);
    }
  };

  // handleConflictConfirm
  const handleConflictConfirm = async () => {
    if (!token || !selectedDate || !intendedTimeSlot || !conflictAppointment)
      return;
    if (!selectedDate || !token || !userId) {
      messageApi.error("Missing required information for scheduling");
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
          // messageApi.info(`New appointment locked until ${moment(retryData.lockedUntil).format("HH:mm")}`);
          setIntendedTimeSlot(null); // Clear after success
          // Reset selection state after successful switch
          setSelectedTimeSlot(intendedTimeSlot);
        } else {
          messageApi.error(
            `Retry failed: ${scheduleRetry.message || "Unknown error"}`
          );
          setSelectedTimeSlot(null);
          setIntendedTimeSlot(null);
          await fetchAvailableSlots(selectedDate);
        }
      } else {
        messageApi.error("Failed to cancel previous lock");
        setSelectedTimeSlot(null);
        setIntendedTimeSlot(null);
      }
    } catch (error) {
      console.error("Conflict resolution error:", error);
      messageApi.error("Failed to resolve appointment conflict");
      setSelectedTimeSlot(null);
      setIntendedTimeSlot(null);
    } finally {
      setConflictLoading(false);
      setIsConflictModalVisible(false);
      setConflictAppointment(null);
    }
  };

  const handleConflictCancel = () => {
    // messageApi.info("Keeping existing appointment lock");
    setSelectedTimeSlot(null);
    setIsConflictModalVisible(false);
    setConflictAppointment(null);
  };

  // handleConfirmAppointment

  const handleConfirmAppointment = async () => {
    if (!appointmentId || !lockedUntil || !token || !appointmentReason.trim()) {
      messageApi.error(
        "Missing required information or Reason for appointment"
      );
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
        messageApi.success("Appointment confirmed successfully!");
        setShouldRedirect(true);
      } else {
        messageApi.error("Failed to confirm appointment");
        resetSelectionState();
      }
    } catch (error) {
      console.error("Confirmation error:", error);
      messageApi.error("Failed to confirm appointment");
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

  const renderTimeSlots = () => {
    if (!selectedDate) {
      return (
        <div className="flex justify-center">
          <Text type="secondary">
            Please select a date to view available time slots
          </Text>
        </div>
      );
    }

    // Vẫn hiển thị UI khi đang fetchingSlots, nhưng thêm trạng thái loading
    // Filter time slots into morning and afternoon
    const morningSlots = availableSlots.filter(slot => {
      const startHour = parseInt(slot.timeSlot.split(':')[0]);
      return startHour < 12;
    });

    const afternoonSlots = availableSlots.filter(slot => {
      const startHour = parseInt(slot.timeSlot.split(':')[0]);
      return startHour >= 12;
    });

    return (
      <div className={`space-y-6 ${fetchingSlots ? 'opacity-60' : ''}`}>
        {fetchingSlots && (
          <div className="absolute inset-0 flex items-center justify-center z-10 bg-white bg-opacity-50">
            <Spin size="large" />
          </div>
        )}
        {/* Morning shift */}
        <div className="bg-blue-50 p-4 rounded-lg relative">
          <div className="mb-3">
            <h3 className="text-lg font-semibold text-blue-800 flex items-center">
              <span className="bg-blue-500 w-4 h-4 rounded-full mr-2"></span>
              Morning (08:00 - 12:00)
            </h3>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
            {morningSlots.length > 0 ? (
              morningSlots.map((slot) => {
                const isSelected = selectedTimeSlot === slot.timeSlot;
                const isUserLocked = slot.lockedByCurrentUser;
                const isUnavailable = !slot.isAvailable && !isUserLocked;
                const isLocked = slot.isLocked && !isUserLocked;
                const isLoading = loading && isSelected;

                // Apply classes based on slot state
                let buttonClass = "py-2 px-3 border rounded-lg font-medium transition-colors duration-150 w-full text-center";
                let labelClass = "";

                if (isSelected) {
                  buttonClass += " bg-blue-500 text-white border-blue-600 hover:bg-blue-600 shadow-md";
                } else if (isUnavailable) {
                  buttonClass += " bg-gray-100 text-gray-400 border-gray-200 cursor-not-allowed opacity-60";
                } else if (isLocked) {
                  buttonClass += " bg-yellow-50 text-yellow-700 border-yellow-200 cursor-not-allowed";
                  labelClass = "line-through";
                } else {
                  buttonClass += " bg-white text-blue-600 border-blue-200 hover:bg-blue-50 hover:border-blue-300";
                }

                return (
                  <div key={slot.timeSlot} className="relative">
                    <button
                      className={buttonClass}
                      onClick={() => {
                        if (!isUnavailable && !isLocked && !loading) {
                          if (isSelected) {
                            // Cancel the current selection
                            cancelCurrentLock(slot.timeSlot);
                          } else {
                            // Select this time slot
                            handleTimeSlotSelect(slot.timeSlot);
                          }
                        }
                      }}
                      disabled={isUnavailable || isLocked || loading}
                    >
                      {isLoading ? <Spin size="small" /> : <span className={labelClass}>{slot.timeSlot}</span>}
                    </button>
                    {isLocked && (
                      <div className="absolute -top-1 -right-1">
                        <Tag color="orange" className="scale-75">Booked</Tag>
                      </div>
                    )}
                  </div>
                );
              })
            ) : (
              <div className="col-span-full text-center py-3">
                <Text type="secondary">No available slots in the morning</Text>
              </div>
            )}
          </div>
        </div>

        {/* Afternoon shift */}
        <div className="bg-green-50 p-4 rounded-lg relative">
          <div className="mb-3">
            <h3 className="text-lg font-semibold text-green-800 flex items-center">
              <span className="bg-green-500 w-4 h-4 rounded-full mr-2"></span>
              Afternoon (13:30 - 17:30)
            </h3>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
            {afternoonSlots.length > 0 ? (
              afternoonSlots.map((slot) => {
                const isSelected = selectedTimeSlot === slot.timeSlot;
                const isUserLocked = slot.lockedByCurrentUser;
                const isUnavailable = !slot.isAvailable && !isUserLocked;
                const isLocked = slot.isLocked && !isUserLocked;
                const isLoading = loading && isSelected;

                // Apply classes based on slot state
                let buttonClass = "py-2 px-3 border rounded-lg font-medium transition-colors duration-150 w-full text-center";
                let labelClass = "";

                if (isSelected) {
                  buttonClass += " bg-green-500 text-white border-green-600 hover:bg-green-600 shadow-md";
                } else if (isUnavailable) {
                  buttonClass += " bg-gray-100 text-gray-400 border-gray-200 cursor-not-allowed opacity-60";
                } else if (isLocked) {
                  buttonClass += " bg-yellow-50 text-yellow-700 border-yellow-200 cursor-not-allowed";
                  labelClass = "line-through";
                } else {
                  buttonClass += " bg-white text-green-600 border-green-200 hover:bg-green-50 hover:border-green-300";
                }

                return (
                  <div key={slot.timeSlot} className="relative">
                    <button
                      className={buttonClass}
                      onClick={() => {
                        if (!isUnavailable && !isLocked && !loading) {
                          if (isSelected) {
                            // Cancel the current selection
                            cancelCurrentLock(slot.timeSlot);
                          } else {
                            // Select this time slot
                            handleTimeSlotSelect(slot.timeSlot);
                          }
                        }
                      }}
                      disabled={isUnavailable || isLocked || loading}
                    >
                      {isLoading ? <Spin size="small" /> : <span className={labelClass}>{slot.timeSlot}</span>}
                    </button>
                    {isLocked && (
                      <div className="absolute -top-1 -right-1">
                        <Tag color="orange" className="scale-75">Booked</Tag>
                      </div>
                    )}
                  </div>
                );
              })
            ) : (
              <div className="col-span-full text-center py-3">
                <Text type="secondary">No available slots in the afternoon</Text>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  };

  // Hàm tạo style cho các thẻ ngày
  const dateCardStyle = (date: string, isAvailable: boolean) => {
    const isSelected = date === selectedDate;
    return {
      width: "90px",
      minHeight: "85px",
      border: "1px solid #d9d9d9",
      borderRadius: "8px",
      display: "flex",
      flexDirection: "column" as const,
      justifyContent: "center" as const,
      alignItems: "center" as const,
      margin: "0 4px",
      position: "relative" as const,
      cursor: isAvailable ? "pointer" : "not-allowed",
      opacity: isAvailable ? 1 : 0.5,
      backgroundColor: isSelected ? "#e6f7ff" : "#fff",
      borderColor: isSelected ? "#1890ff" : "#d9d9d9",
      boxShadow: isSelected ? "0 0 5px rgba(24, 144, 255, 0.5)" : "none",
    };
  };

  const renderAppointmentSummary = () => {
    if (!selectedDate || !selectedTimeSlot) return null;

    return (
      <Card
        title="Appointment Summary"
        style={{ marginTop: "20px", marginBottom: "20px" }}
        bordered={true}
      >
        <Row gutter={[16, 16]}>
          <Col span={12}>
            <Typography.Text strong>Healthcare Staff:</Typography.Text>
            <div>{staff.fullName}</div>
          </Col>
          <Col span={12}>
            <Typography.Text strong>Contact:</Typography.Text>
            <div>{staff.email}</div>
          </Col>
          <Col span={12}>
            <Typography.Text strong>Date:</Typography.Text>
            <div>{moment(selectedDate).format("dddd, MMMM Do, YYYY")}</div>
          </Col>
          <Col span={12}>
            <Typography.Text strong>Time:</Typography.Text>
            <div>{selectedTimeSlot}</div>
          </Col>
        </Row>
      </Card>
    );
  };

  if (!token || !userId) return null;

  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      {contextHolder}
      <style jsx global>{`
        .detail-page-header {
          background: linear-gradient(to right, #f0f7ff, #e6f0ff);
          border-radius: 16px;
          padding: 24px;
          box-shadow: 0 4px 16px rgba(0, 0, 0, 0.05);
          margin-bottom: 24px;
        }

        .staff-profile-image {
          width: 280px;
          height: 280px;
          border-radius: 12px;
          object-fit: cover;
          border: 4px solid white;
          box-shadow: 0 4px 16px rgba(0, 0, 0, 0.1);
          background-color: #f0f0f0;
        }

        .staff-name {
          font-size: 1.8rem;
          font-weight: 700;
          color: #2c3e76;
          margin-bottom: 8px;
        }

        .staff-title {
          font-size: 1.1rem;
          color: #6b7280;
          margin-bottom: 16px;
        }

        .staff-info-item {
          display: flex;
          align-items: center;
          margin-bottom: 8px;
        }

        .staff-info-item svg {
          margin-right: 8px;
          color: #3a57b9;
        }

        .date-selection {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(120px, 1fr));
          gap: 12px;
          margin-bottom: 24px;
        }

        .date-card {
          background: white;
          border-radius: 12px;
          padding: 16px 8px;
          text-align: center;
          cursor: pointer;
          transition: all 0.3s ease;
          border: 2px solid transparent;
          box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
        }

        .date-card-selected {
          border-color: #3a57b9;
          background-color: #edf2fd;
          box-shadow: 0 4px 12px rgba(58, 87, 185, 0.2);
          transform: translateY(-2px);
          position: relative;
          z-index: 1;
        }

        .date-card-selected::after {
          content: "";
          position: absolute;
          bottom: -8px;
          left: 50%;
          transform: translateX(-50%);
          width: 0;
          height: 0;
          border-left: 8px solid transparent;
          border-right: 8px solid transparent;
          border-top: 8px solid #edf2fd;
        }

        .date-card-available {
          border-color: #e6f7ef;
        }

        .date-card-unavailable {
          opacity: 0.7;
          cursor: not-allowed;
          background: #f5f5f5;
          border-color: #e0e0e0;
        }

        .date-card:hover:not(.date-card-unavailable):not(.date-card-selected) {
          border-color: #e6effc;
          transform: translateY(-2px);
        }

        .date-weekday {
          font-weight: 600;
          font-size: 0.9rem;
          color: #4b5563;
        }

        .date-day {
          font-weight: 700;
          font-size: 1.5rem;
          color: #1f2937;
          margin: 4px 0;
        }

        .date-month {
          font-size: 0.85rem;
          color: #6b7280;
        }

        .slot-badge {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          background: #f3f4f6;
          color: #4b5563;
          border-radius: 12px;
          padding: 2px 8px;
          font-size: 0.75rem;
          margin-top: 6px;
        }

        .time-slots-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(140px, 1fr));
          gap: 12px;
          margin-bottom: 24px;
        }

        .time-slot {
          padding: 12px;
          border: 1px solid #d9d9d9;
          border-radius: 8px;
          text-align: center;
          display: flex;
          justify-content: center;
          align-items: center;
          flex-wrap: wrap;
          transition: all 0.3s;
        }

        .time-slot:hover:not(.time-slot-locked) {
          background-color: #f0f0f0;
          transform: translateY(-2px);
        }

        .time-slot-selected {
          background-color: #e6f7ff;
          border-color: #1890ff;
          box-shadow: 0 0 5px rgba(24, 144, 255, 0.5);
        }

        .time-slot-locked {
          opacity: 0.7;
          background-color: #f5f5f5;
          border-color: #d9d9d9;
          pointer-events: none; /* Ngăn cản tương tác dù có set onclick */
        }

        .reason-textarea {
          border-radius: 12px;
          box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
          border-color: #e5e7eb;
          transition: all 0.3s ease;
          resize: none;
        }

        .reason-textarea:focus {
          border-color: #3b82f6;
          box-shadow: 0 0 0 2px rgba(59, 130, 246, 0.2);
        }

        .action-button {
          height: 48px;
          border-radius: 12px;
          font-weight: 500;
          font-size: 1rem;
          box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
          transition: all 0.3s ease;
        }

        .action-button:hover {
          transform: translateY(-2px);
        }

        .primary-button {
          background: linear-gradient(135deg, #3551a5, #5073e5);
          border: none;
        }

        .primary-button:hover {
          background: linear-gradient(135deg, #2c4586, #4566d8);
          box-shadow: 0 4px 12px rgba(58, 87, 185, 0.3);
        }

        .section-title {
          font-size: 1.3rem;
          font-weight: 600;
          color: #1f2937;
          margin-bottom: 16px;
          padding-bottom: 8px;
          border-bottom: 2px solid #f3f4f6;
        }

        .back-link {
          display: inline-flex;
          align-items: center;
          font-weight: 500;
          color: #4b5563;
          margin-bottom: 16px;
          transition: color 0.3s ease;
        }

        .back-link:hover {
          color: #3b82f6;
        }

        .back-link svg {
          margin-right: 8px;
        }

        @media (max-width: 768px) {
          .staff-profile-image {
            width: 120px;
            height: 120px;
          }

          .date-selection {
            grid-template-columns: repeat(auto-fill, minmax(100px, 1fr));
          }

          .time-slots-grid {
            grid-template-columns: repeat(auto-fill, minmax(120px, 1fr));
          }
        }

        .countdown-timer {
          background-color: #f9f9f9;
          border-radius: 12px;
          padding: 12px;
          display: inline-block;
          box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
          border: 1px solid #e6e6e6;
          margin-bottom: 16px;
        }

        .countdown-value {
          font-size: 1.8rem;
          font-weight: bold;
          color: #2c3e76;
          margin-bottom: 4px;
        }

        .countdown-label {
          font-size: 0.9rem;
          color: #666;
        }

        /* Add countdown animation when time is running low */
        @keyframes pulse {
          0% {
            transform: scale(1);
          }
          50% {
            transform: scale(1.05);
          }
          100% {
            transform: scale(1);
          }
        }

        .countdown-timer:has(.text-red-500) {
          animation: pulse 1s infinite;
          background-color: #fff5f5;
          border-color: #fed7d7;
        }

        .hide-scrollbar::-webkit-scrollbar {
          display: none;
        }

        .date-card-selected {
          transform: translateY(-3px);
          transition: all 0.3s ease;
        }
      `}</style>

      <div className="container mx-auto px-4 py-8">
        <a href="/schedule-appointment" className="back-link">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="16"
            height="16"
            fill="currentColor"
            viewBox="0 0 16 16"
          >
            <path
              fillRule="evenodd"
              d="M11.354 1.646a.5.5 0 0 1 0 .708L5.707 8l5.647 5.646a.5.5 0 0 1-.708.708l-6-6a.5.5 0 0 1 0-.708l6-6a.5.5 0 0 1 .708 0z"
            />
          </svg>
          Back to all healthcare staff
        </a>

        <div className="detail-page-header">
          <Row gutter={24} align="middle">
            <Col xs={24} sm={10} md={8} className="text-center">
              <img
                src={staff.imageURL || "/images/placeholder.jpg"}
                alt={staff.fullName}
                className="staff-profile-image mx-auto"
              />
            </Col>
            <Col xs={24} sm={14} md={16}>
              <h1 className="staff-name">{staff.fullName}</h1>
              <p className="staff-title">University Healthcare Officer</p>
              <p className="text-gray-700 text-sm mt-2">
                <span className="font-semibold">Role:</span> {staff.fullName}{" "}
                provides health support services to students and staff,
                specializing in wellness checks, health advice, and
                university-specific health programs.
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
              <p className="text-gray-600 text-sm mt-2">
                Free for university members
              </p>
            </Col>
          </Row>
        </div>

        {/* Date Selection Section */}
        <div className="mb-10">
          <h2 className="section-title">
            <CalendarOutlined style={{ marginRight: 8 }} />
            Select Appointment Date
          </h2>

          {workScheduleLoading ? (
            <div className="text-center py-8">
              <Spin size="large" />
              <Text className="block mt-4">Loading available dates...</Text>
            </div>
          ) : (
            <div className="date-selection">
              {(() => {
                const dates = [];
                const today = moment().startOf("day");
                // Get dates for a full month (today + 30 days)
                const endDate = moment().add(30, "days").startOf("day");

                // Loop through each day in the range
                let currentDate = today.clone();
                while (currentDate.isSameOrBefore(endDate)) {
                  // Skip Sundays
                  if (currentDate.day() !== 0) {
                    dates.push(currentDate.format("YYYY-MM-DD"));
                  }
                  currentDate.add(1, "days");
                }

                return dates.map((date, index) => {
                  const isAvailable = isDateAvailable(date);
                  const hasSlots =
                    slotCounts[date] !== null && (slotCounts[date] ?? 0) > 0;
                  const isSelected = selectedDate === date;
                  const isCurrentDateHovered = hoveredIndex === date;

                  return (
                    <div
                      key={index}
                      style={dateCardStyle(date, isAvailable && hasSlots)}
                      onClick={() =>
                        isAvailable && hasSlots && handleDateChange(index)
                      }
                      className={
                        date === selectedDate ? "date-card-selected" : ""
                      }
                    >
                      {!isAvailable && (
                        <div
                          style={{
                            position: "absolute",
                            top: "4px",
                            right: "4px",
                            width: "8px",
                            height: "8px",
                            borderRadius: "50%",
                            backgroundColor: "#d1d1d1",
                          }}
                        />
                      )}
                      <div className="date-weekday">
                        {moment(date).format("ddd")}
                      </div>
                      <div className="date-day">
                        {moment(date).format("DD")}
                      </div>
                      <div className="date-month">
                        {moment(date).format("MMM YYYY")}
                      </div>
                      {fetchingSlotCounts ? (
                        <div className="slot-badge">Loading...</div>
                      ) : (
                        <div
                          className="slot-badge"
                          style={{
                            backgroundColor: !isAvailable
                              ? "#f0f0f0"
                              : hasSlots
                              ? "#e6f7ef"
                              : "#fff2f0",
                          }}
                        >
                          {!isAvailable
                            ? "Unavailable"
                            : slotCounts[date] === null
                            ? "Checking..."
                            : (slotCounts[date] || 0) > 0
                            ? `${slotCounts[date]} slots`
                            : "No slots"}
                        </div>
                      )}
                    </div>
                  );
                });
              })()}
            </div>
          )}
        </div>

        {/* Time Slots Section */}
        <Card
          title="Select Time Slot"
          style={{ width: "100%" }}
          extra={
            availableSlots.length > 0 && (
              <Typography.Text type="secondary">
                {availableSlots.filter((slot) => slot.isAvailable).length} slot
                {availableSlots.filter((slot) => slot.isAvailable).length !== 1
                  ? "s"
                  : ""}{" "}
                available
              </Typography.Text>
            )
          }
        >
          {renderTimeSlots()}
        </Card>

        {/* Appointment Reason */}
        {selectedTimeSlot && (
          <>
            {renderAppointmentSummary()}

            <Card title="Appointment Reason" style={{ marginBottom: "20px" }}>
              <TextArea
                placeholder="Please briefly describe the reason for your appointment..."
                value={appointmentReason}
                onChange={(e) => setAppointmentReason(e.target.value)}
                rows={4}
                className="reason-textarea"
                disabled={isConfirmed}
                style={{ marginBottom: "15px" }}
              />

              {timeLeft !== null && !isConfirmed && !isConfirming && (
                <Alert
                  message={
                    <div style={{ textAlign: "center" }}>
                      <Typography.Title level={4} style={{ margin: 0 }}>
                        {timeLeft}
                      </Typography.Title>
                      <Typography.Text>
                        {timeLeft <= 5 ? (
                          <span
                            style={{ color: "#f5222d", fontWeight: "bold" }}
                          >
                            Seconds left to confirm!
                          </span>
                        ) : (
                          <span>Seconds left to confirm</span>
                        )}
                      </Typography.Text>
                    </div>
                  }
                  type={timeLeft <= 5 ? "error" : "info"}
                  showIcon
                  style={{ marginBottom: "15px" }}
                />
              )}

              <Row gutter={16} justify="end">
                <Col>
                  <Button
                    onClick={() => resetSelectionState()}
                    danger
                    style={{ width: 120 }}
                    disabled={isConfirming || isConfirmed}
                  >
                    Cancel
                  </Button>
                </Col>
                <Col>
                  <Button
                    type="primary"
                    onClick={handleConfirmAppointment}
                    loading={isConfirming}
                    disabled={
                      !appointmentId ||
                      appointmentReason.trim().length < 3 ||
                      isConfirmed
                    }
                    style={{ width: 200 }}
                  >
                    {isConfirmed
                      ? "Appointment Confirmed"
                      : "Confirm Appointment"}
                  </Button>
                </Col>
              </Row>
            </Card>
          </>
        )}

        {isConfirmed && (
          <div className="text-center bg-green-50 p-8 rounded-xl border border-green-200 mb-10">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="mx-auto h-16 w-16 text-green-500 mb-4"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
            <Title level={3} style={{ color: "#065f46" }}>
              Appointment Confirmed!
            </Title>
            <Text>
              Your appointment has been successfully scheduled. Please check
              your email for confirmation details.
            </Text>
          </div>
        )}
      </div>

      {/* Conflict Modal */}
      <ConflictModal
        open={isConflictModalVisible}
        existingAppointment={conflictAppointment}
        currentStaffName={conflictAppointment?.staffName || "Unknown Staff"}
        newStaffName={staff.fullName}
        newDate={selectedDate}
        newTimeSlot={intendedTimeSlot}
        loading={conflictLoading}
        onCancel={handleConflictCancel}
        onConfirm={handleConflictConfirm}
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
