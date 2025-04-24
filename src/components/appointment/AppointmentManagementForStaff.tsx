import React, {
  useState,
  useEffect,
  useCallback,
  useMemo,
  useContext,
} from "react";
import {
  Button,
  Input,
  DatePicker,
  Popconfirm,
  Space,
  Row,
  Col,
  Card,
  Typography,
  Tag,
  Tooltip,
  Spin,
  Collapse,
  Tabs,
  Dropdown,
  MenuProps,
  Modal,
  Badge,
  Form,
  Select,
  Empty,
  message,
  Divider,
  Result,
} from "antd";
import dayjs, { Dayjs } from "dayjs";
import isBetween from "dayjs/plugin/isBetween";
import Cookies from "js-cookie";
import { useRouter } from "next/router";
import {
  getAppointmentsByStaffId,
  AppointmentResponseDTO,
  PagedResultDTO,
  cancelAppointmentForStaff,
  confirmCompletion,
  confirmAttendance,
  confirmAbsence,
  updateUserAppointmentStatusToNormal,
  scheduleAppointmentForHealthcareStaff,
  AppointmentCreateRequestForstaffDTO,
  getAvailableTimeSlots,
  TimeSlotDTO,
  AppointmentUpdateRequestDTO,
  updateAppointmentByStaff,
} from "@/api/appointment-api";
import {
  SearchOutlined,
  CheckCircleOutlined,
  CloseCircleOutlined,
  ClockCircleOutlined,
  PlayCircleOutlined,
  CheckCircleFilled,
  CloseCircleFilled,
  StopOutlined,
  DownloadOutlined,
  CalendarOutlined,
  ReloadOutlined,
  DownOutlined,
  EllipsisOutlined,
  InfoCircleOutlined,
  UserSwitchOutlined,
  FilterOutlined,
  FormOutlined,
  PlusCircleOutlined,
  AppstoreOutlined,
  LoadingOutlined,
  EditOutlined,
} from "@ant-design/icons";
import { UserContext } from "@/context/UserContext";
import AppointmentUserDetails from "./AppointmentUserDetails";
import jwtDecode from "jwt-decode";
import moment from "moment-timezone";
import debounce from "lodash/debounce";
import StaffScheduleCalendarModal from "./StaffScheduleCalendarModal";
import { getStaffSchedulesByDateRange } from "@/api/schedule";
import { getAllUsers, UserResponseDTO } from "@/api/user";

const styles = `
  @keyframes blink {
    0% { border-color: #ffa940; }
    50% { border-color: #ffec99; }
    100% { border-color: #ffa940; }
  }

  .blinking-border {
    animation: blink 1s infinite;
    border-width: 2px;
    border-style: solid;
  }

  .filter-section {
    background: #f9f9f9;
    border-radius: 8px;
    padding: 12px;
    box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
  }

  .search-input {
    border-radius: 20px !important;
    box-shadow: 0 2px 5px rgba(0, 0, 0, 0.05);
  }
`;

dayjs.extend(isBetween);

const { RangePicker } = DatePicker;
const { Title, Text } = Typography;
const { Option } = Select;

const formatDate = (datetime: string | undefined) =>
  datetime ? dayjs(datetime).format("DD/MM/YYYY") : "N/A";

const formatTime = (datetime: string | undefined) =>
  datetime ? dayjs(datetime).format("HH:mm") : "N/A";

const getStatusColor = (status: string | undefined) => {
  switch (status) {
    case "Scheduled":
      return "blue";
    case "Happening":
      return "orange";
    case "Finished":
      return "green";
    case "Missed":
      return "red";
    case "Cancelled":
    case "CancelledAfterConfirm":
      return "gray";
    default:
      return "default";
  }
};

const getStatusIcon = (status: string | undefined) => {
  switch (status) {
    case "Scheduled":
      return <ClockCircleOutlined />;
    case "Happening":
      return <PlayCircleOutlined />;
    case "Finished":
      return <CheckCircleFilled />;
    case "Missed":
      return <CloseCircleFilled />;
    case "Cancelled":
    case "CancelledAfterConfirm":
      return <StopOutlined />;
    default:
      return null;
  }
};

const getStatusTooltip = (status: string | undefined) => {
  switch (status) {
    case "Scheduled":
      return "Upcoming appointment.";
    case "Happening":
      return "Currently in progress.";
    case "Finished":
      return "Completed.";
    case "Missed":
      return "Not attended.";
    case "Cancelled":
    case "CancelledAfterConfirm":
      return "Cancelled appointment.";
    default:
      return "";
  }
};

