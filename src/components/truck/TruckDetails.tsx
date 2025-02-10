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
    <Modal isOpen={isOpen} onOpenChange={onClose} className="max-w-3xl">
      <ModalContent>
        <ModalHeader className="text-xl font-semibold text-gray-800">
          Truck Details
        </ModalHeader>
        <ModalBody>
          <div className="grid grid-cols-12 gap-6 p-4">
            {/* Hình ảnh */}
            <div className="col-span-5">
              <div className="rounded-lg overflow-hidden shadow-md w-full">
                <img
                  src={truck.truckImage}
                  alt={truck.licensePlate}
                  className="w-full h-64 transition-transform duration-300 hover:scale-105" // Thêm object-cover để giữ tỉ lệ hình ảnh
                />
              </div>
            </div>

            {/* Thông tin */}
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
                <span className="font-semibold text-gray-900">Description:</span>
              </p>
              <p className="text-sm text-gray-600 italic">
                {truck.description || "No description available."}
              </p>
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
      </ModalContent>
    </Modal>
  );
};

export default TruckDetailsModal;
