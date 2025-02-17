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
          <div className="space-y-4 text-gray-700">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {[
                { label: "Order ID", value: order.id },
                { label: "License Plate", value: order.truck?.licensePlate },
                { label: "Truck ID", value: order.truckId },
                {
                  label: "Order Date",
                  value: new Date(order.orderDate).toLocaleDateString("vi-VN"),
                },
                {
                  label: "Created At",
                  value: new Date(order.createdAt).toLocaleDateString("vi-VN"),
                },
                {
                  label: "Updated At",
                  value: order.updatedAt
                    ? new Date(order.updatedAt).toLocaleDateString("vi-VN")
                    : "-",
                },
              ].map((field, index) => (
                <label
                  key={index}
                  className="block overflow-hidden rounded-md border border-gray-200 px-3 py-2 shadow-sm"
                >
                  <span className="text-xs font-medium text-gray-700">
                    {field.label}
                  </span>
                  <div className="mt-1 w-full border-none p-0 sm:text-sm">
                    {field.value}
                  </div>
                </label>
              ))}
            </div>

            <div className="flex items-center gap-2">
              <span className="font-semibold text-gray-900 underline">Status:</span>
              <Chip
                className="capitalize px-2 py-1 text-sm font-medium"
                color={
                  order.status && statusColorMap[order.status]
                    ? statusColorMap[order.status]
                    : "default"
                }
                size="sm"
                variant="flat"
              >
                {order.status}
              </Chip>
            </div>
          </div>
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
