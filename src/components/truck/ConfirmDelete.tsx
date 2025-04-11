import React from "react";
import {
  Modal,
  Button,
  Typography,
  Space
} from "antd";
import { TruckResponse } from "@/api/truck";
import { ExclamationCircleOutlined } from "@ant-design/icons";

const { Text } = Typography;

interface ConfirmDeleteTruckModalProps {
  truck: TruckResponse | null;
  isOpen: boolean;
  onClose: () => void;
  onConfirmDelete: () => void;
}

const ConfirmDeleteTruckModal: React.FC<ConfirmDeleteTruckModalProps> = ({
  truck,
  isOpen,
  onClose,
  onConfirmDelete,
}) => {
  if (!truck) return null;

  return (
    <Modal
      title="Confirm Delete"
      open={isOpen}
      onCancel={onClose}
      footer={[
        <Button key="cancel" onClick={onClose}>
          Cancel
        </Button>,
        <Button key="delete" danger type="primary" onClick={onConfirmDelete}>
          Delete
        </Button>,
      ]}
    >
      <Space direction="vertical" style={{ width: '100%' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px' }}>
          <ExclamationCircleOutlined style={{ color: '#ff4d4f', fontSize: '22px' }} />
          <Text strong>Are you sure you want to delete this truck?</Text>
        </div>
        <Text>License Plate: <Text strong>{truck.licensePlate}</Text></Text>
        {truck.driverName && <Text>Driver: <Text strong>{truck.driverName}</Text></Text>}
        <Text type="warning" style={{ marginTop: '12px' }}>
          This action cannot be undone.
        </Text>
      </Space>
    </Modal>
  );
};

export default ConfirmDeleteTruckModal;
