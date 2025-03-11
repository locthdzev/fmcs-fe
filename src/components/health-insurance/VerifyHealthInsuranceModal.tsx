import React from "react";
import { Modal, Button, Select } from "antd";
import { HealthInsuranceResponseDTO, verifyHealthInsurance } from "@/api/health-insurance-api";
import { toast } from "react-toastify";

const { Option } = Select;

interface VerifyHealthInsuranceModalProps {
  visible: boolean;
  insurance: HealthInsuranceResponseDTO | null;
  onClose: () => void;
  onSuccess: () => void;
}

const VerifyHealthInsuranceModal: React.FC<VerifyHealthInsuranceModalProps> = ({
  visible,
  insurance,
  onClose,
  onSuccess,
}) => {
  const [verificationStatus, setVerificationStatus] = React.useState<string>("");

  const handleVerify = async () => {
    try {
      const response = await verifyHealthInsurance(insurance!.id, verificationStatus);
      if (response.isSuccess) {
        toast.success(`Health insurance ${verificationStatus.toLowerCase()} successfully!`);
        onSuccess();
        onClose();
      } else {
        toast.error(response.message || "Failed to verify health insurance");
      }
    } catch {
      toast.error("An error occurred while verifying health insurance");
    }
  };

  return (
    <Modal
      title="Verify Health Insurance"
      open={visible}
      onCancel={onClose}
      footer={[
        <Button key="cancel" onClick={onClose}>
          Cancel
        </Button>,
        <Button key="submit" type="primary" onClick={handleVerify} disabled={!verificationStatus}>
          Verify
        </Button>,
      ]}
    >
      <Select
        placeholder="Select Verification Status"
        style={{ width: "100%" }}
        onChange={(value) => setVerificationStatus(value)}
      >
        <Option value="Verified">Verified</Option>
        <Option value="Rejected">Rejected</Option>
      </Select>
    </Modal>
  );
};

export default VerifyHealthInsuranceModal;