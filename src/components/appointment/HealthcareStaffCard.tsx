// src/components/appointment/HealthcareStaffCard.tsx
import React from "react";
import { AvailableOfficersResponseDTO } from "@/api/appointment-api";
import { Card, Typography } from "antd";

const { Text } = Typography;

interface HealthcareStaffCardProps {
  staff: AvailableOfficersResponseDTO;
}

const HealthcareStaffCard: React.FC<HealthcareStaffCardProps> = ({ staff }) => {
  return (
    <Card
      hoverable
      style={{
        width: 200,
        textAlign: "center",
        borderRadius: 10,
        boxShadow: "0 2px 8px rgba(0, 0, 0, 0.1)",
        backgroundColor: "#f9faff",
        border: "none",
      }}
      cover={
        <img
          alt={staff.fullName}
          src={staff.imageURL || "/images/placeholder.jpg"}
          style={{ height: 150, objectFit: "cover", borderRadius: "10px 10px 0 0" }}
        />
      }
    >
      <div>
        <strong>{staff.fullName}</strong>
        <Text
          style={{
            display: "block",
            marginTop: 8,
            color: "#1890ff",
            fontSize: "14px",
          }}
        >
          Book Appointment
        </Text>
      </div>
    </Card>
  );
};

export default HealthcareStaffCard;