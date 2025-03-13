import React from "react";
import { Modal, Button } from "antd";
import { sendHealthInsuranceUpdateRequest } from "@/api/health-insurance-api";
import { toast } from "react-toastify";

interface SendUpdateRequestModalProps {
  visible: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

const SendUpdateRequestModal: React.FC<SendUpdateRequestModalProps> = ({
  visible,
  onClose,
  onSuccess,
}) => {
  const handleSendRequest = async () => {
    try {
      const response = await sendHealthInsuranceUpdateRequest();
      if (response.isSuccess) {
        toast.success(response.message || "Update requests sent successfully!");
        onSuccess();
        onClose();
      } else {
        toast.error(response.message || "Failed to send update requests");
      }
    } catch {
      toast.error("An error occurred while sending update requests");
    }
  };

  return (
    <Modal
      title="Send Update Requests"
      open={visible}
      onCancel={onClose}
      footer={[
        <Button key="cancel" onClick={onClose}>
          Cancel
        </Button>,
        <Button key="submit" type="primary" onClick={handleSendRequest}>
          Send
        </Button>,
      ]}
    >
      <p>Send email notifications to all users with "Pending" health insurance records?</p>
    </Modal>
  );
};

export default SendUpdateRequestModal;