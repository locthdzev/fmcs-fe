import React from "react";
import { Modal, Typography, Divider, Space, Tag, Spin } from "antd";
import { ClockCircleOutlined, UserOutlined, CalendarOutlined, WarningOutlined } from "@ant-design/icons";
import moment from "moment-timezone";
import { AppointmentResponseDTO } from "@/api/appointment-api-fix-signalr";

interface ConflictModalProps {
  open: boolean; // Changed from visible
  existingAppointment: AppointmentResponseDTO | null;
  currentStaffName: string;
  newStaffName: string;
  newDate: string | null;
  newTimeSlot: string | null;
  loading: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}

const { Text, Title } = Typography;

const ConflictModal: React.FC<ConflictModalProps> = ({
  open, // Changed from visible
  existingAppointment,
  currentStaffName,
  newStaffName,
  newDate,
  newTimeSlot,
  loading,
  onConfirm,
  onCancel,
}) => {
  const formatTimeRange = (start: string, end?: string | null) => {
    const startMoment = moment.tz(start, "Asia/Ho_Chi_Minh");
    const endMoment = end
      ? moment.tz(end, "Asia/Ho_Chi_Minh")
      : startMoment.clone().add(30, "minutes");
    return `${startMoment.format("HH:mm")} - ${endMoment.format("HH:mm")}`;
  };

  const formatDate = (date: string | null) =>
    date ? moment(date).format("MMMM D, YYYY") : "Date not selected";

  const currentTimeSlot = existingAppointment
    ? formatTimeRange(existingAppointment.appointmentDate, existingAppointment.endTime)
    : "N/A";

  return (
    <Modal
      title={
        <Space>
          <WarningOutlined style={{ color: "#faad14", fontSize: "20px" }} />
          <Title level={4} style={{ margin: 0 }}>
            Appointment Conflict
          </Title>
        </Space>
      }
      open={open} // Changed from visible
      onOk={onConfirm}
      onCancel={onCancel}
      okText="Switch to New Appointment"
      cancelText="Keep Current Appointment"
      okButtonProps={{
        danger: true,
        loading,
        icon: <CalendarOutlined />,
        style: { backgroundColor: "#ff4d4f", borderColor: "#ff4d4f" },
      }}
      cancelButtonProps={{
        disabled: loading,
        type: "default",
        style: { borderColor: "#1890ff", color: "#1890ff" },
      }}
      width={500}
      styles={{ body: { padding: "20px" } }} // Changed from bodyStyle
      centered
      closable={!loading}
    >
      {existingAppointment ? (
        <div>
          <Space direction="vertical" size="middle" style={{ width: "100%" }}>
            <div>
              <Text strong style={{ fontSize: "16px", color: "#595959" }}>
                Your Current Appointment
              </Text>
              <Divider style={{ margin: "8px 0" }} />
              <Space direction="vertical" size="small">
                <Text>
                  <UserOutlined style={{ color: "#1890ff" }} /> With{" "}
                  <strong>{currentStaffName}</strong>
                </Text>
                <Text>
                  <CalendarOutlined style={{ color: "#52c41a" }} />{" "}
                  {moment.tz(existingAppointment.appointmentDate, "Asia/Ho_Chi_Minh").format("MMMM D, YYYY")}
                </Text>
                <Text>
                  <ClockCircleOutlined style={{ color: "#fa8c16" }} />{" "}
                  <Tag color="blue">{currentTimeSlot}</Tag>
                </Text>
              </Space>
            </div>

            <div>
              <Text strong style={{ fontSize: "16px", color: "#595959" }}>
                New Appointment Request
              </Text>
              <Divider style={{ margin: "8px 0" }} />
              <Space direction="vertical" size="small">
                <Text>
                  <UserOutlined style={{ color: "#1890ff" }} /> With{" "}
                  <strong>{newStaffName}</strong>
                </Text>
                <Text>
                  <CalendarOutlined style={{ color: "#52c41a" }} /> {formatDate(newDate)}
                </Text>
                <Text>
                  <ClockCircleOutlined style={{ color: "#fa8c16" }} />{" "}
                  <Tag color="green">{newTimeSlot || "Time not selected"}</Tag>
                </Text>
              </Space>
            </div>

            <Text type="secondary" style={{ marginTop: "12px" }}>
              You can only have one locked appointment at a time. Do you want to cancel your current appointment and switch to the new one?
            </Text>
          </Space>
        </div>
      ) : (
        <Text type="secondary" style={{ textAlign: "center", display: "block" }}>
          <Spin size="small" style={{ marginRight: "8px" }} />
          Loading conflict details...
        </Text>
      )}
    </Modal>
  );
};

export default ConflictModal;