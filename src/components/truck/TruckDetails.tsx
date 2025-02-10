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

interface TruckDetailsModalProps {
  truck: TruckResponse | null;
  isOpen: boolean;
  onClose: () => void;
}

const statusColorMap: Record<string, any> = {
  Active: "success",
  Inactive: "danger",
};

const TruckDetailsModal: React.FC<TruckDetailsModalProps> = ({
  truck,
  isOpen,
  onClose,
}) => {
  if (!truck) return null;

  return (
    <Modal isOpen={isOpen} onOpenChange={onClose} className="max-w-4xl">
      <ModalContent className="rounded-lg shadow-lg border border-gray-200 bg-white">
        <ModalHeader className="text-xl font-semibold text-gray-800 border-b pb-3">
          Truck Details
        </ModalHeader>
        <ModalBody className="p-6">
          <div className="grid grid-cols-12 gap-6 items-start">
            {/* Truck Image */}
            <div className="col-span-5 flex justify-center">
              <div className="w-48 h-48 rounded-lg overflow-hidden shadow-md border">
                <img
                  src={truck.truckImage}
                  alt={truck.licensePlate}
                  className="w-full h-full object-cover transition-transform duration-300 hover:scale-105"
                />
              </div>
            </div>

            {/* Truck Information */}
            <div className="col-span-7 space-y-2 text-gray-700">
              <div className="grid grid-cols-2 gap-3">
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
              </div>

              <div>
                <p className="font-semibold text-gray-900">Description:</p>
                <p className="text-sm text-gray-600 italic">
                  {truck.description || "No description available."}
                </p>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <p>
                  <span className="font-semibold text-gray-900">Created At:</span>{" "}
                  {truck.createdAt
                    ? new Date(truck.createdAt).toLocaleDateString("vi-VN")
                    : "-"}
                </p>
                <p>
                  <span className="font-semibold text-gray-900">Updated At:</span>{" "}
                  {truck.updatedAt
                    ? new Date(truck.updatedAt).toLocaleDateString("vi-VN")
                    : "-"}
                </p>
              </div>

              <div className="flex items-center gap-2">
                <span className="font-semibold text-gray-900">Status:</span>
                <Chip
                  className="capitalize px-2 py-1 text-sm font-medium"
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
              </div>
            </div>
          </div>
        </ModalBody>

        {/* Footer */}
        <ModalFooter className="border-t pt-3 flex justify-end">
          <Button variant="ghost" onClick={onClose}>
            Close
          </Button>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
};

export default TruckDetailsModal;
