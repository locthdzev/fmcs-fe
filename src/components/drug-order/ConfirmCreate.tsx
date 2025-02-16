import React from "react";
import {
  Modal,
  ModalBody,
  ModalContent,
  ModalHeader,
  ModalFooter,
  Button,
} from "@heroui/react";

interface ConfirmCreateOrderModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
}

export const ConfirmCreateOrder: React.FC<ConfirmCreateOrderModalProps> = ({
  isOpen,
  onClose,
  onConfirm,
}) => {
  return (
    <Modal isOpen={isOpen} onOpenChange={(open) => !open && onClose()}>
      <ModalContent className="max-w-[500px]">
        <ModalHeader className="border-b pb-3">Confirm Order</ModalHeader>
        <ModalBody>
          <p className="text-gray-700 mb-2">
            Please review your order details carefully before proceeding.
          </p>
          <p className="text-gray-600 text-sm">
            Are you sure you want to create this order?
          </p>
        </ModalBody>
        <ModalFooter className="border-t pt-4">
          <div className="flex justify-end gap-3">
            <Button type="button" variant="flat" onClick={onClose}>
              Cancel
            </Button>
            <Button type="button" color="primary" onClick={onConfirm}>
              Confirm
            </Button>
          </div>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
};
