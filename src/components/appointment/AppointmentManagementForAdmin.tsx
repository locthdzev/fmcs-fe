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
  Modal,
  Badge,
  Form,
  Select,
  message,
} from "antd";
import dayjs, { Dayjs } from "dayjs";
import isBetween from "dayjs/plugin/isBetween";
import Cookies from "js-cookie";
import { useRouter } from "next/router";
import {
  getAllAppointments,
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
  CalendarOutlined,
  ReloadOutlined,
  DownOutlined,
  EllipsisOutlined,
  InfoCircleOutlined,
  UserSwitchOutlined,
  FilterOutlined,
  FormOutlined,
  ScheduleOutlined,
  UserOutlined,
  MailOutlined,
  PhoneOutlined,
  VideoCameraOutlined,
  LoadingOutlined,
} from "@ant-design/icons";
import { UserContext } from "@/context/UserContext";
import AppointmentUserDetails from "./AppointmentUserDetails";
import jwtDecode from "jwt-decode";
import moment from "moment-timezone";
import debounce from "lodash/debounce";
import { Virtuoso } from "react-virtuoso";
import { getAllUsers, UserResponseDTO } from "@/api/user";

const styles = `
  @keyframes blink {
    0% { border-color: #ffa940; }
    50% { border-color: #ffec99; }
    100% { border-color: #ffa940; }
  }

  @keyframes fadeIn {
    from { opacity: 0; transform: translateY(10px); }
    to { opacity: 1; transform: translateY(0); }
  }

  @keyframes expand {
    from { max-height: 0; opacity: 0; }
    to { max-height: 500px; opacity: 1; }
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

  .appointment-card {
    background: linear-gradient(145deg, #ffffff, #f8fafc);
    border: 1px solid #e5e7eb;
    border-radius: 12px;
    margin-bottom: 12px;
    padding: 12px;
    transition: all 0.3s ease;
    animation: fadeIn 0.3s ease;
  }

  .appointment-card:hover {
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
    transform: translateY(-2px);
  }

  .status-tag {
    min-width: 100px;
    text-align: center;
    padding: 4px 8px;
    font-size: 12px;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    border: 1px solid rgba(0, 0, 0, 0.1);
    box-shadow: 0 1px 2px rgba(0, 0, 0, 0.05);
  }

  .sticky-header {
    position: sticky;
    top: 0;
    background: #ffffff;
    z-index: 10;
    padding: 8px;
    border-bottom: 1px solid #e5e7eb;
    box-shadow: 0 2px 4px rgba(0, 0, 0, 0.05);
  }

  .student-name {
    font-size: 1rem;
    font-weight: 600;
  }

  .details-card {
    background: linear-gradient(145deg, #f9fafb, #ffffff);
    border-radius: 8px;
    padding: 16px;
    margin-top: 8px;
    box-shadow: 0 2px 6px rgba(0, 0, 0, 0.08);
    animation: expand 0.3s ease;
    overflow: hidden;
  }

  .details-section {
    margin-bottom: 16px;
  }

  .details-title {
    font-size: 0.9rem;
    font-weight: 600;
    color: #1f2937;
    margin-bottom: 8px;
  }

  .details-item {
    display: flex;
    align-items: center;
    font-size: 0.85rem;
    color: #4b5563;
    margin-bottom: 6px;
    font-weight: 500;
  }

  .details-item .anticon {
    margin-right: 8px;
    color: #4fd1c5;
  }

  .details-button {
    border-radius: 6px;
    font-size: 0.85rem;
    padding: 4px 12px;
  }

  .action-button {
    transition: background-color 0.3s ease, transform 0.2s ease;
  }

  .action-button:hover {
    transform: translateY(-1px);
  }
  
  /* Redesigned tabs */
  .appointment-tabs .ant-tabs-nav {
    background: #fff;
    padding: 8px 16px 0;
    margin-bottom: 0;
    border-radius: 8px 8px 0 0;
    box-shadow: 0 2px 4px rgba(0, 0, 0, 0.05);
  }
  
  .appointment-tabs .ant-tabs-content-holder {
    background: #fff;
    border-radius: 0 0 8px 8px;
    padding: 0 16px 16px;
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
  }
  
  .appointment-tabs .ant-tabs-tab {
    padding: 12px 16px;
    transition: all 0.3s ease;
    border-radius: 8px 8px 0 0;
    position: relative;
  }
  
  .appointment-tabs .ant-tabs-tab:hover {
    background: #f0f7ff;
  }
  
  .appointment-tabs .ant-tabs-tab-active {
    font-weight: 500;
  }
  
  .appointment-tabs .ant-tabs-tab-active:before {
    content: '';
    position: absolute;
    bottom: 0;
    left: 0;
    right: 0;
    height: 3px;
    background: #1890ff;
    border-radius: 3px 3px 0 0;
  }
  
  .appointment-tabs .status-count {
    margin-left: 8px;
    background: #f5f5f5;
    padding: 2px 8px;
    border-radius: 10px;
    font-size: 12px;
    color: #666;
  }
  
  .appointment-tabs .ant-tabs-tab-active .status-count {
    background: #e6f7ff;
    color: #1890ff;
  }
  
  .tab-content-container {
    height: 70vh;
    padding: 16px 4px;
    overflow-x: hidden;
  }
  
  .empty-state-card {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    height: 200px;
    background: #f9f9f9;
    border-radius: 12px;
    border: 1px dashed #d9d9d9;
  }
  
  .empty-state-icon {
    font-size: 36px;
    margin-bottom: 16px;
    color: #bfbfbf;
  }
  
  .tab-icon {
    margin-right: 8px;
  }
`;

