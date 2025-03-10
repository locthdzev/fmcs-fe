import React from "react";
import { Modal, Button } from "antd";
import { deleteHealthInsurance } from "@/api/health-insurance-api";
import { toast } from "react-toastify";

interface ConfirmDeleteModalProps {
  visible: boolean;
  insuranceId: string | null;
  onClose: () => void;
  onSuccess: () => void;
}

const ConfirmDeleteModal: React.FC<ConfirmDeleteModalProps> = ({
  visible,
  insuranceId,
  onClose,
  onSuccess,
}) => {
  const handleDelete = async () => {
    try {
      const response = await deleteHealthInsurance(insuranceId!);
      if (response.isSuccess) {
        toast.success("Health insurance deleted successfully!");
        onSuccess();
        onClose();
      } else {
        toast.error(response.message || "Failed to delete health insurance");
      }
    } catch {
      toast.error("An error occurred while deleting health insurance");
    }
  };

  return (
    <Modal
      title="Confirm Deletion"
      open={visible}
      onCancel={onClose}
      footer={[
        <Button key="cancel" onClick={onClose}>
          Cancel
        </Button>,
        <Button key="delete" type="primary" danger onClick={handleDelete}>
          Delete
        </Button>,
      ]}
    >
      <p>Are you sure you want to delete this health insurance record?</p>
    </Modal>
  );
};

export default ConfirmDeleteModal;