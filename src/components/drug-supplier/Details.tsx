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
import { DrugSupplierResponse } from "@/api/drugsupplier";

interface DrugSupplierDetailsModalProps {
  supplier: DrugSupplierResponse | null;
  isOpen: boolean;
  onClose: () => void;
}

const statusColorMap: Record<string, any> = {
  Active: "success",
  Inactive: "danger",
};

const DrugSupplierDetailsModal: React.FC<DrugSupplierDetailsModalProps> = ({
  supplier,
  isOpen,
  onClose,
}) => {
  if (!supplier) return null;

  return (
    <>
      <Modal isOpen={isOpen} onOpenChange={onClose} className="max-w-4xl">
        <ModalContent className="rounded-lg shadow-lg border border-gray-200 bg-white">
          <ModalHeader className="border-b pb-3 flex justify-between items-center">
            <span>Supplier Details</span>
            <div className="flex items-center">
              <Chip
                className="capitalize px-2 py-1 text-sm font-medium mr-4"
                color={
                  supplier.status && statusColorMap[supplier.status]
                    ? statusColorMap[supplier.status]
                    : "default"
                }
                size="sm"
                variant="flat"
              >
                {supplier.status}
              </Chip>
            </div>
          </ModalHeader>
          <ModalBody className="p-6">
            <div className="grid grid-cols-12 gap-6 items-start">
              {/* Thông tin nhà cung cấp */}
              <div className="col-span-12 space-y-4 text-gray-700">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {[
                    { label: "Supplier Name", value: supplier.supplierName },
                    {
                      label: "Contact Number",
                      value: supplier.contactNumber || "-",
                    },
                    { label: "Email", value: supplier.email || "-" },
                    { label: "Address", value: supplier.address || "-" },
                    {
                      label: "Created At",
                      value: supplier.createdAt
                        ? new Date(supplier.createdAt).toLocaleDateString(
                            "vi-VN"
                          )
                        : "-",
                    },
                    {
                      label: "Updated At",
                      value: supplier.updatedAt
                        ? new Date(supplier.updatedAt).toLocaleDateString(
                            "vi-VN"
                          )
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
              </div>
            </div>
          </ModalBody>
          {/* Footer */}
          <ModalFooter className="border-t pt-3">
            <Button variant="ghost" onClick={onClose}>
              Close
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </>
  );
};

export default DrugSupplierDetailsModal;