dayjs.extend(isBetween);

const { RangePicker } = DatePicker;
const { Title, Text } = Typography;
const { Option } = Select;
const { TabPane } = Tabs;

const formatDate = (datetime: string | undefined) =>
  datetime ? dayjs(datetime).format("DD MMMM YYYY") : "N/A";

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

  const fetchAvailableSlots = useCallback(
    async (date: string) => {
      if (!token || !appointment?.staffId) return;
      setLoading(true);
      try {
        const response = await getAvailableTimeSlots(
          appointment.staffId,
          date,
          token
        );
        setAvailableSlots(response.data?.availableSlots || []);
      } catch (error: any) {
        console.error("Failed to fetch slots:", error);
        messageApi.error("Failed to load available slots.");
      } finally {
        setLoading(false);
      }
    },
    [appointment?.staffId, token, messageApi]
  );

  useEffect(() => {
    if (appointment && visible) {
      const appointmentDate = moment(appointment.appointmentDate);
      setSelectedDate(appointmentDate.format("YYYY-MM-DD"));
      fetchAvailableSlots(appointmentDate.format("YYYY-MM-DD"));

      form.setFieldsValue({
        email: appointment.studentEmail,
        appointmentDate: appointmentDate,
        timeSlot: `${moment(appointment.appointmentDate).format(
          "HH:mm"
        )} - ${moment(appointment.endTime).format("HH:mm")}`,
        reason: appointment.reason,
        status: appointment.status,
      });
    }
  }, [appointment, visible, form, fetchAvailableSlots]);

  const onDateChange = (date: moment.Moment | null) => {
    if (date) {
      const dateStr = date.format("YYYY-MM-DD");
      setSelectedDate(dateStr);
      fetchAvailableSlots(dateStr);
    } else {
      setSelectedDate(null);
      setAvailableSlots([]);
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
        messageApi.success("Appointment updated successfully!");
        form.resetFields();
        onUpdateSuccess();
        onClose();
      } else {
        messageApi.error(`Failed to update: ${response.message || "Unknown error"}`);
      }
    } catch (error: any) {
      console.error("Error updating appointment:", error);
      messageApi.error("Failed to update appointment.");
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setSelectedDate(null);
    setAvailableSlots([]);
    form.resetFields();
    onClose();
  };

  return (
    <Modal
      title={
        <Title level={4} style={{ margin: 0 }}>
          Update Appointment
        </Title>
      }
      open={visible}
      onCancel={handleClose}
      footer={null}
      width={600}
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
            { required: true, message: "Please enter the student/user Email" },
          ]}
        >
          <Input placeholder="Enter student/user Email" disabled />
        </Form.Item>

        <Form.Item
          name="appointmentDate"
          label="Date"
          rules={[{ required: true, message: "Please select a date" }]}
        >
          <DatePicker
            format="YYYY-MM-DD"
            onChange={onDateChange}
            disabledDate={(current) =>
              current && current.isBefore(dayjs().startOf("day"))
            }
            style={{ width: "100%" }}
          />
        </Form.Item>

        <Form.Item
          name="timeSlot"
          label="Time Slot"
          rules={[{ required: true, message: "Please select a time slot" }]}
        >
          <Select
            placeholder="Select a time slot"
            disabled={!selectedDate || loading}
            loading={loading}
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
          <Input.TextArea rows={3} placeholder="Enter reason for appointment" />
        </Form.Item>

        <Form.Item
          name="status"
          label="Status"
          rules={[{ required: true, message: "Please select a status" }]}
        >
          <Select placeholder="Select appointment status">
            <Option value="Scheduled">Scheduled</Option>
          </Select>
        </Form.Item>

        <Form.Item>
          <Button type="primary" htmlType="submit" loading={loading} block>
            Update Appointment
          </Button>
        </Form.Item>
      </Form>
      {loading && <Spin />}
    </Modal>
  );
};

