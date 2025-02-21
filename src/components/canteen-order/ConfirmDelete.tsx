import React from "react";
import {
  Modal,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
  Button,
  Chip,
} from "@heroui/react";
import { CanteenOrderResponse } from "@/api/canteenorder";

interface ConfirmDeleteCanteenOrderModalProps {
  order: CanteenOrderResponse | null;
  isOpen: boolean;
  onClose: () => void;
  onConfirmDelete: () => void;
}

const statusColorMap: Record<string, any> = {
  Active: "success",
  Inactive: "danger",
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
    <Modal isOpen={isOpen} onOpenChange={onClose} className="max-w-2xl">
      <ModalContent className="rounded-lg shadow-lg border border-gray-200 bg-white">
        <ModalHeader className="border-b pb-3">
          <span className="text-red-500">Confirm Delete</span>
        </ModalHeader>
        <ModalBody className="p-6">
          <p className="text-gray-700 mb-4">
            Are you sure you want to delete the following canteen order?
          </p>
        </ModalBody>
        <ModalFooter className="border-t pt-3">
          <Button variant="ghost" onClick={onClose}>
            Cancel
          </Button>
          <Button color="danger" onClick={onConfirmDelete}>
            Delete
          </Button>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
};

export default ConfirmDeleteCanteenOrderModal;
