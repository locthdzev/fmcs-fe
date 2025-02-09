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
    <Modal isOpen={isOpen} onOpenChange={onClose} className="max-w-3xl">
      <ModalContent>
        <ModalHeader className="text-xl font-semibold text-gray-800">
          Drug Details
        </ModalHeader>
        <ModalBody>
          <div className="grid grid-cols-12 gap-6 p-4">
            {/* Hình ảnh */}
            {/* <div className="col-span-5 flex items-center justify-center"> cai nay de anh nam ơr giữa */}
            <div className="col-span-5">
              <div className="rounded-lg overflow-hidden shadow-md w-full">
                <img
                  src={drug.imageUrl}
                  alt={drug.name}
                  className="w-full h-64 transition-transform duration-300 hover:scale-105" // them object-cover để giữ tỉ lệ hình ảnh
                />
              </div>
            </div>

            {/* Thông tin */}
            <div className="col-span-7 space-y-3 text-gray-700">
              <p>
                <span className="font-semibold text-gray-900">Drug Code:</span>{" "}
                {drug.drugCode}
              </p>
              <p>
                <span className="font-semibold text-gray-900">Name:</span>{" "}
                {drug.name}
              </p>
              <p>
                <span className="font-semibold text-gray-900">
                  {" "}
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
              <p>
                <span className="font-semibold text-gray-900">
                  Description:
                </span>
              </p>
              <p className="text-sm text-gray-600 italic">
                {drug.description || "No description available."}
              </p>
              <p>
                <span className="font-semibold text-gray-900">Created At:</span>{" "}
                {drug.createdAt
                  ? new Date(drug.createdAt).toLocaleDateString("vi-VN")
                  : "-"}
              </p>
              <p>
                <span className="font-semibold text-gray-900">Updated At:</span>{" "}
                {drug.updatedAt
                  ? new Date(drug.updatedAt).toLocaleDateString("vi-VN")
                  : "-"}
              </p>

              <p>
                <span className="font-semibold text-gray-900">Status:</span>{" "}
                <Chip
                  className="capitalize"
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
              </p>
            </div>
          </div>
        </ModalBody>{" "}
      </ModalContent>
    </Modal>
  );
};
export default DrugDetailsModal;
