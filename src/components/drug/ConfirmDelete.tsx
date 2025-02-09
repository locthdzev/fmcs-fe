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

interface ConfirmDeleteDrugModalProps {
  drug: DrugResponse | null;
  isOpen: boolean;
  onClose: () => void;
  onConfirmDelete: () => void;
}

const statusColorMap: Record<string, any> = {
  Active: "success",
  Inactive: "danger",
};

const ConfirmDeleteDrugModal: React.FC<ConfirmDeleteDrugModalProps> = ({
  drug,
  isOpen,
  onClose,
  onConfirmDelete,
}) => {
  if (!drug) return null;

  return (
    <Modal isOpen={isOpen} onOpenChange={onClose} className="max-w-3xl">
      <ModalContent>
        <ModalHeader className="text-xl font-semibold text-gray-800">
          Confirm Delete
        </ModalHeader>
        <ModalBody>
          <p className="text-gray-700">
            Are you sure you want to delete the following drug?
          </p>
          <div className="grid grid-cols-12 gap-6 p-4">
            {/* Hình ảnh */}
            <div className="col-span-5">
              <div className="rounded-lg overflow-hidden shadow-md w-full">
                <img
                  src={drug.imageUrl}
                  alt={drug.name}
                  className="w-full h-64 transition-transform duration-300 hover:scale-105"
                />
              </div>
            </div>

            {/* Thông tin thuốc */}
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
                <span className="font-semibold text-gray-900">Drug Group:</span>{" "}
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

export default ConfirmDeleteDrugModal;
