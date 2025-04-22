import React, { useState, useEffect, useCallback } from "react";
import {
  Button,
  Card,
  Typography,
  Tag,
  Space,
  Avatar,
  Spin,
  Tooltip,
  Divider,
  Result,
  Badge,
  Descriptions,
  message
} from "antd";
import dayjs from "dayjs";
import Cookies from "js-cookie";
import {
  UserOutlined,
  MailOutlined,
  PhoneOutlined,
  CalendarOutlined,
  ManOutlined,
  WomanOutlined,
  ScheduleOutlined,
  InfoCircleOutlined,
  ReloadOutlined,
  PrinterOutlined,
  CopyOutlined,
  ClockCircleOutlined,
  CheckCircleFilled,
  CloseCircleFilled,
  StopOutlined,
  MedicineBoxOutlined,
} from "@ant-design/icons";
import { AppointmentResponseDTO, getAppointment } from "@/api/appointment-api";

const { Title, Text, Paragraph } = Typography;

const formatDateTime = (datetime: string | undefined) =>
  datetime ? dayjs(datetime).format("DD/MM/YYYY HH:mm") : "Not Available";

const formatDate = (datetime: string | undefined) =>
  datetime ? dayjs(datetime).format("DD/MM/YYYY") : "Not Available";

const formatTime = (datetime: string | undefined) =>
  datetime ? dayjs(datetime).format("HH:mm") : "Not Available";

const getStatusColor = (status: string | undefined) => {
  switch (status) {
    case "Scheduled": return "blue";
    case "Happening": return "orange";
    case "Finished": return "green";
    case "Missed": return "red";
    case "Cancelled":
    case "CancelledAfterConfirm": return "grey";
    default: return "default";
  }
};

const getStatusIcon = (status: string | undefined) => {
  switch (status) {
    case "Scheduled": return <ClockCircleOutlined />;
    case "Happening": return <ScheduleOutlined />;
    case "Finished": return <CheckCircleFilled />;
    case "Missed": return <CloseCircleFilled />;
    case "Cancelled":
    case "CancelledAfterConfirm": return <StopOutlined />;
    default: return null;
  }
};

const getStatusMessage = (status: string | undefined) => {
  switch (status) {
    case "Scheduled": return "Upcoming appointment scheduled.";
    case "Happening": return "Appointment currently in progress.";
    case "Finished": return "Appointment completed successfully.";
    case "Missed": return "Student failed to attend.";
    case "Cancelled": return "Appointment cancelled by student.";
    case "CancelledAfterConfirm": return "Cancelled after confirmation.";
    default: return "Status not specified.";
  }
};

const getUserIdFromEmail = (email: string | undefined) => {
  if (!email) return "Not Available";
  const atIndex = email.indexOf('@');
  return atIndex !== -1 ? email.substring(0, atIndex) : email;
};

interface AppointmentUserDetailsProps {
  id: string;
}

