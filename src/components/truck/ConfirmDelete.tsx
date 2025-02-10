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
import { TruckResponse } from "@/api/truck";

interface ConfirmDeleteTruckModalProps {
  truck: TruckResponse | null;
  isOpen: boolean;
  onClose: () => void;
  onConfirmDelete: () => void;
}

const statusColorMap: Record<string, any> = {
  Active: "success",
  Inactive: "danger",
};

const ConfirmDeleteTruckModal: React.FC<ConfirmDeleteTruckModalProps> = ({
  truck,
  isOpen,
  onClose,
  onConfirmDelete,
}) => {
  if (!truck) return null;

  return (
    <Modal isOpen={isOpen} onOpenChange={onClose} className="max-w-3xl">
      <ModalContent>
        <ModalHeader className="text-xl font-semibold text-gray-800">
          Confirm Delete
        </ModalHeader>
        <ModalBody>
          <p className="text-gray-700">
            Are you sure you want to delete the following truck?
          </p>
          <div className="grid grid-cols-12 gap-6 p-4">
            {/* Image */}
            <div className="col-span-5">
              <div className="rounded-lg overflow-hidden shadow-md w-full">
                <img
                  src={truck.truckImage}
                  alt={truck.licensePlate}
                  className="w-full h-64 transition-transform duration-300 hover:scale-105"
                />
              </div>
            </div>

            {/* Truck Information */}
            <div className="col-span-7 space-y-3 text-gray-700">
              <p>
                <span className="font-semibold text-gray-900">License Plate:</span>{" "}
                {truck.licensePlate}
              </p>
              <p>
                <span className="font-semibold text-gray-900">Driver Name:</span>{" "}
                {truck.driverName || "-"}
              </p>
              <p>
                <span className="font-semibold text-gray-900">Driver Contact:</span>{" "}
                {truck.driverContact || "-"}
              </p>
              <p>
                <span className="font-semibold text-gray-900">Description:</span>{" "}
                {truck.description || "-"}
              </p>
              <p>
                <span className="font-semibold text-gray-900">Created At:</span>{" "}
                {truck.createdAt
                  ? new Date(truck.createdAt).toLocaleDateString("vi-VN")
                  : "-"}
              </p>
              <p>
                <span className="font-semibold text-gray-900">Status:</span>{" "}
                <Chip
                  className="capitalize"
                  color={
                    truck.status && statusColorMap[truck.status]
                      ? statusColorMap[truck.status]
                      : "default"
                  }
                  size="sm"
                  variant="flat"
                >
                  {truck.status}
                </Chip>
              </p>
            </div>
          </div>
        </ModalBody>
        <ModalFooter>
          <Button variant="flat" onClick={onClose}>
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

export default ConfirmDeleteTruckModal;
