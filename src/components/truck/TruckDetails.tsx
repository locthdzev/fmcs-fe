import React, { useState } from "react";
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
  const [isImageModalOpen, setIsImageModalOpen] = useState(false);

  if (!truck) return null;

  return (
    <>
      <Modal isOpen={isOpen} onOpenChange={onClose} className="max-w-4xl">
        <ModalContent className="rounded-lg shadow-lg border border-gray-200 bg-white">
          <ModalHeader className="flex justify-between items-center">
            <span>Truck Details</span>
            <div className="flex items-center">
              <Chip
                className="capitalize px-2 py-1 text-sm font-medium mr-4"
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
          </ModalHeader>
          <ModalBody className="p-6">
            <div className="grid grid-cols-12 gap-6 items-start">
              {/* Truck Image */}
              <div className="col-span-5 flex justify-center items-center">
                <img
                  src={truck.truckImage}
                  alt={truck.licensePlate}
                  className="w-64 h-64 object-contain bg-white p-2 transition-transform duration-300 hover:scale-105 cursor-pointer"
                  onClick={() => setIsImageModalOpen(true)}
                />
              </div>

              {/* Truck Information */}
              <div className="col-span-7 space-y-4 text-gray-700">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {[
                    { label: "License Plate", value: truck.licensePlate },
                    { label: "Driver Name", value: truck.driverName || "-" },
                    {
                      label: "Driver Contact",
                      value: truck.driverContact || "-",
                    },
                    {
                      label: "Created At",
                      value: truck.createdAt
                        ? new Date(truck.createdAt).toLocaleDateString("vi-VN")
                        : "-",
                    },
                    {
                      label: "Updated At",
                      value: truck.updatedAt
                        ? new Date(truck.updatedAt).toLocaleDateString("vi-VN")
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

                <label className="block overflow-hidden rounded-md border border-gray-200 px-3 py-2 shadow-sm">
                  <span className="text-xs font-medium text-gray-700">
                    Description
                  </span>
                  <div className="mt-1 w-full border-none p-0 sm:text-sm text-gray-600 italic">
                    {truck.description || "No description available."}
                  </div>
                </label>
              </div>
            </div>
          </ModalBody>

          <ModalFooter className="border-t pt-3">
            <Button variant="ghost" onClick={onClose}>
              Close
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>

      {/* Large Image Modal */}
      <Modal
        isOpen={isImageModalOpen}
        onOpenChange={() => setIsImageModalOpen(false)}
        size="2xl"
      >
        <ModalContent className="bg-white shadow-lg p-4">
          <ModalBody className="flex justify-center items-center p-6">
            <img
              src={truck.truckImage}
              alt={truck.licensePlate}
              className="max-w-full max-h-[80vh] rounded-md object-contain"
            />
          </ModalBody>
        </ModalContent>
      </Modal>
    </>
  );
};

export default TruckDetailsModal;
