import React, { useState, useEffect, useCallback, useContext } from "react";
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
} from "antd";
import { toast } from "react-toastify";
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
} from "@ant-design/icons";
import { UserContext } from "@/context/UserContext";
import AppointmentDetails from "./AppointmentDetails";
import { HubConnection } from "@microsoft/signalr";

dayjs.extend(isBetween);

const { Option } = Select;
const { RangePicker } = DatePicker;

const formatDateTime = (datetime: string | undefined) => {
  if (!datetime) return "";
  return dayjs(datetime).format("DD/MM/YYYY HH:mm:ss");
};

const getStatusColor = (status: string | undefined) => {
  switch (status) {
    case "Scheduled": return "blue";
    case "Happening": return "orange";
    case "Finished": return "green";
    case "Missed": return "red";
    case "CancelledAfterConfirm": return "gray";
    default: return "default";
  }
};

const getStatusIcon = (status: string | undefined) => {
  switch (status) {
    case "Scheduled": return <ClockCircleOutlined style={{ marginRight: 4 }} />;
    case "Happening": return <PlayCircleOutlined style={{ marginRight: 4 }} />;
    case "Finished": return <CheckCircleFilled style={{ marginRight: 4 }} />;
    case "Missed": return <CloseCircleFilled style={{ marginRight: 4 }} />;
    case "CancelledAfterConfirm": return <StopOutlined style={{ marginRight: 4 }} />;
    default: return null;
  }
};

const getStatusTooltip = (status: string | undefined) => {
  switch (status) {
    case "Scheduled": return "Appointment is booked and upcoming.";
    case "Happening": return "Appointment is currently in progress.";
    case "Finished": return "Appointment has been completed.";
    case "Missed": return "Appointment was not attended.";
    case "CancelledAfterConfirm": return "Appointment was cancelled after confirmation.";
    default: return "";
  }
};

