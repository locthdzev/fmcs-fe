import React, { useEffect, useState } from "react";
import { Modal, Descriptions, Button, Input } from "antd";
import { getUserInsuranceStatus } from "@/api/health-insurance-api";
import { toast } from "react-toastify";

interface UserInsuranceStatusModalProps {
  visible: boolean;
  onClose: () => void;
}

const UserInsuranceStatusModal: React.FC<UserInsuranceStatusModalProps> = ({
  visible,
  onClose,
}) => {
  const [userId, setUserId] = useState<string>("");
  const [status, setStatus] = useState<any>(null);

  const handleCheckStatus = async () => {
    try {
      const data = await getUserInsuranceStatus(userId);
      setStatus(data);
    } catch {
      toast.error("Failed to load user insurance status");
    }
  };

  return (
    <Modal
      title="Check User Insurance Status"
      open={visible}
      onCancel={onClose}
      footer={<Button onClick={onClose}>Close</Button>}
    >
      <Input
        placeholder="Enter User ID"
        value={userId}
        onChange={(e) => setUserId(e.target.value)}
        style={{ marginBottom: 16 }}
      />
      <Button type="primary" onClick={handleCheckStatus} disabled={!userId}>
        Check
      </Button>
      {status && (
        <Descriptions bordered style={{ marginTop: 16 }}>
          <Descriptions.Item label="Has Insurance">{status.hasInsurance ? "Yes" : "No"}</Descriptions.Item>
          <Descriptions.Item label="Status">{status.status}</Descriptions.Item>
          <Descriptions.Item label="Valid To">
            {status.validTo ? new Date(status.validTo).toLocaleDateString() : "-"}
          </Descriptions.Item>
        </Descriptions>
      )}
    </Modal>
  );
};

export default UserInsuranceStatusModal;