// UpdateAppointmentModal Component
const UpdateAppointmentModal: React.FC<{
  visible: boolean;
  onClose: () => void;
  appointment: AppointmentResponseDTO | null;
  onUpdateSuccess: () => void;
}> = ({ visible, onClose, appointment, onUpdateSuccess }) => {
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const [availableSlots, setAvailableSlots] = useState<TimeSlotDTO[]>([]);
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const token = Cookies.get("token");
  const [messageApi, contextHolder] = message.useMessage();
  const [successModalVisible, setSuccessModalVisible] = useState(false);
  
  // Staff work schedule related states
  const [calendarModalVisible, setCalendarModalVisible] = useState(false);
  const [staffWorkSchedules, setStaffWorkSchedules] = useState<any[]>([]);
  const [availableWorkDates, setAvailableWorkDates] = useState<Set<string>>(
    new Set()
  );
  const [workScheduleLoading, setWorkScheduleLoading] = useState(false);
  const [selectedDateSchedule, setSelectedDateSchedule] = useState<any | null>(
    null
  );
  // Add a ref to track initialization
  const initializedRef = React.useRef(false);

  // Max date for scheduling (1 month from now)
  const maxDate = dayjs().add(30, "days");

  // All possible time slots
  const allPossibleTimeSlots = [
    "08:00 - 08:30",
    "08:30 - 09:00",
    "09:00 - 09:30",
    "09:30 - 10:00",
    "10:00 - 10:30",
    "10:30 - 11:00",
    "11:00 - 11:30",
    "11:30 - 12:00",
    "13:00 - 13:30",
    "13:30 - 14:00",
    "14:00 - 14:30",
    "14:30 - 15:00",
    "15:00 - 15:30",
    "15:30 - 16:00",
    "16:00 - 16:30",
    "16:30 - 17:00",
  ];

  // Reset state when modal closes
  useEffect(() => {
    if (!visible) {
      initializedRef.current = false;
    }
  }, [visible]);

  // Fetch staff work schedules
  const fetchStaffWorkSchedules = useCallback(async () => {
    if (!token || !appointment?.staffId) return;

    setWorkScheduleLoading(true);
    try {
      const startDate = dayjs().format("YYYY-MM-DD");
      const endDate = dayjs().add(30, "days").format("YYYY-MM-DD");

      console.log(`Fetching staff schedule for ${appointment.staffId} from ${startDate} to ${endDate}`);
      
      const response = await getStaffSchedulesByDateRange(
        appointment.staffId,
        startDate,
        endDate
      );

      if (response.isSuccess && Array.isArray(response.data)) {
        console.log(`Found ${response.data.length} work schedules for staff`);
        setStaffWorkSchedules(response.data);

        // Extract available work dates
        const workDates = new Set<string>(
          response.data.map((schedule: any) =>
            dayjs(schedule.workDate).format("YYYY-MM-DD")
          )
        );
        setAvailableWorkDates(workDates);

        // Check if the appointment date is in the staff's work schedule
        const appointmentDateStr = dayjs(appointment.appointmentDate).format("YYYY-MM-DD");
        if (!workDates.has(appointmentDateStr)) {
          console.log(`Warning: Current appointment date (${appointmentDateStr}) is not in staff work schedule`);
          messageApi.warning("Current appointment date is not in staff work schedule. You may need to select a new date.");
        }

        // After loading work schedule, proceed with loading available slots if needed
        if (selectedDate && !initializedRef.current) {
          initializedRef.current = true;
          
          // Even if date is not in work dates, we still want to load it for the current appointment
          if (selectedDate === appointmentDateStr || workDates.has(selectedDate)) {
            fetchAvailableSlots(selectedDate);
          }
        }
      } else {
        console.error(
          "Failed to fetch staff work schedules:",
          response.message
        );
        messageApi.error("Failed to load staff work schedule");
      }
    } catch (error) {
      console.error("Error fetching staff work schedules:", error);
      messageApi.error("Failed to load staff work schedule");
    } finally {
      setWorkScheduleLoading(false);
    }
  }, [appointment, token, messageApi, selectedDate]);

  // Filter time slots based on staff work schedule
  const filterTimeSlotsByShift = useCallback(
    (date: string) => {
      if (!staffWorkSchedules.length) {
        console.log("No staff work schedules found to filter time slots");
        return [];
      }

      // Find the work schedule for the selected date
      const dateSchedule = staffWorkSchedules.find(
        (schedule) => dayjs(schedule.workDate).format("YYYY-MM-DD") === date
      );

      // Special case: if this is the current appointment date but no schedule found,
      // we want to handle it differently to allow the current time slot
      const isCurrentAppointmentDate = appointment && 
        date === dayjs(appointment.appointmentDate).format("YYYY-MM-DD");

      if (!dateSchedule) {
        console.log(`No work schedule found for date ${date}${isCurrentAppointmentDate ? " (current appointment date)" : ""}`);
        
        // If this is the current appointment date, return all slots to ensure the current one is available
        if (isCurrentAppointmentDate) {
          console.log("Allowing all time slots for current appointment date");
          return allPossibleTimeSlots;
        }
        
        return [];
      }

      setSelectedDateSchedule(dateSchedule);

      // Get shift start and end times
      const shiftStartTime = dateSchedule.startTime; // Format: "9:00 AM"
      const shiftEndTime = dateSchedule.endTime; // Format: "1:00 PM"

      if (!shiftStartTime || !shiftEndTime) {
        console.log("Missing shift start or end time");
        return [];
      }

      // Convert time from AM/PM format to minutes for comparison
      const convertTimeToMinutes = (timeStr: string) => {
        const [timePart, ampm] = timeStr.split(" ");
        let [hours, minutes] = timePart.split(":").map(Number);

        if (ampm.toUpperCase() === "PM" && hours < 12) {
          hours += 12;
        } else if (ampm.toUpperCase() === "AM" && hours === 12) {
          hours = 0;
        }

        return hours * 60 + minutes;
      };

      const shiftStartMinutes = convertTimeToMinutes(shiftStartTime);
      const shiftEndMinutes = convertTimeToMinutes(shiftEndTime);

      console.log(`Shift time: ${shiftStartTime} - ${shiftEndTime}`);
      console.log(`Shift minutes: ${shiftStartMinutes} - ${shiftEndMinutes}`);

      // Filter time slots that fall within the staff's shift
      const filteredSlots = allPossibleTimeSlots.filter((slot) => {
        const [slotStart] = slot.split(" - ");
        const [slotEnd] = slot.split(" - ")[1].split(" ");

        const parseTimeToMinutes = (timeStr: string) => {
          const [hours, minutes] = timeStr.split(":").map(Number);
          return hours * 60 + minutes;
        };

        const slotStartMinutes = parseTimeToMinutes(slotStart);
        const slotEndMinutes = parseTimeToMinutes(slotEnd);

        // Be a bit more lenient with the end time (allow slots ending exactly at shift end)
        const isWithinShift = 
          slotStartMinutes >= shiftStartMinutes &&
          slotEndMinutes <= shiftEndMinutes;
        
        return isWithinShift;
      });

      console.log(`Filtered ${allPossibleTimeSlots.length} slots down to ${filteredSlots.length} slots`);
      
      // Special case: For current appointment date, make sure we're not filtering too strictly
      if (isCurrentAppointmentDate && filteredSlots.length === 0) {
        console.log("No slots available within shift for current appointment date, returning all possible slots");
        return allPossibleTimeSlots;
      }
      
      return filteredSlots;
    },
    [staffWorkSchedules, appointment]
  );

  const fetchAvailableSlots = useCallback(
    async (date: string) => {
      if (!token || !appointment?.staffId) return;
      setLoading(true);
      try {
        // Fetch available time slots from the API
        const response = await getAvailableTimeSlots(
          appointment.staffId,
          date,
          token
        );

        console.log("API returned available slots:", response.data?.availableSlots);

        // Get time slots based on staff work schedule
        const shiftsTimeSlots = filterTimeSlotsByShift(date);
        console.log("Slots within staff shift:", shiftsTimeSlots);

        // Get the current appointment time slot to ensure it's available for selection
        let currentAppointmentTimeSlot = null;
        if (appointment && date === dayjs(appointment.appointmentDate).format("YYYY-MM-DD")) {
          currentAppointmentTimeSlot = `${moment(appointment.appointmentDate).format("HH:mm")} - ${moment(appointment.endTime).format("HH:mm")}`;
          console.log(`Current appointment slot: ${currentAppointmentTimeSlot}`);
        }

        // Filter API slots based on staff work schedule
        let filteredSlots = response.data?.availableSlots.filter((slot) =>
          shiftsTimeSlots.includes(slot.timeSlot)
        ) || [];

        // Add the current appointment's time slot if it's not already included
        // This ensures the current slot is always available for selection when editing
        if (currentAppointmentTimeSlot && 
            !filteredSlots.some(slot => slot.timeSlot === currentAppointmentTimeSlot)) {
          console.log("Adding current appointment slot back to available slots");
          
          const existingSlot = response.data?.availableSlots.find(
            slot => slot.timeSlot === currentAppointmentTimeSlot
          );
          
          if (existingSlot) {
            filteredSlots.push(existingSlot);
          } else {
            // If not found in API response, create a pseudo-slot for the current appointment
            filteredSlots.push({
              timeSlot: currentAppointmentTimeSlot,
              isAvailable: true,
              isLocked: false
            } as TimeSlotDTO);
          }
        }

        console.log(`Final filtered slots: ${filteredSlots.length} slots available`);
        setAvailableSlots(filteredSlots);

        if (filteredSlots.length === 0) {
          if (shiftsTimeSlots.length > 0) {
            messageApi.warning(
              "No available time slots within staff working hours for this date. Consider choosing another date."
            );
          } else {
            messageApi.warning(
              "Staff is not scheduled to work on this date. Please select a different date."
            );
          }
        }
      } catch (error: any) {
        console.error("Failed to fetch slots:", error);
        messageApi.error("Failed to load available slots.");
      } finally {
        setLoading(false);
      }
    },
    [appointment, token, messageApi, filterTimeSlotsByShift]
  );

  // Load initial data when modal opens
  useEffect(() => {
    if (appointment && visible && !initializedRef.current) {
      // Set initial date from appointment
      const appointmentDate = moment(appointment.appointmentDate);
      const dateStr = appointmentDate.format("YYYY-MM-DD");
      setSelectedDate(dateStr);
      
      // Set form values with existing appointment data
      const timeSlot = `${moment(appointment.appointmentDate).format(
        "HH:mm"
      )} - ${moment(appointment.endTime).format("HH:mm")}`;
      
      form.setFieldsValue({
        email: appointment.studentEmail,
        date: dateStr,
        timeSlot: timeSlot,
        reason: appointment.reason,
        status: appointment.status,
      });
      
      console.log(`Initial appointment time slot: ${timeSlot}`);
      
      // Load staff work schedules - slots will be loaded after this completes
      fetchStaffWorkSchedules();
    }
  }, [appointment, visible, form, fetchStaffWorkSchedules]);

  const isDateDisabled = (current: dayjs.Dayjs) => {
    // Disable dates before today or after 1 month
    if (current.isBefore(dayjs().startOf("day")) || current.isAfter(maxDate)) {
      return true;
    }

    // If still loading work schedule, disable all dates
    if (workScheduleLoading) {
      return true;
    }

    // Check if the date is in the staff's work schedule
    const dateStr = current.format("YYYY-MM-DD");
    return !availableWorkDates.has(dateStr);
  };

  const openCalendarModal = () => {
    setCalendarModalVisible(true);
  };

  const handleCalendarDateSelect = (date: Date) => {
    const selectedDateStr = dayjs(date).format("YYYY-MM-DD");
    
    // Only fetch if the date actually changed
    if (selectedDateStr !== selectedDate) {
      setSelectedDate(selectedDateStr);
      form.setFieldValue("date", selectedDateStr);
      fetchAvailableSlots(selectedDateStr);
    }
    
    setCalendarModalVisible(false);
  };

  const onDateChange = (date: moment.Moment | null) => {
    if (date) {
      const dateStr = date.format("YYYY-MM-DD");
      
      // Check if this is a work day for the staff
      if (!availableWorkDates.has(dateStr)) {
        messageApi.warning(
          `Staff is not scheduled to work on ${date.format("DD/MM/YYYY")}.`
        );
        return;
      }
      
      // Only fetch if the date actually changed
      if (dateStr !== selectedDate) {
        setSelectedDate(dateStr);
        form.setFieldValue("date", dateStr);
        fetchAvailableSlots(dateStr);
      }
    } else {
      setSelectedDate(null);
      setAvailableSlots([]);
      setSelectedDateSchedule(null);
    }
  };

  const onFinish = async (values: any) => {
    if (!token || !appointment) {
      messageApi.error("Authentication token or appointment data missing.");
      return;
    }

    setLoading(true);
    try {
      const [startTime] = values.timeSlot.split(" - ");
      const vietnamMoment = moment.tz(
        `${selectedDate} ${startTime}`,
        "YYYY-MM-DD HH:mm",
        "Asia/Ho_Chi_Minh"
      );
      const appointmentDate = vietnamMoment.format("YYYY-MM-DDTHH:mm:ssZ");

      const request: AppointmentUpdateRequestDTO = {
        id: appointment.id,
        userId: appointment.userId,
        staffId: appointment.staffId,
        appointmentDate,
        reason: values.reason,
        status: values.status,
        sendEmailToUser: true,
        sendNotificationToUser: true,
        sendEmailToStaff: true,
        sendNotificationToStaff: true,
      };

      const response = await updateAppointmentByStaff(
        appointment.id,
        token,
        request
      );
      if (response.isSuccess) {
        // Close the main modal first
        onClose();
        
        // Show a success message in addition to the modal
        messageApi.success({
          content: "Appointment updated successfully!",
          duration: 5,
          style: { marginTop: '50px' },
        });
        
        // Then show the success modal
        setSuccessModalVisible(true);
        
        // Refresh parent data
        onUpdateSuccess();
      } else {
        messageApi.error(
          `Failed to update: ${response.message || "Unknown error"}`
        );
      }
    } catch (error: any) {
      console.error("Error updating appointment:", error);
      messageApi.error("Failed to update appointment.");
    } finally {
      setLoading(false);
    }
  };

  const handleSuccessModalClose = () => {
    setSuccessModalVisible(false);
  };

  return (
    <>
      {/* Main Form Modal */}
      <Modal
        title={<Title level={4}>Update Appointment</Title>}
        open={visible}
        onCancel={onClose}
        footer={null}
        width={600}
        destroyOnClose={true}
      >
        {contextHolder}
        <Form
          form={form}
          layout="vertical"
          onFinish={onFinish}
          initialValues={{ status: "Scheduled" }}
        >
          <Form.Item
            name="email"
            label="Student/User Email"
            rules={[
              {
                required: true,
                message: "Please enter the student/user Email",
              },
            ]}
          >
            <Input placeholder="Enter student/user Email" disabled />
          </Form.Item>

          <Form.Item
            label="Date"
            required
            name="date"
            rules={[{ required: true, message: "Please select a date" }]}
          >
            <Button
              type="default"
              onClick={openCalendarModal}
              disabled={workScheduleLoading}
              icon={<CalendarOutlined />}
              style={{
                width: "100%",
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
              }}
            >
              {selectedDate
                ? dayjs(selectedDate).format("DD/MM/YYYY")
                : "Select date"}
              <div>{workScheduleLoading && <Spin size="small" />}</div>
            </Button>
          </Form.Item>

          {selectedDateSchedule && (
            <div
              style={{
                marginBottom: "16px",
                padding: "8px",
                backgroundColor: "#f0f5ff",
                borderRadius: "6px",
                border: "1px solid #d6e4ff",
              }}
            >
              <div
                style={{
                  fontSize: "12px",
                  color: "#1890ff",
                  fontWeight: "500",
                }}
              >
                Work Schedule:
              </div>
              <div style={{ fontSize: "14px", marginTop: "4px" }}>
                <strong>Shift:</strong> {selectedDateSchedule.shiftName}
              </div>
              <div style={{ fontSize: "14px" }}>
                <strong>Time:</strong> {selectedDateSchedule.startTime} -{" "}
                {selectedDateSchedule.endTime}
              </div>
            </div>
          )}

          <Form.Item
            name="timeSlot"
            label="Time Slot"
            rules={[{ required: true, message: "Please select a time slot" }]}
          >
            <Select
              placeholder="Select a time slot"
              disabled={!selectedDate || loading}
              loading={loading}
              notFoundContent={
                loading ? (
                  <Spin size="small" />
                ) : (
                  <Empty description="No available time slots" />
                )
              }
            >
              {availableSlots
                .filter((slot) => slot.isAvailable && !slot.isLocked)
                .map((slot) => (
                  <Option key={slot.timeSlot} value={slot.timeSlot}>
                    {slot.timeSlot}
                  </Option>
                ))}
            </Select>
          </Form.Item>

          <Form.Item
            name="reason"
            label="Reason"
            rules={[{ required: true, message: "Please enter a reason" }]}
          >
            <Input.TextArea
              rows={3}
              placeholder="Enter reason for appointment"
            />
          </Form.Item>

          <Form.Item
            name="status"
            label="Status"
            rules={[{ required: true, message: "Please select a status" }]}
          >
            <Select placeholder="Select appointment status">
              <Option value="Scheduled">Scheduled</Option>
              <Option value="Happening">Happening</Option>
              <Option value="Finished">Finished</Option>
              <Option value="Missed">Missed</Option>
              <Option value="Cancelled">Cancelled</Option>
            </Select>
          </Form.Item>

          <Form.Item>
            <Button type="primary" htmlType="submit" loading={loading} block>
              Update Appointment
            </Button>
          </Form.Item>
        </Form>
        
        <StaffScheduleCalendarModal
          open={calendarModalVisible}
          onClose={() => setCalendarModalVisible(false)}
          staffId={appointment?.staffId || ''}
          availableWorkDates={availableWorkDates}
          onDateSelect={handleCalendarDateSelect}
          isDateDisabled={isDateDisabled}
        />
      </Modal>

      {/* Success Modal - Separate from the main modal */}
      <Modal
        open={successModalVisible}
        onCancel={handleSuccessModalClose}
        footer={[
          <Button key="close" type="primary" onClick={handleSuccessModalClose}>
            Close
          </Button>,
        ]}
        width={500}
        destroyOnClose={true}
      >
        <Result
          status="success"
          title="Appointment Updated Successfully!"
          subTitle="The appointment has been updated and notifications have been sent."
        />
      </Modal>
    </>
  );
};