export function AppointmentUserDetails({ id }: AppointmentUserDetailsProps) {
  const [messageApi, contextHolder] = message.useMessage();
  const [appointment, setAppointment] = useState<AppointmentResponseDTO | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const token = Cookies.get("token");

  const fetchAppointmentDetails = useCallback(async (appointmentId: string) => {
    setLoading(true);
    setError(null);
    try {
      const result = await getAppointment(appointmentId, token);
      if (result.isSuccess && result.data) {
        setAppointment(result.data);
        // messageApi.success("Appointment details loaded successfully!");
      } else {
        setError(result.message || "Failed to retrieve appointment details.");
        messageApi.error(result.message || "Unable to load details.");
      }
    } catch (error: any) {
      setError(error.message || "An error occurred while fetching data.");
      messageApi.error(error.message || "An error occurred.");
    } finally {
      setLoading(false);
    }
  }, [token, messageApi]);

  useEffect(() => {
    if (!token) {
      setError("Please log in to access appointment details.");
      setLoading(false);
      return;
    }
    if (id) {
      fetchAppointmentDetails(id);
    } else {
      setError("Appointment ID is required.");
      setLoading(false);
    }
  }, [id, token, fetchAppointmentDetails]);

  const handleCopyDetails = () => {
    const details = `
      Patient: ${appointment?.studentName || "Not Available"}
      University ID: ${getUserIdFromEmail(appointment?.studentEmail)}
      Email: ${appointment?.studentEmail || "Not Available"}
      Phone: ${appointment?.studentPhone || "Not Available"}
      Date: ${formatDate(appointment?.appointmentDate)}
      Time: ${formatTime(appointment?.appointmentDate)} - ${formatTime(appointment?.endTime)}
      Status: ${appointment?.status || "Not Available"}
      Reason: ${appointment?.reason || "Not specified"}
    `.trim();
    navigator.clipboard.writeText(details);
    messageApi.info("Appointment details copied to clipboard!");
  };

  if (!token) {
    return (
      <Result
        status="warning"
        title="Authentication Required"
        subTitle="Please log in to view appointment details."
        extra={<Button type="primary" href="/login">Log In</Button>}
      />
    );
  }

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-[400px]">
        <Spin size="large" tip="Retrieving appointment details..." />
      </div>
    );
  }

  if (error) {
    return (
      <Result
        status="error"
        title="Error Retrieving Details"
        subTitle={error}
        extra={
          <Button
            type="primary"
            icon={<ReloadOutlined />}
            onClick={() => fetchAppointmentDetails(id)}
          >
            Retry
          </Button>
        }
      />
    );
  }

  if (!appointment) {
    return (
      <Result
        status="404"
        title="Appointment Not Found"
        subTitle="The requested appointment details are not available."
      />
    );
  }

  return (
    <div className="p-4 bg-gray-100 flex items-center justify-center">
      {contextHolder}
      <Card
        className="w-full max-w-4xl shadow-lg border-none"
        title={
          <div className="flex items-center justify-between py-3 bg-white border-b">
            <Space size="middle">
              <Avatar
                size={48}
                icon={<MedicineBoxOutlined />}
                className="bg-teal-600"
              />
              <div>
                <Title level={3} className="m-0 text-gray-800">
                  {appointment.studentName || "Unnamed Patient"}
                </Title>
                <Text type="secondary" className="text-base">
                  University ID: {getUserIdFromEmail(appointment.studentEmail)}
                </Text>
              </div>
            </Space>
            <Badge
              status={getStatusColor(appointment.status) as any}
              text={
                <Tag
                  color={getStatusColor(appointment.status)}
                  icon={getStatusIcon(appointment.status)}
                  className="px-3 py-1 text-sm font-semibold"
                >
                  {appointment.status === "CancelledAfterConfirm" ? "Cancelled" : appointment.status}
                </Tag>
              }
            />
          </div>
        }
      >
        {/* Appointment Summary */}
        <Descriptions
          title={
            <Text strong>
              <ScheduleOutlined className="mr-2" /> Appointment Summary
            </Text>
          }
          bordered
          column={1}
          size="middle"
          className="mb-4 bg-white"
        >
          <Descriptions.Item label="Date">
            <CalendarOutlined className="mr-2 text-teal-600" />
            {formatDate(appointment.appointmentDate)}
          </Descriptions.Item>
          <Descriptions.Item label="Time">
            <ClockCircleOutlined className="mr-2 text-teal-600" />
            {formatTime(appointment.appointmentDate)} - {formatTime(appointment.endTime)}
          </Descriptions.Item>
          <Descriptions.Item label="Booked On">
            <ScheduleOutlined className="mr-2 text-teal-600" />
            {formatDateTime(appointment.createdAt)}
          </Descriptions.Item>
          <Descriptions.Item label="Status">
            <Tooltip title={getStatusMessage(appointment.status)}>
              <Tag
                color={getStatusColor(appointment.status)}
                icon={getStatusIcon(appointment.status)}
              >
                {appointment.status === "CancelledAfterConfirm" ? "Cancelled" : appointment.status}
              </Tag>
            </Tooltip>
          </Descriptions.Item>
        </Descriptions>

        {/* Patient Information */}
        <Descriptions
          title={
            <Text strong>
              <UserOutlined className="mr-2" /> Patient Information
            </Text>
          }
          bordered
          column={2}
          size="middle"
          className="mb-4 bg-white"
        >
          <Descriptions.Item label="Email">
            <MailOutlined className="mr-2 text-teal-600" />
            <a href={`mailto:${appointment.studentEmail}`} className="text-teal-700 hover:underline">
              {appointment.studentEmail || "Not Available"}
            </a>
          </Descriptions.Item>
          <Descriptions.Item label="Phone">
            <PhoneOutlined className="mr-2 text-teal-600" />
            <a href={`tel:${appointment.studentPhone}`} className="text-teal-700 hover:underline">
              {appointment.studentPhone || "Not Available"}
            </a>
          </Descriptions.Item>
          <Descriptions.Item label="Gender">
            {appointment.studentGender ? (
              <>
                {appointment.studentGender === "Male" ? (
                  <ManOutlined className="mr-2 text-teal-600" />
                ) : (
                  <WomanOutlined className="mr-2 text-teal-600" />
                )}
                {appointment.studentGender}
              </>
            ) : "Not Available"}
          </Descriptions.Item>
          <Descriptions.Item label="Date of Birth">
            <CalendarOutlined className="mr-2 text-teal-600" />
            {formatDate(appointment.studentDob)}
          </Descriptions.Item>
        </Descriptions>

        {/* Appointment Reason */}
        <div className="bg-white p-3 rounded-lg border mb-4">
          <Text strong className="text-lg">
            <InfoCircleOutlined className="mr-2 text-teal-600" /> Reason for Visit
          </Text>
          <Divider className="my-2" />
          <Paragraph className="text-gray-700">
            {appointment.reason || "No specific reason provided by the patient."}
          </Paragraph>
        </div>

        {/* Action Buttons */}
        <div className="flex justify-end gap-3">
          <Button
            icon={<CopyOutlined />}
            onClick={handleCopyDetails}
            className="border-teal-600 text-teal-600 hover:bg-teal-50"
          >
            Copy Details
          </Button>
          <Button
            icon={<PrinterOutlined />}
            onClick={() => window.print()}
            className="border-teal-600 text-teal-600 hover:bg-teal-50"
          >
            Print Record
          </Button>
          <Button
            type="primary"
            icon={<ReloadOutlined />}
            onClick={() => fetchAppointmentDetails(id)}
            className="bg-teal-600 hover:bg-teal-700 border-none"
          >
            Refresh Data
          </Button>
        </div>
      </Card>
    </div>
  );
}

export default AppointmentUserDetails;