export function AppointmentManagementForStudent() {
  const router = useRouter();
  const { user } = useContext(UserContext)!;
  const [appointments, setAppointments] = useState<AppointmentResponseDTO[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedAppointment, setSelectedAppointment] = useState<AppointmentResponseDTO | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [total, setTotal] = useState(0);
  const [searchText, setSearchText] = useState("");
  const [statusFilter, setStatusFilter] = useState<string | undefined>(undefined);
  const [dateRange, setDateRange] = useState<[Dayjs, Dayjs] | null>(null);
  const [sortBy, setSortBy] = useState("CreateAt");
  const [ascending, setAscending] = useState(false);
  const [selectedRowKeys, setSelectedRowKeys] = useState<React.Key[]>([]);
  const [hoveredAppointment, setHoveredAppointment] = useState<string | null>(null);
  const [isDetailsModalVisible, setIsDetailsModalVisible] = useState(false);
  const [direction, setDirection] = useState<"horizontal" | "vertical">("horizontal");

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
      console.log("Fetching appointments for user:", user.userId, { currentPage, pageSize, sortBy, ascending });
      const result: PagedResultDTO<AppointmentResponseDTO> = await getAppointmentsByUserId(
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
                // toast.success("New appointment scheduled!");
              } else if (data.eventType === "Confirmed") {
                // toast.success("Appointment confirmed!");
              } else if (data.eventType === "Released") {
                // toast.success("Appointment cancelled!");
              }
            }
          },
          (error) => {
            console.error("SignalR error:", error);
            if (isMounted) {
              // toast.error("Real-time updates failed. Please refresh the page.");
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
  }, [fetchAppointments, token, router, user?.userId]);

  const handleCancel = async (id: string, e?: React.MouseEvent<HTMLElement>) => {
    if (e) e.stopPropagation();
    try {
      if (!token) {
        throw new Error("Authentication token is missing. Please log in.");
      }
      const response = await cancelAppointment(id, token);
      if (response.isSuccess) {
        toast.success("Appointment cancelled!");
        setIsDetailsModalVisible(false);
        setSelectedAppointment(null);
        fetchAppointments();
      } else {
        toast.error(response.message || "Failed to cancel appointment.");
      }
    } catch (error: any) {
      console.error("Error cancelling appointment:", error);
      toast.error(error.message || "Unable to cancel appointment.");
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
      dateRange: dateRange ? [dateRange[0].format("YYYY-MM-DD"), dateRange[1].format("YYYY-MM-DD")] : null 
    });
    if (!searchText && !statusFilter && !dateRange) return appointments;
    return appointments.filter(appointment => {
      const matchesSearch = searchText
        ? appointment.staffName?.toLowerCase().includes(searchText.toLowerCase())
        : true;
      const matchesStatus = statusFilter ? appointment.status === statusFilter : true;
      const matchesDate = dateRange && appointment.appointmentDate
        ? dayjs(appointment.appointmentDate).isValid() &&
          dayjs(appointment.appointmentDate).isBetween(dateRange[0], dateRange[1], "day", "[]")
        : true;
      console.log(`Appointment ${appointment.id}:`, { 
        date: appointment.appointmentDate, 
        matchesDate 
      });
      return matchesSearch && matchesStatus && matchesDate;
    });
  }, [appointments, searchText, statusFilter, dateRange]);

  const handleBulkCancel = async () => {
    try {
      if (!token) {
        throw new Error("Authentication token is missing. Please log in.");
      }
      await Promise.all(selectedRowKeys.map(id => cancelAppointment(id as string, token)));
      toast.success("Selected appointments cancelled successfully!");
      setSelectedRowKeys([]);
      fetchAppointments();
    } catch (error: any) {
      console.error("Error bulk cancelling appointments:", error);
      toast.error(error.message || "Unable to cancel selected appointments.");
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
    router.push("http://localhost:3333/appointment"); // Adjust URL as needed
  };

  const handleExport = () => {
    // Placeholder for export functionality
    const csvContent = filteredAppointments.map(appointment => (
      `${appointment.staffName},${formatDateTime(appointment.appointmentDate)},${appointment.status},${appointment.reason || ""},${formatDateTime(appointment.createdAt)}`
    )).join("\n");
    const header = "Staff Name,Date & Time,Status,Reason,Booked At\n";
    const blob = new Blob([header + csvContent], { type: "text/csv" });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = "appointments.csv";
    link.click();
    window.URL.revokeObjectURL(url);
    toast.success("Appointments exported successfully!");
  };

  const topContent = (
    <Card 
      className="mb-6 shadow-lg transition-all duration-300 hover:shadow-xl" 
      bordered={false}
      style={{ borderRadius: "12px" }}
    >
      <Row gutter={[16, 16]}>
        <Col span={24}>
          <Typography.Title 
            level={4} 
            className="mb-4 transition-colors duration-200 hover:text-teal-600"
          >
            My Appointments
          </Typography.Title>
        </Col>
        <Col span={24}>
          <Space
            size="middle"
            wrap
            direction={direction}
            style={{ width: "100%", justifyContent: "center" }}
          >
            <Button
              icon={<CloseCircleOutlined />}
              onClick={resetFilters}
              className="transition-all duration-200 hover:bg-teal-50 hover:text-teal-600"
            >
              Reset Filters
            </Button>
            <Input.Search
              placeholder="Search by staff"
              value={searchText}
              onChange={(e) => setSearchText(e.target.value)}
              onSearch={(value) => setSearchText(value)}
              style={{ width: "100%", maxWidth: 250 }}
              allowClear
              enterButton={<SearchOutlined />}
              className="hover:border-teal-400 transition-colors duration-200"
            />
            <Select
              placeholder="Filter by status"
              value={statusFilter}
              onChange={(value) => setStatusFilter(value)}
              onClear={() => setStatusFilter(undefined)}
              style={{ width: "100%", maxWidth: 150 }}
              allowClear
              suffixIcon={<FilterOutlined />}
              className="hover:border-teal-400 transition-colors duration-200"
            >
              <Option value="Scheduled"><Badge status="processing" text="Scheduled" /></Option>
              <Option value="Happening">
                <Space><span className="blinking-dot" />Happening</Space>
              </Option>
              <Option value="Finished"><Badge status="success" text="Finished" /></Option>
              <Option value="Missed"><Badge status="error" text="Missed" /></Option>
              <Option value="CancelledAfterConfirm"><Badge status="default" text="Cancelled" /></Option>
            </Select>
            <RangePicker
              value={dateRange}
              onChange={(dates) => {
                console.log("Date range changed to:", dates ? [dates[0]?.format("YYYY-MM-DD"), dates[1]?.format("YYYY-MM-DD")] : null);
                setDateRange(dates as [Dayjs, Dayjs] | null);
              }}
              format="DD/MM/YYYY"
              placeholder={["From Date", "To Date"]}
              style={{ width: "100%", maxWidth: 250 }}
              className="hover:border-teal-400 transition-colors duration-200"
            />
            <Button
              icon={<DownloadOutlined />}
              onClick={handleExport}
              className="transition-all duration-200 hover:bg-teal-50 hover:text-teal-600 export-button"
            >
              Export Appointments
            </Button>
            <Button
              type="primary"
              icon={<CalendarOutlined />}
              onClick={redirectToStaffSchedule}
              className="transition-all duration-200 hover:scale-105 export-button schedule-button"
            >
               Healthcare Officer 
            </Button>
          </Space>
          {dateRange && (
            <Typography.Text className="mt-2 text-gray-600">
              {/* Showing appointments from {dateRange[0].format("DD/MM/YYYY")} to {dateRange[1].format("DD/MM/YYYY")} */}
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
                      className="hover:opacity-90 transition-all duration-200"
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
      <Typography.Text className="text-lg text-gray-600">
        Please log in to view your appointments.
      </Typography.Text>
    );
  }

  return (
    <div className="p-6 bg-gray-50 min-h-screen">
      <style global jsx>{`
        .appointment-block {
          transition: all 0.3s ease;
          transform: translateY(0);
        }
        .appointment-block:hover .appointment-info-container{
          border-color: rgb(206, 225, 241) !important;
          box-shadow: 0 2px 6px rgba(0, 0, 0, 0.05);
        }
        .appointment-image-container {
          background-color: #E6F0FA !important;
          transition: all 0.3s ease;
          background-size: cover !important;
          background-position: center !important;
          background-repeat: no-repeat !important;
          cursor: pointer;
        }
        .appointment-block:hover {
          box-shadow: 0 8px 16px rgba(0, 0, 0, 0.1);
          transform: translateY(-4px);
          border-color:rgb(173, 235, 228);
        }
        .appointment-info-container {
          cursor: pointer;
        }
        .action-button {
          background-color: #F5F5F5;
          color: #000;
          border: 1px solid #D9D9D9;
          border-radius: 6px;
          padding: 4px 12px;
          height: 32px;
          width: 120px;
          display: flex;
          align-items: center;
          justify-content: center;
          transition: all 0.3s ease;
        }
        .action-button:hover {
          background-color:rgb(169, 240, 133);
          color: white;
          border-color:rgb(153, 238, 111);
          transform: translateY(-2px);
          box-shadow: 0 2px 4px rgba(82,196,26,0.3);
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
          0% { background-color: #ff4500; }
          50% { background-color: #ff8c00; }
          100% { background-color: #ff4500; }
        }
        .appointment-details {
          display: grid;
          grid-template-columns: 60px 1fr;
          gap: 4px 8px;
          align-items: center;
        }
        @media (max-width: 1024px) and (min-width: 801px) {
          .appointment-block {
            max-width: 100% !important;
            padding: 16px !important;
          }
          .appointment-image-container {
            max-width: 150px !important;
            max-height: 150px !important;
          }
          .appointment-info-container {
            min-height: 150px !important;
            padding: 12px !important;
          }
          .appointment-info-header {
            grid-template-columns: 200px auto !important;
          }
          .appointment-details {
            grid-template-columns: 50px 1fr !important;
            font-size: 13px !important;
          }
            
          .action-button {
            width: 100px !important;
            height: 28px !important;
            font-size: 12px !important;
            padding: 2px 8px !important;
          }
          .flex-col {
            gap: 1rem !important;
          }
        }
        @media (max-width: 800px) {
          .appointment-block {
            max-width: 100% !important;
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
            width: 90px !important;
            height: 26px !important;
            font-size: 11px !important;
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
            padding: 8px !important;
          }
          .appointment-info-container {
            padding: 8px !important;
          }
          .appointment-details {
            grid-template-columns: 40px 1fr !important;
            font-size: 10px !important;
          }
          .action-button {
            width: 80px !important;
            height: 24px !important;
            font-size: 10px !important;
          }
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
          background-color:rgb(76, 223, 174);
          border-color:rgb(65, 218, 167);
          color: white;
          transform: translateY(-2px);
          box-shadow: 0 4px 12px rgba(16, 185, 129, 0.3);
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
          background: linear-gradient(135deg,rgb(123, 219, 236),rgb(122, 171, 252));
        }
        .schedule-button:hover {
          transform: translateY(-2px);
          box-shadow: 0 4px 12px rgba(130, 229, 247, 0.4);
          background: linear-gradient(135deg,rgb(99, 201, 226),rgb(136, 171, 245));
        }
      `}</style>
      
      {topContent}
      <Card 
        bordered={false}
        className="shadow-md"
        style={{ borderRadius: "12px", overflow: "hidden" }}
      >
        {loading ? (
          <div className="text-center py-8">
            <Spin size="large" />
            <Typography.Text className="block mt-4 text-gray-600">
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
                padding: "20px",
                marginBottom: "24px",
                maxWidth: "80%",
                width: "100%",
                marginLeft: "auto",
                marginRight: "auto",
                borderRadius: "12px",
                backgroundColor: "#FFFFFF",
                border: "1px solid #F0F0F0",
              }}
            >
              <Row gutter={[16, 16]} justify="center">
                <Col xs={24} sm={24} md={8} lg={6} xl={4} style={{ textAlign: "center" }}>
                  <div
                    className="appointment-image-container"
                    onClick={(e) => {
                      e.stopPropagation();
                      router.push(`http://localhost:3333/appointment/schedule/${appointment.staffId || "default"}`);
                    }}
                    style={{
                      borderRadius: "10px",
                      width: "100%",
                      maxWidth: "180px",
                      height: "auto",
                      maxHeight: "180px",
                      margin: "0 auto",
                      aspectRatio: "1 / 1",
                      backgroundImage: `url(${appointment.imageURL || "/doctor-image.png"})`,
                      border: "2px solid #E6F0FA",
                    }}
                  />
                </Col>
                <Col xs={24} sm={24} md={16} lg={18} xl={20}>
                  <div
                    className="appointment-info-container p-4 rounded-lg w-full box-border"
                    onClick={(e) => {
                      if ((e.target as HTMLElement).closest(".action-button") || (e.target as HTMLElement).closest(".ant-popconfirm")) return;
                      showDetails(appointment);
                    }}
                    style={{
                      minHeight: "180px",
                      display: "flex",
                      flexDirection: "row",
                      justifyContent: "space-between",
                      alignItems: "stretch",
                      backgroundColor: "#FFFFFF",
                      border: "1px solid #E5E7EB",
                      borderRadius: "8px",
                      transition: "all 0.3s ease",
                      ...(hoveredAppointment === appointment.id && {
                        borderColor: "#4FD1C5",
                        boxShadow: "0 2px 8px rgba(79, 209, 197, 0.15)",
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
                          gap: "8px",
                        }}
                      >
                        <h2 
                          className="text-lg md:text-xl font-semibold text-gray-800 m-0 transition-colors duration-200 hover:text-teal-600 cursor-pointer"
                          style={{
                            overflow: "hidden",
                            textOverflow: "ellipsis",
                            whiteSpace: "nowrap",
                          }}
                        >
                          {appointment.staffName}
                        </h2>
                        <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                          <Tooltip title={getStatusTooltip(appointment.status)}>
                            <Tag
                              color={getStatusColor(appointment.status)}
                              style={{
                                fontSize: "13px",
                                padding: "3px 8px",
                                borderRadius: "10px",
                                fontWeight: "500",
                                display: "flex",
                                alignItems: "center",
                              }}
                            >
                              {getStatusIcon(appointment.status)}
                              {appointment.status === "CancelledAfterConfirm" ? "Cancelled" : appointment.status}
                            </Tag>
                          </Tooltip>
                          {appointment.status === "Happening" && <span className="blinking-dot" />}
                        </div>
                      </div>
                      <p className="text-gray-500 text-[13px] mt-1 italic">
                        Healthcare Provider
                      </p>
                      <hr className="border-t border-gray-200 my-2" />
                      <div className="appointment-details">
                        <span className="font-medium text-gray-700 text-[14px]">Start:</span>
                        <span className="text-gray-700 text-[14px]">{formatDateTimeLong(appointment.appointmentDate)}</span>
                        {appointment.endTime && (
                          <>
                            <span className="font-medium text-gray-700 text-[14px]">End:</span>
                            <span className="text-gray-700 text-[14px]">{formatDateTimeLong(appointment.endTime)}</span>
                          </>
                        )}
                        <span className="font-medium text-gray-700 text-[14px]">Booked:</span>
                        <span className="text-gray-700 text-[14px]">{formatDateTimeLong(appointment.createdAt)}</span>
                      </div>
                    </div>
                    <div className="flex flex-col justify-end items-end gap-2">
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
                            className="action-button"
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
          <div className="text-center py-12">
            <Typography.Text className="text-lg text-gray-500">
              No appointments to show right now.
            </Typography.Text>
            <Button
              type="link"
              onClick={redirectToStaffSchedule}
              className="mt-4"
            >
              View staff schedules to book an appointment
            </Button>
          </div>
        )}
      </Card>

      <Modal
        title="Appointment Details"
        open={isDetailsModalVisible}
        onCancel={() => {
          setIsDetailsModalVisible(false);
          setSelectedAppointment(null);
        }}
        footer={null}
        width={600}
      >
        {selectedAppointment && (
          <AppointmentDetails
            appointment={selectedAppointment}
            onCancel={handleCancel}
          />
        )}
      </Modal>
    </div>
  );
}

export default AppointmentManagementForStudent;