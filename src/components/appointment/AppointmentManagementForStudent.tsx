import React, {
  useState,
  useEffect,
  useCallback,
  useContext,
  useRef,
} from "react";
import {
  Button,
  Input,
  Select,
  DatePicker,
  Popconfirm,
  Space,
  Row,
  Col,
  Card,
  Typography,
  Badge,
  Tag,
  Tooltip,
  Spin,
  Modal,
  message,
} from "antd";
import dayjs, { Dayjs } from "dayjs";
import isBetween from "dayjs/plugin/isBetween";
import Cookies from "js-cookie";
import { useRouter } from "next/router";
import {
  getAppointmentsByUserId,
  AppointmentResponseDTO,
  PagedResultDTO,
  setupStudentAppointmentRealTime,
  cancelAppointment,
  confirmAppointment,
} from "@/api/appointment-api";
import {
  SearchOutlined,
  PlusOutlined,
  EyeOutlined,
  CloseCircleOutlined,
  DeleteOutlined,
  FilterOutlined,
  ClockCircleOutlined,
  PlayCircleOutlined,
  CheckCircleFilled,
  CloseCircleFilled,
  StopOutlined,
  DownloadOutlined,
  CalendarOutlined,
  ReloadOutlined,
  TagOutlined,
} from "@ant-design/icons";
import { UserContext } from "@/context/UserContext";
import AppointmentDetails from "./AppointmentDetails";
import { HubConnection } from "@microsoft/signalr";

dayjs.extend(isBetween);

const { Option } = Select;
const { RangePicker } = DatePicker;
const { Title, Text } = Typography;

const formatDateTime = (datetime: string | undefined) => {
  if (!datetime) return "";
  return dayjs(datetime).format("DD/MM/YYYY HH:mm:ss");
};

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
    case "CancelledAfterConfirm":
      return "gray";
    default:
      return "default";
  }
};

const getStatusIcon = (status: string | undefined) => {
  switch (status) {
    case "Scheduled":
      return <ClockCircleOutlined style={{ marginRight: 4 }} />;
    case "Happening":
      return <PlayCircleOutlined style={{ marginRight: 4 }} />;
    case "Finished":
      return <CheckCircleFilled style={{ marginRight: 4 }} />;
    case "Missed":
      return <CloseCircleFilled style={{ marginRight: 4 }} />;
    case "CancelledAfterConfirm":
      return <StopOutlined style={{ marginRight: 4 }} />;
    default:
      return null;
  }
};

const getStatusTooltip = (status: string | undefined) => {
  switch (status) {
    case "Scheduled":
      return "Appointment is booked and upcoming.";
    case "Happening":
      return "Appointment is currently in progress.";
    case "Finished":
      return "Appointment has been completed.";
    case "Missed":
      return "Appointment was not attended.";
    case "CancelledAfterConfirm":
      return "Appointment was cancelled after confirmation.";
    default:
      return "";
  }
};