// ScheduleAppointmentForStaff Component
const ScheduleAppointmentForStaff: React.FC<{
  visible: boolean;
  onClose: () => void;
  staffId: string;
  onSuccessfulSchedule?: () => void;
}> = ({ visible, onClose, staffId, onSuccessfulSchedule }) => {
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const [availableSlots, setAvailableSlots] = useState<TimeSlotDTO[]>([]);
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const token = Cookies.get("token");
  const [messageApi, contextHolder] = message.useMessage();
  const [successModalVisible, setSuccessModalVisible] = useState(false);
  const [selectedUserEmail, setSelectedUserEmail] = useState<string | null>(null);
  const [activeUsers, setActiveUsers] = useState<any[]>([]);
  const [loadingUsers, setLoadingUsers] = useState(false);

  // Staff work schedule related states
  const [calendarModalVisible, setCalendarModalVisible] = useState(false);
  const [staffWorkSchedules, setStaffWorkSchedules] = useState<any[]>([]);
  const [availableWorkDates, setAvailableWorkDates] = useState<Set<string>>(new Set());
  const [workScheduleLoading, setWorkScheduleLoading] = useState(false);
  const [selectedDateSchedule, setSelectedDateSchedule] = useState<any | null>(null);

  // Max date for scheduling (1 month from now)
  const maxDate = dayjs().add(30, "days");

  // All possible time slots
  const allPossibleTimeSlots = [
    "08:00 - 08:30",
    "08:30 - 09:00",
    "09:00 - 09:30",
    "09:30 - 10:00",
    "10:00 - 10:30",
    "10:30 - 11:00",
    "11:00 - 11:30",
    "11:30 - 12:00",
    "13:00 - 13:30",
    "13:30 - 14:00",
    "14:00 - 14:30",
    "14:30 - 15:00",
    "15:00 - 15:30",
    "15:30 - 16:00",
    "16:00 - 16:30",
    "16:30 - 17:00",
  ];

  // Fetch active users for selection
  const fetchActiveUsers = useCallback(
    async (searchEmail: string = "") => {
      if (!token) return;

      setLoadingUsers(true);
      try {
        // Using the actual API to get users for appointment scheduling
        // This replaces the previous mock implementation
        const response = await getAllUsers(
          1, // page
          1000, // pageSize - large number to get as many as possible
          undefined, // fullNameSearch
          undefined, // userNameSearch
          searchEmail || undefined, // emailSearch - used for search functionality
          undefined, // phoneSearch
          undefined, // roleFilter - not filtering by role here
          undefined, // genderFilter
          undefined, // dobStartDate
          undefined, // dobEndDate
          undefined, // createdStartDate
          undefined, // createdEndDate
          undefined, // updatedStartDate
          undefined, // updatedEndDate
          "Active", // status - only active users
          "CreatedAt", // sortBy
          false // ascending
        );

        if (response.isSuccess && response.data) {
          // Filter out users with Canteen Staff role if needed
          const filteredUsers = response.data.filter(
            (user: UserResponseDTO) => !user.roles?.includes("Canteen Staff")
          );

          const options = filteredUsers.map((user: UserResponseDTO) => ({
            value: user.email,
            label: `${user.fullName} (${user.email})`,
          }));
          setActiveUsers(options);
        } else {
          messageApi.error("Failed to load users");
        }
      } catch (error: any) {
        console.error("Failed to fetch users:", error);
        messageApi.error("Failed to load users");
      } finally {
        setLoadingUsers(false);
      }
    },
    [token, messageApi]
  );

  // Fetch staff work schedules
  const fetchStaffWorkSchedules = useCallback(async () => {
    if (!token) return;

    setWorkScheduleLoading(true);
    try {
      const startDate = dayjs().format("YYYY-MM-DD");
      const endDate = dayjs().add(30, "days").format("YYYY-MM-DD");

      console.log(`Fetching staff schedule for ${staffId} from ${startDate} to ${endDate}`);
      // messageApi.loading("Loading staff work schedule..."); // This line was causing the issue - removed

      const response = await getStaffSchedulesByDateRange(
        staffId,
        startDate,
        endDate
      );

      if (response.isSuccess && Array.isArray(response.data)) {
        console.log(`Found ${response.data.length} work schedules for staff`);
        setStaffWorkSchedules(response.data);

        // Extract available work dates
        const workDates = new Set<string>(
          response.data.map((schedule: any) =>
            dayjs(schedule.workDate).format("YYYY-MM-DD")
          )
        );
        setAvailableWorkDates(workDates);
      } else {
        console.error(
          "Failed to fetch staff work schedules:",
          response.message
        );
        messageApi.error("Failed to load staff work schedule");
      }
    } catch (error) {
      console.error("Error fetching staff work schedules:", error);
      messageApi.error("Failed to load staff work schedule");
    } finally {
      setWorkScheduleLoading(false);
    }
  }, [staffId, token, messageApi]);

  // Filter time slots based on staff work schedule
  const filterTimeSlotsByShift = useCallback(
    (date: string) => {
      if (!staffWorkSchedules.length) {
        console.log("No staff work schedules found to filter time slots");
        return [];
      }

      // Find the work schedule for the selected date
      const dateSchedule = staffWorkSchedules.find(
        (schedule) => dayjs(schedule.workDate).format("YYYY-MM-DD") === date
      );

      if (!dateSchedule) {
        console.log(`No work schedule found for date ${date}`);
        return [];
      }

      setSelectedDateSchedule(dateSchedule);

      // Get shift start and end times
      const shiftStartTime = dateSchedule.startTime; // Format: "9:00 AM"
      const shiftEndTime = dateSchedule.endTime; // Format: "1:00 PM"

      if (!shiftStartTime || !shiftEndTime) {
        console.log("Missing shift start or end time");
        return [];
      }

      // Convert time from AM/PM format to minutes for comparison
      const convertTimeToMinutes = (timeStr: string) => {
        const [timePart, ampm] = timeStr.split(" ");
        let [hours, minutes] = timePart.split(":").map(Number);

        if (ampm.toUpperCase() === "PM" && hours < 12) {
          hours += 12;
        } else if (ampm.toUpperCase() === "AM" && hours === 12) {
          hours = 0;
        }

        return hours * 60 + minutes;
      };

      const shiftStartMinutes = convertTimeToMinutes(shiftStartTime);
      const shiftEndMinutes = convertTimeToMinutes(shiftEndTime);

      console.log(`Shift time: ${shiftStartTime} - ${shiftEndTime}`);
      console.log(`Shift minutes: ${shiftStartMinutes} - ${shiftEndMinutes}`);

      // Filter time slots that fall within the staff's shift
      const filteredSlots = allPossibleTimeSlots.filter((slot) => {
        const [slotStart] = slot.split(" - ");
        const [slotEnd] = slot.split(" - ")[1].split(" ");

        const parseTimeToMinutes = (timeStr: string) => {
          const [hours, minutes] = timeStr.split(":").map(Number);
          return hours * 60 + minutes;
        };

        const slotStartMinutes = parseTimeToMinutes(slotStart);
        const slotEndMinutes = parseTimeToMinutes(slotEnd);

        // Be a bit more lenient with the end time (allow slots ending exactly at shift end)
        const isWithinShift = 
          slotStartMinutes >= shiftStartMinutes &&
          slotEndMinutes <= shiftEndMinutes;
        
        return isWithinShift;
      });

      console.log(`Filtered ${allPossibleTimeSlots.length} slots down to ${filteredSlots.length} slots`);
      return filteredSlots;
    },
    [staffWorkSchedules]
  );

  const fetchAvailableSlots = useCallback(
    async (date: string) => {
      if (!token) return;
      setLoading(true);
      try {
        // Fetch available time slots from the API
        const response = await getAvailableTimeSlots(staffId, date, token);

        console.log("API returned available slots:", response.data?.availableSlots);

        // Get time slots based on staff work schedule
        const shiftsTimeSlots = filterTimeSlotsByShift(date);
        console.log("Slots within staff shift:", shiftsTimeSlots);

        // Filter API slots based on staff work schedule
        const filteredSlots =
          response.data?.availableSlots.filter((slot) =>
            shiftsTimeSlots.includes(slot.timeSlot)
          ) || [];

        console.log(`Final filtered slots: ${filteredSlots.length} slots available`);
        setAvailableSlots(filteredSlots);

        if (filteredSlots.length === 0) {
          if (shiftsTimeSlots.length > 0) {
            messageApi.warning(
              "No available time slots within your working hours for this date. Consider choosing another date."
            );
          } else {
            messageApi.warning(
              "Staff is not scheduled to work on this date. Please select a different date."
            );
          }
        }
      } catch (error: any) {
        console.error("Failed to fetch slots:", error);
        messageApi.error("Failed to load available slots.");
      } finally {
        setLoading(false);
      }
    },
    [staffId, token, messageApi, filterTimeSlotsByShift]
  );

  useEffect(() => {
    if (visible) {
      // Load staff work schedules when the modal opens
      fetchStaffWorkSchedules();
      fetchActiveUsers();
    }
  }, [visible, fetchStaffWorkSchedules, fetchActiveUsers]);

  const onDateChange = (date: moment.Moment | null) => {
    if (date) {
      const dateStr = date.format("YYYY-MM-DD");

      // Check if this is a work day for the staff
      if (!availableWorkDates.has(dateStr)) {
        messageApi.warning(
          `You are not scheduled to work on ${date.format("DD/MM/YYYY")}.`
        );
        return;
      }

      setSelectedDate(dateStr);
      fetchAvailableSlots(dateStr);

      // Set form field value to display selected date
      form.setFieldValue("date", dateStr);
    } else {
      setSelectedDate(null);
      setAvailableSlots([]);
      setSelectedDateSchedule(null);
      form.setFieldValue("date", undefined);
    }
  };

  const isDateDisabled = (current: dayjs.Dayjs) => {
    // Disable dates before today or after 1 month
    if (current.isBefore(dayjs().startOf("day")) || current.isAfter(maxDate)) {
      return true;
    }

    // If still loading work schedule, disable all dates
    if (workScheduleLoading) {
      return true;
    }

    // Check if the date is in the staff's work schedule
    const dateStr = current.format("YYYY-MM-DD");
    return !availableWorkDates.has(dateStr);
  };

  const openCalendarModal = () => {
    setCalendarModalVisible(true);
  };

  const onFinish = async (values: any) => {
    if (!token) {
      messageApi.error("Authentication token missing.");
      return;
    }

    setLoading(true);
    try {
      const [startTime] = values.timeSlot.split(" - ");
      const vietnamMoment = moment.tz(
        `${selectedDate} ${startTime}`,
        "YYYY-MM-DD HH:mm",
        "Asia/Ho_Chi_Minh"
      );
      const appointmentDate = vietnamMoment.format("YYYY-MM-DDTHH:mm:ssZ");

      const request: AppointmentCreateRequestForstaffDTO = {
        staffId,
        email: values.email,
        appointmentDate,
        reason: values.reason,
        sendEmailToUser: true,
        sendNotificationToUser: true,
        sendEmailToStaff: true,
        sendNotificationToStaff: true,
        sessionId: null,
      };

      const response = await scheduleAppointmentForHealthcareStaff(
        request,
        token
      );
      if (response.isSuccess) {
        // Close the main modal first
        onClose();
        
        // Show a success message in addition to the modal
        messageApi.success({
          content: "Appointment scheduled successfully!",
          duration: 5,
          style: { marginTop: '50px' },
        });
        
        // Then show the success modal
        setSuccessModalVisible(true);
        
        // Call the callback to refresh the parent component
        if (onSuccessfulSchedule) {
          onSuccessfulSchedule();
        }
      } else {
        messageApi.error(
          `Failed to schedule: ${response.message || "Unknown error"}`
        );
      }
    } catch (error: any) {
      console.error("Error scheduling appointment:", error);
      messageApi.error("Failed to schedule appointment.");
    } finally {
      setLoading(false);
    }
  };

  const handleSuccessModalClose = () => {
    setSuccessModalVisible(false);
  };

  const handleClose = () => {
    setSelectedDate(null);
    setAvailableSlots([]);
    setStaffWorkSchedules([]);
    setAvailableWorkDates(new Set());
    setCalendarModalVisible(false);
    setSelectedDateSchedule(null);
    setSelectedUserEmail(null);
    form.resetFields();
    onClose();
  };

  const handleUserChange = (value: string) => {
    setSelectedUserEmail(value);
    form.setFieldValue("email", value);
  };

  // Filter user options when searching
  const handleUserSearch = (input: string, option: any) => {
    return option.label.toLowerCase().indexOf(input.toLowerCase()) >= 0;
  };

  const debouncedFetchUsers = useMemo(
    () => debounce((searchTerm: string) => fetchActiveUsers(searchTerm), 500),
    [fetchActiveUsers]
  );

  const handleCalendarDateSelect = (date: Date) => {
    const selectedDateStr = dayjs(date).format("YYYY-MM-DD");
    setSelectedDate(selectedDateStr);
    form.setFieldValue("date", selectedDateStr);
    fetchAvailableSlots(selectedDateStr);
    setCalendarModalVisible(false);
  };

  return (
    <>
      {contextHolder}
      {/* Main Form Modal */}
      <Modal
        title={
          <Typography.Title level={4}>
            Schedule Appointment with User
          </Typography.Title>
        }
        open={visible}
        onCancel={handleClose}
        footer={null}
        width={600}
        destroyOnClose={true}
      >
        <Form
          form={form}
          layout="vertical"
          onFinish={onFinish}
          initialValues={{ reason: "Health consultation" }}
        >
          <Form.Item
            name="email"
            label="User"
            rules={[
              {
                required: true,
                message: "Please enter the student/user Email",
              },
            ]}
          >
            <Select
              showSearch
              placeholder="Search and select a user"
              loading={loadingUsers}
              options={activeUsers}
              onChange={handleUserChange}
              onSearch={(value) => {
                // Debounce the search to avoid too many API calls
                if (value.length >= 2) {
                  // Only search if at least 2 characters
                  debouncedFetchUsers(value);
                }
              }}
              filterOption={false} // Disable client-side filtering to use server-side search
              notFoundContent={
                loadingUsers ? (
                  <Spin size="small" />
                ) : (
                  <Empty description="No users found" />
                )
              }
            />
          </Form.Item>

          <Form.Item
            label="Date"
            required
            name="date"
            rules={[{ required: true, message: "Please select a date" }]}
          >
            <Button
              type="default"
              onClick={openCalendarModal}
              disabled={workScheduleLoading}
              icon={<CalendarOutlined />}
              style={{
                width: "100%",
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
              }}
            >
              {selectedDate
                ? dayjs(selectedDate).format("DD/MM/YYYY")
                : "Select date"}
              <div>{workScheduleLoading && <Spin size="small" />}</div>
            </Button>
          </Form.Item>

          {selectedDateSchedule && (
            <div
              style={{
                marginBottom: "16px",
                padding: "8px",
                backgroundColor: "#f0f5ff",
                borderRadius: "6px",
                border: "1px solid #d6e4ff",
              }}
            >
              <div
                style={{
                  fontSize: "12px",
                  color: "#1890ff",
                  fontWeight: "500",
                }}
              >
                Work Schedule:
              </div>
              <div style={{ fontSize: "14px", marginTop: "4px" }}>
                <strong>Shift:</strong> {selectedDateSchedule.shiftName}
              </div>
              <div style={{ fontSize: "14px" }}>
                <strong>Time:</strong> {selectedDateSchedule.startTime} -{" "}
                {selectedDateSchedule.endTime}
              </div>
            </div>
          )}

          <Form.Item
            name="timeSlot"
            label="Time Slot"
            rules={[{ required: true, message: "Please select a time slot" }]}
          >
            <Select
              placeholder="Select a time slot"
              disabled={!selectedDate || loading}
              loading={loading}
              notFoundContent={
                loading ? (
                  <Spin size="small" />
                ) : (
                  <Empty description="No available time slots" />
                )
              }
            >
              {availableSlots
                .filter((slot) => slot.isAvailable && !slot.isLocked)
                .map((slot) => (
                  <Select.Option key={slot.timeSlot} value={slot.timeSlot}>
                    {slot.timeSlot}
                  </Select.Option>
                ))}
            </Select>
          </Form.Item>

          <Form.Item
            name="reason"
            label="Reason"
            rules={[{ required: true, message: "Please enter a reason" }]}
          >
            <Input.TextArea
              rows={3}
              placeholder="Enter reason for appointment"
            />
          </Form.Item>

          <Form.Item>
            <Button type="primary" htmlType="submit" loading={loading} block>
              Schedule Appointment
            </Button>
          </Form.Item>
        </Form>

        <StaffScheduleCalendarModal
          open={calendarModalVisible}
          onClose={() => setCalendarModalVisible(false)}
          staffId={staffId}
          availableWorkDates={availableWorkDates}
          onDateSelect={handleCalendarDateSelect}
          isDateDisabled={isDateDisabled}
        />
      </Modal>
      
      {/* Success Modal - Separate from the main modal */}
      <Modal
        open={successModalVisible}
        onCancel={handleSuccessModalClose}
        footer={[
          <Button key="close" type="primary" onClick={handleSuccessModalClose}>
            Close
          </Button>,
        ]}
        width={500}
        destroyOnClose={true}
      >
        <Result
          status="success"
          title="Appointment Scheduled Successfully!"
          subTitle="The appointment has been scheduled and notifications have been sent."
        />
      </Modal>
    </>
  );
};

