import React from "react";
import {
  Modal,
  ModalBody,
  ModalContent,
  ModalHeader,
  ModalFooter,
  Button,
} from "@heroui/react";

interface ConfirmModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title?: string;
  message?: string | JSX.Element; // Hỗ trợ JSX để hiển thị văn bản với màu
  confirmText?: string;
  cancelText?: string;
  confirmColor?: "primary" | "danger" | "success" | "warning" | "default"; // Thêm tùy chọn màu cho nút Confirm
}

export const ConfirmModal: React.FC<ConfirmModalProps> = ({
  isOpen,
  onClose,
  onConfirm,
  title = "Confirm Action",
  message = "Are you sure you want to proceed?",
  confirmText = "Confirm",
  cancelText = "Cancel",
  confirmColor = "primary",
}) => {
  return (
    <Modal isOpen={isOpen} onOpenChange={(open) => !open && onClose()}>
      <ModalContent className="max-w-[500px]">
        <ModalHeader className="border-b pb-3">{title}</ModalHeader>
        <ModalBody>
          <p className="text-gray-700">{message}</p>
        </ModalBody>
        <ModalFooter className="border-t pt-4">
          <div className="flex justify-end gap-3">
            <Button type="button" variant="flat" onClick={onClose}>
              {cancelText}
            </Button>
            <Button type="button" color={confirmColor} onClick={onConfirm}>
              {confirmText}
            </Button>
          </div>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
};