// ScheduleAppointmentForStaff Component
const ScheduleAppointmentForStaff: React.FC<{
  visible: boolean;
  onClose: () => void;
  staffId: string;
}> = ({ visible, onClose, staffId }) => {
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const [availableSlots, setAvailableSlots] = useState<TimeSlotDTO[]>([]);
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const token = Cookies.get("token");
  const [messageApi, contextHolder] = message.useMessage();

  const fetchAvailableSlots = useCallback(
    async (date: string) => {
      if (!token) return;
      setLoading(true);
      try {
        const response = await getAvailableTimeSlots(staffId, date, token);
        setAvailableSlots(response.data?.availableSlots || []);
      } catch (error: any) {
        console.error("Failed to fetch slots:", error);
        messageApi.error("Failed to load available slots.");
      } finally {
        setLoading(false);
      }
    },
    [staffId, token, messageApi]
  );

  const onDateChange = (date: moment.Moment | null) => {
    if (date) {
      const dateStr = date.format("YYYY-MM-DD");
      setSelectedDate(dateStr);
      fetchAvailableSlots(dateStr);
    } else {
      setSelectedDate(null);
      setAvailableSlots([]);
    }
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
        messageApi.success("Appointment scheduled successfully!");
        form.resetFields();
        onClose();
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

  const handleClose = () => {
    setSelectedDate(null);
    setAvailableSlots([]);
    form.resetFields();
    onClose();
  };

  return (
    <Modal
      title={<Title level={4}>Schedule Appointment with User</Title>}
      open={visible}
      onCancel={handleClose}
      footer={null}
      width={600}
    >
      {contextHolder}
      <Form
        form={form}
        layout="vertical"
        onFinish={onFinish}
        initialValues={{ reason: "Health consultation" }}
      >
        <Form.Item
          name="email"
          label="Student/User Email"
          rules={[
            { required: true, message: "Please enter the student/user Email" },
          ]}
        >
          <Input placeholder="Enter student/user Email" />
        </Form.Item>

        <Form.Item
          name="appointmentDate"
          label="Date"
          rules={[{ required: true, message: "Please select a date" }]}
        >
          <DatePicker
            format="YYYY-MM-DD"
            onChange={onDateChange}
            disabledDate={(current) =>
              current && current.isBefore(dayjs().startOf("day"))
            }
            style={{ width: "100%" }}
          />
        </Form.Item>

        <Form.Item
          name="timeSlot"
          label="Time Slot"
          rules={[{ required: true, message: "Please select a time slot" }]}
        >
          <Select
            placeholder="Select a time slot"
            disabled={!selectedDate || loading}
            loading={loading}
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
          <Input.TextArea rows={3} placeholder="Enter reason for appointment" />
        </Form.Item>

        <Form.Item>
          <Button type="primary" htmlType="submit" loading={loading} block>
            Schedule Appointment
          </Button>
        </Form.Item>
      </Form>
      {loading && <Spin />}
    </Modal>
  );
};

// Main Component
export function AppointmentManagementForAdmin() {
  const router = useRouter();
  const context = useContext(UserContext);
  const user = context?.user;
  const [appointments, setAppointments] = useState<AppointmentResponseDTO[]>([]);
  const [happeningAppointments, setHappeningAppointments] = useState<AppointmentResponseDTO[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [searchText, setSearchText] = useState("");
  const [dateRange, setDateRange] = useState<[Dayjs, Dayjs] | null>(null);
  const [blockModalVisible, setBlockModalVisible] = useState(false);
  const [scheduleModalVisible, setScheduleModalVisible] = useState(false);
  const [editModalVisible, setEditModalVisible] = useState(false);
  const [selectedAppointmentId, setSelectedAppointmentId] = useState<string | null>(null);
  const [selectedAppointment, setSelectedAppointment] = useState<AppointmentResponseDTO | null>(null);
  const [resetUserModalVisible, setResetUserModalVisible] = useState(false);
  const [resetStatusUserId, setResetStatusUserId] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<string>("All");
  const [expandedKeys, setExpandedKeys] = useState<string[]>([]);
  const [fetchProgress, setFetchProgress] = useState<number>(0);
  const [userOptions, setUserOptions] = useState<{ value: string; label: string }[]>([]);
  const [loadingUsers, setLoadingUsers] = useState(false);
  const [messageApi, contextHolder] = message.useMessage();

  const fetchAppointments = useCallback(
    async (userId: string) => {
      console.log("fetchAppointments called with userId:", userId);
      setLoading(true);
      setFetchProgress(0);
      try {
        let allAppointments: AppointmentResponseDTO[] = [];
        let page = 1;
        const pageSize = 100;
        let totalRecords = 0;

        do {
          const result: PagedResultDTO<AppointmentResponseDTO> =
            await getAllAppointments(page, pageSize);
          if (result.isSuccess) {
            allAppointments = [...allAppointments, ...(result.data || [])];
            totalRecords = result.totalRecords;
            setFetchProgress((allAppointments.length / totalRecords) * 100);
            page++;
          } else {
            messageApi.error(result.message || "Failed to fetch appointments");
            break;
          }
        } while ((page - 1) * pageSize < totalRecords);

        console.log("Fetched appointments:", allAppointments.length);
        setHappeningAppointments(
          allAppointments.filter((app) => app.status === "Happening")
        );
        setAppointments(allAppointments);
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
        setFetchProgress(0);
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

  const handleAction = useCallback(
    async (
      action: (id: string, token?: string) => Promise<any>,
      id: string,
      successMsg: string,
      userId?: string,
      newTab?: string
    ) => {
      console.log("handleAction called for ID:", id, "Action:", successMsg);
      setActionLoading(id);
      try {
        const token = Cookies.get("token");
        if (!token) {
          throw new Error("No authentication token found.");
        }
        const response = userId
          ? await action(userId, token)
          : await action(id, token);
        console.log("Action response:", response);
        if (response.isSuccess) {
          messageApi.success(successMsg);
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
        console.error("Action error:", error);
        if (
          error.response?.status === 401 ||
          error.message === "No authentication token found."
        ) {
          messageApi.error("Session expired or unauthorized. Please log in again.");
          router.push("/");
        } else {
          messageApi.error(`An error occurred: ${error.message || "Unknown error"}`);
        }
      } finally {
        setActionLoading(null);
        setResetStatusUserId(null);
      }
    },
    [fetchAppointments, router, user?.userId, messageApi]
  );

  const handleEditClick = useCallback((appointment: AppointmentResponseDTO) => {
    setSelectedAppointment(appointment);
    setEditModalVisible(true);
  }, []);

  const debouncedSetSearchText = useMemo(
    () => debounce((value: string) => setSearchText(value), 300),
    []
  );

  const filteredAppointments = useMemo(() => {
    console.log("Computing filteredAppointments");
    return appointments.filter((appointment) => {
      const matchesSearch = searchText
        ? (appointment.studentName ?? "")
            .toLowerCase()
            .includes(searchText.toLowerCase()) ||
          (appointment.staffName ?? "")
            .toLowerCase()
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

  const resetFilters = useCallback(() => {
    setSearchText("");
    setDateRange(null);
    setActiveTab("All");
  }, []);

  const handleDateRangeChange = useCallback(
    (dates: [Dayjs | null, Dayjs | null] | null) => {
      setDateRange(dates && dates[0] && dates[1] ? [dates[0], dates[1]] : null);
    },
    []
  );

  const handleBlockClick = useCallback((appointmentId: string) => {
    console.log("handleBlockClick called for ID:", appointmentId);
    setSelectedAppointmentId(appointmentId);
    setBlockModalVisible(true);
  }, []);

  const handleScheduleClick = useCallback(() => {
    setScheduleModalVisible(true);
  }, []);

  const handleHappeningClick = useCallback(() => {
    console.log("Happening button clicked");
    setActiveTab("Happening");
  }, []);

  const getActionMenuItems = useCallback(
    (
      appointment: AppointmentResponseDTO,
      actionLoading: string | null
    ): any[] => {
      const isAnyActionLoading = !!actionLoading;
      const items: any[] = [];

      if (appointment.status === "Scheduled") {
        items.push({
          key: "update",
          icon: <FormOutlined style={{ color: "#1890ff" }} />,
          disabled: isAnyActionLoading,
          label: (
            <span
              onClick={(e) => {
                e.stopPropagation();
                handleEditClick(appointment);
              }}
            >
              Update Appointment
            </span>
          ),
        });
      }

      if (appointment.status === "Scheduled") {
        items.push(
          {
            key: "complete",
            icon: <CheckCircleOutlined style={{ color: "#389e0d" }} />,
            disabled: isAnyActionLoading,
            label: (
              <Tooltip title="Mark the appointment as fully completed">
                <Popconfirm
                  title={`Are you sure you want to mark "${
                    appointment.studentName ?? "N/A"
                  }"'s appointment as fully completed?`}
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
                    Mark as Completed
                  </span>
                </Popconfirm>
              </Tooltip>
            ),
          },
          {
            key: "attended",
            icon: <CheckCircleOutlined style={{ color: "#13c2c2" }} />,
            disabled: isAnyActionLoading,
            label: (
              <Tooltip title="Confirm the student attended the appointment">
                <Popconfirm
                  title={`Did "${
                    appointment.studentName ?? "N/A"
                  }" attend this appointment?`}
                  description="This confirms the student was present but does not mark the appointment as finished."
                  onConfirm={() =>
                    handleAction(
                      confirmAttendance,
                      appointment.id,
                      "Attendance confirmed!",
                      undefined,
                      "Happening"
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
              <Tooltip title="Report the student missed the appointment">
                <Popconfirm
                  title={`Did "${
                    appointment.studentName ?? "N/A"
                  }" miss this appointment?`}
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
          { type: "divider" },
          {
            key: "cancel",
            icon: <StopOutlined style={{ color: "#bfbfbf" }} />,
            disabled: isAnyActionLoading,
            label: (
              <Tooltip title="Cancel the appointment">
                <Popconfirm
                  title={`Are you sure you want to cancel "${
                    appointment.studentName ?? "N/A"
                  }"'s appointment?`}
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

      if (appointment.status === "Happening") {
        items.push(
          {
            key: "complete",
            icon: <CheckCircleOutlined style={{ color: "#389e0d" }} />,
            disabled: isAnyActionLoading,
            label: (
              <Tooltip title="Mark the appointment as fully completed">
                <Popconfirm
                  title={`Are you sure you want to mark "${
                    appointment.studentName ?? "N/A"
                  }"'s appointment as fully completed?`}
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
                    Mark as Completed
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
              <Tooltip title="Report the student missed the appointment">
                <Popconfirm
                  title={`Did "${
                    appointment.studentName ?? "N/A"
                  }" miss this appointment?`}
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
          }
        );
      }

      if (appointment.status === "Missed") {
        items.push(
          {
            key: "complete",
            icon: <CheckCircleOutlined style={{ color: "#389e0d" }} />,
            disabled: isAnyActionLoading,
            label: (
              <Tooltip title="Mark the appointment as fully completed">
                <Popconfirm
                  title={`Are you sure you want to mark "${
                    appointment.studentName ?? "N/A"
                  }"'s appointment as fully completed?`}
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
                    Mark as Completed
                  </span>
                </Popconfirm>
              </Tooltip>
            ),
          },
          {
            key: "attended",
            icon: <CheckCircleOutlined style={{ color: "#13c2c2" }} />,
            disabled: isAnyActionLoading,
            label: (
              <Tooltip title="Confirm the student attended the appointment">
                <Popconfirm
                  title={`Did "${
                    appointment.studentName ?? "N/A"
                  }" attend this appointment?`}
                  description="This confirms the student was present but does not mark the appointment as finished."
                  onConfirm={() =>
                    handleAction(
                      confirmAttendance,
                      appointment.id,
                      "Attendance confirmed!",
                      undefined,
                      "Happening"
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
          { type: "divider" },
          {
            key: "reset-status",
            icon: <UserSwitchOutlined style={{ color: "#1890ff" }} />,
            disabled: isAnyActionLoading,
            label: (
              <Tooltip title="Reset this user's appointment status to Normal, allowing them to book appointments again">
                <Popconfirm
                  title={`Reset "${
                    appointment.studentName ?? "N/A"
                  }"'s appointment status to Normal?`}
                  description="This will allow the user to schedule appointments again."
                  onConfirm={() =>
                    handleAction(
                      updateUserAppointmentStatusToNormal,
                      appointment.id,
                      "User appointment status reset to Normal!",
                      appointment.studentEmail
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
                    Reset User Status
                  </span>
                </Popconfirm>
              </Tooltip>
            ),
          }
        );
      }

      return items;
    },
    [handleAction, handleEditClick]
  );

  // Component for rendering a single appointment row
  const AppointmentRow = React.memo(
    ({
      index,
      data,
    }: {
      index: number;
      data: {
        appointments: AppointmentResponseDTO[];
        actionLoading: string | null;
        getActionMenuItems: (
          appointment: AppointmentResponseDTO,
          actionLoading: string | null
        ) => any[];
        handleBlockClick: (id: string) => void;
        expandedKeys: string[];
        toggleExpand: (id: string) => void;
      };
    }) => {
      const [activeDropdown, setActiveDropdown] = useState<string | null>(null);
      const appointment = data.appointments[index];
      if (!appointment) return null;

      console.log(
        "Rendering AppointmentRow:",
        appointment.id,
        "Status:",
        appointment.status
      );

      return (
        <div className="appointment-card">
          <Collapse
            activeKey={data.expandedKeys}
            onChange={() => {
              console.log("Collapse toggled for ID:", appointment.id);
              data.toggleExpand(appointment.id);
            }}
            expandIconPosition="end"
            items={[
              {
                key: appointment.id,
                label: (
                  <Row align="middle" gutter={[8, 8]}>
                    <Col xs={24} sm={6}>
                      <Text
                        className="student-name"
                        ellipsis={{ tooltip: appointment.studentName }}
                      >
                        {appointment.studentName ?? "N/A"}
                      </Text>
                    </Col>
                    <Col xs={24} sm={6}>
                      <Text
                        type="secondary"
                        ellipsis={{ tooltip: appointment.staffName }}
                      >
                        {appointment.staffName ?? "N/A"}
                      </Text>
                    </Col>
                    <Col xs={24} sm={5}>
                      <Text type="secondary" className="text-xs">
                        {formatDate(appointment.appointmentDate)}
                        <br />
                        {formatTime(appointment.appointmentDate)} -{" "}
                        {formatTime(appointment.endTime)}
                      </Text>
                    </Col>
                    <Col xs={24} sm={4}>
                      <Tooltip title={getStatusTooltip(appointment.status)}>
                        <Tag
                          color={getStatusColor(appointment.status)}
                          icon={getStatusIcon(appointment.status)}
                          className="status-tag"
                          aria-label={`Status: ${
                            appointment.status === "CancelledAfterConfirm"
                              ? "Cancelled"
                              : appointment.status
                          }`}
                        >
                          {appointment.status === "CancelledAfterConfirm"
                            ? "Cancelled"
                            : appointment.status}
                        </Tag>
                      </Tooltip>
                    </Col>
                    <Col xs={24} sm={3} className="text-right">
                      <Space size="small">
                        <Tooltip title="View appointment details">
                          <Button
                            type="link"
                            icon={<InfoCircleOutlined />}
                            onClick={(e) => {
                              e.stopPropagation();
                              data.handleBlockClick(appointment.id);
                            }}
                            aria-label="View appointment details"
                          />
                        </Tooltip>
                        {(appointment.status === "Scheduled" ||
                          appointment.status === "Happening" ||
                          appointment.status === "Missed") && (
                          <Dropdown
                            menu={{
                              items: data.getActionMenuItems(
                                appointment,
                                data.actionLoading
                              ),
                            }}
                            trigger={["click"]}
                            open={activeDropdown === appointment.id}
                            onOpenChange={(open) => {
                              console.log(
                                "Dropdown open:",
                                open,
                                appointment.id
                              );
                              if (open && !data.actionLoading) {
                                setActiveDropdown(appointment.id);
                              } else {
                                setActiveDropdown(null);
                              }
                            }}
                            overlayStyle={{ zIndex: 1000 }}
                          >
                            <Button
                              type="link"
                              icon={<EllipsisOutlined />}
                              onClick={(e) => e.stopPropagation()}
                              aria-label="More actions"
                              aria-expanded={activeDropdown === appointment.id}
                              disabled={!!data.actionLoading}
                            />
                          </Dropdown>
                        )}
                      </Space>
                    </Col>
                  </Row>
                ),
                children: (
                  <div className="details-card">
                    <Row gutter={[16, 16]} className="details-section">
                      <Col xs={24} sm={12}>
                        <div className="details-title">Patient Information</div>
                        <div className="details-item">
                          <UserOutlined />
                          <span>{appointment.studentName ?? "N/A"}</span>
                        </div>
                        <div className="details-item">
                          <MailOutlined />
                          <span>{appointment.studentEmail ?? "N/A"}</span>
                        </div>
                      </Col>
                      <Col xs={24} sm={12}>
                        <div className="details-title">
                          Healthcare Officer Information
                        </div>
                        <div className="details-item">
                          <UserOutlined />
                          <span>{appointment.staffName ?? "N/A"}</span>
                        </div>
                        <div className="details-item">
                          <PhoneOutlined />
                          <span>{appointment.staffEmail ?? "N/A"}</span>
                        </div>
                        <div className="details-item">
                          <MailOutlined />
                          <span>{appointment.staffPhone ?? "N/A"}</span>
                        </div>
                      </Col>
                    </Row>
                    <Row gutter={[16, 16]} className="details-section">
                      <Col xs={24} sm={12}>
                        <div className="details-title">Appointment Details</div>
                        <div className="details-item">
                          <CalendarOutlined />
                          <span>
                            Date: {formatDate(appointment.appointmentDate)}
                          </span>
                        </div>
                        <div className="details-item">
                          <ClockCircleOutlined />
                          <span>
                            Start: {formatTime(appointment.appointmentDate)}
                          </span>
                        </div>
                        <div className="details-item">
                          <ClockCircleOutlined />
                          <span>End: {formatTime(appointment.endTime)}</span>
                        </div>
                      </Col>
                      <Col xs={24} sm={12}>
                        <div className="details-title">
                          Additional Information
                        </div>
                        <div className="details-item">
                          <span>Reason: {appointment.reason ?? "N/A"}</span>
                        </div>
                      </Col>
                    </Row>
                  </div>
                ),
              },
            ]}
          />
        </div>
      );
    },
    (prevProps, nextProps) =>
      prevProps.index === nextProps.index &&
      prevProps.data.appointments === nextProps.data.appointments &&
      prevProps.data.actionLoading === nextProps.data.actionLoading &&
      prevProps.data.expandedKeys === nextProps.data.expandedKeys
  );

  AppointmentRow.displayName = "AppointmentRow";

  // Sticky header for column labels
  const StickyHeader = React.memo(() => (
    <div className="sticky-header">
      <Row align="middle" gutter={[8, 8]}>
        <Col xs={24} sm={6}>
          <Text strong>User</Text>
        </Col>
        <Col xs={24} sm={6}>
          <Text strong>Healthcare Officer</Text>
        </Col>
        <Col xs={24} sm={5}>
          <Text strong>Date & Time</Text>
        </Col>
        <Col xs={24} sm={4}>
          <Text strong>Status</Text>
        </Col>
        <Col xs={24} sm={3} className="text-right">
          <Text strong>Actions</Text>
        </Col>
      </Row>
    </div>
  ));

  StickyHeader.displayName = "StickyHeader";

  const toggleExpand = useCallback((id: string) => {
    console.log("toggleExpand called for ID:", id);
    setExpandedKeys((prev) =>
      prev.includes(id) ? prev.filter((key) => key !== id) : [...prev, id]
    );
  }, []);

  const filteredTabAppointments = useMemo(() => {
    console.log("Computing filteredTabAppointments");
    return filteredAppointments.filter((a) =>
      activeTab === "All"
        ? true
        : activeTab === "Cancelled"
        ? a.status === "Cancelled" || a.status === "CancelledAfterConfirm"
        : a.status === activeTab
    );
  }, [filteredAppointments, activeTab]);

  const rowData = useMemo(
    () => ({
      appointments: filteredTabAppointments,
      actionLoading,
      getActionMenuItems,
      handleBlockClick,
      expandedKeys,
      toggleExpand,
    }),
    [
      filteredTabAppointments,
      actionLoading,
      getActionMenuItems,
      handleBlockClick,
      expandedKeys,
      toggleExpand,
    ]
  );

  const renderTabIcon = (status: string) => {
    switch (status) {
      case "All":
        return <CalendarOutlined className="tab-icon" />;
      case "Scheduled":
        return <ClockCircleOutlined className="tab-icon" />;
      case "Happening":
        return <PlayCircleOutlined className="tab-icon" />;
      case "Finished":
        return <CheckCircleFilled className="tab-icon" />;
      case "Missed":
        return <CloseCircleFilled className="tab-icon" />;
      case "Cancelled":
        return <StopOutlined className="tab-icon" />;
      default:
        return null;
    }
  };

  const renderEmptyState = (status: string) => (
    <div className="empty-state-card">
      {renderTabIcon(status)}
      <Text className="text-gray-500" strong>
        No{" "}
        {status === "All"
          ? "appointments"
          : status.toLowerCase() + " appointments"}{" "}
        found
      </Text>
      <Text type="secondary" style={{ marginTop: 8 }}>
        {status === "All"
          ? "There are no appointments matching your filters."
          : `There are no ${status.toLowerCase()} appointments at this time.`}
      </Text>
      <Button
        type="link"
        onClick={resetFilters}
        icon={<ReloadOutlined />}
        style={{ marginTop: 12 }}
      >
        Reset filters
      </Button>
    </div>
  );

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
        undefined, // other parameters...
      );

      if (response.isSuccess && response.data) {
        const options = response.data.map((user: UserResponseDTO) => ({
          value: user.email,
          label: `${user.fullName} (${user.email})`,
        }));
        setUserOptions(options);
      } else {
        console.error("Failed to fetch users:", response.message);
      }
    } catch (error) {
      console.error("Error fetching users:", error);
    } finally {
      setLoadingUsers(false);
    }
  }, []);

  const handleResetUserStatus = () => {
    if (!resetStatusUserId) {
      messageApi.error("Please select a User Email");
      return;
    }
    
    handleAction(
      updateUserAppointmentStatusToNormal,
      resetStatusUserId,
      "User appointment status reset to Normal!",
      resetStatusUserId
    );
    setResetUserModalVisible(false);
    setResetStatusUserId(null);
  };

  // Filter options when searching
  const handleUserSearch = debounce((value: string) => {
    // This will use the existing options but filter them based on the search input
    // If you want to do a server-side search, you would call the API here
    console.log("Searching for user:", value);
  }, 300);

  // Open modal and fetch users if not already fetched
  const handleOpenResetModal = () => {
    setResetUserModalVisible(true);
    if (userOptions.length === 0) {
      fetchUserOptions();
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-screen bg-gray-50">
        <Spin size="large" tip="Loading appointments..." />
      </div>
    );
  }

  console.log("AppointmentManagementForAdmin rendered");
  return (
    <div className="p-4 bg-gray-50 min-h-screen">
      {contextHolder}
      <style>{styles}</style>
      <Card className="mb-6 shadow-md rounded-xl">
        <Title level={2} className="text-center mb-4 text-gray-800">
          Appointment Management
        </Title>
        <Collapse
          defaultActiveKey={["1"]}
          bordered={false}
          className="filter-section"
          items={[
            {
              key: "1",
              label: (
                <Space>
                  <FilterOutlined />
                  <Text strong>Filters</Text>
                  {activeFilterCount > 0 && (
                    <Badge
                      count={activeFilterCount}
                      style={{ backgroundColor: "#1890ff" }}
                    />
                  )}
                </Space>
              ),
              children: (
                <Row gutter={[16, 16]} align="middle">
                  <Col xs={24} sm={12} md={8}>
                    <Input.Search
                      placeholder="Search by student or staff name"
                      value={searchText}
                      onChange={(e) => debouncedSetSearchText(e.target.value)}
                      allowClear
                      prefix={<SearchOutlined />}
                      className="search-input"
                      aria-label="Search appointments by student or staff name"
                    />
                  </Col>
                  <Col xs={24} sm={12} md={8}>
                    <RangePicker
                      value={dateRange}
                      onChange={handleDateRangeChange}
                      format="DD/MM/YYYY"
                      className="w-full rounded-lg"
                      presets={rangePresets}
                      prefix={<CalendarOutlined />}
                      aria-label="Select date range for appointments"
                    />
                  </Col>
                  <Col xs={24} sm={24} md={8}>
                    <Space size="small" wrap>
                      <Tooltip title="Reset all filters">
                        <Button
                          onClick={resetFilters}
                          icon={<ReloadOutlined />}
                          className="rounded-lg action-button"
                          aria-label="Reset all filters"
                        />
                      </Tooltip>
                      <Tooltip title="Refresh appointments">
                        <Button
                          onClick={handleRefresh}
                          icon={<ReloadOutlined />}
                          className="rounded-lg action-button"
                          aria-label="Refresh appointments"
                          loading={loading}
                        >
                          Refresh
                        </Button>
                      </Tooltip>
                      <Tooltip title="Reset user appointment status to Normal">
                        <Button
                          type="default"
                          icon={<UserSwitchOutlined />}
                          className="rounded-lg action-button"
                          aria-label="Reset user appointment status"
                          onClick={handleOpenResetModal}
                        >
                          Reset User
                        </Button>
                      </Tooltip>
                      <Tooltip title="Schedule new appointment">
                        <Button
                          type="primary"
                          icon={<ScheduleOutlined />}
                          className="rounded-lg action-button"
                          onClick={handleScheduleClick}
                        >
                          Schedule
                        </Button>
                      </Tooltip>
                    </Space>
                  </Col>
                </Row>
              ),
              extra: <DownOutlined />,
            },
          ]}
        />
      </Card>

      <Card className="shadow-md rounded-xl">
        <Tabs
          activeKey={activeTab}
          onChange={setActiveTab}
          className="appointment-tabs"
          size="large"
          type="card"
          animated={{ inkBar: true, tabPane: true }}
          tabBarExtraContent={
            <Badge
              count={happeningAppointments.length}
              style={{ backgroundColor: "#ff4d4f" }}
              offset={[-5, 5]}
            >
              <Button
                type="primary"
                onClick={handleHappeningClick}
                icon={<VideoCameraOutlined />}
                danger={happeningAppointments.length > 0}
                ghost={happeningAppointments.length > 0}
              >
                Live Sessions ({happeningAppointments.length})
              </Button>
            </Badge>
          }
        >
          {[
            "All",
            "Scheduled",
            "Happening",
            "Finished",
            "Missed",
            "Cancelled",
          ].map((status) => {
            const appointmentCount =
              status === "All"
                ? filteredAppointments.length
                : status === "Cancelled"
                ? filteredAppointments.filter(
                    (a) =>
                      a.status === "Cancelled" ||
                      a.status === "CancelledAfterConfirm"
                  ).length
                : filteredAppointments.filter((a) => a.status === status)
                    .length;

            const statusAppointments =
              status === "All"
                ? filteredAppointments
                : status === "Cancelled"
                ? filteredAppointments.filter(
                    (a) =>
                      a.status === "Cancelled" ||
                      a.status === "CancelledAfterConfirm"
                  )
                : filteredAppointments.filter((a) => a.status === status);

            return (
              <TabPane
                key={status}
                tab={
                  <span>
                    {renderTabIcon(status)}
                    {status}
                    <span className="status-count">{appointmentCount}</span>
                  </span>
                }
              >
                <div className="tab-content-container">
                  {statusAppointments.length === 0 ? (
                    renderEmptyState(status)
                  ) : (
                    <Virtuoso
                      style={{ height: "100%" }}
                      data={statusAppointments}
                      itemContent={(index) => (
                        <AppointmentRow
                          index={index}
                          data={{
                            ...rowData,
                            appointments: statusAppointments,
                          }}
                        />
                      )}
                      components={{
                        Header: StickyHeader,
                      }}
                      computeItemKey={(index, item) => item.id}
                    />
                  )}
                </div>
              </TabPane>
            );
          })}
        </Tabs>
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
        onClose={() => {
          setScheduleModalVisible(false);
          handleRefresh();
        }}
        staffId={user?.userId || ""}
      />

      <UpdateAppointmentModal
        visible={editModalVisible}
        onClose={() => {
          setEditModalVisible(false);
          setSelectedAppointment(null);
        }}
        appointment={selectedAppointment}
        onUpdateSuccess={handleRefresh}
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
          </Button>
        ]}
        width={500}
        destroyOnClose
      >
        <div style={{ padding: "16px 0" }}>
          <Text>Please select the User Email to reset their appointment status to Normal:</Text>
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
                (option?.label ?? '').toLowerCase().includes(input.toLowerCase())
              }
              options={userOptions}
              loading={loadingUsers}
              allowClear
            />
            {loadingUsers && (
              <div style={{ marginTop: 8, color: '#1890ff', display: 'flex', alignItems: 'center' }}>
                <LoadingOutlined style={{ marginRight: 8 }} />
                <Text type="secondary">Loading users...</Text>
              </div>
            )}
          </div>
          <Text type="secondary">
            Resetting the status will allow the user to schedule appointments again if they were previously blocked.
          </Text>
        </div>
      </Modal>
    </div>
  );
}

export default AppointmentManagementForAdmin;
