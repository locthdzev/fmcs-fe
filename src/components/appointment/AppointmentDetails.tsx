// AppointmentDetails.tsx
import React from "react";
import { AppointmentResponseDTO } from "@/api/appointment-api";
import { Button, Descriptions, Popconfirm, Tag, Typography, Row, Col } from "antd";
import {
  CheckCircleFilled,
  ClockCircleOutlined,
  CloseCircleFilled,
  PlayCircleOutlined,
  StopOutlined,
  MailOutlined,
  PhoneOutlined,
} from "@ant-design/icons";
import moment from "moment";

const { Title, Text } = Typography;

interface AppointmentDetailsProps {
  appointment: AppointmentResponseDTO;
  onCancel: (id: string) => void;
}

const getStatusColor = (status: string | undefined) => {
  switch (status) {
    case "Scheduled": return "blue";
    case "Happening": return "#ffd591"; // Very light orange as base
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

const AppointmentDetails: React.FC<AppointmentDetailsProps> = ({ appointment, onCancel }) => {
  const formatDateTime = (datetime: string | undefined) => {
    if (!datetime) return "N/A";
    return moment(datetime).format("DD MMMM YYYY HH:mm:ss");
  };

  return (
    <div style={{ padding: "16px" }}>
      <style jsx global>{`
        .details-container {
          background: #fff;
          border-radius: 8px;
          padding: 16px;
          box-shadow: 0 2px 8px rgba(0,0,0,0.05);
        }
        .action-buttons {
          margin-top: 24px;
          display: flex;
          justify-content: flex-end;
          gap: 16px;
        }
        .staff-image {
          width: 100%;
          max-width: 120px;
          height: 100%;
          object-fit: cover;
          border-radius: 8px;
          border: 2px solid #E6F0FA;
        }
        .contact-info {
          margin-top: 16px;
          padding: 12px;
          background: #f9f9f9;
          border-radius: 4px;
        }
        .header-row {
          display: flex;
          align-items: stretch;
          gap: 16px;
          margin-bottom: 16px;
        }
        .staff-details {
          flex: 1;
          display: flex;
          flex-direction: column;
          justify-content: space-between;
        }
        .blinking-status.ant-tag {
          animation: friendlyBlink 1.5s infinite ease-in-out;
          border: none;
        }
        @keyframes friendlyBlink {
          0% {
            background-color: #ffd591; /* Very light orange */
            opacity: 1;
            transform: scale(1);
            box-shadow: 0 0 4px rgba(255, 213, 145, 0.5);
          }
          50% {
            background-color: #ffbb33; /* Slightly darker but still soft orange */
            opacity: 0.9;
            transform: scale(1.02);
            box-shadow: 0 0 6px rgba(255, 187, 51, 0.7);
          }
          100% {
            background-color: #ffd591; /* Back to very light orange */
            opacity: 1;
            transform: scale(1);
            box-shadow: 0 0 4px rgba(255, 213, 145, 0.5);
          }
        }
      `}</style>

      <div className="details-container">
        <div className="header-row">
          <div>
            <img
              src={appointment.imageURL || "/images/placeholder.jpg"}
              alt={appointment.staffName}
              className="staff-image"
            />
          </div>
          <div className="staff-details">
            <div>
              <Title level={4} style={{ marginBottom: 4 }}>{appointment.staffName}</Title>
              <Text type="secondary">Healthcare Provider</Text>
            </div>
            <div className="contact-info">
              <Text>
                <MailOutlined style={{ marginRight: 8 }} />
                {appointment.staffEmail || "Not provided"}
              </Text>
              <br />
              <Text>
                <PhoneOutlined style={{ marginRight: 8 }} />
                {appointment.staffPhone || "Not provided"}
              </Text>
            </div>
          </div>
        </div>

        <Descriptions bordered column={1} size="small">
          <Descriptions.Item label="Status">
            <Tag
              color={getStatusColor(appointment.status)}
              className={appointment.status === "Happening" ? "blinking-status" : ""}
              style={{ 
                display: "flex", 
                alignItems: "center",
              }}
            >
              {getStatusIcon(appointment.status)}
              {appointment.status === "CancelledAfterConfirm" ? "Cancelled" : appointment.status}
            </Tag>
          </Descriptions.Item>
          <Descriptions.Item label="Reason">{appointment.reason || "Not specified"}</Descriptions.Item>
          <Descriptions.Item label="Start Time">
            {formatDateTime(appointment.appointmentDate)}
          </Descriptions.Item>
          <Descriptions.Item label="End Time">
            {formatDateTime(appointment.endTime)}
          </Descriptions.Item>
          <Descriptions.Item label="Booked On">
            {formatDateTime(appointment.createdAt)}
          </Descriptions.Item>
          <Descriptions.Item label="Appointment ID">{appointment.id}</Descriptions.Item>
        </Descriptions>

        <div className="action-buttons">
          {appointment.status === "Scheduled" && (
            <Popconfirm
              title="Are you sure to cancel this appointment?"
              onConfirm={() => onCancel(appointment.id)}
            >
              <Button danger>Cancel Appointment</Button>
            </Popconfirm>
          )}
          <Button onClick={() => window.print()}>Print</Button>
        </div>
      </div>
    </div>
  );
};

export default AppointmentDetails;