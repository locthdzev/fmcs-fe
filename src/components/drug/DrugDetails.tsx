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
import { DrugResponse } from "@/api/drug";

interface DrugDetailsModalProps {
  drug: DrugResponse | null;
  isOpen: boolean;
  onClose: () => void;
}

const statusColorMap: Record<string, any> = {
  Active: "success",
  Inactive: "danger",
};

const DrugDetailsModal: React.FC<DrugDetailsModalProps> = ({
  drug,
  isOpen,
  onClose,
}) => {
  if (!drug) return null;

  return (
    <Modal isOpen={isOpen} onOpenChange={onClose} className="max-w-4xl">
      <ModalContent className="rounded-lg shadow-lg border border-gray-200 bg-white">
        <ModalHeader className="text-xl font-semibold text-gray-800 border-b pb-3">
          Drug Details
        </ModalHeader>
        <ModalBody className="p-6">
          <div className="grid grid-cols-12 gap-6 items-start">
            {/* Hình ảnh thuốc */}
            <div className="col-span-5 flex justify-center">
              <div className="w-48 h-48 rounded-lg overflow-hidden shadow-md border">
                <img
                  src={drug.imageUrl}
                  alt={drug.name}
                  className="w-full h-full object-cover transition-transform duration-300 hover:scale-105"
                />
              </div>
            </div>

            {/* Thông tin thuốc */}
            <div className="col-span-7 space-y-2 text-gray-700">
              <div className="grid grid-cols-2 gap-3">
                <p>
                  <span className="font-semibold text-gray-900">
                    Drug Code:
                  </span>{" "}
                  {drug.drugCode}
                </p>
                <p>
                  <span className="font-semibold text-gray-900">Name:</span>{" "}
                  {drug.name}
                </p>
                <p>
                  <span className="font-semibold text-gray-900">
                    Drug Group:
                  </span>{" "}
                  {drug.drugGroup?.groupName || "-"}
                </p>
                <p>
                  <span className="font-semibold text-gray-900">Unit:</span>{" "}
                  {drug.unit}
                </p>
                <p>
                  <span className="font-semibold text-gray-900">Price:</span>{" "}
                  {drug.price}
                </p>
                <p>
                  <span className="font-semibold text-gray-900">
                    Manufacturer:
                  </span>{" "}
                  {drug.manufacturer || "-"}
                </p>
              </div>

              <div>
                <p className="font-semibold text-gray-900">Description:</p>
                <p className="text-sm text-gray-600 italic">
                  {drug.description || "No description available."}
                </p>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <p>
                  <span className="font-semibold text-gray-900">
                    Created At:
                  </span>{" "}
                  {drug.createdAt
                    ? new Date(drug.createdAt).toLocaleDateString("vi-VN")
                    : "-"}
                </p>
                <p>
                  <span className="font-semibold text-gray-900">
                    Updated At:
                  </span>{" "}
                  {drug.updatedAt
                    ? new Date(drug.updatedAt).toLocaleDateString("vi-VN")
                    : "-"}
                </p>
              </div>

              <div className="flex items-center gap-2">
                <span className="font-semibold text-gray-900">Status:</span>
                <Chip
                  className="capitalize px-2 py-1 text-sm font-medium"
                  color={
                    drug.status && statusColorMap[drug.status]
                      ? statusColorMap[drug.status]
                      : "default"
                  }
                  size="sm"
                  variant="flat"
                >
                  {drug.status}
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

export default DrugDetailsModal;
