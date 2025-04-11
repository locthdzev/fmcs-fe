import React from "react";
import {
  Modal,
  Button,
  Space,
  Typography,
  Tag
} from "antd";
import { CanteenOrderResponse } from "@/api/canteenorder";

const { Text, Title } = Typography;

interface ConfirmDeleteCanteenOrderModalProps {
  order: CanteenOrderResponse | null;
  isOpen: boolean;
  onClose: () => void;
  onConfirmDelete: () => void;
}

const statusColorMap: Record<string, string> = {
  Active: "success",
  Inactive: "error",
  Cancelled: "warning",
};

const ConfirmDeleteCanteenOrderModal: React.FC<ConfirmDeleteCanteenOrderModalProps> = ({
  order,
  isOpen,
  onClose,
  onConfirmDelete,
}) => {
  if (!order) return null;

  return (
    <Modal
      title={<Text type="danger">Confirm Delete</Text>}
      open={isOpen}
      onCancel={onClose}
      footer={[
        <Button key="cancel" onClick={onClose}>
          Cancel
        </Button>,
        <Button key="delete" danger onClick={onConfirmDelete}>
          Delete
        </Button>
      ]}
      width={600}
    >
      <p className="text-gray-700 mb-4">
        Are you sure you want to delete the following canteen order?
      </p>
    </Modal>
  );
};

export default ConfirmDeleteCanteenOrderModal;
