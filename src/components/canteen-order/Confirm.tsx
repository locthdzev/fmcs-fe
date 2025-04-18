import React from "react";
import { Modal, Button, Space } from "antd";

interface ConfirmModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title?: string;
  message?: string;
  confirmText?: string;
  cancelText?: string;
}

export const ConfirmModal: React.FC<ConfirmModalProps> = ({
  isOpen,
  onClose,
  onConfirm,
  title = "Confirm Action",
  message = "Are you sure you want to proceed?",
  confirmText = "Confirm",
  cancelText = "Cancel",
}) => {
  return (
    <Modal
      title={title}
      open={isOpen}
      onCancel={onClose}
      footer={[
        <Button key="cancel" onClick={onClose}>
          {cancelText}
        </Button>,
        <Button key="confirm" type="primary" onClick={onConfirm}>
          {confirmText}
        </Button>
      ]}
    >
      <p className="text-gray-700">{message}</p>
    </Modal>
  );
};
