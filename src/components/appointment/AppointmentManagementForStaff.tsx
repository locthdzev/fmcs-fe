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
} from "antd";
import { toast } from "react-toastify";
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
} from "@ant-design/icons";
import { UserContext } from "@/context/UserContext";
import AppointmentUserDetails from "./AppointmentUserDetails";
import jwtDecode from "jwt-decode";
import moment from "moment-timezone";
import debounce from "lodash/debounce";

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
        toast.error("Failed to load available slots.");
      } finally {
        setLoading(false);
      }
    },
    [appointment?.staffId, token]
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
      toast.error("Authentication token or appointment data missing.");
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
        toast.success("Appointment updated successfully!");
        form.resetFields();
        onUpdateSuccess();
        onClose();
      } else {
        toast.error(`Failed to update: ${response.message || "Unknown error"}`);
      }
    } catch (error: any) {
      console.error("Error updating appointment:", error);
      toast.error("Failed to update appointment.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal
      title={<Title level={4}>Update Appointment</Title>}
      open={visible}
      onCancel={onClose}
      footer={null}
      width={600}
    >
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

  const fetchAvailableSlots = useCallback(
    async (date: string) => {
      if (!token) return;
      setLoading(true);
      try {
        const response = await getAvailableTimeSlots(staffId, date, token);
        setAvailableSlots(response.data?.availableSlots || []);
      } catch (error: any) {
        console.error("Failed to fetch slots:", error);
        toast.error("Failed to load available slots.");
      } finally {
        setLoading(false);
      }
    },
    [staffId, token]
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
      toast.error("Authentication token missing.");
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
        toast.success("Appointment scheduled successfully!");
        form.resetFields();
        onClose();
      } else {
        toast.error(
          `Failed to schedule: ${response.message || "Unknown error"}`
        );
      }
    } catch (error: any) {
      console.error("Error scheduling appointment:", error);
      toast.error("Failed to schedule appointment.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal
      title={<Title level={4}>Schedule Appointment with Student</Title>}
      open={visible}
      onCancel={onClose}
      footer={null}
      width={600}
    >
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
  const [activeTab, setActiveTab] = useState<string>("Scheduled");

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
          toast.error(result.message || "Failed to fetch appointments");
        }
      } catch (error: any) {
        console.error("Error fetching appointments:", error);
        if (error.response?.status === 401) {
          toast.error("Session expired. Please log in again.");
          router.push("/");
        } else {
          toast.error("Failed to load appointments.");
        }
      } finally {
        setLoading(false);
      }
    },
    [router]
  );

  useEffect(() => {
    const token = Cookies.get("token");
    if (!token) {
      router.push("/");
      return;
    }

    try {
      const decoded: any = jwtDecode(token);
      const userId = decoded.userid;
      if (!userId) {
        router.push("/");
        return;
      }
      fetchAppointments(userId);
    } catch (error) {
      console.error("Invalid token:", error);
      router.push("/");
    }
  }, [fetchAppointments, router]);

  const handleRefresh = () => {
    const token = Cookies.get("token");
    if (!token) {
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
      router.push("/");
    }
  };

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
        toast.success(successMsg);
        const staffId = jwtDecode<any>(token).userid || user?.userId;
        if (staffId) {
          await fetchAppointments(staffId);
          if (newTab) {
            setActiveTab(newTab);
          }
        }
      } else {
        toast.error(
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
        toast.error("Session expired or unauthorized. Please log in again.");
        router.push("/");
      } else {
        toast.error(`An error occurred: ${error.message || "Unknown error"}`);
      }
    } finally {
      setActionLoading(null);
      setActiveDropdown(null);
      setResetStatusUserId(null);
    }
  };

  const handleEditClick = (appointment: AppointmentResponseDTO) => {
    setSelectedAppointment(appointment);
    setEditModalVisible(true);
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

    // Add Update Appointment option for editable statuses
    if (["Scheduled"].includes(appointment.status)) {
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
            <Tooltip>
              <Popconfirm
                title={`Are you sure you want to mark "${appointment.studentName}"'s appointment as fully completed?`}
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
            <Tooltip>
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
            <Tooltip>
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
        { type: "divider" },
        {
          key: "cancel",
          icon: <StopOutlined style={{ color: "#bfbfbf" }} />,
          disabled: isAnyActionLoading,
          label: (
            <Tooltip>
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

    if (appointment.status === "Happening") {
      items.push(
        {
          key: "complete",
          icon: <CheckCircleOutlined style={{ color: "#389e0d" }} />,
          disabled: isAnyActionLoading,
          label: (
            <Tooltip>
              <Popconfirm
                title={`Are you sure you want to mark "${appointment.studentName}"'s appointment as fully completed?`}
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
            <Tooltip>
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
            <Tooltip>
              <Popconfirm
                title={`Are you sure you want to mark "${appointment.studentName}"'s appointment as fully completed?`}
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
            <Tooltip>
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
        { type: "divider" },
        {
          key: "reset-status",
          icon: <UserSwitchOutlined style={{ color: "#1890ff" }} />,
          disabled: isAnyActionLoading,
          label: (
            <Tooltip title="Reset this user's appointment status to Normal, allowing them to book appointments again">
              <Popconfirm
                title={`Reset "${appointment.studentName}"'s appointment status to Normal?`}
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
  };

  const tabItems = (
    ["Scheduled", "Finished", "Missed", "Cancelled"] as const
  ).map((status) => ({
    key: status,
    label: (
      <span>
        <Tag color={getStatusColor(status)}>{status}</Tag>
        {
          filteredAppointments.filter((a) =>
            status === "Cancelled"
              ? a.status === "Cancelled" || a.status === "CancelledAfterConfirm"
              : a.status === status
          ).length
        }
      </span>
    ),
    children: (
      <div className="max-h-[70vh] overflow-y-auto pr-2">
        {filteredAppointments.filter((a) =>
          status === "Cancelled"
            ? a.status === "Cancelled" || a.status === "CancelledAfterConfirm"
            : a.status === status
        ).length === 0 ? (
          <Card className="text-center py-6 rounded-xl shadow-sm">
            <Text className="text-gray-500">
              No {status.toLowerCase()} appointments.
            </Text>
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
                className="mb-2 rounded-xl shadow-sm hover:shadow-md transition-shadow"
                items={[
                  {
                    key: appointment.id,
                    label: (
                      <div className="flex items-center justify-between">
                        <Space size="small">
                          <Text
                            strong
                            ellipsis={{ tooltip: appointment.studentName }}
                          >
                            {appointment.studentName}
                          </Text>
                          <Text type="secondary" className="text-xs">
                            {formatTime(appointment.appointmentDate)} -{" "}
                            {formatTime(appointment.endTime)}
                          </Text>
                        </Space>
                        <Space size="small">
                          <Tooltip title={getStatusTooltip(appointment.status)}>
                            <Tag
                              color={getStatusColor(appointment.status)}
                              icon={getStatusIcon(appointment.status)}
                              className="flex items-center gap-1"
                            >
                              {appointment.status === "CancelledAfterConfirm"
                                ? "Cancelled"
                                : appointment.status}
                            </Tag>
                          </Tooltip>
                          <Tooltip title="View appointment details">
                            <Button
                              type="link"
                              icon={<InfoCircleOutlined />}
                              onClick={(e) => {
                                e.stopPropagation();
                                handleBlockClick(appointment.id);
                              }}
                              aria-label="View appointment details"
                            />
                          </Tooltip>
                          {(appointment.status === "Scheduled" ||
                            appointment.status === "Happening" ||
                            // appointment.status === "Finished" ||
                            appointment.status === "Missed") && (
                            <Dropdown
                              menu={{ items: getActionMenuItems(appointment) }}
                              trigger={["click"]}
                              open={activeDropdown === appointment.id}
                              onOpenChange={(open) => {
                                if (open && !actionLoading) {
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
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setActiveDropdown(
                                    activeDropdown === appointment.id
                                      ? null
                                      : appointment.id
                                  );
                                }}
                                aria-label="More actions"
                                disabled={!!actionLoading}
                              />
                            </Dropdown>
                          )}
                        </Space>
                      </div>
                    ),
                    children: (
                      <div
                        className="flex flex-col gap-2 p-2 cursor-pointer hover:bg-gray-100 transition-colors"
                        onClick={() => handleBlockClick(appointment.id)}
                      >
                        <Text type="secondary" className="text-sm">
                          <CalendarOutlined className="mr-1" />{" "}
                          <strong>Date:</strong>{" "}
                          {formatDate(appointment.appointmentDate)}
                        </Text>
                        <Text type="secondary" className="text-sm">
                          <ClockCircleOutlined className="mr-1" />{" "}
                          <strong>Start Time:</strong>{" "}
                          {formatTime(appointment.appointmentDate)}
                        </Text>
                        <Text type="secondary" className="text-sm">
                          <ClockCircleOutlined className="mr-1" />{" "}
                          <strong>End Time:</strong>{" "}
                          {formatTime(appointment.endTime)}
                        </Text>
                        <Text
                          className="text-sm"
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
      <style>{styles}</style>
      <Card className="mb-6 shadow-md rounded-xl">
        <Title level={2} className="text-center mb-4 text-gray-800">
          Staff Appointment Dashboard
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
                      placeholder="Search by student name"
                      value={searchText}
                      onChange={(e) => debouncedSetSearchText(e.target.value)}
                      allowClear
                      prefix={<SearchOutlined />}
                      className="search-input"
                      aria-label="Search appointments by student name"
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
                      <Button
                        onClick={resetFilters}
                        icon={<ReloadOutlined />}
                        className="rounded-lg"
                        aria-label="Reset all filters"
                      >
                        Reset
                      </Button>
                      <Button
                        onClick={handleRefresh}
                        icon={<ReloadOutlined />}
                        className="rounded-lg"
                        aria-label="Refresh appointments"
                      >
                        Refresh
                      </Button>

                      <Button
                        type="primary"
                        icon={<CalendarOutlined />}
                        onClick={() => setScheduleModalVisible(true)}
                        className="rounded-lg"
                        aria-label="Schedule new appointment"
                      >
                        Schedule
                      </Button>
                      <Popconfirm
                        title="Reset User Appointment Status"
                        description={
                          <div>
                            <p>
                              Please enter the User Email to reset their
                              appointment status:
                            </p>
                            <Input
                              placeholder="User Email"
                              value={resetStatusUserId || ""}
                              onChange={(e) =>
                                setResetStatusUserId(e.target.value)
                              }
                              onClick={(e) => e.stopPropagation()}
                            />
                          </div>
                        }
                        onConfirm={() => {
                          if (resetStatusUserId) {
                            handleAction(
                              updateUserAppointmentStatusToNormal,
                              resetStatusUserId,
                              "User appointment status reset to Normal!",
                              resetStatusUserId
                            );
                          } else {
                            toast.error("Please enter a User Email");
                          }
                        }}
                        onCancel={() => setResetStatusUserId(null)}
                        okText="Reset"
                        cancelText="Cancel"
                        placement="bottomRight"
                      >
                        <Button
                          type="default"
                          icon={<UserSwitchOutlined />}
                          className="rounded-lg"
                          aria-label="Reset user appointment status"
                        >
                          Reset User
                        </Button>
                      </Popconfirm>
                    </Space>
                  </Col>
                </Row>
              ),
              extra: <DownOutlined />,
            },
          ]}
        />
      </Card>

      <>
        {happeningAppointments.length > 0 && (
          <Card
            className="mb-6 shadow-md rounded-xl"
            title={<Title level={4}>Current Happening Appointments</Title>}
          >
            <div className="max-h-[30vh] overflow-y-auto pr-2">
              {happeningAppointments.map((appointment) => (
                <Collapse
                  key={appointment.id}
                  className="mb-2 rounded-xl shadow-sm hover:shadow-md transition-shadow blinking-border"
                  items={[
                    {
                      key: appointment.id,
                      label: (
                        <div className="flex items-center justify-between">
                          <Space size="small">
                            <Text
                              strong
                              ellipsis={{ tooltip: appointment.studentName }}
                            >
                              {appointment.studentName}
                            </Text>
                            <Text type="secondary" className="text-xs">
                              {formatTime(appointment.appointmentDate)} -{" "}
                              {formatTime(appointment.endTime)}
                            </Text>
                          </Space>
                          <Space size="small">
                            <Tooltip
                              title={getStatusTooltip(appointment.status)}
                            >
                              <Tag
                                color={getStatusColor(appointment.status)}
                                icon={getStatusIcon(appointment.status)}
                                className="flex items-center gap-1"
                              >
                                {appointment.status}
                              </Tag>
                            </Tooltip>
                            <Tooltip title="View appointment details">
                              <Button
                                type="link"
                                icon={<InfoCircleOutlined />}
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleBlockClick(appointment.id);
                                }}
                                aria-label="View appointment details"
                              />
                            </Tooltip>
                            <Dropdown
                              menu={{ items: getActionMenuItems(appointment) }}
                              trigger={["click"]}
                              open={activeDropdown === appointment.id}
                              onOpenChange={(open) => {
                                if (open && !actionLoading) {
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
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setActiveDropdown(
                                    activeDropdown === appointment.id
                                      ? null
                                      : appointment.id
                                  );
                                }}
                                aria-label="More actions"
                                disabled={!!actionLoading}
                              />
                            </Dropdown>
                          </Space>
                        </div>
                      ),
                      children: (
                        <div
                          className="flex flex-col gap-2 p-2 cursor-pointer hover:bg-gray-100 transition-colors"
                          onClick={() => handleBlockClick(appointment.id)}
                        >
                          <Text type="secondary" className="text-sm">
                            <CalendarOutlined className="mr-1" />{" "}
                            <strong>Date:</strong>{" "}
                            {formatDate(appointment.appointmentDate)}
                          </Text>
                          <Text type="secondary" className="text-sm">
                            <ClockCircleOutlined className="mr-1" />{" "}
                            <strong>Start Time:</strong>{" "}
                            {formatTime(appointment.appointmentDate)}
                          </Text>
                          <Text type="secondary" className="text-sm">
                            <ClockCircleOutlined className="mr-1" />{" "}
                            <strong>End Time:</strong>{" "}
                            {formatTime(appointment.endTime)}
                          </Text>
                          <Text
                            className="text-sm"
                            ellipsis={{ tooltip: appointment.reason }}
                          >
                            <strong>Reason:</strong>{" "}
                            {appointment.reason || "N/A"}
                          </Text>
                        </div>
                      ),
                    },
                  ]}
                  expandIconPosition="end"
                />
              ))}
            </div>
          </Card>
        )}

        <Tabs
          activeKey={activeTab}
          onChange={setActiveTab}
          className="px-2"
          items={tabItems}
        />
      </>

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
    </div>
  );
}

export default AppointmentManagementForStaff;