export function AppointmentManagementForStudent() {
  const [messageApi, contextHolder] = message.useMessage();
  const router = useRouter();
  const { user } = useContext(UserContext)!;
  const [appointments, setAppointments] = useState<AppointmentResponseDTO[]>(
    []
  );
  const [loading, setLoading] = useState(false);
  const [selectedAppointment, setSelectedAppointment] =
    useState<AppointmentResponseDTO | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [total, setTotal] = useState(0);
  const [searchText, setSearchText] = useState("");
  const [statusFilter, setStatusFilter] = useState<string | undefined>(
    undefined
  );
  const [dateRange, setDateRange] = useState<[Dayjs, Dayjs] | null>(null);
  const [sortBy, setSortBy] = useState("CreateAt");
  const [ascending, setAscending] = useState(false);
  const [selectedRowKeys, setSelectedRowKeys] = useState<React.Key[]>([]);
  const [hoveredAppointment, setHoveredAppointment] = useState<string | null>(
    null
  );
  const [isDetailsModalVisible, setIsDetailsModalVisible] = useState(false);
  const [direction, setDirection] = useState<"horizontal" | "vertical">(
    "horizontal"
  );
  const justCancelledRef = useRef<Set<string>>(new Set());

  const token = Cookies.get("token");

  const resetFilters = () => {
    setSearchText("");
    setStatusFilter(undefined);
    setDateRange(null);
  };

  useEffect(() => {
    const updateDirection = () => {
      setDirection(window.innerWidth <= 800 ? "vertical" : "horizontal");
    };
    updateDirection();
    window.addEventListener("resize", updateDirection);
    return () => window.removeEventListener("resize", updateDirection);
  }, []);

  const fetchAppointments = useCallback(async () => {
    if (!user?.auth || !user?.userId) return;
    setLoading(true);
    try {
      console.log("Fetching appointments for user:", user.userId, {
        currentPage,
        pageSize,
        sortBy,
        ascending,
      });
      const result: PagedResultDTO<AppointmentResponseDTO> =
        await getAppointmentsByUserId(
          user.userId,
          currentPage,
          pageSize,
          sortBy,
          ascending
        );
      if (result.isSuccess) {
        setAppointments(result.data || []);
        setTotal(result.totalRecords || 0);
      } else {
        console.warn("API returned unsuccessful response:", result.message);
        if (result.message === "No active appointments found.") {
          setAppointments([]);
          setTotal(0);
          return;
        }
        throw new Error(result.message || "Failed to fetch appointments");
      }
    } catch (error: any) {
      console.error("Error fetching appointments:", error.message, error.stack);
      setAppointments([]);
      setTotal(0);
    } finally {
      setLoading(false);
    }
  }, [user?.userId, currentPage, pageSize, sortBy, ascending]);

  useEffect(() => {
    if (!token) {
      console.warn("No token found, redirecting to login");
      router.push("/");
      return;
    }

    let connection: HubConnection | null = null;
    let isMounted = true;

    const initialize = async () => {
      await fetchAppointments();
      if (isMounted && !connection) {
        connection = setupStudentAppointmentRealTime(
          user.userId,
          (data) => {
            console.log("Received student appointment update:", data);
            if (isMounted) {
              fetchAppointments();
              if (data.eventType === "SlotLocked") {
                messageApi.success("New appointment scheduled!");
              } else if (data.eventType === "Confirmed") {
                messageApi.success("Appointment confirmed!");
              } else if (data.eventType === "Released") {
                if (!justCancelledRef.current.has(data.appointmentId)) {
                  messageApi.success("Appointment cancelled!");
                } else {
                  justCancelledRef.current.delete(data.appointmentId);
                }
              }
            }
          },
          (error: Error) => {
            console.error("SignalR error:", error);
            if (isMounted) {
              messageApi.error(
                "Real-time updates failed. Please refresh the page."
              );
            }
          }
        );
      }
    };

    initialize();

    return () => {
      isMounted = false;
      if (connection) {
        connection.stop().then(() => console.log("SignalR connection stopped"));
        connection = null;
      }
    };
  }, [fetchAppointments, token, router, user?.userId, messageApi]);

  const handleCancel = async (
    id: string,
    e?: React.MouseEvent<HTMLElement>
  ) => {
    if (e) e.stopPropagation();
    try {
      if (!token) {
        throw new Error("Authentication token is missing. Please log in.");
      }
      justCancelledRef.current.add(id);
      const response = await cancelAppointment(id, token);
      if (response.isSuccess) {
        messageApi.success("Appointment cancelled!");
        setIsDetailsModalVisible(false);
        setSelectedAppointment(null);
        fetchAppointments();
        setTimeout(() => {
          justCancelledRef.current.delete(id);
        }, 5000);
      } else {
        justCancelledRef.current.delete(id);
        messageApi.error(response.message || "Failed to cancel appointment.");
      }
    } catch (error: any) {
      justCancelledRef.current.delete(id);
      console.error("Error cancelling appointment:", error);
      messageApi.error(error.message || "Unable to cancel appointment.");
      if (error.message?.includes("token")) {
        router.push("/");
      }
    }
  };

  const formatDateTimeLong = (datetime: string | undefined) => {
    if (!datetime) return "";
    return dayjs(datetime).format("DD MMMM YYYY HH:mm:ss");
  };

  const filteredAppointments = React.useMemo(() => {
    console.log("Filtering with:", {
      searchText,
      statusFilter,
      dateRange: dateRange
        ? [dateRange[0].format("YYYY-MM-DD"), dateRange[1].format("YYYY-MM-DD")]
        : null,
    });
    if (!searchText && !statusFilter && !dateRange) return appointments;
    return appointments.filter((appointment) => {
      const matchesSearch = searchText
        ? appointment.staffName
            ?.toLowerCase()
            .includes(searchText.toLowerCase())
        : true;
      const matchesStatus = statusFilter
        ? appointment.status === statusFilter
        : true;
      const matchesDate =
        dateRange && appointment.appointmentDate
          ? dayjs(appointment.appointmentDate).isValid() &&
            dayjs(appointment.appointmentDate).isBetween(
              dateRange[0],
              dateRange[1],
              "day",
              "[]"
            )
          : true;
      console.log(`Appointment ${appointment.id}:`, {
        date: appointment.appointmentDate,
        matchesDate,
      });
      return matchesSearch && matchesStatus && matchesDate;
    });
  }, [appointments, searchText, statusFilter, dateRange]);

  const handleBulkCancel = async () => {
    try {
      if (!token) {
        throw new Error("Authentication token is missing. Please log in.");
      }
      await Promise.all(
        selectedRowKeys.map((id) => cancelAppointment(id as string, token))
      );
      messageApi.success("Selected appointments cancelled successfully!");
      setSelectedRowKeys([]);
      fetchAppointments();
    } catch (error: any) {
      console.error("Error bulk cancelling appointments:", error);
      messageApi.error(
        error.message || "Unable to cancel selected appointments."
      );
      if (error.message?.includes("token")) {
        router.push("/");
      }
    }
  };

  const showDetails = (appointment: AppointmentResponseDTO) => {
    setSelectedAppointment(appointment);
    setIsDetailsModalVisible(true);
  };

  const redirectToStaffSchedule = () => {
    router.push("https://fmcs.io.vn/schedule-appointment"); // Adjust URL as needed
  };

  const handleExport = () => {
    // Placeholder for export functionality
    const csvContent = filteredAppointments
      .map(
        (appointment) =>
          `${appointment.staffName},${formatDateTime(
            appointment.appointmentDate
          )},${appointment.status},${appointment.reason || ""},${formatDateTime(
            appointment.createdAt
          )}`
      )
      .join("\n");
    const header = "Staff Name,Date & Time,Status,Reason,Booked At\n";
    const blob = new Blob([header + csvContent], { type: "text/csv" });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = "appointments.csv";
    link.click();
    window.URL.revokeObjectURL(url);
    messageApi.success("Appointments exported successfully!");
  };

  const topContent = (
    <Card
      className="mb-6 shadow-lg transition-all duration-300 hover:shadow-xl"
      bordered={false}
      style={{
        borderRadius: "16px",
        background: "linear-gradient(to right, #f9fafb, #f3f4f6)",
      }}
    >
      <Row gutter={[24, 24]}>
        <Col span={24}>
          <Typography.Title
            level={3}
            className="mb-2 transition-colors duration-200 flex items-center"
            style={{ color: "#2c3e76", fontWeight: 700 }}
          >
            <CalendarOutlined style={{ marginRight: 12, color: "#4b6cb7" }} />
            My Appointments
          </Typography.Title>
          <Typography.Text className="text-gray-600">
            Manage your healthcare appointments and schedules
          </Typography.Text>
        </Col>
        <Col span={24}>
          <Space
            size="middle"
            wrap
            direction={direction}
            style={{
              width: "100%",
              justifyContent:
                direction === "horizontal" ? "flex-start" : "center",
            }}
          >
            <Input.Search
              placeholder="Search by staff"
              value={searchText}
              onChange={(e) => setSearchText(e.target.value)}
              onSearch={(value) => setSearchText(value)}
              style={{ width: "100%", maxWidth: 250 }}
              allowClear
              enterButton={<SearchOutlined />}
              className="search-input"
            />
            <Button
              icon={<ReloadOutlined />}
              onClick={resetFilters}
              className="filter-button"
            />
            <Select
              prefix={<TagOutlined />}
              placeholder="Status"
              value={statusFilter}
              onChange={(value) => setStatusFilter(value)}
              onClear={() => setStatusFilter(undefined)}
              style={{ width: "100%", maxWidth: 200 }}
              allowClear
              className="status-filter"
            >
              <Option value="Scheduled">
                <Badge status="processing" color="#1890ff" text="Scheduled" />
              </Option>
              <Option value="Happening">
                <Space>
                  <span className="blinking-dot" />
                  Happening
                </Space>
              </Option>
              <Option value="Finished">
                <Badge status="success" text="Finished" />
              </Option>
              <Option value="Missed">
                <Badge status="error" text="Missed" />
              </Option>
              <Option value="CancelledAfterConfirm">
                <Badge status="default" text="Cancelled" />
              </Option>
            </Select>
            <RangePicker
              value={dateRange}
              onChange={(dates) => {
                console.log(
                  "Date range changed to:",
                  dates
                    ? [
                        dates[0]?.format("YYYY-MM-DD"),
                        dates[1]?.format("YYYY-MM-DD"),
                      ]
                    : null
                );
                setDateRange(dates as [Dayjs, Dayjs] | null);
              }}
              format="DD/MM/YYYY"
              placeholder={["From Date", "To Date"]}
              style={{ width: "100%", maxWidth: 250 }}
              className="date-picker"
            />
            <Button
              icon={<DownloadOutlined />}
              onClick={handleExport}
              className="export-button"
            >
              Export Data
            </Button>
            <Button
              type="primary"
              icon={<CalendarOutlined />}
              onClick={redirectToStaffSchedule}
              className="schedule-button"
            >
              Schedule Appointment
            </Button>
          </Space>
          {dateRange && (
            <Typography.Text className="mt-2 text-gray-600">
              Showing appointments from {dateRange[0].format("DD/MM/YYYY")} to{" "}
              {dateRange[1].format("DD/MM/YYYY")}
            </Typography.Text>
          )}
        </Col>
        <Col span={24}>
          <Row justify="space-between" align="middle">
            <Col>
              <Space>
                {selectedRowKeys.length > 0 && (
                  <Popconfirm
                    title="Are you sure to cancel the selected appointments?"
                    onConfirm={handleBulkCancel}
                  >
                    <Button
                      danger
                      type="primary"
                      icon={<DeleteOutlined />}
                      className="bulk-cancel-button"
                    >
                      Cancel Selected ({selectedRowKeys.length})
                    </Button>
                  </Popconfirm>
                )}
              </Space>
            </Col>
          </Row>
        </Col>
      </Row>
    </Card>
  );

  if (!user?.auth || !token) {
    return (
      <div className="flex justify-center items-center min-h-screen bg-gray-50">
        <Card
          className="shadow-lg p-8 max-w-md text-center"
          bordered={false}
          style={{ borderRadius: "16px" }}
        >
          <Typography.Title level={4} className="mb-4">
            Please log in to view your appointments
          </Typography.Title>
          <Button type="primary" onClick={() => router.push("/")} size="large">
            Go to Login
          </Button>
        </Card>
      </div>
    );
  }

  return (
    <div className="p-6 bg-gray-50 min-h-screen">
      {contextHolder}
      <style global jsx>{`
        .appointment-block {
          transition: all 0.3s ease;
          transform: translateY(0);
          border: 2px solid transparent;
          position: relative;
          overflow: hidden;
        }
        .appointment-block::before {
          content: "";
          position: absolute;
          top: 0;
          left: 0;
          width: 100%;
          height: 100%;
          background: linear-gradient(
            to right,
            rgba(240, 249, 255, 0),
            rgba(240, 249, 255, 0.3)
          );
          transform: translateX(-100%);
          transition: transform 0.8s ease;
          pointer-events: none;
          z-index: 1;
        }
        .appointment-block:hover::before {
          transform: translateX(100%);
        }
        .appointment-block:hover {
          box-shadow: 0 10px 25px rgba(0, 0, 0, 0.1);
          transform: translateY(-5px);
          border-color: rgba(79, 209, 197, 0.3);
        }
        .appointment-image-container {
          position: relative;
          overflow: hidden;
          background-color: #e6f0fa !important;
          transition: all 0.4s ease;
          background-size: cover !important;
          background-position: center !important;
          background-repeat: no-repeat !important;
          cursor: pointer;
          border: 2px solid #e6f0fa;
        }
        .appointment-image-container::after {
          content: "";
          position: absolute;
          top: 0;
          left: 0;
          width: 100%;
          height: 100%;
          background: rgba(0, 0, 0, 0);
          transition: all 0.3s ease;
        }
        .appointment-image-container:hover {
          transform: scale(1.03);
          border-color: #4fd1c5;
          box-shadow: 0 5px 15px rgba(79, 209, 197, 0.3);
        }
        .appointment-image-container:hover::after {
          background: rgba(0, 0, 0, 0.1);
        }
        .appointment-info-container {
          transition: all 0.3s ease;
          border: 1px solid #e5e7eb;
          position: relative;
          overflow: hidden;
          cursor: pointer;
        }
        .appointment-info-container::before {
          content: "";
          position: absolute;
          top: 0;
          left: 0;
          width: 100%;
          height: 4px;
          background: linear-gradient(to right, #4fd1c5, #4299e1);
          transform: scaleX(0);
          transition: transform 0.3s ease;
          transform-origin: left;
          opacity: 0;
        }
        .appointment-info-container:hover::before {
          transform: scaleX(1);
          opacity: 1;
        }
        .action-button {
          background-color: #f9fafb;
          color: #374151;
          border: 1px solid #d1d5db;
          border-radius: 8px;
          padding: 4px 12px;
          height: 36px;
          font-weight: 500;
          display: flex;
          align-items: center;
          justify-content: center;
          transition: all 0.25s ease;
        }
        .action-button:hover {
          background-color: #1b98e0;
          color: white;
          border-color: #1b98e0;
          transform: translateY(-2px);
          box-shadow: 0 4px 12px rgba(27, 152, 224, 0.3);
        }
        .action-button:nth-child(2):hover {
          background-color: #e53e3e;
          border-color: #e53e3e;
          box-shadow: 0 4px 12px rgba(229, 62, 62, 0.3);
        }
        .blinking-dot {
          width: 7px;
          height: 7px;
          background-color: #ff4500;
          border-radius: 50%;
          display: inline-block;
          animation: enhancedBlink 1.1s infinite;
          box-shadow: 0 0 6px rgba(255, 69, 0, 0.6);
        }
        @keyframes enhancedBlink {
          0% {
            opacity: 1;
            transform: scale(1);
            box-shadow: 0 0 6px rgba(255, 69, 0, 0.6);
          }
          50% {
            opacity: 0.5;
            transform: scale(1.2);
            box-shadow: 0 0 8px rgba(255, 69, 0, 0.8);
          }
          100% {
            opacity: 1;
            transform: scale(1);
            box-shadow: 0 0 6px rgba(255, 69, 0, 0.6);
          }
        }
        .happening-tag {
          animation: pulseBackground 2s infinite;
        }
        @keyframes pulseBackground {
          0% {
            background-color: rgba(255, 69, 0, 0.05);
          }
          50% {
            background-color: rgba(255, 69, 0, 0.2);
          }
          100% {
            background-color: rgba(255, 69, 0, 0.05);
          }
        }

        .filter-button,
        .search-input,
        .status-filter,
        .date-picker {
          transition: all 0.3s ease;
          border-radius: 8px;
        }

        .filter-button:hover,
        .search-input:hover,
        .status-filter:hover,
        .date-picker:hover {
          transform: translateY(-2px);
          box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
          border-color: #4fd1c5;
        }

        .export-button {
          background-color: #f9fafb;
          border: 1px solid #d1d5db;
          border-radius: 8px;
          padding: 6px 16px;
          height: 38px;
          font-weight: 500;
          color: #374151;
          display: flex;
          align-items: center;
          justify-content: center;
          transition: all 0.3s ease;
        }

        .export-button:hover {
          background-color: #38b2ac;
          border-color: #38b2ac;
          color: white;
          transform: translateY(-2px);
          box-shadow: 0 4px 12px rgba(56, 178, 172, 0.3);
        }

        .schedule-button {
          border-radius: 8px;
          padding: 6px 16px;
          height: 38px;
          font-weight: 500;
          display: flex;
          align-items: center;
          justify-content: center;
          transition: all 0.3s ease;
          background: linear-gradient(135deg, #4299e1, #3182ce);
          border: none;
        }

        .schedule-button:hover {
          transform: translateY(-2px);
          box-shadow: 0 4px 12px rgba(66, 153, 225, 0.4);
          background: linear-gradient(135deg, #3182ce, #2c5282);
        }

        .bulk-cancel-button {
          transition: all 0.3s ease;
          border-radius: 8px;
        }

        .bulk-cancel-button:hover {
          transform: translateY(-2px);
          opacity: 0.9;
          box-shadow: 0 4px 12px rgba(229, 62, 62, 0.3);
        }

        @media (max-width: 768px) {
          .appointment-block {
            padding: 12px !important;
          }
          .appointment-image-container {
            max-width: 120px !important;
            max-height: 120px !important;
          }
          .appointment-info-container {
            flex-direction: column !important;
            align-items: flex-start !important;
            min-height: auto !important;
            padding: 10px !important;
          }
          .appointment-info-header {
            grid-template-columns: 1fr auto !important;
          }
          .appointment-details {
            grid-template-columns: 50px 1fr !important;
            font-size: 12px !important;
          }
          .action-button {
            width: 110px !important;
            height: 32px !important;
            font-size: 12px !important;
            padding: 2px 8px !important;
          }
          .flex-col {
            gap: 1rem !important;
            align-items: flex-start !important;
            margin-top: 10px !important;
          }
          .blinking-dot {
            width: 5px;
            height: 5px;
          }
        }
        @media (max-width: 480px) {
          .appointment-block {
            padding: 10px !important;
          }
          .appointment-info-container {
            padding: 10px !important;
          }
          .appointment-details {
            grid-template-columns: 40px 1fr !important;
            font-size: 11px !important;
          }
          .action-button {
            width: 100px !important;
            height: 30px !important;
            font-size: 11px !important;
          }
        }
      `}</style>

      {topContent}
      <Card
        bordered={false}
        className="shadow-md"
        style={{ borderRadius: "16px", overflow: "hidden" }}
      >
        {loading ? (
          <div className="text-center py-16">
            <Spin size="large" />
            <Typography.Text className="block mt-6 text-gray-600">
              Loading your appointments...
            </Typography.Text>
          </div>
        ) : filteredAppointments.length > 0 ? (
          filteredAppointments.map((appointment) => (
            <div
              key={appointment.id}
              className="appointment-block"
              onMouseEnter={() => setHoveredAppointment(appointment.id)}
              onMouseLeave={() => setHoveredAppointment(null)}
              style={{
                padding: "22px",
                marginBottom: "24px",
                maxWidth: "90%",
                width: "100%",
                marginLeft: "auto",
                marginRight: "auto",
                borderRadius: "16px",
                backgroundColor: "#FFFFFF",
                boxShadow: "0 4px 12px rgba(0, 0, 0, 0.05)",
              }}
            >
              <Row gutter={[20, 20]} align="middle">
                <Col
                  xs={24}
                  sm={24}
                  md={8}
                  lg={6}
                  xl={4}
                  style={{ textAlign: "center" }}
                >
                  <div
                    className="appointment-image-container"
                    style={{
                      borderRadius: "12px",
                      width: "100%",
                      maxWidth: "180px",
                      height: "auto",
                      maxHeight: "180px",
                      margin: "0 auto",
                      aspectRatio: "1 / 1",
                      backgroundImage: `url(${
                        appointment.imageURL || "/images/placeholder.jpg"
                      })`,
                    }}
                  />
                </Col>
                <Col xs={24} sm={24} md={16} lg={18} xl={20}>
                  <div
                    className="appointment-info-container p-4 rounded-lg w-full box-border"
                    onClick={(e) => {
                      if (
                        (e.target as HTMLElement).closest(".action-button") ||
                        (e.target as HTMLElement).closest(".ant-popconfirm")
                      )
                        return;
                      showDetails(appointment);
                    }}
                    style={{
                      minHeight: "180px",
                      display: "flex",
                      flexDirection: "row",
                      justifyContent: "space-between",
                      alignItems: "stretch",
                      backgroundColor: "#FFFFFF",
                      borderRadius: "12px",
                      ...(hoveredAppointment === appointment.id && {
                        boxShadow: "0 4px 16px rgba(79, 209, 197, 0.15)",
                      }),
                    }}
                  >
                    <div style={{ flex: 1 }}>
                      <div
                        className="appointment-info-header"
                        style={{
                          display: "grid",
                          gridTemplateColumns: "250px auto",
                          alignItems: "center",
                          gap: "10px",
                        }}
                      >
                        <h2
                          className="text-xl font-semibold text-gray-800 m-0 transition-colors duration-200 hover:text-teal-600 cursor-pointer"
                          style={{
                            overflow: "hidden",
                            textOverflow: "ellipsis",
                            whiteSpace: "nowrap",
                          }}
                        >
                          {appointment.staffName}
                        </h2>
                        <div
                          style={{
                            display: "flex",
                            alignItems: "center",
                            gap: "8px",
                          }}
                        >
                          <Tooltip title={getStatusTooltip(appointment.status)}>
                            <Tag
                              color={getStatusColor(appointment.status)}
                              style={{
                                fontSize: "13px",
                                padding: "4px 10px",
                                borderRadius: "20px",
                                fontWeight: "500",
                                display: "flex",
                                alignItems: "center",
                              }}
                              className={
                                appointment.status === "Happening"
                                  ? "happening-tag"
                                  : ""
                              }
                            >
                              {getStatusIcon(appointment.status)}
                              {appointment.status === "CancelledAfterConfirm"
                                ? "Cancelled"
                                : appointment.status}
                            </Tag>
                          </Tooltip>
                          {appointment.status === "Happening" && (
                            <span className="blinking-dot" />
                          )}
                        </div>
                      </div>
                      <p className="text-gray-500 text-[13px] mt-1 italic">
                        Healthcare Provider
                      </p>
                      <hr className="border-t border-gray-200 my-3" />
                      <div
                        className="appointment-details"
                        style={{
                          display: "grid",
                          gridTemplateColumns: "80px 1fr",
                          gap: "8px",
                          alignItems: "center",
                          marginBottom: "10px",
                        }}
                      >
                        <span className="font-medium text-gray-700 text-[14px]">
                          Start:
                        </span>
                        <span className="text-gray-700 text-[14px]">
                          {formatDateTimeLong(appointment.appointmentDate)}
                        </span>
                        {appointment.endTime && (
                          <>
                            <span className="font-medium text-gray-700 text-[14px]">
                              End:
                            </span>
                            <span className="text-gray-700 text-[14px]">
                              {formatDateTimeLong(appointment.endTime)}
                            </span>
                          </>
                        )}
                        <span className="font-medium text-gray-700 text-[14px]">
                          Booked:
                        </span>
                        <span className="text-gray-700 text-[14px]">
                          {formatDateTimeLong(appointment.createdAt)}
                        </span>
                      </div>

                      {appointment.reason && (
                        <div className="mt-2 p-2 bg-gray-50 rounded-lg">
                          <p className="text-[13px] text-gray-600 m-0">
                            <span className="font-semibold">Reason:</span>{" "}
                            {appointment.reason}
                          </p>
                        </div>
                      )}
                    </div>
                    <div className="flex flex-col justify-end items-end gap-3 ml-3">
                      <Button
                        className="action-button"
                        size="middle"
                        icon={<EyeOutlined />}
                        onClick={(e) => {
                          e.stopPropagation();
                          showDetails(appointment);
                        }}
                      >
                        See Details
                      </Button>
                      {appointment.status === "Scheduled" && (
                        <Popconfirm
                          title="Are you sure to cancel this appointment?"
                          onConfirm={(e) => handleCancel(appointment.id, e)}
                        >
                          <Button
                            danger
                            className="action-button"
                            style={{ color: "red" }}
                            size="middle"
                            icon={<CloseCircleOutlined />}
                            onClick={(e) => e.stopPropagation()}
                          >
                            Cancel
                          </Button>
                        </Popconfirm>
                      )}
                    </div>
                  </div>
                </Col>
              </Row>
            </div>
          ))
        ) : (
          <div className="text-center py-16">
            <div className="mb-6">
              <svg
                width="100"
                height="100"
                viewBox="0 0 24 24"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
                className="mx-auto text-gray-300"
              >
                <path
                  d="M8 2V5"
                  stroke="currentColor"
                  strokeWidth="1.5"
                  strokeLinecap="round"
                />
                <path
                  d="M16 2V5"
                  stroke="currentColor"
                  strokeWidth="1.5"
                  strokeLinecap="round"
                />
                <path
                  d="M3.5 9H20.5"
                  stroke="currentColor"
                  strokeWidth="1.5"
                  strokeLinecap="round"
                />
                <path
                  d="M21 8.5V17C21 20 19.5 22 16 22H8C4.5 22 3 20 3 17V8.5C3 5.5 4.5 3.5 8 3.5H16C19.5 3.5 21 5.5 21 8.5Z"
                  stroke="currentColor"
                  strokeWidth="1.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
                <path
                  d="M15.6947 13.7H15.7037"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
                <path
                  d="M15.6947 16.7H15.7037"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
                <path
                  d="M11.9955 13.7H12.0045"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
                <path
                  d="M11.9955 16.7H12.0045"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
                <path
                  d="M8.29431 13.7H8.30329"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
                <path
                  d="M8.29431 16.7H8.30329"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </div>
            <Typography.Title
              level={4}
              className="text-gray-600 font-medium mb-4"
            >
              No appointments to show right now
            </Typography.Title>
            <Button
              type="primary"
              icon={<CalendarOutlined />}
              onClick={redirectToStaffSchedule}
              size="large"
              className="schedule-button mt-2"
            >
              Book Your First Appointment
            </Button>
          </div>
        )}
      </Card>

      <Modal
        title={null}
        open={isDetailsModalVisible}
        onCancel={() => {
          setIsDetailsModalVisible(false);
          setSelectedAppointment(null);
        }}
        footer={null}
        width={650}
        className="appointment-detail-modal"
        style={{ borderRadius: "16px", overflow: "hidden" }}
        bodyStyle={{ padding: "0" }}
        closeIcon={
          <CloseCircleOutlined style={{ color: "#2c3e76", fontSize: "18px" }} />
        }
      >
        <div className="p-0">
          <div className="px-6 py-4 border-b border-gray-200">
            <div className="bg-gradient-to-r from-blue-50 to-teal-50 absolute top-0 left-0 right-0 h-16 -z-10"></div>
            <Title
              level={4}
              style={{
                margin: 0,
                color: "#2c3e76",
                position: "relative",
                zIndex: 1,
              }}
            >
              <CalendarOutlined style={{ marginRight: 8 }} /> Appointment
              Details
            </Title>
          </div>
          <div className="p-6">
            {selectedAppointment && (
              <AppointmentDetails
                appointment={selectedAppointment}
                onCancel={handleCancel}
              />
            )}
          </div>
        </div>
      </Modal>

      <style jsx global>{`
        /* Modal styles */
        .appointment-detail-modal .ant-modal-content {
          overflow: hidden;
          border-radius: 16px;
          box-shadow: 0 10px 25px rgba(0, 0, 0, 0.1);
        }

        .appointment-detail-modal .ant-modal-close {
          top: 14px;
          right: 16px;
          color: #2c3e76;
          z-index: 10;
        }

        .appointment-detail-modal .ant-modal-close:hover {
          color: #4fd1c5;
        }

        .appointment-detail-modal .ant-modal-body {
          padding: 0;
          position: relative;
        }
      `}</style>
    </div>
  );
}

export default AppointmentManagementForStudent;