// Main Component
export function AppointmentManagementForStaff() {
  const router = useRouter();
  const context = useContext(UserContext);
  const user = context?.user;
  const [appointments, setAppointments] = useState<AppointmentResponseDTO[]>(
    []
  );
  const [happeningAppointments, setHappeningAppointments] = useState<
    AppointmentResponseDTO[]
  >([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [searchText, setSearchText] = useState("");
  const [dateRange, setDateRange] = useState<[Dayjs, Dayjs] | null>(null);
  const [blockModalVisible, setBlockModalVisible] = useState(false);
  const [scheduleModalVisible, setScheduleModalVisible] = useState(false);
  const [editModalVisible, setEditModalVisible] = useState(false);
  const [selectedAppointmentId, setSelectedAppointmentId] = useState<
    string | null
  >(null);
  const [selectedAppointment, setSelectedAppointment] =
    useState<AppointmentResponseDTO | null>(null);
  const [activeDropdown, setActiveDropdown] = useState<string | null>(null);
  const [resetStatusUserId, setResetStatusUserId] = useState<string | null>(
    null
  );
  const [resetUserModalVisible, setResetUserModalVisible] = useState(false);
  const [activeTab, setActiveTab] = useState<string>("Scheduled");
  const [messageApi, contextHolder] = message.useMessage({
    maxCount: 3,
    duration: 3,
  });
  const [userOptions, setUserOptions] = useState<
    { value: string; label: string }[]
  >([]);
  const [loadingUsers, setLoadingUsers] = useState(false);
  const [actionSuccessModalVisible, setActionSuccessModalVisible] =
    useState(false);
  const [actionSuccessMessage, setActionSuccessMessage] = useState("");
  const [actionSuccessTitle, setActionSuccessTitle] = useState("");
  
  // New state for independent success modal
  const [operationSuccessModalVisible, setOperationSuccessModalVisible] = useState(false);
  const [operationSuccessMessage, setOperationSuccessMessage] = useState("");

  // Add custom message styles to make them more visible
  useEffect(() => {
    const styleElement = document.createElement("style");
    styleElement.innerHTML = `
      .ant-message {
        z-index: 2000 !important;
        top: 80px !important;
      }
      .ant-message-notice-content {
        box-shadow: 0 4px 12px rgba(0,0,0,0.15) !important;
        padding: 12px 16px !important;
        font-size: 16px !important;
        font-weight: 500 !important;
      }
    `;
    document.head.appendChild(styleElement);
    return () => {
      document.head.removeChild(styleElement);
    };
  }, []);

  // Add style element to document head
  useEffect(() => {
    // Create style element
    const styleElement = document.createElement("style");
    styleElement.innerHTML = styles;
    document.head.appendChild(styleElement);

    // Clean up on unmount
    return () => {
      document.head.removeChild(styleElement);
    };
  }, []);

  // Function to handle opening the schedule appointment modal
  const handleOpenScheduleModal = () => {
    setScheduleModalVisible(true);
  };
  
  // Function to handle scheduling success
  const handleScheduleSuccess = () => {
    handleRefresh();
    setOperationSuccessModalVisible(true);
    setOperationSuccessMessage("The appointment has been scheduled successfully and notifications have been sent.");
    
    // Show a more visible success message as well
    messageApi.success({
      content: "Appointment scheduled successfully!",
      duration: 5,
      style: { marginTop: '50px', fontSize: '16px', fontWeight: 'bold' },
    });
  };

  // Function to handle opening the reset user status modal
  const handleOpenResetModal = () => {
    setResetUserModalVisible(true);
    if (userOptions.length === 0) {
      fetchUserOptions();
    }
  };

  // Fetch active users for dropdown selection
  const fetchUserOptions = useCallback(async () => {
    setLoadingUsers(true);
    try {
      const token = Cookies.get("token");
      if (!token) {
        throw new Error("No authentication token found.");
      }

      const response = await getAllUsers(
        1, // page
        1000, // pageSize - large number to get as many as possible
        undefined, // fullNameSearch
        undefined, // userNameSearch
        undefined, // emailSearch
        undefined, // phoneSearch
        undefined, // roleFilter
        undefined, // genderFilter
        undefined, // dobStartDate
        undefined, // dobEndDate
        undefined, // createdStartDate
        undefined, // createdEndDate
        undefined, // updatedStartDate
        undefined, // updatedEndDate
        "Active", // status - only active users
        "CreatedAt", // sortBy
        false // ascending
      );

      if (response.isSuccess && response.data) {
        const options = response.data.map((user: UserResponseDTO) => ({
          value: user.email,
          label: `${user.fullName} (${user.email})`,
        }));
        setUserOptions(options);
      } else {
        console.error("Failed to fetch users:", response.message);
        messageApi.error("Failed to load users");
      }
    } catch (error) {
      console.error("Error fetching users:", error);
      messageApi.error("Failed to load users");
    } finally {
      setLoadingUsers(false);
    }
  }, [messageApi]);

  // Filter options when searching
  const handleUserSearch = debounce((value: string) => {
    // This will use the existing options but filter them based on the search input
    console.log("Searching for user:", value);
  }, 300);

  // Function to handle reset user appointment status
  const handleResetUserStatus = () => {
    if (!resetStatusUserId) {
      messageApi.error("Please enter a User Email");
      return;
    }

    handleAction(
      updateUserAppointmentStatusToNormal,
      resetStatusUserId,
      "User appointment status reset to Normal!",
      resetStatusUserId
    );
    setResetUserModalVisible(false);
  };

  const fetchAppointments = useCallback(
    async (userId: string) => {
      setLoading(true);
      try {
        const result: PagedResultDTO<AppointmentResponseDTO> =
          await getAppointmentsByStaffId(
            userId,
            1,
            50,
            "AppointmentDate",
            false
          );
        if (result.isSuccess) {
          const allAppointments = result.data || [];
          setHappeningAppointments(
            allAppointments.filter((app) => app.status === "Happening")
          );
          setAppointments(
            allAppointments.filter((app) => app.status !== "Happening")
          );
        } else {
          messageApi.error(result.message || "Failed to fetch appointments");
        }
      } catch (error: any) {
        console.error("Error fetching appointments:", error);
        if (error.response?.status === 401) {
          messageApi.error("Session expired. Please log in again.");
          router.push("/");
        } else {
          messageApi.error("Failed to load appointments.");
        }
      } finally {
        setLoading(false);
      }
    },
    [router, messageApi]
  );

  useEffect(() => {
    const token = Cookies.get("token");
    if (!token) {
      messageApi.error("No authentication token found.");
      router.push("/");
      return;
    }

    try {
      const decoded: any = jwtDecode(token);
      const userId = decoded.userid;
      if (!userId) {
        messageApi.error("Invalid user ID in token.");
        router.push("/");
        return;
      }
      fetchAppointments(userId);
    } catch (error) {
      console.error("Invalid token:", error);
      messageApi.error("Invalid authentication token.");
      router.push("/");
    }
  }, [fetchAppointments, router, messageApi]);

  const handleRefresh = useCallback(() => {
    const token = Cookies.get("token");
    if (!token) {
      messageApi.error("No authentication token found.");
      router.push("/");
      return;
    }
    try {
      const decoded: any = jwtDecode(token);
      const userId = decoded.userid;
      if (userId) {
        fetchAppointments(userId);
      }
    } catch (error) {
      console.error("Invalid token on refresh:", error);
      messageApi.error("Invalid authentication token.");
      router.push("/");
    }
  }, [fetchAppointments, router, messageApi]);

  const handleAction = async (
    action: (id: string, token?: string) => Promise<any>,
    id: string,
    successMsg: string,
    userId?: string,
    newTab?: string
  ) => {
    setActionLoading(id);
    try {
      const token = Cookies.get("token");
      if (!token) {
        throw new Error("No authentication token found.");
      }
      const response = userId
        ? await action(userId, token)
        : await action(id, token);
      if (response.isSuccess) {
        // Set success message and show modal
        setActionSuccessTitle(successMsg);
        setActionSuccessMessage(
          "The action was completed successfully and notifications have been sent."
        );
        setActionSuccessModalVisible(true);

        const staffId = jwtDecode<any>(token).userid || user?.userId;
        if (staffId) {
          await fetchAppointments(staffId);
          if (newTab) {
            setActiveTab(newTab);
          }
        }
      } else {
        messageApi.error(
          `Failed to ${successMsg.toLowerCase()}: ${
            response.message || "Unknown error"
          }`
        );
      }
    } catch (error: any) {
      if (
        error.response?.status === 401 ||
        error.message === "No authentication token found."
      ) {
        messageApi.error(
          "Session expired or unauthorized. Please log in again."
        );
        router.push("/");
      } else {
        messageApi.error(
          `An error occurred: ${error.message || "Unknown error"}`
        );
      }
    } finally {
      // Add a small delay to ensure the message is visible
      setTimeout(() => {
        setActionLoading(null);
        setActiveDropdown(null);
        setResetStatusUserId(null);
      }, 500);
    }
  };

  const handleEditClick = (appointment: AppointmentResponseDTO) => {
    setSelectedAppointment(appointment);
    setEditModalVisible(true);
  };
  
  // Function to handle update success
  const handleUpdateSuccess = () => {
    handleRefresh();
    setOperationSuccessModalVisible(true);
    setOperationSuccessMessage("The appointment has been updated successfully and notifications have been sent.");
    
    // Show a more visible success message as well
    messageApi.success({
      content: "Appointment updated successfully!",
      duration: 5,
      style: { marginTop: '50px', fontSize: '16px', fontWeight: 'bold' },
    });
  };

  const debouncedSetSearchText = useMemo(
    () => debounce((value: string) => setSearchText(value), 300),
    []
  );

  const filteredAppointments = useMemo(() => {
    return appointments.filter((appointment) => {
      const matchesSearch = searchText
        ? appointment.studentName
            ?.toLowerCase()
            .includes(searchText.toLowerCase())
        : true;
      const matchesDate =
        dateRange && appointment.appointmentDate
          ? dayjs(appointment.appointmentDate).isBetween(
              dateRange[0],
              dateRange[1],
              "day",
              "[]"
            )
          : true;
      return matchesSearch && matchesDate;
    });
  }, [appointments, searchText, dateRange]);

  const resetFilters = () => {
    setSearchText("");
    setDateRange(null);
    setActiveTab("Scheduled");
  };

  const handleDateRangeChange = (
    dates: [Dayjs | null, Dayjs | null] | null
  ) => {
    setDateRange(dates && dates[0] && dates[1] ? [dates[0], dates[1]] : null);
  };

  const handleBlockClick = (appointmentId: string) => {
    setSelectedAppointmentId(appointmentId);
    setBlockModalVisible(true);
  };

  const getActionMenuItems = (
    appointment: AppointmentResponseDTO
  ): MenuProps["items"] => {
    const isAnyActionLoading = !!actionLoading;
    const items: MenuProps["items"] = [];

    if (appointment.status === "Scheduled") {
      items.push(
        {
          key: "update",
          icon: <EditOutlined style={{ color: "#1890ff" }} />,
          label: (
            <span
              onClick={(e) => {
                e.stopPropagation();
                e.preventDefault();
                handleEditClick(appointment);
              }}
            >
              Update Appointment
            </span>
          ),
        },
        {
          key: "attended",
          icon: <CheckCircleOutlined style={{ color: "#13c2c2" }} />,
          disabled: isAnyActionLoading,
          label: (
            <Tooltip title="Confirm student's attendance for this appointment">
              <Popconfirm
                title={`Did "${appointment.studentName}" attend this appointment?`}
                description="This confirms the student was present but does not mark the appointment as finished."
                onConfirm={() =>
                  handleAction(
                    confirmAttendance,
                    appointment.id,
                    "Attendance confirmed!"
                  )
                }
                onCancel={(e) => e?.stopPropagation()}
                okText="Yes"
                cancelText="No"
                placement="left"
                disabled={isAnyActionLoading}
                overlayStyle={{ zIndex: 2000 }}
              >
                <span
                  onClick={(e) => {
                    e.stopPropagation();
                    e.preventDefault();
                  }}
                >
                  Confirm Attendance
                </span>
              </Popconfirm>
            </Tooltip>
          ),
        },
        {
          key: "missed",
          icon: <CloseCircleOutlined style={{ color: "#ff7875" }} />,
          disabled: isAnyActionLoading,
          label: (
            <Tooltip title="Report that the student did not attend">
              <Popconfirm
                title={`Did "${appointment.studentName}" miss this appointment?`}
                description="This will mark the appointment as missed and may update the user's status to Warning."
                onConfirm={() =>
                  handleAction(
                    confirmAbsence,
                    appointment.id,
                    "Appointment marked as missed!",
                    undefined,
                    "Missed"
                  )
                }
                onCancel={(e) => e?.stopPropagation()}
                okText="Yes"
                cancelText="No"
                placement="left"
                disabled={isAnyActionLoading}
                overlayStyle={{ zIndex: 2000 }}
              >
                <span
                  onClick={(e) => {
                    e.stopPropagation();
                    e.preventDefault();
                  }}
                >
                  Report Absence
                </span>
              </Popconfirm>
            </Tooltip>
          ),
        },
        {
          key: "cancel",
          icon: <StopOutlined style={{ color: "#bfbfbf" }} />,
          disabled: isAnyActionLoading,
          label: (
            <Tooltip title="Cancel this scheduled appointment">
              <Popconfirm
                title={`Are you sure you want to cancel "${appointment.studentName}"'s appointment?`}
                description="This action cannot be undone."
                onConfirm={() =>
                  handleAction(
                    cancelAppointmentForStaff,
                    appointment.id,
                    "Appointment cancelled successfully!",
                    undefined,
                    "Cancelled"
                  )
                }
                onCancel={(e) => e?.stopPropagation()}
                okText="Yes"
                cancelText="No"
                placement="left"
                okButtonProps={{ danger: true }}
                disabled={isAnyActionLoading}
                overlayStyle={{ zIndex: 2000 }}
              >
                <span
                  onClick={(e) => {
                    e.stopPropagation();
                    e.preventDefault();
                  }}
                >
                  Cancel Appointment
                </span>
              </Popconfirm>
            </Tooltip>
          ),
        }
      );
    }

    return items;
  };

  const tabItems = (
    ["Scheduled", "Finished", "Missed", "Cancelled"] as const
  ).map((status) => ({
    key: status,
    label: (
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: "8px",
          padding: "0 4px",
        }}
      >
        {getStatusIcon(status)}
        <span>{status}</span>
        <Badge
          count={
            filteredAppointments.filter((a) =>
              status === "Cancelled"
                ? a.status === "Cancelled" ||
                  a.status === "CancelledAfterConfirm"
                : a.status === status
            ).length
          }
          style={{
            backgroundColor:
              getStatusColor(status) === "blue"
                ? "#1890ff"
                : getStatusColor(status) === "green"
                ? "#52c41a"
                : getStatusColor(status) === "red"
                ? "#ff4d4f"
                : getStatusColor(status) === "gray"
                ? "#d9d9d9"
                : getStatusColor(status) === "orange"
                ? "#fa8c16"
                : "#1890ff",
            color: getStatusColor(status) === "gray" ? "#666" : "#fff",
          }}
        />
      </div>
    ),
    children: (
      <div
        style={{ maxHeight: "70vh", overflowY: "auto", paddingRight: "8px" }}
      >
        {filteredAppointments.filter((a) =>
          status === "Cancelled"
            ? a.status === "Cancelled" || a.status === "CancelledAfterConfirm"
            : a.status === status
        ).length === 0 ? (
          <Card
            style={{
              textAlign: "center",
              padding: "32px 0",
              borderRadius: "12px",
              backgroundColor: "#f9f9f9",
            }}
          >
            <Empty
              description={`No ${status.toLowerCase()} appointments`}
              image={Empty.PRESENTED_IMAGE_SIMPLE}
            />
          </Card>
        ) : (
          filteredAppointments
            .filter((a) =>
              status === "Cancelled"
                ? a.status === "Cancelled" ||
                  a.status === "CancelledAfterConfirm"
                : a.status === status
            )
            .map((appointment) => (
              <Collapse
                key={appointment.id}
                style={{
                  marginBottom: "12px",
                  borderRadius: "12px",
                  overflow: "hidden",
                  boxShadow: "0 2px 8px rgba(0,0,0,0.05)",
                  border: "1px solid #f0f0f0",
                }}
                items={[
                  {
                    key: appointment.id,
                    label: (
                      <div
                        style={{
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "space-between",
                          width: "100%",
                        }}
                      >
                        <Space size="small">
                          <Text
                            strong
                            ellipsis={{ tooltip: appointment.studentName }}
                          >
                            {appointment.studentName}
                          </Text>
                          <Text type="secondary" style={{ fontSize: "13px" }}>
                            {formatTime(appointment.appointmentDate)} -{" "}
                            {formatTime(appointment.endTime)}
                          </Text>
                        </Space>
                        <Space size="small">
                          <Tooltip title={getStatusTooltip(appointment.status)}>
                            <Tag
                              color={getStatusColor(appointment.status)}
                              icon={getStatusIcon(appointment.status)}
                              style={{
                                display: "flex",
                                alignItems: "center",
                                gap: "4px",
                              }}
                            >
                              {appointment.status === "CancelledAfterConfirm"
                                ? "Cancelled"
                                : appointment.status}
                            </Tag>
                          </Tooltip>
                          <Tooltip title="View appointment details">
                            <Button
                              type="text"
                              icon={<InfoCircleOutlined />}
                              onClick={(e) => {
                                e.stopPropagation();
                                handleBlockClick(appointment.id);
                              }}
                              aria-label="View appointment details"
                            />
                          </Tooltip>
                          {appointment.status === "Scheduled" && (
                            <Dropdown
                              menu={{
                                items: getActionMenuItems(appointment),
                                onClick: ({ key }) => {
                                  setActiveDropdown(null);
                                  if (key === "details") {
                                    const userId = appointment.userId;
                                    // Handle details action
                                  } else if (key === "absent") {
                                    handleAction(
                                      confirmAbsence,
                                      appointment.id,
                                      "Appointment marked as missed!",
                                      appointment.userId,
                                      "Missed"
                                    );
                                  }
                                },
                              }}
                              trigger={["click"]}
                              open={activeDropdown === appointment.id}
                              onOpenChange={(open) =>
                                setActiveDropdown(open ? appointment.id : null)
                              }
                            >
                              <Button icon={<EllipsisOutlined />} />
                            </Dropdown>
                          )}
                        </Space>
                      </div>
                    ),
                    children: (
                      <div
                        style={{
                          display: "flex",
                          flexDirection: "column",
                          gap: "8px",
                          padding: "12px",
                          cursor: "pointer",
                          transition: "background-color 0.3s",
                          backgroundColor: "#fafafa",
                        }}
                        onClick={() => handleBlockClick(appointment.id)}
                      >
                        <Text type="secondary" style={{ fontSize: "14px" }}>
                          <CalendarOutlined style={{ marginRight: "8px" }} />
                          <strong>Date:</strong>{" "}
                          {formatDate(appointment.appointmentDate)}
                        </Text>
                        <Text type="secondary" style={{ fontSize: "14px" }}>
                          <ClockCircleOutlined style={{ marginRight: "8px" }} />
                          <strong>Start Time:</strong>{" "}
                          {formatTime(appointment.appointmentDate)}
                        </Text>
                        <Text type="secondary" style={{ fontSize: "14px" }}>
                          <ClockCircleOutlined style={{ marginRight: "8px" }} />
                          <strong>End Time:</strong>{" "}
                          {formatTime(appointment.endTime)}
                        </Text>
                        <Text
                          style={{ fontSize: "14px" }}
                          ellipsis={{ tooltip: appointment.reason }}
                        >
                          <strong>Reason:</strong> {appointment.reason || "N/A"}
                        </Text>
                      </div>
                    ),
                  },
                ]}
                expandIconPosition="end"
              />
            ))
        )}
      </div>
    ),
  }));

  const rangePresets: { label: string; value: [Dayjs, Dayjs] }[] = [
    { label: "Today", value: [dayjs(), dayjs()] },
    {
      label: "This Week",
      value: [dayjs().startOf("week"), dayjs().endOf("week")],
    },
    {
      label: "This Month",
      value: [dayjs().startOf("month"), dayjs().endOf("month")],
    },
  ];

  const activeFilterCount = (searchText ? 1 : 0) + (dateRange ? 1 : 0);

  if (loading) {
    return (
      <div className="flex justify-center items-center h-screen bg-gray-50">
        <Spin size="large" />
      </div>
    );
  }

  return (
    <div className="p-4 bg-gray-50 min-h-screen">
      {contextHolder}
      <style>{styles}</style>
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <CalendarOutlined style={{ fontSize: "24px" }} />
          <h3 className="text-xl font-bold">My Assigned Appointments</h3>
        </div>
      </div>

      <Card
        className="shadow mb-4"
        bodyStyle={{ padding: "16px" }}
        style={{ borderRadius: "8px", boxShadow: "0 2px 8px rgba(0,0,0,0.1)" }}
      >
        <Row align="middle" gutter={[16, 16]}>
          <Col span={24}>
            <Title level={4} style={{ margin: 0 }}>
              <AppstoreOutlined
                style={{ marginRight: "8px", fontSize: "20px" }}
              />
              Toolbar
            </Title>
          </Col>
        </Row>

        <Divider style={{ margin: "16px 0" }} />

        <div className="mb-3 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Input.Search
              placeholder="Search by name or email"
              value={searchText}
              onChange={(e) => setSearchText(e.target.value)}
              allowClear
              prefix={<SearchOutlined />}
              style={{ width: "300px" }}
            />

            <RangePicker
              value={dateRange}
              onChange={handleDateRangeChange}
              format="DD/MM/YYYY"
              style={{ width: "280px" }}
              placeholder={["Start Date", "End Date"]}
              allowClear
            />

            <Tooltip title="Reset all filters">
              <Button
                onClick={resetFilters}
                icon={<ReloadOutlined />}
                disabled={!searchText && !dateRange}
              />
            </Tooltip>

            <Tooltip title="Refresh appointments">
              <Button
                onClick={handleRefresh}
                icon={<ReloadOutlined />}
                loading={loading}
              >
                Refresh
              </Button>
            </Tooltip>

            <Tooltip title="Reset user appointment status to Normal">
              <Button
                type="default"
                icon={<UserSwitchOutlined />}
                onClick={handleOpenResetModal}
              >
                Reset User
              </Button>
            </Tooltip>
          </div>

          <Tooltip title="Schedule new appointment">
            <Button
              type="primary"
              icon={<PlusCircleOutlined />}
              onClick={handleOpenScheduleModal}
            >
              Schedule
            </Button>
          </Tooltip>
        </div>
      </Card>

      {happeningAppointments.length > 0 && (
        <Card
          className="blinking-border shadow mb-4"
          title={
            <div style={{ display: "flex", alignItems: "center" }}>
              <PlayCircleOutlined
                style={{
                  color: "#fa8c16",
                  marginRight: "8px",
                  fontSize: "20px",
                }}
              />
              <span style={{ fontWeight: 500 }}>Currently Happening</span>
            </div>
          }
          bordered={false}
          bodyStyle={{ padding: "16px" }}
          style={{
            backgroundColor: "#fff7e6",
            borderColor: "#ffa940",
            borderRadius: "8px",
            boxShadow: "0 2px 8px rgba(0,0,0,0.1)",
          }}
        >
          <Row gutter={[16, 16]}>
            {happeningAppointments.map((appointment) => (
              <Col span={24} key={appointment.id}>
                <Card
                  className="appointment-card"
                  bordered
                  style={{
                    marginBottom: "10px",
                    borderRadius: "8px",
                    boxShadow: "0 1px 3px rgba(0,0,0,0.05)",
                  }}
                >
                  <Row gutter={[16, 16]} align="middle">
                    <Col xs={24} sm={12} md={6} lg={6}>
                      <Space direction="vertical" size="small">
                        <Text type="secondary">Scheduler:</Text>
                        <Text strong>{appointment.studentName}</Text>
                        <Text type="secondary">{appointment.studentEmail}</Text>
                      </Space>
                    </Col>
                    <Col xs={24} sm={12} md={6} lg={6}>
                      <Space direction="vertical" size="small">
                        <Text type="secondary">Date & Time:</Text>
                        <Space size="small">
                          <CalendarOutlined />
                          <Text>{formatDate(appointment.appointmentDate)}</Text>
                        </Space>
                        <Space size="small">
                          <ClockCircleOutlined />
                          <Text>
                            {formatTime(appointment.appointmentDate)} -{" "}
                            {formatTime(appointment.endTime)}
                          </Text>
                        </Space>
                      </Space>
                    </Col>
                    <Col xs={24} sm={12} md={6} lg={6}>
                      <Space direction="vertical" size="small">
                        <Text type="secondary">Status:</Text>
                        <Tag
                          icon={getStatusIcon(appointment.status)}
                          color={getStatusColor(appointment.status)}
                        >
                          {appointment.status}
                        </Tag>
                        <Text type="secondary">
                          {getStatusTooltip(appointment.status)}
                        </Text>
                      </Space>
                    </Col>
                    <Col xs={24} sm={12} md={6} lg={6}>
                      <Space wrap>
                        <Popconfirm
                          title="Confirm appointment completion?"
                          description="This will indicate the appointment has concluded successfully."
                          onConfirm={() =>
                            handleAction(
                              confirmCompletion,
                              appointment.id,
                              "Appointment marked as completed!",
                              undefined,
                              "Finished"
                            )
                          }
                          okText="Yes"
                          cancelText="No"
                          placement="top"
                        >
                          <Button
                            type="primary"
                            icon={<CheckCircleOutlined />}
                            loading={actionLoading === appointment.id}
                            style={{
                              backgroundColor: "#52c41a",
                              borderColor: "#52c41a",
                            }}
                          >
                            Complete
                          </Button>
                        </Popconfirm>
                        <Popconfirm
                          title={`Did "${appointment.studentName}" miss this appointment?`}
                          description="This will mark the appointment as missed and may update the user's status to Warning."
                          onConfirm={() =>
                            handleAction(
                              confirmAbsence,
                              appointment.id,
                              "Appointment marked as missed!",
                              undefined,
                              "Missed"
                            )
                          }
                          okText="Yes"
                          cancelText="No"
                          placement="top"
                        >
                          <Button
                            danger
                            icon={<CloseCircleOutlined />}
                            loading={actionLoading === appointment.id}
                          >
                            Report Absence
                          </Button>
                        </Popconfirm>
                      </Space>
                    </Col>
                  </Row>
                </Card>
              </Col>
            ))}
          </Row>
        </Card>
      )}

      <Card
        className="shadow"
        bodyStyle={{ padding: "16px" }}
        style={{ borderRadius: "8px", boxShadow: "0 2px 8px rgba(0,0,0,0.1)" }}
      >
        <Tabs
          activeKey={activeTab}
          onChange={setActiveTab}
          tabBarStyle={{
            marginBottom: "16px",
            padding: "0 8px",
            fontWeight: 500,
          }}
          type="card"
          size="large"
          tabBarGutter={8}
          items={tabItems}
          className="appointment-tabs"
          animated={{ inkBar: true, tabPane: true }}
        />

        <style>
          {`
            .appointment-tabs .ant-tabs-nav {
              margin-bottom: 16px;
            }
            .appointment-tabs .ant-tabs-nav::before {
              border-bottom: none;
            }
            .appointment-tabs .ant-tabs-tab {
              border-radius: 8px 8px 0 0 !important;
              transition: all 0.3s;
              border: 1px solid #f0f0f0 !important;
              padding: 8px 16px !important;
            }
            .appointment-tabs .ant-tabs-tab-active {
              background-color: #fff !important;
              border-bottom-color: #fff !important;
              border-top: 2px solid #1890ff !important;
            }
            .appointment-tabs .ant-tabs-content-holder {
              border-radius: 0 8px 8px 8px;
              border: 1px solid #f0f0f0;
              padding: 16px;
              margin-top: -17px;
              background-color: #fff;
            }
          `}
        </style>
      </Card>

      <Modal
        title="Appointment User Details"
        open={blockModalVisible}
        onCancel={() => {
          setBlockModalVisible(false);
          setSelectedAppointmentId(null);
        }}
        footer={null}
        width={765}
        className="rounded-lg"
        style={{ top: 50 }}
      >
        {selectedAppointmentId ? (
          <AppointmentUserDetails id={selectedAppointmentId} />
        ) : (
          <Text>No appointment selected.</Text>
        )}
      </Modal>

      <ScheduleAppointmentForStaff
        visible={scheduleModalVisible}
        onClose={() => setScheduleModalVisible(false)}
        staffId={user?.userId || ""}
        onSuccessfulSchedule={handleScheduleSuccess}
      />

      <UpdateAppointmentModal
        visible={editModalVisible}
        onClose={() => {
          setEditModalVisible(false);
          setSelectedAppointment(null);
        }}
        appointment={selectedAppointment}
        onUpdateSuccess={handleUpdateSuccess}
      />

      <Modal
        title={
          <Title level={4} style={{ margin: 0 }}>
            <UserSwitchOutlined style={{ marginRight: 8 }} />
            Reset User Appointment Status
          </Title>
        }
        open={resetUserModalVisible}
        onCancel={() => {
          setResetUserModalVisible(false);
          setResetStatusUserId(null);
        }}
        footer={[
          <Button
            key="cancel"
            onClick={() => {
              setResetUserModalVisible(false);
              setResetStatusUserId(null);
            }}
          >
            Cancel
          </Button>,
          <Button
            key="submit"
            type="primary"
            onClick={handleResetUserStatus}
            loading={!!actionLoading}
          >
            Reset Status
          </Button>,
        ]}
        width={500}
        destroyOnClose
      >
        <div style={{ padding: "16px 0" }}>
          <Text>
            Please select the User Email to reset their appointment status to
            Normal:
          </Text>
          <div style={{ margin: "16px 0" }}>
            <Select
              showSearch
              placeholder="Search and select a user"
              optionFilterProp="label"
              onChange={(value) => setResetStatusUserId(value)}
              onSearch={handleUserSearch}
              value={resetStatusUserId}
              style={{ width: "100%" }}
              notFoundContent={loadingUsers ? <Spin size="small" /> : null}
              filterOption={(input, option) =>
                (option?.label ?? "")
                  .toLowerCase()
                  .includes(input.toLowerCase())
              }
              options={userOptions}
              loading={loadingUsers}
              allowClear
            />
            {loadingUsers && (
              <div
                style={{
                  marginTop: 8,
                  color: "#1890ff",
                  display: "flex",
                  alignItems: "center",
                }}
              >
                <LoadingOutlined style={{ marginRight: 8 }} />
                <Text type="secondary">Loading users...</Text>
              </div>
            )}
          </div>
          <Text type="secondary">
            Resetting the status will allow the user to schedule appointments
            again if they were previously blocked.
          </Text>
        </div>
      </Modal>

      <Modal
        title="Action Success"
        open={actionSuccessModalVisible}
        onCancel={() => setActionSuccessModalVisible(false)}
        footer={[
          <Button
            key="close"
            type="primary"
            onClick={() => setActionSuccessModalVisible(false)}
          >
            Close
          </Button>,
        ]}
        width={500}
      >
        <Result
          status="success"
          title={actionSuccessTitle}
          subTitle={actionSuccessMessage}
        />
      </Modal>
      
      {/* Independent success modal */}
      <Modal
        open={operationSuccessModalVisible}
        onCancel={() => setOperationSuccessModalVisible(false)}
        footer={[
          <Button 
            key="close" 
            type="primary" 
            onClick={() => setOperationSuccessModalVisible(false)}
          >
            Close
          </Button>,
        ]}
        width={500}
        destroyOnClose={true}
      >
        <Result
          status="success"
          title="Operation Completed Successfully!"
          subTitle={operationSuccessMessage}
        />
      </Modal>
    </div>
  );
}

export default AppointmentManagementForStaff;
