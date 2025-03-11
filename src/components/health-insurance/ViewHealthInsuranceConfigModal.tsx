import React, { useEffect, useState } from "react";
import { Modal, Descriptions, Button } from "antd";
import { getHealthInsuranceConfig } from "@/api/health-insurance-api";
import { toast } from "react-toastify";

interface ViewHealthInsuranceConfigModalProps {
  visible: boolean;
  onClose: () => void;
}

const ViewHealthInsuranceConfigModal: React.FC<ViewHealthInsuranceConfigModalProps> = ({
  visible,
  onClose,
}) => {
  const [config, setConfig] = useState<any>(null);

  useEffect(() => {
    if (visible) {
      getHealthInsuranceConfig()
        .then((data) => setConfig(data))
        .catch(() => toast.error("Failed to load configuration"));
    }
  }, [visible]);

  return (
    <Modal
      title="View Health Insurance Configuration"
      open={visible}
      onCancel={onClose}
      footer={<Button onClick={onClose}>Close</Button>}
      width={800}
      style={{ fontSize: '16px' }}
    >
      {config ? (
        <Descriptions 
          bordered 
          column={1}
          labelStyle={{ width: '200px', fontSize: '16px' }}
          contentStyle={{ fontSize: '16px' }}
        >
          <Descriptions.Item label="Reminder Interval">{config.reminderInterval} days</Descriptions.Item>
          <Descriptions.Item label="Deadline Days">{config.deadlineDays} days</Descriptions.Item>
          <Descriptions.Item label="Warning Threshold Days">
            {config.warningThresholdDays.join(", ")} days
          </Descriptions.Item>
        </Descriptions>
      ) : (
        <p style={{ fontSize: '16px' }}>Loading...</p>
      )}
    </Modal>
  );
};

export default ViewHealthInsuranceConfigModal;