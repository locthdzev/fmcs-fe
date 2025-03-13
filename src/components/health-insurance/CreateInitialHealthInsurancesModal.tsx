import React from "react";
import { Modal, Button } from "antd";
import { createInitialHealthInsurances } from "@/api/health-insurance-api";
import { toast } from "react-toastify";

interface CreateInitialHealthInsurancesModalProps {
  visible: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

const CreateInitialHealthInsurancesModal: React.FC<CreateInitialHealthInsurancesModalProps> = ({
  visible,
  onClose,
  onSuccess,
}) => {
  const handleCreateInitial = async () => {
    try {
      const response = await createInitialHealthInsurances();
      if (response.isSuccess) {
        toast.success(response.message || "Initial health insurances created successfully!");
        onSuccess();
        onClose();
      } else {
        toast.error(response.message || "Failed to create initial health insurances");
      }
    } catch {
      toast.error("An error occurred while creating initial health insurances");
    }
  };

  return (
    <Modal
      title="Create Initial Health Insurances"
      open={visible}
      onCancel={onClose}
      footer={[
        <Button key="cancel" onClick={onClose}>
          Cancel
        </Button>,
        <Button key="submit" type="primary" onClick={handleCreateInitial}>
          Create
        </Button>,
      ]}
    >
      <p>Are you sure you want to create initial "Pending" records for all users without health insurance?</p>
    </Modal>
  );
};

export default CreateInitialHealthInsurancesModal;