import React, { useEffect, useState } from "react";
import { Modal, Descriptions, Button } from "antd";
import { HealthInsuranceResponseDTO, getHealthInsuranceById } from "@/api/health-insurance-api";
import { toast } from "react-toastify";

interface ViewHealthInsuranceModalProps {
  visible: boolean;
  insuranceId: string | null;
  onClose: () => void;
}

const ViewHealthInsuranceModal: React.FC<ViewHealthInsuranceModalProps> = ({
  visible,
  insuranceId,
  onClose,
}) => {
  const [insurance, setInsurance] = useState<HealthInsuranceResponseDTO | null>(null);

  useEffect(() => {
    if (visible && insuranceId) {
      getHealthInsuranceById(insuranceId)
        .then((data) => setInsurance(data))
        .catch(() => toast.error("Failed to load insurance details"));
    }
  }, [visible, insuranceId]);

  return (
    <Modal
      title="Health Insurance Details"
      open={visible}
      onCancel={onClose}
      footer={<Button onClick={onClose}>Close</Button>}
    >
      {insurance ? (
        <Descriptions bordered>
          <Descriptions.Item label="User ID">{insurance.userId}</Descriptions.Item>
          <Descriptions.Item label="Insurance Number">{insurance.healthInsuranceNumber || "-"}</Descriptions.Item>
          <Descriptions.Item label="Full Name">{insurance.fullName || "-"}</Descriptions.Item>
          <Descriptions.Item label="Date of Birth">
            {insurance.dateOfBirth ? new Date(insurance.dateOfBirth).toLocaleDateString() : "-"}
          </Descriptions.Item>
          <Descriptions.Item label="Gender">{insurance.gender || "-"}</Descriptions.Item>
          <Descriptions.Item label="Address">{insurance.address || "-"}</Descriptions.Item>
          <Descriptions.Item label="Healthcare Provider">
            {insurance.healthcareProviderName || "-"}
          </Descriptions.Item>
          <Descriptions.Item label="Valid From">
            {insurance.validFrom ? new Date(insurance.validFrom).toLocaleDateString() : "-"}
          </Descriptions.Item>
          <Descriptions.Item label="Valid To">
            {insurance.validTo ? new Date(insurance.validTo).toLocaleDateString() : "-"}
          </Descriptions.Item>
          <Descriptions.Item label="Issue Date">
            {insurance.issueDate ? new Date(insurance.issueDate).toLocaleDateString() : "-"}
          </Descriptions.Item>
          <Descriptions.Item label="Status">{insurance.status}</Descriptions.Item>
          <Descriptions.Item label="Verification Status">
            {insurance.verificationStatus || "-"}
          </Descriptions.Item>
          <Descriptions.Item label="Created At">
            {new Date(insurance.createdAt).toLocaleString()}
          </Descriptions.Item>
        </Descriptions>
      ) : (
        <p>Loading...</p>
      )}
    </Modal>
  );
};

export default ViewHealthInsuranceModal;